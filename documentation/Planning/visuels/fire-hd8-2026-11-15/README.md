# La Fire HD 8 — maquettes Stitch et captures de départ, 15/11/2026

Tâche T3 de la [spécification](../../2026-11-15-fire-hd8-interface.md), prompts dans
[2026-11-15-fire-hd8-prompts-stitch.md](../../2026-11-15-fire-hd8-prompts-stitch.md). Projet Stitch
privé `18300975050807369644` (« GM-OS — Tablette de la table (Fire HD 8) »). Les images sont réduites
à 1 000 px de large ; Stitch rend sur un canevas de 2 560 × 2 048, le cadre utile est en haut à gauche.

## Captures de départ (ADB, Fire HD 8, 15/11)

| Fichier | Ce qu'il montre |
| --- | --- |
| `depart-hub-silk.png` | Hub joueur sous Silk 108 : le bouton « Quitter la session » devient un pavé rose plein (couleurs `color-mix` perdues). Onglets du navigateur coupés de l'image |
| `depart-hub-firefox.png` | Le même Hub sous Firefox 143 : correct |
| `depart-telecommande-firefox.png` | La télécommande appairée sous Firefox 143, onglet Modules |

## Maquettes et relecture

| Fichier | Conforme au prompt | Inventé par Stitch, à ne pas reprendre |
| --- | --- | --- |
| `1-accueil.png` | Trois cartes, cadenas « Code du meneur demandé », rôle actuel en cyan, pied de page | Rien. Grand vide sous l'en-tête : à resserrer sur 960 px de haut |
| `2-code-du-meneur.png` | Quatre cases, pavé numérique, erreur en rose, « Retour aux rôles » | Rien |
| `3-onglet-tables.png` | Barre latérale, onglet Tables, pastille du jeu, liste avec dés, modificateur, « Tirer », résultat, « Vu par toi seul », deux gestes | « TABLE 01 », « v2.4 · ALIEN RPG », badge « NEW », « 6 tables disponibles », « Effet critique » (dire « Effet »), « Connecté au serveur » en toutes lettres (la télécommande a une pastille), Modules déplacé en bas de la barre |
| `4-appareil-de-table.png` | Bandeau de 40 px (rôle, nom du module, « Changer de rôle ») ; le module garde son dessin | Dans le radar : « Récepteur : ultrason / doppler », distances 10/20/30 m, graduation du curseur. Sans effet : l'intérieur est dessiné par le module lui-même (`VueDeModule`), seul le bandeau est neuf |
| `5-ecran-de-table.png` | Quatre tuiles, chiffres très grands, couleurs par sens, « Changer de rôle » discret | « Réserve O₂ nominale », « Cycle diurne normal », pastille « Compte à rebours », barre sous l'ordre du tour (elle ne mesure rien). Rendu plus haut que 600 px : les tuiles devront se tasser en paysage |

## Essai de l'onglet Tables sur la Fire (T7, 15/11)

Répétition recompilée, campagne Dune, Firefox 143, gestes envoyés par ADB.

| Fichier | Ce qu'il montre |
| --- | --- |
| `essai-t7-1-liste-dune.png` | Dossier `Dune` retrouvé, trois tables de recette avec leur dé. Le titre « Tables » en double y est visible ; corrigé depuis |
| `essai-t7-2-tirage.png` | Tirage fait au poste du MJ, revenu à la Fire seule : « 2 · Une citerne bloque le quai », « Vu par toi seul » |
| `essai-t7-3-montre.png` | Après « Montrer aux joueurs » : badge « Montré aux joueurs », bouton grisé |

## Essai de l'appareil de table (T11, 15/11)

`e2e/appareilDeTable.spec.ts` : profil jetable, campagne Alien fictive, pilote 1.11.0, « Fire » en client
HTTP/WebSocket de 960 × 600 sans pont Electron.

| Fichier | Ce qu'il montre |
| --- | --- |
| `essai-t11-1-m314-ouvert-a-la-table.png` | Le meneur coche « La table » sur le détecteur : la Fire l'affiche sous le bandeau « Appareil de table · Ouvert par le meneur » |
| `essai-t11-2-m314-oriente-par-la-table.png` | Désignée « joueur qui oriente », la table tourne le M314 : cap 15°, lu au poste du meneur |

⚠️ En paysage, la vue joueur du M314 s'empile : le radar ne tient pas sans défiler. La maquette prévoyait
le radar à gauche et l'orientation à droite ; ce dessin appartient au module (`outils/alien/modules/detecteur/`).

## Essai de l'écran de table (T12-T13, 15/11)

`e2e/ecranDeTable.spec.ts` : campagne Alien fictive, cases cochées dans la section « Écran de table » du
tableau de bord de l'Ulanzi, « Fire » en client de 960 × 600 en rôle `hub`.

| Fichier | Ce qu'il montre |
| --- | --- |
| `essai-t13-1-ordre-et-jauge.png` | « Ordre du tour » (Wilson actif, Tour 3, le rôdeur caché sauté) et « Air restant » 6/10 ; la jauge secrète n'apparaît pas |
| `essai-t13-2-quatre-tuiles-impact.png` | Après « un peu plat » puis « plus impactante » : relief, lueurs à la teinte du thème, jauge critique (9/10) en rouge battant, minuteur sous la minute qui bat, chiffres calés sur la tuile |
