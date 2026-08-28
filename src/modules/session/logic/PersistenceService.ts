import { createJSONStorage, type PersistOptions, type StateStorage } from 'zustand/middleware';
import type { SessionOSStore } from '../store/index';
import { idbStateStorage, onPersistedStateChanged } from './idbStorage';
import { isMainWindow } from '../../../utils/windowRole';
import { reparerLiensDeGabarit } from '../store/liensDeGabarit';
import { inscrireLesSystemes } from './systemeDeclare';
import { redimensionnerLesHorloges } from './horlogesADimensionner';
import { rattacherLaSanteDesAdversaires } from './santeDesAdversaires';
import { lesDonneesDeLaSession } from './donneesDeLaSession';

export const SESSION_STORE_KEY = 'gmos-v5-session-os-storage';

/**
 * Lecture pour toutes les fenêtres, écriture pour la seule fenêtre MJ.
 *
 * Le Player Hub et le projecteur tournent dans Electron, sur la même origine
 * que la fenêtre MJ, donc sur la même base IndexedDB et sous la même clé. Toute
 * écriture de leur part remplace l'état du MJ.
 *
 * Ce n'est pas théorique : c'est la perte de campagnes du 2026-08-07. Une
 * fenêtre secondaire persistait une charge réduite — six champs de sélection,
 * sans `campaigns`. Le dégât ne se voyait pas sur le moment, parce que la
 * fenêtre MJ gardait ses données en mémoire. Il se produisait au démarrage à
 * froid suivant : le store s'initialise sur les mocks, lit une charge sans
 * `campaigns`, et la fusion superficielle de Zustand laisse les mocks en
 * place — que le MJ persiste alors par-dessus les vraies données.
 *
 * L'interdiction est posée ici, au seul point qui écrit, et non dans
 * `partialize` : une charge réduite reste une charge, et c'est la charge
 * elle-même qui détruisait les données.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ET LA SECONDE MOITIÉ : ON N'ÉCRIT PAS AVANT D'AVOIR LU
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * La garde ci-dessus ne ferme que les fenêtres secondaires. **La fenêtre MJ,
 * elle, pouvait écrire avant la fin de sa propre relecture** — et ce qu'elle
 * avait alors en mémoire, c'était `INITIAL_DATA` : les mocks.
 *
 * Le trou vient de la nature du magasin. `localStorage` se lit de façon
 * synchrone : entre la création du store et son hydratation, il n'y a aucun
 * instant. IndexedDB se lit **de façon asynchrone**, donc il existe une fenêtre
 * réelle — quelques dizaines de millisecondes au démarrage, et à nouveau à
 * chaque rechargement à chaud du module pendant le développement. *N'importe
 * quel `set()` pendant cette fenêtre persiste les mocks par-dessus la base.*
 *
 * C'est le mécanisme de la **seconde perte de campagnes, le 2026-08-24**. Il
 * restait ouvert après le correctif du 07/08, qui ne visait que les fenêtres
 * secondaires.
 *
 * On n'ouvre donc l'écriture qu'une fois la base **relue pour de bon** — et
 * « relue » veut dire *lue sans erreur*, une base vide comprise : une base vide
 * se lit très bien, c'est un premier démarrage. Une lecture qui échoue, elle,
 * est indiscernable d'une base vide une fois qu'on l'a réduite à `null` ;
 * c'est pourquoi `idbStorage` la remonte désormais au lieu de l'avaler.
 *
 * **En cas d'échec de lecture, GM-OS tourne en mémoire et n'écrit rien.**
 * Perdre le travail d'une séance est réparable ; écraser la base ne l'est pas.
 */
let laLectureAReussi = false;
let laBaseAEteRelue = false;

/** L'écriture est-elle ouverte ? Réservé aux tests et au diagnostic. */
export const lEcritureEstOuverte = () => laBaseAEteRelue;

/** Réservé aux tests : referme la garde comme au démarrage. */
export function __refermerLEcriturePourTests() {
    laLectureAReussi = false;
    laBaseAEteRelue = false;
}

const gmOnlyStateStorage: StateStorage = {
    getItem: async (name) => {
        try {
            const lu = await idbStateStorage.getItem(name);
            laLectureAReussi = true;
            return lu;
        } catch (err) {
            laLectureAReussi = false;
            console.error(
                `[Persistence] Relecture de « ${name} » impossible. GM-OS démarre en ` +
                'MÉMOIRE SEULE : rien ne sera persisté tant que la base n’aura pas été lue. ' +
                'Exportez votre travail avant de fermer.',
                err,
            );
            return null;
        }
    },

    setItem: async (name, value) => {
        if (!isMainWindow()) return;
        if (!laBaseAEteRelue) return;
        await idbStateStorage.setItem(name, value);
    },

    removeItem: async (name) => {
        if (!isMainWindow()) return;
        if (!laBaseAEteRelue) return;
        await idbStateStorage.removeItem(name);
    },
};

/**
 * PersistenceService handles Zustand persistence configuration.
 */
export const PersistenceService: PersistOptions<SessionOSStore> = {
    name: SESSION_STORE_KEY,
    version: 10,

    // IndexedDB plutôt que localStorage : pas de plafond à quelques mégaoctets,
    // pas d'écriture synchrone qui bloque l'interface. La reprise des données
    // déjà présentes dans localStorage est gérée par idbStateStorage.
    storage: createJSONStorage(() => gmOnlyStateStorage),
    
    migrate: (persistedState: unknown, version: number) => {
        console.log(`[Store Migration] Migrating from version ${version} to 10`);
        // Add specific migration logic here if needed for future versions
        return persistedState as SessionOSStore;
    },

    // NOTE: on n'appelle volontairement pas sanitizeAllSessions() ici — cela
    // provoquait des boucles de synchronisation sans fin. L'assainissement des
    // sessions se fait à l'ajout, ou explicitement via SessionManager.
    onRehydrateStorage: () => (state, error) => {
        /*
          **Le seul endroit qui ouvre l'écriture.** Zustand appelle ce rappel
          quand la relecture est finie — réussie (`state`) ou non (`error`).

          Il est ouvert AVANT les reprises ci-dessous, et pas après : la
          dernière d'entre elles, `reconcileTemplates`, appelle `set()`, et son
          travail doit être persisté. Les autres ne font que corriger l'objet
          d'état en place, sans écrire.
        */
        if (error || !laLectureAReussi) {
            console.error(
                '[Persistence] La base n’a pas été relue : GM-OS ne persistera RIEN ' +
                'de cette session. C’est délibéré — écrire sans avoir lu, c’est ' +
                'écraser la base avec les données de démonstration.',
                error,
            );
            return;
        }
        laBaseAEteRelue = true;

        if (state) {
            // Sanitize stale blob URLs
            (state.atlasMaps || []).forEach(m => {
                if (m.fileUrl?.startsWith('blob:')) m.fileUrl = '';
            });
            
            // Clear volatile state
            state.selectedDeckId = null;

            /*
              **Les pilotes qui désignent un modèle de fiche inexistant.**

              Jusqu'au 2026-08-14, la Forge posait dans `driver.templateId` un
              `custom-template-<horodatage>` qu'elle fabriquait elle-même, puis
              laissait `addSheetTemplate` imposer son propre `tpl-<horodatage>` :
              le pilote pointait vers un identifiant qui n'a jamais existé, et
              son vrai modèle restait sans propriétaire. Le pilote « Within » en
              portait la trace.

              La cause est corrigée à la source. Ceci répare les bases déjà
              écrites — un correctif qui laisse les données abîmées ne corrige
              que la moitié du problème —, et seulement là où le rattachement est
              certain : `reparerLiensDeGabarit` s'abstient dès qu'il y a deux
              candidats. Un lien cassé se voit ; une mauvaise fiche se joue.
            */
            const { drivers, reparations } = reparerLiensDeGabarit(
                state.customGameDrivers ?? [],
                state.customSheetTemplates ?? [],
            );
            if (reparations.length > 0) {
                state.customGameDrivers = drivers;
                for (const r of reparations) {
                    console.warn(
                        `[Persistence] « ${r.driverName} » visait le modèle de fiche ` +
                        `${r.ancienTemplateId}, qui n'existe pas. Rattaché à ${r.nouveauTemplateId}.`,
                    );
                }
            }

            /*
              **Le jeu qu'un personnage déclare.**

              Faute de `systemId`, il est retrouvé par son gabarit ou par sa
              campagne — des rattrapages qui marchent, mais qui dépendent de
              choses qui bougent : renommer un gabarit ou repointer une campagne
              ferait changer de jeu un personnage sans que personne ne l'ait
              décidé.

              On n'inscrit que là où **un seul pilote réclame le gabarit**, et
              jamais depuis la campagne : celle-ci est légitime à l'exécution
              parce qu'elle suit le présent, et la figer rendrait faux ce qui
              n'était qu'approximatif.
            */
            const { players: avecSysteme, inscrits } = inscrireLesSystemes(
                state.players ?? [],
                state.customGameDrivers ?? [],
            );
            if (inscrits.length > 0) {
                state.players = avecSysteme;
                for (const i of inscrits) {
                    console.warn(
                        `[Persistence] « ${i.personnage} » ne déclarait aucun jeu ; ` +
                        `son gabarit n'est réclamé que par « ${i.piloteNom} » (${i.systemId}).`,
                    );
                }
            }

            /*
              **Les horloges de défaite figées à six.**

              Six n'est le chiffre d'aucun jeu : chez Dune le seuil vaut la
              compétence défensive de la cible, de quatre à huit. Les
              personnages créés avant le 2026-08-15 portent le six de
              `createDefault('clocks')`, qui ne sait rien de leur fiche.

              La cause est corrigée à la source. Ceci reprend les fiches déjà
              écrites, et **seulement là où le seuil se lit sans le moindre
              avertissement** : retenir un minimum de repli reviendrait à
              remplacer une valeur fausse par une valeur devinée, ce qui ne fait
              que la rendre crédible.

              **Après l'inscription des `systemId`, et pas avant** : le pilote
              d'un personnage se résout mieux une fois son jeu déclaré, donc
              cette reprise-ci profite de la précédente.
            */
            const { players, redimensionnees } = redimensionnerLesHorloges(
                state.players ?? [],
                state.campaigns ?? [],
                state.customGameDrivers ?? [],
            );
            if (redimensionnees.length > 0) {
                state.players = players;
                for (const h of redimensionnees) {
                    console.warn(
                        `[Persistence] Horloge de défaite de « ${h.personnage} » : ` +
                        `${h.ancienCompte} → ${h.nouveauCompte} segments, lus sur sa fiche.`,
                    );
                }
            }

            /*
              **Les adversaires nés sans mécanisme de santé.**

              `AddEntityForm` n'en écrivait aucun avant le 2026-08-15 : chaque
              PNJ ne portait que les points de vie de D&D. On rattache celui de
              son jeu, **uniquement là où il manque** — jamais par-dessus.

              Les PNJ d'un jeu à tâche de défaite reçoivent le PLANCHER que le
              pilote déclare, faute de fiche où lire leur compétence défensive :
              c'est la seule reprise de la journée qui pose une valeur non lue,
              et chacune est journalisée pour que le meneur l'ajuste. Se taire
              aurait laissé ces PNJ afficher une barre de vie sur un jeu qui n'a
              pas de points de vie.
            */
            const { entities, rattachees } = rattacherLaSanteDesAdversaires(
                state.entities ?? [],
                state.campaigns ?? [],
                state.customGameDrivers ?? [],
            );
            if (rattachees.length > 0) {
                state.entities = entities;
                const aAjuster = rattachees.filter(r => r.aAjuster);
                console.warn(
                    `[Persistence] ${rattachees.length} adversaire(s) sans mécanisme de santé ` +
                    'rattaché(s) au modèle de leur jeu.',
                );
                if (aAjuster.length > 0) {
                    console.warn(
                        `[Persistence] ${aAjuster.length} d'entre eux reçoivent le SEUIL MINIMAL de leur ` +
                        `tâche de défaite, faute de fiche où lire leur compétence défensive — à ajuster : ` +
                        aAjuster.map(r => r.entite).join(', '),
                    );
                }
            }

            // Reconcile templates
            if (typeof state.reconcileTemplates === 'function') {
                state.reconcileTemplates();
            }
        }
    },

    // Une seule forme de charge persistée, celle de la fenêtre MJ : elle est la
    // seule à écrire (voir `gmOnlyStateStorage`). Les fenêtres secondaires
    // continuent de lire cette base et de recevoir la synchronisation.
    partialize: (state) => {
        return {
            // Une seule liste de ce qu'une session contient, partagée avec la
            // sauvegarde vers fichier : voir `donneesDeLaSession.ts`.
            ...lesDonneesDeLaSession(state),
            // Et deux champs de vue que la persistance vivante garde
            // délibérément, pour rouvrir l'application là où on l'a laissée.
            isProjecting: state.isProjecting,
            currentView: state.currentView,
        } as SessionOSStore;
    },
};

/**
 * Global synchronization helper for multiple windows.
 */
export const syncStorageAcrossWindows = (rehydrate: () => Promise<void>) => {
    if (typeof window === 'undefined') return;

    // IndexedDB n'émet pas d'événement `storage` : c'est idbStateStorage qui
    // notifie les autres fenêtres, sur un BroadcastChannel, à chaque écriture
    // réellement différente.
    onPersistedStateChanged(SESSION_STORE_KEY, () => {
        // Prevent rehydration if the current window is currently performing an atomic sync (like Nexus import)
        // This prevents race conditions where storage updates itself while being re-populated.
        const store = (window as any).useSessionOSStore?.getState();
        if (store?.isSystemSyncing) {
            console.log('[PersistenceService] Storage update ignored: system is syncing.');
            return;
        }
        rehydrate();
    });
};
