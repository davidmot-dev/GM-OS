# Extraction RAG — L’Appel de Cthulhu 7e, Manuel de l’investigateur

## Note de méthode

Extraction orientée RAG à partir du **Manuel de l’investigateur**.  
Objectif : isoler les règles, structures, statistiques, tableaux et conditions utiles à l’indexation sémantique.

Principes appliqués :

- suppression du fluff narratif et des répétitions de mise en page ;
- conservation des règles, seuils, formules et exceptions ;
- conversion des tableaux en Markdown ;
- ajout de mots-clés contextuels pour chaque section importante.

> Mots-clés : #RAG #CallOfCthulhu #Cthulhu7e #manuel_investigateur #indexation #regles

# Table des matières structurée

## Structure globale du document

Contexte : organisation macro du livre pour segmentation, routage des requêtes et indexation par chapitre.  
Règle : le document est structuré en 10 chapitres principaux, suivis de fiches d’investigateur et d’un index. Les sections les plus utiles pour un moteur sémantique de règles sont les chapitres 3 à 5, 7, 9 et 10.

### Table des matières convertie en Markdown

| Chapitre / Section | Page |
|---|---:|
| Chapitre Un : Introduction | 4 |
| Le jeu en quelques mots | 7 |
| Exemple de partie | 9 |
| De quoi avez-vous besoin pour jouer ? | 11 |
| Chapitre Deux : L’Abomination de Dunwich | 12 |
| Chapitre Trois : Création des investigateurs | 32 |
| Les étapes | 36 |
| Interpréter les nombres | 37 |
| Exemple de création d’investigateur | 39 |
| Noms d’époque | 46 |
| Autres méthodes de création de personnages – Règles optionnelles | 47 |
| Table des demis et des cinquièmes | 49 |
| Aide-mémoire : création des investigateurs | 50 |
| Chapitre Quatre : Occupations | 52 |
| Liste des occupations | 57 |
| Chapitre Cinq : Compétences | 80 |
| Liste des compétences | 84 |
| Niveaux de vie | 90 |
| Sceptique ou croyant ? | 97 |
| Règles optionnelles | 105 |
| Chapitre Six : Organisations pour investigateurs | 106 |
| Exemples d’investigateurs | 110 |
| Membres de la Société pour l’Exploration de l’Inexpliqué | 121 |
| Chapitre Sept : Le quotidien des investigateurs | 124 |
| Chapitre Huit : Les Années folles aux États-Unis | 136 |
| Chronologie des Années folles américaines | 143 |
| Informations utiles pour les investigateurs des années 1920 | 144 |
| Biographies des années 1920 | 158 |
| Bibliothèques et musées les plus remarquables | 189 |
| Chapitre Neuf : Conseils aux joueurs | 194 |
| Mise en scène | 197 |
| Conseils au sujet des règles | 203 |
| Chapitre Dix : Annexes | 208 |
| Un peu plus d’un siècle | 210 |
| Transports | 223 |
| Liste de prix à l’époque classique | 224 |
| Liste de prix à l’époque moderne | 229 |
| Armes | 231 |
| Conversion depuis les éditions précédentes | 237 |
| Fiche d’investigateur — Période classique | 239 |
| Fiche d’investigateur — Période moderne | 241 |
| Fiche d’investigateur — 1890 | 243 |
| Mémorial | 245 |
| Index | 259 |

> Mots-clés : #chapitres #indexation #segmentation #regles #creation_personnage #competences #annexes

# Chapitre 1 — Introduction

## Finalité du jeu

Contexte : définition fonctionnelle de la boucle de jeu.  
Règle : une partie met en scène des joueurs incarnant des investigateurs et un gardien des arcanes qui arbitre, décrit les situations et contrôle l’opposition. Les actions à issue incertaine sont résolues par des dés. Le but n’est pas la victoire compétitive, mais la coopération pour découvrir et contrer des menaces relevant du Mythe.

> Mots-clés : #gardien_des_arcanes #investigateurs #cooperation #resolution #des #mythe_de_cthulhu

## Boucle d’interaction joueur / gardien

Contexte : logique procédurale de résolution verbale des actions.  
Règle :

- Le gardien décrit une scène, les PNJ et l’environnement.
- Les joueurs déclarent les intentions de leurs investigateurs.
- Le gardien détermine si l’action est automatiquement possible ou s’il faut un jet.
- Si le résultat est incertain et intéressant, les règles et les dés tranchent l’issue.

### Logique conditionnelle

- **Si** une action a un résultat incertain et intéressant, **alors** un jet de dés peut être demandé.
- **Si** une action est triviale, évidente ou sans enjeu, **alors** elle peut être résolue sans jet.
- **Si** les joueurs collaborent, **alors** la partie fonctionne dans son cadre prévu.

> Mots-clés : #declaration_action #arbitrage #jet_de_des #incertitude #resolution_conflit

## Gagnants et perdants

Contexte : cadre de réussite de scénario ou campagne.  
Règle : il n’existe pas de condition de victoire compétitive classique. Les joueurs réussissent si leurs investigateurs atteignent l’objectif commun. Ils échouent s’ils n’y parviennent pas et renoncent. Les blessures, traumatismes et décès font partie du déroulement normal du jeu.

### Logique conditionnelle

- **Si** les investigateurs atteignent leur objectif, **alors** le groupe réussit.
- **Si** les investigateurs échouent et renoncent, **alors** le groupe perd.
- **Si** un investigateur survit à ses aventures, **alors** il peut accumuler connaissances occultes et progression en compétences.

> Mots-clés : #objectif_de_scenario #reussite #echec #traumatisme #mort #progression

## Exemple de partie — règles implicites observables

Contexte : extraction procédurale à partir d’un exemple dialogué.  
Règle : l’exemple montre comment le gardien séquence les actions, gère plusieurs joueurs en parallèle, demande des tests ciblés et applique les conséquences des échecs.

### Test d’intimidation

Contexte : tentative de pression sur un PNJ hostile.  
Règle : le gardien demande un test d’Intimidation lorsqu’un joueur tente de forcer verbalement un PNJ à parler.

#### Logique conditionnelle

- **Si** un investigateur tente d’intimider un PNJ, **alors** le gardien peut demander un test d’Intimidation.
- **Si** le joueur souhaite redoubler ce test, **alors** le gardien peut l’autoriser, avec aggravation possible en cas d’échec.
- **Si** le test redoublé échoue, **alors** la situation empire immédiatement.

> Mots-clés : #intimidation #redoublement #echec #consequence #degats

### Test de Psychologie

Contexte : lecture des intentions d’un individu suspect.  
Règle : le gardien demande un test de Psychologie pour déterminer les intentions d’un PNJ. L’exemple distingue aussi une réussite renforcée lorsque le résultat est inférieur à la moitié de la compétence.

#### Logique conditionnelle

- **Si** un joueur veut deviner les intentions d’un PNJ, **alors** le gardien peut demander un test de Psychologie.
- **Si** le résultat est inférieur à la moitié de la compétence, **alors** il s’agit d’un meilleur niveau de réussite qu’une simple réussite standard.

> Mots-clés : #psychologie #intention_pnj #seuil_de_reussite #moitie_de_competence

### Test de Bibliothèque

Contexte : recherche documentaire en bibliothèque.  
Règle : le gardien demande un test de Bibliothèque lorsqu’un investigateur cherche des informations dans les rayonnages. En cas de réussite, il fournit une source ou une piste pertinente.

#### Logique conditionnelle

- **Si** un investigateur cherche une information documentaire précise, **alors** le gardien peut demander un test de Bibliothèque.
- **Si** le test réussit, **alors** l’investigateur trouve une piste exploitable.

> Mots-clés : #bibliotheque #recherche_documentaire #indice #piste #investigation

# Chapitre 1 — Matériel et dés

## Matériel requis

Contexte : prérequis matériels d’une partie.  
Règle : pour jouer, il faut le Manuel du gardien côté meneur, des dés spéciaux, du papier, des crayons avec gomme, au moins deux amis dont un gardien, un lieu calme avec table et plusieurs heures disponibles.

### Tableau — matériel nécessaire

| Élément | Usage |
|---|---|
| Manuel du gardien de L’Appel de Cthulhu | Référence de règles côté gardien |
| Dés spéciaux | Résolution aléatoire |
| Papier | Prise de notes |
| Crayons et gomme | Feuille d’investigateur / corrections |
| Deux joueurs ou plus, dont un gardien | Groupe minimal |
| Pièce calme avec table | Confort de jeu |
| Trois ou quatre heures | Durée indicative de séance |

> Mots-clés : #materiel #preparation_partie #gardien #duree_de_jeu

## Dés utilisés

Contexte : définition des types de dés explicitement requis.  
Règle : le jeu mentionne l’usage du D100, D4, D6, D8 et D20. Ces dés servent notamment à la résolution des actions, à la génération de caractéristiques, aux dégâts et aux pertes de santé mentale.

### Tableau — dés cités

| Dé | Fonction typique |
|---|---|
| D100 | Tests en pourcentage |
| D4 | Dégâts / sous-calculs |
| D6 | Caractéristiques / dégâts |
| D8 | Dégâts |
| D20 | Usages spécifiques signalés par le manuel |

> Mots-clés : #D100 #D4 #D6 #D8 #D20 #pourcentage

## Lecture d’un D100

Contexte : normalisation critique pour indexation des règles de test.  
Règle : un D100 se lit avec deux dés à dix faces, l’un pour les dizaines et l’autre pour les unités. Le résultat 00 sur les dizaines et 0 sur les unités vaut 100 ; 00 sur les dizaines avec une unité non nulle produit un nombre inférieur à 10.

### Tableau — lecture du D100

| Dizaines | Unités | Résultat |
|---:|---:|---:|
| 00 | 0 | 100 |
| 00 | 3 | 3 |
| 2 | 3 | 23 |
| 0 | 1 | 1 |
| 1 | 0 | 10 |

### Logique conditionnelle

- **Si** le dé des dizaines affiche `00` et le dé des unités affiche `0`, **alors** le résultat vaut `100`.
- **Si** le dé des dizaines affiche `00` et le dé des unités un chiffre non nul, **alors** le résultat vaut ce chiffre seul.
- **Si** le groupe ne possède pas de dé des dizaines, **alors** il peut utiliser deux dés d’unités de couleurs différentes et assigner une couleur aux dizaines, l’autre aux unités.

> Mots-clés : #lecture_D100 #pourcentage #dizaines #unites #resultat_100

## Notation de dés

Contexte : interprétation normalisée des expressions de dégâts et tirages.  
Règle : `2D6` signifie lancer deux dés à six faces et additionner. `1D6+1` ajoute un modificateur fixe. Une notation mixte comme `1D6+1+2D4` cumule plusieurs dés et un modificateur. La mention `impact` signifie qu’il faut ajouter le bonus aux dégâts applicable.

### Tableau — interprétation des notations

| Notation | Interprétation |
|---|---|
| 2D6 | Lancer deux D6 et additionner |
| 1D6+1 | Lancer un D6 puis ajouter 1 |
| 1D6+1+2D4 | Lancer un D6 et deux D4, additionner, puis ajouter 1 |
| impact | Ajouter le bonus aux dégâts éventuel |

### Logique conditionnelle

- **Si** une notation comporte un nombre avant le `D`, **alors** il faut lancer ce nombre de dés du type indiqué et additionner les résultats.
- **Si** une notation comporte un `+` suivi d’un entier, **alors** il faut ajouter ce modificateur au total.
- **Si** la mention `impact` accompagne les dégâts, **alors** il faut ajouter le bonus aux dégâts du personnage ou du monstre.

> Mots-clés : #notation_de_des #degats #impact #modificateur #somme

# Chapitre 3 — Création des investigateurs

## Vue d’ensemble de la procédure

Contexte : pipeline de création d’un investigateur jouable.  
Règle : la création suit un enchaînement standard : générer les caractéristiques, choisir une occupation, distribuer les points de compétence, compléter le profil, puis finaliser l’équipement et les valeurs dérivées.

> Mots-clés : #creation_investigateur #pipeline_creation #occupation #competences #profil

## Les cinq étapes de création

Contexte : séquencement procédural de la création de personnage.

### Tableau — étapes de création

| Étape | Description |
|---|---|
| 1 | Génération des caractéristiques |
| 2 | Choix de l’occupation |
| 3 | Distribution des points de compétence |
| 4 | Rédaction du profil |
| 5 | Sélection de l’équipement |

> Mots-clés : #etapes_creation #caracteristiques #occupation #competences #profil #equipement

## Génération des caractéristiques

Contexte : génération des attributs fondamentaux du personnage.  
Règle : les caractéristiques sont obtenues par jets de dés, puis converties en scores sur 100 par multiplication par 5. Certaines utilisent `3D6 × 5`, d’autres `2D6+6 × 5`. Les valeurs sont notées avant application des éventuels modificateurs d’âge.

> Mots-clés : #caracteristiques #3D6x5 #2D6plus6x5 #modificateurs_age

### FOR (Force)

Contexte : puissance musculaire et capacité physique brute.  
Règle : `FOR = 3D6 × 5`. Sert à mesurer la force physique, la capacité à soulever/porter et les dégâts à mains nues. Si FOR tombe à 0, l’investigateur devient invalide.

#### Logique conditionnelle

- **Si** FOR augmente, **alors** la capacité de port et la force de frappe augmentent.
- **Si** FOR tombe à `0`, **alors** l’investigateur devient invalide et incapable de quitter son lit.

> Mots-clés : #FOR #force #degats_corps_a_corps #portage #invalidite

### CON (Constitution)

Contexte : résistance physique et santé générale.  
Règle : `CON = 3D6 × 5`. Les maladies et les poisons s’attaquent directement à cette caractéristique. Si CON tombe à 0, l’investigateur meurt.

#### Logique conditionnelle

- **Si** un poison ou une maladie affecte directement le personnage, **alors** la CON est la caractéristique concernée.
- **Si** CON tombe à `0`, **alors** l’investigateur meurt.

> Mots-clés : #CON #constitution #vigueur #poison #maladie #mort

### TAI (Taille)

Contexte : gabarit physique, hauteur et poids.  
Règle : `TAI = 2D6+6 × 5`. Intervient dans les points de vie, l’impact au corps à corps et la carrure.

#### Logique conditionnelle

- **Si** TAI augmente, **alors** elle influence à la hausse les PV, l’impact et la carrure.
- **Si** TAI tombe à `0`, **alors** l’investigateur disparaît purement et simplement.

> Mots-clés : #TAI #taille #points_de_vie #impact #carrure

### DEX (Dextérité)

Contexte : agilité, rapidité, réflexes.  
Règle : `DEX = 3D6 × 5`. Une DEX élevée signifie un personnage plus agile et plus rapide.

#### Logique conditionnelle

- **Si** l’action dépend d’un réflexe, d’une agilité ou d’une réaction rapide, **alors** un test de DEX peut être demandé.

> Mots-clés : #DEX #dextérité #agilité #réflexe #rapidité

### POU, APP, ÉDU, INT

Contexte : autres caractéristiques majeures de création.  
Règle : `POU`, `APP`, `ÉDU` et `INT` figurent explicitement sur la fiche et entrent dans plusieurs calculs ultérieurs, notamment les points de compétences d’occupation, la santé mentale, la magie et certaines restrictions de création.

#### Logique conditionnelle

- **Si** l’on utilise certaines méthodes optionnelles, **alors** mettre `INT` ou `TAI` sous `40` demande l’accord du gardien.

> Mots-clés : #POU #APP #EDU #INT #restriction_creation #accord_gardien

## Étape 2 — Choix de l’occupation

Contexte : spécialisation initiale de l’investigateur.  
Règle : l’occupation représente la manière dont le personnage gagne sa vie, mais surtout son domaine d’expertise. Son impact principal se situe à la création, via les compétences d’occupation et le profil narratif.

#### Logique conditionnelle

- **Si** une occupation n’est pas adaptée à la période de jeu, **alors** elle ne devrait pas être choisie.
- **Si** un joueur a un doute sur la validité d’une compétence ou d’une occupation pour l’époque, **alors** il doit consulter le gardien.
- **Si** l’occupation est choisie, **alors** ses compétences associées doivent être notées sur la fiche.

> Mots-clés : #occupation #epoque #competences_d_occupation #gardien

## Étape 3 — Distribution des points de compétence

Contexte : allocation des points issus de l’occupation et des intérêts personnels.  
Règle : l’occupation détermine une formule de points basée sur certaines caractéristiques ainsi qu’une liste de compétences autorisées. Les points d’occupation ne peuvent être attribués qu’aux compétences de la liste de l’occupation.

#### Logique conditionnelle

- **Si** des points proviennent de l’occupation, **alors** ils ne peuvent être placés que dans les compétences listées par cette occupation.
- **Si** l’occupation contient des emplacements libres, **alors** ceux-ci doivent correspondre à la profession, à l’époque ou au concept du personnage.
- **Si** une occupation est créée sur mesure, **alors** elle ne doit pas dépasser huit compétences associées.

> Mots-clés : #points_de_competence #competences_d_occupation #choix_libres #occupation_personnalisee

## Impact et carrure

Contexte : valeur dérivée utilisée notamment au corps à corps.  
Règle : l’impact et la carrure se déterminent à partir de la somme `FOR + TAI`.

### Tableau — Impact et carrure

| FOR + TAI | Impact | Carrure |
|---|---|---|
| 2–64 | -2 | -2 |
| 65–84 | -1 | -1 |
| 85–124 | 0 | 0 |
| 125–164 | +1D4 | +1 |
| 165–204 | +1D6 | +2 |

#### Logique conditionnelle

- **Si** `FOR + TAI` est compris entre `2` et `64`, **alors** l’impact vaut `-2` et la carrure `-2`.
- **Si** `FOR + TAI` est compris entre `65` et `84`, **alors** l’impact vaut `-1` et la carrure `-1`.
- **Si** `FOR + TAI` est compris entre `85` et `124`, **alors** l’impact vaut `0` et la carrure `0`.
- **Si** `FOR + TAI` est compris entre `125` et `164`, **alors** l’impact vaut `+1D4` et la carrure `+1`.
- **Si** `FOR + TAI` est compris entre `165` et `204`, **alors** l’impact vaut `+1D6` et la carrure `+2`.

> Mots-clés : #impact #carrure #FORplusTAI #degats_corps_a_corps

## Mouvement (MVT)

Contexte : vitesse de déplacement de base.  
Règle : le score de mouvement dépend de la comparaison entre FOR, DEX et TAI, puis subit des pénalités liées à l’âge.

### Tableau — MVT de base

| Condition | MVT |
|---|---:|
| FOR et DEX strictement inférieures à TAI | 7 |
| FOR ou DEX égale ou supérieure à TAI, ou les trois valeurs sont égales | 8 |
| FOR et DEX supérieures à TAI | 9 |

### Tableau — Pénalités d’âge sur le MVT

| Tranche d’âge | Modificateur MVT |
|---|---:|
| 40–49 ans | -1 |
| 50–59 ans | -2 |
| 60–69 ans | -3 |
| 70–79 ans | -4 |
| 80–89 ans | -5 |

#### Logique conditionnelle

- **Si** FOR et DEX sont toutes deux strictement inférieures à TAI, **alors** `MVT = 7`.
- **Si** FOR ou DEX est égale ou supérieure à TAI, ou si FOR, DEX et TAI sont égales, **alors** `MVT = 8`.
- **Si** FOR et DEX sont toutes deux supérieures à TAI, **alors** `MVT = 9`.
- **Si** l’investigateur a 40 ans ou plus, **alors** son MVT est réduit selon sa tranche d’âge.

> Mots-clés : #MVT #mouvement #age #FOR #DEX #TAI

## Valeurs dérivées

Contexte : sous-valeurs calculées à partir des caractéristiques.  
Règle : la santé mentale est égale au `POU`. Les points de magie sont égaux au cinquième du `POU`. La chance vaut `3D6 × 5`. En création accélérée, les points de vie se calculent par `(CON + TAI) / 10`.

### Tableau — valeurs dérivées visibles

| Valeur dérivée | Formule |
|---|---|
| Santé mentale initiale | `POU` |
| Points de magie | `POU / 5` |
| Chance | `3D6 × 5` |
| Points de vie | `(CON + TAI) / 10` |

> Mots-clés : #sante_mentale #points_de_magie #chance #points_de_vie

## Méthodes optionnelles de création

Contexte : variantes de génération des caractéristiques.  
Règle : plusieurs méthodes existent en plus de la méthode classique. Leur usage dépend de l’accord du gardien.

### Tableau — méthodes optionnelles

| Option | Nom | Procédure | Restriction |
|---|---|---|---|
| 3 | Distribution libre | Lancer cinq fois `3D6` et trois fois `2D6+6`, multiplier par 5, puis répartir librement | `INT` et `TAI` sous 40 nécessitent l’accord du gardien |
| 4 | Achat | Répartir `460` points entre les huit caractéristiques | Scores entre `15` et `90` ; `INT` et `TAI` sous 40 nécessitent l’accord du gardien |
| 5 | Création accélérée | Affecter des valeurs fixes puis compléter rapidement les compétences et détails dérivés | Recommandée si le temps manque |
| 6 | Atteindre le summum humain | Ajouter `1D10` points de caractéristique à répartir librement | Réservé aux personnages exceptionnellement compétents |

> Mots-clés : #regles_optionnelles #distribution_libre #achat #creation_acceleree #summum_humain

### Option 5 — Création accélérée

Contexte : procédure rapide de génération.  
Règle : la méthode repose sur huit valeurs fixes, puis sur une attribution prédéfinie des compétences.

### Procédure structurée

| Ordre | Action |
|---|---|
| 1 | Affecter `40, 50, 50, 50, 60, 60, 70, 80` aux huit caractéristiques |
| 2 | Appliquer les modificateurs d’âge et d’ÉDU |
| 3 | Noter l’impact et la carrure |
| 4 | Calculer les PV et la chance |
| 5 | Choisir une occupation puis huit compétences adaptées |
| 6 | Affecter une compétence à `70 %`, deux à `60 %`, trois à `50 %`, trois à `40 %`, en incluant Crédit |
| 7 | Réduire Crédit si l’occupation impose un maximum inférieur à 40, puis redistribuer l’excédent |
| 8 | Choisir quatre compétences d’intérêt général à `+20 %` en tenant compte de la chance de base |
| 9 | Tirer les détails du profil au hasard |
| 10 | Commencer la partie |
| 11 | Remplir demis et cinquièmes selon les besoins |
| 12 | Reporter la gestion des finances à plus tard |

#### Logique conditionnelle

- **Si** le groupe manque de temps, **alors** la création accélérée est recommandée.
- **Si** le maximum de Crédit de l’occupation est inférieur à `40 %`, **alors** la valeur de Crédit doit être réduite et les points excédentaires redistribués.
- **Si** l’on applique le bonus de `+20 %` aux compétences d’intérêt général, **alors** les chances de base doivent être prises en compte.

> Mots-clés : #creation_acceleree #credit #competences_interet_general #chance_de_base

### Option 6 — Atteindre le summum humain

Contexte : dépassement des limites ordinaires de génération.  
Règle : le gardien peut autoriser l’ajout de `1D10` points de caractéristique à répartir librement.

#### Logique conditionnelle

- **Si** le gardien souhaite des investigateurs exceptionnels, **alors** il peut accorder `1D10` points supplémentaires.
- **Si** une caractéristique déjà élevée reçoit assez de points, **alors** elle peut atteindre `99`.

> Mots-clés : #summum_humain #caracteristique_99 #bonus_creation

## Préconnaissance du Mythe à la création

Contexte : cas particulier d’un investigateur ayant déjà rencontré le surnaturel.  
Règle : le gardien peut autoriser un score initial en Mythe de Cthulhu et imposer les ajustements associés : hausse de la compétence, baisse de la santé mentale maximale, possible baisse immédiate de santé mentale si le personnage est croyant, ajout de séquelles narratives, et éventuellement accès à des sorts.

#### Logique conditionnelle

- **Si** le gardien accorde un score initial en Mythe de Cthulhu, **alors** la compétence augmente du montant fixé par lui.
- **Si** le score de Mythe augmente, **alors** la santé mentale maximale diminue en conséquence.
- **Si** l’investigateur est croyant, **alors** sa santé mentale est réduite d’un montant égal aux points de Mythe gagnés.
- **Si** l’investigateur est croyant et que le gardien l’autorise, **alors** il peut commencer avec des sorts.

> Mots-clés : #mythe_de_cthulhu #creation_avancee #sante_mentale #sorts #croyant

# Chapitre 4 — Occupations

## Structure d’une occupation

Contexte : modèle de données standard pour représenter une profession dans un système RAG.  
Règle : chaque occupation contient au minimum une formule de points de compétences d’occupation, un intervalle de Crédit recommandé, des idées de contacts et une liste de compétences d’occupation. Certaines occupations sont marquées comme lovecraftiennes, classiques ou modernes.

### Schéma recommandé d’indexation

| Champ | Description |
|---|---|
| Nom | Intitulé de l’occupation |
| Tags d’époque | classique / moderne / lovecraftienne |
| Points de compétences d’occupation | formule de calcul |
| Crédit recommandé | minimum–maximum |
| Idées de contacts | réseaux narratifs ou professionnels |
| Compétences | liste fermée ou semi-ouverte |
| Choix libres | compétences au choix si prévues |

#### Logique conditionnelle

- **Si** une occupation est marquée `[Classique]`, **alors** elle n’est disponible que dans les années 1920.
- **Si** une occupation est marquée `[Moderne]`, **alors** elle est strictement contemporaine.
- **Si** des compétences au choix sont prévues, **alors** elles doivent rester cohérentes avec l’occupation, l’époque ou le concept.

> Mots-clés : #occupation_schema #credit_recommande #contacts #epoque #lovecraftien

## Création de nouvelles occupations

Contexte : personnalisation du catalogue de professions.  
Règle : une nouvelle occupation doit se baser sur les occupations existantes. Le nombre de compétences associées ne doit pas dépasser huit. Les emplacements non utilisés peuvent devenir des choix libres adaptés à l’occupation, à l’époque ou au concept. Il faut aussi fixer un intervalle de Crédit recommandé.

#### Logique conditionnelle

- **Si** l’occupation personnalisée dépasse huit compétences, **alors** elle sort du cadre recommandé.
- **Si** l’occupation n’utilise pas huit compétences fixes, **alors** les emplacements restants peuvent devenir des choix libres.
- **Si** une occupation personnalisée est créée, **alors** un Crédit recommandé doit aussi être défini.

> Mots-clés : #occupation_personnalisee #homebrew #credit #equilibrage

## Conseils de sélection d’occupation

Contexte : adéquation entre concept, groupe et utilité ludique.  
Règle : il est recommandé de choisir une occupation cohérente avec le concept du personnage, ses compétences clés et la complémentarité avec les autres investigateurs.

#### Logique conditionnelle

- **Si** le joueur veut un personnage d’action, **alors** il devrait privilégier une occupation avec des compétences comme combat rapproché, grimper ou lancer.
- **Si** le joueur veut un personnage plus cérébral, **alors** il devrait privilégier des compétences comme bibliothèque, trouver objet caché et psychologie.
- **Si** le groupe manque de diversité fonctionnelle, **alors** il est recommandé d’ajuster les occupations pour l’équilibrer.

> Mots-clés : #choix_occupation #equilibre_groupe #concept_personnage

## Occupations extraites

### Acrobate

Contexte : personnage agile, de spectacle ou de compétition.  
Règle :

- Points de compétences d’occupation : `ÉDU x 2 + DEX x 2`
- Crédit recommandé : `9–20`
- Idées de contacts : clubs d’athlétisme amateurs, journalistes sportifs, cirques, fêtes foraines
- Compétences : esquive, grimper, lancer, nager, sauter, trouver objet caché, plus deux compétences au choix correspondant à des spécialités personnelles ou d’époque.

> Mots-clés : #acrobate #EDUx2plusDEXx2 #esquive #grimper #sauter

### Archéologue

Contexte : spécialiste des vestiges, artefacts et savoirs anciens.  
Règle :

- Points de compétences d’occupation : `ÉDU x 4`
- Crédit recommandé : `10–40`
- Idées de contacts : clients, musées, universités
- Compétences : archéologie, bibliothèque, estimation, histoire, langues (au choix), mécanique, orientation ou sciences (chimie, physique, géologie, etc.), trouver objet caché.

> Mots-clés : #archeologue #EDUx4 #archeologie #bibliotheque #histoire #artefacts

### Architecte

Contexte : conception de bâtiments et supervision de projets.  
Règle :

- Points de compétences d’occupation : `ÉDU x 4`
- Crédit recommandé : `30–70`
- Idées de contacts : direction locale de l’urbanisme, entreprises du bâtiment
- Compétences : arts et métiers (dessin technique), comptabilité, droit, informatique ou bibliothèque, langue maternelle, persuasion, psychologie, sciences (mathématiques).

> Mots-clés : #architecte #dessin_technique #droit #mathématiques #urbanisme

### Artisan

Contexte : fabrication manuelle, production d’objets ou de matériaux.  
Règle :

- Points de compétences d’occupation : `ÉDU x 2 + DEX x 2`
- Crédit recommandé : `10–40`
- Idées de contacts : commerçants, autres artistes et artisans
- Compétences : arts et métiers (deux au choix), comptabilité, mécanique, naturalisme, trouver objet caché, plus deux compétences au choix correspondant à des spécialités personnelles ou d’époque.

> Mots-clés : #artisan #arts_et_metiers #DEX #fabrication #metier_manuels

### Dilettante

Contexte : personnage de statut social élevé avec intérêts variés.  
Règle :

- Points de compétences d’occupation : `ÉDU x 2 + APP x 2`
- Crédit recommandé : `50–99`
- Idées de contacts : personnes du même statut, fraternités, cercles d’artistes, bonne société
- Compétences : arts et métiers (au choix), combat à distance, équitation, langues, une compétence sociale parmi baratin, charme, intimidation ou persuasion, plus trois compétences au choix correspondant à des spécialités personnelles ou d’époque.

> Mots-clés : #dilettante #APP #bonne_societe #equitation #competence_sociale

### Domestique

Contexte : personnel au service d’un employeur.  
Règle :

- Points de compétences d’occupation : `ÉDU x 4`
- Crédit recommandé : `9–40`, selon le statut et le crédit de l’employeur
- Idées de contacts : domestiques d’autres maisons, fournisseurs, commerçants locaux
- Compétences : arts et métiers (cuisine, confection, barbier, etc.), comptabilité ou estimation, écouter, langues, premiers soins, psychologie, trouver objet caché, plus deux compétences au choix correspondant à des spécialités personnelles ou d’époque.

> Mots-clés : #domestique #EDUx4 #premiers_soins #ecouter #psychologie

## Limites de cette passe sur le chapitre 4

Contexte : contrôle de complétude.  
Règle : cette passe ne couvre pas la liste complète des occupations ; elle couvre le schéma général et un sous-ensemble d’occupations visibles dans les extraits traités.

> Mots-clés : #limites_extraction #occupation_partielle #liste_incomplete

# Chapitre 5 — Compétences

## Définition générale d’une compétence

Contexte : modèle de représentation des compétences du système.  
Règle : une compétence représente un état de connaissance ou de savoir-faire contextualisé par l’époque et parfois la région. Un pourcentage de compétence n’est pas une mesure absolue de savoir théorique ; il représente l’aptitude pratique de l’investigateur dans son propre contexte historique et culturel.

### Logique conditionnelle

- **Si** une compétence porte l’étiquette `[Moderne]`, **alors** elle n’existe que pour des investigateurs contemporains.
- **Si** une compétence dépend d’un contexte juridique, technique ou culturel local, **alors** le gardien peut augmenter la difficulté hors de cette région.
- **Si** une compétence atteint environ `50 %`, **alors** elle est suffisante pour en vivre professionnellement.
- **Si** une compétence non liée à la profession d’origine atteint ce niveau, **alors** joueur et gardien peuvent justifier narrativement un changement d’activité.

> Mots-clés : #competence #pourcentage #epoque #region #niveau_professionnel

## Spécialités

Contexte : sous-compétences rattachées à une compétence-cadre.  
Règle : certaines compétences sont divisées en spécialités. Les points sont dépensés dans une spécialité, jamais dans la compétence générale.

### Compétences explicitement spécialisées

| Compétence | Type |
|---|---|
| Arts et métiers | [Spécialités] |
| Combat rapproché | [Spécialités] |
| Combat à distance | [Spécialités] |
| Sciences | [Spécialités] |
| Langues | [Spécialités] |
| Pilotage | [Spécialités] |
| Survie | [Spécialités] |
| Savoir | [Spécialités][Rare] |

### Logique conditionnelle

- **Si** une compétence est marquée `[Spécialités]`, **alors** les points doivent être affectés à une spécialité précise.
- **Si** un personnage possède `combat rapproché (corps à corps)` ou `combat rapproché (lances)`, **alors** il possède une spécialité valide ; il n’existe pas de score utilisable en `combat rapproché` générique.
- **Si** le gardien estime qu’une spécialité est suffisamment proche d’une autre, **alors** il peut autoriser son usage avec ajustement de difficulté.

> Mots-clés : #specialites #combat #sciences #arts_et_metiers #langues #survie

## Compétences rares

Contexte : compétences non listées par défaut sur la fiche.  
Règle : l’étiquette `[Rare]` désigne des compétences assez peu fréquentes pour ne pas être imprimées sur la fiche d’investigateur. Elles peuvent être ajoutées sur une ligne libre si le gardien ou un joueur le souhaite.

### Compétences rares identifiées

| Compétence | Base |
|---|---:|
| Artillerie | 01 % |
| Dressage | 05 % |
| Explosifs | 01 % |
| Hypnose | 01 % |
| Lecture sur les lèvres | 01 % |
| Plongée | 01 % |
| Savoir | 01 % |

### Logique conditionnelle

- **Si** une compétence est `[Rare]`, **alors** elle peut être ajoutée manuellement à la fiche.
- **Si** le scénario ou l’époque justifie d’autres compétences rares, **alors** le gardien peut en créer.

> Mots-clés : #rare #competences_rare #fiche_investigateur #ajout_manuel

## Tests combinés

Contexte : situation où plusieurs compétences sont sollicitées par une même action.  
Règle : lorsqu’un test combiné est demandé, on effectue **un seul jet** puis on le compare à plusieurs compétences. Le gardien précise si toutes doivent réussir ou si une seule réussite suffit.

### Logique conditionnelle

- **Si** le gardien demande un test combiné, **alors** le joueur ne lance qu’un seul jet.
- **Si** l’action exige plusieurs dimensions techniques simultanées, **alors** le gardien peut exiger la réussite sur chaque compétence concernée.
- **Si** une seule des compétences suffit à remplir l’objectif partiel visé, **alors** une seule réussite peut suffire.

> Mots-clés : #test_combine #jet_unique #multi_competence #resolution

## Redoublement des tests de compétence

Contexte : seconde tentative après un échec, avec prise de risque accrue.  
Règle : une compétence peut souvent être redoublée en prenant plus de temps, plus de risques, ou en changeant de méthode. Chaque entrée de compétence propose des exemples de redoublement et de conséquences d’échec aggravé. Certaines compétences, surtout de combat, interdisent le redoublement.

### Logique conditionnelle

- **Si** un joueur redouble un test, **alors** il accepte un risque narratif plus élevé.
- **Si** le redoublement échoue, **alors** le gardien applique une conséquence aggravée cohérente avec l’action.
- **Si** la compétence est une compétence de combat, **alors** le redoublement peut être interdit.
- **Si** un investigateur dément rate un redoublement, **alors** la conséquence peut inclure une dérive obsessionnelle, délirante ou autodestructrice propre à son état mental.

> Mots-clés : #redoublement #push_roll #echec_aggrave #demenence #risque

## Liste des compétences

Contexte : index compact pour ingestion et recherche par nom de compétence.  
Règle : chaque entrée indique le nom de la compétence, sa chance de base et, le cas échéant, son statut de spécialité, rareté ou modernité.

### Tableau — liste complète des compétences visibles

| Compétence | Base | Notes |
|---|---:|---|
| Anthropologie | 01 % |  |
| Archéologie | 01 % |  |
| Arcs | 15 % | cf. Combat à distance |
| Armes de poing | 20 % | cf. Combat à distance |
| Armes lourdes | 10 % | cf. Combat à distance |
| Artillerie | 01 % | [Rare] |
| Arts et métiers | 05 % | [Spécialités] |
| Astronomie | 01 % | cf. Sciences |
| Baratin | 05 % |  |
| Beaux-arts | 05 % | cf. Arts et métiers |
| Bibliothèque | 20 % |  |
| Biologie | 01 % | cf. Sciences |
| Botanique | 01 % | cf. Sciences |
| Charme | 15 % |  |
| Chimie | 01 % | cf. Sciences |
| Combat à distance | variable | [Spécialités] |
| Combat rapproché | variable | [Spécialités] |
| Comédie | 05 % | cf. Arts et métiers |
| Comptabilité | 05 % |  |
| Conduite | 20 % |  |
| Conduite engin lourd | 01 % |  |
| Contrefaçon | 05 % | cf. Arts et métiers |
| Corps à corps | 25 % | cf. Combat rapproché |
| Crédit | 00 % |  |
| Criminalistique | 01 % | cf. Sciences |
| Crochetage | 01 % |  |
| Cryptographie | 01 % | cf. Sciences |
| Discrétion | 20 % |  |
| Dressage | 05 % | [Rare] |
| Droit | 05 % |  |
| Écouter | 20 % |  |
| Électricité | 10 % |  |
| Électronique | 01 % | [Moderne] |
| Épées | 20 % | cf. Combat rapproché |
| Équitation | 05 % |  |
| Esquive | DEX/2 |  |
| Estimation | 05 % |  |
| Explosifs | 01 % | [Rare] |
| Fléaux | 10 % | cf. Combat rapproché |
| Fouets | 05 % | cf. Combat rapproché |
| Fusil de chasse | — | cf. Combat à distance (fusils) |
| Fusils | 25 % | cf. Combat à distance |
| Garrots | 15 % | cf. Combat rapproché |
| Géologie | 01 % | cf. Sciences |
| Grimper | 20 % |  |
| Haches | 15 % | cf. Combat rapproché |
| Histoire | 05 % |  |
| Hypnose | 01 % | [Rare] |
| Imposture | 05 % |  |
| Informatique | 05 % | [Moderne] |
| Ingénierie | 01 % | cf. Sciences |
| Intimidation | 15 % |  |
| Lance-flammes | 10 % | cf. Combat à distance |
| Lancer | 20 % |  |
| Lances | 20 % | cf. Combat rapproché ou lancer |
| Langue maternelle | ÉDU |  |
| Langues | 01 % | [Spécialités] |
| Lecture sur les lèvres | 01 % | [Rare] |
| Mathématiques | 01 % | cf. Sciences |
| Mécanique | 10 % |  |
| Médecine | 01 % |  |
| Météorologie | 01 % | cf. Sciences |
| Mitraillettes | 15 % | cf. Combat à distance |
| Mitrailleuses | 10 % | cf. Combat à distance |
| Mythe de Cthulhu | 00 % |  |
| Nager | 20 % |  |
| Naturalisme | 10 % |  |
| Occultisme | 05 % |  |
| Orientation | 10 % |  |
| Persuasion | 10 % |  |
| Pharmacologie | 01 % | cf. Sciences |
| Photographie | 05 % | cf. Arts et métiers |
| Physique | 01 % | cf. Sciences |
| Pickpocket | 10 % |  |
| Pilotage | 01 % | [Spécialités] |
| Pister | 10 % |  |
| Plongée | 01 % | [Rare] |
| Premiers soins | 30 % |  |
| Psychanalyse | 01 % |  |
| Psychologie | 10 % |  |
| Sauter | 20 % |  |
| Savoir | 01 % | [Spécialités][Rare] |
| Sciences | 01 % | [Spécialités] |
| Survie | 10 % | [Spécialités] |
| Tronçonneuses | 10 % | cf. Combat rapproché |
| Trouver objet caché | 25 % |  |
| Zoologie | 01 % | cf. Sciences |

> Mots-clés : #liste_des_competences #index #base_skills #chance_de_base

## Compétences clés extraites

## Anthropologie (01 %)

Contexte : compréhension des traditions et comportements culturels par observation et immersion.  
Règle : permet d’identifier et comprendre les traditions d’un groupe. Utilisable sur une culture vivante observée directement ou une culture éteinte documentée. Un mois ou plus d’immersion améliore la compréhension ; combinée à Psychologie, elle aide à prédire actions et croyances.

### Logique conditionnelle

- **Si** l’investigateur observe une culture vivante ou étudie des sources fiables sur une culture disparue, **alors** il peut utiliser Anthropologie.
- **Si** il combine Anthropologie et Psychologie, **alors** il peut mieux anticiper croyances et comportements.
- **Si** le redoublement échoue, **alors** il risque attaque, emprisonnement ou effets secondaires rituels/culturels.

> Mots-clés : #anthropologie #culture #observation #prediction_sociale

## Archéologie (01 %)

Contexte : étude des reliques, sites et civilisations passées.  
Règle : permet de dater et d’identifier des reliques, détecter des contrefaçons, diriger des fouilles et déduire l’usage d’un site. Peut aussi aider à reconnaître des textes en langues mortes.

### Logique conditionnelle

- **Si** un objet ou site appartient à une civilisation passée, **alors** Archéologie permet d’en estimer nature, âge et usage.
- **Si** l’échec concerne un redoublement, **alors** le site peut être endommagé, saisi, pillé ou rendu public.
- **Si** l’investigateur dément redouble et échoue, **alors** il peut poursuivre l’excavation de manière obsessionnelle.

> Mots-clés : #archeologie #relique #site #fouille #contrefacon

## Arts et métiers (05 %) [Spécialités]

Contexte : fabrication, réparation, création d’objets et expertise pratique d’un domaine artisanal ou artistique.  
Règle : les points sont dépensés dans des spécialités précises. La compétence permet de fabriquer, réparer ou reproduire des objets. Un test majeur ou extrême peut indiquer une qualité supérieure. La spécialité `contrefaçon` est nécessaire pour produire de faux documents.

### Exemples de spécialités

| Spécialité | Usage |
|---|---|
| Beaux-arts | dessin, peinture, histoire de l’art |
| Comédie | interprétation, maquillage, mémorisation d’un rôle |
| Contrefaçon | faux papiers, imitation d’écriture, copie de documents |
| Photographie | prise de vue, développement, amélioration d’images |

### Logique conditionnelle

- **Si** une action concerne un domaine artisanal ou artistique précis, **alors** il faut utiliser la spécialité correspondante.
- **Si** l’objet copié est complexe ou original, **alors** la difficulté augmente.
- **Si** une personne inspecte attentivement un faux, **alors** elle peut opposer Estimation à la compétence du faussaire.
- **Si** un redoublement échoue, **alors** l’argent, la réputation ou la sécurité de l’utilisateur peuvent être compromis.

> Mots-clés : #arts_et_metiers #fabrication #reparation #contrefacon #photographie

## Bibliothèque (20 %)

Contexte : recherche documentaire et repérage d’informations dans des fonds écrits.  
Règle : permet de localiser des livres, passages, références ou sources pertinentes dans une bibliothèque ou collection. Un redoublement peut consister à demander de l’aide aux bibliothécaires ou à examiner davantage de rayonnages.

### Logique conditionnelle

- **Si** l’information recherchée est présente dans une collection exploitée, **alors** Bibliothèque peut permettre de la trouver.
- **Si** le redoublement échoue, **alors** l’investigateur peut trouver une source erronée, attirer un ennemi ou perdre son accès à la bibliothèque.
- **Si** un investigateur dément échoue à un redoublement, **alors** il peut développer une obsession archivistique.

> Mots-clés : #bibliotheque #recherche #documentation #source #archive

## Charme (15 %)

Contexte : influence sociale douce par séduction, flatterie ou présence avenante.  
Règle : pousse une personne à agir d’une certaine façon, tant que cela reste compatible avec son comportement habituel. Les tests de Charme sont opposés par Charme ou Psychologie. Peut aussi servir à obtenir une petite réduction lors d’un achat.

### Logique conditionnelle

- **Si** la cible peut être influencée sans sortir de son comportement habituel, **alors** Charme est pertinent.
- **Si** le personnage change d’approche en cours d’interaction vers menace ou long plaidoyer, **alors** le gardien peut exiger Intimidation ou Persuasion.
- **Si** ce changement sert à obtenir une seconde chance, **alors** cela constitue un redoublement.

> Mots-clés : #charme #influence_sociale #seduction #marchandage

## Combat à distance / Combat rapproché

Contexte : compétences de combat spécialisées.  
Règle : ces compétences sont divisées en spécialités d’armes. Elles sont traitées comme compétences de combat ; le redoublement y est explicitement impossible pour les actions de combat.

### Logique conditionnelle

- **Si** l’action relève d’un combat, **alors** il faut utiliser la spécialité appropriée.
- **Si** la compétence est une compétence de combat, **alors** le redoublement est impossible.

> Mots-clés : #combat_a_distance #combat_rapproche #specialites_arme #pas_de_redoublement

## Conduite (20 %)

Contexte : pilotage de véhicules terrestres courants.  
Règle : permet de conduire des automobiles et véhicules équivalents à l’époque de jeu. Le gardien peut renommer la compétence pour des contextes historiques différents, comme conduite d’attelage.

### Logique conditionnelle

- **Si** l’investigateur pousse le véhicule au-delà d’un usage normal, **alors** un test peut être nécessaire.
- **Si** le redoublement échoue, **alors** cela peut provoquer accident, dérapage ou poursuite policière.

> Mots-clés : #conduite #vehicule #poursuite #accident

## Langue maternelle (ÉDU)

Contexte : langue native du personnage.  
Règle : la langue maternelle commence à un niveau égal à `ÉDU` et peut être améliorée comme n’importe quelle autre compétence. Elle fonctionne ensuite comme `Langues`.

> Mots-clés : #langue_maternelle #EDU #communication

## Langues (01 %) [Spécialités]

Contexte : compréhension, lecture, écriture et expression dans des langues non natives.  
Règle : chaque langue est une spécialité distincte. Les langues anciennes ou non humaines exigent l’accord du gardien. Un seul test suffit généralement à comprendre un livre entier.

### Seuils indicatifs visibles

| Niveau | Interprétation |
|---|---|
| 5 % | Identifier la langue sans jet |
| 10 % | Exprimer des idées simples |

### Logique conditionnelle

- **Si** la langue est humaine ordinaire, **alors** elle peut être choisie librement.
- **Si** la langue est ancienne, occulte ou inconnue, **alors** l’accord du gardien est requis.
- **Si** le texte est dans une forme archaïque de la langue, **alors** le gardien peut augmenter la difficulté.

> Mots-clés : #langues #specialites #langue_ancienne #traduction #lecture

## Médecine (01 %)

Contexte : soins cliniques, diagnostic et traitement des blessures ou maladies.  
Règle : permet de diagnostiquer et soigner blessures, maladies et empoisonnements. Soigner prend au moins une heure. Si le médecin attend plus d’une journée après la blessure, la difficulté augmente d’un cran et nécessite une réussite majeure. Un succès rend `1D3` points de vie, en plus d’éventuels premiers soins.

### Logique conditionnelle

- **Si** la blessure est traitée dans un délai normal, **alors** un succès rend `1D3` PV.
- **Si** plus d’une journée s’est écoulée, **alors** le test exige une réussite majeure.
- **Si** le patient est mourant, **alors** il doit d’abord être stabilisé par Premiers soins avant Médecine.
- **Si** le médecin traite avec succès une blessure grave, **alors** le patient reçoit un dé bonus à son test de récupération hebdomadaire.
- **Si** le traitement se déroule dans un hôpital moderne et bien équipé, **alors** le gardien peut accorder des succès automatiques.

> Mots-clés : #medecine #diagnostic #soin #blessure_grave #1D3_PV

## Mythe de Cthulhu (00 %)

Contexte : connaissance réelle des entités, savoirs et phénomènes du Mythe.  
Règle : la compétence représente une connaissance authentique et dangereuse du Mythe. Son augmentation réduit la santé mentale maximale. Elle peut être gagnée à la création dans des cas spéciaux ou en cours de jeu via confrontations, lectures ou révélations.

### Logique conditionnelle

- **Si** la compétence Mythe de Cthulhu augmente, **alors** la santé mentale maximale baisse d’autant.
- **Si** un investigateur lit sur le Mythe sans y croire, **alors** il peut gagner la compétence sans perdre immédiatement de santé mentale.
- **Si** il est confronté à une preuve tangible du Mythe, **alors** il peut devenir croyant et perdre immédiatement autant de santé mentale que son score en Mythe.

> Mots-clés : #mythe_de_cthulhu #sante_mentale_max #connaissance_interdite

## Occultisme (05 %)

Contexte : savoir ésotérique non spécifiquement lié au Mythe.  
Règle : permet d’identifier grimoires de magie, traditions populaires, symboles occultes et codes hermétiques. Ne s’applique pas directement aux sorts, livres et magies du Mythe.

### Logique conditionnelle

- **Si** un objet, rituel ou texte relève de l’occultisme général, **alors** Occultisme peut l’identifier ou le contextualiser.
- **Si** l’élément relève de la magie ou des ouvrages du Mythe, **alors** Occultisme ne suffit pas à lui seul.
- **Si** un redoublement échoue, **alors** il peut déclencher une catastrophe rituelle, une entité malveillante ou une perte de santé mentale liée à un lien avec le Mythe.

> Mots-clés : #occultisme #rituel #grimoire #esoterisme #mythe

## Orientation (10 %)

Contexte : navigation, repérage et cartographie.  
Règle : permet de retrouver son chemin de jour ou de nuit, d’utiliser cartes et instruments, et de mesurer ou cartographier une zone. Les tests d’Orientation doivent être effectués en secret par le gardien.

### Logique conditionnelle

- **Si** l’investigateur doit se repérer ou cartographier un lieu, **alors** Orientation est appropriée.
- **Si** l’équipement moderne compense la difficulté, **alors** le gardien peut la réduire ou l’annuler.
- **Si** un test d’Orientation est requis, **alors** le gardien le fait en secret.

> Mots-clés : #orientation #navigation #cartographie #jet_secret

## Pickpocket (10 %)

Contexte : vol à la tire, dissimulation et escamotage d’objets.  
Règle : permet de voler un portefeuille ou des bijoux, tricher, utiliser un téléphone sans se faire voir, ou cacher de petits objets dans un environnement ou un compartiment secret.

### Logique conditionnelle

- **Si** l’action vise à subtiliser, escamoter ou cacher discrètement un petit objet, **alors** Pickpocket peut être utilisé.
- **Si** le redoublement échoue, **alors** l’investigateur peut être surpris par un policier, un gangster ou un poursuivant.

> Mots-clés : #pickpocket #vol_a_la_tire #escamotage #dissimulation

## Premiers soins (30 %)

Contexte : intervention médicale d’urgence sur place.  
Règle : permet de poser une attelle, stopper une hémorragie, soigner une brûlure, ranimer un noyé ou stabiliser un mourant. N’agit pas sur les maladies. Les premiers soins doivent intervenir dans l’heure pour être efficaces et rendent `1` point de vie. Une seule tentative normale est possible ; les suivantes constituent un redoublement. Deux personnes peuvent agir ensemble ; la tentative réussit si au moins l’une réussit.

### Logique conditionnelle

- **Si** les premiers soins interviennent dans l’heure, **alors** ils rendent `1` point de vie.
- **Si** plusieurs personnes administrent les soins ensemble, **alors** le test réussit si au moins l’une des deux réussit.
- **Si** le blessé a déjà reçu Premiers soins et Médecine pour cette blessure, **alors** il ne peut plus en bénéficier avant de subir d’autres dégâts.
- **Si** le blessé est mourant, **alors** il doit réussir un test de `CON` à la fin de chaque round ou mourir.
- **Si** Premiers soins réussit sur un mourant, **alors** il est stabilisé pendant une heure et reçoit `1` PV temporaire.
- **Si** l’objectif est de traiter une maladie, **alors** Premiers soins ne suffit pas ; il faut Médecine.

> Mots-clés : #premiers_soins #urgence #stabilisation #1PV #mourant

## Psychanalyse (01 %)

Contexte : traitement de la folie persistante, phobies, manies et troubles mentaux.  
Règle : nécessite un traitement long pouvant durer des mois. Peut aider un investigateur dément à ignorer temporairement les effets d’une phobie, d’une manie ou d’hallucinations. Peut aussi restaurer de la santé mentale durant une folie persistante, sans dépasser `99 – Mythe de Cthulhu`.

### Logique conditionnelle

- **Si** un investigateur suit une psychanalyse pendant une folie persistante, **alors** il peut récupérer de la santé mentale.
- **Si** la récupération ferait dépasser `99 – Mythe de Cthulhu`, **alors** elle est plafonnée à ce maximum.
- **Si** l’on veut ignorer brièvement les effets d’une phobie ou d’une manie, **alors** un test réussi peut le permettre temporairement.
- **Si** un mois de traitement échoue et qu’une solution rapide est nécessaire, **alors** le joueur peut redoubler le test via une intervention radicale le lendemain.

> Mots-clés : #psychanalyse #folie_persistante #phobie #manie #sante_mentale

## Psychologie (10 %)

Contexte : lecture des motivations, de la personnalité et des intentions d’autrui.  
Règle : permet de deviner les motifs et la personnalité d’un individu rien qu’en l’observant. Le gardien peut effectuer le test en secret afin que le joueur ignore si l’information fournie est exacte.

### Logique conditionnelle

- **Si** l’action consiste à interpréter le comportement ou les intentions d’un individu, **alors** Psychologie est adaptée.
- **Si** le gardien veut préserver l’incertitude, **alors** il peut effectuer le test en secret.

> Mots-clés : #psychologie #intention #motivation #jet_secret

## Sciences (01 %) [Spécialités]

Contexte : connaissances scientifiques spécialisées.  
Règle : les points sont investis dans des disciplines précises, jamais dans `Sciences` de manière générique. Si l’investigateur ne possède pas la bonne spécialité, il peut parfois utiliser une discipline cousine à difficulté accrue.

### Spécialités explicitement visibles

| Spécialité | Usage principal |
|---|---|
| Astronomie | corps célestes, orbites, éclipses, pluies de météores |
| Biologie | organismes vivants, cytologie, physiologie, microbiologie |
| Chimie | composés, acides, explosifs, poisons, analyses de substances |
| Cryptographie | création et déchiffrage de codes |
| Criminalistique | relevé et analyse de preuves scientifiques |
| Géologie | roches, fossiles, minéraux, risques sismiques |
| Ingénierie | applications pratiques des découvertes scientifiques |
| Mathématiques | logique, formules, géométrie non euclidienne |
| Météorologie | atmosphère, climat, évolution du temps |

### Logique conditionnelle

- **Si** le personnage possède la bonne spécialité scientifique, **alors** il peut agir normalement.
- **Si** seule une science cousine est disponible, **alors** le gardien peut autoriser le test avec difficulté augmentée.
- **Si** un redoublement échoue, **alors** l’expérience peut provoquer explosion, incendie, électrocution ou autre catastrophe.
- **Si** un investigateur dément rate un redoublement, **alors** il peut devenir un savant fou.

> Mots-clés : #sciences #specialites_scientifiques #laboratoire #cryptographie #chimie

## Survie (10 %) [Spécialités]

Contexte : capacité à survivre dans des environnements extrêmes.  
Règle : les spécialités portent sur des milieux distincts, par exemple désert, mer ou Arctique. La compétence permet de construire des abris, trouver eau et nourriture et éviter les dangers naturels.

### Logique conditionnelle

- **Si** l’environnement correspond à la spécialité possédée, **alors** Survie s’applique normalement.
- **Si** seule une spécialité voisine est disponible, **alors** le gardien peut autoriser certaines tâches à difficulté plus élevée.
- **Si** le redoublement échoue, **alors** l’abri, l’eau, le signal ou la nourriture choisis peuvent au contraire aggraver la situation.

> Mots-clés : #survie #environnement_extreme #arctique #desert #mer

## Trouver objet caché (25 %)

Contexte : compétence principale d’investigation perceptive.  
Règle : permet de découvrir passages secrets, indices, intrusions, embuscades, objets dissimulés et détails suspects. Pour repérer un personnage furtif, la difficulté du test dépend de la compétence `Discrétion` de ce dernier. Une fouille systématique peut valoir réussite automatique.

### Logique conditionnelle

- **Si** un personnage non-joueur tente de rester caché, **alors** la difficulté de Trouver objet caché dépend de sa Discrétion.
- **Si** l’investigateur n’est pas attentif ou que l’environnement est encombré, **alors** la difficulté augmente.
- **Si** la fouille est vraiment systématique, **alors** le gardien peut accorder une réussite automatique.
- **Si** un redoublement échoue, **alors** l’investigateur peut laisser une trace, rater une menace proche ou devenir obsédé par un faux trésor.

> Mots-clés : #trouver_objet_cache #indice #passage_secret #embuscade #perception

## Niveaux de vie

Contexte : conversion du Crédit en argent disponible, capital et train de vie.  
Règle : le score de Crédit détermine un niveau de vie qui fournit des espèces disponibles, un capital total et un montant de dépenses courantes. Les petites dépenses inférieures au montant de dépenses courantes n’ont pas à être comptabilisées individuellement.

### Tableau — années 1920

| Niveau de vie | Crédit | Espèces | Capital | Dépenses courantes |
|---|---|---|---|---|
| Indigent | 0 ou moins | 0,50 $ | Aucun | 0,50 $ |
| Pauvre | 1–9 | `CR x1` | `CR x10` | 2 $ |
| Moyen | 10–49 | `CR x2` | `CR x50` | 10 $ |
| Aisé | 50–89 | `CR x5` | `CR x500` | 50 $ |
| Riche | 90–98 | `CR x20` | `CR x2 000` | 250 $ |
| Richissime | 99 | 50 000 $ | 5 millions ou plus | 5 000 $ |

### Tableau — époque moderne

| Niveau de vie | Crédit | Espèces | Capital | Dépenses courantes |
|---|---|---|---|---|
| Indigent | 0 ou moins | 10 $ | Aucun | 10 $ |
| Pauvre | 1–9 | `CR x20` | `CR x200` | 40 $ |
| Moyen | 10–49 | `CR x40` | `CR x1 000` | 200 $ |
| Aisé | 50–89 | `CR x100` | `CR x10 000` | 1 000 $ |
| Riche | 90–98 | `CR x400` | `CR x40 000` | 5 000 $ |
| Richissime | 99 | 1 million $ | 100 millions ou plus | 100 000 $ |

### Règles d’usage

- **Espèces** : argent liquide immédiatement accessible.
- **Capital** : valeur totale des investissements, biens immobiliers, placements ou parts d’entreprise.
- **Dépenses courantes** : achats mineurs quotidiens qui ne ponctionnent pas automatiquement espèces ou capital.

### Logique conditionnelle

- **Si** un achat reste inférieur au montant de dépenses courantes, **alors** il n’est pas nécessaire de le décompter précisément.
- **Si** le gardien estime qu’un joueur abuse de cette abstraction, **alors** il peut exiger une ponction du capital.
- **Si** le niveau de vie inclut maison ou voiture, **alors** ces biens sont compris dans le capital.
- **Si** l’investigateur voyage, **alors** le joueur doit préciser où il garde ses espèces.

> Mots-clés : #niveaux_de_vie #credit #especes #capital #depenses_courantes

## Sceptique ou croyant ?

Contexte : gestion mentale et ludique de la confrontation au Mythe.  
Règle : un investigateur peut choisir de rester sceptique face aux textes du Mythe. Dans ce cas, il gagne bien des points en Mythe de Cthulhu et réduit sa santé mentale maximale en conséquence, mais ne perd pas immédiatement de santé mentale. En revanche, à la première preuve tangible du Mythe, il devient automatiquement croyant et perd un nombre de points de santé mentale égal à son score en Mythe de Cthulhu.

### Logique conditionnelle

- **Si** l’investigateur lit ou étudie le Mythe tout en restant sceptique, **alors** il gagne les points de Mythe de Cthulhu sans perte immédiate de santé mentale.
- **Si** son score en Mythe augmente, **alors** sa santé mentale maximale diminue quand même.
- **Si** il rencontre une preuve tangible du Mythe et perd au moins `1` point de santé mentale à ce titre, **alors** il devient croyant de façon définitive.
- **Si** il devient croyant, **alors** il perd immédiatement autant de santé mentale que son niveau de Mythe de Cthulhu.
- **Si** il reste sceptique, **alors** il peut lire des ouvrages du Mythe et même apprendre des sorts, mais pas les lancer.
- **Si** le joueur souhaite faire de son investigateur un croyant volontairement, **alors** il subit la même perte de santé mentale.

> Mots-clés : #sceptique #croyant #mythe_de_cthulhu #sante_mentale #sorts

## Règles optionnelles — transfert entre spécialités

Contexte : propagation partielle d’expertise entre spécialités proches.  
Règle : cette option ne concerne **pas** `Arts et métiers` ni `Sciences`. En revanche, elle s’applique aux différentes spécialités de `combat rapproché`, `combat à distance`, `langues` (au sein d’un même groupe linguistique) et `survie`.

### Règle de seuil

- Lorsqu’un investigateur atteint pour la première fois `50 %` ou plus dans une spécialité, toutes les spécialités voisines gagnent `+10 %`, sans dépasser `50 %`.
- Lorsqu’il atteint pour la première fois `90 %` ou plus dans une spécialité, toutes les spécialités voisines gagnent encore `+10 %`, sans dépasser `90 %`.

### Groupes linguistiques explicitement visibles

| Groupe | Exemples |
|---|---|
| Bantoues | swahili, zoulou |
| Celtiques | breton, cornique, gaélique écossais, gallois, irlandais |
| Chinoises | cantonais, han, mandarin, wu |
| Finno-ougriennes | estonien, finnois, hongrois |
| Germaniques | afrikaans, allemand, anglais, danois, islandais, néerlandais, norvégien, suédois, yiddish |
| Indiques | bengali, cachemiri, hindi, népalais, ourdou |
| Nigéro-congolaises | dogon, mandingue |
| Romanes | espagnol, français, italien, latin, portugais, roumain |
| Slaves | bulgare, tchèque, polonais, russe, serbe, slovaque |
| Tibétaines | birman, sherpa, tibétain |
| Turques | azéri, tatar, turc, ouzbek |

### Logique conditionnelle

- **Si** une spécialité de combat, survie ou langue atteint `50 %`, **alors** les spécialités voisines gagnent `+10 %`, plafonné à `50 %`.
- **Si** elle atteint `90 %`, **alors** les spécialités voisines gagnent `+10 %`, plafonné à `90 %`.
- **Si** les langues appartiennent à des groupes totalement différents, **alors** aucun transfert ne s’applique.
- **Si** la compétence concernée est `Arts et métiers` ou `Sciences`, **alors** cette règle optionnelle ne s’applique pas.

> Mots-clés : #regle_optionnelle #transfert_entre_specialites #langues #combat #survie

# Observations RAG

## Priorité d’indexation

Contexte : optimisation de découpage documentaire.  
Règle : les meilleurs blocs pour vectorisation sont les sous-sections procédurales courtes, avec verbes d’action, seuils numériques, formules, tables et conditions `si/alors`.

### Chunks recommandés

| Chunk suggéré | Type |
|---|---|
| Lecture d’un D100 | règle technique |
| Notation de dés | règle technique |
| Impact et carrure | table de calcul |
| MVT | table de calcul |
| Valeurs dérivées | formule |
| Création accélérée | procédure |
| Liste des compétences | index |
| Premiers soins | règle médicale |
| Médecine | règle médicale |
| Trouver objet caché | règle d’investigation |
| Niveaux de vie | table économique |
| Sceptique ou croyant ? | règle mentale |
| Transfert entre spécialités | règle optionnelle |

> Mots-clés : #chunking #vectorisation #tables #formules #conditions

## Statut de complétude

Contexte : contrôle de couverture de l’extraction.  
Règle : ce fichier couvre la structure générale, l’introduction fonctionnelle, les bases de dés et de création, un sous-ensemble d’occupations, et un noyau exploitable du chapitre 5 centré sur les principes, la liste complète des compétences visibles, les compétences clés, les niveaux de vie, la distinction sceptique/croyant et la règle optionnelle de transfert entre spécialités.

> Mots-clés : #couverture #extraction_partielle #rag_ready

## Limites restantes

Contexte : éléments non encore convertis intégralement en blocs RAG exhaustifs.  
Règle : certaines compétences du chapitre 5 ne sont pas toutes détaillées individuellement dans ce fichier, même si elles figurent dans l’index. Les chapitres 6 à 10 n’ont pas encore été extraits au même niveau de granularité.

> Mots-clés : #limites #suite_possible #chapitres_restants
