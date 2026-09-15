import { aiService } from '../../ai/AIService';
import type { TableData, TableEntry } from '../types';

/**
 * **Le texte d'un manuel, rangé en entrées — par le modèle, relu par le
 * contrôle.**
 *
 * Demandé par David le 2026-09-15. Jusqu'ici, la manœuvre était écrite dans
 * `databases/tables/MedFan/Prompt Aide Création de Table.txt` : copier ce prompt
 * dans ChatGPT, lui donner sa table, recoller le JSON. *Une consigne qui vit
 * dans un fichier texte qu'on copie à la main est une consigne qu'on finit par
 * ne plus copier.*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⭐ CE QUI REND CET APPEL SÛR, ET QUI N'EST PAS DANS L'INVITE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Ce n'est pas la qualité du prompt : c'est que **rien n'est appliqué sans
 * repasser par `controlerLaTable`**, et que le meneur voit la bande de
 * couverture avant d'enregistrer. Le modèle **propose**, le contrôle **relit**,
 * l'écran **montre**.
 *
 * *Un modèle qui oublie les valeurs 17 à 20 produit une table plausible ; la
 * bande la montre rouge en une seconde.* C'est la seule raison pour laquelle on
 * peut se permettre de laisser une machine écrire des oracles.
 *
 * ⚠️ **On ne lui demande PAS de choisir le dé** quand le meneur en a déjà
 * choisi un : il le reçoit, et doit couvrir sa portée. Le laisser décider
 * ferait diverger la table de l'écran qui l'attend.
 *
 * ⛔ **`sansPersona`**, comme toute extraction : une tâche structurée n'a que
 * faire d'une voix de meneur, et celle de la campagne active n'a rien à faire
 * dans la mise en forme d'une table d'un autre jeu.
 */

/** Ce que le modèle doit rendre. Imposé au décodeur, pas seulement demandé. */
const SCHEMA = {
    type: 'object',
    properties: {
        name: { type: 'string' },
        entries: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    min: { type: 'integer' },
                    max: { type: 'integer' },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    effect: { type: 'string' },
                },
                required: ['min', 'max', 'title'],
            },
        },
    },
    required: ['entries'],
} as const;

/**
 * **La couture d'essai.** Le même parti que `useFonduCroise` : on injecte
 * l'appel plutôt que de simuler un module entier, pour que les essais portent
 * sur *ce qu'on fait de la réponse* — qui est tout le sujet ici.
 */
export type AppelStructure = (
    prompt: string,
    systemPrompt: string,
    options: Record<string, unknown>,
    pieces?: { data: string; mimeType: string }[],
) => Promise<unknown>;

const appelParDefaut: AppelStructure = (prompt, systemPrompt, options, pieces) =>
    aiService.generateJSON<unknown>(prompt, systemPrompt, pieces, options);

function consigne(de?: string): string {
    return [
        'Tu ranges une table aléatoire de jeu de rôle, copiée depuis un manuel.',
        '',
        'Pour chaque résultat, sépare trois choses, et ne les mélange pas :',
        '- `title` : le nom du résultat, court, tel qu\'on l\'annonce à voix haute ;',
        '- `description` : l\'ambiance, la prose narrative ;',
        '- `effect` : la mécanique — dégâts, jets, modificateurs. Omets-le s\'il n\'y en a pas.',
        '',
        de
            ? `Le dé est « ${de} ». Les bornes min/max doivent couvrir TOUTE sa portée, `
              + 'sans trou ni recouvrement. Ne change pas de dé.'
            : 'Déduis les bornes du texte. Elles doivent se suivre sans trou ni recouvrement.',
        '',
        'N\'invente aucun résultat qui ne soit pas dans le texte. Ne traduis pas.',
        'Conserve l\'ordre du texte.',
    ].join('\n');
}

/** Ce qu'on accepte de rendre : une proposition, jamais un fichier écrit. */
export interface PropositionDeTable {
    name?: string;
    entries: TableEntry[];
}

function entiers(valeur: unknown): number | null {
    const n = typeof valeur === 'string' ? Number(valeur) : valeur;
    return typeof n === 'number' && Number.isInteger(n) ? n : null;
}

/**
 * Range un texte en entrées de table.
 *
 * ⚠️ **Une entrée sans bornes lisibles est écartée, pas rafistolée.** Lui
 * inventer un `min` la placerait quelque part au hasard dans la table : *une
 * entrée perdue se voit dans la bande, une entrée déplacée ne se voit nulle
 * part.*
 */
export async function rangerParLIA(
    texte: string,
    options: { de?: string; image?: { donnees: string; mimeType: string } } = {},
    appel: AppelStructure = appelParDefaut,
): Promise<PropositionDeTable> {
    /*
      ⚠️ **L'image n'est honorée que par Gemini.** `generateJSON` la passe en
      `inline_data` ; les autres fournisseurs **l'ignorent en silence**, et
      rendront donc une table tirée du seul texte — ou rien. C'est une limite du
      pont, pas d'ici, et elle est écrite là où on la rencontre.

      ⛔ **Et ce chemin n'avait jamais été emprunté** : `attachments` existe dans
      `AIService` depuis toujours, sans un seul appelant dans tout le dépôt.
      *Une capacité déclarée que personne n'appelle n'est pas une capacité,
      c'est une promesse.*
    */
    const pieces = options.image
        ? [{ data: options.image.donnees, mimeType: options.image.mimeType }]
        : undefined;

    const brut = await appel(
        texte || (pieces ? 'Range la table de l’image.' : ''),
        consigne(options.de),
        {
            sansPersona: true,
            schema: SCHEMA,
            // Une table de vingt entrées avec leurs descriptions dépasse largement
            // le défaut : c'est le défaut qui avait coupé la Forge de campagne.
            plafondDeGeneration: 4096,
            libelle: 'Mise en forme d’une table',
        },
        pieces,
    );

    const objet = (brut ?? {}) as Partial<TableData> & Record<string, unknown>;
    const liste = Array.isArray(objet.entries)
        ? objet.entries
        : Array.isArray(brut) ? brut as unknown[] : [];

    const entrees: TableEntry[] = [];
    for (const item of liste) {
        const e = (item ?? {}) as Record<string, unknown>;
        const min = entiers(e.min);
        const max = entiers(e.max);
        if (min === null || max === null) continue;

        entrees.push({
            min, max: Math.max(min, max),
            title: String(e.title ?? '').trim(),
            description: String(e.description ?? '').trim(),
            ...(e.effect ? { effect: String(e.effect).trim() } : {}),
        });
    }

    const nom = typeof objet.name === 'string' ? objet.name.trim() : '';
    return { ...(nom ? { name: nom } : {}), entries: entrees };
}
