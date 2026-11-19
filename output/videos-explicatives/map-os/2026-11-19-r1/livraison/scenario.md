# Map-OS — déroulé

## reperes

Map-OS s’appelle Cartographie dans la barre latérale.

Geste (mj) : Repérer les trois parties de l’écran.

Plan de recette et campagne Orphée. Aucun personnage personnel.

Attendu : En-tête, barre de jeu et réglages disponibles.

## importer

Importer Média ouvre la bibliothèque d’images et de vidéos.

Geste (mj) : Importer et sélectionner le plan de recette.

Utiliser charge le plan ; Échap ferme la bibliothèque.

Attendu : Image 960 × 640 chargée, aucune projection.

## grille

La taille de grille se règle en pixels de l’image.

Geste (mj) : Activer et régler la grille.

40 pixels par case et opacité 40 %. Le bouton blanc réinitialise la couleur.

Attendu : Grille active, taille 40, couleur #ffffff, opacité 0,4.

## navigation

La molette zoome ; le bouton central déplace la vue.

Geste (mj) : Zoomer, déplacer puis recadrer.

Recadrer la Vue ajuste de nouveau le plan à l’écran.

Attendu : Zoom et cadrage changés puis réajustés.

## acteurs

Les pions viennent des combattants de Combat-OS.

Geste (mj) : Invoquer la rencontre de recette avec Eli et Tor.

Deux acteurs pour le plateau. Aucun jet de combat dans ce parcours.

Attendu : Deux combattants liés, Santé inchangée.

## pions-poser

Le bouton + pose un combattant sur la carte.

Geste (mj) : Ajouter les deux pions puis les espacer.

Le pion est lié au combattant ; les positions se règlent ici.

Attendu : Deux pions liés à Eli et Tor.

## ouvrir-hub

Le bouton Player Hub ouvre la vue de la table.

Geste (mj) : Ouvrir le vrai Player Hub local.

Deux fenêtres réelles : meneur et joueurs.

Attendu : Fenêtre Hub ouverte avec son propre enregistrement.

## projeter

Projeter la Carte propose le Hub ou les moniteurs.

Geste (mj) : Choisir Synchroniser Player Hub.

L’en-tête confirme la projection vers le Player Hub.

Attendu : Carte et état projetés reçus par le Hub.

## hub-noir

Une carte jamais explorée reste noire côté joueurs.

Geste (hub) : Observer le vrai Hub avant toute révélation.

Le brouillard est opaque ; le meneur distingue le plan à travers.

Attendu : Brouillard opaque rendu dans le Hub.

## calque-fog

Éteindre votre calque de brouillard aide à préparer.

Geste (mj) : Masquer uniquement le calque du meneur.

Le plan est dégagé chez vous. Le Hub reste dans le noir.

Attendu : Calque MJ éteint ; brouillard projeté inchangé.

## reveler-zone

Révéler + Zone dégage une pièce par rectangle.

Geste (mj) : Rallumer le calque puis révéler une zone et confirmer.

Le rectangle est ouvert. Aucun calcul de murs ou de ligne de vue.

Attendu : Pixels du brouillard effacés dans la zone dessinée.

## hub-revele

Comparons la zone révélée sur la vue des joueurs.

Geste (hub) : Cadrer le plateau du Hub.

La pièce est visible ; le reste demeure opaque.

Attendu : Zone transparente et noir extérieur dans le vrai Hub.

## pinceau

Le Pinceau permet de suivre un couloir à main levée.

Geste (mj) : Révéler un passage au pinceau.

Le tracé retire le brouillard sans ouvrir les pièces voisines.

Attendu : Brouillard modifié par le geste libre.

## masquer-rond

Masquer remet du brouillard ; Rond fixe un rayon.

Geste (mj) : Refermer une partie du passage et confirmer.

Ce geste corrige la visibilité, sans déplacer les pions.

Attendu : Cercle opaque ajouté, pions conservés.

## tout-masquer

Tout masquer agit sur l’ensemble de la carte.

Geste (mj) : Confirmer le masquage intégral.

Les zones explorées sont refermées pour la table.

Attendu : Brouillard opaque sur toute la carte.

## ping-joueur

Le joueur peut signaler un point même dans le noir.

Geste (hub) : Cliquer sur le plateau du Hub pour envoyer un ping.

Le ping est éphémère. Il ne révèle pas la carte.

Attendu : Ping réel reçu par le meneur, brouillard inchangé.

## tout-reveler

Tout révéler montre l’intégralité du plan aux joueurs.

Geste (mj) : Confirmer la révélation complète.

En partie, ce geste sensible est protégé par le régime Table.

Attendu : Brouillard transparent et projection complète.

## deplacer-mj

Pions sélectionné : glissez le pion d’Eli sur le plateau.

Geste (mj) : Déplacer Eli côté meneur.

La grille sert de repère ; aucun coût de mouvement n’est débité.

Attendu : Position d’Eli modifiée et reçue par le Hub.

## cacher-tor

Activez l’œil de Tor avec Espace, puis relancez la projection.

Geste (mj) : Cacher Tor avec Espace puis vérifier la projection relancée.

Tor reste grisé chez le meneur, même sur une zone révélée.

Attendu : Tor isVisible false, présent dans les données de la carte.

## hub-cache

Vérifions la différence sur le vrai Hub.

Geste (hub) : Observer le pion d’Eli et l’absence de Tor.

Tor est caché par son réglage, et non par le brouillard.

Attendu : Pion Tor non affiché, Eli visible.

## montrer-tor

Rétablissez Tor avec Espace et relancez la projection.

Geste (mj) : Rendre le pion de Tor visible.

La visibilité du pion et le brouillard sont deux commandes distinctes.

Attendu : Tor à nouveau visible dans le Hub.

## deplacer-hub

Sur le Player Hub, un pion visible peut être déplacé.

Geste (hub) : Déplacer Tor depuis la vue joueur.

Même un adversaire peut être déplacé : la confiance de table compte.

Attendu : Nouvelle position reçue côté meneur.

## tour-combat

Suivant fait avancer le tour sans quitter la carte.

Geste (mj) : Avancer le tour et observer le retour spécifique à Alien.

Avec Alien, Précédent renvoie au choix d’une carte d’initiative.

Attendu : Index avancé ; retour Alien signalé, positions et combattants conservés.

## retirer-pion

Attention : le clic droit supprime directement le pion.

Geste (mj) : Retirer Tor de la carte puis le reposer avec +.

Le combattant reste dans Combat-OS. Ce geste ne le supprime pas.

Attendu : Pion retiré puis ajouté, liste des combattants inchangée.

## magie-sphere

Magie propose sept styles et quatre formes.

Geste (mj) : Dessiner une sphère de feu.

C’est une annotation visuelle : aucun dégât automatique n’est appliqué.

Attendu : Un effet circulaire de feu présent ; Santé inchangée.

## magie-cone

Pour un cône ou une ligne, le glissement donne la direction.

Geste (mj) : Dessiner un cône d’Arcane orienté.

Le second effet conserve sa forme, sa taille et son orientation.

Attendu : Deux effets, cône orienté selon le glissement.

## retirer-magie

Clic droit avec Magie retire un effet proche.

Geste (mj) : Retirer la sphère de feu.

La liste des effets permet aussi une suppression précise.

Attendu : Sphère retirée, cône conservé.

## meteo

Pluie, neige et brume habillent la carte.

Geste (mj) : Choisir la pluie, son intensité et la nuit.

La brume atmosphérique est distincte du brouillard de guerre.

Attendu : Pluie à 50 %, moment Nuit, état projeté synchronisé.

## hub-ambiance

La météo et la teinte de nuit suivent la projection.

Geste (hub) : Observer leur effet sur le Hub.

Ces effets d’ambiance ne changent pas les zones explorées.

Attendu : Pluie et teinte présentes, brouillard inchangé.

## calques-locaux

Le calque Pions & Acteurs peut dégager la vue du meneur.

Geste (mj) : Éteindre puis rallumer Pions & Acteurs côté meneur.

Les pions du Hub restent affichés pendant cette préparation.

Attendu : Calque local sans suppression des pions projetés.

## calques-partages

Pour couper l’ambiance du Hub, choisissez Aucun et Jour.

Geste (mj) : Comparer les calques locaux, puis couper météo et teinte à la source.

Pendant cet essai, les calques locaux seuls n’ont pas coupé l’ambiance du Hub.

Attendu : Calques locaux non transmis ; paramètres Aucun et Jour reçus par le Hub.

## modele-zone

Gérer les Modèles prépare des zones réutilisables.

Geste (mj) : Créer un modèle Gravats, terrain difficile à coût ×2.

Nom, couleur et propriétés sont conservés dans le modèle.

Attendu : Modèle MAP-OS — Gravats, terrain difficile, coût 2.

## danger

Danger pose une zone issue du modèle choisi.

Geste (mj) : Dessiner la zone Gravats puis y déplacer Eli.

La zone repère les pions à l’intérieur. Aucun dégât automatique.

Attendu : Zone liée au modèle, coût 2, Eli dans activeTokenIds.

## formes-limite

Limite constatée : la forme choisie n’est pas toujours appliquée.

Geste (mj) : Choisir Zone Rectangulaire et dessiner une seconde zone.

Dans cette version, la zone créée reste circulaire.

Attendu : UI rectangulaire, zone réelle de type circle.

## sauver-config

Sauver l’état capture une configuration complète.

Geste (mj) : Nommer et sauver la configuration du plateau.

Plan, brouillard, pions, zones, magie, grille et ambiance sont inclus.

Attendu : Preset complet nommé MAP-OS — Atelier préparé.

## zones-sur-noir

Ne comptez pas sur le brouillard pour cacher une zone de danger.

Geste (mj) : Masquer de nouveau toute la carte.

Le plan redevient opaque ; comparons maintenant le Hub.

Attendu : Brouillard opaque, zones de danger toujours présentes.

## hub-zones-noir

Voici la limite de superposition observée sur le Hub.

Geste (hub) : Observer les zones de danger sur le noir.

Les zones restent visibles. Elles ne conviennent pas aux pièges secrets.

Attendu : Zones visibles au-dessus du brouillard opaque.

## changer-carte

Charger une autre image ne remplace pas toute la configuration.

Geste (mj) : Importer et choisir le plan Pont Nord.

Son brouillard démarre en noir. Pions et zones restent en place.

Attendu : Nouvelle image, brouillard vierge, autres éléments conservés.

## revenir-carte

Le brouillard est enregistré sous l’identifiant du média.

Geste (mj) : Revenir à l’image Atelier des Quais.

Elle retrouve son dernier masquage, indépendamment du Pont Nord.

Attendu : Image d’origine et son brouillard retrouvés.

## charger-config

Charger une configuration remplace l’état courant, après confirmation.

Geste (mj) : Charger Atelier préparé.

L’état capturé revient, y compris son brouillard et ses effets.

Attendu : État actuel comparé aux valeurs du preset.

## recharger

La recharge teste ce qui persiste, sans garder la projection.

Geste (mj) : Recharger puis revenir à Cartographie.

Pions et zones restent. Magie effacée, brouillard noir ; projection arrêtée.

Attendu : Preset et état persistant retrouvés, magie vide, brouillard opaque et projection arrêtée.

## restaurer-effet

Le preset conserve les effets même après rechargement.

Geste (mj) : Charger Atelier préparé de nouveau.

Le cône d’Arcane revient avec les autres réglages sauvés.

Attendu : Effet magique et positions restaurés par le preset.

## video-audio

Carte vidéo : relancez la projection, puis réglez l’audio.

Geste (mj) : Relancer la projection, importer la vidéo et régler volume et coupure.

Le film reste sans son. La sortie physique n’est pas testée.

Attendu : Vidéo chargée sur les deux vues, volume 30 %, coupure synchronisée.

## couper-projection

Arrêter la Projection rend la main au décor du Hub.

Geste (mj) : Couper la projection de la carte.

Le plateau du meneur est conservé ; il n’est plus diffusé.

Attendu : Projection nulle et carte absente du Hub.

## entrees-ia

Vision de l’Oracle et Cortex Tactique utilisent l’IA.

Geste (mj) : Repérer leurs deux entrées dans l’interface.

Ces appels externes ne sont pas exécutés dans cette démonstration.

Attendu : Deux boutons repérés, aucune génération inventée.

## bilan

Préparez, projetez, vérifiez le Hub, puis sauvez votre configuration.

Geste (mj) : Revenir au plateau préparé pour conclure.

Cartes, campagne de test, transcription et chapitres accompagnent le film.

Attendu : Plateau restauré, projection arrêtée et états finaux consignés.