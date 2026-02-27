const fs = require('fs');

function fixFile(file, fixFn) {
    let content = fs.readFileSync(file, 'utf8');
    content = fixFn(content);
    fs.writeFileSync(file, content);
}

// 6. resources
fixFile('c:\\server\\forge\\app\\resources\\page.tsx', (content) => {
    let lines = content.split(/\r?\n/);
    while (lines[lines.length - 1] === '') lines.pop();
    lines.pop();
    lines.push('      </div>');
    lines.push('    </div>');
    lines.push('  );');
    lines.push('}');
    lines.push('');
    return lines.join('\n');
});
console.log("Fixed resources page!");
