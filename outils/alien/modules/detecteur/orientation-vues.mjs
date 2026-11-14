import { createElement as h, useEffect, useState } from 'react';
import { OUVERTURES } from './orientation.mjs';

function direction(cap) { return ['Nord','Nord-est','Est','Sud-est','Sud','Sud-ouest','Ouest','Nord-ouest'][Math.round(cap / 45) % 8]; }
export function Orientation({ vue, envoyer, occupe }) {
  const lecture = vue.lectureDiscrete || (vue.discret?.actif ? vue.discret : null);
  const valeur = lecture?.cap ?? 0;
  const [cap, choisir] = useState(valeur);
  useEffect(() => choisir(valeur), [valeur]);
  if (!lecture) return null;
  const meneur = !!vue.discret, autorise = meneur || vue.peutOrienter === true;
  const appliquer = () => { if (cap !== valeur) void envoyer('orienter-discret',{cap,tour:lecture.tour}); };
  return h('section',{className:'detecteur-reglages detecteur-orientation','aria-label':'Orientation du détecteur'},
    h('h3',null,'Orientation'),
    h('div',{className:'detecteur-mesures'},h('p',null,`Cap : ${direction(valeur)} · ${valeur}°`),h('p',null,`Champ : ${lecture.ouverture}°`)),
    autorise && h('fieldset',{disabled:occupe},
      h('div',{className:'detecteur-rotation'},
        h('button',{type:'button','aria-label':'Tourner de 15° vers la gauche',onClick:()=>envoyer('orienter-discret',{cap:(valeur+345)%360,tour:lecture.tour})},'↶ 15°'),
        h('button',{type:'button','aria-label':'Tourner de 15° vers la droite',onClick:()=>envoyer('orienter-discret',{cap:(valeur+15)%360,tour:lecture.tour})},'15° ↷')),
      h('label',null,`Cap du détecteur : ${cap}°`,h('input',{type:'range',min:0,max:359,step:1,value:cap,
        'aria-label':'Cap du détecteur','aria-valuetext':`${direction(cap)} · ${cap}°`,onChange:e=>choisir(Number(e.target.value)),
        onPointerUp:appliquer,onKeyUp:appliquer,onBlur:appliquer})),
      meneur && h('label',null,'Ouverture du cône',h('select',{'aria-label':'Ouverture du cône',value:lecture.ouverture,onChange:e=>envoyer('champ-discret',{ouverture:Number(e.target.value)})},
        OUVERTURES.map(v=>h('option',{key:v,value:v},v===360?'360° — toutes directions':`${v}°`))))),
    h('p',null,'Tourne le détecteur pour explorer le dernier scan.'),
    h('small',null,autorise?'Orientation partagée avec le meneur.':'Orientation réglée par le porteur et le meneur.'));
}
