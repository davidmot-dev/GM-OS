import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PropositionDeChamps } from './logic/archetypes';

/**
 * **Le bestiaire du meneur — ce qu'il a fabriqué et veut retrouver.**
 *
 * *Demandé par David le 2026-09-03 : « une combinaison du pilote + archétypes
 * et d'un bestiaire que je remplis ».*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * IL APPARTIENT AU JEU, PAS À LA CAMPAGNE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Un pillard de Blade Runner resservira dans la campagne suivante ; un PNJ
 * nommé, non. C'est toute la différence entre un **gabarit** et une **entité** :
 * le gabarit dit « voilà à quoi ressemble un agent de Wallace », l'entité dit
 * « voilà Luv ». Les ranger ensemble obligerait à recopier le bestiaire à chaque
 * nouvelle campagne — *ce qu'on recopie finit par diverger.*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ET IL RETIENT AUSSI CE QUE LE MENEUR A CORRIGÉ
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `repartitions` garde, par jeu et par archétype, quels champs le meneur a
 * désignés comme forts ou faibles. GM-OS les **propose** par mots-clés
 * (`proposerLesChamps`), mais c'est une supposition sur le sens des mots d'un
 * jeu : dès que David a tranché une fois, on ne repropose plus, on applique.
 * *Une supposition qu'on refait chaque fois est une supposition qu'on n'a pas
 * écoutée.*
 */

/** Un adversaire type, prêt à être décliné en autant d'exemplaires qu'il faut. */
export interface GabaritDAdversaire {
    id: string;
    /** Le pilote auquel il appartient — un bestiaire par jeu. */
    jeuId: string;
    nom: string;
    archetypeId: string;
    rangId: string;
    /** Les valeurs de fiche, dans l'échelle du jeu. */
    sheetData: Record<string, number | string | boolean>;
    /** Ce que le meneur veut se rappeler : façon de combattre, tactique. */
    notes?: string;
    /** Quand il a été rangé — pour trier du plus récent au plus ancien. */
    creeLe: number;
}

interface BestiaireState {
    gabarits: GabaritDAdversaire[];
    /** Clé `jeuId:archetypeId` → la répartition validée par le meneur. */
    repartitions: Record<string, PropositionDeChamps>;

    /** Range un gabarit. Un même nom pour un même jeu écrase l'ancien. */
    enregistrer: (gabarit: Omit<GabaritDAdversaire, 'id' | 'creeLe'>) => void;
    oublier: (id: string) => void;
    /**
     * Renomme un gabarit.
     *
     * **Rend un verdict au lieu d'un booléen**, parce que « ça n'a pas marché »
     * ne suffit pas à l'écran : il doit pouvoir dire *pourquoi*. Et un nom déjà
     * pris est refusé plutôt qu'absorbé — `enregistrer` remplace sur le même
     * nom, ce qui est le bon geste quand on retouche un gabarit, mais ici cela
     * ferait **disparaître l'autre sans le dire**.
     */
    renommer: (id: string, nom: string) => 'ok' | 'nom-pris' | 'nom-vide' | 'introuvable';
    /** Les gabarits d'un jeu, du plus récent au plus ancien. */
    gabaritsDuJeu: (jeuId: string) => GabaritDAdversaire[];

    retenirLaRepartition: (jeuId: string, archetypeId: string, repartition: PropositionDeChamps) => void;
    repartitionRetenue: (jeuId: string, archetypeId: string) => PropositionDeChamps | null;
}

const cle = (jeuId: string, archetypeId: string) => `${jeuId}:${archetypeId}`;

export const useBestiaireStore = create<BestiaireState>()(
    persist(
        (set, get) => ({
            gabarits: [],
            repartitions: {},

            enregistrer: (gabarit) => {
                /*
                  **Le même nom pour le même jeu remplace au lieu d'empiler.**
                  Un meneur qui retouche « Pillard » et le range à nouveau veut
                  un pillard, pas deux — et une liste qui se remplit de doublons
                  cesse d'être consultée.
                */
                const existant = get().gabarits.find(
                    g => g.jeuId === gabarit.jeuId && g.nom.trim().toLowerCase() === gabarit.nom.trim().toLowerCase(),
                );

                const complet: GabaritDAdversaire = {
                    ...gabarit,
                    id: existant?.id ?? crypto.randomUUID(),
                    creeLe: Date.now(),
                };

                set((etat) => ({
                    gabarits: existant
                        ? etat.gabarits.map(g => (g.id === existant.id ? complet : g))
                        : [...etat.gabarits, complet],
                }));
            },

            oublier: (id) => set((etat) => ({ gabarits: etat.gabarits.filter(g => g.id !== id) })),

            renommer: (id, nom) => {
                const propre = nom.trim();
                if (!propre) return 'nom-vide';

                const gabarit = get().gabarits.find(g => g.id === id);
                if (!gabarit) return 'introuvable';

                const pris = get().gabarits.some(
                    g => g.id !== id
                        && g.jeuId === gabarit.jeuId
                        && g.nom.trim().toLowerCase() === propre.toLowerCase(),
                );
                if (pris) return 'nom-pris';

                set((etat) => ({
                    gabarits: etat.gabarits.map(g => (g.id === id ? { ...g, nom: propre } : g)),
                }));
                return 'ok';
            },

            /*
              **On inverse AVANT de trier**, et ce n'est pas une coquetterie :
              deux gabarits rangés dans la même milliseconde portent le même
              `creeLe`, et un tri stable les laisserait alors dans l'ordre
              d'insertion — c'est-à-dire le plus ancien devant. Inverser d'abord
              fait que l'égalité se départage par le dernier arrivé.
            */
            gabaritsDuJeu: (jeuId) => get().gabarits
                .filter(g => g.jeuId === jeuId)
                .reverse()
                .sort((a, b) => b.creeLe - a.creeLe),

            retenirLaRepartition: (jeuId, archetypeId, repartition) => set((etat) => ({
                repartitions: { ...etat.repartitions, [cle(jeuId, archetypeId)]: repartition },
            })),

            repartitionRetenue: (jeuId, archetypeId) => get().repartitions[cle(jeuId, archetypeId)] ?? null,
        }),
        {
            name: 'gmos-bestiaire-storage',
            partialize: (etat) => ({ gabarits: etat.gabarits, repartitions: etat.repartitions }),
        },
    ),
);
