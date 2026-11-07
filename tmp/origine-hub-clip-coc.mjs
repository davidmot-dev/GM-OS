import fs from 'node:fs';const p='e2e/clipCoc.spec.ts';let s=fs.readFileSync(p,'utf8');
s=s.replace('await stage.setContent(`','const contenuStage=`');
s=s.replace('</iframe></div></html>`);','</iframe></div></html>`;await contexte.route(\'**/clip-coc-presentation.html\',route=>route.fulfill({contentType:\'text/html\',body:contenuStage}));stage.on(\'console\',m=>{if(m.type()===\'error\')console.error(\'[Hub du clip]\',m.text());});await stage.goto(`http://127.0.0.1:${g.ports.sync}/clip-coc-presentation.html`);');
fs.writeFileSync(p,s);
