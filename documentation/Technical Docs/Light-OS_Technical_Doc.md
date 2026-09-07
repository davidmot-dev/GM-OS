# 💡 Light-OS : Documentation Technique

Le module **Light-OS** gère l'ambiance lumineuse via le pont Philips Hue, en combinant des scènes natives et des effets pilotés par logiciel.

## 🏗️ Architecture

### 1. Store Global (`useLightStore.ts`)
*   **Zustand** : Stocke l'état des lampes (on/off, bri, xy, effect), les scènes disponibles et les paramètres de connexion au bridge.
*   **Persistence** : L'adresse IP et le Token sont persistés via le bridge sécurisé.
*   **`LightScene.effectSpeed`** : multiplicateur de vitesse des effets de la scène (2026-09-07), borné par `bornerVitesse` entre `VITESSE_EFFET_MIN` (0,25) et `VITESSE_EFFET_MAX` (3). **Champ optionnel** : absent vaut `VITESSE_EFFET_DEFAUT` (1), donc les scènes antérieures sont inchangées et **aucune migration n'est nécessaire**. Il vit dans `scenes`, donc il est persisté et sauvegardé avec elles.

### 2. Moteur d'Effets (`HueEngine.ts`)
Le moteur est une instance unique (singleton) qui gère les requêtes HTTP vers le pont Hue.
*   **Effets Natifs** : Comme `colorloop`, gérés directement par le matériel Hue.
*   **Effets Logiciels** : Boucles `setInterval`/`setTimeout` qui calculent les couleurs et la luminosité à la volée.
    *   **Performance** : Pour éviter de bloquer l'UI, ces boucles ne déclenchent pas de rendu React. Elles envoient des requêtes HTTP directes au bridge.
    *   **Variance XY** : Utilise la méthode `applyXyVariance` pour créer des scintillements naturels (feu, bougie).
    *   **Génération** (`generationEffet`) : chaque démarrage d'effet sur une lampe reçoit un numéro. Une boucle suspendue sur la réponse du pont vérifie ce numéro avant de se replanifier — sans quoi la boucle d'un effet **révolu** réinstallerait son minuteur par-dessus le nouveau, et la lampe resterait sur la scène précédente.

### 2 bis. Vitesse des effets (2026-09-07)
La cadence d'un effet est écrite dans son `case` (`interval`). La **vitesse de la scène la divise**, via la fonction pure `cadenceEffective(intervalleMs, vitesse)`.

*   **Plancher** : `CADENCE_PLANCHER_MS` = 100 ms, la valeur que les effets les plus rapides s'autorisaient déjà. Chaque lampe en effet a **sa propre boucle** et le pont accepte de l'ordre de dix commandes/seconde : sans plancher, un curseur au maximum sur une scène de quatre lampes le saturerait.
*   **Vitesse invalide** (0, négative, `NaN`, absente) → cadence d'origine. *Un réglage abîmé ne doit jamais figer un effet.*
*   **Provenance** : `startSoftwareEffect(id, effet, base?, sceneId?)` retient dans `sceneDeLEffet[id]` **de quelle scène vient l'effet** — c'est elle qui porte la vitesse. Un effet lancé depuis `BulbFooter` n'a pas de scène et garde sa cadence d'origine.
*   **Relecture** : la cadence est relue **à chaque tour**, et le minuteur n'est reposé que si l'attente voulue diffère de `cadencePlanifiee[id]` — sinon on reconstruirait un `setInterval` dix fois par seconde.
*   **Application immédiate** : `appliquerVitesseDeScene(sceneId)` replanifie sur-le-champ les effets nés de cette scène. *Sans cet appel, un effet lent (crépuscule : 10 s) n'apprendrait sa nouvelle vitesse qu'au tour suivant, ce qui se lit comme un réglage en panne.*
*   ⛔ **`setInterval` fige sa période** à la pose : c'est la raison pour laquelle les deux familles d'effets passent maintenant par une seule fonction `planifier()` interne — les dynamiques en `setTimeout` un tour à la fois, les autres en `setInterval` jusqu'à ce que la vitesse change.

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
Certains effets (Glitch, Neon, Lever de Soleil) modifient leur `interval` dynamiquement durant l'exécution pour simuler des comportements imprévisibles ou des séquences temporelles. La liste `dynamique` de `startSoftwareEffect` les désigne : ceux-là se replanifient **un tour à la fois**, les autres battent à cadence fixe.

> ⚠️ Cette liste est écrite **dans** `startSoftwareEffect`. Un nouvel effet qui change son `interval` au fil des tours doit y entrer, sinon il gardera la cadence de son premier passage.

## 🛠️ Maintenance & Ajout d'Effets
Pour ajouter un effet :
1.  Ajouter le `case` dans `HueEngine.startSoftwareEffect`.
2.  Ajouter la couleur de départ dans `BulbFooter.tsx` (`defaultColors`).
3.  Enregistrer l'option dans le `<select>` de `BulbFooter.tsx`.
4.  Ajouter la traduction dans `modules.json` sous `light.footer.effects`.
5.  Si l'effet modifie son `interval` en cours de route, l'ajouter à la liste `dynamique` (voir ci-dessus).

*Documentation complétée le 2026-09-07 : vitesse des effets par scène, plancher de cadence, numéro de génération.*
