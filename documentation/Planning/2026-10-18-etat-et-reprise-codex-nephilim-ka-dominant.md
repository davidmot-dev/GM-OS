# Nephilim — ajout du Ka dominant par GM-OS Studio, 18/10/2026

Suite du registre § 140. David demande de **retoucher la fiche existante**, avec une seule
nouvelle clé logique `ka.dominant`, en conservant toutes les anciennes clés, leurs types,
leurs pages et leurs positions. Demande complète :
[consigne du 18/10](2026-10-18-consigne-studio-nephilim-ka-dominant.md).

## Livraison

Le [HTML retouché](../../docs/fiches/Nephilim/nephilim-legende-interactive.html) est modifié
directement à l'emplacement fourni par David. Atelier utilisé : GM-OS Studio, fiche.
Le livrable du 17/10 dans `outils/gmos-studio/livraisons/nephilim/` conserve sa version historique.

Solution préférée retenue : **cinq hotspots sur les noms imprimés du Pentacle en page 1**.
Ils évitent les symboles qui accueillent déjà les nombres et ne chevauchent aucune des
166 zones existantes de cette page. Un clic sélectionne un seul élément ; recliquer le même
élément efface le choix. Aucun élément n'est choisi par défaut pour un ancien personnage.

Coordonnées natives dans la page de 609,449 × 807,874 ; origine en haut à gauche :

| Clé | Type | Valeur exacte | Page | x | y | w | h |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| `ka.dominant` | hotspot | `Feu` | 1 | 290 | 38 | 36 | 16 |
| `ka.dominant` | hotspot | `Air` | 1 | 394 | 108 | 36 | 16 |
| `ka.dominant` | hotspot | `Eau` | 1 | 352 | 228 | 36 | 16 |
| `ka.dominant` | hotspot | `Terre` | 1 | 183 | 108 | 43 | 16 |
| `ka.dominant` | hotspot | `Lune` | 1 | 226 | 228 | 40 | 16 |

Le JavaScript autonome distingue désormais hotspots numériques et textuels lors de l'import
et de la restauration locale. Une désélection textuelle sauvegarde `""`, comme le moteur.
Les pistes numériques gardent leur comportement existant. Aucun calcul, `derive`, degré
du Ka dominant ou plafond de Stase ajouté.

## Conservation et contrôles

- `template.id` reste `nephilim-legende-fr` ; sept pages et sept fonds intégrés conservés.
- Le manifeste, après retrait des cinq nouveaux hotspots, est strictement identique à l'ancien.
  Les 1 019 zones et 986 clés précédentes conservent donc toutes leurs propriétés.
- Résultat : 1 024 zones, 987 clés uniques ; seule nouvelle clé : `ka.dominant`.
- Ancien personnage rempli importé et exporté sans perte. Cinq degrés du Pentacle toujours
  saisissables, indépendamment du choix dominant.
- Cinq valeurs testées par clic, exclusivité, désélection, sauvegarde locale, rechargement
  et aller-retour JSON. Valeurs invalides refusées sans remplacer le personnage.
- Pages 2 à 7 remplies : captures comparées dans deux vues indépendantes, identiques pixel
  par pixel. Page 1 relue en capture normale et en mode Zones : seul le nom choisi s'allume.
- Contrôles dans Edge sans réseau, avec profil jetable ; aucun accès aux données personnelles.

Scripts, original avant modification, rapports et captures de contrôle :
`scratch/nephilim-ka-dominant/` (ignoré par Git). Commande :
`node scratch/nephilim-ka-dominant/verifier.mjs`.

## Raccordement à reprendre par Claude Code

Conformément au cahier des charges des fiches, § 7–8, l'atelier livre le HTML ; **le moteur
intégré et la table de correspondance ne sont pas modifiés** dans cette tâche.

`node scripts/fiche-valider.mjs Nephilim` : **1 erreur § 7**, car la correspondance existante
ne cite pas encore `ka.dominant`, et **1 avertissement § 6**, car le moteur intégré ne porte
pas encore cette nouvelle clé. Le contrôle du HTML sans correspondance est accepté sans
erreur ; les avertissements de raccordement restent attendus. Ne pas annoncer une validation
d'intégration complète avant ces opérations.

Reprendre par l'intégration du manifeste mis à jour dans le moteur, l'incrément de
`BUILTIN_VERSION` et la correspondance `ka.dominant` vers le champ de Ka dominant du pilote
actuel, puis relancer le validateur. Vérifier le champ du pilote dans le code, sans en inventer
le nom. Aucune modification de `src/` ou `electron/` dans cette livraison.

Le registre et la note TMR du 18/10 étaient déjà modifiés par un autre travail : laissés intacts
pour respecter la règle d'un seul écrivain par fichier. Cette note conserve la passation du
présent ajout. Aucun paquet installé ni service réseau lancé.

David demande ensuite « commit » : seul le HTML retouché et cette note entrent dans le commit
de Codex. Les changements d'intégration apparus entre-temps dans le moteur, la correspondance
et les essais appartiennent à l'autre travail et restent hors de ce commit. Aucun push demandé.
