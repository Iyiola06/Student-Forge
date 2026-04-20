'use client';

import Link from 'next/link';
import BrandLogo from '@/components/ui/BrandLogo';

const sections = [
  ['Acceptance', "By using Sulva’s Studify you agree to these terms and to the service behavior described in the product."],
  ['Service scope', 'The platform provides document ingestion, AI-assisted study generation, review workflows, and wallet-based premium actions.'],
  ['User responsibilities', 'You are responsible for keeping your account secure and for only uploading content you have the right to use.'],
  ['Credits and payments', 'Credits are used for premium AI actions. Top-ups and grants follow the product rules in your wallet and may expire by lot.'],
  ['Availability', 'We may update or suspend parts of the service when needed for maintenance, reliability, or security.'],
  ['Liability', 'The service is provided as available. We do not guarantee uninterrupted access or academic outcomes.'],
];

export default function TermsOfServicePage() {
  return (
    <div className="main-bg min-h-screen text-slate-950 dark:text-white">
      <header className="mx-auto flex w-full max-w-[980px] items-center justify-between px-4 py-5 md:px-6">
        <BrandLogo />
        <Link href="/signup" className="primary-button">
          Get started
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-[980px] flex-col gap-5 px-4 pb-16 md:px-6">
        <section className="glass-panel app-panel">
          <p className="eyebrow">Terms</p>
          <h1 className="mt-2 text-[25px] leading-[1.05] font-black tracking-[-0.05em] text-slate-950 dark:text-white">Terms of service</h1>
          <p className="mt-2 text-[14px] leading-6 text-slate-500 dark:text-slate-400">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </section>

        <section className="glass-panel app-panel">
          <div className="app-list">
            {sections.map(([title, body]) => (
              <div key={title} className="app-list-row">
                <div className="min-w-0 flex-1">
                  <h2 className="text-[18px] font-black tracking-[-0.03em] text-slate-950 dark:text-white">{title}</h2>
                  <p className="mt-2 text-[14px] leading-7 text-slate-600 dark:text-slate-300">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel app-panel">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-[14px] leading-6 text-slate-600 dark:text-slate-300">If you have questions about these terms, contact support from inside the app.</p>
            <Link href="/login" className="secondary-button">
              Back to login
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
