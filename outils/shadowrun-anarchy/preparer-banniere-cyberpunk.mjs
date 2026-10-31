// Recadrage et compression techniques d'une illustration produite par image_gen natif.
// --2400 exige l'accord de David pour CETTE bannière : agrandissement de 10,5 %, sans détails ajoutés.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createCanvas,loadImage} from '@napi-rs/canvas';
const dir='output/bannieres/shadowrun-anarchy/cyberpunk-action',source=path.join(dir,'source.png'),im=await loadImage(source);
assert.equal(im.width,2172);assert.equal(im.height,724);
const grand=process.argv.includes('--2400');
if(grand)assert.ok(process.argv.includes('--accord-cyberpunk-action'),'Accord applicable à cette bannière requis pour agrandir.');
const w=grand?2400:2172,h=w/4,crop={x:0,y:90,width:2172,height:543};
const canvas=createCanvas(w,h),g=canvas.getContext('2d');g.drawImage(im,crop.x,crop.y,crop.width,crop.height,0,0,w,h);
let jpg,quality;for(quality=93;quality>=60;quality-=3){jpg=canvas.toBuffer('image/jpeg',quality);if(jpg.length<=500000)break;}assert.ok(jpg.length<=500000);
const fichier=grand?'docs/systems/shadowrun-anarchy/Shadowrun Anarchy Band-v2.jpg':path.join(dir,'banniere-native-nettoyee.jpg');assert.ok(!fs.existsSync(fichier),'Ne pas remplacer une bannière existante sans demande.');fs.writeFileSync(fichier,jpg);
const finale=await loadImage(jpg),apercus=[];
for(const largeur of[1188,700]){
 const a=createCanvas(largeur,94),ag=a.getContext('2d');ag.fillStyle='#eeeae1';ag.fillRect(0,0,largeur,94);ag.fillStyle='#35243f';ag.font='12px Arial';ag.fillText('Simulation d’en-tête — '+largeur+' × 54 px (hors GM-OS)',8,17);
 const e=Math.max(largeur/finale.width,54/finale.height),sw=largeur/e,sh=54/e;ag.drawImage(finale,(finale.width-sw)/2,(finale.height-sh)/2,sw,sh,0,26,largeur,54);ag.fillStyle='#00000045';ag.fillRect(0,26,largeur,54);
 ag.fillStyle='#fff8ee';ag.font='bold 19px Arial';ag.fillText('ANARCHY',16,60);ag.font='12px Arial';ag.fillText('Préparer    Jouer    …',largeur-184,58);
 const p=path.join(dir,`apercu-${largeur}-${grand?'final':'natif'}.png`);fs.writeFileSync(p,a.toBuffer('image/png'));apercus.push(p);
}
const hash=b=>createHash('sha256').update(b).digest('hex');const bilan={fichier,width:finale.width,height:finale.height,bytes:jpg.length,format:'JPEG',opaque:true,quality,sha256:hash(jpg),source:{fichier:source,width:im.width,height:im.height,sha256:hash(fs.readFileSync(source)),outil:'image_gen natif',definitionDemandee:'3840 × 960 ou minimum 2400 × 600 demandé ; marge verticale permise'},crop,agrandissement:grand?w/crop.width:1,conformeDimensionsMinimum:grand,limite:grand?'Agrandissement technique de 10,5 %, sans ajout de détails.':'Définition native inférieure à 2400 × 600 ; agrandissement soumis à accord.',apercus,capturesExaminees:false};
fs.writeFileSync(path.join(dir,grand?'verification-finale.json':'verification-native.json'),JSON.stringify(bilan,null,2)+'\n');console.log(JSON.stringify(bilan,null,2));
