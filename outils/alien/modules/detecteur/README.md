# Détecteur Alien — module du Tablet Hub

Version 0.2.0, contrat v1, données v2. Ergonomie du 16/10/2026.
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
   Le choix du diffuseur d’alarme MU/TH/UR ne commande pas ces bips.

**Arrêter le scan** conserve accès et réglages. Retirer un PJ ferme uniquement son
instrument ; les autres restent ouverts. Le dernier retrait arrête le radar.
**Tout couper**, dans la page des modules, ferme tous les accès et arrête leurs effets.
Une erreur disque est signalée, mais n’empêche ni retrait ni coupure en mémoire.

Déconnexion, changement de PJ et démontage arrêtent sons et minuteries locaux.
Au retour, les bips exigent un nouveau clic. Une page masquée se tait. Les mouvements
réduits gardent le radar fixe, avec expiration du faux écho. Aucun Stress modifié,
aucune distance réelle mesurée, aucun jet automatique.

## Commandes et sauvegarde

Commandes réservées au MJ ; le joueur consulte et active son audio local sans commande réseau.

| Commande | Charge |
| --- | --- |
| `configurer` | Facultatifs : `contacts` entier 0–9 ; `proximite`, `intensite`, `volume`, `parasites` nombres 0–100 ; `crt`, `effetsParasites` booléens. |
| `scanner` | `{ actif: boolean }` ; le passage arrêté → actif renouvelle la graine partagée. |
| `faux-echo` | `{}` ; scan actif requis, échéance autoritaire de neuf secondes. |
| `enregistrer-prereglage` | `{ prereglageId, nom }` ; capture contacts, proximité, intensité, volume, parasites déjà appliqués. Crée ou remplace cet identifiant ; nom unique (casse ignorée), non blanc de 80 caractères au plus, 32 entrées maximum. |
| `rappeler-prereglage` | `{ prereglageId }` ; charge les réglages, arrête scan et faux écho ; conserve la graine jusqu’au prochain démarrage volontaire. |
| `supprimer-prereglage` | `{ prereglageId }` ; confirmation locale au pupitre. |

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
