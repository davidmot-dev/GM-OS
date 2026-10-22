# Reprise — audit Symbaroum, 20 octobre 2026

David a demandé de vérifier les améliorations possibles du pilote Symbaroum à l'aide du
livre de base et de NotebookLM. Le lecteur Z: étant inaccessible, il a fourni le chemin
`\\CLOUDDAVID\Media\Jeux de Rôle\01. Passé\2. Dark Fantasy\Symbaroum\Symbaroum - Livre de Base.pdf`,
accessible en lecture. Le livre a été copié dans `scratch/symbaroum-audit/` pour extraction.

Résultat : [audit et propositions S0–S9](2026-10-20-symbaroum-propositions.md).
**Aucune mise en œuvre demandée ou lancée.** Les priorités restent proposées, sans décision
de planification de David.

## État vérifié

- Base : `712f70c1`, intégration par Claude Code de la fiche `symbaroum-fr`, du corpus et de
  la correspondance au moteur embarqué v14. Ne pas refaire ce raccord HTML déjà réalisé.
- Export corrigé `Export Dirvers/corriges/Symbaroum_driver_gmos_relie.gmos-driver` :
  `state.json` identique au JSON voisin, 10 sections, 139 champs, contrôle structurel sans constat.
- Fiche : 2 pages, 182 zones, 158 clés ; `npm.cmd run fiche:valider -- symbaroum` accepté,
  0 erreur, 0 avertissement. Ses clés restent le contrat.
- Reproduction du défaut de jet : Précision 12, malus −3, dé 10 → réussite sous 12 au lieu
  d'échec sous 9. `jet.difficulte` compte des réussites, pas un modificateur de seuil.
- Raccord de santé manquant : aucun `isMainHP`, helper de santé renvoyant `null` pour une
  fiche fictive à 5/14 ; une déclaration du champ principal en mémoire suffit à lire 5/14.
- Avantage générique = deux dés ; Avantage Symbaroum = +2 au seuil et +1D4 dégâts.
- Corpus : 13 fichiers `relu: false`, écarts vérifiés sur douleur, mort, cécité, asymétrie,
  Corruption et conflits entre PJ. Les corrections n'ont pas été appliquées.

## Sources et reprise

NotebookLM existant `5a4f05a6-8bcd-40d2-a77b-90d8c2bb12dd`, interrogé deux fois en limitant
à la source du livre de base `3239d73f-c759-4b84-b85c-c9606ec064b6`. Ne pas mêler les
suppléments pour prétendre décrire les règles de base. Les réponses ont des erreurs :
le livre p. 164 laisse **toujours le choix au joueur** après un coup douloureux.

Preuves locales : `scratch/symbaroum-audit/constats.json`, script `verifier.mjs`, extraction
`pages.json`, réponses `notebook-*.json` et huit rendus PNG. Pages imprimées +2 = page PDF
pour les références du rapport. Pour reproduire :

```powershell
node scratch/symbaroum-audit/verifier.mjs
npm.cmd run fiche:valider -- symbaroum
```

Les helpers de résolution/santé ont été exécutés sans interface et sans campagne. Le script
adapte la résolution des imports TS/JSON au Node local ; il ne remplace pas un essai dans
l'application. Aucune compilation ou suite globale n'était nécessaire pour ces nouveaux
documents.

Reprendre par les choix de David puis S0/S1/S2. Pour l'agonie, distinguer le raccord de jauge
déjà faisable en JSON de la procédure complète à développer. Le calculateur de fiche accepte
`max` et `ceil`, mais le lecteur arithmétique de `santeDeDepart` ne les accepte pas. La
Corruption du livre comporte une ambiguïté rédactionnelle : tableau 25 et p. 180 donnent
l'abomination à Volonté **atteinte** ; ne pas prendre deux fois le seuil arrondi quand la
Volonté est impaire. Les réentrées au seuil en scène demandent une convention documentée.

## Fichiers et précautions

Deux nouveaux documents de Planning, non commités. Scripts et preuves dans `scratch/`
(ignoré par Git). Aucun fichier `src/`, `electron/`, pilote, corpus ou fiche modifié.
Ni installation, ni service réseau, ni écriture Git, ni accès aux données personnelles.

Le registre `2026-08-23-chantiers-gares.md` était déjà modifié par un autre travail et a été
laissé intact pour respecter « un seul écrivain par fichier ». Reporter l'audit dans le
registre lors de sa prochaine mise à jour coordonnée ; les propositions sont ancrées ici.
Les autres changements visibles avant cet audit ont également été laissés intacts.

Avant toute modification de `src/` ou `electron/`, demander **« GM-OS tourne-t-il ? »** et
attendre la réponse de David. Après implémentation, mettre à jour le manuel des jeux et les
captures, conformément à la passation.
