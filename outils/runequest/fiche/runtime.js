/* Fiche RuneQuest autonome : mêmes clés et coordonnées que le manifeste importable. */
(() => {
 'use strict';
 const template=JSON.parse(document.getElementById('character-sheet-template').textContent).template;
 const $=id=>document.getElementById(id),cleStockage=`character-sheet:${template.id}:v1`;
 const champs=template.pages.flatMap(p=>p.fields),definitions=new Map(champs.map(f=>[f.key,f]));
 const controles=new Map(),pistes=new Map(),pages=[];
 for(const f of champs.filter(f=>f.type==='hotspot')){if(!pistes.has(f.key))pistes.set(f.key,[]);pistes.get(f.key).push(f.value);}
 let donnees=Object.create(null),pageCourante=0,zoom=100,ajustement=true,delai,portraitCible;
 const statut=s=>{$('status').textContent=s;};
 const vide=v=>v===undefined||v===null||v==='';
 function valider(obj){
  if(!obj||typeof obj!=='object'||Array.isArray(obj))throw Error('Les données doivent former un objet JSON.');
  const resultat=Object.create(null);
  for(const [k,v]of Object.entries(obj)){
   if(['__proto__','constructor','prototype'].includes(k))continue;
   const f=definitions.get(k);
   if(f&&!vide(v)){
    if(f.type==='number'&&(typeof v!=='number'||!Number.isFinite(v)))throw Error(`Nombre invalide : ${f.label}`);
    if(['text','textarea'].includes(f.type)&&typeof v!=='string')throw Error(`Texte invalide : ${f.label}`);
    if(f.type==='checkbox'&&typeof v!=='boolean')throw Error(`Case invalide : ${f.label}`);
    if(f.type==='portrait'&&(typeof v!=='string'||!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v)))throw Error('Le portrait doit être une image intégrée PNG, JPEG ou WebP.');
    if(f.type==='hotspot'&&!pistes.get(k).includes(v)&&!(typeof pistes.get(k)[0]==='number'&&v===0))throw Error(`Valeur de piste invalide : ${f.label}`);
   }
   resultat[k]=v;
  }
  return resultat;
 }
 const mesure=document.createElement('canvas').getContext('2d');
 function ajusterNombre(el){
  el.style.fontSize='';if(!el.value)return;
  const css=getComputedStyle(el),taille=parseFloat(css.fontSize);
  mesure.font=css.fontWeight+' '+taille+'px '+css.fontFamily;
  const largeur=mesure.measureText(el.value).width,disponible=parseFloat(el.style.width)-1;
  if(largeur>disponible)el.style.fontSize=Math.max(5,taille*disponible/largeur)+'px';
 }
 function rafraichir(){
  for(const [k,liste]of controles){const v=donnees[k];for(const {el,f}of liste){
   if(f.type==='hotspot'){
    const actif=typeof f.value==='number'?typeof v==='number'&&v>0&&v>=f.value:v===f.value;
    el.classList.toggle('active',actif);el.setAttribute('aria-pressed',String(actif));
   }else if(f.type==='checkbox')el.checked=Boolean(v);
   else if(f.type==='portrait'){
    const ancien=el.querySelector('img');
    if(v){if(!ancien||ancien.src!==v){el.replaceChildren();const im=document.createElement('img');im.src=v;im.alt='Portrait du personnage';el.append(im);}}
    else el.replaceChildren();
    el.setAttribute('aria-label',v?'Portrait — cliquer pour remplacer ; Maj+clic pour retirer':'Portrait — choisir une image');
   }else{if(el!==document.activeElement)el.value=vide(v)?'':String(v);if(f.type==='number')ajusterNombre(el);}
  }}
 }
 function sauver(){
  clearTimeout(delai);
  try{localStorage.setItem(cleStockage,JSON.stringify({templateId:template.id,data:donnees}));statut('Enregistré dans ce navigateur. Exportez un JSON pour garder une copie.');}
  catch{statut('Sauvegarde locale indisponible ou pleine. Exportez un JSON pour garder une copie.');}
 }
 function modifier(k,v){donnees[k]=v;rafraichir();clearTimeout(delai);delai=setTimeout(sauver,160);statut('Enregistrement…');}
 function retirerPortrait(k){if(donnees[k]&&confirm('Retirer le portrait de cette fiche ?'))modifier(k,'');}
 for(const [i,p]of template.pages.entries()){
  const wrap=document.createElement('section');wrap.className='page-wrap';wrap.dataset.page=p.id;wrap.style.setProperty('--w',p.width+'px');wrap.style.setProperty('--h',p.height+'px');wrap.setAttribute('aria-label',p.label);
  const sheet=document.createElement('div');sheet.className='sheet';sheet.dataset.template=template.id;
  sheet.style.width=p.width+'px';sheet.style.height=p.height+'px';
  const fond=document.createElement('img');fond.className='background';fond.src=p.backgroundData;fond.alt='';fond.draggable=false;sheet.append(fond);
  for(const f of p.fields){
   const el=document.createElement(['hotspot','portrait'].includes(f.type)?'button':f.type==='textarea'?'textarea':'input');
   el.className=f.className;el.dataset.key=f.key;el.title=f.label;el.setAttribute('aria-label',f.label);
   Object.assign(el.style,{left:f.x+'px',top:f.y+'px',width:f.w+'px',height:f.h+'px'});
   if(f.type==='hotspot'){
    el.type='button';el.dataset.value=String(f.value);el.setAttribute('aria-pressed','false');
    el.addEventListener('click',()=>modifier(f.key,donnees[f.key]===f.value?(typeof f.value==='number'?0:''):f.value));
   }else if(f.type==='checkbox'){
    el.type='checkbox';el.addEventListener('change',()=>modifier(f.key,el.checked));
   }else if(f.type==='portrait'){
    el.type='button';
    el.addEventListener('click',e=>{if(e.shiftKey){retirerPortrait(f.key);return;}portraitCible=f.key;$('portrait-file').click();});
    el.addEventListener('contextmenu',e=>{e.preventDefault();retirerPortrait(f.key);});
   }else{
    if(el.tagName==='INPUT')el.type=f.type==='number'?'number':'text';
    if(f.type==='number'){el.inputMode='decimal';el.step='any';}
    el.placeholder=' ';el.autocomplete='off';el.spellcheck=false;
    el.addEventListener('input',()=>{if(el.validity.badInput)return;modifier(f.key,el.value===''?'':f.type==='number'?el.valueAsNumber:el.value);});
   }
   if(!controles.has(f.key))controles.set(f.key,[]);controles.get(f.key).push({el,f});sheet.append(el);
  }
  wrap.append(sheet);$('pages').append(wrap);pages.push(wrap);
  const option=document.createElement('option');option.value=String(i);option.textContent=`${i+1} / ${template.pages.length} — ${p.label}`;$('page').append(option);
 }
 function reglerZoom(valeur,auto=false){
  zoom=Math.max(20,Math.min(400,Number.isFinite(valeur)?valeur:100));ajustement=auto;$('zoom').value=String(Math.round(zoom));
  pages.forEach((w,i)=>{w.style.width=template.pages[i].width*zoom/100+'px';w.style.height=template.pages[i].height*zoom/100+'px';w.firstElementChild.style.transform=`scale(${zoom/100})`;});
 }
 function ajuster(){const p=template.pages[pageCourante],v=$('viewport');reglerZoom(Math.floor(Math.min((v.clientWidth-24)/p.width,(v.clientHeight-24)/p.height)*100),true);}
 function afficherPage(n){pageCourante=Math.max(0,Math.min(pages.length-1,n));pages.forEach((p,i)=>p.hidden=i!==pageCourante);$('page').value=String(pageCourante);$('prev').disabled=pageCourante===0;$('next').disabled=pageCourante===pages.length-1;$('viewport').scrollTo(0,0);if(ajustement)ajuster();}
 $('prev').onclick=()=>afficherPage(pageCourante-1);$('next').onclick=()=>afficherPage(pageCourante+1);
 $('page').onchange=e=>afficherPage(Number(e.target.value));$('minus').onclick=()=>reglerZoom(zoom-10);$('plus').onclick=()=>reglerZoom(zoom+10);
 $('zoom').onchange=e=>reglerZoom(Number(e.target.value));$('fit').onclick=ajuster;
 addEventListener('resize',()=>{if(ajustement)ajuster();});
 $('viewport').addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();reglerZoom(zoom+(e.deltaY<0?10:-10));}},{passive:false});
 addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&['+','=','-','0'].includes(e.key)){e.preventDefault();if(e.key==='0')ajuster();else reglerZoom(zoom+(e.key==='-'?-10:10));}});
 $('zones').onclick=()=>{$('zones').setAttribute('aria-pressed',String(document.body.classList.toggle('zones')));};
 $('export').onclick=()=>{
  sauver();const blob=new Blob([JSON.stringify({format:'interactive-character-sheet',version:1,sheet:template.id,templateId:template.id,data:donnees},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),lien=document.createElement('a');lien.href=url;
  const nom=String(donnees['identity.name']||'personnage').replace(/[^\p{L}\p{N}_-]+/gu,'-').slice(0,80);
  lien.download=`runequest-${nom}.json`;lien.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 $('import').onclick=()=>$('file').click();
 $('file').onchange=async e=>{
  const f=e.target.files[0];if(!f)return;
  try{
   const doc=JSON.parse(await f.text());
   if(doc.format!=='interactive-character-sheet'||![1,2].includes(doc.version))throw Error('Ce JSON n’est pas un export de fiche compatible.');
   if((doc.templateId&&doc.templateId!==template.id)||(doc.sheet&&doc.sheet!==template.id))throw Error('Ce JSON appartient à un autre modèle de fiche.');
   const valeurs=valider(doc.data);
   if(Object.values(donnees).some(v=>!vide(v)&&v!==false)&&!confirm('Remplacer les données de cette fiche par le JSON choisi ?'))return;
   document.activeElement?.blur();donnees=valeurs;rafraichir();sauver();statut('JSON importé et enregistré.');
  }catch(erreur){statut(`Import refusé : ${erreur.message}`);}finally{e.target.value='';}
 };
 $('portrait-file').onchange=async e=>{
  const fichier=e.target.files[0],cle=portraitCible;if(!fichier||!cle)return;
  try{
   if(!/^image\/(png|jpeg|webp|gif)$/.test(fichier.type))throw Error('Choisir une image PNG, JPEG, WebP ou GIF.');
   if(fichier.size>20*1024*1024)throw Error('L’image dépasse 20 Mo.');
   const url=URL.createObjectURL(fichier),im=new Image();
   try{im.src=url;await im.decode();const r=Math.min(1,1200/Math.max(im.naturalWidth,im.naturalHeight));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.naturalWidth*r));c.height=Math.max(1,Math.round(im.naturalHeight*r));const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(im,0,0,c.width,c.height);modifier(cle,c.toDataURL('image/jpeg',.9));}
   finally{URL.revokeObjectURL(url);}
  }catch(erreur){statut(`Portrait non chargé : ${erreur.message}`);}finally{e.target.value='';}
 };
 $('reset').onclick=()=>{if(confirm('Effacer toutes les données de ce personnage ? Exportez un JSON pour garder une copie.')){donnees=Object.create(null);rafraichir();sauver();statut('Fiche réinitialisée.');}};
 $('print').onclick=()=>{sauver();window.print();};$('help').onclick=()=>$('help-dialog').showModal();$('close-help').onclick=()=>$('help-dialog').close();
 addEventListener('pagehide',sauver);
 try{const lu=localStorage.getItem(cleStockage);if(lu){donnees=valider(JSON.parse(lu).data);statut('Dernière fiche restaurée depuis ce navigateur.');}else statut('Fiche vierge. Sauvegarde automatique dans ce navigateur.');}
 catch{statut('Sauvegarde locale indisponible ou illisible. Utilisez les exports JSON.');}
 rafraichir();afficherPage(0);
})();
