# GUIDE TECHNIQUE — Modélisation de fiches de JdR en HTML interactif

Ce document est un référentiel technique pour le GPT « Character Sheet HTML Studio ».  
Le comportement obligatoire du GPT reste défini dans le champ **Instructions** du GPT.  
Ce guide précise les méthodes, composants, conventions et contrôles qualité à appliquer.

## 1. Objectif

Transformer une fiche de personnage fournie en PDF en un fichier HTML interactif autonome, fidèle visuellement au document original.

Le PDF est la référence graphique absolue. L'objectif n'est pas de moderniser ni de réinterpréter la fiche, mais de rendre le document original interactif.

Méthode privilégiée :
1. rendre chaque page du PDF en image de haute qualité ;
2. utiliser cette image comme fond ;
3. superposer des contrôles HTML transparents et précisément positionnés ;
4. intégrer les interactions, calculs, sauvegarde, import/export JSON, zoom et impression ;
5. livrer un fichier `.html` autonome.

## 2. Analyse visuelle

Toujours examiner toutes les pages avant de coder.

Pour chaque page :
- identifier les zones de texte ;
- identifier les champs numériques ;
- repérer les lignes vierges ;
- repérer les cases à cocher et choix exclusifs ;
- repérer les jauges, pistes, cercles ou séries de nombres ;
- repérer les tableaux et structures répétitives ;
- repérer les zones de portrait ;
- repérer les champs personnalisables ;
- repérer les valeurs calculées ;
- noter les comportements spécifiques visibles sur la fiche.

Ne pas dépendre uniquement de l'extraction de texte du PDF. L'analyse visuelle prime.

## 3. Architecture HTML recommandée

Chaque page possède un conteneur de dimensions fixes correspondant au rendu natif.

Exemple :

```css
.page {
  position: relative;
  width: 1024px;
  height: 1448px;
}
.page-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.field {
  position: absolute;
}
```

Les champs utilisent des coordonnées natives indépendantes du zoom.

Le zoom doit agir sur le conteneur de page via transformation CSS, jamais en modifiant les coordonnées stockées.

## 4. Types de composants

### Texte simple
Utiliser `<input type="text">`.

Exemples :
- nom ;
- joueur ;
- occupation ;
- âge ;
- sexe ;
- résidence ;
- origine.

### Nombre
Utiliser un champ numérique ou texte filtré selon le rendu visuel.

Exemples :
- caractéristiques ;
- compétences ;
- PV ;
- armure ;
- dégâts.

### Texte multiligne
Utiliser `<textarea>`.

Exemples :
- description ;
- notes ;
- historique ;
- relations ;
- équipement long.

### Checkbox
Utiliser une case transparente ou un overlay cliquable.

### Radio / choix exclusif
Si une seule option doit être active dans un groupe, utiliser une logique radio.

### Portrait
Permettre :
- sélection d'une image locale ;
- affichage dans le cadre ;
- `object-fit: cover` ou `contain` selon le document ;
- remplacement ;
- suppression.

### Jauge / tracker
Pour une série imprimée de cases, cercles ou nombres, préférer des zones cliquables directement sur les éléments imprimés.

Exemples :
- SAN 1–100 ;
- Chance 1–100 ;
- Stress 0–10 ;
- PV 0–20 ;
- PM ;
- expérience ;
- radiation.

Un clic sur une valeur doit mettre à jour l'état.

### Tableaux
Respecter exactement les colonnes et les lignes du PDF.

Les champs de chaque ligne doivent rester alignés avec le fond original.

### Champs personnalisables
Si le PDF prévoit des lignes vierges pour ajouter des compétences, armes ou langues :
- rendre le libellé éditable ;
- rendre la valeur éditable ;
- conserver les colonnes associées.

## 5. Apparence des overlays

En mode normal :
- fond transparent ;
- bordure invisible ;
- texte lisible ;
- aucune carte, panneau ou style web décoratif ajouté.

Au focus :
- autoriser une bordure légère ou un fond très discret.

Le contrôle ne doit pas masquer les éléments imprimés du PDF.

## 6. Positionnement

Positionner chaque zone à partir de l'image rendue du PDF.

Privilégier la précision à la vitesse.

Vérifier particulièrement :
- lignes de texte ;
- colonnes ;
- petites cases ;
- tableaux ;
- champs très rapprochés ;
- séries de compétences ;
- éléments proches des marges.

Prévoir un mode `Zones` qui affiche les contours des overlays afin de contrôler le placement.

## 7. Calculs automatiques

Ne jamais inventer de règles.

Ajouter un calcul seulement si :
- il est explicitement imprimé sur la fiche ;
- il est fourni par l'utilisateur ;
- il figure dans un document de référence fourni.

Exemple Cthulhu 7 :
- Majeur = floor(valeur / 2)
- Extrême = floor(valeur / 5)

Les champs calculés doivent se mettre à jour immédiatement.

## 8. Zoom

Chaque HTML final doit proposer :
- `−`
- valeur de zoom
- `+`
- `Ajuster`

Plage recommandée : 20 % à 400 %.

Raccourcis :
- Ctrl + molette ;
- Ctrl + `+` ;
- Ctrl + `-` ;
- Ctrl + `0` = Ajuster.

Le zoom ne doit pas modifier les coordonnées des champs.

## 9. Navigation multipage

Pour un PDF multipage :
- intégrer toutes les pages ;
- proposer Page précédente / suivante ou onglets ;
- conserver les données lors du changement ;
- permettre l'impression de toutes les pages ;
- insérer un saut de page à l'impression.

## 10. Sauvegarde locale

Utiliser `localStorage` lorsque disponible.

La clé doit être spécifique au modèle.

Sauvegarder après modification d'un champ.

Restaurer automatiquement les données au chargement.

Si le stockage est indisponible ou saturé, afficher un message clair et recommander l'export JSON.

## 11. Export JSON

Format recommandé :

```json
{
  "format": "interactive-character-sheet",
  "version": 1,
  "sheet": "nom-du-modele",
  "data": {}
}
```

Utiliser des clés stables et compréhensibles :

```text
identity.name
identity.occupation
attributes.strength
skills.library
weapons.0.damage
profile.description
```

## 12. Import JSON

À l'import :
- vérifier le format ;
- restaurer les clés reconnues ;
- ignorer proprement les clés inconnues ;
- rafraîchir les champs calculés ;
- mettre l'interface immédiatement à jour.

## 13. Réinitialisation

Toujours demander confirmation avant de supprimer toutes les données.

## 14. Impression

En mode impression :
- masquer toolbar et outils techniques ;
- afficher toutes les pages ;
- conserver les fonds ;
- respecter les proportions ;
- éviter les bordures de focus ;
- insérer un saut de page entre les feuilles.

## 15. HTML autonome

Le fichier livré doit fonctionner hors connexion.

Éviter :
- CDN ;
- scripts distants ;
- CSS externe ;
- images distantes.

Intégrer les fonds dans le HTML sous forme de Data URI lorsque possible.

## 16. Contrôle qualité obligatoire

Avant livraison :
1. vérifier toutes les pages ;
2. vérifier les champs d'identité ;
3. vérifier les caractéristiques ;
4. vérifier toutes les compétences ;
5. vérifier les tableaux ;
6. vérifier les jauges ;
7. vérifier les cases ;
8. vérifier les calculs ;
9. vérifier les portraits ;
10. vérifier le zoom ;
11. vérifier la navigation ;
12. vérifier le mode Zones ;
13. vérifier localStorage ;
14. vérifier export JSON ;
15. vérifier import JSON ;
16. vérifier réinitialisation ;
17. vérifier impression ;
18. vérifier l'absence d'erreur JavaScript évidente ;
19. vérifier que le HTML fonctionne sans réseau.

Si possible, produire une capture de contrôle avec le mode Zones et comparer visuellement au PDF.

## 17. Références de qualité

### Alien
Le couple PDF + HTML Alien sert de référence pour :
- placement extrêmement précis ;
- jauges ;
- petites cases ;
- feuille très graphique ;
- transparence des champs.

### Cthulhu 7 classique
Le couple PDF + HTML Cthulhu sert de référence pour :
- multipage ;
- nombreuses compétences ;
- trackers 1–100 ;
- calculs Majeur / Extrême ;
- portrait ;
- armes ;
- grandes zones de texte.

Pour toute nouvelle fiche, viser au minimum le même niveau de fidélité et d'interactivité.

## 18. Ce qu'il ne faut pas considérer comme une bonne modélisation

Mauvais résultat :
- nouvelle interface moderne inspirée de la fiche ;
- cartes ou panneaux qui remplacent le document ;
- champs approximatifs ;
- omission des lignes vierges ;
- jauges remplacées par de simples nombres ;
- une seule page sur un PDF multipage ;
- HTML nécessitant Internet ;
- simple extrait de code sans fichier final.

Bon résultat :
- le PDF original est immédiatement reconnaissable ;
- les contrôles semblent faire partie de la fiche ;
- le placement est précis ;
- les comportements respectent la logique imprimée ;
- le fichier HTML est directement utilisable.
