import { describe, it, expect } from 'vitest';
import { lireUneFicheEcrite } from './reprendreLAtelier';

/**
 * Ce que ces tests protègent : **l'avancement se lit sur le disque, jamais en
 * mémoire de session**.
 *
 * Sans cela, fermer l'application laissait les brouillons bien écrits mais hors
 * d'atteinte de l'écran : il aurait fallu reforger — deux minutes de carnet pour
 * une réponse déjà obtenue. C'est la règle que l'Atelier des règles applique
 * déjà : *une série reprise depuis le disque est vraie ; une série restaurée de
 * mémoire prétendrait connaître un état que le disque seul atteste.*
 *
 * L'échantillon vient du corpus réel forgé par David le 2026-08-15,
 * « Le secret de Milo ».
 */

const FICHE = `---
sujet: Amorces et accroches
campagne: le-secret-de-milo
jeu: custom-1774643419710
couverture: complète
hors_canevas: false
sources: "Cthulhu hack_Le Secret de Milo.pdf"
sections: "« Les scénarios » ; « Introduction » ; « Enquête sur Ishtar »"
genere_par: notebooklm
gabarit: v3
relu: false
---

# Amorces et accroches

Les PJ reçoivent un dossier de coupures de journaux.
`;

describe('lireUneFicheEcrite', () => {
    it('relit ce que le frontmatter atteste', () => {
        const fiche = lireUneFicheEcrite('amorces-et-accroches', FICHE);

        expect(fiche.sujet).toBe('Amorces et accroches');
        expect(fiche.couverture).toBe('complète');
        expect(fiche.horsCanevas).toBe(false);
        expect(fiche.sections).toEqual(['Les scénarios', 'Introduction', 'Enquête sur Ishtar']);
        expect(fiche.slug).toBe('amorces-et-accroches');
    });

    it("garde le fichier INTACT — c'est lui qu'on republiera", () => {
        // Republier doit réécrire exactement ce qui a été relu : reconstruire le
        // markdown depuis les champs perdrait le corps de la fiche.
        expect(lireUneFicheEcrite('x', FICHE).markdown).toBe(FICHE);
    });

    it('se marque comme reprise', () => {
        // L'écran le dit à l'utilisateur : une fiche relue ne porte pas les
        // avertissements de sa forge, et un silence ne doit pas se lire comme un
        // « rien à signaler ».
        expect(lireUneFicheEcrite('x', FICHE).reprise).toBe(true);
    });

    it('une fiche sans section est signalée', () => {
        // Rien n'attrape alors l'invention dessus : le résolveur titre → page
        // n'a rien à confronter.
        const sans = FICHE.replace(/^sections:.*$/m, 'sections: ""');
        expect(lireUneFicheEcrite('x', sans).avertissements.join(' ')).toContain('Aucun titre de section');
    });

    it('une couverture absente est signalée, pas masquée', () => {
        const absente = FICHE.replace('couverture: complète', 'couverture: absente');
        expect(lireUneFicheEcrite('x', absente).avertissements.join(' ')).toContain("n'a rien trouvé sur ce sujet");
    });

    it('des pages citées sont signalées', () => {
        const avecPages = FICHE.replace('relu: false', 'pages_fiables: false\nrelu: false');
        expect(lireUneFicheEcrite('x', avecPages).avertissements.join(' ')).toContain('numéros de page');
    });

    it('un fichier sans frontmatter est signalé plutôt que lu de travers', () => {
        /**
         * Le dossier `drafts/` peut contenir autre chose que nos fiches — un
         * fichier posé à la main, un reste. Le lire comme une fiche valide en
         * ferait une fiche vide et muette ; on le dit.
         */
        const fiche = lireUneFicheEcrite('x', '# Notes en vrac\n\nrien de structuré');
        expect(fiche.avertissements.join(' ')).toContain('pas de frontmatter');
        expect(fiche.couverture, 'jamais « complète » par défaut').toBe('partielle');
    });
});
