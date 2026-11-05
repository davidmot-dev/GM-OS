import { describe, it, expect, vi } from 'vitest';
import { preparerDommagesCoc, lancerDommagesCoc } from './dommagesDeCoc';
import { CLE_PROFIL_COC, etatsDuProfilCoc, tailleSanteCoc, refusProfilCoc, bonusBandeCoc, type ProfilPnjCoc } from './profilsDeCoc';
import { CLE_SUIVI_COC, signalerBlessureCoc, operationSanteCoc, blocageSanteCoc, type SuiviCoc } from './suiviDeCoc';
import { CHOIX_DE_COC, preparerCoc, lancerCoc, malusDeSante } from './coc';
import { encaissementSelonLeJeu } from '../../combat/logic/encaissementDeCoc';
import { casesAligneesSurLaFiche } from '../../session/logic/HealthInterpreter';

const profil = (role: ProfilPnjCoc['role'], pulp = false): ProfilPnjCoc => ({ role, pulp, caracteristiques: role === 'figurant' ? ['force'] : role === 'second' ? ['force', 'agilite', 'perception'] : ['force', 'force', 'agilite', 'constitution', 'perception'], capacites: [] });
const fiche = (s: SuiviCoc) => ({ [CLE_SUIVI_COC]: s });
const resoudre = (s: SuiviCoc, e: number, genre: string, reussite?: boolean, duree?: number) => operationSanteCoc(fiche(s), e, 2, { id: `${s.sequence}-resolution`, type: 'resoudre', demande: s.demandes.find(d => d.genre === genre)!.id, reussite, duree });
describe('COC-A1 : DM de l’arme, critique fixe et une seule RD', () => {
    it('revolver : d8=7, critique +8, RD2 => 13 ; aucune FOR au tir', () => {
        const de = vi.fn(() => 7), r = lancerDommagesCoc(preparerDommagesCoc('1d8', 'distance', 4, true, 8), de)!;
        expect(r.total).toBe(15); expect(de).toHaveBeenCalledTimes(1);
        const e = encaissementSelonLeJeu({ mecanique: 'coc', sante: 'sante', rd: 'rd', suivi: true }, { sante: 0, rd: 2 }, { value: r.total, coc: { critique: true } })!;
        expect(e.impact.value).toBe(13);
    });
    it.each(['contact', 'lancer', 'mains-nues'] as const)('FOR ajoutée seulement au %s, pas dans le critique', type => {
        expect(lancerDommagesCoc(preparerDommagesCoc('1d6+1', type, 3, true), () => 4)?.total).toBe(15);
    });
    it('explosif critique : maximum sans lancer ni bonus supplémentaire ; formule invalide refusée', () => {
        const de = vi.fn();
        expect(lancerDommagesCoc(preparerDommagesCoc('2d6+2', 'explosif', 5, true, 14), de)?.total).toBe(14);
        expect(de).not.toHaveBeenCalled(); expect(preparerDommagesCoc('eval(1)', 'distance', 0, false)).toHaveProperty('refus');
    });
});
describe('COC-A2 : conséquences confirmées et persistantes', () => {
    it('10 : CON10 échouée perd une action, sans seconde application après sérialisation', () => {
        const s = signalerBlessureCoc({}, 9, 10, false, false);
        expect(s.demandes[0].difficulte).toBe(10);
        const r = resoudre(s, 10, 'affaibli', false);
        expect(r.suivi.actionsPerdues).toBe(1);
        const recharge = JSON.parse(JSON.stringify(fiche(r.suivi)));
        expect(operationSanteCoc(recharge, 10, 2, { id: '1-resolution', type: 'resoudre', demande: s.demandes[0].id, reussite: false }).appliquee).toBe(false);
        const fin = operationSanteCoc(recharge, 10, 2, { id: 'action', type: 'consommer-action-perdue' });
        expect(fin.suivi.actionsPerdues).toBe(0);
        expect(operationSanteCoc(fiche(fin.suivi), 10, 2, { id: 'action2', type: 'consommer-action-perdue' }).appliquee).toBe(false);
    });
    it('Blessé : une action perdue même sur CON réussie, puis test préalable à chaque action physique', () => {
        let s = resoudre(signalerBlessureCoc({}, 0, 15, false, false), 15, 'blesse', true).suivi;
        expect(s.actionsPerdues).toBe(1);
        s = operationSanteCoc(fiche(s), 15, 2, { id: 'perdue', type: 'consommer-action-perdue' }).suivi;
        expect(blocageSanteCoc(fiche(s), 15, true)).toContain('CON');
        s = operationSanteCoc(fiche(s), 15, 2, { id: 'prepare', type: 'action-physique' }).suivi;
        const r = resoudre(s, 15, 'action-blesse', false);
        expect(r.dm).toBe(1); expect(r.suivi.inconscience).toEqual({ unite: 'tour', reste: 2, reveil: false });
        s = operationSanteCoc(fiche(r.suivi), 16, 2, { id: 't1', type: 'avancer', unite: 'tour' }).suivi;
        expect(s.inconscience?.reste).toBe(1);
        s = operationSanteCoc(fiche(s), 16, 2, { id: 't2', type: 'avancer', unite: 'tour' }).suivi;
        expect(s.inconscience).toBeUndefined();
    });
    it('Mourant : 1d6 rounds puis CON20 ; coma, délai et mort à confirmer, stabilisation conserve la santé', () => {
        let s = resoudre(signalerBlessureCoc({}, 0, 20, true, false), 20, 'mourant', undefined, 1).suivi;
        s = operationSanteCoc(fiche(s), 20, 2, { id: 'round', type: 'avancer', unite: 'round' }).suivi;
        expect(s.demandes.some(d => d.genre === 'reveil')).toBe(true);
        s = resoudre(s, 20, 'reveil', false).suivi;
        expect(s.comaReste).toBe(2); expect(s.mort).toBe(false);
        for (let i = 0; i < 2; i++) s = operationSanteCoc(fiche(s), 20, 2, { id: `minute${i}`, type: 'avancer', unite: 'minute' }).suivi;
        expect(s.mort).toBe(false); expect(s.demandes.some(d => d.genre === 'mort-directe' && !d.traitee)).toBe(true);
        s = operationSanteCoc(fiche(s), 20, 2, { id: 'soins', type: 'stabiliser' }).suivi;
        expect(s.coma).toBeUndefined(); expect(s.demandes.some(d => d.genre === 'mort-directe' && !d.traitee)).toBe(false);
    });
});
describe('COC-A3 : profils, Pulp explicite, restrictions critiques et bandes', () => {
    it.each(['figurant', 'second', 'premier'] as const)('%s : standard20 ; Pulp4/12/24, le 20 n’est critique que pour le premier rôle', role => {
        const p = profil(role);
        expect(tailleSanteCoc(p)).toBe(20); expect(refusProfilCoc(p)).toBeUndefined();
        const prep = preparerCoc({ pnj: true }, CHOIX_DE_COC, { valeur: 2 }, { [CLE_PROFIL_COC]: p });
        expect(lancerCoc(prep, () => 20).coc.bilan).toBe(role === 'premier' ? 'reussite-critique' : 'reussite');
        expect(lancerCoc(prep, () => 1).coc.bilan).toBe('echec-critique');
        expect(tailleSanteCoc({ ...p, pulp: true })).toBe(role === 'figurant' ? 4 : role === 'second' ? 12 : 24);
    });
    it('petites échelles : pas d’états prénoircis ; premier Pulp : seuils 6/12/18/24', () => {
        expect(etatsDuProfilCoc(profil('figurant', true)).map(e => e.echelon)).toEqual([4]);
        expect(etatsDuProfilCoc(profil('second', true)).map(e => e.echelon)).toEqual([2, 7, 12]);
        const p = profil('premier', true);
        expect(etatsDuProfilCoc(p).map(e => e.echelon)).toEqual([6, 12, 18, 24]);
        expect(malusDeSante(5, 'd20', p)).toBe(0); expect(malusDeSante(6, 'd20', p)).toBe(1);
        const h = casesAligneesSurLaFiche(undefined, { defaultHealthType: 'boxes', casesDeSante: { champ: 'sante', nombre: 20 } }, { [CLE_PROFIL_COC]: p, sante: 6 })!;
        expect(h.data.boxes).toHaveLength(24); expect(h.state).toBe('scratched');
    });
    it('refuse un budget dépassé ; bande3 : une touche retire un seul membre, DM/RD ignorés', () => {
        const p = { ...profil('figurant'), bande: 3 };
        expect(refusProfilCoc({ ...p, capacites: [{ nom: 'Combat', niveau: 'expert', detail: '' }] })).toContain('Budget');
        const r = { mecanique: 'coc' as const, sante: 'sante', rd: 'rd', suivi: true };
        expect(encaissementSelonLeJeu(r, { [CLE_PROFIL_COC]: p, sante: 0, rd: 50 }, { value: 100, coc: { touche: true } })?.impact.value).toBe(1);
        expect(encaissementSelonLeJeu(r, { [CLE_PROFIL_COC]: p, sante: 0 }, { value: 100 })?.impact.value).toBe(0);
        expect([1, 2, 3, 4].map(bonusBandeCoc)).toEqual([0, 2, 5, 10]);
        const prep = preparerCoc({ pnj: true, sante: 'sante', attaques: ['atc'] }, CHOIX_DE_COC, { valeur: 2, champ: 'atc' }, { [CLE_PROFIL_COC]: p, sante: 0 });
        expect(prep.total).toBe(7); // +2 d’attaque, deux conditions de surnombre => +5.
        const compense = preparerCoc({ pnj: true, sante: 'sante', attaques: ['atc'] }, { ...CHOIX_DE_COC, conditions: -1 }, { valeur: 2, champ: 'atc' }, { [CLE_PROFIL_COC]: p, sante: 0 });
        expect(compense.total).toBe(4); // Une condition défavorable compense une du surnombre.
    });
});
