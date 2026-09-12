# 🟥 Afficheur Ulanzi

Un petit afficheur **32 × 8 pixels** posé sur la table, qui montre l'état de la partie sans que
personne n'ait à regarder un écran d'ordinateur. GM-OS y pousse des **widgets** qui défilent.

---

## 1. Ce que 32 × 8 permet — et interdit

Huit pixels de haut, c'est **une ligne de chiffres**. Pas une phrase, pas un paragraphe : un
nombre, une barre, une icône.

Toutes les idées de widget se ramènent à **quatre types** :

| Type | Ce qu'il montre |
| :--- | :--- |
| **jauge** | Une réserve qui monte et descend. |
| **compte à rebours** | Ce qu'il reste de temps. |
| **rang** | Une position dans une échelle. |
| **icône d'état** | Un fait, présent ou absent. |

> ⭐ **Miroir contre instrument.** Un widget *miroir* montre ce qui vit déjà dans GM-OS — l'horloge
> de tension, le minuteur, une réserve du pilote. Un widget *instrument* est piloté depuis
> l'afficheur lui-même. **Les miroirs sont la règle** : ce qui est déjà décidé ailleurs ne doit
> pas avoir deux maîtres.

## 2. Les six widgets

| Widget | Ce qu'il affiche | Étagère |
| :--- | :--- | :--- |
| **Défilé des Quarts** | Les quarts de *Blade Runner*, avec une couleur par moment du jour et la barre des consécutifs. | composé |
| **Jour d'enquête** | « JOUR 3 », dans la couleur du moment, avec les quatre Quarts du jour en bas. | composé |
| **Horloges** | Les horloges de tension de Clock-OS. | miroir |
| **Minuteur** | Le minuteur en cours. | miroir |
| **Heure du monde** | L'heure de fiction. | générique |
| **Réserves des pilotes** | Les réserves de table du jeu. | miroir |
| **Signal Voight-Kampff** | Un niveau, de bas en haut. | composé |

**Deux étagères, et la différence compte** :

- **Générique** — un des quatre types, nourri par une source déclarée. Ajouter un jeu de plus coûte
  **zéro ligne de code**.
- **Composé** — un dessin qui lui est propre. Ça coûte du code, et il faut le justifier. Le défilé
  des Quarts en est un : ses noms, ses couleurs et sa barre sont propres à Blade Runner. *C'est le
  prix d'un objet qui dit vraiment quelque chose sur 32 × 8.*

Choisissez-en plusieurs : **ils défilent**.

## 3. Deux règles d'affichage qui valent au-delà de ce module

- **Une sélection absente n'est pas une sélection vide.** Un widget dont la source disparaît
  s'affiche **indisponible** ; il ne s'évapore jamais. Une disparition silencieuse se lit comme une
  panne de l'appareil.
- **On ne rend pas réglable ce qui dit quelque chose.** La couleur d'un widget qui code une
  information — rouge = danger — n'est pas un goût.
- **Le caviardage se fait à la source.** Ce qu'un joueur ne doit pas voir ne part pas vers
  l'afficheur ; on ne compte pas sur l'affichage pour le cacher.

## 4. Quand l'écran reste noir

> ⛔ **Un écran noir n'est presque jamais une panne de l'appareil.** Deux réglages en décident, et
> ils vivent **en mémoire flash** — un redémarrage n'y change rien :
>
> - `/api/settings` — les réglages de l'appareil.
> - `/api/loop` — ce qui défile. **`loop={}` veut dire « rien à afficher »**, jamais « en panne ».

Deux autres causes rencontrées en vrai :

- **Un appareil qui vient de démarrer refuse les écritures.** Laissez-lui le temps.
- **Une seconde prise de main** sur un appareil déjà muet empoisonne la routine : un seul maître à
  la fois.

## 5. Les icônes animées

L'appareil expose un **système de fichiers** et sait animer tout seul. Une icône **GIF 32 × 8**
déposée dans son dossier `ICONS` est jouée **par l'appareil**, à pleine vitesse et **sans aucun
trafic réseau**.

> ⚠️ **« Elles restent en flash » ne veut pas dire « elles seront là ».** Le 31/08, le dossier
> `ICONS` s'était vidé tout seul — cadre noir alors que le widget était bien poussé. Le dépôt des
> icônes est donc devenu une **veille** : GM-OS vérifie et redépose.

**Débit mesuré** : lecture ≈ 34 ms, écriture ≈ 150 ms à coût fixe.

## 6. Les trois boutons physiques — par Home Assistant

✅ **ÉPROUVÉ EN RÉEL le 2026-09-13.** La chaîne complète fonctionne — appui sur l'afficheur, MQTT,
Home Assistant, GM-OS.

**Longtemps impossible, ouvert le 2026-09-12.** Mesuré sur le firmware 0.98 : les appuis ne
remontent **pas en HTTP**. Seul MQTT les expose — et un courtier était alors un service de plus à
faire vivre. Un Home Assistant sur le réseau porte déjà ce courtier : la seule raison du gel a
disparu.

### Ce qui se règle dans GM-OS

**Paramètres → Système**, sous les raccourcis clavier. Chaque bouton reçoit un geste :

| Geste | Ce qu'il fait |
| --- | --- |
| **Rien** | le défaut — le bouton garde son comportement d'usine |
| **Tour suivant** | avance l'initiative de Combat-OS |
| **Quart suivant** / **Pause des Quarts** | pilote le défilé |
| **Effacer les dés** | vide le pupitre |
| **Couper tous les sons** | arrête les bruitages |
| **Lancer un jet préréglé** | lance la formule que vous tapez à côté (`1d20`, `2d6+3`…) |

> ⚠️ **Un bouton ne porte aucun argument.** C'est ce qui décide de cette liste : *« pinguer la
> carte »* voudrait des coordonnées, *« déclencher un moment »* voudrait lequel. Le jet préréglé est
> l'exception, et sa formule est figée **au moment où l'on règle**, pas au moment où l'on appuie.

### Ce qui se branche dans Home Assistant

**1 · Sur l'appareil.** Portail de l'Ulanzi → MQTT : l'adresse de votre courtier, son identifiant
et son mot de passe. ⚠️ **Ça ne se configure que là** — aucune requête HTTP ne le fait.

**2 · Les sujets des boutons**, mesurés sur l'appareil de David le **2026-09-13** :

```text
awtrix_73f7a4/stats/buttonLeft      ← bouton gauche
awtrix_73f7a4/stats/buttonSelect    ← bouton du milieu
awtrix_73f7a4/stats/buttonRight     ← bouton droit
```

⚠️ **`awtrix_73f7a4` est le préfixe de CET appareil.** Le vôtre en a un autre. Pour le lire :
*Paramètres → Appareils et services → MQTT → Configurer → Écouter un sujet*, tapez `#`, appuyez sur
un bouton — le sujet se nomme tout seul.

⭐ **Les trois publient, et les trois gardent leur comportement d'usine.** Gauche et droite
continuent de faire défiler les widgets **tout en publiant** : GM-OS ne confisque rien.

⭐⭐ **Et celui du milieu est le meilleur des trois** — parce qu'il ne fait rien sur l'appareil. Les
deux autres ont un travail natif à côté du vôtre ; lui est entièrement libre. *Ce qui ressemblait à
un bouton mort est celui qu'on peut prendre sans rien enlever.*

**3 · Le jeton.** Le bouton **« Copier le jeton »** du panneau le met dans votre presse-papiers —
il n'est jamais affiché à l'écran. À coller dans `secrets.yaml` :

```yaml
gmos_jeton: "le-jeton-copie"
```

**4 · L'appel**, dans `configuration.yaml`.

⛔ **Recopiez l'adresse affichée par le panneau, ligne « Pont : » — ne la reconstituez pas.** Elle
porte l'IP de votre machine **et le port du SyncServer**, qui n'est pas celui qui sert l'interface.
*Le panneau lui-même a annoncé le mauvais port jusqu'au 2026-09-13 : Home Assistant postait sur le
serveur de développement, qui répondait sa page d'accueil sans rien faire, et sans erreur.*

```yaml
rest_command:
  gmos_bouton:
    url: "http://192.168.0.211:3001/bouton"   # ← l'adresse LUE dans le panneau
    method: POST
    content_type: "application/json"
    headers:
      x-gmos-jeton: !secret gmos_jeton
    payload: '{"bouton": "{{ bouton }}"}'
```

**5 · Une automatisation par bouton** — `gauche`, `milieu`, `droite` :

```yaml
automation:
  - alias: "GM-OS — bouton gauche de l'Ulanzi"
    trigger:
      - platform: mqtt
        topic: "awtrix_73f7a4/stats/buttonLeft"
        payload: "1"          # ← NE PAS OMETTRE : voir ci-dessous
    action:
      - service: rest_command.gmos_bouton
        data:
          bouton: gauche
```

> ⛔ **Le filtre `payload` n'est pas un détail : sans lui, chaque pression compte double.**
>
> AWTRIX ne publie pas « on a appuyé », il publie **l'état du bouton** : un message à
> l'enfoncement, un autre au relâchement. Une automatisation sans filtre se déclenche donc **deux
> fois par pression** — deux tours d'initiative passés au lieu d'un, et ça ne se voit qu'à la
> table.
>
> ✅ **Mesuré le 2026-09-13 sur le firmware 0.98** : en maintenant le bouton, HA affiche `1` ;
> au relâchement, `0`. C'est donc **`payload: "1"`** — l'enfoncement.
>
> ⚠️ Sur un autre firmware, refaites les deux secondes de mesure : appuyez en maintenant dans la
> fenêtre d'écoute. *Une valeur recopiée d'un guide ne vaut pas une valeur lue sur son appareil.*

### Trois choses à savoir

⛔ **Le pont transporte un appui, jamais une action.** Home Assistant dit *« on a appuyé à
gauche »* ; c'est GM-OS qui décide de quoi faire. Même si le jeton fuitait, on ne pourrait
déclencher que ce que **vous** avez posé sur vos trois boutons.

⚠️ **« Révoquer les appairages » coupe aussi ce pont.** Le jeton est celui des tablettes : le
régénérer invalide les deux. Il faudra recopier le nouveau dans `secrets.yaml`.

✅ **Les boutons gardent leur défilé natif tout en publiant** — vérifié le 13/09. GM-OS ne
confisque rien à l'appareil.

⚠️ **Si rien ne se passe, coupez le problème en deux.** Dans HA :
*Outils de développement → Actions → `rest_command.gmos_bouton`*, avec `bouton: milieu`, puis
**Exécuter**. Ça réussit ? Le défaut est dans le MQTT. Ça échoue ? HA n'atteint pas votre machine —
adresse, ou **pare-feu Windows** sur le port du SyncServer.

---

## 💡 Ce qu'il faut retenir

- **Des nombres et des barres, jamais des phrases.** C'est la contrainte qui décide de tout.
- **Plusieurs widgets défilent** ; le catalogue se choisit par jeu.
- **Écran noir → regardez `/api/settings` et `/api/loop`** avant de soupçonner le matériel.
- **Les trois boutons servent à quelque chose depuis le 12/09**, via Home Assistant — § 6.
- La conception détaillée vit dans
  [`Planning/2026-08-23-afficheur-ulanzi.md`](../Planning/2026-08-23-afficheur-ulanzi.md).

---

> ⛔ **L'afficheur se rendait à lui-même au premier changement de module.** Trouvé par David le
> 2026-09-05 : *« quand je vais dans un autre module, l'Ulanzi se reset »*. GM-OS charge chaque
> module à la demande, et le temps de ce chargement il masquait **tout son châssis** — y compris le
> battement qui tient l'afficheur, dont l'arrêt lui rend la main. Cela n'arrivait qu'**au premier
> passage** dans chaque module, une fois par lancement : de quoi chercher longtemps.
>
> L'afficheur reste désormais à vous tant que GM-OS tourne. *Le même défaut arrêtait aussi le
> minuteur, déchargeait le modèle d'IA et coupait la lumière qui suit la voix.*

### Le jour d'enquête

**Ajouté le 2026-09-05, à la demande de David.** Le défilé disait *où* on en est dans la journée et
repassait au matin après la nuit — mais rien ne disait **quelle** journée. Une enquête en dure
plusieurs, et le compte s'annonce à la table.

**C'est une seconde application**, à cocher dans le tableau de bord à côté du défilé. L'afficheur
tourne déjà entre ses applications : les deux se succèdent donc à l'écran, **sans une requête de
plus**.

> 🔎 **Pourquoi pas sur la même ligne.** Trente-deux pixels : « JOURNEE » en occupe déjà près de
> trente. Y ajouter « J3 » forcerait le texte à défiler — *et un texte qui défile n'est pas
> consultable d'un coup d'œil.*

- Le jour **avance quand la nuit se referme sur le matin**, jamais autrement.
- ⚠️ **Une pause fait lever le jour elle aussi** si c'est elle qui referme la nuit : le livre dit
  « Pause d'un Quart », donc elle consomme un Quart comme les autres.
- Il lit **le même état que le défilé** — le jour et le Quart ne peuvent pas se contredire.
- Une partie commencée avant cette version repart au **jour 1** : *une valeur absente doit se lire
  comme un début, jamais comme une erreur.*

Le tableau de bord affiche le jour à côté du moment, pour que vous le voyiez sans regarder
l'afficheur.

---

*Guide écrit le 2026-09-04. Le défilé des Quarts a été éprouvé en partie réelle le 2026-08-30 ; la
librairie et les six widgets datent des 30-31/08.*
