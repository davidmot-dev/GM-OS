import { describe, expect, it } from 'vitest';
import {
    actionsRestantes, bonusDeLaProchaineAction, calculerLeCoup, contreLActive, contreLaPassive, defensePassive,
    depenserUneAction, egoPermis, FACTEURS_DE_DEFENSE, lancerLInitiative, lireLaManiabilite, lireLesDegats, lireLesProprietes,
    ordonnerLInitiative, rendreUneAction, SANS_PROPRIETE,
} from './combatDeDegenesis';

/** Une file de dés : le hasard imposé, dans l'ordre. */
const file = (...des: number[]) => { let i = 0; return () => des[i++ % des.length]; };

describe('Le round de Degenesis (DEG-A1, p. 100-101)', () => {
    it("deux points d'Égo : +2D à l'initiative, payés une fois, puis à la première action seulement", () => {
        // PSY 2 + Réactivité 2 = 4, +2D d'Égo : six dés.
        const { etat, jet, egoPaye } = lancerLInitiative(4, 0, { ego: 2, surpris: false }, 8, file(6, 6, 4, 3, 2, 1));
        expect(jet.degenesis.des).toHaveLength(6);
        expect(egoPaye).toBe(2);
        expect(etat).toMatchObject({ score: 3, declencheurs: 2, actions: 2, bonusEgo: 2, bonusUtilise: false });
        expect(bonusDeLaProchaineAction(etat)).toBe(2);
        const premiere = depenserUneAction(etat)!;
        expect(premiere.bonus).toBe(2);
        const seconde = depenserUneAction(premiere.etat)!;
        expect(seconde.bonus).toBe(0);
        expect(actionsRestantes(seconde.etat)).toBe(0);
        // Plus d'action : plus de défense active (p. 102).
        expect(depenserUneAction(seconde.etat)).toBeNull();
    });

    it("surpris, il ne dépense rien ; trois au plus ; jamais plus qu'il n'a", () => {
        expect(egoPermis(8, true)).toBe(0);
        expect(egoPermis(8, false)).toBe(3);
        expect(egoPermis(1, false)).toBe(1);
        const { egoPaye, etat } = lancerLInitiative(4, 0, { ego: 3, surpris: true }, 8, file(5));
        expect(egoPaye).toBe(0);
        expect(etat.bonusUtilise).toBe(true);
    });

    it('les Traumatismes retirent leurs dés ; aucun succès laisse une action à 0', () => {
        const { etat, jet } = lancerLInitiative(3, 1, { ego: 0, surpris: false }, 0, file(1, 2));
        expect(jet.degenesis.des).toHaveLength(2);
        expect(etat).toMatchObject({ score: 0, actions: 1 });
    });

    it("l'exemple du livre : Vedran 5, Kum et la meute 3 (Kum d'abord), Falberg et Moniteur 2 ensemble (p. 101)", () => {
        const ordre = ordonnerLInitiative([
            { id: 'falberg', score: 2, joueur: true }, { id: 'usudis', score: 3, joueur: false },
            { id: 'vedran', score: 5, joueur: true }, { id: 'kum', score: 3, joueur: true }, { id: 'moniteur', score: 2, joueur: true },
        ]);
        expect(ordre.map(o => o.id)).toEqual(['vedran', 'kum', 'usudis', 'falberg', 'moniteur']);
        expect(ordre.filter(o => o.simultane).map(o => o.id)).toEqual(['falberg', 'moniteur']);
    });

    it("rendre une action ne rend pas le bonus d'Égo", () => {
        const { etat } = lancerLInitiative(2, 0, { ego: 1, surpris: false }, 5, file(4));
        const apres = depenserUneAction(etat)!.etat;
        const rendu = rendreUneAction(apres);
        expect(actionsRestantes(rendu)).toBe(rendu.actions);
        expect(bonusDeLaProchaineAction(rendu)).toBe(0);
    });
});

describe('La défense (DEG-A2, p. 102, 106)', () => {
    it("l'Usudi actif qui court : défense passive 3 (p. 106)", () => {
        expect(defensePassive({ ...FACTEURS_DE_DEFENSE, enMouvement: true })).toBe(3);
        expect(defensePassive({ ...FACTEURS_DE_DEFENSE, actifDebout: false })).toBe(1);
        expect(defensePassive({ ...FACTEURS_DE_DEFENSE, couvertTotal: true, divers: -1 })).toBe(5);
        expect(contreLaPassive(3, 3).touche).toBe(true);
        expect(contreLaPassive(2, 3).touche).toBe(false);
    });

    it("la défense active gagne à égalité ; la contre-attaque veut plus de succès, trois 6 et une parade au corps à corps", () => {
        expect(contreLActive(4, { succes: 4, six: 0 }, 'esquive', true).touche).toBe(false);
        expect(contreLActive(4, { succes: 3, six: 3 }, 'parade-corps-a-corps', true).touche).toBe(true);
        expect(contreLActive(4, { succes: 5, six: 3 }, 'parade-corps-a-corps', true).contreAttaque).toBe(true);
        expect(contreLActive(4, { succes: 4, six: 3 }, 'parade-corps-a-corps', true).contreAttaque).toBe(false);
        expect(contreLActive(4, { succes: 5, six: 3 }, 'esquive', true).contreAttaque).toBe(false);
        expect(contreLActive(4, { succes: 5, six: 3 }, 'parade-lutte', false).contreAttaque).toBe(false);
    });
});

describe('Les dégâts nets (DEG-A2, p. 103, 107, 155-156, 160)', () => {
    it('« 2+F/2 » avec PHY + Force 8 : 6 (p. 103) ; la division s’arrondit au-dessus (p. 156)', () => {
        expect(lireLesDegats('2+F/2', 8)).toEqual({ base: 6, detail: '2 + F/2 (8 → 4)' });
        expect(lireLesDegats('F/3', 7)?.base).toBe(3);
        expect(lireLesDegats('11', 0)?.base).toBe(11);
        expect(lireLesDegats('1+DC Trauma', 0)?.base).toBe(1);
        expect(lireLesDegats('—', 5)).toBeNull();
        expect(lireLesDegats('2D6', 5)).toBeNull();
    });

    it('le défricheur de Vedran : 11 + 1 déclencheur contre une chemise de mailles 2 = 10 (p. 107)', () => {
        const coup = calculerLeCoup({ base: 11, declencheurs: 1, armure: 2, proprietes: SANS_PROPRIETE });
        expect(coup).toMatchObject({ bruts: 12, armureRetiree: 2, nets: 10, piste: 'blessures' });
    });

    it('10 dégâts contre une armure 3 en transmettent 7, une seule fois', () => {
        expect(calculerLeCoup({ base: 10, declencheurs: 0, armure: 3, proprietes: SANS_PROPRIETE }).nets).toBe(7);
    });

    it('mortel, sonique, pénétration, étourdissement', () => {
        const mortel = calculerLeCoup({ base: 8, declencheurs: 0, armure: 3, proprietes: lireLesProprietes('Mortel, Terrifiant (4)') });
        expect(mortel).toMatchObject({ nets: 8, piste: 'traumatismes', armureRetiree: 0 });
        const vocodeur = calculerLeCoup({ base: 1, declencheurs: 2, armure: 3, proprietes: lireLesProprietes('Coup de tonnerre', '1+DC Égo') });
        expect(vocodeur).toMatchObject({ nets: 3, piste: 'ego' });
        const perce = lireLesProprietes('Pénétration (3), Rafale (3)');
        expect(perce.penetration).toBe(3);
        expect(calculerLeCoup({ base: 9, declencheurs: 0, armure: 3, proprietes: perce }).nets).toBe(9);
        expect(calculerLeCoup({ base: 9, declencheurs: 0, armure: 4, proprietes: perce }).nets).toBe(5);
        const poing = lireLesProprietes('Étourdissement (F/3), Régularité (2DC)');
        expect(poing.etourdissement).toEqual({ degats: 'F/3' });
        expect(calculerLeCoup({ base: 3, declencheurs: 0, armure: 1, proprietes: poing })).toMatchObject({ nets: 2, piste: 'ego' });
        expect(lireLesProprietes('Régularité (2DC), Camouflage (4S)')).toEqual({ mortel: false });
    });

    it('la maniabilité se lit en dés, signe compris', () => {
        expect(lireLaManiabilite('+2D')).toBe(2);
        expect(lireLaManiabilite('−2D')).toBe(-2);
        expect(lireLaManiabilite('-3D')).toBe(-3);
        expect(lireLaManiabilite('')).toBe(0);
    });

    it('les Potentiels s’ajoutent ; l’armure ne retire jamais plus que les dégâts', () => {
        expect(calculerLeCoup({ base: 2, declencheurs: 1, potentiels: 2, armure: 9, proprietes: SANS_PROPRIETE })).toMatchObject({ bruts: 5, nets: 0 });
    });
});
