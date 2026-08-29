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

/**
 * **Le défaut vu en réel le 2026-08-28, à la première ouverture sur tablette.**
 *
 * `db` est affecté à la fin d'une chaîne asynchrone ; l'hôte, lui, parle dès que
 * l'iframe a fini de charger. Il arrivait **avant**, et tout ce qui touche au
 * stockage passait par `tx()` sur un `db` encore `undefined` — *« Cannot read
 * properties of undefined (reading 'transaction') »*.
 *
 * `hello` annonçait pourtant `ready: false`. Personne ne le lisait. *Un contrat
 * qu'il faut se rappeler de respecter finit par ne pas l'être* — d'où l'attente
 * côté moteur, qui vaut pour tous les appelants d'un coup.
 */
describe('l’hôte qui parle avant que la base soit ouverte', () => {
    it('attend le stockage au lieu de casser', async () => {
        const virtualConsole = new VirtualConsole();
        const dom = new JSDOM(pageDeControle(), {
            runScripts: 'dangerously', virtualConsole,
            beforeParse(window) {
                poserIndexedDB(window);
                const css = (window as any).CSS;
                if (!css?.escape) (window as any).CSS = { ...css, escape: (s: string) => String(s) };
            },
        });
        const win: any = dom.window;

        // Le tout premier instant : la couture est publiée, la base ne l'est pas.
        expect(typeof win.RPGSheet?.list, 'la couture est là avant la base').toBe('function');
        expect(win.RPGSheet.getData(), 'aucun personnage ouvert').toBeNull();

        // C'est CET appel qui levait « ... reading 'transaction' ».
        const bibliotheque = await win.RPGSheet.list();
        expect(bibliotheque.templates.map((t: any) => t.id)).toEqual(['gabarit-de-controle']);
        expect(bibliotheque.characters).toEqual([]);

        // Et créer juste après doit marcher, sans attente de l'appelant.
        const cree = await win.RPGSheet.create('Pris', 'gabarit-de-controle', { nom: 'Pris' });
        expect(cree.name).toBe('Pris');
        dom.window.close();
    }, 30_000);
});

/**
 * **La vue épurée — la fiche sur la tablette d'un joueur.**
 *
 * Il ne gère pas une bibliothèque, il regarde sa fiche : la barre latérale et les
 * boutons Zones / Exporter / Importer / Imprimer n'ont rien à faire là, et *un
 * bouton qu'on ne doit pas toucher finit par être touché.* L'écran du meneur
 * garde tout — c'est lui qui gère la bibliothèque.
 *
 * Ce test existe parce que le GPT régénère ce fichier : la règle CSS et le petit
 * script du `<head>` sont exactement le genre de chose qu'une régénération
 * emporte sans le dire.
 */
describe('la vue épurée', () => {
    const ouvrir = (url: string) => {
        const dom = new JSDOM(pageDeControle(), {
            url, runScripts: 'dangerously', virtualConsole: new VirtualConsole(),
            beforeParse(window) {
                poserIndexedDB(window);
                const css = (window as any).CSS;
                if (!css?.escape) (window as any).CSS = { ...css, escape: (s: string) => String(s) };
            },
        });
        return dom.window;
    };

    it('se déclenche sur ?vue=epuree, et jamais sans', () => {
        expect(ouvrir('https://fiche.test/?vue=epuree').document.documentElement.dataset.vue).toBe('epuree');
        expect(ouvrir('https://fiche.test/').document.documentElement.dataset.vue).toBeUndefined();
        expect(ouvrir('https://fiche.test/?vue=autre').document.documentElement.dataset.vue).toBeUndefined();
    });

    it('cache la barre latérale et les quatre boutons', () => {
        const win: any = ouvrir('https://fiche.test/?vue=epuree');
        const cache = (sel: string) => {
            const el = win.document.querySelector(sel);
            expect(el, sel).not.toBeNull();
            return win.getComputedStyle(el).display === 'none';
        };

        expect(cache('.sidebar'), 'la barre latérale').toBe(true);
        for (const sel of ['#zonesBtn', '#exportCharBtn', '#printBtn', '.filebtn']) {
            expect(cache(sel), sel).toBe(true);
        }
    });

    /** Ce qui sert à LIRE sa fiche reste : pages, zoom, ajustement. */
    it('garde de quoi lire la fiche', () => {
        const win: any = ouvrir('https://fiche.test/?vue=epuree');
        for (const sel of ['#zoomIn', '#zoomOut', '#fitBtn', '#viewer', '#pagesHost']) {
            const el = win.document.querySelector(sel);
            expect(win.getComputedStyle(el).display, sel).not.toBe('none');
        }
    });

    it('l’écran du meneur garde tout', () => {
        const win: any = ouvrir('https://fiche.test/');
        for (const sel of ['.sidebar', '#zonesBtn', '#exportCharBtn', '#printBtn', '.filebtn']) {
            const el = win.document.querySelector(sel);
            expect(win.getComputedStyle(el).display, sel).not.toBe('none');
        }
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

    it('publie les huit fonctions', () => {
        const lecture = ['getData', 'setData', 'getTemplate', 'onChange'];
        const bibliotheque = ['list', 'openCharacter', 'create', 'backup', 'restore'];
        for (const nom of [...lecture, ...bibliotheque]) {
            expect(typeof win.RPGSheet[nom], nom).toBe('function');
        }
        expect(win.RPGSheet.version).toBe(2);
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

    /**
     * **La bibliothèque, ouverte à l'hôte — v2.**
     *
     * La v1 savait lire et écrire *la fiche ouverte*, et rien d'autre : GM-OS ne
     * pouvait pas dire **quel** PJ ouvrir. C'était le premier geste de l'hôte,
     * pas l'iframe.
     */
    describe('la bibliothèque', () => {
        it('list rend les personnages et les gabarits', async () => {
            const { characters, templates } = await win.RPGSheet.list();

            expect(templates).toEqual([{ id: 'gabarit-de-controle', name: 'Gabarit de contrôle', system: 'Contrôle', builtin: true }]);
            expect(characters.some((c: any) => c.name === 'Rick')).toBe(true);
            // Un aperçu, pas la fiche : les données ne voyagent pas dans une liste.
            expect(characters[0]).not.toHaveProperty('data');
            expect(characters[0]).toMatchObject({ templateId: 'gabarit-de-controle' });
        });

        it('create crée, ouvre, et accepte des données de départ', async () => {
            const cree = await win.RPGSheet.create('Roy Batty', 'gabarit-de-controle', { nom: 'Roy Batty', sante: 3 });

            expect(cree.name).toBe('Roy Batty');
            expect(win.RPGSheet.getData().id).toBe(cree.id);
            // Ouvert veut dire dessiné, pas seulement chargé.
            expect(champ('nom').value).toBe('Roy Batty');
            expect(champ('santeMoitie').value).toBe('1');
        });

        it('openCharacter rouvre un autre personnage et le redessine', async () => {
            const { characters } = await win.RPGSheet.list();
            const rick = characters.find((c: any) => c.name === 'Rick');

            const vu = await win.RPGSheet.openCharacter(rick.id);
            expect(vu.id).toBe(rick.id);
            expect(champ('nom').value).toBe('Gaff'); // le nom du champ, pas celui du personnage
            expect(win.RPGSheet.getData().data.sante).toBe(2);
        });

        /**
         * Une `alert()` dans une iframe est un cul-de-sac pour l'hôte : il attend
         * une réponse, pas une boîte de dialogue que personne ne verra.
         */
        it('openCharacter lève sur un inconnu, au lieu d’alerter', async () => {
            await expect(win.RPGSheet.openCharacter('personne')).rejects.toThrow(/introuvable/);
            await expect(win.RPGSheet.create('X', 'gabarit-absent')).rejects.toThrow(/Modèle inconnu/);
        });

        /**
         * Le magasin qui détient la vérité ne peut pas être le seul que personne
         * ne sauvegarde — c'est le chantier n° 5, et voici sa matière.
         */
        it('backup rend exactement ce que restore sait relire', async () => {
            const sauvegarde = await win.RPGSheet.backup();

            expect(sauvegarde.format).toBe('character-sheet-manager-backup');
            expect(sauvegarde.characters.some((c: any) => c.name === 'Roy Batty')).toBe(true);
            // Les gabarits intégrés reviennent avec le fichier : les emporter serait du poids mort.
            expect(sauvegarde.templates).toEqual([]);

            sauvegarde.characters[0].name = 'écriture sauvage';
            expect((await win.RPGSheet.backup()).characters.some((c: any) => c.name === 'écriture sauvage')).toBe(false);
        });

        /**
         * **Le retour, sans lequel la sauvegarde ne vaut rien.**
         *
         * Elle **ajoute et remplace par identifiant, elle ne vide jamais** : ce
         * qui n'est pas dans la sauvegarde reste en place. *Une restauration qui
         * effacerait d'abord ferait perdre ce qu'on a créé depuis.*
         */
        it('restore reverse une sauvegarde sans rien effacer', async () => {
            const avant = await win.RPGSheet.backup();
            const noms = avant.characters.map((c: any) => c.name);

            const compte = await win.RPGSheet.restore({
                format: 'character-sheet-manager-backup', version: 1, templates: [],
                characters: [{
                    id: 'venu-de-la-sauvegarde', name: 'Zhora', templateId: 'gabarit-de-controle',
                    templateName: 'Gabarit de contrôle', system: 'Contrôle',
                    data: { nom: 'Zhora' }, createdAt: 1, updatedAt: 1,
                }],
            });
            expect(compte).toEqual({ templates: 0, characters: 1 });

            const apres = await win.RPGSheet.backup();
            expect(apres.characters.map((c: any) => c.name)).toContain('Zhora');
            for (const nom of noms) {
                expect(apres.characters.map((c: any) => c.name), nom).toContain(nom);
            }
        });

        it('restore refuse ce qui n’est pas une sauvegarde', async () => {
            await expect(win.RPGSheet.restore({ format: 'autre-chose' })).rejects.toThrow(/non reconnue/);
            await expect(win.RPGSheet.restore(null)).rejects.toThrow(/non reconnue/);
        });
    });

    /**
     * Le chemin qui comptera vraiment : l'hôte sera une iframe sur une autre
     * origine, et `window.RPGSheet` ne traverse pas une origine.
     */
    describe('la bibliothèque par postMessage', () => {
        let recus: any[];
        let envoyer: (data: unknown) => void;
        const reponse = (id: number) => recus.find(m => m.type === 'reply' && m.id === id);

        beforeAll(async () => {
            await calme();
            recus = [];
            const hote = { postMessage: (msg: any) => recus.push(msg) };
            envoyer = (data: unknown) => {
                const ev: any = new win.Event('message');
                ev.data = data; ev.origin = 'null'; ev.source = hote;
                win.dispatchEvent(ev);
            };
        });

        it('hello annonce la version 2', async () => {
            envoyer({ channel: 'rpg-sheet', type: 'hello', id: 10 });
            expect(reponse(10).result.version).toBe(2);
        });

        it('sert list, openCharacter, create et backup', async () => {
            envoyer({ channel: 'rpg-sheet', type: 'list', id: 11 });
            await attendre(() => !!reponse(11));
            const rick = reponse(11).result.characters.find((c: any) => c.name === 'Rick');

            envoyer({ channel: 'rpg-sheet', type: 'create', id: 12, name: 'Gaff II', templateId: 'gabarit-de-controle', data: { nom: 'Gaff II' } });
            await attendre(() => !!reponse(12));
            expect(reponse(12).ok).toBe(true);
            expect(champ('nom').value).toBe('Gaff II');

            envoyer({ channel: 'rpg-sheet', type: 'openCharacter', id: 13, characterId: rick.id });
            await attendre(() => !!reponse(13));
            expect(reponse(13).result.id).toBe(rick.id);

            envoyer({ channel: 'rpg-sheet', type: 'backup', id: 14 });
            await attendre(() => !!reponse(14));
            expect(reponse(14).result.format).toBe('character-sheet-manager-backup');
        });

        /** Un échec devient une réponse, jamais un rejet perdu : l'hôte attend toujours. */
        it('un échec revient en réponse ok:false', async () => {
            envoyer({ channel: 'rpg-sheet', type: 'openCharacter', id: 15, characterId: 'personne' });
            await attendre(() => !!reponse(15));
            expect(reponse(15)).toMatchObject({ ok: false });
            expect(String(reponse(15).result)).toMatch(/introuvable/);
        });

        /**
         * **Le piège du nom.** `open` est déjà une DIFFUSION du moteur vers
         * l'hôte, et le garde-fou du gestionnaire jette les messages qui le
         * portent. Un verbe nommé `open` serait ignoré **en silence** — pas
         * refusé : ignoré, sans réponse, l'hôte attendant pour toujours.
         */
        it('« open » reste une diffusion et n’est jamais un verbe', async () => {
            const avant = recus.length;
            envoyer({ channel: 'rpg-sheet', type: 'open', id: 16, characterId: 'peu importe' });
            await souffler();
            expect(recus).toHaveLength(avant);
        });
    });
});
