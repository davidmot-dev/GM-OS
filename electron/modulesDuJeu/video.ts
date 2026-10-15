import type { IncomingMessage, ServerResponse } from 'node:http';
import { createReadStream, statSync } from 'node:fs';

/** Lecture/seek du média livré avec l'application ; l'appelant a déjà borné le chemin à dist/. */
export function servirVideoDuModule(req: IncomingMessage, res: ServerResponse, fichier: string, type: string) {
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return; }
    const taille = statSync(fichier).size;
    let debut = 0, fin = taille - 1;
    const plage = req.headers.range;
    if (plage) {
        const morceaux = /^bytes=(\d*)-(\d*)$/.exec(plage);
        if (morceaux && (morceaux[1] || morceaux[2])) {
            debut = morceaux[1] ? Number(morceaux[1]) : Math.max(0, taille - Number(morceaux[2]));
            fin = morceaux[1] && morceaux[2] ? Math.min(Number(morceaux[2]), taille - 1) : taille - 1;
        } else debut = -1;
        if (!Number.isSafeInteger(debut) || !Number.isSafeInteger(fin) || debut < 0 || debut > fin || debut >= taille) {
            res.writeHead(416, { 'Content-Range': `bytes */${taille}` }); res.end(); return;
        }
    }
    res.writeHead(plage ? 206 : 200, { 'Content-Type': type, 'Content-Length': fin - debut + 1,
        'Accept-Ranges': 'bytes', 'X-Content-Type-Options': 'nosniff', ...(plage ? { 'Content-Range': `bytes ${debut}-${fin}/${taille}` } : {}) });
    if (req.method === 'HEAD') { res.end(); return; }
    const flux = createReadStream(fichier, { start: debut, end: fin });
    flux.on('error', () => res.destroy());
    res.on('close', () => flux.destroy());
    flux.pipe(res);
}
