import { describe, it, expect, beforeEach } from 'vitest';
import { construireLaSauvegarde } from './SessionService';
import { useLightStore } from '../modules/light/useLightStore';
import { CHAMPS_DURABLES_LUMIERE } from '../modules/light/logic/donneesDurables';
import { DUREE_MINIMALE_MS } from '../modules/light/logic/effetDAtelier';
import { validateSession } from '../types/schemas';

/**
 * **Un effet d'atelier est du travail, et le travail se sauvegarde.**
 *
 * ⛔ **C'est le champ le plus cher de Light-OS à perdre.** Une tuile se
 * recapture en rallumant la pièce, une ambiance se refait en trois clics —
 * mais une suite de huit étapes, avec ses durées et ses fondus, **ne se
 * retrouve pas de mémoire.**
 *
 * ⚠️ Ce fichier garde les **trois** maillons, parce que chacun a déjà été
 * oublié seul dans ce dépôt :
 *
 * 1. le champ entre dans la charge utile ;
 * 2. le schéma Zod le **déclare** — sinon il est écrit puis jeté en silence à
 *    la relecture, `modules` n'étant pas `passthrough` ;
 * 3. il figure dans les champs surveillés, sinon **rien n'arme** la sauvegarde
 *    quand il change.
 *
 * *Mettre un module dans la charge utile ne suffit pas : il faut que quelque
 * chose appuie sur le bouton.*
 */

const EFFET = {
    id: 'a-1',
    nom: 'Orage lointain',
    etapes: [
        { couleur: '#ffffff', brillance: 100, duree: 120, fondu: 0 },
        { couleur: '#102040', brillance: 15, duree: 18000, fondu: 3000 },
    ],
    alea: 20,
};

describe('les effets de l’atelier entrent dans la sauvegarde', () => {
    beforeEach(() => {
        useLightStore.getState().reset();
        useLightStore.setState({ effetsDAtelier: [EFFET] as never });
    });

    it('la charge utile les porte, étapes comprises', () => {
        const sauvegarde = construireLaSauvegarde();
        const effets = (sauvegarde.modules.light as { effetsDAtelier?: typeof EFFET[] })?.effetsDAtelier;

        expect(effets, 'les effets d’atelier sont absents de la sauvegarde').toHaveLength(1);
        expect(effets![0].etapes).toHaveLength(2);
        expect(effets![0].etapes[1].fondu, 'une étape a perdu son fondu').toBe(3000);
    });

    /**
     * ⛔ **Le piège du 19/09, payé deux fois ce jour-là.** `modules` n'est pas
     * `passthrough` : une clé non déclarée est écrite dans le fichier puis
     * **jetée à la relecture**, sans une ligne d'erreur.
     */
    it('le schéma les déclare, donc la relecture les garde', () => {
        const relue = validateSession(JSON.parse(JSON.stringify(construireLaSauvegarde())));

        expect(
            (relue?.modules?.light as { effetsDAtelier?: unknown[] })?.effetsDAtelier,
            'Zod a jeté les effets d’atelier à la relecture',
        ).toHaveLength(1);
    });

    /** *Un champ sauvegardé que rien n'arme ne part jamais.* */
    it('figure parmi les champs qui arment la sauvegarde', () => {
        expect(CHAMPS_DURABLES_LUMIERE).toContain('effetsDAtelier');
    });
});

describe('le magasin tient les bornes, quelle que soit la porte', () => {
    beforeEach(() => {
        useLightStore.getState().reset();
    });

    /**
     * ⛔ Une étape à 10 ms sur six lampes, ce sont six cents commandes par
     * seconde à un pont qui en tient dix. *Le plancher se tient dans le
     * magasin, pas dans le champ de saisie : un champ se contourne.*
     */
    it('ramène une étape trop rapide au plancher du pont', () => {
        const id = useLightStore.getState().creerUnEffetDAtelier();

        useLightStore.getState().modifierUnEffetDAtelier(id, {
            etapes: [{ couleur: '#ffffff', brillance: 50, duree: 5, fondu: 0 }],
        });

        const effet = useLightStore.getState().effetsDAtelier.find(e => e.id === id)!;
        expect(effet.etapes[0].duree).toBe(DUREE_MINIMALE_MS);
    });

    it('ne fabrique jamais deux homonymes', () => {
        useLightStore.getState().creerUnEffetDAtelier();
        useLightStore.getState().creerUnEffetDAtelier();

        const noms = useLightStore.getState().effetsDAtelier.map(e => e.nom);
        expect(new Set(noms).size, 'deux effets portent le même nom').toBe(noms.length);
    });

    it('rend l’identifiant qu’il vient de créer', () => {
        const id = useLightStore.getState().creerUnEffetDAtelier();

        expect(useLightStore.getState().effetsDAtelier.some(e => e.id === id)).toBe(true);
    });

    it('oublie un effet supprimé', () => {
        const id = useLightStore.getState().creerUnEffetDAtelier();

        useLightStore.getState().supprimerUnEffetDAtelier(id);

        expect(useLightStore.getState().effetsDAtelier).toHaveLength(0);
    });
});
