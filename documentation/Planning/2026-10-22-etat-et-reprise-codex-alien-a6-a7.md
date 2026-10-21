# État et reprise — Alien A6/A7, 22/10/2026

**Travail commencé le 21/10/2026, poursuivi le 22/10, Codex.** David :
« on va continuer avec A6 et A7 », puis « Non, GM-OS est fermé. » ; le 22/10 :
« continue ». A0–A5 sont validés. A4/A5 et leurs fichiers non commités sont les nôtres ;
ils sont prolongés, sans toucher aux autres chantiers.

## Livraison et suite

[Bilan](2026-10-21-alien-a6-a7.md), [registre Alien](2026-10-19-registre-ameliorations-alien.md),
[synthèse](2026-10-20-ameliorations-tous-les-pilotes.md).
Exports A6 **1.6.0** et A7 **1.7.0** ; A7 inclut A0–A6. Même pilote et gabarit,
**49 champs et 46 correspondances**, source A5 conservée octet pour octet.
Script `outils/alien/ameliorer-pilote-a6-a7.mjs`.

État : **A6/A7 livrés et contrôlés le 22/10**, recette finale réussie.
**Essais A6/A7 validés par David le 22/10** : « ca marche pour A6 et A7, commit et pousse,
après tu fais A8, GM-OS est fermé ». Commit et push A4–A7 autorisés, puis A8 demandé.
Le combat spatial reste un chantier séparé.

## Ancres et décisions

- `dice/systemes/actionsAlien.ts`, `combat/components/ActionsAlien.tsx` : paiements
  lente/rapide, réactions, surveillance et file des cartes. Les actions sont déclarées
  manuellement avant les dés ; aucun second débit dans le panneau de jet.
- `combat/useCombatStore.ts`, `types.ts`, `InitiativeList.tsx`, `HubCombatTracker.tsx` :
  cartes multiples sur un seul combattant, file ordonnée, tour actif, budgets persistants,
  interruptions et conservation des paiements hors tour. Tirage sans remise, refus de
  repiocher dans le même combat ; maximum dix cartes avant regroupement des PNJ.
- `dice/systemes/xenomorphesAlien.ts`, `XenomorpheAlien.tsx`, `AcideAlien.tsx` : nature
  explicite, Vitesse, Santé et protection propres, compétences sans attribut, tables
  existantes, critiques D6 et aspersions distinctes. Cibles, issue de fuite/attaque et
  décor restent arbitrés par Maman. Le feu ne fait pas couler le sang XX121.
- `entitySlice.ts`, `SanteDuCombattant.ts`, `CombatCard.tsx`, `SanteAlien.tsx` : Santé
  commune reflétée sur les fiches de campagne et le plateau ; aucun Brisé humain sur
  un xéno. Les dégâts réels créent les demandes de critique/acide et gardent leurs reçus.
  Les corrections administratives de Santé restent alignées entre fiche et combat,
  sans inventer de coup, de critique ou d'acide.
- `dice/systemes/progressionAlien.ts`, `ProgressionAlien.tsx` : mode, périodes nommées,
  fins d'acte et de séance, gains/achats, fétiche et apprentissage. Une préparation
  persistante par achat ; elle ne se repaie pas au double clic ou au rechargement.
  Réponses du bilan et mérite de l'acte validés restent visibles et verrouillés à la reprise.
- Les objectifs Cinéma vivent dans les métadonnées réservées, jamais dans le champ
  imprimé Objectif personnel. Remise par `sendDirectMessage` existant ; caviardage des
  brouillons/reçus dans Nexus, le combat, CrossWindow et SyncServer avant flux public.
  Le fil privé assure la reconnexion du seul destinataire. Aucun objectif au journal.
- `types/donneesDeFiche.ts` reconnaît les cinq suivis Alien, avec les bornes JSON déjà
  employées pour RdD ; objets arbitraires, fonctions et cycles restent refusés.
- PX numériques sur le même identifiant ; surplus des dix cases HTML conservé dans la
  progression. Les anciens stocks/raccords A0–A5 sont conservés.

## Contrôles

Rapports dans `scratch/alien-a6-a7/` : `tests.log`, `cibles.log`, `lint.log`,
`build-final.log`, `controle.json`, `export.json`, `recette.log`.
Suite élargie du 22/10 : **1 567 tests, 119 fichiers**, contrat du manuel compris.
Types et construction réussis. Lint ciblé sans erreur ; avertissement
React Compiler de `PanneauDeJet.tsx` déjà présent en A4/A5, sans blocage.
Archive : zéro diagnostic de Forge, aucun lien manquant, aller-retour des armes réussi.
Recette réelle A0–A7 Electron/combat et Hub Edge à **360/768/1 180 px réussie**
(environ 2 min 30). Confidentialité vérifiée dans les messages WebSocket publics et
remise privée retrouvée après reconnexion ; bilans et achats persistants, sans double gain.
**Neuf nouvelles captures relues et copiées dans le manuel.** Essai de David validé le 22/10.

```powershell
node outils/alien/ameliorer-pilote-a6-a7.mjs 'Export Dirvers/corriges/Alien_driver_gmos_a5.gmos-driver'
node --experimental-strip-types scratch/alien-a6-a7/verifier.mjs
npx.cmd tsc -b
npm.cmd run build
$env:GMOS_PILOTES_DES_JEUX='C:\Projet_David\GM-OS-v5\scratch\alien-a7\pilotes'
$env:GMOS_SORTIE_CAPTURES_JEUX='C:\Projet_David\GM-OS-v5\scratch\alien-a6-a7\captures'
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
npx.cmd playwright test e2e/capturesDesJeux.spec.ts -g 'ALIEN' --workers=1 --reporter=list
```

Les profils sont ceux, jetables, d'`e2e/lancerGmOs.ts`. Le bac à sable échoue sur le
processus GPU et le parcours du répertoire utilisateur ; relancer avec les permissions
nécessaires sur les mêmes profils isolés. Aucune donnée de David utilisée. Aucun
paquet installé ni service lancé manuellement. Ne pas éditer l'application pendant la recette.

## Pièges de cette reprise

- Les sélecteurs de recette doivent cibler le rôle **checkbox** de Lambert : les nouvelles
  listes Camarade/Rival portent aussi son nom dans leurs options. Le menu de mode a un
  nom accessible explicite pour ne pas inclure ses options dans le libellé exact.
- Sous PowerShell, `*> fichier` peut transformer un avertissement natif en erreur de
  commande alors que Vite finit correctement. Capturer via `2>&1 | Out-File`, puis conserver
  et rendre explicitement `$LASTEXITCODE`. La dernière construction rend bien zéro.
- Conserver une seule Santé de créature. Ne pas simuler la Vitesse en dupliquant les fiches.
- Le Hub se met normalement en veille hors séance active. La recette termine la séance
  pour acheter, puis ouvre une séance fictive suivante avant les contrôles du Hub.
  Ne pas modifier ce comportement pour les besoins du test.
- Ne pas attribuer de gains ou acheter automatiquement sur un simple changement de contexte.
  Les noms de scénario/séance distinguent les périodes et les reçus ne sont pas effacés.

## Copie de travail et prochain geste

Le registre général partagé `2026-08-23-chantiers-gares.md`, le guide 62, les exports et
dossiers de corpus des autres chantiers restent intacts. David autorise le commit/push
de cette livraison, puis A8, et confirme GM-OS fermé le 22/10. Les archives de pilotes
restent locales conformément à la passation ; les scripts reproductibles sont versionnés.
Avant une édition après le prochain essai de David, redemander si GM-OS tourne.
