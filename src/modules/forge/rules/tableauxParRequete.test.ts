import { describe, expect, it } from 'vitest';
import {
    ajouterAuBrouillon, decouperEnLots, ecartsDesLignes, lireLesPiecesAnnoncees, lotDejaRecopie, nettoyerLeLot, porteLaListeDesTableaux,
    premiereMoitieAssemblee, tableauxDeLaReponse,
} from './tableauxParRequete';

/*
 * F3 — un tableau par requête (06/11/2026, David : « termine F3 »). La liste annoncée, les lots, le
 * brouillon qui porte l'avancement, et le contrôle des lignes.
 */
const ENTETE = `## Métadonnées
- sujet : Armes
- couverture : complète

## Règle
Les armes ajoutent la FOR.

## Tableaux du livre
| Tableau | Lignes |
| --- | --- |
| **Armes de contact** | 10 |
| « Armes à distance légères » | 12 lignes |
| Explosifs | 4 |
| Tableau des Protections | – |
| Armes de contact | 10 |`;

const CONTACT = `### Tableau des Armes de contact

| Arme | DM |
| --- | --- |
| **Machette** | 1d6+1 |
| **Fouet** | 1d4 |`;

describe('F3 — la liste annoncée', () => {
    it('lit titre et nombre, nettoie gras, guillemets et « Tableau des », sans doublon', () => {
        expect(lireLesPiecesAnnoncees(ENTETE)).toEqual([
            { titre: 'Armes de contact', attendu: 10 },
            { titre: 'Armes à distance légères', attendu: 12 },
            { titre: 'Explosifs', attendu: 4 },
            { titre: 'Protections', attendu: null },
        ]);
        expect(porteLaListeDesTableaux(ENTETE)).toBe(true);
        expect(lireLesPiecesAnnoncees('## Règle\nRien.')).toEqual([]);
        expect(porteLaListeDesTableaux('## Règle\nRien.')).toBe(false);
    });

    it('une liste de créatures : un nom par ligne, sans nombre', () => {
        const md = '## Tableaux du livre\n| Créature | Section |\n| --- | --- |\n| **Figurant** | LES RÔLES |\n| Premier rôle | LES RÔLES |';
        expect(lireLesPiecesAnnoncees(md)).toEqual([{ titre: 'Figurant', attendu: null }, { titre: 'Premier rôle', attendu: null }]);
    });
});

describe('F3 — les lots', () => {
    it('jusqu’à 15 lignes attendues par requête ; un tableau sans compte part seul', () => {
        const lots = decouperEnLots(lireLesPiecesAnnoncees(ENTETE), 'equipement');
        expect(lots.map(l => l.map(p => p.titre))).toEqual([
            ['Armes de contact'],
            ['Armes à distance légères'],
            ['Explosifs'],
            ['Protections'],
        ]);
        expect(decouperEnLots([{ titre: 'A', attendu: 4 }, { titre: 'B', attendu: 6 }, { titre: 'C', attendu: 5 }, { titre: 'D', attendu: 1 }], 'equipement')
            .map(l => l.map(p => p.titre))).toEqual([['A', 'B', 'C'], ['D']]);
    });

    it('six créatures par requête', () => {
        const pieces = Array.from({ length: 14 }, (_, i) => ({ titre: `C${i}`, attendu: null }));
        expect(decouperEnLots(pieces, 'creatures').map(l => l.length)).toEqual([6, 6, 2]);
    });
});

describe('F3 — le brouillon', () => {
    it('la réponse d’un lot : ses tableaux, sans « ## » ni « --- » ni introduction', () => {
        expect(tableauxDeLaReponse(`Voici les tableaux.\n\n## Valeurs\n\n${CONTACT}\n\n---\n`)).toBe(CONTACT);
        expect(tableauxDeLaReponse('Je ne trouve rien.')).toBe('');
    });

    it('les lots s’ajoutent sous « ## Valeurs », une seule fois ; un lot reçu est reconnu', () => {
        const un = ajouterAuBrouillon(ENTETE, CONTACT);
        const deux = ajouterAuBrouillon(un, '### Tableau des Explosifs\n\n| Arme | DM |\n| --- | --- |\n| **Dynamite** | 3d6 |');
        expect(deux.match(/## Valeurs/g)).toHaveLength(1);
        expect(lotDejaRecopie(deux, [{ titre: 'Armes de contact', attendu: 10 }], 'equipement')).toBe(true);
        expect(lotDejaRecopie(deux, [{ titre: 'Explosifs', attendu: 4 }], 'equipement')).toBe(true);
        expect(lotDejaRecopie(deux, [{ titre: 'Protections', attendu: null }], 'equipement')).toBe(false);
        expect(lotDejaRecopie(ENTETE, [{ titre: 'Armes de contact', attendu: 10 }], 'equipement')).toBe(false);
    });

    it('un tableau que le carnet déclare absent des sources ne se redemande pas', () => {
        const brouillon = ajouterAuBrouillon(ENTETE, 'Absent des sources : Protections');
        expect(lotDejaRecopie(brouillon, [{ titre: 'Protections', attendu: null }], 'equipement')).toBe(true);
    });

    it('les créatures reçues sont reconnues par leur nom dans le tableau de profil', () => {
        const brouillon = ajouterAuBrouillon(ENTETE, '### Tableau des profils\n\n| Créature | DEF |\n| --- | --- |\n| **Figurant** | 10 |');
        expect(lotDejaRecopie(brouillon, [{ titre: 'Figurant', attendu: null }], 'creatures')).toBe(true);
        expect(lotDejaRecopie(brouillon, [{ titre: 'Figurant', attendu: null }, { titre: 'Premier rôle', attendu: null }], 'creatures')).toBe(false);
    });

    it('la première moitié assemblée n’a plus la liste', () => {
        const assemblee = premiereMoitieAssemblee(ajouterAuBrouillon(ENTETE, CONTACT));
        expect(assemblee).not.toContain('Tableaux du livre');
        expect(assemblee).toContain('## Règle');
        expect(assemblee).toContain('## Valeurs');
        expect(assemblee).toContain('**Machette**');
    });
});

describe('F3 — le contrôle des lignes', () => {
    it('dit l’écart entre annoncé et recopié, et le tableau annoncé jamais recopié', () => {
        const assemblee = premiereMoitieAssemblee(ajouterAuBrouillon(ENTETE, CONTACT));
        expect(ecartsDesLignes([{ titre: 'Armes de contact', attendu: 2 }], assemblee, 'equipement')).toEqual([]);
        expect(ecartsDesLignes([{ titre: 'Armes de contact', attendu: 10 }, { titre: 'Protections', attendu: null }], assemblee, 'equipement')).toEqual([
            'Armes de contact : 10 ligne(s) annoncée(s), 2 recopiée(s).',
            'Protections : annoncé, aucune ligne recopiée.',
        ]);
    });

    it('les créatures annoncées sans profil', () => {
        const md = '## Valeurs\n\n| Créature | DEF |\n| --- | --- |\n| **Figurant** | 10 |';
        expect(ecartsDesLignes([{ titre: 'Figurant', attendu: null }, { titre: 'Premier rôle', attendu: null }], md, 'creatures'))
            .toEqual(['Créatures annoncées sans profil recopié (1 sur 2) : Premier rôle.']);
    });
});

/*
 * Barbarians of Lemuria, 07/11/2026 : le carnet a rendu trois fois le même tableau, dont une coupée
 * en pleine ligne (« …Exemples: chark### Tableau des profils »). Le lot se nettoie avant d'entrer.
 */
describe('F3 — le lot nettoyé', () => {
    const DEJA = ajouterAuBrouillon(ENTETE, `### Tableau des profils

| Créature | Vigueur | Vitalité |
| --- | --- | --- |
| **Créature minuscule** | -3 | 1 |
| **Créature grande** | 4 | 20 |`);

    it('un tableau déjà reçu, répété et coupé : rien n’entre, et les écarts sont comptés', () => {
        const lot = `### Tableau des profils

| Créature | Vigueur | Vitalité |
| --- | --- | --- |
| **Créature minuscule** | -3 | 1 |
| **Créature grande** | 4 | 20 |
| **Créature massive** | 10 | 50 | Exemples: chark### Tableau des profils

| Créature | Vigueur | Vitalité |
| --- | --- | --- |
| **Créature minuscule** | -3 | 1 |`;
        const r = nettoyerLeLot(DEJA, lot);
        expect(r).toMatchObject({ tableaux: '', doublons: 3, coupees: 1 });
    });

    it('un lot neuf entre tel quel ; seules ses lignes répétées s’écartent', () => {
        const lot = `### Tableau des profils des PNJ

| Créature | Vigueur | Vitalité |
| --- | --- | --- |
| **Archer de Tyrus** | 1 | 7 |
| **Créature grande** | 4 | 20 |
| **Assassin halakhi** | 0 | 6 |`;
        const r = nettoyerLeLot(DEJA, lot);
        expect(r.doublons).toBe(1);
        expect(r.coupees).toBe(0);
        expect(r.tableaux).toContain('**Archer de Tyrus**');
        expect(r.tableaux).toContain('**Assassin halakhi**');
        expect(r.tableaux).not.toContain('Créature grande');
        expect(r.tableaux).toContain('| --- | --- | --- |');
    });

    it('« Absent des sources » et les lignes sans nom en gras (tables d’attaques) passent', () => {
        const lot = 'Absent des sources : Démons\n\n### Tableau des attaques de Drakk\n\n| D6 | Attaque |\n| --- | --- |\n| 1 | **Morsure** : d6B |';
        const r = nettoyerLeLot(DEJA, lot);
        expect(r.tableaux).toBe(lot);
        expect(r).toMatchObject({ doublons: 0, coupees: 0 });
    });
});
