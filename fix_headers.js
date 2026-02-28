const fs = require('fs');

const files = [
    'c:/server/forge/app/resources/page.tsx',
    'c:/server/forge/app/past-questions/page.tsx',
    'c:/server/forge/app/generator/page.tsx',
    'c:/server/forge/app/flashcards/page.tsx',
    'c:/server/forge/app/exam-ready/page.tsx',
    'c:/server/forge/app/leaderboard/page.tsx',
    'c:/server/forge/app/history/page.tsx',
    'c:/server/forge/app/activity/page.tsx'
];

files.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');

        // Fix the StudyForge mobile header 
        content = content.replace(/<h1 className="font-bold text-white">StudyForge<\/h1>/g, '<h1 className="font-bold text-slate-900 dark:text-white">StudyForge</h1>');

        // Fix the Processing Document upload toast
        content = content.replace(/<p className="text-sm font-bold text-white">Processing Document<\/p>/g, '<p className="text-sm font-bold text-slate-900 dark:text-white">Processing Document</p>');

        // Fix H1 headers that missed the conversion 
        content = content.replace(/<h1 className="text-3xl font-black text-white">/g, '<h1 className="text-3xl font-black text-slate-900 dark:text-white">');
        content = content.replace(/<h1 className="text-2xl font-bold text-white">/g, '<h1 className="text-2xl font-bold text-slate-900 dark:text-white">');

        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated mobile headers in: ${file}`);
    }
});
