# Clip COC et joueur tactile — 3 min 52

[MP4](../coc-mecanismes-et-tablette.mp4) · [WebM monté](../coc-mecanismes-et-tablette.webm) · [Huit chapitres](chapitres.md)

Demandé par David et filmé avec Playwright le 06/11/2026. H.264, 1440×900 ; curseur,
surlignages et légendes françaises, sans voix ni musique. Amelia Steele, Victor Marlowe et
leurs adversaires sont fictifs, avec des valeurs d’exercice et dés préparés dans un profil jetable.

test d20, conditions et dés bonus/malus ; héros après test et DEF héroïque consommée ; Voie de Furtivité référencée et rang acquis ; choc de rang2, Enragé, Fascination et Blues conservé ; Figurant Pulp et bande ; critique fixe, RD et conséquence de santé ; joueur tactile sur le Hub ; réception MJ et fiche HTML synchronisée.

Vrai Hub HTTP/WebSocket dans un navigateur Edge jetable, contexte mobile/tactile, écran768×1024 sans appBridge ; 8 événements touchstart reçus. Choix de Furtif, jet reçu au MJ, héros11→10, puis échelle9 enregistrée depuis la fiche HTML et reçue chez le meneur. Le cadre de tournage affiche les réceptions après assertions sur les magasins réels ; aucune fausse interface Hub.

Le catalogue ne contient aucun module indépendant dédié à COC. Les outils de la fiche,
Combat-OS, Dice-OS et du Hub sont filmés. Pilote2.2.0 d20 copié à l’identique dans pilote/
depuis Export Dirvers/corriges/coc/ ; aucun réimport nécessaire pour le film.

Sélection de mécanismes, sans recette exhaustive : variante3d6, tous les états/Voies, Légende, poursuites, soins et thérapie, import/rechargement non rejoués. Valeurs et dés d’exercice préparés. Le résultat de CON du guetteur est renseigné comme joué à la table. Aucun appareil physique utilisé.

Build, lint, répétition et tournage normal réussis ; assertions sur les fiches et les échanges ;
seize scènes et vingt-deux images du MP4 relues, raccords compris. Rapports : verification.json
et controle-video.json. Les deux tournages bruts et montage.json sont conservés ici.
Aucun profil personnel, paquet installé ou code applicatif modifié ; aucun commit/push demandé.

Pour refaire : npm run build puis npx playwright test e2e/clipCoc.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 sert aux répétitions, jamais au film final.
Pour remonter les bruts : node outils/clips/monter_clip_coc.mjs output/clips/coc/tournage-mj.webm output/clips/coc/tournage-tablette.webm output/clips output/clips/coc/montage.json.
