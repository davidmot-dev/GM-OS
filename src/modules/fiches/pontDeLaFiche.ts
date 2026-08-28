/**
 * **Le pont vers la fiche — le côté GM-OS de la couture.**
 *
 * Le moteur publie son contrat par deux chemins : `window.RPGSheet` quand l'hôte
 * est de même origine, et `postMessage` sinon. **Ici c'est toujours `postMessage`**,
 * parce que l'iframe sera servie par `gmos://media/docs/fiches/…` et que
 * `window.*` ne traverse pas une origine.
 *
 * Ce module ne connaît ni React ni le store : il traduit un contrat par messages
 * en promesses, et rien d'autre. C'est ce qui permet de l'éprouver contre un
 * faux moteur en trois lignes, et contre le vrai depuis `electron/`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TROIS CHOSES QU'UN PONT PAR MESSAGES DOIT FAIRE, ET QU'ON OUBLIE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 1. **Vérifier l'émetteur, pas seulement le canal.** N'importe quelle fenêtre
 *    peut poster un message portant `channel: "rpg-sheet"`. On exige
 *    `event.source === la fenêtre de l'iframe` : c'est la seule preuve qu'on ne
 *    peut pas contrefaire depuis une autre page.
 * 2. **Rendre la main quand personne ne répond.** Une fiche qui n'a pas fini de
 *    charger, un moteur régénéré sans sa couture — sans délai, l'hôte attend
 *    pour toujours et l'écran reste figé sans un mot.
 * 3. **Corréler par identifiant, jamais par rang.** Le moteur diffuse un
 *    `change` *avant* de répondre à un `set` : lire « la réponse suivante »
 *    marcherait jusqu'au jour où deux appels se croisent.
 */

/** Le canal, tel que le moteur le déclare. Une seule écriture de la constante. */
export const CANAL = 'rpg-sheet';

/** Ce que le moteur rend pour un personnage ouvert. */
export interface InstantaneDeFiche {
    id: string;
    name: string;
    templateId: string;
    templateName: string;
    system: string;
    updatedAt: number | null;
    data: Record<string, unknown>;
}

/** Un champ du gabarit, tel que `template` le rend. */
export interface ChampDuGabaritDeFiche {
    key: string;
    label: string;
    type: string;
    page: number;
}

export interface GabaritDeFiche {
    id: string;
    name: string;
    system: string;
    fields: ChampDuGabaritDeFiche[];
}

/** L'aperçu d'un personnage dans la bibliothèque — sans ses données. */
export interface ApercuDeFiche {
    id: string;
    name: string;
    templateId: string;
    templateName: string;
    system: string;
    updatedAt: number | null;
}

export interface BibliothequeDeFiches {
    characters: ApercuDeFiche[];
    templates: { id: string; name: string; system: string; builtin: boolean }[];
}

/** Ce que le moteur diffuse de lui-même : une saisie, ou un changement de PJ. */
export interface ChangementDeFiche {
    origin: 'sheet' | 'host' | 'open';
    keys: string[];
    character: InstantaneDeFiche | null;
    /** Présent seulement sur une diffusion `open`. */
    template?: GabaritDeFiche | null;
}

export interface PontDeLaFiche {
    /** Le moteur est-il là, et que porte-t-il ? Le premier appel de l'hôte. */
    bonjour(): Promise<{ version: number; ready: boolean; character: InstantaneDeFiche | null; template: GabaritDeFiche | null }>;
    lire(): Promise<InstantaneDeFiche | null>;
    gabarit(): Promise<GabaritDeFiche | null>;
    ecrire(lot: Record<string, unknown>): Promise<InstantaneDeFiche | null>;
    bibliotheque(): Promise<BibliothequeDeFiches>;
    /** `openCharacter` et non `open` : côté moteur, `open` est une diffusion. */
    ouvrirPersonnage(characterId: string): Promise<InstantaneDeFiche>;
    creer(name: string, templateId: string, data?: Record<string, unknown>): Promise<InstantaneDeFiche>;
    /** Le contenu que `restore()` sait relire — la matière du chantier n° 5. */
    sauvegarde(): Promise<unknown>;
    /** S'abonner aux diffusions du moteur. Rend de quoi se désabonner. */
    surChangement(fn: (ev: ChangementDeFiche) => void): () => void;
    /** Retire l'écouteur et fait échouer ce qui attendait encore. */
    fermer(): void;
}

interface EnAttente {
    resoudre: (valeur: unknown) => void;
    rejeter: (err: Error) => void;
    minuteur: ReturnType<typeof setTimeout>;
}

export interface OptionsDuPont {
    /** Au-delà, on rend la main. Une fiche qui charge sept mégaoctets a le temps. */
    delaiMs?: number;
    /** La fenêtre qui écoute — `window` par défaut. */
    ecouteur?: Pick<Window, 'addEventListener' | 'removeEventListener'>;
}

/**
 * Ouvre le pont vers la fenêtre d'une fiche.
 *
 * `cible` est le `contentWindow` de l'iframe. On ne lui parle qu'en `*` : la
 * fiche est servie par un protocole interne dont l'origine exacte dépend de
 * l'empaquetage, et se tromper de cible ferait échouer chaque message **en
 * silence**. La garantie ne vient pas de là, elle vient du contrôle de
 * `event.source` à la réception.
 */
export function ouvrirLePont(cible: Window, options: OptionsDuPont = {}): PontDeLaFiche {
    const delaiMs = options.delaiMs ?? 15_000;
    const ecouteur = options.ecouteur ?? window;

    const enAttente = new Map<number, EnAttente>();
    const abonnes = new Set<(ev: ChangementDeFiche) => void>();
    let prochainId = 1;
    let ferme = false;

    const recevoir = (event: MessageEvent) => {
        // L'émetteur d'abord : le canal seul ne prouve rien.
        if (event.source !== cible) return;
        const m = event.data;
        if (!m || m.channel !== CANAL) return;

        if (m.type === 'reply') {
            const attente = enAttente.get(m.id);
            if (!attente) return;
            enAttente.delete(m.id);
            clearTimeout(attente.minuteur);
            if (m.ok) attente.resoudre(m.result);
            else attente.rejeter(new Error(String(m.result ?? 'La fiche a refusé la demande.')));
            return;
        }

        if (m.type === 'change' || m.type === 'open') {
            const ev: ChangementDeFiche = {
                origin: m.origin, keys: m.keys ?? [], character: m.character ?? null,
                ...(m.type === 'open' ? { template: m.template ?? null } : {}),
            };
            for (const fn of abonnes) {
                try { fn(ev); } catch (err) { console.error('[Fiche] abonné en échec', err); }
            }
        }
    };

    ecouteur.addEventListener('message', recevoir as EventListener);

    function demander<T>(type: string, extra: Record<string, unknown> = {}): Promise<T> {
        if (ferme) return Promise.reject(new Error('Le pont vers la fiche est fermé.'));
        const id = prochainId++;

        return new Promise<T>((resoudre, rejeter) => {
            const minuteur = setTimeout(() => {
                enAttente.delete(id);
                rejeter(new Error(`La fiche n'a pas répondu à « ${type} » en ${Math.round(delaiMs / 1000)} s.`));
            }, delaiMs);

            enAttente.set(id, { resoudre: resoudre as (v: unknown) => void, rejeter, minuteur });

            try {
                cible.postMessage({ channel: CANAL, type, id, ...extra }, '*');
            } catch (err) {
                enAttente.delete(id);
                clearTimeout(minuteur);
                rejeter(err instanceof Error ? err : new Error(String(err)));
            }
        });
    }

    return {
        bonjour: () => demander('hello'),
        lire: () => demander('get'),
        gabarit: () => demander('template'),
        ecrire: lot => demander('set', { data: lot }),
        bibliotheque: () => demander('list'),
        ouvrirPersonnage: characterId => demander('openCharacter', { characterId }),
        creer: (name, templateId, data) => demander('create', { name, templateId, data }),
        sauvegarde: () => demander('backup'),

        surChangement(fn) {
            abonnes.add(fn);
            return () => abonnes.delete(fn);
        },

        fermer() {
            ferme = true;
            ecouteur.removeEventListener('message', recevoir as EventListener);
            // Ce qui attendait ne recevra jamais rien : le dire plutôt que le taire.
            for (const [, attente] of enAttente) {
                clearTimeout(attente.minuteur);
                attente.rejeter(new Error('Le pont vers la fiche a été fermé.'));
            }
            enAttente.clear();
            abonnes.clear();
        },
    };
}

/** Le port du serveur des fiches. Doit rester d'accord avec `electron/serveurDesFiches.ts`. */
export const PORT_DES_FICHES = 3002;

/** Vrai dans une fenêtre Electron — meneur, Player Hub, projecteur. */
function dansElectron(): boolean {
    return typeof window !== 'undefined' && !!window.appBridge;
}

/**
 * **L'origine des fiches — et pourquoi elle n'est pas la même partout.**
 *
 * Dans Electron, le protocole interne `gmos://` est déjà une origine distincte de
 * celle du cockpit : la fiche y est isolée sans rien faire.
 *
 * Sur une tablette, il n'existe pas. Servir la fiche par le `SyncServer` la
 * mettrait sur **l'origine du Player Hub**, donc avec accès à son stockage — pour
 * un fichier HTML que GM-OS n'écrit pas et ne relit pas. D'où un **port
 * distinct** : la tablette est sur `:3001`, les fiches sur `:3002`, et le
 * navigateur les sépare exactement comme il sépare `gmos://` du cockpit.
 *
 * *L'isolation ne vient pas du protocole, elle vient de la différence d'origine.*
 */
export function origineDesFiches(): string {
    if (dansElectron()) return 'gmos://media/docs';
    const hote = typeof window === 'undefined' ? 'localhost' : window.location.hostname;
    return `http://${hote}:${PORT_DES_FICHES}`;
}

/**
 * L'adresse du moteur de fiches, pour l'écran où l'on se trouve.
 *
 * `epuree` retire la barre latérale et les boutons de bibliothèque — Zones,
 * Exporter, Importer, Imprimer. C'est la vue de la **tablette d'un joueur** : il
 * ne gère pas une bibliothèque, il regarde sa fiche. *Un bouton qu'on ne doit
 * pas toucher finit par être touché.* L'écran du meneur garde tout, puisque
 * c'est lui qui gère la bibliothèque.
 */
export function adresseDuMoteur(options: { epuree?: boolean } = {}): string {
    const base = `${origineDesFiches()}/fiches/Character_Sheet_Manager.html`;
    return options.epuree ? `${base}?vue=epuree` : base;
}
