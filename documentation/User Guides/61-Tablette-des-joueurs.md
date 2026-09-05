# 📱 Tablet Hub

Le Tablet Hub transforme une tablette, un téléphone ou un second écran en **poste joueur**. Chaque
joueur y trouve sa fiche, son inventaire, ses cartes, les lieux découverts, les PNJ rencontrés, et
tout ce que le meneur décide de projeter.

Deux guides le couvrent : celui-ci monte la table, le
[guide détaillé](./62-Tablette-des-joueurs-reglages-fins.md) explique ce qu'un joueur y fait.

---

## 🔌 Brancher une tablette

**Le bouton « Connecter Joueurs », dans la barre du haut de GM-OS** (icône Wi-Fi), ouvre un QR code.
Le joueur le scanne, et il est dans le Hub.

> ⛔ **Correction.** Cette page envoyait le meneur dans « Paramètres OS → onglet Télécommande →
> section Nexus Link ». **Ce chemin n'existe pas.** Le QR code est un bouton de la barre du haut.

Ce que le QR code contient : `http://<adresse-du-MJ>:3001/?window=tablet`. Vous pouvez le taper à
la main si le scan échoue — l'adresse s'affiche sous le code.

Toutes les machines doivent être sur **le même réseau Wi-Fi**.

### Choisir son personnage

À la première connexion, le joueur choisit son personnage dans la liste.

- **Un personnage à la fois.** Si quelqu'un l'utilise déjà, la connexion est refusée : c'est ce qui
  empêche deux tablettes de modifier la même fiche.
- **Débloquer** : le meneur peut libérer les personnages depuis le lobby des terminaux.
- **Quitter** (bouton en bas, à droite) libère le personnage pour quelqu'un d'autre.

> [!TIP]
> **Ajoutez le Hub à l'écran d'accueil.** Sur mobile, cela le lance en plein écran, sans barre
> d'adresse — c'est ce qui le fait ressembler à une application.

---

## 🧭 Les six onglets, et les quatre panneaux

La barre du bas est tout le Hub. Six onglets à gauche, quatre boutons à droite.

| Onglet | Ce qu'on y trouve |
| :--- | :--- |
| **Direct** | Ce que le meneur projette en ce moment : PNJ, lieux, images de scène. C'est l'écran par défaut. |
| **Archives** | Les **indices** révélés par le meneur, avec leur image. |
| **PNJ** | Le trombinoscope — tous les personnages marqués « visibles pour les joueurs ». |
| **Lieux** | L'**Atlas** de la campagne : les lieux découverts, à rouvrir quand on veut. |
| **Inventaire** | Le sac du personnage : donner, jeter, consulter. |
| **Cartes** | Les cartes tenues en main (Deck-OS). **Une pastille rouge compte les cartes qu'on vous tend.** |

| Bouton | Ce qu'il ouvre |
| :--- | :--- |
| **Fiche** | La fiche de personnage complète, au format du jeu |
| **Notes** | Les notes privées du joueur |
| **Messages** | La messagerie, avec le compte des non-lus |
| **Quitter** | Libère le personnage, après confirmation |

> 🔎 **Cette page ne décrivait aucun de ces onglets** — ni les indices, ni l'Atlas, ni les cartes en
> main, qui sont pourtant l'essentiel de ce qu'un joueur touche. Ajoutés le 2026-09-04.

---

## 👁️ Ce qui s'affiche tout seul

### L'horloge et les jauges de tension

Elles apparaissent en haut à gauche **si le meneur a laissé la projection allumée dans Clock-OS**,
ce qui est le cas par défaut. Le Hub adopte le thème choisi par le meneur — Moderne, Cyberpunk ou
Old Style.

⚠️ **Les jauges de tension sont donc publiques par défaut**, avec leur nom et leur compte. Voir le
[guide de Clock-OS](./36-Clock-OS-horloges-et-jauges.md).

### Ce que le meneur projette

Dès qu'il projette un PNJ, un lieu ou une image, l'onglet **Direct** l'affiche — sans aucune action
du joueur. Plusieurs éléments s'organisent en grille, et un même personnage projeté par deux
chemins n'apparaît qu'une fois.

### Les jets de dés

Un jet projeté s'affiche en plein écran pendant cinq secondes. →
[Guide de la projection des dés](./35-Projeter-un-jet.md)

### Le combat

Quand un combat est en cours, l'ordre d'initiative apparaît en surimpression. Sur mobile, un bouton
**Initiative** l'ouvre et le referme.

### Le signal de voix

Une barre lumineuse en bas de l'écran réagit à la voix du meneur — de quoi savoir qui parle dans le
noir.

### L'état de la connexion

Une icône Wi-Fi en haut à droite dit si la tablette est synchronisée.

---

## 🛠️ Côté meneur : le lobby des terminaux

Dans les paramètres, le lobby montre en temps réel qui est connecté, avec quel personnage, et la
qualité du signal.

- **Vider les déconnectés** — nettoie la liste des anciens terminaux.
- **Éjecter tout** — déconnecte tout le monde et **libère tous les personnages**. C'est le remède
  quand quelqu'un est bloqué sur une fiche qu'il n'utilise plus.
- Le diagnostic donne l'adresse IP locale et l'état du serveur, sur le **port 3001**.

---

## 🔧 Dépannage

| Problème | Ce qu'il faut regarder |
| :--- | :--- |
| **« Accès refusé : personnage déjà connecté »** | Une autre tablette le tient. Le meneur libère depuis le lobby (*Éjecter tout*), ou le joueur d'avant clique sur *Quitter*. |
| **Le QR code ne mène nulle part** | Les deux appareils ne sont pas sur le même Wi-Fi. Vérifiez l'adresse affichée sous le code. |
| **Pas d'horloge sur la tablette** | Le meneur a éteint la projection dans Clock-OS. C'est un interrupteur unique pour l'horloge, les jauges **et** l'afficheur de table. |
| **Les images n'arrivent pas** | Elles passent par le port 3001. Une tablette connectée sur le port du serveur de développement ne les verra pas. |
| **L'onglet Cartes clignote** | On vous tend une carte : ouvrez-le pour l'accepter ou la refuser. |

---

## 💡 Placer la tablette

> [!TIP]
> **Au centre** si elle sert d'horloge commune et de compteur de tension. **Devant chaque joueur**
> si chacun tient sa fiche et son inventaire. Les deux usages n'ont pas la même position, et le Hub
> sert les deux.

Pour les longues séances, gardez-la branchée : l'écran reste allumé.

---

*Guide refait le 2026-09-04, code à l'appui. Retiré : le chemin de connexion, qui n'existait pas ;
une section entière déformée par des marques de fusion (`+` en début de ligne) et numérotée à
l'envers ; et une promesse de « 60 FPS sous Tauri v2 » — **GM-OS ne tourne pas sous Tauri**, mais
sous Electron, et personne n'a jamais mesuré ces images par seconde. Ajouté : les six onglets et
les quatre panneaux, qui n'étaient décrits nulle part.*
