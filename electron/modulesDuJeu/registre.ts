import * as muthur from '../../outils/alien/modules/muthur/moteur.mjs';
import manifeste from '../../outils/alien/modules/muthur/manifeste.json';
import * as detecteur from '../../outils/alien/modules/detecteur/moteur.mjs';
import manifesteDetecteur from '../../outils/alien/modules/detecteur/manifeste.json';
import type { CommandeDetecteur } from '../../outils/alien/modules/detecteur/moteur.mjs';
import type { CommandeMuthur, ContexteMuthur } from '../../outils/alien/modules/muthur/moteur.mjs';
import type { CommandeDeModule } from '../../src/modules/modulesDuJeu/protocole';
import * as lcars from '../../outils/star-trek/lcars/natif.mjs';
import { validerEtat as validerLcars } from '../../outils/star-trek/lcars/moteur.mjs';
import manifesteLcars from '../../outils/star-trek/lcars/manifeste.json';

export type LecteurDeModule = { role: 'mj' | 'joueur'; personnageId?: string; appareilId: string };
export type ContexteDeMoteur = { personnages: { id: string; nom: string }[] };
export interface MoteurEnregistre {
    manifeste: { id: string; libelle: string; versionDonnees: number; commandes: { id: string; roles: string[] }[] };
    creerEtat(): unknown;
    preparerLecteur?(donnees: unknown, id: string, nom: string): unknown;
    preparerContexte?(donnees: unknown, personnages: ContexteDeMoteur['personnages']): unknown;
    fermerAccesApresCommande?(commande: CommandeDeModule): boolean;
    choisirDiffusion?(donnees: unknown, appareilId: string): unknown;
    diffusionActuelle?(donnees: unknown): string | null;
    migrerEtat(donnees: unknown, version: number): unknown;
    arreterEffets(donnees: unknown): unknown;
    appliquerCommande(donnees: unknown, commande: CommandeDeModule, lecteur: LecteurDeModule, contexte: ContexteDeMoteur): unknown;
    vuePour(donnees: unknown, lecteur: LecteurDeModule, contexte: ContexteDeMoteur): unknown;
}
const contexte = (lecteur: LecteurDeModule): ContexteMuthur => {
    if (lecteur.role === 'joueur' && !lecteur.personnageId) throw new Error('Personnage requis.');
    return lecteur as ContexteMuthur;
};
export const REGISTRE_DES_MOTEURS: ReadonlyMap<string, MoteurEnregistre> = new Map([
    [manifesteLcars.id, {
        manifeste: manifesteLcars, creerEtat: lcars.creerEtat, preparerLecteur: lcars.preparerLecteur,
        preparerContexte: lcars.preparerContexte, fermerAccesApresCommande: lcars.fermerAccesApresCommande,
        migrerEtat: lcars.migrerEtat,
        arreterEffets(donnees) { validerLcars(donnees); return lcars.arreterEffets(donnees); },
        appliquerCommande: lcars.appliquerCommande, vuePour: lcars.vuePour,
    }],
    [manifeste.id, {
        manifeste, creerEtat: muthur.creerEtat, migrerEtat: muthur.migrerEtat,
        preparerLecteur(donnees, id, nom) {
            muthur.validerEtat(donnees);
            return muthur.appliquerCommande(donnees, { id: 'preparer-operateur', charge: { personnageId: id, nom } }, { role: 'mj' });
        },
        choisirDiffusion(donnees, appareilId) {
            muthur.validerEtat(donnees);
            return muthur.appliquerCommande(donnees, { id: 'choisir-diffusion', charge: { actif: true } }, { role: 'mj', appareilId });
        },
        diffusionActuelle(donnees) { muthur.validerEtat(donnees); return donnees.diffusionAlarme; },
        arreterEffets(donnees) { muthur.validerEtat(donnees); return muthur.arreterEffets(donnees); },
        appliquerCommande(donnees, commande, lecteur) {
            muthur.validerEtat(donnees);
            return muthur.appliquerCommande(donnees, commande as CommandeMuthur, contexte(lecteur));
        },
        vuePour(donnees, lecteur) { muthur.validerEtat(donnees); return muthur.vuePour(donnees, contexte(lecteur)); },
    }],
    [manifesteDetecteur.id, {
        manifeste: manifesteDetecteur, creerEtat: detecteur.creerEtat, migrerEtat: detecteur.migrerEtat,
        arreterEffets(donnees) { detecteur.validerEtat(donnees); return detecteur.arreterEffets(donnees); },
        appliquerCommande(donnees, commande, lecteur) {
            detecteur.validerEtat(donnees);
            return detecteur.appliquerCommande(donnees, commande as CommandeDetecteur, lecteur);
        },
        vuePour(donnees, lecteur) { detecteur.validerEtat(donnees); return detecteur.vuePour(donnees, lecteur); },
    }],
]);
