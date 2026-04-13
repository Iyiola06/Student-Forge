'use client';

import useSWR from 'swr';
import type { WalletSummary } from '@/lib/billing/types';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to load wallet');
  }

  return data as WalletSummary;
};

export function useWallet() {
  const { data, error, isLoading, mutate } = useSWR('/api/billing/wallet', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  return {
    wallet: data,
    isLoading,
    error: error?.message ?? null,
    mutate,
  };
}
