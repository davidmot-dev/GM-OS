# Delta Green — index et table des matières — 12/11/2026

David prépare un pilote Delta Green et demande à GM-OS Studio de créer l’index et la table des
matières à partir de `docs/Reference/Delta Green/`. Atelier `gmos-studio:sommaire` : extraction
fidèle en Markdown plat, une entrée par ligne, pagination imprimée et renvois conservés.

## Fichiers livrés

- `docs/systems/delta-green/index/dgmanuel_de_lagent_table_des_matieres_flat.md` : **93 entrées**,
  extraites de `dgmanuel_de_lagent_TOC.pdf` (une page, deux colonnes).
- `docs/systems/delta-green/index/dgmanuel_de_lagent_index_flat.md` : **791 lignes**, rubriques et
  renvois compris, extraites de `dgmanuel_de_lagent_Index.pdf` (cinq pages, numérotées 179 à 183,
  trois colonnes chacune).

Les autres références (fiche de personnage, glossaire, signets et captures) restent disponibles
pour les autres ateliers. Le pilote en cours de création n’a pas été modifié.

## Vérifications

- Texte extrait avec pdfplumber, colonnes lues de gauche à droite et de haut en bas.
- Six pages rendues avec pypdfium2 et examinées en image ; vérification des retours à la ligne,
  des numéros de page et des particularités de la source.
- Contrôle automatique : tous les caractères du texte extrait des quinze colonnes de l’index
  sont conservés dans les entrées regroupées, hors espaces de mise en page.
- Index : 147 lignes issues de la page 179, 166 de la page 180, 188 de la page 181,
  165 de la page 182 et 125 de la page 183.
- Sommaire : première entrée « Vue d’ensemble — 4 », dernière « Fiches de personnage — 190 ».
- Sortie UTF-8, listes à un seul niveau ; ni titre courant, ni pagination des pages sources,
  ni filigrane nominatif dans les livrables.

Extraction et rendus intermédiaires : `tmp/delta-green-index/` ; rapport de contrôle
`verification.json`. Aucune installation de dépendance nécessaire.

## Particularités de l’index source, conservées

Il ne faut pas confondre les défauts imprimés de l’index avec des erreurs d’extraction :

- Page 179 : « activité personnelles », « actions multiples ultiples », renvoi
  « Volonté (points (VOL) » ; entrée « budget opérationnel / objets » sans page, et
  « réglementés — 106 » placé plus bas dans la colonne.
- Page 180 : deux entrées successives « suffocation — 62 », « kit de surive du flic » et
  pagination « 124–125–129 » du Département de la Défense.
- Page 181 : renvoi « gestionnaire d’agents » répété deux fois.
- Page 182 : « CDC : bureau de la santé publique pour la » et « ICE : division du renseignement
  (HSI/ » restent incomplets dans la première colonne ; les fragments « Intelligence) — 121 »
  et « préparation et l’intervention — 158 » apparaissent séparément dans la deuxième.
  Leur emplacement est conservé, sans reconstruction silencieuse ni page inventée.
- Page 183 : « activité personnelle : améliorer des compétences ou des » reste sans suite et
  sans page ; les deux occurrences du groupe DEVGRU/SEALs portent « 133, 134, 143 135 ».

Ces fichiers fournissent les outils de repérage du Manuel de l’Agent. Ils ne constituent pas
une relecture des règles du futur pilote.
