# Reprise Codex — correction GM-05, 01/11/2026

> **Actualisation du 01/11 :** David valide GM-05 et les autres essais en attente des fonctions livrées. NP-C1 est coché ; le texte ci-dessous conserve l’état de livraison initial. RQ-A2 est repris au registre § 201 ; [reprise courante](2026-11-01-etat-et-reprise-codex-runequest-pv-cible.md).

## Produit

David : « ok commence le point 1 corriger la fuite des secrets », puis
« GM-OS est fermé, tu peux corriger ». Correctif du filtre commun et tests de régression
livrés : gmSecrets est vidé récursivement dans les copies joueur, source MJ inchangée.
Deux fichiers src/ modifiés (filtre et tests), aucun electron/ modifié ; E2E dédié ajouté.
[Bilan](2026-11-01-correction-gm05.md), registre § 200, preuve sous output/verification-gm05/.

Avant : 8 assertions rouges / 19 vertes. Après : **70 tests ciblés passent** sur quatre
fichiers, lint ciblé et build/types réussis. **Quatre tests Electron passent**, douze Hub
360/768/1180, public reçu et zéro secret en initial/différentiel/reconnexion ; quatre secrets
de séance par jeu intacts sur le MJ. Douze captures examinées, empreintes conservées.

## Premier geste

David redémarre la version corrigée et reconnecte les Hub, puis essaie. La case NP-C1 reste
vide avec « livré, à essayer », car il a demandé de cocher après sa validation. Aucun pilote
ni archive à remplacer pour cette correction commune. Les anciens rapports de campagne et
leurs échecs restent intacts ; utiliser les nouvelles preuves séparées pour l'état courant.
Les autres lots du plan ne sont pas commencés.

## Pièges et limites

- Le filtre est partagé par le renderer, SyncServer et les fenêtres publiques locales :
  corriger sa liste de clés plutôt que chaque pilote ou l'affichage du secret.
- Le test contrôle les trames : une capture sans secret ne prouve pas son absence réseau.
- L'instance neuve contient une démo active ; vider le seul magasin temporaire avant l'import,
  sinon la Bibliothèque est masquée par la séance. Les premiers essais ont échoué là.
- Ne pas lancer deux workers sur la même paire 4100/4101. Les essais finaux ont tourné
  séquentiellement et leurs instances se ferment dans finally.
- Le terminal restreint a bloqué ; il a été interrompu, puis l'exécution relancée hors bac
  à sable avec les isolations du helper, conformément aux autorisations de recette conservées.
- Ne pas présenter ces essais RuneQuest 2.0.0 comme la recette des coups localisés 2.1.0.
- Une ancienne copie déjà arrivée sur une tablette n'est pas purgée par ce changement :
  il empêche les nouveaux envois. Tablette physique, projecteur en parcours visuel et essai
  de David restent à faire.

USERPROFILE, profils, corpus, coffre, sauvegardes et ports jetables ; appareils désactivés et
réseau externe des Hub bloqué. Aucun accès aux profils/campagnes/sauvegardes personnels,
aucun paquet, aucun Git d'écriture. Fichiers non commités ; analyses et plan à cocher antérieurs
non commités conservés. Ne pas toucher aux références, exports et traces des autres chantiers.
