# État et reprise — NOC, 25/10/2026

David demande de finir les améliorations NOC et fournit le livre de base. Il confirme GM-OS fermé
et Claude terminé, en demandant de conserver Dune. Branche `production` ; les commits Dune
`48b8691e` et `c1f5c70b` sont présents et conservés. David demande ensuite le commit local NOC.

Lire le [bilan](2026-10-25-noc-finir.md), le registre § 177 et la synthèse des pilotes, section NOC.
Les neuf points sont verts : **David confirme « ok tout fonctionne » le 25/10/2026**.
Réalisation commitée dans `bf83cbf6` ; aucun reste sur ces lots.

Export livré et validé : `Export Dirvers/corriges/NOC_driver_gmos_2.0.0.gmos-driver`.
Sources : `scripts/exporter-noc.mjs`, `outils/noc/convertir-pistes.mjs` (idempotent),
`outils/noc/verifier-fiche.mjs`, `outils/noc/verifier-pilote.mjs`.

Moteur 18 : les pistes numériques NOC gardent les anciennes clés via `legacySeries` ; les autres
modèles, y compris Dune, sont comparés à HEAD et restent identiques. Ne pas retirer les champs
`legacy` ni leurs absences motivées : les anciennes sauvegardes s'en servent encore.
Le nom des deux fichiers HTML NOC et leurs identifiants restent inchangés.

Le vrai Hub est essayé avec un navigateur neuf et le serveur jetable. Comme le renderer garde
le port standard pour le serveur de fiches, le test le redirige vers le port jetable ; ne pas
contourner cela en visant une instance réelle. Aucun profil de David n'est utilisé.

Traces et captures : `tmp/noc-fin/`. Recette Electron et Hub réussie (360/768/1180 px,
écritures de Cabale et piste PJ reçues par le meneur) ; 17 captures dans le manuel. Types, lint,
9 150 tests réussis ; quatre ignorés. Construction de production réussie, `npm run validate` terminé.
Les deux modifications préexistantes de documentation (prompts Stitch et guide tablette 62)
restent à part. Réalisation `bf83cbf6` ; push demandé ensuite par David, avec la validation.
