import fs from 'node:fs';
import path from 'node:path';
import {getDocument} from '../../node_modules/pdfjs-dist/legacy/build/pdf.mjs';
const dir='tmp/pdfs/runequest';fs.mkdirSync(dir,{recursive:true});
for(const [slug,nom]of [['toc','TOC'],['index','Index']]){
 const pdf=await getDocument({data:new Uint8Array(fs.readFileSync('C:/Users/david/Downloads/Runequest Reference/Runequest-Livre de Base_'+nom+'.pdf')),useSystemFonts:true,wasmUrl:path.resolve("node_modules/pdfjs-dist/wasm")+"/",standardFontDataUrl:path.resolve("node_modules/pdfjs-dist/standard_fonts")+"/"}).promise;
 console.log(slug+': '+pdf.numPages+' pages');
 for(let i=1;i<=pdf.numPages;i++){
  const p=await pdf.getPage(i),t=await p.getTextContent();fs.writeFileSync(dir+'/'+slug+'-'+i+'.json',JSON.stringify(t.items.filter(x=>'str'in x)));
  const lines=[];for(const x of t.items){if(!('str'in x))continue;lines.push(x.str+(x.hasEOL?'\n':''));}fs.writeFileSync(dir+'/'+slug+'-'+i+'.txt',lines.join(' '));
  const v=p.getViewport({scale:1.6}),canvas=pdf.canvasFactory.create(v.width,v.height);await p.render({canvasContext:canvas.context,viewport:v}).promise;fs.writeFileSync(dir+'/'+slug+'-'+i+'.png',canvas.canvas.toBuffer('image/png'));pdf.canvasFactory.destroy(canvas);
  console.log(i+' '+v.width+'x'+v.height+' items:'+t.items.length+' '+t.items.slice(0,4).map(x=>x.str).join('|'));
 }await pdf.destroy();
}
