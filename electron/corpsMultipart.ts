import { randomBytes } from 'node:crypto';

/**
 * **Un corps « multipart/form-data » pour le relais réseau** — 2026-10-17.
 *
 * Les générateurs FLUX.2 de Cloudflare Workers AI (`flux-2-dev`,
 * `flux-2-klein-4b`, `flux-2-klein-9b`) n'acceptent **que** ce format, même pour
 * une invite seule, et c'est par lui que passent les images de référence
 * (`input_image_0` à `input_image_3`). Le relais `ai:proxy-request` n'envoyait
 * que du JSON : l'écran déclare donc un corps `{ multipart: … }`, et le
 * processus principal l'assemble ici, après avoir posé la clé comme pour tout
 * autre appel.
 */
export interface FichierDuFormulaire {
    /** Le nom du champ : `input_image_0`. */
    nom: string;
    /** Le contenu, en base64 (sans le préfixe `data:`). */
    base64: string;
    /** `image/jpeg`, `image/png`. */
    type: string;
}

export interface CorpsMultipart {
    multipart: {
        champs: Record<string, string>;
        fichiers?: FichierDuFormulaire[];
    };
}

export function estUnCorpsMultipart(corps: unknown): corps is CorpsMultipart {
    const m = (corps as { multipart?: unknown } | null)?.multipart as { champs?: unknown; fichiers?: unknown } | undefined;
    return !!m && typeof m === 'object' && !!m.champs && typeof m.champs === 'object'
        && (m.fichiers === undefined || Array.isArray(m.fichiers));
}

/** Le corps et son en-tête `Content-Type`, la frontière comprise. */
export function assemblerLeMultipart(corps: CorpsMultipart, frontiere = `----gmos${randomBytes(12).toString('hex')}`): { corps: Buffer; typeDeContenu: string } {
    const morceaux: Buffer[] = [];
    const ligne = (texte: string) => morceaux.push(Buffer.from(`${texte}\r\n`, 'utf8'));
    for (const [nom, valeur] of Object.entries(corps.multipart.champs)) {
        ligne(`--${frontiere}`);
        ligne(`Content-Disposition: form-data; name="${nom}"`);
        ligne('');
        ligne(String(valeur));
    }
    for (const fichier of corps.multipart.fichiers ?? []) {
        const extension = fichier.type.split('/')[1] || 'bin';
        ligne(`--${frontiere}`);
        ligne(`Content-Disposition: form-data; name="${fichier.nom}"; filename="${fichier.nom}.${extension}"`);
        ligne(`Content-Type: ${fichier.type}`);
        ligne('');
        morceaux.push(Buffer.from(fichier.base64, 'base64'));
        morceaux.push(Buffer.from('\r\n', 'utf8'));
    }
    morceaux.push(Buffer.from(`--${frontiere}--\r\n`, 'utf8'));
    return { corps: Buffer.concat(morceaux), typeDeContenu: `multipart/form-data; boundary=${frontiere}` };
}
