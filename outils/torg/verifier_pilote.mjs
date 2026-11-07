import '../campagnes-de-recette/charger-typescript.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import AdmZip from 'adm-zip';
import { registerHooks } from 'node:module';
registerHooks({ load(url, contexte, suivant) {
    return url.endsWith('.json') ? { format: 'module', source: `export default ${fs.readFileSync(new URL(url), 'utf8')};`, shortCircuit: true } : suivant(url, contexte);
} });
const { controlerLePilote } = await import('../../src/modules/forge/rules/controlesDuPilote.ts');
const { preparerLeJet } = await import('../../src/modules/dice/DescripteurDeJet.ts');
const fichier = process.argv[2] ?? 'Export Dirvers/corriges/Torg-Eternity-2.0.0.gmos-driver';
const { gameDriver: pilote, sheetTemplate: fiche } = JSON.parse(new AdmZip(fichier).readAsText('state.json'));
const constats = controlerLePilote(pilote, fiche);
assert.deepEqual(constats, [], JSON.stringify(constats, null, 2));
const valeurs = Object.fromEntries(fiche.sections.flatMap(s => s.fields).map(f => [f.id, f.defaultValue]));
Object.assign(valeurs, { dexterite: 9, esquive: 2 });
// Le cas témoin est préparé par le vrai moteur ; les valeurs ne sont pas une recette privée.
const jet = preparerLeJet(pilote.jet, valeurs, { champs: { attribut: 'dexterite', competence: 'esquive' }, difficulte: 10, desSupplementaires: 0 }, fiche.sections);
fs.mkdirSync('output/torg-ameliorations', { recursive: true });
fs.writeFileSync('output/torg-ameliorations/controle-pilote.json', JSON.stringify({ fichier, version: pilote.version, constats, jet }, null, 2));
console.log(JSON.stringify({ version: pilote.version, constats, jet }));
