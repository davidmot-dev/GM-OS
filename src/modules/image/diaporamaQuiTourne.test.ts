import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useImageStore } from './useImageStore';
import { CADENCE_PAR_DEFAUT_MS } from './logic/deroulementDuDiaporama';
import type { ImageMedia } from './types';

/**
 * **L'horloge du diaporama — ce qu'elle avance, et ce qui l'arrête.**
 *
 * Demandé par David le 2026-09-13 : *« créer des diaporamas avec plusieurs
 * images et un fondu entre chacune d'entre elles »*.
 *
 * ⭐ **L'horloge vit dans la fenêtre du meneur**, et n'envoie aux écrans que des
 * projections d'image ordinaires — comme si le meneur les enchaînait à la main.
 * C'est ce qui permet au projecteur, au Player Hub, aux tablettes et à la
 * sauvegarde de n'avoir rien à apprendre. Ces essais gardent ce contrat : *on
 * vérifie ce qui est projeté, jamais un canal de transport nouveau.*
 */

const projectSolo = vi.fn();

const media = (id: string): ImageMedia => ({ id, name: id, path: `m-${id}`, isFavorite: false });

/** Ce qui est parti à l'écran, dans l'ordre : `[nom, cible]`. */
const projete = () => projectSolo.mock.calls.map(([m, cible]) => [m.id, cible]);

/** Le vrai `projectSolo` — celui qui porte les gardes — à la place du feint. */
const rendreLeVraiProjectSolo = () =>
    useImageStore.setState({ projectSolo: useImageStore.getInitialState().projectSolo } as never);

const poserLeJournal = () => {
    const addEvent = vi.fn();
    (window as unknown as Record<string, unknown>).useJournalStore = { getState: () => ({ addEvent }) };
    return addEvent;
};

beforeEach(() => {
    vi.useFakeTimers();
    projectSolo.mockClear();
    /* Sans pont, toute projection échoue — et une projection qui échoue n'écrit
       rien au journal : les essais du journal passeraient sans rien éprouver. */
    (window as unknown as { appBridge: unknown }).appBridge = {
        image: { syncHubData: vi.fn(), launchDisplay: vi.fn() },
    };
    useImageStore.setState({
        mediaList: [media('a'), media('b'), media('c')],
        diaporamas: [{ id: 'd-1', nom: 'Le voyage', imageIds: ['a', 'b', 'c'], dureeParImageMs: CADENCE_PAR_DEFAUT_MS }],
        diaporamaEnCours: null,
        projectionTarget: 'hub',
        projections: {},
        projectSolo,
    } as never);
});

afterEach(() => {
    useImageStore.getState().arreterLeDiaporama();
    delete (window as unknown as { appBridge?: unknown }).appBridge;
    vi.useRealTimers();
});

describe('lancer un diaporama', () => {
    it('projette la première image tout de suite', () => {
        useImageStore.getState().lancerLeDiaporama('d-1');

        expect(projete()).toEqual([['a', 'hub']]);
    });

    /** La cible se fige au lancement : c'est ce dont un moment de storyboard a besoin. */
    it('vise l’écran demandé sans changer celui d’Image-OS', () => {
        useImageStore.getState().lancerLeDiaporama('d-1', 'moniteur-2');

        expect(projete()).toEqual([['a', 'moniteur-2']]);
        expect(useImageStore.getState().projectionTarget).toBe('hub');
    });

    it('enchaîne à la cadence voulue', () => {
        useImageStore.getState().lancerLeDiaporama('d-1');

        vi.advanceTimersByTime(CADENCE_PAR_DEFAUT_MS);
        vi.advanceTimersByTime(CADENCE_PAR_DEFAUT_MS);

        expect(projete()).toEqual([['a', 'hub'], ['b', 'hub'], ['c', 'hub']]);
    });

    /** **Il boucle** — décision de David : la table ne doit pas voir la fin. */
    it('repart à la première après la dernière', () => {
        useImageStore.getState().lancerLeDiaporama('d-1');

        vi.advanceTimersByTime(CADENCE_PAR_DEFAUT_MS * 3);

        expect(projete().map(([id]) => id)).toEqual(['a', 'b', 'c', 'a']);
    });

    /**
     * ⛔ **Une seule image ne lance aucune horloge.** La reprojeter en boucle
     * rejouerait son fondu d'entrée : un décor fixe qui clignote.
     */
    it('projette sans horloge quand il n’y a qu’une image', () => {
        useImageStore.setState({ diaporamas: [
            { id: 'd-1', nom: 'Seule', imageIds: ['a'], dureeParImageMs: CADENCE_PAR_DEFAUT_MS },
        ] } as never);

        useImageStore.getState().lancerLeDiaporama('d-1');
        vi.advanceTimersByTime(CADENCE_PAR_DEFAUT_MS * 5);

        expect(projete()).toEqual([['a', 'hub']]);
    });

    it('ne projette rien et ne retient rien quand toutes les images ont disparu', () => {
        useImageStore.setState({ mediaList: [] } as never);

        useImageStore.getState().lancerLeDiaporama('d-1');

        expect(projectSolo).not.toHaveBeenCalled();
        expect(useImageStore.getState().diaporamaEnCours).toBeNull();
    });
});

describe('ce qui arrête le diaporama', () => {
    it('l’arrêt demandé', () => {
        useImageStore.getState().lancerLeDiaporama('d-1');
        useImageStore.getState().arreterLeDiaporama();

        vi.advanceTimersByTime(CADENCE_PAR_DEFAUT_MS * 3);

        expect(projete()).toEqual([['a', 'hub']]);
        expect(useImageStore.getState().diaporamaEnCours).toBeNull();
    });

    /**
     * ⛔ **Le défaut qu'on ne verrait qu'à la table.** Sans cette règle, le
     * meneur projette une image et **six secondes plus tard le diaporama la
     * remplace** — un écran qui change tout seul, sans que rien ne le relie au
     * diaporama lancé dix minutes plus tôt. *Le dernier geste du meneur gagne.*
     */
    it('une image projetée à la main sur le même écran', async () => {
        /* Le vrai `projectSolo` porte la garde : on le remet en place. */
        useImageStore.setState({ projectSolo: undefined } as never);
        const vrai = useImageStore.getInitialState().projectSolo;
        useImageStore.setState({ projectSolo: vrai } as never);

        useImageStore.getState().lancerLeDiaporama('d-1');
        expect(useImageStore.getState().diaporamaEnCours).not.toBeNull();

        await useImageStore.getState().projectSolo(media('z'));

        expect(useImageStore.getState().diaporamaEnCours).toBeNull();
    });

    /** *Un diaporama sur le moniteur du fond n'a aucune raison de s'arrêter
        parce qu'une fiche part au Player Hub.* */
    it('mais pas une image projetée sur un autre écran', async () => {
        const vrai = useImageStore.getInitialState().projectSolo;
        useImageStore.setState({ projectSolo: vrai } as never);

        useImageStore.getState().lancerLeDiaporama('d-1', 'moniteur-2');
        await useImageStore.getState().projectSolo(media('z'), 'hub');

        expect(useImageStore.getState().diaporamaEnCours).not.toBeNull();
    });

    it('le noir sur son écran', () => {
        useImageStore.getState().lancerLeDiaporama('d-1');
        useImageStore.getState().blackout();

        expect(useImageStore.getState().diaporamaEnCours).toBeNull();
    });

    it('la suppression du diaporama lui-même', () => {
        useImageStore.getState().lancerLeDiaporama('d-1');
        useImageStore.getState().supprimerDiaporama('d-1');

        vi.advanceTimersByTime(CADENCE_PAR_DEFAUT_MS * 2);

        expect(projete()).toEqual([['a', 'hub']]);
        expect(useImageStore.getState().diaporamaEnCours).toBeNull();
    });
});

describe('ce que le diaporama relit à chaque tour', () => {
    /**
     * ⛔ **Le piège du `setInterval`, évité.** Un intervalle fige sa période à
     * la pose : le meneur aurait réglé un curseur sans effet sur ce qui tourne.
     * *La leçon des effets de Light-OS, payée le 2026-09-07.*
     */
    it('la cadence, changée pendant qu’il tourne', () => {
        useImageStore.getState().lancerLeDiaporama('d-1');
        useImageStore.getState().reglerLaCadence('d-1', 2000);

        /* L'attente en cours va au bout de l'ancienne cadence ; c'est la
           SUIVANTE qui obéit à la nouvelle. */
        vi.advanceTimersByTime(CADENCE_PAR_DEFAUT_MS);
        expect(projete().map(([id]) => id)).toEqual(['a', 'b']);

        vi.advanceTimersByTime(2000);
        expect(projete().map(([id]) => id)).toEqual(['a', 'b', 'c']);
    });

    it('les images, retirées pendant qu’il tourne', () => {
        useImageStore.getState().lancerLeDiaporama('d-1');
        useImageStore.getState().retirerDuDiaporama('d-1', 1); // « b » s'en va

        vi.advanceTimersByTime(CADENCE_PAR_DEFAUT_MS);

        expect(projete().map(([id]) => id)).toEqual(['a', 'c']);
    });
});

describe('ce que le diaporama n’écrit pas', () => {
    /**
     * ⛔ **Dix lignes par minute dans le fil de la séance.** Chaque projection
     * réussie écrit au journal ; à six secondes par image, une heure de
     * diaporama n'y laisserait plus rien d'autre. *Un journal qu'on ne peut plus
     * lire ne vaut pas mieux qu'un journal absent.*
     *
     * Trouvé le 2026-09-13 **en écrivant le guide**, pas en relisant le code —
     * le détecteur de défauts le plus employé de ce dépôt.
     */
    it('aucune ligne au journal de séance', async () => {
        const addEvent = poserLeJournal();
        rendreLeVraiProjectSolo();

        try {
            /* Un moniteur, et non le hub : c'est le seul chemin qui aboutit sans
               résoudre le fichier — et **une projection qui échoue n'écrit rien
               au journal de toute façon**, ce qui ferait passer ce test pour de
               mauvaises raisons. */
            useImageStore.getState().lancerLeDiaporama('d-1', 'moniteur-2');
            await vi.advanceTimersByTimeAsync(CADENCE_PAR_DEFAUT_MS * 2);

            expect(addEvent).not.toHaveBeenCalled();
        } finally {
            delete (window as unknown as Record<string, unknown>).useJournalStore;
        }
    });

    /** Mais une image projetée à la main garde sa ligne : c'est un geste du meneur. */
    it('mais une projection à la main garde la sienne', async () => {
        const addEvent = poserLeJournal();
        rendreLeVraiProjectSolo();

        try {
            await useImageStore.getState().projectSolo(media('a'), 'moniteur-2');

            expect(addEvent).toHaveBeenCalled();
        } finally {
            delete (window as unknown as Record<string, unknown>).useJournalStore;
        }
    });
});

describe('feuilleter à la main', () => {
    it('avance, et rend son temps plein à l’image appelée', () => {
        useImageStore.getState().lancerLeDiaporama('d-1');
        vi.advanceTimersByTime(CADENCE_PAR_DEFAUT_MS / 2);

        useImageStore.getState().avancerLeDiaporama(1);
        expect(projete().map(([id]) => id)).toEqual(['a', 'b']);

        /* Le reste de l'ancienne attente ne doit pas la faire partir plus tôt. */
        vi.advanceTimersByTime(CADENCE_PAR_DEFAUT_MS / 2);
        expect(projete().map(([id]) => id)).toEqual(['a', 'b']);

        vi.advanceTimersByTime(CADENCE_PAR_DEFAUT_MS / 2);
        expect(projete().map(([id]) => id)).toEqual(['a', 'b', 'c']);
    });

    it('recule, en bouclant par la fin', () => {
        useImageStore.getState().lancerLeDiaporama('d-1');
        useImageStore.getState().avancerLeDiaporama(-1);

        expect(projete().map(([id]) => id)).toEqual(['a', 'c']);
    });

    it('ne fait rien quand aucun diaporama ne tourne', () => {
        useImageStore.getState().avancerLeDiaporama(1);

        expect(projectSolo).not.toHaveBeenCalled();
    });
});

describe('les gestes de montage', () => {
    it('déplace une image sans l’enrouler aux extrémités', () => {
        const d = () => useImageStore.getState().diaporamas[0].imageIds;

        useImageStore.getState().deplacerDansLeDiaporama('d-1', 0, -1);
        expect(d()).toEqual(['a', 'b', 'c']);

        useImageStore.getState().deplacerDansLeDiaporama('d-1', 0, 1);
        expect(d()).toEqual(['b', 'a', 'c']);
    });

    /** Par rang, et non par identifiant : retirer un doublon ne retire pas les deux. */
    it('ne retire qu’un doublon à la fois', () => {
        useImageStore.setState({ diaporamas: [
            { id: 'd-1', nom: 'x', imageIds: ['a', 'b', 'a'], dureeParImageMs: 6000 },
        ] } as never);

        useImageStore.getState().retirerDuDiaporama('d-1', 0);

        expect(useImageStore.getState().diaporamas[0].imageIds).toEqual(['b', 'a']);
    });
});
