/** Monte les alternances entre le vrai MJ et le vrai Hub tactile en 1440×900. */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const [mj,tablette,sortie,fichier]=process.argv.slice(2),p=JSON.parse(fs.readFileSync(fichier,'utf8'));
const dossier=path.resolve(sortie,'torg');fs.mkdirSync(dossier,{recursive:true});
const brutMJ=path.join(dossier,'tournage-mj.webm'),brutTablette=path.join(dossier,'tournage-tablette.webm');
if(path.resolve(mj)!==brutMJ)fs.copyFileSync(mj,brutMJ);if(path.resolve(tablette)!==brutTablette)fs.copyFileSync(tablette,brutTablette);
fs.writeFileSync(path.join(dossier,'montage.json'),JSON.stringify(p,null,2)+'\n');
const probe=f=>JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','json',f],{encoding:'utf8'}));
const dureeMJ=Number(probe(mj).format.duration);
// La vidéo du Hub contient une image finale maintenue pendant la fermeture.
// Sa durée totale ne permet donc pas de retrouver son origine temporelle.
const debutMJ=Math.max(0,dureeMJ-p.dureeDepuisTitre-.3),debutT=p.debutVideoTablette??0;
if(!p.segmentsTablette.length)throw Error('Aucun segment tactile');
let segments=[];let position=.3;
for(const t of p.segmentsTablette){
    if(!(t.debutMJ>=position-.3&&t.finMJ>t.debutMJ&&t.finTablette>t.debutTablette))throw Error('Bornes invalides');
    segments.push({source:0,debut:position,fin:t.debutMJ+.3});
    segments.push({source:1,debut:t.debutTablette,fin:t.finTablette});position=t.finMJ+.3;
}
segments.push({source:0,debut:position,fin:p.dureeDepuisTitre+.3});
// Le premier segment commence avec le titre, en conservant la marge de capture.
segments[0].debut=0;
// Retirer seulement les attentes du tournage : connexion du Hub et ouverture
// finale du moteur HTML. Les gestes et les résultats restent dans leur ordre.
for(const c of p.coupesMJ??[]){
    if(!(c.debut>=0&&c.fin>c.debut))throw Error('Coupe invalide');
    const debut=c.debut+.3,fin=c.fin+.3;
    segments=segments.flatMap(s=>{
        if(s.source!==0||fin<=s.debut||debut>=s.fin)return [s];
        const morceaux=[];
        if(debut>s.debut)morceaux.push({...s,fin:debut});
        if(fin<s.fin)morceaux.push({...s,debut:fin});
        return morceaux;
    });
}
const nbMJ=segments.filter(s=>s.source===0).length,nbT=segments.length-nbMJ;
let filtres=[`[0:v]split=${nbMJ}${Array.from({length:nbMJ},(_,i)=>`[m${i}]`).join('')}`,`[1:v]split=${nbT}${Array.from({length:nbT},(_,i)=>`[t${i}]`).join('')}`];
let iMJ=0,iT=0;
segments.forEach((s,i)=>{const entree=s.source===0?`m${iMJ++}`:`t${iT++}`;filtres.push(`[${entree}]trim=start=${s.debut}:end=${s.fin},setpts=PTS-STARTPTS[v${i}]`);});
filtres.push(segments.map((_,i)=>`[v${i}]`).join('')+`concat=n=${segments.length}:v=1:a=0,fps=25,format=yuv420p[v]`);
const mp4=path.resolve(sortie,'torg-mecanismes-et-tablette.mp4'),webm=path.resolve(sortie,'torg-mecanismes-et-tablette.webm');
execFileSync('ffmpeg',['-y','-loglevel','error','-ss',String(debutMJ),'-i',mj,'-ss',String(debutT),'-i',tablette,'-filter_complex',filtres.join(';'),'-map','[v]','-c:v','libx264','-preset','medium','-crf','20','-movflags','+faststart',mp4]);
execFileSync('ffmpeg',['-y','-loglevel','error','-i',mp4,'-c:v','libvpx-vp9','-cpu-used','8','-deadline','realtime','-crf','32','-b:v','0',webm]);
const convertir=t=>{let delta=0;for(const s of p.segmentsTablette)if(t>=s.finMJ)delta+=(s.finTablette-s.debutTablette)-(s.finMJ-s.debutMJ);for(const c of p.coupesMJ??[])delta-=Math.max(0,Math.min(t,c.fin)-c.debut);return t+delta;};
let cursor=0;const raccords=[];for(const s of segments){cursor+=s.fin-s.debut;raccords.push(cursor);}raccords.pop();
console.log(JSON.stringify({mp4,webm,dureeMp4:Number(probe(mp4).format.duration),chapitres:p.chapitres.map(c=>({...c,secondesDepuisTitre:convertir(c.secondesDepuisTitre)})),montage:{debutMJ,debutT,segments,raccords,brutMJ,brutTablette}}));
