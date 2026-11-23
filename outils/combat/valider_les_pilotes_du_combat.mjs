// Validation des pilotes du combat des adversaires — registre § 267, T16 (23/11/2026), après le § 263 et
// son `valider_les_quatre_pilotes.mjs` (19/11).
//
// Pour chaque export du dossier (par défaut `Export Dirvers/`, les pilotes installés chez David le 21/11) :
//   1. `controlerLePilote` : aucune erreur ; les avertissements sont comptés, et ceux qui sortent du
//      catalogue ou du bestiaire sont nommés ;
//   2. la table de Combat-OS (`jeuDuCombat`) reconnaît le jeu, avec le geste et la règle de dégâts attendus —
//      et ne reconnaît pas un jeu hors champ (C6 : Within, et tout pilote qui n'y est pas) ;
//   3. pour un jeu où le meneur lance, l'attaque proposée à un adversaire sur un cas témoin (les valeurs des
//      essais `JetDuCombattant.<jeu>.test.tsx`), et un vrai jet préparé par `preparerLeJet`, sans avertissement.
//
// Usage : node outils/combat/valider_les_pilotes_du_combat.mjs
//   GMOS_PILOTES_COMBAT=<dossier> pour un autre dossier d'exports.
// Sortie : un tableau, puis « OK » ; une assertion qui casse dit le jeu et ce qui manque.
import '../campagnes-de-recette/charger-typescript.mjs';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import AdmZip from 'adm-zip';
import { registerHooks } from 'node:module';
registerHooks({ load(url, contexte, suivant) {
    return url.endsWith('.json') ? { format: 'module', source: `export default ${fs.readFileSync(new URL(url), 'utf8')};`, shortCircuit: true } : suivant(url, contexte);
} });
const { controlerLePilote } = await import('../../src/modules/forge/rules/controlesDuPilote.ts');
const { preparerLeJet } = await import('../../src/modules/dice/DescripteurDeJet.ts');
const { jeuDuCombat } = await import('../../src/modules/combat/logic/jetDuCombattant.ts');
const { attaqueParDefaut } = await import('../../src/modules/combat/logic/attaqueDeLAdversaire.ts');
const { attaqueDuVoyageur } = await import('../../src/modules/combat/logic/dommagesDuVoyageur.ts');

/*
  Les cas témoins, par corpus du pilote. `geste` et `degats` : ce que la table doit dire (C4, C6).
  `valeurs` : la fiche d'un adversaire des essais ; `attaque` : ce que « Attaquer » doit proposer.
  `avertissements` : le compte connu des constats du contrôle (valeurs imprimées du catalogue ou du bestiaire).
*/
const CAS = {
    'blade-runner': { jeu: 'Blade Runner', geste: 'attaquer', degats: 'arme-plus-succes',
        valeurs: { vigueur: 'B (D10)', agilite: 'C (D8)', armesAFeu: 'C (D8)', sante: 5, santeMax: 5 }, champs: { attribut: 'agilite', competence: 'armesAFeu' } },
    alien: { jeu: 'Alien', geste: 'attaquer', degats: 'arme-plus-succes', avertissements: 34,
        valeurs: { force: 3, agilite: 4, combat_a_distance: 3, niveau_de_stress: 1, sante: 4 }, champs: { attribut: 'agilite', 'compétence': 'combat_a_distance', stress: 'niveau_de_stress' } },
    dune: { jeu: 'Dune', geste: 'attaquer', degats: 'porte-du-jeu', valeurs: { combat: 6, discipline: 5, mob: 5, domination: 6 }, attaque: { competence: 'combat', principe: 'domination' } },
    'cthulhu hack': { jeu: 'Cthulhu Hack', geste: 'riposte', degats: 'porte-du-jeu' },
    vampire: { jeu: 'Vampire', geste: 'attaquer', degats: 'marge-plus-arme',
        valeurs: { groupement_1_nom: 'Armes à feu', groupement_1: 5 }, attaque: { attribut: 'groupement_1' } },
    penombre: { jeu: 'Pénombre', geste: 'affrontement', degats: 'porte-du-jeu', avertissements: 1 },
    coc: { jeu: 'COC', geste: 'attaquer', degats: 'porte-du-jeu', avertissements: 8,
        valeurs: { attaque_au_contact: 50 }, attaque: { caracteristique: 'attaque_au_contact' } },
    'delta-green': { jeu: 'Delta Green', geste: 'attaquer', degats: 'porte-du-jeu',
        valeurs: { PV: 10, DEX: 12, armes_a_feu: 50, combat_a_mains_nues: 40, arme1: 'Glock 17', arme1_competence: 'Armes à feu', arme1_degats: '1D10' } },
    barbarian: { jeu: 'Barbarians of Lemuria', geste: 'attaquer', degats: 'de-de-l-arme', avertissements: 1,
        valeurs: { vigueur: 2, agilite: 0, melee: 1, tir: 0, arme1: 'Hache', arme1_degats: 'd6B' } },
    'star-trek': { jeu: 'Star Trek', geste: 'attaquer', degats: 'porte-du-jeu',
        valeurs: { maitrise: 10, audace: 9, securite: 3, attaques: 'Disrupteur (Distance, 3, Polyvalente)' }, attaque: { attribut: 'maitrise', fonction: 'securite' } },
    symbaroum: { jeu: 'Symbaroum', geste: 'riposte', degats: 'porte-du-jeu' },
    argyropee: { jeu: 'Argyropée', geste: 'attaquer', degats: 'porte-du-jeu',
        valeurs: { combat_rapproche: 2, rixe: 1, arme1_nom: 'Dague', arme1_degats: '1d4' }, attaque: { competence: 'combat_rapproche' } },
    degenesis: { jeu: 'Degenesis', geste: 'attaquer', degats: 'porte-du-jeu',
        valeurs: { physique: 3, agilite: 2, corps_a_corps: 2, force: 1, armes_a_projectiles: 1, arme1: 'Machette', arme1_degats: '4+F/2', arme1_maniabilite: '0' },
        attaque: { attribut: 'physique', competence: 'corps_a_corps' } },
    runequest: { jeu: 'RuneQuest', geste: 'attaquer', degats: 'porte-du-jeu',
        valeurs: { con: 12, arme1: 60, arme1_nom: 'Hache', arme1_degats: '1D8+2', bonus_degats: '+1D4' }, attaque: { aptitude: 'arme1' } },
    'shadowrun-anarchy': { jeu: 'Shadowrun : Anarchy', geste: 'attaquer', degats: 'vd-plus-nets',
        valeurs: { force: 3, agilite: 4, competence_2_nom: 'Armes à distance (pistolets)', competence_2: 5, arme_1: 'Ares Predator VI', arme_1_type: 'VD 5' },
        attaque: { competence: 'competence_2', attribut: 'agilite' } },
    nephilim: { jeu: 'Nephilim', geste: 'attaquer', degats: 'porte-du-jeu',
        valeurs: { pastlives_0_name: 'Menace', pastlives_0_degree: 8, ka_fire: 5 }, attaque: { vecu: 'pastlives_0_degree' } },
    torg: { jeu: 'Torg Eternity', geste: 'attaquer', degats: 'arme-plus-des-bonus',
        valeurs: { dexterite: 8, force: 8, armes_feu: 3, armes: 'Pistolet 9mm, dommages 13' }, attaque: { attribut: 'dexterite', competence: 'armes_feu' } },
    crime: { jeu: 'Crimes', geste: 'attaquer', degats: 'porte-du-jeu', avertissements: 1,
        valeurs: { physique: 4, combat: 2, equipement: 'Revolver Galand' }, attaque: { potentiel: 'physique', competence: 'combat' } },
    noc: { jeu: 'NOC', geste: 'attaquer', degats: 'arme-moins-constitution',
        valeurs: { combat: 2, action: 2, constitution: 1, armes: 'Couteau' }, attaque: { talent: 'combat', domaine: 'action' } },
    'reves de dragons': { jeu: 'Rêve de Dragon', geste: 'attaquer', degats: 'porte-du-jeu', voyageur: true,
        valeurs: { melee: 12, corps_a_corps: 2, dague_melee: 3 }, attaque: { caracteristique: 'melee', competences_gen: 'corps_a_corps' } },
};

const dossier = process.env.GMOS_PILOTES_COMBAT ?? 'Export Dirvers';
const bilan = [];
const vus = new Set();
for (const n of fs.readdirSync(dossier).filter(n => n.endsWith('.gmos-driver')).sort()) {
    const { gameDriver: pilote, sheetTemplate: gabarit } = JSON.parse(new AdmZip(path.join(dossier, n)).readAsText('state.json'));
    const cas = CAS[pilote.corpusId ?? ''];
    const table = jeuDuCombat(pilote);
    const constats = controlerLePilote(pilote, gabarit);
    if (!cas) {
        // C6 : un jeu hors du chantier n'a ni geste ni règle de dégâts.
        assert.equal(table, null, `${pilote.name} : hors du chantier, la table ne doit pas le reconnaître`);
        bilan.push({ jeu: pilote.name, version: pilote.version, erreurs: constats.filter(x => x.gravite !== 'avertissement').length,
            avertissements: constats.length, table: 'hors champ', attaque: '—', jet: '—' });
        continue;
    }
    vus.add(pilote.corpusId);
    assert.deepEqual(constats.filter(x => x.gravite !== 'avertissement'), [], `${cas.jeu} : aucune erreur au contrôle`);
    assert.ok(constats.every(x => /^(catalogue|bestiaire|combat\.statsToTrack)/.test(x.ou)), `${cas.jeu} : un avertissement hors du catalogue et du bestiaire`);
    assert.equal(constats.length, cas.avertissements ?? 0, `${cas.jeu} : avertissements connus`);
    assert.ok(table, `${cas.jeu} : la table de Combat-OS doit le reconnaître`);
    assert.deepEqual({ jeu: table.jeu, geste: table.geste, degats: table.degats }, { jeu: cas.jeu, geste: cas.geste, degats: cas.degats }, `${cas.jeu} : table`);

    let attaque = '—', jet = '—';
    if (cas.valeurs) {
        const proposee = cas.voyageur ? attaqueDuVoyageur(cas.valeurs, gabarit) : attaqueParDefaut(pilote, [], cas.valeurs);
        if (cas.attaque) assert.deepEqual(proposee, cas.attaque, `${cas.jeu} : attaque proposée`);
        const champs = cas.champs ?? proposee;
        assert.ok(champs, `${cas.jeu} : une attaque à préparer`);
        const prepare = preparerLeJet(pilote.jet, cas.valeurs, { champs, difficulte: pilote.jet.difficulte?.defaut ?? 0, desSupplementaires: 0 }, gabarit.sections);
        assert.deepEqual(prepare.avertissements, [], `${cas.jeu} : le jet se prépare sans avertissement`);
        attaque = JSON.stringify(proposee ?? champs);
        jet = `${prepare.nombreDeDes}d${prepare.faces}${prepare.seuil !== undefined ? `, seuil ${prepare.seuil}` : ''}`;
    }
    bilan.push({ jeu: cas.jeu, version: pilote.version, erreurs: 0, avertissements: constats.length, table: `${table.geste} · ${table.degats}`, attaque, jet });
}
const manquants = Object.keys(CAS).filter(c => !vus.has(c));
console.table(bilan);
assert.deepEqual(manquants, [], `exports manquants dans « ${dossier} »`);
console.log(`OK : ${vus.size} jeux du combat des adversaires — aucune erreur, table, attaque et jet vérifiés ; ${bilan.length - vus.size} pilote(s) hors champ, non reconnus par la table.`);
