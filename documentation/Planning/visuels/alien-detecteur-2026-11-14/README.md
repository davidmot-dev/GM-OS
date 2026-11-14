# Détecteur Alien — maquettes Stitch, 14/11/2026

**Maquettes à choisir, pas une livraison de l'application.** David a autorisé l'envoi des deux
prompts à Stitch : « Oui, envoie ces prompts à Stitch » (14/11). Génération réussie des deux
écrans ; images et HTML originaux conservés ici. Aucune capture de campagne personnelle.

- [Maquette joueur](joueur.png) — cap, champ indiqué, deux rotations de 15° et curseur.
- [Maquette meneur](meneur.png) — même orientation, ouverture, attribution du joueur et
  commande rapide de mouvement sur chaque pion.
- [Prompts exacts](../../2026-11-14-alien-detecteur-prompts-stitch.md).
- [Spécification A11 / § 250](../../2026-11-14-alien-detecteur-orientation.md).

## Proposition soumise à David

Retenir **l'organisation des contrôles** : radar, orientation, audio et lecture du scan pour
le joueur ; réglages privés et pions du côté meneur. Réutiliser l'habillage du module actuel.
Les échos restent anonymes et filtrés par le moteur avant diffusion.

Corrections prévues lors de l'intégration :

- Supprimer la navigation ajoutée en bas de la maquette joueur et son nouvel en-tête avec
  icône d'alimentation : aucun écran supplémentaire ni nouveau bouton d'alimentation.
- Conserver le radar circulaire et concentrique de l'application ; les anneaux du dessin
  meneur sont déformés et décentrés. Garder le secteur orienté et un repère central clair.
- Ne pas reprendre les graduations inventées 5/10/15 m : la portée reste celle du mode discret
  actuel et de son terrain. Ces nombres de la maquette ne sont pas des règles validées.
- Afficher la réserve réelle, sans la limiter à « 4/4 » ou à quatre barres. La batterie n'a pas
  de nouveau maximum ni de nouveau coût du fait du cône.
- Conserver les vrais sélecteurs de porteur, terrain et batterie ; la maquette meneur a
  remplacé certains contrôles par du texte statique.
- Réutiliser la police et les styles locaux du module. Les HTML bruts de Stitch ajoutent des
  dépendances externes et ne constituent pas le code à importer dans GM-OS.
- Maintenir la lecture du dernier scan : les échos ne suivent pas les déplacements en direct.
  Le cap partagé ne permet pas de nouveau scan dans le même Tour.

Les champs, libellés et tailles seront vérifiés dans l'application à 360/768/1180 px ;
les images Stitch ne prouvent pas ces dimensions, les droits réseau ou l'accessibilité.
**Choix de David, 14/11 : « Oui, intègre cette disposition corrigée ».** L'organisation est
approuvée avec les corrections listées, conformément au skill `specifier-un-chantier`.
Les captures du manuel sont prises dans l'application réelle, pas dans ces HTML.

Application livrée : [joueur à 360 px](../../../User%20Guides/captures/jeu-alien-a11-joueur-360.jpg),
[orientation du meneur](../../../User%20Guides/captures/jeu-alien-a11-orientation-mj.jpg),
[plan privé et mouvement](../../../User%20Guides/captures/jeu-alien-a11-plan-mj.jpg).

## Retours de Stitch

Les descriptions et suggestions ci-dessous sont conservées comme sortie de génération.
Ce ne sont pas des décisions ni des tâches ajoutées au chantier.

### Joueur

Voici l'interface mobile (360px) pour l'instrument portatif **M314 Détecteur de mouvement** (module GM-OS), conçue comme un accessoire de jeu sur table immersif (« prop ») fidèle à l'univers d'Alien :

### Choix de conception et structure :
- **Palette et esthétique diegétique :** Fond très sombre (`#080e0c`), typographie monospace intégrée en vert phosphore pâle (`#c5ebd0`), labels secondaires estompés (`#9abbab`) et bordures tactiques fines (`#344b3f`) reproduisant l'affichage CRT/HUD d'un équipement Weyland-Yutani.
- **Enceinte radar M314 :**
  - Anneaux concentriques et marqueur central orienté vers l'Est (90°).
  - Cône de détection stable de 90° pointant vers la droite avec son faisceau phosphore actif.
  - **Un seul écho lumineux anonyme** présent à l'intérieur du secteur balayé. Aucun signal ni indicateur en dehors du champ.
  - Bandeaux supérieur (*WEYLAND-YUTANI* / *SCAN ACTIF*) et inférieur (*ÉCHOS : 1* / *ACQUISITION*).
- **Module d'orientation dédié (sous le radar) :**
  - Affichage instantané du relevé : `Cap : Est · 90°` et champ fixe à `90°`.
  - Deux grands boutons tactiles de 48px min (`↶ 15°` et `15° ↷`) pour un ajustement pas-à-pas immédiat.
  - Curseur horizontal accessible `Cap du détecteur` avec repères de visée (N, E, S, O).
  - Mentions d'aide et de synchronisation : *« Tourne le détecteur pour explorer le dernier scan »* et statut discret *« Orientation partagée avec le meneur »*.
- **Contrôle audio et statut opérationnel :**
  - Bouton d'action tactile (≥ 48px) *« Activer les bips ici »* accompagné de sa notice locale.
  - Panneau télémétrique récapitulatif : *Mode discret · Tour 3*, jauge *Énergie du M314 : 4* et relevé *Coursive A : 1 écho*.
- **Respect absolu des contraintes :** Aucun contrôle de largeur de faisceau, aucune carte tactique complète, aucun décompte hors champ, ni fioriture superflue. L'interface reste dense, claire, accessible aux doigts et au clavier, sans défilement horizontal.

Suggestions proposées par Stitch :

- Simuler le déplacement du cap à 180° (Sud)
- Ajouter une animation CSS de balayage CRT sur le radar
- Ajuster les contrastes et les repères tactiles d'angle

### Meneur

J'ai créé l'écran bureau prop **« M314 · Plan privé de Maman »** en prolongeant fidèlement l'interface tactile existante et l'univers Alien / Weyland-Yutani :

### Ce qui a été mis en place :
1. **Esthétique & Ergonomie prop de table** :
   - Fond vert sombre ultra profond (`#080e0c`), typographie monospace `Space Mono` vert pâle (`#c5ebd0`), textes secondaires (`#9abbab`), bordures fines (`#344b3f`) avec trame CRT rétro.
   - Textes calibrés à 15px et contrôles interactifs respectant tous la zone minimale de 44px (boutons, sélecteurs, bascules, onglets).

2. **Colonne Gauche (Détection & Orientation)** :
   - **Radar circulaire rétro** avec `WEYLAND-YUTANI`, état `● SCAN ACTIF`, affichage `ÉCHOS : 1`.
   - **Cône de vision 90° stable orienté vers l'Est (droite)** avec un unique écho anonyme scanné à l'intérieur (aucun écho hors champ).
   - **Nouveau panneau « Orientation » compact** directement sous le radar avec les métriques `Cap : Est · 90°`, `Champ : 90°`, l'ouverture réglable (`45°`, `90°`, `180°`, `360°`), les deux grands boutons tactiles de rotation `↶ 15°` et `15° ↷`, et la réglette horizontale `Cap du détecteur`.
   - Bouton de bascule audio local (`Bips sonores locaux`) préservé.

3. **Colonne Droite (Gestion MJ & Plan Privé)** :
   - Section **« Mode discret — M314 »** avec la case à cocher active *« Raccorder le détecteur au plan et à sa batterie »*.
   - Volets repliables *« Préparer les zones du plan »* et *« Préparer les pions cachés »*.
   - **Plan privé des 3 zones** (*Sas*, *Coursive A* avec son écho détecté, *Soute*).
   - Paramètres porteur & batterie (4/4 barres) avec bouton de confirmation.
   - **Liaison joueur séparée** : menu déroulant *« Joueur qui oriente le M314 »* (sélectionné sur *Wilson*, option neutre *Meneur seul*), avec la note explicative claire *« Le porteur et Maman partagent la même orientation »* et garantie de non-exposition des identités secrètes.

4. **Gestion des Déplacements — Tour 3** :
   - 3 fiches de pions privés (*Nel Varga*, *Rôdeur dissimulé*, *Créature immobile*).
   - Chaque fiche intègre son **bouton d'état de mouvement compact et distinct** avec attribut `aria-pressed` (*« État : Immobile »* / *« État : En mouvement »* surbrillance tactique).
   - Menu destination, action *« Déplacer d'une zone »* et *« Examiner ce Tour »*.
   - Message d'aide : *« L’état de mouvement sera pris en compte au prochain scan. »*
   - Bouton *« Scanner ce Tour et tester l’Énergie »* désactivé (effectué) et bouton de progression actif *« Valider le Tour suivant (Tour 4) »*.

Suggestions proposées par Stitch :

- Simuler le passage au Tour 4 avec un nouveau scan
- Ajouter un volet journal des alertes sonores pour le MJ
- Ajuster l'ouverture du cône à 45° ou 180°
