# G0 — témoin avant remplacement du moteur

Le 07/10/2026, sur `feature/tablet-hub-pwa`, tête `cc736062`. Campagne fictive
`e2e/donnees/campagne-temoin.json`, construction du code courant avant G1.

- Construction et typage réussis.
- **14 scénarios historiques réussis**, en 2 min 36 ; **45 tests** du calcul et
  du rangement réussis.
- Cinq captures : chaîne, constat isolé, filtre vide, branches/condition,
  réouverture figée. La capture des branches montre aussi un cadrage ancien
  insuffisant après ajout de scènes : elle est un témoin, pas une maquette.
- `restauration.json` caractérise le défaut initial : l'instantané enregistré
  est conservé dans la campagne, mais sa position n'est pas dessinée après
  réouverture dans un nouveau renderer sur le même profil fictif. Interception
  des appels `arc` des scènes, pas comparaison subjective d'images.

Les coordonnées artificielles `9876,5432` isolent l'instantané sans épingle.
Le nouveau rendu est ensuite vérifié avec fermeture et **nouveau processus**
dans `e2e/cartesDeTrame.spec.ts`, ainsi qu'avec le passage campagne A → B → A.

Le banc `referenceTrameG0.spec.ts` est une archive du moteur antérieur : il ne
s'exécute que si `GMOS_TRAME_G0=1`. Ne pas le rejouer sur React Flow pour juger
le nouveau rendu. Les fichiers de semence existants n'ont pas été modifiés.

Sous le sandbox Windows, un démarrage n'a ouvert aucune fenêtre et un nettoyage
a rencontré un verrou temporaire. Le passage hors sandbox a réussi. Les bancs
nouveaux attendent la libération des verrous lors du nettoyage du profil fictif ;
le lanceur partagé, déjà modifié avant la session, n'a pas été édité.
