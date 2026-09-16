# 🧭 Indices

Le module **Indices** est conçu pour vous aider à gérer les secrets et les preuves de votre campagne. Il centralise tout ce que les joueurs découvrent et permet de l'afficher en un clic sur tous les Hubs.

---

## 🏗️ Création d'un Indice
1. Accédez au **Session-OS** > **Campaignes** > **Ma Campagne** > **Indices**.
2. Cliquez sur **Nouveau Fragment**.
3. Renseignez :
    - **Titre** : Nom de l'indice (ex: "Le Médaillon Sanglant").
    - **Visuel** : Sélectionnez une image via le Media Hub, **ou faites-la générer** (voir plus bas).
    - **Description** : Notez ce que les joueurs découvrent.
    - **Lieu / PNJ Lié** : Liez l'indice à un élément de votre Atlas ou de votre NPC Gallery.
    - **Double Temporalité** (Nouveauté v6) :
        - **Timestamp Automatique** : La date réelle est enregistrée pour le tri technique.
        - **Moment de l'intrigue** : Notez manuellement la cohérence narrative (ex: "An 412, après le sac de Val-Gris") indépendamment de la date de création.

---

## ⭐ L'image d'un indice

*Ajouté le 2026-09-16.* Sous le visuel, un bouton **Générer l'image**. Les PNJ, les cartes et les PJ
avaient leur générateur depuis longtemps ; les indices étaient **les seuls à ne pas l'avoir**.

### Ce qu'il demande : une pièce à conviction

⚠️ **Un indice n'est pas illustré comme un PNJ ou un lieu.** Les autres générateurs demandent une
*illustration* ; celui-ci demande **l'objet lui-même**, photographié : gros plan, fond neutre,
éclairage qui montre la matière et l'usure.

| Si vous écrivez | Vous obtenez |
| :--- | :--- |
| « Une lettre froissée, signée d'un sceau brisé » | La lettre, en gros plan, comme sur une table d'expertise |

*La différence compte :* une scène illustrée montre **où** l'indice a été trouvé ; une pièce à
conviction montre **l'indice**. Le joueur doit croire qu'il pourrait le prendre en main.

> 💡 **Le titre et la description nourrissent l'image.** Plus votre description est concrète — la
> matière, l'usure, ce qui est taché ou brisé — plus l'objet sera crédible. La boîte vous laisse aussi
> **écrire vos propres instructions**, qui remplacent alors entièrement la demande automatique.

> ⚠️ **Pas de texte lisible, volontairement.** Ces modèles écrivent des lettres qui n'en sont pas :
> un parchemin couvert de faux mots attire l'œil dessus et détruit l'illusion. *Mieux vaut un
> document dont on devine l'écriture qu'un document dont on lit le charabia.*

### Deux choses à savoir

- **Enregistrez l'indice d'abord.** Le bouton reste gris sur un indice qu'on est en train de créer :
  la génération écrirait dans le vide.
- ⭐ **Si ça échoue, vous le saurez.** Clé d'API manquante, service indisponible : un message le dit
  et **nomme la cause**. *Avant le 16/09, les trois générateurs échouaient en silence — le voile
  tournait, s'arrêtait, et rien ne se passait. C'est corrigé pour les quatre.*

---

## 👁️ Révélation & Projection
### Révéler un Indice
Par défaut, un nouvel indice est **Masqué**.
- Cliquez sur l'icône **Œil** pour le révéler aux joueurs.
- **Traçabilité Automatique** : La révélation crée instantanément une entrée dans votre **Journal-OS** pour archiver la découverte.
- **Sync Tablette** : Dès qu'il est révélé, l'indice devient consultable par les joueurs sur leurs tablettes dans la section "Archives".

### Projeter vers le Player Hub
Une fois l'indice révélé, cliquez sur l'icône **Externe** (ou via le Deck de Session) pour l'envoyer sur le grand écran des joueurs.

---

## 🎴 Deck de Session (Cockpit MJ)
Pour un accès plus rapide en pleine partie, le **deck d'indices** apparaît en bas du **panneau de séance** — celui qui s'ouvre quand une séance est en cours, et non le cockpit.
- Faites défiler vos indices latéralement sans quitter votre écran principal.
- Utilisez le bouton rapide de projection pour afficher l'indice sur le Hub de manière fluide.

---

## 📱 TabletHub & Archives (Vue Joueurs)
Les joueurs peuvent consulter l'ensemble des indices déjà révélés via l'onglet **Archives** de leur TabletHub.
- Les indices sont triés selon la date de découverte (Timestamp).
- Chaque carte affiche le "Moment de l'intrigue" pour rafraîchir la mémoire narrative du groupe.

---

## 💡 Astuces de Maître de Jeu
- **Liaison Contextuelle** : Si vous ouvrez la fiche d'un PNJ lié à un indice, vous verrez un bouton direct pour consulter ses indices liés.
- **Journal de Session** : Utilisez les notes générées automatiquement comme base pour vos récapitulatifs de campagne hebdomadaires.

---
> ⚠️ **L'image d'un indice échappait au nettoyage des médias** jusqu'au 2026-09-04 : elle passait
> pour un fichier orphelin. C'est corrigé — mais si des illustrations d'indices ont disparu après
> un nettoyage, c'était ça. → [Guide du Media Hub](./92-Media-Hub.md)

---

*Guide révisé le 2026-09-04, code à l'appui : le deck vit dans le panneau de séance, et l'image
d'un indice était un angle mort du nettoyage.*
