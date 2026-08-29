import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';
import FicheHote from './FicheHote';
import type { PontDeLaFiche, ChangementDeFiche, InstantaneDeFiche } from './pontDeLaFiche';
import type { CorrespondanceDeFiche } from './correspondanceDeFiche';
import { useBibliothequeDesFiches } from './useBibliothequeDesFiches';

/**
 * **L'hôte — le sens dans lequel coulent les données.**
 *
 * Le pont est remplacé : le vrai est éprouvé par `pontDeLaFiche.test.ts`, et le
 * vrai moteur par `electron/coutureDesFiches.test.ts`. Ce qu'on éprouve ici est
 * ce qui ne se voit qu'assemblé — *la fiche fait foi, GM-OS s'aligne, et on ne
 * pousse qu'à la création.*
 */

const TABLE: CorrespondanceDeFiche = {
    version: 1,
    gabaritDeLaFiche: 'blade-runner-fr',
    champs: [
        { gmos: 'nom', fiche: 'identity.name' },
        { gmos: 'vigueur', fiche: ['attributes.vigor.level', 'attributes.vigor.base_die'], transforme: 'niveauEtDe' },
    ],
};

const fiche = (id: string, data: Record<string, unknown>): InstantaneDeFiche => ({
    id, name: 'Rick', templateId: 'blade-runner-fr', templateName: 'Blade Runner',
    system: 'Blade Runner', updatedAt: 1, data,
});

/** Un pont en carton, qui note ce qu'on lui demande. */
function faireUnPont() {
    const appels: string[] = [];
    let diffuser: (ev: ChangementDeFiche) => void = () => {};

    const pont: PontDeLaFiche = {
        bonjour: vi.fn(async () => { appels.push('hello'); return { version: 2, ready: true, character: null, template: null }; }),
        lire: vi.fn(async () => null),
        gabarit: vi.fn(async () => null),
        ecrire: vi.fn(async () => null),
        bibliotheque: vi.fn(async () => {
            appels.push('list');
            return { characters: [{ id: 'f-1', name: 'Rick Deckard', templateId: 'blade-runner-fr', templateName: 'Blade Runner', system: 'Blade Runner', updatedAt: 1 }], templates: [] };
        }),
        ouvrirPersonnage: vi.fn(async (id: string) => { appels.push('open:' + id); return fiche(id, { 'identity.name': 'Rick Deckard' }); }),
        creer: vi.fn(async (name: string, templateId: string, data?: Record<string, unknown>) => {
            appels.push('create:' + JSON.stringify({ name, templateId, data }));
            return fiche('f-neuve', data ?? {});
        }),
        sauvegarde: vi.fn(async () => ({ format: 'character-sheet-manager-backup', version: 1, templates: [], characters: [{ id: 'f-1', name: 'Rick Deckard' }] })),
        restaurer: vi.fn(async (contenu: unknown) => {
            appels.push('restore');
            const c = (contenu as { characters?: unknown[] })?.characters ?? [];
            return { templates: 0, characters: c.length };
        }),
        surChangement: fn => { diffuser = fn; return () => { diffuser = () => {}; }; },
        fermer: vi.fn(),
    };

    return { pont, appels, diffuser: (ev: ChangementDeFiche) => diffuser(ev) };
}

/** L'iframe ne charge rien en jsdom : on déclenche `load` à la main. */
function charger() {
    const cadre = document.querySelector('iframe')!;
    Object.defineProperty(cadre, 'contentWindow', { value: { postMessage: () => {} }, configurable: true });
    fireEvent.load(cadre);
}

const PERSONNAGE = { id: 'pj-1', name: 'Rick', sheetData: { nom: 'Rick', vigueur: 'C (D8)' } };

beforeEach(cleanup);

describe('FicheHote', () => {
    it('vise le moteur par le protocole interne', () => {
        render(<FicheHote personnage={PERSONNAGE} table={TABLE} onFicheLiee={vi.fn()} onRapprochement={vi.fn()} fabriquerLePont={() => faireUnPont().pont} />);
        expect(document.querySelector('iframe')!.getAttribute('src'))
            .toBe('gmos://media/docs/fiches/Character_Sheet_Manager.html');
    });

    /** Le joueur regarde sa fiche ; le meneur gère une bibliothèque. */
    it('n’épure la fiche que sur une tablette', () => {
        const src = () => document.querySelector('iframe')!.getAttribute('src')!;

        render(<FicheHote personnage={PERSONNAGE} table={TABLE} liaison="locale" onFicheLiee={vi.fn()} onRapprochement={vi.fn()} fabriquerLePont={() => faireUnPont().pont} />);
        expect(src()).toContain('?vue=epuree');

        cleanup();
        render(<FicheHote personnage={PERSONNAGE} table={TABLE} onFicheLiee={vi.fn()} onRapprochement={vi.fn()} fabriquerLePont={() => faireUnPont().pont} />);
        expect(src()).not.toContain('vue=');
    });

    it('ouvre directement la fiche déjà liée', async () => {
        const { pont, appels } = faireUnPont();
        render(<FicheHote personnage={{ ...PERSONNAGE, ficheId: 'f-1' }} table={TABLE} onFicheLiee={vi.fn()} onRapprochement={vi.fn()} fabriquerLePont={() => pont} />);
        charger();

        await waitFor(() => expect(appels).toContain('open:f-1'));
        expect(appels).not.toContain('list');
    });

    /**
     * Une fiche disparue de la bibliothèque — supprimée à la main, ou jamais
     * restaurée sur ce profil — ne se recrée PAS d'office : ce serait fabriquer
     * un doublon silencieux. On propose.
     */
    it('propose la bibliothèque quand la fiche liée a disparu', async () => {
        const { pont } = faireUnPont();
        (pont.ouvrirPersonnage as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Personnage introuvable'));

        render(<FicheHote personnage={{ ...PERSONNAGE, ficheId: 'f-partie' }} table={TABLE} onFicheLiee={vi.fn()} onRapprochement={vi.fn()} fabriquerLePont={() => pont} />);
        charger();

        expect(await screen.findByText(/Rick Deckard/)).toBeTruthy();
    });

    it('lie le PJ à la fiche choisie, et le fait savoir', async () => {
        const { pont } = faireUnPont();
        const onFicheLiee = vi.fn();
        render(<FicheHote personnage={PERSONNAGE} table={TABLE} onFicheLiee={onFicheLiee} onRapprochement={vi.fn()} fabriquerLePont={() => pont} />);
        charger();

        fireEvent.click(await screen.findByText(/Rick Deckard/));
        await waitFor(() => expect(onFicheLiee).toHaveBeenCalledWith('f-1'));
    });

    /**
     * **La seule poussée de GM-OS vers la fiche.** Semer ailleurs qu'à la
     * création rouvrirait la question de qui gagne, à chaque frappe.
     */
    it('sème la fiche neuve avec ce que GM-OS savait déjà', async () => {
        const { pont, appels } = faireUnPont();
        const onFicheLiee = vi.fn();
        render(<FicheHote personnage={PERSONNAGE} table={TABLE} onFicheLiee={onFicheLiee} onRapprochement={vi.fn()} fabriquerLePont={() => pont} />);
        charger();

        fireEvent.click(await screen.findByRole('button', { name: /Créer une fiche/ }));

        const semis = appels.find(a => a.startsWith('create:'))!;
        expect(semis).toContain('"identity.name":"Rick"');
        // La composition passe : « C (D8) » redevient deux champs.
        expect(semis).toContain('"attributes.vigor.level":"C"');
        expect(semis).toContain('"attributes.vigor.base_die":"D8"');
        await waitFor(() => expect(onFicheLiee).toHaveBeenCalledWith('f-neuve'));
    });

    it('sans correspondance, on affiche mais on ne sème pas', async () => {
        const { pont } = faireUnPont();
        render(<FicheHote personnage={PERSONNAGE} table={null} onFicheLiee={vi.fn()} onRapprochement={vi.fn()} fabriquerLePont={() => pont} />);
        charger();

        expect(await screen.findByText(/n'a pas de/)).toBeTruthy();
        expect(screen.getByRole('button', { name: /Créer une fiche/ })).toHaveProperty('disabled', true);
    });

    describe('la fiche fait foi', () => {
        it('remonte la saisie du joueur, et rien de ce que GM-OS vient d’écrire', async () => {
            const { pont, diffuser } = faireUnPont();
            const onRapprochement = vi.fn();
            render(<FicheHote personnage={{ ...PERSONNAGE, ficheId: 'f-1' }} table={TABLE} onFicheLiee={vi.fn()} onRapprochement={onRapprochement} fabriquerLePont={() => pont} />);
            charger();

            // L'ouverture impose déjà « Rick Deckard » par-dessus « Rick ».
            await waitFor(() => expect(onRapprochement).toHaveBeenCalledTimes(1));
            expect(onRapprochement.mock.calls[0][0].aEcrire).toMatchObject({ nom: 'Rick Deckard' });

            diffuser({ origin: 'sheet', keys: ['attributes.vigor.level'], character: fiche('f-1', { 'identity.name': 'Rick Deckard', 'attributes.vigor.level': 'A' }) });
            await waitFor(() => expect(onRapprochement).toHaveBeenCalledTimes(2));
            expect(onRapprochement.mock.calls[1][0].aEcrire).toMatchObject({ vigueur: 'A (D12)' });

            // Notre propre écriture qui nous revient : la réappliquer ferait une boucle.
            diffuser({ origin: 'host', keys: ['identity.name'], character: fiche('f-1', { 'identity.name': 'Autre' }) });
            await new Promise(r => setTimeout(r, 0));
            expect(onRapprochement).toHaveBeenCalledTimes(2);
        });

        /** Le journal part par `appBridge.logger` — donc dans `main.log`, pas dans la console. */
        it('journalise ce qu’elle écrase, avec le nom du PJ', async () => {
            const journal = window.appBridge!.logger!.warn as ReturnType<typeof vi.fn>;
            journal.mockClear();

            const { pont } = faireUnPont();
            render(<FicheHote personnage={{ ...PERSONNAGE, ficheId: 'f-1' }} table={TABLE} onFicheLiee={vi.fn()} onRapprochement={vi.fn()} fabriquerLePont={() => pont} />);
            charger();

            await waitFor(() => expect(journal).toHaveBeenCalled());
            expect(String(journal.mock.calls[0][0])).toContain('« Rick »');
            expect(String(journal.mock.calls[0][0])).toContain('Rick → Rick Deckard');
        });

        /** Un rapprochement qui ne change rien ne doit pas faire tourner le store. */
        it('se tait quand rien ne change', async () => {
            const { pont } = faireUnPont();
            const onRapprochement = vi.fn();
            render(<FicheHote personnage={{ ...PERSONNAGE, ficheId: 'f-1', sheetData: { nom: 'Rick Deckard' } }} table={TABLE} onFicheLiee={vi.fn()} onRapprochement={onRapprochement} fabriquerLePont={() => pont} />);
            charger();

            await waitFor(() => expect(pont.ouvrirPersonnage).toHaveBeenCalled());
            await new Promise(r => setTimeout(r, 0));
            expect(onRapprochement).not.toHaveBeenCalled();
        });
    });

    it('dit quand la fiche ne répond pas, au lieu de rester figé', async () => {
        const { pont } = faireUnPont();
        (pont.bonjour as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("La fiche n'a pas répondu à « hello » en 15 s."));

        render(<FicheHote personnage={PERSONNAGE} table={TABLE} onFicheLiee={vi.fn()} onRapprochement={vi.fn()} fabriquerLePont={() => pont} />);
        charger();

        expect(await screen.findByText(/n'a pas pu s'ouvrir/)).toBeTruthy();
    });

    /**
     * **La copie de sauvegarde — chantier n° 5.**
     *
     * La bibliothèque du moteur vit dans l'IndexedDB de l'iframe, que la
     * sauvegarde automatique ne voit pas. Une fiche ouverte sur l'écran du meneur
     * est le seul moment où GM-OS peut la demander.
     */
    describe('la copie de la bibliothèque', () => {
        beforeEach(() => useBibliothequeDesFiches.getState().oublier());

        it('l’emporte quand une fiche s’ouvre sur l’écran du meneur', async () => {
            const { pont } = faireUnPont();
            render(<FicheHote personnage={{ ...PERSONNAGE, ficheId: 'f-1' }} table={TABLE} onFicheLiee={vi.fn()} onRapprochement={vi.fn()} fabriquerLePont={() => pont} />);
            charger();

            await waitFor(() => expect(pont.sauvegarde).toHaveBeenCalled(), { timeout: 4000 });
            await waitFor(() => expect(useBibliothequeDesFiches.getState().instantane).not.toBeNull());
            expect(useBibliothequeDesFiches.getState().instantane?.personnages).toBe(1);
        });

        /**
         * Sur une tablette, la bibliothèque locale n'est qu'une surface
         * d'affichage semée depuis GM-OS : la sauvegarder archiverait un reflet,
         * et l'écrirait par-dessus l'original.
         */
        it('ne l’emporte JAMAIS depuis une tablette', async () => {
            const { pont } = faireUnPont();
            render(<FicheHote personnage={PERSONNAGE} table={TABLE} liaison="locale" onFicheLiee={vi.fn()} onRapprochement={vi.fn()} fabriquerLePont={() => pont} />);
            charger();

            await waitFor(() => expect(pont.creer).toHaveBeenCalled());
            await new Promise(r => setTimeout(r, 2500));
            expect(pont.sauvegarde).not.toHaveBeenCalled();
            expect(useBibliothequeDesFiches.getState().instantane).toBeNull();
        });

        /**
         * **Le retour du filet.** Une bibliothèque vide alors que GM-OS en garde
         * une copie, c'est le profil neuf ou l'appareil changé — le cas exact
         * que le chantier n° 5 existe pour rattraper. *Une sauvegarde qu'on ne
         * peut pas restaurer n'est pas une sauvegarde.*
         */
        it('propose de restaurer quand la bibliothèque est vide', async () => {
            useBibliothequeDesFiches.getState().retenirLInstantane({
                format: 'character-sheet-manager-backup', version: 1, templates: [],
                characters: [{ id: 'f-1', name: 'Rick' }, { id: 'f-2', name: 'Roy' }],
            });

            const { pont, appels } = faireUnPont();
            (pont.bibliotheque as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ characters: [], templates: [] });
            render(<FicheHote personnage={PERSONNAGE} table={TABLE} onFicheLiee={vi.fn()} onRapprochement={vi.fn()} fabriquerLePont={() => pont} />);
            charger();

            fireEvent.click(await screen.findByRole('button', { name: /Restaurer la bibliothèque/ }));
            await waitFor(() => expect(appels).toContain('restore'));
            expect((pont.restaurer as ReturnType<typeof vi.fn>).mock.calls[0][0])
                .toMatchObject({ format: 'character-sheet-manager-backup' });
        });

        /**
         * *Proposer la restauration sur une bibliothèque garnie inviterait à
         * écraser des fiches vivantes par une copie plus ancienne.*
         */
        it('ne la propose pas quand la bibliothèque porte déjà des fiches', async () => {
            useBibliothequeDesFiches.getState().retenirLInstantane({
                format: 'character-sheet-manager-backup', version: 1, templates: [],
                characters: [{ id: 'f-1', name: 'Rick' }],
            });

            const { pont } = faireUnPont();
            render(<FicheHote personnage={PERSONNAGE} table={TABLE} onFicheLiee={vi.fn()} onRapprochement={vi.fn()} fabriquerLePont={() => pont} />);
            charger();

            expect(await screen.findByText(/Rick Deckard/)).toBeTruthy();
            expect(screen.queryByRole('button', { name: /Restaurer la bibliothèque/ })).toBeNull();
        });

        /** Une copie ratée n'empêche personne de jouer : la précédente reste. */
        it('ne casse rien quand le moteur refuse', async () => {
            const { pont } = faireUnPont();
            (pont.sauvegarde as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('base fermée'));
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

            render(<FicheHote personnage={{ ...PERSONNAGE, ficheId: 'f-1' }} table={TABLE} onFicheLiee={vi.fn()} onRapprochement={vi.fn()} fabriquerLePont={() => pont} />);
            charger();

            await waitFor(() => expect(warn).toHaveBeenCalled(), { timeout: 4000 });
            expect(useBibliothequeDesFiches.getState().instantane).toBeNull();
            warn.mockRestore();
        });
    });

    it('ferme le pont en partant', async () => {
        const { pont } = faireUnPont();
        const vue = render(<FicheHote personnage={PERSONNAGE} table={TABLE} onFicheLiee={vi.fn()} onRapprochement={vi.fn()} fabriquerLePont={() => pont} />);
        charger();
        await waitFor(() => expect(pont.bonjour).toHaveBeenCalled());

        vue.unmount();
        expect(pont.fermer).toHaveBeenCalled();
    });
});
