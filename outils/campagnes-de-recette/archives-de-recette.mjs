import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import AdmZip from 'adm-zip';

export const DATE_RECETTE = '2026-10-25T12:00:00.000Z';
export const empreinte = b => createHash('sha256').update(b).digest('hex');
const xml = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
export function lignesSVG(texte, x = 55, y = 150, longueur = 85) {
    const lignes = [''];
    for (const mot of texte.split(/\s+/)) {
        if ((lignes.at(-1) + ' ' + mot).length > longueur) lignes.push('');
        lignes[lignes.length - 1] += (lignes.at(-1) ? ' ' : '') + mot;
    }
    return lignes.map((l, i) => `<text x="${x}" y="${y + i * 32}" font-size="22">${xml(l)}</text>`).join('');
}
export function svgNoc(nom, dessin, largeur = 1200, hauteur = 800) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${largeur}" height="${hauteur}" viewBox="0 0 ${largeur} ${hauteur}"><rect width="100%" height="100%" fill="#20262b"/><style>text{font-family:Segoe UI,Arial,sans-serif;fill:#ece7d7}</style><path d="M22 100H${largeur - 22}M22 ${hauteur - 65}H${largeur - 22}" stroke="#bf8d4e" stroke-width="3"/><text x="50" y="66" font-size="35" font-weight="700">${xml(nom)}</text>${dessin}<text x="50" y="${hauteur - 30}" font-size="15">NOC · BLOC VESPER · FICTION ORIGINALE DE RECETTE GM-OS</text></svg>`;
}
export function carteNoc(lieu) {
    const [, nom, type, description] = lieu;
    const pieces = type === 'city' ? ['Escalier', 'Coursive', 'Refuge', 'Joint', 'Ascenseur', 'Passage'] : ['Accès', 'Guichet / sas', 'Salle centrale', 'Réserve', 'Maintenance', 'Issue'];
    const dessin = pieces.map((piece, i) => {
        const x = 60 + i % 3 * 380, y = 250 + Math.floor(i / 3) * 190;
        return `<rect x="${x}" y="${y}" width="325" height="135" fill="#303d45" stroke="#bf8d4e" stroke-width="3"/><text x="${x + 18}" y="${y + 52}" font-size="25">${i + 1}. ${xml(piece)}</text>${i % 3 < 2 ? `<path d="M${x + 325} ${y + 66}h55" stroke="#d6c79e" stroke-width="5"/>` : ''}`;
    }).join('');
    return svgNoc(nom, lignesSVG(description) + dessin + lignesSVG('Plan de recette sans échelle. La Loi décide des distances et de la portée effective des Auras.', 55, 670));
}
export function signalWav(mode) {
    const taux = 22050, n = taux * 4, b = Buffer.alloc(44 + n * 2);
    b.write('RIFF'); b.writeUInt32LE(b.length - 8, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(taux, 24); b.writeUInt32LE(taux * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40);
    for (let i = 0; i < n; i++) {
        const t = i / taux, bord = Math.min(1, t * 10, (4 - t) * 10);
        const v = mode === 'timbreuse' ? Math.sin(2 * Math.PI * 240 * t) * Math.exp(-35 * (t % 0.6))
            : mode === 'annonce' ? Math.sin(2 * Math.PI * 330 * t) * (Math.sin(2 * Math.PI * 2 * t) > 0 ? 0.3 : 0)
                : (Math.sin(2 * Math.PI * 90 * t) + Math.sin(2 * Math.PI * 135 * t)) * 0.12;
        b.writeInt16LE(Math.round(v * bord * 4500), 44 + i * 2);
    }
    return b;
}
export function atelierArchives(sortie, prefixe, pilote, fiche) {
    const medias = new Map();
    fs.mkdirSync(sortie, { recursive: true });
    const ajouter = (slug, contenu, extension = 'svg') => {
        const ref = `${prefixe}-media-${slug}.${extension}`;
        medias.set(ref, { chemin: `assets/${extension === 'wav' ? 'audio' : 'images'}/${slug}.${extension}`, contenu: Buffer.from(contenu), mime: extension === 'wav' ? 'audio/wav' : 'image/svg+xml' });
        return ref;
    };
    const ecrire = (nom, etat) => {
        const zip = new AdmZip();
        const assetMap = [...medias.entries()].map(([originalRef, f]) => ({ originalRef, relativePath: f.chemin, checksum: empreinte(f.contenu), sizeBytes: f.contenu.length, mimeType: f.mime }));
        const manifeste = { schemaVersion: 1, bundleType: 'campaign', bundleId: `${etat.campaign.id}-v1`, campaignId: etat.campaign.id, campaignName: etat.campaign.name,
            exportedAt: DATE_RECETTE, gmosVersion: '6.5.0', requiredDriverIds: [pilote.id], requiredTemplateIds: [fiche.id], assetMap,
            stats: { entityCount: etat.entities.length, sessionCount: etat.sessions.length, atlasMapCount: etat.atlasMaps.length, wikiEntryCount: etat.wikiEntries.length, clueCount: etat.clues.length,
                assetCount: assetMap.length, totalSizeBytes: assetMap.reduce((s, a) => s + a.sizeBytes, 0) } };
        zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifeste, null, 2)));
        zip.addFile('state.json', Buffer.from(JSON.stringify(etat, null, 2)));
        for (const f of medias.values()) {
            zip.addFile(f.chemin, f.contenu);
            fs.mkdirSync(path.dirname(path.join(sortie, f.chemin)), { recursive: true });
            fs.writeFileSync(path.join(sortie, f.chemin), f.contenu);
        }
        for (const e of zip.getEntries()) e.header.time = new Date(DATE_RECETTE);
        zip.writeZip(path.join(sortie, nom));
        fs.writeFileSync(path.join(sortie, nom.replace('.gmos', '.json')), JSON.stringify(etat, null, 2) + '\n');
        return { fichier: nom, campagne: etat.campaign.id, personnages: etat.players.flatMap(p => p.characters).length, medias: medias.size, sha256: empreinte(fs.readFileSync(path.join(sortie, nom))) };
    };
    return { ajouter, ecrire, medias };
}
