// ──────────────────────────────────────────────────
// SPACE EXPLORER — Constants & Configuration
// ──────────────────────────────────────────────────

/** XP required per level */
export const LEVEL_XP = 500;

/** XP awards for reading */
export const XP_PER_PAGE = 10;
export const XP_MILESTONE_25 = 75;
export const XP_MILESTONE_50 = 100;
export const XP_MILESTONE_75 = 150;
export const XP_COMPLETE = 300;
export const XP_BOSS_WIN = 150;
export const XP_BOSS_CONTINUE_COST = 50;

/** Title cards — unlock conditions checked in order */
export const TITLE_CARDS: { id: string; name: string; emoji: string; condition: string; check: (p: any) => boolean }[] = [
    { id: 'space_cadet', name: 'Space Cadet', emoji: '🚀', condition: 'Default', check: () => true },
    { id: 'star_navigator', name: 'Star Navigator', emoji: '⭐', condition: 'Reach Level 5', check: (p) => (p.level || 1) >= 5 },
    { id: 'galaxy_explorer', name: 'Galaxy Explorer', emoji: '🌌', condition: 'Complete 3 documents', check: () => false }, // checked via study_history
    { id: 'boss_slayer', name: 'Boss Slayer', emoji: '⚔️', condition: 'Win 5 Boss Battles', check: (p) => (p.boss_wins || 0) >= 5 },
    { id: 'the_unstoppable', name: 'The Unstoppable', emoji: '🔥', condition: '7-day streak', check: (p) => (p.streak_days || 0) >= 7 },
    { id: 'night_scholar', name: 'Night Scholar', emoji: '🌙', condition: 'Complete doc 10PM–2AM', check: () => false }, // checked at completion time
    { id: 'galaxy_commander', name: 'Galaxy Commander', emoji: '🏆', condition: 'Reach Level 10', check: (p) => (p.level || 1) >= 10 },
    { id: 'season_winner', name: 'The Champion', emoji: '👑', condition: 'Win a weekly season', check: () => false },
];

/** Profile themes */
export const PROFILE_THEMES: { id: string; name: string; condition: string; colors: [string, string] }[] = [
    { id: 'default', name: 'Deep Space', condition: 'Default', colors: ['#0a0a1a', '#1b1b2f'] },
    { id: 'nebula_purple', name: 'Nebula Purple', condition: 'Reach Level 3', colors: ['#1a0a2e', '#2d1b69'] },
    { id: 'solar_flare', name: 'Solar Flare Orange', condition: 'Win a Boss Battle', colors: ['#1a0f00', '#ea580c'] },
    { id: 'deep_space', name: 'Deep Space Black', condition: 'Reach Level 7', colors: ['#000000', '#0a0a1a'] },
    { id: 'aurora_green', name: 'Aurora Green', condition: '5-day streak', colors: ['#001a0a', '#00d68f'] },
    { id: 'champion_gold', name: 'Champion Gold', condition: 'Win a season', colors: ['#1a1400', '#fbbf24'] },
];

/** Rare animated badges (space-themed, added to the main BADGES array) */
export const SPACE_BADGES = [
    { id: 'cosmic_reader', name: '💫 Cosmic Reader', desc: 'Complete 5 documents', icon: 'auto_awesome', animated: true },
    { id: 'meteor_student', name: '☄️ Meteor Student', desc: 'Earn 500 XP in a single day', icon: 'bolt', animated: true },
    { id: 'supernova', name: '🌟 Supernova', desc: 'Win 3 friend battles', icon: 'star', animated: true },
    { id: 'first_contact', name: '🛸 First Contact', desc: 'Challenge a friend for the first time', icon: 'group', animated: true },
    { id: 'planet_collector', name: '🪐 Planet Collector', desc: 'Complete 10 documents', icon: 'public', animated: true },
    { id: 'boss_slayer_badge', name: '⚔️ Boss Slayer', desc: 'Defeat a boss battle', icon: 'shield', animated: true },
];

/** Hash a string to a consistent hue (0-360) for planet colors */
export function titleToHue(title: string): number {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
        hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 360;
}

/** Generate planet gradient from title */
export function getPlanetGradient(title: string): string {
    const hue = titleToHue(title);
    return `linear-gradient(135deg, hsl(${hue}, 70%, 45%), hsl(${(hue + 40) % 360}, 60%, 30%))`;
}

/** Get title card for a given level/profile */
export function getActiveTitle(profile: any): string {
    if (profile?.active_title) return profile.active_title;
    const level = profile?.level || 1;
    if (level >= 10) return '🏆 Galaxy Commander';
    if (level >= 5) return '⭐ Star Navigator';
    return '🚀 Space Cadet';
}

/** Format seconds to mm:ss */
export function formatTime(secs: number): string {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
}

/** Generate CSS starfield using box-shadows (memoize this) */
export function generateStars(count: number): string {
    const stars: string[] = [];
    for (let i = 0; i < count; i++) {
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const size = Math.random() * 1.5 + 0.5;
        const opacity = Math.random() * 0.7 + 0.3;
        stars.push(`${x}vw ${y}vh 0 ${size}px rgba(255,255,255,${opacity})`);
    }
    return stars.join(',');
}
