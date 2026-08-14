# SRD Year Zero Engine — corpus de **famille**, pas de jeu

Ce dossier n'est pas un jeu. C'est le **socle mécanique** dont plusieurs jeux héritent : Alien,
Tales from the Loop, Forbidden Lands, Mutant : Année Zéro. Il porte ce qu'un livre de jeu suppose
connu et ne réexplique pas — ce qu'est une réserve de dés, pourquoi on compte les six, ce que
veut dire forcer un test.

## Pourquoi il existe

Relevé le 2026-08-14, après la dérivation du pilote d'Alien. Quatre champs à énumération fermée —
`dice.engine`, `combat.initiativeSort`, `combat.defaultHealthType`, `combat.tacheDeDefaite` — ont
dû être réparés **un par un**, en écrivant leurs valeurs admissibles dans l'invite de la Forge.
Chacun est devenu juste dès la dérivation suivante.

La famille les donnerait d'emblée : « YZE » veut dire réserve de d6, `count-success`,
`superieur-ou-egal`, on relance pour forcer et le stress monte. Cela ne se déduit pas du livre
d'Alien page par page ; c'est ce sur quoi Alien est bâti.

## Les deux règles à ne pas défaire

**Le jeu l'emporte toujours sur sa famille.** Alien *modifie* YZE — le stress, la panique, les dés
de stress lui appartiennent. Une famille qui prendrait le dessus produirait un pilote générique et
faux, ce qui est pire qu'un pilote incomplet. La famille ne sert qu'à **combler ce que le corpus du
jeu ne couvre pas**, et le comblement doit rester visible à la revue.

**Une lacune peut être une réponse.** La Monnaie de table d'Alien est vide, et c'est juste : le jeu
n'a pas de réserve partagée. Un comblement automatique lui en inventerait une.

## Ce qu'il ne fait pas

**Il n'entre pas dans l'index de l'Oracle.** Vérifié le 2026-08-14 : `portee()` rend `null` pour un
dossier de `systems/` qui ne correspond pas au système actif, donc ce corpus n'est jamais consulté
en séance tant qu'aucune campagne ne le désigne. C'est voulu — le 2026-08-11, huit doublons dans
quatre systèmes faisaient recevoir à l'Oracle deux versions d'une même règle.

**Il n'a pas de pilote, et n'en aura pas.** Il apparaîtra donc comme « corpus orphelin » dans le
tableau des pilotes, avec une invitation à lui en donner un : à ignorer. La convention qui
distinguera les familles des jeux reste à écrire.

## État

Forgé depuis NotebookLM, sur la source SRD du Year Zero Engine, avec le canevas des quatorze
sujets — le même que pour un jeu, il est générique.
