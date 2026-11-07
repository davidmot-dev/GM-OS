import fs from 'node:fs';
const p='outils/campagnes-de-recette/shadowrun.mjs';let t=fs.readFileSync(p,'utf8');
t=t.replace("const instant=Date.parse(DATE_SHADOWRUN)","const {separerLeBloc}=await import('../../src/modules/ai/identiteVisuelle.ts');\nconst identite=separerLeBloc(fs.readFileSync('output/identites/shadowrun-anarchy/identite-visuelle.md','utf8'));assert.ok(identite);\nconst instant=Date.parse(DATE_SHADOWRUN)").replace('identiteVisuelle:{...pilote.identiteVisuelle,','identiteVisuelle:{...identite,').replace("id('playlist','canal')","id('playlist','relais')");
fs.writeFileSync(p,t);
