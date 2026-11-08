// Range un paquet « une carte par dossier » pour Deck-OS — 2026-11-08, Claude Code, à la demande de
// David : « des paquets de cartes où le verso ET le recto sont à chaque fois différents » (Menaces
// de Torg, `public/assets/decks/torg/menaces-*`). L'extraction livre `NN-nom/0.jpg` (recto, pour les
// joueurs) et `NN-nom/back.jpg` (verso, les statistiques du meneur). Deck-OS lit des noms numérotés :
// ce script COPIE vers `recto/NN.jpg` et `verso/NN.jpg`, dans l'ordre des préfixes, et pose un dos
// commun `back.jpg` (la carte d'instructions) s'il n'y en a pas. Les originaux ne bougent pas.
// Usage : node outils/torg/ranger-recto-verso.mjs public/assets/decks/torg/menaces-cyberpapaute
import fs from 'node:fs';
import path from 'node:path';

const dossier = process.argv[2];
if (!dossier || !fs.existsSync(dossier)) {
    console.error('Usage : node outils/torg/ranger-recto-verso.mjs <dossier du paquet>');
    process.exit(1);
}

const cartes = fs.readdirSync(dossier, { withFileTypes: true })
    .filter(e => e.isDirectory() && /^\d+-/.test(e.name))
    .map(e => e.name)
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
if (!cartes.length) { console.error(`Aucun dossier « NN-nom » dans ${dossier}.`); process.exit(1); }

const manquants = cartes.flatMap(c => ['0.jpg', 'back.jpg'].filter(f => !fs.existsSync(path.join(dossier, c, f))).map(f => `${c}/${f}`));
if (manquants.length) { console.error(`Faces manquantes : ${manquants.join(', ')}`); process.exit(1); }

// Les numéros suivent les préfixes : un trou dans la numérotation serait une carte cassée à l'écran.
const numeros = cartes.map(c => parseInt(c, 10));
const trous = numeros.filter((n, i) => n !== i + 1);
if (trous.length) { console.error(`Numérotation à trous (attendu 1 à ${cartes.length}) : ${trous.join(', ')}`); process.exit(1); }

const largeur = Math.max(2, String(cartes.length).length);
for (const face of ['recto', 'verso']) fs.mkdirSync(path.join(dossier, face), { recursive: true });
cartes.forEach((c, i) => {
    const n = String(i + 1).padStart(largeur, '0');
    fs.copyFileSync(path.join(dossier, c, '0.jpg'), path.join(dossier, 'recto', `${n}.jpg`));
    fs.copyFileSync(path.join(dossier, c, 'back.jpg'), path.join(dossier, 'verso', `${n}.jpg`));
});

const dos = path.join(dossier, 'back.jpg');
const instructions = path.join(dossier, 'instructions', 'recto.jpg');
let dosCommun = fs.existsSync(dos) ? 'déjà présent' : 'absent';
if (!fs.existsSync(dos) && fs.existsSync(instructions)) { fs.copyFileSync(instructions, dos); dosCommun = 'instructions/recto.jpg'; }

const relatif = path.relative('public', dossier).split(path.sep).join('/');
console.log(JSON.stringify({
    cartes: cartes.length,
    dosCommun,
    reglagesDeckOS: {
        chemin: relatif,
        nombreDeCartes: cartes.length,
        extension: '.jpg',
        motif: 'recto/{n}',
        versoPropreAChaqueCarte: 'verso/{n}',
        remplissage: largeur,
        commencerAZero: false,
    },
}, null, 2));
