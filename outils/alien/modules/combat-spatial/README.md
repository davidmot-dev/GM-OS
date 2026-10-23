# Combat spatial Alien — module du Tablet Hub

Version 1.1.0, contrat v1, données v2 (préréglages et remise à zéro, 23/10). Créé le 23/10/2026 (Claude Code), à la demande de David :
« je voudrais aussi finir Alien aujourd'hui », périmètre complet. Règles du livre de base
français, p. 175-201, et errata 2021 (avarie mineure 55).

- `catalogue.mjs` : portées, armes (p. 177), modèles de vaisseaux (p. 175-189), actions par
  phase (p. 191), avaries mineures D66 et majeures 2D6 (p. 198-199), Panique spatiale (p. 201).
- `moteur.mjs` : état, commandes, dés, vues par lecteur. Les dés roulent au poste du MJ.
- Les écrans sont dans `src/modules/modulesDuJeu/combatSpatial/` (pupitre et tablette).

## Ce que le moteur applique

- **Tour en quatre phases** : senseurs, pilote (puis déplacement), artilleur, ingénieur. Ordres
  donnés en secret, révélés par le MJ, résolus dans l'ordre d'initiative (carte la plus basse
  d'abord ; Commandant de vaisseau : deux cartes, la meilleure gardée).
- **Distance** commune en zones, **vélocité d'approche** par camp ; au-delà de zéro, les
  vaisseaux se croisent puis s'éloignent. Au-delà de huit zones, hors de portée des senseurs.
- **Dés** : dés de base saisis par poste (attribut + compétence), dés de stress = Stress du poste
  pour un PJ ; un malus mange les dés de base puis de stress (règle d'A2). Les PNJ et les
  synthétiques n'ont pas de dés de stress et ne forcent pas.
- **Forcer** : Stress +1, relance de ce qui n'a donné ni 6 ni 1, un dé de stress de plus.
  Un 1 sur un dé de stress : **Panique spatiale**, D6 + Stress ; son Stress, la perte d'action et
  « Trop c'est trop ! » (avarie majeure du poste) s'appliquent ; le reste se dit.
- **Verrouillage** (COMTECH, portée, Signature de la cible) ; ensuite automatique, sauf si la
  cible fait le mort. **Faire le mort** annule des succès et peut couper senseurs (−1) et
  moteurs (−2). Un transpondeur actif permet de tirer sans verrouiller.
- **Pilote** : accélération, décélération (Propulseurs), évasion (opposée ; échange des cartes,
  et ses succès annulent ceux des tirs), éperonnage et amarrage (contact au début du Tour ;
  amarrage : mêmes vélocités et ombilic).
- **Tir** : arme offensive, portée de l'arme, Bonus, talent Artilleur de vaisseau ; évasion et
  contremesures retirent des succès ; dégâts = arme + succès au-delà du premier ; canons à
  particules réduits par la portée, sans dégât de coque ; Protection en dés (moitié contre un
  canon électrique) ; munitions décomptées.
- **Dégâts** : coque, Hors service au cumul, destruction en une attaque ≥ Coque ; avarie mineure
  dès un point, majeure à la moitié de la Coque ; effets mécaniques des avaries (armes, instruments,
  senseurs, propulseurs, transpondeur, moteur) ; réaction en chaîne, explosion du réacteur.
- **Ingénieur** : réparation d'urgence test par test (temporaire, elle redevient avarie à la fin
  du combat), rallumage des moteurs en deux actions, ouverture du sas, surcharge et interruption.

## Points tranchés

- Seuil d'avarie mineure : la table (« 1 ou plus ») plutôt que le texte (« supérieur à 1 »).
- Contremesures : contre une attaque de portée Courte ou plus (table), le texte dit « Courte ».
- Amarrage : « même vélocité d'approche » lu comme vélocités des deux camps égales.
- Éperonnage : pas de jet de Protection, le livre n'en parle pas.
- L'avarie de « Trop c'est trop ! » n'est pas nommée pour le capitaine : aucune n'est posée.
- Les réactions et oppositions (faire le mort, contremesures, pilote adverse) se jettent sans
  forçage ; seule l'action déclarée se force.

## Commandes

Au MJ : `vaisseau`, `supprimer-vaisseau`, `poste`, `etat-vaisseau`, `demarrer-combat`, `reveler`,
`phase-suivante`, `relancer-avarie`, `terminer-combat`, `enregistrer-prereglage`, `rappeler-prereglage`,
`supprimer-prereglage`, `reinitialiser`. Un préréglage garde les vaisseaux et leurs équipages (une réparation
d'urgence y redevient avarie) ; le rappel attend la fin du combat ; la remise à zéro efface vaisseaux et
combat et garde les préréglages. Le panneau commun est `../prereglages-vues.mjs` ; la logique partagée, `../prereglages.mjs` (32 préréglages au plus, nom unique sans tenir compte de la casse, réservés au MJ). Au MJ et au joueur qui tient le poste de la
phase (ou le capitaine) : `ordonner`, `resoudre`, `forcer`, `valider` ; `mes-des` pour son propre
poste. La tablette ne voit de l'adversaire que « Contact non identifié » tant que son transpondeur
est coupé et qu'aucun vaisseau des joueurs ne l'a verrouillé ; ni ordres avant révélation, ni
équipage, ni jets privés du MJ.

Essais : `electron/modulesDuJeu/alienCombatSpatial.test.ts`,
`src/modules/modulesDuJeu/combatSpatial/VuesCombatSpatial.test.tsx`, `e2e/combatSpatialAlien.spec.ts`.
