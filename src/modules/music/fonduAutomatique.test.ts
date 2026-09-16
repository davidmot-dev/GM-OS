import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * **Le fondu automatique n'était couvert par RIEN.**
 *
 * Écrit le 2026-09-16 après un signalement de David — *« le fade out fade in
 * entre A et B ne fonctionne plus, le son traverse d'un coup »*. En cherchant,
 * j'ai trouvé que le `GainNode` simulé du banc d'essai n'avait pas de
 * `setValueCurveAtTime` : **la seule fonction qui trace la courbe**. Tout test
 * qui aurait atteint `crossfadeTo` levait donc un `TypeError` — ce qui prouve
 * qu'aucun ne l'atteignait.
 *
 * `fonduCroise.test.ts` éprouve la *forme* de la courbe. Ce fichier-ci éprouve
 * qu'elle est **posée sur les gains**, avec la bonne durée, et que rien ne
 * l'écrase juste après. *Une courbe juste que personne n'applique sonne comme
 * une bascule.*
 */

vi.mock('../session/logic/idbStorage', () => ({
    idbStateStorage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
    onPersistedStateChanged: () => () => {},
}));
vi.mock('../voice/useVoiceStore', () => ({
    useVoiceStore: { subscribe: () => () => {}, getState: () => ({}) },
}));

const { useMusicStore } = await import('./useMusicStore');
const { musicEngine } = await import('./MusicEngine');

/** Les deux gains du crossfader, tels que le moteur les a créés. */
const gains = () => {
    const moteur = musicEngine as unknown as {
        crossfaderGainA: { gain: { setValueCurveAtTime: ReturnType<typeof vi.fn>; setTargetAtTime: ReturnType<typeof vi.fn> } };
        crossfaderGainB: { gain: { setValueCurveAtTime: ReturnType<typeof vi.fn>; setTargetAtTime: ReturnType<typeof vi.fn> } };
    };
    return { a: moteur.crossfaderGainA.gain, b: moteur.crossfaderGainB.gain };
};

beforeEach(() => {
    // ⚠️ On replace le crossfader AVANT de remettre les compteurs à zéro :
    // `setCrossfader` pose lui-même un gain, et compté dans la foulée il ferait
    // accuser l'application d'un geste que le test vient de faire.
    musicEngine.setCrossfader(0.5);
    useMusicStore.setState({ autoFadeDuration: 5000, crossfader: 0.5 });

    gains().a.setValueCurveAtTime.mockClear();
    gains().b.setValueCurveAtTime.mockClear();
    gains().a.setTargetAtTime.mockClear();
    gains().b.setTargetAtTime.mockClear();
});

describe('crossfadeTo — la courbe arrive-t-elle sur les gains ?', () => {
    it('pose une courbe sur les DEUX gains', () => {
        musicEngine.crossfadeTo('B', 5000);

        expect(gains().a.setValueCurveAtTime).toHaveBeenCalledTimes(1);
        expect(gains().b.setValueCurveAtTime).toHaveBeenCalledTimes(1);
    });

    /**
     * ⛔ **Le symptôme de David : « ça traverse d'un coup ».** C'est exactement
     * ce qu'on entend si la durée de la courbe s'effondre.
     */
    it('étale la courbe sur la durée demandée, et pas sur un instant', () => {
        musicEngine.crossfadeTo('B', 5000);

        const [, , dureeSec] = gains().a.setValueCurveAtTime.mock.calls[0];
        expect(dureeSec).toBe(5);
    });

    it('annonce un fondu en cours, avec sa cible', () => {
        musicEngine.crossfadeTo('B', 5000);

        expect(musicEngine.fonduEnCours).toBe(true);
        expect(musicEngine.cibleDuFondu).toBe('B');
    });

    it('part de la position réelle du crossfader, pas du milieu', () => {
        musicEngine.setCrossfader(0.2);

        musicEngine.crossfadeTo('B', 5000);

        expect(musicEngine.positionDuCrossfader()).toBeCloseTo(0.2, 5);
    });
});

describe('triggerAutoFade — le chemin complet depuis le bouton A/B', () => {
    it('lance un vrai fondu, de la durée réglée dans le bandeau', async () => {
        useMusicStore.setState({ autoFadeDuration: 8000 });

        await useMusicStore.getState().triggerAutoFade('B');

        const [, , dureeSec] = gains().a.setValueCurveAtTime.mock.calls[0];
        expect(dureeSec).toBe(8);
        expect(musicEngine.fonduEnCours).toBe(true);
    });

    /**
     * ⛔ **La garde qui aurait attrapé le défaut signalé.** `setTargetAtTime`
     * est la pose *immédiate* d'un gain (constante de 20 ms : instantané à
     * l'oreille). Si quoi que ce soit l'appelle sur les gains du crossfader
     * pendant qu'un fondu démarre, la courbe est écrasée et **le son bascule
     * d'un coup** — précisément ce que décrit David.
     */
    it('n\'écrase PAS la courbe par une pose immédiate', async () => {
        await useMusicStore.getState().triggerAutoFade('B');

        expect(gains().a.setTargetAtTime).not.toHaveBeenCalled();
        expect(gains().b.setTargetAtTime).not.toHaveBeenCalled();
    });

    it('laisse le magasin sur la position d\'arrivée', async () => {
        await useMusicStore.getState().triggerAutoFade('B');

        expect(useMusicStore.getState().crossfader).toBe(1);
    });

    /**
     * ⛔ **La condition exacte du signalement du 2026-09-16** : David avait posé
     * une plage. Si poser une plage empêche le fondu de partir, c'est ici que
     * ça se voit.
     */
    it('part quand même quand la platine visée porte une plage', async () => {
        musicEngine.deckB.definirLaPlage(10, 60);

        await useMusicStore.getState().triggerAutoFade('B');

        expect(gains().a.setValueCurveAtTime).toHaveBeenCalledTimes(1);
        const [, , dureeSec] = gains().a.setValueCurveAtTime.mock.calls[0];
        expect(dureeSec).toBe(5);
    });

    it('part quand même quand la platine SORTANTE porte une plage', async () => {
        musicEngine.deckA.definirLaPlage(10, 60);

        await useMusicStore.getState().triggerAutoFade('B');

        expect(gains().a.setValueCurveAtTime).toHaveBeenCalledTimes(1);
    });
});

/**
 * ⛔ **Le défaut du 2026-09-16, nommé.**
 *
 * Le fondu partait — c'est la platine **sortante** qui se coupait toute seule
 * en plein trajet, parce que sa plage arrivait à sa sortie. Rembobinage, ou
 * pause nette si 🔁 est éteint : dans les deux cas le morceau disparaît d'un
 * coup pendant que l'autre monte, et **le fondu s'entend comme une bascule**.
 */
describe('la plage se tait pendant qu\'un fondu emmène sa platine au silence', () => {
    const plageDe = (platine: typeof musicEngine.deckA) =>
        (platine as unknown as { fonduDeSortieEnCours: boolean });

    it('suspend la plage de la platine sortante', () => {
        musicEngine.deckA.definirLaPlage(10, 60);

        musicEngine.crossfadeTo('B', 5000);

        expect(plageDe(musicEngine.deckA).fonduDeSortieEnCours).toBe(true);
    });

    it('laisse sa plage à la platine entrante — c\'est elle qui reste à l\'antenne', () => {
        musicEngine.deckB.definirLaPlage(10, 60);

        musicEngine.crossfadeTo('B', 5000);

        expect(plageDe(musicEngine.deckB).fonduDeSortieEnCours).toBe(false);
    });

    /**
     * Le meneur saisit le crossfader en plein fondu : la sortante revient à
     * l'antenne, sa plage doit revaloir. *Une suspension qu'on oublie de lever
     * est la minuterie qui survit à ce qu'elle devait arrêter, en plus discret.*
     */
    it('rend la plage quand le meneur reprend la main sur le crossfader', () => {
        musicEngine.deckA.definirLaPlage(10, 60);
        musicEngine.crossfadeTo('B', 5000);

        musicEngine.setCrossfader(0.3);

        expect(plageDe(musicEngine.deckA).fonduDeSortieEnCours).toBe(false);
    });

    it('rend la plage à une platine arrêtée, pour son prochain départ', () => {
        musicEngine.deckA.definirLaPlage(10, 60);
        musicEngine.crossfadeTo('B', 5000);

        musicEngine.deckA.stop();

        expect(plageDe(musicEngine.deckA).fonduDeSortieEnCours).toBe(false);
    });

    /**
     * ⛔ **Le SECOND chemin, trouvé en répondant à David** : *« est-ce que tu
     * dois revoir d'autres mécanismes de fade out ? »*. `stopDeck` et `stopAll`
     * ne passent pas par le crossfader — ils appellent `fadeOut` — et une plage
     * qui atteint sa sortie pendant ces secondes-là coupe le morceau net.
     */
    it('se tait aussi pendant un fondu de SORTIE (stopDeck / stopAll)', () => {
        musicEngine.deckA.definirLaPlage(10, 60);

        musicEngine.deckA.fadeOut(3000);

        expect(plageDe(musicEngine.deckA).fonduDeSortieEnCours).toBe(true);
    });

    /**
     * Le meneur relance la platine avant la fin de son fondu de sortie — cas
     * que `annulerLArretDiffere` existe déjà pour rattraper. Sa plage doit
     * revenir avec elle.
     */
    it('rend la plage si le meneur relance la platine en plein fondu de sortie', async () => {
        /*
          ⚠️ Une source est nécessaire : `play()` sort par la porte de derrière
          quand la platine n'en a pas — *avant* d'annuler l'arrêt différé. Sans
          cette ligne, le test mesurerait ce garde-fou et non la reprise.
        */
        (musicEngine.deckA as unknown as { audioElement: HTMLAudioElement }).audioElement.src = 'http://exemple/piste.mp3';
        musicEngine.deckA.definirLaPlage(10, 60);
        musicEngine.deckA.fadeOut(3000);

        await musicEngine.deckA.play();

        expect(plageDe(musicEngine.deckA).fonduDeSortieEnCours).toBe(false);
    });

    it('rend la plage aux deux platines quand un second fondu repart en sens inverse', () => {
        musicEngine.deckA.definirLaPlage(10, 60);
        musicEngine.deckB.definirLaPlage(5, 30);

        musicEngine.crossfadeTo('B', 5000);
        musicEngine.crossfadeTo('A', 5000);

        expect(plageDe(musicEngine.deckA).fonduDeSortieEnCours).toBe(false);
        expect(plageDe(musicEngine.deckB).fonduDeSortieEnCours).toBe(true);
    });
});
