import { objetSimple } from './protocole';
import type { CommandeDeModule, ResultatDeModule, VueDesModulesMJ } from './protocole';

/**
 * **Les gestes du meneur sur ses modules**, quel que soit l'appareil qui les porte : l'IPC au
 * poste, la WebSocket sur la tablette du meneur. Le panneau commun (`PanneauDesModulesMJ`) ne
 * connaît que cette interface — *deux copies du même écran finiraient par diverger.*
 */
export interface GestesDuMeneur {
    commander: (moduleId: string, commande: CommandeDeModule) => Promise<ResultatDeModule>;
    autoriser: (moduleId: string, personnages: string[]) => Promise<ResultatDeModule>;
    toutCouper: () => Promise<ResultatDeModule>;
    choisirDiffusion: (moduleId: string, appareilId: string) => Promise<ResultatDeModule>;
}

const DELAI = 10000;

/**
 * **Le canal des modules sur la tablette du meneur** — 07/11/2026, plan
 * `2026-11-07-modules-du-jeu-tablette-du-meneur.md`, T2. Sur le modèle de
 * `CanalDesModulesJoueur` : connexion éphémère, rien n'est persisté ; chaque geste attend sa
 * confirmation dix secondes au plus et **n'est jamais rejoué** ; un changement de contexte
 * annule les attentes. Un canal par socket : le serveur recompte ses révisions à chaque
 * démarrage de GM-OS, un canal gardé d'une connexion à l'autre refuserait la nouvelle vue.
 */
export class CanalDesModulesMJ implements GestesDuMeneur {
    private vue: VueDesModulesMJ | null = null;
    private vivant = true;
    private sequence = 0;
    private attentes = new Map<string, { rendre: (resultat: ResultatDeModule) => void; minuterie: ReturnType<typeof setTimeout> }>();
    private envoyer: (message: unknown) => void;
    private afficher: (vue: VueDesModulesMJ | null) => void;

    constructor(envoyer: (message: unknown) => void, afficher: (vue: VueDesModulesMJ | null) => void) {
        this.envoyer = envoyer; this.afficher = afficher;
    }

    /** Vrai si le message était pour ce canal. */
    recevoir(message: unknown): boolean {
        if (!objetSimple(message) || typeof message.type !== 'string' || !message.type.startsWith('modules:mj:')) return false;
        if (!this.vivant) return true;
        if (message.type === 'modules:mj:fermes') { this.vider(); return true; }
        if (message.type === 'modules:mj:resultat' && objetSimple(message.payload) && typeof message.payload.requeteId === 'string') {
            const attente = this.attentes.get(message.payload.requeteId);
            if (attente) {
                clearTimeout(attente.minuterie); this.attentes.delete(message.payload.requeteId);
                attente.rendre(message.payload.ok === true ? { ok: true }
                    : { ok: false, erreur: typeof message.payload.erreur === 'string' && message.payload.erreur ? message.payload.erreur : 'Commande refusée.' });
            }
            return true;
        }
        if (message.type !== 'modules:mj:vue' || !objetSimple(message.payload)) return true;
        const vue = message.payload;
        if (!Number.isSafeInteger(vue.contexte) || !Number.isSafeInteger(vue.revision) || !Array.isArray(vue.modules)
            || !vue.modules.every(m => objetSimple(m) && typeof m.id === 'string' && typeof m.libelle === 'string' && Array.isArray(m.acces) && Object.hasOwn(m, 'vue'))) return true;
        const avant = this.vue;
        if (avant && Number(vue.contexte) === avant.contexte && Number(vue.revision) < avant.revision) return true;
        if (avant && (vue.contexte !== avant.contexte || vue.campagneId !== avant.campagneId)) this.annuler('Le contexte du module a changé.');
        this.vue = vue as unknown as VueDesModulesMJ;
        this.afficher(this.vue);
        return true;
    }

    commander(moduleId: string, commande: CommandeDeModule) {
        return this.demander('modules:mj:commander', vue => vue.modules.some(m => m.id === moduleId), { moduleId, commande });
    }
    autoriser(moduleId: string, personnages: string[]) {
        return this.demander('modules:mj:autoriser', vue => vue.modules.some(m => m.id === moduleId), { moduleId, personnages });
    }
    toutCouper() {
        return this.demander('modules:mj:tout-couper', () => true, {});
    }
    choisirDiffusion(moduleId: string, appareilId: string) {
        return this.demander('modules:mj:diffusion', vue => vue.modules.some(m => m.id === moduleId), { moduleId, appareilId });
    }

    private demander(type: string, connu: (vue: VueDesModulesMJ) => boolean, charge: Record<string, unknown>): Promise<ResultatDeModule> {
        const vue = this.vue;
        if (!this.vivant || !vue || !vue.campagneId || !connu(vue)) return Promise.resolve({ ok: false, erreur: 'Module fermé ou déconnecté.' });
        const requeteId = `mj-${Date.now()}-${++this.sequence}`;
        return new Promise(rendre => {
            const minuterie = setTimeout(() => { this.attentes.delete(requeteId); rendre({ ok: false, erreur: 'Aucune confirmation reçue. La commande n’est pas rejouée.' }); }, DELAI);
            this.attentes.set(requeteId, { rendre, minuterie });
            try { this.envoyer({ type, payload: { requeteId, campagneId: vue.campagneId, contexte: vue.contexte, ...charge } }); }
            catch { clearTimeout(minuterie); this.attentes.delete(requeteId); rendre({ ok: false, erreur: 'Connexion interrompue.' }); }
        });
    }
    private annuler(erreur: string) {
        for (const attente of this.attentes.values()) { clearTimeout(attente.minuterie); attente.rendre({ ok: false, erreur }); }
        this.attentes.clear();
    }
    vider() { this.annuler('Les modules ont été fermés.'); this.vue = null; this.afficher(null); }
    fermer() { this.annuler('Connexion interrompue.'); this.vivant = false; this.vue = null; this.afficher(null); }
}
