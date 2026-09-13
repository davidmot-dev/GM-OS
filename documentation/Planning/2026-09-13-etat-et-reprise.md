# État et reprise — 2026-09-13

> **Base saine.** `tsc -b` propre, **4 394 tests verts** (365 fichiers, 1 ignoré), **164 tests E2E
> verts**, branche `feature/tablet-hub-pwa`, arbre propre.
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

**Tests** : 4 230 → **4 394**. **E2E** : 23 → **164**, un fichier par module.

---

## 1 · Par quoi reprendre

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
  privée d'une étape.

### ⚠️ Échap ne ferme pas les Paramètres

Même famille que la Médiathèque (§ 47), sur un autre écran — et le modal avale alors tous les clics.
**Le nombre de surcouches dans ce cas n'a pas été compté.** *Une famille de défauts ne se referme
pas écran par écran.*

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
