import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { atteinteDeLaRecherche, clefDeRegroupement, estUneLacune, type Atteinte, type SourceAtteinte } from './atteinteDeLaRecherche';

/**
 * Le journal des lacunes — **ce que l'Oracle n'a pas su trouver.**
 *
 * **Étage 4 de l'axe M**, et ce que le plan appelle *« la meilleure idée du
 * lot »* : les sujets à forger cessent d'être choisis à l'intuition, **l'usage
 * réel en séance les désigne**.
 *
 * **Il se remplit sans intervention** — pas de pouces haut/bas, qui créent une
 * friction à table et ne sont jamais cliqués.
 *
 * **Il persiste, et c'est sa raison d'être.** Une lacune se traite en
 * après-partie, parfois des jours plus tard : la garder en mémoire vive
 * reviendrait à la perdre au moment même où elle sert.
 */

export interface QuestionNotee {
    /** La question telle qu'elle a été posée — c'est elle qu'on relira. */
    question: string;
    /** La clé de regroupement, calculée une fois à l'enregistrement. */
    clef: string;
    atteinte: Atteinte;
    quand: number;
    /** Le système actif au moment de la question, pour savoir où forger. */
    systeme?: string;
}

/** Une lacune regroupée, telle que l'écran la montre. */
export interface LacuneRegroupee {
    clef: string;
    /** La formulation la plus récente — celle dont le meneur se souvient. */
    question: string;
    fois: number;
    derniere: number;
    atteinte: Atteinte;
    systeme?: string;
}

/**
 * Au-delà, on oublie les plus anciennes.
 *
 * **Une file qu'on ne vide jamais cesse d'être une file.** Deux cents questions
 * couvrent plusieurs mois de jeu ; au-delà, ce qui n'a pas été forgé ne le sera
 * pas, et la liste ne sert plus qu'à décourager.
 */
const MEMOIRE = 200;

/**
 * Regroupe et trie les lacunes — **fonction pure, et c'est ce qui la rend
 * lisible par un écran.**
 *
 * Elle vivait dans le magasin, où React ne pouvait pas la recalculer : un écran
 * qui l'appelait sur `getState()` ne se redessinait pas quand une question
 * s'ajoutait. *Une donnée dérivée doit se dériver de ce qu'on observe.*
 */
export function regrouperLesLacunes(questions: readonly QuestionNotee[]): LacuneRegroupee[] {
    const parClef = new Map<string, LacuneRegroupee>();

    for (const q of questions) {
        if (!estUneLacune(q.atteinte)) continue;

        const deja = parClef.get(q.clef);
        if (!deja) {
            parClef.set(q.clef, {
                clef: q.clef, question: q.question, fois: 1,
                derniere: q.quand, atteinte: q.atteinte, systeme: q.systeme,
            });
            continue;
        }

        deja.fois += 1;
        /*
          **On garde la formulation la plus RÉCENTE**, pas la première : c'est
          celle dont le meneur se souvient, et souvent la mieux posée — une
          question reformulée l'est parce que la première n'avait pas abouti.
        */
        if (q.quand >= deja.derniere) {
            deja.question = q.question;
            deja.derniere = q.quand;
            deja.atteinte = q.atteinte;
            deja.systeme = q.systeme;
        }
    }

    /*
      **Les plus fréquentes d'abord, et à égalité les plus récentes.** Ce qui
      revient est ce qui manque vraiment : une question posée six fois en trois
      séances désigne une fiche à forger mieux que n'importe quelle intuition.
    */
    return [...parClef.values()].sort((a, b) => b.fois - a.fois || b.derniere - a.derniere);
}

interface EtatDuJournal {
    questions: QuestionNotee[];
    /** Note ce qu'une question a atteint. Ne juge rien, ne demande rien. */
    noter: (question: string, sources: readonly SourceAtteinte[], systeme?: string) => void;
    /** Les lacunes, regroupées et triées : les plus fréquentes d'abord. */
    lacunes: () => LacuneRegroupee[];
    oublier: (clef: string) => void;
    vider: () => void;
}

export const useJournalDesLacunes = create<EtatDuJournal>()(persist((set, get) => ({
    questions: [],

    noter: (question, sources, systeme) => {
        const propre = question.trim();
        if (!propre) return;

        const clef = clefDeRegroupement(propre);
        // Une question qui ne laisse que des mots vides ne se regroupe avec
        // rien : la noter fabriquerait une entrée qu'aucun sujet ne recouvre.
        if (!clef) return;

        const notee: QuestionNotee = {
            question: propre,
            clef,
            atteinte: atteinteDeLaRecherche(sources, propre),
            quand: Date.now(),
            systeme,
        };
        set(etat => ({ questions: [...etat.questions, notee].slice(-MEMOIRE) }));
    },

    lacunes: () => regrouperLesLacunes(get().questions),

    oublier: (clef) => set(etat => ({ questions: etat.questions.filter(q => q.clef !== clef) })),
    vider: () => set({ questions: [] }),
}), {
    name: 'gmos-journal-des-lacunes',
    // La liste seule : les fonctions se reconstruisent, et persister une
    // fonction ne veut rien dire.
    partialize: (etat) => ({ questions: etat.questions }),
}));
