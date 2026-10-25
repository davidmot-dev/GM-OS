/** GM-OS Studio, 25/10/2026 : deux modèles fidèles aux deux pages du PDF fourni.
 * Aucun dépôt dans la bibliothèque du meneur, aucune correspondance de pilote écrite.
 */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createCanvas } from '@napi-rs/canvas';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const racine = path.resolve(ici, '../../..');
const source = process.argv[2] || "C:/Users/david/Downloads/Dune_Aventures_dans_l'Imperium_Fiche PJ.pdf";
// Les fiches vont au dépôt des fiches (cahier, § 8) ; la fabrication et les contrôles restent dans la livraison.
const fiches = path.join(racine, 'docs/fiches/Dune'), sortie = path.join(racine, 'output/fiches/dune');
fs.mkdirSync(fiches, { recursive: true }); fs.mkdirSync(sortie, { recursive: true });
const octets = fs.readFileSync(source), document = await getDocument({ data: new Uint8Array(octets) }).promise;
assert.equal(document.numPages, 2, 'Le PDF de référence comprend une page PJ et une page Maison.');

const champ = (key, label, type, x, y, w, h, plus = {}) => ({ key, label, type, x, y, w, h,
    className: `dune-field dune-${type}`, ...plus });
const pj = [];
const textePJ = (k, l, x, y, w, h, plus) => pj.push(champ(k, l, 'text', x, y, w, h, plus));
const longPJ = (k, l, x, y, w, h, plus) => pj.push(champ(k, l, 'textarea', x, y, w, h, plus));
const nombrePJ = (k, l, x, y, w, h, plus) => pj.push(champ(k, l, 'number', x, y, w, h, plus));
for (const [i, k, l] of [[0, 'name', 'Nom'], [1, 'house', 'Maison'], [2, 'role', 'Rôle'], [3, 'faction', 'Faction']]) {
    textePJ(`identity.${k}`, l, 60.5, 160.4 + i * 30.267, 224, 15.3);
}
longPJ('identity.personality', 'Traits de personnalité', 326.8, 178, 228, 71);
textePJ('identity.ambition', 'Ambition', 326.8, 267.2, 228, 15.7);
const principes = [['duty', 'Devoir'], ['power', 'Domination'], ['faith', 'Foi'], ['justice', 'Justice'], ['truth', 'Vérité']];
for (const [i, [k, l]] of principes.entries()) {
    nombrePJ(`drives.${k}.value`, `${l} — valeur`, 150, 342.5 + 36.725 * i, 18.5, 18, { className: 'dune-field dune-number dune-score' });
    longPJ(`drives.${k}.statement`, `${l} — maxime`, 181, 335.5 + 36.725 * i, 160.5, 29.8, { className: 'dune-field dune-textarea dune-statement' });
}
const competences = [['understand', 'Analyse'], ['battle', 'Combat'], ['discipline', 'Discipline'], ['move', 'Mobilité'], ['communicate', 'Rhétorique']];
for (const [i, [k, l]] of competences.entries()) {
    nombrePJ(`skills.${k}.value`, `${l} — valeur`, 150, 582.8 + 36.725 * i, 18.5, 18, { className: 'dune-field dune-number dune-score' });
    longPJ(`skills.${k}.focuses`, `${l} — spécialisations`, 181, 575.8 + 36.725 * i, 160.5, 29.8, { className: 'dune-field dune-textarea dune-statement' });
}
longPJ('traits.talents', 'Talents', 399.5, 337.3, 169, 157);
longPJ('assets.notes', 'Atouts', 416.4, 540, 141.5, 127.5);
nombrePJ('resources.advancement', 'Points de progression', 429.8, 720, 25, 21, { className: 'dune-field dune-number dune-resource' });
nombrePJ('resources.determination', 'Détermination', 513.8, 720, 25, 21, { className: 'dune-field dune-number dune-resource' });

const maison = [];
const texteM = (k, l, x, y, w, h, plus) => maison.push(champ(k, l, 'text', x, y, w, h, plus));
const longM = (k, l, x, y, w, h, plus) => maison.push(champ(k, l, 'textarea', x, y, w, h, plus));
texteM('house.name', 'Nom de la Maison', 60.5, 160.4, 285, 15.3);
texteM('house.homeworld', 'Monde d’origine', 60.5, 190.667, 285, 15.3);
maison.push(champ('house.type', 'Type de Maison', 'select', 60.5, 220.934, 285, 15.3,
    { options: ['', 'Naissante', 'Mineure', 'Majeure', 'Grande Maison'] }));
texteM('house.traits', 'Traits de la Maison', 60.5, 251.201, 285, 15.3);
maison.push(champ('house.coat_of_arms', 'Armoiries de la Maison', 'portrait', 410.5, 130.5, 148, 128, { fit: 'contain' }));
texteM('house.motto', 'Devise de la Maison', 420, 275.8, 128, 8.9, { className: 'dune-field dune-text dune-motto' });
longM('house.domains', 'Domaines de la Maison', 47, 328.4, 522, 64.3);
const gauche = [['lord', 'Seigneur'], ['consort', 'Consort'], ['heir', 'Héritier'], ['treasurer', 'Argentier'], ['chamberlain', 'Chambellan'], ['constable', 'Connétable'], ['advisor', 'Conseiller']];
const droite = [['envoy', 'Émissaire'], ['scholar', 'Érudit'], ['spymaster', 'Maître-espion'], ['swordmaster', 'Maître d’armes'], ['warmaster', 'Maître de guerre'], ['chief_physician', 'Premier médecin']];
for (const [i, [k, l]] of gauche.entries()) texteM(`house.roles.${k}`, l, 110, 444.9 + i * 17.01, 181.8, 13.5);
for (const [i, [k, l]] of droite.entries()) texteM(`house.roles.${k}`, l, 386, 454.08 + i * 17.01, 171.7, 13.5);
for (let i = 0; i < 4; i++) {
    const dx = (i % 2) * 273.54, dy = Math.floor(i / 2) * 83.94;
    const racineCle = `house.enemies.${i}`, nom = `Ennemi ${i + 1}`;
    texteM(`${racineCle}.name`, `${nom} — nom`, 80 + dx, 603 + dy, 84.5, 13.2);
    texteM(`${racineCle}.type`, `${nom} — type`, 204 + dx, 603 + dy, 78, 13.2);
    maison.push(champ(`${racineCle}.hatred`, `${nom} — haine`, 'number', 85 + dx, 620.1 + dy, 79.5, 13.2));
    texteM(`${racineCle}.reason`, `${nom} — raison`, 207 + dx, 620.1 + dy, 75, 13.2);
    longM(`${racineCle}.notes`, `${nom} — notes`, 57 + dx, 646.5 + dy, 225, 23.4);
}

const jeux = [
    { id: 'dune-pj-fr', nom: 'Dune — fiche de personnage', titre: 'Dune · Personnage', fichier: 'Dune_Fiche_PJ_interactive.html', page: 1, champs: pj },
    { id: 'dune-maison-fr', nom: 'Dune — fiche de Maison', titre: 'Dune · Maison', fichier: 'Dune_Fiche_Maison_interactive.html', page: 2, champs: maison },
];
const runtime = fs.readFileSync(path.join(ici, 'runtime.js'), 'utf8');
const interfaceCss = fs.readFileSync(path.join(ici, 'interface.css'), 'utf8');
const commun = fs.readFileSync(path.join(ici, 'champs.css'), 'utf8');
const rapports = [];
for (const jeu of jeux) {
    const p = await document.getPage(jeu.page), viewport = p.getViewport({ scale: 2 });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    await p.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    const backgroundData = 'data:image/webp;base64,' + canvas.toBuffer('image/webp', 97).toString('base64');
    const customCss = commun.replaceAll('__TEMPLATE__', jeu.id);
    const page = { id: 'page-1', label: jeu.nom, width: 612, height: 792, orientation: 'portrait', backgroundData, fields: jeu.champs };
    const template = { id: jeu.id, name: jeu.nom, system: 'Dune : Aventures dans l’Imperium', accent: '#94684b', schemaVersion: 2, customCss, pages: [page] };
    const cles = new Set();
    for (const f of page.fields) {
        assert.ok(f.x >= 0 && f.y >= 0 && f.x + f.w <= page.width && f.y + f.h <= page.height, f.key);
        assert.ok(!cles.has(f.key), `Clé dupliquée : ${f.key}`); cles.add(f.key);
    }
    const manifeste = { format: 'character-sheet-studio-html', formatVersion: 1, template };
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${jeu.nom} interactive</title><style>${interfaceCss}\n${customCss}</style></head><body>
<header class="toolbar"><strong>${jeu.titre}</strong><nav aria-label="Pages"><button id="prev" aria-label="Page précédente">←</button><select id="page" aria-label="Page"></select><button id="next" aria-label="Page suivante">→</button></nav><div class="zoom-controls"><button id="minus" aria-label="Réduire le zoom">−</button><input id="zoom" type="number" min="20" max="400" value="100" aria-label="Zoom en pourcentage"><span>%</span><button id="plus" aria-label="Augmenter le zoom">+</button><button id="fit">Ajuster</button></div><button id="zones" aria-pressed="false">Zones</button><button id="export">Exporter JSON</button><button id="import">Importer JSON</button><button id="reset">Réinitialiser</button><button id="print">Imprimer</button></header>
<main id="viewport"><div id="pages"></div></main><footer><span id="status" role="status" aria-live="polite">Chargement…</span><button id="help">Aide</button></footer>
<input id="file" type="file" accept="application/json,.json" hidden><input id="portrait-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden>
<dialog id="help-dialog"><h2>${jeu.nom}</h2><p>La page originale du PDF est conservée. Saisissez dans les espaces imprimés ; « Zones » affiche leurs contours. Aucun calcul automatique n’est ajouté. Les deux emblèmes de progression et de Détermination sont des emplacements numériques libres : ils ne sont pas des pistes de cases.</p><p>Maison : cliquez dans les armoiries pour choisir une image locale. Maj+clic ou un clic droit permet de la retirer, après confirmation. Le JSON contient aussi l’image.</p><p>Zoom : 20 à 400 %, Ctrl+molette, Ctrl++, Ctrl+− ; Ctrl+0 ou « Ajuster » ajuste la page à l’écran. Sur un petit écran, augmentez le zoom pour écrire, puis déplacez la page.</p><p>La sauvegarde locale appartient à ce navigateur. Exportez régulièrement un JSON pour conserver une copie ou passer sur un autre appareil. L’import remplace la fiche après confirmation et vérifie son modèle.</p><p>L’impression restitue la page entière sans les commandes. La fiche est utilisable hors ligne ; son manifeste permet d’importer le modèle dans le moteur GM-OS. La liaison aux champs du pilote se prépare séparément.</p><button id="close-help">Fermer</button></dialog>
<script id="character-sheet-template" type="application/json">${JSON.stringify(manifeste).replaceAll('<', '\\u003c')}</script><script>${runtime}</script></body></html>`;
    fs.writeFileSync(path.join(fiches, jeu.fichier), html);
    rapports.push({ fichier: jeu.fichier, templateId: jeu.id, pageSource: jeu.page, pages: 1, zones: page.fields.length, cles: [...cles], octets: Buffer.byteLength(html) });
}
await document.destroy();
fs.writeFileSync(path.join(sortie, 'fabrication.json'), JSON.stringify({ source: path.basename(source), sha256: createHash('sha256').update(octets).digest('hex'), fiches: rapports }, null, 2));
console.log(JSON.stringify(rapports.map(({ cles, ...r }) => ({ ...r, cles: cles.length })), null, 2));
