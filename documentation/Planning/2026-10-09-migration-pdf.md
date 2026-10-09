# Migration PDF — lot 39 — 09/10/2026

David demande « commit et passe à l'étape suivante (GM-OS est éteint) ».
Les huit fichiers Codex du lot 38 sont commités sous **`4e080992`**.
Dernier poussé **`916a3842`**, deux commits locaux d'avance. Aucun push.

## Défaut corrigé

Les lecteurs utilisaient le contrat de **pdf-parse v1**, alors que la dépendance
installée est **2.4.5**. Son export CommonJS est un objet contenant `PDFParse`,
pas une fonction d'extraction. L'import de sources refusait le parseur ;
l'index RAG ne retenait pas le texte des PDF ; le handler `ai:extract-pdf`
revenait en erreur. Constat initial : § 1 bis du registre et
[lot 24](2026-10-09-lint-ia-et-fournisseurs.md).

Le nouveau lecteur partagé [extractionPdf.ts](../../electron/extractionPdf.ts)
charge le constructeur CommonJS, crée un parseur par document, appelle
`getText({ pageJoiner: '' })` et **attend `destroy()` dans un `finally`**.
Les marqueurs de pagination ajoutés par défaut en v2 ne polluent pas le corpus.
Le type vient de la dépendance installée ; la forme de l'export est gardée
à la frontière CommonJS. Aucune nouvelle dépendance ou configuration de worker.

Les trois chemins sont raccordés : [lectureDeSource.ts](../../electron/lectureDeSource.ts),
index et IPC dans [RAGEngine.ts](../../electron/RAGEngine.ts). Replis en cas de
parseur indisponible, document invalide ou fichier absent conservés.
Les protections des chemins et du corpus restent en place ; l'indexation
des fichiers texte fonctionne aussi quand le parseur PDF est indisponible.

La dernière annotation `any` de `lectureDeSource.ts` et ses deux directives
de lint sont retirées. Comptage syntaxique des TS/TSX suivis et nouveaux non
ignorés : **zéro annotation explicite dans `src/`, `electron/` et `e2e/`**.
Cette réparation fonctionnelle est séparée de la clôture des 540 avertissements.

## Contrôles

- **Construction `npm run build` avec `tsc -b` réussie.** Le bundle Electron
  garde le chargement CommonJS externe et le `destroy()` attendu.
- **Lint global : 1 590 fichiers, zéro erreur, zéro avertissement.**
- **179 tests passent dans huit fichiers**, avec `--maxWorkers=4` : extraction,
  sources, index/IPC PDF, exclusions RAG, sélection, index des livres,
  périmètre d'instance et déclaration/exposition des ponts.
- **16 nouveaux cas** : deux pages, page vide, PDF invalide/absent, extension
  majuscule, destruction après succès/erreur et attente de sa fin ;
  extraction IPC, confinement du corpus, parseur indisponible, indexation
  effective et exclusion par `.ragignore`.
- **Electron en mode Node 20.19.1** lit aussi les deux pages du PDF artificiel,
  rend la page vide et rejette le document invalide. Script compilé à partir
  du lecteur et de la fixture, supprimé après le contrôle. GM-OS n'est pas lancé.
- `git diff --check` propre ; empreintes des **21 fichiers étrangers** inchangées.
  Aucun paquet installé, service réseau démarré ou document réel de David lu.

Les fixtures sont des PDF ASCII minimaux fabriqués par le test. Elles vérifient
l'API et les chemins de l'application ; elles ne couvrent pas toutes les mises
en page de manuels réels. Pas d'OCR ajouté : un PDF sans couche texte reste vide.
Pas de nouvelle suite Vitest complète ni d'e2e. Dernière suite complète :
pré-push de `916a3842`, 7 198 tests réussis dans 566 fichiers,
un fichier et quatre tests ignorés.

## Reprise

**Douze fichiers Codex non commités** : sept fichiers de code/tests/fixture,
cinq documents. Dernier local **`4e080992`**, dernier poussé **`916a3842`**.
Le lot PDF est prêt pour une demande de commit. Le lint et le retrait des
annotations explicites `any` sont terminés ; pas de nouvel avertissement.

Le cadrage de la capture du dernier jet reste au § 1 bis, chantier distinct.
Préserver les guides, le lanceur e2e, la note du 07/10 et `.claude` étrangers.
Ne pas repayer le piège v1/v2 : utiliser le lecteur partagé, pas un appel
direct au résultat de `require('pdf-parse')`. Les tests de sélection RAG
emploient `query`, pas `question`.
