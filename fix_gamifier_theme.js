const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'app', 'gamifier', 'page.tsx');
let content = fs.readFileSync(file, 'utf8');

const replacements = [
    // Backgrounds
    { regex: /className="([^"]*)bg-\[\#101022\]([^"]*)"/g, replacement: 'className="$1bg-[#f5f5f8] dark:bg-[#101022]$2"' },
    { regex: /className="([^"]*)bg-\[\#1b1b27\]([^"]*)"/g, replacement: 'className="$1bg-white dark:bg-[#1b1b27]$2"' },
    { regex: /className="([^"]*)bg-\[\#252535\]([^"]*)"/g, replacement: 'className="$1bg-slate-100 dark:bg-[#252535]$2"' },
    { regex: /className="([^"]*)bg-\[\#141423\]([^"]*)"/g, replacement: 'className="$1bg-white dark:bg-[#141423]$2"' },
    { regex: /className="([^"]*)bg-\[\#0c0c16\]([^"]*)"/g, replacement: 'className="$1bg-slate-200/50 dark:bg-[#0c0c16]$2"' },

    // Borders
    { regex: /className="([^"]*)border-\[\#2d2d3f\]([^"]*)"/g, replacement: 'className="$1border-slate-200 dark:border-[#2d2d3f]$2"' },
    { regex: /className="([^"]*)border-\[\#3b3b54\]([^"]*)"/g, replacement: 'className="$1border-slate-300 dark:border-[#3b3b54]$2"' },
    { regex: /className="([^"]*)border-\[\#1b1b27\]([^"]*)"/g, replacement: 'className="$1border-slate-200 dark:border-[#1b1b27]$2"' },
    { regex: /className="([^"]*)border-\[\#141423\]([^"]*)"/g, replacement: 'className="$1border-white dark:border-[#141423]$2"' },

    // Text
    { regex: /className="([^"]*)text-white([^"]*)"/g, replacement: 'className="$1text-slate-900 dark:text-white$2"' },
    { regex: /className="([^"]*)text-slate-400([^"]*)"/g, replacement: 'className="$1text-slate-500 dark:text-slate-400$2"' },
    { regex: /className="([^"]*)text-slate-300([^"]*)"/g, replacement: 'className="$1text-slate-600 dark:text-slate-300$2"' },

    // Hover Backgrounds
    { regex: /className="([^"]*)hover:bg-\[\#252535\]([^"]*)"/g, replacement: 'className="$1hover:bg-slate-200 dark:hover:bg-[#252535]$2"' },
    { regex: /className="([^"]*)hover:bg-\[\#2d2d3f\]([^"]*)"/g, replacement: 'className="$1hover:bg-slate-200 dark:hover:bg-[#2d2d3f]$2"' },

    // Cleanup duplicates that might have been created by overlapping matches
    { regex: /text-slate-900 dark:text-slate-900 dark:text-white/g, replacement: 'text-slate-900 dark:text-white' },
    { regex: /bg-\[#f5f5f8\] dark:bg-\[#f5f5f8\] dark:bg-\[#101022\]/g, replacement: 'bg-[#f5f5f8] dark:bg-[#101022]' }
];

replacements.forEach(({ regex, replacement }) => {
    content = content.replace(regex, replacement);
});

// A few manual touchups
// Line 675 logic (loading screen)
content = content.replace(/min-h-screen bg-\[\#101022\]/, 'min-h-screen bg-[#f5f5f8] dark:bg-[#101022]');

fs.writeFileSync(file, content, 'utf8');
console.log('Gamifier theme fixed.');
