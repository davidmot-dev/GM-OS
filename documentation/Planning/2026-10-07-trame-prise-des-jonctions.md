# Trame — faciliter la prise des extrémités, 07/10/2026

David dit **« j'ai beaucoup de difficulté à déplacer les extrémités, peux-tu
m'aider à cela ? »**, avec une capture montrant le cercle de reconnexion au-dessus
du point Haut d'un lieu. Il confirme **« GM-OS est fermé »** avant les modifications.

Le cercle de reconnexion de React Flow est décalé vers l'extérieur de la carte,
et son rayon de douze unités de graphe diminuait avec le zoom. Il demandait donc
une prise distincte du point visible sur la carte. Le correctif conserve le
glissement et ajoute un geste direct.

- **Sélectionner le lien puis cliquer un point de l'une de ses deux cartes** place
  cette extrémité sur le côté choisi. La carte de départ règle le départ, la carte
  d'arrivée règle l'arrivée. Au clavier : Tab, puis Entrée ou Espace sur le point.
- Les points gardent leur géométrie historique pour ne pas déplacer les ports
  et les trajets. Une cible transparente de **32 pixels à l'écran** entoure le
  point de **14 pixels**, indépendamment du zoom. L'infobulle indique l'extrémité
  et le côté choisis ; le survol et le focus sont visibles.
- Les deux cercles de reconnexion ont un diamètre de **28 pixels à l'écran**.
  Le rayon d'attraction est de **24 pixels** ; relâcher près d'une accroche valide
  suffit. La cible acceptée devient verte. Seules les mêmes cartes sont acceptées.
  Le lien sélectionné passe au premier plan pour que la zone du point ne masque
  pas la prise du cercle. L'ouverture de l'inspecteur recadre la toile.
- Clic, clavier et glissement alimentent le même aperçu local. **Appliquer**
  conserve les réglages en une écriture ; Annuler, fermer ou Échap les abandonnent.
  Couleur, tracé, épaisseur, condition et cartes reliées sont conservés.

Ces gestes concernent le lien sélectionné hors **Relier**, et sont suspendus
pendant l'aperçu d'une organisation. Les flèches sur un point focalisé ne déplacent
pas sa carte. Les menus Côté de départ/Côté d'arrivée restent disponibles pour
les graphes très dézoomés où plusieurs cartes sont proches à l'écran.

Ancres : `CarteDeTrame.tsx`, `ToileDeLaTrame.tsx`, `grapheDeTrame.css`,
`InspecteurDeLienDeTrame.tsx`, `adapterLeGrapheDeTrame.ts` et
`e2e/priseDesJonctionsDeTrame.spec.ts`.

Le nouveau banc vise volontairement **10 pixels à côté du centre** du point et
du cercle, et relâche **18 pixels à côté du point**. Il vérifie les quatre côtés,
deux zooms, le clavier, les écritures et l'immobilité des cartes. Les profils et
la campagne sont factices et isolés. Les contrôles finaux sont consignés dans
`graphe-trame/prise-jonctions/controles-integration.json` ; les anciens manifestes
gardent leurs valeurs historiques. Aucun commit/push demandé.

Construction/types et lint des six fichiers réussis ; **16 tests ciblés** dans
trois fichiers passent. **31 scénarios Electron distincts** passent : les deux
nouveaux gestes et 29 régressions (Relier, styles, organisation ELK, clavier,
sélection sans écriture). Les deux captures et quatre planches des réglages de
liens sont relues. [Galerie du correctif](graphe-trame/prise-jonctions/index.html).

Pièges payés : la grande cible d'un point pouvait intercepter une prise du cercle,
résolue en mettant le lien sélectionné au premier plan ; un zoom trop serré cache
une carte derrière l'inspecteur, donc le banc garde ses deux zooms cadrés ; déposer
au-dessus d'un point dans le rectangle de l'acte voisin est refusé à juste titre,
donc l'essai d'attraction vise à côté du point, sur le même bord de sa carte.
