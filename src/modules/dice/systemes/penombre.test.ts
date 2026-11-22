import { describe, expect, it } from 'vitest';
import {
    appliquerLaMerveille, composerLaReserveDePenombre, depenserDesJetons, difficulteDeLEffet, etatDeLaConscience,
    facesDuDeHarmonique, harmoniqueNommee, lancerPenombre, lireLaConscience, lireLeTimbre, perdreDesJetons,
    reactiverUnJeton, relancerPenombre, succesDuDe, tailleDeLaReserveCollegiale, type RegleDePenombre,
} from './penombre';

/** Les exemples du livre de base (pages imprimées = PDF), 22/11/2026. */
const REGLE: RegleDePenombre = {
    harmoniques: { ame: 'ame', esprit: 'esprit', etincelle: 'etincelle', nature: 'nature', nuit: 'nuit' },
    composanteHarmonique: 'harmonique',
    composanteAtout: 'atout',
    atouts: [1, 2, 3].map(i => ({ niveau: `atout${i}_niveau`, libelle: `atout${i}` })),
    cle: 'cle',
    conscience: { restants: 'conscience', actifs: 'jetons_actifs', max: 'conscience_max' },
    timbre: 'timbre',
    partition: { cle: 'partition_cle', notes: ['partition_note1', 'partition_note2', 'partition_note3', 'partition_note4'] },
    reserveCollegiale: 'reserve_collegiale',
};

/** Rend les valeurs dans l'ordre, puis échoue : un dé de trop serait un défaut. */
const des = (...valeurs: number[]) => () => {
    const v = valeurs.shift();
    if (v === undefined) throw new Error('un dé de trop');
    return v;
};

const LANCINE = {
    cle: 'âme', ame: 'D8', esprit: 'D12', etincelle: 'D10', nature: 'D6', nuit: 'D4',
    atout1: 'N’aie pas peur, que pourrais-je te faire ?', atout1_niveau: 2,
    atout2: 'Mémoire des textes et des anecdotes', atout2_niveau: 3,
    conscience: 7, jetons_actifs: 7, conscience_max: 7, timbre: 'harmonieux',
};

describe('Pénombre — les succès', () => {
    it('un succès par tranche de 4 (p. 31)', () => {
        expect([1, 3, 4, 7, 8, 11, 12, 15, 16, 19, 20].map(succesDuDe)).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5]);
    });

    it('lit les dés harmoniques de la fiche et du pilote forgé', () => {
        expect(['D4', 'd8', '1D10', ' D12 ', 12, 'dé à six faces', 'dé à dix faces'].map(facesDuDeHarmonique)).toEqual([4, 8, 10, 12, 12, 6, 10]);
        expect(['D20', 'D7', '', 'Âme', 14].map(facesDuDeHarmonique)).toEqual([null, null, null, null, null]);
        expect(['Âme', 'étincelle', 'Nuit', 'nature', 'esprits', 'rien'].map(harmoniqueNommee)).toEqual(['ame', 'etincelle', 'nuit', 'nature', 'esprit', null]);
    });
});

describe('Pénombre — la réserve', () => {
    it('Charlie : D8 d’âme et l’atout de niveau 2, 7, 4 et 5 font 3 succès (p. 31-32)', () => {
        const r = composerLaReserveDePenombre(REGLE, LANCINE, { harmonique: 'ame', atout: 'atout1_niveau' }, { difficulte: 1 });
        expect(r.des.map(d => d.faces)).toEqual([8, 6, 6]);
        expect(r.cout).toBe(0);
        expect(r.estLaCle).toBe(true);
        expect(r.titre).toBe('Âme D8 + N’aie pas peur, que pourrais-je te faire ? 2');
        const j = lancerPenombre(r, des(7, 4, 5));
        expect(j.penombre.succes).toBe(3);
        expect(j.penombre.reussite).toBe(true);
        expect(j.penombre.consequences).toEqual({ fausseNote: false, envolee: false, incident: false, merveille: false });
    });

    it('un atout de plus coûte 1 jeton, un troisième aussi : les dépenses se cumulent (p. 24, 31)', () => {
        const r = composerLaReserveDePenombre(REGLE, { ...LANCINE, atout3: 'Toutes les fées ne sont pas fragiles', atout3_niveau: 2 },
            { harmonique: 'ame', atout: 'atout1_niveau' }, { atoutsEnPlus: ['atout2_niveau', 'atout3_niveau'] });
        expect(r.des).toHaveLength(1 + 2 + 3 + 2);
        expect(r.cout).toBe(2);
    });

    it('le D20 merveilleux remplace le dé harmonique ; effet de niveau 3 pour une maîtrise de 1 : 4 jetons (p. 35)', () => {
        const nimbe = { cle: 'nature', ame: 'D6', nature: 'D10', atout1: 'Flûtiau en roseau de la Cataracte', atout1_niveau: 2, conscience: 7, jetons_actifs: 7, conscience_max: 7 };
        const r = composerLaReserveDePenombre(REGLE, nimbe, { harmonique: 'ame', atout: 'atout1_niveau' }, {
            merveilles: true, difficulte: 1, avantages: 1,
            magie: { niveau: 3, maitrise: 1, cible: 'mortel', distance: 'lointain', prerequis: 'action', principal: true },
        });
        expect(r.des.map(d => d.faces)).toEqual([20, 6, 6]);
        expect(r.cout).toBe(4);
        expect(r.difficulte).toBe(4);
        expect(r.estLaCle).toBe(false);
        // 2 succès sur 4, et un 1 au D20 : incident magique ; la relance du D20 fait 20, 7 succès (p. 35-36).
        const j = lancerPenombre(r, des(1, 4, 5));
        expect(j.penombre.succes).toBe(2);
        expect(j.penombre.consequences.incident).toBe(true);
        const apres = relancerPenombre(j, [0], des(20));
        expect(apres.penombre.succes).toBe(7);
        expect(apres.penombre.reussite).toBe(true);
        expect(apres.penombre.consequences).toMatchObject({ incident: true, merveille: true });
        expect(apres.penombre.relances).toBe(1);
    });

    it('Lancine en nuit : 1, 4 et 5, deux succès malgré la fausse note (p. 33-34)', () => {
        const r = composerLaReserveDePenombre(REGLE, LANCINE, { harmonique: 'nuit', atout: 'atout1_niveau' }, { difficulte: 2 });
        const j = lancerPenombre(r, des(1, 4, 5));
        expect(j.penombre.succes).toBe(2);
        expect(j.penombre.reussite).toBe(true);
        expect(j.penombre.consequences.fausseNote).toBe(true);
    });

    it('Élégie : 6 sur son D6 de nuit, envolée, et 2 succès (p. 34)', () => {
        const elegie = { nuit: 'D6', atout1: 'Invisible si je veux', atout1_niveau: 3 };
        const r = composerLaReserveDePenombre(REGLE, elegie, { harmonique: 'nuit', atout: 'atout1_niveau' }, { difficulte: 2 });
        const j = lancerPenombre(r, des(6, 4, 3, 1));
        expect(j.penombre.succes).toBe(2);
        expect(j.penombre.consequences.envolee).toBe(true);
    });

    it('succès manquants et succès ajoutés (p. 33, 44)', () => {
        const r = composerLaReserveDePenombre(REGLE, LANCINE, { harmonique: 'ame' }, { difficulte: 4, succesEnPlus: 1 });
        const j = lancerPenombre(r, des(7));
        expect(j.penombre.succes).toBe(2);
        expect(j.penombre.manquants).toBe(2);
        expect(j.tagSuccess).toBe(false);
    });

    it('refuse un dé harmonique absent ou hors des cinq tailles', () => {
        expect(composerLaReserveDePenombre(REGLE, { ame: '' }, { harmonique: 'ame' }, {}).avertissements[0]).toMatch(/aucun dé harmonique/);
        expect(composerLaReserveDePenombre(REGLE, { ame: 'D20' }, { harmonique: 'ame' }, {}).avertissements[0]).toMatch(/D4, D6, D8, D10 ou D12/);
        expect(composerLaReserveDePenombre(REGLE, { ame: 'D8' }, {}, {}).avertissements[0]).toMatch(/Harmonique/);
    });

    it('troublée, elle ne dépense plus ; épuisée, elle n’agit plus (p. 25)', () => {
        const troublee = { ...LANCINE, jetons_actifs: 0 };
        expect(composerLaReserveDePenombre(REGLE, troublee, { harmonique: 'ame' }, {}).avertissements).toEqual([]);
        expect(composerLaReserveDePenombre(REGLE, troublee, { harmonique: 'ame' }, { merveilles: true }).avertissements[0]).toMatch(/Troublée/);
        expect(composerLaReserveDePenombre(REGLE, { ...LANCINE, conscience: 0 }, { harmonique: 'ame' }, {}).avertissements[0]).toMatch(/Épuisée/);
    });

    it('une dissonante ne paie pas en jetons collégiaux (p. 103)', () => {
        const r = composerLaReserveDePenombre(REGLE, { ...LANCINE, timbre: 'dissonant' }, { harmonique: 'ame' }, { merveilles: true, payeur: 'collegiale' });
        expect(r.avertissements[0]).toMatch(/Dissonante/);
    });
});

describe('Pénombre — la difficulté magique (p. 30)', () => {
    it('accord niveau 3, cible lointaine, musique avantageuse : 4 (p. 35)', () => {
        expect(difficulteDeLEffet({ niveau: 3, maitrise: 1, cible: 'mortel', distance: 'lointain', prerequis: 'action', principal: true }, 1)).toBe(4);
    });
    it('jornisme niveau 2 sur un groupe éloigné : 6 (p. 44)', () => {
        expect(difficulteDeLEffet({ niveau: 2, maitrise: 2, cible: 'groupe', distance: 'lointain', prerequis: 'action', principal: true })).toBe(6);
    });
    it('jamais sous le niveau de l’effet', () => {
        expect(difficulteDeLEffet({ niveau: 3, maitrise: 3, cible: 'mortel', distance: 'proche', prerequis: 'rituel', principal: true }, 2)).toBe(3);
        expect(difficulteDeLEffet({ niveau: 2, maitrise: 2, cible: 'foule', distance: 'hors-champ', prerequis: 'tour', principal: true })).toBe(2 + 4 + 5 - 1);
    });
});

describe('Pénombre — les jetons (p. 24-25)', () => {
    it('lit la conscience, bornée', () => {
        expect(lireLaConscience(REGLE, { conscience: 9, jetons_actifs: 12, conscience_max: 7 })).toEqual({ restants: 7, actifs: 7, max: 7 });
        expect(lireLaConscience(REGLE, {})).toEqual({ restants: 7, actifs: 7, max: 7 });
    });
    it('dépenser retourne des actifs ; perdre retire les inactifs d’abord', () => {
        const c = { restants: 7, actifs: 4, max: 7 };
        expect(depenserDesJetons(c, 2)).toEqual({ restants: 7, actifs: 2, max: 7 });
        expect(depenserDesJetons(c, 5)).toBeNull();
        expect(perdreDesJetons(c, 2)).toEqual({ restants: 5, actifs: 4, max: 7 });
        expect(perdreDesJetons(c, 5)).toEqual({ restants: 2, actifs: 2, max: 7 });
        expect(perdreDesJetons(c, 9)).toEqual({ restants: 0, actifs: 0, max: 7 });
        expect(reactiverUnJeton({ restants: 3, actifs: 3, max: 7 })).toEqual({ restants: 3, actifs: 3, max: 7 });
        expect(reactiverUnJeton({ restants: 3, actifs: 1, max: 7 }).actifs).toBe(2);
    });
    it('déterminée, troublée, épuisée', () => {
        expect(etatDeLaConscience({ restants: 3, actifs: 1, max: 7 })).toBe('determinee');
        expect(etatDeLaConscience({ restants: 3, actifs: 0, max: 7 })).toBe('troublee');
        expect(etatDeLaConscience({ restants: 0, actifs: 0, max: 7 })).toBe('epuisee');
    });
});

describe('Pénombre — la merveille et le timbre (p. 36-37, 102)', () => {
    const c = { restants: 7, actifs: 5, max: 7 };
    it('Nimbé, clé nature, merveille en âme : une note, timbre inchangé (p. 36)', () => {
        const e = appliquerLaMerveille({ cle: false, notes: [false, false, false, false], timbre: 'harmonieux', conscience: c }, false);
        expect(e.apres.notes).toEqual([true, false, false, false]);
        expect(e.apres.timbre).toBe('harmonieux');
        expect(e.pouvoir).toBe(false);
    });
    it('la clé : un pouvoir ; un timbre faux redevient harmonieux ; déjà cochée, dissonant', () => {
        const a = appliquerLaMerveille({ cle: false, notes: [false, false, false, false], timbre: 'faux', conscience: c }, true);
        expect(a).toMatchObject({ pouvoir: true, apres: { cle: true, timbre: 'harmonieux' } });
        const b = appliquerLaMerveille({ cle: true, notes: [true, false, false, false], timbre: 'harmonieux', conscience: c }, true);
        expect(b.apres.timbre).toBe('dissonant');
    });
    it('les notes toutes cochées : faux ; une dissonante qui coche une note redevient harmonieuse', () => {
        expect(appliquerLaMerveille({ cle: false, notes: [true, true, true, true], timbre: 'harmonieux', conscience: c }, false).apres.timbre).toBe('faux');
        expect(appliquerLaMerveille({ cle: true, notes: [true, false, false, false], timbre: 'dissonant', conscience: c }, false).apres.timbre).toBe('harmonieux');
    });
    it('la partition complète : +1 en conscience, cases effacées', () => {
        const e = appliquerLaMerveille({ cle: true, notes: [true, true, true, false], timbre: 'harmonieux', conscience: c }, false);
        expect(e.partitionComplete).toBe(true);
        expect(e.apres).toMatchObject({ cle: false, notes: [false, false, false, false], conscience: { max: 8, restants: 8, actifs: 6 } });
    });
    it('lit le timbre de la fiche, et celui de la fiche HTML', () => {
        expect(['Harmonieux', 'faux', 'false', 'dissonant', '', 'harmonious'].map(lireLeTimbre)).toEqual(['harmonieux', 'faux', 'faux', 'dissonant', 'harmonieux', 'harmonieux']);
    });
});

describe('Pénombre — la réserve collégiale (p. 24)', () => {
    it('10, 5 ou aucun jeton ; la variante héroïque compte par Éminence grise', () => {
        expect(tailleDeLaReserveCollegiale(['harmonieux', 'harmonieux', 'harmonieux'])).toBe(10);
        expect(tailleDeLaReserveCollegiale(['harmonieux', 'faux'])).toBe(5);
        expect(tailleDeLaReserveCollegiale(['faux', 'dissonant'])).toBe(0);
        expect(tailleDeLaReserveCollegiale(['harmonieux', 'faux', 'dissonant'], true)).toBe(3);
    });
});
