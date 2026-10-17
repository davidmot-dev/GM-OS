# Nephilim — livraison de la fiche enrichie à sept pages

Réalisée le 17/10/2026 avec GM-OS Studio, atelier Fiche. David demande un enrichissement de la fiche existante, sans changer ses deux premières pages ni ses clés.

**État actualisé avant commit :** Claude Code a réalisé l’intégration dans `6be8ff1a` : moteur version 9 et correspondance complète. Le HTML installé dans `docs/fiches/Nephilim/` est identique au livrable. Le validateur complet accepte la fiche avec **0 erreur et 0 avertissement**.

[Ouvrir le seul HTML livré](../../outils/gmos-studio/livraisons/nephilim/nephilim-legende-interactive.html). Il contient tous ses fonds et fonctionne hors ligne. La liste complète ci-dessous est aussi intégrée dans son bouton **Aide**, section « Liste exacte des 747 clés ajoutées ».

## Résultat et conservation

- Gabarit inchangé : `nephilim-legende-fr`.
- 7 pages, 1 019 zones et 986 clés uniques : 239 anciennes et 747 nouvelles.
- Aucune clé retirée, renommée, déplacée ou changée de type. Les deux premiers objets de page du manifeste sont strictement identiques à la version d’origine, fonds et géométries compris.
- Comparaison du rendu rempli des pages 1 et 2 : captures identiques pixel pour pixel.
- Fonctions conservées : navigation, zoom 20–400 %, raccourcis, Zones, autosauvegarde, import/export JSON v1 et v2, portrait, réinitialisation confirmée et impression de toutes les pages.

| Page | Contenu | Zones | Clés nouvelles |
| --- | --- | ---: | ---: |
| 1 | Personnage | 166 | 0 |
| 2 | Effets et simulacre | 106 | 0 |
| 3 | Magie — 24 sorts | 240 | 240 |
| 4 | Kabbale — arbre | 11 | 11 |
| 5 | Kabbale — 20 invocations et 10 ordonnances | 241 | 241 |
| 6 | Alchimie — constructs et Materiae Primae | 39 | 39 |
| 7 | Alchimie — 24 formules | 216 | 216 |

## Choix de David et contenu réellement imprimé

David confirme : **« Oui, cinq valeurs par construct »** et **« Deux nombres par élément : MP actuelles et MP Max »**.

- Chaque construct possède ses cinq Ka propres, saisis indépendamment du Pentacle du personnage : `alchemy.constructs.<construct>.<element>`.
- Materiae Primae : `alchemy.materia.<element>` porte les MP actuelles ; `alchemy.materia.<element>.max` porte le maximum. Deux nombres manuels, sans calcul de plafond ni piste inventée : le PDF ne contient pas de piste imprimée dans cette zone.
- Les tableaux sans lignes horizontales reçoivent des zones transparentes régulières, sans modifier leurs fonds : 24 sorts, 20 invocations, 24 formules.
- Les dix cases « Non respectée » des ordonnances sont indépendantes : leurs numéros désignent les lignes, pas une jauge cumulative.
- Mémorisation reste une mention libre. Le PDF ne précise ni calcul ni case à cocher.
- Les en-têtes imprimés sont suivis : Magie ajoute aussi Art occulte, Portée et Durée ; Kabbale ajoute Monde, Portée, Durée, Visibilité et Page ; Alchimie ajoute Substance, Ka-élément, Aire d’effet et Durée.
- Pas de champ `ka.dominant` : rien ne l’imprime dans les cinq pages fournies. Pas de Pacte, Sceau, Pentacle ou Clé ajoutés : ces zones ne sont pas imprimées. Pas de champs `.work` et `.construct` dans les lignes de formules : l’en-tête porte Substance, pas ces deux valeurs.

## Valeurs répétées : choix pour chaque cas

| Valeur | Choix |
| --- | --- |
| Monde de Kabbale | Report `copy`, nouvelle clé `kabbalah.world`, depuis `occult.kabbalah.world`. |
| Dix Sephiroth | Reports `copy` en lecture seule ; correspondances exactes ci-dessous. |
| Voie et trois Œuvres d’Alchimie | Reports `copy` en lecture seule ; correspondances exactes ci-dessous. |
| Degrés globaux des cercles de Magie | Aucun bloc global imprimé sur la nouvelle page Magie : aucune deuxième saisie. Le cercle et le degré de chaque sort sont propres à ce sort. |
| Ka-éléments du personnage | Pas de Pentacle répété. Les Ka des constructs sont leurs valeurs propres, autorisées par David ; les éléments des sorts/invocations/formules sont propres à leurs lignes. |
| Stase | Aucune zone Stase imprimée sur les cinq nouvelles pages : aucun champ ajouté. |

| Nouvelle clé de report | Source conservée | Page |
| --- | --- | ---: |
| `kabbalah.world` | `occult.kabbalah.world` | 4 |
| `kabbalah.sephiroth.kether.degree` | `occult.kabbalah.third.center` | 4 |
| `kabbalah.sephiroth.binah.degree` | `occult.kabbalah.third.left` | 4 |
| `kabbalah.sephiroth.chokmah.degree` | `occult.kabbalah.third.right` | 4 |
| `kabbalah.sephiroth.geburah.degree` | `occult.kabbalah.geburah` | 4 |
| `kabbalah.sephiroth.chesed.degree` | `occult.kabbalah.chesed` | 4 |
| `kabbalah.sephiroth.tiphereth.degree` | `occult.kabbalah.tiphereth` | 4 |
| `kabbalah.sephiroth.hod.degree` | `occult.kabbalah.hod` | 4 |
| `kabbalah.sephiroth.netzach.degree` | `occult.kabbalah.netzach` | 4 |
| `kabbalah.sephiroth.yesod.degree` | `occult.kabbalah.yesod` | 4 |
| `kabbalah.sephiroth.malkuth.degree` | `occult.kabbalah.malkuth` | 4 |
| `alchemy.path` | `occult.alchemy.path` | 6 |
| `alchemy.works.black` | `occult.alchemy.black` | 6 |
| `alchemy.works.white` | `occult.alchemy.white` | 6 |
| `alchemy.works.red` | `occult.alchemy.red` | 6 |

Les trois cercles du haut de l’arbre portent Kether, Binah et Chokmah : leur position correspond aux clés existantes `occult.kabbalah.third.center`, `.third.left` et `.third.right`. Aucune clé ancienne n’a été renommée pour ces noms.

## Validation et intégration

**17 contrôles de livraison réussis** : conservation du gabarit et des pages, fonds intégrés, géométries, copies, validation structurelle, compatibilité des 239 anciennes clés, comparaison pixel pour pixel, aller-retour JSON des 747 nouvelles clés, saisie, persistance locale, captures normales et Zones des cinq pages, impression, liste intégrée des clés, imports invalides ou annulés, réinitialisation, zoom/tactile, import et reports dans le moteur jetable, absence d’erreur JavaScript et de requête réseau. Certains points sont regroupés dans un même contrôle.

À la livraison initiale, la validation de fiche sans correspondance ne signalait aucune erreur ; la validation complète relevait uniquement les 747 nouvelles clés absentes de la correspondance (§ 7). Cette étape a été achevée ensuite par Claude Code dans `6be8ff1a` : le validateur complet ne renvoie désormais aucun diagnostic. Ne pas refaire le raccordement.

Les essais de moteur emploient un profil Edge jetable. Attendre `RPGSheet.list()` avant l’import pour laisser finir l’amorçage IndexedDB des modèles intégrés ; un import injecté pendant cet amorçage peut être remplacé par l’ancien modèle. Aucune donnée de David n’a été lue ou modifiée.

## Empreintes et provenance

- Original deux pages au moment de la livraison : `a4fdde65e03c71504e5d441ef249e97b7159c7756d0842c2b07ef1b861d845d3`.
- HTML sept pages livré : `c12043f60dd5e6339befee16a49a3070887adbd01654dfcc69c8a1eededef84b`.
- Fiche initiale : `docs/fiches/Nephilim/nephilim-legende-interactive.html` ; elle contient maintenant la version enrichie intégrée dans `6be8ff1a`.
- Source des nouvelles pages : `C:/Users/david/Downloads/Nephilim Magie.pdf`, cinq pages, ordre intégral conservé.
- Livraison du Studio sans modification du code applicatif ; intégration ultérieure attribuée au commit ci-dessus. David demande ensuite « commit et pousse » pour les fichiers du Studio et leurs rapports.

## Liste exacte des 747 clés ajoutées

Aucune clé ancienne retirée ou renommée. Une ligne correspond à une clé nouvelle unique.

| Clé exacte | Type | Page | Source si report |
| --- | --- | ---: | --- |
| `magic.spells.0.name` | textarea | 3 | — |
| `magic.spells.0.circle` | number | 3 | — |
| `magic.spells.0.art` | text | 3 | — |
| `magic.spells.0.element` | select | 3 | — |
| `magic.spells.0.degree` | number | 3 | — |
| `magic.spells.0.range` | text | 3 | — |
| `magic.spells.0.duration` | text | 3 | — |
| `magic.spells.0.effect` | textarea | 3 | — |
| `magic.spells.0.memorization` | textarea | 3 | — |
| `magic.spells.0.page` | text | 3 | — |
| `magic.spells.1.name` | textarea | 3 | — |
| `magic.spells.1.circle` | number | 3 | — |
| `magic.spells.1.art` | text | 3 | — |
| `magic.spells.1.element` | select | 3 | — |
| `magic.spells.1.degree` | number | 3 | — |
| `magic.spells.1.range` | text | 3 | — |
| `magic.spells.1.duration` | text | 3 | — |
| `magic.spells.1.effect` | textarea | 3 | — |
| `magic.spells.1.memorization` | textarea | 3 | — |
| `magic.spells.1.page` | text | 3 | — |
| `magic.spells.2.name` | textarea | 3 | — |
| `magic.spells.2.circle` | number | 3 | — |
| `magic.spells.2.art` | text | 3 | — |
| `magic.spells.2.element` | select | 3 | — |
| `magic.spells.2.degree` | number | 3 | — |
| `magic.spells.2.range` | text | 3 | — |
| `magic.spells.2.duration` | text | 3 | — |
| `magic.spells.2.effect` | textarea | 3 | — |
| `magic.spells.2.memorization` | textarea | 3 | — |
| `magic.spells.2.page` | text | 3 | — |
| `magic.spells.3.name` | textarea | 3 | — |
| `magic.spells.3.circle` | number | 3 | — |
| `magic.spells.3.art` | text | 3 | — |
| `magic.spells.3.element` | select | 3 | — |
| `magic.spells.3.degree` | number | 3 | — |
| `magic.spells.3.range` | text | 3 | — |
| `magic.spells.3.duration` | text | 3 | — |
| `magic.spells.3.effect` | textarea | 3 | — |
| `magic.spells.3.memorization` | textarea | 3 | — |
| `magic.spells.3.page` | text | 3 | — |
| `magic.spells.4.name` | textarea | 3 | — |
| `magic.spells.4.circle` | number | 3 | — |
| `magic.spells.4.art` | text | 3 | — |
| `magic.spells.4.element` | select | 3 | — |
| `magic.spells.4.degree` | number | 3 | — |
| `magic.spells.4.range` | text | 3 | — |
| `magic.spells.4.duration` | text | 3 | — |
| `magic.spells.4.effect` | textarea | 3 | — |
| `magic.spells.4.memorization` | textarea | 3 | — |
| `magic.spells.4.page` | text | 3 | — |
| `magic.spells.5.name` | textarea | 3 | — |
| `magic.spells.5.circle` | number | 3 | — |
| `magic.spells.5.art` | text | 3 | — |
| `magic.spells.5.element` | select | 3 | — |
| `magic.spells.5.degree` | number | 3 | — |
| `magic.spells.5.range` | text | 3 | — |
| `magic.spells.5.duration` | text | 3 | — |
| `magic.spells.5.effect` | textarea | 3 | — |
| `magic.spells.5.memorization` | textarea | 3 | — |
| `magic.spells.5.page` | text | 3 | — |
| `magic.spells.6.name` | textarea | 3 | — |
| `magic.spells.6.circle` | number | 3 | — |
| `magic.spells.6.art` | text | 3 | — |
| `magic.spells.6.element` | select | 3 | — |
| `magic.spells.6.degree` | number | 3 | — |
| `magic.spells.6.range` | text | 3 | — |
| `magic.spells.6.duration` | text | 3 | — |
| `magic.spells.6.effect` | textarea | 3 | — |
| `magic.spells.6.memorization` | textarea | 3 | — |
| `magic.spells.6.page` | text | 3 | — |
| `magic.spells.7.name` | textarea | 3 | — |
| `magic.spells.7.circle` | number | 3 | — |
| `magic.spells.7.art` | text | 3 | — |
| `magic.spells.7.element` | select | 3 | — |
| `magic.spells.7.degree` | number | 3 | — |
| `magic.spells.7.range` | text | 3 | — |
| `magic.spells.7.duration` | text | 3 | — |
| `magic.spells.7.effect` | textarea | 3 | — |
| `magic.spells.7.memorization` | textarea | 3 | — |
| `magic.spells.7.page` | text | 3 | — |
| `magic.spells.8.name` | textarea | 3 | — |
| `magic.spells.8.circle` | number | 3 | — |
| `magic.spells.8.art` | text | 3 | — |
| `magic.spells.8.element` | select | 3 | — |
| `magic.spells.8.degree` | number | 3 | — |
| `magic.spells.8.range` | text | 3 | — |
| `magic.spells.8.duration` | text | 3 | — |
| `magic.spells.8.effect` | textarea | 3 | — |
| `magic.spells.8.memorization` | textarea | 3 | — |
| `magic.spells.8.page` | text | 3 | — |
| `magic.spells.9.name` | textarea | 3 | — |
| `magic.spells.9.circle` | number | 3 | — |
| `magic.spells.9.art` | text | 3 | — |
| `magic.spells.9.element` | select | 3 | — |
| `magic.spells.9.degree` | number | 3 | — |
| `magic.spells.9.range` | text | 3 | — |
| `magic.spells.9.duration` | text | 3 | — |
| `magic.spells.9.effect` | textarea | 3 | — |
| `magic.spells.9.memorization` | textarea | 3 | — |
| `magic.spells.9.page` | text | 3 | — |
| `magic.spells.10.name` | textarea | 3 | — |
| `magic.spells.10.circle` | number | 3 | — |
| `magic.spells.10.art` | text | 3 | — |
| `magic.spells.10.element` | select | 3 | — |
| `magic.spells.10.degree` | number | 3 | — |
| `magic.spells.10.range` | text | 3 | — |
| `magic.spells.10.duration` | text | 3 | — |
| `magic.spells.10.effect` | textarea | 3 | — |
| `magic.spells.10.memorization` | textarea | 3 | — |
| `magic.spells.10.page` | text | 3 | — |
| `magic.spells.11.name` | textarea | 3 | — |
| `magic.spells.11.circle` | number | 3 | — |
| `magic.spells.11.art` | text | 3 | — |
| `magic.spells.11.element` | select | 3 | — |
| `magic.spells.11.degree` | number | 3 | — |
| `magic.spells.11.range` | text | 3 | — |
| `magic.spells.11.duration` | text | 3 | — |
| `magic.spells.11.effect` | textarea | 3 | — |
| `magic.spells.11.memorization` | textarea | 3 | — |
| `magic.spells.11.page` | text | 3 | — |
| `magic.spells.12.name` | textarea | 3 | — |
| `magic.spells.12.circle` | number | 3 | — |
| `magic.spells.12.art` | text | 3 | — |
| `magic.spells.12.element` | select | 3 | — |
| `magic.spells.12.degree` | number | 3 | — |
| `magic.spells.12.range` | text | 3 | — |
| `magic.spells.12.duration` | text | 3 | — |
| `magic.spells.12.effect` | textarea | 3 | — |
| `magic.spells.12.memorization` | textarea | 3 | — |
| `magic.spells.12.page` | text | 3 | — |
| `magic.spells.13.name` | textarea | 3 | — |
| `magic.spells.13.circle` | number | 3 | — |
| `magic.spells.13.art` | text | 3 | — |
| `magic.spells.13.element` | select | 3 | — |
| `magic.spells.13.degree` | number | 3 | — |
| `magic.spells.13.range` | text | 3 | — |
| `magic.spells.13.duration` | text | 3 | — |
| `magic.spells.13.effect` | textarea | 3 | — |
| `magic.spells.13.memorization` | textarea | 3 | — |
| `magic.spells.13.page` | text | 3 | — |
| `magic.spells.14.name` | textarea | 3 | — |
| `magic.spells.14.circle` | number | 3 | — |
| `magic.spells.14.art` | text | 3 | — |
| `magic.spells.14.element` | select | 3 | — |
| `magic.spells.14.degree` | number | 3 | — |
| `magic.spells.14.range` | text | 3 | — |
| `magic.spells.14.duration` | text | 3 | — |
| `magic.spells.14.effect` | textarea | 3 | — |
| `magic.spells.14.memorization` | textarea | 3 | — |
| `magic.spells.14.page` | text | 3 | — |
| `magic.spells.15.name` | textarea | 3 | — |
| `magic.spells.15.circle` | number | 3 | — |
| `magic.spells.15.art` | text | 3 | — |
| `magic.spells.15.element` | select | 3 | — |
| `magic.spells.15.degree` | number | 3 | — |
| `magic.spells.15.range` | text | 3 | — |
| `magic.spells.15.duration` | text | 3 | — |
| `magic.spells.15.effect` | textarea | 3 | — |
| `magic.spells.15.memorization` | textarea | 3 | — |
| `magic.spells.15.page` | text | 3 | — |
| `magic.spells.16.name` | textarea | 3 | — |
| `magic.spells.16.circle` | number | 3 | — |
| `magic.spells.16.art` | text | 3 | — |
| `magic.spells.16.element` | select | 3 | — |
| `magic.spells.16.degree` | number | 3 | — |
| `magic.spells.16.range` | text | 3 | — |
| `magic.spells.16.duration` | text | 3 | — |
| `magic.spells.16.effect` | textarea | 3 | — |
| `magic.spells.16.memorization` | textarea | 3 | — |
| `magic.spells.16.page` | text | 3 | — |
| `magic.spells.17.name` | textarea | 3 | — |
| `magic.spells.17.circle` | number | 3 | — |
| `magic.spells.17.art` | text | 3 | — |
| `magic.spells.17.element` | select | 3 | — |
| `magic.spells.17.degree` | number | 3 | — |
| `magic.spells.17.range` | text | 3 | — |
| `magic.spells.17.duration` | text | 3 | — |
| `magic.spells.17.effect` | textarea | 3 | — |
| `magic.spells.17.memorization` | textarea | 3 | — |
| `magic.spells.17.page` | text | 3 | — |
| `magic.spells.18.name` | textarea | 3 | — |
| `magic.spells.18.circle` | number | 3 | — |
| `magic.spells.18.art` | text | 3 | — |
| `magic.spells.18.element` | select | 3 | — |
| `magic.spells.18.degree` | number | 3 | — |
| `magic.spells.18.range` | text | 3 | — |
| `magic.spells.18.duration` | text | 3 | — |
| `magic.spells.18.effect` | textarea | 3 | — |
| `magic.spells.18.memorization` | textarea | 3 | — |
| `magic.spells.18.page` | text | 3 | — |
| `magic.spells.19.name` | textarea | 3 | — |
| `magic.spells.19.circle` | number | 3 | — |
| `magic.spells.19.art` | text | 3 | — |
| `magic.spells.19.element` | select | 3 | — |
| `magic.spells.19.degree` | number | 3 | — |
| `magic.spells.19.range` | text | 3 | — |
| `magic.spells.19.duration` | text | 3 | — |
| `magic.spells.19.effect` | textarea | 3 | — |
| `magic.spells.19.memorization` | textarea | 3 | — |
| `magic.spells.19.page` | text | 3 | — |
| `magic.spells.20.name` | textarea | 3 | — |
| `magic.spells.20.circle` | number | 3 | — |
| `magic.spells.20.art` | text | 3 | — |
| `magic.spells.20.element` | select | 3 | — |
| `magic.spells.20.degree` | number | 3 | — |
| `magic.spells.20.range` | text | 3 | — |
| `magic.spells.20.duration` | text | 3 | — |
| `magic.spells.20.effect` | textarea | 3 | — |
| `magic.spells.20.memorization` | textarea | 3 | — |
| `magic.spells.20.page` | text | 3 | — |
| `magic.spells.21.name` | textarea | 3 | — |
| `magic.spells.21.circle` | number | 3 | — |
| `magic.spells.21.art` | text | 3 | — |
| `magic.spells.21.element` | select | 3 | — |
| `magic.spells.21.degree` | number | 3 | — |
| `magic.spells.21.range` | text | 3 | — |
| `magic.spells.21.duration` | text | 3 | — |
| `magic.spells.21.effect` | textarea | 3 | — |
| `magic.spells.21.memorization` | textarea | 3 | — |
| `magic.spells.21.page` | text | 3 | — |
| `magic.spells.22.name` | textarea | 3 | — |
| `magic.spells.22.circle` | number | 3 | — |
| `magic.spells.22.art` | text | 3 | — |
| `magic.spells.22.element` | select | 3 | — |
| `magic.spells.22.degree` | number | 3 | — |
| `magic.spells.22.range` | text | 3 | — |
| `magic.spells.22.duration` | text | 3 | — |
| `magic.spells.22.effect` | textarea | 3 | — |
| `magic.spells.22.memorization` | textarea | 3 | — |
| `magic.spells.22.page` | text | 3 | — |
| `magic.spells.23.name` | textarea | 3 | — |
| `magic.spells.23.circle` | number | 3 | — |
| `magic.spells.23.art` | text | 3 | — |
| `magic.spells.23.element` | select | 3 | — |
| `magic.spells.23.degree` | number | 3 | — |
| `magic.spells.23.range` | text | 3 | — |
| `magic.spells.23.duration` | text | 3 | — |
| `magic.spells.23.effect` | textarea | 3 | — |
| `magic.spells.23.memorization` | textarea | 3 | — |
| `magic.spells.23.page` | text | 3 | — |
| `kabbalah.world` | text | 4 | `occult.kabbalah.world` |
| `kabbalah.sephiroth.kether.degree` | number | 4 | `occult.kabbalah.third.center` |
| `kabbalah.sephiroth.binah.degree` | number | 4 | `occult.kabbalah.third.left` |
| `kabbalah.sephiroth.chokmah.degree` | number | 4 | `occult.kabbalah.third.right` |
| `kabbalah.sephiroth.geburah.degree` | number | 4 | `occult.kabbalah.geburah` |
| `kabbalah.sephiroth.chesed.degree` | number | 4 | `occult.kabbalah.chesed` |
| `kabbalah.sephiroth.tiphereth.degree` | number | 4 | `occult.kabbalah.tiphereth` |
| `kabbalah.sephiroth.hod.degree` | number | 4 | `occult.kabbalah.hod` |
| `kabbalah.sephiroth.netzach.degree` | number | 4 | `occult.kabbalah.netzach` |
| `kabbalah.sephiroth.yesod.degree` | number | 4 | `occult.kabbalah.yesod` |
| `kabbalah.sephiroth.malkuth.degree` | number | 4 | `occult.kabbalah.malkuth` |
| `kabbalah.invocations.0.name` | textarea | 5 | — |
| `kabbalah.invocations.0.sephirah` | select | 5 | — |
| `kabbalah.invocations.0.world` | text | 5 | — |
| `kabbalah.invocations.0.element` | select | 5 | — |
| `kabbalah.invocations.0.degree` | number | 5 | — |
| `kabbalah.invocations.0.range` | text | 5 | — |
| `kabbalah.invocations.0.duration` | text | 5 | — |
| `kabbalah.invocations.0.visibility` | text | 5 | — |
| `kabbalah.invocations.0.notes` | textarea | 5 | — |
| `kabbalah.invocations.0.memorization` | textarea | 5 | — |
| `kabbalah.invocations.0.page` | text | 5 | — |
| `kabbalah.invocations.1.name` | textarea | 5 | — |
| `kabbalah.invocations.1.sephirah` | select | 5 | — |
| `kabbalah.invocations.1.world` | text | 5 | — |
| `kabbalah.invocations.1.element` | select | 5 | — |
| `kabbalah.invocations.1.degree` | number | 5 | — |
| `kabbalah.invocations.1.range` | text | 5 | — |
| `kabbalah.invocations.1.duration` | text | 5 | — |
| `kabbalah.invocations.1.visibility` | text | 5 | — |
| `kabbalah.invocations.1.notes` | textarea | 5 | — |
| `kabbalah.invocations.1.memorization` | textarea | 5 | — |
| `kabbalah.invocations.1.page` | text | 5 | — |
| `kabbalah.invocations.2.name` | textarea | 5 | — |
| `kabbalah.invocations.2.sephirah` | select | 5 | — |
| `kabbalah.invocations.2.world` | text | 5 | — |
| `kabbalah.invocations.2.element` | select | 5 | — |
| `kabbalah.invocations.2.degree` | number | 5 | — |
| `kabbalah.invocations.2.range` | text | 5 | — |
| `kabbalah.invocations.2.duration` | text | 5 | — |
| `kabbalah.invocations.2.visibility` | text | 5 | — |
| `kabbalah.invocations.2.notes` | textarea | 5 | — |
| `kabbalah.invocations.2.memorization` | textarea | 5 | — |
| `kabbalah.invocations.2.page` | text | 5 | — |
| `kabbalah.invocations.3.name` | textarea | 5 | — |
| `kabbalah.invocations.3.sephirah` | select | 5 | — |
| `kabbalah.invocations.3.world` | text | 5 | — |
| `kabbalah.invocations.3.element` | select | 5 | — |
| `kabbalah.invocations.3.degree` | number | 5 | — |
| `kabbalah.invocations.3.range` | text | 5 | — |
| `kabbalah.invocations.3.duration` | text | 5 | — |
| `kabbalah.invocations.3.visibility` | text | 5 | — |
| `kabbalah.invocations.3.notes` | textarea | 5 | — |
| `kabbalah.invocations.3.memorization` | textarea | 5 | — |
| `kabbalah.invocations.3.page` | text | 5 | — |
| `kabbalah.invocations.4.name` | textarea | 5 | — |
| `kabbalah.invocations.4.sephirah` | select | 5 | — |
| `kabbalah.invocations.4.world` | text | 5 | — |
| `kabbalah.invocations.4.element` | select | 5 | — |
| `kabbalah.invocations.4.degree` | number | 5 | — |
| `kabbalah.invocations.4.range` | text | 5 | — |
| `kabbalah.invocations.4.duration` | text | 5 | — |
| `kabbalah.invocations.4.visibility` | text | 5 | — |
| `kabbalah.invocations.4.notes` | textarea | 5 | — |
| `kabbalah.invocations.4.memorization` | textarea | 5 | — |
| `kabbalah.invocations.4.page` | text | 5 | — |
| `kabbalah.invocations.5.name` | textarea | 5 | — |
| `kabbalah.invocations.5.sephirah` | select | 5 | — |
| `kabbalah.invocations.5.world` | text | 5 | — |
| `kabbalah.invocations.5.element` | select | 5 | — |
| `kabbalah.invocations.5.degree` | number | 5 | — |
| `kabbalah.invocations.5.range` | text | 5 | — |
| `kabbalah.invocations.5.duration` | text | 5 | — |
| `kabbalah.invocations.5.visibility` | text | 5 | — |
| `kabbalah.invocations.5.notes` | textarea | 5 | — |
| `kabbalah.invocations.5.memorization` | textarea | 5 | — |
| `kabbalah.invocations.5.page` | text | 5 | — |
| `kabbalah.invocations.6.name` | textarea | 5 | — |
| `kabbalah.invocations.6.sephirah` | select | 5 | — |
| `kabbalah.invocations.6.world` | text | 5 | — |
| `kabbalah.invocations.6.element` | select | 5 | — |
| `kabbalah.invocations.6.degree` | number | 5 | — |
| `kabbalah.invocations.6.range` | text | 5 | — |
| `kabbalah.invocations.6.duration` | text | 5 | — |
| `kabbalah.invocations.6.visibility` | text | 5 | — |
| `kabbalah.invocations.6.notes` | textarea | 5 | — |
| `kabbalah.invocations.6.memorization` | textarea | 5 | — |
| `kabbalah.invocations.6.page` | text | 5 | — |
| `kabbalah.invocations.7.name` | textarea | 5 | — |
| `kabbalah.invocations.7.sephirah` | select | 5 | — |
| `kabbalah.invocations.7.world` | text | 5 | — |
| `kabbalah.invocations.7.element` | select | 5 | — |
| `kabbalah.invocations.7.degree` | number | 5 | — |
| `kabbalah.invocations.7.range` | text | 5 | — |
| `kabbalah.invocations.7.duration` | text | 5 | — |
| `kabbalah.invocations.7.visibility` | text | 5 | — |
| `kabbalah.invocations.7.notes` | textarea | 5 | — |
| `kabbalah.invocations.7.memorization` | textarea | 5 | — |
| `kabbalah.invocations.7.page` | text | 5 | — |
| `kabbalah.invocations.8.name` | textarea | 5 | — |
| `kabbalah.invocations.8.sephirah` | select | 5 | — |
| `kabbalah.invocations.8.world` | text | 5 | — |
| `kabbalah.invocations.8.element` | select | 5 | — |
| `kabbalah.invocations.8.degree` | number | 5 | — |
| `kabbalah.invocations.8.range` | text | 5 | — |
| `kabbalah.invocations.8.duration` | text | 5 | — |
| `kabbalah.invocations.8.visibility` | text | 5 | — |
| `kabbalah.invocations.8.notes` | textarea | 5 | — |
| `kabbalah.invocations.8.memorization` | textarea | 5 | — |
| `kabbalah.invocations.8.page` | text | 5 | — |
| `kabbalah.invocations.9.name` | textarea | 5 | — |
| `kabbalah.invocations.9.sephirah` | select | 5 | — |
| `kabbalah.invocations.9.world` | text | 5 | — |
| `kabbalah.invocations.9.element` | select | 5 | — |
| `kabbalah.invocations.9.degree` | number | 5 | — |
| `kabbalah.invocations.9.range` | text | 5 | — |
| `kabbalah.invocations.9.duration` | text | 5 | — |
| `kabbalah.invocations.9.visibility` | text | 5 | — |
| `kabbalah.invocations.9.notes` | textarea | 5 | — |
| `kabbalah.invocations.9.memorization` | textarea | 5 | — |
| `kabbalah.invocations.9.page` | text | 5 | — |
| `kabbalah.invocations.10.name` | textarea | 5 | — |
| `kabbalah.invocations.10.sephirah` | select | 5 | — |
| `kabbalah.invocations.10.world` | text | 5 | — |
| `kabbalah.invocations.10.element` | select | 5 | — |
| `kabbalah.invocations.10.degree` | number | 5 | — |
| `kabbalah.invocations.10.range` | text | 5 | — |
| `kabbalah.invocations.10.duration` | text | 5 | — |
| `kabbalah.invocations.10.visibility` | text | 5 | — |
| `kabbalah.invocations.10.notes` | textarea | 5 | — |
| `kabbalah.invocations.10.memorization` | textarea | 5 | — |
| `kabbalah.invocations.10.page` | text | 5 | — |
| `kabbalah.invocations.11.name` | textarea | 5 | — |
| `kabbalah.invocations.11.sephirah` | select | 5 | — |
| `kabbalah.invocations.11.world` | text | 5 | — |
| `kabbalah.invocations.11.element` | select | 5 | — |
| `kabbalah.invocations.11.degree` | number | 5 | — |
| `kabbalah.invocations.11.range` | text | 5 | — |
| `kabbalah.invocations.11.duration` | text | 5 | — |
| `kabbalah.invocations.11.visibility` | text | 5 | — |
| `kabbalah.invocations.11.notes` | textarea | 5 | — |
| `kabbalah.invocations.11.memorization` | textarea | 5 | — |
| `kabbalah.invocations.11.page` | text | 5 | — |
| `kabbalah.invocations.12.name` | textarea | 5 | — |
| `kabbalah.invocations.12.sephirah` | select | 5 | — |
| `kabbalah.invocations.12.world` | text | 5 | — |
| `kabbalah.invocations.12.element` | select | 5 | — |
| `kabbalah.invocations.12.degree` | number | 5 | — |
| `kabbalah.invocations.12.range` | text | 5 | — |
| `kabbalah.invocations.12.duration` | text | 5 | — |
| `kabbalah.invocations.12.visibility` | text | 5 | — |
| `kabbalah.invocations.12.notes` | textarea | 5 | — |
| `kabbalah.invocations.12.memorization` | textarea | 5 | — |
| `kabbalah.invocations.12.page` | text | 5 | — |
| `kabbalah.invocations.13.name` | textarea | 5 | — |
| `kabbalah.invocations.13.sephirah` | select | 5 | — |
| `kabbalah.invocations.13.world` | text | 5 | — |
| `kabbalah.invocations.13.element` | select | 5 | — |
| `kabbalah.invocations.13.degree` | number | 5 | — |
| `kabbalah.invocations.13.range` | text | 5 | — |
| `kabbalah.invocations.13.duration` | text | 5 | — |
| `kabbalah.invocations.13.visibility` | text | 5 | — |
| `kabbalah.invocations.13.notes` | textarea | 5 | — |
| `kabbalah.invocations.13.memorization` | textarea | 5 | — |
| `kabbalah.invocations.13.page` | text | 5 | — |
| `kabbalah.invocations.14.name` | textarea | 5 | — |
| `kabbalah.invocations.14.sephirah` | select | 5 | — |
| `kabbalah.invocations.14.world` | text | 5 | — |
| `kabbalah.invocations.14.element` | select | 5 | — |
| `kabbalah.invocations.14.degree` | number | 5 | — |
| `kabbalah.invocations.14.range` | text | 5 | — |
| `kabbalah.invocations.14.duration` | text | 5 | — |
| `kabbalah.invocations.14.visibility` | text | 5 | — |
| `kabbalah.invocations.14.notes` | textarea | 5 | — |
| `kabbalah.invocations.14.memorization` | textarea | 5 | — |
| `kabbalah.invocations.14.page` | text | 5 | — |
| `kabbalah.invocations.15.name` | textarea | 5 | — |
| `kabbalah.invocations.15.sephirah` | select | 5 | — |
| `kabbalah.invocations.15.world` | text | 5 | — |
| `kabbalah.invocations.15.element` | select | 5 | — |
| `kabbalah.invocations.15.degree` | number | 5 | — |
| `kabbalah.invocations.15.range` | text | 5 | — |
| `kabbalah.invocations.15.duration` | text | 5 | — |
| `kabbalah.invocations.15.visibility` | text | 5 | — |
| `kabbalah.invocations.15.notes` | textarea | 5 | — |
| `kabbalah.invocations.15.memorization` | textarea | 5 | — |
| `kabbalah.invocations.15.page` | text | 5 | — |
| `kabbalah.invocations.16.name` | textarea | 5 | — |
| `kabbalah.invocations.16.sephirah` | select | 5 | — |
| `kabbalah.invocations.16.world` | text | 5 | — |
| `kabbalah.invocations.16.element` | select | 5 | — |
| `kabbalah.invocations.16.degree` | number | 5 | — |
| `kabbalah.invocations.16.range` | text | 5 | — |
| `kabbalah.invocations.16.duration` | text | 5 | — |
| `kabbalah.invocations.16.visibility` | text | 5 | — |
| `kabbalah.invocations.16.notes` | textarea | 5 | — |
| `kabbalah.invocations.16.memorization` | textarea | 5 | — |
| `kabbalah.invocations.16.page` | text | 5 | — |
| `kabbalah.invocations.17.name` | textarea | 5 | — |
| `kabbalah.invocations.17.sephirah` | select | 5 | — |
| `kabbalah.invocations.17.world` | text | 5 | — |
| `kabbalah.invocations.17.element` | select | 5 | — |
| `kabbalah.invocations.17.degree` | number | 5 | — |
| `kabbalah.invocations.17.range` | text | 5 | — |
| `kabbalah.invocations.17.duration` | text | 5 | — |
| `kabbalah.invocations.17.visibility` | text | 5 | — |
| `kabbalah.invocations.17.notes` | textarea | 5 | — |
| `kabbalah.invocations.17.memorization` | textarea | 5 | — |
| `kabbalah.invocations.17.page` | text | 5 | — |
| `kabbalah.invocations.18.name` | textarea | 5 | — |
| `kabbalah.invocations.18.sephirah` | select | 5 | — |
| `kabbalah.invocations.18.world` | text | 5 | — |
| `kabbalah.invocations.18.element` | select | 5 | — |
| `kabbalah.invocations.18.degree` | number | 5 | — |
| `kabbalah.invocations.18.range` | text | 5 | — |
| `kabbalah.invocations.18.duration` | text | 5 | — |
| `kabbalah.invocations.18.visibility` | text | 5 | — |
| `kabbalah.invocations.18.notes` | textarea | 5 | — |
| `kabbalah.invocations.18.memorization` | textarea | 5 | — |
| `kabbalah.invocations.18.page` | text | 5 | — |
| `kabbalah.invocations.19.name` | textarea | 5 | — |
| `kabbalah.invocations.19.sephirah` | select | 5 | — |
| `kabbalah.invocations.19.world` | text | 5 | — |
| `kabbalah.invocations.19.element` | select | 5 | — |
| `kabbalah.invocations.19.degree` | number | 5 | — |
| `kabbalah.invocations.19.range` | text | 5 | — |
| `kabbalah.invocations.19.duration` | text | 5 | — |
| `kabbalah.invocations.19.visibility` | text | 5 | — |
| `kabbalah.invocations.19.notes` | textarea | 5 | — |
| `kabbalah.invocations.19.memorization` | textarea | 5 | — |
| `kabbalah.invocations.19.page` | text | 5 | — |
| `kabbalah.ordinances.degree` | number | 5 | — |
| `kabbalah.ordinances.0.type` | text | 5 | — |
| `kabbalah.ordinances.0.broken` | checkbox | 5 | — |
| `kabbalah.ordinances.1.type` | text | 5 | — |
| `kabbalah.ordinances.1.broken` | checkbox | 5 | — |
| `kabbalah.ordinances.2.type` | text | 5 | — |
| `kabbalah.ordinances.2.broken` | checkbox | 5 | — |
| `kabbalah.ordinances.3.type` | text | 5 | — |
| `kabbalah.ordinances.3.broken` | checkbox | 5 | — |
| `kabbalah.ordinances.4.type` | text | 5 | — |
| `kabbalah.ordinances.4.broken` | checkbox | 5 | — |
| `kabbalah.ordinances.5.type` | text | 5 | — |
| `kabbalah.ordinances.5.broken` | checkbox | 5 | — |
| `kabbalah.ordinances.6.type` | text | 5 | — |
| `kabbalah.ordinances.6.broken` | checkbox | 5 | — |
| `kabbalah.ordinances.7.type` | text | 5 | — |
| `kabbalah.ordinances.7.broken` | checkbox | 5 | — |
| `kabbalah.ordinances.8.type` | text | 5 | — |
| `kabbalah.ordinances.8.broken` | checkbox | 5 | — |
| `kabbalah.ordinances.9.type` | text | 5 | — |
| `kabbalah.ordinances.9.broken` | checkbox | 5 | — |
| `alchemy.path` | text | 6 | `occult.alchemy.path` |
| `alchemy.works.black` | number | 6 | `occult.alchemy.black` |
| `alchemy.works.white` | number | 6 | `occult.alchemy.white` |
| `alchemy.works.red` | number | 6 | `occult.alchemy.red` |
| `alchemy.constructs.retort.fire` | number | 6 | — |
| `alchemy.constructs.retort.earth` | number | 6 | — |
| `alchemy.constructs.retort.air` | number | 6 | — |
| `alchemy.constructs.retort.moon` | number | 6 | — |
| `alchemy.constructs.retort.water` | number | 6 | — |
| `alchemy.constructs.aludel.fire` | number | 6 | — |
| `alchemy.constructs.aludel.earth` | number | 6 | — |
| `alchemy.constructs.aludel.air` | number | 6 | — |
| `alchemy.constructs.aludel.moon` | number | 6 | — |
| `alchemy.constructs.aludel.water` | number | 6 | — |
| `alchemy.constructs.athanor.fire` | number | 6 | — |
| `alchemy.constructs.athanor.earth` | number | 6 | — |
| `alchemy.constructs.athanor.air` | number | 6 | — |
| `alchemy.constructs.athanor.moon` | number | 6 | — |
| `alchemy.constructs.athanor.water` | number | 6 | — |
| `alchemy.constructs.crucible.fire` | number | 6 | — |
| `alchemy.constructs.crucible.earth` | number | 6 | — |
| `alchemy.constructs.crucible.air` | number | 6 | — |
| `alchemy.constructs.crucible.moon` | number | 6 | — |
| `alchemy.constructs.crucible.water` | number | 6 | — |
| `alchemy.constructs.alembic.fire` | number | 6 | — |
| `alchemy.constructs.alembic.earth` | number | 6 | — |
| `alchemy.constructs.alembic.air` | number | 6 | — |
| `alchemy.constructs.alembic.moon` | number | 6 | — |
| `alchemy.constructs.alembic.water` | number | 6 | — |
| `alchemy.materia.fire.max` | number | 6 | — |
| `alchemy.materia.fire` | number | 6 | — |
| `alchemy.materia.air.max` | number | 6 | — |
| `alchemy.materia.air` | number | 6 | — |
| `alchemy.materia.water.max` | number | 6 | — |
| `alchemy.materia.water` | number | 6 | — |
| `alchemy.materia.earth.max` | number | 6 | — |
| `alchemy.materia.earth` | number | 6 | — |
| `alchemy.materia.moon.max` | number | 6 | — |
| `alchemy.materia.moon` | number | 6 | — |
| `alchemy.formulas.0.name` | textarea | 7 | — |
| `alchemy.formulas.0.substance` | text | 7 | — |
| `alchemy.formulas.0.element` | select | 7 | — |
| `alchemy.formulas.0.degree` | number | 7 | — |
| `alchemy.formulas.0.area` | text | 7 | — |
| `alchemy.formulas.0.duration` | text | 7 | — |
| `alchemy.formulas.0.effect` | textarea | 7 | — |
| `alchemy.formulas.0.memorization` | textarea | 7 | — |
| `alchemy.formulas.0.page` | text | 7 | — |
| `alchemy.formulas.1.name` | textarea | 7 | — |
| `alchemy.formulas.1.substance` | text | 7 | — |
| `alchemy.formulas.1.element` | select | 7 | — |
| `alchemy.formulas.1.degree` | number | 7 | — |
| `alchemy.formulas.1.area` | text | 7 | — |
| `alchemy.formulas.1.duration` | text | 7 | — |
| `alchemy.formulas.1.effect` | textarea | 7 | — |
| `alchemy.formulas.1.memorization` | textarea | 7 | — |
| `alchemy.formulas.1.page` | text | 7 | — |
| `alchemy.formulas.2.name` | textarea | 7 | — |
| `alchemy.formulas.2.substance` | text | 7 | — |
| `alchemy.formulas.2.element` | select | 7 | — |
| `alchemy.formulas.2.degree` | number | 7 | — |
| `alchemy.formulas.2.area` | text | 7 | — |
| `alchemy.formulas.2.duration` | text | 7 | — |
| `alchemy.formulas.2.effect` | textarea | 7 | — |
| `alchemy.formulas.2.memorization` | textarea | 7 | — |
| `alchemy.formulas.2.page` | text | 7 | — |
| `alchemy.formulas.3.name` | textarea | 7 | — |
| `alchemy.formulas.3.substance` | text | 7 | — |
| `alchemy.formulas.3.element` | select | 7 | — |
| `alchemy.formulas.3.degree` | number | 7 | — |
| `alchemy.formulas.3.area` | text | 7 | — |
| `alchemy.formulas.3.duration` | text | 7 | — |
| `alchemy.formulas.3.effect` | textarea | 7 | — |
| `alchemy.formulas.3.memorization` | textarea | 7 | — |
| `alchemy.formulas.3.page` | text | 7 | — |
| `alchemy.formulas.4.name` | textarea | 7 | — |
| `alchemy.formulas.4.substance` | text | 7 | — |
| `alchemy.formulas.4.element` | select | 7 | — |
| `alchemy.formulas.4.degree` | number | 7 | — |
| `alchemy.formulas.4.area` | text | 7 | — |
| `alchemy.formulas.4.duration` | text | 7 | — |
| `alchemy.formulas.4.effect` | textarea | 7 | — |
| `alchemy.formulas.4.memorization` | textarea | 7 | — |
| `alchemy.formulas.4.page` | text | 7 | — |
| `alchemy.formulas.5.name` | textarea | 7 | — |
| `alchemy.formulas.5.substance` | text | 7 | — |
| `alchemy.formulas.5.element` | select | 7 | — |
| `alchemy.formulas.5.degree` | number | 7 | — |
| `alchemy.formulas.5.area` | text | 7 | — |
| `alchemy.formulas.5.duration` | text | 7 | — |
| `alchemy.formulas.5.effect` | textarea | 7 | — |
| `alchemy.formulas.5.memorization` | textarea | 7 | — |
| `alchemy.formulas.5.page` | text | 7 | — |
| `alchemy.formulas.6.name` | textarea | 7 | — |
| `alchemy.formulas.6.substance` | text | 7 | — |
| `alchemy.formulas.6.element` | select | 7 | — |
| `alchemy.formulas.6.degree` | number | 7 | — |
| `alchemy.formulas.6.area` | text | 7 | — |
| `alchemy.formulas.6.duration` | text | 7 | — |
| `alchemy.formulas.6.effect` | textarea | 7 | — |
| `alchemy.formulas.6.memorization` | textarea | 7 | — |
| `alchemy.formulas.6.page` | text | 7 | — |
| `alchemy.formulas.7.name` | textarea | 7 | — |
| `alchemy.formulas.7.substance` | text | 7 | — |
| `alchemy.formulas.7.element` | select | 7 | — |
| `alchemy.formulas.7.degree` | number | 7 | — |
| `alchemy.formulas.7.area` | text | 7 | — |
| `alchemy.formulas.7.duration` | text | 7 | — |
| `alchemy.formulas.7.effect` | textarea | 7 | — |
| `alchemy.formulas.7.memorization` | textarea | 7 | — |
| `alchemy.formulas.7.page` | text | 7 | — |
| `alchemy.formulas.8.name` | textarea | 7 | — |
| `alchemy.formulas.8.substance` | text | 7 | — |
| `alchemy.formulas.8.element` | select | 7 | — |
| `alchemy.formulas.8.degree` | number | 7 | — |
| `alchemy.formulas.8.area` | text | 7 | — |
| `alchemy.formulas.8.duration` | text | 7 | — |
| `alchemy.formulas.8.effect` | textarea | 7 | — |
| `alchemy.formulas.8.memorization` | textarea | 7 | — |
| `alchemy.formulas.8.page` | text | 7 | — |
| `alchemy.formulas.9.name` | textarea | 7 | — |
| `alchemy.formulas.9.substance` | text | 7 | — |
| `alchemy.formulas.9.element` | select | 7 | — |
| `alchemy.formulas.9.degree` | number | 7 | — |
| `alchemy.formulas.9.area` | text | 7 | — |
| `alchemy.formulas.9.duration` | text | 7 | — |
| `alchemy.formulas.9.effect` | textarea | 7 | — |
| `alchemy.formulas.9.memorization` | textarea | 7 | — |
| `alchemy.formulas.9.page` | text | 7 | — |
| `alchemy.formulas.10.name` | textarea | 7 | — |
| `alchemy.formulas.10.substance` | text | 7 | — |
| `alchemy.formulas.10.element` | select | 7 | — |
| `alchemy.formulas.10.degree` | number | 7 | — |
| `alchemy.formulas.10.area` | text | 7 | — |
| `alchemy.formulas.10.duration` | text | 7 | — |
| `alchemy.formulas.10.effect` | textarea | 7 | — |
| `alchemy.formulas.10.memorization` | textarea | 7 | — |
| `alchemy.formulas.10.page` | text | 7 | — |
| `alchemy.formulas.11.name` | textarea | 7 | — |
| `alchemy.formulas.11.substance` | text | 7 | — |
| `alchemy.formulas.11.element` | select | 7 | — |
| `alchemy.formulas.11.degree` | number | 7 | — |
| `alchemy.formulas.11.area` | text | 7 | — |
| `alchemy.formulas.11.duration` | text | 7 | — |
| `alchemy.formulas.11.effect` | textarea | 7 | — |
| `alchemy.formulas.11.memorization` | textarea | 7 | — |
| `alchemy.formulas.11.page` | text | 7 | — |
| `alchemy.formulas.12.name` | textarea | 7 | — |
| `alchemy.formulas.12.substance` | text | 7 | — |
| `alchemy.formulas.12.element` | select | 7 | — |
| `alchemy.formulas.12.degree` | number | 7 | — |
| `alchemy.formulas.12.area` | text | 7 | — |
| `alchemy.formulas.12.duration` | text | 7 | — |
| `alchemy.formulas.12.effect` | textarea | 7 | — |
| `alchemy.formulas.12.memorization` | textarea | 7 | — |
| `alchemy.formulas.12.page` | text | 7 | — |
| `alchemy.formulas.13.name` | textarea | 7 | — |
| `alchemy.formulas.13.substance` | text | 7 | — |
| `alchemy.formulas.13.element` | select | 7 | — |
| `alchemy.formulas.13.degree` | number | 7 | — |
| `alchemy.formulas.13.area` | text | 7 | — |
| `alchemy.formulas.13.duration` | text | 7 | — |
| `alchemy.formulas.13.effect` | textarea | 7 | — |
| `alchemy.formulas.13.memorization` | textarea | 7 | — |
| `alchemy.formulas.13.page` | text | 7 | — |
| `alchemy.formulas.14.name` | textarea | 7 | — |
| `alchemy.formulas.14.substance` | text | 7 | — |
| `alchemy.formulas.14.element` | select | 7 | — |
| `alchemy.formulas.14.degree` | number | 7 | — |
| `alchemy.formulas.14.area` | text | 7 | — |
| `alchemy.formulas.14.duration` | text | 7 | — |
| `alchemy.formulas.14.effect` | textarea | 7 | — |
| `alchemy.formulas.14.memorization` | textarea | 7 | — |
| `alchemy.formulas.14.page` | text | 7 | — |
| `alchemy.formulas.15.name` | textarea | 7 | — |
| `alchemy.formulas.15.substance` | text | 7 | — |
| `alchemy.formulas.15.element` | select | 7 | — |
| `alchemy.formulas.15.degree` | number | 7 | — |
| `alchemy.formulas.15.area` | text | 7 | — |
| `alchemy.formulas.15.duration` | text | 7 | — |
| `alchemy.formulas.15.effect` | textarea | 7 | — |
| `alchemy.formulas.15.memorization` | textarea | 7 | — |
| `alchemy.formulas.15.page` | text | 7 | — |
| `alchemy.formulas.16.name` | textarea | 7 | — |
| `alchemy.formulas.16.substance` | text | 7 | — |
| `alchemy.formulas.16.element` | select | 7 | — |
| `alchemy.formulas.16.degree` | number | 7 | — |
| `alchemy.formulas.16.area` | text | 7 | — |
| `alchemy.formulas.16.duration` | text | 7 | — |
| `alchemy.formulas.16.effect` | textarea | 7 | — |
| `alchemy.formulas.16.memorization` | textarea | 7 | — |
| `alchemy.formulas.16.page` | text | 7 | — |
| `alchemy.formulas.17.name` | textarea | 7 | — |
| `alchemy.formulas.17.substance` | text | 7 | — |
| `alchemy.formulas.17.element` | select | 7 | — |
| `alchemy.formulas.17.degree` | number | 7 | — |
| `alchemy.formulas.17.area` | text | 7 | — |
| `alchemy.formulas.17.duration` | text | 7 | — |
| `alchemy.formulas.17.effect` | textarea | 7 | — |
| `alchemy.formulas.17.memorization` | textarea | 7 | — |
| `alchemy.formulas.17.page` | text | 7 | — |
| `alchemy.formulas.18.name` | textarea | 7 | — |
| `alchemy.formulas.18.substance` | text | 7 | — |
| `alchemy.formulas.18.element` | select | 7 | — |
| `alchemy.formulas.18.degree` | number | 7 | — |
| `alchemy.formulas.18.area` | text | 7 | — |
| `alchemy.formulas.18.duration` | text | 7 | — |
| `alchemy.formulas.18.effect` | textarea | 7 | — |
| `alchemy.formulas.18.memorization` | textarea | 7 | — |
| `alchemy.formulas.18.page` | text | 7 | — |
| `alchemy.formulas.19.name` | textarea | 7 | — |
| `alchemy.formulas.19.substance` | text | 7 | — |
| `alchemy.formulas.19.element` | select | 7 | — |
| `alchemy.formulas.19.degree` | number | 7 | — |
| `alchemy.formulas.19.area` | text | 7 | — |
| `alchemy.formulas.19.duration` | text | 7 | — |
| `alchemy.formulas.19.effect` | textarea | 7 | — |
| `alchemy.formulas.19.memorization` | textarea | 7 | — |
| `alchemy.formulas.19.page` | text | 7 | — |
| `alchemy.formulas.20.name` | textarea | 7 | — |
| `alchemy.formulas.20.substance` | text | 7 | — |
| `alchemy.formulas.20.element` | select | 7 | — |
| `alchemy.formulas.20.degree` | number | 7 | — |
| `alchemy.formulas.20.area` | text | 7 | — |
| `alchemy.formulas.20.duration` | text | 7 | — |
| `alchemy.formulas.20.effect` | textarea | 7 | — |
| `alchemy.formulas.20.memorization` | textarea | 7 | — |
| `alchemy.formulas.20.page` | text | 7 | — |
| `alchemy.formulas.21.name` | textarea | 7 | — |
| `alchemy.formulas.21.substance` | text | 7 | — |
| `alchemy.formulas.21.element` | select | 7 | — |
| `alchemy.formulas.21.degree` | number | 7 | — |
| `alchemy.formulas.21.area` | text | 7 | — |
| `alchemy.formulas.21.duration` | text | 7 | — |
| `alchemy.formulas.21.effect` | textarea | 7 | — |
| `alchemy.formulas.21.memorization` | textarea | 7 | — |
| `alchemy.formulas.21.page` | text | 7 | — |
| `alchemy.formulas.22.name` | textarea | 7 | — |
| `alchemy.formulas.22.substance` | text | 7 | — |
| `alchemy.formulas.22.element` | select | 7 | — |
| `alchemy.formulas.22.degree` | number | 7 | — |
| `alchemy.formulas.22.area` | text | 7 | — |
| `alchemy.formulas.22.duration` | text | 7 | — |
| `alchemy.formulas.22.effect` | textarea | 7 | — |
| `alchemy.formulas.22.memorization` | textarea | 7 | — |
| `alchemy.formulas.22.page` | text | 7 | — |
| `alchemy.formulas.23.name` | textarea | 7 | — |
| `alchemy.formulas.23.substance` | text | 7 | — |
| `alchemy.formulas.23.element` | select | 7 | — |
| `alchemy.formulas.23.degree` | number | 7 | — |
| `alchemy.formulas.23.area` | text | 7 | — |
| `alchemy.formulas.23.duration` | text | 7 | — |
| `alchemy.formulas.23.effect` | textarea | 7 | — |
| `alchemy.formulas.23.memorization` | textarea | 7 | — |
| `alchemy.formulas.23.page` | text | 7 | — |

## Reprise technique locale

La préparation et les captures sont dans `scratch/nephilim-occultes/` (ignoré par Git) : `enrichir.mjs`, `verifier.mjs`, `verification.json`, rapports du validateur, fonds rendus et captures normales/Zones. Le HTML livré est autonome ; ces fichiers ne sont pas nécessaires à son utilisation.
Le présent rapport peut se régénérer en UTF-8 avec `node outils/gmos-studio/livraisons/nephilim/decrire-livraison.mjs`.
