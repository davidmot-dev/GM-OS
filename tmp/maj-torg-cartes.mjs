import fs from 'node:fs';
const fichiers=['outils/campagnes-de-recette/torg.mjs','outils/campagnes-de-recette/torg-recette.mjs','outils/campagnes-de-recette/emballer-torg.mjs','documentation/Planning/2026-11-08-campagne-recette-torg.md','documentation/Planning/2026-11-08-etat-et-reprise-codex-campagne-torg.md'];
for(const fichier of fichiers){
 let s=fs.readFileSync(fichier,'utf8');
 s=s.replaceAll('cinq cartes du Destin','dix cartes du Destin').replaceAll('cinq cartes Destin','dix cartes Destin').replaceAll('cinq Destin disponibles','dix Destin disponibles').replaceAll('Cinq cartes du Destin disponibles','Dix cartes du Destin disponibles').replaceAll('cinq cartes seulement','dix cartes seulement').replaceAll('en manque 31 avec ce sous-ensemble','en manque 26 avec ce sous-ensemble').replaceAll('Avec cinq cartes,','Avec dix cartes,');
 s=s.replace('Monologue, Plan de secours, Romance, Seconde chance et Échappé belle.','Monologue, Plan de secours, Romance, Seconde chance, Échappé belle, Second souffle, Reconnexion, Revers, Précision et Étape A.');
 s=s.replace('L’import native est testé','L’import natif est testé');
 if(fichier.endsWith('torg.mjs'))s=s.replace('2. Pour les exercices à défausse,','Le pilote fourni déclare encore cinq cartes du Destin : dans Deck-OS, modifier explicitement leur nombre à **10**, puis vérifier les fichiers card_01.jpg à card_10.jpg. Les cinq nouvelles faces ont été relues ; Relation reste absente. Les mains existantes sont à préserver.\\n\\n2. Pour les exercices à défausse,');
 if(fichier.endsWith('2026-11-08-etat-et-reprise-codex-campagne-torg.md'))s=s.replace('Question de chemin posée à David ; aucun\npaquet complet retrouvé dans le dépôt ni sur le chemin NAS connu.','David a ajouté cinq faces le 08/11 : Second souffle, Reconnexion, Revers, Précision, Étape A.\nLes dix faces restent insuffisantes pour douze cartes de départ ; le pilote déclare encore cinq,\nà régler explicitement à dix dans Deck-OS.');
 fs.writeFileSync(fichier,s);
}
const registre='documentation/Planning/2026-08-23-chantiers-gares.md';
let r=fs.readFileSync(registre,'utf8');
r=r.replace('- **Limites :** cinq cartes Destin disponibles, pas de Relation ;','- **Limites :** dix cartes Destin disponibles après l’ajout de David le 08/11, pas de Relation ; régler explicitement le nombre du paquet à dix dans Deck-OS (le pilote fourni déclare encore cinq) ;');
fs.writeFileSync(registre,r);
const suivi='documentation/Planning/2026-11-08-campagne-recette-torg.md';
let s=fs.readFileSync(suivi,'utf8');
s=s.replace('Romance n’est pas Relation ; aucun faux paquet officiel fabriqué.','Romance n’est pas Relation ; aucun faux paquet officiel fabriqué. Ajout de David du 08/11 :\nSecond souffle, Reconnexion, Revers, Précision et Étape A, faces relues. Dans Deck-OS, passer\nexplicitement le nombre Destin de cinq à dix ; le pilote original reste inchangé.');
fs.writeFileSync(suivi,s);
