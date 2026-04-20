import { redirect } from 'next/navigation';

type DuplicateBillingCallbackPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DuplicateBillingCallbackPage({
  searchParams,
}: DuplicateBillingCallbackPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (Array.isArray(value)) {
      for (const entry of value) {
        query.append(key, entry);
      }
      continue;
    }

    if (typeof value === 'string') {
      query.set(key, value);
    }
  }

  const suffix = query.toString();
  redirect(suffix ? `/billing/callback?${suffix}` : '/billing/callback');
}
