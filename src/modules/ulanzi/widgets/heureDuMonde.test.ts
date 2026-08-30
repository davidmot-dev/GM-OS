import { describe, it, expect } from 'vitest';
import { composerLHeure, COULEUR_DE_L_HEURE, heureEnTexte, texteDuTemps } from './heureDuMonde';

/**
 * **L'heure du monde — demandée par David le 2026-08-30.**
 *
 * ⚠️ Le seul widget qui **défile**, et donc le seul qui déroge au § 1 du plan.
 * C'est une décision de David, prise après que j'aie proposé de garder l'heure
 * fixe : *« l'heure ne suffit pas, alors fais défiler la date et l'heure »*.
 *
 * Ce que ces tests gardent avant tout : **le mode temps réel ne lit pas le
 * magasin**. Son `timestamp` est celui de la dernière pose manuelle — l'afficher
 * donnerait une heure figée, plausible, et fausse.
 */

/** Le 30 août 2026 à 14 h 32, heure locale. */
const QUAND = new Date(2026, 7, 30, 14, 32, 5).getTime();
/** Un timestamp volontairement très différent, posé à la main dans le magasin. */
const POSE = new Date(2019, 0, 2, 3, 4, 5).getTime();

describe('HH:MM', () => {
    it('fait toujours cinq caractères', () => {
        expect(heureEnTexte(9, 5)).toBe('09:05');
        expect(heureEnTexte(23, 59)).toHaveLength(5);
    });

    it('ne déborde pas des bornes d’une journée', () => {
        expect(heureEnTexte(25, 61)).toBe('01:01');
    });
});

describe('le texte qui défile', () => {
    /**
     * **Le piège du temps réel.** `ClockVisualizer` tient sa propre horloge
     * locale et n'écrit rien dans le magasin : lire `timestamp` en mode
     * `realtime` afficherait l'heure de la dernière pose manuelle.
     */
    it('prend l’heure système en temps réel, pas celle du magasin', () => {
        const texte = texteDuTemps({ mode: 'realtime', timestamp: POSE }, QUAND);

        expect(texte).toContain('14:32');
        expect(texte).not.toContain('03:04');
    });

    it('prend le magasin en mode statique', () => {
        const texte = texteDuTemps({ mode: 'static', timestamp: POSE }, QUAND);

        expect(texte).toContain('03:04');
        expect(texte).not.toContain('14:32');
    });

    it('porte la date ET l’heure, dans cet ordre', () => {
        const texte = texteDuTemps({ mode: 'static', timestamp: POSE }, QUAND);
        expect(texte.indexOf('2019')).toBeLessThan(texte.indexOf('03:04'));
    });

    /** L'appareil force les majuscules et sa fonte ne garantit pas les accents. */
    it('sort en majuscules et sans accents', () => {
        const texte = texteDuTemps({
            mode: 'fantasy',
            timestamp: POSE,
            dateFantastique: { jour: 15, mois: 'Sarpédon', annee: 8241, heure: 8, minute: 5, jourDeLaSemaine: 'Lundi' },
        }, QUAND);

        expect(texte).toBe('LUNDI 15 SARPEDON 8241 08:05');
    });

    /** Un mois intercalaire n'a pas de quantième — le livre le dit, pas nous. */
    it('omet le quantième d’un mois intercalaire', () => {
        const texte = texteDuTemps({
            mode: 'fantasy',
            timestamp: POSE,
            dateFantastique: { jour: 1, mois: 'Veille', annee: 8241, heure: 0, minute: 0, intercalaire: true },
        }, QUAND);

        expect(texte).toBe('VEILLE 8241 00:00');
    });

    /** Mode fantastique sans calendrier chargé : on retombe sur le timestamp. */
    it('ne casse pas quand la date fantastique manque', () => {
        const texte = texteDuTemps({ mode: 'fantasy', timestamp: POSE, dateFantastique: null }, QUAND);
        expect(texte).toContain('03:04');
    });
});

describe('la charge envoyée', () => {
    /**
     * **`noScroll` est absent, et c'est tout l'objet de ce widget.** Son absence
     * est ce qui autorise AWTRIX à faire défiler un texte plus long que la
     * matrice. Tous les autres widgets le posent à `true`.
     */
    it('ne pose PAS noScroll — c’est ce qui la fait défiler', () => {
        const charge = composerLHeure({ mode: 'static', timestamp: POSE }, QUAND);
        expect('noScroll' in charge).toBe(false);
    });

    it('porte une couleur froide, pour ne pas se lire comme une alerte', () => {
        expect(composerLHeure({ mode: 'static', timestamp: POSE }, QUAND).color)
            .toBe(COULEUR_DE_L_HEURE);
    });
});
