# Reprise — Alien A2, 20 octobre 2026

David valide A0/A1 (« ok j'ai fais le test c'est bien »), demande de consigner les
réalisations dans le registre de tous les pilotes, puis « fait A2 ». Il confirme
« Non, GM-OS est fermé. ». Validation A0/A1 consignée dans les deux registres.

**A2 livré et contrôlé, non commité**, sur `712f70c1` plus A0/A1 non commités.
[Bilan A2, sources, fichiers et limites](2026-10-20-alien-a2.md) ;
[registre Alien](2026-10-19-registre-ameliorations-alien.md) ;
[synthèse de tous les pilotes](2026-10-20-ameliorations-tous-les-pilotes.md).

## Premier geste

David importe `Export Dirvers/corriges/Alien_driver_gmos_a2.gmos-driver` et essaie A2.
Version 1.2.0, identifiants inchangés, 40 anciens champs conservés et trois colonnes
ajoutées : `armes_bonus`, `armes_degats`, `armes_portees`. Même ordre de lignes que
les noms existants. Le script `outils/alien/ameliorer-pilote-a2.mjs` part du corrigé
A0/A1, préserve cet original et vérifie le ZIP rouvert. Pas de nouvelle génération
de thème ou de fiche HTML ; quatre colonnes HTML désormais reliées par 42 correspondances.

A3–A8 non engagés. Prochain lot proposé : A3. Ne pas annoncer protection, munitions
ou budgets d'actions comme livrés : A2 prépare les dégâts et consigne les éclats,
Maman applique les conséquences. Le bilan complet décrit le périmètre.

## Contrôles et reprise du code

1 005 tests réussis (58 fichiers), `npx tsc -b`, `npm run build`, lint ciblé et Forge
sans constat. Aller-retour des colonnes réelles HTML vérifié. Recette Electron et
Hub Edge réelle, profil jetable, à 360/768/1 180 px : budget conservé et transmis au
MJ, pas de doublon après rechargement, modificateurs et plafond vérifiés. Captures relues.

Règles pures dans `src/modules/dice/systemes/jetsAlien.ts`, préparation/suites dans
`src/modules/session/components/fields/JetsAlien.tsx`, raccord dans `PanneauDeJet.tsx`.
`jet.alien` rend le profil explicite ; `reserve.sansPlafond` préserve les bonus Alien
sans modifier les anciens profils. `_gmos_jet_alien` conserve le dernier test, son
équipement figé, l'opposition et les dépenses ; les décisions restent au journal.

`correspondanceDeFiche.siPresent` préserve l'HTML si une nouvelle colonne n'existe pas
encore dans les anciennes données ; explicitement vide signifie toujours effacer.
L'écriture d'un ancien HTML préserve les suivis internes A1 et A2.

Ne pas repayer les pièges de la reprise A0/A1 (ZIP et AppData du profil E2E).
Les captures d'un panneau trop long sont masquées par son conteneur défilant ; pour
A2, photographier les sections préparation et suites séparément. Tous les contrôles
se font sur le profil jetable, jamais les données ou sauvegardes personnelles.

Le registre général des chantiers était déjà modifié par un autre écrivain : laissé
intact, comme les autres modifications présentes. Aucun paquet installé, aucun commit
ou push demandé. Avant de modifier de nouveau src/electron après le prochain essai,
redemander si GM-OS tourne.
