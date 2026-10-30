# Symbaroum — fiche interactive

Fichier livré : `docs/fiches/Symbaroum/symbaroum-fiche-personnage-interactive.html`.

- Source : les deux pages de `Symbaroum - Fiche de Perso.pdf` fournies par David.
- Gabarit nouveau : `symbaroum-fr`, 182 zones et 158 clés. Aucun gabarit Symbaroum précédent n'a été trouvé dans le dépôt ou dans le moteur ; aucune clé existante n'a été modifiée.
- Fonds PNG intégrés sans perte, en 1191 × 1684 px ; coordonnées natives de 595,276 × 841,89 unités par page.
- Identité, six valeurs des losanges, huit attributs, douze cadres de talents/pouvoirs, quatre armes, deux protections, portrait, cinq compagnons, groupe, quatre artéfacts, vingt et une lignes d'équipement, argent et autres biens.
- N/A/M : un choix exclusif par cadre, sous une même clé de rang et avec des valeurs texte `novice`, `adept`, `master`. Un nouveau clic sur la valeur active efface ce choix.
- Aucun calcul automatique : aucune formule n'est imprimée sur le PDF. Les expressions de dés restent du texte pour les dégâts, la protection et la corruption des artéfacts.

## Contrôles réalisés

`node outils/symbaroum/verifier-fiche.mjs` : saisie et export des 158 clés, sauvegarde/rechargement, import/export JSON v1, import de l'export v2 du moteur, refus des données invalides sans perte, clés inconnues ignorées, réinitialisation avec confirmation, ajout/remplacement/retrait du portrait, navigation, zoom 20–400 %, clavier et molette, mode Zones, rendu mobile à 390 px, deux pages A4 à l'impression, fonctionnement sans requête réseau ni erreur JavaScript.

Import du HTML dans le véritable `Character_Sheet_Manager.html`, dans un Chrome jetable : 182 champs rendus, rang exclusif fonctionnel, chiffres à deux et trois positions vérifiés, flèches numériques masquées par `customCss`. Aucune bibliothèque personnelle de fiches ou campagne n'a été utilisée.

Le validateur accepte la fiche : **0 erreur et 2 avertissements attendus**, car le modèle est nouveau et sa correspondance n'est pas installée. Rapports : `validation.json`, `verification.json`. Les captures `page-1-zones.png`, `page-2-zones.png`, `page-1-remplie.png`, `page-2-remplie.png`, `moteur-page-1.png` et `mobile-390.png` sont des contrôles ; les valeurs de démonstration ne sont pas enregistrées dans le HTML livré.

## Intégration restant à faire

Après livraison du constructeur : intégration du gabarit au moteur avec incrément de `BUILTIN_VERSION`, puis correspondance des clés vers le pilote Symbaroum, selon le cahier des charges. Ni le moteur partagé, ni le pilote, ni les campagnes n'ont été modifiés par ce travail.

## Reproduction

```powershell
node outils/symbaroum/construire-fiche.mjs 'C:/Users/david/Downloads/Symbaroum Reference/Symbaroum - Fiche de Perso.pdf'
node outils/symbaroum/verifier-fiche.mjs
npm.cmd run fiche:valider -- Symbaroum
```

Empreinte SHA-256 du PDF source : `dc9c8ca9ce01a6f1ef96490a58b7bcde9f771957059103145af55faeeb3529c0`.
