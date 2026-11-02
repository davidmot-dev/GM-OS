# Une campagne complète et ses ateliers, dans un seul .gmos

**Décision de David, 01/11/2026 :** appliquer ce format à toutes les futures campagnes
d'essais. Les anciennes livraisons à trois archives restent historiques. Une demande
explicite de plusieurs campagnes peut déroger au défaut ; le mot « laboratoires » seul
ne constitue pas cette demande.

## Une histoire à mener

La cible habituelle est **10 à 15 séances**, articulées en trois à cinq actes narratifs,
sans quota artificiel. Une campagne plus courte ou plus longue répond à une demande ou
à une contrainte expliquée. Ne livre pas une succession de titres ou une courte enquête
simplement étirée. Chaque séance a des situations préparées et exploitables à la table.

- Une prémisse et un conflit principal, des enjeux compréhensibles et une entrée pour
  chacun des PJ ; des arcs secondaires reliés à ce conflit et aux motivations des PJ.
- Des factions et adversaires avec buts, moyens, relations, réactions et évolution en cas
  d'inaction ; des PNJ alliés utiles au-delà d'une seule scène.
- Des lieux décrits, indices redondants, pistes alternatives, rencontres réglées pour le
  pilote réel, négociation/exploration/conflit et récompenses adaptées au jeu.
- Pour chaque séance : ouverture, enjeux, scènes et liens, informations accessibles,
  réactions possibles, aide au MJ, issues et passages vers la suite. Une séance ne doit
  pas être un simple « faire un test » ou « lire les notes de la suivante ».
- Des conséquences à reporter entre séances, des bifurcations et plusieurs fins cohérentes.
  Préparer les réactions possibles n'écrit pas à l'avance ce que les joueurs ont fait.

Reste fidèle aux références fournies et aux règles relues. Signale la fiction originale
quand une communauté, un lieu ou un profil n'est pas canonique. Les séances sont **prévues**,
leurs bilans restent à jouer ; une aide publique ne révèle pas les secrets du meneur.

## Une seule campagne GM-OS

Le ZIP contient **un seul fichier de campagne `.gmos`**. Histoire, Atlas, Wiki, PNJ,
indices, rencontres, séances et ateliers partagent son ID de campagne. Le pilote séparé
est éventuellement un `.gmos-driver` ; ce n'est pas une campagne supplémentaire.

Dans la Trame, un acte séparé **« ATELIERS DE RECETTE — hors fiction »** contient les
scènes d'essai nommées par leurs cas. Elles sont accessibles directement, sans terminer
l'intrigue. Ne les mêle pas aux enchaînements obligatoires des actes narratifs. Utilise
les champs et types réellement disponibles ; ne crée pas un nouveau module ou un faux
type de scène pour obtenir cette séparation.

Les PJ principaux correspondent aux joueurs autorisés. Si un état limite exige un autre
PJ, préfixe son nom `[RECETTE]`, rattache-le à la même campagne et affecte-le seulement aux
scènes d'essai concernées. Crée le minimum de profils supplémentaires ; un PNJ de recette
peut suffire si aucun parcours joueur n'est à vérifier. Aucune ancienne fiche copiée.

La matrice et le cahier visent tous le même fichier et précisent acte/scène/personnage.
Le guide distingue clairement l'usage « jouer l'histoire » et l'usage « ouvrir un atelier ».

## Recommencer un essai sans perdre la partie

**ETATS-DE-REFERENCE.md** donne pour chaque cas les seuls champs d'essai concernés, leur
cible exacte, leurs valeurs de départ et les gestes de restauration. Décris les valeurs
dans les termes du jeu : maximum, valeur actuelle, dégâts, dépenses et effets séparés.

Utilise une commande native locale seulement si elle a été vérifiée dans la version cible.
Sinon, documente une remise en état **manuelle** des seuls champs d'un personnage de recette.
Cette annexe est une aide et n'est pas un fichier d'import GM-OS. N'invente pas d'API de
réinitialisation, d'import JSON ou de bouton réservé à un atelier.

**Nexus « Remplacer » restaure toute la campagne.** Il ne remet pas seulement un atelier à
zéro. Ne recommande ni ce remplacement ni un clonage par défaut pour répéter un essai.
Conserve une note et une valeur d'un PJ principal comme témoins dans la recette isolée :
exécuter puis rétablir l'essai doit préserver ces témoins, y compris après rechargement.
Une restauration complète ou une copie de la partie relève d'un choix explicite du meneur.

## Ce qui doit être vérifié

- Une seule archive de campagne livrée ; l'import n'ajoute qu'une seule campagne aux
  campagnes préexistantes, qu'il conserve avec les anciens PJ, profils et avatars.
- Une vraie continuité préparée, des séances jouables et des fins alternatives, relues
  éditorialement : un contrôle structurel ne peut pas certifier cette qualité narrative.
- Atelier atteignable dans la Trame, personnages corrects, ressources/états et règles
  conformes ; cas normal, seuil, refus, persistance et remise en état locale documentés.
- Dans un essai applicatif autorisé : état de recette rétabli, progression et témoins de
  fiction inchangés. Sinon, ces preuves restent NON EXÉCUTÉES, sans promesse de reset natif.
- Médias embarqués, secrets filtrés dans les trames, contrôles liés aux SHA du fichier
  final ; cas humains NON TESTÉS tant que le meneur ne les a pas essayés.
