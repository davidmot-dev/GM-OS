import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useCombatStore } from './useCombatStore';

/**
 * **Combien de combattants la Fabrique met-elle vraiment sur le plateau ?**
 *
 * *Signalé par David le 2026-09-03, le jour même de la livraison de l'atelier :
 * « quand je crée 1 combattant dans la Fabrique, il m'en envoie 2 dans le
 * combat ».*
 *
 * Deux explications possibles, et elles n'appellent pas du tout le même geste :
 *
 * 1. **La Fabrique appelle deux fois.** Ce serait un défaut, et il faudrait le
 *    corriger.
 * 2. **Le second n'est pas un adversaire, c'est un PJ.** Depuis le 2026-08-20,
 *    le premier combattant posé sur un plateau vide rattache le combat à la
 *    scène en cours, et *les PJ que la scène déclare présents entrent avec lui*
 *    (`faireEntrerLesPJDeLaScene`). Le même bouton d'ajout manuel fait
 *    exactement pareil depuis ce jour-là.
 *
 * Ce fichier tranche entre les deux, et tient la réponse : **la Fabrique ajoute
 * exactement ce qu'on lui demande**, et ce qui s'ajoute en plus est un PJ, pas
 * une copie. *Un comportement voulu qui ressemble à un défaut mérite son test :
 * c'est lui qui évitera de « corriger » la fonctionnalité la prochaine fois.*
 */

interface Scene { id: string; campaignId: string; titre: string; personnagesIds?: string[]; passages?: { debut: string; fin?: string }[] }

/**
 * Une scene EN COURS, et pas seulement prevue.
 *
 * ⛔ Premiere version de ces tests : des scenes sans `passages` NI `campaignId`.
 * Elles valent
 * alors « prevue » pour `etatDeLaScene`, aucune n'est ouverte, aucun PJ
 * n'entre — et les deux tests qui devaient reproduire le cas de David
 * passaient a cote en echouant pour la mauvaise raison. *Un decor incomplet ne
 * reproduit pas un defaut, il en fabrique un autre.*
 */
const sceneEnCours = (id: string, titre: string, personnagesIds: string[]): Scene =>
    ({ id, campaignId: 'c-1', titre, personnagesIds, passages: [{ debut: new Date().toISOString() }] });

/** Le magasin de séance, tel que `personnagesDeLaScene` le lit — par `window`. */
const poserLeMagasinDeSeance = (scenes: Scene[]) => {
    (window as unknown as { useSessionOSStore: { getState: () => unknown } }).useSessionOSStore = {
        getState: () => ({
            activeCampaignId: 'c-1',
            sessions: [{ id: 's-1', campaignId: 'c-1', status: 'active', acteId: 'a-1' }],
            scenes,
            players: [{ characters: [{ id: 'pj-ripley', name: 'Ripley' }] }],
        }),
    };
};

const sansMagasinDeSeance = () => {
    delete (window as unknown as { useSessionOSStore?: unknown }).useSessionOSStore;
};

/** Ce que fait `envoyerAuCombat` de l'atelier, sans son écran. */
const envoyerDesAdversaires = (nombre: number) => {
    for (let i = 0; i < nombre; i++) {
        useCombatStore.getState().addCombatant({
            name: nombre > 1 ? `Pillard ${i + 1}` : 'Pillard',
            init: 0,
            isPlayer: false,
            faction: 'enemy',
            statuses: [],
            sheetData: { combat: 5 },
        });
    }
};

describe('les adversaires envoyés au combat', () => {
    beforeEach(() => {
        useCombatStore.setState({ combatants: [], sceneId: null, round: 1, currentTurnIdx: 0 });
        sansMagasinDeSeance();
    });

    afterEach(sansMagasinDeSeance);

    it('⭐ en envoie UN quand on en demande un, hors de toute scène', () => {
        envoyerDesAdversaires(1);
        expect(useCombatStore.getState().combatants).toHaveLength(1);
    });

    it('en envoie exactement autant qu’on en demande', () => {
        envoyerDesAdversaires(4);
        const plateau = useCombatStore.getState().combatants;
        expect(plateau).toHaveLength(4);
        expect(new Set(plateau.map(c => c.id)).size).toBe(4); // quatre identités, pas une répétée
        expect(plateau.every(c => !c.isPlayer)).toBe(true);
    });

    it('⭐ le combattant en trop est un PJ de la scène, JAMAIS une copie', () => {
        /*
          Le cas de David : une seule scène ouverte, un PJ déclaré présent. Le
          plateau en montre deux — mais le second porte le nom du joueur et sa
          carte est celle d'un PJ.
        */
        poserLeMagasinDeSeance([sceneEnCours('sc-1', 'Le hangar', ['pj-ripley'])]);

        envoyerDesAdversaires(1);

        const plateau = useCombatStore.getState().combatants;
        expect(plateau).toHaveLength(2);

        const adversaires = plateau.filter(c => !c.isPlayer);
        const joueurs = plateau.filter(c => c.isPlayer);
        expect(adversaires).toHaveLength(1);
        expect(adversaires[0].name).toBe('Pillard');
        expect(joueurs).toHaveLength(1);
        expect(joueurs[0].name).toBe('Ripley');
    });

    it('ne fait entrer les PJ qu’une fois, pas à chaque adversaire', () => {
        /*
          L'arrivée des PJ est liée au PREMIER combattant d'un plateau vide.
          Quatre adversaires ne doivent donc pas faire entrer Ripley quatre fois.
        */
        poserLeMagasinDeSeance([sceneEnCours('sc-1', 'Le hangar', ['pj-ripley'])]);

        envoyerDesAdversaires(4);

        const plateau = useCombatStore.getState().combatants;
        expect(plateau.filter(c => c.isPlayer)).toHaveLength(1);
        expect(plateau.filter(c => !c.isPlayer)).toHaveLength(4);
    });

    it('n’ajoute aucun PJ quand le plateau n’est pas vide', () => {
        /* Renforts en cours de combat : personne d'autre n'arrive. */
        poserLeMagasinDeSeance([sceneEnCours('sc-1', 'Le hangar', ['pj-ripley'])]);

        envoyerDesAdversaires(1);
        const apresLePremier = useCombatStore.getState().combatants.length;

        envoyerDesAdversaires(1);
        expect(useCombatStore.getState().combatants).toHaveLength(apresLePremier + 1);
    });
});
