# Rêve de Dragon — R1 fatigue et état général, 18/10/2026

Registre § 141, suite de la [consolidation R0](2026-10-18-etat-et-reprise-codex-rdd-r0.md).
David : **« c'est fait, reprend R1, GM-OS est fermé »**. L’import du pilote R0 a donc été fait
par David. Cette demande autorise R1, sans commit ni push.

## Contrat et sources

- Le pilote R0 consolidé reste utilisable : **aucun quatrième export n’est nécessaire**.
- Seuls les modèles `reglesDeFiche: "rdd-231"` sont concernés. Après reprise R0, activation
  explicite par personnage via `__rddFatigue231 = 1`. Les compteurs ne sont pas corrigés
  rétroactivement ; `__rddAvantFatigue231` garde les saisies avant activation.
- Livre complet **Reve_de_Dragon_2.3.1.pdf**, SHA-256
  `a8713e6f71b6a602624f16a71de91181f29d411d78d566c9b7c2142a7b42df07`.
  Copie de lecture ignorée par Git : `scratch/reve-de-dragon-r0/sources/`.
  Pages imprimées 50–51 : piste, table transcrite 16–30 ; 88–90 : malus, acquisition,
  sommeil et limite ; 93 : état général et exceptions ; 162 : alcool et fatigue différée.
  Les pages PDF 52, 89, 91 et 94 ont été rendues et relues visuellement.

## Comportement

Le suivi utilise `fatigue`, `endurance`, `endurance_max`, `vie`, `vie_max` déjà présents.
Compléments dans les mêmes données de fiche : `ethylisme` (0–7), `surencombrement`
(points de malus retenus explicitement par le gardien), `fatigue_differee`.
Aucune seconde réserve indépendante. Le degré zéro d’alcool vaut zéro malus, comme l’absence
d’éthylisme : cette distinction narrative n’est pas automatisée par R1.

Huit lignes, douze segments, deux fois l’endurance maximale. Les multiples de six ont des
segments égaux conformément au texte. Pour les autres endurances hors table 16–30, message et
suivi manuel ; aucune extrapolation. Une fatigue ancienne supérieure à la piste reste enregistrée
avec avertissement ; aucun mouvement ne la tronque silencieusement.

Coûts : intellectuel/veille 1 par heure, physique moyen 2, exténuant 2–6 choisi par le gardien,
TMR 1 par round ou case, et coût libre. Chaque perte ordinaire d’endurance ajoute la fatigue
correspondante ; une récupération d’endurance ne l’efface pas. L’opération alcool diffère
la fatigue aux degrés 1–3, puis permet de l’inscrire explicitement ou avec une nouvelle perte
d’alcool au degré 4 ou plus. Aucun jet d’éthylisme, degré, perte aléatoire ou minuteur n’est imposé.

Le sommeil est **fatigue seule** : un segment par heure de 120 minutes, plus le précédent si
le dernier était rempli à moins de moitié, sans effacer les cases bloquées par les points
d’endurance actuellement manquants. R1 ne simule ni récupération d’endurance ni guérison.
L’assommement à piste pleine garde un seuil de réveil dans `__rddFatigueReveil` jusqu’à
récupération d’un segment, même si un plancher empêchait de le récupérer d’un coup.

L’état général cumule les quatre composantes. CHANCE, guérison, stress, JR écartent l’état.
Le jet d’éthylisme utilise fatigue et vie manquante (p. 162). La nature particulière du jet
retire le malus concerné ; elle n’implémente pas ses autres règles. Les jets ordinaires physiques,
mentaux et oniriques prennent le total une seule fois. CHANCE choisie dans la liste ordinaire
est également exemptée, et n’ajoute aucune compétence.

Chaque mouvement composé est prévisualisé puis validé ; il écrit des valeurs absolues, un UUID
`__rddOperationFatigue` et les trente dernières traces dans `__rddMouvementsFatigue`.
Rejouer cette écriture ne répète ni la perte ni le couplage endurance/fatigue. Un aperçu périmé
est refusé ; les saisies MJ en cours doivent être sauvegardées avant une opération.
Le retour au suivi manuel conserve les valeurs et les traces. Une réactivation réutilise la
première copie d’origine, sans imbriquer les copies à chaque activation.

## Ancres

- `logic/fatigueDuVoyageur.ts` : fonctions pures, table, état, exceptions et propositions.
- `logic/jetDuVoyageur.ts` : composition vers `preparerLeJet`, moteur et degrés RdD existants.
- `components/PanneauFatigueVoyageur.tsx` : activation, piste, aperçu, trace et modificateurs.
- `components/PanneauJetVoyageur.tsx`, `PanneauJetDeFiche.tsx` : panneau R1 spécialisé choisi
  après activation ; le panneau commun reste celui des autres jeux et des personnages R0 inactifs.
- `ficheDeVoyageur`, `entitySlice` : normalisation des écritures locales et distantes.
- `useCharacterEditor` : projection de fatigue locale puis sauvegarde RDD atomique, afin qu’un
  champ envoyé après l’endurance n’écrase pas la fatigue calculée.
- `CharacterSheetEditor`, `HubCharacterSheet` : même suivi et même moteur des deux côtés.
- `e2e/fatigueVoyageur.spec.ts` : campagne fictive, Electron et navigateur Edge isolés.

Les fichiers communs `DescripteurDeJet.ts` et `fields/PanneauDeJet.tsx` portent du travail Nephilim
préexistant : **laissés intacts**. L’adaptateur choisit le panneau RdD sans les modifier.
Même règle pour le registre déjà modifié et la page 53 du manuel : cette note tient la passation
R1 ; la page 54 et ses captures sont mises à jour.

## Vérification et suite

- Suite complète : **8 166 tests réussis, 4 ignorés ; 674 fichiers réussis, 1 ignoré**.
  Après les derniers garde-fous et leur régression : **52 tests ciblés réussis sur 8 fichiers**.
- `npx.cmd tsc -b` et `npm.cmd run build` réussis.
- Lint global : **1 879 fichiers, 0 erreur, 1 avertissement préexistant** dans
  `src/components/hub/useSaisieDifferee.ts:46` ; fichier laissé intact.
- E2E R1 : activation sans modification des compteurs ; fatigue 11 → 12 ; baisse d’endurance
  23 → 20 avec fatigue 12 → 15 ; vie 11 → 8, état −4 ; Agilité 12 / Discrétion +3 : **54 %**.
  CHANCE : **50 %**, sans compétence ni état. Dernier résultat figé au seuil du lancer.
- Tablette : perte d’endurance 20 → 18, fatigue 15 → 17, deux traces conservées, même seuil 54 %,
  résultat réellement reçu dans l’historique du MJ. Rechargements du MJ et du navigateur sans
  reprise ou dépense supplémentaire. Profils fictifs et isolés ; parcours final réussi en 23 secondes.
  Affichage aussi contrôlé à 360 px, sans débordement interne des deux panneaux ; capture téléphone relue.
- E2E R0 rejoué après R1 : **réussi**, anciens et nouveaux personnages, jets et reprise tablette.
- Captures de la piste et des jets MJ/tablette relues visuellement ; celles du manuel sont dans
  `documentation/User Guides/captures/jeu-reves-de-dragons-fatigue.jpg` et `…-jet-etat.jpg`.

Piège payé : la fiche projetait une dérivée différente de la saisie historique, puis comptait
cette projection comme une saisie non sauvegardée. L’activation réclamait donc de sauvegarder
alors que rien n’avait été touché. Pour RdD, le brouillon se compare désormais à la projection
initiale ; la vraie modification et sa sauvegarde atomique sont protégées par un test du hook.

Les essais passent exclusivement par `lancerGmOs`, profils/dossiers de sauvegarde/corpus jetables.
Aucun accès aux données personnelles, aucune installation, aucun commit ni push.
Les rapports et captures sont dans `scratch/reve-de-dragon-r1/`, ignoré par Git.

Suite : **R2 encaissement/blessures/combat**, puis repos complet R4. L’initiative actuelle par
Agilité reste telle que documentée en R0. Le module TMR R8 n’est pas intégré dans R1.
