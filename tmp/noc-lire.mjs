import fs from 'node:fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import AdmZip from 'adm-zip';
fs.mkdirSync('tmp/noc-fin', {recursive:true});
const source = 'C:/Users/david/OneDrive/Jeux de Rôles/02. Contemporain/3. Steampunk/NOC/3938_noc01_ldb_light-ylomzz.pdf';
const doc = await getDocument({data:new Uint8Array(fs.readFileSync(source))}).promise;
const pages = [];
for (let n=1;n<=doc.numPages;n++) {
 const p = await doc.getPage(n), text = await p.getTextContent();
 pages.push({page:n,text:text.items.map(i=>i.str+(i.hasEOL?'\n':' ')).join('')});
}
fs.writeFileSync('tmp/noc-fin/livre.json',JSON.stringify(pages));
fs.writeFileSync('tmp/noc-fin/livre.txt',pages.map(p=>`\n=== PDF ${p.page} ===\n${p.text}`).join('\n'));
await doc.destroy();
const zip=new AdmZip('Export Dirvers/NOC_driver_gmos_1792659675064.gmos-driver');
fs.writeFileSync('tmp/noc-fin/pilote-initial.json',JSON.stringify(JSON.parse(zip.readAsText('state.json')),null,2));
console.log(`${pages.length} pages extraites ; pilote exporté relu.`);
