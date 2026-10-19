# Améliorations possibles de NOC — 19/10/2026

Dressée par Claude Code à la demande de David : *« est-ce qu'il reste des améliorations pour
NOC ? »*, puis *« sauve cela dans un fichier d'amélioration de NOC »*. Rien n'est choisi ni codé.

**Sources** : registre § ⭐, entrée du 16/10 « NOC : moment de calme, effets du Fiel… » (« Reste à
la main ») ; manuel [`54-Jeu-NOC.md`](../User%20Guides/54-Jeu-NOC.md), section « Ce qui manque
encore ». Chaque point a été **revérifié dans le code le 19/10** ; l'ancre est citée.

Aucun de ces points n'empêche de jouer : tous se règlent aujourd'hui à la main.

## Règles encore à la main

| # | Point | État vérifié | Ancre |
| :-- | :--- | :--- | :--- |
| 1 | **Les Séquelles ne se comptent pas seules** : à 8 points d'une jauge de péril, un point devient permanent | Le moment de calme lit le champ « Séquelles » comme **plancher**, mais rien ne l'incrémente quand la jauge atteint 8 | `src/modules/table/gestesDesHeros.ts:106` (`retenuParSequelles`) |
| 2 | **La Singularité gagnée par un Rouage** : Rouage hostile, Fiel déjà vide → un Héros désigné par la Loi gagne la Singularité restante | Le pupitre l'**annonce**, ne l'écrit sur aucune fiche | `src/modules/dice/fielAuPupitre.ts:62` |
| 3 | **Le Soupçon** (Cabale Dykovienne) ampute la récupération du moment de calme : −2, −4, −6 à 5, 8, 10 points | L'aperçu **annonce** les points à reprendre ; la répartition est **au choix du joueur**, donc non appliquée | `gestesDesHeros.ts:156` (commentaire) ; manuel 54, « Moment de calme » |
| 4 | **L'Aura de lumière** d'un allié (réduit la Noirceur de l'Intervention de l'Artefact) | Non modélisée | manuel 54, « Effets du Fiel » |
| 5 | **Le partage de l'Extase** entre Héros qui se reposent ensemble | Non modélisé | manuel 54, « Moment de calme » |
| 6 | **Les alliés de la Loi**, épargnés par les effets du Fiel | Non modélisés | manuel 54, « Effets du Fiel » |
| 7 | **La Faveur de la Cabale** : 2 points par Contact de l'Atout Réseau | La feuille de Cabale (`noc-cabale`) n'a **pas de piste** pour la suivre | `docs/fiches/NOC/NOC_fiche_cabale_interactive.html` |

## Fiche du Héros

| # | Point | État vérifié |
| :-- | :--- | :--- |
| 8 | **78 cases à cocher en 9 pistes** sur la fiche `noc-reference` : Vécu, Espoir, Singularité, Trauma, Blessures, Noirceur, Traque (10 cases chacune), Faveurs actuelles et maximales (4 chacune) | `npm run fiche:valider -- NOC` : acceptée, **9 avertissements § 4**, un par piste. En **hotspots** (valeurs 1 à 10), un clic remplirait la piste jusqu'à la case, comme sur la feuille de Cabale. Passe par le Studio (mêmes clés de piste), puis l'intégration au moteur (`BUILTIN_VERSION` +1) et la correspondance `docs/systems/noc/fiche/correspondance.json` (les transformations `serie` deviennent des nombres) |

Le registre du 26/09 parlait de « 113 cases à cocher » : la régénération du 13/10 en a converti 35
en nombres (Domaines et Talents). Il en reste 78.

## À éprouver à l'écran

| # | Point | État |
| :-- | :--- | :--- |
| 9 | Les pistes de la Cabale se rechargent au **Nouveau scénario** (`ficheDeGroupe.nouveauScenario`, `1815ed39`, 16/10) | Rangé au registre dans « Faits, à éprouver à l'écran » ; pas d'essai de David consigné |

## Recommandation

Commencer par **1 et 2** : petits, en code, et utiles à chaque séance (une jauge qui atteint 8, un
jet de Rouage). **3 à 6** dépendent d'un choix du joueur ou du meneur : les garder à la main se
défend. **7 et 8** passent par le Studio (*Character Sheet HTML Studio*), donc par David.

⛔ Les points 1 et 2 touchent `src/` : demander d'abord à David si GM-OS tourne.
