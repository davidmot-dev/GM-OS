import { describe, it, expect, beforeEach } from 'vitest';
import { fusionnerLesScenes, secondeMoitieDeLaScene } from './trame';
import { useSessionOSStore } from '../useSessionOSStore';
import { useJournalStore } from '../../journal/useJournalStore';
import { preparerLaRevue } from '../../journal/curation';
import type { Scene } from '../../../types/trame.types';

/**
 * **Fusionner et scinder — ce que ces tests protègent : rien ne se perd.**
 *
 * Les deux derniers gestes du § 4.1 du plan du 2026-08-08. Leur mode de
 * défaillance est celui de tout le module : *une curation ratée fausse tout ce
 * qui en découle*, et un champ oublié par une fusion ne se voit pas — la scène
 * survivante a l'air complète, simplement amputée de ce que l'autre portait.
 *
 * Le second bloc tient la moitié qui n'est pas dans la trame : **les événements
 * suivent**. Une fusion qui oublierait le journal laisserait des orphelins qui
 * reviendraient « à ranger » à la revue suivante — c'est-à-dire exactement le
 * travail qu'on venait de faire.
 */

const scene = (id: string, ordre: number, extra: Partial<Scene> = {}): Scene => ({
    id, campaignId: 'c1', acteId: 'acte1', ordre, titre: id, resume: '',
    origine: 'preparee', entiteIds: [], indiceIds: [], creeeLe: 0, ...extra,
});

describe('fusionner deux scenes qui n\'en faisaient qu\'une', () => {
    it('reunit les listes plutot que d\'ecraser celles de la gardee', () => {
        const f = fusionnerLesScenes(
            scene('a', 0, { entiteIds: ['pnj1'], indiceIds: ['i1'], personnagesIds: ['pj1'] }),
            scene('b', 1, { entiteIds: ['pnj2', 'pnj1'], indiceIds: ['i2'], personnagesIds: ['pj2'] }),
        );

        expect(f.entiteIds).toEqual(['pnj1', 'pnj2']);  // sans doublon
        expect(f.indiceIds).toEqual(['i1', 'i2']);
        expect(f.personnagesIds).toEqual(['pj1', 'pj2']);
    });

    it('accole les resumes au lieu d\'en perdre un', () => {
        const f = fusionnerLesScenes(
            scene('a', 0, { resume: 'Le garde hesite.' }),
            scene('b', 1, { resume: 'Puis il cede.' }),
        );

        expect(f.resume).toBe('Le garde hesite.\n\nPuis il cede.');
    });

    it('ne repete pas un resume recopie a l\'identique', () => {
        // Deux scenes qui n'en faisaient qu'une portent souvent le meme texte.
        const f = fusionnerLesScenes(
            scene('a', 0, { resume: 'Le garde cede.' }),
            scene('b', 1, { resume: 'Le garde cede.' }),
        );

        expect(f.resume).toBe('Le garde cede.');
    });

    it('recolle les passages dans l\'ordre du temps', () => {
        const f = fusionnerLesScenes(
            scene('a', 0, { passages: [{ debut: 300, fin: 400 }] }),
            scene('b', 1, { passages: [{ debut: 100, fin: 200 }] }),
        );

        expect(f.passages?.map(p => p.debut)).toEqual([100, 300]);
    });

    it('n\'est terminee que si les DEUX l\'etaient, et a la plus tardive', () => {
        const f = fusionnerLesScenes(
            scene('a', 0, { termineeLe: 100 }),
            scene('b', 1, { termineeLe: 500 }),
        );

        expect(f.termineeLe).toBe(500);
    });

    it('absorber une scene EN COURS rouvre la fusionnee', () => {
        // Sinon la fusion fermerait un passage que personne n'a ferme : la
        // partie continue, et la scene se retrouverait barree en pleine seance.
        const f = fusionnerLesScenes(
            scene('a', 0, { termineeLe: 100 }),
            scene('b', 1, { passages: [{ debut: 200 }] }),
        );

        expect(f.termineeLe).toBeUndefined();
    });

    it('recule la date de creation au plus ancien', () => {
        const f = fusionnerLesScenes(scene('a', 0, { creeeLe: 500 }), scene('b', 1, { creeeLe: 100 }));

        expect(f.creeeLe).toBe(100);
    });

    it('le lieu de la gardee l\'emporte, celui de l\'absorbee ne comble qu\'un vide', () => {
        const choisi = fusionnerLesScenes(
            scene('a', 0, { lieuId: 'entrepot' }), scene('b', 1, { lieuId: 'serre' }),
        );
        const comble = fusionnerLesScenes(scene('a', 0), scene('b', 1, { lieuId: 'serre' }));

        expect(choisi.lieuId).toBe('entrepot');
        expect(comble.lieuId).toBe('serre');
    });

    it('garde l\'identite de la gardee — c\'est elle qui survit', () => {
        const f = fusionnerLesScenes(
            scene('a', 3, { titre: 'L\'entrepot' }),
            { ...scene('b', 0, { titre: 'Le quai' }), acteId: 'acte2' },
        );

        expect(f.id).toBe('a');
        expect(f.titre).toBe('L\'entrepot');
        expect(f.acteId).toBe('acte1');
        expect(f.ordre).toBe(3);
    });
});

describe('scinder celle qui en cachait deux', () => {
    const source = scene('s', 2, {
        titre: 'L\'entrepot', resume: 'Tout un bloc.', notesDuMeneur: 'Le garde est corrompu.',
        lieuId: 'entrepot', entiteIds: ['pnj1'], indiceIds: ['i1'], personnagesIds: ['pj1'],
        passages: [{ debut: 100, fin: 200 }], creeeLe: 50,
    });

    it('la seconde moitie herite du decor — c\'est le meme moment qu\'on coupe', () => {
        const m = secondeMoitieDeLaScene(source, 's2', 'L\'entrepot (2)', 3, 999);

        expect(m.acteId).toBe('acte1');
        expect(m.lieuId).toBe('entrepot');
        expect(m.entiteIds).toEqual(['pnj1']);
        expect(m.personnagesIds).toEqual(['pj1']);
        expect(m.indiceIds).toEqual(['i1']);
    });

    it('mais pas du resume ni des notes : les recopier ferait deux textes dont un faux', () => {
        const m = secondeMoitieDeLaScene(source, 's2', 'x', 3, 999);

        expect(m.resume).toBe('');
        expect(m.notesDuMeneur).toBeUndefined();
    });

    it('ni des passages : le parcours reel n\'est pas duplicable', () => {
        const m = secondeMoitieDeLaScene(source, 's2', 'x', 3, 999);

        expect(m.passages).toBeUndefined();
        expect(m.creeeLe).toBe(999);
    });

    it('scinder une scene mise de cote rend une moitie a juger', () => {
        const m = secondeMoitieDeLaScene({ ...source, ecarteeDeLaChronique: true }, 's2', 'x', 3, 999);

        expect(m.ecarteeDeLaChronique).toBeUndefined();
    });

    it('couper en deux ce qui est joue ne rouvre rien', () => {
        const m = secondeMoitieDeLaScene({ ...source, termineeLe: 400 }, 's2', 'x', 3, 999);

        expect(m.termineeLe).toBe(400);
    });

    it('les listes sont COPIEES, jamais partagees avec l\'originale', () => {
        // Un tableau partage ferait qu'ajouter un PNJ a une moitie l'ajouterait
        // a l'autre — invisible tant qu'on ne modifie pas, faux des qu'on le fait.
        const m = secondeMoitieDeLaScene(source, 's2', 'x', 3, 999);
        m.entiteIds.push('pnj2');

        expect(source.entiteIds).toEqual(['pnj1']);
    });
});

/* ─────────────────────────────────────────────
   LA MOITIÉ QUI N'EST PAS DANS LA TRAME : LES ÉVÉNEMENTS SUIVENT
   ───────────────────────────────────────────── */

const magasin = () => useSessionOSStore.getState();
const journal = () => useJournalStore.getState();

/**
 * Les événements que CE test a posés, du plus ancien au plus récent.
 *
 * `startJournal` dépose sa propre ouverture, sans scène : la compter ferait
 * passer chaque assertion pour un orphelin de plus. On ne regarde donc que ce
 * qu'on a écrit soi-même.
 */
const poses: string[] = [];

const evenementsDe = () =>
    journal().journals[0].events
        .filter(e => poses.includes(e.id))
        .sort((a, b) => a.timestamp - b.timestamp);

const poser = (titre: string, sceneId: string | undefined, timestamp: number) => {
    journal().addEvent({ type: 'NOTE', title: titre, content: '', sceneId });
    // `addEvent` horodate au présent : on impose le temps pour tenir la coupure.
    const pose = journal().journals[0].events.find(e => e.title === titre)!;
    journal().updateEvent(journal().journals[0].id, pose.id, { timestamp });
    poses.push(pose.id);
};

beforeEach(() => {
    poses.length = 0;
    journal().clearJournal();
    journal().startJournal({ id: 'c1', nom: 'Hadley Hope' }, 'Séance 1');
    useSessionOSStore.setState({
        actes: [{ id: 'acte1', campaignId: 'c1', ordre: 0, titre: 'Acte I', resume: '' }],
        scenes: [scene('s1', 0, { titre: 'L\'entrepot' }), scene('s2', 1, { titre: 'Le quai' }), scene('s3', 2)],
        sessions: [],
        activeCampaignId: 'c1',
    });
});

describe('la fusion emmene les evenements avec elle', () => {
    it('ceux de l\'absorbee rejoignent la gardee', () => {
        poser('e1', 's1', 100);
        poser('e2', 's2', 200);

        const deplaces = magasin().fusionnerDeuxScenes('s1', 's2');

        expect(deplaces).toBe(1);
        expect(evenementsDe().map(e => e.sceneId)).toEqual(['s1', 's1']);
    });

    it('l\'absorbee disparait de la trame, la gardee reste', () => {
        magasin().fusionnerDeuxScenes('s1', 's2');

        expect(magasin().scenes.map(s => s.id)).toEqual(['s1', 's3']);
    });

    it('les rangs se resserrent derriere elle', () => {
        magasin().fusionnerDeuxScenes('s1', 's2');

        expect(magasin().scenes.find(s => s.id === 's3')?.ordre).toBe(1);
    });

    it('une seance qui prevoyait l\'absorbee prevoit desormais la gardee', () => {
        useSessionOSStore.setState({
            sessions: [{
                id: 'se1', campaignId: 'c1', title: 'S1', date: '', status: 'planned',
                scenesPrevuesIds: ['s2', 's3'],
            } as never],
        });

        magasin().fusionnerDeuxScenes('s1', 's2');

        expect(magasin().sessions[0].scenesPrevuesIds).toEqual(['s1', 's3']);
    });

    it('et sans doublon quand elle prevoyait deja les deux', () => {
        useSessionOSStore.setState({
            sessions: [{
                id: 'se1', campaignId: 'c1', title: 'S1', date: '', status: 'planned',
                scenesPrevuesIds: ['s1', 's2'],
            } as never],
        });

        magasin().fusionnerDeuxScenes('s1', 's2');

        expect(magasin().sessions[0].scenesPrevuesIds).toEqual(['s1']);
    });

    it('aucun orphelin ne revient a la revue suivante', () => {
        // Le defaut qu'on evite : des evenements pointant sur une scene disparue
        // reapparaitraient « a ranger », c'est-a-dire le travail qu'on vient de faire.
        poser('e1', 's2', 100);
        magasin().fusionnerDeuxScenes('s1', 's2');

        const revue = preparerLaRevue(journal().journals[0].events, magasin().scenes, magasin().actes, 'c1');
        expect(revue.sansScene.filter(e => e.title === 'e1')).toHaveLength(0);
    });

    it('refuse une scene avec elle-meme, et n\'ecrit rien', () => {
        expect(magasin().fusionnerDeuxScenes('s1', 's1')).toBeNull();
        expect(magasin().scenes).toHaveLength(3);
    });

    it('refuse deux campagnes differentes — melanger deux histoires ne se verrait jamais', () => {
        useSessionOSStore.setState({
            scenes: [scene('s1', 0), { ...scene('sx', 0), campaignId: 'c2' }],
        });

        expect(magasin().fusionnerDeuxScenes('s1', 'sx')).toBeNull();
        expect(magasin().scenes).toHaveLength(2);
    });
});

describe('la scission coupe le fil a l\'instant designe', () => {
    beforeEach(() => {
        poser('avant', 's1', 100);
        poser('pivot', 's1', 200);
        poser('apres', 's1', 300);
    });

    it('le pivot et tout ce qui suit passent dans la seconde moitie', () => {
        const nouveau = magasin().scinderLaSceneAuTemps('s1', 200)!;

        const parScene = Object.fromEntries(evenementsDe().map(e => [e.title, e.sceneId]));
        expect(parScene).toEqual({ avant: 's1', pivot: nouveau, apres: nouveau });
    });

    it('deux evenements du meme instant restent du meme cote', () => {
        // L'ouverture d'un combat et son initiative partent dans la meme
        // milliseconde : ils sont le meme moment, ils ne se separent pas.
        poser('jumeau', 's1', 200);
        const nouveau = magasin().scinderLaSceneAuTemps('s1', 200)!;

        const jumeaux = evenementsDe().filter(e => e.timestamp === 200);
        expect(jumeaux.every(e => e.sceneId === nouveau)).toBe(true);
    });

    it('la seconde moitie se pose juste apres l\'originale', () => {
        const nouveau = magasin().scinderLaSceneAuTemps('s1', 200)!;

        expect(magasin().scenes.find(s => s.id === nouveau)?.ordre).toBe(1);
        expect(magasin().scenes.find(s => s.id === 's2')?.ordre).toBe(2);
        expect(magasin().scenes.find(s => s.id === 's3')?.ordre).toBe(3);
    });

    it('elle porte un titre libre, jamais celui d\'une voisine', () => {
        const nouveau = magasin().scinderLaSceneAuTemps('s1', 200)!;
        const titres = magasin().scenes.map(s => s.titre);

        expect(new Set(titres).size).toBe(titres.length);
        expect(magasin().scenes.find(s => s.id === nouveau)?.titre).toContain('L\'entrepot');
    });

    it('ce qui n\'appartenait pas a la scene ne bouge pas', () => {
        poser('ailleurs', 's2', 250);
        magasin().scinderLaSceneAuTemps('s1', 200);

        expect(evenementsDe().find(e => e.title === 'ailleurs')?.sceneId).toBe('s2');
    });

    it('scinder puis refusionner rend le fil intact', () => {
        // La reversibilite est ce qui rend le geste sans risque a la revue :
        // « un marquage manque est reparable », § 3.2 du plan.
        const nouveau = magasin().scinderLaSceneAuTemps('s1', 200)!;
        magasin().fusionnerDeuxScenes('s1', nouveau);

        expect(evenementsDe().every(e => e.sceneId === 's1')).toBe(true);
        expect(magasin().scenes.map(s => s.id)).toEqual(['s1', 's2', 's3']);
    });

    it('une scene introuvable ne cree rien', () => {
        expect(magasin().scinderLaSceneAuTemps('s-inexistante', 200)).toBeNull();
        expect(magasin().scenes).toHaveLength(3);
    });
});
