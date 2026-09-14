import { describe, it, expect, afterEach, vi } from 'vitest';
import {
    portDeSynchronisation,
    adresseDeLaTablette,
    adresseDeLaTelecommande,
    PARAMETRE_PORT_SYNC,
} from './portsDuRenderer';
import { PORT_SYNC_PAR_DEFAUT } from '../../electron/portsDeGmOs';

/**
 * **Une tablette doit savoir où est le `SyncServer`, pas le deviner.**
 *
 * ⛔ **Le défaut, signalé par David le 2026-09-14** : *« la tablette joueur
 * pointe vers Eternal Quest et pas vers la campagne en cours »*.
 *
 * Le QR-code n'écrivait qu'un port — le port **applicatif**, qui vaut celui de
 * **Vite** en développement — et `portDeSynchronisation()` en déduisait le port
 * de synchronisation. La tablette ouvrait donc sa WebSocket sur le serveur de
 * rechargement à chaud.
 *
 * ⭐ **Mesuré avant d'être corrigé**, une WebSocket ouverte sur chacun des deux
 * ports comme le ferait une tablette :
 *
 * ```
 * ws://…:3001  -> OUVERT, reponse immediate : remote:registered
 * ws://…:5173  -> OUVERT, et AUCUN message en 4 s
 * ```
 *
 * *Vite accepte la connexion et ne dit jamais rien.* La tablette s'affichait
 * **connectée**, ne recevait aucune campagne, et restait sur `INITIAL_DATA` —
 * dont l'`activeCampaignId` est `c-1`, « The Eternal Quest ». Les images
 * passaient par le même port et arrivaient en `text/html`.
 *
 * *Un silence n'est pas une panne : rien ne le signale, et le symptôme apparaît
 * très loin de sa cause — dans le nom d'une campagne.*
 */

const dansLeNavigateur = (search: string, port: string) => {
    vi.stubGlobal('window', {
        ...window,
        appBridge: undefined,
        location: { ...window.location, search, port },
    });
};

const dansElectron = (search: string, port: string) => {
    vi.stubGlobal('window', {
        ...window,
        appBridge: {},
        location: { ...window.location, search, port },
    });
};

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('portDeSynchronisation', () => {
    it('suit ce que l’adresse annonce, même si la page vient d’ailleurs', () => {
        // Le cas de David : la page vient de Vite, le SyncServer est sur 3001.
        dansLeNavigateur(`?window=tablet&${PARAMETRE_PORT_SYNC}=3001`, '5173');
        expect(portDeSynchronisation()).toBe(3001);
    });

    it('retombe sur le port de la page quand l’adresse n’annonce rien', () => {
        // Le cas de la production : c'est le SyncServer qui sert la page.
        dansLeNavigateur('?window=tablet', '3001');
        expect(portDeSynchronisation()).toBe(3001);
    });

    /**
     * *Un paramètre fautif ne doit pas valoir moins qu'un paramètre absent.* Un
     * meneur qui recopie l'adresse à la main et se trompe d'un caractère doit
     * retrouver le comportement d'avant, pas une tablette qui ne se connecte
     * nulle part.
     */
    it.each(['abc', '', '0', '-1', '99999'])('ignore un port illisible (%s)', (valeur) => {
        dansLeNavigateur(`?${PARAMETRE_PORT_SYNC}=${valeur}`, '3001');
        expect(portDeSynchronisation()).toBe(3001);
    });

    it('ignore le port de la page dans une fenêtre Electron', () => {
        // Le Player Hub et le projecteur viennent de Vite ou d'un fichier :
        // leur `location` ne dit rien des serveurs.
        dansElectron('?window=hub', '5173');
        expect(portDeSynchronisation()).toBe(PORT_SYNC_PAR_DEFAUT);
    });

    /**
     * ⚠️ Une annonce explicite vaut **partout**, Electron compris : c'est une
     * consigne, pas une déduction. Rien ne l'écrit aujourd'hui dans une fenêtre
     * Electron — mais si quelque chose le fait un jour, ce sera pour être suivi.
     */
    it('suit l’annonce même dans Electron', () => {
        dansElectron(`?window=hub&${PARAMETRE_PORT_SYNC}=4444`, '5173');
        expect(portDeSynchronisation()).toBe(4444);
    });
});

describe('l’adresse donnée à une tablette', () => {
    /** Le régime de développement : les deux ports diffèrent. */
    const enDeveloppement = { ip: '192.168.1.20', port: 5173, mediaPort: 3001 };
    /** Le régime de production : c'est le SyncServer qui sert tout. */
    const enProduction = { ip: '192.168.1.20', port: 3001, mediaPort: 3001 };

    it('charge l’application où il faut ET dit où est le SyncServer', () => {
        const url = adresseDeLaTablette(enDeveloppement);
        expect(url).toBe(`http://192.168.1.20:5173/?window=tablet&${PARAMETRE_PORT_SYNC}=3001`);
    });

    /**
     * ⛔ **La garde qui aurait vu le défaut.** Sans le paramètre, cette adresse
     * envoie la tablette parler à Vite. On vérifie le geste — *l'adresse porte
     * les deux ports* — et non la chaîne exacte.
     */
    it.each([
        ['la tablette', adresseDeLaTablette],
        ['la télécommande', adresseDeLaTelecommande],
    ])('%s reçoit les DEUX ports quand ils diffèrent', (_nom, composer) => {
        const url = composer(enDeveloppement)!;
        expect(url, 'le port applicatif manque').toContain(':5173/');
        expect(url, 'le port du SyncServer n’est pas annoncé')
            .toContain(`${PARAMETRE_PORT_SYNC}=3001`);
    });

    it('reste juste en production, où les deux ports sont le même', () => {
        expect(adresseDeLaTablette(enProduction))
            .toBe(`http://192.168.1.20:3001/?window=tablet&${PARAMETRE_PORT_SYNC}=3001`);
    });

    it('distingue la tablette de la télécommande', () => {
        expect(adresseDeLaTelecommande(enDeveloppement)).toContain('window=remote');
        expect(adresseDeLaTablette(enDeveloppement)).toContain('window=tablet');
    });

    /**
     * Le repli hors Electron : aucun pont pour dire où est le `SyncServer`, donc
     * son port par défaut — c'est Electron qui l'ouvre, et il ne bouge que si le
     * meneur le déplace lui-même.
     */
    it('retombe sur le port par défaut quand le pont n’a rien dit', () => {
        expect(adresseDeLaTablette({ ip: '10.0.0.4' }))
            .toBe(`http://10.0.0.4:${PORT_SYNC_PAR_DEFAUT}/?window=tablet`
                + `&${PARAMETRE_PORT_SYNC}=${PORT_SYNC_PAR_DEFAUT}`);
    });

    it('ne compose rien sans adresse', () => {
        expect(adresseDeLaTablette(null)).toBeNull();
        expect(adresseDeLaTablette(undefined)).toBeNull();
        expect(adresseDeLaTelecommande({ port: 3001 })).toBeNull();
    });
});

/**
 * **Personne ne compose cette adresse à la main.**
 *
 * `adresseDuPontDesBoutons` porte depuis le 2026-09-13 la phrase *« la seule
 * défense est de ne composer cette adresse qu'ici »* — et le QR-code la
 * composait quand même, deux fichiers plus loin, depuis toujours. **Une règle
 * énoncée dans un commentaire ne protège que le fichier qui la porte.**
 *
 * ⚠️ On lit le **code sans les commentaires** : ceux que ce correctif a écrits
 * citent l'ancienne adresse pour expliquer le défaut. *Troisième fois que cette
 * précaution est nécessaire dans ce dépôt* — voir `nomDesEcransALEcran`.
 */
const sources = import.meta.glob('/src/**/*.{ts,tsx}', {
    query: '?raw',
    import: 'default',
    eager: true,
}) as Record<string, string>;

function sansCommentaires(source: string): string {
    return source
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/^\s*\/\/.*$/gm, ' ');
}

/**
 * Le geste : fabriquer une adresse de client distant **en toutes lettres**.
 *
 * `adresseDUnClient` y échappe par construction — elle prend le nom de la
 * fenêtre en paramètre —, et c'est la seule exemption qu'on veuille : *un
 * fichier qui écrit `?window=tablet` en dur écrit aussi son port en dur.*
 */
const COMPOSE_UNE_ADRESSE = /\?window=(?:tablet|remote)/;

describe('l’adresse des clients distants', () => {
    it('ne se compose qu’à un seul endroit', () => {
        expect(Object.keys(sources).length).toBeGreaterThan(150);

        const composeurs = Object.entries(sources)
            .filter(([chemin]) => !chemin.endsWith('.test.ts') && !chemin.endsWith('.test.tsx'))
            .filter(([, source]) => COMPOSE_UNE_ADRESSE.test(sansCommentaires(source)))
            .map(([chemin]) => chemin);

        expect(composeurs, [
            'Une adresse de tablette ou de télécommande composée hors de',
            '`portsDuRenderer.ts` porte un seul port — le port applicatif, qui est',
            'celui de Vite en développement. Le client en déduit alors son port de',
            'synchronisation et parle au serveur de rechargement à chaud, qui',
            'accepte la connexion et ne répond jamais rien.',
            'Passez par `adresseDeLaTablette` ou `adresseDeLaTelecommande`.',
        ].join(' ')).toEqual([]);
    });
});
