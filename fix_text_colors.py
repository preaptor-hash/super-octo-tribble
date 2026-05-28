import os
import re

files_to_check = [
    'src/pages/worker-detail.tsx',
    'src/pages/dashboard.tsx',
    'src/App.tsx'
]

for filepath in files_to_check:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We will use a regular expression to find <input, <select, <textarea tags
    # and add text-slate-900 to their className if it's not there.
    
    def replacer(match):
        tag = match.group(0)
        if 'className=\"' in tag:
            # Check if text-slate-900 is already there
            if 'text-slate-900' not in tag:
                tag = tag.replace('className=\"', 'className=\"text-slate-900 ')
        return tag
    
    # Match <input ... >, <select ... >, <textarea ... > taking into account they might span multiple lines
    new_content = re.sub(r'<(input|select|textarea)[^>]+>', replacer, content, flags=re.MULTILINE)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f'Processed {filepath}')
