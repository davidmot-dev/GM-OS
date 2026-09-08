import { describe, it, expect } from 'vitest';
import { COULEUR_PAD_DEFAUT, couleurDuPad, couleurDuPadAttenuee } from './couleurDuPad';

/**
 * Ce que ces tests protègent : **une couleur de pastille s'applique vraiment.**
 *
 * ⛔ Elles naissaient toutes avec `var(--electric-violet)`, une variable CSS
 * **définie nulle part dans le dépôt** — une seule occurrence dans tout le
 * projet, celle qui l'emploie. Les cinq endroits qui peignent une pastille
 * pointaient donc vers rien, et `setPadColor`, implémentée, n'était appelée par
 * personne : rien ne pouvait remplacer cette valeur morte.
 *
 * *Une couleur qui ne s'applique pas ne rend aucune erreur — l'élément garde
 * simplement ce qu'il avait.* C'est pourquoi ce défaut a tenu si longtemps, et
 * pourquoi le contrôle qui l'a trouvé cherchait un **nom sans appelant**, pas une
 * couleur.
 */

describe('la couleur d’une pastille de son', () => {
    it('garde une hexadécimale à six chiffres', () => {
        expect(couleurDuPad('#ef4444')).toBe('#ef4444');
        expect(couleurDuPad('#EF4444')).toBe('#EF4444');
    });

    /** Le cas de toutes les pastilles existantes, sans migration. */
    it('remplace la variable CSS morte par le violet de l’application', () => {
        expect(couleurDuPad('var(--electric-violet)')).toBe(COULEUR_PAD_DEFAUT);
    });

    it('retombe sur le défaut pour tout ce qui ne se peint pas', () => {
        expect(couleurDuPad(undefined)).toBe(COULEUR_PAD_DEFAUT);
        expect(couleurDuPad('')).toBe(COULEUR_PAD_DEFAUT);
        expect(couleurDuPad('   ')).toBe(COULEUR_PAD_DEFAUT);
        expect(couleurDuPad('rouge')).toBe(COULEUR_PAD_DEFAUT);
        expect(couleurDuPad('#fff')).toBe(COULEUR_PAD_DEFAUT); // trois chiffres : l'alpha ne s'y colle pas
    });
});

describe('la couleur atténuée du fond', () => {
    /**
     * ⚠️ *Une concaténation suppose une forme, et rien ne l'impose.* Le code
     * écrivait `` `${color}15` `` — valide seulement sur une hexadécimale à six
     * chiffres, et la valeur reçue n'en était pas une.
     */
    it('produit une couleur valide, même quand l’entrée n’en est pas une', () => {
        expect(couleurDuPadAttenuee('#ef4444', '15')).toBe('#ef444415');
        expect(couleurDuPadAttenuee('var(--electric-violet)', '15')).toBe(`${COULEUR_PAD_DEFAUT}15`);
        expect(couleurDuPadAttenuee(undefined, '15')).toBe(`${COULEUR_PAD_DEFAUT}15`);
    });

    /** Huit chiffres hexadécimaux, jamais une valeur fonctionnelle collée à un suffixe. */
    it('rend toujours une hexadécimale à huit chiffres', () => {
        for (const entree of ['#ef4444', 'var(--electric-violet)', '', undefined, 'rouge']) {
            expect(couleurDuPadAttenuee(entree, '15')).toMatch(/^#[0-9a-f]{8}$/i);
        }
    });
});
