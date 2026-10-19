# Reprise — fiche HTML Crimes, 19 octobre 2026

David a demandé à l’atelier Fiche de GM-OS Studio : « crée moi la fiche de personnage html à partir ce fichier », avec `Crime - PJ Sheet.pdf` (deux pages).

La fiche autonome est livrée dans `docs/fiches/Crimes/crimes-fiche-personnage-interactive.html`. Son modèle `crimes-fr` et ses 197 clés sont désormais le contrat à préserver. Elle comporte 335 zones ; les fonds sont les pages originales, intégrées en WebP, avec portrait et toutes les fonctions autonomes demandées par l’atelier.

La recette et la vérification reproductibles sont dans `outils/crime/`. Détail, commandes et choix d’interaction : [LIVRAISON.md](../../outils/crime/fiche/LIVRAISON.md). Captures relues et rapports : `output/fiches/crime/`.

Le validateur accepte la fiche sans erreur. Ses deux avertissements indiquent uniquement qu’elle est nouvelle et n’est pas intégrée au moteur ni reliée à un pilote. Les essais de navigateur (Edge jetable, hors ligne) couvrent jauges, choix, 55 cases indépendantes, nombres, portrait, JSON, sauvegarde, annulation/confirmation de réinitialisation, zoom, mode Zones, règles d’impression et écran de 390 pixels ; aucune erreur JavaScript ni requête réseau.

Si David demande ensuite l’intégration : suivre le § 8 du cahier des charges des fiches (ajout du gabarit au moteur avec incrément de version, puis correspondance complète au pilote). Ne pas régénérer les clés ni confondre la fiche autonome avec ce raccordement. Aucun calcul de règle n’est ajouté ; les compteurs et pistes sans légende restent neutres.

Aucun fichier `src/` ou `electron/`, aucune donnée personnelle, aucun paquet ou service réseau, aucune écriture Git. Le registre des chantiers était déjà modifié par un autre travail : il n’a pas été retouché. Fichiers de cette livraison non commités.
