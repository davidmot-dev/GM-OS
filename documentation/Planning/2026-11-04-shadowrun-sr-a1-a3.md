# Shadowrun Anarchy — SR-A1, SR-A2 et SR-A3 — 04/11/2026

David : « on va commencer SR-A1, SR-A2 et SR-A3 ». GM-OS confirmé fermé ; ajout au registre
autorisé en conservant les changements existants ; essais Electron et services locaux autorisés
sur profil jetable. **Livré et validé par David le 04/11/2026.**

Validation de David le 04/11/2026 : « ok c'est bon, c'est testé ». Elle porte sur SR-A1, SR-A2 et SR-A3 du pilote 2.1.0 ; les limites documentées et SR-A4/A5/A6 restent séparés. Registre § 211.

## Référence et périmètre

Livre `sran2_01anarchyv2_web_v1.pdf`, lu directement sur le NAS en lecture seule : p. 60,
69-70, 170, 212, 216-218 ; PDF = imprimée +2. Le corpus n’a pas été réécrit.
Les anciens rapports de recette ne sont pas modifiés. Les choix ouverts de narration,
la variante « plus sombre », la protection active et le rigging restent hors de ce lot.

## Réalisation

- **SR-A1** : `suiviDeShadowrun.ts`, `moniteurDeShadowrun.ts`, `CartesShadowrun.tsx` et panneau
  de jet. Origine par case ; anciennes cases « inconnues », jamais assimilées automatiquement
  à une blessure ordinaire. Drain proposé après un jet explicitement soumis au drain, conservé
  après relance et aggravation. Premiers soins et magie refusés au drain à la porte commune
  des impacts ; case choisie, échec et tentative par méthode, repos confirmé 8/24/72 h dans
  l’ordre de gravité. Les malus temporaires expirent par « Fin de la prochaine narration » ;
  aucun lien avec le compteur des rounds. Les seuils des soins tiennent compte de l’Essence.
- **SR-A2** : réserves et seuils proposés, attribut lié explicitement ou valeur numérique
  conservée, dérogation enregistrée. Les indices de protection sont des champs distincts,
  laissés vides pour les profils existants : aucun chiffre déduit du nom de l’armure.
  Anarchy sans maximum de fiche ; 99 → 100 éprouvé. Le choix du désavantage social appartient
  au meneur ; Essence 0 bloque le jet et demande une confirmation de mort. Une confirmation
  marque la santé « dead » et ne peut être annulée par un soin ou l’écriture d’une ancienne
  fiche HTML dépourvue du suivi.
- **SR-A3** : `matriceDeShadowrun.ts`, carte de préparation, portes communes de préparation
  du jet. Cibles/PAN/serveurs séparés, accès, Firewall effectif, backdoor, mode et équipement
  déclaré. Aucun → Administrateur +2 avant backdoor ; minimum de risque imposé, refus si
  supérieur à la réserve. RA/trodes sans action RV gratuite ni avantage ; hot-sim avec IND
  cybernétique : avantage seulement en cybercombat, biofeedback mental létal, éjection grave.
  Conséquences confirmées une seule fois ; accès en cas de réussite, surveillance +2/+1,
  convergence et choc d’éjection. Le mode du lancer est conservé pour cette conséquence.
  Un redémarrage seul perd les accès ; les malus demandent aussi 1 h hors ligne, sans
  réparation implicite d’un cyberdeck brické.
- **Persistance** : suivi, Matrice et dérogations dans `sheetData`, conservés par les écritures
  des anciennes fiches HTML. Un changement de personnage remonte un panneau de jet distinct.

Le pilote **2.1.0** est dans
[`Export Dirvers/corriges/Shadowrun-Anarchy-2.1.0.gmos-driver`](../../Export%20Dirvers/corriges/Shadowrun-Anarchy-2.1.0.gmos-driver).
David rappelle le 04/11 que les pilotes à réimporter doivent se trouver dans ce dossier.
La copie de recette reste dans `output/` ; son empreinte SHA-256 est identique au fichier livré.
`outils/shadowrun-anarchy/ameliorer_shadowrun.mjs` part de l’export corrigé 2.0.0, garde
les identifiants et toutes les clés existantes et ajoute quatorze champs (139 au total).
L’export courant de David n’a pas été remplacé. Le test du générateur part aussi de la
copie 2.0.0 conservée dans le lot de recette, pour rester reproductible.

## Vérifications

- Suite complète exécutée : **9 803 tests passés, 4 ignorés**, 825 fichiers passés et un ignoré
  (490,61 s). Après les derniers ajustements du test de générateur : **73 tests ciblés passent
  sur sept fichiers**, dont manuel, cartes, panneau, porte des dégâts et générateur.
- Pilote généré : **zéro constat** de `controlerLePilote`, identifiants et clés conservés,
  champ absent volontairement détecté par le contrôle.
- `npx.cmd tsc -b` et `npm.cmd run build` : **passés** ; lint global : **0 erreur**, un
  avertissement préexistant dans `useSaisieDifferee.ts`, non corrigé hors sujet.
- `e2e/shadowrunAvance.spec.ts` et `e2e/capturesDesJeux.spec.ts` : **deux parcours passés**
  sur la construction finale (47,4 s). Import réel par Nexus, drain confirmé
  puis soin interdit, Anarchy 100, dérivé appliqué sans perdre la blessure, seuil
  Administrateur/backdoor, surveillance, accès, passage en hot-sim et rechargement.
  Preuve : `output/shadowrun-sr-a1-a3/verification-electron.json`.
- **Dix captures relues** : deux métier (`jeu-shadowrun-drain.jpg`, `jeu-shadowrun-matrice.jpg`)
  et huit du manuel ; six des huit remplacent les anciennes captures communes, deux restent
  dans les preuves. Le manuel 53 et 54 et la synthèse des pilotes sont actualisés. La capture
  générique des cartes est aussi raccordée à `e2e/capturesDesJeux.spec.ts`.

## Essai de David — validé le 04/11/2026

Validation de David le 04/11/2026 : « ok c'est bon, c'est testé ». Elle porte sur SR-A1, SR-A2 et SR-A3 du pilote 2.1.0 ; les limites documentées et SR-A4/A5/A6 restent séparés. Les gestes ci-dessous sont conservés pour reproduction.

1. Importer le pilote 2.1.0 avec **Remplacer**. Dans **Lancer un test**, lancer une action
   magique soumise au drain ; faire la relance éventuelle avant de confirmer les conséquences.
   Vérifier qu’une blessure de drain refuse les soins, puis confirmer le repos ou la fin du malus.
2. Dans le formulaire, déclarer l’attribut lié et les protections chiffrées pertinentes ;
   sauvegarder. Appliquer ou conserver les dérivés dans la carte ; vérifier que les blessures
   restent. Essayer Anarchy 99 → 100. Tester Essence 0 uniquement sur une copie jetable.
3. Préparer une cible matricielle : Firewall 4, aucun accès, Administrateur, backdoor 1 h :
   seuil 4 avant surveillance. Après une complication, vérifier le malus, fermer/rouvrir,
   puis confirmer le redémarrage et une heure hors ligne. En hot-sim, vérifier « mental létal ».

Les actions gratuites RV sont rappelées, pas consommées par un automate de tour. Les
dommages du cyberdeck, la protection active, le verrouillage, la limite d’un changement de
mode par narration et l’intervention d’élite restent à la table. Sous la variante alternative,
un minimum de dés de risque imposé par DIEU bloque la tentative en attendant l’arbitrage du
meneur ; aucune conversion en dés spéciaux inventée. Stabilisation et repos dans de bonnes
conditions restent des confirmations de table. L’origine d’une ancienne case est à renseigner.

## Reproduction

```powershell
node outils/shadowrun-anarchy/ameliorer_shadowrun.mjs "Export Dirvers/corriges/SR_Anarchy_driver_gmos_finir.gmos-driver" "Export Dirvers/corriges/Shadowrun-Anarchy-2.1.0.gmos-driver"
npx.cmd vitest run --maxWorkers=4
npx.cmd tsc -b
$env:ELECTRON_RUN_AS_NODE=$null
npm.cmd run build
npx.cmd playwright test e2e/shadowrunAvance.spec.ts --reporter=list
```

Lancer les essais applicatifs seulement avec l’accord de David pour leurs services locaux.
Le premier lancement sous bac à sable a échoué au nettoyage du profil temporaire (`EPERM`) ;
la relance autorisée hors de cette restriction passe. Aucun profil personnel lu.
