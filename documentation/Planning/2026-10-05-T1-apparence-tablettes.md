# T1 — l'apparence du PC voyage jusqu'aux tablettes (2026-10-05)

David a demandé « fait la phase T1 » après les relevés T0. GM-OS était arrêté avant toute
modification de `src/` et `electron/`, conformément à `AGENTS.md`.

Le PC lit seul le thème du jeu. `useThemeDuJeu` publie le thème de base, l'accent, l'interrupteur
des personnalités, les jetons `--rpg-*` déjà extraits, les ornements et les icônes SVG déjà vérifiés.
`useNexusSynchronizer` transporte ce segment « apparence » vers les rôles `remote`, `player` et
`hub` ; le navigateur l'applique par `appliquerLeTheme`, le même arbitre que le PC. Aucune feuille
`theme.css` ni règle `.rpg-*` ne traverse le réseau. Une variation d'apparence part comme segment
isolé, sans recalcul de l'état de campagne ; un état complet le porte à la connexion. Le
`SyncServer` garde le dernier segment public pour l'envoyer juste après l'inscription d'une
nouvelle socket : la demande initiale peut précéder l'attribution du rôle, défaut déjà constaté
en T0. Cette mise en cache ne modifie ni l'appairage ni les droits.
Avant le premier message, le navigateur affiche le thème de base neutre ; il ignore son ancien
réglage local, qui ne doit jamais décider de l'apparence de la table.

Les sept thèmes de jeu actuels référencent Google Fonts ; le dépôt ne contient aucun fichier
`.woff` ou `.woff2`. Le PC résout les feuilles autorisées `fonts.googleapis.com`, incorpore leurs
fichiers `fonts.gstatic.com` en `data:` et n'envoie que les règles `@font-face` par le SyncServer.
La tablette ne demande donc pas les **polices du jeu** à Google. Cette seconde livraison peut
suivre les couleurs ; le PC garde les fichiers résolus en mémoire pendant la séance. Une source
indisponible sur le PC laisse les polices de repli. Les polices
de base déclarées par `src/index.css` utilisent encore Google Fonts ; leur hébergement hors ligne
ne fait pas partie de cette voie T1. La disponibilité réelle des polices hors ligne reste à
constater sur le poste de David et les appareils de T6.

Vérifications : `npx tsc -b`, `npm run build` et les deux tests unitaires de
`src/theme/apparenceTablettes.test.ts` passent. L'E2E
`e2e/apparenceTablettesT1.spec.ts` utilise un profil jetable, la campagne fictive, le vrai
SyncServer et deux navigateurs Edge : thème de base, accent, personnalités, thème Alien, icône
fournie, reconnexion. La bascule du thème de base et celle du jeu atteignent les deux tablettes
en moins d'une seconde ; la police simulée côté PC arrive incorporée, sans requête Google de
la part des tablettes pour cette police. Les défauts de gestes consignés en T0 restent ouverts.
