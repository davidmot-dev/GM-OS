# GM-05 — correction et vérification du 01/11/2026

**Correctif livré, vérifié automatiquement ; essai de David attendu.**
Le texte des secrets de séance reste chez le MJ et devient vide dans les charges pour la table.
Le filtre commun est déjà appelé par le renderer, SyncServer et les fenêtres publiques locales.

- Régression reproduite : 8 assertions en échec avant correction, 19 autres assertions passaient.
- Après correction : **70 tests ciblés passent / 4 fichiers**, zéro échec ; lint ciblé et build/types réussis.
- **4 tests Electron passent**, RuneQuest/Degenesis/COC/Shadowrun, **12 Hub** à 360/768/1180 px.
- Pour chacun : résumé public reçu à l'ouverture, après modification et après reconnexion ; zéro marqueur secret ; quatre secrets de séance conservés dans le magasin MJ.
- Douze captures examinées, aperçu planche-hub.png ; empreintes et détails dans verification.json.

Les rapports et ZIP historiques des campagnes restent inchangés : ils décrivent les échecs
antérieurs. Aucun pilote ni archive à remplacer pour ce correctif de l'application. RuneQuest
est ici testé avec sa recette 2.0.0 : l'alignement 2.1.0 reste un lot distinct.

Redémarrer GM-OS sur la version corrigée puis reconnecter les Hub. Le correctif empêche les
nouveaux envois ; il ne prétend pas effacer une copie ou trace déjà reçue avant correction.
Tablettes physiques, essai de David et fenêtres de projection en parcours visuel restent à faire.

Autorisations : fermeture confirmée par David (« GM-OS est fermé, tu peux corriger »), essais
locaux isolés déjà autorisés pour les quatre lots. Helper jetable, appareils désactivés et
réseau externe des Hub bloqué. Le terminal restreint a été interrompu puis les essais relancés
hors bac à sable ; une première préparation de test a été corrigée pour retirer la démo active
du seul magasin temporaire. Aucun accès aux profils/corpus/sauvegardes personnels.
