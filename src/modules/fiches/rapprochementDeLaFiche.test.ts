import { describe, it, expect, vi, afterEach } from 'vitest';
import { rapprocher, memeValeur, estVide } from './rapprochementDeLaFiche';
import { journaliserLesDivergences, ligneDeDivergence } from './journalDesDivergences';
import type { CorrespondanceDeFiche } from './correspondanceDeFiche';
import type { InventoryItem } from '../../types/player.types';

/**
 * **La fiche fait foi — et on dit ce que ça coûte.**
 *
 * La règle est celle de David (2026-08-28) : *« c'est la tablette qui gagne,
 * mais il faut garder un log si possible »*. Ces tests éprouvent surtout la
 * seconde moitié, parce que la première est facile à écrire juste et le journal
 * est facile à rendre inutilisable.
 */

const TABLE: CorrespondanceDeFiche = {
    version: 1,
    gabaritDeLaFiche: 'controle',
    champs: [
        { gmos: 'nom', fiche: 'identity.name' },
        { gmos: 'anneesService', fiche: 'identity.years_service' },
        { gmos: 'blesse', fiche: 'health.wounded' },
        { gmos: 'vigueur', fiche: ['attributes.vigor.level', 'attributes.vigor.base_die'], transforme: 'niveauEtDe' },
    ],
    objets: [{
        destination: 'inventoryItems', prefixe: 'weapons', emplacements: [0, 1],
        type: 'weapon', nom: 'name', proprietes: { damage: 'degats' },
    }],
};

const arme = (id: string, name: string): InventoryItem => ({
    id, name, type: 'weapon', rarity: 'common', weight: 0, quantity: 1,
    description: '', properties: { degats: '3' },
});

describe('memeValeur — tolérante au type, stricte sur le contenu', () => {
    /**
     * Le piège qui rendrait le journal inutilisable : un champ `number` de la
     * fiche rend `16`, `sheetData` porte `"16"` saisi dans un formulaire. Une
     * comparaison stricte crierait sur CHAQUE champ numérique, à CHAQUE
     * ouverture — et on apprendrait à ignorer le journal.
     */
    it('ne voit pas de divergence entre 16 et « 16 »', () => {
        expect(memeValeur(16, '16')).toBe(true);
        expect(memeValeur(true, 'true')).toBe(true);
        expect(memeValeur(16, 17)).toBe(false);
    });

    it('traite le vide, le rien et le décoché comme la même absence', () => {
        for (const v of [undefined, null, '', false]) expect(estVide(v)).toBe(true);
        expect(memeValeur(undefined, '')).toBe(true);
        expect(memeValeur(null, false)).toBe(true);
        expect(estVide(0)).toBe(false);
    });
});

describe('rapprocher', () => {
    it('n’écrit que ce qui change', () => {
        const { aEcrire } = rapprocher(
            { 'identity.name': 'Rick', 'identity.years_service': 16 },
            { sheetData: { nom: 'Rick', anneesService: '16' } },
            TABLE,
        );
        expect(aEcrire).not.toHaveProperty('nom');
        expect(aEcrire).not.toHaveProperty('anneesService');
    });

    /** Remplir un champ vide est le fonctionnement attendu, pas une perte. */
    it('remplit sans crier', () => {
        const { aEcrire, divergences } = rapprocher(
            { 'identity.name': 'Rick' },
            { sheetData: {} },
            TABLE,
        );
        expect(aEcrire.nom).toBe('Rick');
        expect(divergences).toEqual([]);
    });

    it('relève ce qu’il écrase, et seulement ça', () => {
        const { aEcrire, divergences } = rapprocher(
            { 'identity.name': 'Roy Batty', 'attributes.vigor.level': 'A' },
            { sheetData: { nom: 'Rick Deckard', vigueur: 'C (D8)' } },
            TABLE,
        );

        expect(aEcrire).toMatchObject({ nom: 'Roy Batty', vigueur: 'A (D12)' });
        expect(divergences).toEqual([
            { cle: 'nom', ancienne: 'Rick Deckard', nouvelle: 'Roy Batty' },
            { cle: 'vigueur', ancienne: 'C (D8)', nouvelle: 'A (D12)' },
        ]);
    });

    /**
     * La fiche n'imprime que deux lignes d'armes ici : vider la seconde SUPPRIME
     * l'objet. C'est la règle voulue, et c'est exactement la perte qu'on ne peut
     * pas reconstituer le lendemain sans trace.
     */
    it('dit quel objet a disparu', () => {
        const { divergences, inventoryItems } = rapprocher(
            { 'weapons.0.name': 'Blaster', 'weapons.0.damage': '3' },
            { sheetData: {}, inventoryItems: [arme('a0', 'Blaster'), arme('a1', 'Matraque')] },
            TABLE,
        );

        expect(inventoryItems!.map(o => o.name)).toEqual(['Blaster']);
        expect(divergences).toEqual([{ cle: 'inventoryItems', ancienne: 'Matraque', nouvelle: '' }]);
    });

    /**
     * **Le cas qui aurait coûté cher.** Relier un PJ déjà rempli à une fiche
     * vierge : sans ce garde-fou, sa Description, son objet fétiche et ses
     * spécialités partaient d'un coup, à la seconde du clic.
     */
    it('une case vide de la fiche n’efface JAMAIS une valeur de GM-OS', () => {
        const { aEcrire, divergences } = rapprocher(
            { 'identity.name': '' },
            { sheetData: { nom: 'Rick Deckard' } },
            TABLE,
        );
        expect(aEcrire).not.toHaveProperty('nom');
        expect(divergences).toEqual([]);
    });

    it('écrit dans les champs du personnage quand la table les vise', () => {
        const avecNarratif = {
            ...TABLE,
            champs: [{ gmos: 'description', destination: 'personnage' as const, fiche: 'identity.appearance' }],
            objets: undefined,
        };
        const { narratifAEcrire, divergences } = rapprocher(
            { 'identity.appearance': 'Manteau gris, col relevé.' },
            { sheetData: {}, narratif: { description: 'Trench mouillé.' } },
            avecNarratif,
        );

        expect(narratifAEcrire).toEqual({ description: 'Manteau gris, col relevé.' });
        expect(divergences).toEqual([
            { cle: 'description', ancienne: 'Trench mouillé.', nouvelle: 'Manteau gris, col relevé.' },
        ]);
    });

    it('ne parle pas d’inventaire quand la table n’en parle pas', () => {
        const sansObjets = { ...TABLE, objets: undefined };
        expect(rapprocher({}, { sheetData: {}, inventoryItems: [arme('a0', 'Blaster')] }, sansObjets))
            .not.toHaveProperty('inventoryItems');
    });
});

describe('journalDesDivergences', () => {
    /*
      `src/test/setup.ts` pose déjà un `appBridge` global : on le remet en place
      après chaque test, sinon les suivants croiraient tourner hors d'Electron.
    */
    const pontDOrigine = window.appBridge;
    afterEach(() => { (window as { appBridge?: unknown }).appBridge = pontDOrigine; });

    const sujet = { personnage: 'Rick Deckard', gabarit: 'blade-runner-fr' };

    it('ne dit rien quand il n’y a rien à dire', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        expect(journaliserLesDivergences(sujet, [])).toEqual([]);
        expect(warn).not.toHaveBeenCalled();
        warn.mockRestore();
    });

    it('dit le PJ, le gabarit, la clé, et la valeur perdue', () => {
        const ligne = ligneDeDivergence(sujet, { cle: 'vigueur', ancienne: 'C (D8)', nouvelle: 'A (D12)' });
        expect(ligne).toContain('Rick Deckard');
        expect(ligne).toContain('blade-runner-fr');
        expect(ligne).toContain('vigueur');
        expect(ligne).toContain('C (D8)');
        expect(ligne).toContain('A (D12)');
    });

    /**
     * `window.appBridge.logger` → `log:message` → `electron-log` → `main.log`.
     * C'est le seul chemin qui survive à la fermeture : rien ne collecte la
     * sortie standard du renderer.
     */
    it('écrit dans main.log quand le pont est là, dans la console sinon', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const pont = vi.fn();
        (window as unknown as { appBridge: unknown }).appBridge = { logger: { warn: pont } };

        journaliserLesDivergences(sujet, [{ cle: 'nom', ancienne: 'Rick', nouvelle: 'Roy' }]);
        expect(pont).toHaveBeenCalledTimes(1);
        expect(warn).not.toHaveBeenCalled();

        delete (window as { appBridge?: unknown }).appBridge;
        journaliserLesDivergences(sujet, [{ cle: 'nom', ancienne: 'Rick', nouvelle: 'Roy' }]);
        expect(warn).toHaveBeenCalledTimes(1);
        warn.mockRestore();
    });

    /** Un journal qu'on ne peut pas lire ne vaut pas mieux qu'un journal absent. */
    it('plafonne un lot énorme, et dit combien il a tu', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const beaucoup = Array.from({ length: 25 }, (_, i) => ({ cle: `c${i}`, ancienne: 'x', nouvelle: 'y' }));

        const lignes = journaliserLesDivergences(sujet, beaucoup);
        expect(lignes).toHaveLength(21);
        expect(lignes[20]).toContain('5 autre(s) valeur(s) écrasée(s)');
        warn.mockRestore();
    });

    it('rend lisible une valeur absente ou démesurée', () => {
        const vide = ligneDeDivergence(sujet, { cle: 'k', ancienne: undefined, nouvelle: '' });
        expect(vide).toContain('∅ → ∅');

        const long = ligneDeDivergence(sujet, { cle: 'k', ancienne: 'a'.repeat(400), nouvelle: 'b' });
        expect(long.length).toBeLessThan(250);
        expect(long).toContain('…');
    });
});
