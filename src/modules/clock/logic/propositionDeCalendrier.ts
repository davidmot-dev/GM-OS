import { aiService } from '../../ai/AIService';
import type { CalendrierDatable } from './formeDuCalendrier';

/**
 * **Un calendrier décrit en une phrase, proposé par le modèle, relu par le
 * contrôle.**
 *
 * *Demandé par David le 2026-09-15, avec l'Atelier des calendriers.*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⭐ LE MÊME TRIPTYQUE QU'À L'IMPORT DES TABLES
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Le modèle propose, le contrôle relit, l'écran montre.** Ce n'est pas la
 * qualité de l'invite qui rend cet appel acceptable : c'est que **rien n'est
 * enregistré sans repasser par `controlerLeCalendrier`**, et que le meneur voit
 * la longueur de l'année avant de dire oui.
 *
 * ⛔ **Et ici l'enjeu est plus haut qu'avec une table.** Un modèle qui rend
 * `months: []` ne produit pas un calendrier bancal : il produit un calendrier
 * qui **gèle GM-OS** — `getFantasyDate` boucle sans fin sur une année de
 * longueur nulle. *Sans le contrôle en aval, cet appel serait une façon de
 * figer l'application en tapant une phrase.*
 *
 * ⚠️ **Douze mois plausibles se reconnaissent moins bien qu'une table trouée.**
 * Une table à qui il manque les valeurs 17 à 20 se voit en rouge dans la bande ;
 * un calendrier dont l'année fait 358 jours au lieu de 360 a l'air parfait. D'où
 * la mesure affichée en permanence : *le seul nombre que l'auteur a en tête est
 * celui qu'aucune saisie ne montre.*
 *
 * ⛔ **`sansPersona`**, comme toute extraction : la voix de meneur de la
 * campagne active n'a rien à faire dans la composition d'un calendrier.
 */

/** Ce que le modèle doit rendre. Imposé au décodeur, pas seulement demandé. */
const SCHEMA = {
    type: 'object',
    properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        hoursPerDay: { type: 'integer' },
        minutesPerHour: { type: 'integer' },
        cycleBissextile: { type: 'integer' },
        daysOfWeek: { type: 'array', items: { type: 'string' } },
        months: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    days: { type: 'integer' },
                    isIntercalary: { type: 'boolean' },
                    leapYearOnly: { type: 'boolean' },
                },
                required: ['name', 'days'],
            },
        },
    },
    required: ['months'],
} as const;

/**
 * **La couture d'essai.** On injecte l'appel plutôt que de simuler un module
 * entier, pour que les essais portent sur *ce qu'on fait de la réponse* — qui
 * est tout le sujet.
 */
export type AppelStructure = (
    prompt: string,
    systemPrompt: string,
    options: Record<string, unknown>,
) => Promise<unknown>;

const appelParDefaut: AppelStructure = (prompt, systemPrompt, options) =>
    aiService.generateJSON<unknown>(prompt, systemPrompt, undefined, options);

function consigne(joursVises?: number): string {
    return [
        'Tu composes un calendrier pour un monde de jeu de rôle.',
        '',
        'Rends les mois dans l’ordre de l’année. Pour chacun :',
        '- `name` : son nom, tel qu’on le prononce à la table ;',
        '- `days` : sa durée en jours, un entier strictement positif ;',
        '- `isIntercalary` : vrai pour un jour hors calendrier — une fête, un solstice ;',
        '- `leapYearOnly` : vrai s’il n’existe que les années bissextiles.',
        '',
        joursVises
            ? `L’année doit faire EXACTEMENT ${joursVises} jours hors année bissextile. `
              + 'Fais la somme avant de répondre.'
            : 'Choisis une longueur d’année cohérente et annonce-la dans la description.',
        '',
        '`daysOfWeek` nomme les jours de la semaine, dans l’ordre.',
        '`hoursPerDay` et `minutesPerHour` décrivent le jour : 24 et 60 si le monde',
        'ressemble au nôtre, autre chose s’il ne lui ressemble pas.',
        '`cycleBissextile` dit tous les combien d’années tombent les mois `leapYearOnly` ;',
        'mets 0 s’il n’y a aucune année bissextile.',
        '',
        '⚠️ Il faut AU MOINS un mois, et chaque mois doit durer au moins un jour.',
        'Un calendrier sans mois est inutilisable.',
    ].join('\n');
}

/** Ce qu'on accepte de rendre : une proposition, jamais un fichier écrit. */
export type PropositionDeCalendrier = Omit<CalendrierDatable, 'id'>;

function entier(valeur: unknown): number | null {
    const n = typeof valeur === 'string' ? Number(valeur) : valeur;
    return typeof n === 'number' && Number.isFinite(n) ? Math.trunc(n) : null;
}

/**
 * Compose un calendrier à partir d'une description libre.
 *
 * ⚠️ **Un mois sans durée lisible est écarté, pas rafistolé.** Lui inventer
 * trente jours changerait la longueur de l'année sans que personne ne le voie —
 * *et c'est justement le nombre que le meneur croit contrôler.* Un mois en moins
 * se voit dans la mesure ; un mois inventé ne se voit nulle part.
 */
export async function proposerUnCalendrier(
    description: string,
    options: { joursParAnnee?: number } = {},
    appel: AppelStructure = appelParDefaut,
): Promise<PropositionDeCalendrier> {
    const brut = await appel(
        description,
        consigne(options.joursParAnnee),
        {
            sansPersona: true,
            schema: SCHEMA,
            /* Dix-huit mois nommés et dix jours de semaine dépassent largement le
               défaut — c'est le défaut qui avait coupé la Forge de campagne. */
            plafondDeGeneration: 4096,
            libelle: 'Composition d’un calendrier',
        },
    );

    const objet = (brut ?? {}) as Record<string, unknown>;
    const liste = Array.isArray(objet.months)
        ? objet.months
        : Array.isArray(brut) ? brut as unknown[] : [];

    const months: CalendrierDatable['months'] = [];
    for (const item of liste) {
        const m = (item ?? {}) as Record<string, unknown>;
        const days = entier(m.days);
        if (days === null || days <= 0) continue;

        const nom = String(m.name ?? '').trim();
        months.push({
            name: nom,
            days,
            ...(m.isIntercalary ? { isIntercalary: true } : {}),
            ...(m.leapYearOnly ? { leapYearOnly: true } : {}),
        });
    }

    const semaine = Array.isArray(objet.daysOfWeek)
        ? objet.daysOfWeek.map(j => String(j ?? '').trim()).filter(Boolean)
        : [];

    const heures = entier(objet.hoursPerDay);
    const minutes = entier(objet.minutesPerHour);
    const cycle = entier(objet.cycleBissextile);
    const nom = typeof objet.name === 'string' ? objet.name.trim() : '';
    const propos = typeof objet.description === 'string' ? objet.description.trim() : '';

    return {
        name: nom,
        ...(propos ? { description: propos } : {}),
        months,
        /*
          ⚠️ **On retombe sur 24 et 60 plutôt que de laisser zéro.** Un modèle qui
          omet ces deux champs rendrait sinon un calendrier dont le jour dure zéro
          seconde — c'est-à-dire un calendrier qui gèle l'horloge. Le contrôle
          l'attraperait ; mais *le meneur verrait une faute qu'il n'a pas commise
          et que rien à l'écran ne lui permet de corriger d'un geste évident.*
        */
        hoursPerDay: heures !== null && heures > 0 ? heures : 24,
        minutesPerHour: minutes !== null && minutes > 0 ? minutes : 60,
        /* `daysPerWeek` n'est lu par personne, mais le type l'exige : on le tient
           d'accord avec les noms, au lieu de le laisser se contredire. */
        daysPerWeek: semaine.length,
        ...(semaine.length > 0 ? { daysOfWeek: semaine } : {}),
        ...(cycle !== null && cycle >= 0 ? { cycleBissextile: cycle } : {}),
    };
}
