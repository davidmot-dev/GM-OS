# Shadowrun : Anarchy 2.0 — sommaire, 31/10/2026

David : « GM-OS Studio fait le TOC pour Shadowrun Anarchy », références dans
`docs/Reference/_Shadowrun Anarchy/`.

## Produit et vérifié

`output/sommaires/shadowrun-anarchy/sran2_01anarchyv2_TOC_table_des_matieres_flat.md` :
**327 entrées**, Markdown plat UTF-8, **10 536 octets**. Source dédiée
`sran2_01anarchyv2_TOC.pdf`, deux pages PDF correspondant aux pages imprimées 2–3,
trois colonnes chacune ; ordre gauche à droite, de haut en bas.

Six colonnes vérifiées visuellement, premières et dernières entrées présentes ;
55/54/57 puis 55/54/52 entrées. Intitulés, casse, accents, noms et numéros imprimés conservés.
Pointillés et puces décoratives retirés ; retours de ligne de titres réunis.
Les deux points mal extraits dans « Anarchy 2.0 » ont été lus sur les images.
« SIN et licenses » et les vraies répétitions sont conservés tels qu’imprimés.
Les mentions légales, le filigrane et la pagination propre au sommaire sont exclus.

Rapport avec empreintes source/sortie et repères de contrôle :
`output/sommaires/shadowrun-anarchy/verification.json` ; relevé par page/colonne dans
`entrees-source.json`. Source PDF intacte ; aucun autre atelier lancé.

## Reprendre

Utiliser le Markdown livré pour le futur corpus Shadowrun Anarchy. Aucun identifiant de pilote
ou dossier `docs/systems/` n’a été inventé pour cet atelier. Aucun import GM-OS réalisé,
aucun `src/` ou `electron/` modifié, aucun service ni paquet ajouté. Fichiers non commités.

## Piège

L’extraction pleine page mélange les colonnes, et certains caractères de pointillés apparaissent
comme U+FFFD. Lire chaque colonne séparément ; ne pas remplacer ces caractères partout avant
d’avoir vérifié le point de « 2.0 ». Les doublons de texte de certaines fontes s’éliminent avec
`pdfplumber.dedupe_chars()` ; cela ne justifie pas de supprimer les vraies entrées répétées.
