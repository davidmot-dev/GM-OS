# NP-C2 et NP-C3 — reprise des fiches, droits et variantes

David, le 02/11/2026 : **« on va continuer avec NP-C2 et NP-c3 des amélioration »**.
Réponse à la garde de modification : **« GM-OS est fermé, tu peux modifier »**.
La réalisation a commencé le 02/11, et les vérifications ci-dessous le 03/11.

## État vérifié

**NP-C2 et NP-C3 livrés, éprouvés et validés par David le 03/11/2026 :**
« ok tout est testé, commit et pousse ». Autorisation explicite des essais isolés reçue,
y compris Electron hors bac à sable ; **six parcours passent**, huit captures relues.
Aucun défaut GM-06 trouvé. Aucune fiche personnelle lue ou convertie.

## NP-C2 — ce qui est réalisé

- [x] Diagnostic accessible au meneur dans le formulaire du PJ : pilote/version installés,
  gabarit attendu, dernière référence connue. L'absence de référence reste « inconnue ».
- [x] Référence de pilote et structure du gabarit retenues sur les nouveaux PJ et à la reprise.
  Les personnages anciens ne reçoivent aucune version inventée à leur ouverture.
- [x] Anciennes clés et valeurs inconnues conservées, y compris zéro, faux et objets.
  Champs absents proposés avec leurs valeurs initiales ; incompatibilités signalées.
- [x] Aucune conversion déduite d'un libellé. Le meneur choisit une source et une cible et
  voit l'aperçu avant/après, y compris le remplacement d'une cible déjà remplie.
- [x] Export JSON avant application, lié au joueur et au PJ ; relecture du format avant
  application. Retour arrière limité aux rubriques reprises : données, liens et référence.
- [x] Restauration relue et explicite. Refus d'écraser les rubriques si elles ont changé
  depuis la reprise ; notes, inventaire et santé modifiés depuis restent en place.
- [x] Saisies non sauvegardées bloquantes ; reprise atomique par l'action du magasin, avec
  l'origine meneur et l'historique existants. Aucun remplacement de campagne.
- [x] Une ancienne fiche HTML est détachée si le gabarit change, sans supprimer la fiche.
  La bibliothèque et le pilote ne font pas partie du retour arrière JSON.
- [x] Bilan Nexus : avertissement lorsqu'un pilote local de même ID est conservé mais
  diffère de l'archive (version, jet, combat ou structure de gabarit). Deux variantes de
  même version peuvent différer. Remplacement du pilote toujours explicite par .gmos-driver.
- [x] Voyageur : conserve sa reprise spécifique, ses règles et sa validation propres.
- [x] Parcours réel du panneau sur les quatre jeux : téléchargement isolé, application,
  notes et PV conservés, import du JSON, restauration et rechargement.
- [x] Captures du panneau relues avant de les annoncer comme preuve applicative.
- [x] Essai de David sur une copie de personnage, sans toucher à sa partie en cours.

**Limites voulues.** Le diagnostic ne reconstitue pas le pilote historique d'une fiche sans
référence. Il ne découpe pas un texte libre d'arme ou de Voie en une structure de règles.
Il ne transforme pas la sauvegarde JSON en remplacement de pilote, de campagne ou de moteur
HTML. Les correspondances et leurs valeurs restent à arbitrer par le meneur.

## NP-C3 — parcours éprouvés

- [x] Relecture de `electron/actionPolicy.ts` : contrôle de propriété déjà présent pour
  données, narratif et PV ; alias privilégiés refusés par rôle. Les contrats des messages
  sont relus dans `remote/actions/sessionActions.ts`. Aucune correction réseau spéculative.
- [x] Six tests exécutés dans les instances jetables autorisées :
  quatre jeux (RuneQuest, Degenesis, COC, Shadowrun), puis deux variantes.
- [x] Sur chaque jeu : message forgé sur les données, le narratif, les PV et un alias vers
  le PJ d'un autre joueur ; prouver qu'il reste inchangé.
- [x] Autoriser l'édition de son propre PJ dans la même série de messages, comme témoin
  positif ; notes MJ protégées ; recharger pour vérifier la persistance du refus.
- [x] COC : importer d20, remplacer par le 3d6, ouvrir le panneau et lancer ; remplacer par
  le d20, lancer à nouveau ; conserver les personnages, notes et valeurs ; recharger.
- [x] Shadowrun : fixture temporaire du même pilote avec `risqueAlternatif` activé,
  importer/remplacer, voir les dés spéciaux et lancer ; revenir au standard, voir les dés
  de risque et lancer ; conserver les personnages et recharger. Aucun pilote officiel modifié.
- [x] Lire les captures et les rapports dédiés sous `output/verification-np-c2-c3/`.
- [x] Validation humaine globale de David reçue le 03/11. Aucune nouvelle preuve instrumentée sur tablette physique revendiquée.

## Vérifications effectivement exécutées

- **252 tests verts, 22 fichiers**, sur les quatre exports de pilote livrés, le plan de
  reprise, son export/relecture/restauration, les blocages du panneau, les imports Nexus,
  l'éditeur existant, le Voyageur et la politique de droits.
- Typage `npx tsc -b` sans erreur ; lint ciblé sans erreur.
- Construction finale `npm run build` réussie, derniers diagnostics de types de valeurs inclus.
- Playwright : **quatre parcours droits/reprise verts (1,4 min)**, puis **deux parcours de variantes verts (35,3 s)** ; dernières images et rapports vérifiés.
- Le premier lancement Vitest dans le bac à sable n'a exécuté aucun test : renommages de
  cache refusés (`EPERM`). La relance hors de cette contrainte a réellement exécuté les tests.
- AdmZip et jsdom : réutiliser le tableau d'octets de Node (`Uint8Array`), comme les recettes
  existantes ; sinon lecture ZIP vide. Aucun paquet installé.

Preuves temporaires : `tmp/np-c2-c3-tests.log`, `tmp/np-c2-c3-build.log`.
Sources : `src/modules/session/logic/repriseDeFiche.ts`,
`components/PanneauRepriseDeFiche.tsx`, `src/types/player.types.ts`,
`src/modules/system/archive/versionsDesDependances.ts`, leurs tests et
`e2e/reprisesEtVariantesDesPilotes.spec.ts`.

## Clôture et reproduction

Les six essais sont autorisés et exécutés. David a demandé le commit et le push le 03/11.
Les droits passent par la vraie porte WebSocket et les données survivent au rechargement ;
les reprises téléchargent un JSON dans le profil jetable, le relisent et restaurent les champs.
Les deux variantes lancent réellement et reviennent au standard sans modifier les PJ.

Les corrections de scénario ont rendu conditionnelle la fermeture du bilan Nexus déjà
fermé par la navigation, nommé la compétence fictive Shadowrun et vérifié le résultat visible
du panneau MJ (il consigne au journal, pas dans useDiceStore). Aucun correctif applicatif
supplémentaire n'a été nécessaire. Les premiers échecs ne sont pas annoncés comme verts.

Preuves durables : [rapport](../../output/verification-np-c2-c3/README.md) et
[inventaire SHA-256](../../output/verification-np-c2-c3/verification.json). Huit captures relues,
dont trois reprises dans le manuel. Pour reproduire, construire puis exécuter le seul fichier :

```powershell
npm run build
npx playwright test e2e/reprisesEtVariantesDesPilotes.spec.ts --reporter=list
```

Le helper isole USERPROFILE, APPDATA, corpus, sauvegardes, téléchargements, coffre et appareils.
Aucune donnée personnelle lue, aucune installation. Les guides 10/12 de l'autre agent restent
hors de cette livraison. Les rapports historiques sont préservés. Aucun autre lot de pilote
n'est engagé automatiquement par cette clôture.
