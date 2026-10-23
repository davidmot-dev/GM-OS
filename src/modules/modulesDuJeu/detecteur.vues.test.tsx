// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { VueJoueur, PupitreMJ } from '../../../outils/alien/modules/detecteur/vues.mjs';
import * as moteur from '../../../outils/alien/modules/detecteur/moteur.mjs';

const oscillateurs = new Set<object>();
const demarrerSon = vi.fn();
const fermerSon = vi.fn();
class AudioFictif {
    state = 'running'; currentTime = 0; destination = {};
    resume = async () => { this.state = 'running'; };
    suspend = async () => { this.state = 'suspended'; };
    close = async () => { this.state = 'closed'; fermerSon(); };
    createGain = () => ({ gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn(), disconnect: vi.fn() });
    createOscillator() {
        let minuterie: ReturnType<typeof setTimeout>;
        const oscillateur = { frequency: { value: 0 }, onended: null as (() => void) | null, connect: vi.fn(), disconnect: vi.fn(),
            start() { oscillateurs.add(oscillateur); demarrerSon(); },
            stop(quand?: number) {
                clearTimeout(minuterie);
                const finir = () => { oscillateurs.delete(oscillateur); oscillateur.onended?.(); };
                if (quand === undefined) finir(); else minuterie = setTimeout(finir, 100);
            } };
        return oscillateur;
    }
}
const actif = () => moteur.appliquerCommande(moteur.creerEtat(), { id: 'scanner', charge: { actif: true } }, { role: 'mj' });
const envoyerCommande = vi.fn(async () => ({ ok: true as const }));
beforeEach(() => {
    vi.useFakeTimers(); vi.clearAllMocks(); oscillateurs.clear();
    vi.stubGlobal('AudioContext', AudioFictif);
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    vi.stubGlobal('requestAnimationFrame', vi.fn((cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 16)));
    vi.stubGlobal('cancelAnimationFrame', vi.fn(clearTimeout));
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
        setTransform: vi.fn(), clearRect: vi.fn(), beginPath: vi.fn(), arc: vi.fn(), stroke: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), closePath: vi.fn(), fill: vi.fn(), fillRect: vi.fn(),
    } as unknown as ReturnType<HTMLCanvasElement['getContext']>);
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 300, height: 300 } as DOMRect);
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const cliquer = async (element: HTMLElement) => { await act(async () => fireEvent.click(element)); };

describe('instrument du détecteur', () => {
    it('prépare une zone et le porteur, puis conserve le scan payé dans le formulaire du mode discret', async () => {
        let etat=moteur.creerEtat();
        const props=()=>({vue:moteur.vuePour(etat,{role:'mj'}),envoyerCommande:async(commande:moteur.CommandeDetecteur)=>{
            etat=moteur.appliquerCommande(etat,commande,{role:'mj'});vue.rerender(<PupitreMJ {...props()}/>);return {ok:true as const};
        }});
        const vue=render(<PupitreMJ {...props()}/>);
        fireEvent.change(vue.getByLabelText('Nom de la zone'),{target:{value:'Sas'}});
        await act(async()=>fireEvent.submit(vue.getByLabelText('Nom de la zone').closest('form')!));
        expect(etat.discret.zones[0].nom).toBe('Sas');
        // Le plan privé se voit dès la première zone, avant le raccord (David, 23/10).
        expect(vue.getByRole('img',{name:'Plan privé des zones'})).toBeTruthy();
        expect(vue.queryByLabelText('Réserve propre à la batterie du M314')).toBeNull();
        fireEvent.change(vue.getByLabelText('Nom privé du pion'),{target:{value:'Porteur'}});
        await act(async()=>fireEvent.submit(vue.getByLabelText('Nom privé du pion').closest('form')!));
        expect(etat.discret.pions[0]).toMatchObject({nom:'Porteur',humain:true,limite:2,depense:0});
        await cliquer(vue.getByLabelText('Raccorder le détecteur au plan et à sa batterie'));
        await act(async()=>fireEvent.submit(vue.getByLabelText('Réserve propre à la batterie du M314').closest('form')!));
        expect(etat.discret.porteurId).toBe(etat.discret.pions[0].id);
        await cliquer(vue.getByRole('button',{name:'Scanner ce Tour et tester l’Énergie'}));
        expect(etat.discret.dernierScan?.tour).toBe(1);
        expect((vue.getByRole('button',{name:'Scanner ce Tour et tester l’Énergie'}) as HTMLButtonElement).disabled).toBe(true);
        expect(JSON.stringify(moteur.vuePour(etat,{role:'joueur',personnageId:'alice'}))).not.toContain('Porteur');
    });
    it('enregistre, rappelle en veille et supprime un préréglage après confirmation, puis remet à zéro', async () => {
        let etat = actif();
        const commandes: moteur.CommandeDetecteur[] = [];
        const props = () => ({ vue: etat, envoyerCommande: async (commande: moteur.CommandeDetecteur) => {
            commandes.push(commande);
            etat = moteur.appliquerCommande(etat, commande, { role: 'mj' });
            vue.rerender(<PupitreMJ {...props()} />);
            return { ok: true as const };
        } });
        const vue = render(<PupitreMJ {...props()} />);
        const nom = vue.getByLabelText('Nom du préréglage');
        fireEvent.change(nom, { target: { value: 'Couloir' } });
        await act(async () => fireEvent.submit(nom.closest('form')!));
        expect(etat.prereglages.map(p => p.nom)).toEqual(['Exemple — relais à sept salles', 'Couloir']);
        expect((vue.getByLabelText('Préréglage') as HTMLSelectElement).value).toBe(etat.prereglages[1].id);
        const rappeler = vue.getByRole('button', { name: 'Rappeler ce préréglage' });
        expect((rappeler as HTMLButtonElement).disabled).toBe(true);
        await cliquer(vue.getByLabelText('Confirmer le remplacement de la préparation actuelle'));
        await cliquer(rappeler);
        expect(etat.tracker.power).toBe(false);
        const supprimer = vue.getByRole('button', { name: 'Supprimer le préréglage' });
        expect((supprimer as HTMLButtonElement).disabled).toBe(true);
        await cliquer(vue.getByLabelText('Confirmer la suppression du préréglage'));
        await cliquer(supprimer);
        expect(etat.prereglages.map(p => p.id)).toEqual(['exemple-relais']);
        // L'exemple tout fait pose le plan du relais, raccordé.
        fireEvent.change(vue.getByLabelText('Préréglage'), { target: { value: 'exemple-relais' } });
        await cliquer(vue.getByLabelText('Confirmer le remplacement de la préparation actuelle'));
        await cliquer(vue.getByRole('button', { name: 'Rappeler ce préréglage' }));
        expect(etat.discret).toMatchObject({ actif: true, porteurId: 'pj-rye', tour: 1 });
        expect(etat.discret.zones).toHaveLength(8);
        const reinitialiser = vue.getByRole('button', { name: 'Réinitialiser le détecteur' });
        expect((reinitialiser as HTMLButtonElement).disabled).toBe(true);
        await cliquer(vue.getByLabelText('Confirmer la réinitialisation'));
        await cliquer(reinitialiser);
        expect(etat.discret.zones).toEqual([]);
        expect(etat.prereglages.map(p => p.id)).toEqual(['exemple-relais']);
        expect(commandes.map(c => c.id)).toEqual(['enregistrer-prereglage', 'rappeler-prereglage', 'supprimer-prereglage', 'rappeler-prereglage', 'reinitialiser']);
    });
    it('le joueur ne reçoit aucun contrôle MJ et les bips demandent un geste local', async () => {
        const vue = render(<VueJoueur vue={actif()} envoyerCommande={envoyerCommande} />);
        expect(vue.queryByRole('button', { name: 'Démarrer le scan' })).toBeNull();
        expect(vue.queryByRole('form')).toBeNull(); expect(demarrerSon).not.toHaveBeenCalled();
        await cliquer(vue.getByRole('button', { name: 'Activer les bips ici' }));
        expect(demarrerSon).toHaveBeenCalledTimes(1); expect(envoyerCommande).not.toHaveBeenCalled();
        await cliquer(vue.getByRole('button', { name: 'Couper les bips' }));
        expect(oscillateurs.size).toBe(0);
        act(() => vi.advanceTimersByTime(5000)); expect(demarrerSon).toHaveBeenCalledTimes(1);
    });
    it('arrêt du scan, volume nul et démontage coupent les bips sans attendre une animation', async () => {
        let etat = actif();
        const vue = render(<VueJoueur vue={etat} envoyerCommande={envoyerCommande} />);
        await cliquer(vue.getByRole('button', { name: 'Activer les bips ici' }));
        expect(oscillateurs.size).toBe(1);
        etat = moteur.appliquerCommande(etat, { id: 'configurer', charge: { volume: 0 } }, { role: 'mj' });
        vue.rerender(<VueJoueur vue={etat} envoyerCommande={envoyerCommande} />); expect(oscillateurs.size).toBe(0);
        const avant = demarrerSon.mock.calls.length;
        act(() => vi.advanceTimersByTime(5000)); expect(demarrerSon).toHaveBeenCalledTimes(avant);
        etat = moteur.appliquerCommande(etat, { id: 'configurer', charge: { volume: 50 } }, { role: 'mj' });
        vue.rerender(<VueJoueur vue={etat} envoyerCommande={envoyerCommande} />); expect(oscillateurs.size).toBe(1);
        vue.rerender(<VueJoueur vue={moteur.arreterEffets(etat)} envoyerCommande={envoyerCommande} />); expect(oscillateurs.size).toBe(0);
        vue.rerender(<VueJoueur vue={etat} envoyerCommande={envoyerCommande} />); expect(oscillateurs.size).toBe(1);
        vue.unmount(); expect(oscillateurs.size).toBe(0); expect(fermerSon).toHaveBeenCalledTimes(1);
        act(() => vi.advanceTimersByTime(10000)); expect(oscillateurs.size).toBe(0);
        render(<VueJoueur vue={etat} envoyerCommande={envoyerCommande} />);
        expect(oscillateurs.size).toBe(0); // Reconnexion ou retour : aucun son relancé sans clic.
    });
    it('un onglet masqué se tait immédiatement ; aucun ancien bip ne se rejoue au retour', async () => {
        const vue = render(<VueJoueur vue={actif()} envoyerCommande={envoyerCommande} />);
        await cliquer(vue.getByRole('button', { name: 'Activer les bips ici' }));
        Object.defineProperty(document, 'hidden', { configurable: true, value: true });
        fireEvent(document, new Event('visibilitychange')); expect(oscillateurs.size).toBe(0);
        const avant = demarrerSon.mock.calls.length;
        act(() => vi.advanceTimersByTime(60000)); expect(demarrerSon).toHaveBeenCalledTimes(avant);
        Object.defineProperty(document, 'hidden', { configurable: true, value: false });
        fireEvent(document, new Event('visibilitychange')); expect(demarrerSon).toHaveBeenCalledTimes(avant + 1);
    });
    it('le faux écho expire même sans animation et la préférence de mouvement réduit garde le radar fixe', () => {
        const etat = moteur.appliquerCommande(actif(), { id: 'faux-echo', charge: {} }, { role: 'mj' });
        const vue = render(<VueJoueur vue={etat} envoyerCommande={envoyerCommande} />);
        expect(vue.getByRole('img', { name: 'Radar : 4 échos' })).toBeTruthy();
        expect(requestAnimationFrame).not.toHaveBeenCalled();
        act(() => vi.advanceTimersByTime(9001));
        expect(vue.getByRole('img', { name: 'Radar : 3 échos' })).toBeTruthy();
    });
    it('le faux écho suit l’heure du serveur sur une tablette qui avance d’une minute', () => {
        const etat = moteur.appliquerCommande(actif(), { id: 'faux-echo', charge: {} }, { role: 'mj' });
        vi.setSystemTime(Date.now() + 60_000);
        const horloge = () => Date.now() - 60_000;
        // Sans l'horloge reçue, la tablette jugerait l'écho expiré depuis 51 s.
        const sansHorloge = render(<VueJoueur vue={etat} envoyerCommande={envoyerCommande} />);
        expect(sansHorloge.getByRole('img', { name: 'Radar : 3 échos' })).toBeTruthy();
        sansHorloge.unmount();
        const vue = render(<VueJoueur vue={etat} horloge={horloge} envoyerCommande={envoyerCommande} />);
        expect(vue.getByRole('img', { name: 'Radar : 4 échos' })).toBeTruthy();
        act(() => vi.advanceTimersByTime(9001));
        expect(vue.getByRole('img', { name: 'Radar : 3 échos' })).toBeTruthy();
    });
    it('le démontage annule la boucle de dessin et ne laisse aucune minuterie', () => {
        vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
        const vue = render(<VueJoueur vue={actif()} envoyerCommande={envoyerCommande} />);
        act(() => vi.advanceTimersByTime(100)); expect(requestAnimationFrame).toHaveBeenCalled();
        vue.unmount(); expect(cancelAnimationFrame).toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
    });
    it('un transport refusé garde les réglages en brouillon et empêche une double commande', async () => {
        let finir!: (resultat: { ok: false; erreur: string }) => void;
        const commandes = vi.fn(() => new Promise<{ ok: false; erreur: string }>(resolve => { finir = resolve; }));
        const vue = render(<PupitreMJ vue={moteur.creerEtat()} envoyerCommande={commandes} />);
        fireEvent.change(vue.getByLabelText('Contacts'), { target: { value: '8' } });
        await act(async () => { fireEvent.submit(vue.getByRole('form', { name: 'Réglages du détecteur' })); fireEvent.submit(vue.getByRole('form', { name: 'Réglages du détecteur' })); });
        expect(commandes).toHaveBeenCalledTimes(1);
        expect(commandes.mock.calls[0]).toEqual([{ id: 'configurer', charge: { contacts: 8, proximite: 45, intensite: 25, volume: 25, parasites: 10, crt: true, effetsParasites: true } }]);
        await act(async () => finir({ ok: false, erreur: 'Liaison perdue.' }));
        expect((vue.getByLabelText('Contacts') as HTMLInputElement).value).toBe('8'); expect(vue.getByRole('alert').textContent).toBe('Liaison perdue.');
    });
    it('l’indisponibilité audio est indiquée sans interrompre le radar', async () => {
        vi.stubGlobal('AudioContext', undefined); vi.stubGlobal('webkitAudioContext', undefined);
        const vue = render(<VueJoueur vue={actif()} envoyerCommande={envoyerCommande} />);
        await cliquer(vue.getByRole('button', { name: 'Activer les bips ici' }));
        expect(vue.getByText(/Son indisponible/)).toBeTruthy(); expect(vue.getByRole('img')).toBeTruthy();
    });
});
