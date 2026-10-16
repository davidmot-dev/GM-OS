import { objetSimple } from './protocole';
import type { CommandeDeModule, ResultatDeModule, VueDesModulesJoueurRecue } from './protocole';

/** Connexion éphémère : aucune file de commandes ou projection n'est persistée. */
export class CanalDesModulesJoueur {
    private vue: VueDesModulesJoueurRecue | null = null;
    private vivant = true;
    private sequence = 0;
    private attentes = new Map<string, { rendre: (resultat: ResultatDeModule) => void; minuterie: ReturnType<typeof setTimeout> }>();
    private envoyer: (message: unknown) => void;
    private identite: () => { personnageId: string | null; campagneId: string | null };
    private afficher: (vue: VueDesModulesJoueurRecue | null) => void;
    constructor(envoyer: (message: unknown) => void,
        identite: () => { personnageId: string | null; campagneId: string | null },
        afficher: (vue: VueDesModulesJoueurRecue | null) => void) {
        this.envoyer = envoyer; this.identite = identite; this.afficher = afficher;
    }
    recevoir(message: unknown) {
        if (!this.vivant || !objetSimple(message)) return;
        if (message.type === 'modules:fermes') { this.vider(); return; }
        if (message.type === 'modules:resultat' && objetSimple(message.payload)) {
            const resultat = message.payload;
            if (typeof resultat.requeteId !== 'string') return;
            const attente = this.attentes.get(resultat.requeteId);
            if (attente) {
                clearTimeout(attente.minuterie); this.attentes.delete(resultat.requeteId);
                attente.rendre(resultat.ok === true ? { ok: true } : { ok: false, erreur: 'Commande refusée ou non enregistrée.' });
            }
        }
        if (message.type !== 'modules:vue' || !objetSimple(message.payload)) return;
        const vue = message.payload, identite = this.identite();
        if (vue.personnageId !== identite.personnageId || vue.campagneId !== identite.campagneId
            || !Number.isSafeInteger(vue.contexte) || !Number.isSafeInteger(vue.revision) || !Array.isArray(vue.modules)
            || !vue.modules.every(m => objetSimple(m) && typeof m.id === 'string' && typeof m.libelle === 'string' && Object.hasOwn(m, 'vue'))) return;
        if (this.vue && (Number(vue.contexte) < this.vue.contexte || Number(vue.revision) < this.vue.revision)) return;
        if (this.vue && vue.contexte !== this.vue.contexte) this.annuler();
        // Ancrer à la réception, pas à l'ouverture de l'instrument : une vue en cache
        // doit continuer à vieillir même si la tablette a une autre heure que le MJ.
        const instant = vue.instantServeur, reception = performance.now();
        const horloge = typeof instant === 'number' && Number.isFinite(instant) && instant >= 0
            ? () => instant + performance.now() - reception : undefined;
        this.vue = { ...vue, horloge } as unknown as VueDesModulesJoueurRecue;
        this.afficher(this.vue);
    }
    commander(moduleId: string, commande: CommandeDeModule): Promise<ResultatDeModule> {
        const vue = this.vue, identite = this.identite();
        if (!this.vivant || !vue || vue.personnageId !== identite.personnageId || vue.campagneId !== identite.campagneId || !vue.modules.some(m => m.id === moduleId)) return Promise.resolve({ ok: false, erreur: 'Module fermé ou déconnecté.' });
        const requeteId = `module-${Date.now()}-${++this.sequence}`;
        return new Promise(rendre => {
            const minuterie = setTimeout(() => { this.attentes.delete(requeteId); rendre({ ok: false, erreur: 'Aucune confirmation reçue. La commande n’est pas rejouée.' }); }, 10000);
            this.attentes.set(requeteId, { rendre, minuterie });
            try { this.envoyer({ type: 'modules:commander', payload: { requeteId, campagneId: vue.campagneId, moduleId, contexte: vue.contexte, commande } }); }
            catch { clearTimeout(minuterie); this.attentes.delete(requeteId); rendre({ ok: false, erreur: 'Connexion interrompue.' }); }
        });
    }
    private annuler() {
        for (const attente of this.attentes.values()) { clearTimeout(attente.minuterie); attente.rendre({ ok: false, erreur: 'Le contexte du module a changé.' }); }
        this.attentes.clear();
    }
    vider() { this.annuler(); this.vue = null; this.afficher(null); }
    fermer() { this.vivant = false; this.vider(); }
}
