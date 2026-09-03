/**
 * **Les archétypes d'adversaire, et ce qu'ils favorisent.**
 *
 * *Demandé par David le 2026-09-03 : « il me manque un module pour créer des
 * adversaires de combat aléatoire ».*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LE PROBLÈME QUE CE FICHIER RÉSOUT, ET QUI N'EST PAS ÉVIDENT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Une brute, c'est « fort et lent ». Mais **GM-OS ne sait pas lequel des champs
 * d'un jeu veut dire « fort »** : chez Dune ce sont *Combat* et *Domination*,
 * chez Blade Runner *Force* et *Constitution*, chez Alien *Force*. Le gabarit de
 * fiche donne la forme d'un champ — son type, sa valeur moyenne, son plafond —
 * **jamais son sens**.
 *
 * Trois façons de s'en sortir, et une seule tient :
 *
 * 1. *Deviner par le nom du champ.* Suffisant neuf fois sur dix, faux la
 *    dixième — et une caractéristique attribuée de travers ne se voit pas :
 *    l'adversaire est simplement bizarre à jouer.
 * 2. *Demander au pilote.* Il ne le déclare pas, et l'ajouter voudrait dire que
 *    les dix pilotes existants ne sauraient rien faire tant qu'ils ne sont pas
 *    reforgés.
 * 3. **Proposer, puis laisser le meneur trancher, et retenir son choix.** C'est
 *    ce qui est fait ici : les mots-clés ci-dessous ne décident de rien, ils
 *    *pré-remplissent* — et l'atelier montre ce qu'il a compris avant de
 *    fabriquer quoi que ce soit.
 *
 * *Un outil qui devine en silence fabrique des erreurs invisibles ; le même
 * outil, qui montre ce qu'il a deviné, fabrique un gain de temps.*
 */

/** Un archétype : une intention de combat, et les mots qui la trahissent. */
export interface Archetype {
    id: string;
    nom: string;
    /** Ce qu'il fait à la table, en une ligne, pour l'écran. */
    resume: string;
    /**
     * Les mots qui, dans le libellé d'un champ, suggèrent qu'il sert cet
     * archétype. Sans accents et en minuscules — la comparaison se fait sur du
     * texte déaccentué, leçon du 2026-08-23 sur l'Oracle : *le mot cherché était
     * déaccentué et pas le corps.*
     */
    motsFavorises: string[];
    /** Les mots des champs que cet archétype néglige. */
    motsNegliges: string[];
}

export const ARCHETYPES: Archetype[] = [
    {
        id: 'brute',
        nom: 'Brute',
        resume: 'Encaisse et frappe fort. Lente, prévisible, difficile à abattre.',
        motsFavorises: ['force', 'combat', 'melee', 'corps', 'constitution', 'endurance', 'vigueur', 'brutalite', 'physique', 'sante', 'resistance'],
        motsNegliges: ['agilite', 'mobilite', 'discretion', 'analyse', 'science', 'technique', 'empathie', 'rhetorique', 'esprit'],
    },
    {
        id: 'tireur',
        nom: 'Tireur',
        resume: 'Dangereux à distance, fragile si on lui tombe dessus.',
        motsFavorises: ['tir', 'distance', 'adresse', 'precision', 'arme', 'agilite', 'perception', 'observation', 'vue'],
        motsNegliges: ['force', 'melee', 'corps', 'constitution', 'domination', 'commandement'],
    },
    {
        id: 'rapide',
        nom: 'Rapide',
        resume: 'Frappe avant tout le monde et se dérobe. Peu de réserve.',
        motsFavorises: ['agilite', 'mobilite', 'vitesse', 'reflexe', 'initiative', 'discretion', 'esquive', 'furtivite'],
        motsNegliges: ['force', 'constitution', 'endurance', 'sante', 'volonte'],
    },
    {
        id: 'meneur',
        nom: 'Meneur',
        resume: 'Commande les autres. Seul, il vaut peu ; entouré, il change tout.',
        motsFavorises: ['commandement', 'domination', 'rhetorique', 'presence', 'charisme', 'discipline', 'volonte', 'autorite', 'manipulation'],
        motsNegliges: ['agilite', 'discretion', 'technique', 'science'],
    },
    {
        id: 'specialiste',
        nom: 'Spécialiste',
        resume: 'Un savoir-faire pointu : technicien, pisteur, médecin de fortune.',
        motsFavorises: ['technique', 'science', 'analyse', 'observation', 'intelligence', 'savoir', 'medecine', 'informatique', 'pilotage', 'survie'],
        motsNegliges: ['force', 'melee', 'domination'],
    },
    {
        id: 'quelconque',
        nom: 'Quelconque',
        resume: 'Ni bon ni mauvais nulle part. Le figurant qu’on met en nombre.',
        motsFavorises: [],
        motsNegliges: [],
    },
];

/**
 * Le rang d'un adversaire : **combien il vaut**, pas ce qu'il sait faire.
 *
 * Le rang décale les valeurs autour de la moyenne du jeu ; il ne les invente
 * pas. `ecart` s'ajoute aux champs favorisés, `plancher` empêche de descendre
 * sous la moyenne pour les rangs élevés — *un boss médiocre partout n'est pas un
 * boss, c'est un bogue.*
 */
export interface Rang {
    id: string;
    nom: string;
    /** Ce qu'on ajoute aux champs favorisés, dans l'échelle du jeu. */
    ecart: number;
    /** Ce qu'on retire aux champs négligés. */
    retrait: number;
    /** La valeur sous laquelle aucun champ ne descend, en écart à la moyenne. */
    plancher: number;
    /** Combien d'exemplaires on propose par défaut. */
    nombreSuggere: number;
}

export const RANGS: Rang[] = [
    { id: 'pietaille', nom: 'Piétaille', ecart: 0, retrait: 1, plancher: -2, nombreSuggere: 4 },
    { id: 'aguerri', nom: 'Aguerri', ecart: 1, retrait: 1, plancher: -1, nombreSuggere: 2 },
    { id: 'elite', nom: 'Élite', ecart: 2, retrait: 0, plancher: 0, nombreSuggere: 1 },
    { id: 'boss', nom: 'Boss', ecart: 3, retrait: 0, plancher: 1, nombreSuggere: 1 },
];

/** Retire les accents et met en minuscules, pour comparer des libellés. */
export function deaccentue(texte: string): string {
    return texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Ce qu'un archétype propose de faire des champs d'un jeu. */
export interface PropositionDeChamps {
    favorises: string[];
    negliges: string[];
}

/**
 * Ce que l'archétype **propose** pour les champs d'un jeu donné.
 *
 * ⚠️ Une proposition, pas une décision : l'atelier l'affiche et la laisse
 * modifier. Un champ dont le libellé ne dit rien à personne reste neutre —
 * *l'absence de correspondance est une information, pas un défaut à combler au
 * hasard.*
 */
export function proposerLesChamps(
    archetype: Archetype,
    champs: { id: string; label: string }[],
): PropositionDeChamps {
    const favorises: string[] = [];
    const negliges: string[] = [];

    for (const champ of champs) {
        const texte = deaccentue(`${champ.label} ${champ.id}`);
        const correspond = (mots: string[]) => mots.some(mot => texte.includes(mot));

        /*
          Un champ peut évoquer les deux listes — « Agilité au combat ». On
          tranche en faveur du favorisé : un archétype se définit par ce qu'il
          sait faire, pas par ce qu'il rate.
        */
        if (correspond(archetype.motsFavorises)) favorises.push(champ.id);
        else if (correspond(archetype.motsNegliges)) negliges.push(champ.id);
    }

    return { favorises, negliges };
}

/** L'archétype d'un identifiant, ou le figurant quelconque. */
export function archetypeParId(id: string | null | undefined): Archetype {
    return ARCHETYPES.find(a => a.id === id) ?? ARCHETYPES[ARCHETYPES.length - 1];
}

/** Le rang d'un identifiant, ou la piétaille. */
export function rangParId(id: string | null | undefined): Rang {
    return RANGS.find(r => r.id === id) ?? RANGS[0];
}
