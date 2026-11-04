/** Exporte le tournage Playwright en WebM et, si FFmpeg est présent, en MP4.
 * Le MP4 retire le chargement initial et garde une marge de 0,3 s avant le titre.
 * node outils/clips/exporter_clip.mjs <tournage> <dossier> <nom> <durée depuis le titre>
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const [entree, dossier, nom, duree] = process.argv.slice(2);
if (!entree || !dossier || !nom || !/^[a-z0-9-]+$/.test(nom)) throw new Error('Tournage, dossier et nom de clip requis.');
const source = path.resolve(entree), sortie = path.resolve(dossier), dureeContenu = Number(duree);
if (!fs.existsSync(source) || !Number.isFinite(dureeContenu) || dureeContenu <= 0) throw new Error('Tournage ou durée invalide.');
fs.mkdirSync(sortie, { recursive: true });
const webm = path.join(sortie, `${nom}.webm`), mp4 = path.join(sortie, `${nom}.mp4`);
if (source !== webm) fs.copyFileSync(source, webm);
const resultat = { webm, mp4: null, secondesRetirees: 0, dureeMp4: null, conversion: '' };
try {
    const ffmpeg = process.env.GMOS_FFMPEG ?? 'ffmpeg', ffprobe = process.env.GMOS_FFPROBE ?? 'ffprobe';
    const lireDuree = fichier => Number(JSON.parse(execFileSync(ffprobe,
        ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', fichier], { encoding: 'utf8' })).format.duration);
    const dureeBrute = lireDuree(webm);
    resultat.secondesRetirees = Math.max(0, dureeBrute - dureeContenu - 0.3);
    execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-ss', resultat.secondesRetirees.toFixed(3), '-i', webm,
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4]);
    resultat.mp4 = mp4; resultat.dureeMp4 = lireDuree(mp4); resultat.conversion = 'MP4 H.264, chargement retiré ; WebM de tournage conservé.';
} catch (erreur) {
    resultat.conversion = `WebM disponible, conversion MP4 indisponible : ${erreur.message}`;
}
console.log(JSON.stringify(resultat));
