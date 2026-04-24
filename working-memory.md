# Problem Summary
- The app has inconsistent responsive behavior across core screens. Tablet widths are especially unstable, with sidebars, headers, fixed-width panels, and fixed-height content fighting each other.

# Product Goal
- Make the experience feel intentional and usable from large desktop down to mobile without horizontal overflow, clipped panels, or broken content hierarchy.

# Stack And Runtime Assumptions
- Next.js App Router app with React 19 and Tailwind CSS 4.
- Shared app layout is driven by `components/layout/AppShell.tsx`, `components/layout/Sidebar.tsx`, and global utilities in `app/globals.css`.

# Confirmed Facts
- Most authenticated product screens use `AppShell`.
- Several high-traffic screens still use custom full-page layouts and duplicate sidebar behavior, notably `past-questions` and `leaderboard`.
- Responsive problems are caused by a mix of shared-shell breakpoints and page-level fixed widths/heights.

# Unknowns That Still Need Confirmation
- Which individual routes still need extra page-specific fixes after the shared shell cleanup.
- Whether any responsive regressions appear only at runtime after real data loads.

# Active Files
- `app/globals.css`
- `components/layout/AppShell.tsx`
- `components/layout/Sidebar.tsx`
- `components/app/AppPageHeader.tsx`
- `components/auth/AuthShell.tsx`
- `app/ai-tutor/page.tsx`
- `app/resources/page.tsx`
- `app/essay-grader/page.tsx`
- `app/flashcards/page.tsx`
- `app/exam-ready/page.tsx`
- `app/past-questions/page.tsx`
- `app/leaderboard/page.tsx`

# Decisions And Tradeoffs
- Prefer shared breakpoint fixes first, then patch custom screens that bypass those shared surfaces.
- Favor fluid widths and viewport-aware minimum heights over large fixed pixel dimensions.

# UI System Decisions
- Keep the existing visual language, but normalize layout behavior across mobile, tablet, and desktop.
- Push persistent desktop sidebar behavior to larger breakpoints so tablets stay in the mobile navigation model.

# Bugs Fixed
- None yet.

# Remaining Risks
- Highly custom gamified screens may still need a second pass if they use isolated layout patterns.

# Next Actions
- Update shared shell and navigation breakpoints.
- Patch page-level fixed widths/heights on major screens.
- Run lint and browser spot checks across representative routes.
