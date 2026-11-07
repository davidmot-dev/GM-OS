import fs from 'node:fs';
import path from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
const dossier='C:/Users/david/OneDrive/Jeux de Rôles/02. Contemporain/3. Steampunk/NOC';
for (const [fichier, nom] of [['00__noc__diffractions__innerpageweb.pdf','diffractions'],['NOC - Livre du Joueur.pdf','joueur']]) {
 const doc=await getDocument({data:new Uint8Array(fs.readFileSync(path.join(dossier,fichier)))}).promise;
 const pages=[];
 for(let n=1;n<=doc.numPages;n++) {const p=await doc.getPage(n),t=await p.getTextContent();pages.push({page:n,text:t.items.map(i=>i.str+(i.hasEOL?'\n':' ')).join('')});}
 fs.writeFileSync(`tmp/noc-fin/${nom}.json`,JSON.stringify(pages));
 console.log(nom, pages.length, 'pages');
 for(const p of pages){const t=p.text.replace(/\s+/g,' ');for(const terme of [/Faveur/gi,/alliés.{0,45}Loi/gi,/Réseau/gi]){const m=terme.exec(t);if(m)console.log(`PDF ${p.page} : ${t.slice(Math.max(0,m.index-80),m.index+450)}`);}}
 await doc.destroy();
}
