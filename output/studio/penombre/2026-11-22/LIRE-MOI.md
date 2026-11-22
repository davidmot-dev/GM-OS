# Pénombre — GM-OS Studio

Livraison du 22 novembre 2026 : thème, fiche de personnage standard, bannière et identité visuelle. Les quatre livrables sont préparés et déposés dans le dépôt ; aucun pilote ou réglage de l’application n’a été modifié.

## Les quatre fichiers

- **Thème** : `theme/theme.css` et tous ses assets voisins dans le ZIP. Dépôt réel : `docs/systems/penombre/theme/`. Vélin clair, encre brun-rouge, cadre vert d’ombre, trois ornements, quinze icônes et une matière SVG. Conserver l’arborescence complète.
- **Fiche** : `fiche/Penombre-fiche-standard-interactive.html`. Dépôt réel : `docs/fiches/Pénombre/`. Une page paysage, fidèle au PDF standard ; HTML autonome portant le manifeste `penombre-standard-fr`, 106 zones et 69 clés stables.
- **Bannière** : `Penombre Band.jpg`, déposée sous `docs/systems/penombre/`. 2400 × 600 px, 268 793 octets. Éditeur du pilote → Bannière de l’en-tête → choisir ce fichier.
- **Identité** : `identite-visuelle.txt`. Copier STYLE et AVOID dans les deux champs du pilote destinés aux images. La peinture, le grain, les couleurs et la lumière décrivent un rendu ; le sujet vient séparément.

## Bloc d’identité prêt à copier

```text
STYLE: richly layered traditional fantasy painting, visible brushwork, fine canvas grain, Renaissance and baroque ornament, muted teal and umber palette, restrained antique gold, smoky crimson accents, warm and cool chiaroscuro, soft atmospheric depth, aged surfaces, intricate engraved details, poetic theatrical mood
AVOID: photorealism, cartoon, manga, glossy 3D, neon saturation, flat lighting, readable text, watermarks
```

## Fiche de personnage

Source choisie : **Feuille de personnage standard WEB.pdf**, une page paysage. L’autre extrait contient cette fiche tournée et la feuille collégiale ; la feuille collégiale n’est pas ajoutée à une fiche de personnage. Les fonds et illustrations du PDF sont conservés ; les saisies restent transparentes. Les cinq harmoniques, neuf atouts, quatre pouvoirs, deux maîtrises magiques, trois potentiels, timbre, partition, Peste, Conscience et quatre complications sont interactifs. Aucun espace de portrait n’est imprimé et aucun n’est inventé.

Timbre : choix exclusif ; partition : clé et quatre notes indépendantes ; dés d’atout, complications et Conscience : pistes cumulatives. Le dernier repère sélectionné peut être recliqué pour effacer la piste. Le maximum de Conscience, les potentiels et niveaux restent manuels. La piste de Conscience compte les jetons ; elle ne modélise pas les faces actives et inactives. Aucun calcul de règles ou état par défaut n’est imposé.

Zoom 20–400 %, Ctrl+molette et raccourcis ; mode Zones ; sauvegarde locale, export/import JSON, réinitialisation confirmée et impression paysage. Fonctionne hors ligne. Les données d’essai visibles sur les captures sont fictives et ne sont pas préremplies dans le HTML.

**Raccordement GM-OS à effectuer séparément** : le modèle est nouveau, absent des modèles intégrés du moteur, et aucune correspondance ne relie encore ses 69 clés au pilote. Le manifeste permet son import comme modèle, mais une synchronisation des valeurs avec le pilote demande l’intégration du gabarit et la table de correspondance. Les deux avertissements du validateur décrivent exactement ces étapes ; aucune synchronisation testée ou annoncée.

## Contrôles et limites

- Thème accepté : **0 erreur, 0 avertissement**. Texte/fond : **10,73:1**, texte/panneau : **11,75:1** ; au pire point de matière : **9,40:1** et **10,32:1**. Accent/fond : **5,40:1**, texte sur accent : **6,39:1**. Tous les minima du contrat sont respectés, y compris les états sur la matière (minimum observé **3,28:1**).
- Fiche acceptée : **0 erreur, 2 avertissements d’intégration** décrits ci-dessus. **29 contrôles fonctionnels réussis** dans Edge hors ligne, dont aller-retour des 69 clés, restauration après rechargement, pistes, saisie tactile émulée à 768 px, zoom et format d’impression. Aucune erreur JavaScript ou requête réseau. Ce n’est pas une recette Electron ou sur tablette physique.
- La relecture visuelle compare le PDF aux captures vierge, remplie, Zones et impression. Un défaut de transparence du premier rendu PDF.js a été corrigé en utilisant PDFium pour le fond ; les cercles d’harmoniques restent clairs comme dans le PDF.
- Bannière générée depuis les références picturales fournies. Les deux rendus obtenus mesurent 2172 × 724 px malgré les demandes de plus haute définition. Recadrage central en 2172 × 543, puis agrandissement Lanczos de **10,5 % accepté par David le 22/11/2026**, vers 2400 × 600. Aucun détail supplémentaire prétendu. Aperçus complets et en en-tête 1188 × 54 / 390 × 54 examinés, sans texte parasite ni personnage au premier plan.
- IM Fell English SC approche la typographie de titre sans reproduire le lettrage du livre. Import Google Fonts autorisé par le contrat ; repli Georgia hors ligne. La maquette du thème est une simulation locale avec ce repli, pas une capture de GM-OS.

Le ZIP contient aussi les invites, rapports et aperçus ; les PDF sources ne sont pas recopiés. Aucune installation, aucun service réseau, aucune donnée utilisateur ou écriture Git.
