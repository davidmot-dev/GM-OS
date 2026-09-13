# État et reprise — 2026-09-13

> **Base saine.** `tsc -b` propre, **4 489 tests verts** (375 fichiers, 1 ignoré), **173 tests E2E**,
> branche `feature/tablet-hub-pwa`.
>
> ⚠️ **Une exécution E2E complète perd parfois un fichier sur un plantage du rendu** — c'est au
> § 1 bis du registre, et ce n'est pas expliqué. Rejouer le fichier seul le rend vert.
>
> ⛔ **La liste de ce qui reste n'est PAS ici.** Elle vit dans la section ⭐ de
> [`2026-08-23-chantiers-gares.md`](./2026-08-23-chantiers-gares.md), et elle y vit seule.
> Ce document-ci ne dit que **par quoi reprendre** et **ce qu'il ne faut pas repayer**.
>
> Il prend la suite de [`2026-09-12-etat-et-reprise.md`](./2026-09-12-etat-et-reprise.md), qui
> s'arrêtait à la mi-journée du 12.

---

## Ce que la soirée du 12 et la nuit du 13 ont produit

| Quoi | Ce qui est entré |
| --- | --- |
| **Les quatre constats** | Coffre Obsidian **réellement** isolé, journal de séance dans les sauvegardes **et** dans l'export Nexus, deux libellés qui mentaient (§ 47) |
| **L'écran bloqué** | ⭐ **Le démarrage ne peut plus se bloquer** : étapes nommées, bornées à 15 s, et `isSystemReady` posé dans tous les cas. Ce n'était ni le splash ni `LoadingOverlay` — c'était le `GM-OS BOOTING...` que personne n'avait nommé (§ 48) |
| **Les boutons de l'Ulanzi** | ⭐ **Le § 4 du registre est vide** : la direction garée le 30/08 s'est rouverte parce que son motif — « un courtier de plus à faire vivre » — a disparu avec Home Assistant. ✅ **Éprouvé en réel** (§ 49) |
| **Le Master Storyboard** | ⛔ **Inatteignable en séance** depuis toujours : classé « préparation », donc renvoyé au cockpit à chaque tentative. *Le défaut et l'impossibilité de le diagnostiquer étaient le même* (§ 50) |
| **Le matériel de table** | ⭐ Les noms des sorties et des écrans **survivent au rebranchement** — ils étaient persistés, mais rangés sous un identifiant qui change. Le routage suit la même signature (§ 51) |
| **La lumière du storyboard** | ⭐ **Elle suit enfin la règle des autres** : un moment sans lumière ramène la pièce à son éclairage normal, et un arrêt aussi (§ 52) |
| **L'instrumentation** | ⭐ Un moment de storyboard **rend des comptes**, moteur par moteur, et distingue « introuvable » de « module non chargé » — *deux silences identiques à la table, deux réparations opposées* |
| **`Ctrl+0`** | ⭐ **Vider l'écran des joueurs d'un geste** (§ 53) — et `FULL_RESET`, reçu par `useHubSync` et **émis par personne** depuis toujours, trouve enfin son émetteur. *Sixième « chaîne complète sans bouton au bout »* |

| **Échap** | ⭐ **La famille entière se referme** (§ 54) : les Paramètres n'étaient pas un écran mais **une trentaine**, tous servis par le même `ModalProvider`. Et le comptage a sorti une **seconde face** — `[role="dialog"]` n'existait que dans deux fichiers, donc une lettre frappée dans la Médiathèque ou la Forge **lançait la pastille de son** |
| **Les diaporamas** | ⭐ **Image-OS sait enchaîner des images** avec un fondu, et un moment de storyboard sait les appeler (§ 55). L'horloge vit chez le meneur : **aucun écran n'a rien eu à apprendre**. La fonctionnalité a servi de banc d'essai à l'ancienne — ⛔ **le fondu entre deux images passait par le NOIR** des deux côtés |
| **Le fondu, après essai** | ⛔ **Il s'animait sur du vide** (§ 56) : l'adresse d'une image arrive **avant l'image**, et l'animation partait sans attendre le décodage. David : *« un temps mort puis un saut »*. On décode d'abord ; **un seul mécanisme pour les deux écrans** désormais |
| **Les noms des moniteurs** | ⛔ Le storyboard affichait **l'étiquette système** au lieu du nom donné par le meneur — alors que le même composant nommait déjà correctement les **sorties audio** (§ 57) |
| **L'ordre des couches** | ⛔ **Mon propre correctif du matin en cachait un** : la couche sortante n'anime rien, donc **ne crée aucun contexte d'empilement** — son `z-10` intérieur s'échappait et **couvrait la nouvelle image pendant tout le fondu**. *Un fondu qui joue caché se voit comme une coupe franche* (§ 56) |
| **La taille des images** | ⛔ **Une `<img>` sans dimension garde sa taille naturelle** — les petites images flottaient au milieu de leur propre flou. *Le « parfois » de David était la définition du fichier* (§ 56) |
| **La sauvegarde** | ⛔ **Image-OS n'y était pas** — ni les pads, ni les dossiers. **Quatrième fois** que cette liste oublie un magasin (§ 55) |

**Tests** : 4 230 → **4 489**. **E2E** : 23 → **173**, un fichier par module.

---

## 1 · Par quoi reprendre

### ⚠️ Le diaporama, **après les deux correctifs du soir**

✅ Premier essai fait : *« cela marche »*, et il a rendu deux défauts antérieurs, corrigés au § 56.
**Ce qui reste à revoir à l'œil** : le fondu passe-t-il maintenant pour un fondu, six secondes
est-ce la bonne durée à la table, et est-ce que ça tient une soirée entière. *Aucun test ne peut
répondre : jsdom n'a pas de moteur de mise en page, et le profil d'essai n'a aucun média.*

### ⚠️ La séquence de storyboard qui s'est mal exécutée

**Toujours sans explication**, et c'est la seule ligne du § 1 bis qui compte. Le § 50 explique
l'écran devenu inaccessible, **pas** l'image absente ni les lumières éteintes.

⭐ **Mais l'incident est désormais instrumenté.** Rejouer la séquence, puis lire `main.log` :

```text
[Storyboard] Moment « … » : Musique=joue Image=introuvable Lumières=module-absent
```

**« introuvable »** = la donnée du meneur a bougé (un média effacé, un pad supprimé).
**« module-absent »** = le magasin n'était pas chargé. *Deux réparations opposées.*

### ⚠️ Ce qui n'a jamais vu de vrai matériel

Trois lignes entrées en P6 le même jour, toutes **écrites et jamais éprouvées** :

- **le débranchement d'une enceinte** — le nom tient-il, la sortie se retrouve-t-elle, l'alerte
  n'apparaît-elle **qu'une fois** ;
- **le retour au Home entre deux moments** — la pièce **clignote-t-elle** (Home puis scène
  suivante) ;
- **le démarrage amputé** — jamais vu se produire ; l'application est-elle vraiment utilisable
  privée d'une étape ;
- **`Ctrl+0` sur un vrai Player Hub** — les tests éprouvent le **départ** du message, jamais son
  arrivée : aucune fenêtre de Hub n'est ouverte dans une instance d'essai.

### ✅ Échap ferme les Paramètres — **clos le 13/09**, voir le § 54

La ligne est sortie par le haut, et **toute sa famille avec elle**. Ce qu'il faut en retenir pour la
suite : son motif de renvoi était *« on n'a pas compté combien d'écrans sont dans ce cas »*, et
c'est ce motif qui l'a levée — il suffisait de compter. *Un motif de renvoi qui dit ce qui manque
est un motif qui se lève ; « plus tard » ne se lève jamais.*

### ⚠️ Le plantage de rendu d'une exécution E2E complète

Nouveau au § 1 bis, **et non expliqué**. `Target crashed`, jamais le même fichier, tous verts
isolément. Six exécutions, dont deux où **la victime tournait avant le changement soupçonné**.

---

## 2 · Les boutons de l'Ulanzi — ce qui est branché

Sujets MQTT **mesurés** sur l'appareil de David :

```text
awtrix_73f7a4/stats/buttonLeft
awtrix_73f7a4/stats/buttonSelect     ← le seul sans travail natif
awtrix_73f7a4/stats/buttonRight
```

⛔ **`payload: "1"` est obligatoire** dans l'automatisation : AWTRIX publie l'**état** du bouton, un
message à l'enfoncement (`1`) et un au relâchement (`0`). Sans filtre, **chaque pression compte
double** — et ça ne se voit qu'à la table.

⭐ Les trois **gardent leur défilé natif tout en publiant** : GM-OS ne confisque rien à l'appareil.

→ Le détail complet, avec la configuration à coller, vit dans
[`76-Afficheur-de-table-Ulanzi.md`](../User%20Guides/76-Afficheur-de-table-Ulanzi.md) § 6.

---

## 3 · Ce qu'il ne faut pas repayer

⛔ **Une garde qui lit des noms doit lire du CODE, pas des commentaires.** Celle des noms d'écran
se validait sur sa propre documentation : le commentaire qui explique le défaut citait la fonction
qu'elle cherchait. *Un appel et une citation ne se distinguent que si l'on retire les commentaires.*
Troisième occurrence du motif.

⚠️ **Une garde qui cherche une FORME de code manque les autres formes.** Chercher le sélecteur
Zustand ne voyait pas le composant qui déstructure le magasin. *Chercher le geste, pas la manière.*

⛔ **L'ordre de deux couches superposées se dit, il ne se devine pas.** Un `z-index` implicite
dépend de qui crée un contexte d'empilement — donc d'une animation, d'une opacité, d'un filtre :
**des propriétés qu'on change pour des raisons visuelles, sans penser à l'ordre.**

⭐ **Un défaut d'empilement se mesure, il ne se raisonne pas.** Quatre hypothèses ; une mesure
`elementFromPoint` en plein fondu, dans le moteur d'Electron, en a gardé une. *Trente minutes de
déduction valaient moins qu'une mesure de deux minutes.*

⭐ **Un symptôme qui distingue le premier cas de tous les autres nomme la chose qui n'existe pas au
premier tour.** *« La première image fond, les suivantes non »* désignait la couche sortante.

⛔ **Une transition qui démarre avant son sujet joue à vide.** Le fondu partait à la seconde où
l'**adresse** de l'image arrivait, pas où l'image était décodée. On décode d'abord — *retarder le
fondu, pas l'allonger.* Et `onload` ne suffit pas : il dit que les octets sont là, pas qu'il y a des
pixels. C'est `decode()`.

⛔ **Une `<img>` sans `w-full h-full` garde sa taille naturelle** ; `object-contain` ne décide rien
sur une boîte sans dimension, et `max-w-[95%]` ne fait que plafonner.

⚠️ **Un défaut qui dépend de la donnée passe pour une lubie de l'écran.** Le « parfois » de
David était la définition du fichier — c'est ce qui a permis à ce défaut de vivre depuis toujours
sans être signalé.

⛔ **Une fonctionnalité nouvelle est un banc d'essai pour l'ancienne.** Le fondu entre deux images
passait par le noir depuis toujours — la sortante démontée côté projecteur, `mode="wait"` côté
Player Hub. *Personne ne pouvait le voir tant que rien n'enchaînait deux images tout seul.*

⛔ **Ce qui coûte peu à la main coûte cher en boucle.** `projectSolo` écrit au journal de séance à
chaque projection : une ligne pour un geste, **dix par minute** pour un diaporama. Trouvé **en
écrivant le guide**, pas en relisant le code.

⚠️ **Une marque lue après un `await` ne dit plus rien.** Celle qui distingue « le diaporama
projette » de « le meneur projette » est remise à faux avant le premier `await`.

⛔ **Une famille de défauts se compte avant de se traiter — et le comptage trouve autre chose.**
En comptant les surcouches sans Échap (40 candidates, 12 concernées), on est tombé sur une
**seconde** face : la garde du clavier cherchait `[role="dialog"]`, présent dans deux fichiers.

⚠️ **Un test qui contourne un défaut le documente sans jamais le signaler.**
`nommerLeMateriel.spec.ts` fermait les Paramètres au bouton *parce qu'Échap ne marchait pas*, et le
disait en toutes lettres.

⛔ **Une famille de défauts se compte avant de se traiter — et le comptage trouve autre chose.**
En comptant les surcouches qui n'écoutent pas Échap (40 candidates, 12 concernées), on est tombé
sur une **seconde** face : la garde du clavier cherchait `[role="dialog"]`, qui n'existait que dans
deux fichiers. *Une garde qui dépend d'un attribut qu'il faut penser à poser ne protège que les
écrans dont l'auteur connaissait la garde.*

⛔ **Une garde écrite à la main qui énumère ses enfants ne garde que les enfants d'aujourd'hui.**
La médiathèque se taisait quand son aperçu ou son éditeur était ouvert — et **aucun des deux
n'écoutait** : personne ne fermait rien. *Énumérer ce qu'on protège, c'est déclarer ce qu'on oubliera.*

⚠️ **Un test qui contourne un défaut le documente sans jamais le signaler.**
`nommerLeMateriel.spec.ts` fermait les Paramètres au bouton *parce qu'Échap ne marchait pas*, et le
disait en toutes lettres. Il passait au vert depuis la veille.

⚠️ **Une règle plus prudente peut être la mauvaise.** Échap devait d'abord rendre la main au champ
de saisie, pour ne pas coûter une fiche à moitié tapée. Le dépôt avait déjà tranché l'inverse
(`SpotlightSearch`, l'éditeur de scène dont le champ est **sélectionné à l'ouverture**). *Deux
frappes pour sortir, c'est exactement ce qui a été signalé comme « Échap ne ferme pas ».*

⛔ **Un lecteur et un écrivain qui n'emploient pas la même clé sont pires que deux écrivains :
personne ne voit rien, et rien ne plante.** Les alias du matériel sont passés à une signature
stable ; les champs de saisie lisaient toujours l'ancienne clé. **Le champ refusait la frappe** —
un champ contrôlé dont la valeur ne change jamais est indiscernable d'un champ en lecture seule.

⛔ **Éprouver la mécanique n'est pas éprouver le geste.** Trente-six tests venaient d'être écrits
sur la signature, la migration et la résolution. Aucun ne faisait **l'aller-retour du meneur** :
taper un nom, le relire. C'est le seul qui aurait vu le défaut.

⛔ **Un champ nommé `port` à côté d'un champ nommé `mediaPort` invite à prendre le premier.** Le
panneau des boutons annonçait l'adresse de **Vite** (5173) au lieu du SyncServer. Home Assistant y
postait, Vite répondait son `index.html` : aucune erreur, aucun effet. *Le commentaire de
`remote:get-connection-info` décrivait ce mode d'échec mot pour mot, deux lignes au-dessus.*

⛔ **Un test de bout en bout ne voit que ce que son environnement distingue.** Celui-là tourne en
production, où les deux ports **sont le même**. Seule une fonction pure, éprouvée sur le cas du
développement, pouvait le garder.

⛔ **Une garde qui part d'une table ne peut pas attraper une erreur DE cette table.**
`portesDuCockpit.test.ts`, écrit le 05/09 contre ce défaut exact, ne parcourt que les vues classées
« les-deux » — et c'est le classement du storyboard qui était faux. **Troisième occurrence du même
mécanisme.**

⛔ **Un `&&` qui protège est un `&&` qui cache.** Chaque effet d'un moment était un `if` silencieux :
magasin absent de `window`, effet sauté **sans un mot**.

⛔ **Une garde qui n'est jamais franchie ressemble à un code qui marche.** `window.useToastStore`
n'est assigné nulle part ; **sept** appels le lisaient derrière un `if (gmToast)`. *« Fichier
d'ambiance introuvable »* était prêt depuis toujours et n'est jamais sorti. ⭐ Le typage l'a prouvé
à la seconde où l'import est devenu statique : **cinq `TS2345`**, les arguments étaient inversés —
*le `any` de `window` cachait une erreur de type.*

⛔ **Une absence dans un relevé partiel n'est pas une absence.** J'ai déclaré le bouton du milieu
muet sur une capture qui n'en montrait que deux. Il publie.

⚠️ **Une garde qui lit des noms ne peut pas lire des intentions.**
`nomsSansEcrivainNiLecteur` a réclamé le retrait d'une tolérance parce qu'un nom était « cité
ailleurs » — la seule citation étant un **commentaire de documentation**. C'est écrit dans son
propre en-tête ; c'en est un cas.

⛔ **Une dégradation doit compiler, sinon elle ne dégrade rien.** Quatre tests E2E sont restés verts
sur un raccourci débranché : `npm run build` est `tsc -b && vite build`, `tsc` a échoué, `vite` n'a
jamais tourné, et Playwright a mesuré **l'ancien `dist`**. *C'est le piège du § 47 retourné — là-bas
un test vert ne pouvait pas rougir à cause d'un chemin mangé par le shell, ici à cause d'un artefact
périmé.*

⛔ **`undefined` et `null` ne veulent pas dire la même chose, et un ternaire ne le dit pas.** Le fond
du Player Hub en dépend : l'un rend la main au décor, l'autre éteint l'écran. `Ctrl+0` posait `null`
et **noircissait tout**. La ligne est devenue `fondDuPlayerHub`, avec ses trois cas nommés.

⛔ **Une doctrine juste appliquée au mauvais endroit reste une erreur** — et elle a l'air d'autant
plus solide qu'elle cite le dépôt. J'ai affirmé « le fond reste » en déduisant d'`imageAvantLeMoment`
(*l'image est le décor, les fiches passent devant*) **au lieu de lire la ligne qui décidait**.

⚠️ **Ne pas lancer `vitest` et Playwright en concurrence.** Un décompte E2E bancal (162 passés,
« 4 did not run », sortie 0) venait de là, et non du code — rejoué seul : **168 passés**. *Un
résultat qu'on n'explique pas se rejoue avant de se raconter.*

⭐ **Une ligne garée avec son motif se rouvre toute seule le jour où le motif tombe.** Les boutons
de l'Ulanzi étaient garés parce qu'un courtier MQTT était « un service de plus à faire vivre ».
Home Assistant en porte un. *Une ligne garée sans motif ne se rouvre jamais.*

⭐ **Devant un symptôme sans reproduction, la question n'est pas « qu'est-ce qui a causé ça ? »**
mais **« quels chemins de ce code peuvent ne jamais finir ? »**. La première demande une scène qu'on
n'a pas ; la seconde se répond en lisant, et elle **se compte** — elle en a rendu trois en vingt
minutes sur une ligne qui avait attendu une journée.

---

## 4 · Le diagnostic sans rien demander

⭐ **Deux mesures ont suffi à écarter GM-OS de la cause**, le 13/09, quand David a dit
*« ça ne marche pas »* :

1. `~/AppData/Roaming/gm-os-v5/logs/main.log` — la dernière ligne dit si l'application tourne, et
   depuis quand. **Aucun `error` ni `warn` depuis le 5 septembre** : donc pas de plantage.
2. Un `POST` sur `/bouton` avec le vrai jeton, lu dans `pairing.json` du profil → `200`,
   `{"recu":"milieu"}`.

*Le côté GM-OS étant hors de cause, il ne restait qu'un champ à relire.*

⚠️ **Un tel essai envoie un vrai appui à l'application ouverte.** Il faut le dire au meneur : ce
n'est pas une copie.
