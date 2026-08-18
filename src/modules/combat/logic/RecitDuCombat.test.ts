import { describe, it, expect } from 'vitest';
import { raconterLeCombat, ajouterUnCoup, faitsVierges } from './RecitDuCombat';
import type { CombattantRaconte, FaitsDArmes } from './RecitDuCombat';

const combattant = (
    id: string, name: string,
    options: { mort?: boolean; pv?: [number, number] } = {},
): CombattantRaconte => ({
    id,
    name,
    statuses: options.mort ? [{ name: 'Mort', icon: '💀' }] : [],
    ...(options.pv
        ? { healthSystem: { type: 'hp', data: { current: options.pv[0], max: options.pv[1] }, state: 'wounded' } }
        : {}),
});

describe('ajouterUnCoup', () => {
    it('compte les degats, le nombre de coups et le plus dur', () => {
        let f = ajouterUnCoup(undefined, { value: 3 });
        f = ajouterUnCoup(f, { value: 7 });
        f = ajouterUnCoup(f, { value: 2 });

        expect(f).toEqual({ coups: 3, degats: 12, soins: 0, plusFort: 7 });
    });

    /* Les deux appelants n'ont pas la même convention pour un soin : le tracker
       envoie `isRecovery`, rien n'empêche un autre d'envoyer un négatif. */
    it('lit les deux conventions de soin, et un soin n\'est pas un coup', () => {
        const parDrapeau = ajouterUnCoup(faitsVierges(), { value: 4, isRecovery: true });
        const parLeSigne = ajouterUnCoup(faitsVierges(), { value: -4 });

        expect(parDrapeau).toEqual(parLeSigne);
        expect(parDrapeau).toEqual({ coups: 0, degats: 0, soins: 4, plusFort: 0 });
    });

    it('ignore un coup a zero', () => {
        expect(ajouterUnCoup(faitsVierges(), { value: 0 })).toEqual(faitsVierges());
    });

    it('ne mute pas les faits recus', () => {
        const avant = faitsVierges();
        ajouterUnCoup(avant, { value: 5 });
        expect(avant).toEqual({ coups: 0, degats: 0, soins: 0, plusFort: 0 });
    });
});

describe('raconterLeCombat', () => {
    const faits = (degats: number, coups: number, plusFort: number, soins = 0): FaitsDArmes =>
        ({ degats, coups, plusFort, soins });

    it('dit ce que chacun a traverse, pas seulement son nom', () => {
        const recit = raconterLeCombat({
            titreDeScene: 'Le hangar',
            round: 3,
            combattants: [
                combattant('a', 'Goule', { pv: [3, 10] }),
                combattant('b', 'Pirate', { mort: true }),
            ],
            faits: { a: faits(7, 2, 5), b: faits(12, 3, 8) },
        });

        expect(recit).toContain('**Scène :** Le hangar');
        expect(recit).toContain('Combat terminé après **3 rounds**');
        expect(recit).toContain('- **Pirate** : 12 encaissés en 3 coups');
        expect(recit).toContain('- **Goule** : 3/10 (blessé) — 7 encaissés en 2 coups');
        expect(recit).toContain('**Dégâts échangés :** 19 au total');
        expect(recit).toContain('le coup le plus dur étant **8** sur Pirate');
    });

    it('separe les tombes des survivants', () => {
        const recit = raconterLeCombat({
            round: 1,
            combattants: [combattant('a', 'Goule'), combattant('b', 'Pirate', { mort: true })],
            faits: {},
        });

        const pertes = recit.indexOf('**Pertes :**');
        const survivants = recit.indexOf('**Survivants :**');
        expect(pertes).toBeGreaterThan(-1);
        expect(recit.indexOf('Pirate')).toBeGreaterThan(pertes);
        expect(recit.indexOf('Goule')).toBeGreaterThan(survivants);
    });

    it('annonce franchement un combat rattache a aucune scene', () => {
        const recit = raconterLeCombat({ round: 1, combattants: [combattant('a', 'Goule')], faits: {} });
        expect(recit).toContain('_Combat rattaché à aucune scène._');
    });

    /* Un compteur à zéro se lit comme une donnée perdue ; « pas touché » est une
       information. */
    it('dit « pas touche » plutot que des zeros', () => {
        const recit = raconterLeCombat({ round: 1, combattants: [combattant('a', 'Rusty')], faits: {} });

        expect(recit).toContain('- **Rusty** : pas touché');
        expect(recit).not.toContain('0 encaissés');
        expect(recit).not.toContain('Dégâts échangés');
    });

    it('mentionne les soins recus', () => {
        const recit = raconterLeCombat({
            round: 2,
            combattants: [combattant('a', 'Goule'), combattant('b', 'Doc')],
            faits: { a: faits(6, 2, 4, 3), b: faits(0, 0, 0, 5) },
        });

        expect(recit).toContain('- **Goule** : 6 encaissés en 2 coups, 3 soignés');
        expect(recit).toContain('- **Doc** : 5 soignés');
    });

    /* Un jeu sans jauge ne doit pas produire de tiret suivi du vide. */
    it('se tait sur la sante quand le jeu n\'en compte pas', () => {
        const recit = raconterLeCombat({
            round: 1,
            combattants: [combattant('a', 'Ripley')],
            faits: { a: faits(4, 1, 4) },
        });

        expect(recit).toContain('- **Ripley** : 4 encaissés en 1 coup');
        expect(recit).not.toContain('undefined');
    });

    it('accorde le singulier d\'un coup unique', () => {
        const recit = raconterLeCombat({
            round: 1,
            combattants: [combattant('a', 'Goule')],
            faits: { a: faits(4, 1, 4) },
        });
        expect(recit).toContain('en 1 coup');
        expect(recit).not.toContain('en 1 coups');
    });

    it('dit « Pertes : Aucune » quand tout le monde tient debout', () => {
        const recit = raconterLeCombat({ round: 1, combattants: [combattant('a', 'Goule')], faits: {} });
        expect(recit).toContain('**Pertes :** Aucune');
    });
});
