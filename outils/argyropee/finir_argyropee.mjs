// Le pilote Argyropée 2.1.0 — 08/11/2026, à la demande de David (« finir le pilote ») ; 2.1.0 le
// 09/11/2026 (« l'Exubérance, la Faveur divine, la Guigne, la magie et le dé de compétence des PNJ »).
// Part de l'export de David (Export Dirvers/Argyropee_driver_gmos_*.gmos-driver), GARDE
// l'identifiant du pilote et de sa fiche, et écrit Export Dirvers/corriges/Argyropee-2.1.0.gmos-driver.
//
// Ce qui change, règle par règle (livre 2 « Règles & Bestiaire », pages IMPRIMÉES ; page PDF = imprimée + 1) :
//  - Le test (p. 44-45, 84-85) : le pilote forgé comparait le d10 seul à « compétence + métier »
//    et exigeait 10 réussites d'un dé — chaque test échouait. Désormais `jet.argyropee` :
//    1d10 lu de 0 à 9 + compétence + bonus du métier CHOISI AU JET (décision de David, 08/11),
//    modificateur ±5, entraide +5 au plus, paliers 0 / 1-7 / 8-9 / 10-14 / 15+, un total nul
//    ou négatif est un échec critique (décision de David, 08/11), Panache après le tirage.
//    `difficulte`, `critique` et `complication` (lus sur le dé, pas sur le total) sont retirés.
//  - La fiche (p. 19-41, et la fiche PJ du livre) : la fiche forgée ne portait que 7 compétences
//    sur 32, ni Agilité ni Détection, ni bonus de métier. Elle reprend une à une les 128 clés de la
//    fiche HTML `argyropee-fr` (docs/fiches/Argyropée/argyropee-fiche-interactive.html) : 32
//    compétences et la compétence libre (0 à 7), 5 métiers (nom, rang, bonus, salaire), 2
//    tempéraments, Panache, santé, initiative, armes, protections, sorts, relations, possessions,
//    équipement, charges. S'y ajoutent, côté GM-OS seulement, le Châtiment vermeil et le pécule
//    (Florins, Deniers, Sous), que la fiche HTML ne porte pas.
//  - L'initiative (p. 46) : 1d10 + Agilité + Détection (+ le bonus d'initiative de la fiche) ;
//    le pilote forgé lisait Agilité (absente) et Sens magique.
//  - La santé (p. 41, 54) : 2 + Endurance morale + Endurance physique, inchangé mais relu.
//  - Les portées (p. 47, 89-95) : à 3 m ou moins, Combat rapproché ou Rixe ; au-delà, Combat à
//    distance. Le malus dépend de chaque arme (−1 par tranche au-delà de SA portée maximum) :
//    aucun malus générique, les libellés le disent.
//  - 2.1.0, la journée (p. 81, 84-86, 127, 135-136, 176-177) : `jet.argyropee` nomme aussi le
//    bonus de Panache, la santé (Exubérance : conscient), la Faveur divine (Sciences religieuses et
//    les prières du jour), la magie (les 15 sorts, les deux domaines, le Panache magique du combat,
//    la silenciada) et la Guigne (Panache dépensé aux tests, offrande du prochain réveil). Cinq
//    champs GM-OS s'ajoutent dans « Panache et santé », hors de la fiche HTML ; la jauge de Panache
//    monte à 25 (19 + 3 de bonus permanent + 3 de la Guigne au réveil).
//
// Usage : node outils/argyropee/finir_argyropee.mjs [export.gmos-driver]
import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';

const dossier = 'Export Dirvers';
const source = process.argv[2]
    ?? path.join(dossier, fs.readdirSync(dossier).filter(f => /^Argyropee_driver.*\.gmos-driver$/.test(f)).sort().at(-1));
const zip = new AdmZip(source);
const etat = JSON.parse(zip.readAsText('state.json'));
const manifeste = JSON.parse(zip.readAsText('manifest.json'));
const { gameDriver: ancien, sheetTemplate: ancienneFiche } = etat;

// --- La fiche : les clés de la fiche HTML, des identifiants GM-OS en français. ---
const n = (id, label, fiche, extra = {}) => ({ id, label, type: 'number', defaultValue: 0, fiche, ...extra });
const t = (id, label, fiche, extra = {}) => ({ id, label, type: 'text', defaultValue: '', fiche, ...extra });
const z = (id, label, fiche) => ({ id, label, type: 'textarea', defaultValue: '', fiche });

const COMPETENCES = [
    ['agilite', 'Agilité', 'agility'], ['alchimie', 'Alchimie', 'alchemy'], ['art', 'Art', 'art'],
    ['artificerie', 'Artificerie', 'artificery'], ['artisanat', 'Artisanat', 'craft'], ['bagout', 'Bagout', 'fast_talk'],
    ['charisme', 'Charisme', 'charisma'], ['combat_a_distance', 'Combat à distance', 'ranged_combat'],
    ['combat_rapproche', 'Combat rapproché', 'close_combat'], ['commerce', 'Commerce', 'trade'], ['conduite', 'Conduite', 'driving'],
    ['deduction', 'Déduction', 'deduction'], ['detection', 'Détection', 'detection'], ['empathie_animale', 'Empathie animale', 'animal_empathy'],
    ['endurance_morale', 'Endurance morale', 'moral_endurance'], ['endurance_physique', 'Endurance physique', 'physical_endurance'],
    ['escalade', 'Escalade', 'climbing'], ['faux_et_usage_de_faux', 'Faux et usage de faux', 'forgery'], ['fouille', 'Fouille', 'search'],
    ['furtivite', 'Furtivité', 'stealth'], ['herboristerie', 'Herboristerie', 'herbalism'], ['medecine', 'Médecine', 'medicine'],
    ['piegeage', 'Piégeage', 'trapping'], ['pratique_nautique', 'Pratique nautique', 'seamanship'], ['rixe', 'Rixe', 'brawling'],
    ['sciences_naturelles', 'Sciences naturelles', 'natural_sciences'], ['sciences_religieuses', 'Sciences religieuses', 'religious_sciences'],
    ['sciences_sociales', 'Sciences sociales', 'social_sciences'], ['sciences_techniques', 'Sciences techniques', 'technical_sciences'],
    ['sens_magique', 'Sens magique', 'magic_sense'], ['serrurerie', 'Serrurerie', 'locksmithing'], ['urbanisme', 'Urbanisme', 'urbanism'],
];
// Une compétence va de 0 à 7 (5 au plus à la création, p. 44) ; la fiche HTML le borne.
const competence = (id, label, cle) => n(id, label, `skills.${cle}.level`);

const sections = [
    { id: 'identite', label: 'Identité', fields: [
        t('nom', 'Nom', 'identity.name'), t('sexe', 'Sexe', 'identity.gender'), n('age', 'Âge', 'identity.age'),
        t('taille', 'Taille', 'identity.height'), t('poids', 'Poids', 'identity.weight'), t('citoyennete', 'Citoyenneté', 'identity.citizenship'),
        z('description', 'Description physique', 'profile.description'),
    ] },
    { id: 'temperaments', label: 'Humeurs et tempéraments', fields: [
        t('humeur1', 'Tempérament 1 — humeur', 'temperaments.0.mood'), t('humeur1_domaine', 'Tempérament 1 — domaine', 'temperaments.0.domain'),
        t('humeur2', 'Tempérament 2 — humeur', 'temperaments.1.mood'), t('humeur2_domaine', 'Tempérament 2 — domaine', 'temperaments.1.domain'),
    ] },
    { id: 'metiers', label: 'Métiers', fields: [0, 1, 2, 3, 4].flatMap(i => [
        t(`metier${i + 1}_nom`, `Métier ${i + 1}`, `careers.${i}.name`),
        t(`metier${i + 1}_rang`, `Métier ${i + 1} — Rang`, `careers.${i}.rank`, { libelleSur: `metier${i + 1}_nom` }),
        n(`metier${i + 1}_bonus`, `Métier ${i + 1} — Bonus`, `careers.${i}.bonus`, { libelleSur: `metier${i + 1}_nom` }),
        n(`metier${i + 1}_salaire`, `Métier ${i + 1} — Salaire (sous/jour)`, `careers.${i}.salary`, { libelleSur: `metier${i + 1}_nom` }),
    ]) },
    { id: 'competences', label: 'Compétences', fields: [
        ...COMPETENCES.map(([id, label, cle]) => competence(id, label, cle)),
        t('competence_libre_nom', 'Compétence libre', 'skills.other.name'),
        n('competence_libre', 'Compétence libre — niveau', 'skills.other.level', { libelleSur: 'competence_libre_nom' }),
    ] },
    { id: 'jauges', label: 'Panache et santé', fields: [
        // 1d10 + 10 chaque matin, plus le bonus permanent (p. 84) : 19 sans bonus, +1 à +3 permanents
        // pour un personnage puissant (p. 174) — 22 ; la Guigne réglée en offre 3 de plus au réveil
        // (p. 177) : 25 au plus. Relu contre le livre le 08/11/2026, Guigne le 09/11/2026.
        { id: 'panache', label: 'Panache', type: 'gauge', defaultValue: 0, max: 25, fiche: 'tracks.panache' },
        n('panache_bonus', 'Bonus permanent de Panache', 'tracks.panache_bonus'),
        // 2 + Endurance morale + Endurance physique (p. 41) : 12 à la création, 16 avec deux compétences
        // à 7 (p. 62). Le Châtiment vermeil complet ajoute 10 points (p. 178), à noter dans le maximum.
        { id: 'points_de_sante', label: 'Points de santé', type: 'gauge', defaultValue: 0, max: 16, fiche: 'tracks.health' },
        n('points_de_sante_max', 'Points de santé maximum', 'tracks.health_max'),
        n('bonus_initiative', 'Bonus d’initiative', 'combat.initiative_bonus'),
        // Hors de la fiche HTML : marques rouges de 0 à 9 et plus (p. 41).
        { id: 'chatiment_vermeil', label: 'Châtiment vermeil', type: 'gauge', defaultValue: 0, max: 9 },
        // 2.1.0 (09/11/2026), hors de la fiche HTML : ce que le panneau de jet et le pupitre comptent.
        n('faveur_divine', 'Faveur divine — prières dites aujourd’hui', undefined),
        n('magie_du_combat', 'Panache dépensé en sorts dans ce combat', undefined),
        { id: 'silenciada', label: 'Silenciada (muet)', type: 'checkbox', defaultValue: false },
        n('guigne_depense', 'Panache dépensé aux tests depuis le réveil (repère de la Guigne)', undefined),
        n('guigne_offerte', 'Panache offert par la Guigne au prochain réveil', undefined),
    ] },
    { id: 'armes', label: 'Armes', fields: [0, 1, 2, 3, 4].flatMap(i => [
        t(`arme${i + 1}_nom`, `Arme ${i + 1}`, `weapons.${i}.name`),
        t(`arme${i + 1}_portee`, `Arme ${i + 1} — Portée`, `weapons.${i}.range`, { libelleSur: `arme${i + 1}_nom` }),
        t(`arme${i + 1}_degats`, `Arme ${i + 1} — Dégâts`, `weapons.${i}.damage`, { libelleSur: `arme${i + 1}_nom` }),
        t(`arme${i + 1}_munitions`, `Arme ${i + 1} — Munitions`, `weapons.${i}.ammo`, { libelleSur: `arme${i + 1}_nom` }),
    ]) },
    { id: 'protections', label: 'Protections', fields: [0, 1, 2].flatMap(i => [
        t(`protection${i + 1}_nom`, `Protection ${i + 1}`, `armour.${i}.name`),
        // « X/Y » : X absorbé par coup, Y la résistance qui s'use d'un point par coup (p. 51).
        t(`protection${i + 1}_valeur`, `Protection ${i + 1} — X/Y`, `armour.${i}.protection`, { libelleSur: `protection${i + 1}_nom` }),
        t(`protection${i + 1}_malus`, `Protection ${i + 1} — Malus`, `armour.${i}.penalty`, { libelleSur: `protection${i + 1}_nom` }),
    ]) },
    { id: 'sorts', label: 'Sorts connus', fields: Array.from({ length: 15 }, (_, i) => t(`sort${i + 1}`, `Sort ${i + 1}`, `magic.${i}.name`)) },
    { id: 'cercles', label: 'Cercles intimes', fields: [
        z('famille', 'Famille', 'relations.family'), z('amours', 'Amours', 'relations.loves'), z('amis', 'Amis', 'relations.friends'),
        z('ennemis', 'Ennemis', 'relations.enemies'), z('travail', 'Travail', 'relations.work'),
    ] },
    { id: 'possessions', label: 'Possessions et équipement', fields: [
        z('residences', 'Résidence(s)', 'possessions.residences'), z('biens_mobiliers', 'Biens mobiliers', 'possessions.movables'),
        z('compagnon_animal', 'Compagnon animal', 'possessions.animal'),
        z('equipement_porte', 'Équipement porté', 'equipment.worn'), z('equipement_sac', 'Équipement dans le sac', 'equipment.bag'),
        // Hors de la fiche HTML : le pécule (p. 41, 89).
        n('pecule_florins', 'Pécule — Florins', undefined), n('pecule_deniers', 'Pécule — Deniers', undefined), n('pecule_sous', 'Pécule — Sous', undefined),
    ] },
    { id: 'charges', label: 'Charges transportables (kg)', fields: [
        n('charge_legere', 'Charge légère', 'load.light'), n('charge_lourde', 'Charge lourde', 'load.heavy'),
        n('charge_soulevable', 'Charge soulevable', 'load.lift'), n('charge_poussable', 'Charge tirable ou poussable', 'load.push'),
    ] },
];

// La correspondance se tire de la même table : une seule vérité pour les deux.
const correspondance = sections.flatMap(s => s.fields).filter(f => f.fiche).map(f => ({ gmos: f.id, fiche: f.fiche }));
for (const s of sections) for (const f of s.fields) delete f.fiche;

const fiche = { ...ancienneFiche, name: 'Fiche de personnage Argyropée', sections };

// --- Le pilote. ---
const portee = (label, maxUnits) => ({ label, maxUnits, modifier: 0 });
const pilote = {
    ...ancien,
    version: '2.1.0',
    dice: { defaultDice: '1d10', logic: 'sum', engine: 'standard' },
    jet: {
        seuil: [{ id: 'competence', label: 'Compétence', sectionId: 'competences' }],
        reserve: { base: 1, max: 1, faces: 10 },
        sens: 'superieur-ou-egal',
        argyropee: {
            panache: 'panache',
            metiers: [1, 2, 3, 4, 5].map(i => ({ nom: `metier${i}_nom`, bonus: `metier${i}_bonus` })),
            nom: 'nom',
            panacheBonus: 'panache_bonus',
            sante: 'points_de_sante',
            faveur: { competence: 'sciences_religieuses', prieres: 'faveur_divine' },
            magie: {
                sorts: Array.from({ length: 15 }, (_, i) => `sort${i + 1}`),
                domaines: ['humeur1_domaine', 'humeur2_domaine'],
                combat: 'magie_du_combat',
                silenciada: 'silenciada',
            },
            guigne: { depense: 'guigne_depense', offert: 'guigne_offerte' },
        },
    },
    tactical: {
        uniteDeDistance: 'mètres',
        ranges: {
            contact: portee('3 m ou moins : Combat rapproché ou Rixe', 3),
            courte: portee('Combat à distance — malus propre à l’arme au-delà de sa portée', 25),
            moyenne: portee('Combat à distance — malus propre à l’arme au-delà de sa portée', 50),
            longue: portee('Combat à distance — malus propre à l’arme au-delà de sa portée', 200),
            extreme: portee('Combat à distance — malus propre à l’arme au-delà de sa portée', 1500),
        },
    },
    combat: {
        ...ancien.combat,
        initiativeFormula: '1d10 + agilite + detection + bonus_initiative',
        initiativeSort: 'desc',
        defaultHealthType: 'hp',
        santeDeDepart: '2 + endurance_morale + endurance_physique',
        statsToTrack: [
            { fieldId: 'points_de_sante', label: 'Points de santé', isMainHP: true, isResource: true },
            { fieldId: 'panache', label: 'Panache', isResource: true },
            { fieldId: 'chatiment_vermeil', label: 'Châtiment vermeil', isResource: true },
        ],
    },
    ui_config: {
        ...ancien.ui_config,
        gauges: [
            { fieldId: 'points_de_sante', label: 'Points de santé', color: '#ef4444', style: 'segmented' },
            { fieldId: 'panache', label: 'Panache', color: '#f59e0b', style: 'segmented' },
            { fieldId: 'chatiment_vermeil', label: 'Châtiment vermeil', color: '#7f1d1d', style: 'segmented' },
        ],
    },
};

const sortie = new AdmZip();
sortie.addFile('manifest.json', Buffer.from(JSON.stringify(manifeste, null, 2), 'utf8'));
sortie.addFile('state.json', Buffer.from(JSON.stringify({ ...etat, gameDriver: pilote, sheetTemplate: fiche }), 'utf8'));
fs.mkdirSync(path.join(dossier, 'corriges'), { recursive: true });
const cible = path.join(dossier, 'corriges', 'Argyropee-2.1.0.gmos-driver');
sortie.writeZip(cible);

const cheminCorrespondance = 'docs/systems/argyropee/fiche/correspondance.json';
fs.mkdirSync(path.dirname(cheminCorrespondance), { recursive: true });
fs.writeFileSync(cheminCorrespondance, `${JSON.stringify({
    version: 1,
    gabaritDeLaFiche: 'argyropee-fr',
    commentaire: 'Correspondance entre la fiche GM-OS d’Argyropée (pilote 2.1.0, outils/argyropee/finir_argyropee.mjs) et le gabarit argyropee-fr livré le 2026-11-08. Les champs du pilote reprennent un à un les clés de la fiche : aucune transformation. Le Châtiment vermeil, le pécule et le suivi de la journée (prières, magie du combat, silenciada, Guigne) n’existent que dans GM-OS.',
    champs: correspondance,
}, null, 2)}\n`);

console.log(JSON.stringify({ source, cible, id: pilote.id, templateId: fiche.id, champs: sections.flatMap(s => s.fields).length, correspondance: correspondance.length }));
