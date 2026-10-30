# Fiche de personnage Degenesis — 30/10/2026, GM-OS Studio / Codex

## Ce que la session a produit

David : « fais la fiches de personnage de Degenesis, le fichiers de référence est ici C:\Projet_David\GM-OS-v5\docs\systems\degenesis\Degenesis Reference ».

- Source : `Degenesis - Fiche PJ.pdf`, **une page**, aucune zone AcroForm exploitable. SHA-256 source `5ce30071896cfb53a17d3602bbacbb8d1e085d51ffb7944e4951212173d51662` ; le document est inchangé.
- Livraison : [`docs/fiches/Degenesis/degenesis-fiche-personnage-interactive.html`](../../docs/fiches/Degenesis/degenesis-fiche-personnage-interactive.html), autonome, fond Poppler intégré, manifeste **`degenesis-fr`**. Première version, aucun modèle Degenesis précédent trouvé : **129 nouvelles clés, aucune clé retirée**.
- **461 zones**, dont **390 hotspots sur 58 pistes numériques** : six attributs, 36 compétences, six Origines, six potentiels ; trois grandes pistes de 24 et une de 12. 71 autres champs : identité, Culture/Concept/Culte, noms des potentiels, trois armes, deux armures, six équipements et trois lignes de poids total. Aucun calcul de règles, choix de Culte ou portrait ajouté.
- **Fonctions vérifiées** : sauvegarde et rechargement des 129 clés, import/export JSON, pistes cumulatives/remise à zéro, refus des imports invalides sans perte, reset et remplacement confirmés, zoom 20–400 %, raccourcis/molette, Zones, mobile 390 px, impression sur une page de dimensions source. **Zéro erreur JS, zéro requête réseau.**
- **Import du manifeste éprouvé dans le moteur en contexte Chrome neuf**, saisie/export puis retour JSON v2 dans l’HTML réussi ; ni profil personnel, ni campagne, ni Electron, ni serveurs GM-OS lancés. Ce n’est pas un essai du cockpit ou de Hub connectés.
- **Validateur : ACCEPTÉE, zéro erreur, deux avertissements** : modèle nouveau absent des intégrés, correspondance du pilote à écrire ensuite. Captures de zones, exemple rempli, moteur et mobile examinées ; bilan et empreintes dans [`output/fiches/degenesis/verification.json`](../../output/fiches/degenesis/verification.json), guide dans `LIRE-MOI.md` du même dossier.
- Sources reproductibles : `outils/degenesis/construire-fiche.mjs`, `verifier-fiche.mjs`, `fiche/releves.json`, `champs.css`, `interface.css`, `runtime.js`. Runtime adapté de la fiche RuneQuest autonome, **aucune coordonnée de RuneQuest reprise**.
- **À la livraison, avant demande de commit : 19 fichiers nouveaux non commités** : un HTML, six sources, onze sorties de contrôle et cette note. David a ensuite demandé **« commit et pousse »** : commit de la fiche, de sa recette et de ses preuves, séparé du thème et de la bannière/identité. Aucun code applicatif ou thème modifié. Le registre était déjà modifié par l’autre agent : aucun ajout concurrent ; fragment prêt ci-dessous.

## Par quoi reprendre

1. Ouvrir l’HTML et renseigner un personnage, puis exporter son JSON. À l’import dans le moteur, utiliser **Importer un modèle HTML** ; cet import a été vérifié dans une bibliothèque jetable.
2. **Intégrateur** : ajouter le modèle à `builtinTemplates`, augmenter `BUILTIN_VERSION`, puis écrire `docs/systems/degenesis/fiche/correspondance.json` depuis le pilote réel. Les **129 clés** doivent avoir une liaison ou un absent motivé. Ces actions restent à faire ; la fiche n’est pas encore raccordée aux jets, à la santé ni aux ressources du pilote.
3. Relancer `npm.cmd run fiche:valider -- Degenesis` après intégration, puis éprouver les échanges réels du cockpit/Hub en contexte autorisé. Respecter la question « GM-OS tourne-t-il ? » avant toute écriture `src/`/`electron/`.
4. Le thème Degenesis livré séparément n’a pas été utilisé pour recolorer ce PDF. Les deux ateliers sont indépendants.

## Fragment de registre pour son écrivain

Lire les numéros actuels avant ajout ; le dernier relevé était § 187. Pas de nouveau pilote créé dans ce chantier ; la synthèse des pilotes pourra référencer cette fiche lors de l’intégration Degenesis.

> David : « fais la fiches de personnage de Degenesis », depuis le PDF fourni.
>
> - HTML autonome livré dans `docs/fiches/Degenesis/`, une page fidèle, manifeste `degenesis-fr`, 461 zones / 129 clés ; sources de génération sous `outils/degenesis/`.
> - Vérifié : validateur 0 erreur / 2 avertissements d’intégration ; saisie/sauvegarde/import-export, 58 pistes, reset, zoom, impression, mobile, import de modèle dans un moteur jetable et retour JSON v2. Captures examinées, zéro erreur JS et zéro requête réseau.
> - Reste : `builtinTemplates` + version du moteur, correspondance des 129 clés depuis le pilote, échanges réels cockpit/Hub et essai de David. La création du modèle ne réalise pas ces étapes automatiquement.
> - Reprise : `2026-10-30-etat-et-reprise-codex-fiche-degenesis.md` ; les cases noires initiales des attributs font partie de l’image source.

## Ce qu’il ne faut pas repayer

- Le PDF est essentiellement une image : le relevé des cases vient du rendu **144 dpi** et de ses composantes noires, puis d’une revue visuelle complète. Les positions exactes sont conservées dans `releves.json` ; ne pas les remplacer par un espacement approximatif.
- Les premières cases noires des attributs sont imprimées : les conserver comme fond, distinguer l’activation interactive avec une croix blanche. Elles ne signifient pas qu’une valeur a été sauvegardée automatiquement. Cette limite est expliquée dans l’aide.
- Chaque piste partage **une clé numérique** avec des valeurs 1…N, conformément au contrat. Pas de 390 booléens et pas de calcul de création inventé. Culture/Concept/Culte sont des zones de texte libre, pas des portraits ou sélecteurs ajoutés.
- Le tableau inférieur porte deux colonnes d’équipement et trois cases de poids total : les valeurs restent manuelles et indépendantes. Aucun calcul de poids ou de blessures non imprimé n’a été ajouté.
- Impression : coordonnées de page en points, passage aux pixels CSS par **4/3**, dimensions `@page` **595,22 pt × 842 pt** ; une page vérifiée dans le PDF de contrôle en mémoire. Ne pas reprendre les dimensions et la dernière page spéciale du runtime RuneQuest.
- Un import de modèle en contexte navigateur neuf ne remplace ni la version intégrée du moteur ni la correspondance du pilote. Les deux avertissements sont attendus et doivent rester visibles tant que cette intégration n’est pas faite.
