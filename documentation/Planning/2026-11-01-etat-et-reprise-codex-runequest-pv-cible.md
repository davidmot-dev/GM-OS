# Reprise Codex — RuneQuest, PV de la cible — 01/11/2026

> **Suivi du 01/11 :** RQ-A2 validé par David ; RQ-A1 livré en 2.1.0/320 champs, 78 cas. Le texte ci-dessous conserve son état de livraison initial ; [reprise courante](2026-11-01-etat-et-reprise-codex-runequest-recette-210.md).

David valide le travail précédent : « ok c'est essayé c'est bon... J'ai fait tout les autres tests en attentes aussi. On passe au point 2 affichage des PV ». Puis : « GM-OS est fermé, tu peux corriger ».

## Produit

**RQ-A2 livré, nouvel essai de David attendu**, registre § 201. Dans RuneQuestAuJet, la
localisation au D20 et son journal ne reprennent plus les PV du lanceur. Au meneur, la ligne
de cible affiche le nom du combattant, la zone et ses **PV maximum sur la fiche** ; les PV
restants se consultent dans Combat-OS. Changer de cible ou actualiser sa fiche met cette
ligne à jour sans relancer le D20. Valeurs absentes, vides ou invalides annoncées inconnues ;
zéro explicite conservé. Aucun repli sur le lanceur. La tablette n'affiche pas ces détails.

Le calcul des dégâts localisés passe toujours par la même porte. L'application corrige
l'affichage ; aucun pilote à réimporter pour RQ-A2. La recette 2.0.0 demeure inchangée :
sa mise à niveau 2.1.0 est le lot séparé **RQ-A1**.

## Vérifications

- Régression avant correction : **7 tests verts / 9 rouges** sur le panneau.
- Après : **89 tests ciblés passent** (59 règle, 14 coups localisés, 16 panneau).
- Panneau rejoué après retrait de sa propriété devenue inutile et manuel contrôlé :
  **42 tests passent** (16 panneau déjà comptés, 26 contrat du manuel).
- ESLint ciblé sans erreur ; **npm run build**, incluant **tsc -b**, réussi.
- **Un essai Electron RuneQuest passe** (23,9 s, 27,4 s au total) : cible Broo 7 PV,
  Guerrier 3 PV, localisation inchangée au changement de cible, absence de sélection
  explicite. Le parcours joue aussi fiche HTML et coup localisé sur la carte.
- Capture des suites examinée puis copiée dans le manuel ; autres captures conservées
  seulement sous output/verification-runequest-pv-cible/captures/.
- Manuels 53/54, synthèse, indicateurs et registre actualisés. Preuves et empreintes :
  [rapport](../../output/verification-runequest-pv-cible/RAPPORT.md),
  [JSON](../../output/verification-runequest-pv-cible/verification.json).

L'export 2.1.0 mentionné par le manuel n'est plus présent dans Export Dirvers. Pour cet
essai uniquement, le générateur existant a reconstruit **un pilote 2.1.0 de 320 champs**
depuis le pilote 2.0.0 conservé dans output/campagnes-tests/runequest/, sous
tmp/rq-pv-cible/pilotes/. Ce n'est ni une preuve d'import des trois campagnes en 2.1.0,
ni une nouvelle livraison de leurs archives. Le premier appel Python restreint a échoué ;
py hors bac à sable a réussi. Aucun paquet installé.

## Validation et prochain geste

NP-C1/GM-05 est **coché et vert**, conformément à l'essai confirmé par David. Sa validation
globale clôt les essais des fonctions déjà livrées des quatre pilotes dans la synthèse ;
aucun détail par cas, résultat CSV ou essai matériel n'est inventé. Les rapports historiques
de recette gardent leurs constats avant correction. Les propositions non développées restent
rouges et non cochées. Les notes précédentes portent un renvoi daté vers cet état.

David peut essayer le nouvel affichage : localiser un coup, choisir deux combattants dont
les PV de zone diffèrent, puis une cible sans valeur ; contrôler les maxima affichés et
l'absence de modification du lanceur. **RQ-A2 reste vide et orange jusqu'à sa validation.**
Ensuite reprendre RQ-A1 sur demande, sans l'absorber dans cette correction.

## Isolement et état du dépôt

Instance Electron via lancerGmOs, profils/USERPROFILE/corpus/coffre/sauvegardes/ports jetables,
appareils désactivés ; essais isolés et relance hors bac à sable déjà autorisés dans la
conversation. Aucun accès aux campagnes ou sauvegardes personnelles. Captures envoyées hors
documentation, puis une seule image choisie copiée après examen ; aucune suite globale lancée.

Fichiers de ce lot : RuneQuestAuJet.tsx, appel dans PanneauDeJet.tsx, tests du panneau,
e2e/capturesDesJeux.spec.ts, manuels 53/54 et capture des suites, suivi et preuves.
Les modifications GM-05/analyse précédentes restent présentes. **Non commité, non poussé** :
David n'a pas demandé de Git d'écriture pour ces lots. Ne pas toucher aux exports,
références, traces et fichiers temporaires des autres chantiers.
