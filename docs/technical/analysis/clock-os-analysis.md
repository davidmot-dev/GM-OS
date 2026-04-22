# Analyse : Clock OS (Gestion du Temps et Jauges)

Ce document détaille les fonctionnalités du module **Clock OS** de GM-OS v3. Ce module est essentiel pour la gestion du rythme de la session, allant du simple minuteur aux calendriers fantastiques complexes et aux jauges de tension.

## 1. Description Générale

Clock OS est un module hybride qui gère à la fois le temps diégétique (dans le monde de jeu) et le temps réel (minuteur de pause, durée de session). Il introduit également le concept de "Jauges de Tension" (Progress Clocks) inspiré de jeux comme *Blades in the Dark*.

## 2. Interface Utilisateur (UI)

* **Barre Latérale (Contrôles) :**
  * **Date & Heure :** Sélecteurs pour fixer une heure manuelle (`setStaticMode`) ou revenir à l'heure système.
  * **Calendrier Fantastique :** Menu déroulant pour charger des fichiers JSON de calendriers personnalisés.
    * Contrôles de vitesse (`x1`, `x60`, `x3600`).
    * Boutons d'avance rapide (`+1h`, `+1j`).
  * **Timer (Minuteur) :** Entrée minutes/secondes avec boutons Lancer/Pause/Reset.
  * **Jauges de Tension :** Formulaire de création (Nom + Nombre de segments : 4, 6, 8, 12).
  * **Thème Visuel :** Sélecteur entre `Cyberpunk`, `Médiéval`, et `Moderne`.
* **Affichage Principal (Main) :**
  * **Header :** Sélection de l'écran de projection (Hub ou Écran autonome).
  * **Visualiseur Central :** Affiche l'horloge principale selon le thème choisi.
  * **Grille des Jauges :** Affiche toutes les jauges actives sous forme de cercles segmentés (SVG).
* **Notifications :**
  * Log des changements d'heure, des alarmes et des jauges complétées.
  * **Carillon (Chime) :** Option pour jouer un son de cloche à chaque heure pleine.

## 3. Logique Métier & Comportements

* **Modes de Fonctionnement :**
  * `clock` : Affiche l'heure réelle de l'ordinateur.
  * `static` : Heure et date figées, définies par le MJ.
  * `timer` : Compte à rebours. Déclenche une animation "Alarm Flash" à l'expiration.
  * `fantasy` : Utilise un moteur de calendrier personnalisé.
* **Moteur de Calendrier Fantastique :**
  * Gère des unités de temps variables (ex: mois de durées différentes).
  * Supporte les années bissextiles et mois intercalaires (ex: Shieldmeet).
  * Le temps peut s'écouler en arrière-plan à différentes vitesses.
* **Système de Jauges (Tension Clocks) :**
  * Génération dynamique de cercles SVG divisés en N segments.
  * Chaque segment peut être rempli/vidé par le MJ.
  * Une jauge pleine déclenche une alerte visuelle et sonore.
* **Carillon Algorithmique :**
  * Ne lit pas un fichier MP3 simple, mais génère une "cloche mystique" via le `AudioContext` en combinant plusieurs fréquences (220, 440, 660, 880, 1100 Hz).

## 4. Projection & Synchronisation

* **Player Hub :** Envoie un rendu HTML complet des horloges et des jauges. Les jauges sont placées aux angles de l'écran ou en liste centrale selon le thème.
* **Écrans Autonomes :** Utilise `ipcRenderer` pour envoyer l'état (`state`) de l'horloge à une fenêtre Electron dédiée qui gère son propre rendu.

## 5. Thèmes Visuels (CSS/SVG)

* **Cyberpunk :** Police monospace, néons cyan/rouge, barres de progression numériques.
* **Médiéval :** Style Astrolabe avec anneau zodiacal, icônes Soleil/Lune tournant sur 24h.
* **Moderne :** Horloge analogique classique avec trotteuse fluide et reflets de verre.

## 6. Structure des Données (Calendriers)

Les calendriers sont stockés dans `/calendars/*.json`.
Structure type :

```json
{
  "name": "Harptos",
  "months": [ { "name": "Hammer", "days": 30, "displayName": "Le Gel" }, ... ],
  "hoursPerDay": 24,
  "minutesPerHour": 60,
  "currentYear": 1492,
  ...
}
```
