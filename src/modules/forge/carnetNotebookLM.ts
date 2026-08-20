import { forgeService } from './ForgeService';

/**
 * Le catalogue du carnet NotebookLM : ses carnets, et les sources de chacun.
 *
 * **Extrait le 2026-08-15, parce qu'il était sur le point d'être écrit une
 * troisième fois.** `ChronicleForge` — retirée depuis, le 2026-08-17 — et
 * `ForgeDashboard` en portaient chacun leur version, et elles ne lisaient déjà
 * pas la réponse de la même façon : la première seule connaissait le cas des
 * sources rendues **à côté** du carnet.
 * *Deux chemins vers le même service finissent toujours par ne plus dire la même
 * chose*, et ici la divergence est muette : une liste de sources vide s'affiche
 * comme « ce carnet n'en a pas ».
 *
 * L'appel passe par `forgeService.callMcpTool`, qui porte la réauthentification
 * et le plafond de temps.
 */

export interface SourceDuCarnet {
    id: string;
    title: string;
    source_type: string;
}

export interface CarnetLM {
    id: string;
    title: string;
}

/** Le corps utile d'une réponse MCP, quelle que soit la forme qu'elle a prise. */
function deplier(valeur: unknown): unknown {
    if (typeof valeur !== 'string') return valeur;
    const nu = valeur.trim();
    if (!nu.startsWith('{') && !nu.startsWith('[')) return valeur;
    try {
        return JSON.parse(nu);
    } catch {
        return valeur;
    }
}

/**
 * Les carnets accessibles.
 *
 * Le serveur rend selon les jours `{ notebooks: [...] }`, `{ data: {...} }` ou
 * une chaîne JSON. On lit les trois plutôt que de n'en attendre qu'une : *le
 * serveur rend la même demande sous des formes qu'on n'attend pas* est la leçon
 * la plus répétée de ce projet.
 */
export async function listerLesCarnets(max = 100): Promise<CarnetLM[]> {
    const reponse = await forgeService.callMcpTool<Record<string, unknown>>(
        'notebooklm-mcp-server', 'notebook_list', { max_results: max },
    );

    const brut = deplier(reponse?.notebooks ?? (reponse?.data as Record<string, unknown>)?.notebooks ?? reponse?.content);
    const liste = Array.isArray(brut)
        ? brut
        : ((brut as Record<string, unknown>)?.notebooks ?? (brut as Record<string, unknown>)?.data ?? []);

    return (Array.isArray(liste) ? liste : [])
        .map((n: Record<string, unknown>) => ({
            id: String(n?.id ?? ''),
            title: String(n?.title ?? 'Carnet sans titre'),
        }))
        .filter(n => n.id);
}

/**
 * Les sources d'un carnet.
 *
 * **Le client Gemini Notebook les rend À CÔTÉ du carnet**, pas dedans :
 * `{ notebook: {...}, sources: [...] }`. Lire `.sources` sur le seul objet
 * `notebook` donnait une liste vide **sans erreur** — le carnet s'affichait, ses
 * sources jamais. Le second cas, imbriqué, est la forme tabulaire brute que le
 * serveur rend parfois.
 */
export async function listerLesSources(notebookId: string): Promise<SourceDuCarnet[]> {
    const reponse = await forgeService.callMcpTool<Record<string, unknown>>(
        'notebooklm-mcp-server', 'notebook_get', { notebook_id: notebookId },
    );

    // Forme 1 — les sources posées à côté du carnet.
    if (Array.isArray(reponse?.sources)) {
        return (reponse.sources as Record<string, unknown>[]).map(normaliserSource);
    }

    const donnees = deplier(reponse?.notebook ?? reponse?.content);

    // Forme 2 — un tableau brut : [titre, [[ [id], titre ], …]].
    if (Array.isArray(donnees) && Array.isArray(donnees[0])) {
        const brutes = (donnees[0] as unknown[])[1];
        return (Array.isArray(brutes) ? brutes : []).map((s: unknown) => {
            const paire = s as [string[], string];
            return {
                id: paire?.[0]?.[0] ?? '',
                title: paire?.[1] ?? 'Source sans titre',
                source_type: 'archive',
            };
        }).filter(s => s.id);
    }

    // Forme 3 — les sources dans l'objet carnet.
    const dedans = (donnees as Record<string, unknown>)?.sources;
    return (Array.isArray(dedans) ? dedans : []).map(normaliserSource);
}

function normaliserSource(s: Record<string, unknown>): SourceDuCarnet {
    return {
        id: String(s?.id ?? ''),
        title: String(s?.title ?? 'Source sans titre'),
        source_type: String(s?.source_type ?? 'archive'),
    };
}
