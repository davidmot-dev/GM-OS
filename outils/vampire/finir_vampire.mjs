// Le pilote Vampire : la Mascarade (V5) 2.0.0 — 17/11/2026, skill finir-un-pilote.
// Demande de David : « /finir-un-pilote Vampire », puis « l'ordre me convient » (tout, dans l'ordre).
// Part de l'export de David (Export Dirvers/Vampire_driver_gmos_*.gmos-driver), GARDE l'identifiant
// du pilote et de sa fiche, et écrit Export Dirvers/corriges/Vampire-2.0.0.gmos-driver, plus la
// correspondance docs/systems/vampire/fiche/correspondance.json.
//
// Source : Vampire : la Mascarade, livre de base français (docs/systems/vampire/livres.json), pages
// IMPRIMÉES ; page du PDF = imprimée + 4 (vérifié le 17/11 : « 117 » imprimé en PDF 121).
//
// Ce qui change, règle par règle :
//  - Le jet (p. 118-122) : le pilote forgé additionnait l'attribut et la compétence en un SEUIL par
//    dé, sur une réserve de base à zéro : aucun dé n'était lancé, trois réussites étaient exigées,
//    et rien ne le disait. Désormais une RÉSERVE de d10 (attribut + compétence, second attribut ou
//    discipline ; la compétence est facultative, p. 118), chaque 6 réussit, chaque paire de 10 vaut
//    quatre réussites (`jet.vampire`, src/modules/dice/systemes/vampire.ts). `critique: 2` (un dé
//    « ≤ 2 compte double ») et le coût en Volonté des dés achetés sont retirés : aucun dé ne s'achète.
//  - La difficulté (p. 119) : de 1 (Anodine) à 7 (Presque impossible), au-delà pour une opposition.
//  - Les dés de Soif (p. 205-207) : la Soif de la fiche remplace autant de dés ordinaires ;
//    triomphe brutal et échec bestial ; jamais de Soif sur un jet de Volonté ou d'Humanité.
//  - La Volonté (p. 122) : un point relance jusqu'à trois dés ordinaires, au panneau.
//  - Le test d'Exaltation (p. 211) : au panneau, la Soif monte sur un échec.
//  - Les attributs (p. 155-156) : la fiche forgée portait « Puissance, Finesse, Résistance, Social 1… » ;
//    elle porte Force, Dextérité, Vigueur, Charisme, Manipulation, Sang-froid, Intelligence, Astuce,
//    Résolution, aux clés de la fiche HTML.
//  - Les compétences (p. 159-171) : « Compétence 1 » à « Compétence 27 » deviennent les 27 du livre,
//    chacune avec le texte de ses spécialités, que le menu du jet affiche (« Mêlée — Couteaux »).
//  - Les disciplines (p. 243) : six emplacements, nom, niveau et pouvoirs, comme la fiche HTML ; une
//    discipline se lance par son nom (attribut + discipline, p. 118).
//  - Santé = Vigueur + 3, Volonté = Résolution + Sang-froid (p. 119) : deux jauges avec leur maximum.
//  - L'initiative (p. 300) : Sang-froid + Vigilance, sans jet. La formule forgée « sang-froid +
//    vigilance » visait des champs inexistants.
//  - La Soif de 0 à 5 (p. 205), l'Humanité de 0 à 10 (p. 239), la Puissance du sang de 0 à 10 (p. 215).
//
// Usage : node outils/vampire/finir_vampire.mjs [export.gmos-driver]
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import AdmZip from 'adm-zip';

const dossier = 'Export Dirvers';
const source = process.argv[2]
    ?? path.join(dossier, fs.readdirSync(dossier).filter(f => /^Vampire_driver.*\.gmos-driver$/.test(f)).sort().at(-1));
const zip = new AdmZip(source);
const etat = JSON.parse(zip.readAsText('state.json'));
const manifeste = JSON.parse(zip.readAsText('manifest.json'));
const { gameDriver: ancien, sheetTemplate: ancienneFiche } = etat;
assert.equal(ancien.id, 'custom-1794902116143', 'le pilote Vampire de David');
assert.equal(ancienneFiche.id, 'tpl-1794902116144', 'sa fiche');

// --- La fiche HTML : ses clés, pour la vérification croisée. ---
const html = fs.readFileSync('docs/fiches/Vampire/vampire-v5-fiche-personnage-interactive.html', 'utf8');
const gabarit = JSON.parse(html.match(/<script\b[^>]*\bid=["']character-sheet-template["'][^>]*>([\s\S]*?)<\/script>/i)[1]).template;
assert.equal(gabarit.id, 'vampire-v5-fr');
const zones = new Map();
for (const f of gabarit.pages.flatMap(p => p.fields)) if (!zones.has(f.key)) zones.set(f.key, f);

const n = (id, label, fiche, extra = {}) => ({ id, label, type: 'number', defaultValue: 0, fiche, ...extra });
const t = (id, label, fiche, extra = {}) => ({ id, label, type: 'text', defaultValue: '', fiche, ...extra });
const z = (id, label, fiche, extra = {}) => ({ id, label, type: 'textarea', defaultValue: '', fiche, ...extra });

// Les attributs (p. 155-156) : [id GM-OS, nom, clé HTML].
const ATTRIBUTS = [
    ['force', 'Force', 'strength'], ['dexterite', 'Dextérité', 'dexterity'], ['vigueur', 'Vigueur', 'stamina'],
    ['charisme', 'Charisme', 'charisma'], ['manipulation', 'Manipulation', 'manipulation'], ['sang_froid', 'Sang-froid', 'composure'],
    ['intelligence', 'Intelligence', 'intelligence'], ['astuce', 'Astuce', 'wits'], ['resolution', 'Résolution', 'resolve'],
];
// Les compétences (p. 159-171), dans l'ordre de la fiche : physiques, sociales, mentales.
const COMPETENCES = {
    physiques: [['armes_a_feu', 'Armes à feu', 'firearms'], ['artisanat', 'Artisanat', 'craft'], ['athletisme', 'Athlétisme', 'athletics'],
        ['bagarre', 'Bagarre', 'brawl'], ['conduite', 'Conduite', 'drive'], ['furtivite', 'Furtivité', 'stealth'],
        ['larcin', 'Larcin', 'larceny'], ['melee', 'Mêlée', 'melee'], ['survie', 'Survie', 'survival']],
    sociales: [['animaux', 'Animaux', 'animal_ken'], ['commandement', 'Commandement', 'leadership'], ['empathie', 'Empathie', 'insight'],
        ['etiquette', 'Étiquette', 'etiquette'], ['experience_de_la_rue', 'Expérience de la rue', 'streetwise'], ['intimidation', 'Intimidation', 'intimidation'],
        ['persuasion', 'Persuasion', 'persuasion'], ['representation', 'Représentation', 'performance'], ['subterfuge', 'Subterfuge', 'subterfuge']],
    mentales: [['erudition', 'Érudition', 'academics'], ['finances', 'Finances', 'finance'], ['investigation', 'Investigation', 'investigation'],
        ['medecine', 'Médecine', 'medicine'], ['occultisme', 'Occultisme', 'occult'], ['politique', 'Politique', 'politics'],
        ['sciences', 'Sciences', 'science'], ['technologie', 'Technologie', 'technology'], ['vigilance', 'Vigilance', 'awareness']],
};
assert.equal(Object.values(COMPETENCES).flat().length, 27, 'vingt-sept compétences (p. 159-171)');
for (const [, nom, cle] of Object.values(COMPETENCES).flat()) {
    const zone = zones.get(`skills.${cle}`);
    assert.ok(zone, `${nom} : skills.${cle} absente de la fiche HTML`);
    assert.ok(zone.label.startsWith(nom), `${nom} : la fiche HTML dit « ${zone.label} »`);
}
for (const [, nom, cle] of ATTRIBUTS) assert.ok(zones.get(`attributes.${cle}`)?.label.startsWith(nom), `${nom} : attributes.${cle}`);

const competences = (groupe, label) => ({ id: `competences_${groupe}`, label, fields: COMPETENCES[groupe].flatMap(([id, nom, cle]) => [
    // La spécialité PRÉCISE le nom au menu du jet (« Mêlée — Couteaux ») ; sans elle, la compétence reste proposée.
    n(id, nom, `skills.${cle}`, { max: 5, libelleSur: `${id}_specialites`, libelleEnPrecision: true }),
    t(`${id}_specialites`, `${nom} — spécialités`, `specialties.${cle}`),
]) });

const DISCIPLINES = [0, 1, 2, 3, 4, 5];
const AVANTAGES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const sections = [
    { id: 'identite', label: 'Identité', fields: [
        t('nom', 'Nom', 'identity.name'),
        t('concept', 'Concept', 'identity.concept'),
        t('predateur', 'Style de prédation', 'identity.predator'),
        t('chronique', 'Chronique', 'identity.chronicle'),
        t('ambition', 'Ambition', 'identity.ambition'),
        t('desir', 'Désir', 'identity.desire'),
        t('clan', 'Clan', 'identity.clan'),
        t('sire', 'Sire', 'identity.sire'),
        t('generation', 'Génération', 'identity.generation'),
    ] },
    // Les attributs vont de 1 à 5 (p. 155).
    { id: 'attributs', label: 'Attributs', fields: ATTRIBUTS.map(([id, nom, cle]) => n(id, nom, `attributes.${cle}`, { defaultValue: 1, max: 5 })) },
    competences('physiques', 'Compétences physiques'),
    competences('sociales', 'Compétences sociales'),
    competences('mentales', 'Compétences mentales'),
    // Une discipline se lance par son nom ; son niveau entre au groupement (p. 118, 243).
    { id: 'disciplines', label: 'Disciplines', fields: DISCIPLINES.flatMap(i => [
        t(`discipline_${i + 1}_nom`, `Discipline ${i + 1} — nom`, `disciplines.${i}.name`),
        n(`discipline_${i + 1}`, `Discipline ${i + 1}`, `disciplines.${i}.level`, { max: 5, libelleSur: `discipline_${i + 1}_nom` }),
        { ...z(`discipline_${i + 1}_pouvoirs`, `Discipline ${i + 1} — pouvoirs`, DISCIPLINES.slice(0, 5).map(p => `disciplines.${i}.powers.${p}`)), transforme: 'lignes' },
    ]) },
    // Santé = Vigueur + 3, Volonté = Résolution + Sang-froid : ce qui reste (p. 119).
    { id: 'jauges', label: 'Santé, Volonté, Soif, Humanité', fields: [
        { id: 'sante', label: 'Santé', type: 'gauge', defaultValue: 4, max: 10, fiche: undefined },
        { id: 'volonte', label: 'Volonté', type: 'gauge', defaultValue: 2, max: 10, fiche: undefined },
        n('soif', 'Soif', 'tracks.hunger', { defaultValue: 1, max: 5 }),
        n('humanite', 'Humanité', 'tracks.humanity', { defaultValue: 7, max: 10 }),
    ] },
    { id: 'sang', label: 'Le Sang', fields: [
        n('puissance_du_sang', 'Puissance du sang', 'blood.potency', { max: 10 }),
        t('resonance', 'Résonance', 'blood.resonance'),
        z('coup_de_sang', 'Coup de sang', 'blood.surge'),
        z('degats_regeneres', 'Dégâts régénérés', 'blood.mending'),
        z('bonus_aux_pouvoirs', 'Bonus aux pouvoirs', 'blood.power_bonus'),
        z('relance_exaltation', 'Relance du test d’Exaltation', 'blood.rouse_reroll'),
        z('penalite_nourriture', 'Pénalité pour se nourrir', 'blood.feeding_penalty'),
        z('score_de_fleau', 'Score de Fléau', 'blood.bane_severity'),
    ] },
    { id: 'croyances', label: 'Croyances', fields: [
        z('principes', 'Principes de la chronique', 'beliefs.tenets'),
        z('attaches_convictions', 'Attaches et Convictions', 'beliefs.touchstones_convictions'),
        z('fleau_de_clan', 'Fléau de clan', 'beliefs.clan_bane'),
    ] },
    { id: 'avantages', label: 'Avantages et handicaps', fields: AVANTAGES.flatMap(i => [
        t(`avantage_${i + 1}`, `Avantage ou handicap ${i + 1}`, `advantages.${i}.name`),
        n(`avantage_${i + 1}_niveau`, `Avantage ou handicap ${i + 1} — niveau`, `advantages.${i}.level`, { max: 5, libelleSur: `avantage_${i + 1}` }),
    ]) },
    { id: 'experience', label: 'Expérience', fields: [
        n('experience_totale', 'Expérience totale', 'experience.total'),
        n('experience_depensee', 'Expérience dépensée', 'experience.spent'),
    ] },
    { id: 'profil', label: 'Profil', fields: [
        t('age_veritable', 'Âge véritable', 'profile.true_age'),
        t('age_apparent', 'Âge apparent', 'profile.apparent_age'),
        t('date_de_naissance', 'Date de naissance', 'profile.birth_date'),
        t('date_de_deces', 'Date de décès', 'profile.death_date'),
        z('apparence', 'Apparence', 'profile.appearance'),
        z('signes_distinctifs', 'Signes distinctifs', 'profile.distinguishing_marks'),
        z('historique', 'Historique', 'profile.history'),
        z('notes', 'Notes', 'profile.notes'),
    ] },
];

// Chaque clé nommée existe dans la fiche HTML ; aucun identifiant GM-OS en double.
const tous = sections.flatMap(s => s.fields);
for (const f of tous) for (const cle of [f.fiche].flat().filter(Boolean)) assert.ok(zones.has(cle), `${f.id} : ${cle} absente de la fiche HTML`);
const ids = tous.map(f => f.id);
assert.equal(new Set(ids).size, ids.length, 'identifiants GM-OS en double');

const correspondance = tous.filter(f => f.fiche).map(f => ({ gmos: f.id, fiche: f.fiche, ...(f.transforme ? { transforme: f.transforme } : {}) }));
for (const f of tous) { delete f.fiche; delete f.transforme; }
const relues = new Set(correspondance.flatMap(l => [l.fiche].flat()));
const absents = [...zones.keys()].filter(k => !relues.has(k)).map(cle => ({
    fiche: cle,
    pourquoi: /^tracks\.(health|willpower)_capacity$/.test(cle) ? 'Maximum calculé par GM-OS depuis le pilote : Santé = Vigueur + 3, Volonté = Résolution + Sang-froid (statsToTrack[].max, p. 119).'
        : /^damage\.health\./.test(cle) ? 'Dégâts de Santé case par case, superficiels ( / ) ou aggravés ( X ) : tenus sur la fiche HTML ; GM-OS tient la Santé restante (p. 126).'
        : /^damage\.willpower\./.test(cle) ? 'Dégâts de Volonté case par case, superficiels ou aggravés : tenus sur la fiche HTML ; GM-OS tient la Volonté restante (p. 126, 157).'
        : 'Propre à la fiche HTML : GM-OS ne la lit ni ne l’écrit.',
}));

const fiche = { ...ancienneFiche, name: 'Fiche de Vampire (V5)', sections };

// --- Le pilote. ---
const ATTRIBUT = { id: 'attribut', label: 'Attribut ou jauge', sectionId: 'attributs', sectionsSupplementaires: ['jauges'],
    // Dans les jauges, la Volonté et l'Humanité se lancent ; la Santé et la Soif ne sont pas des groupements (p. 119, 205).
    motif: '^(?!(sante|soif)$)' };
const SECOND = { id: 'competence', label: 'Compétence, attribut ou discipline', sectionId: 'competences_physiques',
    sectionsSupplementaires: ['competences_sociales', 'competences_mentales', 'disciplines', 'attributs'],
    // « Un personnage qui ne possède pas une compétence donnée fait le jet uniquement avec l'attribut » (p. 118).
    facultative: true, motif: '^(?!discipline_\\d_pouvoirs$)' };

const pilote = {
    ...ancien,
    version: '2.0.0',
    dice: { defaultDice: '1d10', logic: 'count-success', engine: 'standard', successThreshold: 6 },
    jet: {
        reserve: { base: 0, max: 30, sansPlafond: true, faces: 10, composantes: [ATTRIBUT, SECOND] },
        sens: 'superieur-ou-egal',
        difficulte: { min: 1, max: 10, defaut: 3 },
        vampire: { soif: 'soif', volonte: 'volonte', jauges: ['volonte', 'humanite'] },
    },
    combat: {
        ...ancien.combat,
        initiativeFormula: 'sang_froid + vigilance',
        initiativeSort: 'desc',
        defaultHealthType: 'boxes',
        santeDeDepart: 'vigueur + 3',
        statsToTrack: [
            { fieldId: 'sante', label: 'Santé', isMainHP: true, isResource: true, max: 'vigueur + 3' },
            { fieldId: 'volonte', label: 'Volonté', isResource: true, max: 'resolution + sang_froid' },
            { fieldId: 'soif', label: 'Soif', isResource: true },
            { fieldId: 'humanite', label: 'Humanité', isResource: true },
        ],
    },
    ui_config: {
        ...ancien.ui_config,
        gauges: [
            { fieldId: 'sante', label: 'Santé', color: '#b91c1c', style: 'segmented' },
            { fieldId: 'volonte', label: 'Volonté', color: '#4b5563', style: 'segmented' },
            { fieldId: 'soif', label: 'Soif', color: '#7f1d1d', style: 'segmented' },
            { fieldId: 'humanite', label: 'Humanité', color: '#a16207', style: 'segmented' },
        ],
    },
};
delete pilote.jet.seuil;

const sortie = new AdmZip();
sortie.addFile('manifest.json', Buffer.from(JSON.stringify({ ...manifeste, exportedAt: new Date().toISOString() }, null, 2), 'utf8'));
sortie.addFile('state.json', Buffer.from(JSON.stringify({ ...etat, gameDriver: pilote, sheetTemplate: fiche }), 'utf8'));
fs.mkdirSync(path.join(dossier, 'corriges'), { recursive: true });
const cible = path.join(dossier, 'corriges', 'Vampire-2.0.0.gmos-driver');
sortie.writeZip(cible);

const cheminCorrespondance = 'docs/systems/vampire/fiche/correspondance.json';
fs.mkdirSync(path.dirname(cheminCorrespondance), { recursive: true });
fs.writeFileSync(cheminCorrespondance, `${JSON.stringify({
    version: 1,
    gabaritDeLaFiche: 'vampire-v5-fr',
    commentaire: 'Correspondance entre la fiche GM-OS de Vampire (pilote 2.0.0, outils/vampire/finir_vampire.mjs) et le gabarit vampire-v5-fr livré le 2026-11-17. Les identifiants GM-OS sont courts et en français ; les 27 compétences et les 9 attributs suivent le livre (p. 155-171). La Santé et la Volonté restantes n’existent que dans GM-OS ; leurs cases de dégâts restent sur la fiche HTML.',
    champs: correspondance,
    absents,
}, null, 2)}\n`);

console.log(JSON.stringify({ source, cible, id: pilote.id, templateId: fiche.id, champs: ids.length, correspondance: correspondance.length, absents: absents.length }));
