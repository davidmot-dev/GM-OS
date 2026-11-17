# Vampire V5 — les quatre ateliers GM-OS Studio

Livré le **17/11/2026**, depuis `docs/Reference/Vampire/`. David : « j'ai forgé le corpus du drivers Vampire,
fait le thème, la bannière, la fiche de personnage et la référence visuelle ».

| Élément | Fichier livré | État contrôlé |
| --- | --- | --- |
| Thème | [theme.css](../../docs/systems/vampire/theme/theme.css), avec le dossier `theme/` complet | Accepté : **0 erreur, 0 avertissement** ; 3 ornements, 1 matière SVG, 15 icônes |
| Bannière | [Vampire Band.jpg](../../docs/systems/vampire/Vampire%20Band.jpg) | **2400 × 600 px**, JPEG opaque, **129 015 octets**, cadrage central vérifié |
| Fiche interactive | [vampire-v5-fiche-personnage-interactive.html](../../docs/fiches/Vampire/vampire-v5-fiche-personnage-interactive.html) | **2 pages, 455 zones, 181 clés** ; acceptée, 0 erreur, 2 avertissements d'intégration |
| Identité des images | [identite-visuelle.txt](../../docs/systems/vampire/identite-visuelle.txt) et [références sélectionnées](../../docs/systems/vampire/references-visuelles/) | Deux lignes STYLE / AVOID, **35 / 13 mots**, quatre références |

[Archive complète des quatre éléments](../../output/gmos-studio/Vampire-2026-11-17.zip).
Registre **§ 258**, ligne **194** ; synthèse des pilotes actualisée. Le sommaire et l'index du 16/11 restent au § 257.

## Direction visuelle

Les photographies des p. 45, 50, 66 et 68 partagent le réalisme tactile, les ombres profondes,
le grain, une lumière sculptée et une tension intime. Leurs teintes varient du rouge au bleu,
avec du monochrome : le bloc garde cette gamme sans imposer de sujet. Les quatre PNG choisis
sont copiés sans altération dans `references-visuelles/` ; le tunnel p. 434 sert aussi de référence
de profondeur nocturne pour la bannière.

```text
STYLE: low-key editorial photography, tactile realism, deep charcoal blacks, selective wine-red and cold blue lighting, restrained saturation, fine analog film grain, soft optical falloff, strong chiaroscuro, occasional monochrome, contemporary gothic elegance, intimate unease, imperfect physical textures
AVOID: cartoon, fantasy painting, glossy CGI, plastic skin, neon saturation, bright daylight, readable text
```

Dans le pilote, copier ces deux valeurs dans **Style** et **À éviter**, puis sélectionner les quatre
références si le modèle d'images les prend en charge. Ce lot n'écrit pas ces réglages dans une campagne.

## Thème

Ivoire, encre noire et bordeaux ; cadre presque noir, titres à empattements contrastés, angles nets,
relief discret, aucun halo. Le contenu clair vient des pages de texte ; le cadre sombre reprend
les ouvertures et les photographies. Les ornements sont des dessins originaux sobres (épine/goutte),
sans reprendre le logo du livre. Bodoni Moda est une **approximation** des titres, avec replis système ;
la fiche, indépendante, conserve ses fonds PDF.

[Intention et limites](../../docs/systems/vampire/theme/intention.md).
[Aperçu local des ressources](vampire-studio-20261117/theme-apercu.png), **hors de GM-OS**, avec polices de repli hors connexion.
Cet aperçu illustre les jetons et ne prouve pas une activation du thème dans l'application.

Ratios du validateur, avant matière : texte/fond **13,76**, texte/surface **16,02**, secondaire/fond **5,29**,
accent/fond **6,89**, texte sur accent **8,51**, texte du cadre **15,82**.
Sous matière : texte/fond **13,01**, secondaire/fond **5,00**, accent/fond **6,52** ;
toutes les paires satisfont les minima du contrat. Le dossier du thème est déjà déposé à sa place.

## Bannière

Panorama photographique d'une ville sous la pluie, passage central, reflets bordeaux et bleu assourdis,
bords sombres pour les commandes. Génération avec l'outil natif d'images, sans appel de fournisseur
ni clé API configurée ; [invite en anglais](2026-11-17-vampire-banniere-prompt.txt).

Source native **2172 × 724 px** ; recadrage centré 4:1 puis agrandissement de **10,5 %** en largeur.
David autorise explicitement le 17/11 : **« Oui, agrandir à 2400 × 600 »**.
Ce rééchantillonnage ne crée pas de détails supplémentaires. L'original généré reste intact dans
le dossier de génération de Codex ; le JPEG final est déposé dans le dossier du jeu.

[Contrôle de la bannière](vampire-studio-20261117/banniere-controle.jpg) : image entière et découpes
centrées **1188 × 54** et **600 × 54**, titre et commandes simulés. Il s'agit d'un aperçu, pas d'une capture de GM-OS.
Dans l'éditeur du pilote → **Bannière de l'en-tête**, sélectionner le JPEG livré.

## Fiche de personnage

Les **deux pages complètes** de `V5_Feuille-de-perso.pdf` sont intégrées en images PNG dans un HTML
autonome, coordonnées relatives à la CropBox du PDF (**612,1452 × 791,5497**). Aucun fond recoloré.
Les champs couvrent identité, neuf Attributs, vingt-sept Compétences et leurs spécialités,
six Disciplines et leurs pouvoirs, réserves, Avantages/handicaps, Convictions, Fléau et histoire.

David choisit explicitement le 17/11 **« Suivi V5 “/” et “X” (recommandé) »** : chacune des vingt
cases Santé/Volonté alterne **vide → / → X → vide**. Ce sont des choix textuels indépendants
dans le manifeste, avec trois hotspots par case ; le CSS ne laisse visible que la prochaine action.
Le même comportement a été vérifié dans le moteur existant, sans le modifier.
Les autres pistes imprimées sont des hotspots numériques partageant une clé par jauge.

Capacités de Santé/Volonté **manuelles** dans les petits nombres près des titres ; aucun calcul
de règle, traitement de dégâts ou test automatique. Humanité est une jauge numérique ; les
Flétrissures peuvent être consignées dans Notes. Le PDF ne comporte pas de cadre de portrait :
aucun n'a été ajouté sur les zones imprimées.

Fonctions autonomes : zoom **20–400 %**, boutons −/+ et Ajuster, raccourcis et Ctrl+molette,
navigation, Zones, sauvegarde locale avec indication de secours, export/import JSON,
réinitialisation confirmée et impression des deux pages. JSON exporté à clés plates, compatible
avec le moteur ; réimport de ses exports v2 également contrôlé. Aucune ressource réseau.

- [Page 1, zones visibles](vampire-studio-20261117/fiche-page-1-zones.png)
- [Page 2, zones visibles](vampire-studio-20261117/fiche-page-2-zones.png)
- [Page 1 remplie, personnage fictif](vampire-studio-20261117/fiche-page-1-remplie.png)
- [Import dans le moteur sur profil jetable](vampire-studio-20261117/fiche-dans-moteur-zones.png)
- [Rapport du parcours](vampire-studio-20261117/verification-fiche.json)

**Les deux avertissements d'intégration sont conservés** : modèle `vampire-v5-fr` neuf, non intégré
à `builtinTemplates`, et absence de correspondance avec les champs du pilote GM-OS. Le HTML
fonctionne seul et s'importe par **+ Modèle** dans le moteur. Son raccord automatique aux jets,
à la santé et au combat du pilote reste à construire après examen de l'export Vampire.
Il n'est pas déclaré opérationnel par cette livraison. Aucune clé précédente à reprendre : première fiche Vampire du dépôt.

## Vérifications et reprise

`npm run theme:valider -- vampire`, `npm run fiche:valider -- Vampire`, validateur d'identité,
parcours Playwright sur navigateur neuf sans réseau : **aucune erreur JavaScript, aucune requête réseau**.
Les vingt cases ont subi le cycle complet ; les marques mixtes survivent au rechargement,
à l'export/import et au passage par le moteur. Impression PDF contrôlée : **deux pages**.
Les deux pages et les aperçus ont été inspectés visuellement.

Recettes reproductibles dans `outils/vampire/` : `construire-fiche.py`, `rendre-fiche.mjs`,
`fiche-autonome.html`, `verifier-studio.mjs`, `apercu-theme.mjs`. Scratchpad : `tmp/vampire-studio-20261117/`.

Le corpus forgé par David comporte **24 fiches de règles** et une fiche de voix : il reste intact,
sans relecture déclarée par cet atelier. Aucun export de pilote Vampire n'a été modifié,
aucun changement de `src/` ou `electron/`, aucune donnée personnelle ouverte.
Essai visuel de David dans son pilote et raccord du modèle restent distincts des vérifications locales.
Aucun commit ni push demandé.
