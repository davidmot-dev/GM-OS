# Clip des mécanismes de Nephilim — reprise Codex — 05/11/2026

David : « peux-tu faire un clips avec Playright les mécanismes particulier de Nephilim ».
Scénario `e2e/clipNephilim.spec.ts`, inspiré des clips RuneQuest et Shadowrun : curseur,
surlignages, sous-titres français, huit chapitres et export MP4 par FFmpeg déjà installé.
Pilote Nephilim2.0.0 de `output/campagnes-tests/nephilim/`, personnage fictif Aster,
sort/invocation/formule de démonstration identifiés comme fictifs.

## Produit

Film : **3 min 29, H.264, 1440 × 900**, dans `output/clips/nephilim-mecanismes.mp4`, et tournage WebM. Rapport, images et repères
dans `output/clips/nephilim/`. La vidéo montre les fonctions existantes du pilote ;
aucune modification applicative dans src/ ou electron/, aucun paquet installé.
Services locaux et instance Electron jetable déjà autorisés dans la conversation ;
aucun profil personnel ni sauvegarde de David utilisé.

Chapitres : Vécus/Mnémos, métamorphe/Seuil RK, Magie/Stase/critique/Sacrifice, pacte de Kabbale,
Alchimie/Materiae Primae, lieu/Conjonction/Traque, santé/Conséquences, Chutes/Stase/expérience.
Les dés sont préparés pour les exemples. Pas de voix ni de musique.
La montée immédiate de l’Intensité de Traque est présentée comme le choix de David,
distinct de l’aube indiquée dans l’errata. Pas de démonstration de tablette physique.

## Vérifications

Construction avant les essais et lint du scénario réussis. Répétition complète accélérée
réussie ; tournage normal réussi, MP4 exporté sans chargement initial, douze images de scènes et dix-huit images du film relues, titres de début et de fin compris.
Les assertions vérifient les dépenses et changements réels des fiches/réserves,
pas seulement les textes des légendes. Manuel, synthèse et registre §216 à jour ; 36 tests finaux du manuel réussis, diff --check propre.

## Reprendre

Ouvrir le MP4 livré. Pour le refaire : `npm run build`, puis
`npx playwright test e2e/clipNephilim.spec.ts --reporter=list`.
`GMOS_SORTIE_CLIP` change la destination ; `GMOS_PILOTE_NEPHILIM` change l’archive d’entrée.
`GMOS_CLIP_RAPIDE=1` sert seulement à répéter : ne pas le conserver pour le film final.
Aucun commit/push demandé pour ce nouveau clip.

## Ne pas repayer

- Les menus Sort/Formule se repèrent par leur option de champ stable ; le libellé visuel
  n’est pas un label HTML associé. Vider le sort avant de passer à la Kabbale.
- Le dépassement RK est strict : approche5 contre seuil4. Les bonus du lieu et de la
  conjonction au jet ne transforment pas automatiquement cette valeur d’approche.
- Bandeau replié sur deux lignes et espace pour les sous-titres dans le seul profil filmé,
  pour éviter le défilement horizontal et les cartes masquées. Aucune règle modifiée.
- Le profil et la vidéo brute passent par os.tmpdir ; vérifier le chemin absolu avant
  nettoyage, fermer Electron avant de lire la vidéo, copier celle-ci avant de supprimer le temporaire.
- Le registre possède d’autres tableaux avec une ligne150 : cibler le tableau de la vue
  d’ensemble, jamais une première correspondance globale. Le clip corrige notre erreur
  précédente : rétablit « Lampe150 : 0 % » et met la validation COC sur sa vraie ligne150.
- Changements étrangers conservés : export RuneQuest, guides10/12/82/83, .codex/, autres
  exports, docs/Reference/, clips et traces précédents. Aucun commit effectué pour ce clip.

**44 fichiers de livraison modifiés ou nouveaux, non commités**, listés dans
[le manifeste](../../output/clips/nephilim/fichiers-de-livraison.json). Aucun reste pour le clip.
