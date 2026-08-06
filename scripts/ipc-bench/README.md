# Banc de mesure — surcoût du saut IPC

Harnais autonome (hors application) posé pour le chantier d'unification du transport.
Il compare, sur un aller-retour entre deux fenêtres de rendu :

- **BroadcastChannel** — le transport actuel (`src/services/CrossWindowEventService.ts`) ;
- **via le process principal** — le transport proposé (`renderer → main → renderer`).

Les `webPreferences` reproduisent celles de `electron/main.ts` (`sandbox: false`,
`webSecurity: true`, preload), et les deux fenêtres partagent la même origine, comme la
fenêtre MJ et le Player Hub.

## Lancer

```sh
# ELECTRON_RUN_AS_NODE traîne dans l'environnement de l'hôte VS Code et ferait
# démarrer Electron en simple Node — il faut le retirer.
unset ELECTRON_RUN_AS_NODE

cd scripts/ipc-bench

# Phase 1 — matrice transport × taille de payload
../../node_modules/electron/dist/electron.exe .

# Phase 2 — le coût suit-il les octets ou le nombre d'objets ?
BENCH_WINDOW=window2.html BENCH_OUT=results2 ../../node_modules/electron/dist/electron.exe .
```

Chaque phase écrit `results*.json` et `results*.txt` dans ce dossier — sorties brutes,
non versionnées (`.gitignore` exclut `*.txt`), régénérables. Le relevé de référence du
2026-08-06 (Electron 34.5.8) est conservé dans `releve-2026-08-06.md`.

## Méthode

- Les transports **alternent à chaque itération** plutôt que d'être mesurés l'un après
  l'autre : ils subissent ainsi exactement les mêmes conditions machine au même instant.
- 20 à 30 itérations de chauffe écartées.
- Deux régimes : rafale (sans délai, pire cas de file d'attente) et cadence réelle
  (33 ms pour la carte, 50 ms pour le tableau blanc).
- Les valeurs sont des **allers-retours** (2 sauts). Le sens unique vaut environ la moitié.
- Les payloads sont calqués sur ce que `CrossWindowEventService` diffuse réellement —
  le tableau `projectedTokens` complet pour la carte, et **tout** le tableau `paths`
  pour le tableau blanc.

Le résultat et son interprétation sont consignés dans
`documentation/Planning/2026-08-05-architecture-review-hardening.md`.
