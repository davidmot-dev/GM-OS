import { describe, expect, it } from 'vitest';
// Les registres réels, lus par Vite (pas de `node:fs` dans les essais de l'interface).
import ALIEN from '../../../../docs/systems/alien/livres.json?raw';
import RDD from '../../../../docs/systems/reves de dragons/livres.json?raw';
import {
    cleDeLaFiche, controlerLesLivres, decalageDepuis, ecrireLesLivres, enregistrerLeLivre, lireLesLivres,
    livreDeLaFiche, mesurerLeDecalage, pageDuPdf, pagesAEchantillonner, retirerLeLivre,
} from './livres';
import { cheminDesLivres, corpusDeSupplement } from '../../../../electron/corpusSysteme';

/**
 * **Les chemins des livres**, étape A (06/11/2026) — plan
 * `documentation/Planning/2026-11-06-chemins-des-livres.md`.
 */
describe('le registre réel d’Alien', () => {
    const livres = lireLesLivres(ALIEN);

    it('deux livres, sans constat ; le Drone de la p. 309 est à la page 312 du PDF', () => {
        expect(livres.map(l => [l.cle, l.decalage])).toEqual([['jeu', 3], ['colonial-marines', 3]]);
        expect(livres[0].chemin.startsWith('\\\\CLOUDDAVID\\Media\\')).toBe(true);
        expect(livres[0].errata).toMatch(/ALIEN-Errata\.pdf$/);
        expect(controlerLesLivres(ALIEN, ['jeu', 'colonial-marines'])).toEqual([]);
        expect(pageDuPdf(livres[0], 309)).toBe(312);
    });

    it('une fiche mène à son livre par son chemin', () => {
        expect(livreDeLaFiche(livres, 'docs/systems/alien/rules/bestiaire-du-livre-de-base.md')?.cle).toBe('jeu');
        expect(livreDeLaFiche(livres, 'docs/systems/alien/supplements/colonial-marines/rules/x.md')?.titre).toBe('Colonial Marines Operations Manual');
        expect(cleDeLaFiche('docs\\systems\\alien\\supplements\\colonial-marines\\rules\\x.md')).toBe('colonial-marines');
    });

    it('le registre est à la racine du jeu, même depuis un supplément', () => {
        const jeu = { racine: 'systems/alien', id: 'alien', raison: 'choisi' as const, aCreer: false };
        expect(cheminDesLivres(jeu)).toBe('systems/alien/livres.json');
        expect(cheminDesLivres(corpusDeSupplement(jeu, 'colonial-marines')!)).toBe('systems/alien/livres.json');
    });
});

describe('Rêve de Dragon : le livre complet 2.3.1', () => {
    // Choix de David le 06/11 : le livre complet remplace les deux volumes 2.3. Sa numérotation
    // est continue ; le corpus, relu contre la 2.3.1, cite le Haut-Rêve p. 181-193.
    it('un seul livre, décalé de + 1 : la p. 187 du Haut-Rêve est à la page 188 du PDF', () => {
        const livres = lireLesLivres(RDD);
        expect(livres.map(l => [l.cle, l.decalage, l.edition])).toEqual([['jeu', 1, '2.3.1']]);
        expect(controlerLesLivres(RDD, ['jeu'])).toEqual([]);
        const livre = livreDeLaFiche(livres, 'docs/systems/reves de dragons/rules/x.md', '"2_Livre_du_Haut-Reve_2.2.pdf"');
        expect(pageDuPdf(livre!, 187)).toBe(188);
    });
});

describe('deux volumes pour la même clé', () => {
    // Le registre de Rêve de Dragon avant le 06/11 : deux volumes, le second continuant la
    // numérotation du premier (PDF 5 = p. 171).
    const livres = lireLesLivres(JSON.stringify([
        { cle: 'jeu', titre: 'Livre des Voyageurs (2.3)', chemin: 'N:\\1_Livre_des_Voyageurs_2.3.pdf', decalage: 1 },
        { cle: 'jeu', titre: 'Livre du Haut-Rêve (2.3)', chemin: 'N:\\2_Livre_du_Haut_Reve_2.3.pdf', decalage: -166 },
    ]));

    it('la fiche choisit son volume par ses `sources:` ; le second se décale de − 166', () => {
        const hautReve = livreDeLaFiche(livres, 'docs/systems/reves de dragons/rules/x.md', '"2_Livre_du_Haut_Reve_2.3.pdf"');
        expect(hautReve?.decalage).toBe(-166);
        expect(pageDuPdf(hautReve!, 287)).toBe(121);
        // La fiche cite une édition absente : le premier volume, faute de mieux.
        expect(livreDeLaFiche(livres, 'docs/systems/reves de dragons/rules/x.md', '"1_Livre_du_Voyageur_2.2.pdf"')?.titre).toMatch(/Voyageurs/);
    });
});

describe('lire, contrôler, enregistrer', () => {
    it('une entrée sans chemin est écartée et dite ; un décalage non entier vaut 0 et est dit', () => {
        const brut = JSON.stringify([{ cle: 'jeu', chemin: 'C:\\a.pdf', decalage: 2.5 }, { cle: 'jeu' }, { cle: 'x', chemin: 'b.txt' }]);
        expect(lireLesLivres(brut).map(l => [l.cle, l.decalage, l.titre])).toEqual([['jeu', 0, 'a.pdf'], ['x', 0, 'b.txt']]);
        expect(controlerLesLivres(brut, ['jeu']).map(c => [c.ou, c.gravite])).toEqual([
            ['livres[0]', 'avertissement'], ['livres[1]', 'erreur'], ['livres[2]', 'avertissement'], ['livres[2]', 'avertissement'],
        ]);
        expect(controlerLesLivres('{', ['jeu'])[0].gravite).toBe('erreur');
        expect(lireLesLivres(null)).toEqual([]);
        expect(controlerLesLivres(null, ['jeu'])).toEqual([]);
    });

    it('enregistrer garde les notes et les autres livres ; retirer ne touche que le rang visé', () => {
        const livres = lireLesLivres(ALIEN);
        const b = enregistrerLeLivre(livres, 'jeu', { chemin: ' D:\\Alien.pdf ', decalage: decalageDepuis(291, 294) });
        expect(b[0]).toMatchObject({ chemin: 'D:\\Alien.pdf', decalage: 3, titre: 'ALIEN, le jeu de rôle' });
        expect(b[0].notes).toBe(livres[0].notes);
        expect(b[1]).toEqual(livres[1]);
        expect(livres[0].chemin).not.toBe('D:\\Alien.pdf');
        const neuf = enregistrerLeLivre([], 'jeu', { chemin: 'E:\\Livre de base.pdf', decalage: -2 });
        expect(neuf).toEqual([{ cle: 'jeu', titre: 'Livre de base.pdf', chemin: 'E:\\Livre de base.pdf', decalage: -2 }]);
        expect(retirerLeLivre(livres, 'colonial-marines').map(l => l.cle)).toEqual(['jeu']);
        expect(lireLesLivres(ecrireLesLivres(livres))).toEqual(livres);
    });
});

describe('mesurer le décalage (« Proposer depuis le livre »)', () => {
    const page = (num: number, pied: string) => ({ num, text: `Titre du chapitre\nUn paragraphe de 12 mots.\n\n${pied}` });

    it('le numéro en pied, le plus fréquent, l’emporte ; un nombre du texte ne le trompe pas', () => {
        const pages = [10, 20, 30, 40, 50].map(n => page(n, String(n - 3)));
        pages.push({ num: 60, text: 'Dégâts 8\nVitesse 2' });
        expect(mesurerLeDecalage(pages, 398)).toEqual({ decalage: 3, concordantes: 5, lues: 6 });
    });

    it('un numéro doublé par une seconde couche (« 189189 ») ; un décalage négatif', () => {
        expect(mesurerLeDecalage([5, 25, 45, 65].map(n => page(n, `${n - 4}${n - 4}`)), 240)?.decalage).toBe(4);
        expect(mesurerLeDecalage([5, 25, 45].map(n => page(n, String(n + 166))), 153)?.decalage).toBe(-166);
        // Blade Runner lu par pdf.js : chiffres espacés, doublés par une tabulation.
        const espaces = (v: number) => String(v).padStart(3, '0').split('').join(' ');
        expect(mesurerLeDecalage([25, 61, 109].map(n => ({ num: n, text: `T i t r e\n${espaces(n - 4)}\t${espaces(n - 4)}\nTexte` })), 240)?.decalage).toBe(4);
    });

    it('rien ne se dégage : pas de proposition', () => {
        expect(mesurerLeDecalage([page(1, ''), page(2, 'Fin')], 300)).toBeNull();
        expect(mesurerLeDecalage([10, 20, 30].map(n => page(n, String(n - 1))).concat(Array.from({ length: 20 }, (_, i) => page(100 + i, ''))), 300)).toBeNull();
    });

    it('l’échantillon couvre tout le livre', () => {
        const p = pagesAEchantillonner(398);
        expect(p).toHaveLength(40);
        expect(p[0]).toBe(1);
        expect(p.at(-1)).toBeGreaterThan(380);
        expect(pagesAEchantillonner(12)).toHaveLength(12);
    });
});
