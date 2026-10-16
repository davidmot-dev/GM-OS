/** Compile un HTML autonome dans scratch/, sans serveur et sans installer de paquet. */
import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const ici = path.dirname(fileURLToPath(import.meta.url));
const sortie = fileURLToPath(new URL('../../../scratch/lcars-v1/', import.meta.url));
const resultat = await build({ entryPoints: [path.join(ici, 'atelier.mjs')], bundle: true, write: false,
  format: 'iife', platform: 'browser', define: { 'process.env.NODE_ENV': '"production"' } });
const css = await readFile(path.join(ici, 'style.css'), 'utf8');
const script = resultat.outputFiles[0].text.replaceAll('</script', '<\\/script');
const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>LCARS — atelier du module de test</title><style>
html{color-scheme:dark}body{margin:0;padding:clamp(8px,2vw,22px);background:#11121a;color:#e1dded;font:15px/1.5 Arial,sans-serif}main{max-width:1280px;margin:auto}.atelier-transfert{padding:16px;border:1px solid #88749f;margin:16px 0;border-radius:8px;overflow-wrap:anywhere}.atelier-transfert button,.atelier-transfert input{min-height:44px;padding:8px 12px;font:inherit;max-width:100%}.atelier-transfert button{margin:8px}.atelier-transfert label{display:flex;flex-direction:column}
.atelier-lcars{display:flex;flex-wrap:wrap;align-items:center;gap:14px;margin-bottom:18px;padding:12px 0}.atelier-lcars>div{flex:1 1 260px}.atelier-lcars p{margin:4px 0;font-size:13px;color:#b5afc4}.atelier-lcars label{display:flex;flex-direction:column;gap:6px;font-size:13px}.atelier-lcars button,.atelier-lcars select{font:inherit;min-height:44px;padding:8px 12px;background:#292436;color:#e1dded;border:1px solid #9c85b9;border-radius:6px;max-width:100%}.atelier-lcars :focus-visible{outline:3px solid #ffcc99;outline-offset:3px}
${css}</style></head><body><div id="atelier"></div><script>${script}</script></body></html>`;
await mkdir(sortie, { recursive: true });
const fichier = path.join(sortie, 'apercu.html');
await writeFile(fichier, html, 'utf8');
console.log(`Atelier LCARS : ${fichier}`);
if (process.argv.includes('--capturer')) {
  const { verifierInterface } = await import('./verification-interface.mjs');
  const parties = process.argv.includes('--medias-stockage') ? ['medias', 'stockage'] : process.argv.includes('--stockage') ? ['stockage'] : undefined;
  await verifierInterface({ url: pathToFileURL(fichier).href, sortie, parties });
}
