import fs from 'node:fs';let s=fs.readFileSync('tmp/verifier-film-cthulhu-hack.mjs','utf8').replaceAll('cthulhu-hack','coc').replaceAll('Cthulhu Hack','COC').replaceAll('mecanismes-et-outils','mecanismes-et-tablette');
s=s.replace('const temps = [1,',"const raccord1=rapport.exportVideo.montage.remplacementMJ[0]+.3,raccord2=raccord1+rapport.exportVideo.montage.dureeTablette;\nconst temps = [1,");
s=s.replace('}), duree-3];','}), duree-3, raccord1-.7,raccord1+.7,raccord2-.7,raccord2+.7];');
s=s.replace('[1,10]','[1,13]').replace('tile=3x3','tile=3x4');fs.writeFileSync('tmp/verifier-film-coc.mjs',s);
