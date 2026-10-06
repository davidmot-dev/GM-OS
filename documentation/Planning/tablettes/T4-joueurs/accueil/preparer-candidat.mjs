// Prépare du code à relire hors src/. N'applique rien et ne lance pas GM-OS.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import ts from 'typescript';
import {ESLint} from 'eslint';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const dossier=new URL('.',import.meta.url);
const source=new URL('../../../../../src/components/hub/LobbyOnboarding.tsx',dossier);
const original=await readFile(source,'utf8');
const marqueur='    // --- RENDER: SELECTION (Character Grid) ---';
const debut=original.indexOf(marqueur),fin=original.indexOf('\n});',debut);
if(debut<0||fin<0)throw Error('La structure source a changé : relire avant de préparer.');
const proposition=original.slice(0,debut).replace('Bouton, EnTeteDeModule, Etiquette, Panneau','Bouton, EnTeteDeModule, Etiquette, Panneau, GabaritDeModule')
    +await readFile(new URL('selection-proposee.tsx.txt',dossier),'utf8')+original.slice(fin);
const candidat=proposition.replace('catch (_e)', 'catch');
await writeFile(new URL('LobbyOnboarding.candidat.tsx.txt',dossier),candidat);
const transpilation=ts.transpileModule(candidat,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022},reportDiagnostics:true});
if(transpilation.diagnostics?.length)throw Error(ts.formatDiagnosticsWithColorAndContext(transpilation.diagnostics,{getCurrentDirectory:()=>process.cwd(),getNewLine:()=> '\n',getCanonicalFileName:f=>f}));
const lint=await new ESLint().lintText(candidat,{filePath:fileURLToPath(source)});
if(lint.some(r=>r.errorCount))throw Error(JSON.stringify(lint.flatMap(r=>r.messages)));
// Vérifier aussi les types avec le candidat en mémoire à la place de la source.
// Le compilateur lit le reste du dépôt ; il n'émet aucun fichier.
const racine=fileURLToPath(new URL('../../../../../',dossier));
const config=ts.readConfigFile(resolve(racine,'tsconfig.app.json'),ts.sys.readFile);
const parse=ts.parseJsonConfigFileContent(config.config,ts.sys,racine);
const options={...parse.options,incremental:false,noEmit:true};delete options.tsBuildInfoFile;
const host=ts.createCompilerHost(options),lire=host.readFile;
const cible=resolve(fileURLToPath(source)).toLowerCase();
host.readFile=f=>resolve(f).toLowerCase()===cible?candidat:lire(f);
const programme=ts.createProgram(parse.fileNames,options,host);
if(programme.getSourceFile(fileURLToPath(source))?.text!==candidat)throw Error('Le candidat ne remplace pas la source en mémoire.');
const diagnostics=ts.getPreEmitDiagnostics(programme);
if(diagnostics.length)throw Error(ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCurrentDirectory:()=>racine,getNewLine:()=> '\n',getCanonicalFileName:f=>f}));
await writeFile(new URL('candidat-controles.json',dossier),JSON.stringify({source:'src/components/hub/LobbyOnboarding.tsx',sha256Source:createHash('sha256').update(original).digest('hex'),syntaxe:true,typageEnMemoire:true,eslint:lint.map(r=>({erreurs:r.errorCount,avertissements:r.warningCount})),applique:false,synchronisationValidee:false},null,2));
console.log('Candidat rédigé hors src/ ; syntaxe TSX, types et ESLint vérifiés. Aucun code de l’application modifié.');
