# Reprise Codex — campagnes Shadowrun Anarchy, 01/11/2026

## Produit

Trois archives et ZIP dans `output/campagnes-tests/shadowrun-anarchy/`, **22 nouveaux PJ**
pour les trois joueurs autorisés, **64 cas humains**, médias, guide et reproduction.
Pilote `custom-1793480750141` 2.0.0, gabarit `tpl-1793480750142`, 125 champs.
Mission originale **La Dernière Couleur**, laboratoire de moniteur et laboratoire de risques.
[Détail et empreinte](2026-11-01-campagne-recette-shadowrun-anarchy.md), registre § 198.

72 tests ciblés passent, plugin structurel 3/3 ; 29 images et trois WAV décodés hors ligne,
neuf rendus et quatre captures applicatives examinés. Build/types et lint ciblé passent.
Imports 01/02/03, remplacement isolé, anciens avatars/PJ sentinelles conservés, trois Hub,
jets, Anarchy −1, fiches HTML et Logique 3/4/5 persistante : vérifiés.
**ÉCHEC GM-05 conservé**, douze chemins de secrets fictifs de séance reçus par les Hub.
Le rapport Electron distingue les fonctions abouties de son résultat global en échec.

## Premier geste

David importe **01-La-Derniere-Couleur.gmos**, puis suit le cahier et son CSV vierge.
Le pilote réel et le moteur HTML 23 sont des dépendances à vérifier. Réinitialiser seulement
le laboratoire voulu avec Remplacer. Partie complète, matériel, GM-06 et les 64 cas restent
à jouer ; ne pas prévalider les résultats humains.

## Pièges et périmètre

- Pas de PV ou d’échelle COC : trois compteurs de blessures et position de la pire blessure.
  Les seuils doivent être dépassés ; S05 prépare les capacités 3/2.
- Les dés de risque remplacent ceux de la réserve ; ils ne s’achètent pas en planification.
- Drain, modes Matrice/rigging et menace collective restent au MJ ; pas de faux module.
- Les quatre séances de chacune des trois campagnes expliquent les douze chemins GM-05.
- Sous jsdom, AdmZip demande le Uint8Array de Buffer ; l’assertion Forge du pilote réel est
  portée dans les tests d’archives. Le fichier `outils/shadowrun-anarchy/pilote.test.ts` de Claude
  attend son contexte Node et n’a pas été modifié pour cette recette.
- Une régénération invalide les preuves si les SHA changent. Dernière régénération après ajout
  du manuel : les trois SHA sont restés identiques ; preuves E2E toujours concordantes.
- Textes longs parfois tronqués par les zones fixes PDF : explications complètes dans les
  notes PJ et le guide. Sur mobile 360, Ajuster réduit à 49 % ; zoom disponible.

David a autorisé **« Oui, lancer les essais isolés »** le 01/11. Profils, corpus, coffre,
sauvegardes et ports jetables, appareils désactivés ; aucun accès aux données personnelles.
Les services sont fermés. Aucun `src/`, `electron/`, pilote ou campagne installé modifié,
aucun paquet, aucune commande Git d’écriture, aucun commit demandé. Export pilote corrigé
non suivi et références préexistantes laissés intacts ; traces E2E exclues du ZIP.

## Suite du 01/11 — demande de commit et push

David : « commet et pousse ». Périmètre : sources, archives, médias, preuves et documentation
de cette recette seulement. Doublon du paragraphe de recette retiré du manuel ; provenance et
ZIP actualisés, trois archives `.gmos` inchangées et preuves d’import toujours concordantes.
Les références, l’export source du pilote et les traces temporaires restent hors du commit.
