import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

vi.mock('electron-log', () => ({ default: { info: vi.fn(), warn: vi.fn() } }));

const { deposerLesIcones, corpsMultipart, iconesManquantes, nomsPresents, cibleDeLHote, ICONES_DU_SIGNAL }
    = await import('./ulanziIcones');

/**
 * **Le dépôt des icônes du signal, et le défaut du 2026-08-31 au soir.**
 *
 * *David : « le signal Voight-Kampff de l'Ulanzi ne fonctionne pas ».* Le
 * dossier `/ICONS` de l'appareil était **vide** alors que le widget était bien
 * poussé — donc un cadre noir au milieu de la table.
 *
 * Deux causes se cumulaient, et ces essais gardent les deux :
 *
 * 1. **Un échec d'écriture arrêtait la boucle.** Mesuré sur l'appareil : celui
 *    qui vient de démarrer répond `500 CREATE FAILED` pendant quelques minutes,
 *    puis accepte le même fichier sans rien changer. La première icône refusée
 *    laissait donc les cinq autres au sol.
 * 2. **Le dépôt ne disait pas ce qui manquait encore**, donc l'appelant ne
 *    pouvait pas savoir s'il devait retenter. Il rendait la liste des déposées :
 *    vide quand tout va bien **et** vide quand tout a échoué.
 */

/** Le faux afficheur : un `/list` et un `/edit`, comme celui de David. */
class AfficheurDEssai {
    serveur: http.Server;
    port = 0;
    /** Les noms présents dans `/ICONS`, tels que `/list` les rendra. */
    presents = new Set<string>();
    /** Les noms dont l'écriture doit échouer, comme un appareil qui démarre. */
    refuse = new Set<string>();
    /** Ce que `/edit` a reçu, dans l'ordre. */
    ecritures: string[] = [];

    constructor() {
        this.serveur = http.createServer((req, res) => {
            if (req.url?.startsWith('/list')) {
                const corps = [...this.presents]
                    .map(n => `{"type":"file","size":"1255","name":"${n}.gif"}`)
                    .join(',');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(`[${corps}]`);
                return;
            }
            const morceaux: Buffer[] = [];
            req.on('data', (m: Buffer) => morceaux.push(m));
            req.on('end', () => {
                const recu = Buffer.concat(morceaux).toString('latin1');
                const nom = /filename="\/ICONS\/([^".]+)\.gif"/.exec(recu)?.[1] ?? '?';
                this.ecritures.push(nom);
                if (this.refuse.has(nom)) {
                    res.writeHead(500).end('CREATE FAILED');
                    return;
                }
                this.presents.add(nom);
                res.writeHead(200).end('');
            });
        });
    }

    async demarrer(): Promise<void> {
        await new Promise<void>(ok => this.serveur.listen(0, '127.0.0.1', ok));
        this.port = (this.serveur.address() as { port: number }).port;
    }

    get hote(): string { return `127.0.0.1:${this.port}`; }

    async arreter(): Promise<void> {
        await new Promise<void>(ok => { this.serveur.close(() => ok()); });
    }
}

/** Six faux GIF sur le disque : le dépôt lit ce que l'application embarque. */
let dossier: string;

beforeAll(() => {
    dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'gmos-icones-'));
    for (const nom of ICONES_DU_SIGNAL) {
        fs.writeFileSync(path.join(dossier, `${nom}.gif`), Buffer.from('GIF89a-essai'));
    }
});

afterAll(() => fs.rmSync(dossier, { recursive: true, force: true }));

describe('lire l’inventaire de l’appareil', () => {
    it('lit les noms même quand le listing est malformé', () => {
        const listing = '[{"name":"gmosvk1.gif"},{"name":"cassé";"gmosvk2.gif"}]';
        expect(nomsPresents(listing)).toContain('gmosvk1');
    });

    it('ne redemande que ce qui manque', () => {
        const listing = '[{"name":"gmosvk1.gif"},{"name":"gmosvk4.gif"}]';
        expect(iconesManquantes(listing)).toEqual(['gmosvk2', 'gmosvk3', 'gmosvk5', 'gmosvk6']);
    });

    it('pose le nom du fichier à la main, sans paramètre RFC 5987', () => {
        const corps = corpsMultipart('LIMITE', '/ICONS/gmosvk1.gif', Buffer.from('x')).toString();
        expect(corps).toContain('filename="/ICONS/gmosvk1.gif"');
        expect(corps).not.toContain('filename*');
    });
});

describe('l’hôte peut porter un port', () => {
    it('rend 80 par défaut', () => {
        expect(cibleDeLHote('http://awtrix_73f7a4.local/')).toEqual({ host: 'awtrix_73f7a4.local', port: 80 });
    });

    it('respecte le port saisi, comme le fait UlanziService', () => {
        expect(cibleDeLHote('192.168.0.138:8080')).toEqual({ host: '192.168.0.138', port: 8080 });
    });
});

describe('déposer les icônes du signal', () => {
    it('dépose les six sur un appareil vide, et ne déclare rien de manquant', async () => {
        const afficheur = new AfficheurDEssai();
        await afficheur.demarrer();
        try {
            const depot = await deposerLesIcones(afficheur.hote, dossier);
            expect(depot.deposees).toEqual(ICONES_DU_SIGNAL);
            expect(depot.manquantes).toEqual([]);
        } finally {
            await afficheur.arreter();
        }
    });

    it('n’écrit rien quand elles sont déjà là — le cas courant', async () => {
        const afficheur = new AfficheurDEssai();
        ICONES_DU_SIGNAL.forEach(n => afficheur.presents.add(n));
        await afficheur.demarrer();
        try {
            const depot = await deposerLesIcones(afficheur.hote, dossier);
            expect(afficheur.ecritures).toEqual([]);
            expect(depot.manquantes).toEqual([]);
        } finally {
            await afficheur.arreter();
        }
    });

    /**
     * **Le défaut de David, gardé.** Un appareil qui vient de démarrer refuse
     * une écriture puis les accepte : la première refusée ne doit pas emporter
     * les cinq suivantes.
     */
    it('n’abandonne pas les autres quand une écriture est refusée', async () => {
        const afficheur = new AfficheurDEssai();
        afficheur.refuse.add('gmosvk1');
        await afficheur.demarrer();
        try {
            const depot = await deposerLesIcones(afficheur.hote, dossier);
            expect(afficheur.ecritures).toHaveLength(6);
            expect(depot.deposees).toEqual(['gmosvk2', 'gmosvk3', 'gmosvk4', 'gmosvk5', 'gmosvk6']);
            // Ce qui manque encore est ce qui fait retenter la veille.
            expect(depot.manquantes).toEqual(['gmosvk1']);
        } finally {
            await afficheur.arreter();
        }
    });

    it('déclare manquante une icône absente de l’application', async () => {
        const vide = fs.mkdtempSync(path.join(os.tmpdir(), 'gmos-sans-icones-'));
        const afficheur = new AfficheurDEssai();
        await afficheur.demarrer();
        try {
            const depot = await deposerLesIcones(afficheur.hote, vide);
            expect(depot.deposees).toEqual([]);
            expect(depot.manquantes).toEqual(ICONES_DU_SIGNAL);
        } finally {
            await afficheur.arreter();
            fs.rmSync(vide, { recursive: true, force: true });
        }
    });

    /**
     * Un appareil injoignable doit **jeter**, et non rendre « tout va bien » :
     * c'est le handler du processus principal qui traduit ça en « tout manque »,
     * et c'est cette traduction qui fait retenter la veille.
     */
    it('jette quand l’appareil ne répond pas', async () => {
        await expect(deposerLesIcones('127.0.0.1:1', dossier)).rejects.toThrow();
    });
});
