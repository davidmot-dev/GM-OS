# Thème Degenesis — 30/10/2026, GM-OS Studio / Codex

## Ce que la session a produit

David : « fais le thème de Degenesis, les différents fichiers de référence sont ici C:\Projet_David\GM-OS-v5\docs\systems\degenesis\Degenesis Reference ».

- Dossier livré : [`docs/systems/degenesis/theme/`](../../docs/systems/degenesis/theme/), contrat GM-OS **v1.7**. `theme.css`, `intention.md`, deux matières SVG, trois ornements (`coin`, `separateur`, `fond`), quinze icônes originales et leurs manifestes.
- Sept PNG Katharsys examinés : suffixes 1, 7, 10, 11, 20, 23, 35. Palette de papier de cendre, encre noire, oxyde et cadre noir mat ; contours droits, grain léger, sans halo. Barlow Semi Condensed / Crimson Pro sont des approximations typographiques, Courier New la première famille monospace système.
- **Validé** : `npm.cmd run theme:valider -- degenesis`, accepté **0 erreur / 0 avertissement** ; rapports Markdown et JSON sous `theme/apercu/`. Les couleurs d’état ont été éloignées entre elles et de l’oxyde selon les avertissements réels du validateur. Tous les contrastes atteignent les valeurs recommandées, y compris sous matière : texte **10,45:1**, secondaire **4,62:1**, accent **5,10:1** au pire point du fond texturé.
- **103 essais réussis** : `npx.cmd vitest run electron/themesDesJeux.test.ts electron/validationDesThemes.test.ts --maxWorkers=4`. Pas de nouvelle suite de tests créée pour ce thème de données.
- [`theme/apercu/theme-degenesis.png`](../../docs/systems/degenesis/theme/apercu/theme-degenesis.png), **1440 × 1050**, examiné après rendu Chrome hors ligne : icônes 24/16 px, coin 28 px, séparateur 240 × 16 et fond à 15 %. Maquette de contrôle, **pas une capture GM-OS** ; fontes système de repli clairement indiquées. Script de reproduction `apercu/construire-apercu.mjs` sans serveur.
- **À la livraison, avant demande de commit : 29 nouveaux fichiers non commités** : 28 sous le dossier du thème et cette note. Aucun `src/` ou `electron/` modifié, aucune modification de référence ou de donnée personnelle ; GM-OS et ses services n’ont pas été lancés. David a ensuite demandé **« commit et pousse »** : commit du seul thème, séparé de la fiche et de la bannière/identité ; les autres chantiers sont exclus.

## Par quoi reprendre

1. Dans le pilote ou la campagne Degenesis, vérifier le chemin des règles `degenesis`, activer le thème et les personnalités, puis rouvrir la campagne pour relire les jetons. Observer cadre, texte, icônes et ornements à l’écran. **Cette activation et l’essai par David restent à faire.**
2. Si une capture appelle une correction, la classer selon le contrat puis reprendre l’atelier thème ; ne pas modifier la fiche de personnage pour l’accorder au thème.
3. Pour régénérer la planche : `node docs/systems/degenesis/theme/apercu/construire-apercu.mjs`. Pour revalider : `npm.cmd run theme:valider -- degenesis` ; si le thème change, remplacer aussi les rapports et examiner le nouveau rendu.
4. Le registre des chantiers était déjà modifié par l’autre agent : **pas d’écriture concurrente**. Fragment prêt ci-dessous. La synthèse des pilotes ne contient pas encore Degenesis ; ce travail ne crée ni ne modifie un pilote, et n’annonce pas son intégration applicative.

## Fragment de registre pour son écrivain

Lire les numéros actuels avant insertion ; le dernier observé était § 187, ligne de synthèse 123.

> David : « fais le thème de Degenesis », depuis les références Katharsys fournies.
>
> - Thème v1.7 livré dans `docs/systems/degenesis/theme/` : papier de cendre, cadre noir mat et oxyde ; deux matières, trois ornements, quinze icônes, intention et limites.
> - Vérifié : validateur 0/0, 103 essais des thèmes, aperçu hors ligne examiné ; texte 10,45:1 sous texture, polices système de repli explicitement indiquées dans la planche.
> - Reste : activation du thème et des personnalités dans la campagne, observation dans GM-OS et jugement de David. Aucun essai applicatif annoncé ; pas de changement de pilote ou de fiche.
> - Reprise : `2026-10-30-etat-et-reprise-codex-theme-degenesis.md`.

## Ce qu’il ne faut pas repayer

- Un SVG de matière sans largeur/hauteur intrinsèques peut être étiré par le navigateur et transformer une petite éraflure en large trait. Dimensions fixes **160 × 160** et **192 × 192** pour les deux matières ; leurs `viewBox` correspondent. Vérifié sur le second aperçu.
- Les cinq couleurs fonctionnelles doivent rester distinctes dans le validateur : les premiers choix trop proches ont produit trois avertissements, éliminés sans dégrader les contrastes. Les SVG dessinent en `currentColor` ; sur les matières en fond, il vaut noir.
- Conserver les trois emplacements d’ornements et les noms d’icônes du contrat. Aucun symbole officiel ou logotype repris comme asset nécessaire au thème.
- Première police monospace : une famille système reconnue, ici Courier New. Ne pas réintroduire le blocage de Consolas en première position rencontré au push RuneQuest.
- Un aperçu thématique ne prouve ni le chargement des polices web ni l’intégration dans GM-OS. Aucun lancement de la vitrine générale, qui lit une sauvegarde du meneur ; une éventuelle recette future doit utiliser uniquement des données jetables autorisées.
