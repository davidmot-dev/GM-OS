import { describe, it, expect } from 'vitest';
import { lampesRelues, TOLERANCE_DE_BRILLANCE } from './relireLesLampes';
import type { LampeDuPont } from './relireLesLampes';
import { brillanceEffective } from '../HueEngine';
import type { HueLight } from '../useLightStore';

/**
 * Ce que ces tests protègent : **« Capturer l'état actuel des lampes » capture
 * l'état actuel des lampes.**
 *
 * Le meneur règle sa pièce depuis son téléphone autant que depuis GM-OS. Un
 * miroir qui ne tient que le compte de ce que l'application a envoyé ne le sait
 * pas — et une capture enregistrait alors une ambiance que plus personne ne
 * voyait, sans rien dire.
 *
 * Mais relire est piégé dans l'autre sens : le pont rend ce qu'il a **reçu**,
 * c'est-à-dire du nominal déjà rabaissé par les curseurs. Le recopier tel quel
 * rabaisserait le nominal une seconde fois — *une scène qui s'éteint par
 * étapes, à chaque aller-retour.*
 */

const lampeDuPont = (bri: number, reste: Partial<LampeDuPont['state']> = {}): LampeDuPont => ({
    name: 'Lustre',
    type: 'Extended color light',
    state: { on: true, bri, xy: [0.4, 0.4], ...reste },
});

const lampeLocale = (bri: number, reste: Partial<HueLight['state']> = {}): HueLight => ({
    id: '1',
    name: 'Lustre',
    type: 'Extended color light',
    state: { on: true, bri, xy: [0.4, 0.4], effect: 'none', ...reste },
});

describe('relire les lampes sur le pont', () => {
    it('adopte une lampe que GM-OS n’avait jamais vue', () => {
        const relues = lampesRelues({ '1': lampeDuPont(200) }, {}, { pourcentGlobal: 100 });
        expect(relues['1'].state.bri).toBe(200);
        expect(relues['1'].state.on).toBe(true);
    });

    it('prend le nom que porte le pont, pas celui qu’on gardait', () => {
        const local = { '1': lampeLocale(200) };
        local['1'].name = 'Ancien nom';
        const relues = lampesRelues({ '1': lampeDuPont(200) }, local, { pourcentGlobal: 100 });
        expect(relues['1'].name).toBe('Lustre');
    });

    it('oublie une lampe que le pont ne liste plus', () => {
        const relues = lampesRelues({}, { '1': lampeLocale(200) }, { pourcentGlobal: 100 });
        expect(relues['1']).toBeUndefined();
    });

    it('voit qu’une lampe s’est éteinte ailleurs', () => {
        const relues = lampesRelues(
            { '1': lampeDuPont(200, { on: false }) },
            { '1': lampeLocale(200) },
            { pourcentGlobal: 100 },
        );
        expect(relues['1'].state.on).toBe(false);
    });

    /**
     * **Le cœur de la règle.** Le pont rapporte 100 parce que nous lui avons
     * envoyé 200 à travers un curseur global à 50 % : rien n'a bougé, et le
     * nominal doit rester 200. *Retenir 100 ici, c'est la dérive par étapes.*
     */
    it('garde le nominal quand le pont ne fait que répéter ce qu’on lui a envoyé', () => {
        const relues = lampesRelues(
            { '1': lampeDuPont(100) },
            { '1': lampeLocale(200) },
            { pourcentGlobal: 50 },
        );
        expect(relues['1'].state.bri).toBe(200);
    });

    it('ne dérive pas, même après dix relectures de suite', () => {
        let miroir: Record<string, HueLight> = { '1': lampeLocale(200) };
        for (let i = 0; i < 10; i++) {
            miroir = lampesRelues({ '1': lampeDuPont(100) }, miroir, { pourcentGlobal: 50 });
        }
        expect(miroir['1'].state.bri).toBe(200);
    });

    it('tolère l’arrondi du pont', () => {
        const relues = lampesRelues(
            { '1': lampeDuPont(100 + TOLERANCE_DE_BRILLANCE) },
            { '1': lampeLocale(200) },
            { pourcentGlobal: 50 },
        );
        expect(relues['1'].state.bri).toBe(200);
    });

    /**
     * **L'autre moitié de la règle.** Le téléphone a poussé la lampe à 240
     * alors que le curseur global est à 50 % : ce que le meneur voit, GM-OS ne
     * le reproduira qu'avec un nominal de 480 — borné à 254, la lampe étant
     * déjà presque pleine.
     */
    it('défait le curseur global sur une valeur qui ne vient pas de nous', () => {
        const relues = lampesRelues(
            { '1': lampeDuPont(120) },
            { '1': lampeLocale(200) },
            { pourcentGlobal: 50 },
        );
        expect(relues['1'].state.bri).toBe(240);
    });

    it('ne monte jamais au-delà de ce qu’une lampe Hue accepte', () => {
        const relues = lampesRelues(
            { '1': lampeDuPont(240) },
            { '1': lampeLocale(10) },
            { pourcentGlobal: 50 },
        );
        expect(relues['1'].state.bri).toBe(254);
    });

    it('ne descend jamais à zéro, qui n’est pas une brillance', () => {
        const relues = lampesRelues(
            { '1': lampeDuPont(1) },
            { '1': lampeLocale(200) },
            { pourcentGlobal: 100 },
        );
        expect(relues['1'].state.bri).toBe(1);
    });

    /**
     * ⛔ **Un curseur global à zéro ne se défait pas** : tout ce qui est parti
     * valait zéro, et aucune division ne rend ce qu'il y avait derrière.
     */
    it('garde ce qu’on sait quand le curseur global est à zéro', () => {
        const relues = lampesRelues(
            { '1': lampeDuPont(1) },
            { '1': lampeLocale(200) },
            { pourcentGlobal: 0 },
        );
        expect(relues['1'].state.bri).toBe(200);
    });

    describe('l’intensité de la tuile jouée', () => {
        /**
         * La tuile joue à 60 %, le global est plein : le pont rapporte 120 pour
         * un nominal de 200, et **rien n'a bougé**. Sans le facteur de la
         * tuile dans la comparaison, cette lampe passerait pour déplacée à
         * chaque lecture — et retomberait à 120, puis 72, puis 43.
         */
        it('n’appelle pas « déplacée » une lampe que la tuile a simplement baissée', () => {
            const relues = lampesRelues(
                { '1': lampeDuPont(120) },
                { '1': lampeLocale(200) },
                { pourcentGlobal: 100, pourcentDeScene: 60, lampesDeLaScene: ['1'] },
            );
            expect(relues['1'].state.bri).toBe(200);
        });

        /**
         * ⚠️ **L'intensité d'une tuile ne s'applique qu'à ses lampes.** Une
         * lampe réglée au pied de page pendant qu'une tuile joue n'est pas
         * passée par son curseur : la compter ferait de chaque relecture une
         * fausse divergence.
         */
        it('ne l’applique pas à une lampe que la tuile ne commande pas', () => {
            const relues = lampesRelues(
                { '1': lampeDuPont(200) },
                { '1': lampeLocale(200) },
                { pourcentGlobal: 100, pourcentDeScene: 60, lampesDeLaScene: ['7'] },
            );
            expect(relues['1'].state.bri).toBe(200);
        });

        /**
         * Quand la lampe a **vraiment** bougé, on ne défait que le global : le
         * nominal du magasin est celui d'un geste direct, et c'est cette
         * définition-là qu'affiche le pied de page.
         */
        it('ne défait que le curseur global, jamais celui de la tuile', () => {
            const relues = lampesRelues(
                { '1': lampeDuPont(100) },
                { '1': lampeLocale(200) },
                { pourcentGlobal: 50, pourcentDeScene: 60, lampesDeLaScene: ['1'] },
            );
            expect(relues['1'].state.bri).toBe(200);
        });
    });

    describe('les lampes qu’on ne relit pas', () => {
        /**
         * ⛔ La brillance d'une lampe sous effet est **l'image d'un battement**.
         * La relire, c'est figer une bougie sur le creux où la lecture est
         * tombée — et une capture enregistrerait ce creux comme l'ambiance.
         */
        it('laisse tranquille une lampe qui joue un effet', () => {
            const relues = lampesRelues(
                { '1': lampeDuPont(40) },
                { '1': lampeLocale(200, { effect: 'candle' }) },
                { pourcentGlobal: 100 },
            );
            expect(relues['1'].state.bri).toBe(200);
            expect(relues['1'].state.effect).toBe('candle');
        });

        /** Le pont fait foi sur ce qu'il voit, pas sur ce qu'il se rappelle. */
        it('laisse tranquille une lampe injoignable', () => {
            const relues = lampesRelues(
                { '1': lampeDuPont(4, { reachable: false, on: false }) },
                { '1': lampeLocale(200) },
                { pourcentGlobal: 100 },
            );
            expect(relues['1'].state.bri).toBe(200);
            expect(relues['1'].state.on).toBe(true);
        });

        it('adopte quand même une lampe injoignable qu’on ne connaissait pas', () => {
            const relues = lampesRelues(
                { '1': lampeDuPont(180, { reachable: false }) },
                {},
                { pourcentGlobal: 100 },
            );
            expect(relues['1'].state.bri).toBe(180);
        });

        it('relit une lampe dont l’effet vient d’être arrêté', () => {
            const relues = lampesRelues(
                { '1': lampeDuPont(40) },
                { '1': lampeLocale(200, { effect: 'none' }) },
                { pourcentGlobal: 100 },
            );
            expect(relues['1'].state.bri).toBe(40);
        });
    });

    describe('la couleur', () => {
        it('prend celle du pont', () => {
            const relues = lampesRelues(
                { '1': lampeDuPont(200, { xy: [0.6, 0.3] }) },
                { '1': lampeLocale(200) },
                { pourcentGlobal: 100 },
            );
            expect(relues['1'].state.xy).toEqual([0.6, 0.3]);
        });

        it('garde la nôtre si la lampe n’en rapporte pas', () => {
            const relues = lampesRelues(
                { '1': lampeDuPont(200, { xy: undefined }) },
                { '1': lampeLocale(200, { xy: [0.2, 0.7] }) },
                { pourcentGlobal: 100 },
            );
            expect(relues['1'].state.xy).toEqual([0.2, 0.7]);
        });
    });

    /**
     * ⛔ **La comparaison ci-dessus est une seconde écriture de la formule
     * d'envoi.** Ce projet a payé assez cher « plusieurs écrivains pour une même
     * donnée » pour ne pas la laisser dériver en silence : si `brillanceEffective`
     * change, ce test tombe.
     */
    it('reconnaît exactement ce que `brillanceEffective` envoie', () => {
        for (const global of [10, 25, 50, 80, 100]) {
            for (const nominale of [1, 40, 120, 200, 254]) {
                const envoyee = brillanceEffective(nominale, global);
                const relues = lampesRelues(
                    { '1': lampeDuPont(envoyee) },
                    { '1': lampeLocale(nominale) },
                    { pourcentGlobal: global },
                );
                expect(relues['1'].state.bri, `global ${global} %, nominal ${nominale}`)
                    .toBe(nominale);
            }
        }
    });
});
