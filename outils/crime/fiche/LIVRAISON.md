# Fiche Crimes — livraison du 19 octobre 2026

Demande de David, dans GM-OS Studio : « crée moi la fiche de personnage html à partir ce fichier ».

## Livrable

- HTML : `docs/fiches/Crimes/crimes-fiche-personnage-interactive.html`.
- Source : `Crime - PJ Sheet.pdf`, deux pages, SHA-256 `ec9caf6ea0b6b1ce23682c54e76b8746ce80f4fe21d6273055b91f0209a8f972`.
- Modèle nouveau : `crimes-fr` ; conserver cet identifiant et toutes ses clés lors d’une retouche.
- Dimensions natives : 595,276 × 779,528 par page ; fonds rendus à l’échelle 2, intégrés en WebP.
- 335 zones (207 et 128) pour 197 clés : 39 pistes ou choix, 36 textes courts, 60 nombres, 6 textes longs, 55 cases indépendantes et un portrait.

## Comportement

Les choix de Jung sont exclusifs. Les pistes imprimées sont des hotspots numériques cumulatifs, avec retour à zéro par un second clic. Les trois cercles de chaque compétence et style forment une piste ; le zéro incliné adjacent est un compteur numérique indépendant, sans calcul ni interprétation de règle. Les spécialisations sont les 55 cases indépendantes imprimées.

Les huit lignes d’indices disposent chacune d’un texte et de cinq nombres, dans l’ordre imprimé Condé / Limier / Illuminé / Mentaliste / Fouineur. Les pistes de contacts et la piste d’équipe sans légende restent désignées de façon générique : aucune affectation implicite à une règle non indiquée par le PDF.

Le portrait peut être ajouté, remplacé et retiré. Le fichier transporte ses données et son portrait dans un export JSON ; il sauvegarde aussi dans le navigateur si le stockage local est disponible. Navigation, zoom 20–400 %, raccourcis, mode Zones, remise à zéro confirmée et impression des deux pages sont intégrés.

## Reproduire et vérifier

```powershell
node outils/crime/construire-fiche.mjs "C:/Users/david/Downloads/Crime Reference/Crime - PJ Sheet.pdf"
npm.cmd run fiche:valider -- Crimes
node outils/crime/verifier-fiche.mjs
```

La recette reconstruit l’HTML à partir du PDF et des trois fichiers source de `fiche/`. La vérification utilise Edge installé, en mode sans fenêtre et dans un contexte jetable : aucune lecture des données personnelles de GM-OS, aucun service ni téléchargement de navigateur.

Résultat : accepté par le validateur, zéro erreur et deux avertissements attendus pour une fiche nouvelle (modèle absent du moteur, correspondance au pilote absente). Les vérifications de navigateur n’observent aucune erreur JavaScript ni requête réseau. Les captures vierges, remplies, avec zones et à 390 pixels de large, ainsi que les rapports, sont dans `output/fiches/crime/`.

Les captures ont été relues face aux deux pages : le mode Zones a été corrigé pour rester visible malgré la priorité des styles du modèle ; les trois champs de seuil ont été déplacés entre les rangées inclinées pour éviter les chevauchements. Les marques de Zones ne s’impriment pas.

## Intégration à poursuivre séparément

La fiche est autonome et porte son manifeste importable. Elle n’est pas ajoutée aux `builtinTemplates` du moteur et aucune correspondance n’est écrite : ces étapes suivent la livraison selon le § 8 du cahier des charges des fiches. Aucun fichier existant du moteur, pilote, thème, `src/` ou `electron/` n’a été modifié pour cette fiche. Aucune clé précédente à reprendre : modèle nouveau.
