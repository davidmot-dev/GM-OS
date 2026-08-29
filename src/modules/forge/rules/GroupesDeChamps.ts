import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';
import { consigneDeLangue } from './langueDeForge';
import { normaliser } from './canevas';

/**
 * Le pilote, dérivé du corpus, un groupe de champs à la fois.
 *
 * **Pourquoi ne pas lire le livre.** L'Atelier l'a déjà lu, a vérifié ses pages
 * et a produit dix-sept fiches v3. Le pilote n'est pas une extraction du livre :
 * c'est une **projection des fiches** dans les champs que l'application
 * consomme. Chaque valeur devient alors traçable jusqu'à une page vérifiée, et
 * la règle tient — *dériver du corpus, pas produire en parallèle*, parce que
 * deux productions indépendantes des mêmes faits divergeront et que rien ne les
 * comparera jamais.
 *
 * **Pourquoi par groupes, et non d'un seul appel.** Mesuré le 2026-08-12 :
 * le budget d'invite réel est d'environ 8 000 tokens. Tout le corpus de Dune en
 * fait 34 500 — l'envoyer entier ne vaut pas mieux que d'envoyer le livre, on
 * en perdrait les trois quarts en silence. Deux fiches font 3 800 tokens, soit
 * la moitié du budget.
 *
 * Le découpage vaut aussi **pour la sortie** : le décodage tourne à 7,7 tok/s,
 * donc cent tokens de JSON coûtent treize secondes. Six petites réponses
 * coûtent moins qu'une grosse, à contenu égal, parce qu'aucune ne dérape.
 */

/** Une fiche du corpus, telle qu'on la lit sur le disque. */
export interface FicheDuCorpus {
    /** Le `sujet:` du frontmatter — c'est par lui qu'on rattache au canevas. */
    sujet: string;
    contenu: string;
    /**
     * Le `couverture:` du frontmatter — `complète`, `partielle` ou `absente`.
     *
     * **`absente` veut dire que le livre ne traite pas ce sujet**, et c'est une
     * réponse, pas un échec. Elle ne doit donc **pas** nourrir son groupe :
     * servie à un modèle, une fiche qui dit « ce jeu n'a pas de monnaie de
     * table » l'invite à en produire une quand même.
     *
     * Relevé sur la dérivation de Cthulhu Hack du 2026-08-16 : `monnaie-de-table`
     * portait `couverture: absente`, et le pilote est ressorti avec une réserve
     * « Fortune » — qui est une ressource **personnelle** du personnage, prise
     * pour une monnaie commune. *Une lacune est une réponse ; elle ne doit pas
     * devenir une invention.*
     */
    couverture?: string;
}

/**
 * Le corpus déclare-t-il ce sujet non couvert ?
 *
 * On ne retient que `absente`. `partielle` reste une matière utile — c'est
 * l'état normal d'un inventaire —, et une fiche sans `couverture:` est une
 * fiche ancienne qu'on n'a aucune raison d'écarter.
 */
export function declareeNonCouverte(fiche: FicheDuCorpus): boolean {
    return (fiche.couverture ?? '').trim().toLowerCase().startsWith('absente');
}

export interface GroupeDeChamps {
    id: string;
    label: string;
    /** Clés du canevas dont les fiches nourrissent ce groupe. */
    sujets: string[];
    /**
     * Ce groupe vise-t-il des identifiants qu'un autre groupe a produits ?
     *
     * **Le défaut du 2026-08-12, et il était total.** Les huit groupes étaient
     * forgés dans l'ignorance les uns des autres, alors que cinq d'entre eux
     * désignent des sections, des champs ou des réserves que seuls les groupes
     * `fiche` et `ressources` inventent. Sur la première dérivation de Dune,
     * **aucune de ces références n'a abouti** : le modèle ne pouvait que
     * fabriquer un identifiant plausible ou recopier ce qu'il avait sous les
     * yeux — c'est-à-dire les titres de chapitre du livre.
     */
    dependDuVocabulaire?: boolean;
    /**
     * La **forme exacte** imposée au décodeur, quand on la connaît.
     *
     * Une consigne se contourne, un schéma non : Ollama le transmet à
     * llama.cpp, qui en dérive une grammaire. Le modèle ne peut alors produire
     * ni clé de trop, ni valeur d'un autre type, ni prose.
     */
    schema?: Record<string, unknown>;
    /** Ce que le modèle doit rendre, décrit en une phrase. */
    cible: string;
    /**
     * Le fragment correspondant du pilote Dune, en JSON compact.
     *
     * **Il montre la forme, jamais les valeurs.** C'est la leçon de l'exemple
     * précédent, qui codait `"isMainHP": true` et enseignait ainsi que tout jeu
     * a des points de vie.
     */
    exemple: string;
}

/**
 * La forme exacte d'un gabarit de fiche, imposée au décodeur.
 *
 * **Ce que quatre échecs ont fini par apprendre.** La fiche de personnage est
 * la seule sortie que `gemma4:12b` n'arrivait pas à rendre : guillemets
 * échappés, fragments orphelins, commentaires en anglais. On a cru à une
 * sortie trop longue, puis à la température, puis à la pénalité de répétition
 * — trois hypothèses, trois réfutations.
 *
 * La vraie raison, montrée par une sonde le 2026-08-12 : **c'était du contenu
 * qui débordait**. Sommé de ne rendre que des sections sans champs, le modèle
 * a fourré les champs dans la chaîne `label`, avec leurs guillemets échappés.
 * Il ne dégénérait pas, il cherchait une place.
 *
 * Un schéma la lui donne, et lui interdit tout le reste — non parce qu'on le
 * lui demande, mais parce que le décodeur ne lui laisse pas d'autre chemin.
 * Mesuré sur la même invite : 465 tokens, `done_reason: stop`, JSON complet et
 * valide, là où l'invite libre cassait à la position 1 027.
 */
const CHAMP_DE_FICHE = {
    type: 'object',
    properties: {
        id: { type: 'string' },
        label: { type: 'string' },
        type: {
            type: 'string',
            enum: ['number', 'text', 'checkbox', 'gauge', 'select', 'textarea', 'rating'],
        },
        defaultValue: { type: ['number', 'string', 'boolean'] },
        max: { type: 'number' },
    },
    required: ['id', 'label', 'type'],
    additionalProperties: false,
} as const;

export const SCHEMA_DU_GABARIT = {
    type: 'object',
    properties: {
        template: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                emoji: { type: 'string' },
                sections: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            label: { type: 'string' },
                            fields: { type: 'array', items: CHAMP_DE_FICHE },
                        },
                        required: ['id', 'label', 'fields'],
                        additionalProperties: false,
                    },
                },
            },
            required: ['name', 'sections'],
            additionalProperties: false,
        },
    },
    required: ['template'],
    additionalProperties: false,
} as const;

/**
 * Les huit groupes, **dans l'ordre de leurs dépendances**.
 *
 * Chaque champ que l'application consomme correspond à un sujet — ce n'est pas
 * un hasard : le canevas avait été dérivé de ce que le code exploite.
 *
 * **L'ordre n'est pas cosmétique.** `fiche` et `ressources` *inventent* le
 * vocabulaire — les sections, les champs, les réserves — que cinq autres
 * groupes ne font que *désigner*. Ils passent donc en premier, et ce qu'ils ont
 * produit est injecté dans les invites suivantes. Sans cela, aucune référence
 * croisée ne peut aboutir autrement que par chance.
 */
export const GROUPES: readonly GroupeDeChamps[] = [
    {
        id: 'fiche',
        label: 'Fiche de personnage',
        sujets: ['Composition de la fiche de personnage', 'Jauges et ressources individuelles'],
        schema: SCHEMA_DU_GABARIT as unknown as Record<string, unknown>,
        /**
         * **L'exhaustivité se demande, et elle se montre.**
         *
         * Dérivée d'Alien le 2026-08-13, la Forge a rendu sept sections dont
         * « Attributs » et « Compétences » — **vides l'une comme l'autre**. Les
         * six jauges, elles, étaient toutes là. L'écart s'explique par ce que
         * l'invite disait : la cible réclamait nommément les jauges et se
         * taisait sur le reste, pendant que l'exemple montrait des sections à
         * **un seul champ**. Le modèle a fait ce qu'on lui montrait.
         *
         * Une fiche sans ses caractéristiques chiffrées n'est pas une fiche
         * incomplète, c'est une fiche inutilisable : `jet.seuil`,
         * `statsToTrack` et les jauges désignent tous des champs qu'elle est
         * seule à créer, et le vocabulaire injecté dans les cinq groupes
         * suivants est celui qu'elle a produit. Ce qu'elle omet, personne ne
         * le rattrape.
         *
         * L'exemple montre donc trois champs frères dans une même section. Le
         * risque de recopie servile — celui qui a valu son exemple muet au
         * groupe `identite` — est ici plus faible : un `combat` ou une
         * `determination` se heurtent aux fiches, qui nomment autre chose.
         */
        cible:
            '"template" avec name, emoji et sections. Chaque champ porte un "type" pris parmi ' +
            'number, text, checkbox, gauge, select, textarea, rating. ' +
            '**"sections" EST UN TABLEAU JSON, et TOUTES les sections y sont**, de la première à ' +
            'la dernière : [{"id":…},{"id":…},{"id":…}]. N\'écris JAMAIS une section comme une ' +
            'propriété posée à côté du tableau. ' +
            '**ÉNUMÈRE TOUS LES ATTRIBUTS ET TOUTES LES COMPÉTENCES que les fiches nomment**, un ' +
            'champ chacun, sans en omettre ni en résumer : si les fiches en citent douze, la ' +
            'section en porte douze. Une section vide ne sert à rien. ' +
            '**ET une section pour les jauges individuelles** (stress, santé, air, eau…) si le jeu ' +
            'en a : elles se suivent en combat et doivent exister comme champs de la fiche. Les ' +
            'attributs, les compétences ET les jauges — les trois, pas l\'un au prix de l\'autre',
        exemple: '{"template":{"name":"Fiche de Personnage","emoji":"📜","sections":[{"id":"competences","label":"Compétences","fields":[{"id":"combat","label":"Combat","type":"number","defaultValue":4,"max":8},{"id":"discipline","label":"Discipline","type":"number","defaultValue":4,"max":8},{"id":"comprehension","label":"Compréhension","type":"number","defaultValue":4,"max":8}]},{"id":"jauges","label":"Jauges","fields":[{"id":"determination","label":"Détermination","type":"gauge","defaultValue":0,"max":5}]}]}}',
    },
    {
        id: 'ressources',
        label: 'Monnaie de table',
        sujets: ['Monnaie de table'],
        cible: '"driver" avec seulement ressourcesDeTable. '
            + 'Pour CHAQUE réserve, dis aussi qui la voit et qui la manipule : '
            + '"visibleAuxJoueurs" (les joueurs la lisent sur leur tablette) et '
            + '"manipulableParLesJoueurs" (ils la font bouger eux-mêmes, sans passer par le '
            + 'meneur). Ce sont DEUX questions distinctes de "proprietaire" : une réserve du '
            + 'meneur peut être publique — les joueurs la voient monter sans y toucher —, et une '
            + 'réserve commune aux joueurs se dépense en général par décision collective. '
            + 'OMETS ces deux champs si les fiches ne le disent pas : on suivra alors le '
            + 'propriétaire',
        exemple: '{"driver":{"ressourcesDeTable":[{"id":"impulsion","label":"Impulsion","proprietaire":"joueurs","depart":0,"min":0,"max":6,"erosionFinDeScene":1,"reportSurEpuisement":"menace","visibleAuxJoueurs":true,"manipulableParLesJoueurs":true},{"id":"menace","label":"Menace","proprietaire":"meneur","depart":0,"min":0,"visibleAuxJoueurs":true,"manipulableParLesJoueurs":false}]}}',
    },
    {
        id: 'identite',
        label: 'Identité et ambiance',
        sujets: ['Ton, registre et ambiance'],
        cible: '"driver" avec seulement name, description, emoji et ui_config.themeColor',
        /**
         * **Le seul exemple à valeurs muettes, et il l'est par nécessité.**
         *
         * Il portait le nom, la description et la couleur de Dune. Dérivée
         * d'Alien le 2026-08-12, la Forge a rendu « Dune : Aventures dans
         * l'Imperium », « Système 2d20 de Modiphius » et `#d97706` — l'exemple
         * recopié au caractère près, sur un corpus qui ne mentionne Dune nulle
         * part.
         *
         * Le décodage glouton, adopté le même jour pour fiabiliser le JSON, y
         * est pour beaucoup : la continuation la plus probable d'un champ
         * `name`, c'est le nom qu'on vient de montrer. Ailleurs le risque est
         * moindre — un `2d20` ou une `impulsion` se heurtent aux fiches, qui
         * disent autre chose. **Ici, l'exemple est une réponse plausible.**
         *
         * Les crochets sont donc là pour être remplis, et ne ressemblent à
         * aucun jeu réel.
         */
        exemple: '{"driver":{"name":"<le titre exact du jeu, tel que les fiches le nomment>","description":"<une phrase sur son système et son ton>","emoji":"<un emoji>","ui_config":{"themeColor":"<#rrggbb assorti à l\'ambiance>"}}}',
    },
    {
        id: 'jet',
        label: 'Dés et composition du jet',
        sujets: ['Résolution des jets', 'Degrés de réussite et critiques'],
        dependDuVocabulaire: true,
        /**
         * **Les énumérations sont dites, parce qu'elles ne se devinent pas.**
         * Dérivée d'Alien, la Forge a rendu `sens: "sup_ou_egal"` et
         * `logic: "count-success"` — la seconde juste par chance, la première
         * fausse d'un caractère. Le moteur n'accepte que deux sens et six
         * logiques ; le modèle ne pouvait pas les inventer.
         *
         * **`dice.engine` manquait à l'appel, et il était le seul.** Relevé sur
         * la dérivation d'Alien du 2026-08-13 : `logic` et `sens` avaient leur
         * énumération écrite ici — parce qu'on s'était fait avoir sur les deux
         * —, `engine` avait douze valeurs possibles et pas une ligne. Il
         * n'existait que dans l'exemple, où il vaut `2d20`. Le modèle avait le
         * choix entre recopier `2d20` sur un jeu qui lance des d6, ou omettre.
         * Il a omis, et c'est la chance qui a tranché.
         *
         * Ce que coûte l'omission : `DiceBoard` et `RemoteDicePad` lisent ce
         * champ pour choisir leur mode, et retombent tous deux sur `standard`.
         * `DiceEngine.rollYZE` — qui compte les six et distingue les dés
         * d'équipement — existe et n'aurait jamais été appelé. Une table
         * lançant des dés génériques toute une séance, sans un mot.
         */
        /*
          **L'ORDRE DE CETTE CIBLE EST DÉLIBÉRÉ, et il vient d'une régression.**

          Le 2026-08-16, j'y ai ajouté les mises en garde sur `2d20` et
          `d100-low` — au milieu. La dérivation suivante a corrigé le moteur…
          et rendu `jet.seuil` VIDE, là où la précédente donnait au moins une
          entrée. Une consigne noyée est une consigne perdue.

          Les deux exigences qu'on ne peut pas rattraper ensuite passent donc en
          TÊTE, courtes ; les énumérations, qui se vérifient d'un coup d'œil à la
          revue, viennent après. C'est le même raisonnement qui place
          `blocDuVocabulaire` juste après la tâche : *la contrainte la plus dure
          ne doit pas se noyer.*

          **ET LA CONSIGNE AINSI REMONTÉE ÉTAIT FAUSSE — troisième fois qu'un
          correctif fabrique le défaut suivant** (2026-08-17). Elle disait : *« si
          la fiche porte six Sauvegardes, les SIX y sont ; une seule entrée
          signifierait qu'on ne peut jamais jeter que celle-là. »* Cthulhu Hack
          est ressorti avec ses six Sauvegardes dans `jet.seuil`, et le panneau a
          exigé les six d'un coup pour les ADDITIONNER — un seuil de 60 là où le
          jeu jette un d20 sous 11.

          La confusion est dans le modèle, pas dans le modèle de langage : une
          `ComposanteDeJet` est *une valeur qui s'ajoute*, et l'alternative se
          joue DANS sa section — « le joueur retient **un** champ de cette
          section ». Une consigne remontée en tête est lue ; encore faut-il
          qu'elle dise vrai. *Écrire d'une liste qu'elle énumère des choix quand
          elle énumère des termes d'une somme, c'est se tromper de mécanique en
          croyant préciser la règle.*
        */
        cible:
            '"driver" avec seulement dice et jet. ' +
            'TROIS EXIGENCES D\'ABORD, le reste ensuite. ' +
            // LE COMPTE D'ABORD, LE CONTENU ENSUITE — et c'est l'inverse qui
            // était écrit. « Une entrée par valeur ajoutée » se lit en tête,
            // donc se lit en premier : douze compétences, douze entrées. La
            // correction venait après, sous condition, et arrivait trop tard.
            // **LA FOURCHE AVANT LE REMPLISSAGE.** Additionner et croiser sur
            // une table ne se rattrapent pas l'un l'autre : un jeu en
            // pourcentage rempli en « seuil » rend une cible cinq fois trop
            // basse, et rien ne le dit. C'est donc la première question, et
            // elle tient en trois lignes — le reste ne s'applique qu'ensuite.
            // **LA FOURCHE A TROIS VOIES depuis le 2026-08-29, et elle n'en avait
            // que deux.** David a redérivé son pilote Blade Runner APRÈS que le
            // moteur ait appris les dés échelonnés, et il est ressorti avec un
            // `jet.seuil` : l'invite ne proposait que « additionner » ou
            // « croiser sur une table », donc le modèle a additionné des valeurs
            // qui sont des LETTRES. *Une voie qu'on n'offre pas est une voie que
            // le modèle ne prend pas* — et le défaut ressemble alors à un
            // manquement du modèle, alors qu'on ne lui avait rien demandé.
            '**(0) COMMENT LE JET SE RÉSOUT-IL ? TROIS VOIES, UNE SEULE À REMPLIR.** ' +
            '(a) Les valeurs de la fiche S\'AJOUTENT pour former le nombre à comparer → remplis ' +
            '"jet.seuil". ' +
            '(b) Le jeu CROISE une caractéristique et un ajustement SUR UNE TABLE — ils déplacent ' +
            'une colonne au lieu de s\'ajouter, et le pourcentage obtenu est bien plus grand que ' +
            'leur somme → remplis "jet.cible". ' +
            '(c) La valeur d\'un attribut ou d\'une compétence est une LETTRE ou un RANG qui ' +
            'DÉSIGNE UNE TAILLE DE DÉ — « A » vaut un dé à douze faces, « B » un dé à dix —, et ' +
            'l\'on lance UN DÉ PAR VALEUR au lieu d\'additionner quoi que ce soit → remplis ' +
            '"jet.desEchelonnes". ' +
            '**REMPLIS UNE SEULE DES TROIS ET LAISSE LES DEUX AUTRES VIDES.** ' +
            '"jet.cible" porte "mecanique", ' +
            // **LE COMPTE, ICI ET PAS PLUS LOIN.** La premiere redaction
            // decrivait le CONTENU de l'ajustement — « les composantes lues sur
            // la fiche » — et laissait son COMPTE a l'exigence (1), donc trop
            // tard : la derivation du 2026-08-22 a rendu ONZE composantes,
            // « Competence 1 » a « Competence 12 », deplacees du seuil vers la
            // cible sans rien perdre de leur defaut. C'est la regle de la veille,
            // enfreinte dans la consigne ecrite pour l'appliquer.
            '"caracteristique" et "ajustement" portent des composantes de la MÊME FORME que ' +
            '"jet.seuil" : {"id","label","sectionId"}, où "sectionId" est OBLIGATOIRE et vaut ' +
            'l\'un des IDENTIFIANTS DISPONIBLES listés plus haut — jamais un mot inventé, ' +
            'jamais une phrase de règle. ' +
            // **Le sous-groupe est une SECTION, pas une composante.** C'est le
            // defaut du 2026-08-22 pris a sa racine : douze « Competence 1 » a
            // « Competence 12 » sont nees parce que la fiche decoupe les
            // competences en sous-groupes et qu'une composante ne pouvait en
            // nommer qu'un. Le champ existe depuis le 2026-08-23 ; l'invite doit
            // le dire, sinon le modele refera douze entrees pour douze sections.
            'SI LA MÊME VALEUR SE LIT DANS PLUSIEURS SECTIONS — des compétences découpées en ' +
            'sous-groupes, des caractéristiques réparties —, cela reste UNE SEULE ENTRÉE : mets ' +
            'la première section dans "sectionId" et TOUTES LES AUTRES dans ' +
            '"sectionsSupplementaires", un tableau d\'identifiants. Le joueur choisira dans ' +
            'l\'ensemble, sous-groupe par sous-groupe. NE FAIS JAMAIS UNE ENTRÉE PAR SOUS-GROUPE : ' +
            'elles s\'ADDITIONNERAIENT, et le panneau réclamerait une compétence de chaque. ' +
            '"caracteristique" est UNE SEULE composante : celle qu\'on lit en ordonnée. Sans ' +
            'elle la mécanique n\'a rien à croiser, et le jet vaut zéro pour cent. ' +
            '"ajustement" porte UNE ENTRÉE PAR SECTION DE FICHE, jamais une par champ : si la ' +
            'fiche compte douze compétences et que le joueur n\'en jette QU\'UNE à la fois, ' +
            'cela fait UNE SEULE entrée — et non douze. ' +
            'Forme attendue, avec des identifiants venus de TA liste : ' +
            '"cible":{"mecanique":"…","caracteristique":{"id":"carac","label":"Caractéristique",' +
            '"sectionId":"…"},"ajustement":[{"id":"competence","label":"Compétence",' +
            '"sectionId":"…"}]}. ' +
            '"mecanique" vaut EXACTEMENT l\'un de : reves-de-dragons. ' +
            'SI AUCUN DE CES NOMS NE DÉSIGNE LE JEU QUE TU LIS, N\'EN INVENTE AUCUN et n\'écris ' +
            'pas "jet.cible" : une mécanique porte une table transcrite d\'un livre, elle ne se ' +
            'déduit pas d\'un nom. NE METS JAMAIS DE NOMBRES DE CETTE TABLE dans le pilote — ' +
            'ni multiplicateurs, ni seuils de réussite particulière : ils sont déjà dans le code, ' +
            'saisis depuis le livre et protégés par des tests. ' +
            // La voie (c), détaillée ici et pas en tête : la fourche se lit
            // d'abord, le remplissage ensuite. Même découpe que pour la cible.
            '"jet.desEchelonnes" porte "echelle" et "composantes". "echelle" vaut EXACTEMENT ' +
            'l\'un de : yze-lettres. SI AUCUN NE CORRESPOND AU JEU QUE TU LIS, N\'EN INVENTE ' +
            'AUCUN et n\'écris pas "jet.desEchelonnes". ' +
            'NE METS JAMAIS LA TABLE DES LETTRES dans le pilote — ni « A vaut douze », ni aucune ' +
            'taille de dé : elle est déjà dans le code, transcrite du livre et protégée par des ' +
            'tests. "composantes" a la MÊME FORME que "jet.seuil" et suit LA MÊME RÈGLE DE ' +
            'COMPTE — UNE ENTRÉE PAR SECTION DE FICHE LUE, jamais une par champ —, mais chaque ' +
            'entrée donne UN DÉ au lieu d\'un terme d\'addition. Chez un jeu où l\'on lance un dé ' +
            'd\'attribut et un dé de compétence : DEUX entrées, DEUX SECTIONS. ' +
            'Forme attendue, avec des identifiants venus de TA liste : ' +
            '"desEchelonnes":{"echelle":"yze-lettres","composantes":[{"id":"attribut",' +
            '"label":"Attribut","sectionId":"…"},{"id":"competence","label":"Compétence",' +
            '"sectionId":"…"}]}. ' +
            'CES JEUX N\'ONT AUCUN SEUIL : ils comptent les dés qui atteignent une valeur, et ce ' +
            'compte est dans le code. N\'écris donc NI "jet.seuil" NI "jet.cible" avec eux, et ' +
            'ne remplis pas "jet.reserve" — la poignée vient des composantes, pas d\'un nombre. ' +
            '**(1) "jet.seuil" ET "jet.cible.ajustement" : UNE ENTRÉE PAR SECTION DE FICHE LUE, ' +
            'JAMAIS UNE PAR CHAMP.** Le ' +
            'nombre d\'entrées est le nombre de SECTIONS différentes où le joueur va lire une ' +
            'valeur — jamais le nombre de valeurs possibles dans ces sections, parce que TOUT CE ' +
            'QUI FIGURE DANS "jet.seuil" S\'ADDITIONNE. Si la section "competences" porte douze ' +
            'compétences et que le joueur n\'en jette QU\'UNE à la fois, cela fait UNE SEULE entrée ' +
            'et non douze : c\'est au moment de lancer qu\'il retient un champ, et le menu lui ' +
            'proposera les douze. Douze entrées réclameraient les douze compétences et les ' +
            'additionneraient — un seuil que le jeu n\'a jamais eu. Même chose pour six ' +
            'Sauvegardes, ou pour n\'importe quelle liste de valeurs interchangeables. ' +
            'Chaque entrée porte son "id", son "label" et le "sectionId" de la section où elle se ' +
            'lit. Chez Dune, une compétence PLUS un principe : deux entrées, DEUX SECTIONS. ' +
            'N\'écris jamais deux entrées portant le même "sectionId". ' +
            'ET NE CONFONDS PAS « deux valeurs qui s\'AJOUTENT » avec « une valeur qu\'on peut lire ' +
            'à PLUSIEURS ENDROITS ». Deux valeurs qui s\'ajoutent font deux entrées. Une valeur ' +
            'répartie sur plusieurs sous-groupes fait UNE entrée, avec les autres sous-groupes ' +
            'dans "sectionsSupplementaires" : chez Rêves de Dragons les compétences sont découpées ' +
            'en sous-groupes, et le joueur n\'en jette QU\'UNE. ' +
            'Un jeu dont la réserve se compose depuis la fiche ' +
            'laisse "seuil" vide et remplit "reserve.composantes" à la place — l\'un ou l\'autre, ' +
            'jamais ni l\'un ni l\'autre. ' +
            // Ce que « ce qui s'additionne » ne dit pas, et qui manquait : OÙ.
            // Voir le commentaire ci-dessus — troisième fois que la consigne
            // remontée en tête est vraie mais trop large.
            'ET N\'Y METS QUE CE QUE LE JOUEUR LIT SUR SA PROPRE FICHE. La difficulté que le ' +
            'MENEUR fixe n\'est pas une composante : elle se déclare dans "jet.difficulte" ' +
            '({"min","max","defaut"}). Un malus qui SE CALCULE — état général, fatigue, ' +
            'blessures, encombrement — n\'est pas une composante non plus, et ne se déclare NULLE ' +
            'PART : il se lit sur les jauges. Si une valeur qui s\'ajoute n\'a aucune section dans ' +
            'la liste des identifiants disponibles, c\'est le signe qu\'elle n\'a rien à faire ici : ' +
            'OMETS l\'entrée. N\'invente jamais un "sectionId" pour la loger. ' +
            '**(2) "jet.sens" vaut "superieur-ou-egal"** si le jeu compte les dés qui ATTEIGNENT OU ' +
            'DÉPASSENT une valeur (« chaque six est une réussite »), **"sous-ou-egal"** s\'il compte ' +
            'ceux qui restent SOUS un seuil lu sur la fiche (« lance sous ta Sauvegarde »). ' +
            'Les deux se ressemblent et s\'inversent : un jet résolu à l\'envers ne se voit jamais ' +
            'en séance. Et "sous-ou-egal" SANS seuil ne veut rien dire — sous quoi ? ' +
            'ENSUITE, les valeurs imposées. ' +
            '"dice.logic" vaut EXACTEMENT : sum, highest, lowest, count-success, d100-low, ' +
            'd100-high. "d100-low" et "d100-high" lancent un d100 quoi que dise "defaultDice" : ne ' +
            'les choisis que sur un vrai système en pourcentage. Un jeu qui lance UN SEUL dé sous ' +
            'une valeur de la fiche prend "count-success" avec "defaultDice" à "1d20". ' +
            '"dice.engine" NOMME LA FAMILLE et vaut EXACTEMENT : standard, formula, pool, ' +
            'pool_explode, threshold, advantage, disadvantage, exploding, fate, rolemaster, yze, ' +
            '2d20. "2d20" désigne la FAMILLE MODIPHIUS — Dune, Star Trek, Conan —, où l\'on lance ' +
            'PLUSIEURS d20 en comptant les réussites ; ce n\'est pas « le jeu utilise un d20 ». ' +
            'Un jeu qui n\'en lance qu\'un prend "standard". Dans le doute, "standard". ' +
            '"jet.reserve" décrit le nombre de dés lancés ; ses bornes ("base", "max", "faces") ' +
            'sont des NOMBRES. Si la réserve se compose depuis la fiche — « autant de dés que la ' +
            'somme de ton attribut et de ta compétence » —, mets "base" à 0 et donne une entrée ' +
            'dans "reserve.composantes" PAR VALEUR INVOQUÉE, même forme que "jet.seuil"',
        exemple: '{"driver":{"dice":{"defaultDice":"2d20","logic":"count-success","engine":"2d20"},"jet":{"seuil":[{"id":"competence","label":"Compétence","sectionId":"competences","sectionsSupplementaires":["competences_combat"]},{"id":"principe","label":"Principe","sectionId":"principes"}],"reserve":{"base":2,"max":5,"faces":20,"cout":[1,2,3],"ressource":"impulsion"},"sens":"sous-ou-egal","critique":1,"complication":20,"difficulte":{"min":0,"max":5,"defaut":1}}}}',
    },
    {
        id: 'initiative',
        label: 'Ordre d\'action',
        sujets: ['Initiative et déroulement du tour'],
        dependDuVocabulaire: true,
        /**
         * **Deux dérivations d'Alien, 92 caractères identiques au caractère
         * près** — les 13 et 14 août, `{"combat":{"initiative":"",
         * "initiativeFormula":"","initiativeSort":"croissant"}}`. Rien n'avait
         * changé dans cette cible entre les deux, et le modèle n'a rien changé
         * non plus. C'est la démonstration la plus nette qu'on ait du fait que
         * le levier est l'invite : les groupes corrigés le même jour, eux, ont
         * cessé de se tromper.
         *
         * `initiativeSort` n'accepte que `asc` et `desc`, et rien ne le disait.
         * `initiative` doit être un objet ou être absent : une chaîne vide
         * n'est ni l'un ni l'autre, et fait retomber l'écran de combat sur son
         * comportement par défaut sans rien annoncer.
         */
        cible:
            '"driver" avec seulement combat.initiative, combat.initiativeFormula et ' +
            'combat.initiativeSort. "combat.initiativeSort" vaut EXACTEMENT "asc" ou "desc" — ' +
            'jamais un mot français, jamais autre chose. "combat.initiative" est un OBJET ou ' +
            'ALORS TU L\'OMETS ENTIÈREMENT : ne mets jamais une chaîne de caractères, même vide, ' +
            'et n\'y écris jamais une phrase qui décrit la règle. Si le jeu tire des cartes ' +
            'numérotées, omets "initiative" et donne le nombre de cartes dans ' +
            '"combat.initiativeCards". ' +
            // Ce que le champ EST, et il ne le disait nulle part. Voir le
            // commentaire ci-dessus : c'est le silence qui a produit la phrase.
            '"combat.initiativeFormula" EST UN CALCUL, JAMAIS UNE PHRASE : une expression ' +
            'arithmétique portant des identifiants de champs de la fiche, des nombres, une ' +
            'notation de dés, et les signes + - * / ( ). Exemples valides : "agilite", ' +
            '"agilite / 2 + melee + 1d6", "(dexterite + reflexes) / 2". ' +
            '**N\'ÉCRIS JAMAIS "section.champ"** : seul l\'identifiant du CHAMP compte. ' +
            'Si la règle dit « une demi-caractéristique arrondie à l\'inférieur plus le niveau ' +
            'de compétence, plus un dé à six faces », tu écris "agilite / 2 + melee + 1d6" et ' +
            'RIEN D\'AUTRE — pas la phrase, pas les parenthèses explicatives, pas les arrondis ' +
            'en toutes lettres. Si l\'ordre ne se calcule pas depuis la fiche, laisse ' +
            '"initiativeFormula" à ""',
        /*
          **L'exemple montre une formule NON VIDE, et c'est délibéré.** Il ne
          portait que `"initiativeFormula":""`, si bien que la seule chose que le
          modèle voyait de ce champ était son cas d'absence. Rêves de Dragons,
          dont l'initiative se calcule bel et bien, y a répondu par la règle
          rédigée en français — vingt reproches à l'écran le 2026-08-21.
          *Un exemple qui ne montre qu'un cas enseigne ce seul cas.*
        */
        exemple: '{"driver":{"combat":{"initiativeFormula":"agilite / 2 + melee + 1d6","initiativeSort":"desc","initiative":{"mode":"alternance","coutDeRetention":{"montant":2,"ressource":"impulsion"},"coutDOuverture":{"montant":2,"ressource":"impulsion"},"activationsConsecutivesMax":2}}}}',
    },
    {
        id: 'defaite',
        label: 'Santé et mise hors de combat',
        sujets: ['Santé et blessures', 'Dégâts et types de dégâts'],
        dependDuVocabulaire: true,
        /**
         * **Le troisième champ à énumération manquante, et le dernier.**
         * `defaultHealthType` a valu « Santé » le 13 août puis « sante » le 14 :
         * à chaque fois le nom que la fiche donne à sa section ou à son champ,
         * jamais une façon de compter les dégâts. Le modèle ne pouvait pas
         * inventer une liste de cinq mots qu'on ne lui montrait nulle part —
         * comme `dice.engine` et `initiativeSort` avant lui, tous deux réglés
         * du jour où l'énumération a été écrite ici.
         *
         * Une valeur hors énumération ne plante pas : `HealthInterpreter`
         * retombe sur son cas par défaut, et la mise hors de combat se joue sur
         * un modèle que personne n'a choisi.
         *
         * **Le seuil, ensuite.** Rendu `{min:0,max:0}` le 14 août : toute
         * attaque réussie aurait mis sa cible hors de combat. Ces deux bornes
         * encadrent une valeur *lue sur la fiche*, elles ne la remplacent pas.
         */
        cible:
            '"driver" avec seulement combat.defaultHealthType, combat.santeDeDepart, ' +
            'combat.tacheDeDefaite et combat.damageTypes. ' +
            '"combat.santeDeDepart" dit OÙ LIRE LA SANTÉ DE DÉPART SUR LA FICHE, sous forme de ' +
            'formule portant des identifiants de champs — « force », ou « (force + agilite) / 2 ». ' +
            '**N\'ÉCRIS JAMAIS "section.champ"** : « ressources.points_de_vie » ne désigne rien, ' +
            'seul l\'identifiant du CHAMP compte, donc « points_de_vie ». La section ne s\'écrit ' +
            'pas dans une formule. ' +
            'Ne le donne QUE si les fiches disent que la santé de départ se calcule depuis des ' +
            'caractéristiques du personnage. Si le jeu fixe le même nombre pour tous, ou n\'a pas ' +
            'de points de santé, OMETS-LE. N\'y écris jamais un nombre seul. ' +
            '"combat.defaultHealthType" DIT COMMENT LES DÉGÂTS SE COMPTENT et ' +
            'vaut EXACTEMENT l\'une de ces cinq valeurs : hp (des points qu\'on retranche), clocks ' +
            '(une horloge à segments), anatomy (des zones du corps), wounds (des blessures ' +
            'nommées), boxes (des cases à cocher). Ce n\'est JAMAIS le nom que la fiche donne à sa ' +
            'section ou à son champ de santé. ' +
            '**"combat.tacheDeDefaite" NE CONCERNE QUE LES JEUX SANS POINTS DE VIE** — ceux qui ' +
            'remplacent la jauge de santé par une tâche étendue dont le seuil se lit sur la fiche ' +
            'de la cible. Si le jeu compte des points de santé, des cases ou des blessures, ' +
            'OMETS "tacheDeDefaite" ENTIÈREMENT : un objet à moitié rempli est pire qu\'absent, ' +
            'car il impose une horloge et la jauge de la fiche n\'est alors jamais lue. Si tu la ' +
            'donnes, elle porte "sectionDuSeuil" (une section de la fiche), "seuil" avec les ' +
            'bornes que peut atteindre la valeur lue — jamais {"min":0,"max":0} —, ' +
            '"progressionDeBase" et "qualiteMax"',
        exemple: '{"driver":{"combat":{"defaultHealthType":"clocks","tacheDeDefaite":{"sectionDuSeuil":"competences","champParDefaut":"combat","seuil":{"min":4,"max":8},"progressionDeBase":2,"qualiteMax":4,"label":"Défaite"}}}}',
    },
    {
        id: 'jauges',
        label: 'Jauges suivies en combat',
        sujets: ['Jauges et ressources individuelles'],
        dependDuVocabulaire: true,
        cible: '"driver" avec seulement combat.statsToTrack et ui_config.gauges',
        exemple: '{"driver":{"combat":{"statsToTrack":[{"fieldId":"determination","label":"Détermination","isMainHP":false,"isResource":true}]},"ui_config":{"gauges":[{"fieldId":"determination","label":"Détermination","color":"#d97706","style":"segmented"}]}}}',
    },
    {
        id: 'portees',
        label: 'Distances et portées',
        sujets: ['Distances et portées'],
        /**
         * **Ce qu'on dit ici, et ce qu'on s'interdit de dire.**
         *
         * Une première version de cette cible exigeait que `modifier` progresse
         * « dans un seul sens ». **C'était une règle inventée, et elle était
         * fausse.** Alien applique −3 au Contact, 0 à Courte, puis −1, −2, −3 :
         * tirer sur une cible collée à soi est difficile, tirer à un kilomètre
         * aussi. La courbe en U est la règle du livre, écrite noir sur blanc
         * dans la fiche des portées.
         *
         * Deux dérivations ont été accusées d'un décalage d'un rang qu'elles
         * n'avaient pas : elles recopiaient fidèlement leur source. Demander la
         * monotonie aurait poussé le modèle à **falsifier le jeu pour satisfaire
         * l'outil** — l'inverse exact de la règle du projet. On ne cadre donc
         * que l'ordre des clés, qui lui est bien un invariant du format.
         */
        cible:
            '"driver" avec seulement tactical. Les cinq bandes de "tactical.ranges" sont ' +
            'ORDONNÉES DE LA PLUS PROCHE À LA PLUS LOINTAINE : contact, courte, moyenne, longue, ' +
            'extreme. Le libellé de chacune doit décrire la distance sous laquelle elle est ' +
            'rangée — « au corps à corps » va sous "contact", jamais sous "courte". "maxUnits" ' +
            'grandit d\'une bande à la suivante. Les modificateurs, eux, sont ceux que les fiches ' +
            'donnent : recopie-les tels quels, même s\'ils ne vont pas dans un seul sens. ' +
            'AJOUTE "tactical.uniteDeDistance" : LE MOT QUE CE JEU EMPLOIE POUR COMPTER une ' +
            'distance, tel qu\'il se lit après un nombre — « cases », « mètres », « zones », ' +
            '« pieds ». Le rapport tactique écrit « à 3 <unité> », et il écrivait « cases » pour ' +
            'TOUS les jeux. Si les fiches ne nomment aucune unité, OMETS le champ : le rapport ' +
            'dira « unités », ce qui ne prétend rien. N\'invente pas une grille à un jeu qui ' +
            'compte en zones',
        exemple: '{"driver":{"tactical":{"uniteDeDistance":"zones","ranges":{"contact":{"label":"Même zone","maxUnits":1,"modifier":0},"courte":{"label":"Zone adjacente","maxUnits":2,"modifier":1},"moyenne":{"label":"Zone éloignée","maxUnits":3,"modifier":2},"longue":{"label":"Hors de portée","maxUnits":4,"modifier":3},"extreme":{"label":"Hors de portée","maxUnits":5,"modifier":4}},"useTacticalAI":false}}}',
    },
] as const;

/** Les identifiants qu'un groupe peut désigner, parce qu'un autre les a créés. */
export interface VocabulaireDuPilote {
    sections: { id: string; label: string; champs: { id: string; label: string }[] }[];
    ressources: { id: string; label: string }[];
}

/** Ce que les groupes déjà forgés mettent à disposition des suivants. */
export function vocabulaireAcquis(fragment: FragmentDePilote): VocabulaireDuPilote {
    return {
        sections: (fragment.template?.sections ?? []).map(section => ({
            id: section.id,
            label: section.label,
            champs: (section.fields ?? []).map(champ => ({ id: champ.id, label: champ.label })),
        })),
        ressources: (fragment.driver?.ressourcesDeTable ?? []).map(r => ({ id: r.id, label: r.label })),
    };
}

/**
 * Le bloc qui dit au modèle **quels identifiants existent**, et lesquels n'en
 * sont pas.
 *
 * **Les deux erreurs qu'il vise, relevées sur la dérivation de Dune du
 * 2026-08-12.** `jet.seuil[0].sectionId` valait « les compétences » et
 * `tacheDeDefaite.sectionDuSeuil` valait « Attaques réussies » : deux **titres
 * de chapitre du livre**, que les fiches v3 citent en toutes lettres dans leur
 * prose — et c'est voulu, puisque c'est ce qui permet de résoudre les pages.
 *
 * Le mot « section » avait donc deux sens dans notre propre invite, et le
 * modèle n'avait aucun moyen de les distinguer : il recopiait le seul qu'il
 * avait sous les yeux. On lève l'ambiguïté au lieu de la lui reprocher.
 */
export function blocDuVocabulaire(vocabulaire: VocabulaireDuPilote): string {
    if (vocabulaire.sections.length === 0 && vocabulaire.ressources.length === 0) {
        return [
            "AUCUN IDENTIFIANT N'EST DISPONIBLE : la fiche de personnage de ce jeu n'a pas pu être",
            'établie. OMETS donc tout champ qui devrait désigner une section, un champ de fiche ou',
            "une réserve — n'en invente aucun.",
        ].join('\n');
    }

    const lignes = ['IDENTIFIANTS DISPONIBLES — tu ne peux en désigner aucun autre.', ''];

    if (vocabulaire.sections.length > 0) {
        lignes.push('La fiche de personnage de ce jeu porte exactement ces sections et ces champs :');
        for (const section of vocabulaire.sections) {
            const champs = section.champs.length > 0
                ? section.champs.map(c => `"${c.id}" (${c.label})`).join(', ')
                : 'aucun champ';
            lignes.push(`- section "${section.id}" (${section.label}) : ${champs}`);
        }
        lignes.push('');
    }

    if (vocabulaire.ressources.length > 0) {
        lignes.push(
            'Réserves de table déclarées : ' +
            vocabulaire.ressources.map(r => `"${r.id}" (${r.label})`).join(', '),
            '',
        );
    }

    lignes.push(
        'Un "sectionId" est l\'identifiant d\'une SECTION DE LA FICHE ci-dessus, et ' +
        '"sectionsSupplementaires" en porte d\'autres, de la même liste.',
        'Un "fieldId" est l\'identifiant d\'un CHAMP ci-dessus.',
        'Une "ressource" est l\'identifiant d\'une RÉSERVE ci-dessus.',
        '',
        // Chaque champ est listé « "identifiant" (Libellé) », et le modèle
        // recopiait le second. Relevé le 2026-08-21 : `santeDeDepart` valait
        // « (Taille + Constitution) / 2 » là où la fiche porte `taille` et
        // `constitution`. La distinction est visible dans la liste, mais elle
        // n'était nommée nulle part.
        'Chaque champ est écrit ci-dessus sous la forme "identifiant" (Libellé). RECOPIE',
        "L'IDENTIFIANT, celui entre guillemets, EXACTEMENT tel qu'il est écrit — jamais le",
        'libellé entre parenthèses, jamais une variante à toi. Cela vaut aussi DANS LES',
        'FORMULES : on écrit "taille + constitution", pas "Taille + Constitution".',
        '',
        'Les titres de chapitre du LIVRE cités dans les fiches de règles — « Attaques réussies »,',
        '« Les compétences » — ne sont PAS des identifiants. Ne les recopie jamais dans un',
        'sectionId, un fieldId ou une ressource.',
        '',
        "Si aucun identifiant disponible ne convient, OMETS le champ plutôt que d'en inventer un.",
    );

    return lignes.join('\n');
}

/**
 * Les fiches qui nourrissent un groupe.
 *
 * La comparaison passe par `normaliser` : le carnet rend « Monnaie de table ou
 * ressource partagée » là où le canevas dit « Monnaie de table », et les fiches
 * portent l'une ou l'autre forme selon leur génération.
 */
export function fichesDuGroupe(groupe: GroupeDeChamps, fiches: FicheDuCorpus[]): FicheDuCorpus[] {
    const voulus = groupe.sujets.map(normaliser);
    return fiches.filter(f => {
        // Une fiche qui déclare le sujet non couvert n'est pas une source :
        // servie au modèle, elle l'invite à combler ce que le livre tait.
        if (declareeNonCouverte(f)) return false;
        const sujet = normaliser(f.sujet);
        return voulus.some(v => sujet === v || sujet.startsWith(v) || v.startsWith(sujet));
    });
}

/**
 * L'invite d'un groupe : les fiches, la cible, et l'interdiction d'inventer.
 *
 * **Compact par nécessité, pas par goût.** Chaque token de sortie coûte treize
 * centièmes de seconde ; demander du JSON indenté et commenté se paierait en
 * minutes.
 */
export interface ContexteDuGroupe {
    vocabulaire?: VocabulaireDuPilote;
    /**
     * Le dossier de corpus visé — `alien`, `dune`.
     *
     * **Sans lui, le nom du jeu n'a aucune source.** Les fiches décrivent des
     * mécaniques ; aucune ne dit comment le jeu s'appelle, et le frontmatter
     * qui le porte (`systeme: alien`) est retiré avant l'envoi. Dérivée d'Alien
     * le 2026-08-12, la Forge a donc nommé le pilote « Identité et ambiance » —
     * le titre de notre propre sujet, faute d'autre chose à recopier.
     */
    corpus?: string;
    /**
     * La langue dans laquelle écrire la prose — un code, `fr`, `en`…
     *
     * Vient de `corpus.json`, avec la langue de l'interface pour repli. Absente,
     * aucune consigne n'est posée : le modèle suit la langue des fiches, ce qui
     * était le comportement jusqu'au 2026-08-17.
     */
    langue?: string;
    /**
     * Ces fiches viennent-elles de la **famille** plutôt que du jeu ?
     *
     * **Il faut le dire au modèle, et c'est tout l'enjeu du comblement.** Un
     * SRD décrit le socle commun — Year Zero Engine, 2d20 — dont plusieurs jeux
     * héritent en le modifiant. Servi sans avertissement, il se lit exactement
     * comme le livre du jeu : le modèle décrirait le socle en croyant décrire
     * Alien, et rendrait des valeurs plausibles et fausses.
     *
     * *Un manque se voit à la revue ; une valeur générique prise pour celle du
     * jeu se joue en séance.* D'où l'avertissement, et la consigne d'omettre
     * plutôt que de supposer que le jeu suit son socle.
     */
    venuDeLaFamille?: boolean;
}

export function promptDuGroupe(
    groupe: GroupeDeChamps,
    fiches: FicheDuCorpus[],
    contexte: ContexteDuGroupe = {},
): string {
    const { vocabulaire, corpus, venuDeLaFamille, langue } = contexte;
    const retenues = fichesDuGroupe(groupe, fiches);
    const corps = retenues.map(f => `### ${f.sujet}\n${f.contenu}`).join('\n\n');

    return [
        venuDeLaFamille
            ? `Voici les fiches du SOCLE DE RÈGLES COMMUN dont ce jeu hérite, pour le sujet « ${groupe.label} ». `
              + "Le corpus du jeu lui-même ne dit RIEN sur ce sujet : ces fiches décrivent la famille de "
              + 'systèmes, pas ce jeu précisément.'
            : `Voici les fiches de règles vérifiées d'un jeu de rôle, pour le sujet « ${groupe.label} ».`,
        '',
        corps || '(aucune fiche disponible sur ce sujet)',
        '',
        `TÂCHE : rends un JSON compact contenant ${groupe.cible}. Rien d'autre.`,
        /*
          **La langue vient juste après la tâche**, comme le vocabulaire et pour
          la même raison : *une consigne noyée est une consigne perdue.* Celle du
          seuil, glissée au milieu d'une cible le 2026-08-16, a fait ressortir
          `jet.seuil` vide dès le lendemain.
        */
        ...(consigneDeLangue(langue) ? ['', consigneDeLangue(langue)] : []),
        '',
        // L'ancrage ne sert qu'au groupe qui nomme le jeu, et il lui est
        // indispensable : aucune fiche ne dit comment le jeu s'appelle.
        ...(groupe.id === 'identite' && corpus
            ? [
                `ANCRAGE : ces fiches documentent le jeu dont le dossier de corpus s'appelle « ${corpus} ».`,
                'Le "name" est le titre complet de CE jeu, tel qu\'un joueur le nommerait. Jamais le',
                "titre d'un sujet de règles, jamais le nom du dossier recopié tel quel.",
                '',
            ]
            : []),
        // Le vocabulaire vient juste après la tâche, et avant les interdits :
        // c'est la contrainte la plus dure, elle ne doit pas se noyer.
        ...(groupe.dependDuVocabulaire && vocabulaire ? [blocDuVocabulaire(vocabulaire), ''] : []),
        "N'INVENTE RIEN. Si les fiches ne disent pas comment fonctionne une mécanique,",
        'OMETS le champ. Un champ absent se corrige ; un champ inventé s\'applique en',
        'séance sans que personne ne l\'ait choisi, et rien ne le signale. Ne comble',
        'jamais par analogie avec un autre jeu.',
        '',
        // Le socle décrit ce que plusieurs jeux ont en commun, et chacun le
        // modifie : Alien change le stress et la panique de YZE. Ne retenir que
        // ce qui vaut pour toute la famille est la seule façon de ne pas prêter
        // au jeu une règle qu'il a justement remplacée.
        ...(venuDeLaFamille
            ? [
                "PRUDENCE PARTICULIÈRE : ces fiches décrivent le SOCLE, et chaque jeu le modifie.",
                'Ne retiens que ce qui vaut pour toute la famille et que ce jeu ne peut pas avoir',
                "remplacé. Au moindre doute, OMETS : une valeur générique prise pour celle du jeu",
                "s'applique en séance sans que personne ne l'ait choisie.",
                '',
            ]
            : []),
        'Si le jeu n\'a pas de points de vie, n\'invente pas de champ "hp" et ne marque',
        'aucune stat "isMainHP". Si l\'initiative n\'ordonne pas les combattants, ne',
        'fabrique pas de formule.',
        '',
        // L'avertissement est répété AVANT et APRÈS l'exemple. Dérivée d'Alien
        // le 2026-08-12, la Forge a rendu le nom, la description et la couleur
        // de Dune : l'exemple recopié au caractère près. Ce qu'on montre, un
        // modèle le prend pour ce qu'on attend.
        "FORME ATTENDUE. Les valeurs ci-dessous viennent d'un AUTRE jeu et sont là pour montrer",
        'la structure. Ne recopie aucune d\'entre elles : ni un nom, ni une description, ni une',
        'couleur, ni un identifiant. Tout doit venir des fiches ci-dessus.',
        groupe.exemple,
        '',
        'Rappel : les valeurs de l\'exemple ne sont pas des réponses. Un champ dont les fiches ne',
        'disent rien s\'OMET.',
        '',
        'Réponds par le JSON seul, sans indentation, sans commentaire, sans texte autour.',
    ].join('\n');
}

/** Ce qu'un groupe a produit. */
export interface FragmentDePilote {
    driver?: Partial<GameDriver>;
    template?: Partial<SheetTemplate>;
}

/** Les clés de `template` qui ne sont pas des sections. Tout le reste en est une. */
const CLES_DU_GABARIT = new Set(['id', 'name', 'emoji', 'sections', 'isBuiltin']);

/**
 * Les sections que le modèle a posées **à côté** de `sections`, remises dedans.
 *
 * **Relevé sur la dérivation d'Alien du 2026-08-14, et la perte était totale.**
 * Le modèle a rendu 1 993 caractères et sept sections ; le pilote en a reçu
 * **une**. `sections` contenait un tableau à une entrée, puis les six autres
 * suivaient comme propriétés frères — `"relations":{"label":"Relations",
 * "fields":[…]}` en toutes lettres. Rien ne l'a signalé : l'écran a annoncé
 * « 7 groupes remplis » pendant que la fiche tombait à deux champs, et les cinq
 * groupes suivants, privés du vocabulaire qu'elle aurait dû leur donner, ont
 * désigné des jauges par leur libellé faute d'identifiant à viser.
 *
 * **C'est le même geste que le 2026-08-12, où le modèle fourrait les champs
 * dans la chaîne `label`** : sommé de produire plus que la forme ne semblait
 * offrir, *il ne dégénère pas, il cherche une place*. Et c'est la quatrième
 * fois qu'on rencontre la règle générale — le modèle rend la même chose sous
 * une forme qu'on n'attendait pas, après les hors-catégories numérotées, les
 * accents graves et les tableaux sans barres extérieures.
 *
 * On répare plutôt qu'on ne refuse : le contenu est **là**, entier et exact,
 * et le jeter pour un accolade mal placée coûterait un quart d'heure de forge.
 * Une section reconnue porte un `fields` — c'est ce qui la distingue d'un
 * `name` ou d'un `emoji`, et une clé inconnue sans `fields` est laissée où elle
 * est plutôt que promue en section vide.
 */
export function recupererSectionsEgarees(
    template: Partial<SheetTemplate>,
): { template: Partial<SheetTemplate>; recuperees: string[] } {
    const egarees: SheetTemplate['sections'] = [];
    const propre: Record<string, unknown> = {};

    for (const [clef, valeur] of Object.entries(template)) {
        const ressembleAUneSection = !CLES_DU_GABARIT.has(clef)
            && !!valeur && typeof valeur === 'object' && !Array.isArray(valeur)
            && Array.isArray((valeur as { fields?: unknown }).fields);

        if (!ressembleAUneSection) {
            propre[clef] = valeur;
            continue;
        }
        // La clé porte l'identifiant quand la section a omis de le répéter.
        const section = valeur as unknown as SheetTemplate['sections'][number];
        egarees.push({ ...section, id: section.id || clef });
    }

    const recuperees = egarees.map(s => s.id);
    return {
        template: {
            ...(propre as Partial<SheetTemplate>),
            sections: [...(template.sections ?? []), ...egarees],
        },
        recuperees,
    };
}

/**
 * Assemble les fragments en un pilote et une fiche.
 *
 * **La fusion est explicite, jamais récursive à l'aveugle.** `combat` et
 * `ui_config` sont les deux seuls objets que plusieurs groupes alimentent ; les
 * fusionner nommément évite qu'un `Object.assign` profond n'écrase une clé qu'on
 * n'avait pas prévue — le genre de perte qui ne se voit qu'en séance.
 */
export function fusionnerFragments(fragments: FragmentDePilote[]): FragmentDePilote {
    const driver: Record<string, unknown> = {};
    const combat: Record<string, unknown> = {};
    const uiConfig: Record<string, unknown> = {};
    let template: Partial<SheetTemplate> | undefined;

    for (const fragment of fragments) {
        const d = fragment.driver as Record<string, unknown> | undefined;
        if (d) {
            for (const [clef, valeur] of Object.entries(d)) {
                if (valeur === undefined) continue;
                if (clef === 'combat') Object.assign(combat, valeur);
                else if (clef === 'ui_config') Object.assign(uiConfig, valeur);
                else driver[clef] = valeur;
            }
        }
        if (fragment.template) {
            // Remises dans `sections` avant toute fusion : c'est ce tableau que
            // `vocabulaireAcquis` lit pour nourrir les cinq groupes suivants, et
            // une section restée à côté ne leur aurait rien appris.
            const { template: recu } = recupererSectionsEgarees(fragment.template);
            template = {
                ...template,
                ...recu,
                sections: [...(template?.sections ?? []), ...(recu.sections ?? [])],
            };
        }
    }

    if (Object.keys(combat).length > 0) driver.combat = combat;
    if (Object.keys(uiConfig).length > 0) driver.ui_config = uiConfig;

    const resultat: FragmentDePilote = {};
    if (Object.keys(driver).length > 0) resultat.driver = driver as Partial<GameDriver>;
    if (template) resultat.template = template;
    return resultat;
}
