import { describe, it, expect } from 'vitest';
import {
    coupLocaliseSelonLeJeu, direLeCoup, etatDuTotal, porterLeCoup, soignerLaZone, zonesDuCombattant,
    type RegleDesCoupsLocalises, type ZoneDuCombattant,
} from './coupsDeRuneQuest';

/** Les coups localisés de RuneQuest, contre les exemples du livre (p. 146-148). */

const zone = (cle: ZoneDuCombattant['cle'], pv: number, armure = 0, degats = 0): ZoneDuCombattant => ({
    cle, label: cle, pv, armure, degats, champDesDegats: `degats_${cle}`,
    membre: ['jambe-droite', 'jambe-gauche', 'bras-droit', 'bras-gauche'].includes(cle),
});

const REGLE: RegleDesCoupsLocalises = {
    mecanique: 'runequest',
    zones: {
        tete: { pv: 'pv_tete', armure: 'pa_tete', degats: 'degats_tete' },
        'bras-gauche': { pv: 'pv_bras_gauche', armure: 'pa_bras_gauche', degats: 'degats_bras_gauche' },
    },
};

describe('un coup porté à une zone', () => {
    it('Vishi, lacéré au torse : 6 dégâts sur 6 PV, sans armure — hors combat, il crache du sang (p. 148)', () => {
        const coup = porterLeCoup(zone('poitrine', 6), 6);
        expect(coup).toMatchObject({ net: 6, retenus: 6, degatsApres: 6, atteinte: 'hors-d-usage' });
        expect(coup.effet).toMatch(/crache du sang/);
    });

    it('Harmast : 10 à la tête (4 PV, 1 d’armure) — 9 retenus, plus du double : inconscient (p. 148)', () => {
        const coup = porterLeCoup(zone('tete', 4, 1), 10);
        expect(coup).toMatchObject({ net: 9, retenus: 9, plafonne: false, atteinte: 'double' });
        expect(coup.effet).toMatch(/inconscient, il perd 1 PV par round/);
    });

    it('le soldat lunar : 19 à la tête (6 PV, 1 d’armure) — 18, le triple : mort (p. 148)', () => {
        const coup = porterLeCoup(zone('tete', 6, 1), 19);
        expect(coup).toMatchObject({ net: 18, atteinte: 'triple' });
        expect(coup.effet).toMatch(/mort sur le coup/);
    });

    it('un bras à 2 points touché pour 5 ne subit que 4 points : neutralisé (p. 148)', () => {
        const coup = porterLeCoup(zone('bras-droit', 2), 5);
        expect(coup).toMatchObject({ net: 5, retenus: 4, plafonne: true, atteinte: 'double' });
        expect(direLeCoup(coup)).toMatch(/4 retenus \(un membre ne prend pas plus du double\)/);
    });

    it('le même bras touché pour 8 : 4 points seulement, mais tranché (p. 148)', () => {
        expect(porterLeCoup(zone('bras-droit', 2), 8)).toMatchObject({ retenus: 4, atteinte: 'triple' });
    });

    it('le double d’un membre se lit sur un seul coup ; la tête cumule ses blessures', () => {
        // Jambe à 4 PV, déjà 5 dégâts : un coup de 3 la laisse hors d'usage, pas « au double ».
        expect(porterLeCoup(zone('jambe-gauche', 4, 0, 5), 3).atteinte).toBe('hors-d-usage');
        // Tête à 4 PV, déjà 5 dégâts : 3 de plus font 8, le double.
        expect(porterLeCoup(zone('tete', 4, 0, 5), 3).atteinte).toBe('double');
    });

    it('sous les points de vie de la zone, le coup ne fait que toucher ; l’armure peut tout arrêter', () => {
        expect(porterLeCoup(zone('jambe-droite', 4), 3)).toMatchObject({ atteinte: 'touchee', effet: '' });
        expect(porterLeCoup(zone('abdomen', 4, 3), 2)).toMatchObject({ net: 0, retenus: 0, atteinte: 'arretee' });
    });

    it('chaque zone dit son effet propre à ses points de vie (p. 147-148)', () => {
        expect(porterLeCoup(zone('jambe-droite', 4), 4).effet).toMatch(/combat au sol/);
        expect(porterLeCoup(zone('abdomen', 4), 4).effet).toMatch(/les deux jambes/);
        expect(porterLeCoup(zone('bras-gauche', 3), 3).effet).toMatch(/lâche ce qu'il tenait/);
        expect(porterLeCoup(zone('tete', 4), 4).effet).toMatch(/cinq minutes/);
    });
});

describe('le soin et le total', () => {
    it('un soin ne rend pas plus que la zone n’a perdu', () => {
        expect(soignerLaZone(zone('tete', 4, 0, 3), 5)).toEqual({ rendus: 3, degatsApres: 0 });
    });

    it('à 1 ou 2 points : inconscient ; à 0 ou moins : mort à la fin du round (p. 146-147)', () => {
        expect(etatDuTotal(3)).toBeUndefined();
        expect(etatDuTotal(2)).toMatch(/Inconscient/);
        expect(etatDuTotal(0)).toMatch(/Mort à la fin du round/);
    });
});

describe('à la porte des dégâts', () => {
    const fiche = { pv_tete: 4, pa_tete: 1, degats_tete: 0, pv_bras_gauche: 3, pa_bras_gauche: 0, degats_bras_gauche: 2 };

    it('lit les zones que le pilote déclare, dans l’ordre de la table', () => {
        expect(zonesDuCombattant(REGLE, fiche).map(z => [z.cle, z.pv, z.armure, z.degats])).toEqual([
            ['bras-gauche', 3, 0, 2], ['tete', 4, 1, 0],
        ]);
    });

    it('convertit un coup localisé : le total ne perd que ce que la zone retient', () => {
        const r = coupLocaliseSelonLeJeu(REGLE, fiche, { value: 10, location: 'tete' });
        expect(r?.impact).toEqual({ value: 9 });
        expect(r?.fiche).toEqual({ degats_tete: 9 });
        expect(r?.texte).toMatch(/^Tête : 10 − 1 d'armure = 9 dégâts ; tête à -5\/4 PV — au double/);
    });

    it('rend les points d’un soin à la zone et au total', () => {
        const r = coupLocaliseSelonLeJeu(REGLE, fiche, { value: 5, location: 'bras-gauche', isRecovery: true });
        expect(r?.impact).toEqual({ value: 2, isRecovery: true });
        expect(r?.fiche).toEqual({ degats_bras_gauche: 0 });
    });

    it('laisse passer un impact sans zone, ou sur une zone que le pilote ne déclare pas', () => {
        expect(coupLocaliseSelonLeJeu(REGLE, fiche, { value: 4 })).toBeNull();
        expect(coupLocaliseSelonLeJeu(REGLE, fiche, { value: 4, location: 'poitrine' })).toBeNull();
        expect(coupLocaliseSelonLeJeu(undefined, fiche, { value: 4, location: 'tete' })).toBeNull();
    });
});
