import fs from 'node:fs';
import path from 'node:path';
import {createCanvas,loadImage} from '@napi-rs/canvas';
const dir=path.resolve('output/campagnes-tests/torg'),captures=path.join(dir,'captures');
for(const [prefixe,motif] of [['medias',/^rendu-.*\.jpg$/],['electron',/^(?:0[1-4])-.*\.jpg$/]]){
    const noms=fs.readdirSync(captures).filter(n=>motif.test(n)).sort();
    if(!noms.length)continue;
    const largeur=480,hauteur=345,c=createCanvas(largeur*3,hauteur*Math.ceil(noms.length/3)),ctx=c.getContext('2d');ctx.fillStyle='#17343e';ctx.fillRect(0,0,c.width,c.height);
    for(const[i,n]of noms.entries()){
        const img=await loadImage(path.join(captures,n)),x=i%3*largeur,y=Math.floor(i/3)*hauteur,ratio=Math.min(largeur/img.width,315/img.height);
        ctx.drawImage(img,x,y,img.width*ratio,img.height*ratio);ctx.fillStyle='#f2ead7';ctx.font='17px Arial';ctx.fillText(n,x+8,y+337,largeur-16);
    }
    fs.writeFileSync(path.join(captures,'planche-'+prefixe+'.jpg'),c.toBuffer('image/jpeg',{quality:90}));
}
