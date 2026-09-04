# Manuel Utilisateur : Assistant Tactique (Cortex)

*(Capture « Header Cortex AI » — perdue lors du déplacement du projet.)*

Le **Cortex** est un module d'intelligence artificielle intégré à Map-OS. Il assiste le MJ en analysant la situation tactique sur l'atlas et en suggérant des approches stratégiques pour les PNJs et les monstres.

---

## 🚀 Mise en Route rapide

1.  Ouvrez **Map-OS** (Atlas).
2.  Cliquez sur l'icône **Brain** dans la barre d'outils pour ouvrir le panneau Cortex.
3.  Assurez-vous qu'un combat est actif ou que des pions sont présents sur la carte.
4.  Cliquez sur le bouton **"Analyser"**.

## 🧠 Comprendre l'Analyse

Le Cortex génère deux types de retours simultanément :

### 1. Narration Stratégique
Un court texte décrivant l'ambiance et l'opportunité principale. Parfait pour donner du corps à vos descriptions de round.
*Exemple : "L'ennemi semble hésitant. Une ouverture se crée sur le flanc gauche alors que les PJ se regroupent."*

### 2. Conseils Tactiques
Des fiches d'action spécifiques classées par priorité :
- 🔴 **Urgence (Priorité 3-5)** : Menace immédiate ou opportunité de victoire.
- 🟡 **Opportunité (Priorité 2)** : Mouvement stratégique ou sort de zone optimal.
- ⚪ **Conseil (Priorité 1)** : Rappel de capacités ou placement défensif.

---

## 🎛️ Panneau de Contrôle Compact

Le bas du panneau regroupe vos outils matériels :

- **Sensors** : Active ou coupe le retour audio du module AI.
- **Auto** : Active/Désactive l'Auto-Dispel (si supporté par votre GameDriver).
- **Test** : Lance une séquence audio de test pour vérifier le branchement du serveur audio.
- **Flash** : Déclenche manuellement une alerte visuelle sur vos lampes Philips Hue (Combat Flash).

---

## 💡 Astuces Avancées

- **Liaison Driver** : Le Cortex base ses conseils sur les `aiInstructions` définies dans votre GameDriver. Assurez-vous que votre système de jeu est bien configuré pour des résultats optimaux.
- **Performance Pro** : Grâce au moteur **Parallel Cortex**, vous pouvez utiliser des modèles d'IA très puissants (Gemini Pro) sans ralentir votre partie. Les résultats s'affichent deux fois plus vite qu'en version standard.

---
> [!TIP]
> Si l'IA semble donner des conseils incohérents, vérifiez que vos pions sont bien positionnés sur la grille. Le Cortex utilise les coordonnées réelles pour ses calculs.
