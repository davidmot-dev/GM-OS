/** SR-A1/A2/A3 — David, 04/11/2026. Livre p. 60, 68-70, 170, 212, 217-218.
 * Garde les identifiants et les champs existants ; ne touche aucune donnée de personnage.
 * node outils/shadowrun-anarchy/ameliorer_shadowrun.mjs <export> <sortie>
 */
import AdmZip from 'adm-zip';
import fs from 'node:fs';
import path from 'node:path';
const [entree, sortie] = process.argv.slice(2);
if (!entree || !sortie || path.resolve(entree) === path.resolve(sortie)) throw new Error('Deux chemins distincts sont requis.');
const zip = new AdmZip(entree);
const etat = JSON.parse(zip.readAsText('state.json'));
const p = etat.gameDriver, t = etat.sheetTemplate;
if (p.corpusId !== 'shadowrun-anarchy' || !p.jet?.shadowrun || !p.combat?.moniteurDEtat) throw new Error('Exporter d’abord le pilote Shadowrun Anarchy 2.0 corrigé.');
const champs = t.sections.flatMap(s => s.fields);
const anarchy = champs.find(f => f.id === p.jet.shadowrun.anarchy);
if (anarchy) delete anarchy.max;
const ajouter = (section, champ) => { if (!champs.some(f => f.id === champ.id)) { t.sections.find(s => s.id === section).fields.push(champ); champs.push(champ); } };
const attributs = ['force', 'agilite', 'volonte', 'logique', 'charisme'];
for (let n = 1; n <= 11; n++) ajouter('competences', { id: `competence_${n}_reference`, label: `Compétence ${n} — attribut lié`, type: 'select', options: ['', ...attributs], defaultValue: '' });
for (const [id, label] of [['protection_principale', 'Protection physique principale'], ['protection_secondaire', 'Protection physique secondaire'], ['protection_mentale', 'Protection mentale']])
    ajouter('armures', { id, label: `${label} (indice explicite)`, type: 'number', defaultValue: '', min: 0 });
// Sans plafond artificiel : les mêmes nombres servent sur fiche, combat et tablette.
for (const id of ['piratage_des_de_risque', 'piratage_hausse_du_seuil']) {
    const f = champs.find(c => c.id === id); if (f) delete f.max;
}
p.combat.moniteurDEtat.suivi = true;
p.jet.shadowrun.suivi = structuredClone(p.combat.moniteurDEtat);
p.jet.shadowrun.matrice = { minimum: 'piratage_des_de_risque', hausse: 'piratage_hausse_du_seuil' };
p.jet.shadowrun.derives = {
    attributs,
    competences: Array.from({ length: 11 }, (_, i) => { const c = `competence_${i + 1}`; return { indice: c, attribut: `${c}_attribut`, reserve: `${c}_reserve`, reference: `${c}_reference` }; }),
    seuils: [['sans_armure', 'force'], ['principale', 'force', 'protection_principale'], ['secondaire', 'force', 'protection_secondaire'], ['mental', 'volonte', 'protection_mentale']].map(([famille, resistance, protection]) => ({
        resistance, ...(protection ? { protection } : {}), ...Object.fromEntries(['legere', 'grave', 'incapacitante'].map(g => [g, `seuil_${famille}_${g}`])),
    })),
};
p.version = '2.1.0';
zip.updateFile('state.json', Buffer.from(JSON.stringify(etat, null, 2)));
fs.mkdirSync(path.dirname(sortie), { recursive: true }); zip.writeZip(sortie);
console.log(`Shadowrun Anarchy ${p.version} : ${champs.length} champs → ${sortie}`);
