# Alien — améliorations proposées après lecture du livre et de NotebookLM

> **Suivi des améliorations :** le [registre dédié à Alien](2026-10-19-registre-ameliorations-alien.md)
> porte les décisions, priorités et états des lots A0–A8. Créé le 19/10 à la demande de David,
> il fait foi pour leur avancement ; le présent document conserve l’analyse technique initiale.

Analyse de Codex, **19/10/2026**. David demande les améliorations du pilote Alien à partir du
dossier de livres sur CLOUDDAVID et de NotebookLM. **Analyse seule ; aucun développement lancé.**

## Sources et portée

- Livre retenu dans le dossier fourni :
  `\\CLOUDDAVID\Media\Jeux de Rôle\03. Futur\1. Space Opera\Aliens\ALIEN (Arkhane Asylum)\ALIEN_le_jeu_de_rôle.pdf`.
  Copie de travail : `scratch/alien-livre-audit.pdf`, **398 pages PDF**.
  Dans les passages examinés, page PDF = page imprimée **+3**.
- Deux errata présents dans ce même dossier, copiés pour lecture : `ALIEN-Errata-1.pdf`
  (09/04/2021) et `ALIEN-Errata.pdf` (04/11/2021). Le second reprend le premier et ajoute une
  correction concernant Le Destructeur des Mondes. Ils ajoutent notamment **Guérison rapide**
  et **Rechargement rapide**, ainsi que la ligne 55 des avaries mineures du livre de base.
- [Carnet NotebookLM ALIEN](https://notebooklm.google.com/notebook/c24fbd5e-116f-4b38-9a22-c95bc8f40bf5) :
  six sources. Deux consultations limitées à la source du **livre français**
  `f4440c1f-8992-4d2a-ba46-c8dd9a4105b0` ; les résumés de séances et Marines Coloniaux n'ont
  pas servi à fixer les règles du livre de base. Réponses :
  `scratch/alien-audit/notebook-stress-jets.json` et `notebook-survie-combat.json`.
- La [présentation française de l'éditeur](https://www.arkhane-asylum.fr/jeu/Alien/)
  confirme les modes Cinéma et Campagne. L'[Evolved Edition présentée par Free League](https://freeleaguepublishing.com/games/alien/)
  révise l'expérience d'origine : **ne pas importer ses règles dans ce pilote sans décision
  distincte de David**. Le présent audit suit son PDF français et ses errata.
- Code, tests, correspondance HTML et manuel 54 Alien lus dans le dépôt à partir de `ed44c680`.
  **Pas d'export Alien récent trouvé dans `Export Dirvers/`**. Les conclusions sur les lecteurs
  du moteur sont vérifiées dans le code ; la configuration exacte du pilote installé devra
  être contrôlée sur son export avant développement. Aucune donnée personnelle ouverte.
  `e2e/donnees/pilote-alien-accessoires.json` est explicitement fictif et ne reproduit pas
  les règles Alien : il n'a pas été pris pour le pilote du jeu.

## Ce qui est déjà fait — à conserver

Le manuel, le registre et les tests confirment les réalisations du 14–16/10 :

- Réserve Attribut + Compétence, dés de Stress séparés, six comptés comme réussites.
- Forçage : Stress +1 avant relance, nouveau dé de Stress, six conservés, refus après un 1
  de Stress et pour un androïde. Les huit talents de second forçage sont déjà pris en charge.
- Test de Panique 1d6 + Stress, lecture de la table au poste MJ, cumul inscrit sur la fiche,
  geste « Calmé ». Point de Récit dépensé pour ajouter un six, conservé lors d'un forçage.
- Gestes de Stress hors jets : ajustements, repos et objet fétiche.
- Santé principale alignée avec la fiche ; maximum lu sur la Force. Cartes d'initiative 1–10.
- Fiche HTML reliée, pistes comptées et inventaire transmis.
- MU/TH/UR et détecteur **intégrés au Hub**, avec droits privés, préparation, historique,
  préréglages, alarmes et diffusion sonore. Les évolutions de ces modules ne sont pas à
  reproposer comme une intégration manquante.

Les tables de Panique, blessures humaines/synthétiques/xénomorphes, traumatismes mentaux et
attaques spéciales existent déjà dans `databases/tables/Alien/`.
La suite utile porte surtout sur leur raccord aux conséquences et aux choix des personnages.

## A0 — Vérifier le pilote réel et fiabiliser les références

Récupérer l'export Alien effectivement utilisé, sans changer ses identifiants. Contrôler la
Forge et les correspondances avant toute évolution. Certaines synthèses de règles restent
`relu:false`, citent des nombres de pages qui dépassent le PDF ou résument trop largement les
exceptions. Les réponses NotebookLM contiennent également des références impossibles et
quelques généralisations : les passages du livre ont été relus directement.

Ne pas ajouter les talents de forçage, le Point de Récit ou le cumul de Panique une seconde
fois. Vérifier en revanche Guérison rapide et Rechargement rapide, ajoutés par l'errata.
Les règles ci-dessous doivent être traitées dans le moteur quand le pilote seul ne peut
pas les exprimer. Ne pas présenter un enrichissement de JSON comme une mécanique achevée.

## A1 — Donner leurs conséquences aux paniques et aux variations de Stress

**Constat vérifié :** `jouerLaPanique` dans `PanneauDeJet.tsx` calcule le total, applique le
cumul et garde la ligne, mais ne remplace pas le résultat de compétence par une action annulée.
Le verdict et les réussites restent ceux du jet ; le Point de Récit peut aussi remettre
`tagSuccess:true` sans tenir compte de la panique. Le livre p. 104 impose pourtant qu'un
effet **10+** annule l'action d'origine lorsqu'il résulte de ce test, même avec des six.

Proposer un déroulé : résultat provisoire → test de Panique → conséquences → résultat
définitif. Un jet annulé par la panique ne doit pas ensuite appliquer ses dégâts ou ses actions
d'éclat. Un Point de Récit ne supprime pas l'action de panique obligatoire.

Étendre le panneau aux effets des p. 103–105 :

- Stress +1 si au moins un dégât effectivement subi, après protection, ainsi que pour le tir
  automatique ; aperçu et validation pour les événements d'horreur décidés par Maman.
- Panique déclenchable sans lancer de compétence : blessure critique, tir qui cloue sur place,
  première attaque d'une créature inconnue ou scène choisie par le MJ.
- Effets de table : modification de Stress, perte d'action, tremblement à −2 sur les tests
  d'Agilité, objet lâché, fuite, etc. Les personnes affectées par contagion sont sélectionnées
  selon portée, audition, visibilité et amitié ; ne pas appliquer l'effet à toute la campagne.
- Terminaison de la panique après le délai pertinent, Commandement ou état Brisé ; distinguer
  fin d'effet et récupération de Stress. Garder une file de conséquences sans réappliquer
  les mêmes événements lors d'une reconnexion.
- Après un résultat de Panique 13+, rappeler en fin de séance le test d'Empathie seul pour
  le risque de traumatisme permanent (p. 104), puis la table déjà disponible.

**Point de lecture à trancher avant de toucher au cumul existant :** le texte français p. 104
parle d'un nouveau résultat *inférieur* ; le code augmente aussi en cas d'égalité. Ce point
reste identifié comme une ambiguïté à vérifier, pas comme un correctif acquis.

## A2 — Compléter les réserves de dés, l'équipement et les actions d'éclat

La correspondance déclare actuellement absentes de GM-OS les colonnes HTML **Bonus, Dégâts
et Portée** des armes ; seuls leurs noms remontent. Créer des armes utilisables au jet, avec
leurs paramètres, puis afficher clairement : attribut, compétence, bonus d'arme/outil,
conditions, aide et modificateurs de situation (p. 58–64, 91–97).

La recette du panneau et le manuel utilisent une réserve de base plafonnée à **10**.
C'est la somme maximale Attribut humain + Compétence, pas nécessairement le plafond d'un
jet avec équipement, aide ou talents. À vérifier dans l'export réel avant de le modifier.

Ajouter un modificateur de dés signé qui suit la règle p. 62 : retirer d'abord les dés de base,
puis les dés de Stress si le malus dépasse la base. Le mécanisme des dés supplémentaires
actuel borne le bonus à zéro au minimum : ce n'est pas le lecteur d'un malus Alien.
Si aucun dé ne reste, expliquer l'impossibilité du test.

L'aide apporte **+1 dé par personne, au plus +3**, avant le lancer (p. 63) ; elle ne se résout
pas avec le d20 séparé proposé pour Dune. Les oppositions annulent les réussites de l'attaquant
par celles du défenseur, sans réutiliser la procédure d'opposition 2d20.

Après réussite, proposer les actions d'éclat de la **compétence utilisée** : dégâts, désarmer,
clouer sur place, effet d'information, etc. Consommer les réussites excédentaires une fois,
en montrant l'effet retenu et en gardant les choix narratifs à Maman.

## A3 — Relier tir, munitions, protection et blessures

**Tir et munitions** (p. 61, 94–96) : choisir l'arme, viser, tirer en automatique, gérer la
portée et les cibles secondaires. Le mode automatique ajoute +2 dés de base et **+1 Stress
avant le tir**. Un 1 de Stress vide le chargeur **après l'attaque**, pour une arme à munitions
limitées. Proposer le rechargement, décompter un chargeur plein et son action lente, ou rapide
avec le talent de l'errata. Ne pas inventer une consommation cartouche par cartouche.

**Protection** (p. 98) : Protection en nombre de d6, chaque six retire un dégât, sans Stress
ni forçage. Le bouton `ProtectionDuCombattant` existant lit une lettre A–D et lance les dés
échelonnés de **Blade Runner** : il ne suffit pas de lui donner une armure Alien de valeur 6.
Ajouter un mode de protection adapté et les propriétés des armes, plutôt qu'un détournement.

**Brisé et critiques** (p. 98–101) : à zéro, blessure critique ; nouveau coup qui inflige des
dégâts à un humain déjà Brisé → autre critique. Interdire les tests de compétence ordinaires
au Brisé humain. Relier le **D66** à la table humaine, enregistrer blessure, effets, fatalité,
délai et guérison. Les tables sont présentes : c'est la procédure qu'il faut compléter.

Séparer les soins pour se relever et ceux pour empêcher une mort par blessure fatale.
Le test de Trépas est Endurance **sans Stress et sans forçage** ; les délais récurrents doivent
être suivis, jamais transformés en un jet de compétence ordinaire. Récupérer toute sa Santé
ne guérit pas automatiquement une blessure critique.

**Piège du raccord au panneau générique Hors Jeu :** il utilise `facesDeLaTable` puis
`DiceEngine.roll(faces)`. Pour une table `d66`, cet appel produirait un entier de 1 à 66,
pas deux d6 donnant 11–66. Le bon moteur `rollStandard(66,1)` existe déjà. Ce n'est pas
un défaut affirmé du pilote Alien installé ; c'est une correction préalable à sa réutilisation
pour ce nouveau raccord.

## A4 — Faire de l'androïde une règle complète

L'interdiction de forcer existe, mais elle ne supprime pas les dés de Stress par elle-même.
Preuve sur la recette réelle du moteur : `androide:true` avec un ancien Stress à 3 donne
toujours trois dés secondaires dans `preparerLeJet`. Une donnée résiduelle ne devrait pas
faire paniquer un synthétique (p. 29, 111).

Prévoir une nature structurée utilisée par tous les lecteurs :

- Aucun Stress, aucune panique, aucun forçage, sans détruire une ancienne saisie en silence.
- Blessures synthétiques **D6**, maintien des actions selon l'avarie et Arrêt du système,
  au lieu de la règle humaine de Brisé. Une même blessure critique répétée s'aggrave.
- Réparations par Comtech et un Quart ; pas de guérison humaine ni de test de Trépas.
- Immunités aux privations et aux périls cités p. 111 ; pas de chargeur vidé aléatoirement
  via un dé de Stress qu'il ne lance pas. Ne pas confondre cette règle avec l'absence de
  chargeurs ou d'armes à usage unique.

## A5 — Donner une mécanique aux consommables, aux états et aux radiations

**Consommables** (p. 34–35) : bouton « Tester la Réserve » pour Air, Eau, Nourriture et Énergie.
Lancer autant de d6 que la réserve, **maximum six dés**, puis retirer un point par 1.
Ces dés utilisent les faces de stress, mais le test de Réserve **ne doit pas déclencher une
panique de compétence**. Ce n'est pas le dé d'usure d8→d6 de Cthulhu Hack.

Proposer les échéances selon le temps de jeu : Air par Tour et après effort, Eau par jour
et après effort, Nourriture par jour, Énergie selon l'appareil et son utilisation. Maman active
le suivi en situation de pénurie et choisit la gestion individuelle ou collective. Une alarme
MU/TH/UR réelle ne doit pas retirer de l'Air en arrière-plan sans cette activation.

**États** (p. 106–107) : Affamé, Déshydraté, Épuisé et Gelé sont actuellement déclarés
**absents de la correspondance GM-OS**. Les relier et appliquer leurs effets exacts, notamment
les restrictions de récupération de Stress. Ne pas généraliser tous leurs effets de Santé
sans relire chaque état. Prévoir les délais et conditions de sortie, sous contrôle du MJ.

**Radiations** (p. 110) : distinguer Rads courants et permanents ; proposer les tests lors
de l'exposition et de la récupération, avec leurs conséquences. L'encombrement (p. 34)
pourrait aussi être calculé depuis le vrai équipement, y compris les consommables.

## A6 — Suivre les actions et traiter les xénomorphes comme des créatures particulières

L'initiative numérotée existe. La suite utile est un budget **lente + rapide, ou deux rapides**,
les blocages et tirs en surveillance hors tour, ainsi que les échanges d'initiative aux moments
permis (p. 87–97). Une réaction consomme une action réelle, pas une action gratuite supplémentaire.

Pour un xénomorphe, plusieurs cartes sont nécessaires : **une par point de Vitesse**, toutes
reliées à **un même** adversaire et à sa Santé (p. 112, 291). Chaque carte donne son créneau
d'actions. Le modèle courant du combattant utilise une initiative scalaire : ne pas dupliquer
la créature en plusieurs fiches de santé pour simuler sa vitesse.

Raccorder sa table d'attaques spéciales existante (D6 ou choix de Maman), ses compétences propres
sans attribut humain, son armure naturelle et ses critiques particuliers à zéro. La Vitesse
peut changer après une blessure, avec retrait d'une carte. Un xéno à zéro n'est pas forcément
mort ni soumis aux soins humains.

Enfin, proposer l'éclaboussure d'acide du XX121 : réserve d'acide de la créature + dégâts reçus,
cibles au Contact, protection rongée et attaques aux rounds suivants avec réserve divisée
par deux (p. 298). Seuls les dégâts qui font couler du sang la déclenchent ; le feu en est exclu.
Maman valide les victimes et effets sur le décor. La mécanique ne s'applique pas indistinctement
à toutes les espèces aliens.

## A7 — Distinguer Cinéma et Campagne, suivre la fin d'acte et de séance

Le livre distingue réellement ces usages (p. 26, 31, 35–36, 104) :

- **Cinéma** : objectifs personnels par acte, remise privée au joueur, attribution des Points
  de Récit par Maman à la fin d'acte (maximum 3), et usage de l'objet fétiche par acte.
- **Campagne** : bilan des neuf questions de PX, un point par réponse positive, puis achats
  entre séances et prérequis d'apprentissage ; objet fétiche une fois par séance.
- **Tous** : garder Camarade/Rival, talents structurés et blessures persistantes ; rappeler
  le traumatisme mental éventuel de fin de séance sans l'attribuer automatiquement.

Les objectifs secrets ont leur place dans le Hub ; ils ne doivent pas rejoindre le journal public
ou les projections de tout le groupe. Le contenu narratif reste écrit/validé par Maman.

## A8 — Étendre les accessoires à la procédure de jeu, si souhaité

Le détecteur actuel est volontairement un accessoire de mise en scène : positions tirées
dans une proximité réglée par le MJ, pas de distance réelle ni d'Énergie prélevée.

Une évolution **optionnelle** serait un mode discret raccordé (p. 85–86) :
déplacements de deux zones par Tour pour les humains, ennemis cachés sur le plan MJ,
utilisation du détecteur au plus une fois par Tour et test d'Énergie. Le scan ne révèle
que les mouvements pertinents dans la portée, pas automatiquement la nature de la créature
ni une ligne de tir. Garder le mode de mise en scène existant disponible.

MU/TH/UR pourrait recevoir des dossiers et objectifs d'acte, mais les effets d'un piratage
et d'un protocole resteraient arbitrés par Maman. Ce n'est pas une nouvelle intégration du
module : droits, files de demandes, alarmes et sauvegardes sont déjà réalisés.

Le **combat spatial** serait un chantier séparé plus important : fiche de vaisseau et équipage,
quatre phases Senseurs/Pilote/Artilleur/Ingénieur, ordres secrets simultanés puis résolution
dans l'ordre, ciblage, coque et avaries (p. 188–200). L'alarme d'autodestruction ne constitue
pas à elle seule ce sous-système. Vérifier la ligne 55 des avaries mineures selon l'errata.

## Ordre recommandé et recette

1. **A0 + A1** : pilote réel, panique et résultat final, puis Stress effectivement subi.
2. **A2 + A3** : équipement et modificateurs, tir, protection et blessures.
3. **A4 + A5** : synthétiques, consommables et états de survie.
4. **A6**, puis **A7** ; A8 suivant les usages de David en partie.

Recettes à prévoir au développement : réussite aux dés puis panique effective 10 → action annulée ;
blessure critique → panique proposée hors jet ; androïde avec Stress résiduel → zéro dé de Stress ;
malus −4 sur base 2 / Stress 3 → base 0 / Stress 1 ; bonus d'arme non perdu au plafond 10 ;
réserve d'Air 8 → six dés au plus et un 1 retire un point ; pas de panique sur cette usure ;
arme vide après 1 de Stress et rechargement avec le bon coût d'action ; critique humain en vrai
D66, synthétique en D6 ; Vitesse 2 → deux initiatives et une seule Santé ; aucun soin humain
sur un xénomorphe ; un effet de panique traité une fois malgré déconnexion/reconnexion.

## État et preuves

Constats de fonctions du moteur exécutés dans `scratch/alien-audit/constats.mjs` et conservés
dans `constats.json` : Stress résiduel d'androïde, plafond à 10 de la recette, absence de malus
via les dés supplémentaires, appel scalaire 66 distinct du vrai D66. Ces constats utilisent
une déclaration tirée du test `PanneauDeJet.yearZero.test.tsx`, **pas le pilote installé**.
Le défaut de verdict après panique et les états non reliés sont relevés directement dans
les lecteurs et dans la correspondance versionnée.

Cinq pages rendues dans `scratch/alien-audit/` ; pages imprimées 104, 111 et 291 relues à l'image.
Les règles d'Air, de soins, de combat spatial et d'acide ont été relues dans les pages extraites.
Pas de suite complète, de test d'interface ni de campagne réelle pour cet audit.

**Aucun `src/` ou `electron/` modifié, aucune donnée personnelle lue, aucun paquet installé,
aucun service lancé, aucun commit/push.** Le registre et une note NOC étaient déjà modifiés
à l'arrivée : ils ont été laissés intacts pour respecter l'écrivain en cours. Le présent rapport
et la note de reprise portent le résultat sans attribuer un numéro de chantier concurrent.

Avant développement : demander l'export actuel, choisir le premier lot avec David et demander
« GM-OS tourne-t-il ? » avant toute modification de `src/` ou `electron/`.
