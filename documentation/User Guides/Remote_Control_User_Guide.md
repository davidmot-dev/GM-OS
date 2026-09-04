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

## 🧭 L'écran, refait le 2026-09-05

La télécommande est pensée pour une **tablette tenue en paysage**.

| Où | Quoi |
| :--- | :--- |
| **Colonne de gauche** | Les sept onglets, **avec leur nom écrit** |
| **Ligne du haut** | Ce qui joue en ce moment, et **Tout couper** |
| **Le reste** | Le panneau ouvert |

> ✅ **Le châssis mangeait 35 % de la hauteur** — un en-tête de 104 px pour un titre qu'on connaît
> déjà, et 128 px réservés à une barre flottante qui occupait toute la largeur pour sept petites
> icônes. La navigation est passée à gauche : **en paysage, une colonne ne coûte aucun pixel
> vertical**, et c'est ce qui permet enfin d'écrire les libellés.
>
> Les sept onglets étaient des icônes nues. Leurs noms vivaient dans une infobulle — *c'est-à-dire
> nulle part sur un écran tactile, où l'on ne survole rien.*

> 🔎 **Sur un téléphone**, ou une tablette tenue debout, la colonne redevient une barre en bas. Le
> basculement se fait tout seul à 900 px de large.

### La ligne d'état

Elle affiche, quel que soit l'onglet ouvert :

- le **morceau** en cours et le **thème d'ambiance** chargé ;
- le **round** de combat et le nom de celui dont c'est le tour ;
- le **minuteur**, quand il descend ;
- l'état de la liaison, et un avertissement si la tablette n'est **pas appairée**.

Ce qui n'a rien à dire **disparaît** au lieu d'afficher un tiret.

> ⚠️ **« Tout couper » se tient enfoncé** — sept dixièmes de seconde, avec une jauge qui avance.
> C'est un geste d'urgence, il devait être atteignable depuis n'importe quel onglet ; mais un bouton
> qui coupe tout, à portée de pouce sur une tablette posée entre deux dés, se déclencherait tout
> seul. Relâchez avant la fin et rien ne se passe.

---

## 🕹️ Les sept panneaux

> ⛔ **Ce guide décrivait cinq panneaux. Il y en a sept**, et il manquait **celui qui s'ouvre en
> premier**. Corrigé le 2026-09-04.

### 1. 🗂️ Pads — l'onglet par défaut

Une grille de raccourcis, remplie automatiquement avec deux choses et deux seulement :

- **Jusqu'à cinq morceaux** de la playlist active de Music-OS ;
- **Jusqu'à huit thèmes d'ambiance**, avec leur univers en sous-titre ;
- **Jusqu'à douze images** marquées en favori dans Image-OS — avec leur vignette.

Un appui lance le morceau, démarre l'ambiance, ou projette l'image.

> ✅ **Trois choses ont changé le 2026-09-05.** Les trois familles sont **séparées et nommées** ; un
> **champ de filtre** évite de faire défiler d'une main pendant qu'on décrit une scène (il ignore
> les accents : « foret » trouve « Forêt ») ; et surtout, **les plafonds se disent**. La grille en
> montre au plus 5, 8 et 12 — elle tronquait jusque-là **en silence**, et un meneur avec trente
> favoris en voyait douze sans qu'un mot le lui dise. Elle écrit maintenant « 12 sur 30 ».
>
> Les pads de musique et d'ambiance n'ont pas d'image : ils passent en **lignes compactes** au lieu
> d'un cadre 16/9 vide.

> ✅ **Le point lumineux d'activité fonctionne enfin.** Il était dessiné depuis toujours et **rien ne
> l'allumait jamais** : le flux ne portait pas l'état de lecture. Un pad s'éclaire désormais quand
> son morceau joue, quand son ambiance est en place, ou quand son image est projetée.

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
- **Volume Maître** : une ligne en haut du panneau.
- **Filtre** : au-delà de huit bruitages, un champ de recherche apparaît.

> ✅ **Densifié le 2026-09-05.** Les déclencheurs tenaient en **deux colonnes quelle que soit la
> largeur** — près de cinq cents pixels pour un mot sur une tablette. Ils s'adaptent maintenant
> jusqu'à six colonnes.
>
> ⚠️ **« Tout couper » n'est plus ici** : il est dans la ligne d'état, atteignable depuis tous les
> onglets. Il n'avait rien à faire au fond du troisième.

### 4. 🎬 Scénario
- Retrouvez tous les moments du **storyboard** de la campagne active.
- Lancez un moment (musique, lumières, image, écran) sans toucher à votre souris.
- Idéal pour les changements d'ambiance en plein milieu d'une description.

> ✅ **Densifié le 2026-09-05** : chaque moment occupait une bande de pleine largeur, près de cent
> pixels pour une ligne de texte. Ils tiennent maintenant en deux ou trois colonnes. Le numéro
> reste — *c'est une séquence, l'ordre est une information.*

### 5. ⚔️ Combat
- Suivez l'ordre d'initiative en direct.
- Le personnage dont c'est le tour est mis en évidence.
- **Gestion des PV** : Modifiez les points de vie via les boutons `+` et `-`.
- **Tour Suivant** : Faites progresser l'initiative d'un simple geste.

> ✅ **Densifié le 2026-09-05** : l'en-tête occupait 120 px pour un chiffre et un bouton, alors que
> le round et « Suivant » disent la même chose — *où en est le tour*. Les combattants passent en
> trois colonnes sur une tablette en paysage : une initiative de six tient à l'écran sans
> défilement.

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
ce que la grille de pads contient réellement, et le **jeton d'appairage** que porte le QR code.*

*Puis **l'interface a été refaite le 2026-09-05**, à la demande de David : navigation en colonne,
libellés écrits, ligne d'état permanente, et une passe de densité sur les cinq panneaux. Le châssis
rendait 35 % de la hauteur au contenu ; il en rend moins de 8 %. Trois défauts muets ont été trouvés
en chemin — **les plafonds de la grille tronquaient sans le dire**, **le point d'activité des pads
n'était jamais allumé**, et **rien ne disait ce qui jouait**.*
