# État et reprise — Dune, 25/10/2026

David demande de finir les améliorations de Dune et fournit le livre français et l'errata.
GM-OS confirmé fermé. **D0–D8 développés**, pilote **2.0.0**, essai de David validé : « tout est testé, c'est bon » (25/10).

Lire le [bilan Dune](2026-10-25-dune-finir.md), la synthèse des pilotes (section Dune) et le
registre § 175. Le manuel `54-Jeu-Dune.md` décrit les gestes disponibles et les arbitrages
laissés au MJ. Les fichiers déjà modifiés en début de session sont restés intacts.

L'export à réimporter avec **Remplacer** est
`Export Dirvers/corriges/Dune_driver_gmos_2.0.0.gmos-driver` ; il conserve les clés de l'export
du 22/10. Constructeur : `node scripts/exporter-dune.mjs`. Le premier ZIP produit avec
`adm-zip.updateFile` était illisible à cause du drapeau de descripteur hérité ; l'exporteur
reconstruit maintenant le ZIP et le relit immédiatement. Ne pas revenir au simple `updateFile`.

Vérifications et captures dans `tmp/dune-fin/` ; la recette Electron utilise seulement un profil
jetable et nécessite les droits hors bac à sable pour charger le preload temporaire Windows.
La vérification du manuel avait échoué dans la première suite globale, lancée avant sa mise à
jour ; le contrôle ciblé est passé depuis. **Suite globale finale : 9 111 tests passés**, puis
**53 tests ciblés** après les garde-fous de défaite et de changement de personnage. Types, lint
et construction passés ; recette Electron Dune passée et onze captures relues.

**Validation reçue le 25/10/2026 : « tout est testé, c'est bon , commit et pousse l'ensemble ».**
D0–D8 passent au vert ; commit et push sur `production` autorisés. Reprise : intégration
et raccordement des deux HTML ci-dessous, puis vérification de cette liaison.

Atelier GM-OS Studio demandé ensuite : les deux fiches HTML PJ/Maison sont créées dans
`output/fiches/dune/`, modèles `dune-pj-fr` (30 champs) et `dune-maison-fr` (40 champs).
Sources reproductibles : `outils/dune/fiches/`. Validateur et recette hors ligne passés,
y compris import dans un moteur jetable ; captures et rapports dans le dossier de livraison.
~~Reste l'intégration des deux modèles et la correspondance au pilote~~ : **faites par Claude Code
le 25/10 (registre § 176)** — fiches rangées dans `docs/fiches/Dune/`, moteur 17, Maison en fiche
de groupe qui fait foi (le pupitre du module en prend le reflet). Reste leur essai dans GM-OS. Aucun fichier du moteur ni profil personnel modifié pour cette livraison Studio.

**Commit et push demandés par David le 25/10/2026.** Commit principal : `1338b1f1`
(`feat(dune): finir le pilote et livrer les fiches PJ et Maison`). Le commit couvre le chantier Dune, ses
fiches, ses sources, son manuel et ses captures ; les exports locaux et les autres chantiers
restent hors commit, conformément aux consignes de passation.
