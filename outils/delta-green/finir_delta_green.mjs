// Le pilote Delta Green 2.0.1 — 12/11/2026, à la demande de David (« /finir-un-pilote Delta Green,
// pour les compétences vérifie dans le livre ; pour les points de vie, la règle c'est (FOR+CON)/2 ;
// corrige le jet sur les critiques »). Part de l'export de David
// (Export Dirvers/Delta_Green_driver_gmos_*.gmos-driver), GARDE l'identifiant du pilote et de sa
// fiche, et écrit Export Dirvers/corriges/Delta-Green-2.0.1.gmos-driver.
//
// 2.0.1 (12/11, essai de David : « je n'ai pas trouvé la compétence Pilotage ») : la spécialité
// PRÉCISE le nom (`libelleEnPrecision`) au lieu de le remplacer — « Pilotage — Hélicoptère » ;
// sans spécialité, la compétence reste au menu. La 2.0.0 affichait « +5 (10) » et cachait Art,
// Artisanat, Pilotage, Science et Sciences militaires tant qu'aucune spécialité n'était saisie.
//
// Source : Delta Green, *Manuel de l'Agent* (docs/systems/delta-green/livres.json), pages
// IMPRIMÉES ; page du PDF = imprimée + 1.
//
// Ce qui change, règle par règle :
//  - Le jet (p. 43-44) : le pilote forgé portait `critique: 1` et `complication: 20`, des nombres de
//    d20 ; sur un d100, aucun double ne comptait. Désormais `jet.deltaGreen` : réussite critique sur
//    01 ou un double réussi, échec critique sur 00 ou un double raté ; bonus et malus de −40 à +40 %
//    au jet ; chances bornées de 1 à 99 %. `critique` et `complication` sont retirés.
//  - Les caractéristiques (p. 18) : un test se fait à la valeur × 5 — le jet propose les six
//    caractéristiques à côté des compétences, et les multiplie. La SAN se teste aussi au jet.
//  - Les compétences (p. 29, « Compétences et valeurs de base ») : la fiche forgée portait
//    « Compétence 1 » à « Compétence 12 », sans nom. Elle porte les 41 compétences du livre, à leur
//    valeur de base ; Art, Artisanat, Pilotage, Science et Sciences militaires ont leur spécialité,
//    que le menu du jet affiche ; six lignes libres pour les langues étrangères et autres
//    compétences. Une compétence à 0 % ne se tente pas (p. 29) : le jet le dit.
//  - Les points de vie (p. 18) : PV = (FOR + CON) / 2, arrondi au supérieur (GM-OS arrondit déjà
//    ainsi). Le pilote forgé ne marquait aucune santé principale : les coups du combat ne
//    s'écrivaient pas sur la fiche. PV est désormais la jauge principale, plafonnée à (FOR + CON) / 2.
//    À 2 PV l'Agent perd connaissance, à 0 il meurt (p. 18) : le second suit le moteur commun.
//  - VOL = POU, SAN = POU × 5 au départ et 99 − Inconcevable au plus, Seuil de rupture = SAN − POU
//    (p. 18) : trois jauges avec leur maximum ; le Seuil de rupture reste un nombre saisi.
//  - Les Attaches (p. 18, fiche) : cinq Attaches, nom et score, et la case « endommagée » ; la
//    fiche forgée n'en portait qu'une zone de texte suivie comme une jauge.
//  - L'initiative (p. 50) : l'ordre de DEX, de la plus élevée à la plus basse — inchangé.
//  - Les portées (p. 53, « Modificateurs de combat ») : +20 % à bout portant (3 m ou moins),
//    −20 % de la portée de base au double, −40 % du double au quintuple ; les limites dépendent de
//    l'arme, les libellés le disent. Les modificateurs étaient du texte, ils deviennent des nombres.
//
// La fiche reprend les clés de la fiche HTML de Codex (`delta-green-agent-fr`,
// docs/fiches/Delta Green/delta-green-fiche-agent-interactive.html) ; la correspondance s'écrit
// dans docs/systems/delta-green/fiche/correspondance.json depuis la même table.
//
// Usage : node outils/delta-green/finir_delta_green.mjs [export.gmos-driver]
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import AdmZip from 'adm-zip';

const dossier = 'Export Dirvers';
const source = process.argv[2]
    ?? path.join(dossier, fs.readdirSync(dossier).filter(f => /^Delta_Green_driver.*\.gmos-driver$/.test(f)).sort().at(-1));
const zip = new AdmZip(source);
const etat = JSON.parse(zip.readAsText('state.json'));
const manifeste = JSON.parse(zip.readAsText('manifest.json'));
const { gameDriver: ancien, sheetTemplate: ancienneFiche } = etat;

// --- La fiche HTML : ses clés et ses valeurs de base, pour la vérification croisée. ---
const html = fs.readFileSync('docs/fiches/Delta Green/delta-green-fiche-agent-interactive.html', 'utf8');
const gabarit = JSON.parse(html.match(/<script\b[^>]*\bid=["']character-sheet-template["'][^>]*>([\s\S]*?)<\/script>/i)[1]).template;
assert.equal(gabarit.id, 'delta-green-agent-fr');
const zones = new Map(gabarit.pages.flatMap(p => p.fields).map(f => [f.key, f]));

// --- Les compétences : la table du livre, p. 29, transcrite. [id GM-OS, nom, clé HTML, base %, spécialité ?]
const COMPETENCES = [
    ['anthropologie', 'Anthropologie', 'anthropology', 0], ['archeologie', 'Archéologie', 'archeology', 0],
    ['armes_a_feu', 'Armes à feu', 'firearms', 20], ['armes_de_melee', 'Armes de mêlée', 'melee', 30],
    ['armes_lourdes', 'Armes lourdes', 'heavy_weapons', 0], ['art', 'Art', 'art', 0, true],
    ['artillerie', 'Artillerie', 'artillery', 0], ['artisanat', 'Artisanat', 'craft', 0, true],
    ['athletisme', 'Athlétisme', 'athletics', 30], ['bureaucratie', 'Bureaucratie', 'bureaucracy', 10],
    ['chirurgie', 'Chirurgie', 'surgery', 0], ['combat_a_mains_nues', 'Combat à mains nues', 'unarmed', 40],
    ['comptabilite', 'Comptabilité', 'accounting', 10], ['conduite', 'Conduite', 'drive', 20],
    ['criminalistique', 'Criminalistique', 'forensics', 0], ['criminologie', 'Criminologie', 'criminology', 10],
    ['deguisement', 'Déguisement', 'disguise', 10], ['discretion', 'Discrétion', 'stealth', 10],
    ['droit', 'Droit', 'law', 0], ['engins_lourds', 'Engins lourds', 'heavy_machinery', 10],
    ['equitation', 'Équitation', 'ride', 10], ['esquive', 'Esquive', 'dodge', 30],
    ['explosifs', 'Explosifs', 'demolitions', 0], ['histoire', 'Histoire', 'history', 10],
    ['inconcevable', 'Inconcevable', 'unnatural', 0], ['informatique', 'Informatique', 'computer_science', 0],
    ['medecine', 'Médecine', 'medicine', 0], ['natation', 'Natation', 'swim', 20],
    ['occultisme', 'Occultisme', 'occult', 10], ['orientation', 'Orientation', 'navigate', 10],
    ['persuasion', 'Persuasion', 'persuade', 20], ['pharmacologie', 'Pharmacologie', 'pharmacy', 0],
    ['pilotage', 'Pilotage', 'pilot', 0, true], ['premiers_secours', 'Premiers secours', 'first_aid', 10],
    ['psychotherapie', 'Psychothérapie', 'psychotherapy', 10], ['recherche', 'Recherche', 'search', 20],
    ['roem', 'ROEM', 'sigint', 0], ['rohum', 'ROHUM', 'humint', 10],
    ['science', 'Science', 'science', 0, true], ['sciences_militaires', 'Sciences militaires', 'military_science', 0, true],
    ['survie', 'Survie', 'survival', 10], ['vigilance', 'Vigilance', 'alertness', 20],
];
assert.equal(COMPETENCES.length, 42, 'la table du livre compte 42 lignes, Langue étrangère à part');
for (const [, nom, cle, base] of COMPETENCES) {
    const zone = zones.get(`skills.${cle}`);
    assert.ok(zone, `${nom} : skills.${cle} absente de la fiche HTML`);
    assert.equal(Number(zone.defaultValue ?? 0), base, `${nom} : la fiche HTML dit ${zone.defaultValue}, le livre ${base} %`);
}

const n = (id, label, fiche, extra = {}) => ({ id, label, type: 'number', defaultValue: 0, fiche, ...extra });
const t = (id, label, fiche, extra = {}) => ({ id, label, type: 'text', defaultValue: '', fiche, ...extra });
const z = (id, label, fiche) => ({ id, label, type: 'textarea', defaultValue: '', fiche });
const c = (id, label, fiche) => ({ id, label, type: 'checkbox', defaultValue: false, fiche });

const CARACTERISTIQUES = [
    ['FOR', 'Force (FOR)', 'strength'], ['CON', 'Constitution (CON)', 'constitution'], ['DEX', 'Dextérité (DEX)', 'dexterity'],
    ['INT', 'Intelligence (INT)', 'intelligence'], ['POU', 'Pouvoir (POU)', 'power'], ['CHA', 'Charisme (CHA)', 'charisma'],
];

const sections = [
    { id: 'donnees_personnelles', label: 'Données personnelles', fields: [
        t('etat_civil', 'Nom, prénom, initiales', 'identity.name'),
        t('metier', 'Profession et rang', 'identity.profession'),
        t('employeur', 'Employeur', 'identity.employer'),
        t('nationalite', 'Nationalité', 'identity.nationality'),
        t('genre', 'Genre', 'identity.gender'),
        t('age', 'Âge et date de naissance', 'identity.age_birth'),
        z('parcours', 'Études et carrière', 'identity.education'),
        t('officier_traitant', 'Officier traitant', 'identity.handler'),
    ] },
    // Les valeurs de 3 à 18 ; le test se fait à la valeur × 5 (p. 18), que le jet calcule.
    { id: 'caracteristiques', label: 'Caractéristiques', fields: CARACTERISTIQUES.map(([id, label, cle]) => n(id, label, `attributes.${cle}`, { defaultValue: 10 })) },
    { id: 'traits', label: 'Traits distinctifs', fields: CARACTERISTIQUES.map(([id, label, cle]) => t(`trait_${id.toLowerCase()}`, `${label} — trait`, `traits.${cle}`)) },
    { id: 'attributs_derives', label: 'Attributs dérivés', fields: [
        { id: 'PV', label: 'Points de vie (PV)', type: 'gauge', defaultValue: 10, fiche: 'health.hp' },
        { id: 'VOL', label: 'Points de Volonté (VOL)', type: 'gauge', defaultValue: 10, fiche: 'health.willpower' },
        { id: 'SAN', label: 'Santé Mentale (SAN)', type: 'gauge', defaultValue: 50, max: 99, fiche: 'health.sanity' },
        n('SR', 'Seuil de rupture (SR)', 'health.breaking_point', { defaultValue: 40 }),
    ] },
    // La spécialité suit sa compétence, dans la même section : le menu du jet en tire le nom
    // (« Pilotage (Hélicoptère) ») et ne propose pas le champ du nom lui-même.
    { id: 'competences', label: 'Compétences', fields: [
        ...COMPETENCES.flatMap(([id, label, cle, base, specialite]) => [
            n(id, label, `skills.${cle}`, { defaultValue: base, max: 99, ...(specialite ? { libelleSur: `${id}_specialite`, libelleEnPrecision: true } : {}) }),
            ...(specialite ? [t(`${id}_specialite`, `${label} : spécialité`, `specialties.${cle}`)] : []),
        ]),
        // Langues étrangères et autres compétences (p. 29, « Langue étrangère (Type) » à 0 %).
        ...[0, 1, 2, 3, 4, 5].flatMap(i => [
            t(`autre${i + 1}_nom`, `Langue ou autre compétence ${i + 1} : nom`, `skills.custom_${i}.name`),
            n(`autre${i + 1}`, `Langue ou autre compétence ${i + 1}`, `skills.custom_${i}.level`, { max: 99, libelleSur: `autre${i + 1}_nom` }),
        ]),
    ] },
    { id: 'psychologie', label: 'Psychologie', fields: [
        ...[0, 1, 2, 3, 4].flatMap(i => [
            t(`attache${i + 1}_nom`, `Attache ${i + 1}`, `bonds.${i}.name`),
            n(`attache${i + 1}`, `Attache ${i + 1} — score`, `bonds.${i}.score`, { libelleSur: `attache${i + 1}_nom` }),
            c(`attache${i + 1}_endommagee`, `Attache ${i + 1} — endommagée`, `bonds.${i}.damaged`),
        ]),
        z('motivations', 'Motivations et troubles psychiques', 'psychology.motivations_disorders'),
        c('accoutumance_violence', 'Accoutumé à la violence', 'adaptation.violence'),
        c('accoutumance_impuissance', 'Accoutumé à l’impuissance', 'adaptation.helplessness'),
    ] },
    { id: 'materiel_combat', label: 'Matériel et combat', fields: [
        z('armure', 'Protection et équipement', 'equipment.armor_gear'),
        z('blessures', 'Blessures et maladies', 'health.wounds_diseases'),
        c('premiers_secours_recus', 'Premiers secours reçus depuis la dernière blessure', 'health.first_aid_received'),
        ...[0, 1, 2, 3, 4, 5, 6].flatMap(i => [
            t(`arme${i + 1}`, `Arme ${i + 1}`, `weapons.${i}.name`),
            t(`arme${i + 1}_competence`, `Arme ${i + 1} — compétence %`, `weapons.${i}.skill`, { libelleSur: `arme${i + 1}` }),
            t(`arme${i + 1}_portee`, `Arme ${i + 1} — portée de base`, `weapons.${i}.range`, { libelleSur: `arme${i + 1}` }),
            t(`arme${i + 1}_degats`, `Arme ${i + 1} — dégâts`, `weapons.${i}.damage`, { libelleSur: `arme${i + 1}` }),
            t(`arme${i + 1}_perforant`, `Arme ${i + 1} — perforant`, `weapons.${i}.armor_piercing`, { libelleSur: `arme${i + 1}` }),
            t(`arme${i + 1}_letalite`, `Arme ${i + 1} — létalité %`, `weapons.${i}.lethality`, { libelleSur: `arme${i + 1}` }),
            t(`arme${i + 1}_rayon`, `Arme ${i + 1} — rayon d’action`, `weapons.${i}.kill_radius`, { libelleSur: `arme${i + 1}` }),
            t(`arme${i + 1}_munitions`, `Arme ${i + 1} — munitions`, `weapons.${i}.ammo`, { libelleSur: `arme${i + 1}` }),
        ]),
    ] },
    { id: 'troubles_psychiques', label: 'Description et notes', fields: [
        t('trouble_permanent', 'Trouble psychique permanent', undefined),
        z('description', 'Description physique', 'profile.description'),
        z('foyer', 'Domicile et famille', 'profile.home_family'),
        z('notes', 'Notes personnelles', 'profile.personal_notes'),
    ] },
];

// Chaque clé nommée existe dans la fiche HTML.
for (const f of sections.flatMap(s => s.fields)) {
    if (f.fiche) assert.ok(zones.has(f.fiche), `${f.id} : ${f.fiche} absente de la fiche HTML`);
}
const ids = sections.flatMap(s => s.fields).map(f => f.id);
assert.equal(new Set(ids).size, ids.length, 'identifiants GM-OS en double');

const correspondance = sections.flatMap(s => s.fields).filter(f => f.fiche).map(f => ({ gmos: f.id, fiche: f.fiche }));
for (const s of sections) for (const f of s.fields) delete f.fiche;
const relues = new Set(correspondance.map(l => l.fiche));
const absents = [...zones.keys()].filter(k => !relues.has(k)).map(cle => ({
    fiche: cle,
    pourquoi: /_x5$/.test(cle) ? 'Calculée par la fiche HTML (× 5) ; le jet de GM-OS la calcule aussi (p. 18).'
        : /_max$/.test(cle) ? 'Maximum calculé par GM-OS depuis le pilote (statsToTrack[].max, p. 18).'
        : /^experience\./.test(cle) ? 'Case d’amélioration cochée après un test raté, puis 1D4 après la partie : elle se tient sur la fiche HTML.'
        : /^training\./.test(cle) ? 'Formation particulière (nom et compétence liée) : un texte de la fiche HTML, que le jet ne lit pas.'
        : cle === 'identity.signature' ? 'La signature de l’Agent : propre au formulaire DD 315.'
        : cle === 'identity.gender_other' ? 'Précision libre du genre : propre au formulaire DD 315.'
        : 'Propre à la fiche HTML : GM-OS ne la lit ni ne l’écrit.',
}));

const fiche = { ...ancienneFiche, name: 'Fiche d’Agent (formulaire DD 315)', sections };

// --- Le pilote. ---
const pilote = {
    ...ancien,
    version: '2.0.1',
    dice: { defaultDice: '1d100', logic: 'd100-low', engine: 'standard' },
    jet: {
        seuil: [{
            id: 'competence', label: 'Compétence ou caractéristique', sectionId: 'competences',
            sectionsSupplementaires: ['caracteristiques', 'attributs_derives'],
            // Dans les attributs dérivés, la SAN seule se teste ; PV, VOL et SR ne sont pas des chances.
            motif: '^(?!(PV|VOL|SR)$)',
        }],
        reserve: { base: 1, max: 1, faces: 100 },
        sens: 'sous-ou-egal',
        modificateurDuSeuil: { min: -40, max: 40, defaut: 0 },
        deltaGreen: { caracteristiques: CARACTERISTIQUES.map(([id]) => id) },
    },
    combat: {
        ...ancien.combat,
        initiativeFormula: 'DEX',
        initiativeSort: 'desc',
        defaultHealthType: 'hp',
        santeDeDepart: '(FOR + CON) / 2',
        statsToTrack: [
            { fieldId: 'PV', label: 'Points de vie (PV)', isMainHP: true, isResource: true, max: '(FOR + CON) / 2' },
            { fieldId: 'VOL', label: 'Volonté (VOL)', isMainHP: false, isResource: true, max: 'POU' },
            { fieldId: 'SAN', label: 'Santé Mentale (SAN)', isMainHP: false, isResource: true, max: '99 - inconcevable' },
        ],
    },
    tactical: {
        ...ancien.tactical,
        uniteDeDistance: 'mètres',
        ranges: {
            contact: { label: 'Bout portant, 3 m ou moins : +20 %', maxUnits: 3, modifier: 20 },
            courte: { label: 'Jusqu’à la portée de base de l’arme : aucun modificateur', maxUnits: null, modifier: 0 },
            moyenne: { label: 'De la portée de base à son double : −20 %', maxUnits: null, modifier: -20 },
            longue: { label: 'Du double au quintuple de la portée de base : −40 %', maxUnits: null, modifier: -40 },
            extreme: { label: 'Au-delà du quintuple de la portée de base : tir impossible', maxUnits: null, modifier: -100 },
        },
    },
    ui_config: {
        ...ancien.ui_config,
        gauges: [
            { fieldId: 'PV', label: 'Points de vie', color: '#b91c1c', style: 'segmented' },
            { fieldId: 'VOL', label: 'Volonté', color: '#d97706', style: 'segmented' },
            { fieldId: 'SAN', label: 'Santé Mentale', color: '#4b5563', style: 'bar' },
        ],
    },
};

const sortie = new AdmZip();
sortie.addFile('manifest.json', Buffer.from(JSON.stringify({ ...manifeste, exportedAt: new Date().toISOString() }, null, 2), 'utf8'));
sortie.addFile('state.json', Buffer.from(JSON.stringify({ ...etat, gameDriver: pilote, sheetTemplate: fiche }), 'utf8'));
fs.mkdirSync(path.join(dossier, 'corriges'), { recursive: true });
const cible = path.join(dossier, 'corriges', 'Delta-Green-2.0.1.gmos-driver');
sortie.writeZip(cible);

const cheminCorrespondance = 'docs/systems/delta-green/fiche/correspondance.json';
fs.mkdirSync(path.dirname(cheminCorrespondance), { recursive: true });
fs.writeFileSync(cheminCorrespondance, `${JSON.stringify({
    version: 1,
    gabaritDeLaFiche: 'delta-green-agent-fr',
    commentaire: 'Correspondance entre la fiche GM-OS de Delta Green (pilote 2.0.1, outils/delta-green/finir_delta_green.mjs) et le gabarit delta-green-agent-fr livré le 2026-11-12. Les identifiants GM-OS sont courts et en français ; les 42 compétences suivent la table du Manuel de l’Agent, p. 29, vérifiée contre les valeurs de base de la fiche HTML. Le trouble psychique permanent n’existe que dans GM-OS.',
    champs: correspondance,
    absents,
}, null, 2)}\n`);

console.log(JSON.stringify({ source, cible, id: pilote.id, templateId: fiche.id, champs: ids.length, correspondance: correspondance.length, absents: absents.length }));
