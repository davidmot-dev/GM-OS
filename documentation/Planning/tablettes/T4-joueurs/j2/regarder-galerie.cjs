// Offline browser review of the actual captures, without a network service.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const formats = ['petit-telephone', 'telephone', 'portrait', 'paysage'];
const groupes = {
    archives: ['archives', 'archives-bas', 'archives-lecture', 'archives-lecture-bas', 'archives-vide'],
    pnj: ['pnj', 'pnj-bas', 'pnj-lecture', 'pnj-lecture-bas', 'pnj-vide'],
    lieux: ['lieux', 'lieux-bas', 'lieux-lecture', 'lieux-lecture-bas', 'lieux-vide'],
    messagerie: ['messagerie', 'destinataires', 'messagerie-generale', 'messagerie-privee'],
    notes: ['notes', 'feedback', 'feedback-bas', 'feedback-transmis'],
    notifications: ['notification-message', 'alerte', 'notification-systeme'],
};
(async () => {
    const browser = await chromium.launch({ channel: 'msedge' });
    try {
        const page = await browser.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 1 });
        const erreurs = [];
        page.on('pageerror', e => erreurs.push(e.message));
        const galerie = path.join(__dirname, 'index.html');
        await page.goto('file:///' + galerie.replaceAll('\\', '/'));
        let vues = 0;
        for (const [ecran, etats] of Object.entries(groupes)) for (const format of formats) {
            await page.locator(`[data-ecran="${ecran}"]`).click();
            await page.locator(`[data-format="${format}"]`).click();
            for (let i = 0; i < etats.length; i++) {
                await page.locator('#etats button').nth(i).click();
                await page.locator('#capture').evaluate(async img => { await img.decode(); });
                const attendu = format + '-' + etats[i] + '.png';
                if (!(await page.locator('#original').getAttribute('href')).endsWith(attendu)) throw new Error('Wrong image: ' + attendu);
                vues++;
            }
        }
        if (erreurs.length) throw new Error(erreurs.join('\n'));
        const revues = path.join(__dirname, 'revues');
        fs.mkdirSync(revues, { recursive: true });
        for (const [ecran, etats] of Object.entries(groupes)) {
            const figures = etats.flatMap(etat => formats.map(format => {
                const fichier = format + '-' + etat + '.png';
                const image = fs.readFileSync(path.join(__dirname, fichier)).toString('base64');
                return `<figure><figcaption>${fichier}</figcaption><img src="data:image/png;base64,${image}"></figure>`;
            })).join('');
            await page.setContent(`<html><style>body{margin:12px;background:#202733;color:#fff;font:12px system-ui}main{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}figure{margin:0}img{width:100%;height:auto;display:block}figcaption{min-height:32px}</style><main>${figures}</main></html>`);
            await page.locator('img').evaluateAll(imgs => Promise.all(imgs.map(img => img.decode())));
            await page.screenshot({ path: path.join(revues, ecran + '.png'), fullPage: true });
        }
        fs.writeFileSync(path.join(__dirname, 'galerie-controles.json'), JSON.stringify({ vues, erreurs, groupes, formats, planches: Object.keys(groupes).map(g => 'revues/' + g + '.png') }, null, 2));
        console.log(vues + ' captures ouvertes sans erreur dans la galerie ; 6 planches generees.');
    } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
