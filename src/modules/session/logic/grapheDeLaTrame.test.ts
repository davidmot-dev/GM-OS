import { describe, it, expect } from 'vitest';
import {
    grapheDeLaTrame, constatsDeLaTrame, typesDuNiveau, niveauQuiMontre, porteeRetientLaScene,
    idDuNoeud, NIVEAUX, NIVEAU_MAXIMUM, COULEUR_DU_TYPE, LIBELLE_DU_TYPE,
    type SourceDeLaTrame, type TypeDeNoeud,
} from './grapheDeLaTrame';
import type { Acte, Scene } from '../../../types/trame.types';

/**
 * **La trame vue comme un graphe** — demandé par David le 2026-09-22.
 *
 * ⭐ **Ce que ces essais gardent avant tout : que le graphe n'invente rien.** Il
 * dessine des liens déjà écrits dans `Scene`. Un nœud qui apparaîtrait sans
 * renvoi correspondant, ou un renvoi vers un objet supprimé qui deviendrait un
 * nœud, ferait croire à une campagne qui n'existe pas.
 */

const acte = (id: string, ordre: number, extra: Partial<Acte> = {}): Acte => ({
    id, campaignId: 'c1', ordre, titre: `Acte ${ordre}`, resume: '', ...extra,
});

const scene = (id: string, ordre: number, extra: Partial<Scene> = {}): Scene => ({
    id, campaignId: 'c1', acteId: 'a1', ordre, titre: `Scène ${ordre}`, resume: '',
    origine: 'preparee', entiteIds: [], indiceIds: [], creeeLe: 1_000, ...extra,
});

/** Une campagne minuscule mais complète : un acte, trois scènes, un de chaque annexe. */
const campagne = (): SourceDeLaTrame => ({
    actes: [acte('a1', 1)],
    scenes: [
        scene('s1', 1, { lieuId: 'l1', entiteIds: ['e1'], indiceIds: ['i1'] }),
        scene('s2', 2, { momentDeStoryboardId: 'm1', personnagesIds: ['p1'] }),
        scene('s3', 3),
    ],
    atlasMaps: [{ id: 'l1', campaignId: 'c1', name: 'Le port' }] as never,
    entities: [{ id: 'e1', campaignId: 'c1', name: 'Kessler' }],
    clues: [{ id: 'i1', campaignId: 'c1', title: 'Le bordereau', isRevealed: false }] as never,
    moments: [{ id: 'm1', campaignId: 'c1', name: 'Pluie sur les docks' }],
    personnages: [{ id: 'p1', campaignId: 'c1', name: 'Nadia' }],
});

const typesPresents = (source: SourceDeLaTrame, niveau: number) =>
    new Set(grapheDeLaTrame('c1', source, { niveau }).noeuds.map(n => n.type));

describe('les niveaux', () => {
    /**
     * ⭐ **L'idée de David, et pourquoi elle est meilleure que sept cases.**
     * Sept bascules indépendantes font 128 vues dont il faut choisir la bonne ;
     * un curseur fait une profondeur. *La densité se règle par un geste.*
     */
    it('le niveau 0 est la trame nue', () => {
        expect(typesDuNiveau(0)).toEqual(new Set<TypeDeNoeud>(['acte', 'scene']));
    });

    it('chaque cran ajoute au précédent, sans rien retirer', () => {
        for (let n = 1; n <= NIVEAU_MAXIMUM; n++) {
            const avant = typesDuNiveau(n - 1);
            const apres = typesDuNiveau(n);
            for (const type of avant) expect(apres.has(type), `${type} a disparu au niveau ${n}`).toBe(true);
            expect(apres.size).toBeGreaterThan(avant.size);
        }
    });

    it('le dernier cran montre les sept sortes', () => {
        expect(typesDuNiveau(NIVEAU_MAXIMUM).size).toBe(Object.keys(COULEUR_DU_TYPE).length);
    });

    /** ⚠️ Un niveau hors bornes rendrait un `NIVEAUX[i]` indéfini, donc un plantage. */
    it('borne ce qu’on lui donne', () => {
        expect(typesDuNiveau(-5)).toEqual(typesDuNiveau(0));
        expect(typesDuNiveau(99)).toEqual(typesDuNiveau(NIVEAU_MAXIMUM));
        expect(typesDuNiveau(2.7)).toEqual(typesDuNiveau(2));
    });

    it('sait à quel cran chaque sorte apparaît', () => {
        expect(niveauQuiMontre('acte')).toBe(0);
        expect(niveauQuiMontre('scene')).toBe(0);
        expect(niveauQuiMontre('lieu')).toBe(1);
        expect(niveauQuiMontre('pnj')).toBe(2);
    });

    it('chaque sorte a sa couleur et son nom', () => {
        for (const type of typesDuNiveau(NIVEAU_MAXIMUM)) {
            expect(COULEUR_DU_TYPE[type]).toMatch(/^#[0-9a-f]{6}$/);
            expect(LIBELLE_DU_TYPE[type]).toBeTruthy();
        }
    });

    it('le niveau décide vraiment de ce qu’on dessine', () => {
        expect(typesPresents(campagne(), 0)).toEqual(new Set(['acte', 'scene']));
        expect(typesPresents(campagne(), 1)).toContain('lieu');
        expect(typesPresents(campagne(), 1)).not.toContain('pnj');
        expect(typesPresents(campagne(), NIVEAU_MAXIMUM).size).toBe(7);
    });
});

describe('le graphe', () => {
    it('sans campagne, il n’y a rien — pas la trame de la dernière', () => {
        expect(grapheDeLaTrame(null, campagne(), { niveau: 3 })).toEqual({ noeuds: [], liens: [] });
    });

    it('chaque scène appartient à son acte', () => {
        const { liens } = grapheDeLaTrame('c1', campagne(), { niveau: 0 });
        const appartenances = liens.filter(l => l.nature === 'appartenance');

        expect(appartenances).toHaveLength(3);
        for (const lien of appartenances) expect(lien.source).toBe(idDuNoeud('acte', 'a1'));
    });

    /**
     * ⭐ **Le lien qui fait qu'on lit une trame et non une pelote.** Sans la
     * chaîne scène *n* → scène *n+1*, un graphe de force rend un oursin par acte,
     * et l'ordre de l'histoire — la seule chose qu'on vient chercher — disparaît.
     */
    it('enchaîne les scènes dans l’ordre de l’acte', () => {
        const { liens } = grapheDeLaTrame('c1', campagne(), { niveau: 0 });
        const suites = liens.filter(l => l.nature === 'suite');

        expect(suites).toEqual([
            { source: idDuNoeud('scene', 's1'), target: idDuNoeud('scene', 's2'), nature: 'suite' },
            { source: idDuNoeud('scene', 's2'), target: idDuNoeud('scene', 's3'), nature: 'suite' },
        ]);
    });

    it('relie une scène à son lieu, son PNJ, son indice, son PJ et son ambiance', () => {
        const { liens } = grapheDeLaTrame('c1', campagne(), { niveau: NIVEAU_MAXIMUM });
        const natures = new Set(liens.map(l => l.nature));

        for (const attendu of ['lieu', 'pnj', 'indice', 'pj', 'ambiance']) {
            expect(natures.has(attendu as never), `aucun lien de nature ${attendu}`).toBe(true);
        }
    });

    /**
     * ⭐ **La moitié de la valeur de l'écran.** Un indice que plus aucune scène ne
     * livre doit apparaître comme un nœud **isolé** : ne garder que les objets
     * reliés aurait produit un graphe où tout va bien par construction.
     */
    it('montre aussi ce qu’aucune scène ne convoque, en nœud isolé', () => {
        const source = campagne();
        const avecOrphelins: SourceDeLaTrame = {
            ...source,
            entities: [...(source.entities ?? []), { id: 'e9', campaignId: 'c1', name: 'Un PNJ oublié' }],
        };
        const { noeuds, liens } = grapheDeLaTrame('c1', avecOrphelins, { niveau: 2 });

        expect(noeuds.some(n => n.id === idDuNoeud('pnj', 'e9'))).toBe(true);
        expect(liens.some(l => l.target === idDuNoeud('pnj', 'e9'))).toBe(false);
    });

    /**
     * ⛔ **Un renvoi mort ne devient JAMAIS un nœud.** Dessiner un lieu supprimé
     * ferait croire qu'il existe, et le meneur le chercherait dans l'Atlas. Il
     * disparaît du dessin et se retrouve dans les constats.
     */
    it('ne fabrique pas de nœud pour un renvoi vers un objet supprimé', () => {
        const source: SourceDeLaTrame = { ...campagne(), atlasMaps: [] };
        const { noeuds, liens } = grapheDeLaTrame('c1', source, { niveau: 1 });

        expect(noeuds.some(n => n.type === 'lieu')).toBe(false);
        expect(liens.some(l => l.nature === 'lieu')).toBe(false);
    });

    it('ne mélange pas deux campagnes', () => {
        const source: SourceDeLaTrame = {
            ...campagne(),
            entities: [{ id: 'e2', campaignId: 'c2', name: 'D’une autre campagne' }],
        };
        const { noeuds } = grapheDeLaTrame('c1', source, { niveau: 2 });

        expect(noeuds.some(n => n.refId === 'e2')).toBe(false);
    });

    /** Les positions viennent de `placerLeNoeud` et de nulle part ailleurs. */
    it('sème les positions qu’on lui donne', () => {
        const { noeuds } = grapheDeLaTrame('c1', campagne(), {
            niveau: 0,
            placer: (id) => (id === idDuNoeud('scene', 's1') ? { x: 12, y: 34 } : {}),
        });
        const s1 = noeuds.find(n => n.id === idDuNoeud('scene', 's1'));

        expect(s1).toMatchObject({ x: 12, y: 34 });
        expect(noeuds.find(n => n.id === idDuNoeud('scene', 's2'))?.x).toBeUndefined();
    });

    it('porte le rang et l’état de chaque scène', () => {
        const source: SourceDeLaTrame = {
            actes: [acte('a1', 1)],
            scenes: [scene('s1', 1, { importance: 'principale', termineeLe: 9_000 })],
        };
        const noeud = grapheDeLaTrame('c1', source, { niveau: 0 }).noeuds
            .find(n => n.type === 'scene');

        expect(noeud?.importance).toBe('principale');
        expect(noeud?.etat).toBe('terminee');
    });
});

describe('ce qu’on choisit de regarder', () => {
    const rangs: SourceDeLaTrame = {
        actes: [acte('a1', 1)],
        scenes: [
            scene('s1', 1, { importance: 'principale' }),
            scene('s2', 2, { importance: 'optionnelle' }),
            scene('s3', 3),
        ],
    };
    const titres = (portee: Parameters<typeof porteeRetientLaScene>[1]) =>
        grapheDeLaTrame('c1', rangs, { niveau: 0, portee }).noeuds
            .filter(n => n.type === 'scene').map(n => n.refId);

    it('tout, par défaut', () => {
        expect(titres('tout')).toEqual(['s1', 's2', 's3']);
        expect(grapheDeLaTrame('c1', rangs, { niveau: 0 }).noeuds.filter(n => n.type === 'scene')).toHaveLength(3);
    });

    /**
     * ⭐ **« Sans les optionnelles » garde les scènes NON CLASSÉES, et c'est
     * l'essentiel.** Une campagne écrite avant le rang d'intrigue ne porte aucun
     * champ : un filtre qui la viderait ressemblerait à un graphe cassé. *Une
     * garde qui refuse tout ressemble à une garde qui marche.*
     */
    it('« sans les optionnelles » ne retire QUE les optionnelles', () => {
        expect(titres('sans-optionnelles')).toEqual(['s1', 's3']);
    });

    it('« intrigue principale seule » ne garde que ce qui est classé ainsi', () => {
        expect(titres('principale')).toEqual(['s1']);
    });

    it('masquer les scènes closes ne touche pas aux autres', () => {
        const source: SourceDeLaTrame = {
            actes: [acte('a1', 1)],
            scenes: [scene('s1', 1, { termineeLe: 9_000 }), scene('s2', 2)],
        };
        const restantes = grapheDeLaTrame('c1', source, { niveau: 0, masquerLesScenesTerminees: true })
            .noeuds.filter(n => n.type === 'scene');

        expect(restantes.map(n => n.refId)).toEqual(['s2']);
    });

    /** Une scène masquée ne laisse pas de lien pendant vers un nœud absent. */
    it('un filtre ne laisse aucun lien orphelin', () => {
        const { noeuds, liens } = grapheDeLaTrame('c1', campagne(), {
            niveau: NIVEAU_MAXIMUM, portee: 'principale',
        });
        const ids = new Set(noeuds.map(n => n.id));

        for (const lien of liens) {
            expect(ids.has(lien.source as string), `source absente : ${lien.source}`).toBe(true);
            expect(ids.has(lien.target as string), `cible absente : ${lien.target}`).toBe(true);
        }
    });
});

/**
 * **Les constats — ce qu'aucune liste ne dit.**
 *
 * ⛔ Ils portent sur la trame **entière**, jamais sur la vue : *un constat qui
 * disparaîtrait en masquant les scènes closes ferait croire qu'un défaut se
 * répare quand on détourne le regard.*
 */
describe('les constats', () => {
    const trouve = (source: SourceDeLaTrame, id: string) =>
        constatsDeLaTrame('c1', source).find(c => c.id === id);

    it('une campagne bien tenue n’en déclenche que les bénins', () => {
        const constats = constatsDeLaTrame('c1', campagne());
        expect(constats.filter(c => c.ton === 'alerte')).toEqual([]);
    });

    it('sans campagne, aucun constat', () => {
        expect(constatsDeLaTrame(null, campagne())).toEqual([]);
    });

    /** Le plus grave : le groupe ne peut plus le trouver, et rien ne le disait. */
    it('signale un indice que plus aucune scène ne livre', () => {
        const source = campagne();
        const constat = trouve({
            ...source,
            clues: [...(source.clues ?? []), { id: 'i9', campaignId: 'c1', title: 'Perdu', isRevealed: false }] as never,
        }, 'indice-orphelin');

        expect(constat?.noeuds).toEqual([idDuNoeud('indice', 'i9')]);
        expect(constat?.ton).toBe('alerte');
        expect(constat?.niveau, 'le constat doit emmener au cran qui les montre').toBe(niveauQuiMontre('indice'));
    });

    it('signale une scène qui renvoie à un lieu supprimé', () => {
        const constat = trouve({ ...campagne(), atlasMaps: [] }, 'renvoi-mort');
        expect(constat?.noeuds).toEqual([idDuNoeud('scene', 's1')]);
        expect(constat?.ton).toBe('alerte');
    });

    it('signale un PNJ qu’aucune scène ne convoque', () => {
        const source = campagne();
        const constat = trouve({
            ...source,
            entities: [...(source.entities ?? []), { id: 'e9', campaignId: 'c1', name: 'Oublié' }],
        }, 'pnj-hors-trame');

        expect(constat?.noeuds).toEqual([idDuNoeud('pnj', 'e9')]);
    });

    it('signale les scènes creuses, celles sans lieu, et les actes vides', () => {
        expect(trouve(campagne(), 'scene-creuse')?.noeuds)
            .toEqual([idDuNoeud('scene', 's2'), idDuNoeud('scene', 's3')]);
        expect(trouve(campagne(), 'scene-sans-lieu')?.noeuds)
            .toEqual([idDuNoeud('scene', 's2'), idDuNoeud('scene', 's3')]);
        expect(trouve({ actes: [acte('a1', 1)], scenes: [] }, 'acte-vide')?.noeuds)
            .toEqual([idDuNoeud('acte', 'a1')]);
    });

    /** ⭐ Ce qui est vrai de la campagne ne dépend pas de ce qu'on affiche. */
    it('ne changent pas quand on masque des scènes', () => {
        const source: SourceDeLaTrame = {
            ...campagne(),
            scenes: (campagne().scenes ?? []).map(s => ({ ...s, termineeLe: 9_000 })),
        };
        expect(constatsDeLaTrame('c1', source).map(c => c.id))
            .toEqual(constatsDeLaTrame('c1', campagne()).map(c => c.id));
    });

    /**
     * ⚠️ **Le constat que j'ai retiré.** « Ce PNJ n'apparaît que dans une scène »
     * était mon premier réflexe : sur « Le secret de Milo », 43 PNJ pour 29
     * scènes, il aurait crié quarante fois. *Un constat qui se déclenche toujours
     * ne dit plus rien.*
     */
    it('ne signale pas un PNJ présent dans une seule scène', () => {
        expect(constatsDeLaTrame('c1', campagne()).map(c => c.id))
            .not.toContain('pnj-une-seule-scene');
    });

    it('aucun constat vide n’est publié', () => {
        for (const constat of constatsDeLaTrame('c1', campagne())) {
            expect(constat.noeuds.length, constat.id).toBeGreaterThan(0);
        }
    });
});

describe('la table des niveaux et celle des couleurs se répondent', () => {
    /** ⚠️ Un type ajouté à un niveau sans couleur se peindrait en `undefined`. */
    it('chaque type d’un niveau a une couleur, un nom et un rayon', () => {
        const declares = new Set(NIVEAUX.flatMap(n => [...n.ajoute]));
        for (const type of declares) {
            expect(COULEUR_DU_TYPE[type], `${type} sans couleur`).toBeTruthy();
            expect(LIBELLE_DU_TYPE[type], `${type} sans nom`).toBeTruthy();
        }
    });
});
