import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    ETAT_INITIAL,
    SEUIL_SANS_PAUSE,
    quartSuivant as avancer,
    pause as prendreUnePause,
    type EtatDesQuarts,
} from './widgets/defileDesQuarts';
import { HOTE_PAR_DEFAUT, type RoutineSauvegardee } from './UlanziService';
import {
    basculer,
    reglerLaCouleur,
    reglerLesSecondes,
    type SelectionParJeu,
} from './widgets/librairie';

/**
 * L'état de l'afficheur Ulanzi.
 *
 * **Ce que ce store détient, et lui seul : le Quart.** GM-OS ne suivait aucun
 * Quart avant le 2026-08-23 — vérifié, le mot n'existait nulle part dans `src/`
 * au sens de Blade Runner. Le défilé est donc un **instrument** au sens du § 4
 * du plan : il ne reflète aucun moteur, il est poussé à la main depuis le
 * cockpit. C'est précisément ce qui permet au premier essai de tenir dans une
 * soirée — il n'y a rien à brancher.
 *
 * Le jour où un pilote Blade Runner déclarera le Quart, il deviendra un
 * **miroir** et cet état-ci devra s'effacer devant le pilote. Pas avant.
 */
interface EtatUlanzi {
    /** Nom mDNS ou IP. Le nom est préférable : l'IP est en DHCP. */
    hote: string;
    /** L'option : l'afficheur est-il enrôlé pour la séance ? */
    actif: boolean;
    /*
      ⚠️ `secondesParWidget` a été retiré le 2026-08-30. La part d'écran est
      désormais **par widget**, dans `selection` — la garder ici aurait laissé
      deux écrivains pour la même décision, et celui-ci n'avait plus de lecteur.
      La clé persistée subsiste chez les installations existantes ; elle est
      simplement ignorée, et `SECONDES_PAR_DEFAUT` de la librairie fait foi.
    */
    /**
     * Couper les applications natives bavardes pendant la séance.
     *
     * **Coûte un redémarrage de l'afficheur** (une dizaine de secondes) à la
     * prise comme à la restitution : ces réglages ne s'appliquent qu'au
     * démarrage. Décoché, le défilé partage l'écran avec la météo et la
     * batterie — mais rien ne redémarre.
     */
    silencerLesNatives: boolean;
    /**
     * **Le tableau de bord : ce qui défile, par jeu.**
     *
     * Demandé par David le 2026-08-23, construit le 2026-08-30. La règle vit
     * dans `widgets/librairie`, qui est pure ; ce champ n'en est que le dépôt.
     *
     * **Un jeu absent de cette carte n'est pas un jeu sans widgets** : c'est un
     * jeu qui n'a rien choisi, et l'on suit alors les `parDefaut` du catalogue.
     * Un tableau **vide**, lui, est un choix — on ne pousse rien.
     */
    selection: SelectionParJeu;
    /** Trois par défaut ; quatre avec la spécialité « Bourreau de travail ». */
    seuilSansPause: number;
    quarts: EtatDesQuarts;
    /**
     * Ce qu'affichait l'appareil avant qu'on lui emprunte ses pixels.
     *
     * Persistée : si GM-OS redémarre en cours de séance, c'est la seule trace
     * de ce qu'il faut rendre.
     */
    routine: RoutineSauvegardee | null;
    /** Résultat de la dernière tentative de contact. `null` = jamais essayé. */
    joignable: boolean | null;
    /** **Pourquoi** la dernière tentative a échoué. Un « non » muet ne se diagnostique pas. */
    pourquoi: string | null;

    setHote: (hote: string) => void;
    basculerActif: (force?: boolean) => void;
    /** Allume ou éteint un widget pour un jeu. Le premier geste fige l'implicite. */
    basculerLeWidget: (systemId: string, widgetId: string) => void;
    /** La part d'écran d'un widget, en secondes. Bornée par la librairie. */
    setSecondesDuWidget: (systemId: string, widgetId: string, secondes: number) => void;
    /** La couleur d'un widget. `null` l'efface, et le widget reprend la sienne. */
    setCouleurDuWidget: (systemId: string, widgetId: string, couleur: string | null) => void;
    setSeuil: (seuil: number) => void;
    basculerSilence: () => void;
    quartSuivant: () => void;
    pause: () => void;
    reinitialiserLesQuarts: () => void;
    setRoutine: (routine: RoutineSauvegardee | null) => void;
    /**
     * **Mémorise la routine — une seule fois, et c'est tout le sujet.**
     *
     * *Défaut trouvé le 2026-08-30, écran noir chez David, appareil
     * irrécupérable par l'application elle-même.* `prendreLaMain` fabrique la
     * routine en **relisant les réglages de l'appareil**. Elle n'est donc vraie
     * qu'au premier contact, quand on le trouve dans son propre état. Une
     * seconde prise — GM-OS relancé pendant une séance ouverte, rechargement à
     * chaud, changement d'hôte — relit un appareil **déjà muet** et enregistre
     * « tout était éteint ». La restitution n'a alors plus rien à rendre, et
     * l'écran reste noir.
     *
     * *Une sauvegarde qu'on réécrit avec l'état qu'elle servait à réparer n'est
     * plus une sauvegarde.* Elle ne s'efface qu'à une restitution réussie.
     */
    memoriserLaRoutine: (routine: RoutineSauvegardee) => void;
    setJoignable: (joignable: boolean | null, pourquoi?: string | null) => void;
}

export const useUlanziStore = create<EtatUlanzi>()(
    persist(
        (set) => ({
            hote: HOTE_PAR_DEFAUT,
            actif: false,
            silencerLesNatives: true,
            seuilSansPause: SEUIL_SANS_PAUSE,
            selection: {},
            quarts: ETAT_INITIAL,
            routine: null,
            joignable: null,
            pourquoi: null,

            setHote: (hote) => set({ hote: hote.trim() || HOTE_PAR_DEFAUT }),
            basculerActif: (force) =>
                set((s) => ({ actif: force !== undefined ? force : !s.actif })),
            // Une cadence trop courte rend l'objet illisible, trop longue le rend
            // absent : on borne plutôt que de laisser saisir n'importe quoi.
            /*
              Les deux gestes du tableau de bord passent par la librairie, qui
              tient la règle et la teste. Le magasin ne fait que déposer le
              résultat — *une seule façon de décider ce qui défile.*
            */
            basculerLeWidget: (systemId, widgetId) => set(s => ({
                selection: { ...s.selection, [systemId]: basculer(widgetId, systemId, s.selection) },
            })),
            setSecondesDuWidget: (systemId, widgetId, secondes) => set(s => ({
                selection: {
                    ...s.selection,
                    [systemId]: reglerLesSecondes(widgetId, secondes, systemId, s.selection),
                },
            })),
            setCouleurDuWidget: (systemId, widgetId, couleur) => set(s => ({
                selection: {
                    ...s.selection,
                    [systemId]: reglerLaCouleur(widgetId, couleur, systemId, s.selection),
                },
            })),
            setSeuil: (seuil) => set({ seuilSansPause: Math.max(1, Math.min(6, Math.round(seuil))) }),
            basculerSilence: () => set(s => ({ silencerLesNatives: !s.silencerLesNatives })),

            quartSuivant: () => set((s) => ({ quarts: avancer(s.quarts) })),
            pause: () => set((s) => ({ quarts: prendreUnePause(s.quarts) })),
            reinitialiserLesQuarts: () => set({ quarts: ETAT_INITIAL }),

            setRoutine: (routine) => set({ routine }),
            // Écrire seulement si l'on ne tient rien : une routine déjà
            // mémorisée est la seule qui ait vu l'appareil intact.
            memoriserLaRoutine: (routine) => set((s) => (s.routine ? {} : { routine })),
            setJoignable: (joignable, pourquoi = null) => set({ joignable, pourquoi }),
        }),
        {
            name: 'gmos-ulanzi',
            // `joignable` ne se persiste pas : c'est l'état du réseau à
            // l'instant du contact, et le relire au démarrage ferait croire à
            // une présence qu'on n'a pas vérifiée.
            partialize: (s) => ({
                hote: s.hote,
                actif: s.actif,
                silencerLesNatives: s.silencerLesNatives,
                seuilSansPause: s.seuilSansPause,
                selection: s.selection,
                quarts: s.quarts,
                routine: s.routine,
            }),
        },
    ),
);
