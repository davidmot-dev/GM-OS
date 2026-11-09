import fs from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {loadImage} from '@napi-rs/canvas';
import AdmZip from 'adm-zip';

const dossier='public/assets/decks/torg/destin';
const noms=fs.readdirSync(dossier).filter(n=>/^card_\d{2}\.jpg$/.test(n)).sort();
assert.deepEqual(noms,Array.from({length:10},(_,i)=>`card_${String(i+1).padStart(2,'0')}.jpg`));
const faces=[];
for(const fichier of noms){
    const chemin=dossier+'/'+fichier,b=fs.readFileSync(chemin),img=await loadImage(b);
    faces.push({fichier:chemin,sha256:createHash('sha256').update(b).digest('hex'),largeur:img.width,hauteur:img.height});
}
const paquets=JSON.parse(new AdmZip('Export Dirvers/corriges/Torg-Eternity-2.0.0.gmos-driver').readAsText('state.json')).paquets;
const lectureConfirmee=process.argv.includes('--lecture-confirmee');
const rapport={date:'2026-11-08',reussi:true,facesDecodees:faces.length,
    facesAjouteesExaminees:lectureConfirmee?noms.slice(5):[],
    relationDisponible:lectureConfirmee?false:null,nombreDeclareParPilote:paquets.find(p=>p.role==='destin').cardCount,
    nombreAReglerDansDeckOS:10,manquantesTroisHeros:2,manquantesNeufPJ:26,
    portee:'Décodage hors ligne des dix JPEG. --lecture-confirmee atteste une lecture explicite des cinq nouvelles faces ; ce paramètre ne doit être employé qu’après examen. Aucune distribution en application ni validation humaine de recette revendiquée.',faces};
fs.writeFileSync('output/campagnes-tests/torg/verification-cartes.json',JSON.stringify(rapport,null,2)+'\n');
console.log(JSON.stringify({facesDecodees:faces.length,lectureConfirmee,nombreDeclareParPilote:rapport.nombreDeclareParPilote}));
