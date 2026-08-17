import { describe, it, expect } from 'vitest';
import { relevePourLaSuite, laSuiteEstVide, rendreLeCompteRendu } from './compteRendu';
import { ouvrirLaScene, suspendreLaScene, terminerLaScene } from '../session/logic/trame';
import type { Acte, Scene } from '../../types/trame.types';
import type { Journal } from './types';

/**
 * Ce que ces tests protègent : **deux des trois sections du compte rendu se
 * calculent, sans jamais appeler un modèle**.
 *
 * Structure décidée par David le 2026-08-17 — le plan du 2026-08-08 disait
 * « avec une structure » sans dire laquelle. Ce que la confrontation aux données
 * a montré : seul le récit a besoin d'Ollama. L'état des lieux vient de
 * l'instantané de clôture, et ce qui attend se lit sur la trame. *Une chaîne
 * construite est instantanée, gratuite, déterministe et fonctionne hors ligne* —
 * et c'est autant de moins à envoyer à un modèle qui se faisait tronquer.
 */
const acte = (id: string, ordre: number, extra: Partial<Acte> = {}): Acte =>
    ({ id, campaignId: 'c1', ordre, titre: id, resume: '', ...extra });

const scene = (id: string, acteId: string, ordre: number): Scene =>
    ({ id, campaignId: 'c1', acteId, ordre, titre: id, resume: '',
       origine: 'preparee', entiteIds: [], indiceIds: [], creeeLe: 0 });

describe('ce qui attend, relevé sur la trame', () => {
    const actes = [acte('a2', 1), acte('a1', 0)];
    const indices = [
        { campaignId: 'c1', title: 'Le carnet', isRevealed: false },
        { campaignId: 'c1', title: 'La lettre', isRevealed: true },
        { campaignId: 'c2', title: 'Ailleurs', isRevealed: false },
    ];

    it('sépare ce qui n\'a jamais été joué de ce qui est en pause', () => {
        const scenes = [
            scene('jamais', 'a1', 0),
            suspendreLaScene(ouvrirLaScene(scene('en-pause', 'a1', 1), 10), 20),
            ouvrirLaScene(scene('en-cours', 'a1', 2), 10),
            terminerLaScene(scene('close', 'a1', 3), 30),
        ];
        const suite = relevePourLaSuite(actes, scenes, indices, 'c1');

        expect(suite.scenesNonJouees).toEqual(['jamais']);
        // Elles reprendront seules : on ne les « commence » pas, on y revient.
        expect(suite.scenesEnPause).toEqual(['en-pause']);
        // Une scène en cours n'attend pas : on y est.
        expect(suite.scenesNonJouees).not.toContain('en-cours');
    });

    it('une scène close avec son acte n\'attend plus rien', () => {
        /*
          Barrée sans avoir été jouée, elle a été ÉCARTÉE par l'achèvement de son
          acte. L'annoncer comme prévue reviendrait sur une décision déjà prise.
        */
        const scenes = [terminerLaScene(scene('ecartee', 'a1', 0), 30)];
        expect(relevePourLaSuite(actes, scenes, indices, 'c1').scenesNonJouees).toEqual([]);
    });

    it('range les scènes dans l\'ordre de la trame, pas du tableau plat', () => {
        // Une liste désordonnée ne dit pas où reprendre.
        const scenes = [scene('deuxieme-acte', 'a2', 0), scene('premier-acte', 'a1', 0)];
        expect(relevePourLaSuite(actes, scenes, indices, 'c1').scenesNonJouees)
            .toEqual(['premier-acte', 'deuxieme-acte']);
    });

    it('ne retient que les indices non révélés de CETTE campagne', () => {
        expect(relevePourLaSuite(actes, [], indices, 'c1').indicesNonReveles).toEqual(['Le carnet']);
    });

    it('les actes achevés ne sont plus ouverts', () => {
        const avecClos = [acte('a1', 0, { acheve: true }), acte('a2', 1)];
        expect(relevePourLaSuite(avecClos, [], indices, 'c1').actesOuverts).toEqual(['a2']);
    });

    it('sans campagne, on ne rend rien plutôt que tout', () => {
        const suite = relevePourLaSuite(actes, [scene('s', 'a1', 0)], indices, null);
        expect(laSuiteEstVide(suite)).toBe(true);
    });
});

describe('le compte rendu n\'écrit pas de section vide', () => {
    const base: Journal = { id: 'j', title: 'Séance 1', startTimestamp: 0, events: [] };

    it('un journal nu ne rend que son titre', () => {
        // Un titre suivi de rien se lit comme une perte de données ; l'omettre
        // se lit comme « il n'y avait rien », ce qui est la vérité.
        expect(rendreLeCompteRendu(base)).toBe('# Séance 1');
    });

    it('les trois sections apparaissent quand elles ont de la matière', () => {
        const rendu = rendreLeCompteRendu({
            ...base,
            resumeIA: 'Le groupe a fui par les docks.',
            etatDeFin: { presentPCs: [{ name: 'Milo', hp: 9, maxHp: 12, state: 'présent' }] },
            pourLaSuite: {
                scenesNonJouees: ['La filature'], scenesEnPause: [],
                indicesNonReveles: ['Le carnet'], actesOuverts: ['Acte II'],
            },
        });

        expect(rendu).toContain('## Ce qui s’est joué');
        expect(rendu).toContain('## Où en sont les choses');
        expect(rendu).toContain('Milo — 9/12 (présent)');
        expect(rendu).toContain('## Ce qui attend');
        expect(rendu).toContain('- La filature');
    });

    it('un personnage sans jauge n\'affiche aucun chiffre', () => {
        // « undefined/undefined » a déjà été écrit ici : sur un jeu sans points
        // de vie, l'absence est une information, pas un zéro.
        const rendu = rendreLeCompteRendu({
            ...base,
            etatDeFin: { presentPCs: [{ name: 'Duncan', state: 'présent' }] },
        });
        expect(rendu).toContain('Duncan (présent)');
        expect(rendu).not.toContain('undefined');
    });
});
