# 📖 Par où entrer dans GM-OS

GM-OS est un ensemble de modules qui se partagent une campagne. Ce guide dit **ce que chacun fait
en une phrase**, et dans quel ordre les découvrir. Pour le détail, chaque module a son guide —
tous sont listés dans [l'index](./00_Documentation_Index.md).

---

## 🚪 Les trois écrans qu'il faut connaître d'abord

| Écran | Ce qu'il est |
| :--- | :--- |
| **Session-OS — le cockpit** | Votre tour de contrôle : les campagnes, les séances, les personnages, et l'accès à tout le reste. |
| **Le Tablet Hub** | Ce que vos joueurs voient sur leur tablette : fiche, inventaire, cartes, messages. |
| **Forge-OS** | Là où l'on décrit un jeu à GM-OS (la Forge Système) et où l'on transforme un scénario en objets jouables (la Forge de campagne). |

**Le premier soir**, vous n'avez besoin que du premier.

## 🧭 Ce que fait chaque module

### Préparer

- **La trame** — actes et scènes : le plan de la campagne.
- **La Forge de campagne** — un scénario écrit devient des actes, des scènes, des PNJ, des lieux.
- **NPC-OS** — improviser un PNJ, un lieu, une rumeur.
- **Map-OS, le plateau tactique** — la carte de combat : pions, brouillard de guerre, zones de
  danger, projetée en direct chez les joueurs.
- **L'Atlas** — autre chose : la galerie des *lieux* de la campagne, que les joueurs consultent
  depuis l'onglet Atlas de leur tablette.
- **Les Indices** — les secrets, à qui ils sont liés, quand ils tombent.
- **Obsidian** — vos notes de préparation, branchées sur l'Oracle.

### Jouer

- **Combat-OS** — initiative, santé, effets, tour par tour.
- **Dice-OS** — le pupitre de dés, y compris les mécaniques exotiques.
- **Clock-OS** — le temps, les minuteurs, les horloges de tension.
- **Deck-OS** — les paquets de cartes, et celles qu'un joueur garde en main.
- **Table-OS** et **Loot-OS** — les oracles qu'on consulte, et le butin qu'on distribue.
- **Le Journal** — ce qui s'écrit tout seul pendant que vous jouez.

### L'ambiance

- **Music-OS**, **Ambient-OS**, **Sound-OS** — les musiques, les paysages sonores, les bruitages.
- **Image-OS** — projeter une illustration, un portrait, une carte.
- **Light-OS** — les lumières Philips Hue.
- **Voice-OS** — transformer votre voix pour incarner un PNJ.
- **Le Storyboard** — enchaîner son, lumière et image en un seul geste.
- **L'afficheur Ulanzi** — le petit écran 32 × 8 posé sur la table.

### L'intelligence artificielle

- **L'Oracle** — poser une question à un modèle qui connaît **votre** corpus, en local (Ollama) ou
  à distance.
- **Le Cortex** — l'assistant tactique : il observe la table et suggère.

---

## 🎙️ Donner une voix à un PNJ

Sur la fiche d'un PNJ — dans la galerie de campagne comme dans NPC-OS — un bouton propose des
réglages de voix d'après ses notes, et un second les repose plus tard.

⚠️ **Ce n'est pas une synthèse vocale** : GM-OS ne parle pas à votre place. Il transforme **votre**
voix. → [Guide Voice-OS](./Voice_OS_User_Guide.md)

## 📱 Brancher une tablette

1. Ouvrez le **QR Code** depuis la barre latérale.
2. Scannez-le avec l'appareil du joueur.
3. Tous les appareils doivent être sur le **même réseau Wi-Fi** que le PC du meneur.

→ [Guide du Tablet Hub](./Tablet_Hub_User_Guide.md)

## 🛠️ Maintenance

**Nettoyage des médias** — GM-OS repère les fichiers devenus orphelins (l'image d'un PNJ supprimé,
par exemple). Vous pouvez forcer une purge depuis les **Paramètres**.

⚠️ Les playlists et ambiances **actives sont protégées** du nettoyage : c'est une garde ajoutée
après une suppression accidentelle de fichiers audio en cours d'usage.

## 🛡️ Vos données sont-elles protégées ?

**Oui, par une sauvegarde locale automatique** — dans `C:\Projet_David\Security_Backup_GMOS`, à
côté du dossier de l'application. Elle se déclenche deux minutes après votre dernier changement, à
la fermeture, avant toute suppression de campagne, et à la clôture d'une séance. Les douze plus
récentes sont conservées.

> ⛔ **Correction d'une affirmation dangereuse.** Cette page annonçait jusqu'au 2026-09-04 une
> « sauvegarde automatique vers GitHub sur une branche isolée `data-sync` ». **Ce mécanisme
> n'existe plus, et il ne faut surtout pas compter dessus** : c'est lui qui, en mars 2026, a
> **vidé l'installation** — la branche visée étant orpheline, git a supprimé tous les fichiers qui
> n'y existaient pas. Il a été retiré et remplacé par la sauvegarde locale décrite ci-dessus, qui
> n'exécute aucune commande de gestion de version, jamais.

→ [Guide de la sauvegarde automatique](./Sauvegarde_Automatique_User_Guide.md)

Pour **emporter** une campagne sur une autre machine, c'est autre chose :
→ [Nexus-OS, export & import](./Nexus_OS_User_Guide.md)

---

*Guide refondu le 2026-09-04. Il datait de mars 2026 et décrivait une sauvegarde qui n'existe plus.*
