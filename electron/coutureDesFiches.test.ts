import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';

/**
 * **La couture des fiches — GM-OS lit et écrit la fiche ouverte.**
 *
 * Le gestionnaire de fiches est un IIFE : il avait `getByPath`, `setByPath` et
 * `saveCharacter` en interne et n'exposait **rien**. C'était le seul blocage du
 * chantier 3b. Ce fichier éprouve la couture publiée — `window.RPGSheet` et le
 * même contrat par `postMessage`.
 *
 * **On charge le vrai moteur du disque**, jamais une imitation : le jour où le
 * GPT régénère le fichier et emporte la couture, c'est ici qu'on l'apprend.
 * Seul le gabarit est fabriqué — les quatre gabarits réels pèsent sept
 * mégaoctets de fonds de page, et ce n'est pas eux qu'on teste.
 *
 * Il est dans `electron/` et non dans `src/` parce que les tests du renderer
 * tournent avec le shim `fs` de `vite-plugin-electron-renderer`, qui ne sait
 * pas lire un fichier — même raison que `themesDesJeux.test.ts`.
 */

const MOTEUR = path.resolve(__dirname, '..', 'docs', 'fiches', 'Character_Sheet_Manager.html');
const source = fs.readFileSync(MOTEUR, 'utf8');

/**
 * Un gabarit d'une page, choisi pour couvrir les natures que la couture doit
 * savoir redessiner : un texte, une case, un `select`, une piste de hotspots
 * (qui portent leur valeur, donc un scalaire) et un champ dérivé.
 */
const GABARIT = {
    id: 'gabarit-de-controle',
    name: 'Gabarit de contrôle',
    system: 'Contrôle',
    accent: '#5ea79d',
    pages: [{
        id: 'p1', label: 'Page 1', width: 800, height: 1000,
        backgroundData: 'data:image/png;base64,iVBORw0KGgo=',
        fields: [
            { key: 'nom', label: 'Nom', type: 'text', x: 10, y: 10, w: 200, h: 24 },
            { key: 'vigueur', label: 'Vigueur', type: 'text', x: 10, y: 40, w: 80, h: 24 },
            { key: 'blesse', label: 'Blessé', type: 'checkbox', x: 10, y: 70, w: 20, h: 20 },
            { key: 'nature', label: 'Nature', type: 'select', options: ['Humain', 'Réplicant'], x: 10, y: 100, w: 120, h: 24 },
            { key: 'sante', label: 'Santé 1', type: 'hotspot', value: 1, x: 10, y: 140, w: 20, h: 20 },
            { key: 'sante', label: 'Santé 2', type: 'hotspot', value: 2, x: 34, y: 140, w: 20, h: 20 },
            { key: 'sante', label: 'Santé 3', type: 'hotspot', value: 3, x: 58, y: 140, w: 20, h: 20 },
            {
                key: 'santeMoitie', label: 'Moitié', type: 'number', x: 10, y: 180, w: 60, h: 24,
                derive: { operation: 'floor-divide', source: 'sante', divisor: 2 },
            },
        ],
    }],
};

/** Le vrai fichier, avec ses gabarits intégrés remplacés par celui de contrôle. */
function pageDeControle(): string {
    const balise = source.indexOf('<script id="builtinTemplates" type="application/json">');
    expect(balise, 'le bloc des gabarits intégrés').toBeGreaterThan(-1);
    const ouvert = source.indexOf('>', balise) + 1;
    const ferme = source.indexOf('</script>', ouvert);
    return source.slice(0, ouvert) + JSON.stringify([GABARIT]) + source.slice(ferme);
}

/** IndexedDB en mémoire — la surface exacte que le moteur utilise, rien de plus. */
function poserIndexedDB(window: any): void {
    const magasins = new Map<string, Map<unknown, any>>();
    const requete = (calcul: () => unknown) => {
        const r: any = { onsuccess: null, onerror: null, result: undefined, error: null };
        queueMicrotask(() => {
            try { r.result = calcul(); r.onsuccess?.(); } catch (e) { r.error = e; r.onerror?.(); }
        });
        return r;
    };
    const magasin = (nom: string) => ({
        getAll: () => requete(() => [...(magasins.get(nom)?.values() ?? [])]),
        get: (cle: unknown) => requete(() => magasins.get(nom)?.get(cle)),
        put: (obj: any) => requete(() => { magasins.get(nom)!.set(obj.id ?? obj.key, obj); return obj; }),
        delete: (cle: unknown) => requete(() => { magasins.get(nom)?.delete(cle); }),
    });
    const base = {
        objectStoreNames: { contains: (n: string) => magasins.has(n) },
        createObjectStore: (n: string) => { magasins.set(n, new Map()); return magasin(n); },
        transaction: (nom: string) => ({ objectStore: () => magasin(nom) }),
    };
    window.indexedDB = {
        open: () => {
            const r: any = { onsuccess: null, onerror: null, onupgradeneeded: null, result: base, error: null };
            queueMicrotask(() => { r.onupgradeneeded?.(); r.onsuccess?.(); });
            return r;
        },
    };
}

const souffler = () => new Promise(r => setTimeout(r, 0));
/** Laisser passer la fenêtre de groupement de 60 ms, pour qu'un lot ne déborde pas sur le suivant. */
const calme = () => new Promise(r => setTimeout(r, 120));
async function attendre(condition: () => boolean, tours = 300): Promise<void> {
    for (let i = 0; i < tours; i++) { if (condition()) return; await souffler(); }
    throw new Error('condition jamais atteinte');
}

describe('la couture est présente dans le fichier', () => {
    /**
     * Trois points, et ils ne se devinent pas à la lecture du bloc publié :
     * sans eux la couture existe et ne dit jamais rien.
     */
    it('setByPath signale le changement, openCharacter annonce l’ouverture', () => {
        expect(source).toContain('obj[path]=val;if(activeCharacter&&obj===activeCharacter.data)markChange(path);');
        expect(source).toContain('buildPages();announceOpen();');
        expect(source).toContain('window.RPGSheet=');
    });
});

describe('le moteur réel, chargé et piloté', () => {
    let dom: JSDOM;
    let win: any;

    beforeAll(async () => {
        const virtualConsole = new VirtualConsole(); // le moteur alerte si IndexedDB manque ; ici il ne manque pas
        dom = new JSDOM(pageDeControle(), {
            runScripts: 'dangerously',
            virtualConsole,
            beforeParse(window) {
                poserIndexedDB(window);
                const css = (window as any).CSS;
                if (!css?.escape) {
                    (window as any).CSS = { ...css, escape: (s: string) => String(s).replace(/[^\w-]/g, c => '\\' + c) };
                }
            },
        });
        win = dom.window;
        await attendre(() => !!win.RPGSheet && !!win.document.querySelector('[data-new]'));

        // Créer un personnage par le chemin normal de l'application, pas par un raccourci.
        win.document.querySelector('[data-new]').click();
        await souffler();
        win.document.querySelector('#newCharacterName').value = 'Rick';
        win.document.querySelector('#createCharacterBtn').click();
        await attendre(() => !!win.RPGSheet.getData());
    }, 30_000);

    const champ = (cle: string) => win.document.querySelector('.sheet [data-key="' + cle + '"]');

    it('publie les quatre fonctions', () => {
        for (const nom of ['getData', 'setData', 'getTemplate', 'onChange']) {
            expect(typeof win.RPGSheet[nom], nom).toBe('function');
        }
    });

    it('getData rend le personnage ouvert, et une copie', () => {
        const vu = win.RPGSheet.getData();
        expect(vu.name).toBe('Rick');
        expect(vu.templateId).toBe('gabarit-de-controle');
        expect(vu.data).toEqual({});

        vu.data.nom = 'écriture sauvage';
        expect(win.RPGSheet.getData().data.nom).toBeUndefined();
    });

    it('getTemplate expose les clés — de quoi garder une table de correspondance vraie', () => {
        const cles = win.RPGSheet.getTemplate().fields.map((f: any) => f.key);
        expect(cles).toContain('vigueur');
        expect(cles).toContain('sante');
        expect(win.RPGSheet.getTemplate().id).toBe('gabarit-de-controle');
    });

    /**
     * Le défaut le plus cher de ce projet : la donnée est juste et l'écran ment.
     * Écrire sans redessiner aurait passé un test qui ne regarde que `getData`.
     */
    it('setData écrit la donnée ET redessine l’écran', () => {
        win.RPGSheet.setData({ nom: 'Rick Deckard', blesse: true, nature: 'Réplicant', sante: 2 });

        expect(win.RPGSheet.getData().data.nom).toBe('Rick Deckard');
        expect(champ('nom').value).toBe('Rick Deckard');
        expect(champ('blesse').checked).toBe(true);
        expect(champ('nature').value).toBe('Réplicant');

        const pastilles = [...win.document.querySelectorAll('.hotspot[data-key="sante"]')];
        expect(pastilles.map((p: any) => p.classList.contains('active'))).toEqual([true, true, false]);
        expect(champ('santeMoitie').value).toBe('1');
    });

    it('la saisie de la fiche remonte à l’hôte', async () => {
        const vus: any[] = [];
        const desabonner = win.RPGSheet.onChange((ev: any) => vus.push(ev));

        champ('vigueur').value = 'C (D8)';
        champ('vigueur').dispatchEvent(new win.Event('input'));
        await attendre(() => vus.length > 0);

        expect(vus[0].origin).toBe('sheet');
        expect(vus[0].keys).toEqual(['vigueur']);
        expect(vus[0].character.data.vigueur).toBe('C (D8)');

        desabonner();
        champ('vigueur').value = 'B (D10)';
        champ('vigueur').dispatchEvent(new win.Event('input'));
        await attendre(() => win.RPGSheet.getData().data.vigueur === 'B (D10)');
        expect(vus).toHaveLength(1);
    });

    /** Un lot ne porte qu'une origine : sinon l'hôte réapplique ce qu'il vient d'écrire. */
    it('l’écriture de l’hôte se distingue de la saisie', async () => {
        await calme();
        const vus: any[] = [];
        const desabonner = win.RPGSheet.onChange((ev: any) => vus.push(ev));
        win.RPGSheet.setData({ nom: 'Roy Batty' });
        await souffler();
        desabonner();
        expect(vus.map(v => v.origin)).toEqual(['host']);
        expect(vus[0].keys).toEqual(['nom']);
    });

    it('le pont postMessage sert le même contrat', async () => {
        await calme();
        const recus: any[] = [];
        const hote = { postMessage: (msg: any) => recus.push(msg) };
        const envoyer = (data: unknown) => {
            const ev: any = new win.Event('message');
            ev.data = data; ev.origin = 'null'; ev.source = hote;
            win.dispatchEvent(ev);
        };
        // Une écriture diffuse son `change` avant de répondre : on cherche par identifiant, pas par rang.
        const reponse = (id: number) => recus.find(m => m.type === 'reply' && m.id === id);

        envoyer({ channel: 'rpg-sheet', type: 'hello', id: 1 });
        expect(reponse(1)).toMatchObject({ channel: 'rpg-sheet', type: 'reply', ok: true });
        expect(reponse(1).result.ready).toBe(true);

        envoyer({ channel: 'rpg-sheet', type: 'set', id: 2, data: { nom: 'Gaff' } });
        expect(reponse(2).ok).toBe(true);
        expect(champ('nom').value).toBe('Gaff');

        // Le changement part vers l'hôte sans qu'il l'ait demandé.
        await attendre(() => recus.some(m => m.type === 'change'));
        expect(recus.find(m => m.type === 'change')).toMatchObject({ origin: 'host', keys: ['nom'] });

        envoyer({ channel: 'rpg-sheet', type: 'inconnu', id: 3 });
        expect(reponse(3)).toMatchObject({ ok: false });

        const avant = recus.length;
        envoyer({ channel: 'autre-chose', type: 'get', id: 4 });
        expect(recus).toHaveLength(avant);
    });

    /** L'écriture de l'hôte doit survivre à la fermeture : elle passe par scheduleSave. */
    it('ce que l’hôte écrit est persisté', async () => {
        const id = win.RPGSheet.getData().id;
        await attendre(() => win.document.querySelector('#status').textContent === 'Sauvegardé');

        win.document.querySelector('[data-char="' + id + '"]').click();
        await attendre(() => win.RPGSheet.getData()?.data.nom === 'Gaff');
        expect(win.RPGSheet.getData().data.sante).toBe(2);
    });
});
