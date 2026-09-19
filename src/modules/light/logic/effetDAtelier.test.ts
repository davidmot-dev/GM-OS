import { describe, it, expect } from 'vitest';
import {
    etapeBornee, effetBorne, imageDeLEtape, cadenceNominale, nomLibre, effetNeuf,
    estUnEffetDAtelier, identifiantDAtelier, idDepuisLAtelier,
    DUREE_MINIMALE_MS, DUREE_MAXIMALE_MS, BRILLANCE_MAXIMALE,
    type EffetDAtelier,
} from './effetDAtelier';
import { CADENCE_PLANCHER_MS } from '../HueEngine';

/**
 * Ce que ces essais protègent : **un effet écrit par le meneur ne peut pas
 * emballer le pont, et il joue bien ce qu'il montre.**
 *
 * ⭐ La différence avec une variante tient en une phrase : une variante
 * **décline** un des quarante-huit, un effet d'atelier en **invente** un. Le
 * premier emprunte un corps de code, le second n'est que de la donnée.
 */

const effet = (etapes: EffetDAtelier['etapes'], alea = 0): EffetDAtelier =>
    ({ id: 'e1', nom: 'Orage lointain', etapes, alea });

/** Un hasard qu'on tient : 0,5 rend un écart nul, 1 rend l'écart maximal. */
const hasardFixe = (v: number) => () => v;

describe('les bornes d’une étape', () => {
    /**
     * ⛔ Le défaut qui compte : une étape à 10 ms sur six lampes, ce sont six
     * cents commandes par seconde à un pont qui en tient dix.
     */
    it('refuse une durée sous le plancher du pont', () => {
        expect(etapeBornee({ duree: 10 }).duree).toBe(DUREE_MINIMALE_MS);
    });

    it('accorde son plancher avec celui du moteur', () => {
        expect(
            DUREE_MINIMALE_MS,
            'la logique et le moteur ne disent plus la même cadence plancher',
        ).toBe(CADENCE_PLANCHER_MS);
    });

    it('borne une durée démesurée', () => {
        expect(etapeBornee({ duree: 999_999 }).duree).toBe(DUREE_MAXIMALE_MS);
    });

    /**
     * ⛔ *Un réglage qui ne peut pas se produire doit être corrigé, pas obéi à
     * moitié.* Un fondu plus long que l'étape vise une couleur que la lampe
     * n'atteindra jamais.
     */
    it('ramène un fondu plus long que l’étape à la durée de l’étape', () => {
        expect(etapeBornee({ duree: 1000, fondu: 5000 }).fondu).toBe(1000);
    });

    it('remplace une couleur illisible par du blanc', () => {
        expect(etapeBornee({ couleur: 'rouge vif' }).couleur).toBe('#ffffff');
        expect(etapeBornee({ couleur: '#0af' }).couleur).toBe('#ffffff');
        expect(etapeBornee({ couleur: '#00AAFF' }).couleur).toBe('#00AAFF');
    });

    it('ne laisse pas passer un NaN', () => {
        expect(etapeBornee({ brillance: Number.NaN }).brillance).toBe(0);
        expect(etapeBornee({ duree: Number.NaN }).duree).toBe(DUREE_MINIMALE_MS);
    });

    /** ⚠️ La relecture compte autant que l'écriture : une sauvegarde d'hier
     *  porte les bornes d'hier. */
    it('borne aussi un effet entier qui revient d’une sauvegarde', () => {
        const ancien = effet([{ couleur: '#112233', brillance: 400, duree: 5, fondu: 9000 }], 500);

        const propre = effetBorne(ancien);

        expect(propre.alea).toBe(100);
        expect(propre.etapes[0].brillance).toBe(100);
        expect(propre.etapes[0].duree).toBe(DUREE_MINIMALE_MS);
        expect(propre.etapes[0].fondu).toBe(DUREE_MINIMALE_MS);
    });
});

describe('l’image d’un passage', () => {
    const SUITE = effet([
        { couleur: '#ffffff', brillance: 100, duree: 200, fondu: 0 },
        { couleur: '#102040', brillance: 20, duree: 4000, fondu: 1500 },
    ]);

    it('parcourt les étapes en boucle', () => {
        const couleurs = [0, 1, 2, 3].map(t => imageDeLEtape(SUITE, t)!.couleur);

        expect(couleurs).toEqual(['#ffffff', '#102040', '#ffffff', '#102040']);
    });

    it('traduit la brillance en 1-254 et le fondu en dixièmes', () => {
        const image = imageDeLEtape(SUITE, 1)!;

        expect(image.bri).toBe(Math.round(0.2 * BRILLANCE_MAXIMALE));
        expect(image.transitiontime, 'le pont parle en dixièmes de seconde').toBe(15);
        expect(image.interval).toBe(4000);
    });

    /** ⚠️ Éteindre est un choix, et l'aléa ne le défait pas. */
    it('laisse une étape à 0 % complètement éteinte, même avec du désordre', () => {
        const noir = effet([{ couleur: '#000000', brillance: 0, duree: 500, fondu: 0 }], 100);

        expect(imageDeLEtape(noir, 0, hasardFixe(1))!.bri).toBe(0);
    });

    it('rend null quand l’effet n’a aucune étape', () => {
        expect(imageDeLEtape(effet([]), 0)).toBeNull();
    });

    describe('le désordre', () => {
        const BOUGIE = effet([{ couleur: '#ff9030', brillance: 50, duree: 1000, fondu: 300 }], 40);

        it('ne change rien quand il vaut zéro', () => {
            const sans = effet([{ couleur: '#ff9030', brillance: 50, duree: 1000, fondu: 0 }], 0);

            expect(imageDeLEtape(sans, 0, hasardFixe(1))!.interval).toBe(1000);
            expect(imageDeLEtape(sans, 0, hasardFixe(0))!.interval).toBe(1000);
        });

        it('écarte la brillance ET la durée dans les deux sens', () => {
            const haut = imageDeLEtape(BOUGIE, 0, hasardFixe(1))!;
            const bas = imageDeLEtape(BOUGIE, 0, hasardFixe(0))!;

            expect(haut.interval).toBe(1400);
            expect(bas.interval).toBe(600);
            expect(haut.bri).toBeGreaterThan(bas.bri);
        });

        /** ⛔ Le désordre ne doit jamais faire descendre une étape sous le
         *  plancher : c'est le pont qu'il emballerait. */
        it('ne descend jamais sous le plancher, même à 100 % de désordre', () => {
            const rapide = effet([{ couleur: '#ffffff', brillance: 50, duree: 120, fondu: 0 }], 100);

            expect(imageDeLEtape(rapide, 0, hasardFixe(0))!.interval).toBe(DUREE_MINIMALE_MS);
        });
    });
});

describe('la cadence nominale', () => {
    /** *C'est le pic qui sature le pont, pas la moyenne.* */
    it('est l’étape la plus COURTE, pas la moyenne', () => {
        const orage = effet([
            { couleur: '#ffffff', brillance: 100, duree: 120, fondu: 0 },
            { couleur: '#102040', brillance: 15, duree: 20000, fondu: 3000 },
        ]);

        expect(cadenceNominale(orage)).toBe(120);
    });

    it('rend le plancher pour un effet vide', () => {
        expect(cadenceNominale(effet([]))).toBe(DUREE_MINIMALE_MS);
    });
});

describe('les identifiants', () => {
    it('distinguent un effet d’atelier de tout le reste', () => {
        expect(estUnEffetDAtelier('atelier:e1')).toBe(true);
        expect(estUnEffetDAtelier('variante:v1')).toBe(false);
        expect(estUnEffetDAtelier('candle')).toBe(false);
        expect(estUnEffetDAtelier(undefined)).toBe(false);
    });

    it('font l’aller-retour', () => {
        expect(idDepuisLAtelier(identifiantDAtelier('abc'))).toBe('abc');
    });
});

describe('créer un effet', () => {
    it('part de deux étapes — un exemple qui bouge', () => {
        expect(effetNeuf('e1', 'Nouvel effet').etapes.length).toBeGreaterThanOrEqual(2);
    });

    it('ne fabrique jamais deux homonymes', () => {
        expect(nomLibre('Nouvel effet', [])).toBe('Nouvel effet');
        expect(nomLibre('Nouvel effet', ['Nouvel effet'])).toBe('Nouvel effet 2');
        expect(nomLibre('Nouvel effet', ['Nouvel effet', 'Nouvel effet 2'])).toBe('Nouvel effet 3');
    });
});
