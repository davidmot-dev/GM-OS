import { describe, it, expect } from 'vitest';
import {
    ligneServeur,
    formatDuree,
    formatTaille,
    ajouterAuJournal,
    evenementRequete,
    evenementReponse,
    LONGUEUR_MAX_LIGNE,
    LIGNES_CONSERVEES,
    type EvenementMcp,
} from './mcpActivity';

const ESC = String.fromCharCode(27);

describe('ligneServeur', () => {
    it('garde une ligne informative telle quelle', () => {
        expect(ligneServeur('Envoi de la requête au carnet')).toBe('Envoi de la requête au carnet');
    });

    it('jette une ligne vide ou purement décorative', () => {
        expect(ligneServeur('')).toBeNull();
        expect(ligneServeur('   \t ')).toBeNull();
        expect(ligneServeur('..........')).toBeNull();
        expect(ligneServeur('=========')).toBeNull();
    });

    it('retire les couleurs ANSI, illisibles dans une interface HTML', () => {
        expect(ligneServeur(`${ESC}[32mConnecté${ESC}[0m`)).toBe('Connecté');
    });

    it('retire le préambule des journaux Python et garde le message', () => {
        expect(ligneServeur('INFO:notebooklm.mcp:Requête acceptée')).toBe('notebooklm.mcp:Requête acceptée');
        expect(ligneServeur('2026-08-10 09:12:03,456 - serveur - INFO - Session ouverte')).toBe('Session ouverte');
        expect(ligneServeur('WARNING: jeton bientôt expiré')).toBe('jeton bientôt expiré');
    });

    it('jette le bruit qui ne dit rien de la requête', () => {
        expect(ligneServeur('DeprecationWarning: ssl.PROTOCOL_TLS is deprecated')).toBeNull();
        expect(ligneServeur('  warnings.warn(msg)')).toBeNull();
    });

    it('borne une ligne interminable', () => {
        const longue = ligneServeur('x'.repeat(LONGUEUR_MAX_LIGNE + 50))!;
        expect(longue.length).toBe(LONGUEUR_MAX_LIGNE + 1);
        expect(longue.endsWith('…')).toBe(true);
    });

    it('ne jette pas une ligne devenue vide après nettoyage sans le dire', () => {
        // Un préambule seul ne laisse rien : mieux vaut rien qu'une ligne vide.
        expect(ligneServeur('INFO: ')).toBeNull();
    });
});

describe('formatDuree', () => {
    it('parle en secondes en deçà de la minute', () => {
        expect(formatDuree(0)).toBe('0 s');
        expect(formatDuree(12_400)).toBe('12 s');
        expect(formatDuree(59_000)).toBe('59 s');
    });

    it('passe aux minutes ensuite — c\'est là que la question se pose', () => {
        expect(formatDuree(60_000)).toBe('1 min');
        expect(formatDuree(200_000)).toBe('3 min 20 s');
        expect(formatDuree(600_000)).toBe('10 min');
    });

    it('ne rend jamais de durée négative', () => {
        expect(formatDuree(-5000)).toBe('0 s');
    });
});

describe('formatTaille', () => {
    it('groupe les milliers', () => {
        expect(formatTaille(842)).toBe('842 caractères');
        expect(formatTaille(12_345)).toBe('12 345 caractères');
        expect(formatTaille(1_234_567)).toBe('1 234 567 caractères');
    });
});

describe('journal', () => {
    it('décrit une requête et sa réponse sans dépendre du serveur', () => {
        // C'est la couche fiable : elle informe même si le serveur reste muet.
        expect(evenementRequete('notebook_query', 7).message).toContain('notebook_query');
        const reponse = evenementReponse(7, 45_000, 4200);
        expect(reponse.message).toContain('45 s');
        expect(reponse.message).toContain('4 200 caractères');
        expect(reponse.requete).toBe(7);
    });

    it('borne le journal aux dernières lignes', () => {
        // Les dernières sont les seules qui renseignent sur l'instant.
        let journal: EvenementMcp[] = [];
        for (let i = 0; i < LIGNES_CONSERVEES + 30; i++) {
            journal = ajouterAuJournal(journal, evenementRequete(`outil-${i}`, i));
        }
        expect(journal).toHaveLength(LIGNES_CONSERVEES);
        expect(journal[journal.length - 1].message).toContain(`outil-${LIGNES_CONSERVEES + 29}`);
        expect(journal[0].message).toContain('outil-30');
    });

    it('n\'altère pas le journal reçu', () => {
        const origine: EvenementMcp[] = [];
        ajouterAuJournal(origine, evenementRequete('x', 1));
        expect(origine).toHaveLength(0);
    });
});
