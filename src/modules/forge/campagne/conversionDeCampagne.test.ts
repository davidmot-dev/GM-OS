import { describe, it, expect } from 'vitest';
import { convertirFiche } from '../rules/conversion';
import { CANEVAS_DE_CAMPAGNE } from './canevasDeCampagne';

/**
 * Ce que ces tests protègent : **une fiche de campagne ne se déguise pas en
 * fiche de règles**.
 *
 * Tout ce qui classe une fiche lit son frontmatter — à commencer par la
 * sélection RAG (`electron/ragSelection.ts`). Une fiche de campagne rangée sous
 * `systeme:` serait citée en séance comme une règle du jeu, et son sujet, rabattu
 * sur le mauvais canevas, tomberait en « hors canevas » à chaque fois.
 */

const FICHE = `## Métadonnées
- sujet : Personnages non joueurs
- couverture : complète
- sources : Agents de Dune, chapitre 2
- sections : \`La Cour de Carthag\`, \`Les Fremen\`

## Contenu
**Duncan Idaho** — maître d'armes des Atréides.

## Non couvert
rien
`;

const options = (extra: Record<string, unknown> = {}) => ({
    systeme: 'agents-de-dune',
    clefDAppartenance: 'campagne',
    canevas: CANEVAS_DE_CAMPAGNE,
    ...extra,
});

describe('convertirFiche en mode campagne', () => {
    it('déclare `campagne:` et non `systeme:`', () => {
        const fiche = convertirFiche(FICHE, options());
        expect(fiche.markdown).toContain('campagne: agents-de-dune');
        expect(fiche.markdown).not.toContain('systeme:');
    });

    it('rabat le sujet sur le canevas de campagne', () => {
        const fiche = convertirFiche(FICHE, options());
        expect(fiche.sujet).toBe('Personnages non joueurs');
        expect(fiche.horsCanevas).toBe(false);
    });

    it('porte la partie quand la fiche est interrogée acte par acte', () => {
        // Deux fiches du même sujet ne se distinguent que par là — et par leur
        // slug, que l'appelant impose pour la même raison.
        const fiche = convertirFiche(FICHE, options({
            champsSupplementaires: { partie: 'Acte I — La Chute de Carthag' },
            slug: 'personnages-non-joueurs--acte-i-la-chute-de-carthag',
        }));
        // Écrit nu : `valeurYaml` ne cite que ce qui casserait un scalaire.
        expect(fiche.markdown).toContain('partie: Acte I — La Chute de Carthag');
        expect(fiche.slug).toBe('personnages-non-joueurs--acte-i-la-chute-de-carthag');
    });

    it('sans slug imposé, deux actes s\'écraseraient — le test le montre', () => {
        /**
         * Le slug par défaut vient du seul sujet. Sans `slug`, la fiche de
         * l'acte II écrirait par-dessus celle de l'acte I, silencieusement.
         * C'est pourquoi `etapesDeLaCampagne` en fabrique un par étape.
         */
        const a = convertirFiche(FICHE, options({ champsSupplementaires: { partie: 'Acte I' } }));
        const b = convertirFiche(FICHE, options({ champsSupplementaires: { partie: 'Acte II' } }));
        expect(a.slug).toBe(b.slug);
    });

    it('un sujet de règles est marqué hors canevas ici', () => {
        const brut = FICHE.replace('Personnages non joueurs', 'Initiative et déroulement du tour');
        const fiche = convertirFiche(brut, options());
        expect(fiche.horsCanevas).toBe(true);
        expect(fiche.avertissements.join(' ')).toContain(`aucun des ${CANEVAS_DE_CAMPAGNE.length} sujets`);
    });

    it('signale les numéros de page malgré la consigne', () => {
        // Les pages rendues par le carnet sont fabriquées : neuf fiches Dune sur
        // dix-sept citaient au-delà de la dernière page du livre.
        const fiche = convertirFiche(`${FICHE}\nVoir p. 42.`, options());
        expect(fiche.markdown).toContain('pages_fiables: false');
        expect(fiche.avertissements.join(' ')).toContain('numéros de page');
    });

    it('naît toujours non relue', () => {
        // Rien ne part sur le disque comme vérifié sans passer devant un humain.
        expect(convertirFiche(FICHE, options()).markdown).toContain('relu: false');
    });
});

describe('le canevas des règles reste le défaut', () => {
    it('sans option, une fiche se range toujours sous `systeme:`', () => {
        // Les deux appelants existants n'ont pas à savoir qu'il existe un second
        // canevas : la généralisation ne devait rien changer pour eux.
        const fiche = convertirFiche(FICHE.replace('Personnages non joueurs', 'Santé et blessures'), { systeme: 'dune' });
        expect(fiche.markdown).toContain('systeme: dune');
        expect(fiche.horsCanevas).toBe(false);
    });
});
