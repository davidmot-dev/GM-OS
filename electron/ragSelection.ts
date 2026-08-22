/**
 * Sélection du contexte RAG — la partie qui décide *quoi* envoyer au modèle.
 *
 * Isolée de `RAGEngine` pour deux raisons : elle est pure (rien du disque,
 * rien d'Electron), donc testable en environnement node ; et c'est elle qui
 * porte les arbitrages, qui méritent d'être lus d'un seul tenant.
 *
 * Ce qu'elle remplace : un filtre qui laissait passer les 83 fichiers de
 * `docs/` — les clauses `lowerPath.includes('systems')` / `('campaigns')`
 * annulaient le filtrage par système — suivi d'un `.slice(0, 15)` sur
 * l'ordre alphabétique du disque. La sélection était donc identique pour
 * toutes les campagnes, et les fiches du corpus, rangées dans `rules/`,
 * n'étaient jamais atteintes.
 *
 * Trois principes :
 *
 * 1. **Périmètre dur.** Un document doit appartenir au système actif, à la
 *    campagne active, ou au fonds commun. Le reste n'est pas mal classé :
 *    il est écarté.
 * 2. **Le rang avant la taille.** Une fiche du corpus (frontmatter `sujet:`)
 *    passe devant une décharge brute du même système, quelle que soit la
 *    question.
 * 3. **Un budget en tokens, pas en fichiers.** Et un plafond par fichier pour
 *    les documents non structurés, sans quoi une décharge tronquée à
 *    50 000 caractères avale le budget à elle seule.
 */

/**
 * Les regles d'identite des systemes vivent dans `corpusSysteme` : c'est la
 * meme question — quel dossier appartient a quel systeme — et la lecture et
 * l'ecriture doivent y repondre pareil. Deux copies divergeraient, et une
 * divergence entre lecture et ecriture est indetectable par construction.
 */
import { slug, memeIdentite, normaliseChemin } from './corpusSysteme';

export { slug };

/** Plafond global du bloc RAG. */
export const MAX_CONTEXT_TOKENS = 4000;

/**
 * Plafond par fichier — **pour les documents non structurés seulement**.
 *
 * Les fiches du corpus n'y sont pas soumises : elles sont écrites pour être
 * bornées (1 400 à 8 200 caractères mesurés au 2026-08-09, moyenne 5 800).
 * Une fiche est prise **entière ou pas du tout** — en tronquer une couperait
 * une règle en deux, ce qui est précisément le défaut qu'on corrige ; quand
 * elle ne tient pas, la place revient à la suivante. Le plafond vise les
 * décharges brutes, qui n'ont pas d'unité de sens à préserver.
 */
export const MAX_RAW_FILE_TOKENS = 1200;

/** Français : ~3,5 caractères par token. Suffisant pour un budget. */
export const CHARS_PER_TOKEN = 3.5;

const MARQUE_TRONCATURE = '\n… [tronqué : plafond de contexte atteint]';
const SEPARATEUR = '\n\n---\n\n';

export function estimateTokens(text: string): number {
    return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/** Rangs de base. L'écart entre deux rangs excède le bonus de pertinence maximal. */
const RANG = {
    /** Fiche du corpus du système actif. */
    fiche: 100,
    /** Document de la campagne active. */
    campagne: 60,
    /** Autre document du système actif. */
    systeme: 40,
    /** Fonds commun, valable pour tous les jeux. */
    commun: 30,
} as const;

/** Dossier toujours éligible, quel que soit le système actif. */
export const DOSSIER_COMMUN = 'commun';

const BONUS_TITRE = 12;
const BONUS_CONTENU = 3;
const BONUS_CONTENU_MAX = 15;

export type Provenance = 'fiche' | 'campagne' | 'systeme' | 'commun';

export interface IndexedFile {
    /** Chemin relatif à la racine des docs, séparateurs '/'. */
    path: string;
    content: string;
    /** `sujet:` du frontmatter — la marque d'une fiche du corpus. */
    sujet?: string;
    /** Premier titre `#` du document. */
    titre?: string;
    /**
     * La fiche a-t-elle été relue par un humain ?
     *
     * **Le marqueur existait, et personne ne le lisait.** `relu: false` est
     * écrit par trois endroits depuis des semaines — la conversion de fiche,
     * l'inventaire, le service de campagne — et **194 fiches le portaient** le
     * 2026-08-22 sans qu'aucun lecteur n'existe. *Le journal des lacunes
     * attrape ce qui manque ; rien n'attrapait ce qui est faux.*
     *
     * `undefined` pour tout ce qui n'est pas une fiche du corpus — un extrait
     * brut n'a pas à se prétendre relu ni non relu.
     */
    relu?: boolean;
    /**
     * La fiche est-elle **signalée comme suspecte** ?
     *
     * `a_regenerer` existe depuis l'audit du corpus et porte exactement ce sens.
     * Seize fiches le portaient le 2026-08-22 **sans qu'aucun lecteur
     * n'existe** : troisième marqueur écrit et jamais lu, après `relu` et
     * `empreinte`. On lui donne son lecteur plutôt que d'en inventer un
     * quatrième à côté.
     */
    aRegenerer?: boolean;
}

export interface RagRequest {
    /** Identifiant du système, tel qu'il nomme le dossier (`alien`, `blade-runner`). */
    systemId: string;
    campaignName: string;
    /** La question posée. Sans elle, on ne peut trier que par système. */
    query?: string;
    /** Nom affiché du système, essayé en second (« Blade Runner » → `blade-runner`). */
    systemName?: string;
    /** « Chemin des Règles » de la fiche de campagne, s'il est renseigné. */
    systemPath?: string;
    /** « Chemin des Notes » de la fiche de campagne, s'il est renseigné. */
    campaignPath?: string;
    maxTokens?: number;
}

export interface Retenu {
    /** L'état de relecture de la fiche, quand elle en déclare un. */
    relu?: boolean;
    /** La fiche a-t-elle été signalée comme suspecte ? */
    aRegenerer?: boolean;
    path: string;
    provenance: Provenance;
    score: number;
    tokens: number;
    tronque: boolean;
}

export interface Ecarte {
    path: string;
    raison: 'hors-perimetre' | 'budget';
}

export interface RagSelection {
    context: string;
    retenus: Retenu[];
    ecartes: Ecarte[];
    totalTokens: number;
    /** Anomalies de configuration à faire remonter — un silence en cacherait une. */
    avertissements: string[];
}

function sousChemin(relPath: string, base: string): boolean {
    if (!base) return false;
    const p = relPath.toLowerCase();
    return p === base || p.startsWith(`${base}/`);
}

const MOTS_VIDES = new Set([
    'avec', 'sans', 'dans', 'pour', 'quand', 'comment', 'combien', 'quel', 'quels',
    'quelle', 'quelles', 'est', 'sont', 'être', 'etre', 'avoir', 'faire', 'fait',
    'peut', 'peux', 'dois', 'doit', 'plus', 'moins', 'très', 'tres', 'tout', 'tous',
    'toute', 'toutes', 'mais', 'donc', 'alors', 'cette', 'ceux', 'celui', 'leur',
    'leurs', 'elle', 'elles', 'nous', 'vous', 'ils', 'que', 'qui', 'quoi', 'des',
    'les', 'une', 'aux', 'sur', 'par', 'son', 'ses', 'mon', 'mes', 'lui', 'the',
    'and', 'what', 'when', 'how', 'does', 'joueur', 'joueurs', 'personnage', 'règle',
    'regle', 'règles', 'regles', 'jeu',
]);

/** Mots significatifs de la question, dédoublonnés. */
export function motsDeRecherche(query: string): string[] {
    const mots = slug(query).split('-').filter(m => m.length >= 4 && !MOTS_VIDES.has(m));
    return [...new Set(mots)];
}

/**
 * Bonus de pertinence d'un document pour une question.
 *
 * Un mot trouvé dans le sujet, le titre ou le nom de fichier pèse quatre fois
 * plus qu'un mot trouvé dans le corps : le sujet dit de quoi le document
 * *traite*, le corps dit seulement ce qu'il *mentionne*. Le corpus a déjà payé
 * ce tri — « Stress » apparaissait dans 12 des 17 fiches Blade Runner avant
 * d'obtenir la sienne.
 */
function bonusPertinence(file: IndexedFile, mots: readonly string[]): number {
    if (mots.length === 0) return 0;

    const entete = slug([file.sujet ?? '', file.titre ?? '', file.path].join(' '));
    const corps = file.content.toLowerCase();

    let bonus = 0;
    let bonusCorps = 0;

    for (const mot of mots) {
        if (entete.includes(mot)) bonus += BONUS_TITRE;
        else if (corps.includes(mot)) bonusCorps += BONUS_CONTENU;
    }

    return bonus + Math.min(bonusCorps, BONUS_CONTENU_MAX);
}

function classe(file: IndexedFile, req: RagRequest): Provenance | null {
    const relPath = file.path.replace(/\\/g, '/');
    const segments = relPath.split('/');
    const racine = slug(segments[0] ?? '');

    const systemPath = req.systemPath ? normaliseChemin(req.systemPath) : '';
    const campaignPath = req.campaignPath ? normaliseChemin(req.campaignPath) : '';

    // 1. Les chemins déclarés sur la fiche de campagne l'emportent : ils sont
    //    explicites, là où la déduction par nom de dossier est une supposition.
    if (campaignPath && sousChemin(relPath, campaignPath)) return 'campagne';
    if (systemPath && sousChemin(relPath, systemPath)) {
        return file.sujet ? 'fiche' : 'systeme';
    }

    if (racine === DOSSIER_COMMUN) return 'commun';

    const idsSysteme = [slug(req.systemId), slug(req.systemName ?? '')].filter(Boolean);

    if (racine === 'systems' && segments.length > 1) {
        const dossier = slug(segments[1]);
        if (idsSysteme.some(id => memeIdentite(dossier, id))) {
            return file.sujet ? 'fiche' : 'systeme';
        }
        return null;
    }

    if (racine === 'campaigns' && segments.length > 1) {
        // Sans « Chemin des Notes », on retombe sur le nom du dossier. C'est
        // fragile — les dossiers sur disque ne portent pas toujours le nom de
        // la campagne — d'où l'avertissement émis plus bas quand rien ne sort.
        const cible = slug(req.campaignName);
        if (cible && segments.slice(1).some(s => memeIdentite(slug(s), cible))) return 'campagne';
        return null;
    }

    return null;
}

function tronque(file: IndexedFile, provenance: Provenance, budgetRestant: number): {
    texte: string;
    tokens: number;
    tronque: boolean;
} {
    const tokens = estimateTokens(file.content);

    // Une fiche passe entière ou pas du tout. La couper trancherait une règle
    // au milieu — le défaut même qu'on corrige — et il vaut mieux laisser la
    // place à la fiche suivante, plus courte, qu'en livrer une amputée.
    if (provenance === 'fiche') {
        return tokens <= budgetRestant
            ? { texte: file.content, tokens, tronque: false }
            : { texte: '', tokens: 0, tronque: false };
    }

    const plafond = Math.min(MAX_RAW_FILE_TOKENS, budgetRestant);
    if (tokens <= plafond) return { texte: file.content, tokens, tronque: false };

    // La marque compte dans le budget : la poser après avoir découpé à la
    // limite exacte faisait dépasser le plafond de sa propre longueur.
    const budgetTexte = plafond - estimateTokens(MARQUE_TRONCATURE);
    if (budgetTexte <= 0) return { texte: '', tokens: 0, tronque: true };

    const coupe = Math.floor(budgetTexte * CHARS_PER_TOKEN);
    const texte = `${file.content.slice(0, coupe)}${MARQUE_TRONCATURE}`;
    return { texte, tokens: estimateTokens(texte), tronque: true };
}

/**
 * Choisit les documents à envoyer et assemble le bloc de contexte.
 *
 * Retourne aussi ce qui a été écarté et pourquoi : le journal des lacunes
 * attrape ce qui manque au corpus, celui-ci attrape ce que le moteur refuse.
 */
export function selectContext(
    entries: Iterable<IndexedFile>,
    req: RagRequest,
): RagSelection {
    const budget = req.maxTokens ?? MAX_CONTEXT_TOKENS;
    const mots = req.query ? motsDeRecherche(req.query) : [];

    const candidats: Array<{ file: IndexedFile; provenance: Provenance; score: number }> = [];
    const ecartes: Ecarte[] = [];

    for (const file of entries) {
        const provenance = classe(file, req);
        if (!provenance) {
            ecartes.push({ path: file.path, raison: 'hors-perimetre' });
            continue;
        }
        candidats.push({
            file,
            provenance,
            score: RANG[provenance] + bonusPertinence(file, mots),
        });
    }

    // Score décroissant, puis chemin, pour que deux exécutions identiques
    // produisent le même prompt — un contexte instable rend le KV-cache inutile.
    candidats.sort((a, b) => b.score - a.score || a.file.path.localeCompare(b.file.path));

    const retenus: Retenu[] = [];
    const blocs: string[] = [];
    let total = 0;

    for (const candidat of candidats) {
        // L'en-tête et le séparateur partent aussi dans le prompt : les
        // exclure du calcul laisserait le bloc dépasser le plafond annoncé.
        const habillage = `[Source: ${candidat.file.path}]\n` + (blocs.length > 0 ? SEPARATEUR : '');
        const coutHabillage = estimateTokens(habillage);
        const restant = budget - total - coutHabillage;

        if (restant <= 0) {
            ecartes.push({ path: candidat.file.path, raison: 'budget' });
            continue;
        }

        const { texte, tokens, tronque: coupe } = tronque(candidat.file, candidat.provenance, restant);
        if (tokens === 0) {
            ecartes.push({ path: candidat.file.path, raison: 'budget' });
            continue;
        }

        blocs.push(`[Source: ${candidat.file.path}]\n${texte}`);
        retenus.push({
            path: candidat.file.path,
            relu: candidat.file.relu,
            aRegenerer: candidat.file.aRegenerer,
            provenance: candidat.provenance,
            score: candidat.score,
            tokens,
            tronque: coupe,
        });
        total += tokens + coutHabillage;
    }

    const avertissements: string[] = [];
    if (candidats.length === 0) {
        avertissements.push(
            `Aucun document pour « ${req.systemId} » : le dossier docs/systems/${slug(req.systemId)} existe-t-il ?`,
        );
    }
    if (!req.campaignPath && !retenus.some(r => r.provenance === 'campagne')) {
        avertissements.push(
            `Aucun document rattaché à la campagne « ${req.campaignName} ». Les dossiers de docs/campaigns/ ne portent pas forcément son nom — renseigner « Chemin des Notes » dans la fiche de campagne.`,
        );
    }

    return {
        context: blocs.join(SEPARATEUR),
        retenus,
        ecartes,
        totalTokens: total,
        avertissements,
    };
}
