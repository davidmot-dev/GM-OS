import { describe, it, expect } from 'vitest';
import {
    GROUPES,
    fichesDuGroupe,
    promptDuGroupe,
    fusionnerFragments,
    type FicheDuCorpus,
} from './GroupesDeChamps';
import { CANEVAS } from './canevas';

const fiche = (sujet: string, contenu = 'Contenu de la fiche.'): FicheDuCorpus => ({ sujet, contenu });

const CORPUS: FicheDuCorpus[] = [
    fiche('Résolution des jets', 'Chaque dé sous le seuil est une réussite.'),
    fiche('Degrés de réussite et critiques', 'Le 1 naturel vaut deux réussites.'),
    fiche('Initiative et déroulement du tour', "L'initiative alterne entre les camps."),
    fiche('Monnaie de table ou ressource partagée', 'Impulsion de 0 à 6.'),
    fiche("L'Équation Statistique Duale", 'Une compétence et un principe.'),
];

describe('les groupes couvrent le canevas sans le trahir', () => {
    it('chaque sujet cité existe dans le canevas', () => {
        /**
         * Le défaut que cela attrape : un groupe qui vise un sujet dont aucune
         * fiche ne porte le nom ne sélectionnerait jamais rien, et rendrait un
         * fragment vide **sans que rien ne le dise**.
         */
        const clefs = new Set(CANEVAS.map(s => s.clef));
        for (const groupe of GROUPES) {
            for (const sujet of groupe.sujets) {
                expect(clefs.has(sujet), `« ${sujet} » du groupe « ${groupe.id} » n'est pas au canevas`).toBe(true);
            }
        }
    });

    it('les identifiants de groupe sont uniques', () => {
        expect(new Set(GROUPES.map(g => g.id)).size).toBe(GROUPES.length);
    });

    it('un seul groupe produit la fiche de personnage', () => {
        const producteurs = GROUPES.filter(g => g.cible.includes('"template"'));
        expect(producteurs.map(g => g.id)).toEqual(['fiche']);
    });

    it('aucun exemple n\'enseigne que tout jeu a des points de vie', () => {
        // La leçon de l'exemple précédent, qui codait `"isMainHP": true`.
        for (const groupe of GROUPES) {
            expect(groupe.exemple, `groupe « ${groupe.id} »`).not.toContain('"isMainHP":true');
            expect(groupe.exemple, `groupe « ${groupe.id} »`).not.toContain('"isMainHP": true');
        }
    });

    it('chaque exemple est un JSON compact et valide', () => {
        for (const groupe of GROUPES) {
            expect(() => JSON.parse(groupe.exemple), `groupe « ${groupe.id} »`).not.toThrow();
            expect(groupe.exemple, 'un exemple indenté se paie en secondes de décodage').not.toContain('\n');
        }
    });
});

describe('sélection des fiches', () => {
    it('retient les fiches du sujet visé', () => {
        const jet = GROUPES.find(g => g.id === 'jet')!;
        expect(fichesDuGroupe(jet, CORPUS).map(f => f.sujet)).toEqual([
            'Résolution des jets',
            'Degrés de réussite et critiques',
        ]);
    });

    it('reconnaît un libellé enrichi par le carnet', () => {
        /**
         * Le canevas dit « Monnaie de table », le carnet a rendu « Monnaie de
         * table ou ressource partagée », et les fiches portent l'une ou l'autre
         * forme selon leur génération. Comparer au caractère près perdrait la
         * fiche sans rien signaler.
         */
        const ressources = GROUPES.find(g => g.id === 'ressources')!;
        expect(fichesDuGroupe(ressources, CORPUS).map(f => f.sujet))
            .toEqual(['Monnaie de table ou ressource partagée']);
    });

    it('ignore les fiches hors canevas', () => {
        const jet = GROUPES.find(g => g.id === 'jet')!;
        expect(fichesDuGroupe(jet, CORPUS).map(f => f.sujet)).not.toContain("L'Équation Statistique Duale");
    });

    it('un groupe sans fiche rend une liste vide, pas une erreur', () => {
        const portees = GROUPES.find(g => g.id === 'portees')!;
        expect(fichesDuGroupe(portees, CORPUS)).toEqual([]);
    });
});

describe('l\'invite d\'un groupe', () => {
    it('porte les fiches retenues et rien d\'autre', () => {
        const p = promptDuGroupe(GROUPES.find(g => g.id === 'jet')!, CORPUS);
        expect(p).toContain('Chaque dé sous le seuil est une réussite.');
        expect(p).toContain('Le 1 naturel vaut deux réussites.');
        expect(p, 'une fiche étrangère gonflerait l\'invite pour rien').not.toContain('Impulsion de 0 à 6.');
    });

    it('interdit d\'inventer, et le dit avant la forme attendue', () => {
        const p = promptDuGroupe(GROUPES.find(g => g.id === 'jet')!, CORPUS);
        expect(p.indexOf("N'INVENTE RIEN")).toBeLessThan(p.indexOf('FORME ATTENDUE'));
        expect(p).toContain('OMETS le champ');
    });

    it('demande un JSON compact — le décodage se paie', () => {
        const p = promptDuGroupe(GROUPES.find(g => g.id === 'jet')!, CORPUS);
        expect(p).toContain('sans indentation');
    });

    it('le dit quand aucune fiche ne couvre le sujet', () => {
        // Mieux vaut l'annoncer que d'envoyer une invite muette dont le modèle
        // comblerait le vide.
        const p = promptDuGroupe(GROUPES.find(g => g.id === 'portees')!, CORPUS);
        expect(p).toContain('aucune fiche disponible');
    });

    it('tient dans le budget d\'invite mesuré', () => {
        /**
         * Budget réel relevé le 2026-08-12 : ~8 000 tokens, et le français
         * tokenise à 2,92 caractères par token. Un groupe qui dépasserait
         * verrait sa fin jetée **en silence** — c'est tout l'objet du découpage.
         */
        const gros = CORPUS.map(f => ({ ...f, contenu: 'x'.repeat(6000) }));
        for (const groupe of GROUPES) {
            const tokens = promptDuGroupe(groupe, gros).length / 2.92;
            expect(tokens, `groupe « ${groupe.id} » : ${Math.round(tokens)} tokens`).toBeLessThan(8000);
        }
    });
});

describe('fusion des fragments', () => {
    it('réunit les clés de premier niveau', () => {
        const r = fusionnerFragments([
            { driver: { name: 'Dune' } },
            { driver: { emoji: '🏜️' } },
        ]);
        expect(r.driver).toMatchObject({ name: 'Dune', emoji: '🏜️' });
    });

    it('fusionne « combat » au lieu de l\'écraser', () => {
        /**
         * Trois groupes alimentent `combat` — initiative, défaite, jauges. Une
         * affectation naïve garderait le dernier et perdrait les deux autres,
         * sans erreur : un pilote amputé qui a l'air complet.
         */
        const r = fusionnerFragments([
            { driver: { combat: { initiativeFormula: '' } } as never },
            { driver: { combat: { defaultHealthType: 'clocks' } } as never },
            { driver: { combat: { statsToTrack: [] } } as never },
        ]);
        expect(Object.keys(r.driver!.combat!)).toEqual(['initiativeFormula', 'defaultHealthType', 'statsToTrack']);
    });

    it('fusionne « ui_config » de la même façon', () => {
        const r = fusionnerFragments([
            { driver: { ui_config: { themeColor: '#d97706' } } as never },
            { driver: { ui_config: { gauges: [] } } as never },
        ]);
        expect(r.driver!.ui_config).toMatchObject({ themeColor: '#d97706', gauges: [] });
    });

    it('concatène les sections de la fiche', () => {
        const r = fusionnerFragments([
            { template: { name: 'Fiche', sections: [{ id: 'a', label: 'A', fields: [] }] } as never },
            { template: { sections: [{ id: 'b', label: 'B', fields: [] }] } as never },
        ]);
        expect(r.template!.sections!.map(s => s.id)).toEqual(['a', 'b']);
    });

    it('ne fabrique rien à partir de rien', () => {
        // Zéro fragment utile doit rendre un objet vide, pas un pilote squelette
        // qu'on prendrait pour un résultat.
        expect(fusionnerFragments([])).toEqual({});
        expect(fusionnerFragments([{}, { driver: {} }])).toEqual({});
    });

    it('ignore les valeurs absentes sans effacer celles qui existent', () => {
        const r = fusionnerFragments([
            { driver: { name: 'Dune' } },
            { driver: { name: undefined } },
        ]);
        expect(r.driver!.name).toBe('Dune');
    });
});
