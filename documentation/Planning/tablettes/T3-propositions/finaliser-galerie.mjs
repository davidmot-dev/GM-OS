import { readFile, writeFile } from 'node:fs/promises';

const dossier = new URL('.', import.meta.url);
const echapper = valeur => valeur.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const messages = [];
const manifeste = [];
for (const nom of ['accueil-telephone', 'accueil-paysage', 'direct-telephone', 'direct-paysage', 'inventaire-telephone', 'inventaire-paysage', 'cartes-telephone', 'cartes-paysage', ...['archives','pnj','lieux','messages','notifications'].flatMap(n=>[`${n}-telephone`,`${n}-paysage`])]) {
  try { await readFile(new URL(`${nom}-reponse.json`, dossier), 'utf8'); }
  catch (erreur) { if (erreur.code === 'ENOENT') continue; throw erreur; }
  const reponse = JSON.parse(await readFile(new URL(`${nom}-reponse.json`, dossier), 'utf8')).result.structuredContent;
  const ecran = reponse.outputComponents.flatMap(composant => composant.design?.screens || [])[0];
  manifeste.push({ nom, projet: reponse.projectId, session: reponse.sessionId, ecran: ecran.name,
    designSystem: ecran.designSystem?.name, titre: ecran.title,
    original: `${nom}-original.html`, proposition: `${nom}.html` });
  messages.push(`<h3>${echapper(nom)}</h3>`);
  for (const composant of reponse.outputComponents) {
    if (composant.text) messages.push(`<pre>${echapper(composant.text)}</pre>`);
    if (composant.suggestion) messages.push(`<p>Suggestion de Stitch : ${echapper(composant.suggestion)}</p>`);
  }
}
const index = new URL('index.html', dossier);
let html = await readFile(index, 'utf8');
html = html.replace(/<div id="messages">[\s\S]*?<\/div><\/details>/, `<div id="messages">${messages.join('\n')}</div></details>`);
await writeFile(index, html);
await writeFile(new URL('ecrans.json', dossier), JSON.stringify(manifeste, null, 2));
