import { modulesDuPilote } from '../../src/modules/modulesDuJeu/catalogue';
import { identifiantDeTable, objetSimple, validerSauvegardeDesModules } from '../../src/modules/modulesDuJeu/protocole';
import type { ContexteDesModules, RequeteDeModule, SauvegardeDesModules, VueDesModulesMJ, VueDesModulesJoueur } from '../../src/modules/modulesDuJeu/protocole';
import { REGISTRE_DES_MOTEURS, type MoteurEnregistre, type LecteurDeModule } from './registre';
import type { StockageDesModules } from './stockage';

const copier = <T>(valeur: T): T => JSON.parse(JSON.stringify(valeur));
const exiger = (condition: unknown, message = 'Accès au module refusé.') => { if (!condition) throw new Error(message); };
const VIDE: ContexteDesModules = { campagneId: null, seanceId: null, pilote: null, personnages: [] };

/** Autorité unique : chaque mutation est validée et écrite avant sa publication. */
export class ServiceDesModules {
    private donnees: SauvegardeDesModules = { version: 1, campagnes: {} };
    private contexte: ContexteDesModules = VIDE;
    private generation = 0;
    private revision = 0;
    private acces = new Map<string, Set<string>>();
    private erreur: string | undefined;
    private erreurEcriture: string | undefined;
    private file: Promise<unknown>;
    private stockage: StockageDesModules;
    private notifier: () => void;
    private registre: ReadonlyMap<string, MoteurEnregistre>;
    constructor(stockage: StockageDesModules, notifier: () => void,
        registre: ReadonlyMap<string, MoteurEnregistre> = REGISTRE_DES_MOTEURS) {
        this.stockage = stockage; this.notifier = notifier; this.registre = registre;
        this.file = this.charger();
    }
    private async charger() {
        try { const lu = await this.stockage.lire(); if (lu !== null) this.donnees = this.restaurer(lu); }
        catch { this.erreur = 'Le fichier privé des modules est illisible. Il est conservé ; aucune écriture n’est autorisée.'; }
    }
    private restaurer(brut: unknown): SauvegardeDesModules {
        validerSauvegardeDesModules(brut);
        const copie = copier(brut);
        for (const modules of Object.values(copie.campagnes)) for (const [id, instance] of Object.entries(modules)) {
            const moteur = this.registre.get(id);
            if (moteur) { instance.donnees = moteur.migrerEtat(instance.donnees, instance.versionDonnees); instance.versionDonnees = moteur.manifeste.versionDonnees; }
        }
        return copie;
    }
    private serialiser<T>(action: () => Promise<T> | T): Promise<T> {
        const suite = this.file.then(action);
        this.file = suite.catch(() => {});
        return suite;
    }
    async pret() { await this.file; }
    private disponibles() { return modulesDuPilote(this.contexte.pilote, this.contexte.systemPath).modules.filter(m => m.disponibilite === 'pret' && this.registre.has(m.reference.id)); }
    private moteur(id: string) {
        exiger(this.disponibles().some(m => m.reference.id === id));
        return this.registre.get(id)!;
    }
    private etat(id: string) { return this.donnees.campagnes[this.contexte.campagneId!]?.[id]?.donnees ?? this.moteur(id).creerEtat(); }
    private async ecrire(suivante: SauvegardeDesModules) {
        exiger(!this.erreur, this.erreur);
        validerSauvegardeDesModules(suivante);
        try { await this.stockage.ecrire(suivante); }
        catch {
            this.erreurEcriture = 'Écriture des modules impossible. Les données précédentes sont conservées.';
            this.publier();
            throw new Error(this.erreurEcriture);
        }
        this.donnees = suivante;
        this.erreurEcriture = undefined;
    }
    private publier() { this.revision++; this.notifier(); }
    private arreter(donnees: SauvegardeDesModules, campagneId: string | null, modules?: Set<string>) {
        if (!campagneId) return;
        for (const [id, instance] of Object.entries(donnees.campagnes[campagneId] ?? {})) {
            const moteur = this.registre.get(id);
            if (moteur && (!modules || modules.has(id))) instance.donnees = moteur.arreterEffets(instance.donnees);
        }
    }
    changerContexte(brut: ContexteDesModules) {
        return this.serialiser(async () => {
            exiger(objetSimple(brut) && (brut.campagneId === null || identifiantDeTable(brut.campagneId))
                && (brut.seanceId === null || identifiantDeTable(brut.seanceId)) && Array.isArray(brut.personnages) && brut.personnages.length <= 256, 'Contexte de table invalide.');
            exiger(brut.personnages.every(p => objetSimple(p) && identifiantDeTable(p.id) && typeof p.nom === 'string' && p.nom.trim().length > 0 && p.nom.length <= 40));
            exiger(new Set(brut.personnages.map(p => p.id)).size === brut.personnages.length);
            exiger(!modulesDuPilote(brut.pilote, brut.systemPath).erreurs.length);
            if (JSON.stringify(brut) === JSON.stringify(this.contexte)) return;
            const ancien = this.contexte, changementDeTable = ancien.campagneId !== brut.campagneId || ancien.seanceId !== brut.seanceId;
            const disponibles = new Set(modulesDuPilote(brut.pilote, brut.systemPath).modules.filter(m => m.disponibilite === 'pret').map(m => m.reference.id));
            const anciensModules = modulesDuPilote(ancien.pilote, ancien.systemPath).modules.map(m => m.reference.id);
            const retires = new Set([...anciensModules, ...this.acces.keys()].filter(id => !disponibles.has(id)));
            // Fermer d'abord, même si le disque est indisponible : aucun ancien droit ne survit au contexte.
            this.generation++;
            this.contexte = copier(brut);
            if (changementDeTable) this.acces.clear();
            for (const [id, joueurs] of this.acces) {
                if (retires.has(id)) this.acces.delete(id);
                else for (const joueur of joueurs) if (!brut.personnages.some(p => p.id === joueur)) joueurs.delete(joueur);
            }
            const suivante = copier(this.donnees);
            this.arreter(suivante, ancien.campagneId, changementDeTable ? undefined : retires);
            if (this.erreur) { this.publier(); return; }
            try { if (JSON.stringify(suivante) !== JSON.stringify(this.donnees)) await this.ecrire(suivante); }
            catch (e) { this.donnees = suivante; throw e; } // La coupure des effets est immédiate même si le disque échoue.
            finally { this.publier(); }
        });
    }
    autoriser(demande: { campagneId: string; moduleId: string; personnages: string[]; contexte: number }) {
        return this.serialiser(async () => {
            this.verifierContexte(demande);
            const moteur = this.moteur(demande.moduleId);
            exiger(Array.isArray(demande.personnages) && demande.personnages.length <= 256
                && new Set(demande.personnages).size === demande.personnages.length
                && demande.personnages.every(id => this.contexte.personnages.some(p => p.id === id)));
            exiger(!!this.contexte.seanceId || demande.personnages.length === 0, 'Démarre une séance avant d’ouvrir un module aux joueurs.');
            const suivante = copier(this.donnees), campagne = this.contexte.campagneId!;
            suivante.campagnes[campagne] ??= {};
            let etat = this.etat(demande.moduleId);
            for (const id of demande.personnages) if (moteur.preparerLecteur) etat = moteur.preparerLecteur(etat, id, this.contexte.personnages.find(p => p.id === id)!.nom);
            if (!demande.personnages.length) etat = moteur.arreterEffets(etat);
            suivante.campagnes[campagne][demande.moduleId] = { versionDonnees: moteur.manifeste.versionDonnees, donnees: etat };
            // Un retrait ne doit jamais attendre le disque pour couper une vue autorisée auparavant.
            const anciens = this.acces.get(demande.moduleId) ?? new Set<string>();
            const retrait = [...anciens].some(id => !demande.personnages.includes(id));
            if (retrait) { this.acces.set(demande.moduleId, new Set([...anciens].filter(id => demande.personnages.includes(id)))); this.generation++; this.publier(); }
            await this.ecrire(suivante);
            this.acces.set(demande.moduleId, new Set(demande.personnages));
            this.generation++; this.publier();
        });
    }
    private verifierContexte(requete: { campagneId: string; contexte: number }) {
        exiger(requete.campagneId === this.contexte.campagneId && requete.contexte === this.generation, 'La table a changé. Réessaie depuis la vue actuelle.');
        exiger(!this.erreur, this.erreur);
    }
    choisirDiffusion(demande: { campagneId: string; moduleId: string; contexte: number }, appareil: { id: string; personnageId?: string }) {
        return this.serialiser(async () => {
            this.verifierContexte(demande);
            const moteur = this.moteur(demande.moduleId);
            exiger(!!moteur.choisirDiffusion && (appareil.id === 'poste-mj' || (!!appareil.personnageId && this.acces.get(demande.moduleId)?.has(appareil.personnageId))));
            const suivante = copier(this.donnees), campagne = this.contexte.campagneId!;
            suivante.campagnes[campagne] ??= {};
            suivante.campagnes[campagne][demande.moduleId] = { versionDonnees: moteur.manifeste.versionDonnees, donnees: moteur.choisirDiffusion!(this.etat(demande.moduleId), appareil.id) };
            await this.ecrire(suivante); this.publier();
        });
    }
    commander(requete: RequeteDeModule, lecteur: LecteurDeModule, encoreConnecte: () => boolean = () => true) {
        return this.serialiser(async () => {
            exiger(encoreConnecte());
            exiger(objetSimple(requete)); this.verifierContexte(requete);
            const moteur = this.moteur(requete.moduleId);
            const commande = requete.commande;
            exiger(objetSimple(commande) && typeof commande.id === 'string' && Object.keys(commande).every(k => ['id', 'charge'].includes(k)));
            exiger(moteur.manifeste.commandes.some(c => c.id === commande.id && c.roles.includes(lecteur.role)));
            if (lecteur.role === 'joueur') exiger(!!lecteur.personnageId && this.contexte.personnages.some(p => p.id === lecteur.personnageId)
                && this.acces.get(requete.moduleId)?.has(lecteur.personnageId) && !!this.contexte.seanceId);
            const etat = moteur.appliquerCommande(this.etat(requete.moduleId), commande, lecteur);
            const suivante = copier(this.donnees), campagne = this.contexte.campagneId!;
            suivante.campagnes[campagne] ??= {};
            suivante.campagnes[campagne][requete.moduleId] = { versionDonnees: moteur.manifeste.versionDonnees, donnees: etat };
            await this.ecrire(suivante); this.publier();
        });
    }
    async vueMJ(): Promise<VueDesModulesMJ> {
        await this.pret();
        return { campagneId: this.contexte.campagneId, contexte: this.generation, revision: this.revision, erreur: this.erreur ?? this.erreurEcriture,
            modules: this.erreur || !this.contexte.campagneId ? [] : this.disponibles().map(m => ({ id: m.reference.id, libelle: m.libelle,
                revision: this.revision, acces: [...(this.acces.get(m.reference.id) ?? [])], diffusionSonore: !!this.moteur(m.reference.id).choisirDiffusion,
                appareilDeDiffusion: this.moteur(m.reference.id).diffusionActuelle?.(this.etat(m.reference.id)),
                vue: this.moteur(m.reference.id).vuePour(this.etat(m.reference.id), { role: 'mj', appareilId: 'poste-mj' }) })),
            ...(!this.erreur ? { sauvegarde: copier(this.donnees) } : {}),
        };
    }
    async vueJoueur(personnageId: string | null, appareilId: string): Promise<VueDesModulesJoueur> {
        await this.pret();
        return { campagneId: this.contexte.campagneId, personnageId, contexte: this.generation, revision: this.revision,
            modules: this.erreur || !personnageId || !this.contexte.seanceId || !this.contexte.personnages.some(p => p.id === personnageId) ? []
                : this.disponibles().filter(m => this.acces.get(m.reference.id)?.has(personnageId)).map(m => ({ id: m.reference.id, libelle: m.libelle,
                    revision: this.revision, vue: this.moteur(m.reference.id).vuePour(this.etat(m.reference.id), { role: 'joueur', personnageId, appareilId }) })),
        };
    }
    importer(brut: SauvegardeDesModules) {
        return this.serialiser(async () => {
            const restauree = this.restaurer(brut);
            const suivante = copier(this.donnees);
            Object.assign(suivante.campagnes, restauree.campagnes);
            await this.ecrire(suivante);
            this.acces.clear(); this.generation++; this.publier();
        });
    }
}
