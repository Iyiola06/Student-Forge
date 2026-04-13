--========================================================================
-- Credit billing, signup bonuses, and Paystack purchase tracking
--========================================================================

alter table public.profiles
  add column if not exists credit_balance integer not null default 0,
  add column if not exists next_credit_expiry timestamp with time zone,
  add column if not exists has_received_signup_bonus boolean not null default false;

create table if not exists public.credit_grants (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source text not null check (source in ('signup_bonus', 'paystack_purchase', 'admin_adjustment')),
  credits_awarded integer not null check (credits_awarded > 0),
  credits_remaining integer not null check (credits_remaining >= 0),
  expires_at timestamp with time zone not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

create index if not exists credit_grants_user_id_idx
  on public.credit_grants (user_id, expires_at, created_at);

create table if not exists public.credit_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  grant_id uuid references public.credit_grants(id) on delete set null,
  transaction_type text not null check (transaction_type in ('credit', 'debit')),
  source text not null,
  amount integer not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

create index if not exists credit_transactions_user_id_idx
  on public.credit_transactions (user_id, created_at desc);

create table if not exists public.paystack_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reference text not null unique,
  access_code text,
  bundle_id text,
  status text not null default 'initialized',
  amount_paid integer,
  currency text not null default 'NGN',
  gateway_response text,
  customer_email text,
  paid_at timestamp with time zone,
  raw_response jsonb not null default '{}'::jsonb,
  credit_grant_id uuid references public.credit_grants(id) on delete set null,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

create index if not exists paystack_transactions_user_id_idx
  on public.paystack_transactions (user_id, created_at desc);

alter table public.credit_grants enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.paystack_transactions enable row level security;

create policy "Users can read own credit grants"
  on public.credit_grants for select
  using (auth.uid() = user_id);

create policy "Users can read own credit transactions"
  on public.credit_transactions for select
  using (auth.uid() = user_id);

create policy "Users can read own paystack transactions"
  on public.paystack_transactions for select
  using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists credit_grants_set_updated_at on public.credit_grants;
create trigger credit_grants_set_updated_at
  before update on public.credit_grants
  for each row execute procedure public.set_updated_at();

drop trigger if exists paystack_transactions_set_updated_at on public.paystack_transactions;
create trigger paystack_transactions_set_updated_at
  before update on public.paystack_transactions
  for each row execute procedure public.set_updated_at();

create or replace function public.refresh_profile_credit_balance(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  balance_total integer;
  next_expiry timestamp with time zone;
begin
  select
    coalesce(sum(credits_remaining), 0),
    min(expires_at)
  into balance_total, next_expiry
  from public.credit_grants
  where user_id = target_user_id
    and credits_remaining > 0
    and expires_at > timezone('utc'::text, now());

  update public.profiles
  set credit_balance = coalesce(balance_total, 0),
      next_credit_expiry = next_expiry,
      updated_at = timezone('utc'::text, now())
  where id = target_user_id;
end;
$$;

create or replace function public.grant_credit_lot(
  target_user_id uuid,
  granted_credits integer,
  grant_source text,
  grant_expires_at timestamp with time zone,
  grant_metadata jsonb default '{}'::jsonb,
  grant_description text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_grant_id uuid;
begin
  if granted_credits <= 0 then
    raise exception 'granted_credits must be positive';
  end if;

  insert into public.credit_grants (
    user_id,
    source,
    credits_awarded,
    credits_remaining,
    expires_at,
    metadata
  ) values (
    target_user_id,
    grant_source,
    granted_credits,
    granted_credits,
    grant_expires_at,
    coalesce(grant_metadata, '{}'::jsonb)
  )
  returning id into new_grant_id;

  insert into public.credit_transactions (
    user_id,
    grant_id,
    transaction_type,
    source,
    amount,
    description,
    metadata
  ) values (
    target_user_id,
    new_grant_id,
    'credit',
    grant_source,
    granted_credits,
    coalesce(grant_description, initcap(replace(grant_source, '_', ' '))),
    coalesce(grant_metadata, '{}'::jsonb)
  );

  perform public.refresh_profile_credit_balance(target_user_id);

  return new_grant_id;
end;
$$;

create or replace function public.grant_signup_credits_if_missing(target_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  already_granted boolean;
begin
  select has_received_signup_bonus
  into already_granted
  from public.profiles
  where id = target_user_id
  for update;

  if already_granted then
    return false;
  end if;

  perform public.grant_credit_lot(
    target_user_id,
    1000,
    'signup_bonus',
    timezone('utc'::text, now()) + interval '6 months',
    jsonb_build_object('grant_kind', 'signup_bonus'),
    'Welcome bonus'
  );

  update public.profiles
  set has_received_signup_bonus = true,
      updated_at = timezone('utc'::text, now())
  where id = target_user_id;

  perform public.refresh_profile_credit_balance(target_user_id);

  return true;
end;
$$;

create or replace function public.consume_user_credits(
  target_user_id uuid,
  requested_credits integer,
  usage_source text,
  usage_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  available_credits integer;
  grant_row record;
  remaining_to_consume integer;
  debit_amount integer;
  consumption_events jsonb := '[]'::jsonb;
begin
  if requested_credits <= 0 then
    raise exception 'requested_credits must be positive';
  end if;

  perform 1
  from public.profiles
  where id = target_user_id
  for update;

  select coalesce(sum(credits_remaining), 0)
  into available_credits
  from public.credit_grants
  where user_id = target_user_id
    and credits_remaining > 0
    and expires_at > timezone('utc'::text, now());

  if available_credits < requested_credits then
    return jsonb_build_object(
      'success', false,
      'requested', requested_credits,
      'available', available_credits
    );
  end if;

  remaining_to_consume := requested_credits;

  for grant_row in
    select id, credits_remaining, expires_at
    from public.credit_grants
    where user_id = target_user_id
      and credits_remaining > 0
      and expires_at > timezone('utc'::text, now())
    order by expires_at asc, created_at asc
    for update
  loop
    exit when remaining_to_consume <= 0;

    debit_amount := least(remaining_to_consume, grant_row.credits_remaining);

    update public.credit_grants
    set credits_remaining = credits_remaining - debit_amount
    where id = grant_row.id;

    insert into public.credit_transactions (
      user_id,
      grant_id,
      transaction_type,
      source,
      amount,
      description,
      metadata
    ) values (
      target_user_id,
      grant_row.id,
      'debit',
      usage_source,
      -debit_amount,
      concat('Credit spend for ', usage_source),
      coalesce(usage_metadata, '{}'::jsonb) || jsonb_build_object('expires_at', grant_row.expires_at)
    );

    consumption_events := consumption_events || jsonb_build_object(
      'grant_id', grant_row.id,
      'amount', debit_amount,
      'expires_at', grant_row.expires_at
    );

    remaining_to_consume := remaining_to_consume - debit_amount;
  end loop;

  perform public.refresh_profile_credit_balance(target_user_id);

  return jsonb_build_object(
    'success', true,
    'requested', requested_credits,
    'consumed', requested_credits,
    'events', consumption_events
  );
end;
$$;

create or replace function public.finalize_paystack_credit_purchase(
  target_user_id uuid,
  payment_reference text,
  selected_bundle_id text,
  amount_paid_kobo integer,
  credits_purchased integer,
  payment_status text,
  payment_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_tx public.paystack_transactions%rowtype;
  granted_credit_id uuid;
begin
  select *
  into existing_tx
  from public.paystack_transactions
  where reference = payment_reference
  for update;

  if not found then
    insert into public.paystack_transactions (
      user_id,
      reference,
      bundle_id,
      status,
      amount_paid,
      raw_response
    ) values (
      target_user_id,
      payment_reference,
      selected_bundle_id,
      payment_status,
      amount_paid_kobo,
      coalesce(payment_metadata, '{}'::jsonb)
    )
    returning * into existing_tx;
  else
    update public.paystack_transactions
    set user_id = target_user_id,
        bundle_id = coalesce(selected_bundle_id, existing_tx.bundle_id),
        status = payment_status,
        amount_paid = coalesce(amount_paid_kobo, existing_tx.amount_paid),
        raw_response = coalesce(payment_metadata, '{}'::jsonb),
        paid_at = case when payment_status = 'success' then coalesce((payment_metadata->>'paid_at')::timestamp with time zone, timezone('utc'::text, now())) else existing_tx.paid_at end
    where id = existing_tx.id
    returning * into existing_tx;
  end if;

  if payment_status <> 'success' then
    return existing_tx.credit_grant_id;
  end if;

  if existing_tx.credit_grant_id is not null then
    return existing_tx.credit_grant_id;
  end if;

  granted_credit_id := public.grant_credit_lot(
    target_user_id,
    credits_purchased,
    'paystack_purchase',
    timezone('utc'::text, now()) + interval '6 months',
    coalesce(payment_metadata, '{}'::jsonb) || jsonb_build_object(
      'reference', payment_reference,
      'bundle_id', selected_bundle_id,
      'amount_paid_kobo', amount_paid_kobo
    ),
    'Paystack credit purchase'
  );

  update public.paystack_transactions
  set credit_grant_id = granted_credit_id,
      paid_at = coalesce((payment_metadata->>'paid_at')::timestamp with time zone, timezone('utc'::text, now())),
      updated_at = timezone('utc'::text, now())
  where id = existing_tx.id;

  return granted_credit_id;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  perform public.grant_signup_credits_if_missing(new.id);
  return new;
end;
$$;

grant execute on function public.refresh_profile_credit_balance(uuid) to authenticated, anon;
grant execute on function public.grant_signup_credits_if_missing(uuid) to authenticated, anon;
grant execute on function public.consume_user_credits(uuid, integer, text, jsonb) to authenticated;
grant execute on function public.finalize_paystack_credit_purchase(uuid, text, text, integer, integer, text, jsonb) to authenticated, anon;

-- Backfill existing users exactly once.
do $$
declare
  profile_row record;
begin
  for profile_row in
    select id
    from public.profiles
    where has_received_signup_bonus = false
  loop
    perform public.grant_signup_credits_if_missing(profile_row.id);
  end loop;
end
$$;
