const fs = require('fs');
const path = 'c:/Projet_David/GM-OS-v5/src/locales/fr/modules.json';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix structural mess (the triple closing braces and orphan comma)
// Match: } } },
content = content.replace(/}\s*}\s*},\s*"session\.snapshots"/, '  },\n  "session.snapshots"');

// 2. Fix encoding and typos
content = content.replace(/InstantinǸ/g, 'Instantané');
content = content.replace(/altǸration/g, 'altération');
content = content.replace(/DestinǸe/g, 'Destinée');
content = content.replace(/GǸrer/g, 'Gérer');
content = content.replace(/MAǦTRE/g, 'MAÎTRE');
content = content.replace(/interceptǸ/g, 'intercepté');
content = content.replace(/Ǧcrire/g, 'Écrire');
content = content.replace(/direct Ǹ/g, 'direct à');

// 3. Fix the final trailing comma I added wrongly
content = content.replace(/session_only\": \"SESSION SEULEMENT\"\s+},\s+}/, 'session_only": "SESSION SEULEMENT"\n    }\n  }\n}');

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed fr/modules.json');
