import { safeStorage, app, ipcMain } from 'electron';
import path from 'node:path';
import fs from 'fs-extra';

/**
 * Le coffre des secrets — clés d'API, jetons.
 *
 * Chiffrement natif par `safeStorage` d'Electron, fichier dans
 * `userData/vault/secrets.enc`.
 *
 * ---
 *
 * **DEUX RÈGLES, ET ELLES VIENNENT D'UN VRAI INCIDENT.**
 *
 * Le 2026-08-16, David a retrouvé ses quatre clés absentes de l'application. Le
 * fichier, lui, était **intact** : quatre entrées, longueurs justes, écrites la
 * veille à 19:37 — et **pas réécrit** de la matinée, alors que l'application
 * avait tourné. Le coffre n'avait rien perdu ; personne ne l'avait lu.
 *
 * *Une clé qui disparaît sans erreur ressemble à un coffre qui oublie.* C'est la
 * deuxième fois que cette phrase s'écrit ici — le 2026-08-15, c'était la
 * réhydratation du magasin qui écrasait les clés en mémoire, et le correctif
 * était juste. Il ne couvrait simplement pas le premier maillon.
 *
 * **1. On ne lit qu'après `ready`.** Le constructeur ne charge plus rien.
 * `registerSecurityHandlers()` est appelé à l'évaluation du module — plus de six
 * cents lignes avant `app.whenReady()` — et `safeStorage` ne doit être employé
 * qu'une fois l'application prête. Le chargement est donc **paresseux** : il a
 * lieu au premier accès, et un accès vient toujours d'un rendu, qui n'existe
 * qu'après `ready`. L'ordre cesse d'être une question de chance.
 *
 * **2. Une lecture ratée n'autorise JAMAIS une réécriture.** C'était le geste
 * qui détruisait. Lecture en échec → `secrets = {}` → l'utilisateur retape UNE
 * clé → `saveSecrets()` écrit la carte mémoire entière, désormais réduite à
 * cette seule clé, **et les autres n'existent plus sur le disque**. Le fichier
 * n'était pas victime du défaut, il en devenait l'instrument.
 *
 * Un coffre illisible est donc relu une fois — souvent il suffisait d'attendre
 * `ready` —, et s'il l'est toujours, il est **mis de côté** avant qu'on n'écrive
 * par-dessus. On ne refuse pas d'écrire, mais on ne détruit rien : c'est la même
 * règle que `fiches-v1/`.
 */

/** Ce que le coffre sait de lui-même. */
export type EtatDuCoffre =
    /** Pas encore ouvert. Aucun accès n'a eu lieu. */
    | 'jamais-lu'
    /** Aucun fichier : première utilisation, et ce n'est pas une panne. */
    | 'vide'
    /** Relu et déchiffré. */
    | 'lu'
    /**
     * Le fichier existe et n'a pas pu être déchiffré.
     *
     * **À ne surtout pas confondre avec « vide ».** Les deux donnent une carte
     * mémoire sans clés ; l'un est un début, l'autre une alerte. Les confondre,
     * c'est autoriser l'écrasement d'un coffre plein.
     */
    | 'illisible';

/** Ce qu'une écriture a fait, pour que l'appelant puisse le dire. */
export interface ResultatDEcriture {
    ecrit: boolean;
    /** Chemin du coffre mis de côté, quand il a fallu en écarter un illisible. */
    ecarte?: string;
    raison?: string;
}

export class SecurityManager {
    private secretsPath: string;
    private secrets: Record<string, string> = {};
    private etat: EtatDuCoffre = 'jamais-lu';

    constructor() {
        this.secretsPath = path.join(app.getPath('userData'), 'vault', 'secrets.enc');
        /*
          **Rien n'est lu ici, et c'est le correctif.** Le constructeur tourne à
          l'évaluation du module, avant `app.whenReady()` ; `safeStorage` n'y est
          pas garanti disponible, et une lecture ratée à cet instant se
          propageait jusqu'à la destruction du fichier.
        */
    }

    /** Le dossier du coffre, créé au moment d'écrire et pas avant. */
    private ensureStoreExists() {
        const dir = path.dirname(this.secretsPath);
        if (!fs.existsSync(dir)) fs.mkdirpSync(dir);
    }

    /** Charge au premier accès, et retente une fois si le coffre était illisible. */
    private assurerCharge() {
        if (this.etat === 'jamais-lu') {
            this.loadSecrets();
            return;
        }
        /*
          **La seconde chance, et elle suffit le plus souvent.** Un coffre déclaré
          illisible l'a presque toujours été parce que le chiffrement n'était pas
          encore disponible. Une relecture plus tard réussit — et évite d'écarter
          un fichier parfaitement sain.
        */
        if (this.etat === 'illisible') this.loadSecrets();
    }

    /**
     * Lit et déchiffre le coffre.
     *
     * **Les deux formats sont tentés dans l'ordre, et un échec des deux n'est
     * jamais silencieux.** L'ancienne version décidait du format d'après
     * `isEncryptionAvailable()` : quand cette fonction rendait `false` sur un
     * fichier pourtant chiffré, elle décodait du binaire en base64, obtenait du
     * charabia, et le `JSON.parse` qui suivait jetait tout dans un `catch` qui
     * concluait « coffre vide ».
     */
    private loadSecrets() {
        if (!fs.existsSync(this.secretsPath)) {
            this.secrets = {};
            this.etat = 'vide';
            return;
        }

        let donnees: Buffer;
        try {
            donnees = fs.readFileSync(this.secretsPath);
        } catch (erreur) {
            console.error('[SecurityManager] Coffre illisible sur le disque :', erreur);
            this.secrets = {};
            this.etat = 'illisible';
            return;
        }

        if (donnees.length === 0) {
            this.secrets = {};
            this.etat = 'vide';
            return;
        }

        // 1. Le format natif, quand le chiffrement répond présent.
        if (safeStorage.isEncryptionAvailable()) {
            try {
                this.secrets = JSON.parse(safeStorage.decryptString(donnees));
                this.etat = 'lu';
                return;
            } catch {
                // Le fichier vient peut-être du repli base64 : on essaie encore.
            }
        }

        // 2. Le repli base64, employé quand le chiffrement n'est pas disponible.
        try {
            this.secrets = JSON.parse(
                Buffer.from(donnees.toString('utf-8'), 'base64').toString('utf-8'),
            );
            this.etat = 'lu';
            return;
        } catch {
            // Ni l'un ni l'autre.
        }

        /*
          **Ici, et nulle part ailleurs, se joue la protection.** On a un fichier
          non vide qu'on ne sait pas lire. L'ancienne version posait
          `secrets = {}` et rendait la main : la prochaine écriture écrasait un
          coffre plein. On garde `{}` — on n'a rien d'autre à offrir — mais l'état
          l'accompagne, et c'est lui qui interdira l'écrasement.
        */
        console.error(
            `[SecurityManager] Coffre présent (${donnees.length} octets) mais indéchiffrable. `
            + "Aucune écriture ne l'écrasera : il sera mis de côté si besoin.",
        );
        this.secrets = {};
        this.etat = 'illisible';
    }

    /**
     * Chiffre et enregistre.
     *
     * **Ne s'exécute jamais sur un coffre illisible sans l'avoir mis de côté.**
     * Écrire par-dessus un fichier dont on n'a pas su lire le contenu, c'est
     * détruire ce qu'il portait — et c'est exactement ce qui a coûté ses clés à
     * David.
     */
    private saveSecrets(): ResultatDEcriture {
        let ecarte: string | undefined;

        if (this.etat === 'illisible') {
            ecarte = this.ecarterLeCoffreIllisible();
            if (!ecarte) {
                return {
                    ecrit: false,
                    raison: "le coffre est illisible et n'a pas pu être mis de côté : "
                        + "rien n'a été écrit, pour ne pas le détruire.",
                };
            }
        }

        try {
            this.ensureStoreExists();
            const texte = JSON.stringify(this.secrets);
            if (safeStorage.isEncryptionAvailable()) {
                fs.writeFileSync(this.secretsPath, safeStorage.encryptString(texte));
            } else {
                console.warn('[SecurityManager] Chiffrement indisponible : repli base64.');
                fs.writeFileSync(this.secretsPath, Buffer.from(texte, 'utf-8').toString('base64'));
            }
            // Ce qu'on vient d'écrire, on sait le relire.
            this.etat = 'lu';
            return { ecrit: true, ...(ecarte ? { ecarte } : {}) };
        } catch (erreur) {
            console.error('[SecurityManager] Échec de l\'écriture du coffre :', erreur);
            return {
                ecrit: false,
                ...(ecarte ? { ecarte } : {}),
                raison: erreur instanceof Error ? erreur.message : String(erreur),
            };
        }
    }

    /**
     * Renomme le coffre indéchiffrable au lieu de l'écraser. Rend son chemin.
     *
     * *On répare plutôt qu'on ne refuse, et on garde une copie* — la règle de
     * `fiches-v1/`, appliquée à ce qui compte le plus. Un fichier qu'on ne sait
     * pas lire aujourd'hui peut redevenir lisible : le profil Windows change, le
     * chiffrement revient. Le détruire ferme cette porte pour toujours.
     */
    private ecarterLeCoffreIllisible(): string | undefined {
        const horodatage = new Date().toISOString().replace(/[:.]/g, '-');
        const destination = `${this.secretsPath}.illisible-${horodatage}`;
        try {
            fs.moveSync(this.secretsPath, destination);
            console.warn(`[SecurityManager] Coffre indéchiffrable mis de côté : ${destination}`);
            // Écarté, donc plus rien à protéger : on repart d'un coffre vide.
            this.etat = 'vide';
            return destination;
        } catch (erreur) {
            console.error('[SecurityManager] Impossible de mettre le coffre de côté :', erreur);
            return undefined;
        }
    }

    /**
     * Enregistre un secret.
     *
     * **Une valeur vide n'est pas un secret**, et l'écrire revenait à supprimer
     * l'entrée sans le dire : `getSecret` rend `null` sur une chaîne vide. Or le
     * champ de saisie appelle cette fonction à **chaque frappe**, y compris quand
     * il est vidé. Effacer une clé mérite un geste explicite — `deleteSecret`.
     */
    public setSecret(id: string, value: string): ResultatDEcriture {
        if (typeof value !== 'string' || value.trim() === '') {
            return {
                ecrit: false,
                raison: "valeur vide : refusée, car l'écrire supprimerait l'entrée en silence.",
            };
        }
        this.assurerCharge();
        this.secrets[id] = value;
        return this.saveSecrets();
    }

    /** Récupère un secret déchiffré. */
    public getSecret(id: string): string | null {
        this.assurerCharge();
        return this.secrets[id] || null;
    }

    /** Supprime un secret — le geste explicite, celui qu'une saisie vide ne fait plus. */
    public deleteSecret(id: string): ResultatDEcriture {
        this.assurerCharge();
        if (!(id in this.secrets)) return { ecrit: false, raison: 'aucune entrée de ce nom.' };
        delete this.secrets[id];
        return this.saveSecrets();
    }

    /**
     * L'état du coffre et ce qu'il porte — **jamais les valeurs**.
     *
     * Sert à l'écran : un panneau de réglages qui affiche des champs vides ne
     * peut pas distinguer « tu n'as jamais saisi de clé » de « le coffre n'a pas
     * pu être lu, ne retape rien ». La seconde phrase est celle qui aurait évité
     * l'incident.
     */
    public etatDuCoffre(): { etat: EtatDuCoffre; entrees: string[] } {
        this.assurerCharge();
        return { etat: this.etat, entrees: Object.keys(this.secrets) };
    }
}

/** Enregistre les handlers IPC pour le pont de sécurité. */
export function registerSecurityHandlers() {
    // L'instance ne lit rien à la construction : le premier appel IPC vient d'un
    // rendu, qui n'existe qu'après `ready`.
    const manager = new SecurityManager();

    ipcMain.handle('security:get-secret', (_, id: string) => manager.getSecret(id));
    ipcMain.handle('security:set-secret', (_, id: string, value: string) => manager.setSecret(id, value));
    ipcMain.handle('security:delete-secret', (_, id: string) => manager.deleteSecret(id));
    ipcMain.handle('security:etat', () => manager.etatDuCoffre());
}
