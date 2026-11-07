import fs from 'node:fs';
const p='tmp/livrer-clip-br.mjs';let s=fs.readFileSync(p,'utf8');
s=s.replace(/t=t\.replace\(\/## Le jet[^,]+,/,"t=t.replace('## Le jet — les dés échelonnés',");
s=s.replace(/t=t\.replace\(\/## Blade Runner[^,]+,/,"t=t.replace('## Blade Runner',");
s=s.replace('dix-huit scènes et vingt\nimages','dix-huit scènes et vingt-deux\nimages').replace('dix-huit scènes et vingt\r\nimages','dix-huit scènes et vingt-deux\r\nimages');
s=s.replace('Aucun appareil physique utilisé. Le rechargement','Le compteur de PV générique reste à8 malgré la Santé à7 : constat de raccord séparé. Aucun appareil physique utilisé. Le rechargement');fs.writeFileSync(p,s);
