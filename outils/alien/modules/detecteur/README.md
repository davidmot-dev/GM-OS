# Détecteur Alien — module du Tablet Hub

Version 0.1.0, contrat v1, données v1. Troisième tranche du 15/10/2026.
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

Charges inconnues ou mal formées refusées sans mutation. L’état contient version, système,
révision, deux réglages visuels et radar ; aucun dossier, code, dialogue ou opérateur MU/TH/UR.
L’hôte porte les destinataires et une clé d’ouverture par PJ/module : le retrait d’un autre
PJ ne ferme pas les instruments dont l’accès reste valide.

La préparation rejoint le stockage privé, les sauvegardes complètes et exports/imports de
campagne. `migrerEtat` accepte les données v1 du module et coupe scan/faux écho. Pas d’import
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
vérifient le silence et le nettoyage avec audio/horloge simulés. Réseau, haut-parleurs
et tablettes physiques restent à éprouver.
