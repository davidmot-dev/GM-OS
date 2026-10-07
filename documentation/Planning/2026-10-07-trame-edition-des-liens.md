# Trame — options d'édition des liens

**Prévu et demandé le 07/10/2026, suite du chantier § 124.** David demande ensuite
**« implémente »**. Statut : inspecteur et styles construits, contrôles validés ;
essai de David encore attendu.
Le rendu en cartes et ses validations restent
décrits dans la [réalisation](2026-10-07-trame-cartes-realisation.md).

## Demandes de David

Après « c'est bien », David demande des options : « refaire les points de jonction,
travailler sur les traits, mettre un commentaire sur un lien, ou d'autres options ».
Il précise : « je voudrais aussi si possible pouvoir définir des lien en pointiller,
gras ou autre », puis **« oui prévoit la couleurs (GM-OS est éteint) »**.

La couleur, le tracé et l'épaisseur font donc partie du lot demandé. La fermeture
est confirmée à nouveau ; aucun commit, push, paquet ou service supplémentaire
n'est demandé. Les autres possibilités ci-dessous restent des propositions.

## Réglages des traits implémentés

Un clic normal sur le trait, ou Entrée sur un lien focalisé, ouvre son inspecteur.
Les réglages suivants sont indépendants :

| Réglage | Choix disponibles |
| --- | --- |
| Tracé | Continu, tirets, petits points. |
| Épaisseur | Fin, normal, gras, très gras. |
| Couleur | Couleurs du thème et couleur personnalisée avec sélecteur et valeur hexadécimale. |

Exemple : un trait violet, gras et pointillé. Le trait, sa flèche et l'aperçu
reprennent la couleur choisie. La condition conserve un texte lisible sur son fond,
indépendamment de cette couleur.

**Aperçu immédiat**, puis conservation par **Appliquer** pour ce lien et cette campagne.
**Revenir au style du thème** enlève les choix personnels d'apparence du lien : son apparence
suit alors de nouveau la nature du lien et le thème actif. Un thème différent
conserve la couleur personnalisée explicitement choisie.

**Appliquer** conserve le choix ; **Annuler les réglages** restaure le choix enregistré.
Fermer, Échap ou filtrer le lien abandonne l'aperçu. Hors Relier, le retrait passe par
un bouton explicite avec confirmation. Le mode **Relier** conserve son geste actuel
de création et de retrait. Les liens structurels ne proposent pas de retrait dans
l'inspecteur.

## Autres options proposées

- **Jonctions sur quatre côtés réalisées ensuite** : voir le
  [lot demandé après l'essai de David](2026-10-07-trame-jonctions.md).
  Plusieurs accroches sur un même côté pour séparer les branches restent proposées.
- **Forme** : courbe, droite ou angles droits.
- **Commentaire MJ** : note du lien dans l'inspecteur, avec un petit repère sur le
  trait. La condition d'enchaînement déjà disponible reste un champ distinct.
- **Étiquette** : déplacer son emplacement sur le trait.
- **Trajet manuel**, dans un second temps : points de passage déplaçables pour
  contourner les cartes et retour au trajet automatique.
- **Autres gestes**, à préciser : rebrancher une extrémité et aligner/espacer un
  groupe de cartes. Rebrancher un lien doit conserver son sens métier, notamment
  l'appartenance à un acte et les renvois uniques vers un lieu ou une ambiance.

## Intégration et vérification de ce lot

Les choix visuels sont enregistrés dans `Campaign.stylesDesLiensDeTrame`, avec
l'action `stylerLeLienDeTrame` et l'identité stable du lien
déjà utilisée par l'adaptateur. Ils complètent les données actuelles : une ancienne
campagne sans réglages conserve son rendu par défaut. Ranger déplace les cartes en
gardant les styles ; le retour au style du thème est une action dédiée.

Le moteur garde l'aperçu pendant le geste ; le magasin enregistre la valeur validée,
sans écriture à chaque mouvement du sélecteur. Une sélection, un zoom ou un filtre
n'altère ni le style conservé, ni les positions, ni les liens du scénario.

Les contrôles couvrent les combinaisons tracé/épaisseur/couleur, les quatre thèmes
avec et sans personnalités, le clavier, la réouverture et le passage campagne
A → B → A. Le retour au style du thème et les campagnes sans réglages sont vérifiés,
ainsi que les régressions des conditions, renvois, suppressions et dépôts.

Ancres : `src/modules/session/components/trame/` (`LienDeTrame.tsx`,
`ToileDeLaTrame.tsx`, `GrapheDeLaTrame.tsx`, `InspecteurDeLienDeTrame.tsx`),
`src/modules/session/logic/adapterLeGrapheDeTrame.ts`, `stylesDesLiensDeTrame.ts`,
`src/types/campaign.types.ts` et `src/modules/session/store/campaignSlice.ts`.
Les valeurs importées sont filtrées : trois tracés, quatre épaisseurs, cinq couleurs
du thème ou une couleur hexadécimale. Les champs inconnus et le CSS arbitraire sont
ignorés ; les hexadécimales courtes sont développées.

Construction et types réussis ; lint des neuf fichiers concernés sans diagnostic.
**715 tests ciblés dans 57 fichiers passent**, dont trois nouveaux sur les imports,
la stabilité d'identité et les écritures par campagne. Le banc
`e2e/stylesDesLiensDeTrame.spec.ts` couvre les gestes, les douze combinaisons, le
marqueur de flèche, le nouveau processus, A → B → A, le retrait et la matrice
des thèmes/formats. **39 scénarios E2E passent en 7,1 minutes** : six nouveaux et
33 régressions. Ils utilisent uniquement des profils isolés et des campagnes fictives.
Les **24 PNG** de l'inspecteur sont relus sur quatre planches ; les trois vues du
manuel sont régénérées et relues. La [galerie](graphe-trame/edition-liens/index.html)
et le [manifeste des contrôles](graphe-trame/edition-liens/controles-integration.json)
conservent les preuves de cette extension, séparées de celles du premier lot.

Piège du banc payé : attendre le graphe et une carte de la campagne témoin avant
d'ajouter la branche d'essai. `persist.hasHydrated()` seul ne garantit pas que
l'import initial de la fixture soit terminé ; il pouvait écraser cette branche.
Le lanceur partagé n'est pas modifié par cette extension.

Le bilan G0–G6 du premier lot reste historique ; aucune clôture G7 ni autorisation
de commit/push n'est inventée. Les contrôles ci-dessus décrivent le lot d'apparence ;
le [lot des jonctions](2026-10-07-trame-jonctions.md) porte ses propres preuves.
Formes, accroches multiples et commentaires restent dans les propositions ci-dessus.
