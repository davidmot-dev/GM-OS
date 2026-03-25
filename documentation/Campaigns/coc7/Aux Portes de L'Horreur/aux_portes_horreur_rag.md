
# Base RAG Structurée — Aux Portes de l’Horreur

## Schéma RAG

Chaque entrée suit ce modèle :

ID
Type
Scénario
Contexte
Déclencheur
Contenu
Conséquence
Tests associés
Mots-clés

Types :
- INDICE
- EVENT
- NPC
- MONSTER
- TRIGGER
- LOCATION

---

# Scénario 1 — La Nécropole

## LOCATION_TOMBE
Type: LOCATION
Scénario: La Nécropole
Contexte: Tombe antique scellée dans la Vallée des Rois.
Zones:
- Couloir
- Antichambre
- Annexe
- Chambre funéraire
- Salle du trésor
> Mots-clés: #tombe #exploration #donjon

## EVENT_TOMBE_FERMEE
Type: EVENT
Contexte: Les investigateurs entrent dans la tombe.
Déclencheur: Si les investigateurs franchissent l’entrée.
Contenu: La porte se referme derrière eux.
Conséquence: Les investigateurs sont piégés.
Tests:
| Test | Effet |
|---|---|
| SAN | perte 1 / 1D2 |
> Mots-clés: #incident #piège

## CLUE_SYMBOLS
Type: INDICE
Contexte: Première salle.
Contenu: Symboles gravés dans la pierre.
Tests:
| Test | Résultat |
|---|---|
| Occultisme | sceaux protecteurs |
> Mots-clés: #sceaux #rituel

## MONSTER_ABOMINATION
Type: MONSTER
Contexte: Créature enfermée dans la tombe.
Déclencheur: Si les investigateurs perturbent la tombe.
Objectif: Éliminer les intrus.
> Mots-clés: #monstre #garde_tombe

---

# Scénario 2 — La Chose de la Cave

## LOCATION_CHALET
Type: LOCATION
Contexte: Chalet isolé pendant une tempête.
Zones:
- Salon
- Cave
- Forêt
> Mots-clés: #chalet #isolement

## EVENT_EXPLORATION_CAVE
Type: EVENT
Déclencheur: Si les investigateurs descendent dans la cave.
Contenu: Découverte d’indices occultes.
Conséquence: Risque de réveiller la créature.
> Mots-clés: #cave #découverte

## MONSTER_CREATURE_CAVE
Type: MONSTER
Contexte: Entité cachée dans la cave.
Comportement:
- chasse dans l’obscurité
- attaque les isolés
> Mots-clés: #horreur #prédateur

---

# Scénario 3 — Le Pensionnaire

## LOCATION_PENSION
Type: LOCATION
Contexte: Pension urbaine.
Zones:
- Chambre
- Hall
- Rue
> Mots-clés: #pension #enquête

## NPC_MME_MADEIRA
Type: NPC
Rôle: Propriétaire de la pension.
Fonction: Source d’informations.
> Mots-clés: #pnj #informateur

## EVENT_CORPSE_RISE
Type: EVENT
Déclencheur: Si le corps est manipulé.
Contenu: Le cadavre se relève.
Conséquence: Combat immédiat.
> Mots-clés: #mort_vivant #combat

## MONSTER_UNDEAD_PENSIONNAIRE
Type: MONSTER
Contexte: Corps animé par des forces occultes.
Objectif: Attaquer les investigateurs.
> Mots-clés: #mort_vivant #mythe
