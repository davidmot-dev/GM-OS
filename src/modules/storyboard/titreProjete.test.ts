import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    estPourCetEcran, lireLeTitre, minuterieDuTitre, normaliserLeTitre,
    DUREE_MAX, FONDU_MAX, FONDU_PAR_DEFAUT,
} from './titreProjete';
import { useStoryboardStore } from './useStoryboardStore';

/**
 * **Le titre projeté par-dessus l'image — demandé par David le 2026-08-31.**
 *
 * *« Un texte qui s'affichera en titre sur l'écran choisi pour l'image, avec un
 * fade-in / fade-out configurable (en seconde ou permanent). »*
 *
 * Deux choses se gardent ici, et la troisième ne se garde pas :
 *
 * 1. **La minuterie**, parce qu'elle a deux instants et non un — le fondu de
 *    sortie commence à la fin de la tenue, le texte ne part qu'après ;
 * 2. **le trajet** depuis le moment jusqu'au canal, y compris le titre vide qui
 *    efface et l'écran visé ;
 * 3. ce qu'aucun essai ne dira : que la police du thème s'applique vraiment. Ça
 *    se regarde à l'écran.
 */

describe('les réglages du titre', () => {
    it('prend le fondu par défaut quand rien n’est saisi', () => {
        const t = normaliserLeTitre({ cible: 'hub', texte: 'Los Angeles, 2019' });
        expect(t.fondu).toBe(FONDU_PAR_DEFAUT);
    });

    /** *Décision de David : « en seconde ou permanent ».* Rien = permanent. */
    it('lit l’absence de durée comme « permanent »', () => {
        expect(normaliserLeTitre({ cible: 'hub', texte: 'x' }).duree).toBeNull();
        expect(normaliserLeTitre({ cible: 'hub', texte: 'x', duree: 0 }).duree).toBeNull();
        expect(normaliserLeTitre({ cible: 'hub', texte: 'x', duree: null }).duree).toBeNull();
    });

    it('borne ce qu’on saisit à la main', () => {
        expect(normaliserLeTitre({ cible: 'hub', texte: 'x', fondu: 99 }).fondu).toBe(FONDU_MAX);
        expect(normaliserLeTitre({ cible: 'hub', texte: 'x', fondu: -3 }).fondu).toBe(0);
        expect(normaliserLeTitre({ cible: 'hub', texte: 'x', duree: 99999 }).duree).toBe(DUREE_MAX);
    });

    it('rogne le texte, pour qu’un titre d’espaces soit un titre vide', () => {
        expect(normaliserLeTitre({ cible: 'hub', texte: '   ' }).texte).toBe('');
    });
});

describe('la minuterie', () => {
    /**
     * **Deux instants, et pas un.** Retirer le texte à la fin de la tenue
     * supprimerait le fondu de sortie au lieu de le jouer.
     */
    it('sort à la fin de la tenue, et ne retire qu’après le fondu', () => {
        const t = normaliserLeTitre({ cible: 'hub', texte: 'x', fondu: 2, duree: 8 });
        expect(minuterieDuTitre(t)).toEqual({ sortieDansMs: 8000, retraitDansMs: 10000 });
    });

    it('n’arme rien pour un titre permanent', () => {
        const t = normaliserLeTitre({ cible: 'hub', texte: 'x', fondu: 2 });
        expect(minuterieDuTitre(t)).toEqual({ sortieDansMs: null, retraitDansMs: null });
    });
});

describe('à qui s’adresse un titre', () => {
    /** Le titre d'un moment envoyé au moniteur 2 n'a rien à faire sur la tablette. */
    it('ne concerne que l’écran visé', () => {
        const t = normaliserLeTitre({ cible: 'moniteur-2', texte: 'x' });
        expect(estPourCetEcran(t, 'moniteur-2')).toBe(true);
        expect(estPourCetEcran(t, 'hub')).toBe(false);
        expect(estPourCetEcran(null, 'hub')).toBe(false);
    });
});

describe('lire un message reçu', () => {
    it('accepte un message bien formé', () => {
        const recu = lireLeTitre(JSON.stringify({ cible: 'hub', texte: 'Tyrell Corp.', fondu: 1.5, duree: 5 }));
        expect(recu).toEqual({ cible: 'hub', texte: 'Tyrell Corp.', fondu: 1.5, duree: 5 });
    });

    /** *Un message illisible ne doit pas faire tomber l'écran de projection.* */
    it('refuse tout le reste sans jeter', () => {
        expect(lireLeTitre('{ pas du json')).toBeNull();
        expect(lireLeTitre(JSON.stringify({ texte: 'sans cible' }))).toBeNull();
        expect(lireLeTitre('')).toBeNull();
        expect(lireLeTitre(undefined)).toBeNull();
    });
});

/* ─────────────────── Le trajet depuis le moment ─────────────────── */

const syncHubData = vi.fn();

const MOMENT = {
    id: 'moment-1', name: 'Arrivée', description: '', color: '#fff', icon: 'Zap',
    campaignId: 'c-1',
};

beforeEach(() => {
    vi.clearAllMocks();
    (window as unknown as { appBridge: unknown }).appBridge = { image: { syncHubData } };
    (window as unknown as Record<string, unknown>).useImageStore = {
        getState: () => ({ projectionTarget: 'hub', mediaList: [], projectSolo: vi.fn() }),
    };
    useStoryboardStore.setState({ moments: [], activeMomentId: null, imageAvantLeMoment: null });
});

afterEach(() => {
    delete (window as unknown as { appBridge?: unknown }).appBridge;
    delete (window as unknown as Record<string, unknown>).useImageStore;
});

/** Le dernier titre parti sur le canal, relu comme un écran le lirait. */
const dernierTitre = () => {
    const envois = syncHubData.mock.calls.filter(([type]) => type === 'titre');
    return envois.length ? lireLeTitre(envois[envois.length - 1][1]) : null;
};

describe('un moment qui porte un titre', () => {
    it('l’envoie sur l’écran choisi pour l’image', async () => {
        useStoryboardStore.setState({ moments: [{
            ...MOMENT, titre: 'Los Angeles, novembre 2019', titreFondu: 2, titreDuree: 6,
            imageTarget: 'moniteur-2',
        }] });

        await useStoryboardStore.getState().triggerMoment('moment-1');

        expect(dernierTitre()).toEqual({
            cible: 'moniteur-2', texte: 'Los Angeles, novembre 2019', fondu: 2, duree: 6,
        });
    });

    /** Sans écran choisi, le titre suit la cible d'Image-OS, comme l'image. */
    it('suit la cible d’Image-OS quand le moment n’en choisit pas', async () => {
        useStoryboardStore.setState({ moments: [{ ...MOMENT, titre: 'Trois jours plus tard' }] });

        await useStoryboardStore.getState().triggerMoment('moment-1');

        expect(dernierTitre()?.cible).toBe('hub');
        // Aucune durée saisie : le titre reste jusqu'à l'arrêt du moment.
        expect(dernierTitre()?.duree).toBeNull();
    });

    /**
     * **Un moment sans titre efface celui d'avant.** Le cas « ce moment n'a pas
     * de titre » et le cas « ce moment nettoie l'écran » sont le même geste.
     */
    it('envoie un titre vide quand le moment n’en porte pas', async () => {
        useStoryboardStore.setState({ moments: [MOMENT] });

        await useStoryboardStore.getState().triggerMoment('moment-1');

        expect(dernierTitre()?.texte).toBe('');
    });

    /**
     * *Sans ça, « permanent » voudrait dire « jusqu'à ce que le meneur trouve
     * comment l'enlever ».*
     */
    it('retire le titre quand le moment s’arrête', async () => {
        useStoryboardStore.setState({ moments: [{ ...MOMENT, titre: 'Permanent', imageTarget: 'moniteur-2' }] });
        await useStoryboardStore.getState().triggerMoment('moment-1');
        syncHubData.mockClear();

        useStoryboardStore.getState().arreterLeMoment();

        expect(dernierTitre()).toEqual({ cible: 'moniteur-2', texte: '', fondu: FONDU_PAR_DEFAUT, duree: null });
    });

    it('ne dit rien à personne quand le moment arrêté n’avait pas de titre', async () => {
        useStoryboardStore.setState({ moments: [MOMENT] });
        await useStoryboardStore.getState().triggerMoment('moment-1');
        syncHubData.mockClear();

        useStoryboardStore.getState().arreterLeMoment();

        expect(syncHubData).not.toHaveBeenCalled();
    });
});
