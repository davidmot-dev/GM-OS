# État et reprise — 13/11/2026

**Validation de David — 13/11/2026 :** « ok c’est bon tout est testé, corrige la doc, commit et pousse ». Les fonctions du pilote 2.1.0, la perte directe de SAN et les quatre boutons harmonisés sont validés. La relecture du corpus reste distincte : 1 fiche sur 18 relue ; les 17 autres ne sont pas déclarées relues par cet essai.

## Delta Green : les cinq suites du pilote livrées

David demande les améliorations listées dans la synthèse des pilotes. Il confirme GM-OS fermé
avant les modifications applicatives, puis autorise de compléter la synthèse et le registre
en conservant les modifications non commitées de la campagne de recette du 12/11.

**Pilote 2.1.0, mêmes identifiants**, à réimporter avec **Remplacer** :
[Delta-Green-2.1.0.gmos-driver](../../Export%20Dirvers/corriges/Delta-Green-2.1.0.gmos-driver).
[Bilan et vérifications détaillées](2026-11-13-delta-green-ameliorations.md), registre **§ 249**, ligne **185**.

- SAN réussite/échec, pertes critiques, rupture et nouveau SR, folies et troubles rappelés,
  accoutumance Violence/Impuissance et ses coûts permanents ; reçus persistants contre les doubles pertes.
- Inconscience à 1–2 PV, mort à 0 : fiche, console, synchronisation et plateau ; pas de faux décès au journal.
- Sept armes de la fiche lues au combat, létalité et critiques, protection après perforant/couvert
  confirmés ; complications au choix, application unique et durée de remise en état conservée.
- Opposition ; 47 cases d’expérience reliées, coche après échec, D4 après la partie puis décoche.
- Vocabulaire conservé dans les résultats et leur transport ; 210 clés HTML reliées, 23 absents motivés.
- Corpus : **1/18 relue** (accoutumance), erreur « automatiquement aucune perte » corrigée contre le livre.
- Manuel 53/54 actualisé et **onze captures** de l’application réelle ; synthèse **10 verts / 1 orange / 0 rouge**,
  fonctions du pilote et boutons validés par David le 13/11.

## Vérifications

301 essais ciblés verts. Suite générale : **10 478 réussis / 4 ignorés**, seul échec sur les images
du manuel avant leur fabrication ; images livrées, contrôle du manuel **28/28** repassé.
**25/25** repris dans les quatre nouveaux fichiers après les derniers ajustements.
Types, lint et build réussis ; pilote sans constat ; fiche acceptée **0/0**.
Parcours Electron **1/1**, profil jetable : SAN/SR, expérience, létalité, inconscience, mort,
rechargement réel. Les onze images ont été relues ; validation globale de David le 13/11.

## Reprendre

1. Aucun essai fonctionnel du pilote ou des quatre boutons en attente : David a tout validé le 13/11.
2. Relire les 17 autres fiches du corpus, et instruire le catalogue d’équipement si demandé.
3. La campagne « Les dossiers de la pluie » est déjà livrée au § 248 pour la 2.0.1 ; son cahier
   n’a pas été réécrit ni sa campagne régénérée pendant ce chantier.

## Ne pas repayer

- Le livre local homonyme n’a que quatre pages : le livre complet se lit au chemin NAS du registre,
  avec décalage +1. Lecture en place, sans copie du PDF ni texte intégral persistant.
- Les fenêtres de test Electron nécessitent ici une exécution hors confinement ; les gardes du
  profil jetable de `e2e/lancerGmOs.ts` restent obligatoires.
- `generateEffectId` utilise `Math.random` : fixer le hasard uniquement pour les dés, pas pendant
  la création de plusieurs combattants, sinon ils prennent le même identifiant.
- Les conséquences d’un même jet sont transmises ensemble au porteur : expérience et distraction
  ne doivent pas s’écraser avant le retour de la fiche.
- PowerShell : `npm.cmd`/`npx.cmd`, car les wrappers `.ps1` sont bloqués ; avec redirection de stderr,
  terminer par `exit $LASTEXITCODE` pour distinguer un avertissement d’un échec de compilation.

## Copie de travail

**Commit et push demandés par David le 13/11.** Les fichiers applicatifs, générateurs du pilote,
correspondance, fiche de corpus, manuel, captures et documents du § 249 constituent cette livraison.
Les exports `Export Dirvers/` et les fichiers temporaires ne sont pas versionnés.
Moteur, règles et régression : commit **`bb1068c7`**. La documentation, ses captures et cette note
sont enregistrées dans le commit de clôture qui suit ; le push conserve la validation pré-push.
Les sources, archives et note de la campagne de recette déjà en attente avant ce chantier restent
hors de ces deux commits. La note est conservée localement pour les liens historiques du registre.
Les fichiers de la campagne du 12/11 et les exports 1.0.0/2.0.1 déjà non suivis au départ sont
conservés intacts. Aucun profil privé de David ni sauvegarde de sécurité n’a été utilisé.

## Retour de David : perte de SAN saisie « -5 »

« SAN 60 SR 48 POU 12 Perte -5 », clic sans effet ; GM-OS fermé confirmé avant correction.
Le champ ne reconnaissait que les barèmes réussite/échec, et le message de refus était trop bas.
Le moteur accepte maintenant un montant direct (`5`, `-5`, `−5`) ou un dé seul ; les refus sont
expliqués près du bouton, sans consommer le jet. Le pilote reste 2.1.0.

**Vérifié :** 25 essais ciblés, lint, types et construction réussis ;
`e2e/perteSanDeltaGreen.spec.ts` **1/1** sur profil jetable : SAN 60 → 55, SR 48, folie temporaire
rappelée, application unique, conservation après rechargement. Capture dans
`output/verification-delta-green-san-directe/san-60-moins-5.png`.
Les ajouts de documentation/captures de Claude Code et son parcours `capturesDesJeux` sont conservés.
La saisie `-5` a ensuite été validée par David le 13/11 ; pas de nouvel export de pilote nécessaire.

## Harmonisation des boutons Delta Green

À la demande de David (13/11), les quatre actions SAN, dé adverse, opposition et amélioration
reprennent les rendus « Lancer » / « Demander à » : boutons principaux pleins, secondaires bordés,
même typographie et hauteur tactile, focus et état désactivé visibles. Seul leur habillage change.
Sept essais de commande, lint, types et construction réussis. Les deux parcours Playwright passent
**2/2**, captures du manuel actualisées et états actifs/désactivés relus. Aperçu des quatre boutons
actifs : `output/verification-delta-green-san-directe/boutons-avant-application.png`.
