# Reprise Codex — RQ-A1, campagnes RuneQuest 2.1.0 — 01/11/2026

> **Validation et publication demandées le 01/11 :** David : « ok c’est bien, c’est testé. Commit et pousse ». RQ-A1 coché/vert ; le texte ci-dessous conserve l’état de livraison initial. Confirmation sous output/campagnes-tests/runequest/VALIDATION-DAVID.md ; état Git dans la note de publication du jour.

David : « ok c'est bon on fait RQ-A1 ». **RQ-A2 est validé** ; ce lot réalise RQ-A1,
registre § 202. Plugin utilisé : [GM-OS Campagnes de test](https://chatgpt.com/plugins/plugins_6ae484c30bd4819186676a390b1b74bf),
méthode et gardes lues dans son SKILL.md et la procédure locale campagne-de-recette.

## Produit et livraison

- [ZIP courant](../../output/campagnes-tests/runequest/RuneQuest-Campagnes-de-recette.zip) :
  **1 367 223 octets**, **105 fichiers**, SHA-256
  `77255c9a703f1a12fd01a90ccfa36e4e7450b3626935470075cd77725fc44b5e`.
- Trois archives révisées au **01/11/2026, 12:00 UTC fixe**, dépendance **RuneQuest 2.1.0**,
  **320 champs**, même ID de pilote/gabarit et mêmes IDs de campagnes/PJ/joueurs.
  Aventure et rattachements conservés : **21 PJ pour Thomas D. p-1, Marie C. p-2, Lucas R. p-3**.
- **78 cas humains NON TESTÉS pour cette révision**, dont douze nouveaux RQ-LOCAL :
  remplacement explicite du pilote, états préparés, armure, plafond, soins, PJ/PNJ/autonome,
  cible du jet, persistance et remise à zéro du seul laboratoire. La validation précédente
  de David ne préremplit pas le nouveau CSV.
- C07 : bras droit **3 maximum / 3 dégâts**, donc 0/3 ; C08 : tête **4 maximum / 8 dégâts**,
  donc −4/4. Les anciens maxima diminués ne sont pas transportés comme nouveaux maxima.
  Sept compteurs de dégâts initialisés par les défauts du vrai gabarit. Armure de bras 2
  choisie pour la recette ; profils avancés aux valeurs choisies toujours signalés.
- Ancien ZIP 2.0.0, pilote, CSV et rapports conservés dans
  [historique/2026-10-30-2.0.0](../../output/campagnes-tests/runequest/historique/2026-10-30-2.0.0/).
  **Quatorze fichiers contrôlés identiques** à la copie initiale. Cet historique, ses anciens
  échecs et les traces ne sont pas embarqués dans le ZIP courant.

## Vérifié

- **96 tests passent** avec la configuration RuneQuest : Nexus, pilote, références, santé,
  champs/types, règles D100, états C07/C08, armure/plafond/soins, cohérence des trois dépendances,
  78 cas vierges et couverture sourcée.
- **Un E2E Electron passe en environ 1 min 12 s** : vrai pilote historique 2.0.0 installé,
  conservé par Nexus après import de 01, puis remplacé explicitement via **IMPORTER DRIVER**
  et **Remplacer** par le 2.1.0. Trois archives importées, sentinelles/profils/avatars préservés.
- Après import : C09 encaisse 5 contre PA 5 sans perte, puis 10 contre PA 5 : 5 nets mais
  **4 retenus**, jambe −2/2 et total 4 ; soin 99 rend seulement 4, total 8. C07 soigné de 2 :
  bras 2/3 et total 11. PNJ lié et adversaire autonome encaissent chacun 8 au bras (PA 2) :
  six dégâts, zone −3/3 et total 6.
- **Porter le coup** depuis le jet vers une vraie cible de 01 : maximum de la bonne fiche,
  zone touchée déduite du D20 réellement obtenu, dégâts sur la cible seule. Tirage non fixé,
  résultat calculé puis vérifié sur la zone tirée. Capture observée : Sera, bras gauche,
  8−2=6, bras −3/3. Dégâts persistés ; remplacement de 02 retrouve C07/C08/C09 préparés et
  préserve la note et la blessure de 01.
- Trois Hub **360/768/1180** : jets reçus, localisation seule côté joueur, fiche HTML et PM
  8/9/10 persistés au rechargement. **Zéro marqueur secret fictif reçu**, GM-05 non reproduit.
- Plugin : trois archives valides selon le vérificateur structurel partiel. **36 SVG et
  trois WAV décodés hors ligne** ; neuf rendus et sept captures Electron examinés.
- **npm run build** (dont **tsc -b**) réussi ; lint des sept sources modifiées/nouvelles sans
  erreur. ZIP rouvert, empreintes des archives concordantes ; rapport volontairement périmé
  refusé par l'emballeur dans une copie jetable, ZIP courant inchangé.

Rapports, provenance et empreintes : [rapport courant](../../output/campagnes-tests/runequest/RAPPORT-DE-VERIFICATION.md),
[intégrité](../../output/campagnes-tests/runequest/verification-integrite.json),
[Electron](../../output/campagnes-tests/runequest/verification-electron.json).

## Premier geste de David

**RQ-A1 livré, à essayer** : sa case reste vide/orange ; RQ-A2 est coché/vert.

1. Si le pilote installé est encore 2.0.0, importer
   [RuneQuest-2.1.0.gmos-driver](../../output/campagnes-tests/runequest/RuneQuest-2.1.0.gmos-driver)
   avec **Remplacer** dans les pilotes, puis vérifier version et coups localisés.
2. Lire [LIRE-MOI](../../output/campagnes-tests/runequest/LIRE-MOI.md). Pour une nouvelle
   aventure, commencer par **01-Les-Bornes-du-gue.gmos**. Si 01 est déjà joué, préserver son
   export et importer seulement le laboratoire voulu ; ne pas remplacer l'aventure pour
   mettre à jour le pilote.
3. Pour cette recette : **02-Aptitudes-Combat-et-Sante.gmos**, puis les cas
   **RQ-LOCAL-01 à RQ-LOCAL-12** du [cahier](../../output/campagnes-tests/runequest/CAHIER-DE-RECETTE.md).
   Remplacer seulement 02 pour revenir aux valeurs préparées. Consigner les résultats dans
   le nouveau CSV ; l'ancien reste conservé.

## Sources et pièges à ne pas repayer

- L'export corrigé 2.1.0 n'existe plus dans Export Dirvers. Reconstruction par le générateur
  **existant et versionné** outils/runequest/finir_runequest.py depuis le pilote historique
  2.0.0, sous output, sans changer le code applicatif. Les trois archives embarquent le même
  2.1.0 ; le générateur exige son ID, sa version, les 320 champs et les sept zones.
- L'export de joueurs d'origine n'est plus présent. Réutiliser le relevé minimal autorisé
  outils/campagnes-de-recette/cthulhu-hack-joueurs.json ; provenance indique explicitement
  cette absence et conserve l'ancienne empreinte comme historique, sans prétendre l'avoir
  revérifiée ni rechercher des données personnelles.
- Sources : runequest.mjs, runequest-recette.mjs, runequest.test.ts, emballer-runequest.mjs,
  nouveau runequest-verifier-plugin.mjs ; E2E campagneDeRecetteRuneQuest.spec.ts et nouveau
  runequestCoupsDeRecette.ts. Les instructions et sources reproductibles sont dans le lot.
- L'E2E de comparaison exige aussi le pilote historique du dossier conservé dans le dépôt,
  exclu du ZIP courant. Le générateur normal accepte le pilote 2.1.0 livré quand l'export
  corrigé manque, ou GMOS_PILOTE_RUNEQUEST. Le vérificateur du plugin accepte les chemins
  GMOS_PYTHON et GMOS_VERIFICATEUR_CAMPAGNES.
- Plusieurs écritures Node ont retourné UNKNOWN de manière transitoire. Relance ciblée et
  copie native PowerShell ont abouti. Le contrôle négatif final travaille sur **une copie**
  sous tmp/rq-a1, jamais sur les rapports à livrer ; vérifier la concordance avant emballage.
- Un renvoi au § 186/ligne 122 (gardes de Claude) avait été associé à tort à la recette
  RuneQuest dans le suivi précédent : retiré, ligne remise à son état « Rien ». Le pilote
  relève du § 187 ; la recette révisée relève de ce **§ 202**.

## Isolement et dépôt

Autorisations précédentes d'essais RuneQuest isolés et de relance hors bac à sable conservées.
Lanceur de test : USERPROFILE, profils/corpus/coffre/sauvegardes/ports jetables, appareils
désactivés, réseau externe des Hub bloqué. Aucun accès aux campagnes ou sauvegardes personnelles,
aucun paquet installé. **Aucun src/ ou electron/ modifié par RQ-A1.** Les modifications antérieures
GM-05/RQ-A2 restent présentes. Pas d'autre chantier commencé.

**Non commité, non poussé**, faute de demande Git pour ces lots. Préserver les exports,
références et traces des autres chantiers. Prochaine intervention : essai humain RQ-A1,
puis choix d'un autre lot ; RQ-A3 à A6 restent à faire.
