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

/**
 * **Qui compte parmi les pertes.**
 *
 * Défaut relevé le 2026-08-19 dans le journal d'une vraie séance : le récit
 * annonçait « **Pertes :** Aucune » sur un combat où deux combattants étaient à
 * zéro, et rangeait un personnage à `0/4` parmi les **Survivants**. `estTombe`
 * ne regardait que l'étiquette « Mort », celle que le meneur pose à la main.
 *
 * La réponse existait depuis le 2026-08-14 dans `estHorsDeCombat`, avec le bon
 * ordre d'autorité. *Le module de santé avait acquis un dixième lecteur
 * dissident.*
 */
describe('un combattant tombé sans étiquette « Mort »', () => {
    const avecSante = (
        name: string,
        healthSystem: CombattantRaconte['healthSystem'],
    ): CombattantRaconte => ({ id: name, name, statuses: [], healthSystem });

    const pertes = (recit: string) => recit.slice(
        recit.indexOf('**Pertes :**'),
        recit.indexOf('**Survivants :**') === -1 ? undefined : recit.indexOf('**Survivants :**'),
    );

    it('a zero point de vie, il est une perte', () => {
        const recit = raconterLeCombat({
            round: 1,
            combattants: [avecSante('test', { type: 'hp', data: { current: 0, max: 4 }, state: 'dead' })],
            faits: {},
        });

        expect(recit).not.toContain('**Pertes :** Aucune');
        expect(pertes(recit)).toContain('**test**');
        expect(recit).not.toContain('**Survivants :**');
    });

    /* L'état calculé fait autorité, quel que soit le modèle de santé. */
    it('une horloge de defaite pleine le met aussi dans les pertes', () => {
        const recit = raconterLeCombat({
            round: 1,
            combattants: [avecSante('Duncan', { type: 'clocks', data: { filled: 6, segments: 6 }, state: 'dead' })],
            faits: {},
        });

        expect(pertes(recit)).toContain('**Duncan**');
    });

    /**
     * *L'absence n'est pas un zéro* — la règle du module de santé. Un jeu qui ne
     * compte pas la santé ne doit pas voir son plateau déclaré mort.
     */
    it('sans jauge ni systeme, personne n\'est declare tombe', () => {
        const recit = raconterLeCombat({
            round: 1,
            combattants: [{ id: 'a', name: 'Ripley', statuses: [] }],
            faits: {},
        });

        expect(recit).toContain('**Pertes :** Aucune');
    });

    /* Les deux conditions se cumulent : l'étiquette reste le seul moyen de dire
       la mort dans un jeu sans jauge. */
    it('l\'etiquette « Mort » suffit encore, sans jauge', () => {
        const recit = raconterLeCombat({
            round: 1,
            combattants: [{ id: 'a', name: 'Ripley', statuses: [{ name: 'Mort', icon: '💀' }] }],
            faits: {},
        });

        expect(pertes(recit)).toContain('**Ripley**');
    });

    /* Un combattant encore debout ne doit pas basculer pour autant. */
    it('un blesse reste un survivant', () => {
        const recit = raconterLeCombat({
            round: 1,
            combattants: [avecSante('Goule', { type: 'hp', data: { current: 3, max: 10 }, state: 'wounded' })],
            faits: {},
        });

        expect(recit).toContain('**Pertes :** Aucune');
        expect(recit).toContain('**Survivants :**');
    });
});
