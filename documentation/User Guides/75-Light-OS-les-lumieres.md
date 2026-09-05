# 💡 Light-OS

Le module **Light OS** est votre centre de contrôle domotique dédié à l'immersion. Il intègre vos lumières **Philips Hue** directement dans votre environnement de jeu, permettant de synchroniser l'éclairage de votre pièce avec l'action, la musique et les effets sonores.

![Aperçu du module Light OS](light_mockup.png)

## 📋 Présentation du Module

Light OS transforme vos lampes connectées en véritables accessoires de jeu :

1. **Gestion des Scènes** : Une grille de 18 emplacements pour sauvegarder vos ambiances (Snapshots).
2. **Contrôle en Temps Réel** : Ajustez la luminosité, la température et la couleur de chaque lampe individuellement.
3. **Moteur d'Effets Logiciels** : Déclenchez des animations complexes (Orage, Feu de camp, Stroboscope) non disponibles nativement.
4. **Synchronisation Globale** : Le cerveau de l'OS qui fait le lien entre l'audio et le visuel.

## 🚀 Connexion au Pont (Bridge)

Avant de commencer, vous devez lier GM-OS à votre installation Philips Hue :

1. Cliquez sur le statut de connexion dans l'en-tête (indique "Disconnected").
2. Suivez les instructions : GM-OS va détecter votre Bridge sur le réseau.
3. Lorsque l'OS vous le demande, appuyez sur le bouton physique central de votre **Philips Hue Bridge**.
4. Une fois jumelé, le statut passe au vert ("Connected") et vos lampes apparaissent dans l'interface.

> [!TIP]
> **Réinitialisation (Forget Bridge)** : Si vous changez de pont ou si vous souhaitez réinitialiser la détection automatique, utilisez le bouton **"Forget Bridge"** (icône 🗑️) dans la barre latérale. Cela effacera l'IP du pont et votre clé utilisateur pour repartir sur une installation propre.


## 🎭 Création et Gestion des Scènes

Le système de "Snapshots" vous permet de capturer une ambiance parfaite en quelques secondes :

- **Ajustement Manuel** : Utilisez les curseurs et sélecteurs de couleur pour régler chaque lampe à votre convenance.
- **Sauvegarde** : Cliquez sur l'icône de disquette (💾) sur l'un des 18 emplacements de scène. L'état actuel de toutes les lampes est alors mémorisé.
- **Personnalisation** : Faites un clic droit sur une scène pour changer son nom, son icône (Material Icons) et la couleur de son halo lumineux dans l'UI.
- **Activation** : un clic gauche applique l'ambiance. La transition dure **5 secondes par
  défaut**, réglable dans les options — de l'instantané pour un combat au fondu très lent pour un
  voyage.

## 🪄 Effets Spéciaux (Software Engine)

GM-OS embarque un moteur d'effets ultra-réactif capable de simuler des ambiances dynamiques :

- **🕯️ Bougie / Feu** : Scintillement aléatoire de la luminosité et de la teinte (orangé).
- **⚡ Orage** : Fond noir permanent entrecoupé de flashs blancs aléatoires ultra-rapides.
- **🚓 Police** : Stroboscope alternant rouge et bleu.
- **🔮 Arcane** : "Respiration" lente et intense de la luminosité avec légères variations chromatiques.
- **🌊 Sous l'eau** : Mouvement lent et ondulatoire de la lumière (bleu/cyan).
- **Et trente-quatre autres** : *Glitch*, *Néon défectueux*, *Radiation*, *Souffle de Dragon*,
  *Trou Noir*, *Ruche Alien*, *Terminal Retro*, *Lave Fusion*, *Battement de Cœur*, *Aurore
  Boréale*, *Méditation Zen*, *Le Néant*…

> 🔎 **Il y en a trente-neuf en tout**, là où ce guide en citait quatre et concluait par « etc. ».
> *Grisaille* n'en fait pas partie. La liste complète est dans le sélecteur d'effet de chaque lampe.

## 🔄 Synchronisation Multi-Modules (Sync Mode)

C'est ici que GM-OS révèle toute sa puissance. Si le bouton **Sync** est activé :

- **Music OS** : Lancer une musique "Combat" peut automatiquement passer l'éclairage en rouge.
- **Sound OS** : Déclencher un effet sonore de "Tonnerre" lancera instantanément un flash orageux dans votre pièce.
- **Intelligence de Retour** : Lorsque l'effet sonore ou la musique s'arrête, Light OS est capable de rétablir automatiquement l'ambiance manuelle précédente, évitant que vos joueurs ne restent dans le noir après une action héroïque.

---

## ⚙️ Configuration Avancée

- **Luminosité Globale (Master)** : Un curseur général pour atténuer toute votre installation sans modifier les réglages de chaque scène.
- **Transition Time** : Réglez la vitesse à laquelle les scènes changent (de l'instantané pour les combats au fondu très lent pour les scènes de voyage).
- **Key Learn** : Mappez vos scènes préférées sur les touches de votre clavier pour les changer sans quitter vos notes.

---

> [!WARNING]
> En mode "Sync", les commandes envoyées par les modules audio sont prioritaires. Si vous souhaitez garder le contrôle manuel absolu, désactivez le bouton **Sync** dans les options de Light OS.

---

## 💡 Qui d'autre commande vos lampes

Light-OS n'est pas le seul à parler à votre pont. **Cinq modules** peuvent appliquer une scène, et
c'est utile de savoir lequel a agi quand la lumière change sans qu'on ait rien touché :

| Module | Quand |
| :--- | :--- |
| **Sound-OS** | Un pad peut porter une scène, jouée avec le son |
| **Music-OS** | Un pad de musique, de même |
| **Ambient-OS** | Une piste d'ambiance ; à son arrêt, la lumière **revient** à une autre piste allumée |
| **Map-OS** | Une **zone de danger** où un pion entre |
| **Le Storyboard** | Une séquence, parmi ses six éléments |

⚠️ **Le Stop All de la barre du haut éteint toutes vos lampes** — ce n'est pas qu'un bouton audio.
→ [Tour de contrôle audio](./70-Tour-de-controle-audio.md)

---

*Guide révisé le 2026-09-04, code à l'appui. Précisé : **trente-neuf effets** là où la page en
citait quatre avant un « etc. » — et *Grisaille* n'en fait pas partie. Ajouté : la liste des **cinq
modules** qui peuvent commander vos lampes sans passer par Light-OS, et le fait que le **Stop All
les éteint**. Les 18 scènes, l'appairage du pont et la transition de 5 secondes par défaut sont
exacts.*
