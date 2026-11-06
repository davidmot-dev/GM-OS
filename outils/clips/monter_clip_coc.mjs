/** Assemble le tournage MJ et le vrai Hub tactile dans le même film 1440×900. */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const [mj,tablette,sortie,fichier]=process.argv.slice(2),p=JSON.parse(fs.readFileSync(fichier,'utf8'));
const dossier=path.resolve(sortie,'coc');fs.mkdirSync(dossier,{recursive:true});
const brutMJ=path.join(dossier,'tournage-mj.webm'),brutTablette=path.join(dossier,'tournage-tablette.webm');
if(path.resolve(mj)!==brutMJ)fs.copyFileSync(mj,brutMJ);if(path.resolve(tablette)!==brutTablette)fs.copyFileSync(tablette,brutTablette);
fs.writeFileSync(path.join(dossier,'montage.json'),JSON.stringify(p,null,2)+'\n');
const probe=f=>JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','json',f],{encoding:'utf8'}));
const dureeMJ=Number(probe(mj).format.duration),dureeT=Number(probe(tablette).format.duration);
const debutMJ=Math.max(0,dureeMJ-p.dureeDepuisTitre-.3),debutT=Math.max(0,dureeT-p.dureeTablette);
if(!(p.debutTablette>0&&p.finTablette>p.debutTablette&&p.dureeTablette>0))throw Error('Bornes de montage invalides');
const mp4=path.resolve(sortie,'coc-mecanismes-et-tablette.mp4'),webm=path.resolve(sortie,'coc-mecanismes-et-tablette.webm');
const filtre=`[0:v]split=2[a][b];[a]trim=end=${p.debutTablette+.3},setpts=PTS-STARTPTS[v0];[1:v]trim=duration=${p.dureeTablette},setpts=PTS-STARTPTS[v1];[b]trim=start=${p.finTablette+.3},setpts=PTS-STARTPTS[v2];[v0][v1][v2]concat=n=3:v=1:a=0,fps=25,format=yuv420p[v]`;
execFileSync('ffmpeg',['-y','-loglevel','error','-ss',String(debutMJ),'-i',mj,'-ss',String(debutT),'-i',tablette,'-filter_complex',filtre,'-map','[v]','-c:v','libx264','-preset','medium','-crf','20','-movflags','+faststart',mp4]);
execFileSync('ffmpeg',['-y','-loglevel','error','-i',mp4,'-c:v','libvpx-vp9','-cpu-used','4','-deadline','good','-crf','32','-b:v','0',webm]);
const delta=p.dureeTablette-(p.finTablette-p.debutTablette);
console.log(JSON.stringify({mp4,webm,dureeMp4:Number(probe(mp4).format.duration),chapitres:p.chapitres.map(c=>({...c,secondesDepuisTitre:c.secondesDepuisTitre>=p.finTablette?c.secondesDepuisTitre+delta:c.secondesDepuisTitre})),montage:{debutMJ,debutT,remplacementMJ:[p.debutTablette,p.finTablette],dureeTablette:p.dureeTablette,brutMJ,brutTablette}}));
