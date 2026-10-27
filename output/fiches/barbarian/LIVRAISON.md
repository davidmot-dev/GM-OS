# Livraison de la fiche Barbarian of Lemuria — 27/10/2026

Fichier autonome : docs/fiches/Barbarian of Lemuria/barbarian-of-lemuria-fiche-interactive.html (2269666 octets).
Source : Fiche_Barbarian of Lemuria-vf.pdf, SHA-256 7981e93fe0b40581dae07f6d110ebe16c9da85625abfa73f306a9fc6af0de1ec.

Deux pages A4 paysage fidèles au PDF : personnage, puis notes et vade-mecum. Le PDF place le recto de côté et le verso dans l’autre sens ; rendus tournés respectivement de 90° et 270°, sans redessiner les fonds. Le thème d’interface n’intervient pas dans cette fiche.

**45 zones / 45 clés**, modèle neuf barbarian-of-lemuria-fr : 44 sur le recto et une grande zone de notes au verso. Nom/origine/langues, quatre attributs, quatre aptitudes de combat, cinq lignes de carrières et leurs rangs, quatre armes/dégâts, six lignes d’armure/équipement, quatre ressources et expérience, avantages/désavantages, description et portrait. Le portrait occupe le haut de l’espace libre, la description le bas ; les avantages évitent l’ornement du coin. Les nombres acceptent zéro et les valeurs négatives ; les dégâts acceptent les expressions de dés. Aucun maximum ni calcul non imprimé n’est inventé.

Fonctions autonomes : zoom 20–400 %, Ajuster, Ctrl+molette et raccourcis, navigation, Zones, sauvegarde locale, export/import JSON, portrait intégré, réinitialisation après confirmation, impression des deux pages. Aucun appel réseau ou paquet supplémentaire.

## Contrôles

Validateur **ACCEPTÉE, zéro erreur**, deux avertissements attendus d’un nouveau modèle : absent des modèles intégrés et aucune correspondance avec le pilote. Essai hors ligne dans Edge jetable : 45 clés remplies/exportées, portrait, nombres négatifs, navigation et Zones, sauvegarde/rechargement, rejet sans perte d’imports invalides, confirmation/annulation de la réinitialisation, zoom/clavier/molette, écran de 390 px. Impression vérifiée sur deux vraies pages PDF A4 paysage ; rendus et captures inspectés. Lint ciblé sans erreur.

Import réel du manifeste dans le moteur de fiches existant, dans ce navigateur jetable : 45 champs présents, saisie puis export v2 réimporté dans le HTML autonome. Les valeurs d’essai apparaissent seulement dans les captures et le profil jetable ; **le HTML livré est vierge**. Aucun profil personnel touché.

## Intégration GM-OS distincte

Le constructeur livre le HTML et son manifeste. Le modèle n’a pas été ajouté aux modèles intégrés du moteur et aucune correspondance vers le pilote n’a été écrite. Pour raccorder ensuite les jets/santé/inventaire : intégrer ce modèle, monter la version du moteur puis établir la correspondance à partir du pilote réel, suivant le cahier des charges § 7–8. Aucun src/ ou electron/ modifié ; aucun commit/push effectué.

## Reproduction

node outils/barbarian/construire-fiche.mjs "C:/Users/david/Downloads/BoL Reference/Fiche_Barbarian of Lemuria-vf.pdf"

npm run fiche:valider -- "Barbarian of Lemuria"

node outils/barbarian/verifier-fiche.mjs

Les fichiers construction.json, validation.json et verification.json donnent les clés, les mesures et les contrôles. Nouvelle fiche : 45 clés nouvelles, aucune clé retirée. Les sources reproductibles sont dans outils/barbarian/fiche/ ; aucun paquet installé.
