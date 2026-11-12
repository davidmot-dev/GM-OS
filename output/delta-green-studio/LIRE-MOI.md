# Delta Green — GM-OS Studio — 12/11/2026

## Contenu

- theme/ : theme.css, intention, matière, trois ornements, quinze icônes.
- Delta Green Band.jpg : bannière 2400 × 600 px, 247 261 octets.
- identite-visuelle.txt : les deux lignes STYLE / AVOID pour le pilote.
- fiche/delta-green-fiche-agent-interactive.html : fiche française autonome, deux pages.
- index/ : sommaire et index du Manuel de l’Agent, pagination imprimée conservée.

## Utilisation

1. Le thème est déjà déposé dans docs/systems/delta-green/theme/ du dépôt GM-OS.
   Conserver ensemble theme.css, les SVG et leurs manifestes JSON.
2. Dans l’éditeur du pilote, choisir Delta Green Band.jpg dans « Bannière de l’en-tête ».
3. Copier les textes après STYLE: et AVOID: dans les champs « Style » et « À éviter »
   de l’identité visuelle du pilote. Ce bloc concerne les images générées, pas l’interface.
4. La fiche HTML s’ouvre directement dans un navigateur, sans Internet. Elle possède
   une sauvegarde locale, un import/export JSON, le zoom, le mode Zones et l’impression.
   Elle porte aussi le manifeste importable dans le moteur de fiches.

## État du raccordement

Le modèle delta-green-agent-fr est nouveau. Il n’est pas encore ajouté à la bibliothèque
intégrée du moteur, et n’a pas de correspondance avec les champs du pilote en cours de création.
Les compétences comp1 à comp12 de l’export 1.0.0 doivent être nommées avant ce raccordement.
Le HTML autonome calcule les valeurs ×5, VOL maximum, PV maximum et SAN maximum. Le manifeste
porte les calculs à source unique (×5 et VOL maximum) ; les deux formules composées PV/SAN
maximum attendent leur raccordement au pilote. Les points actuels ne sont pas remis au maximum.

Le thème passe le validateur GM-OS sans erreur ni avertissement. La fiche passe sans erreur,
avec les deux avertissements attendus de nouveau modèle et de correspondance absente.
Les champs sont calés sur le PDF fourni ; les deux pages ont été vérifiées visuellement.
L’impression produit deux pages A4 et le parcours autonome a été éprouvé sans réseau.

La bannière est une illustration générée, recadrée et légèrement agrandie avec l’accord de David
(source 2172 × 724 px). Les polices de titre du thème sont des approximations.
Tous les changements restent non commités. Le pilote lui-même n’a pas été modifié.
