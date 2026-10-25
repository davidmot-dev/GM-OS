import fs from 'node:fs';
import { registerHooks } from 'node:module';
import assert from 'node:assert/strict';
registerHooks({
    resolve(s, c, suivant) { try { return suivant(s, c); } catch (e) { if (s.startsWith('.') && !s.split('/').at(-1).includes('.')) { for (const fin of ['.ts', '/index.ts']) { try { return suivant(s + fin, c); } catch { /* autre résolution */ } } } throw e; } },
    load(url, c, suivant) { return url.endsWith('.json') ? { format: 'module', source: `export default ${fs.readFileSync(new URL(url), 'utf8')};`, shortCircuit: true } : suivant(url, c); },
});
const { controlerLePilote } = await import('../../src/modules/forge/rules/controlesDuPilote.ts');
const { gameDriver, sheetTemplate } = JSON.parse(fs.readFileSync('tmp/noc-fin/pilote-corrige.json', 'utf8'));
const constats = controlerLePilote(gameDriver, sheetTemplate);
fs.writeFileSync('tmp/noc-fin/controle-pilote.json', JSON.stringify(constats, null, 2));
assert.equal(constats.filter(c => c.gravite === 'erreur').length, 0, JSON.stringify(constats));
assert.equal(gameDriver.jet.destin.desSurDixAuChoix, true);
assert.equal(gameDriver.franchissements.length, 4);
assert.ok(!sheetTemplate.sections.flatMap(s => s.fields).some(f => f.id === 'pv' || f.id === 'endurance'));
console.log(JSON.stringify({ version: gameDriver.version, constats }));
