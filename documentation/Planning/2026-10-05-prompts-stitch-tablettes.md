# T3 — prompts Stitch pour les tablettes

## Point de reprise après redémarrage de VS Code — 05/10/2026

- **Chantier actif : T3, joueurs d'abord.** T2 est terminé (commit `1b6a991f`).
  Les prompts J1.1 « Qui es-tu ? » et J1.2 « Direct » ci-dessous sont prêts ;
  aucune maquette de tablette n'a encore été générée ni retenue.
- **Stitch MCP configuré dans Codex** : serveur `https://stitch.googleapis.com/mcp`,
  authentification par l'en-tête `X-Goog-Api-Key` alimenté par `STITCH_API_KEY`.
  La clé est dans la variable d'environnement Windows **Machine**, pas **User** :
  un contrôle sur le scope `User` renvoie donc `False`, ce qui est normal.
  Ne jamais écrire sa valeur dans le dépôt ou la conversation.
- **Connexion vérifiée** : initialisation MCP HTTP 200, puis `list_projects` a retrouvé
  le projet privé **« Système Design Bureau Modulaire »** (`projects/14179472786712390673`).
  Aucun projet ni écran Stitch n'a été modifié pendant cette vérification.
- **Au retour** : vérifier que Codex expose les outils Stitch après redémarrage de VS Code.
  Reprendre avec J1.1, dans le projet ci-dessus, en suivant les deux prompts et les
  trois références indiquées plus bas. Rendre et contrôler les exports avant de
  demander à David de choisir la maquette. Puis passer à J1.2 dans une nouvelle
  conversation Stitch. Ne pas commencer T4 ni modifier `src/` ou `electron/` ici.

**Ouvert le 05/10/2026.** [Plan des tablettes](2026-10-04-refonte-tablettes.md), § 5.
On commence par les joueurs. Une conversation Stitch neuve par écran ; dans cette conversation,
deux cadres du **même** écran : téléphone, puis iPad Air paysage. Les maquettes sont des références
pour T4, jamais du code à coller dans GM-OS.

Utiliser le projet Stitch existant et son [DESIGN.md](stitch/DESIGN.md) pour les couleurs,
la typographie et les composants. ⚠️ Ses consignes « bureau 1440 × 900 », bandeau et barre
latérale décrivent le **poste du meneur**, pas les tablettes. Pour ces prompts, la référence
de style est [la grammaire retenue](stitch/grammaire/combat.png) ; sa structure de bureau
ne se recopie pas sur un téléphone. Les captures T0 sont celles de la campagne fictive
« Le Silence de Varn » ; aucune donnée de David n'est jointe.

Chaque export doit être rendu depuis son **HTML**, puis comparé aux captures T0 et au code :
contenu et gestes conservés, cibles tactiles d'au moins 44 px, écran utilisable dès 360 px.
Une fonction apparemment inventée se vérifie d'abord dans le code. David choisit la maquette
retenue ou écarte l'écran ; seul ce choix autorise son rangement dans `stitch/tablettes-joueurs/`.

## J1.1 · Accueil « Qui es-tu ? » — prompt prêt, maquette non reçue

**Conversation Stitch neuve.** Joindre [la capture téléphone](tablettes/T0-joueurs/telephone/01-accueil.png),
[la capture iPad paysage](tablettes/T0-joueurs/paysage/01-accueil.png) et
[la référence de style](stitch/grammaire/combat.png). Sources vérifiées :
`src/components/hub/LobbyOnboarding.tsx` et `e2e/tabletteJoueursT0.spec.ts`.
`Stitch/joueur/` représente le roster **du PC** : ce n'est pas une tablette.

### Premier prompt — téléphone

```text
Dans le projet GM-OS existant, redessine UNIQUEMENT l'accueil « Qui es-tu ? » de la tablette
des joueurs, application web tactile à 390 × 844, utilisable dès 360 px. Reprends les jetons
et la typographie du DESIGN.md et le langage visuel de la référence Combat, sans sa barre
latérale ni son bandeau de bureau.

Les captures jointes font foi. En tête : « Quitter la session » (confirmation au toucher),
« Qui es-tu ? », campagne « Le Silence de Varn » et séance 2. Trois choix de personnage :
Camille / Nel Varga / Technicienne de bord ; Mathis / Idris Koa / Négociateur ;
Inès / Sora Adebayo / Médecin de bord. Chaque carte indique « Connectable » et permet de
choisir ce personnage ; aucun portrait n'est fourni, garder un emplacement neutre. En pied,
l'état de connexion et les informations techniques déjà montrées par la capture.

Sur téléphone, la liste peut défiler verticalement ; le choix et la sortie restent faciles à
toucher (cibles ≥ 44 px). Aucun onglet de jeu avant le choix du personnage. Garde les libellés
français et chaque information réelle. C'est TOUT. N'ajoute rien.
```

### Second prompt — dans la même conversation, iPad paysage

```text
Décline CE MÊME accueil à 1180 × 820. Montre les trois personnages et l'état de connexion
sans défilement si possible. Conserve exactement les informations, les deux gestes et le
système de design du cadre téléphone. Aucun bandeau de bureau, aucun nouvel onglet,
aucune nouvelle fonction. C'est TOUT.
```

**Contrôle avant choix de David** : rendre les deux exports HTML en Chromium ; vérifier à 360 px
que le troisième personnage et « Quitter la session » restent atteignables ; vérifier que la
confirmation de sortie n'apparaît qu'après le geste. Le portrait absent ne doit pas être
remplacé par une image inventée.

## J1.2 · Direct — prompt prêt, maquette non reçue

**Autre conversation Stitch neuve.** Joindre [la capture téléphone](tablettes/T0-joueurs/telephone/02-direct.png),
[la capture iPad paysage](tablettes/T0-joueurs/paysage/02-direct.png) et
[la même référence de style](stitch/grammaire/combat.png). Source vérifiée :
`src/components/TabletHub.tsx`. La capture T0 montre un défaut connu : le titre de campagne
passe derrière l'horloge. La maquette doit le rendre lisible.

### Premier prompt — téléphone

```text
Redessine UNIQUEMENT l'onglet « Direct » de la tablette joueur GM-OS à 390 × 844,
utilisable dès 360 px. Même projet, mêmes jetons et même grammaire visuelle que l'accueil ;
pas de barre latérale ni de bandeau du PC.

Montre le titre « Le Silence de Varn » sans chevauchement, le mode Qualité/Performance et
l'état de connexion, l'horloge projetée, la tension publique « Alerte de la station » à 3/8,
et « Chroniques de séance » avec « Aucun résumé public. ». Le centre reste libre pour la
projection envoyée par le meneur ; n'invente pas de média. Navigation tactile vers Direct,
Archives, PNJ, Lieux, Inventaire, Cartes, Fiche, Notes, Messages et Quitter. Chaque destination
reste atteignable à 360 px, avec des cibles ≥ 44 px.

Les deux captures font foi pour les informations et les libellés. Tu peux améliorer leur
agencement, notamment le titre caché par l'horloge. C'est TOUT. N'ajoute rien.
```

### Second prompt — dans la même conversation, iPad paysage

```text
Décline CE MÊME écran à 1180 × 820. Garde tous les éléments et gestes du téléphone ;
utilise l'espace supplémentaire pour rendre la campagne, l'horloge et la tension lisibles,
et laisse la projection au centre. La navigation reste complète. Aucun panneau de réglages
du PC, aucune nouvelle fonction. C'est TOUT.
```

**Contrôle avant choix de David** : à 360 px, lire le titre de campagne et les valeurs
de l'horloge sans chevauchement ; atteindre toutes les destinations de la navigation et
garder la projection visible. La tension secrète du meneur ne doit pas apparaître.
