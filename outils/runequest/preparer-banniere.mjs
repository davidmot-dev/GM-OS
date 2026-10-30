// Recadrage et compression techniques ; l'illustration vient de l'outil image_gen natif.
// Sans --2400, conserve les pixels natifs. L'option exige l'accord de David pour agrandir.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createCanvas,loadImage} from '@napi-rs/canvas';
const dossier='output/bannieres/runequest',im=await loadImage(path.join(dossier,'source.png'));
assert.equal(im.width,2172);assert.equal(im.height,724);
const grand=process.argv.includes('--2400'),w=grand?2400:2172,h=w/4;
const c=createCanvas(w,h),g=c.getContext('2d');
// La silhouette du sanctuaire reste au centre du ruban très bas de GM-OS.
const crop={x:0,y:24,width:2172,height:543};
g.drawImage(im,crop.x,crop.y,crop.width,crop.height,0,0,w,h);
let jpg,quality;
for(quality=93;quality>=60;quality-=3){jpg=c.toBuffer('image/jpeg',quality);if(jpg.length<=500000)break;}
assert.ok(jpg.length<=500000);
const nom=grand?'RuneQuest Band.jpg':'RuneQuest Band-native.jpg';
const fichier=grand?path.join('docs/systems/runequest',nom):path.join(dossier,nom);
assert.ok(!fs.existsSync(fichier),'Ne pas remplacer une bannière sans demande.');
fs.writeFileSync(fichier,jpg);
const finale=await loadImage(jpg),verifications=[];
for(const largeur of [1188,700]){
 const p=createCanvas(largeur,94),pg=p.getContext('2d'),hauteur=54;
 pg.fillStyle='#f3eee3';pg.fillRect(0,0,largeur,94);pg.fillStyle='#263f37';pg.font='12px Arial';pg.fillText('Simulation d’en-tête — '+largeur+' × 54 px (hors GM-OS)',8,17);
 const e=Math.max(largeur/finale.width,hauteur/finale.height),sw=largeur/e,sh=hauteur/e;
 pg.drawImage(finale,(finale.width-sw)/2,(finale.height-sh)/2,sw,sh,0,26,largeur,hauteur);
 pg.fillStyle='#00000045';pg.fillRect(0,26,largeur,hauteur);
 pg.fillStyle='#f5f0e7';pg.font='bold 19px Georgia';pg.fillText('RUNEQUEST',16,60);
 pg.font='12px Arial';pg.fillText('Préparer    Jouer    ...',largeur-184,58);
 const apercu=path.join(dossier,`apercu-${largeur}${grand?'-final':''}.png`);fs.writeFileSync(apercu,p.toBuffer('image/png'));verifications.push(apercu);
}
const bilan={fichier,width:finale.width,height:finale.height,bytes:jpg.length,quality,source:{width:im.width,height:im.height},crop,agrandissement:grand?w/crop.width:1,aperçus:verifications};
fs.writeFileSync(path.join(dossier,grand?'verification-finale.json':'verification-native.json'),JSON.stringify(bilan,null,2)+'\n');console.log(JSON.stringify(bilan,null,2));
