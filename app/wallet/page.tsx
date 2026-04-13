'use client';

import { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useProfile } from '@/hooks/useProfile';
import { useWallet } from '@/hooks/useWallet';
import { formatNairaFromKobo, getCreditBundles } from '@/lib/billing/config';

export default function WalletPage() {
  const { profile } = useProfile();
  const { wallet, mutate } = useWallet();
  const bundles = getCreditBundles().slice(0, 3);
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [referralMessage, setReferralMessage] = useState<string | null>(null);

  const handleBuyCredits = async (bundleId: string) => {
    const response = await fetch('/api/billing/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bundleId }),
    });

    const data = await response.json();
    if (response.ok && data.authorizationUrl) {
      window.location.href = data.authorizationUrl;
    }
  };

  const handleRedeemReferral = async () => {
    setReferralMessage(null);

    const response = await fetch('/api/billing/referral/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: referralCodeInput.trim() }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setReferralMessage(payload.error || 'Failed to redeem referral code');
      return;
    }

    setReferralMessage(payload.redemption?.suspicious ? 'Referral submitted for review.' : 'Referral applied successfully.');
    setReferralCodeInput('');
    mutate();
  };

  const sidebar = (
    <section className="glass-panel app-panel-tight">
      <p className="eyebrow">Wallet Signals</p>
      <div className="mt-4 app-list">
        <div className="app-list-row">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Balance</p>
            <p className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-950 dark:text-white">
              {wallet?.balance ?? profile?.credit_balance ?? 0}
            </p>
          </div>
        </div>
        <div className="app-list-row">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Next expiry</p>
            <p className="mt-2 text-sm font-black text-slate-950 dark:text-white">
              {wallet?.nextExpiry || profile?.next_credit_expiry
                ? new Date((wallet?.nextExpiry || profile?.next_credit_expiry) as string).toLocaleDateString()
                : 'No active expiry'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <AppShell
      eyebrow="Wallet"
      title="Credits and trust"
      sidebar={sidebar}
      actions={
        <button
          onClick={() => mutate()}
          className="inline-flex h-10 items-center justify-center rounded-2xl border border-black/8 bg-white/60 px-4 text-sm font-black text-slate-950 transition hover:border-[#1a5c2a]/30 dark:border-white/10 dark:bg-white/5 dark:text-white"
        >
          Refresh
        </button>
      }
    >
      <section className="glass-panel-strong app-panel text-white">
        <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <div>
            <p className="eyebrow !text-emerald-200/75">Balance</p>
            <h2 className="mt-2 text-[clamp(2rem,4vw,3.4rem)] font-black tracking-[-0.06em]">
              {(wallet?.balance ?? profile?.credit_balance ?? 0).toLocaleString()} credits
            </h2>
            <p className="mt-3 max-w-[44ch] text-sm leading-6 text-white/72">
              Keep daily review free. Use credits only when you want premium generation or advanced extraction.
            </p>
          </div>

          <div className="app-list border-white/10 bg-white/6">
            {bundles.map((bundle) => (
              <div key={bundle.id} className="app-list-row items-center">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-white">{bundle.name}</p>
                  <p className="mt-1 text-xs text-white/65">
                    {bundle.credits.toLocaleString()} credits / {bundle.tagline}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-white">{formatNairaFromKobo(bundle.amountKobo)}</span>
                  <button
                    onClick={() => handleBuyCredits(bundle.id)}
                    className="inline-flex h-9 items-center justify-center rounded-xl bg-white px-3 text-xs font-black text-slate-950 transition hover:bg-white/90"
                  >
                    Buy
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <section className="glass-panel app-panel">
          <p className="eyebrow">Upcoming Expiry Lots</p>
          <h3 className="panel-title mt-2">Credit lots</h3>
          <div className="mt-4">
            {wallet?.grants?.length ? (
              <div className="app-list">
                {wallet.grants.map((grant) => (
                  <div key={grant.id} className="app-list-row">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-slate-950 dark:text-white">{grant.credits_remaining} credits left</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {grant.source.replace(/_/g, ' ')} / expires {new Date(grant.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="metric-chip !px-2 !py-1 !text-[10px]">{grant.credits_awarded} issued</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="app-empty">Credit lots will appear here after signup bonus or top-up.</div>
            )}
          </div>
        </section>

        <section className="glass-panel app-panel">
          <p className="eyebrow">Referral</p>
          <h3 className="panel-title mt-2">Invite friends, earn credits</h3>

          <div className="mt-4 rounded-[20px] border border-black/5 bg-white/55 px-4 py-4 dark:border-white/8 dark:bg-white/5">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Your code</p>
            <p className="mt-2 text-base font-black text-slate-950 dark:text-white">{wallet?.referralCode || 'Generating...'}</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Approved referrals grant 200 credits and flagged cases stay in operator review until cleared.
            </p>
          </div>

          <div className="mt-4 flex gap-3">
            <input
              value={referralCodeInput}
              onChange={(event) => setReferralCodeInput(event.target.value.toUpperCase())}
              className="min-w-0 flex-1 rounded-2xl border border-black/5 bg-white/60 px-4 py-2.5 text-sm outline-none dark:border-white/8 dark:bg-white/5"
              placeholder="Enter referral code"
            />
            <button
              onClick={handleRedeemReferral}
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-[#102117] px-4 text-sm font-black text-white transition hover:bg-[#163623]"
            >
              Redeem
            </button>
          </div>

          {referralMessage ? <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{referralMessage}</p> : null}

          <div className="mt-4">
            {wallet?.referralRedemptions?.length ? (
              <div className="app-list">
                {wallet.referralRedemptions.map((referral) => (
                  <div key={referral.id} className="app-list-row">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black capitalize text-slate-950 dark:text-white">{referral.status}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{new Date(referral.created_at).toLocaleString()}</p>
                    </div>
                    <span className="metric-chip !px-2 !py-1 !text-[10px]">{referral.suspicious ? 'flagged' : 'clean'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="app-empty">Referral activity will appear here once codes are redeemed.</div>
            )}
          </div>
        </section>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <section className="glass-panel app-panel">
          <p className="eyebrow">Ledger</p>
          <h3 className="panel-title mt-2">Recent activity</h3>
          <div className="mt-4">
            {wallet?.events?.length ? (
              <div className="app-list">
                {wallet.events.map((tx) => (
                  <div key={tx.id} className="app-list-row">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-slate-950 dark:text-white">{tx.event_type.replace(/_/g, ' ')}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {new Date(tx.created_at).toLocaleString()}
                        {tx.model_name ? ` / ${tx.model_name}` : ''}
                      </p>
                      {(tx.input_size || tx.output_size || tx.estimated_provider_cost) ? (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {tx.input_size ? `${tx.input_size} input chars` : 'No input size'} / {tx.output_size ?? 0} output items / est. cost {tx.estimated_provider_cost}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={
                        tx.amount < 0
                          ? 'text-sm font-black text-amber-600 dark:text-amber-300'
                          : 'text-sm font-black text-emerald-600 dark:text-emerald-300'
                      }
                    >
                      {tx.amount > 0 ? '+' : ''}
                      {tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="app-empty">Your wallet ledger will appear after usage, grants, or purchases.</div>
            )}
          </div>
        </section>

        <section className="glass-panel app-panel">
          <p className="eyebrow">Lifecycle</p>
          <h3 className="panel-title mt-2">Wallet notifications</h3>
          <div className="mt-4">
            {wallet?.notifications?.length ? (
              <div className="app-list">
                {wallet.notifications.map((notification) => (
                  <div key={notification.id} className="app-list-row">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-slate-950 dark:text-white">
                        {notification.notification_type.replace(/_/g, ' ')}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="app-empty">Purchase confirmations, low-balance alerts, and expiry warnings will appear here.</div>
            )}
          </div>
        </section>
      </section>
    </AppShell>
  );
}
