# 📱 Guide Utilisateur : GM Remote Control

La **GM Remote Control** est une Web App responsive qui transforme n'importe quel appareil mobile (smartphone, tablette) en une surface de contrôle tactile pour **GM-OS**.

## 🚀 Connexion Initiale

1.  Sur votre PC, ouvrez les **Paramètres** (icône engrenage).
2.  Allez dans l'onglet **Télécommande**.
3.  Vérifiez que le statut affiche "Serveur WebSocket Actif".
4.  Scannez le **QR Code** avec votre appareil mobile.
5.  L'interface de contrôle s'ouvre automatiquement dans votre navigateur mobile.

> 🔎 **Le QR code porte un jeton d'appairage.** L'adresse se termine par `#token=…` : c'est lui qui
> autorise l'appareil. Recopier l'adresse sans ce fragment ne suffit pas — scannez le code, ou
> copiez la ligne entière.

---

## 🕹️ Fonctionnalités Mobiles

> ⛔ **Ce guide décrivait cinq panneaux. Il y en a sept**, et il manquait **celui qui s'ouvre en
> premier**. Corrigé le 2026-09-04.

### 1. 🗂️ Pads — l'onglet par défaut

Une grille de raccourcis, remplie automatiquement avec deux choses et deux seulement :

- **Jusqu'à cinq morceaux** de la playlist active de Music-OS ;
- **Jusqu'à huit thèmes d'ambiance**, avec leur univers en sous-titre ;
- **Jusqu'à douze images** marquées en favori dans Image-OS — avec leur vignette.

Un appui lance le morceau, démarre l'ambiance, ou projette l'image.

> ✅ **Les ambiances sont arrivées le 2026-09-04.** La grille n'en recevait aucune, et le code qui
> savait en lancer une était donc inatteignable. Un appui **charge le thème et démarre ses pistes**
> — celles qui ont un fichier et un volume.

> ⚠️ **Les bruitages ne sont pas ici** : ils ont leur propre onglet, **Sons**.

### 2. 🎲 Dés
- Lancez des dés (D4, D6, D8, D10, D12, D20, D100) d'une simple pression.
- Le résultat s'affiche instantanément sur l'écran de votre PC.
- Utilisez le bouton **Vider** (rose) pour nettoyer l'historique des lancers sur le PC.
- **Système actif** *(corrigé le 03/09/2026)* : quand une campagne est ouverte, le pad affiche le jeu en cours et un bouton **Lancer Système** qui applique ses règles — au lieu d'un jet manuel. Cette carte existait dans l'interface mais ne s'était **jamais** affichée : le système de jeu n'était pas transmis à la tablette, et tout jet parti d'un appareil mobile était donc un jet manuel.
- **Dés échelonnés** : si le jeu en lance (Blade Runner), la tablette propose les **lettres** — attribut, compétence, équipement — et le modificateur d'avantage ou de désavantage. Basculer en **mode manuel** reprend la main sur le système.

### 3. 🔊 Sons
- **Synchronisation** : Les boutons affichent les vrais noms de vos Pads configurés sur PC.
- **Volume Maître** : Ajustez le volume général de l'ordinateur via le slider tactile.
- **STOP ALL** : Bouton d'urgence pour couper tous les sons instantanément.

### 4. 🎬 Scénario
- Retrouvez toutes les séquences de votre **Master Storyboard**.
- Lancez une scène (Musique + Lumières + Image + Map) sans toucher à votre souris.
- Idéal pour les changements d'ambiance en plein milieu d'une description.

### 5. ⚔️ Combat
- Suivez l'ordre d'initiative en direct.
- Le personnage dont c'est le tour est mis en évidence (lueur dorée).
- **Gestion des PV** : Modifiez les points de vie des monstres et des joueurs via les boutons `+` et `-`.
- **Tour Suivant** : Faites progresser l'initiative d'un simple geste.

### 6. ✏️ Tableau

**La télécommande sait dessiner.** Un canevas tactile relayé vers Whiteboard-OS : vous croquez un
plan sur le téléphone, il apparaît sur le tableau du meneur — et de là, sur l'écran des joueurs si
vous le projetez. → [Guide de Whiteboard-OS](./Whiteboard_OS_User_Guide.md)

*Absent de ce guide jusqu'au 2026-09-04.*

### 7. 📑 Notes
- **Synopsis** : Lisez le résumé public de la session pour les joueurs.
- **Secrets MJ** : Accédez à vos notes privées et aux intrigues secrètes de la session active.
- **Lecture Confortable** : Interface optimisée pour la lecture en environnement sombre.

---

## 🔧 Dépannage (Troubleshooting)

### Écran Noir sur la tablette ?
- Vérifiez que votre tablette est sur le **même réseau WiFi** que votre PC.
- Assurez-vous que le Pare-feu de Windows autorise les connexions sur le port **5173** (Vite) et **3001** (WebSocket).
- Si l'IP change, rafraîchissez l'onglet Télécommande sur le PC et scannez le nouveau QR Code.

### Les noms des scènes ne s'affichent pas ?
- Vérifiez qu'une **Campagne** et une **Session** sont bien actives sur le PC.
- Appuyez sur un bouton (ex: dé) pour forcer une resynchronisation.

---

> [!TIP]
> **Expérience Tactile** : Ajoutez l'URL de la télécommande à l'écran d'accueil de votre smartphone (Option "Ajouter à l'écran d'accueil" de Chrome/Safari) pour l'utiliser comme une véritable application native sans les barres du navigateur !

---

*Guide révisé le 2026-09-04, code à l'appui. **Deux panneaux sur sept manquaient**, dont **Pads**,
celui qui s'ouvre en premier, et **Tableau**, qui permet de dessiner depuis le téléphone. Précisé :
ce que la grille de pads contient réellement (cinq morceaux, douze images favorites, et rien
d'autre), et le **jeton d'appairage** que porte le QR code.*
