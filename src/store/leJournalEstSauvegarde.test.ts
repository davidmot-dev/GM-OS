import { describe, it, expect, beforeEach } from 'vitest';
import { construireLaSauvegarde } from './SessionService';
import { useJournalStore } from '../modules/journal/useJournalStore';
import { validateSession } from '../types/schemas';

/**
 * **Le journal de séance entre dans la sauvegarde — trouvé absent le 2026-09-12.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUI MANQUAIT, ET DEPUIS QUAND
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `construireLaSauvegarde` collectait **onze** magasins. `useJournalStore` n'en
 * faisait pas partie, et l'export Nexus ne le portait pas non plus : le fil
 * d'une séance, les scènes traversées et les comptes rendus n'étaient protégés
 * par **rien**. La sauvegarde automatique qui a tout ramené le 2026-09-11 ne les
 * aurait pas ramenés.
 *
 * ⭐ **Ce n'est pas la première fois, et le code le disait déjà.**
 * `SessionService` porte en commentaire la cicatrice précédente : *« il y
 * manquait `entities`, `clues` et `sessions` — les PNJ, les indices et
 * l'historique des séances n'étaient donc dans aucune sauvegarde »*. Même
 * famille, même cause : **une liste de ce qu'on sauvegarde, recopiée à la main,
 * oublie toujours quelque chose.**
 *
 * ⚠️ Ce fichier ne garde pas « le journal est là » comme un détail : il garde
 * **le principe**. La question qui trouve ces oublis n'est pas *« qu'est-ce qui
 * est sauvegardé ? »* mais **« qui écrit une donnée que personne ne ramasse ? »**
 */

const journalDEssai = {
    id: 'j-1',
    title: 'Séance témoin',
    campaignId: 'temoin-campagne',
    startTimestamp: 1_000,
    events: [
        { id: 'e-1', timestamp: 1_100, type: 'NOTE', title: 'Le sas s’ouvre', content: '', nature: 'chronique' },
    ],
};

describe('le journal entre dans la sauvegarde', () => {
    beforeEach(() => {
        useJournalStore.setState({ journals: [journalDEssai] as never, activeJournalId: 'j-1' });
    });

    it('la sauvegarde porte un module `journal`', () => {
        const sauvegarde = construireLaSauvegarde();

        expect(
            sauvegarde.modules.journal,
            'le module journal est absent de la sauvegarde',
        ).toBeDefined();
    });

    /*
      ⛔ Porter un module vide ne vaudrait rien. C'est le CONTENU qu'on protège —
      et un journal sans ses événements est un journal perdu.
    */
    it('avec le journal, et ses événements', () => {
        const { journal } = construireLaSauvegarde().modules;

        expect(journal!.journals).toHaveLength(1);
        expect(journal!.journals[0].id).toBe('j-1');
        expect(journal!.journals[0].events, 'le fil de la séance est vide').toHaveLength(1);
    });

    /*
      ⚠️ **La sauvegarde doit rester lisible par le chemin qui la relit.** Un
      module ajouté à la récolte mais absent du schéma serait écrit, puis jeté
      silencieusement à la relecture — le piège de `modules` qui n'est PAS
      `.passthrough()`, déjà payé par Music-OS.
    */
    it('et le schéma la laisse traverser', () => {
        const relue = validateSession(construireLaSauvegarde());

        expect(
            (relue.modules as { journal?: { journals: unknown[] } }).journal?.journals,
            'le journal a été jeté à la validation — `modules` n’est pas passthrough',
        ).toHaveLength(1);
    });

    it('un journal sans séance reste un module valide', () => {
        useJournalStore.setState({ journals: [], activeJournalId: null });

        const { journal } = construireLaSauvegarde().modules;
        expect(journal!.journals).toEqual([]);
    });
});
