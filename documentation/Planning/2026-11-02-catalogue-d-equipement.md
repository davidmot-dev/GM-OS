# Le catalogue d'équipement du pilote — plan, 02/11/2026

Registre § 203. Demande de David, après la relecture de *Colonial Marines* (§ 185) : *« Est-ce qu'on ne
devrait pas faire une section équipement dans le pilote ? »*, puis, sur la proposition : *« Oui c'est
bien »*. Aucune ligne de code n'est écrite ; ce document est le plan.

## Pourquoi

- **Une arme n'existe aujourd'hui que sur la fiche d'un personnage.** Pour Alien, ce sont des lignes de
  texte parallèles (nom, bonus, dégâts, portée, propriétés) que le panneau de jet relit
  (`equipementsAlien`, `src/modules/dice/systemes/jetsAlien.ts`). Équiper un Marine, c'est recopier « +1 »,
  « 3 », « Longue » à la main ; une faute de frappe change le jet.
- **Le pilote ne connaît que des tables de butin** (`lootTables`). L'objet d'inventaire a un
  `properties` libre que ni le jet ni le combat ne lisent.
- **Les chiffres existent, relus** : les 18 fiches de Colonial Marines (§ 185, relues le 02/11).

## Décisions de David (02/11)

1. **Quatre familles**, chacune avec ses caractéristiques. David proposait trois familles (armes,
   véhicules, équipement descriptif) et les objets spéciaux ; la discussion a ajouté les protections, et
   les objets spéciaux sont devenus du matériel à effets.

   | Famille | Ce qu'elle porte |
   | --- | --- |
   | **Armes** | les colonnes d'attaque du jeu, des propriétés (perce-armure, mode automatique…) |
   | **Protections** | la Protection et les colonnes du jeu (réserve d'air, malus) |
   | **Véhicules** | un profil propre (passagers, maniabilité, vitesse, coque, Protection) et leur armement |
   | **Matériel** | poids, coût, description et une **liste d'effets**, éventuellement vide |

2. **Les objets spéciaux** (implant cyber, anneau magique, palmes M11, nécessaire NRBC) sont du
   matériel à effets ; « implant », « magique » sont des **étiquettes**, pas une famille.
3. **Un objet peut en contenir d'autres** par référence : la CCC5 et son AK-104S, l'EXOM et ses six
   armes, le M577 et ses tourelles. On corrige le M41A une fois.
4. **Les effets du matériel sont rappelés, pas appliqués** : leurs conditions sont narratives (« sous
   l'eau »). Le panneau de jet les propose avec une case à cocher.

## Le modèle (dans `src/types/drivers.ts`)

```ts
catalogue?: {
  /** Les colonnes que CE jeu donne à chaque famille — Alien : bonus, dégâts, portée. */
  colonnes: Partial<Record<FamilleDObjet, ColonneDuCatalogue[]>>;
  objets: ObjetDuCatalogue[];
};
type FamilleDObjet = 'arme' | 'protection' | 'vehicule' | 'materiel';
interface ColonneDuCatalogue { id: string; libelle: string; nature: 'nombre' | 'texte' }
interface ObjetDuCatalogue {
  id: string; famille: FamilleDObjet; nom: string; nomOriginal?: string;
  categorie?: string;            // « Pistolets », « Armes lourdes » : le classement du livre
  etiquettes?: string[];         // « implant », « magique »
  valeurs: Record<string, string | number>;   // clés = colonnes de la famille
  proprietes?: string[];         // « Perce-armure », « Mode automatique »
  poids?: string; cout?: string; description?: string;
  effets?: { cible: string; valeur?: number; condition?: string; texte: string }[];
  contient?: string[];           // ids d'autres objets du catalogue
  source?: { livre: string; page?: number; fiche?: string };
}
```

**Le socle est commun, les colonnes sont celles du jeu.** On ne type pas d'avance les armes de
RuneQuest ou de Shadowrun : chaque pilote déclare ses colonnes. Le champ est facultatif, donc les pilotes
existants restent valides, et l'archive `.gmos-driver` le transporte telle quelle.

## Les étapes

| # | Étape | Ce qu'elle livre | Vérification |
| --- | --- | --- | --- |
| A | **Le modèle et son contrôle** | le type ; `controlerLePilote` refuse un `contient` qui pointe dans le vide, une valeur hors des colonnes déclarées, deux objets du même id | essais du contrôle |
| B | **La section « Équipement » de l'éditeur du pilote** | huitième section de `RuleEngineEditor` : quatre onglets, une liste filtrable, un formulaire par objet, l'éditeur des colonnes | essais du composant ; essai de David |
| C | **Le remplissage depuis le corpus** | lecture **déterministe** des tableaux Markdown des fiches relues (Colonial Marines d'abord) : les en-têtes rapprochés des colonnes du jeu, chaque ligne devient un objet avec sa source et sa page. Aperçu avant d'enregistrer ; règle d'`enrichirLePilote` (on remplit, on n'écrase jamais) ; les lignes non rapprochées sont montrées, pas jetées. **Aucun appel au carnet** : les fiches sont relues, on ne refait pas lire le livre | essais sur les 18 fiches réelles (nombre d'objets, quelques valeurs témoins : M108 dégâts 3, Type 4 à 200 $) |
| D | **« Prendre dans le catalogue » sur la fiche Alien** | pour une arme : une ligne ajoutée à chaque champ (noms, bonus, dégâts, portées, propriétés) ; pour une protection : le champ `protection`. La fiche HTML suit par « Sauvegarder » | essais de `equipementsAlien` avec un objet pris ; essai de David |
| E | **Le rappel des effets au panneau de jet** | les effets du matériel porté qui visent la compétence lancée, avec leur condition et une case | essais du panneau |

Ensuite, hors de ce chantier : Loot-OS qui distribue un objet du catalogue, les véhicules à la table
(piloté, endommagé), les autres jeux.

## Questions ouvertes

1. ~~**Le livre de base d'Alien n'a pas de fiche d'équipement relue.**~~ **Tranché le 02/11** : David
   choisit la transcription depuis le PDF lu en image (voir « Avancement », étape C).
2. **Où vit le bouton de l'étape D** : sur la fiche GM-OS du personnage (à localiser dans le gabarit
   d'Alien), probablement à côté des champs d'armes.

## Avancement

- **Étape A livrée le 02/11** (GM-OS fermé) : les types dans `src/types/drivers.ts` (`catalogue?` du
  pilote) ; `src/modules/equipement/catalogue.ts` — `controlerLeCatalogue` (objet contenu introuvable
  ou lui-même, cercles signalés une fois, valeur hors des colonnes de la famille, identifiants en double,
  familles et colonnes mal déclarées, effet muet, page invalide ; un texte dans une colonne de nombres
  n'est qu'un avertissement : « Puissance 9 »), `objetsContenus`, `objetsDeLaFamille`,
  `identifiantDObjet` ; branché dans `controlerLePilote`. Essais `catalogue.test.ts` (12, dont la
  survie du catalogue au schéma de l'état sauvegardé) ; 30 fichiers de la Forge et de l'équipement,
  580 essais ; `npx tsc -b`, eslint.
- **Le design d'écran passe par Stitch** — consigne de David du 02/11, pour les étapes B, D et E. La
  méthode est celle de la refonte (`2026-09-27-prompts-stitch-tour-2.md`, `stitch/README.md`) : une
  conversation par écran, un prompt court écrit depuis le code, l'export rendu par Claude avant d'être
  jugé, l'intégration dans la grammaire commune (`GabaritDeModule`, jetons des thèmes).
- **Étape B livrée le 02/11** (GM-OS fermé), d'après l'écran Stitch retenu au second tour :
  `src/modules/session/components/rules/EditeurDuCatalogue.tsx`, qui devient la section
  « Équipement » de `RuleEngineEditor`, placée entre les Trésors et la Connaissance, avec son résumé
  « n objet(s) au catalogue ». Les gestes d'édition sont des fonctions pures de `catalogue.ts` :
  - colonnes ajoutées, modifiées, retirées avec leurs valeurs (après confirmation si elles en portent) ;
  - objets ajoutés, modifiés, supprimés, ce qui retire aussi les renvois vers eux ;
  - rangement par catégorie et recherche sans accents.

  Ce qui change par rapport à l'écran de Stitch :
  - la grille suit les colonnes que la famille déclare ;
  - « Emporte » se choisit dans une liste du catalogue ;
  - les cibles des effets sont proposées depuis les champs de la fiche du jeu ;
  - une case vidée disparaît, au lieu de laisser une chaîne vide.

  Vérifié :
  - `catalogue.test.ts` (18 essais) et `EditeurDuCatalogue.test.tsx` (7) ;
  - session, Forge et équipement : 224 fichiers, 2 440 essais ;
  - **la suite complète** : 793 fichiers, 9 555 essais. Son seul échec venait du manuel des jeux,
    qui n'avait pas de ligne pour `catalogue` ; la ligne est ajoutée au 53 ;
  - `npx tsc -b` et eslint passent.

  Le guide 50 décrit la section. **Reste l'essai de David à l'écran** (voir « Garde-fous »).
- **Commit et push le 02/11** à la demande de David : `46047760` (supplément, § 185) et `a0299fc1`
  (catalogue, étapes A et B).
- **Étape C, la lecture livrée le 02/11** (GM-OS fermé) ; l'aperçu attend son écran Stitch.
  - **Livre de base, décision de David** : *« Je transcris »*. Quatre fiches écrites depuis le PDF
    lu en image (PDF = imprimée + 3 ; l'errata 2021 ne touche pas le chapitre) :
    `docs/systems/alien/rules/equipement-{armes,protections,materiel,vehicules}-du-livre-de-base.md`,
    `hors_canevas: true` et un `sujet:` hors du canevas, donc sans poids sur l'invite de la Forge.
    Chaque tableau porte sa page imprimée dans son titre (« Tableau des Armes lourdes (p. 124) »).
  - **`src/modules/equipement/depuisLeCorpus.ts`**, `remplirDepuisLesFiches(catalogue, fiches,
    champsDeLaFiche)` : rend le catalogue proposé et un journal (objets ajoutés et complétés,
    colonnes déclarées, écarts conservés, rattachements, renvois non résolus, lignes non lues,
    tableaux écartés). Règles :
    - la famille se lit à la première colonne (« Arme », « Armure », « Véhicule », « Tenue »,
      « Appareil »…) ; les autres tableaux (D66, terrains, spécialités) sont écartés et nommés ;
    - poids, coût et « Spécial » vont au socle ; les autres colonnes deviennent celles du jeu,
      rapprochées par leur libellé, en nombre si la moitié des valeurs en sont ;
    - la page vient du titre du tableau, sinon de la section résolue par l'index du livre ;
    - les propriétés d'une arme sont les morceaux courts de « Spécial » ; le texte entier va dans la
      description ;
    - les effets : un nombre **signé** et les libellés des champs de la fiche autour de lui, ce qui
      rejoint `machines_lourdes` ou `soins_medicaux` ; « Soins médicaux 6 » n'est pas un effet ;
    - « compris dans la CCC5 » rattache l'objet à son porteur (`contient`), par un mot entier du nom ;
    - on remplit ce qui est vide, on ne remplace rien, et l'écart est dit.
  - **Chiffres** : Colonial Marines, 66 objets (26 armes, 5 protections, 23 véhicules, 12 matériel),
    16 colonnes, 2 rattachements, 12 tableaux écartés ; livre de base, 89 objets (28, 6, 6, 49).
    Lus ensemble : le casque M10 trouve l'armure M3, le Cheyenne présent dans les deux livres n'est
    pas doublé (154 objets).
  - **Essais** : `depuisLeCorpus.test.ts` (10), sur les vraies fiches lues par `import.meta.glob`.
  - **L'aperçu livré le même jour** (GM-OS fermé), d'après l'écran Stitch retenu au premier tour :
    `src/modules/session/components/rules/RemplirDepuisLeCorpus.tsx`, ouvert par le bouton « Remplir
    depuis le corpus » de la section ; `src/modules/equipement/livresDuJeu.ts` lit le livre de base
    puis chaque supplément déclaré (`ai.listDir`, `ai.readDoc`, et `ai.resolveSections` dans l'index
    de chaque livre). Les effets rejoignent les champs par leur libellé sans la section.
    Essais : `RemplirDepuisLeCorpus.test.tsx` (6), `livresDuJeu.test.ts` (2). Guide 50 :
    « Remplir le catalogue depuis le corpus ».
  - **Reste de C** : l'essai de David à l'écran.
- **Étape D livrée le 02/11** (GM-OS fermé ; écran Stitch retenu au premier tour, capture de la
  section « Armes & protections » fournie par David).
  - `src/modules/equipement/equiperLaFiche.ts` : `champsDEquipement` lit les champs déclarés par le
    pilote (`jet.alien.equipement`, `combat.alien.proprietesArmes`, `combat.alien.protection`) ;
    `sectionDuCatalogue` choisit la section qui reçoit le bouton ; `ecrituresDeLObjet` dit ce qui
    sera écrit ; `appliquerLesEcritures` l'écrit.
  - Une arme prend le rang qui suit **le plus long** de ses champs : aucune ligne n'est écrasée, les
    lignes d'une arme restent appariées. Un bonus absent s'écrit 0.
  - Une protection remplace la valeur, et l'encadré dit « 6 → 2 » ; la sauvegarde reste le geste
    de David, donc pas de confirmation de plus. Un objet qui en emporte d'autres les propose
    (case cochée par défaut).
  - `src/modules/session/components/PrendreDansLeCatalogue.tsx`, ouvert depuis
    `CharacterSheetEditor` ; les valeurs vont dans la saisie en cours (`updateLocal`).
  - Essais : `equiperLaFiche.test.ts` (7, dont la lecture par `equipementsAlien` de l'arme
    ajoutée), `PrendreDansLeCatalogue.test.tsx` (4). Manuel `54-Jeu-Alien.md` (« Prendre une arme
    ou une protection dans le catalogue ») et guide 50 à jour.
  - **Reste de D** : seul Alien déclare ses champs d'armes.
- **Essai de David, 02/11** : *« ok ca marche bien »* — B, C et D essayés à l'écran.
- **Étape E, commencée le 02/11.** Question posée à David : d'où le jet tire-t-il les objets portés ?
  Trois voies (Sac à dos, champ Inventaire de la fiche, tout le catalogue) ; il choisit **le Sac à
  dos**.
  - « Prendre dans le catalogue » gagne un onglet **Matériel** ; le matériel, et la protection
    prise, entrent au Sac à dos par `objetPourLeSac`, reliés au catalogue par
    `properties.catalogueId`, sans doublon. Le Sac à dos s'enregistre aussitôt, comme son bouton
    « + » : la fenêtre le dit.
  - `objetsPortes` : le Sac à dos relié au catalogue, et les armes nommées sur la fiche.
    `effetsAuJet` : les effets qui visent un champ du jet. `valeurDesEffetsCoches` : leur somme.
  - Essais : `equiperLaFiche.test.ts` (10), `PrendreDansLeCatalogue.test.tsx` (5).
  - **La carte « Équipement porté » livrée le 02/11** : `fields/EquipementPorte.tsx`, sous la
    préparation d'Alien dans `PanneauDeJet.tsx` (prop `objetsPortes`, calculée par
    `CharacterSheetEditor`). Rien de coché par défaut ; la somme cochée s'ajoute aux dés au même
    endroit que le bonus d'outil (`composerLesDesAlien`), et le détail du jet la nomme. Essai :
    `PanneauDeJet.equipement.test.tsx` (3). Manuel 54-Alien et guide 50.
  - **Écran généré par le MCP Stitch**, branché le 02/11 à la demande de David : la clé était déjà
    dans `STITCH_API_KEY`, celle de Codex ; `claude mcp add … -s user`, avec la clé lue dans la
    variable. La modification de l'écran « Fiche de Lambert : Lancer un test » du projet de la
    refonte (228 écrans) a dépassé le délai deux fois sans rien produire. La génération dans un
    projet neuf, « GM-OS — Catalogue d'équipement (étape E) », a abouti ; son image n'est arrivée
    qu'en vignette du projet, pas encore dans la liste des écrans. Retenue au premier tour :
    `stitch/equipement/equipement-jet.png`. À l'intégration, la carte prend la grammaire de
    `PreparationAlien`, en 12 px.
  - **Défaut vu par David à l'écran, le même soir** : *« je ne vois pas les jumelles pour le
    bonus »*. Son gabarit d'Alien préfixe les compétences de leur attribut (« Es_Observation »,
    « Ag_Combat à distance ») ; le remplissage cherchait « es_observation » dans « Modificateur de +2
    en Observation », ne trouvait rien, et versait les Jumelles **sans effet**. Les essais
    employaient des libellés sans préfixe. Corrigé dans `depuisLeCorpus.ts` (`nomsDuChamp`) : le
    libellé, le libellé sans son préfixe, et l'identifiant (`soins_medicaux` → « soins medicaux »).
    Essai ajouté avec les libellés réels. Un catalogue déjà rempli reçoit les effets manquants au
    prochain « Remplir depuis le corpus » (on remplit ce qui est vide).
  - **Audit des effets, à la question de David** (*« est-ce qu'il a d'autres équipement sans leurs
    bonus ? »*) : les deux livres lus avec ses identifiants et des libellés préfixés donnent 30
    objets à effets. Deux défauts corrigés :
    - les Palmes M11 recevaient aussi « Réserve d'Eau +2 » : le « eau » de « sous l'eau » était pris
      pour le champ Eau. Désormais, seul le nom qui touche le nombre est retenu, et les suivants
      seulement s'ils y sont liés par « et » ou une virgule ;
    - au jet, les effets sur le Niveau de Stress (café, pilules, alcool) se proposaient comme des dés
      de base ; le panneau ne rapproche plus les composantes secondaires.

    La grenade G2, « Effet étourdissant (-2) », reste sans effet, et c'est juste : le -2 frappe le
    test d'Endurance de la cible (p. 125).
  - **Vérifié sur l'export de David du 02/11, 22 h 30** (*« je n'ai pas l'impression que les
    équipements ont hérité des bonus »*) : le catalogue porte ses 30 effets, et le jet réel (son
    pilote, son gabarit) affiche les Jumelles au Sac à dos. Seules les Palmes gardaient « eau +2 ».
  - **Défaut de l'éditeur, vu par David** (*« je n'arrive pas à configurer les palmes »*) : la cible
    d'un effet était une case libre avec des suggestions d'identifiants ; taper « Ag_Mobilité » visait
    un champ inexistant. C'est maintenant une liste des champs de la fiche (le libellé affiché,
    l'identifiant enregistré), et une cible inconnue s'affiche en alerte. Essai dans
    `EditeurDuCatalogue.test.tsx`.
  - **Essai de David, 02/11 au soir** : *« ok ca marche »* — Palmes reconfigurées par la liste,
    effets rappelés au jet. **Les cinq étapes sont essayées.**
  - **Captures du manuel**, à la demande de David (*« fais le maintenant »*) : scène
    `sceneDuCatalogueAlien` de `e2e/capturesDesJeux.spec.ts`, jouée en tête des scènes d'Alien
    (l'éditeur du pilote ne s'ouvre plus une fois une séance ouverte) ; le profil jetable reçoit les
    `rules/`, `index/` et `supplements/` d'Alien. Lancée sur l'export de David du 02/11 seul
    (`GMOS_PILOTES_DES_JEUX`), images dans un dossier de travail (`GMOS_SORTIE_CAPTURES_JEUX`) pour
    n'écraser aucune image suivie ; cinq images neuves `jeu-alien-catalogue-{remplir,section,fiche}`
    et `jeu-alien-equipement-porte{,-jet}`, relues, insérées aux guides 50 et 54.
  - **Reste** : les autres jeux (leurs champs d'équipement et l'application des effets cochés), la
    tablette (Hub), qui ne reçoit pas l'équipement porté.
  - **À savoir** : la famille des véhicules reçoit 11 colonnes, car les vaisseaux de Colonial
    Marines ont les leurs (Équipage, Troupes, Longueur, Cadence FTL, Signature, Propulseurs).
    Le TPB M577 et le fusil AK-4047 portent deux noms selon le livre, donc font deux objets.

## Étape B — le prompt Stitch (02/11)

**Joindre** : la capture de la section « Tables de butin » fournie par David le 02/11. Elle tient lieu
de grammaire, car l'éditeur du pilote a son propre habillage, en thème clair, avec un titre en
italique et des cartes arrondies. **Une seule conversation Stitch**, comme pour les écrans de la refonte.
Les données d'exemple viennent des fiches relues de *Colonial Marines* : pistolets p. 66, charge de
brèche Type 4 dans les explosifs. La section affichera les constats réels de `controlerLeCatalogue`.

```text
Même logiciel que la capture jointe : c'est la section « Tables de butin » de l'éditeur du pilote
d'un jeu. Dessine la section voisine, « Équipement », dans la MÊME colonne et le MÊME style : titre
en capitales italiques avec un sous-titre souligné, cartes très arrondies, libellés en petites
capitales espacées, accent doré, thème clair. Ne dessine que la zone de contenu, comme la capture :
la liste des sections de l'éditeur existe déjà à gauche.

Ce que fait la section : tenir le catalogue d'équipement du jeu, en quatre familles d'objets. Chaque
jeu déclare les colonnes chiffrées de chaque famille.

De haut en bas :
1. En-tête : une icône, « ÉQUIPEMENT » et le sous-titre « Catalogue du jeu ». Une phrase : « Les
   armes, protections, véhicules et le matériel du jeu, avec leurs caractéristiques. Une fiche de
   personnage s'équipe ici au lieu de recopier les chiffres. »
2. Quatre onglets avec leur compte : Armes (4) · Protections (2) · Véhicules (1) · Matériel (1).
   L'onglet Armes est ouvert.
3. Une carte « Les colonnes des armes », comme la carte « Le vocabulaire de ce jeu » de la
   capture. Une ligne par colonne : son libellé, un choix Nombre / Texte en deux boutons, une
   corbeille. Puis « + Ajouter une colonne ». Les colonnes sont Bonus (Nombre), Dégâts (Nombre) et
   Portée (Texte).
4. Un champ « Chercher un objet » et, à droite, le bouton plein « + Ajouter un objet ».
5. La liste des armes, rangée sous deux intertitres de catégorie. Une ligne par objet : le nom, le
   nom original en petit dessous, une cellule par colonne, les propriétés en pastilles, la page de
   la source.
   Pistolets :
   - Pistolet semi-automatique VP-70MA6 — VP-70MA6 Semi-Automatic Pistol — +2 · 1 · Moyenne — p. 66
   - Pistolet semi-automatique Norcomm QSZ-203 — +1 · 1 · Moyenne — Perce-armure — p. 66
   - Pistolet électrostatique semi-automatique Weyland ES-4 — +1 · 1 · Moyenne — Sonne la cible,
     Perce-armure — p. 66
   Explosifs :
   - Charge de brèche Armat Type 4 — Bonus vide · Dégâts « Puissance 9 » · Portée vide — pas de page.
     Cette ligne porte un avertissement discret, ocre : « “Puissance 9” n'est pas un nombre : une
     mécanique qui lit les dégâts ne le comptera pas. »
6. La première ligne, VP-70MA6, est dépliée en fiche de l'objet, juste sous elle :
   Nom ; Nom original ; Catégorie ; Étiquettes (pastilles, « + ») ; une case par colonne (Bonus +2,
   Dégâts 1, Portée Moyenne) ; Propriétés (pastilles, « + ») ; Poids « ½ » ; Coût « 250 $ » ;
   Description (vide) ;
   « Effets » : vide, avec « + Ajouter un effet » (un effet = un texte, la compétence visée, une
   valeur, une condition) ;
   « Emporte » : vide, avec « + Choisir dans le catalogue » ;
   Source : livre « Marines Coloniaux », page 66 ;
   en bas à droite, « Supprimer l'objet » en rouge discret.

C'est TOUT. N'ajoute rien : pas d'image d'objet, pas de total, pas d'import, pas d'export, pas de
bouton d'IA, pas de statistiques, pas de rareté, aucun chiffre qui ne soit pas ci-dessus. Libellés
en français. Rien en dessous de 12 px ; texte courant contraste ≥ 4,5.
```

**Premier tour (02/11), relu dans son code** : Stitch n'a inventé aucune fonction. Pas d'IA, pas
d'import, pas de chiffre étranger. Le compte par catégorie (« 3 objets ») est gardé, puisqu'il se
déduit de la liste. Six écarts sont à corriger :

- les valeurs des lignes repliées ne s'alignent pas d'une ligne à l'autre, et n'ont pas d'en-tête.
  C'est illisible pour un véhicule à six colonnes ;
- seule la ligne dépliée a un chevron ;
- « Perce-armure » a une couleur à part, qui ne veut rien dire ;
- certains boutons ont deux signes « + » ;
- les colonnes sont numérotées 01, 02, 03, et la carte porte un sous-titre inventé ;
- le texte gris (`#8892a0` sur blanc) tombe sous un contraste de 4,5.

L'en-tête de la section, lui, reprendra le code de « Tables de butin » à l'intégration. Image du
premier tour : `Stitch/equipement/tour-1-screen.png`. Le prompt correctif, dans la même
conversation :

```text
Garde tout, avec ces corrections seulement :
1. Les valeurs des lignes repliées s'alignent en colonnes d'une ligne à l'autre. Sous chaque
   intertitre de catégorie, une ligne d'en-tête discrète : « Bonus · Dégâts · Portée · Propriétés ·
   Source ». Chaque objet remplit ces mêmes colonnes, à la même place ; une valeur vide est un
   tiret. Un véhicule aura six colonnes : la grille doit le permettre.
2. Chaque ligne repliée porte le chevron « déplier », comme la ligne dépliée porte « replier ».
3. Toutes les pastilles de propriétés ont le même style neutre ; « Perce-armure » n'a pas de
   couleur à part.
4. Un seul « + » par bouton : retire le signe tapé là où l'icône est déjà là.
5. Retire les numéros 01, 02, 03 des colonnes et la mention « Déclarées pour ce jeu ».
6. Dans la fiche dépliée, « Colonnes caractéristiques » devient « Caractéristiques » ;
   « + Ajouter un effet » et « + Choisir dans le catalogue » ont le même style de bouton.
7. La source se saisit en deux champs : Livre « Marines Coloniaux » et Page « 66 ».
8. Le texte gris secondaire (« pas de page », « Aucune description renseignée », les intitulés)
   atteint un contraste de 4,5 sur son fond.
N'ajoute rien d'autre.
```

**Second tour (02/11) — retenu.** Les huit corrections sont faites. L'image de Stitch était encore
celle du premier tour ; le rendu de Claude à 1440 px fait foi et ne trouve aucun texte sous 12 px.
Ce rendu est rangé dans `stitch/equipement/equipement-armes.png` et `.html`.

**Pour l'intégration** (on ne colle pas le code de Stitch) :

- l'en-tête reprend celui de « Tables de butin », et les couleurs sont les jetons du thème, pas les
  valeurs de Stitch. L'icône est `Swords` de lucide ;
- la grille des lignes se construit **depuis les colonnes déclarées** de la famille : le nom, une
  cellule par colonne, les propriétés, la source. Les 12 colonnes fixes de Stitch ne tiennent pas pour
  un véhicule. Une cellule ne coupe pas sa valeur : « Puissance 9 » et « pas de page » passaient à la
  ligne dans le rendu ;
- la fiche dépliée est faite de vrais champs. « Emporte » propose une liste des objets du catalogue,
  jamais une saisie libre. Les constats viennent de `controlerLeCatalogue` et s'affichent sous la ligne
  qu'ils visent.

**Ensuite** (historique du premier tour) : David rapporte l'image et l'export HTML. Claude rend le HTML à 1440 px pour le juger
(l'image de Stitch peut retarder sur son code), retire les inventions par un prompt correctif, et
range le retenu dans `stitch/equipement/`.

## Étape C — le prompt Stitch de l'aperçu (02/11)

L'aperçu est un écran neuf : il passe par Stitch (consigne de David). **Dans la même conversation**
que l'écran retenu de l'étape B, qui sert de fond. Les chiffres sont ceux que rend
`remplirDepuisLesFiches` sur les 18 fiches relues. Le cas dessiné suppose que David a déjà créé le
VP-70MA6 à la main pendant l'essai de B et changé son bonus : c'est ce qui montre la règle « on
remplit, on ne remplace pas ».

```text
Même logiciel, même conversation : pars de l'écran « Équipement » que tu as dessiné. Ajoute dans
son en-tête, à gauche de « Ajouter un objet », un bouton au contour seul « Remplir depuis le
corpus ». Dessine la fenêtre qu'il ouvre, centrée sur la section assombrie, dans le même style
(cartes très arrondies, petites capitales espacées, accent doré, thème clair).

Ce que fait la fenêtre : lire les tableaux des fiches de règles relues du jeu et montrer ce qu'ils
ajouteraient au catalogue. Rien n'est enregistré avant « Verser au catalogue ». Ce qui existe déjà
n'est jamais remplacé.

De haut en bas :
1. Titre « Remplir depuis le corpus ». Une phrase : « Les tableaux des fiches relues. On remplit ce
   qui est vide ; ce que vous avez corrigé reste tel quel. »
2. « Livres lus », deux lignes à cocher :
   - Livre de base — « aucune fiche d'équipement relue », grisée, non cochable ;
   - Colonial Marines Operations Manual — « 8 fiches d'équipement sur 18 », cochée.
3. Une ligne de bilan, en chiffres : 65 objets à ajouter · 1 objet complété · 16 colonnes à déclarer
   · 2 rattachements.
4. « Objets », une ligne repliable par famille avec son compte : Armes 25 · Protections 5 ·
   Véhicules 23 · Matériel 12. Armes est dépliée, rangée par catégorie avec son compte :
   Pistolets 3 · Armes lourdes 6 · Fusils 6 · Explosifs, mines et armes chimiques 10. Sous
   Pistolets, trois lignes alignées en colonnes (Bonus · Dégâts · Portée · page) :
   - Pistolet à air comprimé pour injection chimique et biologique Bionational TX-9 — +1 · 1 ·
     Moyenne — p. 66
   - Pistolet électrostatique semi-automatique Weyland ES-4 — +1 · 1 · Moyenne — p. 66
   - Pistolet semi-automatique Norcomm QSZ-203 — +1 · 1 · Moyenne — p. 66
5. « Colonnes à déclarer », en pastilles par famille : Armes : Bonus, Dégâts (nombres), Portée
   (texte) · Protections : Protection, Réserve d'air · Véhicules : Passagers, Maniabilité, Vitesse,
   Coque, Protection, Équipage, Troupes, Longueur, Cadence FTL, Signature, Propulseurs.
6. « Rattachés » : « Combinaison de compression offensive CCC5 emporte Canon à impulsion intégré
   Norcomm AK-104S » ; « Fusil d'assaut Weyland-Yutani NSG23 emporte Incinérateur amovible ID23 ».
7. « À regarder », bordé d'ocre discret, deux lignes :
   - « Pistolet semi-automatique VP-70MA6 · Bonus : catalogue +3, fiche +2 — gardé +3 » ;
   - « Casque pare-balles M10 : “compris dans l'armure personnelle M3” — porteur absent du
     catalogue ».
8. Une ligne repliée : « 12 tableaux écartés (tables de D66, terrains, spécialités) ».
9. En pied, à droite : « Annuler » (texte) et « Verser au catalogue » (bouton plein doré).

C'est TOUT. N'ajoute rien : pas de barre de progression, pas d'IA, pas d'import de fichier, pas de
statistiques, aucun chiffre qui ne soit pas ci-dessus. Libellés en français. Rien en dessous de
12 px ; texte courant contraste ≥ 4,5.
```

**Premier tour (02/11) — retenu.** David a rapporté l'image et le HTML. Le rendu de Claude à 1440 px
(fenêtre haute, pour voir tout le contenu de la fenêtre) ne trouve aucun texte sous 12 px, et Stitch
n'a rien inventé de fonctionnel. Rangé dans `stitch/equipement/equipement-apercu.png` et `.html`, avec
un fond allégé : c'est l'écran de l'étape B.

**Pour l'intégration** :

- les catégories d'une famille en pastilles qui filtrent la liste (idée de Stitch, gardée) ; la grille
  suit les colonnes de la famille, comme dans la section ;
- chaque colonne à déclarer dit sa nature (Stitch ne l'écrit que pour Dégâts et Portée) ;
- le bilan en texte courant, pas en chasse fixe, qui se coupait mal ;
- l'étiquette « ignoré » des tableaux écartés est retirée : la ligne le dit déjà ; dépliée, elle les
  nomme fiche par fiche ;
- « Livres lus » liste le livre de base et les suppléments du jeu ; un livre sans tableau d'équipement
  est grisé ;
- « À regarder » réunit les écarts conservés, les renvois non résolus et les lignes non lues ;
- les couleurs sont les jetons du thème, l'en-tête reprend celui des fenêtres de l'éditeur.

## Étape D — le prompt Stitch (02/11)

David : *« ok on passe à l'étape D »*. La fiche du personnage est dessinée champ par champ par
`CharacterSheetEditor`, selon le gabarit du pilote, qui vit dans les données de David. Il a donc
fourni la capture de la section « Armes & protections » d'un personnage d'Alien : papier beige,
intertitre rouge, six champs (armes, protection, bonus, dégâts, portées, propriétés, une ligne par
arme). **Une conversation Stitch neuve**, puisque l'habillage n'est pas celui de l'éditeur du
pilote.

Ce que l'étape écrira : pour une arme, une ligne dans chacun des champs que lit `equipementsAlien`
(`jet.alien.equipement` : noms, bonus, dégâts, portées) et dans `combat.alien.proprietesArmes` ;
pour une protection, `combat.alien.protection`, avec une confirmation s'il est déjà rempli.

```text
Même logiciel que la capture jointe : c'est la section « Armes & protections » de la fiche d'un
personnage d'Alien, dans l'éditeur de fiche. Garde EXACTEMENT ce style : fond papier beige,
intertitre rouge en petites capitales espacées, champs encadrés d'un filet fin, libellés en
petites capitales grises.

1. Dans la ligne de l'intertitre « ARMES & PROTECTIONS », à droite, ajoute un petit bouton au
   contour seul « Prendre dans le catalogue ». Ne change rien d'autre à la section.

2. Dessine la fenêtre que ce bouton ouvre, centrée sur la fiche assombrie, dans le même style.
   - Titre « Prendre dans le catalogue ». Une phrase : « L'objet choisi s'ajoute aux champs de la
     fiche. Rien n'est enregistré avant « Sauvegarder ». »
   - Deux onglets avec leur compte : Armes 54 · Protections 11. Armes est ouvert.
   - Un champ « Chercher dans le catalogue ».
   - Des pastilles de catégorie : Pistolets · Fusils · Armes lourdes · Combat rapproché ·
     Explosifs, mines et armes chimiques. « Fusils » est choisie.
   - La liste, alignée en colonnes sous un en-tête discret « Arme · Bonus · Dégâts · Portée ·
     Propriétés · Page » :
     - Fusil à impulsion Armat M41A — +1 · 2 · Longue — Lance-grenades intégré, Mode auto,
       Perce-armure — p. 120 (cette ligne est sélectionnée, bordée d'accent)
     - Fusil à lunette M42A — +2 · 2 · Extrême — Perce-armure — p. 120
     - Fusil à pompe Armat modèle 37A2 calibre 12 — +2 · 3 · Courte — Protection doublée — p. 120
     - Fusil d'assaut à impulsion AK-4047 — — · 2 · Longue — Mode auto — p. 120
   - Sous la liste, un encadré « Ce qui sera écrit sur la fiche », une ligne par champ :
     Armes : + Fusil à impulsion Armat M41A · Bonus : + +1 · Dégâts : + 2 · Portée : + Longue ·
     Propriétés : + Lance-grenades intégré, Mode auto, Perce-armure
   - En pied, à droite : « Annuler » (texte) et « Ajouter à la fiche » (bouton plein).

C'est TOUT. N'ajoute rien : pas d'image d'objet, pas de prix, pas de poids, pas de statistiques,
pas d'IA, aucun chiffre qui ne soit pas ci-dessus. Libellés en français. Rien en dessous de
12 px ; texte courant contraste ≥ 4,5.
```

**Premier tour (02/11) — retenu.** Le rendu de Claude à 1440 px est fidèle à l'image ; Stitch n'a
rien inventé dans la fenêtre. Son fond, une fiche « USCSS Nostromo » refaite, n'est pas repris : la
section réelle est celle de la capture. Rangé dans `stitch/equipement/equipement-fiche.png` et
`.html`, fond allégé. **Pour l'intégration** :

- l'en-tête du tableau était en 11 px : il passe à 12 px (`text-ui-12`) ;
- les colonnes du tableau suivent celles que le jeu déclare pour la famille, comme ailleurs ;
- le bouton s'affiche dans la section qui porte le champ des noms d'armes déclaré par le pilote,
  pas dans une section nommée en dur ;
- l'onglet Protections montre « Protection : 0 → 6 », et un objet qui en emporte d'autres
  (la CCC5 et son canon) propose de les ajouter aussi ;
- les couleurs sont les jetons du thème de la fiche.

## Étape E — le prompt Stitch (02/11)

**Joindre** : `documentation/User Guides/captures/jeu-alien-jet.jpg`, le panneau de jet d'Alien
photographié par `e2e/capturesDesJeux.spec.ts` (instance jetable, données fictives). David a
demandé pourquoi Claude ne prenait pas lui-même la capture par Playwright : elle existait déjà, il
aurait fallu commencer par là. **Aucun MCP Stitch n'est branché** dans la session ; en brancher un
est une installation, à la demande de David. **Une conversation Stitch neuve.**

La troisième ligne d'effet (lampe-torche, « dans l'obscurité ») est inventée pour montrer une
condition : le livre ne chiffre pas la lampe.

```text
Même logiciel que la capture jointe : c'est le panneau de jet d'un personnage d'Alien, avec ses
étapes numérotées « 1 Composer », « 2 Préparer le test Alien », « 3 Lancer les dés ». Garde
EXACTEMENT ce style : thème sombre, cartes à filet fin, titres d'étape en capitales espacées,
libellés gris au-dessus des champs.

Ne redessine que les étapes 1 et 2, avec ces changements :

1. Dans « Composer », la compétence choisie est « Observation (3) », l'attribut « Esprit (4) ».
   La ligne de détail devient : « Base 7 + arme 0 + outil/talent 0 + équipement +2 + situation 0
   + aide 0 → 9 dés de base, 2 de Stress. » La réserve affiche 9.

2. Dans « Préparer le test Alien », sous les champs existants et au-dessus de la phrase sur
   l'aide, ajoute un encadré « Équipement porté ». Une phrase discrète : « Les effets des objets
   portés qui visent ce jet. Cochez ceux qui jouent ici ; rien n'est appliqué d'office. »
   Puis une ligne par effet, chacune avec une case à cocher, le nom de l'objet, le texte de
   l'effet, sa condition s'il en a une, et sa valeur alignée à droite :
   - [ ] Combinaison de compression offensive CCC5 — Malus de -1 aux tests d'Observation — −1
   - [x] Jumelles — Modificateur de +2 en Observation — +2
   - [ ] Lampe-torche à faisceau concentré — +1 en Observation — dans l'obscurité — +1
   La deuxième est cochée. Sous la liste, à droite : « Équipement : +2 ».

C'est TOUT. N'ajoute rien : pas d'image, pas d'icône d'objet, pas de statistiques, pas d'IA,
aucun chiffre qui ne soit pas ci-dessus. Libellés en français. Rien en dessous de 12 px ; texte
courant contraste ≥ 4,5.
```

## Garde-fous

- ⛔ « GM-OS tourne-t-il ? » avant chaque étape qui touche `src/`.
- Un essai par étape ; `npx tsc -b` ; eslint ; la suite complète à la fin de B et de D.
- Documenter dans la même livraison : guide `50-Forge-des-systemes.md` (section de l'éditeur), manuel
  du jeu Alien (`54-Jeu-Alien.md`) pour l'étape D, synthèse des pilotes, registre.
