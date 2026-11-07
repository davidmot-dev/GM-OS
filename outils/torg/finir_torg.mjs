import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';

/**
 * TORG-A0/A1/A2/A3/A4, David le 07/11/2026.
 * Livre de base : échanges p. 113, Chef naturel p. 85, Occultiste p. 94,
 * Conscience environnementale p. 100, Aspect effrayant p. 105, Sbires p. 265.
 * Empire du Nil (v1) p. 17 : Ingénieux et Populaire.
 * Aucun Atout accordé par défaut ; les textes libres existants sont conservés.
 */
const source = process.argv[2] ?? 'Export Dirvers/Torg_driver_gmos_1792659632793.gmos-driver';
const sortie = process.argv[3] ?? 'Export Dirvers/corriges/Torg-Eternity-2.0.0.gmos-driver';
const zip = new AdmZip(source), etat = JSON.parse(zip.readAsText('state.json'));
const d = etat.gameDriver, t = etat.sheetTemplate;
if (d.id !== 'custom-1774618478256' || t.id !== 'tpl-1774618478258') throw new Error('Ce script attend le pilote et la fiche Torg exportés.');
const atouts = { aspectEffrayant: 'Aspect effrayant', occultiste: 'Occultiste', ingenieux: 'Ingénieux', populaire: 'Populaire', chefNaturel: 'Chef naturel', conscienceEnvironnementale: 'Conscience environnementale' };
const capacites = { sbires: 'Sbires', horde: 'Horde' };
d.version = '2.0.0';
d.torg = { raison: 'raison', sciencesHumaines: 'sciences_humaines', atouts: {}, capacites: {}, etats: {} };
const fields = [];
for (const [famille, noms] of Object.entries({ atouts, capacites, etats: { ko: 'KO (fin décidée par le meneur)', deconnecte: 'Déconnecté' } })) for (const [cle, nom] of Object.entries(noms)) {
    const id = `torg_${famille}_${cle}`;
    d.torg[famille][cle] = id;
    fields.push({ id, label: `${famille === 'atouts' ? 'Atout' : famille === 'etats' ? 'État' : 'Capacité'} : ${nom}`, type: 'checkbox', defaultValue: false });
}
const section = { id: 'torg_capacites', label: 'Atouts et capacités possédés', fields };
const i = t.sections.findIndex(s => s.id === section.id);
if (i < 0) t.sections.push(section); else t.sections[i] = section;
const domination = d.cosms?.flatMap(c => c.lois).find(l => l.nom === 'Loi de la Domination');
if (domination) domination.mecanique = 'domination';
const resultat = new AdmZip();
for (const e of zip.getEntries()) resultat.addFile(e.entryName, e.entryName === 'state.json' ? Buffer.from(JSON.stringify(etat, null, 2) + '\n') : e.getData());
fs.mkdirSync(path.dirname(sortie), { recursive: true });
resultat.writeZip(sortie);
console.log(JSON.stringify({ source, sortie, version: d.version, pilote: d.id, fiche: t.id, cases: fields.length }));
