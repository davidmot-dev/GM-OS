const fs = require('node:fs');
const cp = require('node:child_process');
const path = require('node:path');
const { ESLint } = require('eslint');
const fichiers = [
    ...['HubConsultation', 'HubLecture', 'HubArchives', 'HubTrombinoscope', 'HubAtlas', 'HubClueViewer', 'HubNpcViewer', 'HubAtlasViewer', 'HubMessenger', 'HubNotificationCenter'].map(n => 'src/components/hub/' + n + '.tsx'),
    'src/components/TabletHub.tsx', 'src/modules/session/components/PlayerPrivateNotes.tsx', 'src/modules/session/hooks/useHubSync.ts',
    'src/components/echapFermeLesSurcouches.test.ts',
    'e2e/tabletteJ2T4.spec.ts', 'e2e/tabletteJoueursT0.spec.ts', 'e2e/capturesDuManuel.spec.ts',
    'e2e/tabletteAccueilT4.spec.ts', 'e2e/tabletteDirectT4.spec.ts', 'e2e/tabletteJ1T4.spec.ts',
];
function compter(messages) {
    const comptes = new Map();
    for (const m of messages) {
        const cle = [m.ruleId, m.severity, m.message.split('\n')[0]].join('|');
        comptes.set(cle, (comptes.get(cle) || 0) + 1);
    }
    return comptes;
}
(async () => {
    const eslint = new ESLint();
    const resultats = [];
    for (const fichier of fichiers) {
        let ancien = '';
        try { ancien = cp.execFileSync('git', ['show', 'HEAD:' + fichier], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { /* New file */ }
        const [avant] = await eslint.lintText(ancien, { filePath: path.resolve(fichier) });
        const [apres] = await eslint.lintText(fs.readFileSync(fichier, 'utf8'), { filePath: path.resolve(fichier) });
        const base = compter(avant.messages), courant = compter(apres.messages);
        const nouveaux = [...courant].filter(([cle, n]) => n > (base.get(cle) || 0)).map(([diagnostic, nombre]) => ({ diagnostic, nombre: nombre - (base.get(diagnostic) || 0) }));
        resultats.push({ fichier, avant: avant.messages.length, apres: apres.messages.length, nouveaux });
    }
    const nouveaux = resultats.reduce((total, r) => total + r.nouveaux.reduce((n, d) => n + d.nombre, 0), 0);
    fs.writeFileSync(path.join(__dirname, 'lint-compare.json'), JSON.stringify({ reference: 'HEAD', fichiers: resultats, nouveaux }, null, 2));
    console.log(`${fichiers.length} fichiers compares a HEAD : ${nouveaux} nouveau(x) diagnostic(s).`);
    if (nouveaux) process.exitCode = 1;
})().catch(e => { console.error(e); process.exitCode = 1; });
