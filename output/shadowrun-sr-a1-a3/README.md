# Shadowrun Anarchy 2.1.0 — SR-A1/A2/A3

Importer [`Export Dirvers/corriges/Shadowrun-Anarchy-2.1.0.gmos-driver`](../../Export%20Dirvers/corriges/Shadowrun-Anarchy-2.1.0.gmos-driver) avec **Remplacer**.
Le fichier sous `pilote/` est la copie de recette ; son empreinte SHA-256 est identique.
L’export de départ et les données de David n’ont pas été modifiés.

Suivi et trois gestes d’essai :
[`documentation/Planning/2026-11-04-shadowrun-sr-a1-a3.md`](../../documentation/Planning/2026-11-04-shadowrun-sr-a1-a3.md).

- `verification-electron.json` : parcours fonctionnel passé sur profil jetable.
- `jeu-shadowrun-drain.jpg`, `jeu-shadowrun-matrice.jpg` : deux captures métier relues.
- `captures-manuel/` et `planche-captures.jpg` : huit captures du manuel, toutes relues.
- `vitest-complet.log` : 9 803 tests passés, 4 ignorés ; bilan Vitest vert. L’en-tête
  PowerShell transforme des avertissements sur stderr en NativeCommandError, sans test échoué.
- `vitest-cible-final.log` : bilan ciblé final (73 tests / sept fichiers).
- `build-final.log` : construction réussie ; `lint-final.log` : zéro erreur, un avertissement
  préexistant hors sujet.

Les deux parcours applicatifs finaux passent : capture du manuel et SR-A1/A2/A3 (47,4 s).
Le test de générateur vérifie zéro constat Forge, identifiants/champs conservés et référence
absente détectée. David valide SR-A1/A2/A3 le 04/11/2026 : « ok c'est bon, c'est testé ».
