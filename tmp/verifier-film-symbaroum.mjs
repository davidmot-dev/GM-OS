import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const dossier = 'output/clips/symbaroum';
const rapport = JSON.parse(fs.readFileSync(`${dossier}/verification.json`, 'utf8'));
if (rapport.modeRapide || !rapport.exportVideo.mp4) throw new Error('Le MP4 final en vitesse normale est requis.');
const mp4 = rapport.exportVideo.mp4;
const probe = JSON.parse(execFileSync('ffprobe', ['-v','error','-show_entries','format=duration:stream=codec_name,width,height','-of','json',mp4], {encoding:'utf8'}));
const duree = Number(probe.format.duration);
const temps = [1, ...rapport.chapitres.flatMap((c,i) => {
  const fin = rapport.chapitres[i+1]?.secondesDepuisTitre ?? duree-7;
  return [c.secondesDepuisTitre + 3, (c.secondesDepuisTitre+fin)/2];
}), duree-3];
for (const [i,t] of temps.entries()) {
  execFileSync('ffmpeg', ['-y','-loglevel','error','-ss',String(t),'-i',mp4,'-frames:v','1','-q:v','2',path.join(dossier,`film-${String(i+1).padStart(2,'0')}.jpg`)]);
}
for (const [i,start] of [1,10].entries()) {
  execFileSync('ffmpeg', ['-y','-loglevel','error','-start_number',String(start),'-i',`${dossier}/film-%02d.jpg`,'-vf','scale=480:300,tile=3x3','-frames:v','1','-q:v','2',`${dossier}/planche-film-${i+1}.jpg`]);
}
fs.writeFileSync(`${dossier}/controle-video.json`, JSON.stringify({ mp4:'../symbaroum-mecanismes-et-outils.mp4', dureeSecondes:duree, flux:probe.streams, imagesExtraites:temps.map((t,i)=>({image:`film-${String(i+1).padStart(2,'0')}.jpg`,secondes:t})), relecture:'à effectuer'},null,2)+'\n');
fs.writeFileSync(`${dossier}/chapitres.md`, '# Symbaroum — repères du clip\n\n'+rapport.chapitres.map(c=>{
 const t=Math.round(c.secondesDepuisTitre+.3); return `- ${Math.floor(t/60)}:${String(t%60).padStart(2,'0')} — ${c.titre}`;
}).join('\n')+'\n');
console.log(JSON.stringify({duree,flux:probe.streams,images:temps.length}));
