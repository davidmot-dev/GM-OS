# Torg Eternity — état et reprise Codex du 07/11/2026

## Produit

Demande de David : « on va finir les amélioration de TORG des améliorations tous les pilotes ».
TORG-A0 à A4 livrés : six Atouts à possession déclarée, coûts et usages, échanges une pour une
dans la bonne zone, Désorientés, Domination, Ténacité et Souffrance, transfert Sbires choisi et
confirmé sans double coup. Les dégâts ordinaires des adversaires autonomes et du calculateur
sont raccordés à la même table ; une attaque multicible partage le reçu pour Souffrance.

Pilote corrigé : `Export Dirvers/corriges/Torg-Eternity-2.0.0.gmos-driver`, reconstruit par
`outils/torg/finir_torg.mjs`. Version 2.0.0, identifiants et trois paquets conservés ; dix cases
ajoutées, fausses par défaut. `verifier_pilote.mjs` donne zéro constat et prépare un vrai jet.
**Essais validés par David le 07/11/2026** : TORG-A0 à A4 passent au vert. Aucun commit ni push demandé dans cette validation.

Manuels 53/54, captures, synthèse et registre § 231 actualisés.
[Détail du lot et résultats](2026-11-07-torg-ameliorations.md).
Contrôles finaux réussis : build et types, lint sur 2 679 fichiers (zéro erreur, un avertissement
préexistant), **10 070 tests réussis, quatre sautés, zéro échec**. Recette Electron/Hub : un test
réussi, y compris les vrais boutons Dégâts du PJ et du vilain autonome, puis réimport Remplacer.
Captures du manuel : un test réussi, dix images de base et quatre nouvelles images relues.
[Rapport des contrôles](../../output/torg-ameliorations/verification-automatique.json).

## Premier geste de reprise

**Suite GM-OS Studio, fiche PJ :** David a demandé de vider l'image fournie en conservant
la Table des Bonus. Fichiers livrés : [HTML interactif](../../docs/fiches/Torg/torg-eternity-fiche-pj-vierge-interactive.html),
[PDF](../../output/fiches/torg/torg-eternity-fiche-pj-vierge.pdf) et
[PNG](../../output/fiches/torg/torg-eternity-fiche-pj-vierge.png), modèle `torg-eternity-fr`,
une page, 152 zones, 145 clés nouvelles. Table inchangée pixel pour pixel, six captures relues ;
validation, navigation/zoom, JSON, sauvegarde, reset, impression et import dans un moteur
jetable contrôlés. Le gabarit et la correspondance ont ensuite été installés (moteur version 24,
registre § 234), avec correction de Choc/Blessures ; essais validés par David le 07/11.
Scripts dans `outils/torg/`, rapports dans `output/fiches/torg/`, registre § 232. Aucun commit.

David réimporte le pilote avec **Remplacer**, puis coche et
sauvegarde les Atouts/capacités réellement possédés. Les valeurs anciennes sont conservées ;
aucun droit n'est déduit du carnet en texte libre.

Retour de David du 07/11 : « ok j'ai fait les test tu peux marquer comme bon dans le fichier
des améliorations ». Les lots TORG-A0 à A4 et la fiche PJ reliée sont marqués validés.
Le corpus n'est pas relu en entier : trois fiches métier sur seize sont relues, treize et
l'inventaire attendent encore. Les autres Lois, effets imprimés des cartes, conditions
fictionnelles et Défaite restent arbitrés par le meneur ; Annulation conserve sa correction
manuelle préexistante.
Les contrôles d'état KO/Déconnecté du lot portent sur cartes et Atouts ; le meneur reste
responsable de leur prise en compte avant un jet ordinaire ou une Annulation.

## Pièges déjà payés

- Le PDF fait foi. Ingénieux et Populaire sont dans *Empire du Nil* v1 p. 17 ; Chef naturel
  coûte une Possibilité et pose deux cartes pour un **autre** personnage (base p. 85).
  Déconnexion ne bannit pas toutes les cartes (p. 179). Un 2–4 dans la plage critique peut
  réussir avec sa conséquence, seul le 1 échoue toujours (p. 109).
- Le Hub ne liste que les personnages présents dans une séance active. La fixture doit
  déclarer `sessionEntityIds` et les champs de transport des joueurs/personnages.
- Une séance active empêche la Bibliothèque de rester ouverte, même si le bandeau est forcé
  en Atelier : constat hors lot enregistré au § 1 bis. Terminer la séance fictive avant le réimport.
- Un `Math.random` constant fabrique aussi des identifiants de notifications identiques.
  La recette garde ses d20 à 16 avec de faibles variations ; attendre la disparition des
  notifications avant les photos. Les cartes visibles sont des illustrations fictives.
- Ne pas démonter le panneau d'Atout lorsque la dépense rend momentanément la fiche sale :
  conserver le composant et désactiver son fieldset, sinon le choix local est perdu.
- Ne pas se contenter du chemin Sbires : les boutons Dégâts/Soins ordinaires et le calculateur
  doivent produire le même reçu, sur la cible finale, y compris sans fiche de campagne.
- `apply_patch` sur plusieurs fichiers peut en modifier certains avant un échec plus loin.
  Relire le disque avant de rejouer une opération ; des doublons ont été détectés puis retirés.
- Essais : `npx.cmd vitest run --maxWorkers=4`, types `npx.cmd tsc -b`, build avant Electron.
  Sous PowerShell, terminer une commande redirigée par `exit $LASTEXITCODE` pour distinguer
  les avertissements écrits sur stderr d'un véritable échec.
- Fiche vierge : `pypdf.remove_text()` réécrit les nombres des commandes graphiques et
  déplace certains pixels du fond. Retirer les 88 blocs BT/ET de cette page précise en
  conservant les autres octets ; le script prouve zéro pixel changé sur la Table des Bonus.

## Fichiers non commités

Le lot initial Torg comprend le code des cartes/combat/fiche, les tests, le corpus ciblé, les manuels,
captures, planning, deux scripts et les rapports sous `output/torg-ameliorations/`.
**93 fichiers modifiés ou ajoutés, non commités**, hors archive :
[inventaire complet](../../output/torg-ameliorations/fichiers-du-lot.json).
L'atelier de fiche ajoute ses propres livrables et réactualise cinq documents communs :
[inventaire de l'atelier](../../output/fiches/torg/fichiers-du-lot.json), sans commit.
Contrôles des fiches du dépôt et du manuel : 46 tests réussis, zéro échec.
L'export corrigé est livré séparément et ne doit pas être commité.
Le pilote RuneQuest corrigé déjà modifié et les fichiers de corpus Blade Runner ne sont pas
à ce chantier ; ils sont conservés. Ne pas inclure les exports voisins, `.codex/`, les traces
ou les scripts temporaires dans un futur commit.
