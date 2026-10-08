# Dixième lot du lint — extinction du fondu croisé

> Publication demandée le 08/10 : **« commit, pousse et passe à l'étape suivante
> (GM-OS est éteint) »**. Ce lot est maintenant commité sous **`020bae8e`**.
> La [note du jour](2026-10-08-etat-et-reprise.md) suit l'envoi et la reprise.
> Les mentions « non commité » ci-dessous décrivent l'état avant cette demande.

David demande le 08/10 **« passe à l'étape suivante (GM-OS est éteint) »**.
Le neuvième lot reste non commité ; aucune publication n'est demandée dans
ce tour. Le dernier lot publié reste le huitième, **`a749007e`**.

## La cible change, la transition garde sa durée

`useFonduCroise` regroupe cible demandée, image entrante, image sortante et
transition en cours. Une garde sur le changement de cible ajuste uniquement
l'état local du crochet pendant son rendu. Quand la cible disparaît, l'entrante
devient `null` et l'image montrée passe en sortie avant le commit. L'effet
n'efface plus les images. Une nouvelle cible non vide garde l'ancienne image
jusqu'à la fin de son décodage.

L'effet de chargement garde `chargerLImage`, qui attend téléchargement et
`decode()`, avec les mêmes replis en cas d'image illisible. Une lecture abandonnée
ne publie rien ; le résultat vérifie aussi la cible courante dans la mise à jour
de l'état. Une image déjà montrée ne se recharge pas. Les références dupliquant
l'image montrée et le minuteur disparaissent.

L'autre effet porte le minuteur de la transition effectivement rendue. Il le
nettoie quand elle est remplacée ou au démontage, et une ancienne échéance ne
peut pas retirer la sortante d'une autre transition. La durée est capturée au
départ : la modifier pendant un fondu ne le prolonge pas. Les contrats restent
**700 ms au projecteur** et **1 500 ms sur le Hub et les tablettes** ; une
extinction interrompant un croisement garde la dernière image montrée pendant
sa propre durée. Le projecteur conserve son mécanisme d'extinction extérieur
au crochet ; les consommateurs et leur balisage ne sont pas modifiés.

Aucune temporisation ajoutée pour contourner le lint, aucune règle désactivée,
aucun gain de fluidité annoncé sans mesure.

## Contrôles

Types et construction passent. **57 tests ciblés dans trois fichiers** passent,
dont **21 cas du crochet** (huit existants et **13 nouveaux**). Ils exercent le
premier commit à l'extinction, les décodages dépassés, l'absence de prolongation
entre `null` et `undefined`, les transitions interrompues, la durée capturée,
le démontage et le mode strict. Le chargeur réel est éprouvé avec un décodage
retenu, une erreur de téléchargement et un rejet de décodage. Les deux fichiers
du diaporama gardent leurs tests de cadence et d'enchaînement.

Suite complète : **6 922 tests dans 541 fichiers**, un fichier et quatre tests
ignorés. Lint global : **1 550 fichiers, zéro erreur, 367 avertissements**,
contre 368. Une alerte `set-state-in-effect` retirée ; restent **353 `any`**
(130 applicatifs, 223 dans les tests), **10 effets**, trois diagnostics de
mémoïsation et une directive inutile. Règles et JSON des 540 alertes initiales
inchangés. `git diff --check` passe.

**Huit scénarios Electron passent** : les six existants d'Image-OS et les deux
nouveaux dans `e2e/fonduDesImages.spec.ts`. Une vraie fenêtre Player Hub reçoit
deux PNG par le pont IPC ; on vérifie les couches, leur animation CSS de
1,5 seconde et leur retrait. Le second scénario retient le décodage réel de la
nouvelle image : l'ancienne reste, s'éteint sur ordre et le décodage relâché ne
rallume pas l'écran. Les images sont copiées dans le corpus jetable ; profil,
sauvegardes et corpus sont isolés, appareils désactivés et aucune capture du
manuel remplacée. Le projecteur et une tablette physique ne sont pas ouverts
par ces nouveaux scénarios.

Le premier essai cherchait les URL `data:` dans les styles, alors que
`useMediaUrl` les transforme en URL Blob. Les six scénarios existants passaient ;
les deux nouveaux échouaient sur ce sélecteur. La préparation utilise désormais
les copies du corpus jetable et leurs adresses `gmos://`, puis les deux nouveaux
scénarios passent. Aucun changement du résolveur de médias n'a été nécessaire.

## Reprise

Dixième lot réalisé et documenté, **non commité** : deux fichiers de crochet/tests,
un scénario Electron et cinq documents (dont la reprise du neuvième lot).
À la fin de ce lot, quinze fichiers de Codex étaient non commités (neuvième et
dixième lots). Le QR réseau et le verrou de souris sont depuis traités dans
le [onzième lot](2026-10-08-lint-reseau-et-souris.md), sans publication des
précédents. L'ensemble porte maintenant **21 fichiers non commités** : quatorze
de code/tests et sept documents. Préserver les changements antérieurs de Claude ;
une publication exige une demande explicite de David.

Reprendre les notes privées, puis les notifications, dés et projections,
écran par écran. Le typage des autres domaines et des faux objets de tests vient
après. Les durées des dés, fondus et notifications restent des contrats à préserver.
