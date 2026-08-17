import { describe, it, expect } from 'vitest';
import {
    actesOrdonnes, scenesOrdonnees, prochainOrdre, deplacer,
    remplissageDeLaScene, scenesEmportees, repartirLesScenesPrevues,
    etatDeLaScene, passageEnCours, closeSansAvoirEteJouee, scenesDansLEtat,
    ouvrirLaScene, suspendreLaScene, terminerLaScene, titreDisponible, clonerLaScene,
    suspendreLesScenes, reprendreLesScenes, scenesACloreAvecLActe,
} from './trame';
import type { Acte, Scene } from '../../../types/trame.types';

/**
 * Ce que ces tests protègent : **la trame se lit dans le même ordre partout**.
 *
 * Trois écrans liront cette structure — la trame elle-même, la Forge de
 * campagne, et plus tard la capture en séance. Trois lectures écrites
 * séparément finiraient par ne plus ranger les scènes pareil, et c'est le genre
 * d'écart qu'on ne voit qu'en pleine partie. Même raison que
 * `piloteDuPersonnage`.
 */

const acte = (id: string, campaignId: string, ordre: number): Acte =>
    ({ id, campaignId, ordre, titre: id, resume: '' });

const scene = (id: string, acteId: string, ordre: number, extra: Partial<Scene> = {}): Scene => ({
    id, campaignId: 'c1', acteId, ordre, titre: id, resume: '',
    origine: 'preparee', entiteIds: [], indiceIds: [], creeeLe: 0, ...extra,
});

describe('l\'ordre de la trame', () => {
    it('ne mélange pas deux campagnes qui partagent le tableau plat', () => {
        // Le store tient une seule liste, toutes campagnes confondues : une
        // insertion ailleurs ne doit pas réordonner celle qu'on regarde.
        const actes = [acte('b', 'c1', 1), acte('x', 'c2', 0), acte('a', 'c1', 0)];
        expect(actesOrdonnes(actes, 'c1').map(a => a.id)).toEqual(['a', 'b']);
        expect(actesOrdonnes(actes, 'c2').map(a => a.id)).toEqual(['x']);
    });

    it('sans campagne active, la trame est vide et non « tout »', () => {
        // Rendre l'ensemble ferait afficher les actes de toutes les campagnes
        // sur un écran qui promet celle qui est ouverte.
        expect(actesOrdonnes([acte('a', 'c1', 0)], null)).toEqual([]);
        expect(scenesOrdonnees([scene('s', 'a1', 0)], undefined)).toEqual([]);
    });

    it('le prochain rang suit le plus grand, pas le nombre d\'éléments', () => {
        // Après une suppression au milieu, les rangs ne sont plus contigus ;
        // compter les éléments produirait un doublon de rang.
        expect(prochainOrdre([{ ordre: 0 }, { ordre: 5 }])).toBe(6);
        expect(prochainOrdre([])).toBe(0);
    });
});

describe('deplacer — un échange, jamais une réécriture complète', () => {
    const ordonnes = [acte('a', 'c1', 0), acte('b', 'c1', 1), acte('c', 'c1', 2)];

    it('échange avec le voisin et ne touche que les deux', () => {
        expect(deplacer(ordonnes, 'b', 'haut')).toEqual([
            { id: 'b', ordre: 0 },
            { id: 'a', ordre: 1 },
        ]);
    });

    it('aux extrémités, rien ne bouge et rien n\'est signalé', () => {
        // Monter le premier acte n'est pas une erreur : c'est un geste sans
        // effet. Refuser bruyamment aurait fait clignoter l'écran sur un clic
        // parfaitement légitime.
        expect(deplacer(ordonnes, 'a', 'haut')).toEqual([]);
        expect(deplacer(ordonnes, 'c', 'bas')).toEqual([]);
    });

    it('un identifiant inconnu ne produit aucune écriture', () => {
        expect(deplacer(ordonnes, 'fantome', 'bas')).toEqual([]);
    });

    it('échange les RANGS et non les positions — les trous survivent', () => {
        const troue = [acte('a', 'c1', 0), acte('b', 'c1', 7)];
        expect(deplacer(troue, 'a', 'bas')).toEqual([
            { id: 'a', ordre: 7 },
            { id: 'b', ordre: 0 },
        ]);
    });
});

describe('remplissageDeLaScene — le taux remplace un second type d\'objet', () => {
    it('une scène née d\'un combat improvisé n\'a que son titre', () => {
        expect(remplissageDeLaScene(scene('s', 'a', 0, { origine: 'improvisee' }))).toBe(0);
    });

    it('une scène entièrement préparée atteint un', () => {
        const preparee = scene('s', 'a', 0, {
            resume: 'Les PJ cherchent le manifeste',
            lieuId: 'am-1',
            entiteIds: ['e-1'],
            indiceIds: ['clue-1'],
            momentDeStoryboardId: 'sm-1',
        });
        expect(remplissageDeLaScene(preparee)).toBe(1);
    });

    it('un résumé fait d\'espaces ne compte pas', () => {
        expect(remplissageDeLaScene(scene('s', 'a', 0, { resume: '   ' }))).toBe(0);
    });

    it('le taux ne dépend PAS de l\'origine déclarée', () => {
        /**
         * Une scène improvisée qu'on a retravaillée après la partie est une
         * scène complète, et l'écran doit le montrer. Lier le taux à l'origine
         * l'aurait figée dans son état de naissance — exactement ce que le
         * choix « un seul objet, pas deux types » cherchait à éviter.
         */
        const retravaillee = scene('s', 'a', 0, {
            origine: 'improvisee',
            resume: 'ce qui s\'y est joué',
            lieuId: 'am-1',
            entiteIds: ['e-1'],
        });
        expect(remplissageDeLaScene(retravaillee)).toBeCloseTo(3 / 5);
    });
});

describe('repartirLesScenesPrevues — la séance prévoit sans être enfermée', () => {
    const scenes = [
        scene('s1', 'a1', 1),
        scene('s2', 'a1', 0),
        scene('ailleurs', 'a2', 0),
    ];

    it('range les scènes prévues selon l\'acte annoncé, chacune dans son ordre', () => {
        const { deLActe, horsActe } = repartirLesScenesPrevues(scenes, 'a1', ['s1', 'ailleurs', 's2']);
        expect(deLActe.map(s => s.id), 'triées, pas dans l\'ordre de saisie').toEqual(['s2', 's1']);
        expect(horsActe.map(s => s.id)).toEqual(['ailleurs']);
    });

    it('une scène venue d\'un autre acte n\'est pas écartée', () => {
        /**
         * *« Ne pas imposer la linéarité. »* Une séance déborde sur l'acte
         * suivant, un groupe prend de l'avance. Changer l'acte d'une séance ne
         * doit rien effacer en silence : ce qui sort du cadre est montré à
         * part.
         */
        const { deLActe, horsActe } = repartirLesScenesPrevues(scenes, 'a2', ['s1', 'ailleurs']);
        expect(deLActe.map(s => s.id)).toEqual(['ailleurs']);
        expect(horsActe.map(s => s.id)).toEqual(['s1']);
    });

    it('sans acte annoncé, tout est hors acte — et rien n\'est perdu', () => {
        const { deLActe, horsActe } = repartirLesScenesPrevues(scenes, undefined, ['s1']);
        expect(deLActe).toEqual([]);
        expect(horsActe.map(s => s.id)).toEqual(['s1']);
    });

    it('compte les scènes disparues au lieu de les avaler', () => {
        // C'est le défaut du `.filter(r => r.targetId)` de la Forge de
        // chronique : ce qui ne se résout pas disparaît sans un mot. Ici le
        // nombre remonte à l'écran.
        const { introuvables } = repartirLesScenesPrevues(scenes, 'a1', ['s1', 'fantome', 'autre-fantome']);
        expect(introuvables).toBe(2);
    });

    it('une séance d\'avant la trame ne porte rien, et ce n\'est pas une erreur', () => {
        const { deLActe, horsActe, introuvables } = repartirLesScenesPrevues(scenes, 'a1', undefined);
        expect(deLActe).toEqual([]);
        expect(horsActe).toEqual([]);
        expect(introuvables).toBe(0);
    });
});

describe('scenesEmportees — la confirmation dit ce qu\'elle coûte', () => {
    it('rend les scènes de l\'acte, et elles seules', () => {
        const scenes = [scene('s1', 'a1', 0), scene('s2', 'a2', 0), scene('s3', 'a1', 1)];
        expect(scenesEmportees(scenes, 'a1').map(s => s.id)).toEqual(['s1', 's3']);
    });

    it('un acte sans scène n\'emporte rien', () => {
        expect(scenesEmportees([scene('s1', 'a1', 0)], 'a2')).toEqual([]);
    });
});

/**
 * Ce que ces tests protègent : **les quatre états d'une scène sont dérivés, et
 * jamais stockés**.
 *
 * Le modèle est né le 2026-08-17 d'un constat de David : il déclarait son acte
 * et ses scènes en préparation, lançait la séance, et ne les retrouvait nulle
 * part — `PanneauDeTrameDeSeance` n'était monté que dans l'écran de préparation.
 *
 * La nuance qui a coûté le plus de discussion est **« en pause »** : une séance
 * qui s'arrête ne termine pas ses scènes, elle les suspend. Les confondre
 * barrerait en fin de soirée des scènes que le groupe reprendra la semaine
 * suivante.
 */
describe('les quatre états d\'une scène', () => {
    it('sans passage ni clôture : prévue', () => {
        expect(etatDeLaScene(scene('s', 'a', 0))).toBe('prevue');
    });

    it('un passage ouvert : en cours', () => {
        const s = ouvrirLaScene(scene('s', 'a', 0), 100);
        expect(etatDeLaScene(s)).toBe('en-cours');
        expect(passageEnCours(s)).toEqual({ debut: 100 });
    });

    it('un passage clos, sans clôture de la scène : en pause', () => {
        const s = suspendreLaScene(ouvrirLaScene(scene('s', 'a', 0), 100), 200);
        expect(etatDeLaScene(s)).toBe('en-pause');
        expect(passageEnCours(s)).toBeUndefined();
    });

    it('terminée l\'emporte sur tout le reste', () => {
        const s = terminerLaScene(ouvrirLaScene(scene('s', 'a', 0), 100), 200);
        expect(etatDeLaScene(s)).toBe('terminee');
        expect(s.passages).toEqual([{ debut: 100, fin: 200 }]);
    });

    it('une scène d\'avant le 2026-08-17 se lit quand même', () => {
        // Les 29 scènes du « Secret de Milo » sont dans ce cas : `passages` est
        // absent, pas vide. Un lecteur qui ne s'en protégerait pas planterait
        // sur la première campagne existante.
        const ancienne = scene('s', 'a', 0);
        expect(ancienne.passages).toBeUndefined();
        expect(etatDeLaScene(ancienne)).toBe('prevue');
        expect(passageEnCours(ancienne)).toBeUndefined();
    });
});

describe('les passages s\'empilent — c\'est pour le journal', () => {
    /**
     * Décision de David, contre le modèle simple à deux dates : une scène
     * reprise perdrait son premier passage, et *le journal ne saurait plus
     * rattacher ce qui s'y est dit ce soir-là*.
     */
    it('reprendre une scène en pause ajoute un passage sans effacer le premier', () => {
        let s = ouvrirLaScene(scene('s', 'a', 0), 100, 'seance-1');
        s = suspendreLaScene(s, 200);
        s = ouvrirLaScene(s, 300, 'seance-2');

        expect(s.passages).toEqual([
            { debut: 100, fin: 200, seanceId: 'seance-1' },
            { debut: 300, seanceId: 'seance-2' },
        ]);
        expect(etatDeLaScene(s)).toBe('en-cours');
    });

    it('ouvrir une scène déjà ouverte ne fait rien', () => {
        // Deux passages ouverts n'auraient aucun sens : lequel serait le bon ?
        const s = ouvrirLaScene(scene('s', 'a', 0), 100);
        expect(ouvrirLaScene(s, 500)).toBe(s);
    });

    it('suspendre une scène qui ne tourne pas est un geste sans effet', () => {
        const prevue = scene('s', 'a', 0);
        expect(suspendreLaScene(prevue, 500)).toBe(prevue);
    });

    it('rouvrir une scène terminée la ranime — c\'est un geste explicite', () => {
        const close = terminerLaScene(ouvrirLaScene(scene('s', 'a', 0), 100), 200);
        const ranimee = ouvrirLaScene(close, 300);
        expect(ranimee.termineeLe).toBeUndefined();
        expect(etatDeLaScene(ranimee)).toBe('en-cours');
        expect(ranimee.passages).toHaveLength(2);
    });
});

describe('close sans avoir été jouée', () => {
    /**
     * L'acte s'achève et emporte ses scènes, dont celles où le groupe n'est
     * jamais passé. Les confondre avec du vécu ferait croire à une partie qui
     * n'a pas eu lieu — et le journal les lirait comme telle.
     */
    it('terminée sans aucun passage : jamais jouée', () => {
        const s = terminerLaScene(scene('s', 'a', 0), 500);
        expect(closeSansAvoirEteJouee(s)).toBe(true);
        expect(s.passages ?? []).toEqual([]);
    });

    it('terminée après avoir été jouée : non', () => {
        const s = terminerLaScene(ouvrirLaScene(scene('s', 'a', 0), 100), 200);
        expect(closeSansAvoirEteJouee(s)).toBe(false);
    });

    it('une scène encore ouverte n\'est close de rien', () => {
        expect(closeSansAvoirEteJouee(ouvrirLaScene(scene('s', 'a', 0), 100))).toBe(false);
    });
});

describe('le passage d\'une séance à l\'autre', () => {
    const troisScenes = () => [
        ouvrirLaScene(scene('ouverte', 'a1', 0), 100, 'seance-1'),
        scene('jamais', 'a1', 1),
        terminerLaScene(ouvrirLaScene(scene('close', 'a1', 2), 50), 60),
    ];

    it('la séance s\'arrête : les scènes en cours passent en PAUSE, pas terminées', () => {
        const apres = suspendreLesScenes(troisScenes(), 'c1', 999);
        expect(apres.map(etatDeLaScene)).toEqual(['en-pause', 'prevue', 'terminee']);
        // La distinction est tout le sujet : rien n'a été barré ce soir.
        expect(apres[0].termineeLe).toBeUndefined();
    });

    it('la séance suivante s\'ouvre : seules les scènes en pause repartent', () => {
        const enPause = suspendreLesScenes(troisScenes(), 'c1', 999);
        const apres = reprendreLesScenes(enPause, 'c1', 'seance-2', 1000);

        expect(apres.map(etatDeLaScene)).toEqual(['en-cours', 'prevue', 'terminee']);
        expect(apres[0].passages).toEqual([
            { debut: 100, fin: 999, seanceId: 'seance-1' },
            { debut: 1000, seanceId: 'seance-2' },
        ]);
        // Une scène jamais ouverte ne s'ouvre pas toute seule, et une scène
        // close ne ressuscite pas : la reprise ne concerne que la pause.
        expect(apres[1].passages).toBeUndefined();
        expect(apres[2].termineeLe).toBe(60);
    });

    it('une autre campagne n\'est jamais touchée', () => {
        const ailleurs = ouvrirLaScene({ ...scene('voisine', 'a9', 0), campaignId: 'c2' }, 100);
        const apres = suspendreLesScenes([ailleurs], 'c1', 999);
        expect(apres[0]).toBe(ailleurs);
    });
});

describe('cloner une scène', () => {
    /**
     * **Le titre ne peut pas être repris tel quel.** La Forge de campagne résout
     * ses renvois PAR NOM, et sa règle est qu'un ex æquo ne résout rien : deux
     * scènes homonymes feraient échouer en silence tout renvoi qui les vise.
     */
    it('numérote le clone, et n\'empile pas les suffixes', () => {
        expect(titreDisponible('Le réveil', [])).toBe('Le réveil (2)');
        expect(titreDisponible('Le réveil', ['Le réveil (2)'])).toBe('Le réveil (3)');
        expect(titreDisponible('Le réveil (2)', ['Le réveil (2)'])).toBe('Le réveil (3)');
    });

    it('copie le contenu et repart d\'un état vierge', () => {
        const source = terminerLaScene(
            ouvrirLaScene(scene('s', 'a1', 3, {
                resume: 'On y trouve un carnet',
                lieuId: 'lieu-7',
                entiteIds: ['pnj-1'],
                indiceIds: ['indice-2'],
                momentDeStoryboardId: 'moment-3',
                origine: 'improvisee',
            }), 100), 200);

        const clone = clonerLaScene(source, 'neuf', 'Le réveil (2)', 4, 900);

        expect(clone.resume).toBe('On y trouve un carnet');
        expect(clone.lieuId).toBe('lieu-7');
        expect(clone.entiteIds).toEqual(['pnj-1']);
        expect(clone.indiceIds).toEqual(['indice-2']);
        expect(clone.momentDeStoryboardId).toBe('moment-3');
        // L'origine se transmet : un clone descend de la même nature.
        expect(clone.origine).toBe('improvisee');

        // Mais rien du vécu ne se copie — sinon le journal attribuerait au clone
        // une soirée qu'il n'a pas connue.
        expect(clone.id).toBe('neuf');
        expect(etatDeLaScene(clone)).toBe('prevue');
        expect(clone.passages).toBeUndefined();
        expect(clone.termineeLe).toBeUndefined();
        expect(clone.creeeLe).toBe(900);
    });
});

describe('scenesACloreAvecLActe — la cascade se dit avant', () => {
    it('sépare ce qui tourne de ce qui n\'a jamais été joué', () => {
        const scenes = [
            ouvrirLaScene(scene('ouverte', 'a1', 0), 100),
            scene('jamais', 'a1', 1),
            suspendreLaScene(ouvrirLaScene(scene('pause', 'a1', 2), 10), 20),
            terminerLaScene(scene('deja-close', 'a1', 3), 5),
            scene('autre-acte', 'a2', 0),
        ];
        const bilan = scenesACloreAvecLActe(scenes, 'a1');

        expect(bilan.total).toBe(3);
        expect(bilan.enCours.map(s => s.id)).toEqual(['ouverte']);
        expect(bilan.jamaisJouees.map(s => s.id)).toEqual(['jamais']);
    });
});

describe('scenesDansLEtat — l\'ordre des actes puis des scènes', () => {
    it('range les scènes en cours dans l\'ordre de lecture de la campagne', () => {
        const actes = [acte('a2', 'c1', 1), acte('a1', 'c1', 0)];
        const scenes = [
            ouvrirLaScene(scene('deuxieme-acte', 'a2', 0), 100),
            ouvrirLaScene(scene('premier-acte-b', 'a1', 1), 100),
            ouvrirLaScene(scene('premier-acte-a', 'a1', 0), 100),
            scene('pas-ouverte', 'a1', 2),
        ];
        expect(scenesDansLEtat(scenes, actes, 'c1', 'en-cours').map(s => s.id))
            .toEqual(['premier-acte-a', 'premier-acte-b', 'deuxieme-acte']);
    });
});

describe('les personnages présents', () => {
    /**
     * **Le champ sans lequel les scènes simultanées ne servent à rien.** Deux
     * scènes ouvertes décrivent un groupe séparé — encore faut-il savoir qui est
     * où, et c'est la seule chose que le meneur relise à ce moment-là.
     */
    it('n\'entre PAS dans le taux de préparation', () => {
        /*
          Qui est présent est un fait de partie, pas un élément qu'on prépare.
          Le compter ferait chuter la pastille de toutes les scènes déjà
          écrites — les 29 du « Secret de Milo » passeraient de 100 % à 83 % —
          et pour une raison fausse.
        */
        const preparee = scene('s', 'a', 0, {
            resume: 'Les PJ cherchent le manifeste',
            lieuId: 'am-1',
            entiteIds: ['e-1'],
            indiceIds: ['clue-1'],
            momentDeStoryboardId: 'sm-1',
        });
        expect(remplissageDeLaScene(preparee)).toBe(1);
        expect(remplissageDeLaScene({ ...preparee, personnagesIds: [] })).toBe(1);
        expect(remplissageDeLaScene({ ...preparee, personnagesIds: ['pj-1'] })).toBe(1);
    });

    it('une scène d\'avant le champ n\'en porte pas, et se lit quand même', () => {
        const ancienne = scene('s', 'a', 0);
        expect(ancienne.personnagesIds).toBeUndefined();
        expect(ancienne.personnagesIds ?? []).toEqual([]);
    });

    it('le clone emmène les présents avec le reste du contenu', () => {
        // Cloner sert à rejouer une scène ailleurs ou plus tard : sa
        // distribution fait partie de ce qu'on recopie, au même titre que ses
        // PNJ. Seul le VÉCU repart à zéro.
        const source = scene('s', 'a1', 3, { personnagesIds: ['pj-1', 'pj-2'] });
        const clone = clonerLaScene(source, 'neuf', 'S (2)', 4, 900);
        expect(clone.personnagesIds).toEqual(['pj-1', 'pj-2']);
        expect(clone.passages).toBeUndefined();
    });
});
