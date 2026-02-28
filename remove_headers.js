const fs = require('fs');
const path = require('path');

const files = [
    'settings/page.tsx',
    'resources/page.tsx',
    'profile/page.tsx',
    'past-questions/page.tsx',
    'leaderboard/page.tsx',
    'history/page.tsx',
    'generator/page.tsx',
    'flashcards/page.tsx',
    'exam-ready/page.tsx',
    'dashboard/page.tsx',
    'activity/page.tsx'
].map(f => path.join(__dirname, 'app', f));

let updatedCount = 0;

files.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        // We recreate the regex so lastIndex is 0
        const headerRegex = /<header className="h-16[^>]*md:hidden"[^>]*>[\s\S]*?<\/header>\n?/g;

        if (content.match(headerRegex)) {
            content = content.replace(headerRegex, '');
            fs.writeFileSync(file, content, 'utf8');
            updatedCount++;
        }
    }
});

console.log(`Mobile headers removed from ${updatedCount} files.`);
