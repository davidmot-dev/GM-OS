// Recadrage/compression techniques d'une illustration créée avec image_gen natif.
// --2400 agrandit de 10,5 % : utiliser seulement après l'accord applicable de David.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createCanvas,loadImage} from '@napi-rs/canvas';
const dossier='output/bannieres/degenesis';
const source=path.join(dossier,'source.png'),im=await loadImage(source);
assert.equal(im.width,2172);assert.equal(im.height,724);
const grand=process.argv.includes('--2400'),w=grand?2400:2172,h=w/4;
// Le haut des arches et la charpente traversent le centre de la bande de 54 px.
const crop={x:0,y:0,width:2172,height:543};
const c=createCanvas(w,h),g=c.getContext('2d');g.drawImage(im,crop.x,crop.y,crop.width,crop.height,0,0,w,h);
let jpg,quality;
for(quality=93;quality>=60;quality-=3){jpg=c.toBuffer('image/jpeg',quality);if(jpg.length<=500000)break;}
assert.ok(jpg.length<=500000);
const fichier=grand?'docs/systems/degenesis/Degenesis Band.jpg':path.join(dossier,'banniere-native.jpg');
assert.ok(!fs.existsSync(fichier),'Ne pas remplacer une bannière existante sans demande.');
fs.writeFileSync(fichier,jpg);const finale=await loadImage(jpg);
const apercus=[];
for(const largeur of [1188,700]){
 const a=createCanvas(largeur,94),ag=a.getContext('2d'),hauteur=54;
 ag.fillStyle='#e8e3da';ag.fillRect(0,0,largeur,94);ag.fillStyle='#262725';ag.font='12px Arial';ag.fillText('Simulation d’en-tête — '+largeur+' × 54 px (hors GM-OS)',8,17);
 const e=Math.max(largeur/finale.width,hauteur/finale.height),sw=largeur/e,sh=hauteur/e;
 ag.drawImage(finale,(finale.width-sw)/2,(finale.height-sh)/2,sw,sh,0,26,largeur,hauteur);
 ag.fillStyle='#00000045';ag.fillRect(0,26,largeur,hauteur);
 ag.fillStyle='#f5f0e7';ag.font='bold 19px Arial';ag.fillText('DEGENESIS',16,60);
 ag.font='12px Arial';ag.fillText('Préparer    Jouer    …',largeur-184,58);
 const p=path.join(dossier,`apercu-${largeur}${grand?'-final':'-natif'}.png`);fs.writeFileSync(p,a.toBuffer('image/png'));apercus.push(p);
}
const sha=b=>createHash('sha256').update(b).digest('hex');
const bilan={fichier,width:finale.width,height:finale.height,bytes:jpg.length,format:'JPEG',opaque:true,quality,sha256:sha(jpg),source:{fichier:source,width:im.width,height:im.height,sha256:sha(fs.readFileSync(source)),outil:'image_gen natif',definitionDemandee:'3840 × 1280 ou maximum natif disponible'},crop,agrandissement:grand?w/crop.width:1,conformeDimensionsMinimum:grand,limite:grand?'Agrandissement technique de 10,5 %, sans ajout de détails.':'Définition native inférieure à 2400 × 600 ; agrandissement soumis à accord.',apercus,capturesExaminees:false};
fs.writeFileSync(path.join(dossier,grand?'verification-finale.json':'verification-native.json'),JSON.stringify(bilan,null,2)+'\n');console.log(JSON.stringify(bilan,null,2));
