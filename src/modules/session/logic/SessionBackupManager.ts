import { construireLaSauvegarde } from '../../../store/SessionService';
import { useSessionOSStore } from '../useSessionOSStore';
import { lEcritureEstOuverte } from './PersistenceService';
import { isMainWindow } from '../../../utils/windowRole';
import { Logger } from '../../../utils/logger';
import { refletterLesMedias } from './MiroirDesMedias';

/**
 * **La sauvegarde automatique — côté rendu.**
 *
 * Le process principal porte les règles qui protègent **l'application** (ne
 * jamais invoquer git, ne jamais écrire dans le dépôt, ne supprimer que ses
 * propres fichiers) : voir `electron/sauvegardeAutomatique.ts`.
 *
 * Ce module-ci porte celles qui protègent **les données**. Elles viennent d'une
 * leçon payée deux fois : *une sauvegarde automatique qui tourne pendant que le
 * store porte les mocks écrase les bonnes sauvegardes par des copies de « The
 * Eternal Quest ».* Le filet deviendrait alors le second mécanisme de perte.
 *
 * **Ce que ce module ne fait pas, et ne doit jamais faire :** ouvrir un
 * dialogue, poser un voile de chargement, ou restaurer. Restaurer reste un
 * geste du MJ, qui choisit son fichier.
 */

/** Les campagnes de `INITIAL_DATA` — si on les voit, la base n'a pas été relue. */
const CAMPAGNES_DE_DEMONSTRATION = new Set(['c-1', 'c-2']);

export type RaisonDeRefus =
    | 'fenetre-secondaire'
    | 'ecriture-fermee'
    | 'donnees-de-demonstration'
    | 'aucune-campagne'
    | 'pont-absent';

export type Verdict =
    | { ecrire: true }
    | { ecrire: false; raison: RaisonDeRefus; details: string };

/**
 * **Le seul juge, et il est pur.** Séparé de l'écriture pour être éprouvable
 * sans disque ni Electron : c'est lui qui empêche l'incident, il ne doit pas
 * dépendre d'un environnement pour être vérifié.
 */
export function fautIlSauvegarder(etat: {
    campaigns?: { id: string }[];
}): Verdict {
    if (!isMainWindow()) {
        return { ecrire: false, raison: 'fenetre-secondaire', details: 'Seule la fenêtre MJ sauvegarde.' };
    }

    if (!lEcritureEstOuverte()) {
        return {
            ecrire: false,
            raison: 'ecriture-fermee',
            details:
                'La base n’a pas été relue : ce que le store porte en mémoire n’est pas digne de ' +
                'confiance. Sauvegarder maintenant, c’est archiver les données de démonstration.',
        };
    }

    const campagnes = etat.campaigns ?? [];
    if (campagnes.length === 0) {
        return {
            ecrire: false,
            raison: 'aucune-campagne',
            details: 'Aucune campagne. Une sauvegarde vide n’a rien à remplacer.',
        };
    }

    if (campagnes.every(c => CAMPAGNES_DE_DEMONSTRATION.has(c.id))) {
        return {
            ecrire: false,
            raison: 'donnees-de-demonstration',
            details:
                `L’état ne contient que les campagnes de démonstration (${campagnes.map(c => c.id).join(', ')}). ` +
                'C’est la signature d’un store qui n’a pas fini de se réhydrater.',
        };
    }

    return { ecrire: true };
}

class SessionBackupManager {
    private static instance: SessionBackupManager;
    private enCours = false;
    private minuterie: ReturnType<typeof setTimeout> | null = null;

    /** Le délai d'apaisement après le dernier changement — pas un battement d'horloge. */
    private readonly REPOS_MS = 2 * 60 * 1000;

    public static getInstance(): SessionBackupManager {
        if (!SessionBackupManager.instance) {
            SessionBackupManager.instance = new SessionBackupManager();
        }
        return SessionBackupManager.instance;
    }

    /**
     * Un changement vient d'avoir lieu : on sauvegarde **deux minutes après le
     * dernier**, pas toutes les deux minutes. Un intervalle fixe est soit trop
     * fréquent quand rien ne bouge, soit trop tard quand tout bouge.
     */
    public signalerUnChangement() {
        if (this.minuterie) clearTimeout(this.minuterie);
        this.minuterie = setTimeout(() => {
            this.minuterie = null;
            void this.sauvegarder('repos');
        }, this.REPOS_MS);
    }

    /** À la fermeture, à la clôture d'une séance : maintenant, sans attendre le repos. */
    public async sauvegarderMaintenant(motif: string, options: { baisseAttendue?: boolean } = {}) {
        if (this.minuterie) { clearTimeout(this.minuterie); this.minuterie = null; }
        return this.sauvegarder(motif, options);
    }

    public arreter() {
        if (this.minuterie) { clearTimeout(this.minuterie); this.minuterie = null; }
    }

    private async sauvegarder(motif: string, options: { baisseAttendue?: boolean } = {}) {
        if (this.enCours) return;

        const verdict = fautIlSauvegarder(useSessionOSStore.getState());
        if (!verdict.ecrire) {
            Logger.warn(`[Sauvegarde] Refusée (${motif}) — ${verdict.raison} : ${verdict.details}`);
            return;
        }

        const pont = window.appBridge?.sauvegarde;
        if (!pont) return; // tablette, navigateur : pas de disque à écrire

        this.enCours = true;
        try {
            const resultat = await pont.ecrire(construireLaSauvegarde(), options);

            if (resultat.statut === 'ecrite') {
                useSessionOSStore.getState().setLastBackupAt(new Date().toISOString());
                Logger.info(`[Sauvegarde] ${motif} — ${resultat.octets} octets → ${resultat.chemin}`);

                /*
                  **Les images APRÈS l'état de session, et jamais avant.**

                  L'état est la partie irremplaçable et la plus rapide à écrire ;
                  les images sont volumineuses et déjà présentes à 99 % dès le
                  second passage. Les mettre devant ferait risquer à la
                  sauvegarde de sortie — quatre secondes — de manquer l'essentiel
                  pour recopier des octets qui, eux, ne sont perdus par personne
                  tant que la base des médias tient.

                  Le miroir ne lève jamais : un échec de copie se journalise et
                  l'état de session reste écrit.
                */
                const miroir = await refletterLesMedias();
                if (!miroir.horsService && (miroir.copiees > 0 || miroir.echecs > 0)) {
                    Logger.info(
                        `[Miroir] ${miroir.copiees} média(s) copié(s), ${Math.round(miroir.octets / 1024)} Ko`
                        + (miroir.echecs > 0 ? ` — ${miroir.echecs} échec(s)` : ''),
                    );
                }
            } else {
                // Un refus du process principal (rétrécissement, destination) n'est
                // pas une panne : il se journalise et la précédente reste en place.
                Logger.warn(`[Sauvegarde] Refusée par le disque (${motif}) : ${resultat.raison}`);
            }
        } catch (err) {
            Logger.error(`[Sauvegarde] Échec (${motif})`, err);
        } finally {
            this.enCours = false;
        }
    }
}

export const sessionBackupManager = SessionBackupManager.getInstance();

/*
  Branché au module et non dans un composant : la sauvegarde de sortie ne doit
  pas dépendre du fait qu'un écran soit monté. Et on répond **toujours**, même
  en cas d'échec — sinon la fermeture attend le délai de sécurité de quatre
  secondes pour rien.
*/
if (typeof window !== 'undefined' && isMainWindow()) {
    window.appBridge?.sauvegarde?.surDemandeDeFermeture(() => {
        void sessionBackupManager
            .sauvegarderMaintenant('fermeture')
            .catch(err => Logger.error('[Sauvegarde] Échec à la fermeture', err))
            .finally(() => window.appBridge?.sauvegarde?.fermetureTerminee());
    });
}
