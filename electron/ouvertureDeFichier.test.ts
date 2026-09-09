import { describe, it, expect } from 'vitest';
import { verdictDOuverture, EXTENSIONS_EXECUTABLES } from './ouvertureDeFichier';

/**
 * Ce que ces tests protègent : **le bouton « ouvrir le fichier de la campagne »
 * ne doit pas pouvoir devenir un bouton « exécuter ».**
 *
 * `shell.openPath` confie le fichier au système, qui le lance avec ce qui lui
 * est associé. Le chemin vient de la fiche de campagne — écrit par le meneur,
 * *mais une campagne s'importe, et le champ voyage avec elle.*
 */

describe('ce qu’on accepte de confier au système', () => {
    it('ouvre les documents ordinaires', () => {
        for (const chemin of ['C:/campagnes/notes.md', '/home/mj/scenario.pdf',
            'D:/Jeux/Blade Runner/fiche.docx', 'notes.odt', 'C:/x/tableur.xlsx']) {
            expect(verdictDOuverture(chemin), chemin).toEqual({ autorise: true });
        }
    });

    it('refuse tout ce qui s’exécute', () => {
        for (const extension of EXTENSIONS_EXECUTABLES) {
            expect(verdictDOuverture('C:/campagnes/piege' + extension), extension)
                .toEqual({ autorise: false, raison: 'extension-executable' });
        }
    });

    /** *La forme classique du déguisement.* On juge le dernier point, pas le premier. */
    it('n’est pas trompé par une double extension', () => {
        expect(verdictDOuverture('C:/campagnes/notes.pdf.exe'))
            .toEqual({ autorise: false, raison: 'extension-executable' });
    });

    /** Windows ne fait pas la différence, ce contrôle non plus. */
    it('ignore la casse de l’extension', () => {
        expect(verdictDOuverture('C:/campagnes/PIEGE.ExE'))
            .toEqual({ autorise: false, raison: 'extension-executable' });
    });

    it('refuse un chemin vide ou qui n’est pas un chemin', () => {
        expect(verdictDOuverture('')).toEqual({ autorise: false, raison: 'chemin-vide' });
        expect(verdictDOuverture('   ')).toEqual({ autorise: false, raison: 'chemin-vide' });
        expect(verdictDOuverture(undefined)).toEqual({ autorise: false, raison: 'chemin-vide' });
        expect(verdictDOuverture(42)).toEqual({ autorise: false, raison: 'chemin-vide' });
    });

    /**
     * Un dossier n'a pas d'extension à juger, et l'ouvrir revient à l'afficher
     * dans l'explorateur. ⚠️ Sans cette porte, un dossier nommé `Blade.Runner`
     * serait jugé sur `.runner` — *une extension inventée par un point dans un
     * nom.*
     */
    it('laisse passer un dossier, même si son nom contient un point', () => {
        expect(verdictDOuverture('C:/campagnes/Blade.Runner', true)).toEqual({ autorise: true });
    });

    /**
     * *Refuser ici bloquerait des cas légitimes sans fermer le vecteur* : sous
     * Windows le système demande avec quoi ouvrir, il n'exécute rien seul.
     */
    it('laisse passer un fichier sans extension', () => {
        expect(verdictDOuverture('/home/mj/notes')).toEqual({ autorise: true });
    });
});
