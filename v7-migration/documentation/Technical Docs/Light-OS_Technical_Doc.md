# 💡 Light-OS : Documentation Technique

Le module **Light-OS** gère l'ambiance lumineuse via le pont Philips Hue, en combinant des scènes natives et des effets pilotés par logiciel.

## 🏗️ Architecture

### 1. Store Global (`useLightStore.ts`)
*   **Zustand** : Stocke l'état des lampes (on/off, bri, xy, effect), les scènes disponibles et les paramètres de connexion au bridge.
*   **Persistence** : L'adresse IP et le Token sont persistés via le bridge sécurisé.

### 2. Moteur d'Effets (`HueEngine.ts`)
Le moteur est une instance unique (singleton) qui gère les requêtes HTTP vers le pont Hue.
*   **Effets Natifs** : Comme `colorloop`, gérés directement par le matériel Hue.
*   **Effets Logiciels** : Boucles `setInterval`/`setTimeout` qui calculent les couleurs et la luminosité à la volée.
    *   **Performance** : Pour éviter de bloquer l'UI, ces boucles ne déclenchent pas de rendu React. Elles envoient des requêtes HTTP directes au bridge.
    *   **Variance XY** : Utilise la méthode `applyXyVariance` pour créer des scintillements naturels (feu, bougie).

### 3. Hiérarchie des Overrides
1.  **Tactical State** (Flash, Alerte) : Priorité absolue. Interrompt les effets en cours.
2.  **Software Effects** (Loop) : Priorité haute.
3.  **Manual Scene** : État de base.

## 🌈 Configuration des Effets

Chaque effet est défini par :
*   `transitiontime` : Vitesse de changement (en dizaines de ms).
*   `interval` : Temps entre deux mises à jour.
*   `payload` : Les paramètres `bri` et `xy` envoyés au bridge.

### Ordonnancement Dynamique
Certains effets (Glitch, Neon, Lever de Soleil) modifient leur `interval` dynamiquement durant l'exécution pour simuler des comportements imprévisibles ou des séquences temporelles.

## 🛠️ Maintenance & Ajout d'Effets
Pour ajouter un effet :
1.  Ajouter le `case` dans `HueEngine.startSoftwareEffect`.
2.  Ajouter la couleur de départ dans `BulbFooter.tsx` (`defaultColors`).
3.  Enregistrer l'option dans le `<select>` de `BulbFooter.tsx`.
4.  Ajouter la traduction dans `modules.json` sous `light.footer.effects`.
