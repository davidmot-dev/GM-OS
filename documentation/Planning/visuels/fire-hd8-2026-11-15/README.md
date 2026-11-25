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
✅ Corrigé le 25/11 : deux colonnes en paysage, comme la maquette (`essai-m314-paysage.png`, même e2e).
le radar à gauche et l'orientation à droite ; ce dessin appartient au module (`outils/alien/modules/detecteur/`).

## Essai de l'écran de table (T12-T13, 15/11)

`e2e/ecranDeTable.spec.ts` : campagne Alien fictive, cases cochées dans la section « Écran de table » du
tableau de bord de l'Ulanzi, « Fire » en client de 960 × 600 en rôle `hub`.

| Fichier | Ce qu'il montre |
| --- | --- |
| `essai-t13-1-ordre-et-jauge.png` | « Ordre du tour » (Wilson actif, Tour 3, le rôdeur caché sauté) et « Air restant » 6/10 ; la jauge secrète n'apparaît pas |
| `essai-t13-2-quatre-tuiles-impact.png` | Après « un peu plat » puis « plus impactante » : relief, lueurs à la teinte du thème, jauge critique (9/10) en rouge battant, minuteur sous la minute qui bat, chiffres calés sur la tuile |

## Essai de l'accueil des rôles et du code du meneur (T14, 24/11)

`e2e/accueilDeLaTablette.spec.ts` : profil jetable, code `4821` réglé au poste par son pont, « Fire » en client de
960 × 600 sans pont Electron, appairée comme par le QR.

| Fichier | Ce qu'il montre |
| --- | --- |
| `essai-t14-1-accueil-appairee.png` | L'accueil appairé : trois rôles, pas de code demandé tant que la tablette garde son appairage |
| `essai-t14-3-accueil-code-demande.png` | Après l'Écran de table : appairage oublié, « Code du meneur demandé », « Rôle actuel » sur l'Écran |
| `essai-t14-4-code-faux.png` | « Code incorrect. Encore 2 essais. » ; le pavé tient en 600 px, « Retour aux rôles » compris (resserré après une première capture) |
| `essai-t14-5-aide-au-mj.png` | Le bon code : l'Aide au MJ appairée, « Changer de rôle » en bas de la colonne |

## Essai complet sur la vraie Fire (T15, 25/11)

Instance jetable de GM-OS (`dist/`, port 4100, campagne Alien fictive, code `4821`), la vraie Fire en
Firefox 143 tenue en **portrait** (800 × 1280), gestes par ADB, captures d'écran de l'appareil.

| Fichier | Ce qu'il montre |
| --- | --- |
| `essai-t15-1-combat-tour-decale.png` | C2 : « Suivant » a fait avancer le poste au Rôdeur caché — mais la Fire surligne Wilson (**défaut 1**) |
| `essai-t15-2-jet-et-verdict.png` | C3 : jet lancé depuis la Fire, verdict « Réussite » — 9 dés pour 3 demandés (**défaut 2**, le Seuil lu comme équipement) |
| `essai-t15-3-m314-oriente-et-scan.png` | C6 : M314 à la table, cap 15° tourné sur la Fire, scan du poste reçu (1 écho, Énergie 4) |
| `essai-t15-4-ecran-de-table-suit-le-poste.png` | C10 : jauge 9/10 et Wilson actif, changés au poste sans geste sur la Fire |
| `essai-t15-5-dernier-role-rouvert.png` | C11 : Firefox arrêté de force puis rouvert sur l'accueil → l'Écran de table revient seul |
| `essai-t15-6-code-faux.png` | T14 sur l'appareil : « Code incorrect. Encore 2 essais. » |
| `essai-t15-7-vieux-jet-reaffiche.png` | Bon code → Aide au MJ, mais le jet d'un quart d'heure plus tôt réapparaît (**défaut 4**) |
| `essai-t15-8-portrait-sans-changer-de-role.png` | En portrait, barre du bas : pas de « Changer de rôle » (**défaut 3**) |
| `essai-t15-9-corrige-pas-de-vieux-jet.png` | Après correction et build : l'Aide au MJ s'ouvre sans ressortir le vieux jet ; « R1 · Rôdeur secret » |
| `essai-t15-10-corrige-cache-et-changer-de-role.png` | Le Rôdeur surligné, marqué « Caché aux joueurs » ; en portrait, « Changer de rôle » en haut |
| `essai-t15-11-corrige-trois-des.png` | Mode « Year Zero Engine » adopté seul : 3 dés demandés, 3 dés de base lancés |
