const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const SUPABASE_URL = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const SUPABASE_SERVICE_KEY = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function run() {
    const { data: d1, error: e1 } = await supabase.rpc('exec_sql', {
        sql: `
      create table if not exists public.reading_progress (
        id uuid primary key default uuid_generate_v4(),
        user_id uuid references public.profiles(id) on delete cascade not null,
        resource_id uuid references public.resources(id) on delete cascade not null,
        last_page integer default 1,
        completion_percentage integer default 0,
        updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
        unique (user_id, resource_id)
      );
      
      alter table public.reading_progress enable row level security;
      
      create policy "Users can manage own reading progress"
        on public.reading_progress for all
        using ( auth.uid() = user_id );
        
      -- Add badges column to profiles if it doesn't exist
      alter table public.profiles add column if not exists badges jsonb default '[]'::jsonb;
    `
    });

    if (e1) {
        console.error("RPC exec_sql probably doesn't exist, we will try another way or assume the user will do it.");
        console.error(e1);
    } else {
        console.log("Migration successful");
    }
}

run();
