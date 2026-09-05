import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AtlasMapDetail from './AtlasMapDetail';
import { useSessionOSStore } from '../useSessionOSStore';
import { useImageStore } from '../../image/useImageStore';
import { useHardwareStore } from '../../../stores/useHardwareStore';

/**
 * **Projeter un lieu sur un écran.**
 *
 * Demandé par David le 2026-09-06. L'Atlas savait déjà *« Envoyer à Map-OS »* —
 * mais c'est autre chose : cela en fait un **plateau tactique**, avec ses pions
 * et son brouillard. Rien ne permettait de simplement **montrer** le lieu sur un
 * écran de la table. *On regarde une ville, on joue sur un donjon.*
 *
 * ⭐ Ce que ces tests gardent avant tout : **le lieu occupe l'écran sous son
 * propre identifiant**, jamais sous l'adresse de son image. C'est ce que lisent
 * les écrans pour savoir ce qui est à l'antenne — les confondre ferait perdre le
 * lien avec la fiche, exactement le défaut payé le 31/08 sur les portraits.
 */

const projectMedia = vi.fn().mockResolvedValue('ok');
const blackout = vi.fn().mockResolvedValue(undefined);

vi.mock('../../image/logic/ImageService', () => ({
    ImageService: {
        projectMedia: (...args: unknown[]) => projectMedia(...args),
        blackout: (...args: unknown[]) => blackout(...args),
    },
}));

/* Le hublot du média : on ne teste pas la résolution d'image ici. */
vi.mock('../../../hooks/useMediaUrl', () => ({ useMediaUrl: () => 'blob:image' }));
vi.mock('../../../components/MediaBrowser', () => ({ MediaBrowser: () => null }));
vi.mock('../../ai/components/AIPromptOverlay', () => ({ default: () => null }));

const LIEU = {
    id: 'am-7',
    name: 'Hadley Hope',
    fileUrl: 'm-512',
    isVideo: false,
    type: 'city' as const,
    narrativeDescription: 'Une colonie battue par les vents.',
    gmNotes: '',
    linkedEntities: [],
    campaignId: 'c1',
    isVisited: true,
};

const ecran = (id: string, label: string) => ({
    id, label, bounds: { x: 0, y: 0, width: 1920, height: 1080 },
});

beforeEach(() => {
    projectMedia.mockClear();
    blackout.mockClear();

    useSessionOSStore.setState({
        atlasMaps: [LIEU],
        selectedAtlasMapId: LIEU.id,
        campaigns: [{ id: 'c1', name: 'Blade Runner', activeLocationIds: [] }],
        activeCampaignId: 'c1',
        clues: [],
        isGeneratingAIImage: false,
    } as never);

    useImageStore.setState({
        displays: [ecran('m1', 'Moniteur 1'), ecran('m2', 'Moniteur 2')],
        projections: {},
        projectionTarget: 'hub',
    });

    useHardwareStore.setState({
        displays: [
            { id: 'm1', label: 'Moniteur 1', bounds: { x: 0, y: 0, width: 1920, height: 1080 } },
            { id: 'm2', label: 'Moniteur 2', bounds: { x: 0, y: 0, width: 1920, height: 1080 } },
        ],
        displayAliases: {},
    });
});

describe('le bouton Projeter d’un lieu', () => {
    it('propose le Player Hub et chaque moniteur', () => {
        render(<AtlasMapDetail />);
        fireEvent.click(screen.getByLabelText('Projeter ce lieu sur un écran'));

        expect(screen.getByTitle('Projeter Hadley Hope sur Player Hub')).toBeTruthy();
        expect(screen.getByTitle('Projeter Hadley Hope sur Moniteur 1')).toBeTruthy();
        expect(screen.getByTitle('Projeter Hadley Hope sur Moniteur 2')).toBeTruthy();
    });

    it('envoie l’image du lieu sur l’écran choisi', () => {
        render(<AtlasMapDetail />);
        fireEvent.click(screen.getByLabelText('Projeter ce lieu sur un écran'));
        fireEvent.click(screen.getByTitle('Projeter Hadley Hope sur Moniteur 2'));

        return waitFor(() =>
            expect(projectMedia).toHaveBeenCalledWith('m-512', 'm2', 'am-7'),
        );
    });

    it('marque l’écran au nom du LIEU, pas de son image', async () => {
        /*
          ⭐ Le troisième argument est la **marque** : ce que les écrans lisent
          pour savoir ce qui est à l'antenne. Le mettre à `fileUrl` ferait perdre
          le lien avec la fiche du lieu — le défaut des portraits de PNJ, trouvé
          par David en pleine partie le 31/08.
        */
        render(<AtlasMapDetail />);
        fireEvent.click(screen.getByLabelText('Projeter ce lieu sur un écran'));
        fireEvent.click(screen.getByTitle('Projeter Hadley Hope sur Moniteur 1'));

        await waitFor(() => expect(projectMedia).toHaveBeenCalled());
        expect(projectMedia.mock.calls[0][2]).toBe(LIEU.id);
    });

    it('coupe l’écran où le lieu est déjà, au lieu de le relancer', async () => {
        useImageStore.setState({ projections: { m1: LIEU.id } });
        render(<AtlasMapDetail />);
        fireEvent.click(screen.getByLabelText('Projeter ce lieu sur un écran'));
        fireEvent.click(screen.getByTitle('Couper sur Moniteur 1'));

        await waitFor(() => expect(blackout).toHaveBeenCalledWith('m1'));
        expect(projectMedia).not.toHaveBeenCalled();
    });

    it('annonce sur le bouton les écrans où le lieu est à l’antenne', () => {
        /* Sans quoi il faut ouvrir le menu pour savoir si l'on montre quelque
           chose — et l'on finit par montrer un lieu qu'on croyait avoir coupé. */
        useImageStore.setState({ projections: { hub: LIEU.id, m2: LIEU.id } });
        render(<AtlasMapDetail />);

        expect(screen.getByLabelText('Projeter ce lieu sur un écran').textContent)
            .toContain('Player Hub');
        expect(screen.getByLabelText('Projeter ce lieu sur un écran').textContent)
            .toContain('Moniteur 2');
    });

    it('ne se confond pas avec « Envoyer à Map-OS »', () => {
        /*
          Les deux gestes sont voisins et distincts : l'un montre le lieu, l'autre
          en fait un plateau de jeu. Ils doivent rester deux boutons.
        */
        render(<AtlasMapDetail />);
        expect(screen.getByTitle('En faire un plateau tactique, avec pions et brouillard')).toBeTruthy();
        expect(screen.getByLabelText('Projeter ce lieu sur un écran')).toBeTruthy();
    });
});
