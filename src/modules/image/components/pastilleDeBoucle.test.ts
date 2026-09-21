import { describe, it, expect } from 'vitest';

/**
 * **Un pad porte DEUX identifiants, et un seul ouvre le Media Hub.**
 *
 * ⛔ Le défaut, introduit et trouvé le 2026-09-21 : l'interrupteur de boucle
 * lisait `media.id` — l'identifiant **du pad** — là où le fichier est connu du
 * Media Hub sous `media.path`. Il cherchait donc une fiche qui n'existe pas :
 * l'icône affichait toujours « boucle », et le clic écrivait dans le vide.
 *
 * ⭐ *Deux identifiants sur un même objet finissent toujours par être
 * confondus ; celui qui est juste est celui que le reste du code emploie
 * déjà* — `projectSolo` envoie `media.path` au projecteur.
 *
 * Cet essai lit la **source**, comme le recensement de `rendreLEtat` : c'est le
 * seul moyen de garder une règle qu'aucun type n'exprime. *Un identifiant
 * confondu ne lève aucune erreur — il rend simplement `undefined`.*
 */

const SOURCE = Object.entries(
    import.meta.glob('./ImagePad.tsx', { eager: true, query: '?raw', import: 'default' }),
)[0][1] as string;

describe('la pastille de boucle d’un pad', () => {
    it('ouvre le Media Hub par `media.path`', () => {
        expect(
            SOURCE,
            'la pastille cherche la fiche du média par le mauvais identifiant',
        ).toContain('m.id === media.path');
    });

    /** ⛔ La forme exacte du défaut d'origine : elle ne doit pas revenir. */
    it('et jamais par `media.id`', () => {
        expect(SOURCE).not.toContain('m.id === media.id');
    });

    /** *Mieux vaut pas de bouton qu'un bouton qui n'écrit rien.* */
    it('ne s’affiche que si le Media Hub connaît le fichier', () => {
        expect(SOURCE).toContain('estVideo && fiche');
    });

    /**
     * ⚠️ Le même piège vaut pour l'écriture : basculer sur `media.id`
     * chercherait dans la base un média qui n'y est pas, et échouerait en
     * silence.
     */
    it('écrit aussi par `media.path`', () => {
        expect(SOURCE).toContain('basculerLaBoucle(media.path)');
    });
});
