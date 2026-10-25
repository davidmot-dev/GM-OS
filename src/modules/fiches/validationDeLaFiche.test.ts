import { describe, expect, it } from 'vitest';
import { extraireLeManifeste, gabaritsDuMoteur, rapportEnTexte, validerLaFiche, type GabaritDeFiche } from './validationDeLaFiche';
import type { CorrespondanceDeFiche } from './correspondanceDeFiche';

/*
  Le validateur des fiches (2026-10-13), et le cahier des charges qu'il fait
  respecter : documentation/Architecture/Cahier-des-charges-fiche-de-personnage.md.
*/
const FOND = 'data:image/png;base64,AAAA';
const champ = (key: string, extra: Record<string, unknown> = {}) => ({ key, label: key, type: 'text', x: 10, y: 10, w: 50, h: 12, ...extra });

const gabarit = (champs: object[], extra: Record<string, unknown> = {}) => ({
    id: 'jeu-fr', name: 'Fiche du jeu', system: 'Jeu',
    pages: [{ id: 'page-1', width: 600, height: 800, backgroundData: FOND, fields: champs }],
    ...extra,
});

const html = (template: object, extra = '') =>
    `<html><head>${extra}</head><body><script type="application/json" id="character-sheet-template">${JSON.stringify({
        format: 'character-sheet-studio-html', formatVersion: 1, template,
    })}</script></body></html>`;

const valider = (h: string, moteur: GabaritDeFiche[] = [], correspondances: { chemin: string; table: CorrespondanceDeFiche }[] = []) =>
    validerLaFiche({ fiche: 'essai.html', html: h, gabaritsDuMoteur: moteur, correspondances });

const regles = (r: ReturnType<typeof valider>) => r.erreurs.map(e => e.regle);

describe('validerLaFiche — le manifeste (§ 2) et les pages (§ 3)', () => {
    it('accepte une fiche conforme', () => {
        const r = valider(html(gabarit([champ('identity.name')])), [gabarit([champ('identity.name')]) as GabaritDeFiche]);
        expect(r.erreurs).toEqual([]);
        expect(r.accepte).toBe(true);
    });

    it('refuse une fiche sans manifeste', () => {
        const r = valider('<html><body>une fiche</body></html>');
        expect(r.accepte).toBe(false);
        expect(regles(r)).toEqual(['§ 2']);
    });

    it('trouve le manifeste quel que soit l’ordre de ses attributs', () => {
        expect(extraireLeManifeste('<script id="character-sheet-template" type="application/json">{}</script>').json).toBe('{}');
    });

    it('exige un identifiant en minuscules et tirets', () => {
        expect(regles(valider(html(gabarit([champ('a')], { id: 'Mon Modèle' }))))).toContain('§ 2');
    });

    it('exige des fonds de page intégrés', () => {
        const t = gabarit([champ('a')]);
        t.pages[0].backgroundData = 'page-1.png';
        expect(regles(valider(html(t)))).toEqual(['§ 3']);
    });
});

describe('validerLaFiche — les champs (§ 4)', () => {
    it('refuse un type inconnu, et accepte les alias que le moteur normalise', () => {
        expect(regles(valider(html(gabarit([champ('a', { type: 'slider' })]))))).toEqual(['§ 4']);
        expect(regles(valider(html(gabarit([champ('a', { type: 'clickzone', value: 1 })]))))).toEqual([]);
    });

    it('ne laisse partager une clé qu’aux hotspots d’une même piste', () => {
        expect(regles(valider(html(gabarit([champ('a'), champ('a')]))))).toEqual(['§ 4']);
        const piste = [1, 2, 3].map(v => champ('stress', { type: 'hotspot', value: v }));
        expect(regles(valider(html(gabarit(piste))))).toEqual([]);
    });

    it('refuse une piste qui mêle valeurs nombres et texte', () => {
        const piste = [champ('de', { type: 'hotspot', value: 6 }), champ('de', { type: 'hotspot', value: 'd8' })];
        expect(valider(html(gabarit(piste))).erreurs[0].message).toContain('jauge');
    });

    it('conseille le hotspot pour une piste en cases numérotées', () => {
        const cases = [1, 2, 3, 4].map(n => champ(`stress.${n}`, { type: 'checkbox' }));
        const r = valider(html(gabarit(cases)));
        expect(r.accepte).toBe(true);
        expect(r.avertissements.some(a => a.message.includes('hotspots'))).toBe(true);
    });

    it('vérifie la source d’une valeur dérivée', () => {
        const derive = champ('force.moitie', { type: 'number', derive: { source: 'force', operation: 'floor-divide' } });
        expect(regles(valider(html(gabarit([derive]))))).toEqual(['§ 4']);
    });
});

describe('validerLaFiche — l’autonomie (§ 5)', () => {
    it('refuse une ressource chargée depuis le réseau', () => {
        const r = valider(html(gabarit([champ('a')]), '<link rel="stylesheet" href="https://cdn.exemple/f.css">'));
        expect(regles(r)).toContain('§ 5');
    });
});

describe('validerLaFiche — les clés sont un contrat (§ 6)', () => {
    /* Le défaut du 2026-08-24 : une régénération renomme une clé, et la correspondance pointe dans le vide. */
    it('refuse une clé disparue par rapport au gabarit intégré au moteur', () => {
        const moteur = [gabarit([champ('identity.name'), champ('skills.level')]) as GabaritDeFiche];
        const r = valider(html(gabarit([champ('identity.name'), champ('skills.niveau')])), moteur);
        expect(r.erreurs.map(e => [e.regle, e.message.includes('skills.level')])).toEqual([['§ 6', true]]);
        expect(r.avertissements.some(a => a.message.includes('skills.niveau'))).toBe(true);
    });

    it('signale un changement de type', () => {
        const moteur = [gabarit([champ('skills.level', { type: 'number' })]) as GabaritDeFiche];
        const r = valider(html(gabarit([champ('skills.level', { type: 'text' })])), moteur);
        expect(r.accepte).toBe(true);
        expect(r.avertissements.some(a => a.message.includes('change de type'))).toBe(true);
    });
});

describe('validerLaFiche — la correspondance avec GM-OS (§ 7)', () => {
    const table = (cles: string[]): CorrespondanceDeFiche => ({
        version: 1, gabaritDeLaFiche: 'jeu-fr', champs: cles.map(c => ({ gmos: c.replace('.', '_'), fiche: c })),
    });

    it('vérifie la table qui vise ce gabarit, dans les deux sens', () => {
        const h = html(gabarit([champ('identity.name'), champ('identity.age')]));
        expect(valider(h, [], [{ chemin: 't.json', table: table(['identity.name', 'identity.age']) }]).erreurs).toEqual([]);
        const r = valider(h, [], [{ chemin: 't.json', table: table(['identity.name']) }]);
        expect(r.erreurs.map(e => e.regle)).toEqual(['§ 7']);
        expect(r.erreurs[0].message).toContain('identity.age');
    });

    it('avertit qu’aucune table ne vise la fiche', () => {
        const r = valider(html(gabarit([champ('a')])));
        expect(r.avertissements.some(a => a.regle === '§ 7')).toBe(true);
    });
});

describe('les outils autour', () => {
    it('contrôle la migration des anciennes cases avant de les exempter comme pistes visibles', () => {
        const anciens = [1, 2, 3].map(i => champ(`stress.${i}`, { type: 'checkbox', legacy: true }));
        const pistes = [1, 2, 3].map(i => champ('stress', { type: 'hotspot', value: i }));
        const g = gabarit([...anciens, ...pistes], { legacySeries: { stress: anciens.map(c => c.key) } });
        expect(valider(html(g)).erreurs).toEqual([]);
        expect(valider(html(g)).avertissements.filter(a => a.regle === '§ 4')).toEqual([]);
        expect(valider(html({ ...g, legacySeries: { stress: ['absent'] } })).erreurs.some(e => e.regle === '§ 6')).toBe(true);
    });
    it('lit les gabarits intégrés du moteur', () => {
        const source = `<script id="builtinTemplates" type="application/json">[{"id":"a"},{"id":"b"}]</script>`;
        expect(gabaritsDuMoteur(source).map(g => g.id)).toEqual(['a', 'b']);
    });

    it('rend un rapport à coller, verdict en tête', () => {
        const texte = rapportEnTexte(valider('<html></html>'));
        expect(texte).toContain('REFUSÉE');
        expect(texte).toContain('[§ 2]');
    });
});
