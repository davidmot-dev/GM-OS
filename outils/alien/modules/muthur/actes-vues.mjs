import { createElement as h, useState } from 'react';
const bouton=(libelle,onClick,disabled)=>h('button',{type:'button',onClick,disabled},libelle);
const champ=(libelle,nom,props={})=>h('label',null,libelle,h('input',{name:nom,...props}));
export function ActesMJ({ vue,envoyer,occupe }) {
  const [scenario,definirScenario]=useState(vue.actes[0]?.scenario||''),[acte,definirActe]=useState(vue.actes[0]?.acte||1);
  const [dossierId,choisirDossier]=useState(''),[personnageId,choisirPersonnage]=useState('');
  const periode=vue.actes.find(a=>a.scenario===scenario&&a.acte===acte),d=periode?.dossiers.find(d=>d.id===dossierId),
    o=periode?.objectifs.find(o=>o.personnageId===personnageId);
  return h('section',{'aria-label':'Préparations des actes'},
    h('h3',null,'Dossiers et objectifs par acte'),
    h('p',null,'Préparation privée de Maman. Seuls les dossiers publiés et les objectifs remis deviennent accessibles selon leurs destinataires. Aucun piratage ni protocole ne les publie automatiquement.'),
    h('label',null,'Préparation existante',h('select',{'aria-label':'Préparation existante',value:periode?JSON.stringify([scenario,acte]):'',disabled:occupe,onChange:e=>{if(!e.target.value)return;const [s,a]=JSON.parse(e.target.value);definirScenario(s);definirActe(a);choisirDossier('');choisirPersonnage('');}},
      h('option',{value:''},'Nouvelle préparation…'),vue.actes.map(a=>h('option',{key:JSON.stringify([a.scenario,a.acte]),value:JSON.stringify([a.scenario,a.acte])},`${a.scenario} · acte ${a.acte}`)))),
    h('label',null,'Scénario (nom unique)',h('input',{value:scenario,maxLength:100,disabled:occupe,onChange:e=>{definirScenario(e.target.value);choisirDossier('');}})),
    h('label',null,'Acte à préparer',h('select',{'aria-label':'Acte à préparer',value:acte,disabled:occupe,onChange:e=>{definirActe(Number(e.target.value));choisirDossier('');}},[1,2,3].map(a=>h('option',{key:a,value:a},a)))),
    h('h3',null,'Dossier de cet acte'),
    h('label',null,'Dossier préparé',h('select',{'aria-label':'Dossier préparé',value:d?.id||'',disabled:occupe,onChange:e=>choisirDossier(e.target.value)},h('option',{value:''},'Nouveau dossier d’acte…'),
      periode?.dossiers.map(d=>h('option',{key:d.id,value:d.id},d.titre+(d.publie?' · publié':''))))),
    h('form',{key:JSON.stringify(d)||`nouveau-${scenario}-${acte}`,className:'muthur-formulaire','aria-label':'Dossier de l’acte',onSubmit:async e=>{
      e.preventDefault();const f=new FormData(e.currentTarget),id=d?.id||f.get('dossierId');
      if(await envoyer('dossier-acte',{scenario,acte,dossierId:id,titre:f.get('titre'),contenu:f.get('contenu'),acces:f.get('acces'),code:f.get('code')}))choisirDossier(id);
    }},h('fieldset',{disabled:occupe||!scenario.trim()||d?.publie},
      champ('Identifiant pour READ','dossierId',{required:true,maxLength:64,pattern:'[a-z][a-z0-9-]{0,63}',placeholder:'rapport-quarantaine',defaultValue:d?.id||'',readOnly:!!d}),
      champ('Titre du dossier d’acte','titre',{required:true,maxLength:80,defaultValue:d?.titre||''}),
      h('label',null,'Contenu du dossier d’acte',h('textarea',{name:'contenu',required:true,maxLength:10000,rows:5,defaultValue:d?.contenu||''})),
      h('label',null,'Accès après publication',h('select',{'aria-label':'Accès après publication',name:'acces',defaultValue:d?.acces||'administrateur'},
        h('option',{value:'administrateur'},'Administrateur'),h('option',{value:'code'},'Code'),h('option',{value:'equipage'},'Équipage'))),
      champ('Code du dossier d’acte','code',{maxLength:120,defaultValue:d?.code||'',autoComplete:'off'}),
      h('button',{type:'submit'},'Conserver le brouillon du dossier'))),
    d&&bouton(d.publie?'Dossier déjà publié':'Publier ce dossier dans MU/TH/UR',()=>envoyer('publier-dossier-acte',{scenario,acte,dossierId:d.id}),occupe||d.publie),
    h('p',null,'Après publication, les accès et modifications se gèrent dans Dossiers. Changer d’acte ne retire pas les documents déjà lus.'),
    h('h3',null,'Objectif privé de cet acte'),
    h('label',null,'Destinataire de l’objectif',h('select',{'aria-label':'Destinataire de l’objectif',value:personnageId,disabled:occupe,onChange:e=>choisirPersonnage(e.target.value)},
      h('option',{value:''},'Choisir l’opérateur…'),Object.values(vue.players).map(p=>h('option',{key:p.id,value:p.id},p.name)))),
    h('form',{key:JSON.stringify(o)||`${scenario}-${acte}-${personnageId}`,className:'muthur-formulaire','aria-label':'Objectif de l’acte',onSubmit:e=>{
      e.preventDefault();void envoyer('objectif-acte',{scenario,acte,personnageId,texte:new FormData(e.currentTarget).get('texte')});
    }},h('label',null,'Objectif secret (MJ uniquement)',h('textarea',{name:'texte',rows:4,maxLength:4000,required:true,defaultValue:o?.texte||'',disabled:occupe||!scenario.trim()||!personnageId||o?.remis})),
      h('button',{type:'submit',disabled:occupe||!scenario.trim()||!personnageId||o?.remis},'Conserver le brouillon de l’objectif')),
    o&&bouton(o.remis?'Objectif déjà remis':'Remettre dans le terminal privé',()=>envoyer('remettre-objectif-acte',{scenario,acte,personnageId}),occupe||o.remis),
    h('p',null,'La remise est unique pour cet acte et ce personnage. Le texte reste dans son fil privé à la reconnexion. Pour les gains de Récit, utilise le suivi A7 ; évite une deuxième remise du même objectif par un autre canal.'));
}
