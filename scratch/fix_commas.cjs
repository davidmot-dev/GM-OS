const fs = require('fs');

function fix(path) {
    let c = fs.readFileSync(path, 'utf8');
    
    // Fix the specific junction issues
    c = c.replace(/}\s*"session\.snapshots"/g, '},\n  "session.snapshots"');
    c = c.replace(/}\s*"session\.messenger"/g, '},\n  "session.messenger"');
    
    // Clean up any double commas or braces
    c = c.replace(/},\s*}/g, '}\n}');
    c = c.replace(/,(\s*})/g, '$1'); // Remove trailing commas in objects
    
    fs.writeFileSync(path, c, 'utf8');
}

fix('c:/Projet_David/GM-OS-v5/src/locales/fr/modules.json');
fix('c:/Projet_David/GM-OS-v5/src/locales/en/modules.json');
