# Argyropée — GM-OS Studio, 08/11/2026

Demande de David : « peux-tu faire la table des matière, l’index, le thème, la bannière,
l’identité visuelle et la fiche de personnage à partir des fichiers de référence qui se trouve ici
C:\Projet_David\GM-OS-v5\docs\Reference\Argyropée ».

Les six livrables sont produits. Guide complet :
[`LIRE-MOI.md`](../../output/gmos-studio/argyropee/LIRE-MOI.md).

- Sommaire : 101 entrées, `docs/systems/argyropee/index/livre-de-base-2-table-des-matieres-flat.md`.
- Index : 430 entrées, `docs/systems/argyropee/index/livre-de-base-2-index-flat.md`.
- Thème : `docs/systems/argyropee/theme/`, accepté sans erreur ni avertissement ;
  trois ornements, un grain papier et quinze icônes, direction des pages intérieures à l’encre.
- Bannière : `docs/systems/argyropee/Argyropée Band.jpg`, 2400 × 600, 337 959 octets.
  Source générée 2172 × 724 ; agrandissement autorisé par David le 08/11 :
  « Oui, livrer en 2400 × 600 ». Outil natif image_gen puis Pillow pour le traitement technique.
- Identité : `output/gmos-studio/argyropee/identite-visuelle.txt`, 36/13 mots, validée.
- Fiche : `docs/fiches/Argyropée/argyropee-fiche-interactive.html`, deux pages,
  326 zones, 128 clés, identifiant neuf `argyropee-fr`, zéro clé retirée.

Validateurs thème et fiche exécutés par leurs scripts Node (npm.ps1 est bloqué par la politique
PowerShell). Fiche acceptée avec deux avertissements d’intégration attendus : modèle absent du
moteur intégré et correspondance absente. Essai hors ligne dans Edge headless isolé : saisie,
pistes, sauvegarde/rechargement, import/export, erreurs d’import, confirmation, zoom,
émulation tactile, impression et import dans le vrai moteur avec retour JSON passent.
Captures relues. Les vitrines thème et en-tête sont des simulations, clairement étiquetées.

Préparation reproductible dans `outils/argyropee/`. Aucune modification de `src/`, `electron/`,
du moteur de fiches, des références ni des données personnelles. Aucun paquet installé, aucun
service lancé, aucune écriture git. Le pilote n’est pas modifié : activation du thème/bannière,
copie de l’identité et correspondance de fiche restent des étapes d’intégration, hors atelier.

Le registre et la synthèse des pilotes présentaient déjà des modifications étrangères au début
du travail ; laissés intacts conformément à la règle d’un seul écrivain. Cette note fournit les
ancres du lot pour leur prochain report. Ce lot ne constitue pas une amélioration intégrée du pilote.

Le PDF au nom du livre complet ne compte que quatre pages dans ces références ; aucune relecture
des règles ni vérification du pilote contre le livre complet n’est prétendue.

Fichiers nouveaux non commités : `outils/argyropee/`, fiche, thème, deux extractions,
bannière, sortie `output/gmos-studio/argyropee/` et cette note. Les extractions de travail restent
dans `tmp/argyropee-studio-20261108/`, sans copie PDF.
