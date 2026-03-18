# 🎮 Guide Utilisateur : Composants UI Dynamiques (Combat-OS)

Le module Combat-OS s'adapte désormais visuellement à votre système de jeu. Plus besoin de configurer chaque jauge : le système choisit l'esthétique la plus appropriée selon l'ambiance et les règles.

## 🌈 Styles de Jauges Automatiques

Selon le genre de votre jeu (détecté par l'IA ou configuré dans le Driver), les jauges de ressources (PV, Stress, Magie) changeront d'aspect :

| Style | Usage Type | Rendu Visuel |
| :--- | :--- | :--- |
| **Classique (Bar)** | Fantasy, Aventure | Barre de progression fluide avec dégradés. |
| **Segmenté (Boxes)** | Horreur, Rétro | Blocs discrets (idéal pour les cases de Stress ou de Blessure). |
| **Néon (Glow)** | Cyberpunk, SF | Effet de lueur intense avec ombre portée lumineuse. |

## 📐 Affichage de l'Initiative

La liste d'initiative peut désormais basculer entre deux modes :

- **Mode Liste** : Idéal pour les petits groupes ou les ordres linéaires.
- **Mode Grille (Grid)** : Optimisé pour les combats à grande échelle (multi-colonnes) pour voir tous les combattants sans scroller.

## 🤖 Fonctionnement avec la Forge IA

Lorsqu'on génère un nouveau système via la **Forge IA** :
1. Envoyez votre PDF ou texte de règles.
2. L'IA analyse le genre (ex: "Alien RPG").
3. Elle configure automatiquement :
   - Le style `segmented` pour le Stress.
   - Une couleur verte ou jaune "industrielle".
   - Le layout de l'initiative.

## 🛠️ Personnalisation (Avancé)

Si vous éditez un Driver manuellement, vous pouvez modifier l'objet `ui_config` :
```json
"ui_config": {
  "gauges": [
    { "fieldId": "hp", "label": "PV", "color": "bg-red-500", "style": "bar" }
  ],
  "initiativeStyle": "grid"
}
```

---
*Note : Si aucune configuration n'est présente, le système utilise par défaut le style "Classique".*
