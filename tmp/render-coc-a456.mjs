import fs from 'node:fs';
import * as canvas from '@napi-rs/canvas';
Object.assign(globalThis, { DOMMatrix: canvas.DOMMatrix, Path2D: canvas.Path2D, ImageData: canvas.ImageData });
const pdf = await import('pdfjs-dist/legacy/build/pdf.mjs');
const livre = await pdf.getDocument({ data: new Uint8Array(fs.readFileSync('\\\\CLOUDDAVID\\Media\\Jeux de Rôle\\06. Chroniques Oubliées\\Chroniques Oubliées Contemporain\\COC2\\COC2_01_Livre_de_Regles_web_v0.pdf')), useSystemFonts: true }).promise;
for (const n of [77, 78, 79, 82, 36, 37, 60]) {
    const p = await livre.getPage(n + 3), viewport = p.getViewport({ scale: 1.25 });
    const c = canvas.createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    await p.render({ canvasContext: c.getContext('2d'), viewport }).promise;
    fs.writeFileSync(`tmp/coc-a456-p${n}.png`, c.toBuffer('image/png'));
}
console.log('Sept pages rendues.');
