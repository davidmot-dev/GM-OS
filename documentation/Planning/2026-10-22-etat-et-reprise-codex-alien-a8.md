# État et reprise — Alien A8, 22/10/2026

David : **« ca marche pour A6 et A7, commit et pousse, après tu fais A8, GM-OS est fermé »**.
A0–A7 sont validés. **A4–A7 commités et poussés dans `3cffff3d`** sur
`feature/tablet-hub-pwa` ; hook complet réussi : types, lint global sans erreur,
**8 590 tests (710 fichiers, un ignoré)** et build. Deux guides ont été synchronisés vers
NotebookLM par le hook post-commit. Les fichiers des autres chantiers sont restés hors commit.

## État livré

**A8 réalisé et contrôlé ; essai de David attendu. Livraison incluse dans le présent commit.**
David demande ensuite le 22/10 : « commit tout ce qu'il reste sous ta responsabilité ».
Cette demande couvre A8 et les exports Alien A4–A8 générés ; aucun nouveau push demandé.
[Bilan](2026-10-22-alien-a8.md), [registre](2026-10-19-registre-ameliorations-alien.md),
[synthèse](2026-10-20-ameliorations-tous-les-pilotes.md),
[manuel](../User%20Guides/54-Jeu-Alien.md).
Export local **1.8.0**, `Export Dirvers/corriges/Alien_driver_gmos_a8.gmos-driver`,
inclut A0–A7. Identifiants conservés, **49 champs et 46 correspondances**, source A7
inchangée. Zéro diagnostic Forge, aucun lien manquant et aller-retour des armes vérifié.
Les archives corrigées et états JSON A4–A8 sont versionnés à cette demande, en complément
des scripts reproductibles ; aucun état de campagne n'y figure.

## Ancres

- `outils/alien/modules/detecteur/discret.mjs`, `discret-vues.mjs` : zones reliées et
  positions métriques, pions privés, humains à deux passages par Tour, examen sur place,
  limites explicites des créatures, scan M314 unique et réserve propre. Rapport figé au
  scan ; aucune identité, aucun pion immobile ni plan complet dans la projection joueur.
- Adaptateur détecteur : données **v3**, migration v1/v2 conservant réglages et préréglages.
  Arrêt/reprise conserve Tour, batterie et dernier scan payé ; aucun redémarrage gratuit.
  Le mode scénarisé demeure ; faux écho et scan sans paiement sont refusés en mode discret.
- `outils/alien/detecteur.js` dessine les positions normalisées réellement repérées quand
  elles sont présentes ; conserve le tirage scénarisé pour les anciens usages.
- `outils/alien/modules/muthur/actes.mjs`, `actes-vues.mjs` : brouillons par scénario/acte,
  publication explicite avec accès existants, remise privée unique au seul opérateur.
  `moteur.mjs` retire les préparations avant tout appel au cœur et toute projection joueur.
  La remise utilise le message libre (`requestId:null`) pour préserver les demandes en attente.
- Adaptateur MU/TH/UR : données **v4**, migration v1–v3 avec dialogues/codes conservés.
  Configuration portable : préparations conservées, reçus de remise remis à zéro,
  documents déjà publiés reconnus ; les instances de campagne gardent les reçus et dialogues.
- **Le Tour d'exploration n'avance pas automatiquement les horloges personnelles A5** :
  le rappel demande à Maman de valider le Tour réellement écoulé dans Survie Alien.
  La batterie du M314 est distincte des réserves d'autres appareils. Le suivi A7 reste
  l'autorité pour le Récit ; éviter une double remise narrative par ses deux canaux possibles.

## Contrôles

**173 tests dans 21 fichiers** (153 modules et 20 contrat du manuel), **74 vérifications Node**,
types/build et lint ciblé réussis. Contrat du manuel vérifié après intégration des images. Rapports dans
`scratch/alien-a8/` : `tests-finaux.log`, `tests-modules.log`, `modules-node.log`, `types.log`, `build.log`,
`lint.log`, `controle.json`, `export.json`, `recette.log`, `recette-a8-finale.log`.
La recette finale A8 a réussi en **22 s**, sur Electron et deux Hub Edge réels :
scan payé unique après rechargement, paquets publics sans plan/identités/brouillons,
publication puis CODE/READ, objectif au seul destinataire et reprise de son fil privé.
Quatre parcours existants ont aussi passé : scan/retrait/reconnexion à 360/768/1 180 px,
puis fichier privé/redémarrage/import. **Six captures A8 relues et copiées au manuel.**
Les appareils physiques de David restent distincts de ces navigateurs de test.

```powershell
node outils/alien/ameliorer-pilote-a8.mjs 'Export Dirvers/corriges/Alien_driver_gmos_a7.gmos-driver'
node --experimental-strip-types scratch/alien-a8/verifier.mjs
npx.cmd vitest run --maxWorkers=4 electron/modulesDuJeu src/modules/modulesDuJeu src/components/hub/HubModulesDuJeu.test.tsx electron/manuelDesJeux.test.ts
npm.cmd run build
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
npx.cmd playwright test e2e/modulesDuJeuAlien.spec.ts -g 'A8 :|scan partagé|fichier privé' --workers=1 --reporter=list
```

Les profils et la fiction sont jetables (`lancerGmOs.ts`, `creerSemenceAlien`) ; aucun
pilote personnel ni donnée de David utilisé pour la recette des modules. Les captures
sortent dans `scratch/modules-du-jeu-e2e/jeu-alien-a8-*.jpg` avant copie contrôlée.
Pas de paquet installé ni de service lancé manuellement.

## Pièges payés

- Les menus imbriqués dans un label ont besoin d'un `aria-label` stable : leurs options
  peuvent sinon entrer dans leur nom accessible et faire échouer un ciblage exact.
- **CODE déverrouille, READ lit** : attendre le contenu seulement après READ. L'identifiant
  de lecture est choisi par Maman dans le formulaire d'acte.
- Une capture d'un panneau plus haut que ses ancêtres défilants peut montrer du vide ou
  couper le texte. `capturerPanneauA8` ouvre temporairement les limites et masque les autres
  écrans, puis restaure les styles avant les assertions. Les contrôles de débordement du
  Hub se font sur l'interface normale avant cette capture. Les noms des pions restent dans
  la liste sous le plan ; le schéma porte les zones et les comptes pour éviter les chevauchements.
- Pour fabriquer une ancienne sauvegarde dans les tests, retirer aussi `actes`/`discret` :
  une v2 contenant des champs v4 doit être rejetée, pas acceptée comme migration valide.
- Sous PowerShell, ne pas envoyer du code comportant des accents à Node par une pipe
  d'encodage implicite. Écrire un `.mjs` UTF-8 puis l'exécuter. Ne pas confondre avertissement
  natif et code d'échec : conserver `$LASTEXITCODE` avant de relire le journal.

## Prochain geste et limites

David importe le pilote 1.8.0 et essaie le mode discret et les préparations d'acte.
**Après son prochain essai, redemander si GM-OS tourne avant d'éditer `src/` ou `electron/`.**
Commit A8 demandé ; aucun nouveau push demandé. Combat spatial non engagé.
Le registre général partagé, le guide 62, les suppressions d'exports/corpus et les autres
chantiers préexistants restent hors de notre périmètre. Les changements A8 sont ceux des
modules Alien, leurs recettes, leur script d'export et leur documentation.
