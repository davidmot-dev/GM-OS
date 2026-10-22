import { createElement as h, useState } from 'react';
const bouton=(libelle,onClick,disabled=false)=>h('button',{type:'button',onClick,disabled},libelle);
const champ=(libelle,nom,props={})=>h('label',null,libelle,h('input',{name:nom,...props}));
const choix=(libelle,nom,valeur,options,props={})=>h('label',null,libelle,h('select',{'aria-label':libelle,name:nom,...(Object.hasOwn(props,'value')?{}:{defaultValue:valeur}),...props},options.map(([v,n])=>h('option',{key:v,value:v},n))));
export function LectureDiscrete({ lecture }) {
  return h('section',{'aria-label':'Résultat du scan discret',className:'detecteur-reglages'},
    h('h3',null,`Mode discret · Tour ${lecture.tour}`),h('p',null,`Énergie du M314 : ${lecture.energie}`),
    h('p',null,lecture.scanneTour===lecture.tour ? 'Dernier scan de ce Tour. Échos de mouvements, sans identification ni ligne de vue.' : 'Aucun scan pour ce Tour.'),
    lecture.echos.length>0 ? h('ul',null,lecture.echos.map(e=>h('li',{key:e.zone},`${e.zone} : ${e.nombre} écho${e.nombre>1?'s':''}`))) : h('p',null,'Aucun écho à afficher.'));
}
function Plan({ d }) {
  if (!d.zones.length) return null;
  const xs=d.zones.map(z=>z.x),ys=d.zones.map(z=>z.y),gauche=Math.min(...xs)-25,haut=Math.min(...ys)-15,
    largeur=Math.max(80,Math.max(...xs)-gauche+25),hauteur=Math.max(35,Math.max(...ys)-haut+20);
  return h('figure',null,h('figcaption',null,'Plan privé de Maman — zones et pions cachés'),
    h('svg',{viewBox:`${gauche} ${haut} ${largeur} ${hauteur}`,className:'detecteur-plan',role:'img','aria-label':'Plan privé des zones'},
      d.zones.flatMap(z=>z.liens.filter(l=>l>z.id).map(l=>{const b=d.zones.find(a=>a.id===l);return h('line',{key:z.id+l,x1:z.x,y1:z.y,x2:b.x,y2:b.y,stroke:'currentColor',strokeWidth:1});})),
      d.zones.map(z=>h('g',{key:z.id},h('circle',{cx:z.x,cy:z.y,r:2.5,fill:'currentColor'}),h('text',{x:z.x,y:z.y-5,textAnchor:'middle',fontSize:4,fill:'currentColor'},z.nom),
        h('text',{x:z.x,y:z.y+8,textAnchor:'middle',fontSize:3,fill:'currentColor'},`${d.pions.filter(p=>p.zoneId===z.id).length} pion(s)`)))));
}
function Zones({ d,envoyer,occupe }) {
  const [selection,choisir]=useState(''); const z=d.zones.find(z=>z.id===selection);
  return h('details',null,h('summary',null,'Préparer les zones du plan'),
    choix('Zone à préparer','zone',z?.id||'',[['','Nouvelle zone…'],...d.zones.map(z=>[z.id,z.nom])],{value:z?.id||'',onChange:e=>choisir(e.target.value)}),
    h('form',{key:JSON.stringify(z)||'nouvelle',className:'detecteur-reglages','aria-label':'Préparer une zone',onSubmit:async e=>{
      e.preventDefault();const f=new FormData(e.currentTarget),id=z?.id||'zone-'+crypto.randomUUID();
      if(await envoyer('zone-discrete',{id,nom:f.get('nom'),x:Number(f.get('x')),y:Number(f.get('y')),liens:f.getAll('liens')}))choisir(id);
    }},h('fieldset',{disabled:occupe},champ('Nom de la zone','nom',{defaultValue:z?.nom||'',required:true,maxLength:80}),
      champ('Position X en mètres','x',{type:'number',defaultValue:z?.x??(d.zones.length?Math.max(...d.zones.map(z=>z.x))+25:0),min:-10000,max:10000,required:true}),
      champ('Position Y en mètres','y',{type:'number',defaultValue:z?.y??0,min:-10000,max:10000,required:true}),
      h('p',null,'Relier les zones adjacentes et franchissables. Les positions servent à la portée du M314, sans accorder de ligne de vue.'),
      ...d.zones.filter(a=>a.id!==z?.id).map(a=>h('label',{key:a.id,className:'detecteur-case'},h('input',{name:'liens',type:'checkbox',value:a.id,defaultChecked:z?.liens.includes(a.id)||false}),`Passage vers ${a.nom}`)),
      h('button',{type:'submit'},'Enregistrer la zone'))));
}
function Pions({ d,envoyer,occupe }) {
  const [selection,choisir]=useState(''),[humain,definirHumain]=useState(true); const p=d.pions.find(p=>p.id===selection);
  return h('details',null,h('summary',null,'Préparer les pions cachés'),
    choix('Pion à préparer','pion',p?.id||'',[['','Nouveau pion…'],...d.pions.map(p=>[p.id,p.nom])],{value:p?.id||'',onChange:e=>{choisir(e.target.value);definirHumain(d.pions.find(p=>p.id===e.target.value)?.humain??true);}}),
    h('form',{key:JSON.stringify(p)||'nouveau',className:'detecteur-reglages','aria-label':'Préparer un pion',onSubmit:async e=>{
      e.preventDefault(); const f=new FormData(e.currentTarget),id=p?.id||'pion-'+crypto.randomUUID();
      if(await envoyer('pion-discret',{id,nom:f.get('nom'),zoneId:f.get('zoneId'),humain,limite:humain?2:Number(f.get('limite')),mobile:f.has('mobile'),detectable:f.has('detectable')}))choisir(id);
    }},h('fieldset',{disabled:occupe||!d.zones.length},champ('Nom privé du pion','nom',{defaultValue:p?.nom||'',required:true,maxLength:80}),
      choix('Zone initiale','zoneId',p?.zoneId||d.zones[0]?.id,d.zones.filter(z=>!p||z.id===p.zoneId).map(z=>[z.id,z.nom])),
      h('label',{className:'detecteur-case'},h('input',{type:'checkbox',checked:humain,onChange:e=>definirHumain(e.target.checked)}),'Humain : deux zones par Tour'),
      champ('Zones par Tour de la créature','limite',{type:'number',min:1,max:20,defaultValue:p?.limite||2,disabled:humain}),
      h('label',{className:'detecteur-case'},h('input',{name:'mobile',type:'checkbox',defaultChecked:p?.mobile||false}),'En mouvement actuellement'),
      h('label',{className:'detecteur-case'},h('input',{name:'detectable',type:'checkbox',defaultChecked:p?.detectable??true}),'Objet de bonne taille détectable'),
      h('button',{type:'submit'},'Enregistrer le pion'))));
}
export function DiscretMJ({ d,envoyer,occupe }) {
  return h('section',{className:'detecteur-reglages','aria-label':'Mode discret du détecteur'},
    h('h3',null,'Mode discret — M314'),
    h('label',{className:'detecteur-case'},h('input',{type:'checkbox',checked:d.actif,disabled:occupe,onChange:e=>envoyer('mode-discret',{actif:e.target.checked})}),'Raccorder le détecteur au plan et à sa batterie'),
    h('p',null,'Le mode de mise en scène reste disponible en décochant. Les Tours, déplacements et coûts restent conservés.'),
    h(Zones,{d,envoyer,occupe}),h(Pions,{d,envoyer,occupe}),
    d.actif&&h('div',null,h(Plan,{d}),
      h('form',{key:JSON.stringify([d.terrain,d.energie,d.porteurId]),className:'detecteur-reglages','aria-label':'Batterie et porteur du M314',onSubmit:e=>{
        e.preventDefault();const f=new FormData(e.currentTarget);void envoyer('regler-discret',{terrain:f.get('terrain'),energie:Number(f.get('energie')),porteurId:f.get('porteurId')});
      }},h('fieldset',{disabled:occupe||!d.pions.length},
        choix('Porteur du M314','porteurId',d.porteurId,d.pions.map(p=>[p.id,p.nom])),
        choix('Terrain du scan','terrain',d.terrain,[['interieur','Intérieur ou terrain obstrué : quatre zones, 100 m'],['exterieur','Terrain découvert : 1 km']]),
        champ('Réserve propre à la batterie du M314','energie',{type:'number',min:0,max:1000,required:true,defaultValue:d.energie}),
        h('button',{type:'submit'},'Confirmer porteur et batterie'))),
      h('h3',null,`Déplacements — Tour ${d.tour}`),h('p',null,'Déplace d’abord les PJ, puis les ennemis en secret. Examiner prend un Tour entier. Maman arbitre détection, obstacles et entrée en combat.'),
      ...d.pions.map(p=>h('form',{key:p.id+':'+p.zoneId+':'+d.tour,className:'detecteur-reglages','aria-label':`Déplacer ${p.nom}`,onSubmit:e=>{
        e.preventDefault();void envoyer('deplacer-discret',{pionId:p.id,zoneId:new FormData(e.currentTarget).get('zoneId'),tour:d.tour});
      }},h('strong',null,`${p.nom} · ${d.zones.find(z=>z.id===p.zoneId)?.nom} · ${p.depense}/${p.limite} zones`),
        choix('Destination','zoneId','',d.zones.filter(z=>d.zones.find(a=>a.id===p.zoneId).liens.includes(z.id)).map(z=>[z.id,z.nom])),
        h('button',{type:'submit',disabled:occupe||p.depense>=p.limite||!d.zones.find(z=>z.id===p.zoneId).liens.length},'Déplacer d’une zone'),
        bouton('Examiner pendant ce Tour',()=>envoyer('examiner-discret',{pionId:p.id,tour:d.tour}),occupe||p.depense>0))),
      h('div',{className:'detecteur-actions'},bouton('Scanner ce Tour et tester l’Énergie',()=>envoyer('scanner-discret',{tour:d.tour}),occupe||!d.porteurId||d.energie===0||d.dernierScan?.tour===d.tour),
        bouton('Valider le Tour suivant',()=>envoyer('tour-discret',{tour:d.tour}),occupe)),
      d.dernierScan&&h('p',null,`Scan du Tour ${d.dernierScan.tour} · Énergie : ${d.dernierScan.avant} → ${d.dernierScan.apres} · dés : ${d.dernierScan.des.join(', ')}. Aucun Stress ni Panique.`),
      h('p',null,'Ce Tour mesure l’exploration. Dans Survie Alien, valide aussi le Tour effectivement écoulé pour les réserves et privations concernées. Le temps réel ne les avance jamais.')));
}
