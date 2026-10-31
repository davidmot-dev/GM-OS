# État et reprise — Codex, thème COC — 31/10/2026

## Livraison

David : « GM-OS Studio fais le thème de COC, les différents fichiers de référence sont ici
C:\Projet_David\GM-OS-v5\docs\Reference\COC ».

**Chroniques Oubliées Contemporain, deuxième édition**, confirmé par les références, le corpus
et l’export `COC_driver_gmos_1793367242142.gmos-driver` : pilote `custom-1793122664880`, nom/corpus
`coc`, version 1.0.0. L’export n’a servi qu’à déterminer le dossier du thème ; aucun audit ou
changement des règles du pilote dans cet atelier.

Thème créé dans `docs/systems/coc/theme/` : jetons, intention et limites, deux matières,
trois ornements, quinze icônes originales en SVG. Papier ivoire, titres prune, cadre violet
profond avec repères orange ; panneaux presque carrés, relief léger, aucun halo ni verre flouté.
Les sources de référence n’ont pas été modifiées ou embarquées.

Validateur réel : **zéro erreur, zéro avertissement**. Texte principal sur matière : **11,14**
sur fond / **13,11** sur panneau ; secondaire : **4,77** / **5,62** ; accent sur matière : **6,73** ;
texte sur accent : **9,13**. **79 tests du contrat des thèmes passent**. Vingt SVG décodés,
planches 1440/390 px examinées, pas d’erreur JS ni débordement. Rapports et reproduction dans
`theme/apercu/`. Les planches sont des démonstrations hors ligne, pas des captures de GM-OS.

Registre § 190 et synthèse des pilotes complétés. Fichiers non commités : aucune demande de
commit/push pour cet atelier ; aucun `src/`, `electron/`, moteur de fiche, PDF ou export modifié.

## Reprendre

Dans une campagne utilisant le pilote `coc`, activer **le thème du jeu** et les **personnalités**
dans les Paramètres. Faire juger le résultat réel à David ; il n’a pas encore été capturé dans
GM-OS. Toute correction du thème doit respecter les jetons du contrat et repasser le validateur.

## Ne pas repayer

- **COC signifie ici Chroniques Oubliées Contemporain**, pas L’Appel de Cthulhu. La version du
  livre est identifiée par les références, pas par le seul nom du fichier d’export.
- Le PDF de références est un extrait de **trois pages** (imprimées 4, 6, 22) ; la fiche PDF en
  contient deux. Les trois captures et le sommaire sont aussi examinés. Ne pas annoncer un livre
  complet ni utiliser ces extraits comme corpus de règles relu.
- Polices déclarées : NatomPro-TitleBold et HypatiaSansPro ; **Exo 2 / Source Sans 3 sont des
  approximations**. Les polices du PDF ne sont pas extraites. Les planches hors ligne emploient
  les replis système ; elles ne prouvent pas le téléchargement des polices Google.
- Le prune des titres et l’orange des filets ne sont pas indépendants dans le contrat : l’orange
  est repris dans l’accent du cadre, le contenu et les ornements restent prune. Ne pas ajouter
  des sélecteurs CSS sans effet pour prétendre reproduire les filets orange.
- Trois ornements requis : coin, séparateur, fond. Pas d’entête décoratif, de logo ou de bannière
  dans cet atelier. Coin contenu dans le tiers extérieur ; icônes à 16 px en currentColor.
- L’Information initiale était trop proche de la Réussite : le bleu `#3554aa` lève
  l’avertissement. Lire les contrastes du validateur, ne pas les recomposer dans un autre outil.
- La grille de la planche mobile utilise `minmax(0,1fr)` pour éviter un débordement intrinsèque.
  Cela concerne seulement le script d’aperçu, jamais la CSS d’interface de GM-OS.
- Les images temporaires de rendu des pages PDF ont été retirées après examen. Ne pas verser
  de pages du livre ou de données du filigrane dans le dossier du thème.

Les modifications préexistantes des autres documents, exports et références restent hors de
ce travail. Pas de service, de profil personnel ni de sauvegarde de David utilisé.
