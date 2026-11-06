# Clip des mécanismes de Crimes — reprise Codex — 06/11/2026

David : « peux-tu faire un clips avec Playright les mécanismes particulier de Crime ».
Scénario `e2e/clipCrimes.spec.ts`, inspiré du clip Nephilim : curseur, surlignages,
légendes françaises et huit chapitres. Film sans voix ni musique, dans un profil jetable,
avec Léonce Varin, une affaire et des adversaires fictifs ; dés préparés pour les exemples.

## Produit

Film livré : **3 min 54, H.264, 1440 × 900**, `output/clips/crimes-mecanismes.mp4`, tournage WebM et rapports dans
`output/clips/crimes/`. Jet Potentiel GARDE, spécialisation et garde choisie ; dépassement ;
atteintes/récupération ; psychologie ; dossier d’enquête ; attaque et munitions ; contacts
et fortune ; tempérament et développement.

Pilote complet retrouvé dans `scratch/recette-pilotes/Crime_driver_gmos_complet.gmos-driver`,
copie identique conservée dans `output/clips/crimes/pilote/`. Son étiquette historique
est1.0.0 ; les blocs psychologie, enquête, contacts et création sont bien présents.
Aucun changement de pilote ou de code dans src/electron, aucune installation.
Services locaux en profil jetable déjà autorisés dans la conversation ; aucun profil
personnel ni sauvegarde de David utilisé. Pas de demande de commit/push pour le clip.

## Vérifié

Construction avant essais et lint du scénario réussis. Répétition complète accélérée réussie,
y compris le passage du coup de deux blessures à la carte Combat-OS « Physique3 ».
Tournage normal réussi, MP4 exporté sans chargement initial ; quinze images de scènes et dix-huit images du film relues, titres compris. Format et contrôle final du manuel consignés au rapport. Les assertions portent sur les fiches et indices réels du profil
de démonstration. Aucun essai physique du Hub ou arbitrage humain inventé.

## Reprendre

Ouvrir le MP4 à la livraison. Pour le refaire : `npm run build`, puis
`npx playwright test e2e/clipCrimes.spec.ts --reporter=list`.
`GMOS_PILOTE_CRIMES` remplace l’archive d’entrée ; `GMOS_SORTIE_CLIP` change la sortie.
`GMOS_CLIP_RAPIDE=1` sert uniquement aux répétitions, pas au film final.

## Ne pas repayer

- Le pilote indiqué par l’ancien manuel dans Export Dirvers/corriges n’était plus présent.
  L’archive complète est dans les fichiers de recette, sans lire les données personnelles.
- Tous les1 sont imposés ; la garde choisie et le dépassement sont des opérations distinctes.
  La spécialisation se retire avec l’option vide avant de changer d’exemple.
- « Recharger » inclut sa durée dans le nom du bouton : utiliser le préfixe, pas un nom exact.
- Le dossier se trouve dans la bibliothèque, Modifier la campagne, Indices. Les points
  se cumulent : Limier1→2 par le jet, puis3 par un gain du MJ, puis4 à la révélation de l’indice.
  Le film vérifie l’état privé puis public du magasin ; il ne rejoue pas les transports Hub.
- Après le coup de deux blessures, l’aperçu recalcule4 sur le Physique déjà réduit à3,
  alors que le reçu et les marques conservent2. Défaut consigné au registre §1bis,
  ancre `IssueDeLAttaque` dans `AttaqueDeCrimes.tsx`. Le film montre le calcul avant le coup,
  puis le suivi réel sur Combat-OS ; aucun masquage de données ni correctif source dans ce lot.
- Pour corriger ce défaut plus tard, demander à David si GM-OS tourne avant de modifier src/.
- Les notes et sorties Nephilim du05/11 sont aussi les nôtres et restent non commitées.
  Préserver export RuneQuest, guides10/12/82/83, .codex/, autres exports et traces préexistantes.

**48 fichiers de livraison modifiés ou nouveaux, non commités**, listés dans
[le manifeste](../../output/clips/crimes/fichiers-de-livraison.json). Les 36 tests finaux du manuel
passent ; diff --check propre. Aucun reste pour le clip ; défaut d’aperçu distinct au §1bis.
