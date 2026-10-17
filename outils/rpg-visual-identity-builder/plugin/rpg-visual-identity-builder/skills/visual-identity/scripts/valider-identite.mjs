import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

/** Contrôle formel ; langue, sujets et références demandent une lecture. */
export function validerIdentite(text){
 const errors=[],lines=String(text).trim().split(/\r?\n/),values={};
 if(lines.length!==2)errors.push('Le bloc doit contenir exactement deux lignes : STYLE: puis AVOID:.');
 for(const [i,label,max]of [[0,'STYLE',60],[1,'AVOID',15]]){
  const prefix=label+':';
  if(!lines[i]?.startsWith(prefix)){errors.push(`La ligne ${i+1} doit commencer par ${prefix}`);continue;}
  const value=lines[i].slice(prefix.length).trim(),words=value?value.split(/\s+/u).length:0;
  values[label]={text:value,words,max};
  if(!value)errors.push(`${label} ne doit pas être vide.`);
  if(words>max)errors.push(`${label} : ${words} mots, maximum ${max}.`);
 }
 return {valid:errors.length===0,values,errors};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 try{
  const file=process.argv[2];let text='';
  if(file&&file!=='-')text=await fs.readFile(file,'utf8');
  else if(process.stdin.isTTY)throw Error('Usage : node valider-identite.mjs <fichier.txt | -> ; ou transmettre le bloc sur l’entrée standard.');
  else{process.stdin.setEncoding('utf8');for await(const chunk of process.stdin)text+=chunk;}
  const result=validerIdentite(text);console.log(JSON.stringify(result,null,2));if(!result.valid)process.exitCode=1;
 }catch(error){console.error(error.message);process.exitCode=2;}
}
