'use client';

import { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useProfile } from '@/hooks/useProfile';
import { useWallet } from '@/hooks/useWallet';
import { formatNairaFromKobo, getCreditBundles } from '@/lib/billing/config';

export default function WalletPage() {
  const { profile } = useProfile();
  const { wallet, error, mutate } = useWallet();
  const bundles = getCreditBundles().slice(0, 3);
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [referralMessage, setReferralMessage] = useState<string | null>(null);
  const [walletMessage, setWalletMessage] = useState<string | null>(null);

  const handleBuyCredits = async (bundleId: string) => {
    setWalletMessage(null);

    const response = await fetch('/api/billing/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bundleId }),
    });

    const data = await response.json();
    if (!response.ok) {
      setWalletMessage(data.error || 'Wallet top-ups are temporarily unavailable.');
      return;
    }

    if (data.authorizationUrl) {
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

  const balance = wallet?.balance ?? profile?.credit_balance ?? 0;
  const nextExpiry = wallet?.nextExpiry || profile?.next_credit_expiry;

  return (
    <AppShell
      eyebrow="Wallet"
      title="Credits and billing"
      actions={
        <button onClick={() => mutate()} className="secondary-button">
          Refresh
        </button>
      }
    >
      <div className="workspace-stack">
        {error ? <div className="app-empty">{error}</div> : null}
        {walletMessage ? <div className="app-empty">{walletMessage}</div> : null}

        <section className="metric-strip">
          <div className="glass-panel app-panel-tight">
            <p className="eyebrow">Balance</p>
            <p className="mt-2 text-[25px] font-black tracking-[-0.05em] text-slate-950 dark:text-white">{balance}</p>
            <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">Credits are used only for premium AI actions.</p>
          </div>
          <div className="glass-panel app-panel-tight">
            <p className="eyebrow">Next expiry</p>
            <p className="mt-2 text-[25px] font-black tracking-[-0.05em] text-slate-950 dark:text-white">
              {nextExpiry ? new Date(nextExpiry).toLocaleDateString() : 'None'}
            </p>
            <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">Unused grants and top-ups expire by lot.</p>
          </div>
          <div className="glass-panel app-panel-tight">
            <p className="eyebrow">Referral code</p>
            <p className="mt-2 text-[25px] font-black tracking-[-0.05em] text-slate-950 dark:text-white">{wallet?.referralCode || 'Pending'}</p>
            <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">Invite a friend and earn approved bonus credits.</p>
          </div>
          <div className="glass-panel app-panel-tight">
            <p className="eyebrow">Notifications</p>
            <p className="mt-2 text-[25px] font-black tracking-[-0.05em] text-slate-950 dark:text-white">{wallet?.notifications?.length ?? 0}</p>
            <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">Purchase, low-balance, and expiry updates live here.</p>
          </div>
        </section>

        <section className="glass-panel app-panel">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Public bundles</p>
              <h2 className="panel-title mt-2">Top up with one of three plans</h2>
            </div>
          </div>

          <div className="mt-4 app-list">
            {bundles.map((bundle) => (
              <div key={bundle.id} className="app-list-row items-center">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-slate-950 dark:text-white">{bundle.name}</p>
                  <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
                    {bundle.credits.toLocaleString()} credits • {bundle.tagline}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-slate-950 dark:text-white">{formatNairaFromKobo(bundle.amountKobo)}</span>
                  <button onClick={() => handleBuyCredits(bundle.id)} className="primary-button !h-9 !rounded-xl !px-3">
                    Buy
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.94fr_1.06fr]">
          <section className="glass-panel app-panel">
            <p className="eyebrow">Referral</p>
            <h2 className="panel-title mt-2">Invite friends, earn credits</h2>

            <div className="mt-4 rounded-[18px] border border-black/6 bg-white/58 px-4 py-4 dark:border-white/8 dark:bg-white/5">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Your code</p>
              <p className="mt-2 text-base font-black text-slate-950 dark:text-white">{wallet?.referralCode || 'Generating...'}</p>
              <p className="mt-2 text-[13px] text-slate-500 dark:text-slate-400">
                Approved referrals grant 200 credits. Flagged redemptions stay in operator review until cleared.
              </p>
            </div>

            <div className="mt-4 flex gap-3">
              <input
                value={referralCodeInput}
                onChange={(event) => setReferralCodeInput(event.target.value.toUpperCase())}
                className="min-w-0 flex-1 rounded-2xl border border-black/8 bg-white/70 px-4 py-2.5 text-sm outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                placeholder="Enter referral code"
              />
              <button onClick={handleRedeemReferral} className="primary-button">
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
                        <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">{new Date(referral.created_at).toLocaleString()}</p>
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

          <section className="glass-panel app-panel">
            <p className="eyebrow">Credit lots</p>
            <h2 className="panel-title mt-2">Upcoming expiry lots</h2>

            <div className="mt-4">
              {wallet?.grants?.length ? (
                <div className="app-list">
                  {wallet.grants.map((grant) => (
                    <div key={grant.id} className="app-list-row">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-slate-950 dark:text-white">{grant.credits_remaining} credits left</p>
                        <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
                          {grant.source.replace(/_/g, ' ')} • expires {new Date(grant.expires_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="metric-chip !px-2 !py-1 !text-[10px]">{grant.credits_awarded} issued</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="app-empty">Credit lots will appear after signup bonus or a successful top-up.</div>
              )}
            </div>
          </section>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <section className="glass-panel app-panel">
            <p className="eyebrow">Ledger</p>
            <h2 className="panel-title mt-2">Recent activity</h2>
            <div className="mt-4">
              {wallet?.events?.length ? (
                <div className="app-list">
                  {wallet.events.map((tx) => (
                    <div key={tx.id} className="app-list-row">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-slate-950 dark:text-white">{tx.event_type.replace(/_/g, ' ')}</p>
                        <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
                          {new Date(tx.created_at).toLocaleString()}
                          {tx.model_name ? ` • ${tx.model_name}` : ''}
                        </p>
                      </div>
                      <span className={tx.amount < 0 ? 'text-sm font-black text-amber-600 dark:text-amber-300' : 'text-sm font-black text-emerald-600 dark:text-emerald-300'}>
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
            <h2 className="panel-title mt-2">Wallet notifications</h2>
            <div className="mt-4">
              {wallet?.notifications?.length ? (
                <div className="app-list">
                  {wallet.notifications.map((notification) => (
                    <div key={notification.id} className="app-list-row">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-slate-950 dark:text-white">{notification.notification_type.replace(/_/g, ' ')}</p>
                        <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">{new Date(notification.created_at).toLocaleString()}</p>
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
      </div>
    </AppShell>
  );
}
