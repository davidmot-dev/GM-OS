import fs from 'node:fs';
const p='outils/campagnes-de-recette/shadowrun.test.ts';
let t=fs.readFileSync(p,'utf8').replace('j.poolSize','j.nombreDeDes').replace('j.success).toBe(false)','j.tagSuccess).toBe(false)');
t=t.replace("JSON.parse(fs.readFileSync('docs/systems/shadowrun-anarchy/fiche/correspondance.json','utf8'))","fs.readFileSync('docs/systems/shadowrun-anarchy/fiche/correspondance.json','utf8')").replace('versLaFiche(pcs(0)[0].sheetData!,c!)','versLaFiche({sheetData:pcs(0)[0].sheetData!},c!)');
fs.writeFileSync(p,t);
const c='outils/campagnes-de-recette/vitest-shadowrun.config.mts';fs.writeFileSync(c,fs.readFileSync(c,'utf8').replace(",'outils/shadowrun-anarchy/pilote.test.ts'",''));
