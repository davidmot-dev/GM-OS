# Gabarits de l’Atelier de campagne

**Date :** 2026-08-15 · **Généré** depuis `src/modules/forge/campagne/gabaritsDeCampagne.ts`

Ce document est **produit par le code**, pas écrit à la main : il montre les invites
exactes que l’Atelier posera au carnet NotebookLM. Le relire est le seul moyen de les
corriger — *le levier est l’invite, pas le modèle*.

Les deux actes cités sont des **exemples**. En vrai ils viennent de la réponse du carnet
au gabarit 2, et c’est cette réponse qui décide combien d’appels suivront.

**13 invites** pour une campagne à deux actes : 2 d’ouverture, 7 fiches simples,
et 2 sujets × 2 actes.

---

## 1. Inventaire

```text
Tu analyses UNIQUEMENT les sources de ce carnet. Ne complète jamais avec des
connaissances extérieures.

Réponds DIRECTEMENT par le tableau demandé, dans ta réponse elle-même. Ne dépose
rien ailleurs et ne réponds pas par un compte rendu de ce que tu aurais produit :
ta réponse est le livrable.

Ces sources décrivent une CAMPAGNE ou un SCÉNARIO de jeu de rôle — une histoire
à jouer, avec ses lieux, ses personnages et ses intrigues. Pour chacun des sujets
ci-dessous, indique si les sources le traitent, et résume-le en une à deux
phrases :

1. Pitch de la campagne : de quoi parle-t-elle, ce que les personnages y font,
   et le ton recherché (registre, ambiance, rythme)
2. Structure de la campagne : la LISTE ORDONNÉE de ses grandes parties, telles que
   le livre les nomme (actes, chapitres, épisodes…). Pour chacune : son titre exact
   et l'enjeu qui s'y joue, en deux phrases. PAS le détail des scènes.
3. Factions, maisons, organisations et groupes en présence : leur nom, ce qu'ils
   veulent, et ce qui les oppose
4. Lieux majeurs où la campagne se déroule : leur nom, ce que les personnages y
   voient, et ce que seul le meneur en sait
5. Personnages non joueurs qui comptent : leur nom, ce qu'ils veulent, comment les
   jouer, leur faction, et leurs liens entre eux.
   PAS leurs caractéristiques chiffrées : le meneur les règle lui-même.
6. Secrets, révélations et indices : ce qui est caché, qui le sait, où cela peut se
   découvrir, et ce que la découverte change
7. Amorces : comment les personnages joueurs entrent dans cette histoire, et ce qui
   les y retient
8. Menaces qui progressent d'elles-mêmes si les personnages n'agissent pas :
   ce qui avance, à quel rythme, et ce qui se produit au bout
9. Scènes prévues : pour chacune, son titre, ce qui s'y joue, le lieu, les
   personnages présents et les indices qu'elle peut livrer
10. Règles que CETTE campagne ajoute ou modifie par rapport au jeu de base
   (sous-systèmes, horloges, procédures particulières).
   Si la campagne n'en ajoute aucune, dis-le : c'est une réponse.

Réponds par un TABLEAU MARKDOWN (avec des barres verticales), colonnes :
Sujet | Traité (oui/partiellement/non) | Contenu | Sections.

La colonne « Contenu » doit être CONCRÈTE : des noms propres, des nombres, des
lieux. « La campagne comporte plusieurs factions » est une réponse inutile ;
« trois maisons : les Atréides, les Harkonnen, les Corrino » en est une.

La colonne « Sections » donne les TITRES EXACTS des chapitres ou sections où se
trouve la matière, tels qu'ils y sont écrits. Aucun numéro de page.

Si un sujet n'est pas couvert par les sources, écris « non couvert par les
sources » — n'invente rien, ne comble pas par analogie avec d'autres campagnes.

N'aborde PAS les RÈGLES du jeu : résolution des jets, initiative, santé, dégâts,
portées, création de personnage. Elles appartiennent au système, pas à cette
campagne, et elles sont documentées ailleurs. Seul le sujet « Règles propres à
cette campagne » y touche, et uniquement pour ce que CE module ajoute ou modifie.

Ne donne AUCUNE caractéristique chiffrée de personnage — ni points de vie, ni
classe d'armure, ni score. Le meneur les règle lui-même, selon le jeu qu'il
emploie.

Ajoute ensuite une section « Hors catégories » listant ce que cette campagne
contient d'important et qui n'entre dans aucun des 10
sujets.
```

## 2. Structure en actes

```text
Tu analyses UNIQUEMENT les sources de ce carnet. N'invente rien.

Réponds DIRECTEMENT, dans ta réponse elle-même. Ne dépose rien ailleurs.

Donne la STRUCTURE de cette campagne : la liste ORDONNÉE de ses grandes parties,
telles que le livre les nomme — actes, chapitres, épisodes, parties. N'invente
pas un découpage que les sources ne donnent pas : si la campagne n'est pas
découpée, dis-le et décris son déroulement en une liste d'étapes.

Réponds par un TABLEAU MARKDOWN, colonnes :
Ordre | Titre exact | Enjeu | Sections.

- « Titre exact » : le titre TEL QUE LE LIVRE L'ÉCRIT, sans le traduire, sans le
  raccourcir et sans le renuméroter. C'est ce titre qui servira à interroger
  chaque partie séparément : une variante le rendrait introuvable.
- « Enjeu » : ce qui s'y joue, en deux phrases. Pas le détail des scènes.
- « Sections » : les titres exacts des chapitres correspondants. N'indique
  JAMAIS de numéro de page, ni de numéro de référence interne du carnet : les
  uns comme les autres sont faux une fois sortis d'ici.

Numérote la colonne « Ordre » en chiffres arabes : 1, 2, 3.

N'aborde PAS les RÈGLES du jeu : résolution des jets, initiative, santé, dégâts,
portées, création de personnage. Elles appartiennent au système, pas à cette
campagne, et elles sont documentées ailleurs. Seul le sujet « Règles propres à
cette campagne » y touche, et uniquement pour ce que CE module ajoute ou modifie.

Ne donne AUCUNE caractéristique chiffrée de personnage — ni points de vie, ni
classe d'armure, ni score. Le meneur les règle lui-même, selon le jeu qu'il
emploie.
```

## Pitch et ton

```text
Tu rédiges une fiche de campagne sur le sujet :
« Pitch et ton ».

Appuie-toi UNIQUEMENT sur les sources de ce carnet. Si elles ne suffisent pas,
dis-le explicitement plutôt que de compléter.

Réponds DIRECTEMENT par les sections ci-dessous, dans ta réponse elle-même. Ne
dépose rien ailleurs et ne réponds pas par un compte rendu : ta réponse est le
livrable.

Format : Markdown, exactement les sections ci-dessous et rien d'autre. N'emploie
aucune ligne de tirets « --- » et aucun bloc de métadonnées en en-tête : commence
directement par « ## Métadonnées ».

## Métadonnées
- sujet : Pitch et ton
- couverture : complète | partielle | absente
- sources : titre exact de chaque source utilisée
- sections : titres exacts des chapitres dont la matière est tirée

## Contenu
Pitch de la campagne : de quoi parle-t-elle, ce que les personnages y font,
   et le ton recherché (registre, ambiance, rythme)

ÉNUMÈRE TOUT ce que les sources donnent sur ce sujet, sans en omettre et sans
résumer. Si les sources nomment douze personnages, la fiche en porte douze. Une
liste à moitié rendue ne se voit pas : personne ne peut deviner ce qui manque.

Donne à chaque élément un TITRE EN GRAS suivi de sa description, un par
paragraphe. N'écris pas un texte suivi.

## Non couvert
Ce que ce sujet devrait contenir mais que les sources ne disent pas.
Écris « rien » si tout est couvert.

Règles de rédaction :

- Si les sources ne couvrent pas du tout ce sujet, rédige quand même ces
  sections avec « couverture : absente » et explique en une phrase ce que tu as
  cherché. Ne renvoie JAMAIS une réponse vide : une absence annoncée est une
  information, une absence muette est un trou qu'on découvrira en séance.
- Cite tes sources par TITRE DE SECTION dans le corps du texte, par exemple
  « (section « La Chute de Carthag ») ». N'indique JAMAIS de numéro de page, ni
  de numéro de référence interne du carnet : les uns comme les autres sont faux
  une fois sortis d'ici.
- Écris tous les symboles en toutes lettres. Si le livre utilise une icône,
  nomme-la au lieu de la reproduire.
- N'échappe pas la ponctuation : écris « 1. » et « + », jamais « 1\. » ni « \+ ».
- Garde les NOMS PROPRES exactement tels que le livre les écrit — personnages,
  lieux, factions. Ce sont eux qui relieront les fiches entre elles, et une
  variante orthographique casse le lien sans que rien ne le signale.
- Ne reformule pas en langage générique de jeu de rôle : garde le vocabulaire
  du livre.

N'aborde PAS les RÈGLES du jeu : résolution des jets, initiative, santé, dégâts,
portées, création de personnage. Elles appartiennent au système, pas à cette
campagne, et elles sont documentées ailleurs. Seul le sujet « Règles propres à
cette campagne » y touche, et uniquement pour ce que CE module ajoute ou modifie.

Ne donne AUCUNE caractéristique chiffrée de personnage — ni points de vie, ni
classe d'armure, ni score. Le meneur les règle lui-même, selon le jeu qu'il
emploie.
```

## Factions et organisations

```text
Tu rédiges une fiche de campagne sur le sujet :
« Factions et organisations ».

Appuie-toi UNIQUEMENT sur les sources de ce carnet. Si elles ne suffisent pas,
dis-le explicitement plutôt que de compléter.

Réponds DIRECTEMENT par les sections ci-dessous, dans ta réponse elle-même. Ne
dépose rien ailleurs et ne réponds pas par un compte rendu : ta réponse est le
livrable.

Format : Markdown, exactement les sections ci-dessous et rien d'autre. N'emploie
aucune ligne de tirets « --- » et aucun bloc de métadonnées en en-tête : commence
directement par « ## Métadonnées ».

## Métadonnées
- sujet : Factions et organisations
- couverture : complète | partielle | absente
- sources : titre exact de chaque source utilisée
- sections : titres exacts des chapitres dont la matière est tirée

## Contenu
Factions, maisons, organisations et groupes en présence : leur nom, ce qu'ils
   veulent, et ce qui les oppose

ÉNUMÈRE TOUT ce que les sources donnent sur ce sujet, sans en omettre et sans
résumer. Si les sources nomment douze personnages, la fiche en porte douze. Une
liste à moitié rendue ne se voit pas : personne ne peut deviner ce qui manque.

Donne à chaque élément un TITRE EN GRAS suivi de sa description, un par
paragraphe. N'écris pas un texte suivi.

## Non couvert
Ce que ce sujet devrait contenir mais que les sources ne disent pas.
Écris « rien » si tout est couvert.

Règles de rédaction :

- Si les sources ne couvrent pas du tout ce sujet, rédige quand même ces
  sections avec « couverture : absente » et explique en une phrase ce que tu as
  cherché. Ne renvoie JAMAIS une réponse vide : une absence annoncée est une
  information, une absence muette est un trou qu'on découvrira en séance.
- Cite tes sources par TITRE DE SECTION dans le corps du texte, par exemple
  « (section « La Chute de Carthag ») ». N'indique JAMAIS de numéro de page, ni
  de numéro de référence interne du carnet : les uns comme les autres sont faux
  une fois sortis d'ici.
- Écris tous les symboles en toutes lettres. Si le livre utilise une icône,
  nomme-la au lieu de la reproduire.
- N'échappe pas la ponctuation : écris « 1. » et « + », jamais « 1\. » ni « \+ ».
- Garde les NOMS PROPRES exactement tels que le livre les écrit — personnages,
  lieux, factions. Ce sont eux qui relieront les fiches entre elles, et une
  variante orthographique casse le lien sans que rien ne le signale.
- Ne reformule pas en langage générique de jeu de rôle : garde le vocabulaire
  du livre.

N'aborde PAS les RÈGLES du jeu : résolution des jets, initiative, santé, dégâts,
portées, création de personnage. Elles appartiennent au système, pas à cette
campagne, et elles sont documentées ailleurs. Seul le sujet « Règles propres à
cette campagne » y touche, et uniquement pour ce que CE module ajoute ou modifie.

Ne donne AUCUNE caractéristique chiffrée de personnage — ni points de vie, ni
classe d'armure, ni score. Le meneur les règle lui-même, selon le jeu qu'il
emploie.
```

## Lieux majeurs

```text
Tu rédiges une fiche de campagne sur le sujet :
« Lieux majeurs ».

Appuie-toi UNIQUEMENT sur les sources de ce carnet. Si elles ne suffisent pas,
dis-le explicitement plutôt que de compléter.

Réponds DIRECTEMENT par les sections ci-dessous, dans ta réponse elle-même. Ne
dépose rien ailleurs et ne réponds pas par un compte rendu : ta réponse est le
livrable.

Format : Markdown, exactement les sections ci-dessous et rien d'autre. N'emploie
aucune ligne de tirets « --- » et aucun bloc de métadonnées en en-tête : commence
directement par « ## Métadonnées ».

## Métadonnées
- sujet : Lieux majeurs
- couverture : complète | partielle | absente
- sources : titre exact de chaque source utilisée
- sections : titres exacts des chapitres dont la matière est tirée

## Contenu
Lieux majeurs où la campagne se déroule : leur nom, ce que les personnages y
   voient, et ce que seul le meneur en sait

ÉNUMÈRE TOUT ce que les sources donnent sur ce sujet, sans en omettre et sans
résumer. Si les sources nomment douze personnages, la fiche en porte douze. Une
liste à moitié rendue ne se voit pas : personne ne peut deviner ce qui manque.

Donne à chaque élément un TITRE EN GRAS suivi de sa description, un par
paragraphe. N'écris pas un texte suivi.

## Non couvert
Ce que ce sujet devrait contenir mais que les sources ne disent pas.
Écris « rien » si tout est couvert.

Règles de rédaction :

- Si les sources ne couvrent pas du tout ce sujet, rédige quand même ces
  sections avec « couverture : absente » et explique en une phrase ce que tu as
  cherché. Ne renvoie JAMAIS une réponse vide : une absence annoncée est une
  information, une absence muette est un trou qu'on découvrira en séance.
- Cite tes sources par TITRE DE SECTION dans le corps du texte, par exemple
  « (section « La Chute de Carthag ») ». N'indique JAMAIS de numéro de page, ni
  de numéro de référence interne du carnet : les uns comme les autres sont faux
  une fois sortis d'ici.
- Écris tous les symboles en toutes lettres. Si le livre utilise une icône,
  nomme-la au lieu de la reproduire.
- N'échappe pas la ponctuation : écris « 1. » et « + », jamais « 1\. » ni « \+ ».
- Garde les NOMS PROPRES exactement tels que le livre les écrit — personnages,
  lieux, factions. Ce sont eux qui relieront les fiches entre elles, et une
  variante orthographique casse le lien sans que rien ne le signale.
- Ne reformule pas en langage générique de jeu de rôle : garde le vocabulaire
  du livre.

N'aborde PAS les RÈGLES du jeu : résolution des jets, initiative, santé, dégâts,
portées, création de personnage. Elles appartiennent au système, pas à cette
campagne, et elles sont documentées ailleurs. Seul le sujet « Règles propres à
cette campagne » y touche, et uniquement pour ce que CE module ajoute ou modifie.

Ne donne AUCUNE caractéristique chiffrée de personnage — ni points de vie, ni
classe d'armure, ni score. Le meneur les règle lui-même, selon le jeu qu'il
emploie.
```

## Personnages non joueurs — Acte I — Le Sable et le Sang

```text
Tu rédiges une fiche de campagne sur le sujet :
« Personnages non joueurs — Acte I — Le Sable et le Sang ».

Appuie-toi UNIQUEMENT sur les sources de ce carnet. Si elles ne suffisent pas,
dis-le explicitement plutôt que de compléter.

Réponds DIRECTEMENT par les sections ci-dessous, dans ta réponse elle-même. Ne
dépose rien ailleurs et ne réponds pas par un compte rendu : ta réponse est le
livrable.

Format : Markdown, exactement les sections ci-dessous et rien d'autre. N'emploie
aucune ligne de tirets « --- » et aucun bloc de métadonnées en en-tête : commence
directement par « ## Métadonnées ».

## Métadonnées
- sujet : Personnages non joueurs
- partie : Acte I — Le Sable et le Sang
- couverture : complète | partielle | absente
- sources : titre exact de chaque source utilisée
- sections : titres exacts des chapitres dont la matière est tirée

## Contenu
Personnages non joueurs qui comptent : leur nom, ce qu'ils veulent, comment les
   jouer, leur faction, et leurs liens entre eux.
   PAS leurs caractéristiques chiffrées : le meneur les règle lui-même.
   UNIQUEMENT pour la partie intitulée « Acte I — Le Sable et le Sang ». Ignore le reste de la campagne :
   les autres parties font l'objet de demandes séparées.

ÉNUMÈRE TOUT ce que les sources donnent sur ce sujet, sans en omettre et sans
résumer. Si les sources nomment douze personnages, la fiche en porte douze. Une
liste à moitié rendue ne se voit pas : personne ne peut deviner ce qui manque.

Donne à chaque élément un TITRE EN GRAS suivi de sa description, un par
paragraphe. N'écris pas un texte suivi.

## Non couvert
Ce que ce sujet devrait contenir mais que les sources ne disent pas.
Écris « rien » si tout est couvert.

Règles de rédaction :

- Si les sources ne couvrent pas du tout ce sujet, rédige quand même ces
  sections avec « couverture : absente » et explique en une phrase ce que tu as
  cherché. Ne renvoie JAMAIS une réponse vide : une absence annoncée est une
  information, une absence muette est un trou qu'on découvrira en séance.
- Cite tes sources par TITRE DE SECTION dans le corps du texte, par exemple
  « (section « La Chute de Carthag ») ». N'indique JAMAIS de numéro de page, ni
  de numéro de référence interne du carnet : les uns comme les autres sont faux
  une fois sortis d'ici.
- Écris tous les symboles en toutes lettres. Si le livre utilise une icône,
  nomme-la au lieu de la reproduire.
- N'échappe pas la ponctuation : écris « 1. » et « + », jamais « 1\. » ni « \+ ».
- Garde les NOMS PROPRES exactement tels que le livre les écrit — personnages,
  lieux, factions. Ce sont eux qui relieront les fiches entre elles, et une
  variante orthographique casse le lien sans que rien ne le signale.
- Ne reformule pas en langage générique de jeu de rôle : garde le vocabulaire
  du livre.

N'aborde PAS les RÈGLES du jeu : résolution des jets, initiative, santé, dégâts,
portées, création de personnage. Elles appartiennent au système, pas à cette
campagne, et elles sont documentées ailleurs. Seul le sujet « Règles propres à
cette campagne » y touche, et uniquement pour ce que CE module ajoute ou modifie.

Ne donne AUCUNE caractéristique chiffrée de personnage — ni points de vie, ni
classe d'armure, ni score. Le meneur les règle lui-même, selon le jeu qu'il
emploie.
```

## Personnages non joueurs — Acte II — La Maison Divisée

```text
Tu rédiges une fiche de campagne sur le sujet :
« Personnages non joueurs — Acte II — La Maison Divisée ».

Appuie-toi UNIQUEMENT sur les sources de ce carnet. Si elles ne suffisent pas,
dis-le explicitement plutôt que de compléter.

Réponds DIRECTEMENT par les sections ci-dessous, dans ta réponse elle-même. Ne
dépose rien ailleurs et ne réponds pas par un compte rendu : ta réponse est le
livrable.

Format : Markdown, exactement les sections ci-dessous et rien d'autre. N'emploie
aucune ligne de tirets « --- » et aucun bloc de métadonnées en en-tête : commence
directement par « ## Métadonnées ».

## Métadonnées
- sujet : Personnages non joueurs
- partie : Acte II — La Maison Divisée
- couverture : complète | partielle | absente
- sources : titre exact de chaque source utilisée
- sections : titres exacts des chapitres dont la matière est tirée

## Contenu
Personnages non joueurs qui comptent : leur nom, ce qu'ils veulent, comment les
   jouer, leur faction, et leurs liens entre eux.
   PAS leurs caractéristiques chiffrées : le meneur les règle lui-même.
   UNIQUEMENT pour la partie intitulée « Acte II — La Maison Divisée ». Ignore le reste de la campagne :
   les autres parties font l'objet de demandes séparées.

ÉNUMÈRE TOUT ce que les sources donnent sur ce sujet, sans en omettre et sans
résumer. Si les sources nomment douze personnages, la fiche en porte douze. Une
liste à moitié rendue ne se voit pas : personne ne peut deviner ce qui manque.

Donne à chaque élément un TITRE EN GRAS suivi de sa description, un par
paragraphe. N'écris pas un texte suivi.

## Non couvert
Ce que ce sujet devrait contenir mais que les sources ne disent pas.
Écris « rien » si tout est couvert.

Règles de rédaction :

- Si les sources ne couvrent pas du tout ce sujet, rédige quand même ces
  sections avec « couverture : absente » et explique en une phrase ce que tu as
  cherché. Ne renvoie JAMAIS une réponse vide : une absence annoncée est une
  information, une absence muette est un trou qu'on découvrira en séance.
- Cite tes sources par TITRE DE SECTION dans le corps du texte, par exemple
  « (section « La Chute de Carthag ») ». N'indique JAMAIS de numéro de page, ni
  de numéro de référence interne du carnet : les uns comme les autres sont faux
  une fois sortis d'ici.
- Écris tous les symboles en toutes lettres. Si le livre utilise une icône,
  nomme-la au lieu de la reproduire.
- N'échappe pas la ponctuation : écris « 1. » et « + », jamais « 1\. » ni « \+ ».
- Garde les NOMS PROPRES exactement tels que le livre les écrit — personnages,
  lieux, factions. Ce sont eux qui relieront les fiches entre elles, et une
  variante orthographique casse le lien sans que rien ne le signale.
- Ne reformule pas en langage générique de jeu de rôle : garde le vocabulaire
  du livre.

N'aborde PAS les RÈGLES du jeu : résolution des jets, initiative, santé, dégâts,
portées, création de personnage. Elles appartiennent au système, pas à cette
campagne, et elles sont documentées ailleurs. Seul le sujet « Règles propres à
cette campagne » y touche, et uniquement pour ce que CE module ajoute ou modifie.

Ne donne AUCUNE caractéristique chiffrée de personnage — ni points de vie, ni
classe d'armure, ni score. Le meneur les règle lui-même, selon le jeu qu'il
emploie.
```

## Secrets et révélations

```text
Tu rédiges une fiche de campagne sur le sujet :
« Secrets et révélations ».

Appuie-toi UNIQUEMENT sur les sources de ce carnet. Si elles ne suffisent pas,
dis-le explicitement plutôt que de compléter.

Réponds DIRECTEMENT par les sections ci-dessous, dans ta réponse elle-même. Ne
dépose rien ailleurs et ne réponds pas par un compte rendu : ta réponse est le
livrable.

Format : Markdown, exactement les sections ci-dessous et rien d'autre. N'emploie
aucune ligne de tirets « --- » et aucun bloc de métadonnées en en-tête : commence
directement par « ## Métadonnées ».

## Métadonnées
- sujet : Secrets et révélations
- couverture : complète | partielle | absente
- sources : titre exact de chaque source utilisée
- sections : titres exacts des chapitres dont la matière est tirée

## Contenu
Secrets, révélations et indices : ce qui est caché, qui le sait, où cela peut se
   découvrir, et ce que la découverte change

ÉNUMÈRE TOUT ce que les sources donnent sur ce sujet, sans en omettre et sans
résumer. Si les sources nomment douze personnages, la fiche en porte douze. Une
liste à moitié rendue ne se voit pas : personne ne peut deviner ce qui manque.

Donne à chaque élément un TITRE EN GRAS suivi de sa description, un par
paragraphe. N'écris pas un texte suivi.

## Non couvert
Ce que ce sujet devrait contenir mais que les sources ne disent pas.
Écris « rien » si tout est couvert.

Règles de rédaction :

- Si les sources ne couvrent pas du tout ce sujet, rédige quand même ces
  sections avec « couverture : absente » et explique en une phrase ce que tu as
  cherché. Ne renvoie JAMAIS une réponse vide : une absence annoncée est une
  information, une absence muette est un trou qu'on découvrira en séance.
- Cite tes sources par TITRE DE SECTION dans le corps du texte, par exemple
  « (section « La Chute de Carthag ») ». N'indique JAMAIS de numéro de page, ni
  de numéro de référence interne du carnet : les uns comme les autres sont faux
  une fois sortis d'ici.
- Écris tous les symboles en toutes lettres. Si le livre utilise une icône,
  nomme-la au lieu de la reproduire.
- N'échappe pas la ponctuation : écris « 1. » et « + », jamais « 1\. » ni « \+ ».
- Garde les NOMS PROPRES exactement tels que le livre les écrit — personnages,
  lieux, factions. Ce sont eux qui relieront les fiches entre elles, et une
  variante orthographique casse le lien sans que rien ne le signale.
- Ne reformule pas en langage générique de jeu de rôle : garde le vocabulaire
  du livre.

N'aborde PAS les RÈGLES du jeu : résolution des jets, initiative, santé, dégâts,
portées, création de personnage. Elles appartiennent au système, pas à cette
campagne, et elles sont documentées ailleurs. Seul le sujet « Règles propres à
cette campagne » y touche, et uniquement pour ce que CE module ajoute ou modifie.

Ne donne AUCUNE caractéristique chiffrée de personnage — ni points de vie, ni
classe d'armure, ni score. Le meneur les règle lui-même, selon le jeu qu'il
emploie.
```

## Amorces et accroches

```text
Tu rédiges une fiche de campagne sur le sujet :
« Amorces et accroches ».

Appuie-toi UNIQUEMENT sur les sources de ce carnet. Si elles ne suffisent pas,
dis-le explicitement plutôt que de compléter.

Réponds DIRECTEMENT par les sections ci-dessous, dans ta réponse elle-même. Ne
dépose rien ailleurs et ne réponds pas par un compte rendu : ta réponse est le
livrable.

Format : Markdown, exactement les sections ci-dessous et rien d'autre. N'emploie
aucune ligne de tirets « --- » et aucun bloc de métadonnées en en-tête : commence
directement par « ## Métadonnées ».

## Métadonnées
- sujet : Amorces et accroches
- couverture : complète | partielle | absente
- sources : titre exact de chaque source utilisée
- sections : titres exacts des chapitres dont la matière est tirée

## Contenu
Amorces : comment les personnages joueurs entrent dans cette histoire, et ce qui
   les y retient

ÉNUMÈRE TOUT ce que les sources donnent sur ce sujet, sans en omettre et sans
résumer. Si les sources nomment douze personnages, la fiche en porte douze. Une
liste à moitié rendue ne se voit pas : personne ne peut deviner ce qui manque.

Donne à chaque élément un TITRE EN GRAS suivi de sa description, un par
paragraphe. N'écris pas un texte suivi.

## Non couvert
Ce que ce sujet devrait contenir mais que les sources ne disent pas.
Écris « rien » si tout est couvert.

Règles de rédaction :

- Si les sources ne couvrent pas du tout ce sujet, rédige quand même ces
  sections avec « couverture : absente » et explique en une phrase ce que tu as
  cherché. Ne renvoie JAMAIS une réponse vide : une absence annoncée est une
  information, une absence muette est un trou qu'on découvrira en séance.
- Cite tes sources par TITRE DE SECTION dans le corps du texte, par exemple
  « (section « La Chute de Carthag ») ». N'indique JAMAIS de numéro de page, ni
  de numéro de référence interne du carnet : les uns comme les autres sont faux
  une fois sortis d'ici.
- Écris tous les symboles en toutes lettres. Si le livre utilise une icône,
  nomme-la au lieu de la reproduire.
- N'échappe pas la ponctuation : écris « 1. » et « + », jamais « 1\. » ni « \+ ».
- Garde les NOMS PROPRES exactement tels que le livre les écrit — personnages,
  lieux, factions. Ce sont eux qui relieront les fiches entre elles, et une
  variante orthographique casse le lien sans que rien ne le signale.
- Ne reformule pas en langage générique de jeu de rôle : garde le vocabulaire
  du livre.

N'aborde PAS les RÈGLES du jeu : résolution des jets, initiative, santé, dégâts,
portées, création de personnage. Elles appartiennent au système, pas à cette
campagne, et elles sont documentées ailleurs. Seul le sujet « Règles propres à
cette campagne » y touche, et uniquement pour ce que CE module ajoute ou modifie.

Ne donne AUCUNE caractéristique chiffrée de personnage — ni points de vie, ni
classe d'armure, ni score. Le meneur les règle lui-même, selon le jeu qu'il
emploie.
```

## Menaces et progression

```text
Tu rédiges une fiche de campagne sur le sujet :
« Menaces et progression ».

Appuie-toi UNIQUEMENT sur les sources de ce carnet. Si elles ne suffisent pas,
dis-le explicitement plutôt que de compléter.

Réponds DIRECTEMENT par les sections ci-dessous, dans ta réponse elle-même. Ne
dépose rien ailleurs et ne réponds pas par un compte rendu : ta réponse est le
livrable.

Format : Markdown, exactement les sections ci-dessous et rien d'autre. N'emploie
aucune ligne de tirets « --- » et aucun bloc de métadonnées en en-tête : commence
directement par « ## Métadonnées ».

## Métadonnées
- sujet : Menaces et progression
- couverture : complète | partielle | absente
- sources : titre exact de chaque source utilisée
- sections : titres exacts des chapitres dont la matière est tirée

## Contenu
Menaces qui progressent d'elles-mêmes si les personnages n'agissent pas :
   ce qui avance, à quel rythme, et ce qui se produit au bout

ÉNUMÈRE TOUT ce que les sources donnent sur ce sujet, sans en omettre et sans
résumer. Si les sources nomment douze personnages, la fiche en porte douze. Une
liste à moitié rendue ne se voit pas : personne ne peut deviner ce qui manque.

Donne à chaque élément un TITRE EN GRAS suivi de sa description, un par
paragraphe. N'écris pas un texte suivi.

## Non couvert
Ce que ce sujet devrait contenir mais que les sources ne disent pas.
Écris « rien » si tout est couvert.

Règles de rédaction :

- Si les sources ne couvrent pas du tout ce sujet, rédige quand même ces
  sections avec « couverture : absente » et explique en une phrase ce que tu as
  cherché. Ne renvoie JAMAIS une réponse vide : une absence annoncée est une
  information, une absence muette est un trou qu'on découvrira en séance.
- Cite tes sources par TITRE DE SECTION dans le corps du texte, par exemple
  « (section « La Chute de Carthag ») ». N'indique JAMAIS de numéro de page, ni
  de numéro de référence interne du carnet : les uns comme les autres sont faux
  une fois sortis d'ici.
- Écris tous les symboles en toutes lettres. Si le livre utilise une icône,
  nomme-la au lieu de la reproduire.
- N'échappe pas la ponctuation : écris « 1. » et « + », jamais « 1\. » ni « \+ ».
- Garde les NOMS PROPRES exactement tels que le livre les écrit — personnages,
  lieux, factions. Ce sont eux qui relieront les fiches entre elles, et une
  variante orthographique casse le lien sans que rien ne le signale.
- Ne reformule pas en langage générique de jeu de rôle : garde le vocabulaire
  du livre.

N'aborde PAS les RÈGLES du jeu : résolution des jets, initiative, santé, dégâts,
portées, création de personnage. Elles appartiennent au système, pas à cette
campagne, et elles sont documentées ailleurs. Seul le sujet « Règles propres à
cette campagne » y touche, et uniquement pour ce que CE module ajoute ou modifie.

Ne donne AUCUNE caractéristique chiffrée de personnage — ni points de vie, ni
classe d'armure, ni score. Le meneur les règle lui-même, selon le jeu qu'il
emploie.
```

## Scènes prévues — Acte I — Le Sable et le Sang

```text
Tu rédiges une fiche de campagne sur le sujet :
« Scènes prévues — Acte I — Le Sable et le Sang ».

Appuie-toi UNIQUEMENT sur les sources de ce carnet. Si elles ne suffisent pas,
dis-le explicitement plutôt que de compléter.

Réponds DIRECTEMENT par les sections ci-dessous, dans ta réponse elle-même. Ne
dépose rien ailleurs et ne réponds pas par un compte rendu : ta réponse est le
livrable.

Format : Markdown, exactement les sections ci-dessous et rien d'autre. N'emploie
aucune ligne de tirets « --- » et aucun bloc de métadonnées en en-tête : commence
directement par « ## Métadonnées ».

## Métadonnées
- sujet : Scènes prévues
- partie : Acte I — Le Sable et le Sang
- couverture : complète | partielle | absente
- sources : titre exact de chaque source utilisée
- sections : titres exacts des chapitres dont la matière est tirée

## Contenu
Scènes prévues : pour chacune, son titre, ce qui s'y joue, le lieu, les
   personnages présents et les indices qu'elle peut livrer
   UNIQUEMENT pour la partie intitulée « Acte I — Le Sable et le Sang ». Ignore le reste de la campagne :
   les autres parties font l'objet de demandes séparées.

ÉNUMÈRE TOUT ce que les sources donnent sur ce sujet, sans en omettre et sans
résumer. Si les sources nomment douze personnages, la fiche en porte douze. Une
liste à moitié rendue ne se voit pas : personne ne peut deviner ce qui manque.

Donne à chaque élément un TITRE EN GRAS suivi de sa description, un par
paragraphe. N'écris pas un texte suivi.

## Non couvert
Ce que ce sujet devrait contenir mais que les sources ne disent pas.
Écris « rien » si tout est couvert.

Règles de rédaction :

- Si les sources ne couvrent pas du tout ce sujet, rédige quand même ces
  sections avec « couverture : absente » et explique en une phrase ce que tu as
  cherché. Ne renvoie JAMAIS une réponse vide : une absence annoncée est une
  information, une absence muette est un trou qu'on découvrira en séance.
- Cite tes sources par TITRE DE SECTION dans le corps du texte, par exemple
  « (section « La Chute de Carthag ») ». N'indique JAMAIS de numéro de page, ni
  de numéro de référence interne du carnet : les uns comme les autres sont faux
  une fois sortis d'ici.
- Écris tous les symboles en toutes lettres. Si le livre utilise une icône,
  nomme-la au lieu de la reproduire.
- N'échappe pas la ponctuation : écris « 1. » et « + », jamais « 1\. » ni « \+ ».
- Garde les NOMS PROPRES exactement tels que le livre les écrit — personnages,
  lieux, factions. Ce sont eux qui relieront les fiches entre elles, et une
  variante orthographique casse le lien sans que rien ne le signale.
- Ne reformule pas en langage générique de jeu de rôle : garde le vocabulaire
  du livre.

N'aborde PAS les RÈGLES du jeu : résolution des jets, initiative, santé, dégâts,
portées, création de personnage. Elles appartiennent au système, pas à cette
campagne, et elles sont documentées ailleurs. Seul le sujet « Règles propres à
cette campagne » y touche, et uniquement pour ce que CE module ajoute ou modifie.

Ne donne AUCUNE caractéristique chiffrée de personnage — ni points de vie, ni
classe d'armure, ni score. Le meneur les règle lui-même, selon le jeu qu'il
emploie.
```

## Scènes prévues — Acte II — La Maison Divisée

```text
Tu rédiges une fiche de campagne sur le sujet :
« Scènes prévues — Acte II — La Maison Divisée ».

Appuie-toi UNIQUEMENT sur les sources de ce carnet. Si elles ne suffisent pas,
dis-le explicitement plutôt que de compléter.

Réponds DIRECTEMENT par les sections ci-dessous, dans ta réponse elle-même. Ne
dépose rien ailleurs et ne réponds pas par un compte rendu : ta réponse est le
livrable.

Format : Markdown, exactement les sections ci-dessous et rien d'autre. N'emploie
aucune ligne de tirets « --- » et aucun bloc de métadonnées en en-tête : commence
directement par « ## Métadonnées ».

## Métadonnées
- sujet : Scènes prévues
- partie : Acte II — La Maison Divisée
- couverture : complète | partielle | absente
- sources : titre exact de chaque source utilisée
- sections : titres exacts des chapitres dont la matière est tirée

## Contenu
Scènes prévues : pour chacune, son titre, ce qui s'y joue, le lieu, les
   personnages présents et les indices qu'elle peut livrer
   UNIQUEMENT pour la partie intitulée « Acte II — La Maison Divisée ». Ignore le reste de la campagne :
   les autres parties font l'objet de demandes séparées.

ÉNUMÈRE TOUT ce que les sources donnent sur ce sujet, sans en omettre et sans
résumer. Si les sources nomment douze personnages, la fiche en porte douze. Une
liste à moitié rendue ne se voit pas : personne ne peut deviner ce qui manque.

Donne à chaque élément un TITRE EN GRAS suivi de sa description, un par
paragraphe. N'écris pas un texte suivi.

## Non couvert
Ce que ce sujet devrait contenir mais que les sources ne disent pas.
Écris « rien » si tout est couvert.

Règles de rédaction :

- Si les sources ne couvrent pas du tout ce sujet, rédige quand même ces
  sections avec « couverture : absente » et explique en une phrase ce que tu as
  cherché. Ne renvoie JAMAIS une réponse vide : une absence annoncée est une
  information, une absence muette est un trou qu'on découvrira en séance.
- Cite tes sources par TITRE DE SECTION dans le corps du texte, par exemple
  « (section « La Chute de Carthag ») ». N'indique JAMAIS de numéro de page, ni
  de numéro de référence interne du carnet : les uns comme les autres sont faux
  une fois sortis d'ici.
- Écris tous les symboles en toutes lettres. Si le livre utilise une icône,
  nomme-la au lieu de la reproduire.
- N'échappe pas la ponctuation : écris « 1. » et « + », jamais « 1\. » ni « \+ ».
- Garde les NOMS PROPRES exactement tels que le livre les écrit — personnages,
  lieux, factions. Ce sont eux qui relieront les fiches entre elles, et une
  variante orthographique casse le lien sans que rien ne le signale.
- Ne reformule pas en langage générique de jeu de rôle : garde le vocabulaire
  du livre.

N'aborde PAS les RÈGLES du jeu : résolution des jets, initiative, santé, dégâts,
portées, création de personnage. Elles appartiennent au système, pas à cette
campagne, et elles sont documentées ailleurs. Seul le sujet « Règles propres à
cette campagne » y touche, et uniquement pour ce que CE module ajoute ou modifie.

Ne donne AUCUNE caractéristique chiffrée de personnage — ni points de vie, ni
classe d'armure, ni score. Le meneur les règle lui-même, selon le jeu qu'il
emploie.
```

## Règles propres à cette campagne

```text
Tu rédiges une fiche de campagne sur le sujet :
« Règles propres à cette campagne ».

Appuie-toi UNIQUEMENT sur les sources de ce carnet. Si elles ne suffisent pas,
dis-le explicitement plutôt que de compléter.

Réponds DIRECTEMENT par les sections ci-dessous, dans ta réponse elle-même. Ne
dépose rien ailleurs et ne réponds pas par un compte rendu : ta réponse est le
livrable.

Format : Markdown, exactement les sections ci-dessous et rien d'autre. N'emploie
aucune ligne de tirets « --- » et aucun bloc de métadonnées en en-tête : commence
directement par « ## Métadonnées ».

## Métadonnées
- sujet : Règles propres à cette campagne
- couverture : complète | partielle | absente
- sources : titre exact de chaque source utilisée
- sections : titres exacts des chapitres dont la matière est tirée

## Contenu
Règles que CETTE campagne ajoute ou modifie par rapport au jeu de base
   (sous-systèmes, horloges, procédures particulières).
   Si la campagne n'en ajoute aucune, dis-le : c'est une réponse.

ÉNUMÈRE TOUT ce que les sources donnent sur ce sujet, sans en omettre et sans
résumer. Si les sources nomment douze personnages, la fiche en porte douze. Une
liste à moitié rendue ne se voit pas : personne ne peut deviner ce qui manque.

Donne à chaque élément un TITRE EN GRAS suivi de sa description, un par
paragraphe. N'écris pas un texte suivi.

## Non couvert
Ce que ce sujet devrait contenir mais que les sources ne disent pas.
Écris « rien » si tout est couvert.

Règles de rédaction :

- Si les sources ne couvrent pas du tout ce sujet, rédige quand même ces
  sections avec « couverture : absente » et explique en une phrase ce que tu as
  cherché. Ne renvoie JAMAIS une réponse vide : une absence annoncée est une
  information, une absence muette est un trou qu'on découvrira en séance.
- Cite tes sources par TITRE DE SECTION dans le corps du texte, par exemple
  « (section « La Chute de Carthag ») ». N'indique JAMAIS de numéro de page, ni
  de numéro de référence interne du carnet : les uns comme les autres sont faux
  une fois sortis d'ici.
- Écris tous les symboles en toutes lettres. Si le livre utilise une icône,
  nomme-la au lieu de la reproduire.
- N'échappe pas la ponctuation : écris « 1. » et « + », jamais « 1\. » ni « \+ ».
- Garde les NOMS PROPRES exactement tels que le livre les écrit — personnages,
  lieux, factions. Ce sont eux qui relieront les fiches entre elles, et une
  variante orthographique casse le lien sans que rien ne le signale.
- Ne reformule pas en langage générique de jeu de rôle : garde le vocabulaire
  du livre.

N'aborde PAS les RÈGLES du jeu : résolution des jets, initiative, santé, dégâts,
portées, création de personnage. Elles appartiennent au système, pas à cette
campagne, et elles sont documentées ailleurs. Seul le sujet « Règles propres à
cette campagne » y touche, et uniquement pour ce que CE module ajoute ou modifie.

Ne donne AUCUNE caractéristique chiffrée de personnage — ni points de vie, ni
classe d'armure, ni score. Le meneur les règle lui-même, selon le jeu qu'il
emploie.
```
