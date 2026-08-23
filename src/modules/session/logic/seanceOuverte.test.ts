import { describe, it, expect } from 'vitest';
import { seanceOuverteDe, uneSeanceEstOuverte } from './seanceOuverte';

const campagnes = [
    { id: 'c1', activeSessionId: 's1' },
    { id: 'c2' },
];

const seances = [
    { id: 's1', status: 'active' },
    { id: 's2', status: 'active' },   // active, mais aucune campagne ne la désigne
    { id: 's3', status: 'closed' },
];

describe('la séance ouverte', () => {
    it('rend la séance que la campagne active désigne', () => {
        expect(seanceOuverteDe(campagnes, seances, 'c1')?.id).toBe('s1');
        expect(uneSeanceEstOuverte(campagnes, seances, 'c1')).toBe(true);
    });

    it('ne rend rien sans campagne active', () => {
        expect(seanceOuverteDe(campagnes, seances, null)).toBeNull();
        expect(seanceOuverteDe(campagnes, seances, undefined)).toBeNull();
    });

    it("ne rend rien quand la campagne ne désigne aucune séance", () => {
        expect(seanceOuverteDe(campagnes, seances, 'c2')).toBeNull();
    });

    /**
     * **Le cas qui départage les deux règles trouvées dans le dépôt.** `s2` est
     * `active` mais orpheline : la lecture par `campaignId` l'aurait ouverte,
     * celle-ci non. C'est la campagne qui fait autorité.
     */
    it("ignore une séance active qu'aucune campagne ne désigne", () => {
        expect(seanceOuverteDe(campagnes, seances, 'c1')?.id).not.toBe('s2');
    });

    it('ignore une séance désignée mais close', () => {
        const closes = [{ id: 'cX', activeSessionId: 's3' }];
        expect(seanceOuverteDe(closes, seances, 'cX')).toBeNull();
    });

    it('ne rend rien quand la campagne active est inconnue', () => {
        expect(seanceOuverteDe(campagnes, seances, 'fantome')).toBeNull();
    });
});
