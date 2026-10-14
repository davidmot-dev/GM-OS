# État et reprise — 13/10/2026 — Accessoires Alien

Cette note porte sur le chantier Codex des accessoires Alien. Les autres
travaux du 13/10, notamment NOC et Torg, sont décrits dans leurs propres
documents et commits ; ils n'ont pas été modifiés pour ce chantier.

## Demande et retour de David

David veut des fonctions semblables à MU/TH/UR et au Motion Tracker de
Foundry : effets CRT, parasites, mots de passe et codes ; le tracker est
un outil de tension dont **le meneur décide l'intensité**. Les accessoires
doivent être liés au pilote et au jeu Alien.

Après avoir demandé une application web séparée, il autorise sa création :
*« ok commence crée cela dans outils\\alien »*. Son retour sur la première
version est : *« c'est un bon début documente »*.

Le retour retient la direction du prototype. Il ne vaut pas validation de
la liaison au pilote, des tablettes physiques ou du réseau réel.

## Livré — version 0.1.0, registre § 135

- [`outils/alien/index.html`](../../outils/alien/index.html) : poste meneur,
  aperçu joueur, terminal MU/TH/UR et radar.
- [`README.md`](../../outils/alien/README.md) : démarrage, commandes, réglages,
  accès, persistance et limites.
- [`ARCHITECTURE.md`](../../outils/alien/ARCHITECTURE.md) : moteur, protocoles,
  filtrage, stockage et futur branchement GM-OS.
- Scripts, CSS et manifeste dans le même dossier. HTTP + SSE, aucun paquet
  à installer, aucun fichier Foundry copié, sons synthétisés localement.
- [Étude et décisions](2026-10-13-integration-foundry-vtt.md) : démarche,
  références, exigences et livraison constatée.

Le fichier HTML fonctionne seul en atelier local. Le serveur fourni ouvre
la petite application aux tablettes, mais **aucun service réseau n'a été
lancé par l'agent**. Le manifeste est un descripteur du prototype, pas un
contrat déjà lu par GM-OS. Aucun type `GameDriver` ni écran GM-OS modifié.

## Ce qui a été vérifié

Syntaxe Node et ESLint propres. Parcours navigateur hors ligne et vues
meneur/joueur avec requêtes interceptées : dialogue, codes exacts, mot de
passe, codes et textes édités et sauvegardés, refus des actions meneur pour
un joueur, filtrage des documents, radar ciblé, faux écho, arrêt, piratage,
révocation et reconnexion. Rendu à 390 px sans débordement horizontal.
Aucune erreur JavaScript relevée ; captures relues puis supprimées.

Le vrai protocole serveur a été appelé **sans port ouvert**. Le contrôle
ne couvre pas encore l'écoute HTTP/SSE continue sur le réseau, le pare-feu,
les tablettes physiques, la qualité sonore en séance ni la fidélité visuelle
et sonore complète à Foundry. Ne pas annoncer ces points comme éprouvés.

## Reprendre sans refaire l'étude

1. Lire le README puis l'architecture ; la fonctionnalité existe déjà.
2. Sur demande de David, essayer `node outils/alien/server.mjs` avec le poste
   meneur et deux appareils joueurs. Vérifier dialogue privé, code, scan
   ciblé, arrêt et reconnexion avec le vrai flux SSE.
3. Faire juger le CRT, le piratage, les parasites et les bips. La référence
   Foundry a été examinée dans sa documentation et son code ; ses médias
   n'ont pas été importés.
4. Concevoir la liaison au pilote et à la campagne Alien : identification
   des pilotes forgés, ouverture/fermeture, destinataires, sauvegarde et
   changement de campagne. Le service actuel ne porte qu'une table.

Avant toute écriture dans `src/` ou `electron/`, demander à David
« GM-OS tourne-t-il ? » et attendre sa réponse. Aucun accès aux données
de David n'est nécessaire pour les premiers essais.

## Pièges déjà rencontrés

- Une chaîne PowerShell envoyée à Node par l'entrée standard peut perdre
  les accents avec l'encodage par défaut. Un contrôle qui attendait
  `CODE VALIDÉ` cherchait un texte corrompu ; employer des échappements
  Unicode ou un encodage explicite pour ces scripts d'essai.
- Le REPL Node peut ne pas exposer `process` aux modules importés. Les essais
  du serveur importable ont été exécutés par Node normal, sans appeler `listen`.
- L'aperçu joueur en mode fichier est un atelier meneur, pas un accès privé.
  Les secrets sont protégés par le filtrage serveur dans le mode HTTP.
- Les codes sont des chaînes : ne jamais convertir `0042` en nombre.
- Le serveur remet le radar et le compte à rebours à l'arrêt au redémarrage.
  Une restauration ne doit pas relancer seule les effets.

## Copie de travail et Git

Branche relevée : `feature/tablet-hub-pwa`. Dernier commit lors de cette
documentation : `dddd54ce` (travaux de combat de l'autre agent).
Le lot Alien et sa documentation sont **non commités**. Aucun commit ou push
n'a été demandé. Les fichiers non suivis étrangers — `.claude`,
`Export Dirvers/`, `outils/jdr-pdf-vers-md/` — sont conservés.
