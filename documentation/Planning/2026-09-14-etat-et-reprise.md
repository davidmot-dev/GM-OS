# État et reprise — 2026-09-14, au soir

> **Base saine.** `tsc -b` propre, **4 536 tests verts** (378 fichiers, 1 ignoré), **174 tests E2E**,
> branche `feature/tablet-hub-pwa`.
>
> ⚠️ **Une exécution E2E complète perd parfois un fichier sur un plantage du rendu** — c'est au
> § 1 bis du registre, ce n'est toujours pas expliqué, et **les trois exécutions complètes du 14 ont
> toutes été vertes**. *Un symptôme intermittent qui ne se produit pas n'est pas un symptôme
> résolu.*
>
> ⛔ **La liste de ce qui reste n'est PAS ici.** Elle vit dans la section ⭐ de
> [`2026-08-23-chantiers-gares.md`](./2026-08-23-chantiers-gares.md), et elle y vit seule.
> Ce document-ci ne dit que **par quoi reprendre** et **ce qu'il ne faut pas repayer**.
>
> Il prend la suite de [`2026-09-13-etat-et-reprise.md`](./2026-09-13-etat-et-reprise.md), qui
> couvrait la soirée du 13 et la nuit du 14.

---

## Ce que la soirée du 14 a produit

| Quoi | Ce qui est entré |
| --- | --- |
| **Le QR-code** | ⛔ **Il envoyait la tablette parler à Vite** : il écrivait le port *applicatif*, pas celui du `SyncServer`. L'adresse porte désormais les deux. La télécommande avait le même défaut, jamais signalé (§ 59) |
| **Les paquets de cartes** | ⛔ **La tablette offrait ceux d'un autre jeu** — elle ne filtrait que sur l'ouverture aux joueurs. La règle vit dans `logic/paquetsDuJeu.ts`, prise au même endroit par les deux écrans (§ 60) |
| **Les personnages** | ✅ **Un PJ passe d'un joueur à un autre**, entier — et presque rien n'a été à écrire pour ça (§ 61) |

⭐ **Trois signalements de David, trois formes de la même phrase** : *« j'ai fait X, et l'écran montre
encore Y »*. Aucun des trois n'aurait été trouvé par relecture.

---

## 1 · Par quoi reprendre

### ⛔ Les trois chantiers du 14 n'ont PAS été éprouvés en réel

C'est la première chose à faire, et elles sont ordonnées :

1. **Rescanner le QR-code** depuis une tablette. **Rien d'autre ne peut être vérifié avant** : tant
   que la tablette parle à Vite, elle ne reçoit ni campagne, ni paquets, ni images. *C'est le
   chantier qui débloque les deux autres.*
2. **Les paquets** : vérifier que « Torg Action », rendu à Torg, a bien disparu de l'onglet Cartes.
3. **Le transfert d'un PJ** : le faire une fois, et regarder que la fiche, les notes et l'inventaire
   sont arrivés avec.

⚠️ **Et le troisième porte un cas qui ne se voit qu'en séance** : transférer un PJ **pendant que
l'ancien joueur est connecté dessus**. GM-OS prévient, il n'éjecte pas — il faut voir si
l'avertissement suffit, ou si l'éjection ciblée manque vraiment.

### ⚠️ Ce qui n'a jamais vu de vrai matériel

Inchangé depuis le 13, et la liste s'allonge d'un point :

- le **fondu des tablettes** (écrit, testé, jamais vu sur une vraie tablette) ;
- la **tenue d'un diaporama sur une soirée entière** — six cents projections à l'heure ;
- ⚠️ **le nouveau** : l'adresse à deux ports n'a été vérifiée qu'en **développement**. En
  production les deux nombres sont égaux, donc le paramètre y est redondant — *il n'y a rien à
  craindre, mais rien n'a été observé non plus.*

### ⚠️ La séquence de storyboard qui s'est mal exécutée

Toujours sans reproduction. L'instrumentation est dans `main.log`. Inchangé.

### ⚠️ Le plantage de rendu d'une exécution E2E complète

Toujours inexpliqué. **Trois exécutions complètes vertes le 14** — ce qui ne prouve rien, et il faut
résister à l'envie d'en conclure quoi que ce soit. Rejouer le fichier seul le rend vert.

---

## 2 · Ce qu'il ne faut pas repayer

⛔ **`remote:get-connection-info` rend DEUX ports, et le mauvais est le plus tentant.** `port` dit
**où charger l'application** — Vite en développement. `mediaPort` dit **où est le `SyncServer`**, et
c'est lui que rejoignent la WebSocket, `/media/`, `/temp/` et `/bouton`. **Trois défauts** sont nés
de cette confusion ; ils sont tous invisibles en production, où les deux nombres sont égaux.

⛔ **Vite accepte une WebSocket quelconque et ne dit jamais rien.** Mesuré : `ws://…:5173` reste
ouverte, zéro message en quatre secondes, quand `ws://…:3001` répond `remote:registered` aussitôt.
*Un refus se voit ; un silence poli ne se voit pas* — et la tablette s'affichait **connectée**.

⛔ **« The Eternal Quest » sur un écran veut dire qu'il n'a jamais reçu l'état du meneur.** C'est
`INITIAL_DATA`, que porte tout magasin neuf. On cherche le **transport**, jamais les campagnes.

⛔ **Une règle énoncée dans un commentaire ne protège que le fichier qui la porte.** *« La seule
défense est de ne composer cette adresse qu'ici »* était écrit depuis la veille, et deux autres
écrans composaient la leur à la main. **Ce qui porte une règle au-delà de son fichier, c'est une
garde.**

⛔ **Vérifier qu'une règle est juste ne protège pas de la règle qu'un second lecteur ignore.** Pour
les paquets, ce qu'il fallait interdire n'était pas un filtre faux : c'était **un second filtre
écrit à la main**.

⚠️ **`system` sur la campagne, `systemId` sur le paquet.** Deux noms pour la même chose. Les
comparer directement donne une comparaison avec `undefined` — toujours fausse, donc une liste vide
que personne ne sait expliquer.

⭐ **Un transfert qui garde l'identifiant n'a rien à réécrire.** Un `PlayerCharacter` ne porte aucun
`playerId` : il appartient à celui dans la liste de qui il se trouve. *Il fallait écrire pourquoi
c'est complet, sinon quelqu'un « complétera ».*

⚠️ **Le verrou d'appareil n'est pas un champ, c'est un reflet.** `connectedCharacters` est recalculé
depuis la liste des clients connectés. *On ne défait pas un reflet ; on le dit.*

---

## 3 · Le diagnostic sans rien demander

⭐ **Les deux défauts ont été compris avant d'ouvrir un écran**, dans la sauvegarde automatique du
soir (`C:\Projet_David\Security_Backup_GMOS\`) :

1. `modules.sessionOS.activeCampaignId` nommait la campagne du soir — donc « The Eternal Quest »
   venait de la tablette, pas du meneur ;
2. les trois `decks` y étaient, avec leur `systemId` et leur `ouvertAuxJoueurs` — et « Torg Action »
   portait l'identifiant du pilote **Blade Runner**.

*Deux minutes de lecture de données écartent la moitié des suppositions.* La sauvegarde automatique,
écrite pour le filet, sert aussi de **sonde**.

⚠️ **Elle dit aussi ce qu'elle ne contient pas** : `activeCampaignName` n'y figure pas — il n'est pas
persisté, et il renaît vide à chaque démarrage. *Un champ absent d'une sauvegarde est un champ qui
ne survit pas au redémarrage, et c'est le seul endroit où cela se lit d'un coup d'œil.*

⭐ **Et une sonde WebSocket se fabrique en trois lignes.** `ws` est déjà une dépendance du projet :
ouvrir une connexion sur chacun des ports candidats, envoyer `remote:register` puis
`remote:request-sync`, et regarder ce qui revient. ⚠️ **Elle doit tourner depuis le dossier du
projet**, sinon `ws` ne se résout pas.

⚠️ **Une telle sonde parle à l'application ouverte** : elle s'enregistre comme un vrai client. Le
dire au meneur — ce n'est pas une copie.
