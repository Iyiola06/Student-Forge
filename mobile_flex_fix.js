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

        // The main issue: the root `flex` layout expects the Sidebar and Content Container to sit side-by-side horizontally. 
        // Since the Sidebar now contains a full-width block header on mobile, this pushes 100vw content out bounds.
        // The fix: `flex-col md:flex-row`
        const oldFlexStart = /flex antialiased /g;
        const newFlexStart = 'flex flex-col md:flex-row antialiased ';

        // Some lines strictly had `min-h-screen flex antialiased`
        const exactRegex = /min-h-screen flex antialiased/g;

        if (exactRegex.test(content)) {
            content = content.replace(exactRegex, 'min-h-screen flex flex-col md:flex-row antialiased');
            fs.writeFileSync(file, content, 'utf8');
            updatedCount++;
        }
    }
});

console.log(`Flex row logic updated on ${updatedCount} files.`);
