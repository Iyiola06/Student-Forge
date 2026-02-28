const fs = require('fs');

const files = [
    'c:/server/forge/app/resources/page.tsx',
    'c:/server/forge/app/past-questions/page.tsx',
    'c:/server/forge/app/generator/page.tsx',
    'c:/server/forge/app/flashcards/page.tsx',
    'c:/server/forge/app/exam-ready/page.tsx',
    'c:/server/forge/app/leaderboard/page.tsx',
    'c:/server/forge/app/history/page.tsx'
];

files.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');

        const originalContent = content;

        // Backgrounds
        content = content.replace(/(?<!dark:)bg-\[\#13131a\]/g, 'bg-[#f5f5f8] dark:bg-[#13131a]');
        content = content.replace(/(?<!dark:)bg-\[\#1a1a24\]/g, 'bg-white dark:bg-[#1a1a24]');
        content = content.replace(/(?<!dark:)bg-\[\#252535\]/g, 'bg-slate-100 dark:bg-[#252535]');
        content = content.replace(/(?<!dark:)bg-\[\#1e1e2d\]/g, 'bg-white dark:bg-[#1e1e2d]');

        // Borders
        content = content.replace(/(?<!dark:)border-\[\#2d2d3f\]/g, 'border-slate-200 dark:border-[#2d2d3f]');
        content = content.replace(/(?<!dark:)border-\[\#3b3b54\]/g, 'border-slate-300 dark:border-[#3b3b54]');

        // Text Colors
        content = content.replace(/(?<!dark:|hover:)text-white/g, 'text-slate-900 dark:text-white');
        content = content.replace(/(?<!dark:|hover:)text-slate-400/g, 'text-slate-500 dark:text-slate-400');
        content = content.replace(/(?<!dark:|hover:)text-slate-300/g, 'text-slate-600 dark:text-slate-300');
        content = content.replace(/(?<!dark:)placeholder:text-slate-500/g, 'placeholder:text-slate-400 dark:placeholder:text-slate-500');

        // Fixes for buttons where we actually want white text (e.g., orange buttons)
        // Revert text-slate-900 back to text-white inside buttons with bg-[#ea580c] or text-white was meant to stay white
        content = content.replace(/bg-\[\#ea580c\]([^]*?)text-slate-900 dark:text-white/g, 'bg-[#ea580c]$1text-white');
        content = content.replace(/bg-purple-600([^]*?)text-slate-900 dark:text-white/g, 'bg-purple-600$1text-white');

        // Minor fixes for specific icons or elements that got caught
        content = content.replace(/text-slate-900 dark:text-white/g, (match, offset, string) => {
            const surrounding = string.substring(Math.max(0, offset - 30), Math.min(string.length, offset + 30));
            if (surrounding.includes('bg-[#ea580c]') || surrounding.includes('bg-purple-') || surrounding.includes('bg-blue-')) {
                return 'text-white';
            }
            return match;
        });

        if (content !== originalContent) {
            fs.writeFileSync(file, content, 'utf8');
            console.log(`Updated theme classes in: ${file}`);
        } else {
            console.log(`No changes needed for: ${file}`);
        }
    } else {
        console.log(`File not found: ${file}`);
    }
});
