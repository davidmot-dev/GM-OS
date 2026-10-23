import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as spatial from '../../outils/alien/modules/combat-spatial/moteur.mjs';
import { AVARIES_MINEURES, MODELES, avarieDeLaTable } from '../../outils/alien/modules/combat-spatial/catalogue.mjs';
import type { CommandeCombatSpatial, EtatCombatSpatial, VaisseauVu, ContactVu } from '../../outils/alien/modules/combat-spatial/moteur.mjs';

/** **Le combat spatial d'Alien** — livre p. 188-201, errata 2021 (23/10/2026). */
const mj = { role: 'mj' as const }, alice = { role: 'joueur' as const, personnageId: 'alice' }, bob = { role: 'joueur' as const, personnageId: 'bob' };
const agir = (e: EtatCombatSpatial, id: string, charge: unknown, qui: { role: 'mj' | 'joueur'; personnageId?: string } = mj) =>
    spatial.appliquerCommande(e, { id, charge } as CommandeCombatSpatial, qui);

let file: number[] = [];
/** Les prochaines faces de d6 ; ensuite 4 (ni 6 ni 1). */
const des = (...faces: number[]) => { file.push(...faces); };
beforeEach(() => { file = []; vi.spyOn(Math, 'random').mockImplementation(() => (file.length ? (file.shift()! - 1) / 6 + 0.001 : 0.5)); });
afterEach(() => vi.restoreAllMocks());

function preparer() {
    let e = spatial.creerEtat();
    const conestoga = MODELES.find(m => m.id === 'conestoga')!;
    e = agir(e, 'vaisseau', { nom: 'Montero', modele: 'libre', camp: 'joueurs', signature: 1, propulseurs: 1, coque: 9, protection: 6,
        armes: ['canon-electrique-leger', 'drones-senseurs'], transpondeur: true, ombilic: true });
    e = agir(e, 'vaisseau', { nom: 'USS Patna', modele: 'conestoga', camp: 'adverse', signature: conestoga.signature, propulseurs: conestoga.propulseurs,
        coque: conestoga.coque, protection: conestoga.protection, armes: conestoga.armes, transpondeur: false, ombilic: true });
    const [nous, eux] = e.vaisseaux.map(v => v.id);
    const poste = (vaisseauId: string, p: string, personnageId: string, nom: string, base: number, stress = 0) =>
        (e = agir(e, 'poste', { vaisseauId, poste: p, personnageId, nom, base, stress, talent: false, synthetique: false }));
    poste(nous, 'capitaine', 'bob', 'Bob', 4); poste(nous, 'senseurs', 'alice', 'Alice', 4, 1); poste(nous, 'pilote', 'bob', 'Bob', 5);
    poste(nous, 'artilleur', 'alice', 'Alice', 4, 1); poste(nous, 'ingenieur', '', 'MU/TH/UR', 3);
    for (const p of ['capitaine', 'senseurs', 'pilote', 'artilleur', 'ingenieur']) poste(eux, p, '', `Marine ${p}`, 5);
    return { e, nous, eux };
}
/** Démarre et place le vaisseau des joueurs en tête de l'initiative. */
function demarrer(distance = 8) {
    const p = preparer();
    let e = agir(p.e, 'demarrer-combat', { vaisseaux: [p.nous, p.eux], distance, velociteJoueurs: 2, velociteAdverse: 2 });
    e = { ...e, combat: { ...e.combat!, initiative: { [p.nous]: 1, [p.eux]: 2 } } };
    return { ...p, e };
}
const journal = (e: EtatCombatSpatial) => e.combat!.journal.map(l => l.texte).join('\n');

describe('les règles du livre', () => {
    it('un malus mange les dés de base, puis les dés de stress (comme A2)', () => {
        expect(spatial.composerLaReserve(2, 3, -4)).toEqual({ base: 0, stress: 1 });
        expect(spatial.composerLaReserve(4, 1, 1)).toEqual({ base: 5, stress: 1 });
    });
    it('l’errata 2021 comble la ligne 55 des avaries mineures', () => {
        expect(avarieDeLaTable(AVARIES_MINEURES, 55)?.nom).toBe('Unité de réfrigération endommagée');
        expect(avarieDeLaTable(AVARIES_MINEURES, 63)?.nom).toBe('Propulseurs endommagés');
    });
});

describe('ordres secrets et lecteurs', () => {
    it('chacun ne commande que son poste ; l’adversaire reste un contact sans transpondeur ni verrouillage', () => {
        const { e: e0, nous, eux } = demarrer();
        expect(() => agir(e0, 'ordonner', { vaisseauId: eux, action: 'aucune' }, alice)).toThrow(/poste/);
        // Bob est capitaine : il peut ordonner au poste des senseurs.
        let e = agir(e0, 'ordonner', { vaisseauId: nous, action: 'verrouiller', cibleId: eux }, bob);
        e = agir(e, 'ordonner', { vaisseauId: eux, action: 'faire-le-mort', coupe: 'aucun' });
        const vue = spatial.vuePour(e, alice);
        expect(vue.combat!.ordres[eux]).toBeUndefined();
        const contact = vue.vaisseaux.find(v => v.id === eux) as ContactVu;
        expect(contact).toEqual({ id: eux, camp: 'adverse', nom: 'Contact non identifié', modele: '', identifie: false, horsService: false, detruit: false });
        expect(JSON.stringify(vue)).not.toMatch(/Marine|USS Patna/);
        expect(spatial.vuePour(e, mj).combat!.ordres[eux]).toEqual({ action: 'faire-le-mort', coupe: 'aucun' });
    });

    it('verrouiller : portée Extrême −2 ; une réussite verrouille et identifie la cible ; les Tours suivants, sans jet', () => {
        const { e: e0, nous, eux } = demarrer();
        let e = agir(e0, 'ordonner', { vaisseauId: nous, action: 'verrouiller', cibleId: eux });
        e = agir(e, 'reveler', {});
        // Alice : COMTECH 4 + 1 stress, −2 de portée → 2 dés de base et 1 de stress.
        des(6, 3, 4);
        e = agir(e, 'resoudre', { vaisseauId: nous }, alice);
        expect(e.combat!.enAttente?.peutForcer).toBe(true);
        e = agir(e, 'valider', {}, alice);
        expect(e.combat!.verrous[nous]).toEqual([eux]);
        expect(journal(e)).toMatch(/portée Extrême −2/);
        expect((spatial.vuePour(e, alice).vaisseaux.find(v => v.id === eux) as ContactVu).nom).toBe('USS Patna');
        e = agir(agir(e, 'resoudre', { vaisseauId: eux }), 'phase-suivante', {});
        for (let i = 0; i < 3; i++) e = agir(agir(e, 'reveler', {}), 'phase-suivante', {});
        expect(e.combat!.tour).toBe(2);
        e = agir(agir(e, 'ordonner', { vaisseauId: nous, action: 'verrouiller', cibleId: eux }), 'reveler', {});
        e = agir(e, 'resoudre', { vaisseauId: nous });
        expect(journal(e)).toMatch(/garde USS Patna verrouillé, sans jet/);
    });

    it('forcer : Stress +1, un dé de stress de plus ; un 1 sur un dé de stress déclenche la Panique spatiale', () => {
        const { e: e0, nous, eux } = demarrer();
        let e = agir(agir(e0, 'ordonner', { vaisseauId: nous, action: 'verrouiller', cibleId: eux }), 'reveler', {});
        des(3, 4, 5);
        e = agir(e, 'resoudre', { vaisseauId: nous }, alice);
        des(2, 3, 5, 1, 6); // base relancés 2, 3 ; stress relancé 5 ; nouveau dé de stress 1 ; panique 6 + 2 = 8
        e = agir(e, 'forcer', {}, alice);
        const v = e.vaisseaux.find(x => x.id === nous)!;
        expect(v.postes.senseurs.stress).toBe(2);
        expect(journal(e)).toMatch(/force le jet : Stress 2/);
        expect(journal(e)).toMatch(/panique : 6 \+ 2 = 8, Tremblement/);
        expect(e.combat!.enAttente).toBeNull();
    });
});

describe('déplacement, tirs et dégâts', () => {
    it('après la phase de pilote, la distance baisse des deux vélocités ; au-delà, les vaisseaux se croisent', () => {
        const { e: e0 } = demarrer(3);
        let e = agir(agir(e0, 'reveler', {}), 'phase-suivante', {});
        e = agir(agir(e, 'reveler', {}), 'phase-suivante', {});
        expect(e.combat!.distance).toBe(1);
        expect(e.combat!.croise).toBe(true);
        expect(journal(e)).toMatch(/se croisent/);
    });

    it('un tir hors de portée de l’arme ne part pas ; un missile ASAT touche, la Protection arrête des dégâts, l’avarie suit', () => {
        const { e: e0, nous, eux } = demarrer(4);
        let e = agir(agir(e0, 'reveler', {}), 'phase-suivante', {});
        e = agir(agir(e, 'reveler', {}), 'phase-suivante', {}); // distance 4 → 0, contact
        expect(e.combat!.distance).toBe(0);
        const patna = e.vaisseaux.find(v => v.id === eux)!, asat = patna.armes.find(a => a.arme === 'asat-longue')!;
        e = agir(e, 'ordonner', { vaisseauId: eux, action: 'tirer', cibleId: nous, armeId: asat.id });
        e = agir(e, 'reveler', {});
        e = agir(e, 'resoudre', { vaisseauId: nous });
        // ASAT +1, contact +2 : 8 dés ; trois 6 → 3 succès, 4 + 2 = 6 dégâts ; Protection 6 : un 6 → 5 ; 5 ≥ 9/2 → avarie majeure 2D6 = 7.
        des(6, 6, 6, 2, 2, 2, 2, 2, 6, 3, 3, 3, 3, 3, 3, 4);
        e = agir(e, 'resoudre', { vaisseauId: eux });
        const montero = e.vaisseaux.find(v => v.id === nous)!;
        expect(montero.degats).toBe(5);
        expect(montero.avaries.map(a => [a.gravite, a.code])).toEqual([['majeure', 7]]);
        expect(e.vaisseaux.find(v => v.id === eux)!.armes.find(a => a.id === asat.id)!.munitions).toBe(7);
        expect(journal(e)).toMatch(/touche Montero \(Missiles ASAT longue portée\) : 3 succès, 6 dégâts ; Protection 6 \[6 3 3 3 3 3\] → 5/);
        const vue = spatial.vuePour(e, bob).vaisseaux.find(v => v.id === nous) as VaisseauVu;
        expect(vue.avaries[0].nom).toBe('Panne de moteur');
    });

    it('une attaque qui égale la Coque détruit le vaisseau ; des dégâts cumulés le mettent Hors service', () => {
        const { e: e0, nous } = demarrer();
        let e = agir(e0, 'etat-vaisseau', { vaisseauId: nous, degats: 9 });
        expect(e.vaisseaux.find(v => v.id === nous)!.horsService).toBe(true);
        e = agir(e, 'etat-vaisseau', { vaisseauId: nous, degats: 0 });
        expect(e.vaisseaux.find(v => v.id === nous)!.horsService).toBe(false);
    });

    it('l’éperonnage exige le contact au début du Tour ; la surcharge explose à la fin du Tour suivant', () => {
        const { e: e0, nous, eux } = demarrer(1);
        let e = agir(e0, 'reveler', {}); e = agir(e, 'phase-suivante', {});
        e = agir(agir(e, 'ordonner', { vaisseauId: nous, action: 'eperonner', cibleId: eux }), 'reveler', {});
        e = agir(e, 'resoudre', { vaisseauId: nous });
        expect(journal(e)).toMatch(/n'était pas au contact au début du Tour/);
        e = agir(e, 'phase-suivante', {}); e = agir(agir(e, 'reveler', {}), 'phase-suivante', {});
        e = agir(agir(e, 'ordonner', { vaisseauId: eux, action: 'surcharger' }), 'reveler', {});
        e = agir(e, 'resoudre', { vaisseauId: nous });
        des(6);
        e = agir(e, 'resoudre', { vaisseauId: eux });
        expect(e.combat!.surcharges[eux]).toBe(2);
        e = agir(e, 'phase-suivante', {});
        for (let i = 0; i < 4; i++) e = agir(agir(e, 'reveler', {}), 'phase-suivante', {});
        expect(e.vaisseaux.find(v => v.id === eux)!.detruit).toBe(true);
        expect(journal(e)).toMatch(/réacteur de USS Patna explose/);
    });

    it('une réparation d’urgence tient le combat ; à la fin, l’avarie revient (elle ne tenait qu’un Quart)', () => {
        const { e: e0, nous } = demarrer();
        let e = { ...e0, vaisseaux: e0.vaisseaux.map(v => (v.id === nous ? { ...v, avaries: [{ id: 'avarie-test', gravite: 'mineure' as const, code: 25, restants: ['COMTECH' as const], etat: 'active' as const }] } : v)) };
        for (let i = 0; i < 3; i++) e = agir(agir(e, 'reveler', {}), 'phase-suivante', {});
        e = agir(e, 'ordonner', { vaisseauId: nous, action: 'reparer', avarieId: 'avarie-test', competence: 'COMTECH' });
        e = agir(e, 'reveler', {});
        des(6);
        e = agir(e, 'resoudre', { vaisseauId: nous });
        expect(e.vaisseaux.find(v => v.id === nous)!.avaries[0].etat).toBe('temporaire');
        e = agir(e, 'terminer-combat', {});
        expect(e.vaisseaux.find(v => v.id === nous)!.avaries[0]).toMatchObject({ etat: 'active', restants: ['COMTECH'] });
    });
});
