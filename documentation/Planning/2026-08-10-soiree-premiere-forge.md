# La première forge réelle — séance du 2026-08-10, après-midi et soirée

Écrit pour être lu à froid. Suite de `2026-08-10-etat-et-reprise.md`, dont le chemin critique était
« faire tourner la Forge sur un système réel ». C'est fait, et **la première fiche v3 du corpus est
sur le disque**.

Branche `feature/tablet-hub-pwa`, tout poussé jusqu'à `63344bb`. 748 tests verts, typecheck propre,
build réel vérifié.

---

## 1. Par quoi reprendre — **sortir la Forge de Session OS**

> **Le corpus Dune est complet.** 17 fichiers, les 12 sujets du canevas que le livre traite —
> *Poursuites* n'est pas couvert, l'inventaire l'a établi — plus 4 mécaniques hors canevas, plus les
> 8 personas. **69 des 89 sections citées se résolvent en pages vérifiées (78 %).**

**Le chantier décidé le 2026-08-10 : faire de la Forge un module à part, hors de Session OS.**

Trois raisons, la première étant démontrée plutôt qu'argumentée :

1. **Ce n'est pas une opération de séance.** On documente un système de jeu, pas une partie. Le
   corpus Dune sert toutes les campagnes Dune. Le couplage à la campagne active est précisément ce
   qui a fait réaffecter le pilote d'une campagne Blade Runner pour enrichir Dune, et qu'il a fallu
   défaire (`52b3f71`).
2. **Le travail est long et se reprend** — dix-sept fiches à deux ou trois minutes, sur plusieurs
   séances, avec brouillons et avancement lu sur le disque. C'est un atelier, pas une action de table.
3. **Les frontières sont déjà tracées.** `corpusSysteme.ts` répond seul à « où vit ce corpus », et
   plus rien dans l'atelier ne dépend de la campagne. Le module existe en substance ; il est
   simplement rangé sous Session OS.

**Ce qu'il reste à faire, dans l'ordre :**

1. ~~**Le module lui-même**~~ — **fait.** Voir le § 1 bis.
2. **Structure Système crée le corpus** : `corpusId` dérivé du nom, et création de
   `rules/`, `index/`, `personas/`. Aujourd'hui la Forge crée un pilote avec un identifiant horodaté
   et rien autour — *et l'inverse existe aussi* : Alien a un corpus complet et **aucun pilote**, donc
   il n'apparaît dans aucun sélecteur de système.
3. **Brancher le résolveur** `electron/bookIndex.ts` : il n'a toujours aucun appelant en production.
   L'afficher **dans la revue**, avant publication, ferait de la vérification une étape du flux au
   lieu d'une sonde lancée à la main.
4. **Reforger Alien et Blade Runner** avec les gabarits v3.
5. ~~**Le sujet libre**~~ — **fait** (`fd9aaa0`) : la liste se recalcule à la frappe, sans requête, et
   ne se dédouble plus, la comparaison se faisant sur le slug.
6. **Rendre son pilote Blade Runner à « Anges de Feu »** si ce n'est pas déjà fait.

---

## 1 bis. La Forge est un module — ce qui a réellement changé

**Le point d'entrée.** `src/modules/forge/ForgeOS.tsx`, atteint par la barre latérale, sous Journal.
Il porte son propre en-tête et la bascule des deux ateliers — *Structure Système* / *Atelier de
Règles* — qui vivait dans l'en-tête de Session OS. `ForgeDashboard` est inchangé dans son fond :
c'est son hébergement qui change.

**La vue `'forge'` de Session OS n'existe plus.** Les deux raccourcis qui y menaient — le cockpit de
campagne et la bibliothèque de modèles — changent maintenant de module. `currentView` étant persisté,
une disposition enregistrée avant ce déplacement désignerait encore une vue disparue :
`SessionDashboard` la réaiguille vers le module et repose la vue sur le cockpit.

**Ce qui compte le plus : le corpus n'a plus de valeur par défaut.** Il en tirait une de la campagne
active. Nous l'avions déjà rétrogradée en simple défaut le matin même, et **cela n'a pas suffi** :
David a choisi Dune et la forge est repartie sur Blade Runner. *Un défaut hérité d'ailleurs reste un
choix que personne n'a fait.* Le corpus se désigne donc, dans l'atelier, et nulle part ailleurs.

Deux conséquences à ne pas défaire :

- **Le bouton de lancement exige le corpus autant que le carnet.** Sans ce garde-fou, l'atelier
  partait sans savoir où écrire et ne le découvrait qu'à l'enregistrement — une fiche et deux minutes
  plus tard.
- **Le corpus est persisté** (`gmos-forge-corpus`, `partialize` sur ce seul champ). Sans défaut *et*
  sans mémoire, il faudrait le re-désigner à chaque ouverture : une friction qui pousse à cliquer
  vite, c'est-à-dire exactement ce qui a causé le défaut. Rien d'autre n'est persisté — l'avancement
  se relit sur le disque, où il est vrai. `corpusPersiste.test.ts` tient ce contrat.

**Ce qui reste dans Session OS, et c'est voulu.** Le Grimoire (`RuleWorkshopViewer`) lit le corpus de
la campagne ouverte : en séance, c'est bien la campagne qui décide quel livre citer. Lecture et
écriture passent par le même `corpusSysteme.ts`, mais elles ne posent pas la même question — l'une
demande « quel livre pour cette partie ? », l'autre « quel livre je documente ? ». L'avertissement de
contradiction disparaît donc de l'atelier (un choix explicite ne se contredit avec rien) et reste
côté lecture, où la déduction subsiste.

---

## 2. Les mesures réelles, qui n'existaient pas avant cette séance

Toutes relevées sur `~/mcp_bridge_debug.log` pendant des forges réelles du carnet Dune.

| Requête | Sources | Durée | Issue |
|---|---|---|---|
| Inventaire | 12 | 5 min 31 s | ✗ dépassement serveur |
| Inventaire | 1 | 2 min 08 s | ✓ |
| Inventaire | 1 | **72 s** | ✓ |
| Fiche, gabarit entier | 1 | 5 min 56 s | ✗ dépassement serveur |
| Fiche, **moitié 1** (règle, valeurs) | 1 | **82 s** | ✓ 2 398 car. |
| Fiche, **moitié 2** (table, cas limites) | 1 | **89 s** | ✓ 2 439 car. |
| Fiche, moitiés (moyenne sur 7 requêtes) | 1 | **60 s** | ✓ ~2 min par fiche |

**Le serveur NotebookLM coupe autour de six minutes**, avec
`{"status":"error","error":"Query failed: The read operation timed out"}`. Ce n'est pas notre plafond
de dix minutes : celui-là n'a jamais été atteint.

Deux leviers mesurés : **filtrer les sources** (douze → une : de l'échec à 72 secondes) et **alléger la
demande** (le gabarit de fiche fait le double de l'inventaire).

**La divergence 10 min / 45 min entre `ForgeService` et `mcp_bridge` est donc sans conséquence
pratique** — on n'y touche pas.

---

## 3. Neuf défauts trouvés, dont sept en regardant tourner

C'est le fait marquant de la séance : **aucun n'aurait été trouvé sans le journal et le compteur.** La
demande initiale de David — « je n'ai aucune vue sur ce qui est fait » — valait mieux que la forge
elle-même.

Tous partagent la même forme : **quelque chose échoue ou dévie sans le dire.**

| Défaut | Comment il se taisait | Commit |
|---|---|---|
| « Feyd-Rautha » pris pour une session expirée | `includes('auth')` sur un appel **réussi** | `d4a80b0` |
| Trois requêtes simultanées | atelier monté deux fois (`App.tsx` **et** `ForgeDashboard`) | `478c020` |
| Personas de Dune jamais lues | `catch {}` sur un chemin inexistant | `7676354` |
| Corpus déduit de la campagne | il fallait réaffecter un pilote pour dire « je documente Dune » | `52b3f71` |
| Sources d'un autre carnet | affichées comme « aucune » pendant qu'elles filtraient | `a15705e` |
| Le studio détournait le livrable | la réponse n'était qu'un compte rendu | `63a8960` |
| « 13 sujets sur 13 traités » sur zéro | le drapeau `lu` perdu à la correspondance | `63a8960` |
| Hors catégories en liste numérotée | le parseur n'acceptait que les puces | `489b4d1` |
| Sections entre accents graves | ni le découpage ni le nettoyage ne les connaissaient | `489b4d1` |

**Le plus instructif est « Feyd-Rautha ».** `isAuthError` cherchait la sous-chaîne `auth` dans le
résultat, y compris quand l'appel avait réussi — et les sources Dune contiennent quatorze occurrences
du motif (« Feyd-R**auth**a », « d'**auth**entiques experts »). Chaque lecture de source déclenchait
une reconnexion inutile, un rejeu, puis `MCP_AUTH_EXPIRED` sur un appel parfaitement abouti. La
correction structurelle vaut d'être retenue : **un succès n'est jamais une erreur d'authentification,
quoi qu'il contienne.** On n'inspecte le texte que d'une chose déjà en échec.

---

## 4. Ce que le carnet fait vraiment, et qui n'était pas écrit

Quatre comportements observés, tous coûteux, aucun documenté avant cette séance.

**Il détourne le livrable vers le studio.** La consigne « Génère un Markdown que tu sauveras dans le
studio » — présentée comme un acquis au § 8 de la procédure — fait déposer le document dans le studio
et ne renvoyer qu'un compte rendu en prose. À la main, David ouvrait le fichier ; à travers MCP, la
réponse est tout ce qu'on reçoit. **Les quatre gabarits exigent désormais que la réponse soit le
livrable**, l'archive restant accessible par l'option `studio` pour un prompt copié à la main.

**Il nomme ses documents comme il veut** : `analyse-regles-dune`, `synthese-complete-systeme-2d20-dune`,
`synthese-systeme-dune-sections`, `analyse-mecanique-dune-officiel` — quatre familles de noms pour la
même demande. Même en voulant récupérer une synthèse depuis le studio, on ne saurait pas laquelle
chercher. Le dépôt au studio était une impasse dans les deux sens.

**Il rend ses listes hors catégories en numéroté** (`1. **Nom** : …`) et **ses titres de section entre
accents graves** (`` `Tests de compétence` ``). Les deux échappaient au parseur.

**Il cite des pages malgré l'interdiction explicite du gabarit v3**, et produit des répétitions
parasites (« allant de de de quatre à de de de de huit »). Rien à corriger de notre côté ; la
conversion signale les pages fiche par fiche.

---

## 5. Ce que la Forge sait faire maintenant

**L'écriture résout comme la lecture.** `electron/corpusSysteme.ts` répond seul à « où vit ce
corpus ? », par ordre d'autorité : chemin déclaré sur la campagne, `corpusId` du pilote, `ragPath`
hérité, identifiant, nom affiché, défaut. Les trois artefacts en dérivent — `rules/`, `gems.json`,
`index/` — parce que deux d'entre eux n'ont aucun moyen d'être redirigés ailleurs. `ragSelection`
importe de ce module ses règles d'identité au lieu d'en garder une copie.

**On documente un corpus, pas une campagne.** L'atelier porte sa propre cible, choisie dans la liste
des dossiers réels, et n'écrit rien dans la campagne. Un corpus inédit peut être nommé à la main. La
campagne active ne fournit plus qu'une valeur par défaut.

**Rien ne se perd.** La fiche part en brouillon dans `<corpus>/drafts/` dès son retour du carnet,
avant toute revue — `drafts/` est exclu de l'index de l'Oracle par le `.ragignore` de `docs/`, et le
brouillon est supprimé à la publication. Le gabarit de fiche est scindé en deux moitiés, et **la
première est écrite avant que la seconde ne parte** : un brouillon partiel se reconnaît à l'absence de
`## À la table`, et seule la moitié manquante est redemandée.

**L'inventaire se reprend depuis le disque.** Il est enregistré comme fiche du corpus
(`inventaire-des-mecaniques.md`, `sujet: Inventaire des mécaniques`), et l'atelier le relit à
l'ouverture au lieu de repayer 72 secondes. Treize fiches, c'est une demi-heure : personne ne fait ça
d'une traite.

**On voit ce qui se passe.** Compteur de durée, journal du pont (`mcp:activity`), nom du carnet et des
sources interrogées, bandeau du corpus visé, bouton « cesser d'attendre ». Le verrou du carnet est un
verrou de **module** avec génération, pour qu'une requête abandonnée ne libère pas le verrou de sa
remplaçante.

---

## 5 bis. Le résolveur a enfin une entrée — et il fonctionne

Confronté à la première fiche v3 (`resolution-des-jets.md`), contre l'index Dune :

```
exact         p. 145   Tests de compétence
exact         p. 148   Procédure des tests de compétence
introuvable   —        Dés
approche      p. 145   Difficulté        (via « Diffculté »)
exact         p. 149   Améliorer vos chances
exact         p. 154   Marge de complication

résolus : 5 / 6        pages invraisemblables : aucune
```

**Ce sont les premières pages vérifiées du projet.** À comparer aux fiches v1 qui citaient jusqu'à la
page 1279 pour un livre qui s'arrête à 328.

« Difficulté » retrouvé via « Diffculté » : la ligature `fi` perdue à l'extraction, obstacle n° 1 du
relevé de la veille — la tolérance d'un caractère par tranche de sept a fait exactement son office.
« Dés » reste introuvable, et c'est honnête : trois caractères ne se rapprochent pas sans risque.

**Ce qui reste à faire du résolveur** : il n'a toujours aucun appelant en production. La sonde ci-dessus
était temporaire. Le brancher — sur la revue, pour afficher les pages résolues avant publication — est
le point 2 du § 1.

---

## 6. État du corpus Dune

| Emplacement | Contenu |
|---|---|
| `rules/` | **`inventaire-des-mecaniques.md`** (9,9 Ko, `sujets_traites: 12 sur 13`, `hors_categories: 4`) et **`resolution-des-jets.md`** (5,2 Ko, six sections, 5 pages vérifiées) |
| `drafts/` | vide — le brouillon est supprimé à la publication |
| `rules-v1/` | les 18 fiches v1, archivées, exclues du RAG, conservées pour la fusion des doublons |
| `index/` | `.docx` (736 entrées) + `.md` (122) |
| `gems.json` | les personas — **actives depuis `7676354`**, elles n'avaient jamais été lues |

---

## 7. Trois choses à ne pas redécouvrir

- **Un garde-fou qui rattrape n'est pas un garde-fou qui évite.** Le bandeau de corpus a bel et bien
  empêché treize fiches Dune de partir dans `systems/blade-runner/`. Mais il n'a empêché ni la
  confusion ni le dommage collatéral — une campagne Blade Runner s'est retrouvée avec le pilote de
  Dune, parce que c'était le seul moyen d'exprimer « je veux enrichir le corpus Dune ». C'est la
  conception qui rendait l'erreur facile, pas l'utilisateur qui manquait d'attention.
- **Le journal de débogage du pont est la meilleure source de vérité.** `~/mcp_bridge_debug.log`
  contient les requêtes et les réponses intégrales. Sept des neuf défauts en sortent. Attention à sa
  taille : une réponse de `source_get_content` fait 2,7 Mo sur une seule ligne — ne jamais le lire en
  entier, toujours extraire.
- **Vérifier sur la charge réelle, pas sur un exemple écrit soi-même.** Le correctif « Feyd-Rautha » a
  été confronté à la réponse de 2,67 Mo qui l'avait déclenché : l'ancienne heuristique rend `true`, la
  nouvelle `false`. Un exemple fabriqué n'aurait rien prouvé.
