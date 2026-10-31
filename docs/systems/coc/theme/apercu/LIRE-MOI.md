# Planches du thème COC

Les images `theme-coc-bureau.png` (1440 px de large) et `theme-coc-mobile.png` (390 px)
sont des **planches de démonstration hors ligne**, pas des captures de GM-OS. Elles reprennent
les jetons du thème, les matières et les SVG livrés, sans modifier la mise en page de l’application.
Les polices sont les replis système Arial et Courier New ; le chargement distant d’Exo 2 et
Source Sans 3 n’a pas été essayé par ces planches.

## Contrôles du 31/10/2026

- `npm.cmd run theme:valider -- coc` : **accepté, zéro erreur, zéro avertissement**.
  Le premier contrôle rapprochait les couleurs Réussite et Information ; l’Information a été
  passée à un bleu distinct puis le thème revalidé. Rapports `validation.md` et `validation.json`.
- Texte principal : **12,81** sur le fond et **15,12** sur les panneaux ; au pire point des
  matières : **11,14** et **13,11**. Texte secondaire : au moins **4,77** sur les matières.
  Accent : **7,74** sur le fond, **6,73** sous matière ; texte sur accent : **9,13**.
  Cadre : texte **12,63**, accent orange **8,09**. Valeurs du validateur réel, non recalculées.
- `npx.cmd vitest run electron/contratDuTheme.test.ts electron/validationDesThemes.test.ts
  --maxWorkers=4` : **79 tests réussis**, rapport `tests-contrat.json`.
- Vingt SVG décodés dans Edge : deux matières, trois ornements, quinze icônes. Aucune erreur
  JavaScript ; réseau bloqué. Planche sans débordement horizontal aux deux largeurs.
- Deux images examinées : titres et textes lisibles, icônes distinguables à 16 px ; coin à
  28 px contenu en marge, séparateur à 240 × 16 px et fond à 40 % / 15 % d’opacité.

Le rendu PDF des trois pages fournies a servi à l’analyse puis ses images temporaires ont été
retirées ; aucune page de livre ni illustration source n’est livrée avec le thème. Les messages
Poppler sur les polices de substitution Symbol/ArialUnicode n’ont pas empêché l’examen des pages.

## Refaire les planches

Depuis la racine du dépôt :

```text
node docs/systems/coc/theme/apercu/rendre-apercu.mjs
```

Utilise les dépendances déjà installées et Edge. Ce script ne démarre aucun serveur ni GM-OS,
ne charge pas de police distante et remet `capturesExaminees` à `false` : toute nouvelle image
doit être regardée. L’application du thème dans une campagne, avec les personnalités activées,
reste l’essai de David. Le contenu de ce dossier `apercu/` est ignoré par GM-OS.
