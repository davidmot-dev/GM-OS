# RPG Banner Builder

Plugin privé qui crée les bannières des jeux et campagnes GM-OS. Basé sur les
[consignes des bannières](../../documentation/Planning/2026-10-04-prompts-bannieres.md),
le rendu `cover` centré de Session-OS et le choix de la bannière dans l’éditeur du pilote.

- [Instructions](instructions.md) : brief, composition, génération avec l’outil natif disponible,
  retouches, contrôle visuel et livraison honnête des dimensions et du poids.
- [Contrat](contrat-bannieres.md) : JPG/WebP 4:1, au moins 2400 × 600, au plus 500 000 octets,
  centre utile et bords calmes.
- [Outil autonome](preparer-banniere.html) : recadrage au centre, aperçu d’en-tête de 54 px,
  export et compression, sans réseau. Un agrandissement nécessite une action explicite.

Construction : `node outils/rpg-banner-builder/construire-plugin.mjs` depuis le dépôt.
Sources installables dans `plugin/rpg-banner-builder/`, archive et contrôles locaux dans
`dist/` (ignoré par Git). `plugin-compte.json` conserve l’identifiant et la version distante
après création, pour mettre à jour le plugin sans doublon.

Aucun serveur, paquet ou abonnement à installer. Le modèle de génération dépend des outils
disponibles dans la conversation ; le plugin ne fournit pas de générateur indépendant.
L’image finale se dépose dans le dossier réel du jeu, puis se choisit dans l’éditeur du pilote,
**Bannière de l’en-tête**. Aucun fichier GM-OS n’est modifié automatiquement.
