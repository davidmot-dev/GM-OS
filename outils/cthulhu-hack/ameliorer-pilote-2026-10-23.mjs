import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';

// L'archive source reste intacte. Aucun accès aux campagnes ni au profil Electron.
const source=process.argv[2]??'Export Dirvers/CH_driver_gmos_1792659649981.gmos-driver';
const sortie=process.argv[3]??'Export Dirvers/corriges/CH_driver_gmos_2026-10-23.gmos-driver';
const zip=new AdmZip(source),entree=zip.getEntry('state.json');
if(!entree)throw new Error('Archive sans pilote JSON.');
const exporte=JSON.parse(entree.getData().toString('utf8')),d=exporte.gameDriver,t=exporte.sheetTemplate;
if(!d||!t||d.id!=='custom-1774643419710'||t.id!=='tpl-1774643419711')throw new Error('Le pilote source ne correspond pas à Cthulhu Hack.');
d.version='1.1.0';
d.jet.cthulhuHack={pv:'hp',fortune:'fortune',physique:['force','dexterite','constitution'],personnalite:['sagesse','intelligence','charisme'],
    armures:[1,2,3,4].map(n=>({de:`materiel_${n}`,nom:`materiel_${n}_nom`,protection:`materiel_${n}_pa`}))};
for(const a of d.jet.cthulhuHack.armures){
    const section=t.sections.find(s=>s.fields.some(f=>f.id===a.de));
    if(!section)throw new Error(`Matériel absent : ${a.de}`);
    if(!section.fields.some(f=>f.id===a.protection))section.fields.push({id:a.protection,label:`PA — Matériel ${a.de.slice(-1)}`,type:'number',defaultValue:0,min:0});
}
const resultat=new AdmZip();for(const e of zip.getEntries())resultat.addFile(e.entryName,e===entree?Buffer.from(JSON.stringify(exporte,null,2)+'\n'):e.getData());
fs.mkdirSync(path.dirname(sortie),{recursive:true});resultat.writeZip(sortie);
console.log(JSON.stringify({sortie,pilote:d.id,fiche:t.id,version:d.version,champsAjoutes:d.jet.cthulhuHack.armures.map(a=>a.protection)}));
