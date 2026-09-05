# 📱 Tablet Hub — usages avancés

Cette page s'adresse aux **joueurs**. Pour brancher les tablettes et comprendre les onglets, voir
d'abord le [guide du Tablet Hub](./61-Tablette-des-joueurs.md).

---

## 🔌 Se connecter

Le meneur affiche un QR code depuis le bouton **Connecter Joueurs** de sa barre du haut. Scannez-le,
ou tapez l'adresse affichée dessous :

```text
http://<adresse-du-MJ>:3001/?window=tablet
```

> ⛔ **Correction.** Cette page donnait `http://[IP-DU-MJ]:3000/hub`. **Ni le port ni le chemin
> n'étaient bons** — un joueur qui suivait ce guide n'arrivait nulle part. Le port applicatif est
> **3001**, et c'est le paramètre `?window=tablet` qui ouvre le Hub joueur.

Choisissez ensuite votre personnage. **Un seul appareil par personnage** : si la fiche est déjà
prise, demandez au meneur de libérer les connexions.

---

## 📇 Votre fiche

Bouton **Fiche**, en bas à droite. Elle s'affiche au format de votre jeu — Cthulhu Hack, Cyberpunk,
Rêves de Dragons — et non dans une présentation générique.

Vos **points de vie et vos statistiques** suivent en direct ce que fait le meneur : une blessure
appliquée de son côté apparaît sur votre écran sans rien rafraîchir.

---

## 📝 Vos notes privées

Bouton **Notes**.

- **Enregistrement automatique** : 1,5 seconde après votre dernière frappe. Une icône de nuage
  confirme brièvement l'envoi. Rien à valider.
- **Persistance** : les notes appartiennent à votre personnage et vivent dans la campagne. Vous les
  retrouverez à la séance suivante.
- **Qui les lit** : vous, et **le meneur** depuis son cockpit. Les autres joueurs n'y ont pas accès.

---

## 🎒 Votre inventaire

Onglet **Inventaire**.

| Geste | Ce qui se passe |
| :--- | :--- |
| **Donner** | Choisissez un destinataire parmi les personnages joueurs. L'objet passe en **attente** (icône d'horloge). |
| **Jeter** | Confirmation obligatoire, puis l'objet disparaît — de votre sac et de la fiche que voit le meneur. |

> ⚠️ **Un don n'est pas immédiat.** Tant qu'il est en attente, l'objet reste chez vous avec son
> horloge. Il ne change de main qu'une fois l'échange validé — et le destinataire reçoit alors une
> notification, l'objet arrivant tout seul dans son sac.

Vous pouvez aussi **modifier votre inventaire à la main** depuis la fiche : le changement part chez
le meneur dès que vous quittez le champ.

---

## 🃏 Vos cartes

Onglet **Cartes**. C'est votre main : les cartes qu'un paquet vous a données et que vous gardez.

> 🔎 **La pastille rouge sur l'onglet compte les cartes qu'on vous tend.** Un don de carte demande
> votre réponse — c'est vous qui l'acceptez, personne ne peut le faire à votre place. L'onglet se
> signale donc même fermé.

→ [Guide de Deck-OS](./37-Deck-OS-les-cartes.md)

---

## 💬 Messages et indices

**Messages** ouvre la messagerie, avec trois zones distinctes :

- le **canal général**, pour le groupe et les annonces du meneur ;
- le **canal du meneur**, pour vos échanges privés avec lui ;
- les **canaux privés**, pour parler à un autre joueur.

Un message reçu pendant que vous êtes ailleurs fait apparaître une notification en bas de l'écran ;
cliquez dessus pour sauter dans la bonne conversation. Le compte des non-lus s'affiche sur le
bouton.

**Les indices** révélés par le meneur arrivent dans l'onglet **Archives**, avec leur image. Ils y
restent : c'est votre mémoire d'enquête.

---

## 🗺️ Les lieux et les visages

- Onglet **Lieux** — l'Atlas de la campagne. Chaque lieu découvert reste consultable.
- Onglet **PNJ** — le trombinoscope. Tous les personnages que le meneur a rendus publics, avec leur
  portrait et leurs informations publiques. *L'outil qui évite « c'était qui, déjà, le type de la
  taverne ? »*

Les deux se remplissent tout seuls : dès que le meneur rend un lieu ou un PNJ visible, il apparaît
sur toutes les tablettes.

---

## ⚔️ Pendant un combat

L'ordre d'initiative s'affiche en surimpression dès qu'un combat est ouvert. Sur mobile, un bouton
**Initiative** en haut de l'écran l'ouvre et le referme pour libérer la place.

---

## 🎲 Les jets de dés

Quand le meneur projette un jet, il occupe tout l'écran **cinq secondes**. →
[Guide de la projection des dés](./35-Projeter-un-jet.md)

---

## 🚪 Quitter

Le bouton **Quitter**, tout à droite, demande confirmation puis **libère votre personnage**. Faites-le
en fin de séance : sans quoi la fiche reste verrouillée, et le meneur devra la débloquer avant que
quiconque puisse la reprendre.

---

> ⛔ **Une mention retirée.** Cette page annonçait une « taille de police réduite de 15 % pour le
> confort sur tablette ». La réduction existe, mais ce n'est pas un réglage de tablette : c'est la
> taille de base de **toute l'application**, meneur compris. Rien de spécifique au Hub.

---

*Guide révisé le 2026-09-04, code à l'appui. L'adresse de connexion était fausse sur le port et sur
le chemin. Ajouté : les cartes en main et leur pastille, les indices dans les Archives, le
trombinoscope, l'Atlas, l'ordre d'initiative, et ce que fait vraiment le bouton Quitter.*
