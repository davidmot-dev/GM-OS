const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

// Le fini a sa propre galerie : les captures des quatre lots T4 restent intactes.
(async () => {
  const fichiers = fs.readdirSync(__dirname).filter(f => f.endsWith('.png')).sort();
  const groupes = ['cyberpunk', 'medieval', 'modern', 'claire', 'mouvement-reduit', 'leger'];
  const figures = fichiers.map(f => `<figure data-groupe="${groupes.find(g => f.includes(g))}"><figcaption>${f.slice(0, -4)}</figcaption><a href="${f}"><img loading="lazy" src="${f}" alt="${f.slice(0, -4)}"></a></figure>`).join('');
  fs.writeFileSync(path.join(__dirname, 'index.html'), `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>T5 — Fini des tablettes</title><style>body{margin:20px;background:#182131;color:white;font:16px system-ui}h1{font-size:24px}a{color:#8cdeeb}button{min-height:44px;padding:8px 16px;cursor:pointer}nav{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}figure{margin:0;padding:12px;background:#263347;border-radius:8px}figcaption{min-height:60px;overflow-wrap:anywhere}img{display:block;width:100%;height:auto}figure[hidden]{display:none}</style><h1>T5 · Le fini des tablettes · 06/10/2026</h1><p>Varn, profils jetables, Edge. Focus clavier, quatre thèmes avec et sans personnalités ; graphismes légers et réduction des animations. Les vrais appareils restent en T6.</p><p><a href="../../2026-10-06-T5-fini-tablettes.md">Relevé T5</a> · <a href="../T4-meneur/m2/index.html">M2</a> · <a href="../T4-joueurs/j2/index.html">J2</a></p><nav><button data-filtre="tous">Tout</button>${groupes.map(g => `<button data-filtre="${g}">${g}</button>`).join('')}</nav><main>${figures}</main><script>document.querySelectorAll('[data-filtre]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('figure').forEach(f=>f.hidden=b.dataset.filtre!=='tous'&&f.dataset.groupe!==b.dataset.filtre)}))</script></html>`);
  const browser = await chromium.launch({ channel: 'msedge' });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    const erreurs = []; page.on('pageerror', e => erreurs.push(e.message));
    await page.goto('file:///' + path.join(__dirname, 'index.html').replaceAll('\\', '/'));
    for (const img of await page.locator('img').all()) { await img.scrollIntoViewIfNeeded(); await img.evaluate(e => e.decode()); }
    fs.mkdirSync(path.join(__dirname, 'revues'), { recursive: true });
    for (const groupe of groupes) {
      const photos = fichiers.filter(f => f.includes(groupe));
      await page.goto('about:blank');
      const vignettes = photos.map(f => `<figure><figcaption>${f.slice(0, -4)}</figcaption><img src="data:image/png;base64,${fs.readFileSync(path.join(__dirname, f)).toString('base64')}"></figure>`).join('');
      await page.setContent(`<html><style>body{margin:12px;background:#182131;color:white;font:14px system-ui}main{display:grid;grid-template-columns:repeat(6,1fr);gap:12px}figure{margin:0}img{width:100%;height:auto;display:block}figcaption{min-height:70px;overflow-wrap:anywhere}</style><main>${vignettes}</main></html>`, { waitUntil: 'domcontentloaded' });
      await page.locator('img').evaluateAll(es => Promise.all(es.map(e => e.decode())));
      await page.screenshot({ path: path.join(__dirname, 'revues', groupe + '.png'), fullPage: true });
    }
    fs.writeFileSync(path.join(__dirname, 'galerie-controles.json'), JSON.stringify({ captures: fichiers.length, erreurs, groupes, planches: groupes.map(g => 'revues/' + g + '.png') }, null, 2));
    if (erreurs.length) throw new Error(erreurs.join('\n'));
    console.log(`${fichiers.length} captures décodées ; six planches.`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
