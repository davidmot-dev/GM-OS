import { createHash, randomBytes } from 'node:crypto';
import { mkdir, readFile, rename, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';

export const ENTETE_MEDIA_PRIVE = 'x-gmos-module-session';
export interface MediaPrive { type: string; nom: string; source: string }
const types = new Set(['image/png', 'image/jpeg', 'image/webp', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'video/mp4', 'video/webm']);
const estMedia = (v: Record<string, unknown>): v is MediaPrive & Record<string, unknown> =>
    typeof v.type === 'string' && ['image', 'audio', 'video'].includes(v.type) && typeof v.nom === 'string'
    && typeof v.source === 'string' && /^data:[a-z0-9/]+;base64,[A-Za-z0-9+/]+={0,2}$/.test(v.source);
export const identifiantMedia = (source: string) => createHash('sha256').update(source).digest('hex');
/** Parcourt uniquement la projection déjà filtrée par le moteur, jamais la sauvegarde. */
export function mediasDeLaVue(vue: unknown): Map<string, MediaPrive> {
    const resultat = new Map<string, MediaPrive>();
    function visiter(v: unknown) {
        if (!v || typeof v !== 'object') return;
        if (!Array.isArray(v) && estMedia(v as Record<string, unknown>)) {
            const media = v as MediaPrive; resultat.set(identifiantMedia(media.source), media); return;
        }
        for (const enfant of Object.values(v)) visiter(enfant);
    }
    visiter(vue); return resultat;
}
export function projeterMedias(vue: unknown, campagne: string, module: string, session: { jeton: string; port: number; base?: string }): unknown {
    function remplacer(v: unknown): unknown {
        if (!v || typeof v !== 'object') return v;
        if (!Array.isArray(v) && estMedia(v as Record<string, unknown>)) {
            const media = v as MediaPrive;
            return { ...media, source: `/modules-prives/${encodeURIComponent(campagne)}/${module}/${identifiantMedia(media.source)}` };
        }
        if (Array.isArray(v)) return v.map(remplacer);
        return Object.fromEntries(Object.entries(v).map(([cle, enfant]) => [cle, remplacer(enfant)]));
    }
    const resultat = remplacer(vue) as { integration: Record<string, unknown> };
    resultat.integration = { ...resultat.integration, ressources: session }; return resultat;
}
/** Cache dérivé et reconstructible ; les octets portables restent dans la sauvegarde privée v2. */
const lecturesEnCours = new Map<string, Promise<{ octets: Buffer; mime: string }>>();
export async function lireFichierMedia(dossier: string, media: MediaPrive): Promise<{ octets: Buffer; mime: string }> {
    const morceaux = /^data:([a-z0-9/]+);base64,([A-Za-z0-9+/]+={0,2})$/.exec(media.source);
    if (!morceaux || !types.has(morceaux[1])) throw new Error('Média invalide.');
    const octets = Buffer.from(morceaux[2], 'base64');
    if (octets.length > 4 * 1024 * 1024 || octets.toString('base64') !== morceaux[2]) throw new Error('Média invalide.');
    const fichier = path.join(dossier, `${identifiantMedia(media.source)}.bin`);
    const enCours = lecturesEnCours.get(fichier); if (enCours) return enCours;
    // Trois lecteurs (MJ et deux tablettes) peuvent manquer le même cache à la
    // fois. Un seul écrit : des rename concurrents échouent en EPERM sur Windows.
    const lecture = (async () => {
        try {
            const lu = await readFile(fichier);
            if (lu.equals(octets)) return { octets: lu, mime: morceaux[1] };
        } catch (e) { if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e; }
        await mkdir(dossier, { recursive: true });
        const temporaire = `${fichier}.${randomBytes(8).toString('hex')}.tmp`;
        try { await writeFile(temporaire, octets, { mode: 0o600, flush: true }); await rename(temporaire, fichier); }
        finally { await unlink(temporaire).catch(() => {}); }
        return { octets, mime: morceaux[1] };
    })();
    lecturesEnCours.set(fichier, lecture);
    try { return await lecture; } finally { lecturesEnCours.delete(fichier); }
}
export function servirMediaPrive(req: IncomingMessage, res: ServerResponse, octets: Buffer, mime: string) {
    const taille = octets.length, plage = req.headers.range;
    let debut = 0, fin = taille - 1;
    if (plage) {
        const r = /^bytes=(\d*)-(\d*)$/.exec(plage);
        if (!r || !r[1] && !r[2]) debut = -1;
        else if (!r[1]) debut = Math.max(0, taille - Number(r[2]));
        else { debut = Number(r[1]); if (r[2]) fin = Math.min(Number(r[2]), taille - 1); }
        if (!Number.isSafeInteger(debut) || !Number.isSafeInteger(fin) || debut < 0 || debut > fin || debut >= taille) {
            res.writeHead(416, { 'Content-Range': `bytes */${taille}` }); res.end(); return;
        }
    }
    res.writeHead(plage ? 206 : 200, { 'Content-Type': mime, 'Content-Length': Math.max(0, fin - debut + 1),
        'Accept-Ranges': 'bytes', 'X-Content-Type-Options': 'nosniff', ...(plage ? { 'Content-Range': `bytes ${debut}-${fin}/${taille}` } : {}) });
    res.end(req.method === 'HEAD' ? undefined : octets.subarray(debut, fin + 1));
}
