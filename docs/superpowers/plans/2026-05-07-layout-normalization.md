# Layout Normalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify the `past-questions` and `leaderboard` custom screens under the shared `AppShell` component to fix responsive overlapping issues and standardize icon alignment.

**Architecture:** We are refactoring existing Next.js page components. We will remove duplicate `<Sidebar />` components and bespoke layout wrappers, replacing them with `<AppShell>`. High-density content (stats, podiums) will be adjusted to use fluid grids within the shell's `children` area. All icon containers will be updated to enforce `flex items-center justify-center`.

**Tech Stack:** Next.js (App Router), React, Tailwind CSS

---

### Task 1: Migrate Past Questions Page to AppShell

**Files:**
- Modify: `app/past-questions/page.tsx`

- [ ] **Step 1: Update imports and remove Sidebar**
Modify `app/past-questions/page.tsx` to import `AppShell` and remove `Sidebar`.

```tsx
// Find:
import Sidebar from '@/components/layout/Sidebar';
// Replace with:
import AppShell from '@/components/layout/AppShell';
```

- [ ] **Step 2: Replace outer wrappers with AppShell**
Locate the main return block of `PastQuestionsContent`.

```tsx
// Find:
  return (
    <div className="bg-[#f5f5f8] dark:bg-[#101022] font-display min-h-screen flex flex-col lg:flex-row antialiased selection:bg-[#1a5c2a]/30 selection:text-[#1a5c2a]">
      <Sidebar />
      <div className="relative flex min-h-screen w-full max-w-[100vw] flex-1 flex-col pb-28 lg:h-screen lg:overflow-hidden lg:pb-0">

        <main className="flex flex-1 flex-col overflow-y-auto">
          {/* Header Area */}
          <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-8 sm:px-6 lg:px-8 xl:px-10 dark:border-[#2d2d3f] dark:bg-[#1a1a24]">
            <div className="max-w-[1440px] mx-auto w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                    Community Past Questions Bank
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400">
                    Study smarter with past questions shared by students like you.
                  </p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="bg-[#3b82f6] hover:bg-[#2563eb] text-slate-900 dark:text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 whitespace-nowrap shrink-0">
                  <span className="material-symbols-outlined text-[20px]">add</span>
                  Submit Past Question
                </button>
              </div>

// Replace with:
  const SubmitButton = (
    <button onClick={() => setIsModalOpen(true)} className="bg-[#3b82f6] hover:bg-[#2563eb] text-slate-900 dark:text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 whitespace-nowrap shrink-0">
      <span className="material-symbols-outlined text-[20px]">add</span>
      Submit Past Question
    </button>
  );

  return (
    <AppShell
      title="Community Past Questions Bank"
      description="Study smarter with past questions shared by students like you."
      actions={SubmitButton}
    >
      <div className="flex flex-col gap-6 w-full">
        <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="mt-8">
```

- [ ] **Step 3: Close AppShell wrappers properly**
Locate the end of the `main` tag and replace it to close the new structure.

```tsx
// Find:
        </main>

        {/* Submission Modal */}
// Replace with:
        </div>
      </div>

      {/* Submission Modal */}
```

And locate the end of the component to close `AppShell` instead of the old `div`s.

```tsx
// Find:
      </div>
    </div>
  );
// Replace with:
    </AppShell>
  );
```

- [ ] **Step 4: Fix Tabs border**
Remove the bottom border from the tabs container since it's no longer attached to a header edge.

```tsx
// Find:
              {/* Tabs */}
              <div className="flex border-b border-slate-200 dark:border-[#2d2d3f]">
// Replace with:
              {/* Tabs */}
              <div className="flex mb-4">
```

- [ ] **Step 5: Verify build**
Run: `npm run build`
Expected: Build succeeds without type errors.

- [ ] **Step 6: Commit**
```bash
git add app/past-questions/page.tsx
git commit -m "refactor(ui): migrate past-questions to AppShell"
```

### Task 2: Refactor Past Questions Stats Grid and Icon Alignment

**Files:**
- Modify: `app/past-questions/page.tsx`

- [ ] **Step 1: Make Stats grid fluid**
Locate the stats pills section and update the wrapper to use a fluid grid.

```tsx
// Find:
              {/* Stats Pills */}
              <div className="flex flex-wrap gap-4 mb-8">
                <div className="bg-[#f5f5f8] dark:bg-[#13131a] border border-slate-200 dark:border-[#2d2d3f] px-5 py-3 rounded-xl flex items-center gap-4 min-w-[160px]">
// Replace with:
              {/* Stats Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 w-full">
                <div className="bg-[#f5f5f8] dark:bg-[#13131a] border border-slate-200 dark:border-[#2d2d3f] px-5 py-3 rounded-xl flex items-center gap-4">
```

And remove `min-w-[160px]` from the other two stats pills.

```tsx
// Find:
                <div className="bg-[#f5f5f8] dark:bg-[#13131a] border border-slate-200 dark:border-[#2d2d3f] px-5 py-3 rounded-xl flex items-center gap-4 min-w-[160px]">
// Replace with:
                <div className="bg-[#f5f5f8] dark:bg-[#13131a] border border-slate-200 dark:border-[#2d2d3f] px-5 py-3 rounded-xl flex items-center gap-4">
```

- [ ] **Step 2: Center Stat icons**
Ensure the icon wrappers inside the stats pills use `flex items-center justify-center`.

```tsx
// Find:
                  <div className="bg-blue-500/10 text-blue-400 p-2 rounded-lg">
                    <span className="material-symbols-outlined">description</span>
                  </div>
// Replace with:
                  <div className="bg-blue-500/10 text-blue-400 p-2 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined">description</span>
                  </div>

// Find:
                  <div className="bg-[#1a5c2a]/10 text-orange-400 p-2 rounded-lg">
                    <span className="material-symbols-outlined">account_balance</span>
                  </div>
// Replace with:
                  <div className="bg-[#1a5c2a]/10 text-orange-400 p-2 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined">account_balance</span>
                  </div>

// Find:
                  <div className="bg-purple-500/10 text-purple-400 p-2 rounded-lg">
                    <span className="material-symbols-outlined">menu_book</span>
                  </div>
// Replace with:
                  <div className="bg-purple-500/10 text-purple-400 p-2 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined">menu_book</span>
                  </div>
```

- [ ] **Step 3: Verify build**
Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**
```bash
git add app/past-questions/page.tsx
git commit -m "fix(ui): make past-questions stats fluid and center icons"
```

### Task 3: Migrate Leaderboard Page to AppShell

**Files:**
- Modify: `app/leaderboard/page.tsx`

- [ ] **Step 1: Update imports and remove Sidebar**
Modify `app/leaderboard/page.tsx` to import `AppShell` and remove `Sidebar`.

```tsx
// Find:
import Sidebar from '@/components/layout/Sidebar';
// Replace with:
import AppShell from '@/components/layout/AppShell';
```

- [ ] **Step 2: Define Actions Component**
Extract the Level/XP badge into a variable to pass as actions.

```tsx
// Find:
  return (
    <div className="bg-[#050510] font-display min-h-screen flex flex-col lg:flex-row antialiased relative overflow-hidden">
// Replace with:
  const HeaderActions = (
    <div className="flex items-center gap-3 bg-[#101022]/60 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-[#2d2d3f] shadow-2xl">
      <span className="material-symbols-outlined text-[#1a5c2a]">military_tech</span>
      <span className="text-sm font-black text-white">Lvl {profile?.level || 1}</span>
      <div className="w-px h-6 bg-[#2d2d3f]"></div>
      <span className="text-sm font-black text-[#38bdf8]">{(profile?.xp || 0).toLocaleString()} <span className="text-[10px] text-slate-500">FUEL</span></span>
    </div>
  );

  return (
    <AppShell
      title="Leaderboard"
      description="Study progress across the platform"
      actions={HeaderActions}
      contentClassName="bg-[#050510] relative rounded-[24px] overflow-hidden -mt-6"
    >
      {/* Background Starfield scoped to content */}
      <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 100px rgba(0,0,0,0.5)', background: `radial-gradient(circle at center, #1e1b4b 0%, #050510 100%)` }}>
        <div className="stars-container absolute inset-0 opacity-40" style={{ boxShadow: '0 0 1px #fff, 0 0 2px #fff' }}></div>
      </div>
```

- [ ] **Step 3: Clean up outer wrappers**
Remove the old outer wrappers and header elements since `AppShell` handles them.

```tsx
// Find:
    <div className="bg-[#050510] font-display min-h-screen flex flex-col lg:flex-row antialiased relative overflow-hidden">
      {/* Background Starfield */}
      <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 100px rgba(0,0,0,0.5)', background: `radial-gradient(circle at center, #1e1b4b 0%, #050510 100%)` }}>
        <div className="stars-container absolute inset-0 opacity-40" style={{ boxShadow: '0 0 1px #fff, 0 0 2px #fff' }}></div>
      </div>

      <Sidebar />
      <div className="relative z-10 flex min-h-screen flex-1 flex-col pb-28 lg:pb-0">
        {/* Main Content */}
        <div className="flex-1 flex flex-col w-full max-w-[1440px] mx-auto">
          <div className="flex flex-col gap-4 px-4 pb-4 pt-8 sm:px-6 md:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12">
            <div>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter">
                Leaderboard
              </h1>
              <p className="text-[9px] md:text-[10px] font-black text-[#1a5c2a] uppercase tracking-[0.3em] md:tracking-[0.5em] mt-1">Study progress across the platform</p>
            </div>

            <div className="hidden lg:flex items-center gap-4">
              <div className="flex items-center gap-3 bg-[#101022]/60 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-[#2d2d3f] shadow-2xl">
                <span className="material-symbols-outlined text-[#1a5c2a]">military_tech</span>
                <span className="text-sm font-black text-white">Lvl {profile?.level || 1}</span>
                <div className="w-px h-6 bg-[#2d2d3f]"></div>
                <span className="text-sm font-black text-[#38bdf8]">{(profile?.xp || 0).toLocaleString()} <span className="text-[10px] text-slate-500">FUEL</span></span>
              </div>
            </div>
          </div>

          {/* Leaderboard Content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8 relative z-10">
// Replace with:
      {/* Leaderboard Content */}
      <div className="p-4 sm:p-6 md:p-8 relative z-10">
        <div className="max-w-4xl mx-auto space-y-8">
```
*(Note: ensure the old code removal is clean. The replacement starts right after the newly inserted AppShell and Background Starfield from Step 2.)*

- [ ] **Step 4: Close AppShell**
Locate the end of the component and close `AppShell`.

```tsx
// Find:
            </div>
          </main>
        </div>
      </div>
    </div>
  );
// Replace with:
        </div>
      </div>
    </AppShell>
  );
```

- [ ] **Step 5: Verify build**
Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 6: Commit**
```bash
git add app/leaderboard/page.tsx
git commit -m "refactor(ui): migrate leaderboard to AppShell"
```

### Task 4: Center Leaderboard Icons

**Files:**
- Modify: `app/leaderboard/page.tsx`

- [ ] **Step 1: Center Galaxy Core icon**
Ensure the icon wrapper in the leaderboard list header uses `flex items-center justify-center`.

```tsx
// Find:
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-[#1a5c2a]/10 border border-[#1a5c2a]/30 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[#1a5c2a]">rocket_launch</span>
                        </div>
// Replace with: (Already correct, but verify it exists. Just a no-op if it matches)
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-[#1a5c2a]/10 border border-[#1a5c2a]/30 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[#1a5c2a]">rocket_launch</span>
                        </div>
```

- [ ] **Step 2: Center Crown icon**
Locate the Crown icon wrapper for rank 1 and enforce centering.

```tsx
// Find:
                            {/* Crown/Apex Ring */}
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
                              <span className="material-symbols-outlined text-6xl text-yellow-500 animate-pulse drop-shadow-[0_0_15px_rgba(234,179,8,0.6)]">workspace_premium</span>
                            </div>
// Replace with:
                            {/* Crown/Apex Ring */}
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center">
                              <span className="material-symbols-outlined text-6xl text-yellow-500 animate-pulse drop-shadow-[0_0_15px_rgba(234,179,8,0.6)]">workspace_premium</span>
                            </div>
```

- [ ] **Step 3: Center No Signals icon**
Locate the empty state search icon and wrap/enforce centering if needed.

```tsx
// Find:
                        <div className="p-20 text-center text-slate-500">
                          <span className="material-symbols-outlined text-5xl mb-4 text-[#2d2d3f]">search_off</span>
                          <p className="text-xs font-black uppercase tracking-[0.3em]">No Cosmic Signals Detected</p>
                        </div>
// Replace with:
                        <div className="p-20 text-center text-slate-500 flex flex-col items-center justify-center">
                          <span className="material-symbols-outlined text-5xl mb-4 text-[#2d2d3f]">search_off</span>
                          <p className="text-xs font-black uppercase tracking-[0.3em]">No Cosmic Signals Detected</p>
                        </div>
```

- [ ] **Step 4: Verify build**
Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**
```bash
git add app/leaderboard/page.tsx
git commit -m "fix(ui): ensure leaderboard icons are perfectly centered"
```
