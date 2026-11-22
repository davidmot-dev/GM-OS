import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import AdmZip from 'adm-zip';
const out='output/studio/penombre/2026-11-22';
const hash=b=>createHash('sha256').update(b).digest('hex');
const json=n=>JSON.parse(fs.readFileSync(path.join(out,n),'utf8'));
const theme=json('validation-theme.json'),fiche=json('validation-fiche.json')[0],tests=json('verification-fiche.json'),banner=json('verification-banniere.json');
assert(theme.accepte&&theme.erreurs.length===0&&theme.avertissements.length===0);
assert(fiche.accepte&&fiche.erreurs.length===0&&fiche.avertissements.length===2);
assert.equal(tests.tests,29);assert.equal(tests.reussis,29);
const html='docs/fiches/Pénombre/Penombre-fiche-standard-interactive.html';
assert.equal(hash(fs.readFileSync(html)),tests.htmlSha256);
const identity=execFileSync(process.execPath,['C:/Users/david/.codex/plugins/cache/created-by-me-remote/gmos-studio/0.1.0/skills/identite/scripts/valider-identite.mjs','docs/systems/penombre/identite-visuelle.txt'],{encoding:'utf8'});
assert(JSON.parse(identity).valid);fs.writeFileSync(`${out}/validation-identite.json`,identity);
const block=fs.readFileSync('docs/systems/penombre/identite-visuelle.txt','utf8').trim();
const guide=`# Pénombre — GM-OS Studio

Livraison du 22 novembre 2026 : thème, fiche de personnage standard, bannière et identité visuelle. Les quatre livrables sont préparés et déposés dans le dépôt ; aucun pilote ou réglage de l’application n’a été modifié.

## Les quatre fichiers

- **Thème** : \\theme/theme.css\\ et tous ses assets voisins dans le ZIP. Dépôt réel : \\docs/systems/penombre/theme/\\. Vélin clair, encre brun-rouge, cadre vert d’ombre, trois ornements, quinze icônes et une matière SVG. Conserver l’arborescence complète.
- **Fiche** : \\fiche/Penombre-fiche-standard-interactive.html\\. Dépôt réel : \\docs/fiches/Pénombre/\\. Une page paysage, fidèle au PDF standard ; HTML autonome portant le manifeste \\penombre-standard-fr\\, 106 zones et 69 clés stables.
- **Bannière** : \\Penombre Band.jpg\\, déposée sous \\docs/systems/penombre/\\. 2400 × 600 px, ${banner.octets.toLocaleString('fr-FR')} octets. Éditeur du pilote → Bannière de l’en-tête → choisir ce fichier.
- **Identité** : \\identite-visuelle.txt\\. Copier STYLE et AVOID dans les deux champs du pilote destinés aux images. La peinture, le grain, les couleurs et la lumière décrivent un rendu ; le sujet vient séparément.

## Bloc d’identité prêt à copier

\`\`\`text
${block}
\`\`\`

## Fiche de personnage

Source choisie : **Feuille de personnage standard WEB.pdf**, une page paysage. L’autre extrait contient cette fiche tournée et la feuille collégiale ; la feuille collégiale n’est pas ajoutée à une fiche de personnage. Les fonds et illustrations du PDF sont conservés ; les saisies restent transparentes. Les cinq harmoniques, neuf atouts, quatre pouvoirs, deux maîtrises magiques, trois potentiels, timbre, partition, Peste, Conscience et quatre complications sont interactifs. Aucun espace de portrait n’est imprimé et aucun n’est inventé.

Timbre : choix exclusif ; partition : clé et quatre notes indépendantes ; dés d’atout, complications et Conscience : pistes cumulatives. Le dernier repère sélectionné peut être recliqué pour effacer la piste. Le maximum de Conscience, les potentiels et niveaux restent manuels. La piste de Conscience compte les jetons ; elle ne modélise pas les faces actives et inactives. Aucun calcul de règles ou état par défaut n’est imposé.

Zoom 20–400 %, Ctrl+molette et raccourcis ; mode Zones ; sauvegarde locale, export/import JSON, réinitialisation confirmée et impression paysage. Fonctionne hors ligne. Les données d’essai visibles sur les captures sont fictives et ne sont pas préremplies dans le HTML.

**Raccordement GM-OS à effectuer séparément** : le modèle est nouveau, absent des modèles intégrés du moteur, et aucune correspondance ne relie encore ses 69 clés au pilote. Le manifeste permet son import comme modèle, mais une synchronisation des valeurs avec le pilote demande l’intégration du gabarit et la table de correspondance. Les deux avertissements du validateur décrivent exactement ces étapes ; aucune synchronisation testée ou annoncée.

## Contrôles et limites

- Thème accepté : **0 erreur, 0 avertissement**. Texte/fond : **10,73:1**, texte/panneau : **11,75:1** ; au pire point de matière : **9,40:1** et **10,32:1**. Accent/fond : **5,40:1**, texte sur accent : **6,39:1**. Tous les minima du contrat sont respectés, y compris les états sur la matière (minimum observé **3,28:1**).
- Fiche acceptée : **0 erreur, 2 avertissements d’intégration** décrits ci-dessus. **29 contrôles fonctionnels réussis** dans Edge hors ligne, dont aller-retour des 69 clés, restauration après rechargement, pistes, saisie tactile émulée à 768 px, zoom et format d’impression. Aucune erreur JavaScript ou requête réseau. Ce n’est pas une recette Electron ou sur tablette physique.
- La relecture visuelle compare le PDF aux captures vierge, remplie, Zones et impression. Un défaut de transparence du premier rendu PDF.js a été corrigé en utilisant PDFium pour le fond ; les cercles d’harmoniques restent clairs comme dans le PDF.
- Bannière générée depuis les références picturales fournies. Les deux rendus obtenus mesurent 2172 × 724 px malgré les demandes de plus haute définition. Recadrage central en 2172 × 543, puis agrandissement Lanczos de **10,5 % accepté par David le 22/11/2026**, vers 2400 × 600. Aucun détail supplémentaire prétendu. Aperçus complets et en en-tête 1188 × 54 / 390 × 54 examinés, sans texte parasite ni personnage au premier plan.
- IM Fell English SC approche la typographie de titre sans reproduire le lettrage du livre. Import Google Fonts autorisé par le contrat ; repli Georgia hors ligne. La maquette du thème est une simulation locale avec ce repli, pas une capture de GM-OS.

Le ZIP contient aussi les invites, rapports et aperçus ; les PDF sources ne sont pas recopiés. Aucune installation, aucun service réseau, aucune donnée utilisateur ou écriture Git.
`.replaceAll('\\','`');
fs.writeFileSync(`${out}/LIRE-MOI.md`,guide);
fs.writeFileSync(`${out}/verification-relecture.json`,JSON.stringify({date:'2026-11-22',relecteur:'Codex, contrôle visuel IA',fiche:['fiche-vierge.png','fiche-remplie.png','fiche-remplie-zones.png','fiche-impression.png'],theme:'apercu-theme.png',banniere:'apercu-banniere.png',constats:['Fond PDF fidèle après passage à PDFium ; cercles des harmoniques clairs.','Champs sur les zones imprimées, rappels de règles préservés.','Thème lisible, ornements et icônes examinés à petite taille.','Bannière et en-têtes examinés ; bords sombres, pas de texte parasite.'],electron:'Non exécuté',tablettePhysique:'Non exécuté'},null,2)+'\n');
const files=new Map();
const add=(source,target)=>files.set(target,fs.readFileSync(source));
const walk=(dir,prefix)=>{for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name),t=prefix+'/'+e.name;e.isDirectory()?walk(f,t):add(f,t);}};
walk('docs/systems/penombre/theme','theme');add(html,'fiche/Penombre-fiche-standard-interactive.html');
add('docs/systems/penombre/Penombre Band.jpg','Penombre Band.jpg');add('docs/systems/penombre/identite-visuelle.txt','identite-visuelle.txt');
for(const n of ['LIRE-MOI.md','prompt-banniere.txt','validation-theme.md','validation-theme.json','validation-fiche.md','validation-fiche.json','validation-identite.json','verification-fiche.json','verification-banniere.json','verification-relecture.json','construction-fiche.json'])add(`${out}/${n}`,n);
for(const n of ['apercu-theme.png','apercu-banniere.png','fiche-vierge.png','fiche-remplie.png','fiche-remplie-zones.png','fiche-impression.png','tablette.png'])add(`${out}/${n}`,'apercus/'+n);
for(const n of ['preparer-fiche.py','construire-fiche.mjs','construire-theme.py','preparer-livraison-visuelle.py','verifier-studio.mjs','capturer-theme.mjs','livrer-studio.mjs'])add('outils/penombre/'+n,'reproduction/'+n);
add('outils/torg/fiche/runtime.js','reproduction/runtime-torg-utilise.js');add('outils/torg/fiche/interface.css','reproduction/interface-torg-utilisee.css');
const hashes=Object.fromEntries([...files].map(([name,data])=>[name,hash(data)]));files.set('empreintes.json',Buffer.from(JSON.stringify(hashes,null,2)+'\n'));
const zip=new AdmZip();for(const[n,b]of files)zip.addFile(n,b);for(const e of zip.getEntries())e.header.time=new Date('2026-11-22T12:00:00Z');
const name='Penombre-GM-OS-Studio-theme-fiche-banniere-identite.zip';zip.writeZip(path.join(out,name));
const read=new AdmZip(path.join(out,name));for(const[n,h]of Object.entries(hashes))assert.equal(hash(read.readFile(n)),h,n);
const report={zip:name,octets:fs.statSync(path.join(out,name)).size,fichiers:files.size,empreintesVerifiees:Object.keys(hashes).length,sha256:hash(fs.readFileSync(path.join(out,name))),ficheTests:29,themeErreurs:0,themeAvertissements:0,ficheErreurs:0,ficheAvertissements:2,banniere:banner};
fs.writeFileSync(`${out}/verification-livraison.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
