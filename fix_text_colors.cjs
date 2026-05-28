const fs = require('fs');

const filesToCheck = [
    'src/pages/worker-detail.tsx',
    'src/pages/dashboard.tsx',
    'src/App.tsx',
    'src/pages/login.tsx'
];

filesToCheck.forEach(filepath => {
    try {
        let content = fs.readFileSync(filepath, 'utf8');
        
        // Find <input, <select, <textarea tags
        const newContent = content.replace(/<(input|select|textarea)[^>]+>/g, (match) => {
            if (match.includes('className="')) {
                if (!match.includes('text-slate-900')) {
                    return match.replace('className="', 'className="text-slate-900 ');
                }
            }
            return match;
        });
        
        fs.writeFileSync(filepath, newContent, 'utf8');
        console.log(`Processed ${filepath}`);
    } catch (e) {
        console.log(`Failed ${filepath}:`, e.message);
    }
});
