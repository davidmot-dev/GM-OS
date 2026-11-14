# État et reprise — détecteur Alien, 14/11/2026

## Produit

David reprend les deux premières idées du second examen de GM Codex : « ok on va commencer ».
Le chantier **A11 / § 250** est livré, à essayer par David :
[plan, 9 critères et 9 tâches](2026-11-14-alien-detecteur-orientation.md),
[deux prompts de maquette](2026-11-14-alien-detecteur-prompts-stitch.md).

Décisions de David : orientation manuelle par « Le porteur et le meneur », « Oui, une commande
rapide par pion », GM-OS fermé. Autorisation reçue de compléter les quatre documents partagés
déjà modifiés sans écraser leurs changements. Registre général, registre Alien, synthèse et
document des propositions complétés. Module **0.5.0 / données v5**, sans réimport de pilote :
commande rapide En mouvement/Immobile, cap manuel partagé, ouverture 45/90/180/360°, droits du
porteur explicites, filtrage du relevé privé avant diffusion, migrations v1–v4 et préréglages.

Le projet privé Stitch `10111230835253923961` a produit les deux écrans.
La revue automatique a refusé le premier envoi de prompt : le partage des détails du module
avec Stitch/Google n'était pas explicitement autorisé. Les deux prompts exacts sont conservés
dans le dépôt. David autorise l'envoi : « Oui, envoie ces prompts à Stitch », puis adopte
« cette disposition corrigée ». Les [maquettes et leur relecture](visuels/alien-detecteur-2026-11-14/README.md)
conservent les ajouts de Stitch écartés : barre de navigation, graduations, limite de batterie,
radar déformé, contrôles remplacés par du texte et dépendances de police externes.

## Par quoi reprendre

1. Faire essayer T9 par David dans sa campagne : M314 raccordé, joueur porteur désigné,
   cône à 90°, orientation sur tablette puis mouvement d'un pion et scan du Tour suivant.
2. Aucun nouveau pilote à importer. Commit demandé ensuite par David le 14/11 : « commit ».
   Pas de push demandé ; l'essai physique T9 reste distinct de cette demande.

## Ce qu'il ne faut pas repayer

- L'immobilité est déjà `mobile: false` ; le filtre fonctionne au scan. Ajouter une commande
  rapide, ne pas doubler l'état avec une propriété `immobile`.
- `porteurId` est un pion privé du plan, pas l'identifiant d'un personnage de tablette.
- Le dernier scan est un relevé par Tour payé une fois. Une rotation ne recalcule pas les
  positions actuelles et ne transmet pas les échos hors champ au client pour les cacher ensuite.
- Le dessin `outils/alien/detecteur.js` est partagé avec le prototype autonome.
- Schéma strict **v5** : migration des anciens états et préréglages, reçu du dernier scan conservé.
- Le contexte des personnages doit traverser `electron/modulesDuJeu/registre.ts` : le service
  le fournissait, mais l'ancien raccord du détecteur l'ignorait.
- Le sélecteur d'ouverture a un `aria-label` explicite : sinon son nom calculé par le navigateur
  comprenait les options et le premier parcours ne le trouvait pas avec son nom exact.
- D'autres modifications du corpus Alien sont apparues dans la copie de travail pendant
  ce cadrage ; elles ne sont pas de cette tâche. Ne pas les corriger ni les inclure implicitement.

## Vérifications et copie de travail

**Vérifié le 14/11 :** 242 essais ciblés / 29 fichiers, 7 vérifications autonomes, manifeste
conforme, types et lint ciblé, build. A11 réel **1/1** avec deux Hub, refus WebSocket de l'ancien
porteur, trois tailles, reconnexion et redémarrage ; A8 et régressions de scan partagé/reprise
**5/5**. A11 final et préréglages des trois modules **2/2** : **7 parcours distincts** passent.
Six captures finales relues et copiées au manuel, contrôle du manuel **28/28**. Les contrôles
d'écran **12/12** ont été repris après le libellé accessible.
`git diff --check` sans erreur ; **20 liens locaux** des nouveaux documents contrôlés ;
9 critères / 9 tâches, T1–T8 cochées et T9 restant à essayer ; section § 250 et ligne 186
présentes une seule fois. **État avant le commit demandé : 45 fichiers du lot A11,
23 fichiers suivis complétés, 22 nouveaux** (dont les six captures du manuel et huit fichiers
de maquettes/références de départ). Les documents partagés conservent aussi leurs modifications
préexistantes autorisées par David.

Lot A11 du commit demandé : moteur, vues et manifeste dans `outils/alien/modules/detecteur/`,
rendu partagé `outils/alien/detecteur.js`, raccord natif `electron/modulesDuJeu/registre.ts`,
tests natifs A8/préréglages/orientation et fixture v4, essai des vues, scénario A11 dans
`e2e/modulesDuJeuAlien.spec.ts`, manuel 53/54, registres, synthèse, plan, prompts et captures.
Le commit ne retient que les passages A11 des documents partagés ; leurs autres corrections
restent dans la copie de travail. Les modifications de corpus de l'autre travail, les exports
Delta Green et le dossier temporaire précédent restent hors sujet. Pas de push demandé.
