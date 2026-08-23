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
/**
 * Combien de fois un même mot du corps compte encore.
 *
 * Un mot **répété** dit que le document traite du sujet ; un mot mentionné une
 * fois ne dit rien. Mais le compte brut favoriserait les gros documents — un
 * index de treize mille caractères mentionne tout plusieurs fois. Le plafond
 * borne l'avantage à trois occurrences, et `BONUS_CONTENU_MAX` borne le total :
 * **le corps ne peut jamais doubler deux mots trouvés dans un titre.**
 */
const OCCURRENCES_QUI_COMPTENT = 3;

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
    /**
     * Le `sujet:` de la fiche — **c'est lui qui permet de répondre sans modèle.**
     *
     * Étage 1 de l'axe M : quand le sujet d'une fiche recouvre la question, la
     * fiche EST la réponse, et l'invoquer un modèle pour la paraphraser
     * n'ajouterait qu'une occasion de se tromper.
     */
    sujet?: string;
    path: string;
    provenance: Provenance;
    score: number;
    tokens: number;
    tronque: boolean;
}

export interface Ecarte {
    path: string;
    /**
     * Pourquoi ce document n'est pas parti — **et les quatre raisons se
     * distinguent**, parce qu'elles appellent des gestes différents.
     *
     * - `hors-perimetre` : il n'appartient ni au système actif, ni à la
     *   campagne, ni au fonds commun. Rien à faire, c'est le tri normal.
     * - `hors-sujet` : la question porte des mots, et **pas un seul** ne se
     *   trouve dans ce document. *Mesuré le 2026-08-23 : deux documents sur
     *   trente-et-un partaient ainsi, à 1 450 tokens pièce.*
     * - `budget` : il aurait servi, il ne tenait plus.
     * - `double-par-le-rang` : il tenait, mais un document **mieux classé**
     *   avait déjà été écarté faute de place. Le laisser passer ferait trancher
     *   la TAILLE au lieu de la pertinence.
     */
    raison: 'hors-perimetre' | 'hors-sujet' | 'budget' | 'double-par-le-rang';
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
 * Les mots d'un texte, comptés — **sans accents, et entiers.**
 *
 * **Deux défauts d'un coup, mesurés le 2026-08-23.**
 *
 * 1. **Le mot cherché était déplié, le corps ne l'était pas.** `motsDeRecherche`
 *    passe la question par `slug`, qui retire les accents : « résolvent »
 *    devient `resolvent`. Le corps, lui, n'était que passé en minuscules — et
 *    `corps.includes('resolvent')` ne trouvait jamais « résolvent ».
 *    `degres-de-reussite-et-critiques.md` emploie « réussite » **vingt-trois
 *    fois** et le moteur en voyait **zéro**. Le mot est invisible dans treize
 *    des vingt-et-une fiches de Rêves de Dragons. *Deux textes qu'on compare
 *    doivent être normalisés pareil — c'est le même défaut que « deux champs qui
 *    désignent la même chose ne peuvent pas se normaliser différemment ».*
 * 2. **La comparaison portait sur des SOUS-CHAÎNES.** `includes('jets')`
 *    répondait vrai pour « objets » et « projets ». C'est exactement ce que la
 *    recherche dans le livre a payé le 2026-08-22, où « le rêve » renvoyait vers
 *    *Acrève* et *Blurêve*. On découpe donc en mots au lieu de chercher dedans.
 *
 * Le compte sert au départage : un mot **répété** distingue le document qui
 * traite du sujet de celui qui l'effleure. *Avant, les deux valaient pareil, et
 * c'est l'ordre alphabétique du chemin qui tranchait.*
 */
function motsDuTexte(texte: string): Map<string, number> {
    const compte = new Map<string, number>();
    for (const mot of slug(texte).split('-')) {
        if (mot) compte.set(mot, (compte.get(mot) ?? 0) + 1);
    }
    return compte;
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

    const entete = motsDuTexte([file.sujet ?? '', file.titre ?? '', file.path].join(' '));
    const corps = motsDuTexte(file.content);

    let bonus = 0;
    let bonusCorps = 0;

    for (const mot of mots) {
        if (entete.has(mot)) bonus += BONUS_TITRE;
        else {
            const fois = corps.get(mot) ?? 0;
            if (fois > 0) bonusCorps += BONUS_CONTENU * Math.min(fois, OCCURRENCES_QUI_COMPTENT);
        }
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

        const bonus = bonusPertinence(file, mots);

        /*
          **Le seuil de pertinence, et il n'existait pas.**

          Tout document du périmètre devenait candidat, et le budget seul
          tranchait : une fiche sans **un seul** mot commun avec la question
          occupait ses 1 450 tokens comme une autre. La mesure du 2026-08-23 en
          a compté deux sur trente-et-un retenus à 4 000 — et vingt sur les
          soixante-dix-neuf retenus à 12 000, ce qui est ce qui rendait un
          plafond plus haut inutile.

          C'est **la même correction pour deux défauts** : sans seuil, il y avait
          toujours au moins une source, donc l'état `rien` était inatteignable et
          le jugement de table ne se déclenchait jamais. *L'étiquette qui
          « marchait » ne marchait que parce que le corpus était cassé.*

          **La garde compte.** Sans question — ou avec une question qui ne
          contient que des mots sans portée — le bonus vaut zéro pour tout le
          monde : appliquer le seuil viderait la sélection au lieu de la trier.
          On ne sait alors rien, et *une liste vide dirait qu'on a cherché.*
        */
        if (mots.length > 0 && bonus === 0) {
            ecartes.push({ path: file.path, raison: 'hors-sujet' });
            continue;
        }

        candidats.push({ file, provenance, score: RANG[provenance] + bonus });
    }

    // Score décroissant, puis chemin, pour que deux exécutions identiques
    // produisent le même prompt — un contexte instable rend le KV-cache inutile.
    candidats.sort((a, b) => b.score - a.score || a.file.path.localeCompare(b.file.path));

    /**
     * Le meilleur **score** écarté faute de place.
     *
     * *Le défaut mesuré le 2026-08-23 : le budget tranchait sur la TAILLE.* La
     * boucle est gloutonne et ordonnée par score ; quand une fiche de 1 450
     * tokens ne tenait plus, elle était écartée **et la boucle continuait** —
     * un petit document moins bien classé se glissait derrière elle. **13 des
     * 31 documents retenus à 4 000 en venaient**, soit 42 %.
     *
     * Sur « comment se résolvent les jets ? », la troisième place allait à une
     * fiche de PNJ de scénario (rang 60) pendant qu'une fiche de règle (rang
     * 100) attendait le palier 8 000. *Elle n'avait pas perdu sur sa
     * pertinence : elle avait perdu sur son poids.*
     *
     * **On garde le dépassement à score ÉGAL**, et c'est délibéré : une fiche
     * plus courte qui prend la place d'une fiche trop grosse est le meilleur
     * usage du budget restant — les deux répondent aussi bien. Ce qu'on
     * interdit, c'est qu'un moins bon double un meilleur.
     *
     * **C'est le SCORE qui compte, pas le rang de provenance**, et la mesure l'a
     * tranché. Un premier jet comparait les rangs : sur « quelles sont les
     * scènes prévues et les menaces ? », un index système de 3 069 tokens
     * mangeait le budget, la fiche suivante était refusée, et le rang 100 ainsi
     * posé **verrouillait toutes les fiches de campagne** — qui étaient
     * pourtant la réponse. *Un document de campagne à 84 vaut mieux qu'une
     * fiche à 60 : c'est le score qui dit lequel répond, pas le dossier d'où il
     * vient.*
     *
     * Le budget peut donc rester partiellement inemployé, et **c'est voulu** :
     * si le meilleur candidat restant ne tient pas, remplir la place avec du
     * moins bon est exactement ce qu'on cherche à empêcher.
     */
    let meilleurScoreEcarte = 0;

    const retenus: Retenu[] = [];
    const blocs: string[] = [];
    let total = 0;

    for (const candidat of candidats) {
        if (candidat.score < meilleurScoreEcarte) {
            ecartes.push({ path: candidat.file.path, raison: 'double-par-le-rang' });
            continue;
        }

        // L'en-tête et le séparateur partent aussi dans le prompt : les
        // exclure du calcul laisserait le bloc dépasser le plafond annoncé.
        const habillage = `[Source: ${candidat.file.path}]\n` + (blocs.length > 0 ? SEPARATEUR : '');
        const coutHabillage = estimateTokens(habillage);
        const restant = budget - total - coutHabillage;

        if (restant <= 0) {
            ecartes.push({ path: candidat.file.path, raison: 'budget' });
            meilleurScoreEcarte = Math.max(meilleurScoreEcarte, candidat.score);
            continue;
        }

        const { texte, tokens, tronque: coupe } = tronque(candidat.file, candidat.provenance, restant);
        if (tokens === 0) {
            ecartes.push({ path: candidat.file.path, raison: 'budget' });
            meilleurScoreEcarte = Math.max(meilleurScoreEcarte, candidat.score);
            continue;
        }

        blocs.push(`[Source: ${candidat.file.path}]\n${texte}`);
        retenus.push({
            path: candidat.file.path,
            relu: candidat.file.relu,
            aRegenerer: candidat.file.aRegenerer,
            sujet: candidat.file.sujet,
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
