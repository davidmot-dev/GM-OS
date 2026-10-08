# Quinzième lot du lint — fenêtre de projection

David demande le 08/10 **« passe à l'étape suivante (GM-OS est éteint) »**.
Le quatorzième lot des dés reste non commité. Le dernier commit publié est
**`861eaca4`** sur `feature/tablet-hub-pwa`. Cette demande autorise la reprise,
sans nouvelle publication.

## Le démarrage et les commandes

`ProjectorView` initialise sa source depuis le magasin de sa cible. Avant le
premier IPC d'image, un changement du magasin ajuste l'état au rendu ; il ne
demande plus un deuxième passage par un effet. Après le premier IPC d'image,
y compris une extinction, le magasin local est ignoré comme auparavant.
Un message de niveau sonore ne prend pas cette autorité. Les écouteurs sont
toujours posés avant la demande d'état courant.

La source, l'autorité IPC et la sortie appartiennent au même état. Une commande
nulle du magasin est mémorisée pendant le fondu, sans en réarmer l'échéance à
chaque rendu. L'image reste montée pendant **700 ms** avec son opacité de
sortie. Une nouvelle commande annule le délai ; une ancienne échéance ne
ferme pas une nouvelle révision. Le démontage retire le délai et les deux
abonnements. Un changement de cible monte un cycle indépendant et invalide
les anciens écouteurs.

## Le type et l'adresse appartiennent au média

`useNatureDuMediaProjete` reconnaît les adresses d'image et les marqueurs
YouTube au rendu. Seuls les identifiants `m-` demandent une lecture de blob.
Sa réponse porte sa source, le lecteur employé et la présence du média en
base. Une réponse d'une ancienne source ou d'un cycle démonté est ignorée.
Une restauration qui remet le média en base relance la détection. Une lecture
refusée garde le repli image, sans rejet non géré. Une nouvelle source en
attente ne reprend pas le type vidéo du média précédent.

`useMediaUrlAvecSource` rend l'adresse avec l'identité de sa source. L'API
`useMediaUrl` reste compatible pour ses autres appelants. Le projecteur ne
monte une vidéo qu'avec l'adresse de son propre média : l'ancien fichier ne
peut pas être joué sous le nouveau type. Le volume et la lecture se
réappliquent aussi lorsque l'adresse arrive après le type. La boucle se lit
directement dans les métadonnées et suit leurs changements sans relecture.
Une tentative de lecture refusée après retrait ne relance plus l'ancien lecteur.

Vidéos locales et YouTube se retirent immédiatement. Si l'extinction arrive
pendant la recherche du type, une vidéo reconnue ensuite est écartée avant
son commit : elle ne démarre pas pendant les 700 ms réservées aux images.
Les vidéos et les marqueurs ne sont plus transmis au décodage des images.
Le fondu croisé et le décodage des images, les couches carte/tableau blanc,
le titre et les contrats IPC sont conservés.

Aucune règle désactivée ni temporisation ajoutée pour masquer une alerte.
Aucun gain de fluidité annoncé sans mesure.

## Contrôles

Types et construction passent. **90 tests ciblés dans huit fichiers** passent,
dont **26 nouveaux cas** : 24 pour le projecteur et la détection, deux pour
l'identité de l'adresse résolue. Démarrage au premier commit, priorité IPC,
son seul, extinction, fondu, nouvelle commande, changement de cible,
démontage, StrictMode, tableau blanc, YouTube, type/adresse arrivant séparément,
boucle et volume, restauration, lecture refusée et réponses tardives sont
exercés. Le cas d'extinction pendant la détection vérifie qu'aucune lecture
vidéo ne commence. Les contrôles de demande d'état courant, dimensions,
fondu croisé, boucle et pilotage YouTube restent.

Suite complète : **7 025 tests dans 547 fichiers**, un fichier et quatre tests
ignorés. **Six scénarios Electron passent** : les deux existants du fondu du
Player Hub et quatre nouveaux dans `e2e/projecteur.spec.ts`. Vraie fenêtre de
projection, vrai pont IPC, reprise de l'image après rechargement, fondu croisé
et extinction de 700 ms, remplacement pendant la sortie, vraie vidéo WebM
créée dans la base jetable avec volume et boucle, cadre YouTube simulé.
Le retrait des deux lecteurs est vérifié à la frame suivant la commande.
L'intégration du cadre est couverte ; la lecture distante chez YouTube ne
l'est pas, le test intercepte son adresse sans accès au réseau.

Profils, sauvegardes, corpus et coffre Obsidian jetables, appareils désactivés.
Aucune donnée réelle ni capture du manuel modifiée.

Lint global : **1 562 fichiers, zéro erreur, 357 avertissements**, contre 359.
Les **deux dernières alertes `set-state-in-effect`** sont retirées : il n'en
reste aucune dans le lint courant. Restent 353 `any` (130 applicatifs, 223 dans
les tests), trois diagnostics de mémoïsation et une directive inutile.
Règles et inventaire JSON des 540 alertes initiales inchangés.
`git diff --check` passe.

## Reprise

Lots 14 et 15 réalisés, documentés et **non commités** : **19 fichiers propres
à Codex**, treize de code/tests et six documents. Dernier publié : `861eaca4`.
Préserver les changements de Claude.

L'ordre de l'audit reprend maintenant le typage des autres modules, puis des
faux objets de tests. Prochain lot proposé : projection, avec les six `any`
de `ImageService.ts` et les cinq de `useImageStore.ts`, puis Storyboard
(`StoryboardDashboard.tsx`, douze). Ces comptes viennent du lint courant.
Les trois diagnostics de mémoïsation et la directive inutile restent à
traiter dans des lots ciblés ; aucune activation du compilateur ni baisse
des règles n'est nécessaire pour ce chantier.

**Reprise effectuée** à la demande suivante de David :
[seizième lot, contrats de projection](2026-10-08-lint-projection-medias.md).
Les onze `any` d'`ImageService` et `useImageStore` sont retirés : **346
avertissements, zéro erreur**, types, construction, **7 042 tests** et sept
scénarios Electron validés. Le projecteur est maintenant exercé via le vrai
magasin et le service, volume compris ; une extinction ferme sa fenêtre.
Lots 14 à 16 non commités ; reprendre les douze `any` de Storyboard.
