import fs from 'node:fs';
const p='tmp/livrer-clip-degenesis.mjs';let s=fs.readFileSync(p,'utf8');
s=s.replaceAll('224','225').replace('| 160 | **Clip Degenesis**','| 161 | **Clip Degenesis**');
fs.writeFileSync(p,s);
