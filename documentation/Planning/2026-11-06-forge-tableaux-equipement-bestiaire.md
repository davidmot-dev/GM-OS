# La Forge écrit des tableaux lisibles — équipement et bestiaire — plan du 06/11/2026

**Statut** : plan tranché par David le 06/11 (§ « Décisions de David ») ; rien n'est codé. Les étapes
se lancent à sa demande.

David, le 06/11 : *« j'ai essayé de remplir les équipements de COC à partir de l'atelier et malgré
le fait que j'ai une fiche, rien ne se remplit »*, puis *« je voudrais à terme que le moteur de
l'atelier puisse faire le travail correctement pour les équipements et le bestiaire »*.

## Le constat

- « Remplir depuis le corpus » (catalogue et bestiaire) ne lit que des **tableaux Markdown** :
  - la première colonne nomme une **famille** (`Arme`, `Protection`, `Véhicule`, `Objet`…), ou
    `Créature` pour le bestiaire ;
  - le titre du tableau donne la catégorie et la page : `### Tableau des Armes de contact (p. 93)`.
- La fiche de COC forgée le 06/11 (`equipements-et-objets.md`, gabarit v3, `relu: false`) n'a **aucun
  tableau** : de la prose et des listes (« Gilet rigide : RD 8, malus -4 »). Elle donne les règles de
  prix, pas la liste des armes, renvoyée « aux sujets du combat ».
- **La cause dans le moteur** : la consigne « un tableau du livre se recopie en TABLEAU MARKDOWN » et
  le tableau de profil des créatures ne sont écrits que dans `consignesDuSupplement`
  (`src/modules/forge/rules/gabarits.ts`), **vide pour un livre de base**. Le gabarit du livre de
  base demande 1 500 à 2 500 caractères : trop peu pour 36 armes.
- **Rien ne le signale** : l'atelier publie la fiche, et l'écran du catalogue compte zéro fiche
  d'équipement sans dire pourquoi.

Pour COC, le 06/11 : la fiche `equipement-armes-et-protections-du-livre-de-base.md` a été transcrite
du PDF à la main (36 armes, 8 protections, une colonne de prix par époque) ; l'écran « Remplir
depuis le corpus » dit désormais quelle fiche parle d'équipement ou de créatures sans tableau.
Ce plan vise à ce que la Forge le fasse seule.

## Les étapes proposées

### F1 — Le contrôle à la relecture (d'abord : il ne coûte presque rien)

Dans l'atelier de règles, quand une fiche est relue avant publication, la passer aux deux lecteurs
réels, à blanc (`remplirDepuisLesFiches`, `remplirLeBestiaire`) et afficher le bilan :
« 36 armes et 7 protections lisibles par le catalogue », « 2 lignes illisibles (4 cases pour
5 colonnes) », « aucun tableau d'équipement ». Une fiche dont le sujet est l'équipement ou des
créatures et qui ne donne **rien** au lecteur est signalée en alerte. *Un contrôle qui se tait est
pire qu'absent* : c'est le défaut de COC.

### F2 — Des consignes de tableau pour tout livre, selon la nature du sujet

- Reconnaître un **sujet d'équipement** (armes, armures, protections, véhicules, matériel, objets,
  biens) ou **de créatures** (bestiaire, adversaires, créatures, PNJ chiffrés), qu'il vienne du
  livre de base ou d'un supplément.
- Pour ces sujets, la consigne de tableau s'applique toujours, avec le format exact du lecteur :
  - une section `### Tableau des <catégorie> (p. N)` par tableau du livre ;
  - la première colonne s'appelle `Arme`, `Protection`, `Véhicule` ou `Objet` (jamais
    « Armes à distance légères » : c'est le titre qui porte la catégorie) ;
  - les colonnes telles que le livre les nomme ; `Coût`, `Poids` et `Spécial` sont reconnues ;
  - les notes de bas de tableau vont dans `Spécial` ; « N/A » s'écrit « – » ;
  - toutes les lignes, le nom en gras.
- Le bestiaire garde son format (tableau de profil `Créature`, tables « D6 | Attaque », colonne
  « Table d'attaques ») ; il sort de `consignesDuSupplement` pour valoir aussi au livre de base.
- La borne de longueur suit le nombre de lignes, comme pour un supplément.

### F3 — Un tableau par requête quand le livre est long

NotebookLM coupe vers 6 minutes (mesuré : 356 s sur le gabarit entier). Un chapitre d'armes de
quarante lignes, sept colonnes, dépasse ce qu'une requête rend sûrement. Proposer : l'inventaire
liste les tableaux du chapitre (titre, page, nombre de lignes attendu) ; la Forge demande **un
tableau par requête** ; la fiche s'assemble. Le nombre de lignes attendu devient un contrôle :
« 15 armes attendues, 12 recopiées ».

### F4 — Le livre vérifie la fiche

Le registre des livres donne maintenant le PDF et son décalage. Pour chaque tableau `(p. N)`, le
processus principal lit la page N + décalage et cherche, ligne par ligne, le nom et les valeurs de la
fiche dans le texte de la page (l'ordre des colonnes n'est pas fiable dans le texte extrait ; la
présence des jetons l'est). Bilan : « 34 lignes sur 36 retrouvées sur leur page ; à vérifier :
Fusil de précision (30 introuvable p. 94) ». Le carnet a déjà inventé des règles : on ne publie pas
un tableau chiffré sans ce contrôle.

### F5 — Le lecteur accepte les familles du livre

Le lecteur refuse aujourd'hui une première colonne « Explosif », « Armes à distance légères » ou
« Munitions ». Élargir `familleDuTableau` (et l'équivalent du bestiaire : « Adversaire »,
« PNJ », « Monstre ») pour qu'un tableau recopié tel que le livre l'imprime soit lu, sans attendre
que la Forge renomme sa colonne.

## L'ordre recommandé

F1, puis F5, puis F2, puis F4, puis F3. F1 et F5 se font sans toucher aux invites et servent tout de
suite ; F2 change les fiches forgées ; F4 s'appuie sur le registre des livres ; F3 est la plus
lourde et ne vaut que si F2 bute sur la longueur.

## Décisions de David — 06/11/2026

*« 1. tu rajoutes une colonne par époque 2. On l'accepte avec alerte 3. tu attends le moteur pour
le tester »* :

1. **Les prix selon l'époque vont au catalogue**, une colonne par époque (`Prix 2025` … `Prix 1865`),
   remplie quand le nom de l'arme concorde ; un appariement fait au sens est dit dans la fiche. Fait
   pour COC le 06/11. F2 demandera la même chose à la Forge : un tableau de prix rapporté aux objets
   du chapitre des caractéristiques, pas un tableau à part.
2. **Une fiche d'équipement forgée sans tableau est publiée, avec l'alerte** (F1) : elle n'est pas
   refusée. L'alerte dit ce que le lecteur attend.
3. **Le bestiaire de COC attend le moteur** : il n'est pas transcrit à la main ; c'est sur lui que F2
   (et F1) seront essayés.
