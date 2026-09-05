# 🎬 Walkthrough : Social Nexus v2 — Relations & Immersion

Ce walkthrough présente la refonte majeure du **Social Nexus** (Graphe Social) de GM-OS v5. L'objectif était de transformer un simple graphe en un véritable outil tactique et narratif.

## 🌟 Nouvelles Fonctionnalités

### 1. Portraits Dynamiques & Résolution de Médias
Le graphe n'affiche plus de simples bulles colorées, mais les **avatars réels** des PNJ et PJ. 
- **Technique** : Utilisation du `useMediaStore` pour résoudre les IDs `m-xxxx` et les chemins locaux directement dans le Canvas.

### 2. Relations Directionnelles (Asymétrie)
Les relations peuvent désormais être asymétriques. Une flèche indique le sens du sentiment.
- **Exemple** : Lilith Tyrell considère le PNJ comme un allié (Vert), tandis que le PNJ la considère comme une ennemie (Rouge).

### 3. Gestion Tactique des Factions
Un nouveau sélecteur permet de filtrer le graphe par **Faction**.
- **Utilité** : Isoler rapidement les membres d'un gang, d'une corporation ou d'une famille royale pour comprendre leur réseau d'influence.

### 4. Navigation Directe (Deep Linking)
Un bouton **ExternalLink** dans le profil latéral permet de basculer instantanément sur la fiche complète du personnage.
- **Fluidité** : La Galerie PNJ s'ouvre directement sur le bon profil sans repasser par la liste globale.

---

## 🛠️ Vérification Technique

- [x] **Store Sync** : Les relations sont synchronisées en temps réel entre le MJ et le Hub.
- [x] **Performance** : Le cache d'images Canvas évite les clignotements lors de la navigation.
- [x] **Robustesse** : Suppression du reset forcé de `selectedEntityId` dans le store global.

---

> [!NOTE]
> Le Social Nexus est désormais le point central de la gestion politique de vos campagnes. Pour plus de détails, consultez le [Guide Utilisateur Session OS](../User Guides/10-Session-OS-le-cockpit.md).
