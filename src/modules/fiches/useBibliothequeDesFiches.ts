import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { stockageLocalDuMJ } from '../../utils/ecritureReserveeAuMJ';

/**
 * **La copie de sauvegarde de la bibliothèque du moteur de fiches.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CETTE COPIE EXISTE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le moteur **garde sa bibliothèque** — tranché le 2026-08-28 — et la fiche fait
 * foi. Elle vit donc dans l'IndexedDB de l'origine `gmos://`, que la sauvegarde
 * automatique ne voit pas : *le magasin qui détient la vérité d'une fiche serait
 * le seul non sauvegardé*, dans une application qui a perdu ses campagnes deux
 * fois. C'est le chantier n° 5.
 *
 * **Ce n'est PAS une seconde vérité.** Rien ne lit cette copie pour afficher ou
 * calculer quoi que ce soit : elle n'existe que pour entrer dans le fichier de
 * sauvegarde, et elle se restaure par `restore()` du moteur, à la main. La
 * vérité reste dans le moteur, comme décidé.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QU'ELLE NE VOIT PAS, ET IL FAUT LE DIRE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Elle est prise **quand une fiche est ouverte sur l'écran du meneur** — le seul
 * moment où GM-OS peut parler au moteur. Choix de David du 2026-08-29, contre
 * une iframe cachée en permanence : sept mégaoctets tenus en mémoire pour un
 * service rendu deux fois par séance.
 *
 * **Conséquence, et `priseLe` est là pour qu'on puisse la constater :** une
 * modification faite en ouvrant le fichier HTML **hors de GM-OS** n'est pas vue.
 * *Une sauvegarde dont on ignore la fraîcheur est pire qu'une sauvegarde
 * absente* — c'est pourquoi la date voyage avec le contenu, et pourquoi rien ici
 * ne prétend que la copie est à jour.
 *
 * La garde d'écriture est celle des sept autres stores persistés : le Player Hub
 * et le projecteur partagent le `localStorage` du MJ, et un `setState` de
 * synchronisation écrit. Aucune fenêtre secondaire n'a de bibliothèque à sauver.
 */

/** Ce que `RPGSheet.backup()` rend — on ne l'inspecte pas, on le transporte. */
export interface InstantaneDeLaBibliotheque {
    /** Le contenu exact que `restore()` du moteur sait relire. */
    contenu: unknown;
    /** Quand il a été pris. Sans elle, on ne peut pas juger ce qu'on restaure. */
    priseLe: string;
    /** Combien de personnages il porte — de quoi le lire d'un coup d'œil. */
    personnages: number;
}

interface EtatDeLaBibliotheque {
    instantane: InstantaneDeLaBibliotheque | null;
    /** Retient ce que le moteur vient de rendre. */
    retenirLInstantane: (contenu: unknown) => void;
    oublier: () => void;
}

/** Compte les personnages sans supposer la forme : un dénombrement, pas un schéma. */
function compterLesPersonnages(contenu: unknown): number {
    const liste = (contenu as { characters?: unknown[] } | null)?.characters;
    return Array.isArray(liste) ? liste.length : 0;
}

export const useBibliothequeDesFiches = create<EtatDeLaBibliotheque>()(
    persist(
        (set) => ({
            instantane: null,

            retenirLInstantane: (contenu) => {
                /*
                  **Un instantané vide n'en remplace jamais un plein.** Le moteur
                  répond aussi quand sa base vient d'être ouverte sur un profil
                  neuf, ou quand la bibliothèque a été vidée à la main. Écraser
                  une copie qui portait quatre personnages par une copie qui n'en
                  porte aucun ferait de ce filet le second mécanisme de perte —
                  *c'est la leçon du refus de rétrécissement de la sauvegarde
                  automatique, et elle vaut ici mot pour mot.*
                */
                const personnages = compterLesPersonnages(contenu);
                set(etat => (
                    personnages === 0 && (etat.instantane?.personnages ?? 0) > 0
                        ? etat
                        : {
                            instantane: {
                                contenu,
                                personnages,
                                priseLe: new Date().toISOString(),
                            },
                        }
                ));
            },

            oublier: () => set({ instantane: null }),
        }),
        {
            name: 'gmos-bibliotheque-des-fiches',
            storage: stockageLocalDuMJ(),
        },
    ),
);
