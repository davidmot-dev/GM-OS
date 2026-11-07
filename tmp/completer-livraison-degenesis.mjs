import fs from 'node:fs';
const p='tmp/livrer-clip-degenesis.mjs';let s=fs.readFileSync(p,'utf8');
if(s.includes('Constat distinct du tournage'))throw new Error('Déjà complété');
s=s.replace('- **Reste :** ouvrir le film ;','- **Reste :** ouvrir le film. Le calculateur générique du PJ réduit les PV sans répartir les pistes Degenesis : constat distinct au §1bis ; le film utilise les commandes natives de santé. Voir aussi la');
s=s.replace("Seize scènes et dix-huit images du MP4 relues. Pilote inchangé", "Constat distinct du tournage : le calculateur générique réduit les PV du PJ sans répartir ses pistes Degenesis (registre §1bis) ; le film passe par les commandes natives de santé. Seize scènes et dix-huit images du MP4 relues. Pilote inchangé");
s=s.replace('Scénario : e2e/clipDegenesis.spec.ts. Build, lint,', 'Constat distinct : le calculateur générique du PJ réduit les PV sans répartir les pistes\r\nDegenesis. Preuves dans constats/, suivi au registre §1bis ; aucun correctif applicatif dans\r\nce lot. Le clip utilise les commandes natives de santé qui répartissent bien les blessures.\r\n\r\nScénario : e2e/clipDegenesis.spec.ts. Build, lint,');
fs.writeFileSync(p,s);
