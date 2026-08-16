import { describe, it, expect } from 'vitest';
import {
    fichesSupplanteesDeCampagne, partieDuFrontmatter,
    type FicheDeCampagnePresente,
} from './fichesSupplanteesDeCampagne';

/**
 * Ce que ces tests protègent : **un acte n'a jamais deux jeux de fiches**.
 *
 * L'incident du 2026-08-16. La structure relancée a rendu « Scénario 3: Voyage
 * en Mésopotamie (ou Voyage en Mésopotamie) » là où août disait « Scénario 3:
 * Voyage en Mésopotamie ». Le titre entre dans le slug : les fiches neuves n'ont
 * rien écrasé, elles se sont installées **à côté**. La Forge en a ignoré un jeu
 * en silence, l'Oracle a reçu les deux. Rien n'a planté.
 */

const f = (nom: string, sujet: string | null, partie?: string | null): FicheDeCampagnePresente =>
    ({ nom, sujet, ...(partie !== undefined ? { partie } : {}) });

describe('fichesSupplanteesDeCampagne', () => {
    it("rattrape une dérive du titre d'acte", () => {
        const presentes = [
            f('personnages-non-joueurs--scenario-3-voyage-en-mesopotamie.md',
                'Personnages non joueurs', 'Scénario 3: Voyage en Mésopotamie'),
            f('scenes-prevues--scenario-3-voyage-en-mesopotamie.md',
                'Scènes prévues', 'Scénario 3: Voyage en Mésopotamie'),
        ];

        expect(fichesSupplanteesDeCampagne(
            'Personnages non joueurs',
            'Scénario 3: Voyage en Mésopotamie (ou Voyage en Mésopotamie)',
            'personnages-non-joueurs--scenario-3-voyage-en-mesopotamie-ou-voyage-en-mesopotamie.md',
            presentes,
        )).toEqual(['personnages-non-joueurs--scenario-3-voyage-en-mesopotamie.md']);
    });

    it('ne touche pas les autres actes du même sujet', () => {
        const presentes = [
            f('pnj--acte-1.md', 'Personnages non joueurs', 'Scénario 1: Manigances'),
            f('pnj--acte-2.md', 'Personnages non joueurs', 'Scénario 2: Mystères'),
        ];

        expect(fichesSupplanteesDeCampagne(
            'Personnages non joueurs', 'Scénario 1: Manigances', 'neuf.md', presentes,
        )).toEqual(['pnj--acte-1.md']);
    });

    it("ne confond pas « Acte 1 » et « Acte 12 »", () => {
        // Le préfixe se juge sur un MOT entier : sans cela, un acte en avalerait
        // un autre, et la fiche partirait dans fiches-v1/.
        const presentes = [f('pnj--acte-12.md', 'Personnages non joueurs', 'Acte 12')];

        expect(fichesSupplanteesDeCampagne(
            'Personnages non joueurs', 'Acte 1', 'pnj--acte-1.md', presentes,
        )).toEqual([]);
    });

    it("rapproche deux formulations du même sujet", () => {
        // Le carnet rend « Personnages non joueurs majeurs » une fois sur deux.
        const presentes = [f('ancienne.md', 'Personnages non joueurs majeurs', 'Acte I')];

        expect(fichesSupplanteesDeCampagne(
            'Personnages non joueurs', 'Acte I', 'neuve.md', presentes,
        )).toEqual(['ancienne.md']);
    });

    it('ne mélange pas un sujet borné et un sujet global', () => {
        const presentes = [
            f('lieux-majeurs.md', 'Lieux majeurs', null),
            f('pnj--acte-1.md', 'Personnages non joueurs', 'Acte I'),
        ];

        // Une fiche globale ne remplace pas une fiche d'acte, ni l'inverse.
        expect(fichesSupplanteesDeCampagne('Lieux majeurs', 'Acte I', 'neuf.md', presentes)).toEqual([]);
        expect(fichesSupplanteesDeCampagne('Personnages non joueurs', null, 'neuf.md', presentes)).toEqual([]);
    });

    it('remplace bien une fiche globale par une autre', () => {
        const presentes = [f('lieux.md', 'Lieux majeurs', null)];
        expect(fichesSupplanteesDeCampagne('Lieux majeurs', null, 'lieux-majeurs.md', presentes))
            .toEqual(['lieux.md']);
    });

    it("n'est jamais son propre doublon", () => {
        const presentes = [f('lieux-majeurs.md', 'Lieux majeurs', null)];
        expect(fichesSupplanteesDeCampagne('Lieux majeurs', null, 'lieux-majeurs.md', presentes))
            .toEqual([]);
    });

    it('laisse en place une fiche sans sujet', () => {
        // L'inventaire est dans ce cas : il n'entre dans aucun groupe, il ne peut
        // être le doublon de personne, et l'archiver couperait la reprise à froid.
        const presentes = [f('inventaire.md', null, null)];
        expect(fichesSupplanteesDeCampagne('Lieux majeurs', null, 'neuf.md', presentes)).toEqual([]);
    });

    it('ne fait rien sans sujet à publier', () => {
        expect(fichesSupplanteesDeCampagne('', null, 'neuf.md', [f('x.md', 'Lieux majeurs', null)]))
            .toEqual([]);
    });
});

describe('partieDuFrontmatter', () => {
    it('lit la valeur, guillemets ôtés', () => {
        expect(partieDuFrontmatter('---\nsujet: PNJ\npartie: "Acte I — La Chute"\n---\n'))
            .toBe('Acte I — La Chute');
    });

    it('rend null quand la fiche ne porte pas d\'acte', () => {
        expect(partieDuFrontmatter('---\nsujet: Lieux majeurs\n---\n')).toBeNull();
    });

    it('ne ramène pas le délimiteur sur un frontmatter tronqué', () => {
        // `\s` traverse les retours à la ligne : deux fiches cassées se seraient
        // alors supplantées mutuellement. Le défaut attrapé côté règles.
        expect(partieDuFrontmatter('---\npartie:\n---\n')).toBeNull();
    });
});
