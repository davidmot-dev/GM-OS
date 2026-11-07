import fs from 'node:fs';
const dir='tmp/pdfs/runequest';
function lines(items){const groups=[];for(const it of items.filter(i=>i.str.trim())){const y=it.transform[5];let l=groups.find(l=>Math.abs(l.y-y)<0.35);if(!l)groups.push(l={y,items:[]});l.items.push(it);}return groups.sort((a,b)=>b.y-a.y).map(g=>{g.items.sort((a,b)=>a.transform[4]-b.transform[4]);let text='',end;for(const it of g.items){const x=it.transform[4];if(end!==undefined&&x-end>1.2&&!text.endsWith(' ')&&!it.str.startsWith(' '))text+=' ';text+=it.str;end=x+it.width;}return {x:g.items[0].transform[4],y:g.y,text:text.replace(/\s+/g,' ').trim()};});}
const toc=lines(JSON.parse(fs.readFileSync(dir+'/toc-1.json','utf8'))).filter(l=>l.text!=='Sommaire').map(l=>{const m=l.text.match(/^(.*?)\.{2,}\s*(\d+)$/);if(!m)throw Error('TOC non reconnue: '+l.text);return {titre:m[1].trim(),pages:m[2]};});
const index=[],controle=[];for(let p=1;p<=9;p++){
 const its=JSON.parse(fs.readFileSync(dir+'/index-'+p+'.json','utf8')).filter(i=>i.height<11&&i.transform[5]>40&&i.transform[5]<725&&i.str.trim());
 for(let c=0;c<2;c++){
  const ls=lines(its.filter(i=>(i.transform[4]<297?0:1)===c));const entries=[];
  for(const l of ls){if(/^[A-Z]$/.test(l.text))continue;if(/^\d/.test(l.text)){if(!entries.length)throw Error('Continuation sans entrée '+p+' '+c+': '+l.text);entries.at(-1).text+=' '+l.text;}else entries.push({...l});}
  const es=entries.map(l=>{const m=l.text.match(/^(.*?)\s+((?:\d+(?:\s*-\s*\d+)?)(?:\s*,\s*\d+(?:\s*-\s*\d+)?)*)$/);if(!m)throw Error('Entrée non reconnue '+p+' '+c+': '+l.text);return {titre:m[1],pages:m[2].replace(/\s*-\s*/g,'-'),pageSource:p,colonne:c+1};});
  index.push(...es);controle.push({page:p,colonne:c+1,n:es.length,premiere:es[0],derniere:es.at(-1)});
 }
}
fs.writeFileSync(dir+'/extraction.json',JSON.stringify({toc,index},null,2));fs.writeFileSync(dir+'/controle.json',JSON.stringify(controle,null,2));console.log(JSON.stringify({sommaire:toc.length,index:index.length,colonnes:controle.map(c=>({p:c.page,c:c.colonne,n:c.n,premiere:c.premiere.titre,derniere:c.derniere.titre}))},null,2));
