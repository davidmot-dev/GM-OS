import { describe, it, expect, vi } from 'vitest';
import {
    reglagesAudio, sortieChoisie, SORTIE_PAR_DEFAUT, VOIES_AUDIO, LIBELLE_DE_LA_VOIE,
} from './reglagesAudio';
import { audioActions } from './actions/audioActions';

/**
 * **Le son sur la tablette : ses trois voies, et où elles sortent.**
 *
 * Demandé par David le 2026-09-22 : *« je ne peux pas choisir où va sortir le
 * son. D'autre part, le slider du soundboard fonctionne bien, mais il n'y a pas
 * de slider dans les pads. »*
 *
 * ⛔ **Ce que ces essais gardent avant tout : la liste vient du meneur.** La
 * tablette ne peut pas l'établir — `enumerateDevices()` y rendrait **ses
 * propres** haut-parleurs, et le meneur choisirait une sortie qui ne changerait
 * rien. *Une liste plausible et fausse coûte plus cher qu'une liste absente.*
 */

const materiel = [
    { deviceId: 'hp-salon', kind: 'audiooutput' },
    { deviceId: 'casque', kind: 'audiooutput' },
];

const noms: Record<string, string> = { 'hp-salon': 'Enceintes du salon', casque: 'Casque du MJ' };

describe('les sorties transportées', () => {
    it('porte toujours « par défaut » en tête', () => {
        expect(reglagesAudio({}).sorties).toEqual([SORTIE_PAR_DEFAUT]);
    });

    /** ⭐ Les noms que le meneur a donnés, pas les libellés Windows. */
    it('emploie le nom donné par le meneur', () => {
        const rendu = reglagesAudio({ appareils: materiel, nomDeLaSortie: (id) => noms[id] });

        expect(rendu.sorties).toEqual([
            SORTIE_PAR_DEFAUT,
            { id: 'hp-salon', nom: 'Enceintes du salon' },
            { id: 'casque', nom: 'Casque du MJ' },
        ]);
    });

    /** *Un identifiant nu vaut mieux qu'un vide : il se reconnaît au moins.* */
    it('retombe sur l’identifiant quand aucun nom n’est connu', () => {
        expect(reglagesAudio({ appareils: materiel }).sorties[1])
            .toEqual({ id: 'hp-salon', nom: 'hp-salon' });
    });

    /** ⛔ *Proposer un micro comme destination serait une promesse intenable.* */
    it('ne garde que les sorties', () => {
        const rendu = reglagesAudio({
            appareils: [...materiel, { deviceId: 'micro', kind: 'audioinput' }],
        });
        expect(rendu.sorties.some(s => s.id === 'micro')).toBe(false);
    });

    it('ne double pas l’entrée par défaut', () => {
        const rendu = reglagesAudio({
            appareils: [{ deviceId: 'default', kind: 'audiooutput' }, ...materiel],
        });
        expect(rendu.sorties.filter(s => s.id === SORTIE_PAR_DEFAUT.id)).toHaveLength(1);
    });
});

describe('les trois voies ont la même forme', () => {
    it('relaie le volume et la sortie de chacune', () => {
        const rendu = reglagesAudio({
            sound: { masterVolume: 0.3, outputDeviceId: 'casque' },
            music: { masterVolume: 0.8, outputDeviceId: 'hp-salon' },
            ambient: { masterVolume: 0.5 },
        });

        expect(rendu.sound).toEqual({ volume: 0.3, sortie: 'casque' });
        expect(rendu.music).toEqual({ volume: 0.8, sortie: 'hp-salon' });
        expect(rendu.ambient).toEqual({ volume: 0.5, sortie: 'default' });
    });

    /**
     * ⚠️ **`?? 1` n'aurait pas suffi.** Un magasin peut porter `NaN` après une
     * lecture ratée, et `NaN ?? 1` vaut `NaN` — le curseur de la tablette
     * deviendrait vide, sans rien dire.
     */
    it('rattrape un volume qui n’en est pas un', () => {
        const rendu = reglagesAudio({
            sound: { masterVolume: NaN },
            music: { masterVolume: undefined },
            ambient: { masterVolume: 'fort' as never },
        });

        for (const voie of VOIES_AUDIO) expect(rendu[voie].volume).toBe(1);
    });

    it('borne un volume hors de l’échelle', () => {
        const rendu = reglagesAudio({ sound: { masterVolume: 2.4 }, music: { masterVolume: -1 } });

        expect(rendu.sound.volume).toBe(1);
        expect(rendu.music.volume).toBe(0);
    });

    it('chaque voie a son nom à l’écran', () => {
        for (const voie of VOIES_AUDIO) expect(LIBELLE_DE_LA_VOIE[voie]).toBeTruthy();
    });
});

/**
 * ⚠️ **Une sortie débranchée se signale, elle ne se remplace pas en silence.**
 *
 * Rendre « par défaut » alors que le magasin dit autre chose ferait croire au
 * meneur qu'il a changé de sortie sans le vouloir.
 */
describe('la sortie affichée', () => {
    const rendu = reglagesAudio({
        appareils: materiel,
        nomDeLaSortie: (id) => noms[id],
        sound: { outputDeviceId: 'casque' },
        music: { outputDeviceId: 'hp-disparu' },
    });

    it('nomme celle qui est branchée', () => {
        expect(sortieChoisie(rendu, 'sound')).toEqual({
            id: 'casque', nom: 'Casque du MJ', absente: false,
        });
    });

    it('avoue celle qui ne l’est plus', () => {
        expect(sortieChoisie(rendu, 'music')).toEqual({
            id: 'hp-disparu', nom: 'Sortie absente', absente: true,
        });
    });

    it('et « par défaut » est toujours trouvable', () => {
        expect(sortieChoisie(rendu, 'ambient').absente).toBe(false);
    });
});

/**
 * ⛔ **LE TROU QUE CE CHANTIER A BOUCHÉ.** Music-OS et Ambient-OS n'avaient
 * **aucune** action de télécommande : la tablette savait lancer un morceau et
 * une ambiance, jamais les doser. *Une chaîne complète sans bouton au bout* —
 * le motif que ce dépôt a déjà payé quatre fois.
 */
describe('les actions que la tablette peut envoyer', () => {
    it('les trois voies se règlent et choisissent leur sortie', () => {
        for (const voie of VOIES_AUDIO) {
            expect(audioActions[`remote:${voie}:volume`], `${voie} ne sait pas se doser`).toBeTypeOf('function');
            expect(audioActions[`remote:${voie}:sortie`], `${voie} ne sait pas changer de sortie`).toBeTypeOf('function');
        }
    });

    /** Les deux orthographes, comme pour les actions existantes. */
    it('répondent avec et sans le préfixe « remote: »', () => {
        for (const voie of VOIES_AUDIO) {
            expect(audioActions[`${voie}:volume`]).toBeTypeOf('function');
            expect(audioActions[`${voie}:sortie`]).toBeTypeOf('function');
        }
    });

    /**
     * ⚠️ **Un `NaN` reçu du réseau couperait le son sans lever d'erreur.** Le
     * refus se fait à l'entrée, pas dans le moteur.
     */
    it('refusent une charge utile qui n’en est pas une', () => {
        const ecrire = vi.fn();
        const magasin = { setMasterVolume: ecrire, setOutputDevice: ecrire };
        void magasin;

        expect(() => audioActions['remote:music:volume']({ volume: NaN }, {} as never)).not.toThrow();
        expect(() => audioActions['remote:music:volume']({}, {} as never)).not.toThrow();
        expect(() => audioActions['remote:ambient:sortie']({ sortie: '' }, {} as never)).not.toThrow();
    });
});
