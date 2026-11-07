import fs from 'node:fs';
const p='documentation/Planning/2026-10-20-ameliorations-tous-les-pilotes.md';let t=fs.readFileSync(p,'utf8');
const row=t.split('\n').find(l=>l.startsWith('| [Shadowrun Anarchy]'));
if(!row)throw Error('Ligne Shadowrun absente');
t=t.replace(row,row.replace('Thème, fiche, bannière et identité livrés le 31/10 (§ 196)','Thème, fiche, bannière et identité livrés le 31/10 (§ 196) ; **lot de recette éprouvé le 01/11 (§ 198)** : 22 PJ, 64 cas, 72 tests, imports et trois Hub').replace("jugement du thème et de l'image","GM-05 confirmé ; 64 cas humains et matériel à jouer"));
const a=t.indexOf('## Shadowrun Anarchy'),b=t.indexOf('## Star Trek Adventures',a);let section=t.slice(a,b);
section=section.replace('chantier du § 197 l’a fait.','chantier du § 197 l’a fait.\n\n**Campagnes de recette livrées et éprouvées le 01/11**, § 198 : mission originale et deux\nlaboratoires, 22 PJ pour les trois joueurs, 64 cas humains NON TESTÉS ; 72 tests passent,\nimports/remplacement/rechargement et trois Hub 360/768/1180 vérifiés, jets et Anarchy,\nfiche HTML sauvegardée. **GM-05 confirmé : secrets de séance transmis aux Hub**, assertion\nfinale conservée en échec. [Livraison](2026-11-01-campagne-recette-shadowrun-anarchy.md).');
section=section.replace('Intégration permanente et correspondance attendues','Raccord permanent réalisé au § 197 ; essai de David attendu').replace('Aucune partie, connexion Hub ou impression physique éprouvée.','Connexions Hub éprouvées au § 198 ; partie complète et impression physique restent à essayer.');
t=t.slice(0,a)+section+t.slice(b);fs.writeFileSync(p,t);
