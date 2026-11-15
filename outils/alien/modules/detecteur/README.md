# Détecteur Alien — module du Tablet Hub

Version 0.5.0, contrat v1, données v5. A11 du 14/11/2026 : orientation manuelle et commande
rapide de mouvement ; A8 et préréglages conservés.

**Orientation A11 :** Maman choisit 45/90/180/360° et désigne explicitement le personnage
de tablette qui peut tourner l'appareil. Nord en haut du plan, degrés horaires. Le porteur
et Maman partagent le cap ; les autres destinataires consultent. La rotation explore le
relevé privé du dernier scan payé : ni nouveau déplacement, ni nouveau jet de batterie.
Seuls les échos dans le champ quittent le moteur, même dans `tracker.positions` et le compteur.
Le bouton En mouvement/Immobile sur chaque pion change `mobile` sans changer zone ni budget ;
le prochain scan le prend en compte. Choisir un autre pion porteur retire l'attribution joueur.
Les sauvegardes/préréglages v1–v4 migrent vers v5 à 360°, cap nord, sans porteur joueur désigné ;
le scan payé est conservé. Le prototype autonome conserve son radar sans orientation.

**Préréglages (23/10) :** un préréglage garde réglages, effets visuels et plan discret ; son rappel arrête
le scan et repart au Tour 1, sans pas dépensés ni scan. Ceux d'avant la v4 n'ont que `reglages` et laissent
le plan en place. `reinitialiser` remet le détecteur à neuf et garde les préréglages. `exemple.mjs` fournit
**Exemple — relais à sept salles**, ajouté à `creerEtat` et une seule fois au passage en v4. Le panneau commun est `../prereglages-vues.mjs` ; la logique partagée, `../prereglages.mjs` (32 préréglages au plus, nom unique sans tenir compte de la casse, réservés au MJ).
Le cœur `core.js` garde ses préréglages de réglages pour le prototype autonome ; le module ne s'en sert plus.
`alien-detecteur` réutilise `AlienCore` pour ses commandes et le tirage des contacts,
et `detecteur.js` pour le dessin partagé avec le prototype autonome. Il est enregistré
explicitement dans les registres natif et React, sans branche Alien dans le Hub.

## À la table

1. Dans le pilote Alien, conserve **Détecteur de mouvement** dans **Modules du jeu**.
2. Depuis **Cockpit › Modules du jeu**, ouvre son pupitre. Prépare contacts, proximité,
   intensité, volume, parasites et les interrupteurs visuels, puis enregistre.
3. Pendant une séance, coche les PJ destinataires, indépendamment des accès à MU/TH/UR.
4. **Démarrer le scan** renouvelle le tirage ; tous les destinataires voient les mêmes
   positions dans la proximité choisie (valeur élevée = plus près).
5. **Faux écho · 9 s** ajoute un contact temporaire sans redistribuer les autres.
6. Sur chaque appareil souhaité, **Activer les bips ici** autorise son audio local.
   Le choix du diffuseur d’alarme MU/TH/UR ne commande pas ces bips. Depuis le 15/11/2026, le bip
   est carré et aigu (1 500 / 1 900 Hz), gain plein au volume 100 (`GAIN_MAX_DU_BIP`) ; en mode
   discret, sa cadence suit l'écho le plus proche (`cadenceDesBips`), et un écho de la zone du
   porteur s'affiche en points proches du centre (`pointsDeMemeZone`).

**Arrêter le scan** conserve accès et réglages. Retirer un PJ ferme uniquement son
instrument ; les autres restent ouverts. Le dernier retrait arrête le radar.
**Tout couper**, dans la page des modules, ferme tous les accès et arrête leurs effets.
Une erreur disque est signalée, mais n’empêche ni retrait ni coupure en mémoire.

Déconnexion, changement de PJ et démontage arrêtent sons et minuteries locaux.
Au retour, les bips exigent un nouveau clic. Une page masquée se tait. Les mouvements
réduits gardent le radar fixe, avec expiration du faux écho. Aucun Stress modifié,
aucune distance physique mesurée. Ces réglages décrivent le mode de mise en scène.

**Mode discret A8 :** `discret.mjs` conserve le plan de zones et les pions au MJ ;
`lectureDiscrete` expose seulement les zones des mouvements repérés. Deux passages par
Tour pour un humain, limite explicite par créature, scan une fois par Tour, portée M314
de quatre zones/100 m en intérieur ou 1 km en terrain découvert. La batterie propre à
l'appareil commence à cinq ; chaque scan teste au maximum six dés et retire les 1,
sans Stress/Panique. Le dernier scan et son paiement survivent à la coupure du radar.
La migration v1/v2 ajoute ce mode désactivé, sans perdre les anciens réglages.
Le Tour d'exploration est confirmé par Maman ; les échéances personnelles A5 sont validées
dans Survie Alien. Voir le [manuel Alien](../../../../documentation/User%20Guides/54-Jeu-Alien.md).

## Commandes et sauvegarde

Commandes réservées au MJ, sauf `orienter-discret` pour le personnage désigné : rôle, accès,
campagne et contexte contrôlés par l'hôte ; identité du porteur et Tour courant par le moteur.
Le joueur active aussi son audio local.

| Commande | Charge |
| --- | --- |
| `mouvement-discret` | `{ pionId, mobile, tour }` ; MJ, mode discret actif, Tour actuel. Ne change ni zone ni pas dépensés. |
| `orienter-discret` | `{ cap, tour }` ; entier 0–359, MJ ou joueur désigné, mode discret actif et Tour actuel. |
| `champ-discret` | `{ ouverture }` ; 45, 90, 180 ou 360 ; MJ seul. |
| `attribuer-porteur` | `{ personnageId }` ; personnage de la campagne validé par l'hôte, ou chaîne vide pour Maman seule ; MJ seul. Changer le pion porteur retire cette attribution. |
| `configurer` | Facultatifs : `contacts` entier 0–9 ; `proximite`, `intensite`, `volume`, `parasites` nombres 0–100 ; `crt`, `effetsParasites` booléens. |
| `scanner` | `{ actif: boolean }` ; le passage arrêté → actif renouvelle la graine partagée. |
| `faux-echo` | `{}` ; scan actif requis, échéance autoritaire de neuf secondes. |
| `enregistrer-prereglage` | `{ prereglageId, nom }` ; capture contacts, proximité, intensité, volume, parasites déjà appliqués, les effets visuels et, depuis la v4, le plan discret. Crée ou remplace cet identifiant ; nom unique (casse ignorée), non blanc de 80 caractères au plus, 32 entrées maximum. |
| `rappeler-prereglage` | `{ prereglageId }` ; charge les réglages (et le plan, en v4), arrête scan et faux écho ; conserve la graine jusqu’au prochain démarrage volontaire. Confirmation locale. |
| `supprimer-prereglage` | `{ prereglageId }` ; confirmation locale au pupitre. |
| `reinitialiser` | `{}` ; remet réglages, plan, pions et Tours à neuf, scan arrêté ; garde les préréglages. Confirmation locale. |

Charges inconnues ou mal formées refusées sans mutation. L’état contient version, système,
révision, deux réglages visuels et radar ; aucun dossier, code, dialogue ou opérateur MU/TH/UR.
L’hôte porte les destinataires et une clé d’ouverture par PJ/module : le retrait d’un autre
PJ ne ferme pas les instruments dont l’accès reste valide.

La préparation rejoint le stockage privé, les sauvegardes complètes et exports/imports de
campagne. La v2 ajoute `prereglages` (id, nom, réglages), visible uniquement au MJ.
Dans le pupitre, applique d’abord les réglages puis enregistre sous un nom ; le rappel revient
en veille. Le prototype autonome propose les mêmes gestes et les conserve dans son état local.
`migrerEtat` valide les données v1/v2, ajoute une liste vide aux v1 et coupe scan/faux écho. Pas d’import
direct d’une table autonome entière. Redémarrage et import laissent les accès fermés.

## Vérifications

```powershell
node outils/modules-du-jeu/valider.mjs outils/alien/modules/detecteur/manifeste.json
node --test outils/alien/modules/detecteur/verification.mjs outils/alien/verification-detecteur.mjs
npx.cmd vitest run --maxWorkers=4 electron/modulesDuJeu src/modules/modulesDuJeu src/components/hub/HubModulesDuJeu.test.tsx
node outils/modules-du-jeu/apercu-integration.mjs --capturer
```

Le banc utilise le vrai hôte, les composants réels et stockage/transport en mémoire.
Il vérifie les points réellement dessinés, les accès indépendants, le scan partagé,
le retrait partiel et la coupure générale à 360/768/1180 px. Les essais de composants
vérifient le silence et le nettoyage avec audio/horloge simulés. Dans le Hub, l’échéance
du faux écho se juge à l’`horloge()` fournie par l’hôte (heure du serveur), pas à celle de
la tablette ; sans elle, l’atelier garde l’heure locale. Réseau, haut-parleurs
et tablettes physiques restent à éprouver.
