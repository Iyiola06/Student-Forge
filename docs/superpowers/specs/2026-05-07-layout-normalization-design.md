---
name: Layout Normalization & UI Structure Cleanup
description: Migration of custom pages (Past Questions, Leaderboard) into the shared AppShell layout to resolve responsive overlapping issues and standardize icon alignment.
type: project
---

# Design Specification: Layout Normalization

**Date:** 2026-05-07
**Topic:** AppShell Layout Normalization

## 1. Goal
The primary goal is to resolve unstable responsive behavior (especially on tablets) by unifying the layout structure of high-traffic custom pages under the shared `AppShell` component. This will eliminate duplicate sidebars, fix horizontal overflow, and ensure a consistent user experience. Additionally, all visual icons will be perfectly centered within their respective containers.

## 2. Scope
- **Primary Files:**
    - `app/past-questions/page.tsx`
    - `app/leaderboard/page.tsx`
- **Secondary Cleanup:**
    - Ensure icon containers in the above files follow the alignment standard.

## 3. Architecture & Structural Changes

### 3.1 Migration to AppShell
We will replace the manual layout containers and duplicate `<Sidebar />` components with the standard `<AppShell>` component.

- **Past Questions Migration:**
    - Remove the outer `div` with `min-h-screen` and `flex-row`.
    - Remove the manual `<Sidebar />` inclusion.
    - Wrap the content in `<AppShell>`.
    - Map the following props:
        - `title`: "Community Past Questions Bank"
        - `description`: "Study smarter with past questions shared by students like you."
        - `actions`: The "Submit Past Question" button.
    - Keep the "Stats Pills" and "Tabs" as the first children within the shell's body.

- **Leaderboard Migration:**
    - Remove the outer `div` with cosmic background and custom flex layout.
    - Remove the manual `<Sidebar />` inclusion.
    - Wrap the content in `<AppShell>`.
    - Map the following props:
        - `title`: "Leaderboard"
        - `description`: "Study progress across the platform"
        - `actions`: The "Lvl / XP" badge component.
    - Contain the "Cosmic" starfield background strictly within the page body area to avoid bleeding into the shared navigation.

### 3.2 Responsive Fluidity
- Convert any fixed-width containers (like `max-w-[1440px]`) within these pages to use relative max-widths and fluid grids (e.g., `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`).
- Ensure the "Podium" in the leaderboard adjusts gracefully for mobile by stacking vertically instead of forcing horizontal space.

## 4. Visual Standards: Icon Alignment
A global audit of icon containers (`div`s wrapping Material Symbols or custom SVGs) will be performed in the affected files.

- **Standard:** Every icon container must use `flex items-center justify-center`.
- **Target Areas:**
    - Stats pill icon boxes in `past-questions`.
    - Ranking badges and podium icon slots in `leaderboard`.
    - Download/Upvote action buttons.

## 5. Next Steps (Decomposition)
To keep the project focused and avoid "boiling the ocean" in a single implementation plan, we are splitting the work:
1. **Phase 1 (This Spec):** Structural layout cleanup and icon alignment for `past-questions` and `leaderboard`.
2. **Phase 2 (Future):** Global Light/Dark mode audit and sweep, including the landing page and theme provider normalization.

---
*Created with superpower:brainstorming*
