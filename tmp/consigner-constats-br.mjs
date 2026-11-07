import fs from 'node:fs';
const reg='documentation/Planning/2026-08-23-chantiers-gares.md',entete='### 1 bis · ⚠️ Constaté, pas encore traité';let s=fs.readFileSync(reg,'utf8');
if(!s.includes(entete)||s.includes('07/11/2026 — Blade Runner : deux constats'))throw Error('Registre à contrôler');
const v=JSON.parse(fs.readFileSync('output/clips/blade-runner/constats/validation.json','utf8')),j=JSON.parse(fs.readFileSync('output/clips/blade-runner/constats/jauges.json','utf8'));
if(v.accepte!==false||j.sante!==7||j.hp!==8)throw Error('Constats différents : relire avant publication');
const bloc=`

**07/11/2026 — Blade Runner : deux constats du clip, hors correction vidéo.**

- **Reprise du suivi de blessures :** DonneesDeFicheSchema refuse le JSON structuré
  \`_gmos_blade_runner\` ; la semence contenant une plaie mortelle ne charge donc pas.
  [Preuve reproductible](../../output/clips/blade-runner/constats/validation.json),
  \`src/types/donneesDeFiche.ts\` (liste des métadonnées réservées). La semence scalaire
  valide est chargée, puis le seul état fictif de blessure est préparé avant le générique.
  Le clip ne démontre pas un import/rechargement du suivi. Même classe de constat que
  Dune ci-dessous ; ajouter une validation JSON bornée et éprouver la reprise séparément.
- **Compteur générique :** le forçage physique écrit bien Santé8→7 ; après le forçage
  mental du Hub, Sang-froid5→4 et Santé7 sont reçus côté MJ, mais pc.hp reste à8 et le
  compteur générique affiche8/8. [Valeurs](../../output/clips/blade-runner/constats/jauges.json)
  et [capture](../../output/clips/blade-runner/constats/jauge-generique.jpg).
  Le panneau passe par updateCharacter({sheetData:…}), tandis que le compteur lit hp/maxHp.
  Vérifier les deux sens du raccord sans réappliquer une perte déjà payée. La légende du
  film distingue explicitement les pistes du jeu de ce compteur générique.

Aucun correctif applicatif dans ce lot : les jets, coûts et échanges du clip sont vérifiés.
Demander l’arrêt de GM-OS avant toute modification de src/ ou electron/.
`;
fs.writeFileSync(reg,s.replace(entete,entete+bloc));console.log('Deux constats Blade Runner consignés au §1bis.');
