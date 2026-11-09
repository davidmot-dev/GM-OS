# État et reprise Codex — campagne Argyropée, 09/11/2026

## Produit

Demande de David : « peux-tu faire une campagne test pour Argyropee? ».
**Les Comptes de la marée** : une seule campagne `.gmos`, douze séances prévues,
quatre actes, 36 scènes narratives et six ateliers intégrés. Trois héros nouveaux pour
les joueurs autorisés `p-1/p-2/p-3`, huit `[RECETTE]`, seize PNJ de fiction et deux synthétiques,
douze lieux et douze indices ; 61 cas humains vierges, dix-huit couvertures sourcées.

[Livraison](2026-11-09-campagne-recette-argyropee.md) ;
[guide](../../output/campagnes-tests/argyropee/LIRE-MOI.md) ;
[ZIP](../../output/campagnes-tests/argyropee/Argyropee-Les-Comptes-de-la-maree-Recette.zip).
Pilote réel **2.1.0**, identifiants gardés, copie séparée identique ; aucune modification du pilote.

120 tests / sept fichiers passent ; injection Nexus et restauration ciblée dans le magasin réel
**en mémoire**, sérialisation, caviardage et correspondance HTML éprouvés. Plugin : structure acceptée.
45 images / trois WAV décodés hors ligne ; rendus et planches relus. Rapports liés au SHA de l’archive.
Import natif Electron, persistance disque et Hub réseau **NON EXÉCUTÉS**, aucun service autorisé
ou lancé pour ce lot. Le lot est **PRÉPARÉ**, pas « testé en application ». Les 61 cas humains sont NON TESTÉS.

Deux écarts reproduits dans les fonctions réelles : santé générique 4−5 → 0 au lieu de −1 ;
initiative d10 moteur10 + Agilité2 + Détection2 → 14 au lieu de4. Ils sont conservés dans les
cas SAN-02 / COM-01, le rapport `verification-ecarts.json`, le registre § 1 bis et la synthèse.
Aucune correction `src/` ou `electron/` ; ne pas effacer ces constats en lisant les tests verts.

## Reprendre

Ouvrir le guide, vérifier le pilote installé 2.1.0 puis importer le seul `.gmos`, Tel quel au
premier import. Pour éprouver un geste, aller directement au cinquième acte de la Trame,
**ATELIERS DE RECETTE — hors fiction**. Lire les anomalies avant de prendre la santé et
l’initiative du chemin de combat générique pour une implémentation complète du jeu.

Pour une recette native future, obtenir l’autorisation des services et préparer des profils,
corpus, sauvegardes et ports jetables ; ne pas reprendre les profils de David. La chaîne
de reproduction sans service est documentée dans le lot.

## Ne pas repayer

- Les noms/IDs autorisés viennent de `cthulhu-hack-joueurs.json`, pas de données personnelles.
- La fiche du pilote 2.1.0 porte **137 champs**, dont 128 reliés au modèle HTML ; traiter les
  `gauge` comme des nombres, pas comme du texte.
- `Guigne réglée` touche tous les onze PJ de la campagne et **ajoute** trois à l’offrande
  existante. Ne pas présenter ce geste comme reset d’un atelier ; conserver ses valeurs avant.
- Réveil remet les suivis à zéro et perd le Panache de la veille ; il ne restaure pas une fiche entière.
- Le profil INCONSCIENT a −1 sur la fiche et 0 dans la projection HP générique, écart explicitement
  documenté. Le panneau d’Exubérance lit bien le champ signé.
- Vitest hors `src/` : importer React pour le JSX, examiner `.disabled` (pas de matcher
  `toBeDisabled` installé), relever `Uint8Array` natif avant lecture AdmZip dans jsdom.
- SHA en texte : ne jamais espacer globalement lettres/chiffres pour corriger une prose ;
  cela découpe aussi les empreintes hexadécimales.
- Sources reproductibles dans neuf fichiers nouveaux sous `outils/campagnes-de-recette/` ;
  aucune modification du générateur Torg ou d’autres jeux.

Registre § 240 / ligne 176, synthèse et manuel du jeu complétés. Le contrôle documentaire
`electron/manuelDesJeux.test.ts` passe aussi : 27 tests, distincts des 120 de la recette.

Non commités : **trois documents modifiés** (registre, synthèse, manuel Argyropée),
**onze fichiers nouveaux de source/documentation** (les deux notes de ce jour et les neuf
fichiers `argyropee.mjs`, `argyropee-scenario.mjs`, `argyropee-recette.mjs`,
`argyropee.test.ts`, `argyropee-ecrans.test.tsx`, `vitest-argyropee.config.mts`,
`argyropee-verifier-plugin.mjs`, `argyropee-visuels.mjs`, `emballer-argyropee.mjs`),
plus **138 fichiers de livraison** sous `output/campagnes-tests/argyropee/`.
Le ZIP contient 136 entrées, dont une seule campagne, et a été relu après emballage.
Cet état décrit la livraison avant la demande Git. Les pilotes et dossiers `tmp/` qui apparaissaient déjà
non suivis au démarrage sont laissés intacts.

## Versionnement demandé ensuite

David demande le 09/11 : « commit et pousse ». Le commit porte uniquement la campagne
Argyropée, ses sources, les rapports et les paragraphes de documentation correspondants.
Une modification étrangère sur les options de carrière d’Alien dans le registre reste
hors index ; les deux pilotes non suivis et les fichiers temporaires ne sont pas ajoutés.
Le hook `scripts/hooks/pre-push` lance la validation complète avant l’envoi sur `production`.
