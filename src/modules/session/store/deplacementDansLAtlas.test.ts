import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionOSStore } from './index';
import { useJournalStore } from '../../journal/useJournalStore';
import { leRecitAResumer, preparerLaRevue } from '../../journal/curation';
import type { AtlasMap } from '../../../types/chronicle.types';

/**
 * **Consulter une carte et s'y rendre sont deux gestes. Ils ne l'étaient pas.**
 *
 * Jusqu'au 2026-08-21, `navigateToAtlasMap` écrivait « Le groupe se déplace vers
 * X » en `LOCATION` — donc en `chronique`, donc dans le résumé — sur un simple
 * clic dans l'atlas. Ouvrir sa carte en pleine séance pour vérifier un nom
 * suffisait à faire voyager le groupe, et le résumé narratif en tirait ensuite
 * un déplacement qui n'avait jamais eu lieu.
 *
 * *C'est le pire des trois défauts d'axe relevés à la revue des émetteurs :
 * les deux autres ajoutaient du bruit, celui-ci ajoutait un **fait**.* Et un
 * fait faux ne se plaint de rien — il se lit comme les autres.
 */

const journal = () => useJournalStore.getState();
const magasin = () => useSessionOSStore.getState();

const carte = (id: string, nom: string, recit = ''): AtlasMap => ({
    id, name: nom, fileUrl: '', isVideo: false, type: 'city',
    narrativeDescription: recit, gmNotes: '', linkedEntities: [], campaignId: 'c1',
});

const evenements = () => journal().journals[0].events;

beforeEach(() => {
    journal().clearJournal();
    journal().startJournal({ id: 'c1', nom: 'Hadley Hope' }, 'Séance 1');
    useSessionOSStore.setState({
        atlasMaps: [carte('am-1', 'Hadley Hope'), carte('am-2', 'La Serre', 'Une coupole de verre embuée.')],
        activeCampaignId: 'c1',
    });
});

describe('ouvrir une carte ne fait plus voyager le groupe', () => {
    it('le geste est consigné, mais en trace', () => {
        magasin().navigateToAtlasMap('am-1');

        const ouverture = evenements()[0];
        expect(ouverture.title).toContain('Hadley Hope');
        expect(ouverture.nature).toBe('trace');
    });

    it('et il n\'entre pas dans le résumé', () => {
        magasin().navigateToAtlasMap('am-1');
        // Un vrai fait à côté : un récit vide ferait passer ce test pour rien.
        journal().addEvent({ type: 'NOTE', title: 'Indice révélé', content: 'La lettre.' });

        const recit = leRecitAResumer(preparerLaRevue(evenements(), [], [], 'c1'));

        expect(recit.map(e => e.title)).toContain('Indice révélé');
        expect(recit.some(e => e.title.includes('Hadley Hope'))).toBe(false);
    });

    it('la phrase inventée par le code a disparu du fil', () => {
        magasin().navigateToAtlasMap('am-1');

        // « Le groupe se déplace vers X » n'était écrite par personne : c'est
        // le repli du code, et c'est lui qui entrait dans les résumés.
        expect(evenements()[0].content).not.toMatch(/se déplace|se rend/);
    });

    it('ouvrir une carte ne la marque pas visitée', () => {
        magasin().navigateToAtlasMap('am-1');

        expect(magasin().atlasMaps.find(m => m.id === 'am-1')?.isVisited).toBeFalsy();
    });
});

describe('« le groupe s\'y rend » écrit dans la chronique', () => {
    it('l\'événement entre au résumé', () => {
        magasin().leGroupeSyRend('am-1');

        const recit = leRecitAResumer(preparerLaRevue(evenements(), [], [], 'c1'));
        expect(recit.some(e => e.title.includes('Hadley Hope'))).toBe(true);
    });

    it('le récit du lieu l\'emporte sur la phrase de repli', () => {
        magasin().leGroupeSyRend('am-2');

        expect(evenements()[0].content).toBe('Une coupole de verre embuée.');
    });

    it('sans récit, on dit au moins que le groupe s\'y rend', () => {
        magasin().leGroupeSyRend('am-1');

        expect(evenements()[0].content).toContain('Hadley Hope');
    });

    it('et le lieu devient visité — deux façons de dire la même chose', () => {
        magasin().leGroupeSyRend('am-1');

        expect(magasin().atlasMaps.find(m => m.id === 'am-1')?.isVisited).toBe(true);
    });

    it('mais il ne dé-visite jamais : se dédire reste le rôle du bouton « visité »', () => {
        magasin().leGroupeSyRend('am-1');
        magasin().leGroupeSyRend('am-1');

        expect(magasin().atlasMaps.find(m => m.id === 'am-1')?.isVisited).toBe(true);
    });

    it('une carte inconnue n\'écrit rien plutôt que d\'écrire du vide', () => {
        const avant = evenements().length;
        magasin().leGroupeSyRend('am-inexistante');

        // Le journal n'est pas vide au départ : `startJournal` y pose son
        // ouverture. On mesure donc l'écart, pas le total.
        expect(evenements()).toHaveLength(avant);
    });
});
