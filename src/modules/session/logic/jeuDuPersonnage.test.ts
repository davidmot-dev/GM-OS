import { describe, expect, it } from 'vitest';
import { ecartDeJeu, naissanceDansLeJeu, passerAuJeu } from './jeuDuPersonnage';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';

/*
  « TEst NOC » (David, 2026-10-13) : lié à la campagne TEST NOC, il portait la
  fiche de Within — sans panneau de jet, et sans que rien dise pourquoi.
*/
const pilote = (id: string, templateId: string, combat: Partial<GameDriver['combat']> = {}) => ({
    id, name: id.toUpperCase(), templateId,
    combat: { statsToTrack: [], initiativeFormula: '', ...combat },
}) as unknown as GameDriver;

const NOC = pilote('noc', 'tpl-noc', { defaultHealthType: 'hp' });
const WITHIN = pilote('within', 'tpl-within');
const DUNE_LIKE = pilote('horloges', 'tpl-horloges', { defaultHealthType: 'clocks' });

const gabarit = (id: string, champs: [string, string, unknown?][]) => ({
    id, name: id,
    sections: [{ id: 's', label: 'S', fields: champs.map(([fid, type, defaultValue]) => ({ id: fid, label: fid, type, defaultValue })) }],
}) as unknown as SheetTemplate;

const GABARITS = [
    gabarit('tpl-noc', [['action', 'number', 2], ['notes', 'textarea']]),
    gabarit('tpl-within', [['esprit', 'number'], ['notes', 'textarea']]),
    gabarit('tpl-horloges', [['combat', 'number', 4]]),
];

const CAMPAGNES = [{ id: 'c-noc', system: 'noc' }, { id: 'c-within', system: 'within' }];

describe('ecartDeJeu', () => {
    it('signale un personnage dont le jeu n’est pas celui de sa campagne', () => {
        const ecart = ecartDeJeu({ campaignId: 'c-noc', systemId: 'within', templateId: 'tpl-within' }, CAMPAGNES, [NOC, WITHIN]);
        expect(ecart?.jeuDuPersonnage?.id).toBe('within');
        expect(ecart?.jeuDeLaCampagne.id).toBe('noc');
    });

    it('ne dit rien quand les deux jeux s’accordent', () => {
        expect(ecartDeJeu({ campaignId: 'c-noc', systemId: 'noc', templateId: 'tpl-noc' }, CAMPAGNES, [NOC, WITHIN])).toBeNull();
    });

    it('ne compare qu’à la campagne du personnage, jamais à une autre', () => {
        expect(ecartDeJeu({ campaignId: null, systemId: 'within' }, CAMPAGNES, [NOC, WITHIN])).toBeNull();
    });

    it('ne dit rien quand le jeu de la campagne est introuvable', () => {
        expect(ecartDeJeu({ campaignId: 'c-x', systemId: 'within' }, [{ id: 'c-x', system: 'disparu' }], [WITHIN])).toBeNull();
    });
});

describe('passerAuJeu', () => {
    it('donne le jeu, la fiche et les champs de la campagne', () => {
        const { changements } = passerAuJeu({ sheetData: { esprit: 3 } }, NOC, GABARITS);
        expect(changements.systemId).toBe('noc');
        expect(changements.templateId).toBe('tpl-noc');
        expect(changements.sheetData).toMatchObject({ action: 2 });
    });

    it('reprend les valeurs d’un champ du même identifiant, et nomme celles qui se perdent', () => {
        const { changements, perdus } = passerAuJeu({ sheetData: { esprit: 3, notes: 'Suspect', vide: '' } }, NOC, GABARITS);
        expect(changements.sheetData?.notes).toBe('Suspect');
        expect(perdus).toEqual(['esprit']);
    });

    it('ne donne pas de points de vie à un jeu qui n’en compte pas', () => {
        const { changements } = passerAuJeu({ sheetData: {} }, DUNE_LIKE, GABARITS);
        expect(changements.healthSystem?.type).toBe('clocks');
        expect(changements.hp).toBeUndefined();
    });
});

describe('naissanceDansLeJeu', () => {
    it('fait naître un personnage de jeu à points de vie avec ses dix points', () => {
        const n = naissanceDansLeJeu(NOC, GABARITS[0]);
        expect(n.hp).toBe(10);
        expect(n.healthSystem?.type).toBe('hp');
        expect(n.sheetData).toEqual({ action: 2, notes: '' });
    });
});
