import { describe, it, expect } from 'vitest';
import {
    GROUPES_DE_LA_TRAME, VOCABULAIRE_VIDE, fichesDuGroupe, promptDuGroupe,
    blocDuVocabulaireNarratif, type ContexteDeLaTrame,
} from './GroupesDeLaTrame';
import { CANEVAS_DE_CAMPAGNE, CLEF_DES_REGLES_PROPRES } from './canevasDeCampagne';
import type { FicheDeCampagneLue } from './lectureDesFiches';
import type { GameDriver } from '../../../types/drivers';

/**
 * Ce que ces tests protègent : **l'ordre des dépendances, et le fait qu'aucune
 * fiche payée au carnet ne reste sans destination**.
 *
 * Les deux défauts visés se ressemblent : ils ne plantent pas. Un groupe qui
 * désigne ce qui n'existe pas encore rend un renvoi mort ; une fiche qu'aucun
 * groupe ne réclame se paie deux minutes de carnet et n'arrive nulle part.
 */

const fiche = (sujet: string, contenu: string, partie?: string): FicheDeCampagneLue =>
    ({ sujet, sujetEcrit: sujet, contenu, ...(partie ? { partie } : {}) });

const contexte = (extra: Partial<ContexteDeLaTrame> = {}): ContexteDeLaTrame =>
    ({ vocabulaire: VOCABULAIRE_VIDE, ...extra });

const groupe = (id: string) => {
    const trouve = GROUPES_DE_LA_TRAME.find(g => g.id === id);
    if (!trouve) throw new Error(`groupe inconnu : ${id}`);
    return trouve;
};

describe("l'ordre des groupes", () => {
    it('ne laisse aucun groupe désigner ce qu\'un groupe ultérieur produit', () => {
        /** Ce que chaque groupe met à disposition des suivants. */
        const produit: Record<string, string> = {
            lieux: 'lieux', factions: 'factions', pnj: 'pnj', indices: 'indices',
        };

        // Les actes ne sont pas un groupe : `etablirLesActes` les lit localement
        // AVANT la boucle, donc ils sont disponibles d'emblée.
        const disponibles = new Set<string>(['actes']);
        for (const g of GROUPES_DE_LA_TRAME) {
            for (const axe of g.designe ?? []) {
                expect(
                    disponibles.has(axe),
                    `« ${g.id} » désigne des ${axe} qu'aucun groupe précédent n'a produits`,
                ).toBe(true);
            }
            if (produit[g.id]) disponibles.add(produit[g.id]);
        }
    });

    it('forge les scènes en dernier : ce sont elles qui désignent le plus', () => {
        const ids = GROUPES_DE_LA_TRAME.map(g => g.id);
        expect(ids.indexOf('scenes')).toBeGreaterThan(ids.indexOf('indices'));
        expect(ids.indexOf('indices')).toBeGreaterThan(ids.indexOf('pnj'));
        expect(ids.indexOf('pnj')).toBeGreaterThan(ids.indexOf('lieux'));
    });

    /**
     * **Aucun groupe ne réclame la structure, et c'est le correctif du
     * 2026-08-16.** Servie à un modèle, sa fiche — un tableau à quatre colonnes
     * dont la dernière liste les titres de chapitre du livre — a rendu trente
     * actes nommés « Introduction », « Explorer l'usine », « Le Sea-You ». Elle
     * se lit désormais localement, avec la fonction qui a produit les `partie:`.
     */
    it('ne demande jamais la structure à un modèle', () => {
        expect(GROUPES_DE_LA_TRAME.flatMap(g => g.sujets)).not.toContain('Structure en actes');
        expect(GROUPES_DE_LA_TRAME.map(g => g.id)).not.toContain('actes');
    });
});

describe('la couverture du canevas', () => {
    it('projette tous les sujets du canevas, sauf les deux qui ne passent pas par un modèle', () => {
        const reclames = new Set(GROUPES_DE_LA_TRAME.flatMap(g => g.sujets));
        const attendus = CANEVAS_DE_CAMPAGNE
            .map(s => s.clef)
            // Les règles n'alimentent aucun objet de jeu (décision du 2026-08-15) ;
            // la structure se lit localement (`etablirLesActes`, 2026-08-16).
            .filter(clef => clef !== CLEF_DES_REGLES_PROPRES && clef !== 'Structure en actes');

        for (const clef of attendus) {
            expect(reclames.has(clef), `aucun groupe ne consomme « ${clef} »`).toBe(true);
        }
    });

    it('ne réclame jamais la fiche des règles propres à la campagne', () => {
        const reclames = GROUPES_DE_LA_TRAME.flatMap(g => g.sujets);
        expect(reclames).not.toContain(CLEF_DES_REGLES_PROPRES);
    });
});

describe('la clé de la réponse', () => {
    /**
     * **La récolte lit `reponse[groupe.id]`.** Un schéma qui nommerait sa clé
     * autrement rendrait une réponse valide que personne ne rangerait — la Forge
     * annoncerait un succès sur un projet vide.
     */
    it("porte le nom du groupe, pour tous les groupes", () => {
        for (const g of GROUPES_DE_LA_TRAME) {
            const schema = g.schema(contexte());
            expect(Object.keys(schema.properties as object), `groupe « ${g.id} »`).toEqual([g.id]);
            expect(schema.required, `groupe « ${g.id} »`).toEqual([g.id]);
        }
    });
});

describe('fichesDuGroupe', () => {
    const fiches = [
        fiche('Personnages non joueurs', 'Arlequin.', "Manigances d'Arlequin"),
        fiche('Personnages non joueurs', 'Milo Torricelli.', 'Mystères en Italie'),
        fiche('Lieux majeurs', "L'Hôtel Artemide."),
    ];

    it('ne retient que les fiches de la partie demandée', () => {
        const retenues = fichesDuGroupe(groupe('pnj'), fiches, 'Mystères en Italie');
        expect(retenues.map(f => f.contenu)).toEqual(['Milo Torricelli.']);
    });

    it('garde les fiches sans partie, qui valent pour toute la campagne', () => {
        const retenues = fichesDuGroupe(groupe('lieux'), fiches, 'Mystères en Italie');
        expect(retenues).toHaveLength(1);
    });

    it('rattrape un sujet que le carnet a reformulé', () => {
        const retenues = fichesDuGroupe(groupe('lieux'), [fiche('Lieux majeurs de la campagne', 'x')]);
        expect(retenues).toHaveLength(1);
    });
});

describe('blocDuVocabulaireNarratif', () => {
    it("interdit tout renvoi quand rien n'a encore été créé", () => {
        const bloc = blocDuVocabulaireNarratif(VOCABULAIRE_VIDE, ['lieux', 'pnj']);
        expect(bloc).toContain("RIEN N'A ENCORE ÉTÉ CRÉÉ");
        expect(bloc).toContain('OMETS');
    });

    it('ne montre que les axes que le groupe peut désigner', () => {
        const bloc = blocDuVocabulaireNarratif(
            { ...VOCABULAIRE_VIDE, lieux: ['Villa d\'Este'], indices: ['La chouette'] },
            ['lieux'],
        );
        expect(bloc).toContain("Villa d'Este");
        expect(bloc).not.toContain('La chouette');
    });
});

describe("l'invite d'un groupe", () => {
    it("borne la passe à son acte, et n'y met que ses fiches", () => {
        const invite = promptDuGroupe(
            groupe('scenes'),
            [
                fiche('Scènes prévues', 'La chouette de la Villa d\'Este.', 'Mystères en Italie'),
                fiche('Scènes prévues', 'La Porte d\'Ishtar.', 'Voyage en Mésopotamie'),
            ],
            contexte({ acte: 'Mystères en Italie', vocabulaire: { ...VOCABULAIRE_VIDE, lieux: ["Villa d'Este"] } }),
        );

        expect(invite).toContain('Mystères en Italie');
        expect(invite).not.toContain("Porte d'Ishtar");
        expect(invite).toContain("CE QUI EXISTE DÉJÀ");
    });

    it("dit qu'aucune fiche n'est disponible plutôt que de laisser un trou", () => {
        const invite = promptDuGroupe(groupe('indices'), [], contexte());
        expect(invite).toContain('aucune fiche disponible');
    });

    it("n'ouvre aucun vocabulaire aux groupes qui n'en désignent aucun", () => {
        const invite = promptDuGroupe(groupe('campagne'), [fiche('Pitch et ton', 'x')], contexte());
        expect(invite).not.toContain("CE QUI EXISTE DÉJÀ");
        expect(invite).not.toContain("RIEN N'A ENCORE ÉTÉ CRÉÉ");
    });
});

describe('la santé des PNJ vient du pilote', () => {
    const pilote = (combat: Partial<NonNullable<GameDriver['combat']>>) =>
        ({ name: 'x', combat } as unknown as GameDriver);

    it("n'ouvre hp et maxHp que si le jeu compte des points", () => {
        const avec = groupe('pnj').schema(contexte({ driver: pilote({ defaultHealthType: 'hp' }) }));
        const item = (avec.properties as Record<string, { items: { properties: Record<string, unknown> } }>).pnj.items.properties;
        expect(item).toHaveProperty('hp');
    });

    it('les refuse au décodeur sur un jeu qui compte autrement', () => {
        const sans = groupe('pnj').schema(contexte({ driver: pilote({ defaultHealthType: 'clocks' }) }));
        const item = (sans.properties as Record<string, { items: { properties: Record<string, unknown> } }>).pnj.items.properties;
        expect(item).not.toHaveProperty('hp');
    });

    it("les refuse aussi quand le jeu n'a pas pu être établi", () => {
        const sans = groupe('pnj').schema(contexte());
        const item = (sans.properties as Record<string, { items: { properties: Record<string, unknown> } }>).pnj.items.properties;
        expect(item).not.toHaveProperty('hp');
        expect(groupe('pnj').cible(contexte())).toContain('N\'écris NI "hp"');
    });

    it("ne demande ni classe d'armure, ni vitesse, ni initiative", () => {
        const schema = groupe('pnj').schema(contexte({ driver: pilote({ defaultHealthType: 'hp' }) }));
        const item = (schema.properties as Record<string, { items: Record<string, unknown> }>).pnj.items;
        expect(item.additionalProperties).toBe(false);
        expect(Object.keys((item as { properties: Record<string, unknown> }).properties))
            .not.toContain('ac');
    });
});
