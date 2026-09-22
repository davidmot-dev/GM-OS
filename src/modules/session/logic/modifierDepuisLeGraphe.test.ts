import { describe, it, expect } from 'vitest';
import { placerLaSceneApres, scenesOrdonnees } from './trame';
import { renvoiEcrit, coupleDeRenvoi, CHAMP_DU_RENVOI, idDuNoeud } from './grapheDeLaTrame';
import type { Scene } from '../../../types/trame.types';

/**
 * **Modifier la trame depuis le graphe** — demandé par David le 2026-09-22 :
 * *« le graphe fonctionne bien, mais je voudrais pouvoir le modifier ».*
 *
 * ⭐ **Ce que ces essais protègent : qu'il n'y ait toujours qu'UN écrivain.** Le
 * graphe n'a pas sa propre logique de trame — il calcule ce qu'il faut écrire ici,
 * puis appelle `modifierScene`, exactement comme les cases à cocher de la fiche.
 * *Deux chemins d'écriture sur le même champ finissent par ne plus écrire la même
 * chose, et personne ne le voit, puisque chaque écran reste cohérent avec
 * lui-même.*
 */

const scene = (id: string, ordre: number, extra: Partial<Scene> = {}): Scene => ({
    id, campaignId: 'c1', acteId: 'a1', ordre, titre: id, resume: '',
    origine: 'preparee', entiteIds: [], indiceIds: [], creeeLe: 1_000, ...extra,
});

/* ─────────────────────────────────────────────
   RELIER ET DÉLIER
   ───────────────────────────────────────────── */

describe('relier une scène à un nœud annexe', () => {
    it('ajoute un PNJ sans perdre les autres', () => {
        const s = scene('s1', 1, { entiteIds: ['e1'] });
        expect(renvoiEcrit(s, 'pnj', 'e2', true)?.updates).toEqual({ entiteIds: ['e1', 'e2'] });
    });

    it('retire un PNJ sans toucher aux autres', () => {
        const s = scene('s1', 1, { entiteIds: ['e1', 'e2'] });
        expect(renvoiEcrit(s, 'pnj', 'e1', false)?.updates).toEqual({ entiteIds: ['e2'] });
    });

    /** *Un geste sans effet n'est pas une erreur, mais il ne doit rien écrire.* */
    it('n’écrit rien quand le lien existe déjà, ou n’a jamais existé', () => {
        const s = scene('s1', 1, { entiteIds: ['e1'] });
        expect(renvoiEcrit(s, 'pnj', 'e1', true)).toBeNull();
        expect(renvoiEcrit(s, 'pnj', 'e9', false)).toBeNull();
        expect(renvoiEcrit(scene('s1', 1), 'lieu', 'l1', false)).toBeNull();
    });

    it('pose le lieu et l’ambiance, qui sont uniques', () => {
        expect(renvoiEcrit(scene('s1', 1), 'lieu', 'l1', true)?.updates).toEqual({ lieuId: 'l1' });
        expect(renvoiEcrit(scene('s1', 1), 'ambiance', 'm1', true)?.updates)
            .toEqual({ momentDeStoryboardId: 'm1' });
    });

    /**
     * ⚠️ **Relier un second lieu REMPLACE le premier, et il faut le dire.** Une
     * scène n'a qu'un lieu. *Un renvoi qui disparaît sans un mot ressemble à un
     * geste qui a échoué* — et le meneur relierait deux fois.
     */
    it('annonce le remplacement d’un renvoi unique', () => {
        const ecrit = renvoiEcrit(scene('s1', 1, { lieuId: 'l1' }), 'lieu', 'l2', true);

        expect(ecrit?.updates).toEqual({ lieuId: 'l2' });
        expect(ecrit?.remplace, 'le remplacement doit être annonçable').toBe(true);
    });

    it('ne prétend pas remplacer quand il n’y avait rien', () => {
        expect(renvoiEcrit(scene('s1', 1), 'lieu', 'l1', true)?.remplace).toBe(false);
        expect(renvoiEcrit(scene('s1', 1), 'pnj', 'e1', true)?.remplace).toBe(false);
    });

    it('délie un lieu, mais seulement celui qui est posé', () => {
        const s = scene('s1', 1, { lieuId: 'l1' });
        expect(renvoiEcrit(s, 'lieu', 'l1', false)?.updates).toEqual({ lieuId: undefined });
        expect(renvoiEcrit(s, 'lieu', 'l2', false), 'délier un autre lieu ne doit rien faire').toBeNull();
    });

    /**
     * ⛔ **La structure ne se relie pas à la main.** L'appartenance vient de
     * `acteId`, la suite de `ordre` : les écrire ici aurait créé **deux vérités**
     * sur la structure de la trame.
     */
    it('refuse tout ce qui n’est pas un renvoi', () => {
        expect(renvoiEcrit(scene('s1', 1), 'acte', 'a1', true)).toBeNull();
        expect(renvoiEcrit(scene('s1', 1), 'scene', 's2', true)).toBeNull();
    });

    it('chaque renvoi déclaré a bien son champ dans la scène', () => {
        for (const [type, cible] of Object.entries(CHAMP_DU_RENVOI)) {
            const ecrit = renvoiEcrit(scene('s1', 1), type as never, 'x1', true);
            expect(ecrit, `${type} ne sait pas s’écrire`).not.toBeNull();
            expect(Object.keys(ecrit!.updates)).toEqual([cible!.champ]);
        }
    });
});

/**
 * **Quel sens a le geste du meneur.**
 *
 * *On accepte les deux sens* — du PNJ vers la scène comme de la scène vers le
 * PNJ : exiger un sens sur une toile où rien ne l'indique ferait échouer un geste
 * sur deux sans dire pourquoi.
 */
describe('le couple désigné par un glisser', () => {
    const n = (type: string, refId: string) => ({ type: type as never, refId });

    it('reconnaît les deux sens', () => {
        expect(coupleDeRenvoi(n('scene', 's1'), n('pnj', 'e1')))
            .toEqual({ sceneId: 's1', type: 'pnj', refId: 'e1' });
        expect(coupleDeRenvoi(n('pnj', 'e1'), n('scene', 's1')))
            .toEqual({ sceneId: 's1', type: 'pnj', refId: 'e1' });
    });

    it('refuse deux scènes, deux annexes, et la structure', () => {
        expect(coupleDeRenvoi(n('scene', 's1'), n('scene', 's2'))).toBeNull();
        expect(coupleDeRenvoi(n('pnj', 'e1'), n('lieu', 'l1'))).toBeNull();
        expect(coupleDeRenvoi(n('scene', 's1'), n('acte', 'a1'))).toBeNull();
    });
});

/* ─────────────────────────────────────────────
   RÉORGANISER — glisser une scène sur une autre
   ───────────────────────────────────────────── */

/**
 * ⭐ **Un rang intercalaire, et pas une renumérotation.** C'est la règle que
 * `deplacer` avait déjà posée dans ce fichier : *réécrire tous les rangs à chaque
 * déplacement ferait diverger deux campagnes qui partagent le même tableau plat,
 * et rendrait un `git diff` de sauvegarde illisible.*
 */
describe('poser une scène juste après une autre', () => {
    /** L'ordre effectif après application des écritures — ce que l'écran montrera. */
    const ordreApres = (scenes: Scene[], sceneId: string, cibleId: string, acteId = 'a1') => {
        const aEcrire = placerLaSceneApres(scenes, sceneId, cibleId);
        const apres = scenes.map(s => {
            const maj = aEcrire.find(e => e.id === s.id);
            return maj ? { ...s, ordre: maj.ordre, acteId: maj.acteId ?? s.acteId } : s;
        });
        return scenesOrdonnees(apres, acteId).map(s => s.id);
    };

    const trois = () => [scene('s1', 0), scene('s2', 1), scene('s3', 2)];

    it('intercale sans toucher aux autres scènes', () => {
        const aEcrire = placerLaSceneApres(trois(), 's3', 's1');

        expect(aEcrire, 'une seule scène doit être réécrite').toHaveLength(1);
        expect(aEcrire[0].id).toBe('s3');
        expect(ordreApres(trois(), 's3', 's1')).toEqual(['s1', 's3', 's2']);
    });

    it('sait poser en dernier', () => {
        expect(ordreApres(trois(), 's1', 's3')).toEqual(['s2', 's3', 's1']);
    });

    /**
     * ⚠️ **La scène déplacée est retirée du calcul de ses voisins.** Sinon elle
     * serait son propre voisin, et l'écart mesuré serait celui qu'elle occupe
     * déjà — le glisser sur la scène juste avant elle n'aurait aucun effet.
     */
    it('déplacer une scène sur celle qui la précède la laisse en place', () => {
        expect(ordreApres(trois(), 's2', 's1')).toEqual(['s1', 's2', 's3']);
    });

    it('un geste sans effet n’écrit rien plutôt que d’échouer', () => {
        expect(placerLaSceneApres(trois(), 's1', 's1')).toEqual([]);
        expect(placerLaSceneApres(trois(), 's1', 'inconnue')).toEqual([]);
        expect(placerLaSceneApres(trois(), 'inconnue', 's1')).toEqual([]);
    });

    /** Glisser une scène sur une scène d'un AUTRE acte l'y fait entrer. */
    it('change d’acte quand la cible est ailleurs', () => {
        const scenes = [
            scene('s1', 0), scene('s2', 1),
            scene('t1', 0, { acteId: 'a2' }), scene('t2', 1, { acteId: 'a2' }),
        ];
        const aEcrire = placerLaSceneApres(scenes, 's1', 't1');

        expect(aEcrire[0]).toMatchObject({ id: 's1', acteId: 'a2' });
        expect(ordreApres(scenes, 's1', 't1', 'a2')).toEqual(['t1', 's1', 't2']);
        expect(ordreApres(scenes, 's1', 't1', 'a1'), 'elle quitte son acte').toEqual(['s2']);
    });

    it('n’annonce pas de changement d’acte quand il n’y en a pas', () => {
        expect(placerLaSceneApres(trois(), 's3', 's1')[0].acteId).toBeUndefined();
    });

    /**
     * ⚠️ **Le repli quand il n'y a plus de place entre deux rangs.** Intercaler au
     * même endroit divise l'écart par deux à chaque fois ; à un moment, il n'y a
     * plus de nombre entre les deux. On renumérote alors **l'acte de destination
     * seul**. *Un compromis qui ne dit pas quand il cesse de tenir est un défaut à
     * retardement.*
     */
    it('renumérote l’acte quand l’écart est épuisé', () => {
        const serrees = [scene('s1', 0), scene('s2', 1e-9), scene('s3', 5)];
        const aEcrire = placerLaSceneApres(serrees, 's3', 's1');

        expect(aEcrire.length, 'le repli doit réécrire tout l’acte').toBe(3);
        expect(ordreApres(serrees, 's3', 's1')).toEqual(['s1', 's3', 's2']);
        /* Et les rangs redeviennent francs, sinon le repli ne servirait qu'une fois. */
        for (const ecrit of aEcrire) expect(Number.isInteger(ecrit.ordre)).toBe(true);
    });

    /** Deux insertions d'affilée au même endroit tiennent toujours l'ordre. */
    it('reste juste après plusieurs intercalations', () => {
        let scenes = trois();
        for (const [quoi, ou] of [['s3', 's1'], ['s2', 's1']] as const) {
            const aEcrire = placerLaSceneApres(scenes, quoi, ou);
            scenes = scenes.map(s => {
                const maj = aEcrire.find(e => e.id === s.id);
                return maj ? { ...s, ordre: maj.ordre } : s;
            });
        }
        expect(scenesOrdonnees(scenes, 'a1').map(s => s.id)).toEqual(['s1', 's2', 's3']);
    });
});

/**
 * ⭐ **Les identifiants du graphe restent préfixés par leur type.** Le panneau
 * écrit sur `refId`, jamais sur `id` : *appeler `modifierScene('scene:s1')`
 * n'échouerait pas, il ne trouverait simplement aucune scène — en silence.*
 */
describe('l’identifiant de graphe n’est pas celui de l’objet', () => {
    it('se distinguent', () => {
        expect(idDuNoeud('scene', 's1')).toBe('scene:s1');
        expect(idDuNoeud('scene', 's1')).not.toBe('s1');
    });
});
