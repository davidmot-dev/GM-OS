# 📖 Guide général

GM-OS est un ensemble de modules qui se partagent une campagne. Ce guide dit **par où entrer et
dans quel ordre découvrir**. Pour le détail, chaque module a son guide — tous sont listés dans
[l'index](./00-Index-des-guides.md).

> 🧭 **Vous ne savez pas encore ce qu'est GM-OS ?** Commencez par
> [GM-OS en bref](./02-GM-OS-en-bref.md) : le but de l'application, son vocabulaire, et ce que fait
> chaque module en deux phrases.

---

## 🚪 Les trois écrans qu'il faut connaître d'abord

| Écran | Ce qu'il est |
| :--- | :--- |
| **Session-OS — le cockpit** | Votre tour de contrôle : les campagnes, les séances, les personnages, et l'accès à tout le reste. |
| **Le Tablet Hub** | Ce que vos joueurs voient sur leur tablette : fiche, inventaire, cartes, messages. |
| **Forge-OS** | Là où l'on décrit un jeu à GM-OS (la Forge Système) et où l'on transforme un scénario en objets jouables (la Forge de campagne). |

**Le premier soir**, vous n'avez besoin que du premier.

## 🧭 Ce que fait chaque module

**Cette liste a déménagé** — elle vit désormais dans [GM-OS en bref](./02-GM-OS-en-bref.md), avec
deux phrases par module au lieu d'une.

> ⭐ *Elle n'a pas été recopiée, elle a été déplacée.* Deux listes du même contenu finissent
> toujours par diverger, et le jour où elles se contredisent on ne sait plus laquelle croire.

## 🎙️ Donner une voix à un PNJ

Sur la fiche d'un PNJ — dans la galerie de campagne comme dans NPC-OS — un bouton propose des
réglages de voix d'après ses notes, et un second les repose plus tard.

⚠️ **Ce n'est pas une synthèse vocale** : GM-OS ne parle pas à votre place. Il transforme **votre**
voix. → [Guide Voice-OS](./74-Voice-OS-la-voix.md)

## 📱 Brancher une tablette

1. Ouvrez le **QR Code** depuis la barre latérale.
2. Scannez-le avec l'appareil du joueur.
3. Tous les appareils doivent être sur le **même réseau Wi-Fi** que le PC du meneur.

→ [Guide du Tablet Hub](./61-Tablette-des-joueurs.md)

## 🛠️ Maintenance

**Nettoyage des médias** — un bouton des **Paramètres** supprime les fichiers devenus orphelins
(l'image d'un PNJ supprimé, par exemple). **Rien ne tourne automatiquement** : tant que vous ne
pressez pas ce bouton, aucun média n'est jamais effacé tout seul.

Depuis le 2026-09-04, il **analyse d'abord** et vous nomme les fichiers concernés ; la suppression
est un second geste. Le panneau de détails d'un média dit désormais **qui s'en sert**.
→ [Guide du Media Hub](./92-Media-Hub.md)

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

→ [Guide de la sauvegarde automatique](./91-Sauvegarde-automatique.md)

Pour **emporter** une campagne sur une autre machine, c'est autre chose :
→ [Nexus-OS, export & import](./90-Nexus-OS-emporter-une-campagne.md)

---

*Guide refondu le 2026-09-04. Il datait de mars 2026 et décrivait une sauvegarde qui n'existe plus.*
