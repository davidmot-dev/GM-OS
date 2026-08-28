import { describe, it, expect, vi, afterEach } from 'vitest';
import {
    ouvrirLePont, adresseDuMoteur, origineDesFiches, PORT_DES_FICHES, CANAL,
    type ChangementDeFiche,
} from './pontDeLaFiche';

/**
 * **L'origine des fiches — c'est elle qui isole, pas le protocole.**
 *
 * Une fiche sur la même origine que la page qui l'affiche peut lire son
 * stockage. Le fichier HTML est régénéré par un GPT et n'est jamais relu ligne à
 * ligne : cette séparation est tout ce qui protège les données.
 */
describe('adresseDuMoteur', () => {
    const pontDOrigine = window.appBridge;
    afterEach(() => { (window as { appBridge?: unknown }).appBridge = pontDOrigine; });

    it('dans Electron, passe par le protocole interne', () => {
        expect(origineDesFiches()).toBe('gmos://media/docs');
        expect(adresseDuMoteur()).toBe('gmos://media/docs/fiches/Character_Sheet_Manager.html');
    });

    /**
     * Le joueur ne gère pas une bibliothèque, il regarde sa fiche. Le meneur, si
     * — il garde donc la barre latérale et les boutons d'export.
     */
    it('ne demande la vue épurée que pour la tablette', () => {
        expect(adresseDuMoteur({ epuree: true })).toContain('?vue=epuree');
        expect(adresseDuMoteur()).not.toContain('vue=');
        expect(adresseDuMoteur({ epuree: false })).not.toContain('vue=');
    });

    /**
     * Sur une tablette il n'y a pas de `gmos://`. Servir la fiche par le
     * `SyncServer` la mettrait sur l'origine du Player Hub, avec accès à son
     * stockage — d'où un port à elle.
     */
    it('sur une tablette, passe par le port des fiches — jamais celui de la page', () => {
        delete (window as { appBridge?: unknown }).appBridge;

        const attendue = `http://${window.location.hostname}:${PORT_DES_FICHES}`;
        expect(origineDesFiches()).toBe(attendue);
        expect(adresseDuMoteur()).toBe(`${attendue}/fiches/Character_Sheet_Manager.html`);
        expect(PORT_DES_FICHES).not.toBe(3001);
    });
});

/**
 * **Le pont vers la fiche, éprouvé contre un faux moteur.**
 *
 * Le VRAI moteur est éprouvé par `electron/coutureDesFiches.test.ts`, qui le
 * charge du disque. Ici on éprouve le côté GM-OS : la corrélation, le délai, le
 * contrôle de l'émetteur — trois choses qu'un pont par messages doit faire et
 * qu'on oublie.
 */

/** Un moteur en carton : il reçoit, il répond quand on le lui dit. */
function faireUnMoteur() {
    const recus: any[] = [];
    const cible = {
        postMessage: (msg: any) => { recus.push(msg); },
    } as unknown as Window;

    /** Le moteur parle : on rejoue un `message` comme le navigateur le ferait. */
    const parler = (data: unknown, source: unknown = cible) => {
        window.dispatchEvent(Object.assign(new Event('message'), { data, source, origin: 'gmos://media' }));
    };

    return { cible, recus, parler };
}

describe('ouvrirLePont', () => {
    it('corrèle les réponses par identifiant, jamais par rang', async () => {
        const { cible, recus, parler } = faireUnMoteur();
        const pont = ouvrirLePont(cible);

        const premiere = pont.lire();
        const seconde = pont.gabarit();
        expect(recus.map(m => m.type)).toEqual(['get', 'template']);

        /*
          Les deux réponses arrivent DANS LE DÉSORDRE, et le moteur glisse une
          diffusion entre les deux — c'est ce qu'il fait vraiment : un `set`
          diffuse son `change` avant de répondre.
        */
        parler({ channel: CANAL, type: 'change', origin: 'sheet', keys: ['nom'], character: null });
        parler({ channel: CANAL, type: 'reply', id: recus[1].id, ok: true, result: { id: 'g' } });
        parler({ channel: CANAL, type: 'reply', id: recus[0].id, ok: true, result: { id: 'p' } });

        expect(await premiere).toEqual({ id: 'p' });
        expect(await seconde).toEqual({ id: 'g' });
    });

    it('transporte les verbes de la bibliothèque avec leurs arguments', async () => {
        const { cible, recus } = faireUnMoteur();
        const pont = ouvrirLePont(cible);

        // `fermer()` fait échouer ce qui attend encore : ici on ne s'intéresse
        // qu'à ce qui est PARTI, donc on absorbe les rejets sans les taire ailleurs.
        const ignorer = () => {};
        pont.ouvrirPersonnage('c-1').catch(ignorer);
        pont.creer('Roy', 'blade-runner-fr', { nom: 'Roy' }).catch(ignorer);
        pont.ecrire({ nom: 'Rick' }).catch(ignorer);
        pont.sauvegarde().catch(ignorer);

        expect(recus.map(m => m.type)).toEqual(['openCharacter', 'create', 'set', 'backup']);
        // `characterId` et non `id` : `id` est déjà l'identifiant du message.
        expect(recus[0]).toMatchObject({ characterId: 'c-1' });
        expect(recus[0].id).not.toBe('c-1');
        expect(recus[1]).toMatchObject({ name: 'Roy', templateId: 'blade-runner-fr', data: { nom: 'Roy' } });
        expect(recus[2]).toMatchObject({ data: { nom: 'Rick' } });
        pont.fermer();
    });

    /**
     * N'importe quelle fenêtre peut poster un message portant le bon canal. La
     * seule preuve qu'on ne peut pas contrefaire depuis une autre page, c'est
     * `event.source`.
     */
    it('ignore un message qui ne vient pas de la fiche', async () => {
        const { cible, recus, parler } = faireUnMoteur();
        const pont = ouvrirLePont(cible, { delaiMs: 60 });

        const attendue = pont.lire();
        parler({ channel: CANAL, type: 'reply', id: recus[0].id, ok: true, result: { id: 'imposteur' } }, {});

        await expect(attendue).rejects.toThrow(/n'a pas répondu/);
        pont.fermer();
    });

    it('ignore un message d’un autre canal', () => {
        const { cible, parler } = faireUnMoteur();
        const pont = ouvrirLePont(cible);
        const vus: ChangementDeFiche[] = [];
        pont.surChangement(ev => vus.push(ev));

        parler({ channel: 'autre-chose', type: 'change', origin: 'sheet', keys: ['nom'] });
        expect(vus).toEqual([]);
        pont.fermer();
    });

    /**
     * Une fiche qui n'a pas fini de charger, un moteur régénéré sans sa couture :
     * sans délai, l'hôte attend pour toujours et l'écran reste figé sans un mot.
     */
    it('rend la main quand personne ne répond', async () => {
        const { cible } = faireUnMoteur();
        const pont = ouvrirLePont(cible, { delaiMs: 40 });
        await expect(pont.bonjour()).rejects.toThrow(/n'a pas répondu à « hello »/);
        pont.fermer();
    });

    it('transforme un refus du moteur en échec, avec son motif', async () => {
        const { cible, recus, parler } = faireUnMoteur();
        const pont = ouvrirLePont(cible);

        const attendue = pont.ouvrirPersonnage('personne');
        parler({ channel: CANAL, type: 'reply', id: recus[0].id, ok: false, result: 'Personnage introuvable : personne' });

        await expect(attendue).rejects.toThrow(/introuvable/);
        pont.fermer();
    });

    it('sert les diffusions du moteur, et sait s’en désabonner', () => {
        const { cible, parler } = faireUnMoteur();
        const pont = ouvrirLePont(cible);
        const vus: ChangementDeFiche[] = [];
        const desabonner = pont.surChangement(ev => vus.push(ev));

        parler({ channel: CANAL, type: 'change', origin: 'sheet', keys: ['nom'], character: { id: 'c' } });
        parler({ channel: CANAL, type: 'open', origin: 'open', keys: [], character: null, template: { id: 't' } });

        expect(vus.map(v => v.origin)).toEqual(['sheet', 'open']);
        expect(vus[1].template).toEqual({ id: 't' });

        desabonner();
        parler({ channel: CANAL, type: 'change', origin: 'sheet', keys: ['x'], character: null });
        expect(vus).toHaveLength(2);
        pont.fermer();
    });

    /** Ce qui attendait ne recevra jamais rien : le dire plutôt que le taire. */
    it('fermer fait échouer ce qui attendait, et n’écoute plus', async () => {
        const { cible, recus, parler } = faireUnMoteur();
        const pont = ouvrirLePont(cible);

        const attendue = pont.lire();
        pont.fermer();
        await expect(attendue).rejects.toThrow(/fermé/);

        // Une réponse tardive ne réveille personne, et n'explose pas non plus.
        parler({ channel: CANAL, type: 'reply', id: recus[0].id, ok: true, result: null });
        await expect(pont.lire()).rejects.toThrow(/fermé/);
    });

    it('ne laisse pas une cible en panne bloquer l’appelant', async () => {
        const cible = { postMessage: () => { throw new Error('fenêtre disparue'); } } as unknown as Window;
        const pont = ouvrirLePont(cible, { delaiMs: 40 });
        await expect(pont.lire()).rejects.toThrow(/fenêtre disparue/);
        pont.fermer();
    });

    it('n’écoute plus rien après fermeture', () => {
        const retirer = vi.fn();
        const ecouteur = { addEventListener: vi.fn(), removeEventListener: retirer };
        const pont = ouvrirLePont({ postMessage: () => {} } as unknown as Window, { ecouteur: ecouteur as never });

        expect(ecouteur.addEventListener).toHaveBeenCalledTimes(1);
        pont.fermer();
        expect(retirer).toHaveBeenCalledTimes(1);
    });
});
