# Vingt-quatrième lot du lint — IA et fournisseurs

David demande **« commit, pousse et passe à l'étape suivante (GM-OS est
éteint) »**, puis **« continue »**. Le lot 23 est commité en deux sujets :
**`c5935958`** (sept fichiers, correctifs chronologie/graphe/inventaire), puis
**`10cce98e`** (21 fichiers, contrats et documentation). Le push a réussi
sur `origin/feature/tablet-hub-pwa` jusqu'à `10cce98e`, après le hook complet :
types, lint (263 avertissements, zéro erreur), **7 124 tests dans 556
fichiers**, construction. L'envoi comprend aussi les commits antérieurs
depuis `861eaca4`. Aucune modification applicative pendant cette validation ;
aucun fichier étranger indexé ou commité.

## Contrats repris dans le groupe de 15 avertissements

- `AIService.ts` (8) : options RAG du vrai appelant, réponse custom explicite,
  exceptions `unknown`, requête Gemini texte/pièces/système, réponse du pont
  existante et promesse de délai `never`, option du SDK Gradio installé.
- `useTacticalAIStore.ts` (3) : `getState` réel, progression du flux et conseils
  du modèle. Les quatre messages effectivement émis sont regroupés dans
  `ProgressionDuFluxIA`, repris par le callback et l'état qui les reçoit.
  `ConseilGenere` décrit les quatre catégories de l'invite historique et
  l'absence possible de `sourceId`, à côté de `TacticalAdvice` pour les conseils
  automatiques. Aucune modification des invites ou des catégories enregistrées.
- `ForgeService.ts` (1) : arguments MCP issus de la signature du pont. Les
  délais, rafraîchissement d'authentification et reprises restent.
- `HueEngine.ts` (1) : réponse `unknown`, premier élément puis erreur relus
  avant de comparer le type à 1. Refus `UNAUTHORIZED` conservé ; aucun durcissement
  des commandes ni conversion de la charge renvoyée.
- `electron/RAGEngine.ts` (2) : chargement CommonJS `unknown` et contrat de la
  fonction PDF historique attendu aux appels ; arbre récursif `DocumentIA`,
  partagé avec le pont `AIDocument` via `src/types/documentsIA.ts`.
  Aucun déplacement du corpus, tri, filtrage ou traitement PDF ajouté.

Les conseils déjà persistés, l'ordre des réponses custom, l'assemblage Gemini,
le budget selon le moment de jeu et les délais de reprise restent.
Aucune nouvelle validation des JSON reçus des modèles ; typer une attente de
JSON ne prouve pas la conformité d'une réponse réellement générée.
Les messages d'exceptions atypiques sont normalisés en chaînes ; les replis
historiques restent distincts (stringification du texte, chaîne vide pour
Gemini JSON) et évalués seulement si nécessaire. Une charge d'erreur Gemini
nulle produit un diagnostic fournisseur au lieu d'un accès à `null.error`.
Aucune règle abaissée ni nouvelle suppression du lint.

## Deux constats de bibliothèque, consignés au § 1 bis

**Gradio — corrigé dans ce lot :** le SDK 2.1 expose `ClientOptions.token` et
ignore l'ancienne propriété `hf_token`. L'appel reprend `token`, lit directement
`import.meta.env.VITE_HF_TOKEN` et garde la même valeur, y compris vide. La
conversion se limite au type de jeton `hf_${string}` du SDK, sans nouvelle
validation. Deux essais passent par la vraie génération d'image avec SDK,
téléchargement et rangement simulés ; jeton artificiel ou absent, format et
identifiant média conservés. Aucun vrai jeton lu dans les tests, aucun appel réseau.
Ce correctif fonctionnel devra être explicité dans le prochain commit.

**PDF — différé, sans migration glissée dans le lint :** le module installé
`pdf-parse` 2.4.5 exporte un objet contenant le constructeur `PDFParse` ; une
lecture locale confirme `typeof module === 'object'` et `typeof PDFParse ===
'function'`. Le lecteur RAG attend encore une fonction v1. Son chemin d'index
ignore donc cette extraction, et le handler d'extraction tombe dans son erreur
historique. Les conversions vers `ParseurPdfHistorique` documentent le contrat
ancien attendu, elles n'attestent pas que le module chargé est callable.
Il reste à migrer les deux appels vers `PDFParse`, gérer sa destruction et
tester l'extraction sur des PDF artificiels, dans un sujet séparé. Aucun PDF
réel ouvert, aucun fichier de David lu ou modifié.

## Contrôles

**23 nouveaux tests ciblés dans quatre fichiers** passent : priorités des
réponses custom, ordre texte/système/pièces, reprises 429/503, plafond des
reprises, erreurs structurées et primitives, charge d'erreur nulle ; progression,
identité des conseils, attente des deux phases, acteur absent et échec du Cortex ;
refus Hue par pont et fetch, charges sans erreur d'autorisation ; jeton Gradio
présent ou vide. Les magasins et sorties sont artificiels, les minuteurs pilotés.
Aucun modèle, lampe, profil réel ou service réseau sollicité.

**Types (`npx tsc -b`) et construction passent.** Lint global : **1 577
fichiers, zéro erreur et 248 avertissements**, contre 263. Restent **244
`any` : 25 applicatifs et 219 dans les tests**, trois diagnostics de
mémoïsation et une directive inutile. Comptage recoupé par emplacement dans
le rapport final. **7 147 tests dans 560 fichiers** passent, un fichier et
quatre tests ignorés. `git diff --check` propre. Aucun scénario Electron
nécessaire pour ce lot ; les appels modifiés sont couverts avec sorties simulées.
L'inventaire JSON initial du 08/10 et les règles restent inchangés.

## Reprise

Lot 24 réalisé, validé et documenté, **18 fichiers Codex non commités**
(13 de code/tests, cinq documents). Dernier commit local et poussé :
**`10cce98e`**. La demande de commit/push de cette reprise portait sur le lot
23 déjà terminé ; les nouveaux changements restent à relire et à commiter
lors de la prochaine demande.

Reprendre le groupe **Relais et archives (10)** : `electron/SyncServer.ts` (6),
`src/App.tsx`, `LobbyMonitor.tsx`, `useFavoriteStore.ts`,
`archive/NexusService.ts` (1 chacun). Puis calcul/recherche/audio (9), messages
d'erreur (5), le dé du Hub (1) après coordination, les tests et les diagnostics
mémoïsation/directive. `HubDiceDisplay.tsx` était modifié hors Codex et reste
intact, autorisation de reprise toujours sans réponse. Préserver les autres
modifications de Claude. La migration PDF est un constat séparé du compteur
des avertissements restants.
