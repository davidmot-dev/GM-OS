import { describe, it, expect } from 'vitest';
import MOTEUR from './MusicEngine.ts?raw';

/**
 * **Changer de morceau ne doit pas crier à l'erreur.**
 *
 * ⛔ **Trouvé par David le 2026-09-22, capture de la console à l'appui** : deux
 * `AudioElement Error [blob:…]` en une minute, **alors que tout s'entendait**.
 *
 * Deux défauts s'additionnaient, et aucun n'était dans la lecture :
 *
 * 1. **`src = ""` n'est pas un démontage.** La chaîne vide se résout contre
 *    l'adresse du document : l'élément tente de charger la page elle-même, n'y
 *    trouve aucun média, et lève `error`. C'est un piège connu de `<audio>`.
 * 2. **Le gestionnaire n'était jamais détaché.** Celui de la piste *précédente*
 *    était donc encore là au démontage — il attrapait cette erreur et
 *    journalisait **l'adresse de l'ancienne piste**. *Une erreur qui nomme la
 *    mauvaise piste est pire qu'une erreur qui ne nomme rien.*
 *
 * ⭐ **Ce que ça coûtait vraiment** : une bulle rouge au meneur en pleine
 * partie, pour rien — et surtout, **une vraie panne audio aurait produit
 * exactement le même message**, noyée parmi deux fausses alertes par minute.
 * *Un bruit de fond rend invisible le signal qu'on écoute.*
 *
 * Aucun type n'exprime « détacher avant de démonter » : d'où la relecture de la
 * source.
 */

describe('le démontage d’une piste est silencieux', () => {
    /**
     * ⛔ La règle centrale : on coupe l'écoute **avant** de toucher à l'élément.
     */
    it('détache le gestionnaire avant de démonter', () => {
        const detache = MOTEUR.indexOf('this.audioElement.onerror = null');
        const demonte = MOTEUR.indexOf("this.audioElement.removeAttribute('src')");

        expect(detache, 'le gestionnaire n’est jamais détaché').toBeGreaterThan(-1);
        expect(demonte, 'le démontage ne passe plus par removeAttribute').toBeGreaterThan(-1);
        expect(detache, 'le gestionnaire doit être détaché AVANT le démontage')
            .toBeLessThan(demonte);
    });

    /** ⚠️ Le piège d'origine : il ne doit pas revenir, sous aucune orthographe. */
    it('ne remet jamais src à la chaîne vide', () => {
        const fautes = MOTEUR.split('\n').filter(ligne =>
            /audioElement\.src\s*=\s*(""|''|``)/.test(ligne));

        expect(fautes, 'src = "" fait échouer l’élément au lieu de le libérer').toEqual([]);
    });

    /**
     * ⚠️ **`MediaError` n'a aucune propriété énumérable** : le panneau de
     * débogage rendait « AudioElement Error [blob:…] : » suivi de **rien**. Le
     * code et le message se déplient à la main, sans quoi la trace ne sert à
     * personne.
     */
    it('déplie le code et le message de l’erreur', () => {
        /* La trace tient sur deux lignes : on prend la ligne trouvée et ses
           suivantes, sinon l'essai jugerait sur une moitié de phrase. */
        const lignes = MOTEUR.split('\n');
        /* ⚠️ On vise le gabarit, pas la prose : les commentaires de ce fichier
           citent la phrase « AudioElement Error », et l'essai les trouvait en
           premier. *Un essai qui lit la source doit distinguer le code du récit.* */
        const debut = lignes.findIndex(ligne => ligne.includes('`[MusicDeck] AudioElement Error'));
        expect(debut, 'aucune trace d’erreur audio').toBeGreaterThan(-1);

        const trace = lignes.slice(debut, debut + 3).join('\n');
        expect(trace, 'la trace ne dit pas le code de l’erreur').toContain('code=');
    });

    /** Le meneur est toujours prévenu d'une VRAIE erreur — on n'a pas rendu le module muet. */
    it('prévient encore le meneur quand une piste échoue pour de bon', () => {
        expect(MOTEUR).toContain("gmToast(msg, 'error')");
    });
});
