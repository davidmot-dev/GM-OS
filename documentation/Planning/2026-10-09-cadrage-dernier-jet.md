# Cadrage du dernier jet — lot 40 — 09/10/2026

David demande « fais le 3 » : corriger le cadrage de la capture du dernier jet
du manuel, après publication du lot PDF et des deux commits locaux précédents.
Dernier local et poussé : **`1aefeb99`**. Pré-push réussi : types, lint global
sans diagnostic, **7 222 tests dans 568 fichiers** (un fichier et quatre tests
ignorés), construction. La branche est synchronisée.

## Correction

Le rectangle fixe de `capturesDuManuel.spec.ts`, à `230, 208, 880, 206`,
coupait le bas du panneau. La capture vise désormais **le panneau DOM entier**,
repéré par `data-panneau="2"` et son titre « Dernier jet ». Sa taille réelle
détermine le cadrage, sans coordonnées liées au placement du module.

Le scénario lance lui-même le jet rapide « Attaque Épée Longue », vérifie
la formule `1d20+7`, ferme les surcouches et attend le bouton « Projeter ».
Il peut être lancé seul, sans dépendre du scénario `dice-un-jet`.
Les options JPEG (qualité 82), échelle CSS et animations désactivées restent.

**Correction du diagnostic initial :** le fragment du bas n'était pas un
ancien résultat. Le `14` sous le total `21` de l'ancienne image est le dé
courant, avant le bonus de sept. C'est le détail du jet actuel qui était coupé,
avec son libellé `d20` et le bord inférieur du panneau.

## Image et contrôles

La nouvelle image **883 × 238 px** a été relue : titre, formule, total,
dé courant, libellé `d20`, bouton de projection et contour complet visibles ;
aucun historique inclus. Capture produite dans
`e2e-resultats/cadrage-dernier-jet-lot40/dice-dernier-jet.jpg`, puis copiée
à l'identique vers [l'image du guide](../User%20Guides/captures/dice-dernier-jet.jpg).
Le [guide de projection](../User%20Guides/35-Projeter-un-jet.md) la référence
déjà ; son texte est conservé.

- **Construction `npm run build` réussie**, puis `npx tsc -b` propre.
- Lint ciblé et global propres : **1 590 fichiers, zéro erreur, zéro avertissement**.
- **52 tests des protections passent** : périmètre d'instance et sauvegarde.
- **Un scénario Electron passe seul**, en 18,7 s :
  `npx playwright test e2e/capturesDuManuel.spec.ts --grep "le dernier jet de dés" --timeout=90000 --reporter=list`.
- `GMOS_SORTIE_CAPTURES_MANUEL` vise le dossier de contrôle ignoré. Seule
  l'image du dernier jet est remplacée dans les captures suivies.
- `git diff --check` propre ; empreintes des **21 fichiers étrangers** inchangées.

Profil temporaire, sauvegardes/corpus/coffre forcés sous ce profil,
matériel désactivé et contrôle de l'isolation avant les gestes.
Le lanceur étranger est utilisé tel quel. Aucune modification de `src/`
ou `electron/`, aucune lecture des données personnelles, aucun paquet installé.
Le premier filtre shell mal cité n'avait trouvé aucun test ; le filtre
passé directement à PowerShell a lancé uniquement le scénario demandé.
La suite des 79 captures n'est pas rejouée ; aucune autre image remplacée.

## Reprise

**Six fichiers Codex non commités** : scénario, image JPEG et quatre documents.
Dernier local et poussé **`1aefeb99`**. La correction est terminée, prête pour
commit sur demande. Préserver les guides, le lanceur e2e, la note du 07/10
et `.claude` étrangers. L'essai PDF représentatif dans l'interface reste
une validation distincte, pas une correction encore connue.

## Validation de David et clôture — 09/10

David confirme : **« j'ai fait l'import d'un PDF c'est bon. Commite et pousse
ce qu'il reste »**. L'import PDF est donc éprouvé dans l'interface.
Les six fichiers de ce lot sont réunis dans le commit contenant cette note,
avec push autorisé sur la branche existante `feature/tablet-hub-pwa`.
Les modifications étrangères sont exclues. La validation complète du hook
pré-push est conservée. Trame, lint, migration PDF et cadrage sont terminés ;
les essais en séance et sur le matériel restent distincts.
