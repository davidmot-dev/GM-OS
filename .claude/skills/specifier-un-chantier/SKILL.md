---
name: specifier-un-chantier
description: Spécifier un chantier neuf de GM-OS AVANT d'écrire du code — le quoi (ce que David fait à la table, critères d'acceptation), les questions à trancher posées à David, le comment (fichiers, magasins, risques propres à GM-OS), les tâches vérifiables, puis une relecture croisée qui attrape les trous et les contradictions. À utiliser quand David demande un module, une fonctionnalité ou une refonte qui dépasse un correctif (« je voudrais que… », « on pourrait ajouter… », « il faudrait un écran pour… »), quand il dit « spécifie », « fais le plan », « on cadre d'abord », ou avant tout chantier de plus d'une séance — même s'il ne prononce pas le mot « spécification ». Pas pour un pilote (skill finir-un-pilote) ni pour un correctif d'une ligne.
---

# Spécifier un chantier

Repris le 08/11/2026 de l'idée de **GitHub Spec Kit** (spécifier → clarifier → planifier →
découper → analyser → réaliser), à la demande de David, et réécrit pour GM-OS. Spec Kit
lui-même **n'est pas installé** : il crée une branche git par chantier et son propre dossier
`specs/`, ce qui heurte AGENTS.md (pas de branche, on reste sur `production`) et doublerait le
registre. Ici, tout s'écrit **dans les documents qui existent déjà**.

**Ce que ce skill évite** : coder avant que David ait tranché ce qui décide du périmètre ;
découvrir au milieu du chantier qu'un magasin a un autre écrivain ; annoncer « fini » un
chantier dont un critère n'avait aucun essai.

⛔ Les étapes 0 à 6 n'écrivent **que** dans `documentation/Planning/`. Rien dans `src/` ni
`electron/` avant l'étape 7 et le feu vert de David.

## 0 · Faire le point depuis le dépôt

- Chercher le sujet dans le registre `documentation/Planning/2026-08-23-chantiers-gares.md`
  (section ⭐, § 1 bis « Constaté, pas encore traité », la vue d'un coup d'œil) et dans
  `documentation/Planning/` (`grep -ril "<mot-clé>" documentation/Planning/`). Un chantier déjà
  ouvert **se reprend**, il ne se double pas.
- Relire les décisions de David à ne pas rouvrir : § 5 de
  `2026-10-04-passation-claude-codex.md`, et celles citées dans les § du registre trouvés.
- Lire le code existant du domaine **avant** d'écrire le quoi : ce qui existe déjà change
  souvent la question (« la Forge enrichit au lieu de doubler »).

## 1 · Le quoi — la spécification

Créer `documentation/Planning/AAAA-MM-JJ-<sujet>.md` sur le gabarit ci-dessous. Le quoi se dit
**avec les mots de la table**, sans nom de fichier ni de magasin :

- **La demande de David, citée entre guillemets**, avec sa date.
- **Les parcours** : ce que David (ou un joueur sur sa tablette) fait, geste par geste, et ce
  qu'il voit. Un parcours par usage ; le premier est celui de la séance.
- **Les critères d'acceptation**, numérotés `C1`, `C2`… : chacun **vérifiable** (« le compteur
  revient à zéro quand on ferme la scène », pas « ça marche bien »). Préciser pour chacun s'il
  se vérifie par un essai ou seulement **à l'écran par David**.
- **Hors champ** : ce qu'on ne fait pas cette fois, dit explicitement.
- **Ce que David garde** : quelles données doivent survivre au redémarrage, à l'export
  `.gmos`, à la sauvegarde automatique. (Les campagnes ont déjà été perdues deux fois.)

## 2 · Clarifier — avant tout plan

Relire le quoi et marquer chaque ambiguïté `[À TRANCHER]`. Puis **poser les questions à
David** (outil de question si disponible), **cinq au plus**, chacune avec ma recommandation en
premier et ce que chaque réponse change. D'abord celles qui décident **du compte et du
périmètre** (combien d'éléments, pour quels jeux, sur quels écrans), ensuite le contenu.

Reporter chaque réponse dans la section **Décisions**, avec ses mots et la date — c'est ce qui
empêche l'autre agent de la rouvrir. Ne pas passer au plan tant qu'une question de périmètre
reste ouverte ; une question de détail peut attendre, notée comme telle.

## 3 · Le comment — le plan

Même document, section séparée. Tout ce qui y figure a été **lu dans le code**, pas deviné :

- **Les fichiers touchés**, avec ce qui change dans chacun ; ce qu'on **réutilise** de
  l'existant.
- **Les données** : pour chaque magasin (`use…Store`) ou fichier écrit, **qui d'autre le lit et
  l'écrit ?** (le motif récurrent « plusieurs écrivains pour une même donnée » — skill
  `auditer-un-parcours`).
- **Les risques propres à GM-OS**, à cocher un par un :
  - fenêtres multiples : le hub et le projecteur n'écrivent pas les magasins du meneur
    (garde `ecritureReserveeAuMJ`) ;
  - chemin de données : jamais `app.getPath('userData')` à l'évaluation d'un module importé par
    `main.ts` ;
  - tablettes : en `npm run dev`, une tablette rechargée par Vite perd tout état en mémoire ;
  - les deux ports (`port` = Vite, `mediaPort` = SyncServer) ;
  - textes affichés : clés i18n réellement présentes ; tailles dans les deux régimes
    (atelier / table) ;
  - Échap et surcouches : passer par le registre unique des surcouches.
- **Un écran neuf ou une section neuve** : prompt **Stitch** d'abord, depuis le code, captures
  Playwright de départ (consigne de David du 02/11). Le plan cite le prompt ; on ne code pas
  l'interface avant que David ait choisi le dessin.
- **Les essais prévus** : `npx vitest run --maxWorkers=4 <fichiers>`, `npx tsc -b`, un e2e si
  le parcours traverse des fenêtres.

## 4 · Les tâches

Liste numérotée `T1`, `T2`…, dans l'ordre d'exécution, chacune petite (une séance au plus) :

```
- [ ] T3 · Le lecteur des durées accepte les heures nommées — `src/…/duree.ts`
      couvre C2 · essai : `duree.test.ts` (nouveau cas) · touche src/ ⛔
```

Chaque tâche dit **quel critère elle couvre**, **son essai**, et si elle touche `src/` ou
`electron/` (⛔ : « GM-OS tourne-t-il ? » avant). Les tâches qui ne se vérifient qu'à l'écran
finissent par **« à essayer par David »**.

## 5 · Analyser — la relecture croisée

Avant de proposer de coder, relire ensemble le quoi, les décisions, le plan et les tâches :

1. Chaque critère `C…` est couvert par au moins une tâche **et** un essai (ou marqué « à
   l'écran par David »).
2. Aucune tâche sans critère : sinon, c'est du hors champ glissé — la retirer ou ajouter le
   critère avec David.
3. Aucune contradiction avec une décision de David (passation § 5, registre) ni avec AGENTS.md.
4. Aucun `[À TRANCHER]` de périmètre restant.
5. `git status` : aucun fichier du plan n'est en cours chez l'autre agent (un seul écrivain
   par fichier). Sinon, le dire et attendre.

Rendre à David **la liste des écarts trouvés** (ou « aucun écart ») et le résumé : nombre de
critères, de tâches, ce qui touche `src/`, ce qu'il devra essayer lui-même.

## 6 · Inscrire au registre

Une section numérotée et une ligne en tête de la vue d'un coup d'œil, selon les conventions du
skill `clore-la-session` (§ 2), état **« spécifié, pas commencé »**, premier geste = `T1`. Un
défaut trouvé en chemin, hors du chantier, va au § 1 bis.

## 7 · Réaliser — seulement sur le feu vert de David

- ⛔ « **GM-OS tourne-t-il ?** » avant la première tâche qui touche `src/` ou `electron/`, et
  attendre la réponse (« fermé » vaut jusqu'au prochain essai de David).
- Une tâche à la fois, avec son essai ; cocher `[x]` dans le document **après** vérification,
  avec la commande lancée. Une tâche qui révèle une question nouvelle : s'arrêter, la poser,
  la reporter dans **Décisions**.
- ⛔ Aucune commande git qui écrit sans demande ; pas de branche.
- Fini quand chaque critère est vérifié ou explicitement « à essayer par David » — puis skill
  `clore-la-session`.

## Gabarit du document

```markdown
# <Sujet> — spécification, JJ/MM/AAAA

> Demande de David (JJ/MM) : « … »
> État : spécifié | en cours (T…) | livré, à essayer par David | clos — registre § <n>

## Le quoi
### Parcours
1. …
### Critères d'acceptation
- C1 · … — essai | à l'écran par David
### Hors champ
- …
### Ce que David garde
- …

## Décisions
- JJ/MM — David : « … » → conséquence.
- [À TRANCHER] …

## Le comment
### Fichiers et réutilisation
### Données : qui lit, qui écrit
### Risques GM-OS (cochés)
### Écran : prompt Stitch
### Essais

## Tâches
- [ ] T1 · … — couvre C… · essai : … · touche src/ ⛔

## Analyse
- JJ/MM — écarts trouvés : …
```
