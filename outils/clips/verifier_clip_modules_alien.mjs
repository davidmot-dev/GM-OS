/** Décodage complet, images des scènes et des raccords ; aucune API ni donnée personnelle. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const sortie=path.resolve(process.argv[2]??'output/clips');
const preuves=path.join(sortie,'alien-modules-2026-11-15');
const verification=JSON.parse(fs.readFileSync(path.join(preuves,'verification.json'),'utf8'));
if(verification.modeRapide)throw Error('Une répétition ne peut pas servir de film final.');
const mp4=verification.exportVideo.mp4,webm=verification.exportVideo.webm;
const ffmpeg=process.env.GMOS_FFMPEG??'ffmpeg',ffprobe=process.env.GMOS_FFPROBE??'ffprobe';
const probe=f=>JSON.parse(execFileSync(ffprobe,['-v','error','-show_streams','-show_format','-of','json',f],{encoding:'utf8'}));
const formats=[mp4,webm].map(f=>{
    const p=probe(f),video=p.streams.find(s=>s.codec_type==='video');
    if(!video||video.width!==1440||video.height!==900)throw Error('Format vidéo inattendu.');
    execFileSync(ffmpeg,['-v','error','-i',f,'-map','0:v:0','-f','null','-'],{stdio:['ignore','pipe','pipe']});
    return {fichier:path.basename(f),codec:video.codec_name,largeur:video.width,hauteur:video.height,duree:Number(p.format.duration),octets:fs.statSync(f).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')};
});
const duree=formats[0].duree;
if(duree<120||duree>600)throw Error('Durée du film final à contrôler.');
const montage=JSON.parse(fs.readFileSync(path.join(preuves,'montage.json'),'utf8'));
const convertir=t=>{let delta=0;for(const s of montage.segmentsTablette)if(t>=s.finMJ)delta+=(s.finTablette-s.debutTablette)-(s.finMJ-s.debutMJ);return t+delta;};
const reperes=[{nom:'generique-debut',temps:3},...verification.photos.map(p=>({nom:p.nom,temps:convertir(p.secondesDepuisTitre)})),
    ...verification.exportVideo.montage.raccords.flatMap((t,i)=>[{nom:`raccord-${i+1}-avant`,temps:t-.3},{nom:`raccord-${i+1}-apres`,temps:t+.3}]),
    // Repères supplémentaires pris dans la vidéo finale : les horloges de capture
    // et les horloges murales peuvent différer de quelques secondes.
    {nom:'resolution-spatiale-film-final',temps:duree-22},{nom:'prereglage-film-final',temps:duree-11},
    {nom:'generique-fin',temps:duree-3}].sort((a,b)=>a.temps-b.temps);
const qa=path.join(preuves,'controle-images');fs.mkdirSync(qa,{recursive:true});
for(const [i,r] of reperes.entries()){
    r.temps=Math.max(0,Math.min(duree-.1,r.temps));r.fichier=`image-${String(i+1).padStart(2,'0')}.png`;
    execFileSync(ffmpeg,['-y','-v','error','-ss',String(r.temps),'-i',mp4,'-frames:v','1','-vf','scale=960:-1',path.join(qa,r.fichier)],{stdio:['ignore','pipe','pipe']});
}
execFileSync(ffmpeg,['-y','-v','error','-framerate','1','-i',path.join(qa,'image-%02d.png'),'-vf','scale=360:-1,tile=4x3:padding=6:margin=6:color=0x22302a','-q:v','3',path.join(qa,'planche-%02d.jpg')],{stdio:['ignore','pipe','pipe']});
const rapport={formats,images:reperes,raccords:verification.exportVideo.montage.raccords,decodageComplet:true,controleVisuel:'à effectuer',tablette:verification.tablette};
fs.writeFileSync(path.join(preuves,'controle-video.json'),JSON.stringify(rapport,null,2)+'\n');
console.log(JSON.stringify({duree,images:reperes.length,planches:Math.ceil(reperes.length/12),raccords:rapport.raccords.length,mp4}));
