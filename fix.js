const fs = require('fs');

function fixFile(file, fixFn) {
    let content = fs.readFileSync(file, 'utf8');
    content = fixFn(content);
    fs.writeFileSync(file, content);
}

// 1. Dashboard
fixFile('c:\\server\\forge\\app\\dashboard\\page.tsx', (content) => {
    let lines = content.split(/\r?\n/);
    if (lines[20].includes('</div>')) {
        lines.splice(20, 1);
    }
    while (lines[lines.length - 1] === '') lines.pop();
    lines.pop(); // remove </div>
    lines.push('      </div>');
    lines.push('    </div>');
    lines.push('  );');
    lines.push('}');
    lines.push('');
    return lines.join('\n');
});

// 2. exam-ready
fixFile('c:\\server\\forge\\app\\exam-ready\\page.tsx', (content) => {
    let lines = content.split(/\r?\n/);
    while (lines[lines.length - 1] === '') lines.pop();
    lines.pop();
    lines.push('        </div>');
    lines.push('    </div>');
    lines.push('  );');
    lines.push('}');
    lines.push('');
    return lines.join('\n');
});

// 3. history
fixFile('c:\\server\\forge\\app\\history\\page.tsx', (content) => {
    let lines = content.split(/\r?\n/);
    if (lines[185].includes('</div>')) {
        lines.splice(185, 1);
    }
    while (lines[lines.length - 1] === '') lines.pop();
    lines.pop();
    lines.push('    </div>');
    lines.push('  );');
    lines.push('}');
    lines.push('');
    return lines.join('\n');
});

// 4. leaderboard
fixFile('c:\\server\\forge\\app\\leaderboard\\page.tsx', (content) => {
    let lines = content.split(/\r?\n/);
    if (lines[188].includes('</div>')) {
        lines.splice(188, 1);
    }
    while (lines[lines.length - 1] === '') lines.pop();
    lines.pop();
    lines.push('    </div>');
    lines.push('  );');
    lines.push('}');
    lines.push('');
    return lines.join('\n');
});

// 5. profile
fixFile('c:\\server\\forge\\app\\profile\\page.tsx', (content) => {
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
console.log("Fixed files!");
