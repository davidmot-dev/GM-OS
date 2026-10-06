import {readFile,writeFile,access} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
const dossier=new URL('.',import.meta.url);
const donnees=JSON.parse(await readFile(new URL('donnees-demo.json',dossier),'utf8'));
const markdown=texte=>renderToStaticMarkup(React.createElement(ReactMarkdown,{remarkPlugins:[remarkGfm],components:{table:({children})=>React.createElement('div',{className:'table-markdown'},React.createElement('table',{},children))}},texte));
for(const fiche of donnees.wiki)fiche.html=markdown(fiche.content);
for(const note of donnees.coffre)note.html=markdown(note.contenu);
const comportement=await readFile(new URL('meneur.js',dossier),'utf8');
const noms=['pads','des','sons','scenario','combat','tableau','notes','messages'];
const titres=['Pads','Dés','Sons','Scénario','Combat','Tableau','Notes','Messages'];
const fichiers=process.argv.slice(2).length?process.argv.slice(2):noms.flatMap(n=>[n+'-telephone',n+'-paysage']);
for(const fichier of fichiers){
 try{await access(new URL(fichier+'-original.html',dossier));}catch(e){if(e.code==='ENOENT')continue;throw e;}
 const [nom,format]=fichier.split('-');
 const dom=new JSDOM(await readFile(new URL(fichier+'-original.html',dossier),'utf8'));
 const d=dom.window.document;
 // Les exports bruts ajoutent des matricules et fonctions fictives. La version locale
 // reconstruit leurs panneaux/commandes avec le vocabulaire et les états exacts du T0.
 for(const n of d.head.querySelectorAll('script,style,link'))n.remove();
 d.documentElement.className='';d.documentElement.lang='fr';
 d.querySelector('meta[name=viewport]').setAttribute('content','width=device-width, initial-scale=1, viewport-fit=cover');
 d.title=`GM Remote — ${titres[noms.indexOf(nom)]} — proposition T3`;
 const css=d.createElement('link');css.rel='stylesheet';css.href='meneur.css';d.head.append(css);
 const police=d.createElement('link');police.rel='stylesheet';police.href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&family=Orbitron:wght@600;700;800&display=swap';d.head.append(police);
 d.body.className='';d.body.dataset.ecran=nom;d.body.dataset.format=format;
 d.body.innerHTML=`<div id="cadre" class="${format}"><header aria-label="Ligne d’état"><div class="statut" id="informations"></div><button id="couper" class="couper" aria-label="Couper le son — maintenir appuyé" title="Maintenir 700 ms"><span>Couper le son</span></button></header><main aria-label="${titres[noms.indexOf(nom)]}"></main><nav id="navigation" aria-label="Navigation du meneur">${format==='paysage'?'<span class="marque">GM Remote</span>':''}${noms.map((n,i)=>`<a href="${n}-${format}.html" role="button" ${n===nom?'aria-current="page"':''}>${titres[i]}</a>`).join('')}</nav></div><div id="jet" class="surcouche hidden"></div>`;
 const script=d.createElement('script');script.textContent='const donnees='+JSON.stringify(donnees).replaceAll('<','\\u003c')+';\n'+comportement;d.body.append(script);
 await writeFile(new URL(fichier+'.html',dossier),dom.serialize());console.log(fichier);
}
