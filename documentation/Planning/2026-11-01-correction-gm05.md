# GM-05 — correction des secrets de séance, 01/11/2026

> **Actualisation du 01/11 :** David valide GM-05 et les autres essais en attente des fonctions livrées. NP-C1 est coché ; le texte ci-dessous conserve l’état de livraison initial. RQ-A2 est repris au registre § 201 ; [reprise courante](2026-11-01-etat-et-reprise-codex-runequest-pv-cible.md).

David : « ok commence le point 1 corriger la fuite des secrets », puis
**« GM-OS est fermé, tu peux corriger »**.

## Résultat

**NP-C1 livré et vérifié automatiquement, à essayer par David.** La liste VIDES de
`src/modules/remote/logic/caviardageDesJoueurs.ts` contient désormais **gmSecrets**, à côté
de gmNotes et notesDuMeneur. Les textes privés des séances actives, prévues et terminées
deviennent vides dans les copies destinées à la table. Les champs publics restent présents,
et la charge d'origine du MJ n'est pas modifiée.

Cette fonction est déjà appelée à l'émission par `useNexusSynchronizer`, à la sortie du
serveur pour les rôles player/hub, et dans `electron/main.ts` pour les fenêtres publiques.
Le correctif ne change ni les règles des pilotes ni leurs archives. Les copies destinées
au MJ et à sa télécommande restent privées et ne sont pas remplacées par la copie joueur.

## Vérifications

- **Avant** : huit assertions de régression échouent, 19 passent. Le texte des secrets est
  retrouvé dans la charge sérialisée, y compris pour une mise à jour partielle.
- **Après** : **70 tests ciblés / quatre fichiers passent**, confidentialité, cadence de
  synchronisation, enregistrement et relais du serveur. Le filtre reste idempotent quand
  le renderer et le serveur l'appliquent successivement. Source MJ et résumés publics conservés.
- **Lint ciblé**, `npm run build` et types réussis.
- **Quatre tests Electron passent**, dans `e2e/secretsDeSeance.spec.ts`, pour RuneQuest,
  Degenesis, COC et Shadowrun Anarchy. Pour chaque jeu, **trois Hub simulés** à 360/768/1180 px
  reçoivent le résumé public en synchronisation initiale, après modification et après reconnexion.
  **Zéro marqueur secret reçu** ; les quatre secrets de séance restent dans le magasin du MJ.
- Douze captures examinées. Leur rôle est d'accompagner le contrôle de transport ; l'absence
  de secrets est vérifiée dans les trames WebSocket, pas déduite d'une capture d'écran.

Preuves et empreintes : `output/verification-gm05/verification.json`, un rapport par jeu,
`RAPPORT.md`, captures et planche de lecture. Les rapports historiques de campagnes conservent
leurs anciens échecs GM-05 : ils ne sont ni remplacés, ni transformés en succès a posteriori.
La recette RuneQuest utilisée est toujours en 2.0.0 ; son alignement 2.1.0 reste RQ-A1.

## Périmètre et reprise

Profils, USERPROFILE, corpus, coffre, sauvegardes et ports jetables via `e2e/lancerGmOs.ts` ;
réseau externe des Hub bloqué, appareils désactivés. Autorisations d'essais isolés des quatre
jeux déjà données et conservées. Aucun profil, campagne ou sauvegarde personnel consulté.
Le terminal restreint a été interrompu puis les essais relancés hors bac à sable. Le parcours
initial a été corrigé pour retirer la démo active du seul magasin temporaire avant import.

Redémarrer GM-OS sur la version corrigée, puis reconnecter les Hub. Le correctif empêche les
nouveaux envois : il ne purge pas une ancienne copie ou trace déjà reçue avant sa mise en place.
L'essai de David, une tablette physique et le parcours visuel d'un projecteur restent à faire.
La case NP-C1 reste vide, annotée **« livré, à essayer »**, selon la règle du plan à cocher.

Deux fichiers `src/` modifiés : filtre et tests ; un E2E dédié ajouté. Aucun `electron/`
modifié, aucun paquet installé, aucun pilote ou ZIP de campagne régénéré, aucun Git d'écriture.
Fichiers non commités. Registre § 200 et synthèse des pilotes mis à jour.
