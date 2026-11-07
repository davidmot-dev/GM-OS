import fs from 'node:fs';
import {createCanvas} from '@napi-rs/canvas';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
const dossier='tmp/cartes-tarot-ombres/preinspection';
fs.mkdirSync(dossier,{recursive:true});
const pdf=await pdfjs.getDocument({data:new Uint8Array(fs.readFileSync(process.argv[2])),useSystemFonts:true}).promise;
const pages=[];
for(let numero=1;numero<=pdf.numPages;numero++){
    const page=await pdf.getPage(numero),vue=page.getViewport({scale:2});
    const canvas=createCanvas(Math.ceil(vue.width),Math.ceil(vue.height));
    await page.render({canvasContext:canvas.getContext('2d'),viewport:vue,canvas}).promise;
    const fichier=`${dossier}/page-${numero}.png`;
    fs.writeFileSync(fichier,canvas.toBuffer('image/png'));pages.push({numero,fichier});
    page.cleanup();
}
await pdf.destroy();
fs.writeFileSync(dossier+'/pages.json',JSON.stringify(pages,null,2));
console.log('Préinspection hors ligne :',pages.length,'pages rendues avec PDF.js déjà installé.');
