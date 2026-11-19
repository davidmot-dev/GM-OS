# Map-OS — périmètre et contrôles pédagogiques

La demande porte sur le module cartographique natif en détail. Les chapitres du plugin consacrés aux règles d'un pilote sont donc adaptés au plateau : préparation, projection, brouillard, pions, effets, zones, configurations et bilan. Le contexte Alien 1.11.0 ne sert qu'à obtenir deux combattants réels de la recette Orphée. Aucun jet, calcul de blessure ou combat complet de ce jeu n'est promis dans ce film.

## Sources et préparation

Les guides 22 et 23 ont été recoupés avec les composants et magasins actuels : leurs descriptions du clic droit sur un pion, de la sauvegarde des configurations et du masquage des zones ne sont pas toutes à jour. Les observations du film priment sur une description ancienne non reproduite.

La campagne de tournage est une copie distincte de la recette déjà migrée vers Alien 1.11.0. Son import est vérifié par le véritable Nexus et la construction d'une sauvegarde validée ; les autres voyageurs conservent leurs données. Deux plans schématiques originaux et une vidéo silencieuse d'exemple sont importés par la bibliothèque réelle. Aucun livre ni donnée personnelle n'est utilisé comme carte.

Le build existant du 19 novembre à 14h39 est copié dans `build-fixe/`. Le launcher officiel est copié en conservant toutes ses protections ; seuls la racine du dépôt et le point d'entrée sont adaptés pour lancer cette copie. Les deux fenêtres enregistrées sont le meneur et son Player Hub natif. Un navigateur ouvert directement sur l'URL `?window=hub` n'est pas présenté comme un client synchronisé : ce repérage n'a pas reçu la carte et n'est pas livré.

## Rythme et lecture

Préférence de David retenue après Alien : textes courts à 125 mots/minute et 14 caractères/seconde au maximum ; minimum de lecture 5 s plus installation 0,8 s et marge 1,2 s, soit au moins 7 s par carte. Avant le geste : 1 s ; stabilisation : 0,7 s ; observation après : 2,5 s. Les gestes gardent leur vitesse réelle, sans accéléré au montage. Trois lignes et 46 caractères par ligne au maximum ; bande de textes ajoutée sous l'interface. Le plugin global n'est pas modifié.

## Frontières vérifiées dans le parcours

- Importer puis **Utiliser** charge le média, sans fermer automatiquement la bibliothèque ; **Échap** la ferme. Le plan demeure privé jusqu'à l'action de projection.
- Grille : activation, taille 40 px, opacité 40 %, remise au blanc. La commande de couleur est repérée ; le sélecteur natif de couleur n'est pas utilisé pour inventer un changement non filmable.
- Zoom à la molette, panoramique au bouton central, puis recadrage réel ; la vue du Hub conserve son ajustement propre.
- Deux combattants invoqués par une rencontre réelle, puis posés avec **+**. Les glissements modifient les positions, sans débiter de mouvement de règles.
- Carte vierge noire sur le Hub ; calque du meneur désactivé sans révélation au joueur ; rectangle, pinceau et cercle de masquage ; confirmations globales. Les pixels alpha du véritable canevas de brouillard sont contrôlés, pas seulement un drapeau du magasin.
- Ping envoyé par le Hub, reçu au meneur sans modification du brouillard. Il disparaît après environ trois secondes ; sa preuve ponctuelle est conservée. Le texte après peut rester affiché après sa disparition.
- Visibilité : l'œil est activé au clavier avec **Espace** ; le clic pointeur peut être absorbé par la capture de glissement du pion. Une relance explicite de la projection accompagne le changement de visibilité, puis la présence effective du pion dans le Hub est vérifiée. Le simple changement de `tokens.isVisible` au meneur ne suffit pas à certifier la vue des joueurs.
- Déplacement réel depuis le Hub et réception au meneur ; Suivant sur la carte ; avec Alien, Précédent renvoie explicitement au choix d’une carte d’initiative et conserve le tour ; clic droit de suppression puis ajout de nouveau. La liste de Combat-OS reste intacte.
- Sphère de feu, cône d'Arcane orienté, retrait d'un effet. Les valeurs de Santé ne changent pas : aucune résolution automatique des règles.
- Pluie, intensité et nuit reçues au Hub. Les bascules locales météo/heure ne lui sont pas transmises dans cet essai : les valeurs Aucun et Jour y coupent réellement l'ambiance.
- Modèle de terrain difficile créé dans l'éditeur, couleur et coût ×2 ; zone posée depuis ce modèle et présence d'Eli dans la zone contrôlée. Aucun identifiant de matériel externe n'est affecté au modèle de recette.
- Configuration complète sauvée et rechargée après confirmation ; changement d'image avec conservation des autres éléments ; brouillard retrouvé sous l'identifiant du média. Le rechargement conserve pions, zones et configurations, mais arrête la projection, vide la magie et rend ici le brouillard opaque. Recharger le preset restaure les effets et son brouillard révélé.
- Projection relancée après recharge, carte vidéo importée et commandes de volume/coupure actionnées ; diffusion arrêtée sans retirer le plateau du meneur. Aucun son physique n'est démontré.

## Limites constatées et exclusions

La suppression de la sphère est vérifiée côté meneur (séquence 27). La vue native du Hub en séquence 29 affiche encore la sphère orange : la disparition immédiate côté joueurs n’est donc pas démontrée. Contrôler le Hub et, si nécessaire, relancer sa projection avant de considérer un effet retiré de la table.

Le choix **Zone Rectangulaire** dans Danger reste un cercle dans le résultat actuel : les réglages sont écrits dans `useMapUIStore` tandis que le tracé lit une autre valeur dans `useMapStore`. Le film le montre au lieu de lui attribuer une réussite.

Les zones sont rendues au-dessus du brouillard dans le Player Hub (`z-25` contre `z-20`) : elles peuvent révéler leur emplacement sur une carte entièrement noire. Ne pas utiliser ces zones comme des pièges secrets. Les effets magiques, eux, ont un calque distinct sous le brouillard.

L'attribution d'une aura à un porteur et son suivi ne sont pas démontrés. Les quatre formes sont proposées dans l'interface mais ne sont pas certifiées opérationnelles par leur seule présence. Hue, sorties audio physiques, moniteur externe, tablette physique et appels IA ne sont pas exécutés. Vision de l'Oracle et Cortex Tactique sont repérés sans texte généré de substitution. La protection du régime Table est décrite depuis son code ; le parcours principal reste en Atelier.

Le MP4 définitif et ses contrôles sont consignés après montage dans `controle-final.json`. Une revue d'images et des calculs de durée ne constituent pas un visionnage humain continu ni une certification humaine du confort de lecture. Aucun essai n'est attribué à David.

## Contrôle de livraison du 19 novembre

Prise normale complète : 46/46 séquences, test Playwright passé en 19,1 min. Film : 18 min 42,48 s, 13 chapitres, 92 cartes, H.264 sans audio ; décodage intégral réussi. Revue IA des 16 planches de textes et de 20 vues complètes du MP4 final, dont le ping à 350,6615 s. Les légendes sont lisibles et sous l’interface. Aucun visionnage humain continu ni essai attribué à David. Voir `controle-final.json` pour les images et empreintes exactes.
