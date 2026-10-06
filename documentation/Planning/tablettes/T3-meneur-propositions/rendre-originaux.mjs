import {chromium} from '@playwright/test';
import {mkdir,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const dossier=new URL('.',import.meta.url);await mkdir(new URL('rendus/',dossier),{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
try{for(const nom of process.argv.slice(2)){
 const format=nom.endsWith('paysage')?'paysage':'telephone';const p=await browser.newPage({viewport:format==='paysage'?{width:1180,height:820}:{width:390,height:844}});
 await access(new URL(nom+'-original.html',dossier));await p.goto(new URL(nom+'-original.html',dossier).href,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
 await p.screenshot({path:fileURLToPath(new URL('rendus/'+nom+'-original.png',dossier))});await p.close();console.log(nom);
}}finally{await browser.close();}
