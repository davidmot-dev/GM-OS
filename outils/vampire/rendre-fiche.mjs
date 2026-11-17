// Référence graphique : les deux pages complètes du PDF fourni par David.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDocument } from '../../node_modules/pdfjs-dist/legacy/build/pdf.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const out=path.join(root,'tmp/vampire-studio-20261117');fs.mkdirSync(out,{recursive:true});
const pdf=await getDocument({data:new Uint8Array(fs.readFileSync(path.join(root,'docs/Reference/Vampire/V5_Feuille-de-perso.pdf'))),useSystemFonts:true,wasmUrl:path.join(root,'node_modules/pdfjs-dist/wasm')+'/' ,standardFontDataUrl:path.join(root,'node_modules/pdfjs-dist/standard_fonts')+'/'}).promise;
for(let n=1;n<=pdf.numPages;n++){
 const p=await pdf.getPage(n),viewport=p.getViewport({scale:2});
 const c=pdf.canvasFactory.create(viewport.width,viewport.height);
 await p.render({canvasContext:c.context,viewport}).promise;
 fs.writeFileSync(path.join(out,`fiche-${n}.png`),c.canvas.toBuffer('image/png'));
 pdf.canvasFactory.destroy(c);
 const tc=await p.getTextContent();
 fs.writeFileSync(path.join(out,`fiche-${n}.json`),JSON.stringify({width:p.view[2]-p.view[0],height:p.view[3]-p.view[1],items:tc.items.filter(i=>i.str?.trim()).map(i=>({text:i.str,x:i.transform[4]-p.view[0],y:p.view[3]-i.transform[5],w:i.width,h:i.height}))},null,2));
}
await pdf.destroy();
console.log('Deux pages rendues à 2× ; coordonnées relatives à la CropBox du PDF.');
