# État et reprise — analyse Dune — 19/10/2026

Lire AGENTS.md et la passation. Base : `ed44c680` ; registre § 143, ligne 79.

David demande les améliorations du pilote Dune en consultant le livre fourni sur CLOUDDAVID
et NotebookLM. **Analyse seule, sans développement**. Tout le détail, les preuves et les lots
proposés sont dans [l'audit Dune](2026-10-19-dune-propositions.md).

Le pilote étudié est la référence `DUNE` livrée avec GM-OS, version 1.0.0, pas une copie de ses
données personnelles. Aucun export Dune récent dans `Export Dirvers/`.
Livre lu dans une copie de travail de 344 pages PDF. Trois réponses du carnet Dune, limitées au
livre français, contrôlées contre les passages concernés et l'errata français officiel 1.1.
Quatre pages relues à l'image. Les douze sources du carnet ne comprennent pas de source nommée
errata ; le SRD et les extensions n'ont pas servi à définir les règles du pilote.

Résultat : base 2d20 déjà là, mais spécialisations non déclarées, choix du paiement absent,
excédent d'Impulsion plafonné trop tôt, conservation de l'initiative incomplète et paiement
des PNJ non distingué. Détermination/maximes, aide/oppositions, défaite/survie, atouts/zones,
Maison et progression proposés dans D0–D8. Plusieurs corrections nécessitent les lecteurs
communs de GM-OS, pas simplement le JSON du pilote.

Preuves locales : `scratch/dune-audit/constats.json`, trois `notebook-*.json`, pages extraites
et rendus. Les constats utilisent les fonctions pures du dépôt, sans changer leurs sources.
Pas de suite complète ni d'essai d'interface lancé pour l'analyse.

**Décision suivante de David, 19/10/2026 : « sauve-moi cela comme projet futur ».**
Le projet est **garé**, sans échéance ni développement lancé ; l'audit et le registre portent
ce statut. Attendre sa demande explicite de reprise.

**Lors de cette reprise :** David choisit le périmètre ; récupérer son export actuel si son pilote est
personnalisé. Demander « GM-OS tourne-t-il ? » avant toute édition de `src/` ou `electron/`.
Ne pas appliquer le +1 d'une seconde action à l'allié par extrapolation ; l'audit distingue
les deux cas. Détermination : relance sélective ; amélioration d'atout : deux fois sa nouvelle
qualité, d'après l'errata.

Trois documents du chantier modifiés/créés, **non commités**. `tmp/` préexistant intact.
Aucun code applicatif ni donnée de campagne modifié, aucun paquet installé, aucun service
lancé et aucun commit/push. La retouche RdD précédente est désormais dans `ed44c680`, commit
présent à l'arrivée de cet audit ; ne pas la recommencer.
