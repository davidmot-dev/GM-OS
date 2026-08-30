import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { HealthSystem } from '../../useSessionOSStore';

/**
 * **Les coups partent sur la cible de la ligne, pas sur son porteur.**
 *
 * Décision de David, 2026-08-29 : dans Combat-OS, la ligne de Tom qui vise
 * Henri doit faire encaisser **Henri** quand on clique « Dégâts » ou « Soins ».
 *
 * Ce que ces tests gardent vraiment, ce n'est pas la redirection — c'est
 * **qu'elle ne salisse rien au passage**. Le porteur garde sa barre, son état
 * local et son `onHealthChange` : les trois choses qui décrivent ce qui est
 * affiché à l'écran. *Une redirection qui met aussi à jour la barre du porteur
 * donnerait un panneau où la santé montrée n'est celle de personne.*
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

const sante = (courant: number): HealthSystem => ({
    type: 'hp',
    state: 'healthy',
    data: { current: courant, max: 10 },
    badges: [],
});

/** Tom porte la barre ; Henri est visé. */
function poserLaLigne(avecCible: boolean) {
    const surLePorteur = vi.fn();
    const surLaCible = vi.fn();

    render(
        <HealthManager
            id="perso-tom"
            type="pc"
            initialHealthSystem={sante(10)}
            onHealthChange={surLePorteur}
            cibleDesCoups={avecCible ? {
                id: 'entite-henri',
                type: 'npc',
                nom: 'Henri',
                healthSystem: sante(8),
                onHealthChange: surLaCible,
            } : null}
        />,
    );

    return { surLePorteur, surLaCible };
}

beforeEach(() => {
    vi.clearAllMocks();
    etat.players = [];
    etat.entities = [];
});

describe('quand une cible est choisie', () => {
    it('les dégâts partent sur la cible, jamais sur le porteur', () => {
        const { surLePorteur, surLaCible } = poserLaLigne(true);

        fireEvent.click(screen.getByTitle('Infliger dégâts à Henri'));

        expect(surLaCible, 'Henri encaisse').toHaveBeenCalledTimes(1);
        expect(surLePorteur, 'Tom ne bouge pas').not.toHaveBeenCalled();
    });

    it('les soins aussi', () => {
        const { surLePorteur, surLaCible } = poserLaLigne(true);

        fireEvent.click(screen.getByTitle('Soigner Henri'));

        expect(surLaCible.mock.calls[0][0].data.current, 'Henri passe de 8 à 9').toBe(9);
        expect(surLePorteur).not.toHaveBeenCalled();
    });

    /**
     * Le magasin est la vérité durable ; `onHealthChange` ne sert qu'au
     * combattant autonome. Les deux doivent désigner **la même** personne.
     */
    it('le magasin reçoit l’identifiant de la cible, pas celui du porteur', () => {
        etat.entities = [{ id: 'entite-henri', name: 'Henri', healthSystem: sante(8) }];
        poserLaLigne(true);

        fireEvent.click(screen.getByTitle('Infliger dégâts à Henri'));

        expect(etat.handleApplyImpact).toHaveBeenCalledTimes(1);
        const [idVise, typeVise] = etat.handleApplyImpact.mock.calls[0];
        expect(idVise).toBe('entite-henri');
        expect(typeVise).toBe('npc');
    });

    /**
     * **Le garde-fou visible.** Un coup qui part ailleurs doit le dire : sans
     * cette ligne, le meneur clique « Dégâts » sur la ligne de Tom en croyant
     * frapper Tom, et ne s'en aperçoit qu'au prochain regard sur Henri.
     */
    it('écrit à l’écran qui va encaisser', () => {
        poserLaLigne(true);
        expect(screen.getByText('→ Henri')).toBeTruthy();
    });

    /** La barre appartient au porteur : la cliquer parle de lui, pas de la cible. */
    it('la barre de vie ne suit PAS la cible', () => {
        const { surLePorteur, surLaCible } = poserLaLigne(true);

        fireEvent.click(screen.getByTitle(/la barre ne suit PAS la cible/));

        expect(surLePorteur, 'Tom encaisse son propre clic').toHaveBeenCalledTimes(1);
        expect(surLaCible).not.toHaveBeenCalled();
    });
});

/**
 * **Un seul écrivain.** `handleApplyImpact` met la fiche à jour *et* reflète le
 * résultat sur le plateau (`refleterLaFiche`, ajouté le 2026-08-19). Y ajouter
 * un `updateCombatant` rappellerait `syncCombatantToSession` — *la fonction même
 * qui annulait les soins ce jour-là*, en réécrivant les points de vie périmés du
 * plateau par-dessus la fiche.
 */
describe('qui écrit, quand la cible a une fiche', () => {
    it('laisse le magasin écrire seul', () => {
        etat.entities = [{ id: 'entite-henri', name: 'Henri', healthSystem: sante(8) }];
        const { surLaCible } = poserLaLigne(true);

        fireEvent.click(screen.getByTitle('Soigner Henri'));

        expect(etat.handleApplyImpact, 'le magasin a reçu le coup').toHaveBeenCalledTimes(1);
        expect(surLaCible, 'et personne n’écrit par-dessus').not.toHaveBeenCalled();
    });

    /** Sans fiche, personne d'autre n'enregistrerait le coup : le plateau écrit. */
    it('écrit sur le plateau quand la cible est autonome', () => {
        const { surLaCible } = poserLaLigne(true);

        fireEvent.click(screen.getByTitle('Soigner Henri'));

        expect(surLaCible).toHaveBeenCalledTimes(1);
        expect(etat.handleApplyImpact).not.toHaveBeenCalled();
    });
});

/**
 * **Le coup qui ne change rien doit le dire.**
 *
 * `handleHP` borne par `Math.min(maxHp, …)` : soigner quelqu'un déjà au maximum
 * est un no-op parfaitement correct — et, sans un mot à l'écran, rigoureusement
 * indiscernable d'une panne. C'est ce qui a fait dire à David que les soins « ne
 * fonctionnent pas ».
 */
describe('quand le coup ne change rien', () => {
    it('le dit, au lieu de se taire', () => {
        render(
            <HealthManager
                id="perso-tom"
                type="pc"
                initialHealthSystem={sante(10)}
                cibleDesCoups={{ id: 'x', type: 'npc', nom: 'Henri', healthSystem: sante(10) }}
            />,
        );

        fireEvent.click(screen.getByTitle('Soigner Henri'));

        expect(screen.getByRole('status').textContent).toContain('déjà au maximum');
    });

    it('ne dit rien quand le soin porte', () => {
        poserLaLigne(true); // Henri est à 8/10
        fireEvent.click(screen.getByTitle('Soigner Henri'));
        expect(screen.queryByRole('status')).toBeNull();
    });
});

/**
 * ⚠ **Défaut préexistant, trouvé le 2026-08-30.** `internalHealth` primait sur
 * la santé du magasin et n'était **jamais** remis à zéro : une ligne touchée une
 * fois cessait définitivement de suivre sa fiche.
 *
 * Invisible tant que chaque ligne n'était modifiée que par elle-même. Depuis que
 * les coups arrivent d'une autre ligne, c'est ce qui fige la barre de la cible.
 */
describe('la barre suit le magasin, pas son propre souvenir', () => {
    it('repart de la valeur du magasin après un changement extérieur', () => {
        const surLePorteur = vi.fn();
        etat.players = [{ id: 'j1', characters: [{ id: 'perso-tom', name: 'Tom', healthSystem: sante(10) }] }];

        const { rerender } = render(
            <HealthManager id="perso-tom" type="pc" onHealthChange={surLePorteur} />,
        );

        // Un premier coup sur sa propre barre : l'état local se remplit.
        fireEvent.click(screen.getByTitle(/Clic gauche/));
        expect(surLePorteur.mock.calls[0][0].data.current, '10 → 9').toBe(9);

        // Quelqu'un d'autre soigne Tom : la fiche remonte à 5… puis à 5 tout court.
        etat.players = [{ id: 'j1', characters: [{ id: 'perso-tom', name: 'Tom', healthSystem: sante(5) }] }];
        rerender(<HealthManager id="perso-tom" type="pc" onHealthChange={surLePorteur} />);

        fireEvent.click(screen.getByTitle(/Clic gauche/));

        expect(surLePorteur.mock.calls[1][0].data.current,
            'le second coup part de 5 (le magasin), pas de 9 (le souvenir local)').toBe(4);
    });
});

/**
 * **Sans cible, on retombe sur le porteur** — et il le faut : la liste des
 * cibles exclut le porteur de la ligne, donc interdire ce cas rendrait un
 * combattant intouchable depuis sa propre ligne.
 */
describe('quand aucune cible n’est choisie', () => {
    it('frappe le porteur, comme avant', () => {
        const { surLePorteur } = poserLaLigne(false);

        fireEvent.click(screen.getByTitle('Infliger dégâts'));

        expect(surLePorteur.mock.calls[0][0].data.current, 'Tom passe de 10 à 9').toBe(9);
    });

    it('n’affiche aucune flèche de redirection', () => {
        poserLaLigne(false);
        expect(screen.queryByText(/^→ /)).toBeNull();
    });
});
