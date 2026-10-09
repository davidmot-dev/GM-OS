# Lint — lot 38, ponts du Storyboard — 09/10/2026

David demande « commit et passe à l'étape suivante (GM-OS est éteint) ».
Les neuf fichiers Codex du lot 37 mémoïsation sont commités sous **`004a814e`**,
sans les modifications étrangères. Dernier poussé **`916a3842`** ; un commit
local d'avance. Aucun push dans cette session.

## Groupe corrigé

**Quatre annotations `any` déjà masquées retirées**, deux dans
`sonsDuMoment.ts` et deux dans `useStoryboardStore.ts`. La directive de fichier
et les deux directives de ligne correspondantes sont supprimées.

Le nouveau contrat **`FenetreDuStoryboard`**, dans `pontsDuStoryboard.ts`,
projette les signatures réelles de **cinq magasins et deux moteurs** : Music,
Sound, Ambient, Image, Map, HueEngine et SoundEngine. Les propriétés sont
facultatives pour garder le cas des modules pas encore chargés. Tous les
imports sont **des imports de types** : pas d'import de moteur à l'exécution,
pas de nouveau cycle entre magasins.

Les trois lectures de `window` passent par une conversion explicite via
`unknown` vers ce contrat. Les scènes d'ambiance, pads musicaux, diaporamas,
médias et atmosphères sont inférés depuis les vrais modèles. Les signatures
de sortie audio, du marqueur automatique et des fondus de volume viennent
des modules qui les réalisent, sans recopier une forme approximative.

La présence du magasin de bruitage est explicitée avant son écriture. Le
magasin d'ambiance est conservé dans une variable locale gardée ; **son état
reste relu à chaque tour** avant de couper une piste. Les règles restent :
arrêter seulement les sons du moment, garder la musique lors de l'arrêt du
moment, préserver les sons manuels et laisser les moteurs se relayer.

Projection, restitution de carte, titres, lumières, sorties audio, volumes,
rapports et persistance restent aux mêmes endroits. Aucune fixture, attente,
donnée enregistrée, règle de lint ou déclaration globale de `Window` modifiée.

## Contrôles

- **`npx tsc -b`** propre, puis **`npm run build`** passe.
- Lint ciblé propre ; lint global : **1 586 fichiers, zéro erreur, zéro
  avertissement**, le fichier de contrat explique le fichier supplémentaire.
- **131 tests dans les 14 fichiers de Storyboard passent**, avec
  `--maxWorkers=4`, sur les sources finales. Sons, sorties, volumes, bruitages,
  ambiances, lumières, cartes, images, diaporamas, titres, sources et rapports.
- Les **14 fichiers de tests sont inchangés**, comparaison avec `HEAD` en
  neutralisant seulement les fins de ligne. Aucun cas supprimé ou ajouté.
- Comptage syntaxique : **4 → 0** dans les deux fichiers corrigés, zéro dans
  le nouveau contrat ; **une seule annotation explicite** dans l'ensemble des
  TS/TSX suivis de `src/`, `electron/`, `e2e/`, plus le nouveau contrat.

Cette dernière annotation est celle de **`electron/lectureDeSource.ts`**,
déjà masquée et liée à la migration PDF v1/v2. **Zéro `any` dans `src/` et
dans les tests.** La disparition de quatre annotations masquées ne fait pas
baisser le nombre d'avertissements : il était déjà nul.

`git diff --check` propre ; empreintes des **21 fichiers étrangers** inchangées.
Pas de nouvelle suite Vitest complète ni d'e2e ; son dernier passage complet
reste le pré-push de **`916a3842`** : 7 198 tests, 566 fichiers réussis, un
fichier et quatre tests ignorés. Aucun lancement Electron, paquet installé ou
service démarré ; aucune donnée réelle de David touchée.

## Reprise

**Huit fichiers Codex non commités** : trois sources et cinq documents.
Dernier local **`004a814e`**, dernier poussé **`916a3842`**.

Le lint global est propre et le groupe Storyboard est terminé. Reprendre la
**migration PDF v1/v2 au § 1 bis du registre**, avec adaptation des appels,
destruction du parseur et vérification sur PDF artificiels. Le cadrage de la
capture du dernier jet reste également dans cette section, séparé du lint.

Préserver les fichiers étrangers des guides, du lanceur e2e, du 07/10 et de
`.claude`. Les images de contrôle du lot 36 restent ignorées dans
`e2e-resultats/` ; elles ne sont pas remplacées par ce lot.
