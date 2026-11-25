import { app, ipcMain } from 'electron';
import path from 'node:path';
import crypto from 'node:crypto';
import fs from 'fs-extra';
import { auditNotice } from './auditLog';

/**
 * **Le code du meneur** — Fire HD 8, registre § 256, T14 (24/11/2026, David : « Fais t14 »).
 *
 * Décision Q6 du 15/11 : un code à quatre chiffres, choisi dans les Paramètres du poste, demandé
 * seulement pour passer d'un rôle public de la tablette de la table (Appareil de table, Écran de
 * table) à l'Aide au MJ. **Le code reste au poste et c'est le serveur qui le compare** : il ne part
 * jamais vers la tablette.
 *
 * Le verrou ne tient que parce que la tablette **oublie son secret d'appairage** en passant dans un
 * rôle public (`AccueilDeLaTablette`) : sans lui, elle ne peut pas réclamer le rôle `remote`, quoi
 * qu'on tape dans la barre d'adresse. Le code juste le lui rend (`SyncServer`, `verrou:ouvrir`).
 *
 * Le code est gardé en empreinte (scrypt et sel), dans un fichier à lui : `pairing.rotate()` réécrit
 * `pairing.json` en entier et l'effacerait. Le chemin se lit à l'appel, jamais à l'évaluation du
 * module (`app.getPath('userData')` verrouillerait le chemin des données).
 */

/** Quatre chiffres, ni plus ni moins. */
export const codeValide = (code: unknown): code is string => typeof code === 'string' && /^\d{4}$/.test(code);

export const empreinteDuCode = (code: string, sel: string): string => crypto.scryptSync(code, sel, 32).toString('hex');

/**
 * **Trois essais, puis une attente qui double** — par adresse de l'appareil, car son identifiant se
 * déclare. Quatre chiffres, c'est dix mille codes : sans limite, une tablette de joueur les essaierait
 * tous en une soirée. Pur : l'horloge est passée, pour l'essai.
 */
export class LimiteurDEssais {
    private readonly suivis = new Map<string, { echecs: number; salves: number; bloqueJusqua: number }>();

    constructor(
        private readonly essais = 3,
        private readonly blocageMs = 5 * 60_000,
        private readonly maintenant: () => number = () => Date.now(),
    ) {}

    /** Le temps d'attente restant, ou 0 si la porte est ouverte. */
    attente(cle: string): number {
        const suivi = this.suivis.get(cle);
        return suivi ? Math.max(0, suivi.bloqueJusqua - this.maintenant()) : 0;
    }

    /** Un code faux : les essais restants, ou l'attente si la salve est épuisée. */
    echec(cle: string): { restants: number; attenteMs: number } {
        const suivi = this.suivis.get(cle) ?? { echecs: 0, salves: 0, bloqueJusqua: 0 };
        suivi.echecs += 1;
        if (suivi.echecs >= this.essais) {
            const attenteMs = this.blocageMs * 2 ** suivi.salves;
            suivi.salves += 1;
            suivi.echecs = 0;
            suivi.bloqueJusqua = this.maintenant() + attenteMs;
            this.suivis.set(cle, suivi);
            return { restants: 0, attenteMs };
        }
        this.suivis.set(cle, suivi);
        return { restants: this.essais - suivi.echecs, attenteMs: 0 };
    }

    reussite(cle: string): void {
        this.suivis.delete(cle);
    }
}

class VerrouDuMeneur {
    private fichier(): string {
        return path.join(app.getPath('userData'), 'code-du-meneur.json');
    }

    private lire(): { sel: string; empreinte: string } | null {
        try {
            const brut = fs.readJsonSync(this.fichier(), { throws: false }) as { sel?: unknown; empreinte?: unknown } | null;
            return brut && typeof brut.sel === 'string' && typeof brut.empreinte === 'string'
                ? { sel: brut.sel, empreinte: brut.empreinte } : null;
        } catch {
            return null;
        }
    }

    estRegle(): boolean {
        return this.lire() !== null;
    }

    /** Règle le code, ou le retire (`null`). Un code mal formé est refusé : rien ne change. */
    regler(code: string | null): boolean {
        if (code === null) {
            fs.removeSync(this.fichier());
            auditNotice('Code du meneur retiré : la tablette de la table revient à l’Aide au MJ sans code');
            return true;
        }
        if (!codeValide(code)) return false;
        const sel = crypto.randomBytes(16).toString('hex');
        fs.outputJsonSync(this.fichier(), { sel, empreinte: empreinteDuCode(code, sel), regleLe: Date.now() }, { spaces: 2 });
        auditNotice('Code du meneur réglé pour la tablette de la table');
        return true;
    }

    /** Compare en temps constant ; faux si aucun code n'est réglé. */
    verifier(code: unknown): boolean {
        const regle = this.lire();
        if (!regle || !codeValide(code)) return false;
        const attendue = Buffer.from(regle.empreinte, 'hex');
        const fournie = Buffer.from(empreinteDuCode(code, regle.sel), 'hex');
        return attendue.length === fournie.length && crypto.timingSafeEqual(attendue, fournie);
    }
}

export const verrouDuMeneur = new VerrouDuMeneur();

/** Réservé au poste MJ : les Paramètres règlent ou retirent le code, et savent s'il en a un. */
export function registerVerrouHandlers() {
    ipcMain.handle('verrou:etat', () => ({ regle: verrouDuMeneur.estRegle() }));
    ipcMain.handle('verrou:regler', (_evenement, code: unknown) => {
        const ok = code === null || codeValide(code) ? verrouDuMeneur.regler(code as string | null) : false;
        return { ok, regle: verrouDuMeneur.estRegle() };
    });
}
