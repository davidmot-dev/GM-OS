/**
 * **Extrait le binaire RNNoise du paquet npm vers `public/audio/rnnoise.wasm`.**
 *
 * *Chantier du débruitage, 2026-09-03.*
 *
 * Pourquoi ce script existe au lieu d'un simple `import` :
 *
 * - `@shiguredo/rnnoise-wasm` livre le wasm **inliné en base64 dans 4,8 Mo de
 *   JavaScript**. L'importer depuis le rendu ajouterait ces 4,8 Mo au paquet de
 *   l'application, pour un binaire de 3,6 Mo qu'un fichier sert très bien.
 * - Sa glu d'Emscripten a besoin de `TextDecoder` et de `window` : **elle ne
 *   peut pas tourner dans un AudioWorklet.** Or c'est là que le débruitage doit
 *   vivre — sur le fil audio, à l'abri des saccades de React.
 * - Le wasm, lui, ne réclame que **trois imports** (`__assert_fail`,
 *   `emscripten_resize_heap`, `fd_write`) : on le pilote donc directement, et le
 *   même code marche dans le worklet **et** sous Node, ce qui le rend
 *   mesurable — voir `electron/debruitage.test.ts`.
 *
 * La dépendance npm reste déclarée : c'est elle qui porte la provenance, la
 * licence (Apache-2.0) et la mise à jour du modèle. *Un binaire commité sans son
 * origine est un binaire que personne n'osera régénérer.*
 *
 * Usage : `node scripts/extraire-rnnoise.mjs`
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(racine, 'node_modules', '@shiguredo', 'rnnoise-wasm', 'dist', 'rnnoise.js');
const cible = path.join(racine, 'public', 'audio', 'rnnoise.wasm');

if (!fs.existsSync(source)) {
    console.error(`[rnnoise] introuvable : ${source}\nInstalle d'abord @shiguredo/rnnoise-wasm.`);
    process.exit(1);
}

const glu = fs.readFileSync(source, 'utf8');
const blob = glu.match(/[A-Za-z0-9+/=]{100000,}/);
if (!blob) {
    console.error('[rnnoise] aucun blob base64 dans la glu — le paquet a changé de forme.');
    process.exit(1);
}

const octets = Buffer.from(blob[0], 'base64');
if (octets.subarray(0, 4).toString('hex') !== '0061736d') {
    console.error('[rnnoise] le blob décodé n’est pas un module WebAssembly.');
    process.exit(1);
}

/* Contrôle de fond : le module doit exposer ce que le worklet appellera. */
const attendus = ['rnnoise_create', 'rnnoise_process_frame', 'rnnoise_destroy', 'malloc', 'free', 'memory'];
const exports = WebAssembly.Module.exports(new WebAssembly.Module(octets)).map(e => e.name);
const manquants = attendus.filter(n => !exports.includes(n));
if (manquants.length) {
    console.error(`[rnnoise] exports manquants : ${manquants.join(', ')}`);
    process.exit(1);
}

fs.mkdirSync(path.dirname(cible), { recursive: true });
fs.writeFileSync(cible, octets);
console.log(`[rnnoise] ${(octets.length / 1024 / 1024).toFixed(2)} Mo écrits dans public/audio/rnnoise.wasm`);
