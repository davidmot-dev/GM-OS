# Fiche Degenesis — GM-OS Studio, 30/10/2026

Fichier autonome : `docs/fiches/Degenesis/degenesis-fiche-personnage-interactive.html` dans le dépôt. L’ouvrir directement dans un navigateur ; aucun serveur ou accès Internet requis.

- **1 page**, fond original du PDF fourni, **461 zones / 129 clés**. Gabarit **`degenesis-fr`**, première version : aucune clé antérieure à préserver trouvée dans le dépôt ou le moteur.
- **390 hotspots regroupés en 58 pistes numériques** : six attributs, 36 compétences, six Origines, six niveaux de potentiels ; Égo, Sporulations et blessures superficielles sur 24 cases chacun, traumatismes sur 12 cases.
- Identité, Culture/Concept/Culte, six noms de potentiels, trois armes, deux armures, six équipements et trois cases de poids total saisissables. Les dernières restent indépendantes et manuelles, comme les autres valeurs : aucune formule non fournie ajoutée. Pas d’emplacement de portrait inventé.
- Les cases noires au départ des attributs font partie du PDF. Elles sont conservées ; une croix blanche indique leur activation interactive. Aucune valeur de création n’est inscrite d’avance. Cliquer une case de piste renseigne un nombre ; recliquer la valeur courante remet ce nombre à zéro.
- Zoom 20–400 %, Ajuster, clavier et Ctrl+molette, Zones, sauvegarde locale, import/export JSON, reset confirmé et impression à la taille du PDF sur une page. Pour une copie durable, conserver un export JSON ; la sauvegarde du navigateur n’est pas une sauvegarde externe.

## Vérifications réelles

- Validateur GM-OS : **ACCEPTÉE, zéro erreur, deux avertissements d’intégration**. Le modèle n’est pas encore préinstallé et sa correspondance n’existe pas. Les rapports sont `validation.md` / `validation.json`.
- Contrôles automatisés sur l’HTML réellement livré : 129 clés importées/exportées et restaurées ; pistes cumulatives et remise à zéro ; refus d’imports de types, modèle et bornes incompatibles sans perte ; annulation et confirmation des remplacements/reset ; zoom borné, clavier et molette ; mode Zones ; absence de débordement global à 390 px.
- Impression de contrôle : une page, environ **595 × 842 points** (arrondi du moteur Chrome), source **595,22 × 842 points**. Fond de l’HTML identique octet pour octet au PNG rendu par Poppler. PDF original inchangé.
- Import réel du manifeste dans **une bibliothèque du moteur de fiches ouverte en contexte Chrome neuf** ; saisie d’un nom, Égo 11, Médecine 4, export JSON v2 puis retour dans l’HTML autonome réussi. Aucune bibliothèque personnelle ou campagne chargée ; ce n’est pas une intégration au cockpit ni un essai Hub connecté.
- Captures examinées : zones, exemple rempli, moteur et mobile. **Zéro erreur JavaScript, zéro requête réseau.** `verification.json` contient les résultats et empreintes. Les exemples remplis sont des données de contrôle, pas des profils créés selon un budget novice.

## Intégration restante

Importer l’HTML comme modèle dans le moteur est possible immédiatement. Pour la distribution intégrée GM-OS, l’intégrateur ajoute ensuite le modèle à `builtinTemplates`, augmente `BUILTIN_VERSION` et écrit `docs/systems/degenesis/fiche/correspondance.json` depuis le pilote réel. Cette étape doit couvrir chaque clé, par liaison ou absent motivé ; elle n’est pas effectuée par l’atelier fiche.

Avant cette correspondance, les valeurs restent utilisables dans la fiche mais ne sont **pas reliées aux jets et ressources du pilote**. Aucune modification de `Character_Sheet_Manager.html`, de `src/`, d’`electron/`, du thème ou des références dans cette livraison.

## Reproduire depuis la racine du dépôt

1. `node outils/degenesis/construire-fiche.mjs`
2. `npm.cmd run fiche:valider -- Degenesis`
3. `node outils/degenesis/verifier-fiche.mjs`
4. Examiner les nouvelles captures avant de marquer `capturesExaminees` dans le rapport.

Les relevés exacts des cases sont dans `outils/degenesis/fiche/releves.json`, en pixels du rendu Poppler 144 dpi ; le manifeste les convertit en points natifs. Aucun paquet installé pour ce travail. L’avertissement Poppler « Can't get Fields array » vient du PDF sans champs AcroForm exploitables ; le fond rendu et tous les champs HTML ont été contrôlés séparément.
