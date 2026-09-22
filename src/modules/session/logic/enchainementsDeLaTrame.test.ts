import { describe, it, expect } from 'vitest';
import {
    enchainementsDeLaScene, ordreEstDessine, enchainementAjoute, enchainementRetire,
    enchainementLibelle, sortiesDeLaScene, entreesDeLaScene, aUneSortieMorte,
    enchainementsSansLesScenes, LIBELLE_MAXIMUM, libelleLisible,
} from './enchainementsDeLaTrame';
import { grapheDeLaTrame, coupleDEnchainement, constatsDeLaTrame, idDuNoeud } from './grapheDeLaTrame';
import { segmentDeLecture } from '../../remote/segmentDeLecture';
import type { Acte, Scene } from '../../../types/trame.types';

/**
 * **« Une scène A mène vers une scène B ou une scène C »** — demandé par David le
 * 2026-09-22.
 *
 * ⭐ **Ce que ces essais protègent avant tout : qu'il n'y ait jamais deux vérités
 * sur « ce qui suit ».** L'ordre des scènes dans un acte était déjà un
 * enchaînement. La règle qui les réconcilie — *l'ordre ne se dessine que là où le
 * meneur n'a rien dit* — est épinglée plus bas, et c'est l'essai le plus
 * important du fichier.
 */

const acte = (id: string, ordre: number): Acte =>
    ({ id, campaignId: 'c1', ordre, titre: `Acte ${ordre}`, resume: '' });

const scene = (id: string, ordre: number, extra: Partial<Scene> = {}): Scene => ({
    id, campaignId: 'c1', acteId: 'a1', ordre, titre: id, resume: '',
    origine: 'preparee', entiteIds: [], indiceIds: [], creeeLe: 1_000, ...extra,
});

describe('lire les sorties d’une scène', () => {
    it('une scène d’hier n’en porte aucune', () => {
        expect(enchainementsDeLaScene(scene('s1', 1))).toEqual([]);
        expect(enchainementsDeLaScene(undefined)).toEqual([]);
        expect(enchainementsDeLaScene({ enchainements: 'oui' })).toEqual([]);
    });

    it('garde la cible et sa condition', () => {
        const s = scene('s1', 1, { enchainements: [{ vers: 's2', libelle: 'si elle survit' }] });
        expect(enchainementsDeLaScene(s)).toEqual([{ vers: 's2', libelle: 'si elle survit' }]);
    });

    /** ⛔ Un trait de longueur nulle ne pourrait même pas se cliquer pour être retiré. */
    it('refuse qu’une scène mène à elle-même', () => {
        const s = scene('s1', 1, { enchainements: [{ vers: 's1' }, { vers: 's2' }] });
        expect(enchainementsDeLaScene(s)).toEqual([{ vers: 's2' }]);
    });

    it('compte deux fois la même sortie pour une', () => {
        const s = scene('s1', 1, { enchainements: [{ vers: 's2' }, { vers: 's2', libelle: 'bis' }] });
        expect(enchainementsDeLaScene(s)).toEqual([{ vers: 's2' }]);
    });

    it('jette ce qui n’est pas une cible', () => {
        const s = scene('s1', 1, {
            enchainements: [{ vers: '' }, { vers: 42 as never }, { vers: 's2' }],
        });
        expect(enchainementsDeLaScene(s)).toEqual([{ vers: 's2' }]);
    });

    /** ⚠️ Le libellé est dessiné sur le trait : un paragraphe y ferait une tache. */
    it('borne la longueur du libellé', () => {
        const long = 'x'.repeat(LIBELLE_MAXIMUM + 40);
        const s = scene('s1', 1, { enchainements: [{ vers: 's2', libelle: long }] });

        expect(enchainementsDeLaScene(s)[0].libelle).toHaveLength(LIBELLE_MAXIMUM);
    });

    /**
     * ⛔ **Cet essai a été RETOURNÉ le 2026-09-22, et c'est important.**
     *
     * Il exigeait qu'un libellé fait d'espaces devienne `undefined` à la lecture —
     * ce qui supposait un `trim()` sur le chemin d'écriture. **C'est exactement ce
     * qui rendait la saisie impossible** : David ne pouvait pas taper d'espace
     * entre deux mots. *L'essai gardait le défaut au lieu de le trouver.*
     *
     * Le blanc est donc conservé tel quel, et c'est `libelleLisible` qui le fait
     * disparaître à l'affichage.
     */
    it('garde le blanc tel quel — c’est l’affichage qui le fait disparaître', () => {
        const s = scene('s1', 1, { enchainements: [{ vers: 's3', libelle: '   ' }] });

        expect(enchainementsDeLaScene(s)[0].libelle).toBe('   ');
        expect(libelleLisible(enchainementsDeLaScene(s)[0].libelle)).toBeUndefined();
    });
});

/**
 * ⭐⭐ **LA RÈGLE QUI ÉVITE DEUX VÉRITÉS.**
 *
 * *Une scène qui suit la 2 par l'ordre mais qui « mène à » la 5 ne dit plus rien
 * de fiable à personne.* L'ordre ne se dessine donc que là où le meneur n'a rien
 * déclaré.
 */
describe('l’ordre ne parle que là où le meneur s’est taxé', () => {
    it('une scène sans sortie laisse l’ordre parler', () => {
        expect(ordreEstDessine(scene('s1', 1))).toBe(true);
    });

    it('une scène avec une sortie reprend la parole', () => {
        expect(ordreEstDessine(scene('s1', 1, { enchainements: [{ vers: 's9' }] }))).toBe(false);
    });

    it('et le graphe suit : le trait d’ordre disparaît de cette scène', () => {
        const source = {
            actes: [acte('a1', 1)],
            scenes: [
                scene('s1', 1, { enchainements: [{ vers: 's3' }] }),
                scene('s2', 2),
                scene('s3', 3),
            ],
        };
        const { liens } = grapheDeLaTrame('c1', source, { niveau: 0 });
        const suites = liens.filter(l => l.nature === 'suite');

        expect(suites, 's1 a déclaré : son trait d’ordre ne doit plus être tracé')
            .toEqual([{ source: idDuNoeud('scene', 's2'), target: idDuNoeud('scene', 's3'), nature: 'suite' }]);
        expect(liens.some(l => l.nature === 'enchainement'
            && l.source === idDuNoeud('scene', 's1')
            && l.target === idDuNoeud('scene', 's3'))).toBe(true);
    });

    /** Une trame à moitié câblée reste lisible — c'est tout l'intérêt de la règle. */
    it('une trame sans aucune sortie se dessine exactement comme la veille', () => {
        const source = { actes: [acte('a1', 1)], scenes: [scene('s1', 1), scene('s2', 2)] };
        const { liens } = grapheDeLaTrame('c1', source, { niveau: 0 });

        expect(liens.filter(l => l.nature === 'suite')).toHaveLength(1);
        expect(liens.some(l => l.nature === 'enchainement')).toBe(false);
    });
});

describe('le graphe et les sorties', () => {
    /** L'embranchement demandé : A mène à B **ou** à C. */
    it('dessine plusieurs sorties depuis une même scène', () => {
        const source = {
            actes: [acte('a1', 1)],
            scenes: [
                scene('s1', 1, { enchainements: [
                    { vers: 's2', libelle: 'si Hale accepte' },
                    { vers: 's3', libelle: 's’il refuse' },
                ] }),
                scene('s2', 2), scene('s3', 3),
            ],
        };
        const branches = grapheDeLaTrame('c1', source, { niveau: 0 }).liens
            .filter(l => l.nature === 'enchainement');

        expect(branches).toHaveLength(2);
        expect(branches.map(b => b.libelle)).toEqual(['si Hale accepte', 's’il refuse']);
    });

    /** Par-dessus les actes : c'est une grande part de l'intérêt. */
    it('traverse les actes', () => {
        const source = {
            actes: [acte('a1', 1), acte('a2', 2)],
            scenes: [
                scene('s1', 1, { enchainements: [{ vers: 't1' }] }),
                scene('t1', 1, { acteId: 'a2' }),
            ],
        };
        expect(grapheDeLaTrame('c1', source, { niveau: 0 }).liens
            .some(l => l.nature === 'enchainement')).toBe(true);
    });

    /**
     * ⛔ **Un lien vers une scène absente du dessin est JETÉ, pas tracé.**
     * *`react-force-graph` invente un nœud pour une extrémité inconnue* : un
     * fantôme sans nom au milieu de la toile, que rien n'expliquerait.
     */
    it('ne trace rien vers une scène masquée par un filtre', () => {
        const source = {
            actes: [acte('a1', 1)],
            scenes: [
                scene('s1', 1, { importance: 'principale', enchainements: [{ vers: 's2' }] }),
                scene('s2', 2, { importance: 'optionnelle' }),
            ],
        };
        const { noeuds, liens } = grapheDeLaTrame('c1', source, {
            niveau: 0, portee: 'sans-optionnelles',
        });
        const ids = new Set(noeuds.map(n => n.id));

        expect(liens.some(l => l.nature === 'enchainement')).toBe(false);
        for (const lien of liens) expect(ids.has(lien.target as string)).toBe(true);
    });

    it('ni vers une scène supprimée', () => {
        const source = {
            actes: [acte('a1', 1)],
            scenes: [scene('s1', 1, { enchainements: [{ vers: 'disparue' }] })],
        };
        const { noeuds, liens } = grapheDeLaTrame('c1', source, { niveau: 0 });

        expect(liens.some(l => l.nature === 'enchainement')).toBe(false);
        expect(noeuds.some(n => n.refId === 'disparue'), 'aucun nœud fantôme').toBe(false);
    });

    /** Et cette sortie morte se dit, au lieu de se taire. */
    it('signale une sortie vers une scène disparue', () => {
        const source = {
            actes: [acte('a1', 1)],
            scenes: [scene('s1', 1, { enchainements: [{ vers: 'disparue' }] })],
        };
        expect(constatsDeLaTrame('c1', source).find(c => c.id === 'renvoi-mort')?.noeuds)
            .toEqual([idDuNoeud('scene', 's1')]);
    });
});

/**
 * ⛔ **Le sens du geste compte, contrairement aux renvois.** « A mène à B » n'est
 * pas « B mène à A » : *accepter les deux sens aurait inversé une branche sur deux
 * sans rien dire.*
 */
describe('le couple désigné par un glisser', () => {
    const n = (type: string, refId: string) => ({ type: type as never, refId });

    it('garde le sens du geste', () => {
        expect(coupleDEnchainement(n('scene', 's1'), n('scene', 's2')))
            .toEqual({ deId: 's1', versId: 's2' });
        expect(coupleDEnchainement(n('scene', 's2'), n('scene', 's1')))
            .toEqual({ deId: 's2', versId: 's1' });
    });

    it('refuse tout ce qui n’est pas deux scènes distinctes', () => {
        expect(coupleDEnchainement(n('scene', 's1'), n('scene', 's1'))).toBeNull();
        expect(coupleDEnchainement(n('scene', 's1'), n('acte', 'a1'))).toBeNull();
        expect(coupleDEnchainement(n('pnj', 'e1'), n('scene', 's1'))).toBeNull();
    });
});

describe('les trois écritures', () => {
    it('ouvre une sortie, avec ou sans condition', () => {
        expect(enchainementAjoute(scene('s1', 1), 's2')?.enchainements).toEqual([{ vers: 's2' }]);
        /* ⚠️ La condition est gardée **telle qu'elle a été tapée**, espaces
           compris — une seule règle pour l'écriture, sans quoi le champ de saisie
           et ce chemin-ci se contrediraient. Le rognage est à l'affichage. */
        expect(enchainementAjoute(scene('s1', 1), 's2', ' en cas d’échec ')?.enchainements)
            .toEqual([{ vers: 's2', libelle: ' en cas d’échec ' }]);
        expect(libelleLisible(' en cas d’échec ')).toBe('en cas d’échec');
    });

    it('n’écrit rien pour un geste sans effet', () => {
        expect(enchainementAjoute(scene('s1', 1), 's1')).toBeNull();
        expect(enchainementAjoute(scene('s1', 1), '')).toBeNull();
        expect(enchainementAjoute(scene('s1', 1, { enchainements: [{ vers: 's2' }] }), 's2')).toBeNull();
        expect(enchainementRetire(scene('s1', 1), 's2')).toBeNull();
        expect(enchainementLibelle(scene('s1', 1), 's2', 'x')).toBeNull();
    });

    it('ajoute sans perdre les sorties déjà là', () => {
        const s = scene('s1', 1, { enchainements: [{ vers: 's2' }] });
        expect(enchainementAjoute(s, 's3')?.enchainements).toEqual([{ vers: 's2' }, { vers: 's3' }]);
    });

    /**
     * ⭐ **Vide veut dire absent.** Une scène dont on retire la dernière sortie
     * doit se relire exactement comme une scène d'avant ce champ — sinon un
     * tableau vide rendrait `ordreEstDessine` faux pour la mauvaise raison.
     */
    it('retirer la dernière sortie rend le champ absent, pas vide', () => {
        const s = scene('s1', 1, { enchainements: [{ vers: 's2' }] });
        const updates = enchainementRetire(s, 's2');

        expect(updates?.enchainements).toBeUndefined();
        expect(ordreEstDessine({ ...s, ...updates })).toBe(true);
    });

    it('change une condition sans toucher aux autres', () => {
        const s = scene('s1', 1, {
            enchainements: [{ vers: 's2', libelle: 'a' }, { vers: 's3', libelle: 'b' }],
        });
        expect(enchainementLibelle(s, 's3', 'nouvelle')?.enchainements)
            .toEqual([{ vers: 's2', libelle: 'a' }, { vers: 's3', libelle: 'nouvelle' }]);
    });

    it('une condition vidée pour de bon disparaît', () => {
        const s = scene('s1', 1, { enchainements: [{ vers: 's2', libelle: 'a' }] });
        expect(enchainementLibelle(s, 's2', '')?.enchainements).toEqual([{ vers: 's2' }]);
    });

    /**
     * ⚠️ **Mais une condition réduite à un espace reste écrite**, parce que c'est
     * peut-être le premier caractère d'une phrase en cours de frappe. *On ne
     * devine pas si le meneur a fini.* Elle ne s'affiche simplement nulle part.
     */
    it('un espace seul survit à l’écriture, et ne s’affiche pas', () => {
        const s = scene('s1', 1, { enchainements: [{ vers: 's2', libelle: 'a' }] });
        const ecrit = enchainementLibelle(s, 's2', ' ')?.enchainements?.[0];

        expect(ecrit?.libelle).toBe(' ');
        expect(libelleLisible(ecrit?.libelle)).toBeUndefined();
    });
});

/**
 * ⛔⛔ **LE DÉFAUT QUE DAVID A VU À L'ÉCRAN, le 2026-09-22.**
 *
 * *« dans les conditions je ne peux pas mettre d'espace entre les mots »* —
 * capture à l'appui : « camérasurveillance ».
 *
 * La cause : le libellé était **`trim()`é à chaque frappe**. Le champ est
 * contrôlé ; taper « caméra » puis l'espace écrivait « caméra », que la
 * normalisation rendait aussitôt « caméra » — l'espace était mangé avant d'avoir
 * existé, et le mot suivant se collait.
 *
 * ⭐ ***Une normalisation qui s'applique à la frappe empêche d'écrire.*** Ce qui
 * est stocké est ce que le meneur a tapé ; c'est **l'affichage** qui nettoie.
 */
describe('écrire une condition, espaces compris', () => {
    const avecSortie = () => scene('s1', 1, { enchainements: [{ vers: 's2' }] });

    it('garde l’espace qu’on vient de taper', () => {
        const updates = enchainementLibelle(avecSortie(), 's2', 'caméra ');

        expect(updates?.enchainements?.[0].libelle,
            'l’espace final est mangé : impossible de taper le mot suivant').toBe('caméra ');
    });

    it('et le relit tel quel, pour que la frappe continue', () => {
        const s = scene('s1', 1, { enchainements: [{ vers: 's2', libelle: 'caméra ' }] });

        expect(enchainementsDeLaScene(s)[0].libelle).toBe('caméra ');
    });

    it('la phrase entière arrive intacte', () => {
        const updates = enchainementLibelle(avecSortie(), 's2', 'caméra de surveillance');
        expect(updates?.enchainements?.[0].libelle).toBe('caméra de surveillance');
    });

    /** Le nettoyage existe toujours — il a seulement changé de place. */
    it('c’est l’affichage qui nettoie', () => {
        expect(libelleLisible('  caméra de surveillance  ')).toBe('caméra de surveillance');
        expect(libelleLisible('   ')).toBeUndefined();
        expect(libelleLisible(undefined)).toBeUndefined();
    });

    /** ⚠️ La borne de longueur, elle, reste à l'écriture : le champ la montre. */
    it('borne toujours la longueur', () => {
        const long = 'x'.repeat(LIBELLE_MAXIMUM + 40);
        expect(enchainementLibelle(avecSortie(), 's2', long)?.enchainements?.[0].libelle)
            .toHaveLength(LIBELLE_MAXIMUM);
    });
});

describe('les deux sens de lecture', () => {
    const trois = [
        scene('s1', 1, { enchainements: [{ vers: 's2', libelle: 'si elle survit' }] }),
        scene('s2', 2),
        scene('s3', 3, { enchainements: [{ vers: 's2' }, { vers: 'disparue' }] }),
    ];

    it('les sorties rendent la scène cible, pas son identifiant', () => {
        expect(sortiesDeLaScene(trois, trois[0]))
            .toEqual([{ vers: trois[1], libelle: 'si elle survit' }]);
    });

    /** ⚠️ *Afficher « mène à » suivi de rien ferait chercher une scène disparue.* */
    it('une cible disparue n’est pas rendue, mais elle est signalable', () => {
        expect(sortiesDeLaScene(trois, trois[2]).map(s => s.vers.id)).toEqual(['s2']);
        expect(aUneSortieMorte(trois, trois[2])).toBe(true);
        expect(aUneSortieMorte(trois, trois[0])).toBe(false);
    });

    /** **Le sens inverse se déduit** : le stocker aurait fait deux écritures pour un lien. */
    it('dit d’où l’on peut arriver', () => {
        expect(entreesDeLaScene(trois, 's2')).toEqual([
            { depuis: trois[0], libelle: 'si elle survit' },
            { depuis: trois[2], libelle: undefined },
        ]);
        expect(entreesDeLaScene(trois, 's1')).toEqual([]);
    });
});

/**
 * ⛔ **Supprimer une scène doit effacer les flèches qui la visaient.**
 *
 * Sans ça, toutes celles qui y menaient gardent une sortie vers le vide, et le
 * meneur la lit comme valide jusqu'à cliquer. *La forme la plus courante du
 * défaut muet dans ce dépôt.*
 */
describe('recoudre après une suppression', () => {
    const quatre = [
        scene('s1', 1, { enchainements: [{ vers: 's2' }, { vers: 's3' }] }),
        scene('s2', 2, { enchainements: [{ vers: 's3' }] }),
        scene('s3', 3),
        scene('s4', 4),
    ];

    it('retire la cible disparue de ceux qui y menaient', () => {
        const aEcrire = enchainementsSansLesScenes(quatre, new Set(['s3']));

        expect(aEcrire).toEqual([
            { id: 's1', enchainements: [{ vers: 's2' }] },
            { id: 's2', enchainements: undefined },
        ]);
    });

    /** On ne réécrit que ce qui change : *un `git diff` de sauvegarde doit rester lisible.* */
    it('ne touche pas aux scènes qui n’y menaient pas', () => {
        expect(enchainementsSansLesScenes(quatre, new Set(['s4'])).map(e => e.id)).toEqual([]);
    });

    /** La cascade d'un acte emporte plusieurs scènes d'un coup. */
    it('encaisse plusieurs disparitions à la fois', () => {
        const aEcrire = enchainementsSansLesScenes(quatre, new Set(['s2', 's3']));
        expect(aEcrire).toEqual([{ id: 's1', enchainements: undefined }]);
    });
});

/**
 * ⛔ **Les suites arrivent à la tablette par leur TITRE.** Elle ne reçoit ni la
 * liste des scènes ni de quoi chercher un identifiant : lui envoyer `vers:
 * 'scene-17'` l'aurait obligée à afficher un identifiant, ou rien.
 *
 * ⭐ Et cet essai envoie des valeurs **qui ne sont pas les défauts** — la seule
 * forme qui distingue « transmis » de « jeté », la leçon du titre projeté.
 */
describe('les suites arrivent à la tablette', () => {
    const source = {
        actes: [acte('a1', 1)],
        scenes: [
            scene('s1', 1, { titre: 'Amarrage', enchainements: [
                { vers: 's2', libelle: 'si Hale accepte' },
                { vers: 'disparue' },
            ] }),
            scene('s2', 2, { titre: 'Entretien avec Hale' }),
        ],
    };

    it('transmet le titre de la cible et la condition', () => {
        const lue = segmentDeLecture('c1', source).actes[0].scenes[0];

        expect(lue.suites).toEqual([{ titre: 'Entretien avec Hale', libelle: 'si Hale accepte' }]);
    });

    it('et la clé existe même sans aucune suite', () => {
        const lue = segmentDeLecture('c1', source).actes[0].scenes[1];

        expect(lue.suites).toEqual([]);
        expect('suites' in lue, 'la clé doit exister, sinon rien ne dit qu’elle a été traitée').toBe(true);
    });
});
