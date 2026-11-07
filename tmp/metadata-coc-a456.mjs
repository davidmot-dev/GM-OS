import fs from 'node:fs';
const p = 'src/modules/session/store/entitySlice.ts';
let s = fs.readFileSync(p, 'utf8');
s = s.replaceAll("'__cocSuivi','__cocProfil'", "'__cocSuivi','__cocProfil','__cocAvantages','__cocPsychisme'");
s = s.replaceAll("'__cocSuivi', '__cocProfil'", "'__cocSuivi', '__cocProfil', '__cocAvantages', '__cocPsychisme'");
s = s.replaceAll('e?.sheetData?.__cocProfil)', 'e?.sheetData?.__cocProfil || e?.sheetData?.__cocAvantages || e?.sheetData?.__cocPsychisme)');
s = s.replaceAll('c?.sheetData?.__cocProfil)', 'c?.sheetData?.__cocProfil || c?.sheetData?.__cocAvantages || c?.sheetData?.__cocPsychisme)');
fs.writeFileSync(p, s);
