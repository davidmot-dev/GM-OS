/**
 * La campagne, dérivée des fiches, un étage à la fois.
 *
 * **Pourquoi ne pas relire le livre.** L'Atelier l'a déjà lu, sujet par sujet et
 * acte par acte, et a produit un dossier de fiches sourcées — quatorze pour
 * « Le secret de Milo ». La Forge n'est pas une seconde extraction : c'est une
 * **projection de ces fiches** dans les objets que l'application consomme.
 * *Dériver du corpus, pas produire en parallèle* — deux productions
 * indépendantes des mêmes faits divergeront, et rien ne les comparera jamais.
 *
 * **Pourquoi par étages, et dans cet ordre.** C'est `blocDuVocabulaire` de la
 * Forge Système appliqué à la narration, et le défaut qu'il corrige est le même,
 * relevé le 2026-08-12 : des groupes forgés dans l'ignorance les uns des autres
 * désignent des identifiants que personne n'a créés, et **aucune référence
 * croisée n'aboutit**. Ici la perte serait plus lourde qu'un champ vide — une
 * scène privée de son lieu, de ses PNJ et de ses indices est une scène qui ne se
 * joue pas, et l'écran annoncerait un succès.
 *
 * ```text
 * campagne ──> actes ──> lieux ──> factions ──> PNJ (par acte) ──> relations
 *                                                     │
 *                                                     └──> indices ──> scènes (par acte)
 * ```
 *
 * **Les clés du JSON sont celles du type de destination.** `name` pour un
 * `AtlasMap`, `titre` pour un `Acte` : le mélange vient des types eux-mêmes, et
 * traduire au passage aurait ajouté une couche de correspondance — celle où l'on
 * perd un champ sans s'en apercevoir.
 *
 * **Les renvois se font par NOM, jamais par identifiant.** Les identifiants
 * n'existent qu'au moment de l'écriture ; le modèle ne peut ni les connaître ni
 * les inventer. Il recopie donc un nom pris dans le vocabulaire qu'on lui a
 * donné, et la résolution nom → identifiant se fait localement — *on demande au
 * modèle ce qu'il sait produire, on fabrique localement ce qui doit être exact*.
 */

import type { GameDriver } from '../../../types/drivers';
import { normaliser } from '../rules/canevas';
import { santeAAnnoncer } from '../../session/logic/santeDesAdversaires';
import type { FicheDeCampagneLue } from './lectureDesFiches';

// ─────────────────────────────────────────────
// Le vocabulaire qui circule d'un étage à l'autre
// ─────────────────────────────────────────────

/**
 * Ce que les étages déjà forgés mettent à disposition des suivants.
 *
 * Des **noms**, pas des identifiants : c'est ce que le modèle peut recopier, et
 * c'est ce que la résolution locale saura retrouver.
 */
export interface VocabulaireDeLaTrame {
    actes: string[];
    lieux: string[];
    factions: string[];
    pnj: string[];
    indices: string[];
}

export const VOCABULAIRE_VIDE: VocabulaireDeLaTrame = {
    actes: [], lieux: [], factions: [], pnj: [], indices: [],
};

/** Ce qu'un groupe peut désigner. */
export type AxeDuVocabulaire = keyof VocabulaireDeLaTrame;

/** Comment chaque axe se nomme dans une invite, et sous quelle clé il se renvoie. */
const AXES: Record<AxeDuVocabulaire, { pluriel: string; clef: string }> = {
    actes: { pluriel: 'ACTES', clef: '"acte"' },
    lieux: { pluriel: 'LIEUX', clef: '"lieu"' },
    factions: { pluriel: 'FACTIONS', clef: '"faction"' },
    pnj: { pluriel: 'PERSONNAGES', clef: '"pnj", "cible", "porteur"' },
    indices: { pluriel: 'INDICES', clef: '"indices"' },
};

/**
 * Le bloc qui dit au modèle **ce qui existe déjà**, et qu'il ne peut rien
 * désigner d'autre.
 *
 * **L'ambiguïté qu'il lève est la même qu'en Forge Système, transposée.** Là-bas,
 * le mot « section » désignait à la fois une section de fiche et un titre de
 * chapitre du livre, que les fiches citent en toutes lettres — le modèle
 * recopiait celui qu'il avait sous les yeux. Ici, les fiches de campagne citent
 * des dizaines de noms propres : figurants, villes traversées, objets. Sans liste
 * fermée, une scène désignerait un PNJ que la Forge n'a jamais créé, et le renvoi
 * tomberait à côté.
 *
 * On demande la **recopie exacte**, parce que c'est elle qui rend la résolution
 * possible — et on tolère quand même l'à-peu-près à la résolution, parce qu'un
 * accent perdu ne doit pas coûter une scène.
 */
export function blocDuVocabulaireNarratif(
    vocabulaire: VocabulaireDeLaTrame,
    axes: readonly AxeDuVocabulaire[],
): string {
    const remplis = axes.filter(axe => vocabulaire[axe].length > 0);

    if (remplis.length === 0) {
        return [
            "RIEN N'A ENCORE ÉTÉ CRÉÉ que tu puisses désigner : les étages précédents n'ont produit",
            'aucun nom. OMETS donc tout renvoi — ne cite ni lieu, ni personnage, ni indice que tu',
            "aurais lu dans les fiches. Un renvoi vers ce qui n'existe pas ne se résout pas.",
        ].join('\n');
    }

    const lignes = ['CE QUI EXISTE DÉJÀ — tu ne peux désigner rien d\'autre.', ''];

    for (const axe of remplis) {
        lignes.push(
            `${AXES[axe].pluriel} (renvoi par ${AXES[axe].clef}) : `
            + vocabulaire[axe].map(nom => `« ${nom} »`).join(', '),
        );
    }

    lignes.push(
        '',
        'RECOPIE LE NOM EXACTEMENT tel qu\'il est écrit ci-dessus, à la lettre près. Un nom',
        'approché ne désigne personne.',
        '',
        'Les autres noms propres que les fiches citent — figurants, villes traversées, objets —',
        "n'ont PAS été créés et ne sont pas dans cette liste. Ne les emploie dans aucun renvoi.",
        '',
        "Si rien de disponible ne convient, OMETS le renvoi plutôt que d'en fabriquer un.",
    );

    return lignes.join('\n');
}

// ─────────────────────────────────────────────
// Les groupes
// ─────────────────────────────────────────────

export interface ContexteDeLaTrame {
    vocabulaire: VocabulaireDeLaTrame;
    /**
     * L'acte en cours, pour les deux groupes qui se forgent partie par partie.
     *
     * Sans lui, l'invite repartirait sur toute la campagne et rendrait la même
     * réponse à chaque passe — on paierait trois appels pour un, exactement ce
     * que le second axe de découpage existe pour éviter.
     */
    acte?: string;
    /**
     * Le pilote du jeu, tiré du `jeu:` des fiches.
     *
     * **Il ne se redemande pas au meneur.** L'Atelier l'a inscrit dans le
     * frontmatter alors qu'il n'en avait aucun usage, précisément pour qu'il soit
     * là maintenant. C'est lui qui dit s'il faut demander des points de vie aux
     * PNJ, et à quelle échelle.
     */
    driver?: GameDriver;
}

export interface GroupeDeLaTrame {
    id: string;
    label: string;
    /** Clés du canevas dont les fiches nourrissent ce groupe. */
    sujets: string[];
    /** Ce groupe se forge **une fois par acte**. */
    parActe?: boolean;
    /** Les axes du vocabulaire que ce groupe peut désigner. */
    designe?: readonly AxeDuVocabulaire[];
    /** La forme exacte imposée au décodeur. */
    schema: (contexte: ContexteDeLaTrame) => Record<string, unknown>;
    /** Ce que le modèle doit rendre, décrit en une phrase. */
    cible: (contexte: ContexteDeLaTrame) => string;
    /**
     * La forme attendue, en JSON compact.
     *
     * **Elle montre la structure, jamais des valeurs plausibles.** C'est la leçon
     * du groupe `identite` de la Forge Système : servi un exemple portant le nom
     * et la couleur de Dune, le modèle les a recopiés au caractère près sur un
     * corpus qui ne mentionne Dune nulle part. Un exemple narratif est encore
     * plus dangereux — un nom de PNJ inventé se lit comme une réponse. Les
     * exemples ci-dessous portent donc des noms qu'aucune campagne ne peut
     * revendiquer.
     */
    exemple: string;
}

/** Les types de lien qu'`EntityRelation` accepte. Écrits ici pour que le décodeur les impose. */
const TYPES_DE_LIEN = ['ally', 'neutral', 'hostile', 'family', 'romantic', 'mentor', 'rival', 'other'] as const;

/** Les catégories qu'une `WikiEntry` accepte. */
const CATEGORIES_WIKI = ['npc', 'location', 'organization', 'lore', 'item', 'clue', 'rumor', 'other'] as const;

/** Les cinq types d'`AtlasMap`. */
const TYPES_DE_LIEU = ['battlemap', 'world-map', 'region', 'city', 'dungeon'] as const;

/** Un tableau d'objets, la forme que prennent sept des neuf groupes. */
function liste(clef: string, item: Record<string, unknown>, requis: string[]): Record<string, unknown> {
    return {
        type: 'object',
        properties: {
            [clef]: {
                type: 'array',
                items: { type: 'object', properties: item, required: requis, additionalProperties: false },
            },
        },
        required: [clef],
        additionalProperties: false,
    };
}

const CHAINES = { type: 'array', items: { type: 'string' } } as const;

/**
 * Les huit groupes servis à un modèle, **dans l'ordre de leurs dépendances**.
 *
 * Les **actes** n'y sont pas : ils se lisent localement, avant la boucle. Voir
 * le commentaire en tête de la liste.
 *
 * **`savoir` ne figurait pas au plan du 2026-08-15.** Sans lui, deux sujets du
 * canevas sur dix ne se projettent nulle part : « Amorces et accroches » et
 * « Menaces et progression », tous deux destinés à `WikiEntry` d'après le § 6.1
 * du même plan. Une fiche payée au carnet et jamais projetée est précisément ce
 * que le canevas s'interdisait en ne retenant que des sujets dérivés de ce que
 * le code consomme.
 *
 * *Les horloges de progression, elles, restent à trancher* (§ 10 du plan) : une
 * horloge se coche en séance, c'est un état et non une entrée d'encyclopédie. En
 * attendant, elles sont décrites dans le texte de l'entrée — lisible, mais pas
 * cochable.
 */
export const GROUPES_DE_LA_TRAME: readonly GroupeDeLaTrame[] = [
    {
        id: 'campagne',
        label: 'La campagne',
        sujets: ['Pitch et ton'],
        schema: () => ({
            type: 'object',
            properties: {
                campagne: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        description: { type: 'string' },
                        synopsis: { type: 'string' },
                    },
                    required: ['name'],
                    additionalProperties: false,
                },
            },
            required: ['campagne'],
            additionalProperties: false,
        }),
        cible: () =>
            '"campagne" avec name (le titre de la campagne, tel que le livre la nomme), '
            + 'description (le pitch, deux ou trois phrases : de quoi elle parle et ce que les '
            + 'personnages y font) et synopsis (l\'intrigue et le ton, un paragraphe). '
            + 'Le ton et le registre vont dans le synopsis : ils n\'ont pas de champ à eux',
        exemple: '{"campagne":{"name":"<le titre de la campagne>","description":"<le pitch, en deux ou trois phrases>","synopsis":"<l\'intrigue et le ton, un paragraphe>"}}',
    },
    /*
      **LES ACTES NE SONT PAS UN GROUPE, et ils l'ont été une journée.**

      Le 2026-08-16, ils se forgeaient comme les autres : on servait la fiche de
      structure à un modèle en lui demandant la liste des parties. Or cette fiche
      est un **tableau à quatre colonnes**, dont la dernière énumère les titres de
      chapitre du livre. Sur « Le secret de Milo », le modèle a aplati cette
      colonne : trente actes nommés « Introduction », « Explorer l'usine »,
      « Le Sea-You »… Aucune fiche ne portant ces titres en `partie:`, les
      soixante passes de PNJ et de scènes qui ont suivi sont tombées à vide.

      `lireLaStructure` fait ce travail exactement, de façon déterministe — et
      c'est ELLE qui a produit les `partie:` des fiches au moment de l'atelier.
      La relire garantit des titres identiques au caractère près. Voir
      `etablirLesActes`, appelée avant la boucle.

      *On demande au carnet ce qu'il sait produire, on fabrique localement ce qui
      doit être exact.*
    */
    {
        /**
         * **Les actes ne sont PAS injectés ici, contrairement au § 6.2 du plan.**
         * `AtlasMap` n'a aucun champ où loger un acte : un lieu appartient au
         * monde, pas à un moment de l'histoire — et la même auberge sert souvent
         * trois actes. Injecter un vocabulaire que rien ne consomme aurait
         * allongé l'invite pour produire un champ que la grammaire refuse.
         */
        id: 'lieux',
        label: 'Les lieux',
        sujets: ['Lieux majeurs'],
        schema: () => liste('lieux', {
            name: { type: 'string' },
            type: { type: 'string', enum: [...TYPES_DE_LIEU] },
            narrativeDescription: { type: 'string' },
            gmNotes: { type: 'string' },
        }, ['name']),
        cible: () =>
            '"lieux" : les lieux majeurs. "narrativeDescription" est ce que les personnages VOIENT '
            + 'et qu\'on peut leur lire ; "gmNotes" est ce que seul le meneur sait. "type" vaut '
            + 'EXACTEMENT l\'une de ces valeurs : battlemap (un plan de combat), world-map (une '
            + 'carte du monde), region (une contrée), city (une ville ou un quartier), dungeon (un '
            + 'lieu clos qu\'on explore). Ne range pas sous "battlemap" un lieu où l\'on ne se bat pas',
        exemple: '{"lieux":[{"name":"<le nom du lieu>","type":"city","narrativeDescription":"<ce que les personnages voient>","gmNotes":"<ce que seul le meneur sait>"}]}',
    },
    {
        id: 'factions',
        label: 'Les factions',
        sujets: ['Factions et organisations'],
        schema: () => liste('factions', {
            title: { type: 'string' },
            content: { type: 'string' },
        }, ['title']),
        cible: () =>
            '"factions" : les groupes en présence — maisons, organisations, sectes, corporations. '
            + '"title" est leur nom seul, sans article ni fonction accolée : c\'est lui que les PNJ '
            + 'reprendront pour déclarer leur appartenance. "content" dit ce qu\'elles veulent, ce '
            + 'qui les oppose, et qui les mène. Ne range pas un individu ici : une personne n\'est '
            + 'pas une faction',
        exemple: '{"factions":[{"title":"<le nom de la faction>","content":"<ce qu\'elle veut et ce qui l\'oppose aux autres>"}]}',
    },
    {
        id: 'pnj',
        label: 'Les personnages',
        sujets: ['Personnages non joueurs'],
        parActe: true,
        designe: ['lieux', 'factions'],
        /**
         * **Le modèle de santé vient du pilote, jamais de l'invite.** C'est le
         * défaut du 2026-08-15, corrigé dans la Forge de chronique et qu'il n'y a
         * aucune raison de rejouer ici : sommé de donner des `hp` sur un jeu qui
         * n'en a pas, le modèle répond en prose, et
         * `hp: "Inférieure à 1 (gravement battu)"` atterrit dans un champ typé
         * `number`. *Ce n'est pas le modèle qui dérape, c'est la question qui n'a
         * pas de réponse.* `santeAAnnoncer` est donc réemployée telle quelle, et
         * les points de vie n'entrent dans la grammaire que si le jeu en compte.
         *
         * **Ni classe d'armure, ni vitesse, ni initiative** : aucun pilote n'en
         * déclare, et `additionalProperties: false` fait ici le gros du travail.
         */
        schema: contexte => liste('pnj', {
            name: { type: 'string' },
            type: { type: 'string', enum: ['npc', 'monster'] },
            role: { type: 'string', enum: ['ally', 'neutral', 'hostile', 'boss'] },
            description: { type: 'string' },
            faction: { type: 'string' },
            lieu: { type: 'string' },
            roleplayingNotes: { type: 'string' },
            gmSecretInfo: { type: 'string' },
            ...(contexte.driver && santeAAnnoncer(contexte.driver).demandeDesPoints
                ? { hp: { type: 'number' }, maxHp: { type: 'number' } }
                : {}),
        }, ['name']),
        cible: contexte => {
            const sante = contexte.driver
                ? santeAAnnoncer(contexte.driver).consigne
                : "SANTÉ — le jeu de cette campagne n'a pas pu être établi. N'écris NI \"hp\" NI "
                  + '"maxHp" : un nombre inventé se jouerait comme une mesure.';
            return '"pnj" : les personnages non joueurs qui comptent dans CETTE partie. '
                + '"description" dit qui ils sont, "roleplayingNotes" comment les jouer — la voix, '
                + 'les tics, ce qu\'ils veulent —, "gmSecretInfo" ce qu\'ils cachent. '
                + '"faction" reprend le nom EXACT d\'une faction listée ci-dessus, ou s\'omet. '
                + '"lieu" est celui où on les trouve d\'ordinaire, repris de la liste, ou s\'omet. '
                + '"role" vaut ally, neutral, hostile ou boss — la place qu\'ils tiennent face aux '
                + 'personnages joueurs, pas leur métier. '
                + 'NE DONNE PAS LES LIENS ENTRE EUX ici : ils font l\'objet d\'une demande séparée. '
                + sante;
        },
        exemple: '{"pnj":[{"name":"<le nom du personnage>","type":"npc","role":"neutral","description":"<qui il est>","faction":"<une faction de la liste, ou rien>","roleplayingNotes":"<comment le jouer>","gmSecretInfo":"<ce qu\'il cache>"}]}',
    },
    {
        /**
         * **Un groupe à part, et non un champ des PNJ.** Un lien se déclare entre
         * deux personnages que la Forge a créés ; tant que les trois passes par
         * acte n'ont pas eu lieu, la moitié des cibles n'existe pas. La Forge de
         * chronique demandait les relations dans la même réponse que les PNJ, ce
         * qui bornait les liens à un seul appel — et une campagne en actes n'a
         * pas ses personnages dans un seul appel.
         */
        id: 'relations',
        label: 'Les liens entre personnages',
        sujets: ['Personnages non joueurs'],
        designe: ['pnj'],
        schema: () => liste('relations', {
            source: { type: 'string' },
            cible: { type: 'string' },
            type: { type: 'string', enum: [...TYPES_DE_LIEN] },
            description: { type: 'string' },
        }, ['source', 'cible', 'type']),
        cible: () =>
            '"relations" : les liens entre les personnages listés ci-dessus. "source" et "cible" '
            + 'sont deux noms RECOPIÉS EXACTEMENT de cette liste — jamais un nom qui n\'y figure '
            + 'pas, jamais un personnage joueur. "type" vaut EXACTEMENT l\'une de ces valeurs : '
            + 'ally, neutral, hostile, family, romantic, mentor, rival, other. "description" dit ce '
            + 'que le lien recouvre, en une phrase. Ne donne un lien que si les fiches l\'attestent : '
            + 'deux personnages du même acte ne se connaissent pas forcément',
        exemple: '{"relations":[{"source":"<un nom de la liste>","cible":"<un autre nom de la liste>","type":"rival","description":"<ce que le lien recouvre>"}]}',
    },
    {
        id: 'indices',
        label: 'Les indices',
        sujets: ['Secrets et révélations'],
        designe: ['pnj', 'lieux', 'actes'],
        schema: () => liste('indices', {
            title: { type: 'string' },
            content: { type: 'string' },
            porteur: { type: 'string' },
            lieu: { type: 'string' },
            acte: { type: 'string' },
        }, ['title', 'content']),
        cible: () =>
            '"indices" : ce qui est caché et peut se découvrir. "title" nomme l\'indice en quelques '
            + 'mots ; "content" dit ce qu\'il révèle ET ce que sa découverte change. '
            + '"porteur" est le personnage qui le détient, "lieu" l\'endroit où il se trouve, '
            + '"acte" le moment de la campagne où il se découvre — les trois RECOPIÉS de la liste '
            + 'ci-dessus, et omis quand rien ne convient. '
            + 'Un secret que personne ne peut découvrir n\'est pas un indice : c\'est du contexte, '
            + 'et il n\'a pas sa place ici',
        exemple: '{"indices":[{"title":"<l\'indice en quelques mots>","content":"<ce qu\'il révèle et ce que cela change>","porteur":"<un personnage de la liste>","lieu":"<un lieu de la liste>","acte":"<un acte de la liste>"}]}',
    },
    {
        /**
         * **Le dernier étage, et celui qui a le plus à perdre.** Une scène
         * désigne un lieu, des personnages et des indices : c'est le seul objet
         * dont trois renvois sur quatre viennent d'ailleurs. C'est aussi pour lui
         * que le filtrage silencieux de `crossDomainHelpers.ts:42` serait grave —
         * une scène amputée de ses PNJ et de ses indices reste une scène d'aspect
         * normal, et rien ne dirait qu'elle est vide.
         */
        id: 'scenes',
        label: 'Les scènes',
        sujets: ['Scènes prévues'],
        parActe: true,
        designe: ['lieux', 'pnj', 'indices'],
        schema: () => liste('scenes', {
            titre: { type: 'string' },
            resume: { type: 'string' },
            notesDuMeneur: { type: 'string' },
            lieu: { type: 'string' },
            pnj: CHAINES,
            indices: CHAINES,
        }, ['titre']),
        cible: () =>
            '"scenes" : les scènes prévues de CETTE partie, DANS L\'ORDRE où le livre les présente. '
            + '"resume" dit ce qui s\'y joue du point de vue du meneur ; "notesDuMeneur" ce qui ne '
            + 'se dit pas à voix haute. "lieu" est un nom RECOPIÉ de la liste des lieux ; "pnj" un '
            + 'tableau de noms recopiés de la liste des personnages ; "indices" un tableau de '
            + 'titres recopiés de la liste des indices. Chacun s\'omet si rien ne convient — mais '
            + 'ne laisse pas vide ce que les fiches donnent : c\'est ce qui rend la scène jouable',
        exemple: '{"scenes":[{"titre":"<le titre de la scène>","resume":"<ce qui s\'y joue>","lieu":"<un lieu de la liste>","pnj":["<un personnage de la liste>"],"indices":["<un indice de la liste>"]}]}',
    },
    {
        id: 'savoir',
        label: 'Amorces et menaces',
        sujets: ['Amorces et accroches', 'Menaces et progression'],
        designe: ['pnj', 'lieux', 'factions'],
        schema: () => liste('savoir', {
            title: { type: 'string' },
            content: { type: 'string' },
            category: { type: 'string', enum: [...CATEGORIES_WIKI] },
            tags: CHAINES,
        }, ['title', 'content']),
        cible: () =>
            '"savoir" : les entrées d\'encyclopédie tirées des amorces et des menaces. Une amorce '
            + 'dit comment les personnages joueurs entrent dans l\'histoire et ce qui les y retient ; '
            + 'une menace dit ce qui progresse tout seul si personne n\'agit, à quel rythme, et ce '
            + 'qui se produit au bout. "category" vaut EXACTEMENT l\'une de ces valeurs : npc, '
            + 'location, organization, lore, item, clue, rumor, other',
        exemple: '{"savoir":[{"title":"<le titre de l\'entrée>","content":"<ce qu\'elle dit>","category":"lore","tags":["<un mot-clé>"]}]}',
    },
] as const;

// ─────────────────────────────────────────────
// L'invite
// ─────────────────────────────────────────────

/**
 * Les fiches qui nourrissent un groupe, pour l'acte demandé.
 *
 * **Le second filtre est celui qui compte.** Sans le `partie:`, la passe « PNJ,
 * Acte II » recevrait les fiches des trois actes : la réponse déborderait le
 * budget d'invite, et les trois passes rendraient trois fois la même chose. Une
 * fiche sans `partie:` reste éligible à toutes les passes — c'est le cas des
 * sujets qui ne se découpent pas.
 *
 * La comparaison des sujets passe par `normaliser` : le carnet rend
 * « Personnages non joueurs majeurs » là où le canevas dit « Personnages non
 * joueurs », et les fiches portent l'une ou l'autre forme selon leur génération.
 */
export function fichesDuGroupe(
    groupe: GroupeDeLaTrame,
    fiches: readonly FicheDeCampagneLue[],
    acte?: string,
): FicheDeCampagneLue[] {
    const voulus = groupe.sujets.map(normaliser);
    const acteVoulu = acte ? normaliser(acte) : null;

    return fiches.filter(fiche => {
        const sujet = normaliser(fiche.sujet);
        const bonSujet = voulus.some(v => sujet === v || sujet.startsWith(v) || v.startsWith(sujet));
        if (!bonSujet) return false;
        if (!fiche.partie) return true;
        return acteVoulu === null || normaliser(fiche.partie) === acteVoulu;
    });
}

/**
 * L'invite d'un groupe : les fiches, la cible, le vocabulaire, et l'interdiction
 * d'inventer.
 *
 * **Compact par nécessité, pas par goût.** Mesuré le 2026-08-12 : le décodage
 * tourne à 7,7 tokens par seconde, donc cent tokens de JSON coûtent treize
 * secondes. Demander du JSON indenté et commenté se paierait en minutes, sur neuf
 * groupes dont deux se répètent par acte.
 */
export function promptDuGroupe(
    groupe: GroupeDeLaTrame,
    fiches: readonly FicheDeCampagneLue[],
    contexte: ContexteDeLaTrame,
): string {
    const retenues = fichesDuGroupe(groupe, fiches, contexte.acte);
    const corps = retenues
        .map(f => `### ${f.sujetEcrit}${f.partie ? ` — ${f.partie}` : ''}\n${f.contenu}`)
        .join('\n\n');

    return [
        groupe.parActe && contexte.acte
            ? `Voici les fiches vérifiées d'une campagne de jeu de rôle, pour « ${groupe.label} » `
              + `DANS LA PARTIE INTITULÉE « ${contexte.acte} ».`
            : `Voici les fiches vérifiées d'une campagne de jeu de rôle, pour « ${groupe.label} ».`,
        '',
        corps || '(aucune fiche disponible sur ce sujet)',
        '',
        `TÂCHE : rends un JSON compact contenant ${groupe.cible(contexte)}. Rien d'autre.`,
        '',
        // Le vocabulaire vient juste après la tâche et avant les interdits :
        // c'est la contrainte la plus dure, elle ne doit pas se noyer.
        ...(groupe.designe?.length
            ? [blocDuVocabulaireNarratif(contexte.vocabulaire, groupe.designe), '']
            : []),
        ...(groupe.parActe && contexte.acte
            ? [
                `NE TRAITE QUE « ${contexte.acte} ». Les autres parties de la campagne font l'objet`,
                "de demandes séparées : ce que tu écrirais ici sur elles serait rendu deux fois, et",
                'rangé sous la mauvaise partie.',
                '',
            ]
            : []),
        "N'INVENTE RIEN. Si les fiches ne le disent pas, OMETS le champ. Un champ absent se",
        "corrige à la relecture ; un fait inventé se joue à table sans que personne ne l'ait",
        'choisi, et rien ne le signale. Ne comble jamais par analogie avec une autre campagne',
        "ni avec le jeu dont elle se réclame.",
        '',
        "N'ÉCRIS AUCUNE RÈGLE. Les caractéristiques chiffrées, les seuils et les procédures",
        'appartiennent au jeu, pas à la campagne : le meneur les règle lui-même.',
        '',
        // L'avertissement encadre l'exemple. Dérivée d'Alien le 2026-08-12, la
        // Forge Système a rendu le nom, la description et la couleur de Dune :
        // l'exemple recopié au caractère près. Ce qu'on montre, un modèle le
        // prend pour ce qu'on attend.
        'FORME ATTENDUE. Les crochets ci-dessous sont à remplir depuis les fiches ; ils ne',
        'contiennent aucune réponse.',
        groupe.exemple,
        '',
        "Rappel : un champ dont les fiches ne disent rien s'OMET.",
        '',
        'Réponds par le JSON seul, sans indentation, sans commentaire, sans texte autour.',
    ].join('\n');
}
