# Pénombre — quatre ateliers GM-OS Studio

Demande de David le 22 novembre 2026 : « fais-moi le thème, la fiche de personnage, la bannière et l’identité visuelle de pénombre », sources dans `docs/Reference/Pénombre/`. Ateliers accueil, thème, fiche, bannière et identité du plugin lus ; contrats courants du dépôt appliqués. La demande explicite de ces ateliers autorise cette production dans le dépôt. Aucune modification de l’application ou d’un pilote.

## Livraison

[ZIP complet](../../output/studio/penombre/2026-11-22/Penombre-GM-OS-Studio-theme-fiche-banniere-identite.zip) — 8 943 996 octets, 54 fichiers, 53 empreintes internes vérifiées.

SHA-256 : `25d9373972880b2739e5a97d967a9002864c88f0acb79553f63a8134f868470a`.

- [Thème](../../docs/systems/penombre/theme/theme.css), son intention, trois ornements, quinze icônes et une matière SVG dans le même dossier. Vélin chaud, brun-rouge et cadre vert d’ombre, relief mat. Police de titre approchée par IM Fell English SC, repli Georgia ; aucune prétention à reproduire le lettrage exact du livre.
- [Fiche standard interactive](../../docs/fiches/Pénombre/Penombre-fiche-standard-interactive.html), une page paysage, 106 zones, 69 clés ; nouveau modèle `penombre-standard-fr`. PDF séparé « Feuille de personnage standard WEB.pdf » choisi. La feuille collégiale n’est pas ajoutée à cette fiche PJ. Fond embarqué fidèle, aucun portrait ou calcul de règle inventé.
- [Bannière](../../docs/systems/penombre/Penombre%20Band.jpg), 2400 × 600 px, 268 793 octets. Deux générations natives ont donné 2172 × 724 px malgré les demandes de haute définition. Recadrage centré 2172 × 543 puis rééchantillonnage Lanczos ; **David a explicitement accepté le 22/11 l’agrandissement de 10,5 % : « Oui, livrer en 2400 × 600 px »**. SHA-256 : `bf919d06b8b4e30032135e9c2c6cdab2039723bbca9a02504005139e91035a09`.
- [Identité visuelle](../../docs/systems/penombre/identite-visuelle.txt), bloc STYLE / AVOID anglais, 40 / 12 mots, sans sujet, marque ou nom d’artiste. Les couleurs et le médium viennent des quatre illustrations fournies.

## Vérifications

Thème accepté par `theme:valider` : zéro erreur et zéro avertissement. Texte/fond 10,73:1, texte/panneau 11,75:1 ; sous matière, 9,40:1 et 10,32:1. Accent/fond 5,40:1, texte sur accent 6,39:1. Tous les minima passent ; état le plus bas sous matière : alerte 3,28:1.

Fiche acceptée par `fiche:valider` : zéro erreur, deux avertissements attendus, car le gabarit n’est pas intégré au moteur et n’a pas encore de correspondance avec un pilote. **Raccordement non effectué et synchronisation non annoncée.** La fiche est autonome et son manifeste permet un import manuel comme modèle.

**29 contrôles fonctionnels réussis** sous Edge headless hors ligne : présence des champs, aller-retour intégral des 69 clés, pistes cumulatives, timbre exclusif, cases indépendantes de partition et d’usage, sauvegarde/rechargement, export/import, refus des mauvais modèles et nombres, confirmations, zoom, raccourcis, impression au format paysage natif, saisie tactile en émulation 768 px. Aucune erreur JavaScript ou requête réseau. Aucun test Electron, tablette physique ou branchement au pilote.

Les captures vierge, remplie, Zones et impression ont été examinées face au PDF. Le premier rendu PDF.js assombrissait les cercles des harmoniques : remplacé par un fond PDFium conforme, puis les 29 contrôles ont été repris avec succès. La maquette du thème emploie le repli Georgia hors ligne et n’est pas une capture GM-OS. Bannière entière et simulations d’en-tête 1188 × 54 et 390 × 54 relues ; pas de texte parasite, bords calmes, architecture centrale conservée.

ZIP rouvert indépendamment avec Python : CRC, toutes les empreintes, taille/poids de bannière, manifeste, compte des champs/clés et liaison SHA du rapport de tests au HTML vérifiés. Aucun PDF source recopié dans le ZIP.

## Reprise

Guide, invites, rapports et aperçus : `output/studio/penombre/2026-11-22/`. Sources de production : `outils/penombre/preparer-fiche.py`, `construire-fiche.mjs`, `construire-theme.py`, `preparer-livraison-visuelle.py`, `verifier-studio.mjs`, `capturer-theme.mjs`, `livrer-studio.mjs`. Python du runtime Codex, modules déjà présents ; aucun paquet installé. Le runtime générique autonome et le CSS de barre d’outils sont réutilisés depuis `outils/torg/fiche/`, sans les modifier ; copies des dépendances utilisées dans le ZIP pour la reprise.

Le thème complet est déjà rangé sous `docs/systems/penombre/theme/`. L’activation, le choix de la bannière, le collage STYLE/AVOID et le raccordement du modèle au pilote restent des étapes dans GM-OS, décrites dans le guide. La Conscience est une piste de quantité ; ses faces de jetons ne sont pas modélisées. Niveaux, potentiels et maximum restent manuels.

Aucun fichier `src/` ou `electron/` touché, aucune donnée utilisateur, aucun service réseau lancé, aucun commit. Le registre partagé est modifié par un autre travail et a été laissé intact. Les index et le corpus Pénombre préexistants sont inchangés ; aucun pilote amélioré, donc aucune mise à jour de la synthèse des pilotes.
