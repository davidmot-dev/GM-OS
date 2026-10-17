import { describe, it, expect } from 'vitest';
import { cleDuNom, direLesDetails, entreesDuNom, lireLeReferentiel, nomsDuReferentiel, sectionDuMarkdown } from './referentiels';

/** **Les référentiels d'un jeu** — les Vécus de Nephilim, 2026-10-17. */
const INDEX = {
    referentiel: 'Vécus passés',
    entrees: [
        { nom: 'Héros', fichier: '00-atlantide.md', details: { 'Ka-élément': 'Feu', Époque: "La Chute de l'Atlantide" } },
        { nom: 'Mercenaire', fichier: '07-mesopotamie.md', details: { 'Ka-élément': 'Eau' } },
        { nom: 'Mercenaire', fichier: '10-carthage.md', details: { 'Ka-élément': 'Feu' } },
        { nom: '  ' },
    ],
};
const MARKDOWN = [
    "# Les Vécus de l’époque « La Chute de l'Atlantide »", '',
    '## Héros — Ka-Feu', '', 'Vous avez été un héros fondateur. *(p. 61)*', '',
    '## Sage — Ka-Air', '', 'Vous avez enseigné.', '', '---', '', 'Extrait du carnet.',
].join('\n');

describe('un référentiel', () => {
    it('se lit, sans les entrées sans nom', () => {
        const r = lireLeReferentiel(INDEX);
        expect(r?.titre).toBe('Vécus passés');
        expect(r?.entrees.map(e => e.nom)).toEqual(['Héros', 'Mercenaire', 'Mercenaire']);
    });

    it('un fichier qui n’en est pas un ne s’affiche pas', () => {
        expect(lireLeReferentiel({ vecus: [] })).toBeNull();
        expect(lireLeReferentiel(null)).toBeNull();
    });

    it('un nom se retrouve sans casse ni accents, et un même nom rend toutes ses entrées', () => {
        const r = lireLeReferentiel(INDEX);
        expect(entreesDuNom(r, ' heros ')).toHaveLength(1);
        expect(entreesDuNom(r, 'Mercenaire').map(e => e.fichier)).toEqual(['07-mesopotamie.md', '10-carthage.md']);
        expect(entreesDuNom(r, 'Templier')).toEqual([]);
        expect(cleDuNom('Ère  DU  Héros')).toBe('ere du heros');
    });

    it('les noms se proposent une fois chacun', () => {
        expect(nomsDuReferentiel(lireLeReferentiel(INDEX))).toEqual(['Héros', 'Mercenaire']);
    });

    it('les détails tiennent en une ligne', () => {
        expect(direLesDetails(lireLeReferentiel(INDEX)!.entrees[0])).toBe("Ka-élément : Feu · Époque : La Chute de l'Atlantide");
    });

    it('la description est la section du nom, jusqu’au titre suivant ou au filet', () => {
        expect(sectionDuMarkdown(MARKDOWN, 'Héros')).toBe('Vous avez été un héros fondateur. *(p. 61)*');
        expect(sectionDuMarkdown(MARKDOWN, 'sage')).toBe('Vous avez enseigné.');
        expect(sectionDuMarkdown(MARKDOWN, 'Templier')).toBeNull();
    });
});
