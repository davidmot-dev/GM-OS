import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { stockageLocalDuMJ } from '../../utils/ecritureReserveeAuMJ';
import { verser as verserALAction, type ActionComplexe, type VersementALAction } from '../dice/systemes/jetsLiesDeDegenesis';

/**
 * **Ce qui passe d'un jet de Degenesis à un autre** — DEG-A4, 04/11/2026, à la demande de
 * David (« on commence DEG-A3 et DEG-A4 »), sur le modèle du round (`useRoundDeDegenesisStore`).
 *
 * - les **aides** mises de côté : les déclencheurs d'un assistant qui a réussi, en dés pour le
 *   prochain jet de l'aidé (p. 21) — pris une fois, au lancer ;
 * - les **reports** de combinaison : les déclencheurs d'un premier test, pour le second du même
 *   personnage (p. 20) — pris une fois ;
 * - les **actions complexes** ouvertes : objectif et versements de l'équipe (p. 21).
 *
 * Les personnages sont désignés par leur identifiant de fiche. Gardé chez le meneur seulement.
 */
export interface AideEnAttente { id: string; pour: string; pourNom: string; de: string; des: number }
export interface ReportEnAttente { declencheurs: number; source: string }

interface JetsLiesDeDegenesisState {
    aides: AideEnAttente[];
    reports: Record<string, ReportEnAttente>;
    actions: ActionComplexe[];
    /** L'action complexe que le panneau propose d'abord. */
    actionCourante: string | null;
    donnerUneAide: (aide: Omit<AideEnAttente, 'id'>) => string;
    retirerUneAide: (id: string) => void;
    /** Les aides de ce personnage quittent l'attente : rend leur total de dés. */
    prendreLesAides: (pour: string) => number;
    reporter: (pour: string, report: ReportEnAttente) => void;
    oublierLeReport: (pour: string) => void;
    /** Le report de ce personnage quitte l'attente : rend ses déclencheurs. */
    prendreLeReport: (pour: string) => number;
    ouvrirUneAction: (nom: string, objectif: number) => string;
    choisirLAction: (id: string) => void;
    verser: (id: string, v: VersementALAction) => ActionComplexe | undefined;
    clore: (id: string) => void;
}

const nouvelId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const useJetsLiesDeDegenesisStore = create<JetsLiesDeDegenesisState>()(
    persist(
        (set, get) => ({
            aides: [],
            reports: {},
            actions: [],
            actionCourante: null,
            donnerUneAide: (aide) => {
                const id = nouvelId();
                set(s => ({ aides: [...s.aides, { ...aide, id }] }));
                return id;
            },
            retirerUneAide: (id) => set(s => ({ aides: s.aides.filter(a => a.id !== id) })),
            prendreLesAides: (pour) => {
                const prises = get().aides.filter(a => a.pour === pour);
                if (prises.length) set(s => ({ aides: s.aides.filter(a => a.pour !== pour) }));
                return prises.reduce((t, a) => t + a.des, 0);
            },
            reporter: (pour, report) => set(s => ({ reports: { ...s.reports, [pour]: report } })),
            oublierLeReport: (pour) => set(s => {
                const { [pour]: _parti, ...reste } = s.reports;
                return { reports: reste };
            }),
            prendreLeReport: (pour) => {
                const r = get().reports[pour];
                if (r) get().oublierLeReport(pour);
                return r?.declencheurs ?? 0;
            },
            ouvrirUneAction: (nom, objectif) => {
                const id = nouvelId();
                set(s => ({ actions: [...s.actions, { id, nom, objectif: Math.max(1, Math.trunc(objectif)), versements: [] }], actionCourante: id }));
                return id;
            },
            choisirLAction: (id) => set({ actionCourante: id }),
            verser: (id, v) => {
                const a = get().actions.find(x => x.id === id);
                if (!a) return undefined;
                const apres = verserALAction(a, v);
                set(s => ({ actions: s.actions.map(x => (x.id === id ? apres : x)) }));
                return apres;
            },
            clore: (id) => set(s => ({
                actions: s.actions.filter(x => x.id !== id),
                actionCourante: s.actionCourante === id ? (s.actions.find(x => x.id !== id)?.id ?? null) : s.actionCourante,
            })),
        }),
        {
            name: 'gmos-jets-lies-de-degenesis',
            storage: stockageLocalDuMJ(),
            partialize: s => ({ aides: s.aides, reports: s.reports, actions: s.actions, actionCourante: s.actionCourante }),
        },
    ),
);
