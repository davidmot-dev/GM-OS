# Analyse : Light OS (Contrôleur d'Ambiance Philips Hue)

Ce document recense exhaustivement les fonctionnalités du module **Light OS** de GM-OS v3. Ce module domotique permet de transformer la pièce de jeu via des éclairages intelligents ("Philips Hue" ou autre pont compatible API locale).

## 1. Description Générale

Light OS est un pont de contrôle domotique. Il gère la connexion locale au hub physique de la pièce, détecte les lampes disponibles, et permet de configurer jusqu'à 18 "Scènes" (Ambiances lumineuses) sauvegardables. Sa grande force réside dans son **moteur d'effets logiciels temps-réel**.

## 2. Interface Utilisateur (UI)

* **Barre Latérale (Aside - Connexion & Lampes) :**
  * **Zone d'État Hue :** Affiche le statut actuel (ex:"🟢 Connecté (192.168.1.50)").
  * Bouton "Chercher un Pont Hue" : Recherche automatique (UPnP / Cloud Discovery).
  * Bouton "IP Manuelle" : En cas d'échec de la découverte auto (fréquent).
  * Bouton de Désynchronisation : Efface les identifiants Hue locaux.
  * **Test Zone (Apparaît si connecté) :**
    * Bouton d'extinction générale.
    * Sélecteur "Luminosité Globale".
    * Boutons d'action urgents appelés "Flash" (Éclair Blanc, Critique Rouge, Magie Bleue).
  * **Liste des Capteurs (`lights-list`) :** Chaque lampe détectée possède sa ligne avec :
    * Un color picker natif (pour choisir sa couleur absolue).
    * Un slider de luminosité.
    * Un sélecteur d'**Effet** (`effect-selector`).
    * Boutons d'allumage/extinction individuels.
* **Affichage Principal (Main - Les 18 Ambiances) :**
  * Une grille de 18 tuiles (`web-pad`).
  * **Contrôles d'une Tuile :**
    * "📸" (Capturer) : Sauvegarde l'état ACTUEL de toutes les lampes de la pièce dans la tuile sélectionnée.
    * "✏️" (Renommer), "🎨" (Couleur de la tuile), "✖" (Vider).
    * Si un effet d'animation est assigné à la tuile, une icône "✨" apparaît à la place de "🎭".
  * **Actions d'En-tête :**
    * **Sélecteur "Fondu" :** Temps de transition (Instant, 2s, 5s... 30s) appliqué lors du passage d'une ambiance à une autre.
    * "📂 / 💾" (Presets JSON).
    * "⌨️ Clavier" : Mode Key Learn pour déclencher une ambiance d'une simple touche.

## 3. Logique Métier & Comportements

* **Système de Connexion (Jumelage Hue) :**
  * Stocke l'IP du pont et le `username` API dans un fichier `Save/hue_config.json`.
  * La procédure de jumelage (`pairBridge()`) détecte les erreurs 101 (Link button not pressed) pour faire clignoter un visuel demandant d'appuyer sur le gros bouton physique du pont Hue.
  * Essaie l'HTTP puis l'HTTPS (car les nouveaux ponts Philips rejettent l'HTTP).
* **Le Moteur d'Effets Logiciels (`startSoftwareEffect`) CRUCIAL :**
  * L'API native Philips Hue ne propose que peu d'effets ou des effets statiques. Or, Light OS simule de l'animation **en envoyant des signaux en boucle au pont (via `setInterval`)**.
  * *Effets intégrés (mathématiques pures) :*
        1. `candle` (Bougie) / `fire` (Feu de camp) : Scintillements de luminosité aléatoires + Micro-variance des couleurs orange/rouge (fonction `applyXyVariance`).
        2. `lightning` (Orage) : 94% de chance d'être gris foncé, 6% de chance de faire un flash aveuglant blanc instatané.
        3. `police` : Clignote rouge/bleu non-stop.
        4. `arcane`, `radiation`, `breathing` : Utilisation de $\cos/\sin$ pour faire "respirer" la luminosité de la lampe sur une couleur précise (Vert toxique, Violet Mystique...).
        5. `glitch` / `tv` : Scintillements très rapides (faible intervalle) simulant un vieux tube cathodique ou une panne.
        6. `warp` : Modifie la couleur (`effectState.step`) le long de l'espace RGB très rapidement.
        7. `underwater` : Ondulation avec un décalage de teinte bleu/cyan.
        8. `dragon` : Oscille rapidement la luminosité entre le jaune et le rouge intense (souffle).
        9. `holy` : Très légère pulsation d'une lumière d'un blanc pur/doré (très lente).
        10. `neon` : Imite un néon clignotant avant de s'allumer ou s'éteignant par intermittence.
        11. `heartbeat` : Deux pulsations rapides (rouge) suivies d'une longue pause sombre (battement de cœur).
        12. `flashlight` : Lampe torche vacillante (forte lumière qui baisse brusquement par moment).
    * *Effet natif Philips Hue :*
        1. `colorloop` (Boucle Multicolore) : Seul effet non-simulé en JS, c'est une commande directe de l'API Hue qui fait tourner la couleur en boucle douce.
* **Fonction de "Flash" (`triggerFlash`) :**
  * Enregistre silencieusement l'état de toutes les lumières.
  * Force toutes les lumières en Blanc, Rouge ou Bleu éclatant (transition 0).
  * Une seconde plus tard, restaure les nuances de la sauvegarde (et relance même les animations logicielles si elles étaient en cours). Idéal pour un coup d'épée épique inattendu.
* **Espace de couleur CIE :**
  * Les lampes connectées n'utilisent pas le format `#RRGGBB` mais un plan colorimétrique bidimensionnel "X/Y".
  * Le module intègre un gros convertisseur `hexToXy()` avec correction Gamma lourde pour être précis.

## 4. Écosystème & Interconnectivité

* **Reçoit de Sound OS :**
  * Il contient la méthode clé `restoreActivePad()`.
  * Quand le MJ clique sur une "Scène", Light OS la mémorise comme étant la scène "Normale" (`activePad`).
  * Si un son d'alerte dans "Sound OS" déclenche la scène "Lumières Rouges", à la fin du son, Sound OS appellera `restoreActivePad()` et la pièce repassera toute seule dans l'éclairage de la taverne !
