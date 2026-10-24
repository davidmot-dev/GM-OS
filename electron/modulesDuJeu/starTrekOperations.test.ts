import { describe, it, expect } from 'vitest';
import * as op from '../../outils/star-trek/operations/moteur.mjs';
import manifeste from '../../outils/star-trek/operations/manifeste.json';
import { validerLeManifeste } from '../../outils/modules-du-jeu/contrat.mjs';
import type { EtatOperations, Vaisseau, VaisseauVu, VaisseauLointain } from '../../outils/star-trek/operations/moteur.mjs';

/** Star Trek Adventures, deuxième édition — les exemples du Livre de Base, pages imprimées. */
const MJ = { role: 'mj' as const };
const vaisseau = (id: string, camp: 'joueurs' | 'adverse', reglages: Partial<Vaisseau> = {}): Parameters<typeof op.appliquerCommande>[1] => ({
    id: 'vaisseau', charge: { vaisseau: {
        id, nom: id, camp, envergure: 5, bonusResistance: 0, bonusBoucliers: 0, qualiteEquipage: camp === 'adverse' ? 'exceptionnel' : null, armes: [],
        systemes: { communications: 9, ordinateurs: 10, moteurs: 10, detecteurs: 10, structure: 9, armement: 10 },
        fonctions: { commandement: 3, navigation: 2, ingenierie: 3, securite: 3, medecine: 2, science: 2 },
        ...reglages,
    } },
});
const avec = (...commandes: Parameters<typeof op.appliquerCommande>[1][]) =>
    commandes.reduce<EtatOperations>((e, c) => op.appliquerCommande(e, c, MJ), op.creerEtat());
const leVaisseau = (e: EtatOperations, id: string) => e.vaisseaux.find(v => v.id === id)!;

describe('le module des opérations de Star Trek', () => {
    it('respecte le contrat des modules', () => {
        expect(validerLeManifeste(manifeste)).toEqual([]);
    });

    it('la Résistance et les Boucliers de l’Enterprise-D (p. 185)', () => {
        const e = avec(vaisseau('enterprise', 'joueurs', { envergure: 6, systemes: { communications: 10, ordinateurs: 10, moteurs: 10, detecteurs: 10, structure: 10, armement: 10 },
            fonctions: { commandement: 4, navigation: 3, ingenierie: 3, securite: 3, medecine: 3, science: 4 } }));
        const v = leVaisseau(e, 'enterprise');
        expect(op.resistanceDe(v)).toBe(5);
        expect(v.boucliers).toBe(19);
    });

    it('le Titan-A : 11 dégâts, Résistance 5, Boucliers 14 → 8 sur 17, secoué sans brèche (p. 310)', () => {
        let e = avec(vaisseau('titan', 'joueurs', { envergure: 5, bonusResistance: 0, bonusBoucliers: 0,
            systemes: { communications: 10, ordinateurs: 10, moteurs: 10, detecteurs: 10, structure: 12, armement: 10 },
            fonctions: { commandement: 3, navigation: 3, ingenierie: 3, securite: 0, medecine: 3, science: 3 } }));
        expect(op.resistanceDe(leVaisseau(e, 'titan'))).toBe(6);
        e = op.appliquerCommande(e, { id: 'etat-vaisseau', charge: { vaisseauId: 'titan', boucliers: 14 } }, MJ);
        e = op.appliquerCommande(e, { id: 'attaque', charge: { cibleId: 'titan', degats: 9, plus: 3, des: [12, 3] } }, MJ);
        const v = leVaisseau(e, 'titan');
        expect(v.boucliers).toBe(8);
        expect(v.secoue).toBe('securite');
        expect(v.breches).toEqual([]);
    });

    it('sous le quart d’un même coup : secoué puis brèche ; à zéro, une de plus', () => {
        let e = avec(vaisseau('defiant', 'joueurs'));
        const max = leVaisseau(e, 'defiant').boucliers;
        e = op.appliquerCommande(e, { id: 'etat-vaisseau', charge: { vaisseauId: 'defiant', boucliers: 10 } }, MJ);
        e = op.appliquerCommande(e, { id: 'attaque', charge: { cibleId: 'defiant', degats: 12, systeme: 'armement', des: [14] } }, MJ);
        const v = leVaisseau(e, 'defiant');
        expect(max).toBe(17);
        expect([v.boucliers, v.secoue, v.breches.length]).toEqual([3, 'victimes', 1]);
        e = op.appliquerCommande(e, { id: 'attaque', charge: { cibleId: 'defiant', degats: 20, systeme: 'structure', des: [8] } }, MJ);
        expect(leVaisseau(e, 'defiant').breches.length).toBe(3);
    });

    it('Boucliers à zéro : chaque coup est une brèche ; la moitié de l’Envergure détruit le système (p. 311)', () => {
        let e = avec(vaisseau('odyssey', 'joueurs', { envergure: 4 }));
        e = op.appliquerCommande(e, { id: 'etat-vaisseau', charge: { vaisseauId: 'odyssey', boucliers: 0 } }, MJ);
        e = op.appliquerCommande(e, { id: 'attaque', charge: { cibleId: 'odyssey', degats: 4, systeme: 'moteurs' } }, MJ);
        e = op.appliquerCommande(e, { id: 'attaque', charge: { cibleId: 'odyssey', degats: 4, systeme: 'moteurs' } }, MJ);
        const vue = op.vuePour(e, MJ).vaisseaux[0] as VaisseauVu;
        expect(vue.detruits).toEqual(['moteurs']);
    });

    it('au-delà de l’Envergure, dégâts critiques et noyau instable ; la brèche suivante détruit (p. 311)', () => {
        let e = avec(vaisseau('chasseur', 'adverse', { envergure: 2 }));
        e = op.appliquerCommande(e, { id: 'etat-vaisseau', charge: { vaisseauId: 'chasseur', boucliers: 0 } }, MJ);
        for (let i = 0; i < 3; i++) e = op.appliquerCommande(e, { id: 'attaque', charge: { cibleId: 'chasseur', degats: 3, systeme: 'moteurs' } }, MJ);
        expect(op.degatsCritiques(leVaisseau(e, 'chasseur'))).toBe(true);
        expect(leVaisseau(e, 'chasseur').noyau).toBe('instable');
        e = op.appliquerCommande(e, { id: 'noyau', charge: { vaisseauId: 'chasseur', des: [2] } }, MJ);
        expect(leVaisseau(e, 'chasseur').detruit).toBe(false);
        e = op.appliquerCommande(e, { id: 'attaque', charge: { cibleId: 'chasseur', degats: 3, systeme: 'structure' } }, MJ);
        expect(leVaisseau(e, 'chasseur').detruit).toBe(true);
    });

    it('un PNJ secoué choisit toujours la position de sécurité ; Perforant ignore la Résistance', () => {
        let e = avec(vaisseau('lakota', 'adverse'));
        e = op.appliquerCommande(e, { id: 'etat-vaisseau', charge: { vaisseauId: 'lakota', boucliers: 14 } }, MJ);
        e = op.appliquerCommande(e, { id: 'attaque', charge: { cibleId: 'lakota', degats: 6, perforant: true, des: [3] } }, MJ);
        expect([leVaisseau(e, 'lakota').boucliers, leVaisseau(e, 'lakota').secoue]).toEqual([8, 'securite']);
    });

    it('recharger les Boucliers consomme l’énergie : Ingénierie + 1, +2 par Impulsion (p. 303)', () => {
        let e = avec(vaisseau('defiant', 'joueurs'));
        e = op.appliquerCommande(e, { id: 'etat-vaisseau', charge: { vaisseauId: 'defiant', boucliers: 5 } }, MJ);
        e = op.appliquerCommande(e, { id: 'recharger-boucliers', charge: { vaisseauId: 'defiant', ingenierie: 4, impulsion: 2 } }, MJ);
        expect([leVaisseau(e, 'defiant').boucliers, leVaisseau(e, 'defiant').energie]).toEqual([14, false]);
        expect(() => op.appliquerCommande(e, { id: 'recharger-boucliers', charge: { vaisseauId: 'defiant', ingenierie: 4 } }, MJ)).toThrow(/énergie/);
        e = op.appliquerCommande(e, { id: 'nouvelle-scene', charge: {} }, MJ);
        expect([leVaisseau(e, 'defiant').boucliers, leVaisseau(e, 'defiant').energie]).toEqual([17, true]);
    });

    it('la tâche étendue de Reed : impact 4 − obstacle 1 + un effort = 4 ; avancées à 6 et 9 sur 12 (p. 272–273)', () => {
        expect(op.avanceesParDefaut(12)).toEqual([6, 9]);
        expect(op.avanceesParDefaut(9)).toEqual([5, 7]);
        let e = avec({ id: 'tache', charge: { tache: { id: 'mine', nom: 'Désamorcer la mine', genre: 'etendue', jauge: 16, difficulte: 3, obstacle: 1 } } });
        e = op.appliquerCommande(e, { id: 'impact', charge: { tacheId: 'mine', fonction: 4, efforts: 1 } }, MJ);
        expect(e.taches[0].coches).toBe(4);
        expect(e.journal.at(-1)).toMatch(/impact 4, 4 \/ 16/);
    });

    it('un défi chronométré compte ses intervalles ; ses tâches clés le remportent', () => {
        let e = avec({ id: 'defi', charge: { defi: { id: 'bombe', nom: 'La bombe', intervalles: { total: 6, restants: 6 },
            taches: [{ id: 'couvercle', nom: 'Ôter le couvercle', faite: false }, { id: 'charge', nom: 'Isoler la charge', faite: false }] } } });
        e = op.appliquerCommande(e, { id: 'intervalles', charge: { defiId: 'bombe', consommes: 1 } }, MJ);
        e = op.appliquerCommande(e, { id: 'intervalles', charge: { defiId: 'bombe', consommes: 4 } }, MJ);
        expect(e.defis[0].intervalles!.restants).toBe(1);
        e = op.appliquerCommande(e, { id: 'defi-tache', charge: { defiId: 'bombe', tacheId: 'couvercle', faite: true } }, MJ);
        e = op.appliquerCommande(e, { id: 'defi-tache', charge: { defiId: 'bombe', tacheId: 'charge', faite: true } }, MJ);
        expect(e.journal.at(-1)).toMatch(/défi est remporté/);
    });

    it('l’équipage voit son vaisseau en entier, l’adversaire de loin, et seulement les tâches visibles', () => {
        const e = avec(vaisseau('defiant', 'joueurs'), vaisseau('lakota', 'adverse'),
            { id: 'tache', charge: { tache: { id: 'secrete', nom: 'Le traître', genre: 'consequence', jauge: 10, impact: 3, visible: false } } });
        const vue = op.vuePour(e, { role: 'joueur', personnageId: 'kira' });
        expect((vue.vaisseaux[0] as VaisseauVu).resistance).toBeGreaterThan(0);
        expect(vue.vaisseaux[1]).toEqual({ id: 'lakota', nom: 'lakota', camp: 'adverse', envergure: 5, detruit: false, secoue: false, bouclierPourcent: 100, breches: 0 } satisfies VaisseauLointain);
        expect(vue.taches).toEqual([]);
        expect(() => op.appliquerCommande(e, { id: 'nouvelle-scene', charge: {} }, { role: 'joueur', personnageId: 'kira' })).toThrow(/meneur/);
    });
});
