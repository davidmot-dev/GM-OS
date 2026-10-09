import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM, VirtualConsole, type DOMWindow } from 'jsdom';
import type {
    ChangementDeFiche, GabaritDeFiche, InstantaneDeFiche, PontDeLaFiche,
} from '../src/modules/fiches/contratsDeLaFiche';

/** Surface du moteur HTML réellement chargé, sans importer son implémentation. */
interface CoutureDeFiche {
    version: number;
    getData: () => InstantaneDeFiche | null;
    setData: (patch: Record<string, unknown>) => InstantaneDeFiche | null;
    getTemplate: () => GabaritDeFiche | null;
    onChange: (fn: (ev: ChangementDeFiche) => void) => () => void;
    list: PontDeLaFiche['bibliotheque'];
    openCharacter: PontDeLaFiche['ouvrirPersonnage'];
    create: PontDeLaFiche['creer'];
    backup: () => Promise<SauvegardeDuMoteur>;
    restore: PontDeLaFiche['restaurer'];
}

/** La sauvegarde est inspectée dans ces essais, contrairement au pont applicatif. */
interface SauvegardeDuMoteur {
    format: 'character-sheet-manager-backup';
    version: number;
    createdAt: string;
    templates: unknown[];
    characters: (InstantaneDeFiche & { createdAt: number })[];
}

type FenetreDeFiche = DOMWindow & { RPGSheet: CoutureDeFiche };

function fenetreAvecCouture(window: DOMWindow): FenetreDeFiche {
    const couture: unknown = window.RPGSheet;
    if (!couture || typeof couture !== 'object') throw new Error('Couture absente du moteur HTML.');
    // Frontière avec le script HTML : les assertions ci-dessous éprouvent ce contrat.
    return window as FenetreDeFiche;
}

function elementRequis<E extends Element = HTMLElement>(window: DOMWindow, selecteur: string): E {
    const element = window.document.querySelector<E>(selecteur);
    if (!element) throw new Error('Élément absent : ' + selecteur);
    return element;
}

function poserCss(window: DOMWindow, escape: (texte: string) => string = String): void {
    const css = window.CSS as { escape?: (texte: string) => string } | undefined;
    if (!css?.escape) Object.defineProperty(window, 'CSS', { configurable: true, value: { ...css, escape } });
}

type ReponseDuMoteur = { channel: 'rpg-sheet'; type: 'reply'; id: number; ok: boolean; result: unknown };
type MessageDuMoteur = ReponseDuMoteur | (ChangementDeFiche & { channel: 'rpg-sheet'; type: 'change' | 'open' });

function chercherReponse(messages: MessageDuMoteur[], id: number): ReponseDuMoteur | undefined {
    return messages.find((m): m is ReponseDuMoteur => m.type === 'reply' && m.id === id);
}

function reponseRequise(messages: MessageDuMoteur[], id: number): ReponseDuMoteur {
    const reponse = chercherReponse(messages, id);
    if (!reponse) throw new Error('Réponse absente : ' + id);
    return reponse;
}

/** Une réponse garde son résultat inconnu ; lire seulement ce que ce scénario attend. */
function personnageDeLaReponse(resultat: unknown, nom: string): { id: string } {
    if (!resultat || typeof resultat !== 'object' || !('characters' in resultat) || !Array.isArray(resultat.characters)) {
        throw new Error('La réponse doit contenir une liste de personnages.');
    }
    const personnages: unknown[] = resultat.characters;
    for (const personnage of personnages) {
        if (personnage && typeof personnage === 'object' && 'name' in personnage && personnage.name === nom
            && 'id' in personnage && typeof personnage.id === 'string') return { id: personnage.id };
    }
    throw new Error('Personnage absent de la réponse : ' + nom);
}

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
            // Un dé de ressource : des valeurs TEXTE, une seule case allumée (Cthulhu Hack, 2026-10-03).
            { key: 'de', label: 'Dé : d8', type: 'hotspot', value: '8', x: 10, y: 210, w: 20, h: 20 },
            { key: 'de', label: 'Dé : d6', type: 'hotspot', value: '6', x: 34, y: 210, w: 20, h: 20 },
            { key: 'de', label: 'Dé : d4', type: 'hotspot', value: '4', x: 58, y: 210, w: 20, h: 20 },
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
interface RequeteEnMemoire<T> {
    onsuccess: (() => void) | null;
    onerror: (() => void) | null;
    result: T | undefined;
    error: unknown;
}

function poserIndexedDB(window: DOMWindow): void {
    const magasins = new Map<string, Map<unknown, unknown>>();
    const requete = <T,>(calcul: () => T): RequeteEnMemoire<T> => {
        const r: RequeteEnMemoire<T> = { onsuccess: null, onerror: null, result: undefined, error: null };
        queueMicrotask(() => {
            try { r.result = calcul(); r.onsuccess?.(); } catch (e) { r.error = e; r.onerror?.(); }
        });
        return r;
    };
    const magasin = (nom: string) => ({
        getAll: () => requete(() => [...(magasins.get(nom)?.values() ?? [])]),
        get: (cle: unknown) => requete(() => magasins.get(nom)?.get(cle)),
        put: (obj: { id?: unknown; key?: unknown }) => requete(() => { magasins.get(nom)!.set(obj.id ?? obj.key, obj); return obj; }),
        delete: (cle: unknown) => requete(() => { magasins.get(nom)?.delete(cle); }),
    });
    const base = {
        objectStoreNames: { contains: (n: string) => magasins.has(n) },
        createObjectStore: (n: string) => { magasins.set(n, new Map()); return magasin(n); },
        transaction: (nom: string) => ({ objectStore: () => magasin(nom) }),
    };
    const indexedDBEnMemoire = {
        open: () => {
            const r: RequeteEnMemoire<typeof base> & { onupgradeneeded: (() => void) | null } = {
                onsuccess: null, onerror: null, onupgradeneeded: null, result: base, error: null,
            };
            queueMicrotask(() => { r.onupgradeneeded?.(); r.onsuccess?.(); });
            return r;
        },
    };
    // Surface volontairement partielle, installée sans la prétendre IDBFactory complète.
    Object.defineProperty(window, 'indexedDB', { configurable: true, value: indexedDBEnMemoire });
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
                poserCss(window);
            },
        });
        const win = fenetreAvecCouture(dom.window);

        // Le tout premier instant : la couture est publiée, la base ne l'est pas.
        expect(typeof win.RPGSheet?.list, 'la couture est là avant la base').toBe('function');
        expect(win.RPGSheet.getData(), 'aucun personnage ouvert').toBeNull();

        // C'est CET appel qui levait « ... reading 'transaction' ».
        const bibliotheque = await win.RPGSheet.list();
        expect(bibliotheque.templates.map(t => t.id)).toEqual(['gabarit-de-controle']);
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
                poserCss(window);
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
        const win = ouvrir('https://fiche.test/?vue=epuree');
        const cache = (sel: string) => {
            const el = elementRequis(win, sel);
            return win.getComputedStyle(el).display === 'none';
        };

        expect(cache('.sidebar'), 'la barre latérale').toBe(true);
        for (const sel of ['#zonesBtn', '#exportCharBtn', '#printBtn', '.filebtn']) {
            expect(cache(sel), sel).toBe(true);
        }
    });

    /** Ce qui sert à LIRE sa fiche reste : pages, zoom, ajustement. */
    it('garde de quoi lire la fiche', () => {
        const win = ouvrir('https://fiche.test/?vue=epuree');
        for (const sel of ['#zoomIn', '#zoomOut', '#fitBtn', '#viewer', '#pagesHost']) {
            const el = elementRequis(win, sel);
            expect(win.getComputedStyle(el).display, sel).not.toBe('none');
        }
    });

    it('l’écran du meneur garde tout', () => {
        const win = ouvrir('https://fiche.test/');
        for (const sel of ['.sidebar', '#zonesBtn', '#exportCharBtn', '#printBtn', '.filebtn']) {
            const el = elementRequis(win, sel);
            expect(win.getComputedStyle(el).display, sel).not.toBe('none');
        }
    });
});

describe('le moteur réel, chargé et piloté', () => {
    let dom: JSDOM;
    let win: FenetreDeFiche;

    beforeAll(async () => {
        const virtualConsole = new VirtualConsole(); // le moteur alerte si IndexedDB manque ; ici il ne manque pas
        dom = new JSDOM(pageDeControle(), {
            runScripts: 'dangerously',
            virtualConsole,
            beforeParse(window) {
                poserIndexedDB(window);
                poserCss(window, s => String(s).replace(/[^\w-]/g, c => '\\' + c));
            },
        });
        win = fenetreAvecCouture(dom.window);
        await attendre(() => !!win.RPGSheet && !!win.document.querySelector('[data-new]'));

        // Créer un personnage par le chemin normal de l'application, pas par un raccourci.
        elementRequis(win, '[data-new]').click();
        await souffler();
        elementRequis<HTMLInputElement>(win, '#newCharacterName').value = 'Rick';
        elementRequis(win, '#createCharacterBtn').click();
        await attendre(() => !!win.RPGSheet.getData());
    }, 30_000);

    const champ = <E extends HTMLInputElement | HTMLSelectElement = HTMLInputElement>(cle: string) =>
        elementRequis<E>(win, '.sheet [data-key="' + cle + '"]');

    const personnageOuvert = () => {
        const personnage = win.RPGSheet.getData();
        if (!personnage) throw new Error('Aucun personnage ouvert dans cet essai.');
        return personnage;
    };

    const gabaritOuvert = () => {
        const gabarit = win.RPGSheet.getTemplate();
        if (!gabarit) throw new Error('Aucun gabarit ouvert dans cet essai.');
        return gabarit;
    };

    it('publie les neuf fonctions', () => {
        const lecture = ['getData', 'setData', 'getTemplate', 'onChange'] as const;
        const bibliotheque = ['list', 'openCharacter', 'create', 'backup', 'restore'] as const;
        for (const nom of [...lecture, ...bibliotheque]) {
            expect(typeof win.RPGSheet[nom], nom).toBe('function');
        }
        expect(win.RPGSheet.version).toBe(2);
    });

    it('getData rend le personnage ouvert, et une copie', () => {
        const vu = personnageOuvert();
        expect(vu.name).toBe('Rick');
        expect(vu.templateId).toBe('gabarit-de-controle');
        expect(vu.data).toEqual({});

        vu.data.nom = 'écriture sauvage';
        expect(personnageOuvert().data.nom).toBeUndefined();
    });

    it('getTemplate expose les clés — de quoi garder une table de correspondance vraie', () => {
        const cles = gabaritOuvert().fields.map(f => f.key);
        expect(cles).toContain('vigueur');
        expect(cles).toContain('sante');
        expect(gabaritOuvert().id).toBe('gabarit-de-controle');
    });

    /**
     * Le défaut le plus cher de ce projet : la donnée est juste et l'écran ment.
     * Écrire sans redessiner aurait passé un test qui ne regarde que `getData`.
     */
    it('setData écrit la donnée ET redessine l’écran', () => {
        win.RPGSheet.setData({ nom: 'Rick Deckard', blesse: true, nature: 'Réplicant', sante: 2 });

        expect(personnageOuvert().data.nom).toBe('Rick Deckard');
        expect(champ('nom').value).toBe('Rick Deckard');
        expect(champ('blesse').checked).toBe(true);
        expect(champ<HTMLSelectElement>('nature').value).toBe('Réplicant');

        const pastilles = [...win.document.querySelectorAll('.hotspot[data-key="sante"]')];
        expect(pastilles.map(p => p.classList.contains('active'))).toEqual([true, true, false]);
        expect(champ('santeMoitie').value).toBe('1');
    });

    /**
     * **Un dé de ressource n'est pas une jauge** — David, 2026-10-03 : la Torche
     * de Dan allumait d6 ET d4. Une case à valeur texte ne s'allume que si elle
     * est égale — même quand la valeur a été rangée en NOMBRE par l'ancien
     * gabarit, ce qui est le cas des fiches déjà remplies.
     */
    it('un dé à cases texte n’allume qu’une case, même rangé en nombre', () => {
        const allumees = () => [...win.document.querySelectorAll('.hotspot[data-key="de"]')]
            .map(p => p.classList.contains('active'));
        win.RPGSheet.setData({ de: 6 });
        expect(allumees()).toEqual([false, true, false]);
        win.RPGSheet.setData({ de: '8' });
        expect(allumees()).toEqual([true, false, false]);
    });

    it('la saisie de la fiche remonte à l’hôte', async () => {
        const vus: ChangementDeFiche[] = [];
        const desabonner = win.RPGSheet.onChange(ev => vus.push(ev));

        champ('vigueur').value = 'C (D8)';
        champ('vigueur').dispatchEvent(new win.Event('input'));
        await attendre(() => vus.length > 0);

        expect(vus[0].origin).toBe('sheet');
        expect(vus[0].keys).toEqual(['vigueur']);
        expect(vus[0].character?.data.vigueur).toBe('C (D8)');

        desabonner();
        champ('vigueur').value = 'B (D10)';
        champ('vigueur').dispatchEvent(new win.Event('input'));
        await attendre(() => win.RPGSheet.getData()?.data.vigueur === 'B (D10)');
        expect(vus).toHaveLength(1);
    });

    /** Un lot ne porte qu'une origine : sinon l'hôte réapplique ce qu'il vient d'écrire. */
    it('l’écriture de l’hôte se distingue de la saisie', async () => {
        await calme();
        const vus: ChangementDeFiche[] = [];
        const desabonner = win.RPGSheet.onChange(ev => vus.push(ev));
        win.RPGSheet.setData({ nom: 'Roy Batty' });
        await souffler();
        desabonner();
        expect(vus.map(v => v.origin)).toEqual(['host']);
        expect(vus[0].keys).toEqual(['nom']);
    });

    it('le pont postMessage sert le même contrat', async () => {
        await calme();
        const recus: MessageDuMoteur[] = [];
        const hote = { postMessage: (msg: MessageDuMoteur) => recus.push(msg) };
        const envoyer = (data: unknown) => {
            const ev = Object.assign(new win.Event('message'), { data, origin: 'null', source: hote });
            win.dispatchEvent(ev);
        };
        // Une écriture diffuse son `change` avant de répondre : on cherche par identifiant, pas par rang.
        const reponse = (id: number) => reponseRequise(recus, id);

        envoyer({ channel: 'rpg-sheet', type: 'hello', id: 1 });
        expect(reponse(1)).toMatchObject({ channel: 'rpg-sheet', type: 'reply', ok: true });
        expect(reponse(1)).toMatchObject({ result: { ready: true } });

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
        const id = personnageOuvert().id;
        await attendre(() => elementRequis(win, '#status').textContent === 'Sauvegardé');

        elementRequis(win, '[data-char="' + id + '"]').click();
        await attendre(() => win.RPGSheet.getData()?.data.nom === 'Gaff');
        expect(personnageOuvert().data.sante).toBe(2);
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
            expect(characters.some(c => c.name === 'Rick')).toBe(true);
            // Un aperçu, pas la fiche : les données ne voyagent pas dans une liste.
            expect(characters[0]).not.toHaveProperty('data');
            expect(characters[0]).toMatchObject({ templateId: 'gabarit-de-controle' });
        });

        it('create crée, ouvre, et accepte des données de départ', async () => {
            const cree = await win.RPGSheet.create('Roy Batty', 'gabarit-de-controle', { nom: 'Roy Batty', sante: 3 });

            expect(cree.name).toBe('Roy Batty');
            expect(personnageOuvert().id).toBe(cree.id);
            // Ouvert veut dire dessiné, pas seulement chargé.
            expect(champ('nom').value).toBe('Roy Batty');
            expect(champ('santeMoitie').value).toBe('1');
        });

        it('openCharacter rouvre un autre personnage et le redessine', async () => {
            const { characters } = await win.RPGSheet.list();
            const rick = characters.find(c => c.name === 'Rick');
            if (!rick) throw new Error('Rick absent de la bibliothèque.');

            const vu = await win.RPGSheet.openCharacter(rick.id);
            expect(vu.id).toBe(rick.id);
            expect(champ('nom').value).toBe('Gaff'); // le nom du champ, pas celui du personnage
            expect(personnageOuvert().data.sante).toBe(2);
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
            expect(sauvegarde.characters.some(c => c.name === 'Roy Batty')).toBe(true);
            // Les gabarits intégrés reviennent avec le fichier : les emporter serait du poids mort.
            expect(sauvegarde.templates).toEqual([]);

            sauvegarde.characters[0].name = 'écriture sauvage';
            expect((await win.RPGSheet.backup()).characters.some(c => c.name === 'écriture sauvage')).toBe(false);
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
            const noms = avant.characters.map(c => c.name);

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
            expect(apres.characters.map(c => c.name)).toContain('Zhora');
            for (const nom of noms) {
                expect(apres.characters.map(c => c.name), nom).toContain(nom);
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
        let recus: MessageDuMoteur[];
        let envoyer: (data: unknown) => void;
        const reponse = (id: number) => reponseRequise(recus, id);
        const aRepondu = (id: number) => !!chercherReponse(recus, id);

        beforeAll(async () => {
            await calme();
            recus = [];
            const hote = { postMessage: (msg: MessageDuMoteur) => recus.push(msg) };
            envoyer = (data: unknown) => {
                const ev = Object.assign(new win.Event('message'), { data, origin: 'null', source: hote });
                win.dispatchEvent(ev);
            };
        });

        it('hello annonce la version 2', async () => {
            envoyer({ channel: 'rpg-sheet', type: 'hello', id: 10 });
            expect(reponse(10)).toMatchObject({ result: { version: 2 } });
        });

        it('sert list, openCharacter, create et backup', async () => {
            envoyer({ channel: 'rpg-sheet', type: 'list', id: 11 });
            await attendre(() => aRepondu(11));
            const rick = personnageDeLaReponse(reponse(11).result, 'Rick');

            envoyer({ channel: 'rpg-sheet', type: 'create', id: 12, name: 'Gaff II', templateId: 'gabarit-de-controle', data: { nom: 'Gaff II' } });
            await attendre(() => aRepondu(12));
            expect(reponse(12).ok).toBe(true);
            expect(champ('nom').value).toBe('Gaff II');

            envoyer({ channel: 'rpg-sheet', type: 'openCharacter', id: 13, characterId: rick.id });
            await attendre(() => aRepondu(13));
            expect(reponse(13)).toMatchObject({ result: { id: rick.id } });

            envoyer({ channel: 'rpg-sheet', type: 'backup', id: 14 });
            await attendre(() => aRepondu(14));
            expect(reponse(14)).toMatchObject({ result: { format: 'character-sheet-manager-backup' } });
        });

        /** Un échec devient une réponse, jamais un rejet perdu : l'hôte attend toujours. */
        it('un échec revient en réponse ok:false', async () => {
            envoyer({ channel: 'rpg-sheet', type: 'openCharacter', id: 15, characterId: 'personne' });
            await attendre(() => aRepondu(15));
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
