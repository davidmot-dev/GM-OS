/** Reconstruit le pilote NOC 2.0.0 depuis l'export fourni, sans lire le profil installé. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import AdmZip from 'adm-zip';
const source = path.resolve(process.argv[2] ?? 'Export Dirvers/NOC_driver_gmos_1792659675064.gmos-driver');
const sortie = path.resolve('Export Dirvers/corriges/NOC_driver_gmos_2.0.0.gmos-driver');
assert.notEqual(source, sortie);
const zip = new AdmZip(source), etat = JSON.parse(zip.readAsText('state.json')), pilote = etat.gameDriver, fiche = etat.sheetTemplate;
assert.equal(pilote.corpusId, 'noc');
assert.ok(pilote.jet?.destin && pilote.gestesDesHeros?.momentDeCalme);
pilote.version = '2.0.0';
pilote.dice.engine = 'pool';
Object.assign(pilote.jet.destin, { singularite: 'singularite', desSurDixAuChoix: true });
pilote.jet.reservesDuPersonnage.find(r => r.id === 'espoir').parPointSelon = { champ: 'ferveur', aPartirDe: 4 };
pilote.gestesDesHeros.entraideNocturne = true;
const effets = pilote.gestesDesHeros.effetsDuDebordement.effets;
effets.find(e => e.id === 'intervention').description = '+2 Noirceur par Héros ; la Loi répartit la Lumière dans les Auras avant application.';
delete effets.find(e => e.id === 'intervention').aDire;
delete effets.find(e => e.id === 'fatigue').aDire;
for (const effet of [
    { id: 'coup-du-sort', label: 'Coup du sort', description: 'L’action échoue de façon totale et critique, même si le niveau était suffisant.', aDire: 'La Loi décrit le coup du sort et ses conséquences ; le jet déjà affiché ne se réécrit pas automatiquement.' },
    { id: 'evenement', label: 'Événement inattendu', description: 'Déclencher l’effet néfaste particulier prévu par la Loi ou le scénario.', aDire: 'La Loi déclenche l’événement prévu.' },
]) if (!effets.some(e => e.id === effet.id)) effets.push(effet);
pilote.franchissements = ['blessures', 'trauma', 'traque', 'noirceur'].map(champ => ({
    id: `sequelle-${champ}`, champ, label: champ, aPartirDe: 8,
    rappel: 'Une séquelle devient permanente ; la Loi en détermine les conséquences (NOC p. 252–255).',
    mouvements: [{ champ: `sequelles_${champ}`, label: `Séquelles (${champ})`, delta: 1, max: 10 }],
}));
for (const s of fiche.sections) s.fields = s.fields.filter(f => !['pv', 'endurance'].includes(f.id));
const champs = fiche.sections.flatMap(s => s.fields);
if (!champs.some(f => f.id === 'faveur_max')) fiche.sections.find(s => s.id === 'reserves').fields.push({ id: 'faveur_max', label: 'Faveurs maximales (fiche imprimée)', type: 'number', defaultValue: 0 });
for (const f of champs) if (['blessures', 'trauma', 'traque', 'noirceur', 'espoir', 'singularite', 'vecu'].includes(f.id)) Object.assign(f, { min: 0, max: 10 });
// Le bilan explicitement narratif n'est pas transformé en dommage automatique.
pilote.description += ' Améliorations Nocturne du 25/10/2026 : choix de Singularité, entraide, Soupçon, Faveurs de Cabale et pistes numériques.';
const manifest = JSON.parse(zip.readAsText('manifest.json'));
Object.assign(manifest, { bundleId: 'nexus-drv-noc-2.0.0-20261025', exportedAt: new Date().toISOString(), driverName: pilote.name, gmosVersion: '6.5.0' });
const resultat = new AdmZip();
for (const e of zip.getEntries()) resultat.addFile(e.entryName, e.entryName === 'state.json' ? Buffer.from(JSON.stringify(etat, null, 2))
    : e.entryName === 'manifest.json' ? Buffer.from(JSON.stringify(manifest, null, 2)) : e.getData());
fs.mkdirSync(path.dirname(sortie), { recursive: true }); resultat.writeZip(sortie);
const relu = JSON.parse(new AdmZip(sortie).readAsText('state.json'));
assert.equal(relu.gameDriver.version, '2.0.0'); assert.equal(relu.sheetTemplate.id, fiche.id);
fs.mkdirSync('tmp/noc-fin', { recursive: true }); fs.writeFileSync('tmp/noc-fin/pilote-corrige.json', JSON.stringify(relu, null, 2));
console.log(JSON.stringify({ sortie, version: pilote.version, id: pilote.id, gabarit: fiche.id, franchissements: pilote.franchissements.length }));
