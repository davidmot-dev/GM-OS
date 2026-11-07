import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const d='output/clips/alien',f=`${d}/montage.json`,p=JSON.parse(fs.readFileSync(f,'utf8'));
p.debutVideoTablette=0;p.segmentsTablette[1].finMJ=p.chapitres[8].secondesDepuisTitre;
fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');
const exportVideo=JSON.parse(execFileSync(process.execPath,['outils/clips/monter_clip_alien.mjs',`${d}/tournage-mj.webm`,`${d}/tournage-tablette.webm`,'output/clips',f],{encoding:'utf8'}));
const v=JSON.parse(fs.readFileSync(`${d}/verification.json`,'utf8'));Object.assign(v,{exportVideo,chapitres:exportVideo.chapitres,dureeDepuisTitre:exportVideo.dureeMp4});fs.writeFileSync(`${d}/verification.json`,JSON.stringify(v,null,2)+'\n');console.log(JSON.stringify({duree:exportVideo.dureeMp4,raccords:exportVideo.montage.raccords}));
