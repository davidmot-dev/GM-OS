import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { HealthSystem } from '../../useSessionOSStore';

/**
 * **Un `data` incomplet ne casse aucune des cinq barres.**
 *
 * `HealthSystem.data` est un `Record<string, unknown>` : c'est le pilote du jeu
 * qui décide de ce qu'il y met. Une entité créée par un pilote qui nomme ses
 * champs autrement, ou à demi migrée, arrive ici avec un `data` incomplet — et
 * c'est un cas normal, pas une anomalie à signaler.
 *
 * Les cinq branches le lisaient pourtant sans garde utilisable, chacune à sa
 * façon, et elles échouaient de deux manières :
 *
 *  - **en silence** — `hp` et `clocks` affichaient `NaN`, parce que le repli
 *    écrit pour ce cas précis (`Number(x) ?? repli`) ne peut jamais se
 *    déclencher : `Number()` rend `NaN`, jamais `null` ;
 *  - **bruyamment** — `wounds` et `boxes` appelaient `.map()` sur `undefined`,
 *    et `anatomy` indexait `undefined`, ce qui emporte le panneau entier.
 *
 * *Le repli existait, ce qui prouve que le cas était prévu. C'est le repli qui
 * était cassé, pas l'intention.*
 */

const etat = vi.hoisted(() => ({
    players: [] as unknown[],
    entities: [] as unknown[],
    campaigns: [] as unknown[],
    activeCampaignId: null as string | null,
    getGameDriver: () => null,
    updateCharacterHP: vi.fn(),
    updateCharacterMaxHP: vi.fn(),
    updateEntityHP: vi.fn(),
    updateEntityMaxHP: vi.fn(),
    updateCharacterHealth: vi.fn(),
    updateEntityHealth: vi.fn(),
    handleApplyImpact: vi.fn(),
}));

vi.mock('../../useSessionOSStore', () => ({
    useSessionOSStore: Object.assign(
        (selecteur?: (s: typeof etat) => unknown) => (selecteur ? selecteur(etat) : etat),
        { getState: () => etat, setState: vi.fn(), subscribe: vi.fn() },
    ),
}));

const { HealthManager } = await import('./HealthManager');

/** Une santé du type demandé, dont `data` est vide — le cas qui cassait. */
const santeSansDonnees = (type: HealthSystem['type']): HealthSystem => ({
    type,
    state: 'healthy',
    data: {},
    badges: [],
});

/** La valeur affichée par un champ de la barre, lue sur le DOM. */
const champ = (titre: string) => (screen.getByTitle(titre) as HTMLInputElement).value;

beforeEach(() => {
    etat.players = [];
    etat.entities = [];
});

describe('les cinq barres devant un `data` vide', () => {
    const lesCinq: HealthSystem['type'][] = ['hp', 'clocks', 'anatomy', 'wounds', 'boxes'];

    it.each(lesCinq)('« %s » s’affiche sans lever', (type) => {
        expect(() =>
            render(<HealthManager id="perso-tom" type="pc" initialHealthSystem={santeSansDonnees(type)} />),
        ).not.toThrow();
    });

    /*
      `NaN` ne lève pas : il traverse le rendu et ressort en largeur de barre
      (`width: NaN%`) ou en champ vide. C'est précisément pour ça qu'il a tenu —
      rien ne le signalait. On le cherche donc dans le HTML rendu.
    */
    it.each(lesCinq)('« %s » n’écrit NaN nulle part', (type) => {
        const { container } = render(
            <HealthManager id="perso-tom" type="pc" initialHealthSystem={santeSansDonnees(type)} />,
        );
        expect(container.innerHTML).not.toContain('NaN');
    });
});

describe('le repli sur la fiche du porteur', () => {
    /**
     * Le cas pour lequel le repli avait été écrit, et qu'il n'a jamais servi :
     * la santé du porteur existe mais son `data` est vide, alors que la fiche
     * porte bien des PV.
     */
    it('affiche les PV de la fiche quand `data` ne les porte pas', () => {
        etat.players = [{
            id: 'joueur-1',
            characters: [{
                id: 'perso-tom',
                name: 'Tom',
                hp: 7,
                maxHp: 21,
                healthSystem: santeSansDonnees('hp'),
            }],
        }];

        render(<HealthManager id="perso-tom" type="pc" />);

        expect(champ('Actuel')).toBe('7');
        expect(champ('Max')).toBe('21');
    });

    /* Sans fiche ni donnée, `max` doit valoir 10 et non 0 : `current / max`
       diviserait par zéro, et la barre repartirait en `NaN`. */
    it('garde un maximum non nul quand rien ne le renseigne', () => {
        render(<HealthManager id="perso-inconnu" type="pc" initialHealthSystem={santeSansDonnees('hp')} />);

        expect(champ('Actuel')).toBe('0');
        expect(champ('Max')).toBe('10');
    });
});
