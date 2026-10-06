const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const dossier = path.resolve(__dirname, '../../../User Guides/captures');
(async () => {
    const browser = await chromium.launch({ channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
        const groupes = ['tablette-des-joueurs', 'tablette-du-meneur'];
        fs.mkdirSync(path.join(__dirname, 'revues-manuel'), { recursive: true });
        const fichiers = [];
        for (const groupe of groupes) {
            const photos = fs.readdirSync(dossier).filter(f => f.startsWith(groupe) && f.endsWith('.jpg')).sort();
            fichiers.push(...photos);
            const figures = photos.map(f => `<figure><figcaption>${f}</figcaption><img src="data:image/jpeg;base64,${fs.readFileSync(path.join(dossier, f)).toString('base64')}"></figure>`).join('');
            await page.goto('about:blank');
            await page.setContent(`<html><style>body{margin:12px;background:#182131;color:white;font:14px system-ui}main{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}figure{margin:0}img{width:100%;height:auto;display:block}figcaption{min-height:42px}</style><main>${figures}</main></html>`, { waitUntil: 'domcontentloaded' });
            await page.locator('img').evaluateAll(es => Promise.all(es.map(e => e.decode())));
            await page.screenshot({ path: path.join(__dirname, 'revues-manuel', groupe + '.png'), fullPage: true });
        }
        fs.writeFileSync(path.join(__dirname, 'manuel-controles.json'), JSON.stringify({ jpeg: fichiers.length, erreurs: [], fichiers, planches: groupes.map(g => 'revues-manuel/' + g + '.png') }, null, 2));
        console.log(`${fichiers.length} JPEG décodés, deux planches.`);
    } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
