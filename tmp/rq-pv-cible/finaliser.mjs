import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const p = 'documentation/Planning/2026-10-20-ameliorations-tous-les-pilotes.md';
let t = fs.readFileSync(p, 'utf8');
t = t.replaceAll('contrôlé  **Fonctions', 'contrôlé. **Fonctions')
    .replaceAll('Hub éprouvés  **Fonctions', 'Hub éprouvés. **Fonctions')
    .replaceAll('trois Hub  **Fonctions', 'trois Hub. **Fonctions');
t = t.replaceAll("**Reste :** l'essai de David. À la table, par choix :", '**Reste :** les propositions ci-dessus ; les fonctions livrées ont été validées par David le 01/11. À la table, par choix :');
t = t.replace('**Reste et sujets à auditer :** l’essai de David (réimport avec **Remplacer**) ; non automatisés :', '**Reste et sujets à auditer :** les fonctions livrées sont validées par David le 01/11 ; non automatisés :');
t = t.replace('Les essais de David et du matériel restent à faire.', 'Validation globale de David le 01/11 ; les résultats détaillés par appareil ne sont pas fournis.');
t = t.replace('laboratoires, 22 PJ pour les trois joueurs, 64 cas humains NON TESTÉS ; 72 tests passent,', 'laboratoires, 22 PJ pour les trois joueurs, 64 cas humains NON TESTÉS dans le rapport initial ; validation globale de David le 01/11 ; 72 tests passent,');
t = t.replace('**GM-05 confirmé en échec** : douze secrets de séance transmis, assertion conservée.', '**GM-05 confirmé dans le rapport initial** : douze secrets de séance transmis, assertion historique conservée ; corrigé et validé au § 200.');
t = t.replace('fiche HTML sauvegardée. **GM-05 confirmé : secrets de séance transmis aux Hub**, assertion\nfinale conservée en échec.', 'fiche HTML sauvegardée. **GM-05 confirmé dans le rapport initial : secrets de séance transmis aux Hub**, assertion\nfinale conservée en échec historique ; corrigé et validé au § 200.');
t = t.replace('**GM-05 seul échec : douze chemins de secrets de séance**, § 1 bis.', '**GM-05 seul échec du rapport initial : douze chemins de secrets de séance**, corrigé et validé au § 200.');
fs.writeFileSync(p, t);

const registre = 'documentation/Planning/2026-08-23-chantiers-gares.md';
let r = fs.readFileSync(registre, 'utf8');
for (const n of [187, 188, 193, 197]) {
    const motif = new RegExp(`(### ${n} ·[^\\n]+\\n)`);
    assert(motif.test(r));
    r = r.replace(motif, '$1\n> **Suivi du 01/11 :** fonctions livrées validées globalement par David ; historique de livraison ci-dessous conservé. État courant dans la synthèse des pilotes et au § 201.\n');
}
r = r.replace('| L’essai de David |', '| Validé globalement par David le 01/11 ; extensions séparées |');
r = r.replace('| L\'essai de David |', '| Validé globalement par David le 01/11 ; extensions séparées |');
// Ne pas appliquer ce remplacement aux autres jeux : seules les lignes des quatre nouveaux pilotes sont visées.
// Rétablir les lignes hors de leur périmètre depuis l'état lu avant cette transformation.
const avant = fs.readFileSync(registre, 'utf8');
r = r.split('\n').map(ligne => {
    if (!ligne.startsWith('| ') || !ligne.includes('Validé globalement par David le 01/11 ; extensions séparées')) return ligne;
    if (/\*\*(?:Shadowrun|Chroniques Oubliées|Degenesis|RuneQuest)/.test(ligne)) return ligne;
    const id = ligne.split('|')[1];
    return avant.split('\n').find(l => l.startsWith('|' + id + '|')) ?? ligne;
}).join('\n');
fs.writeFileSync(registre, r);

const empreinte = fichier => crypto.createHash('sha256').update(fs.readFileSync(fichier)).digest('hex');
const sortie = 'output/verification-runequest-pv-cible';
fs.mkdirSync(sortie, { recursive: true });
const avantTests = JSON.parse(fs.readFileSync('tmp/rq-pv-cible/avant.json'));
const apresTests = JSON.parse(fs.readFileSync('tmp/rq-pv-cible/apres.json'));
const manuel = JSON.parse(fs.readFileSync('tmp/rq-pv-cible/manuel.json'));
const sources = [
    'src/modules/session/components/fields/RuneQuestAuJet.tsx',
    'src/modules/session/components/fields/PanneauDeJet.tsx',
    'src/modules/session/components/fields/PanneauDeJet.runequest.test.tsx',
    'e2e/capturesDesJeux.spec.ts',
    'outils/runequest/finir_runequest.py',
    'tmp/rq-pv-cible/pilotes/RQ.gmos-driver',
];
const rapport = {
    date: '2026-11-01', lot: 'RQ-A2', statut: 'livré, nouvel essai de David attendu',
    avant: { passes: avantTests.numPassedTests, echecs: avantTests.numFailedTests },
    apres: { passes: apresTests.numPassedTests, echecs: apresTests.numFailedTests, fichiers: 3 },
    panneauEtManuel: { passes: manuel.numPassedTests, echecs: manuel.numFailedTests, doublonsPanneau: 16 },
    lint: 'réussi, quatre fichiers', buildEtTypes: 'npm run build (tsc -b && vite build) réussi',
    electron: { reussite: true, tests: 1, dureeTotaleSecondes: 27.4,
        commande: 'npx playwright test e2e/capturesDesJeux.spec.ts --grep RuneQuest --workers=1 --reporter=list',
        assertions: ['Broo : 7 PV maximum', 'Guerrier : 3 PV maximum', 'D20 inchangé au changement de cible', 'sans cible : invitation explicite'],
        pilote: '2.1.0, 320 champs, reconstruit sous tmp depuis 2.0.0 et le générateur existant ; aucune archive de campagne remplacée' },
    sources: Object.fromEntries(sources.map(f => [f, empreinte(f)])),
    captures: Object.fromEntries(fs.readdirSync(sortie + '/captures').map(n => [n, empreinte(sortie + '/captures/' + n)])),
    captureExamineeEtCopiee: 'jeu-runequest-suites.jpg',
    limites: ['Les valeurs montrées sont les PV maximum de la fiche, pas les PV restants.', 'RQ-A1 : recette 2.1.0 encore à faire.', 'GM-05 et fonctions précédemment livrées validés globalement par David ; aucun résultat par appareil inventé.'],
};
fs.writeFileSync(sortie + '/verification.json', JSON.stringify(rapport, null, 2) + '\n');
fs.writeFileSync(sortie + '/RAPPORT.md', `# RuneQuest — PV de la cible, 01/11/2026

RQ-A2 livré, nouvel essai de David attendu. La ligne de cible montre ses PV maximum de zone et se met à jour au changement de cible ; valeurs manquantes inconnues, zéro conservé. Localisation et journal sans PV du lanceur.

Régression avant correction : 7 tests verts, 9 rouges. Après : 89 tests passent sur trois fichiers ; 42 tests panneau/manuel passent (dont 16 déjà comptés). Lint ciblé et compilation/types réussis. Un essai Electron isolé RuneQuest passe en 27,4 s : deux cibles 7/3 PV, changement sans nouveau D20, sélection vide explicite ; fiche HTML et coups localisés joués aussi.

Capture examinée : [suites du jet](captures/jeu-runequest-suites.jpg), copiée dans le manuel. Les autres images accompagnent le parcours sans remplacer les captures existantes. Empreintes dans [verification.json](verification.json).

Le pilote 2.1.0 de 320 champs a été reconstruit uniquement sous tmp avec le générateur existant depuis le pilote 2.0.0 du lot de recette. Les trois archives restent en 2.0.0 ; leur alignement est RQ-A1. Aucun profil ou fichier personnel consulté ; isolement via lancerGmOs, aucun paquet ni Git d’écriture.
`);

// Compteurs, unicité des lots et liens locaux des documents courants.
for (const [nom, prefixe] of Object.entries({ RuneQuest: 'RQ', Degenesis: 'DEG', 'Chroniques Oubliées Contemporain': 'COC', 'Shadowrun Anarchy': 'SR' })) {
    const section = t.split('## ' + nom + '\n')[1].split('\n## ')[0];
    const compte = ['🟢', '🟠', '🔴'].map(c => section.split('\n').filter(l => l.startsWith('| ' + c)).length);
    assert(t.split('\n').find(l => l.startsWith('| [' + nom + ']')).includes(`🟢 ${compte[0]} · 🟠 ${compte[1]} · 🔴 ${compte[2]}`));
    for (let i = 1; i <= 6; i++) assert.equal(section.split('\n').filter(l => /^\| [🟢🟠🔴]/u.test(l) && l.includes(prefixe + '-A' + i + ' —')).length, 1);
    console.log(nom, compte);
}
assert(t.includes('- [x] **NP-C1'));
assert(t.includes('- [ ] **RQ-A2'));
assert.equal((r.match(/### 201 ·/g) ?? []).length, 1);
const documents = [p, 'documentation/Planning/2026-11-01-etat-et-reprise-codex-runequest-pv-cible.md', sortie + '/RAPPORT.md'];
let liens = 0;
for (const fichier of documents) {
    for (const m of fs.readFileSync(fichier, 'utf8').matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)) {
        if (/^(?:https?:|#)/.test(m[1])) continue;
        assert(fs.existsSync(path.resolve(path.dirname(fichier), decodeURIComponent(m[1]))), 'Lien : ' + m[1]);
        liens++;
    }
}
console.log('Liens locaux vérifiés :', liens);
