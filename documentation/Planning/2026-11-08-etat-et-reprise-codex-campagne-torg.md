# État et reprise Codex — campagne Torg, 08/11/2026

## Produit

Demande : « peux-tu créer une campagne de test pour TORG dans le même style que pour COC ».
**Les Balises de l’Aube** : une campagne, douze séances prévues, quatre actes de fiction,
36 scènes narratives et six ateliers intégrés. Trois principaux sur les profils existants
`p-1`/`p-2`/`p-3`, six `[RECETTE]`, seize PNJ, douze lieux, douze indices et 63 cas humains vierges.
Le lot historique COC est inchangé.

[Livraison et import](2026-11-08-campagne-recette-torg.md) ;
[ZIP](../../output/campagnes-tests/torg/TORG-Les-Balises-de-l-Aube-Recette.zip),
[unique .gmos](../../output/campagnes-tests/torg/01-Les-Balises-de-l-Aube.gmos),
[guide](../../output/campagnes-tests/torg/LIRE-MOI.md).
Pilote réel Torg 2.0.0, 80 champs, copie identique séparée. Outils natifs, aucun module indépendant inventé.

Import natif isolé, trois Hub, réceptions, HTML, confidentialité, rechargement et remise en état locale
éprouvés ; détails et nombre d’essais dans le rapport final lié au SHA de l’archive. Médias originaux
embarqués : 41 SVG, un JPEG existant et trois signaux WAV ; neuf rendus et six captures applicatives relus.
Les 63 cas de David sont **NON TESTÉS**. Aucun appareil physique, profil privé ou code applicatif modifié.
Synthèse Torg, manuel 54, registre § 236/ligne 172 mis à jour ; validation TORG-A0 à A4 déjà donnée conservée.

## Reprendre

Ouvrir le guide puis importer la seule archive .gmos, Tel quel. L’acte **ATELIERS DE RECETTE — hors fiction**
se trouve dans la même Trame. Lire `ETATS-DE-REFERENCE.md` et le cahier, ne pas utiliser Nexus Remplacer
pour recommencer un atelier. Le témoin de scène et XP 17 du principal sont préservés par la recette native.

Pour les cartes, voir `PAQUETS-DE-CARTES.md` : dix Destin disponibles, aucune Relation ; compléter avec
les vraies images ou utiliser le jeu physique pour la fiction. David a ajouté cinq faces le 08/11 : Second souffle, Reconnexion, Revers, Précision, Étape A.
Les dix faces restent insuffisantes pour douze cartes de départ ; le pilote déclare encore cinq,
à régler explicitement à dix dans Deck-OS. Pas de copie ou transformation d’un livre.
Les distributions collectives du magasin visent les neuf PJ, pas les seuls participants : distribuer
manuellement aux trois principaux pendant la fiction. Constat séparé au § 1 bis ; aucune correction source.

Non commités : nouveaux `torg.mjs`, `torg-scenario.mjs`, `torg-recette.mjs`, `torg-modules.mjs`,
`torg-verifier-plugin.mjs`, `torg-verifier-cartes.mjs`, `torg-visuels.mjs`, `torg.test.ts`, `vitest-torg.config.mts`, `emballer-torg.mjs`
sous `outils/campagnes-de-recette/` ; `e2e/campagneDeRecetteTorg.spec.ts` ; `output/campagnes-tests/torg/` ;
les deux notes de ce jour. `verifier-visuels.mjs`, registre, synthèse et manuel 54 complétés.
Aucun commit ou push demandé pour ce nouveau chantier ; le précédent commit `021ebf9e` est déjà poussé.

## Ne pas repayer

- Nouveau contrat : une seule campagne .gmos, pas les trois archives du lot COC historique.
- Import pilote : attendre le bilan. Import campagne Tel quel : attendre `activeCampaignId` ;
  le retour au cockpit peut fermer le dialogue sans laisser de bouton de bilan à cliquer.
- Ouvrir une scène affiche un dialogue plein écran ; fermer par Échap avant de naviguer au formulaire.
  Sur le Hub, Retour ferme la fiche avant les autres onglets.
- Créer les préparations par les fonctions de santé réelles. Les cartes ne font pas partie de l’état
  Nexus d’une campagne ; leurs définitions originales sont dans le pilote, et leurs usages dans le magasin du jeu.
- Le pilote contient son lien NotebookLM facultatif : le distinguer d’un média distant requis, sans
  supprimer un réglage du pilote pour faire passer un test trop large.
- Les tests humains restent NON TESTÉS, même quand Vitest et Playwright passent. Les rapports et
  l’emballeur refusent les empreintes périmées ; régénérer avant les contrôles finaux et relire les images.
- Les profils de recette ne sont pas des créations novices légales. Un texte libre d’Atout ne coche
  aucune possession, les principaux sont à compléter avec le livre avant une partie réglementaire.
