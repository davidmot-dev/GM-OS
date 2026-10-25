/** Reconstruit l'export Dune corrigé sans lire les campagnes installées. */
import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';
import { DEFAULT_GAME_DRIVERS } from '../src/data/defaultGameDrivers.ts';
import { DEFAULT_SHEET_TEMPLATES } from '../src/data/defaultSheetTemplates.ts';

const source = path.resolve(process.argv[2] ?? 'Export Dirvers/Dune_driver_gmos_1792659586664.gmos-driver');
const sortie = path.resolve('Export Dirvers/corriges/Dune_driver_gmos_2.0.0.gmos-driver');
if (source === sortie) throw new Error('La source doit rester intacte.');
const zip = new AdmZip(source), etat = JSON.parse(zip.readAsText('state.json'));
const reference = structuredClone(DEFAULT_GAME_DRIVERS.find(d => d.id === 'dune'));
const fiche = etat.sheetTemplate;
if (!fiche?.sections || etat.gameDriver?.corpusId !== 'dune') throw new Error('Export Dune avec fiche requis.');
const tous = () => fiche.sections.flatMap(s => s.fields);
const section = id => fiche.sections.find(s => s.fields.some(f => f.id === id))?.id;
const trouver = (...ids) => ids.find(id => tous().some(f => f.id === id));
const ajouter = (id, label, type = 'textarea', defaultValue = '') => {
    if (!tous().some(f => f.id === id)) fiche.sections.at(-1).fields.push({ id, label, type, defaultValue });
    return id;
};
// Garder les clés de l'export : mob, rhetoric, devotion, faith et truth ont déjà des porteurs.
const competences = ['analyse', 'combat', 'discipline', trouver('mobilite', 'mob'), trouver('rhetorique', 'rhetoric')];
const principes = [trouver('devoir', 'devotion'), 'domination', trouver('foi', 'faith'), 'justice', trouver('verite', 'truth')];
if ([...competences, ...principes].some(id => !id || !tous().some(f => f.id === id))) throw new Error('Compétences ou principes manquants.');
const r = reference.jet.dune;
Object.assign(r, { competences, principes, progression: trouver('progression') || ajouter('progression', 'Points de progression', 'number', 0),
    specialisations: trouver('specialisations', 'specializations') || ajouter('specialisations', 'Spécialisations'),
    talents: trouver('talents') || ajouter('talents', 'Talents'), traits: trouver('traits', 'personal_traits') || ajouter('traits', 'Traits'),
    atouts: trouver('atouts', 'assets') || ajouter('atouts', 'Atouts') });
for (const s of fiche.sections) s.fields = s.fields.filter(f => f.id !== 'hp');
Object.assign(tous().find(f => f.id === 'determination'), { type: 'gauge', min: 0, max: 3 });
reference.jet.seuil[0].sectionId = section('combat'); reference.jet.seuil[1].sectionId = section(principes[0]);
reference.combat.tacheDeDefaite.sectionDuSeuil = section('combat');
// La grille métrique était une approximation : les zones du module portent désormais le conflit.
delete reference.tactical;
etat.gameDriver = { ...etat.gameDriver, ...reference, name: etat.gameDriver.name, templateId: fiche.id,
    defaultNotebookUrl: etat.gameDriver.defaultNotebookUrl, banniere: etat.gameDriver.banniere };
delete etat.gameDriver.tactical;
const manifeste = JSON.parse(zip.readAsText('manifest.json'));
Object.assign(manifeste, { bundleId: 'nexus-drv-dune-2.0.0-20261025', exportedAt: new Date().toISOString(), driverName: etat.gameDriver.name, gmosVersion: '6.5.0' });
// Reconstruire élimine le drapeau de descripteur de données de l'archive source :
// adm-zip updateFile le conservait sans recréer le descripteur, donc le ZIP ne se relisait plus.
const resultat = new AdmZip();
for (const entree of zip.getEntries()) {
    const donnees = entree.entryName === 'state.json' ? Buffer.from(JSON.stringify(etat, null, 2))
        : entree.entryName === 'manifest.json' ? Buffer.from(JSON.stringify(manifeste, null, 2)) : entree.getData();
    resultat.addFile(entree.entryName, donnees);
}
fs.mkdirSync(path.dirname(sortie), { recursive: true }); resultat.writeZip(sortie);
const relu = JSON.parse(new AdmZip(sortie).readAsText('state.json'));
if (relu.gameDriver.version !== '2.0.0' || relu.sheetTemplate.id !== fiche.id) throw new Error('Échec de relecture du corrigé.');
console.log(JSON.stringify({ sortie, version: etat.gameDriver.version, cles: r, champs: tous().length, reference: DEFAULT_SHEET_TEMPLATES.find(t => t.id === 'dune').id }, null, 2));
