import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from 'zustand';
import { createTrameSlice, type TrameSlice } from './trameSlice';
import { actesOrdonnes, scenesOrdonnees, etatDeLaScene, closeSansAvoirEteJouee } from '../logic/trame';

/**
 * Ce que ces tests protègent : **les deux liens d'une scène ne se contredisent
 * jamais**.
 *
 * Une `Scene` porte `acteId` ET `campaignId`, et la redondance est voulue —
 * filtrer les scènes d'une campagne est l'opération la plus fréquente de tous
 * les écrans. Le prix de cette redondance est qu'elle peut diverger : une scène
 * rattachée à l'acte d'une autre campagne sans que `campaignId` suive
 * disparaîtrait de tous les écrans qui filtrent par campagne, sans qu'aucune
 * erreur ne soit levée. C'est le slice, et lui seul, qui tient les deux
 * ensemble.
 */

const nouveauStore = () => createStore<TrameSlice>()((...a) => createTrameSlice(...a));

describe('trameSlice', () => {
    let store: ReturnType<typeof nouveauStore>;

    beforeEach(() => {
        store = nouveauStore();
    });

    it('une scène hérite la campagne de son acte, jamais un paramètre', () => {
        const acteId = store.getState().ajouterActe('c1', 'Acte I');
        const sceneId = store.getState().ajouterScene(acteId, 'L\'embuscade');

        const scene = store.getState().scenes.find(s => s.id === sceneId)!;
        expect(scene.campaignId).toBe('c1');
        expect(scene.acteId).toBe(acteId);
    });

    it('une scène sans acte n\'est pas créée', () => {
        // Elle serait orpheline dès sa naissance : invisible sur tous les écrans
        // tout en pesant dans la base. Mieux vaut ne rien créer.
        expect(store.getState().ajouterScene('acte-inexistant', 'X')).toBe('');
        expect(store.getState().scenes).toHaveLength(0);
    });

    it('supprimer un acte emporte ses scènes, et elles seules', () => {
        const a1 = store.getState().ajouterActe('c1', 'Acte I');
        const a2 = store.getState().ajouterActe('c1', 'Acte II');
        store.getState().ajouterScene(a1, 'S1');
        store.getState().ajouterScene(a1, 'S2');
        const gardee = store.getState().ajouterScene(a2, 'S3');

        store.getState().supprimerActe(a1);

        expect(store.getState().actes.map(a => a.id)).toEqual([a2]);
        expect(store.getState().scenes.map(s => s.id)).toEqual([gardee]);
    });

    it('rattacher une scène à un autre acte emmène sa campagne avec elle', () => {
        const acteA = store.getState().ajouterActe('c1', 'Acte de c1');
        const acteB = store.getState().ajouterActe('c2', 'Acte de c2');
        const sceneId = store.getState().ajouterScene(acteA, 'Migrante');

        store.getState().rattacherSceneAUnActe(sceneId, acteB);

        const scene = store.getState().scenes.find(s => s.id === sceneId)!;
        expect(scene.acteId).toBe(acteB);
        expect(scene.campaignId, 'sinon elle disparaît de tous les écrans').toBe('c2');
    });

    it('rattacher à un acte inexistant ne fait rien', () => {
        const acteId = store.getState().ajouterActe('c1', 'Acte I');
        const sceneId = store.getState().ajouterScene(acteId, 'S');

        store.getState().rattacherSceneAUnActe(sceneId, 'fantome');

        expect(store.getState().scenes.find(s => s.id === sceneId)!.acteId).toBe(acteId);
    });

    it('les rangs se suivent par campagne, pas globalement', () => {
        store.getState().ajouterActe('c1', 'A');
        store.getState().ajouterActe('c2', 'X');
        store.getState().ajouterActe('c1', 'B');

        expect(actesOrdonnes(store.getState().actes, 'c1').map(a => a.ordre)).toEqual([0, 1]);
        expect(actesOrdonnes(store.getState().actes, 'c2').map(a => a.ordre)).toEqual([0]);
    });

    it('déplacer un acte réordonne sa campagne', () => {
        const a = store.getState().ajouterActe('c1', 'A');
        const b = store.getState().ajouterActe('c1', 'B');

        store.getState().deplacerActe(b, 'haut');

        expect(actesOrdonnes(store.getState().actes, 'c1').map(a => a.id)).toEqual([b, a]);
    });

    it('déplacer une scène ne touche que son acte', () => {
        const a1 = store.getState().ajouterActe('c1', 'Acte I');
        const a2 = store.getState().ajouterActe('c1', 'Acte II');
        const s1 = store.getState().ajouterScene(a1, 'S1');
        const s2 = store.getState().ajouterScene(a1, 'S2');
        const voisine = store.getState().ajouterScene(a2, 'Voisine');

        store.getState().deplacerScene(s2, 'haut');

        expect(scenesOrdonnees(store.getState().scenes, a1).map(s => s.id)).toEqual([s2, s1]);
        expect(store.getState().scenes.find(s => s.id === voisine)!.ordre).toBe(0);
    });

    /**
     * **Ce qu'une séance annonce ne doit pas survivre à ce qu'elle annonce.**
     *
     * Une séance qui désigne un acte supprimé afficherait un vide sans dire
     * pourquoi, et une scène prévue disparue laisserait un identifiant mort dans
     * la liste. C'est la même classe de fuite que celle trouvée le 2026-08-15 à
     * la relecture : `deleteCampaign` nettoyait six collections et oubliait les
     * actes et les scènes.
     */
    describe('les séances oublient ce qui disparaît', () => {
        const avecSeances = () => {
            const s = nouveauStore();
            const acteId = s.getState().ajouterActe('c1', 'Acte I');
            const scene1 = s.getState().ajouterScene(acteId, 'S1');
            const scene2 = s.getState().ajouterScene(acteId, 'S2');
            (s as unknown as { setState: (p: object) => void }).setState({
                sessions: [{
                    id: 'sess-1', campaignId: 'c1', number: 1, date: '', status: 'planned',
                    publicSummary: '', gmSecrets: '', checklist: [], sessionEntityIds: [],
                    acteId, scenesPrevuesIds: [scene1, scene2],
                }],
            });
            return { s, acteId, scene1, scene2 };
        };

        const seance = (s: ReturnType<typeof nouveauStore>) =>
            (s.getState() as unknown as { sessions: { acteId?: string; scenesPrevuesIds?: string[] }[] }).sessions[0];

        it('supprimer une scène la retire des séances qui la prévoyaient', () => {
            const { s, acteId, scene1, scene2 } = avecSeances();
            s.getState().supprimerScene(scene1);

            expect(seance(s).scenesPrevuesIds).toEqual([scene2]);
            expect(seance(s).acteId, 'l\'acte tient toujours').toBe(acteId);
        });

        it('supprimer un acte retire l\'acte ET ses scènes des séances', () => {
            const { s, acteId } = avecSeances();
            s.getState().supprimerActe(acteId);

            expect(seance(s).acteId).toBeUndefined();
            expect(seance(s).scenesPrevuesIds).toEqual([]);
        });

        it('une séance qui ne prévoyait rien n\'est pas réécrite', () => {
            // Réécrire à l'identique ferait redessiner tous les écrans abonnés
            // aux séances à chaque suppression de scène.
            const { s, scene1 } = avecSeances();
            (s as unknown as { setState: (p: object) => void }).setState({
                sessions: [{ id: 'sess-2', campaignId: 'c1', scenesPrevuesIds: [] }],
            });
            const avant = seance(s);
            s.getState().supprimerScene(scene1);
            expect(seance(s)).toBe(avant);
        });
    });

    it('une scène naît préparée, sauf si on dit le contraire', () => {
        // L'origine n'est pas un choix qu'on demande au meneur : c'est le code
        // qui crée la scène qui le sait. Ici, l'écran de trame ; plus tard, un
        // combat lancé sans scène active.
        const acteId = store.getState().ajouterActe('c1', 'Acte I');
        const prevue = store.getState().ajouterScene(acteId, 'Prévue');
        const surprise = store.getState().ajouterScene(acteId, 'Surprise', 'improvisee');

        expect(store.getState().scenes.find(s => s.id === prevue)!.origine).toBe('preparee');
        expect(store.getState().scenes.find(s => s.id === surprise)!.origine).toBe('improvisee');
    });
});

/**
 * Ce que ces tests protègent : **les gestes du parcours réel**, arrivés le
 * 2026-08-17 avec le code qui les écrit.
 *
 * Le point le plus délicat est la cascade de l'acte : achever un acte termine
 * TOUTES ses scènes, y compris celles où le groupe n'est jamais passé. C'est la
 * règle voulue — l'acte est derrière, le reste ne se jouera plus — mais elle ne
 * doit se déclencher qu'au PASSAGE à `acheve`, sinon rééditer le titre d'un acte
 * clos re-terminerait des scènes qu'on aurait rouvertes depuis.
 */
describe('le parcours réel', () => {
    const nouveauStoreDeTrame = () => createStore<TrameSlice>()((...a) => createTrameSlice(...a));

    let s: ReturnType<typeof nouveauStoreDeTrame>;
    let acteId: string;

    beforeEach(() => {
        s = nouveauStoreDeTrame();
        acteId = s.getState().ajouterActe('c1', 'Acte I');
    });

    const etat = (id: string) => etatDeLaScene(s.getState().scenes.find(x => x.id === id)!);

    it('ouvrir puis terminer une scène', () => {
        const id = s.getState().ajouterScene(acteId, 'Le réveil');
        expect(etat(id)).toBe('prevue');

        s.getState().ouvrirLaScene(id, 'seance-1');
        expect(etat(id)).toBe('en-cours');

        s.getState().terminerLaScene(id);
        expect(etat(id)).toBe('terminee');
    });

    it('deux scènes en cours à la fois — le groupe s\'est séparé', () => {
        // C'est l'exigence qui a tué le pointeur unique : une campagne peut
        // avoir plusieurs scènes ouvertes, et le modèle doit le porter sans
        // champ supplémentaire.
        const a = s.getState().ajouterScene(acteId, 'La cave');
        const b = s.getState().ajouterScene(acteId, 'Le toit');
        s.getState().ouvrirLaScene(a);
        s.getState().ouvrirLaScene(b);

        expect([etat(a), etat(b)]).toEqual(['en-cours', 'en-cours']);
    });

    it('une scène improvisée naît ouverte', () => {
        // Deux gestes séparés auraient laissé exister « scène improvisée jamais
        // ouverte », qui ne veut rien dire : on l'improvise parce qu'on y est.
        const id = s.getState().creerSceneImprovisee(acteId, 'Une embuscade', 'seance-1');
        const scene = s.getState().scenes.find(x => x.id === id)!;

        expect(scene.origine).toBe('improvisee');
        expect(etatDeLaScene(scene)).toBe('en-cours');
        expect(scene.passages![0].seanceId).toBe('seance-1');
    });

    it('une scène improvisée sans acte n\'est pas créée', () => {
        // On suit la décision d'`ajouterScene` au lieu de la contredire.
        expect(s.getState().creerSceneImprovisee('acte-fantome', 'X')).toBe('');
        expect(s.getState().scenes).toHaveLength(0);
    });

    it('le clone se pose juste après son original, et décale la suite', () => {
        const a = s.getState().ajouterScene(acteId, 'Le réveil');
        s.getState().ajouterScene(acteId, 'La suite');
        s.getState().ouvrirLaScene(a);

        const cloneId = s.getState().clonerLaScene(a);
        const ordre = scenesOrdonnees(s.getState().scenes, acteId).map(x => x.titre);

        expect(ordre).toEqual(['Le réveil', 'Le réveil (2)', 'La suite']);
        expect(etat(cloneId)).toBe('prevue');
        // L'original garde son vécu : cloner n'est pas déplacer.
        expect(etat(a)).toBe('en-cours');
    });

    it('cloner une scène inconnue ne crée rien', () => {
        expect(s.getState().clonerLaScene('fantome')).toBe('');
        expect(s.getState().scenes).toHaveLength(0);
    });

    it('achever l\'acte termine toutes ses scènes, jouées ou non', () => {
        const jouee = s.getState().ajouterScene(acteId, 'Jouée');
        const jamais = s.getState().ajouterScene(acteId, 'Jamais');
        const autreActe = s.getState().ajouterActe('c1', 'Acte II');
        const ailleurs = s.getState().ajouterScene(autreActe, 'Ailleurs');
        s.getState().ouvrirLaScene(jouee);

        s.getState().modifierActe(acteId, { acheve: true });

        expect(etat(jouee)).toBe('terminee');
        expect(etat(jamais)).toBe('terminee');
        expect(etat(ailleurs), 'un autre acte n\'est pas touché').toBe('prevue');

        // Et les deux se distinguent : celle qu'on n'a jamais jouée n'a aucun
        // passage, donc l'écran la grisera au lieu de la barrer seulement.
        expect(closeSansAvoirEteJouee(s.getState().scenes.find(x => x.id === jamais)!)).toBe(true);
        expect(closeSansAvoirEteJouee(s.getState().scenes.find(x => x.id === jouee)!)).toBe(false);
    });

    it('rééditer un acte déjà achevé ne re-termine pas ce qu\'on a rouvert', () => {
        const id = s.getState().ajouterScene(acteId, 'Reprise');
        s.getState().modifierActe(acteId, { acheve: true });
        s.getState().ouvrirLaScene(id);
        expect(etat(id)).toBe('en-cours');

        s.getState().modifierActe(acteId, { titre: 'Acte I bis' });

        expect(etat(id), 'la cascade ne joue qu\'au passage à « achevé »').toBe('en-cours');
    });

    it('suspendre puis reprendre toute une campagne', () => {
        const ouverte = s.getState().ajouterScene(acteId, 'Ouverte');
        const prevue = s.getState().ajouterScene(acteId, 'Prévue');
        s.getState().ouvrirLaScene(ouverte, 'seance-1');

        s.getState().suspendreLesScenesDeLaCampagne('c1');
        expect([etat(ouverte), etat(prevue)]).toEqual(['en-pause', 'prevue']);

        s.getState().reprendreLesScenesDeLaCampagne('c1', 'seance-2');
        expect([etat(ouverte), etat(prevue)]).toEqual(['en-cours', 'prevue']);

        const passages = s.getState().scenes.find(x => x.id === ouverte)!.passages!;
        expect(passages).toHaveLength(2);
        expect(passages[0].seanceId).toBe('seance-1');
        expect(passages[1].seanceId).toBe('seance-2');
    });
});

describe('les homonymes de scènes', () => {
    /**
     * La Forge de campagne résout ses renvois PAR NOM, et un ex æquo ne résout
     * rien. Deux « Combat improvisé » dans la même campagne — deux soirs de
     * suite, c'est le cas le plus probable — casseraient en silence tout renvoi
     * qui les vise à la prochaine reforge.
     */
    const s = () => createStore<TrameSlice>()((...a) => createTrameSlice(...a));

    it('une seconde scène improvisée du même nom est numérotée', () => {
        const store = s();
        const acteId = store.getState().ajouterActe('c1', 'Acte I');

        store.getState().creerSceneImprovisee(acteId, 'Combat improvisé');
        store.getState().creerSceneImprovisee(acteId, 'Combat improvisé');
        store.getState().creerSceneImprovisee(acteId, 'Combat improvisé');

        expect(store.getState().scenes.map(x => x.titre))
            .toEqual(['Combat improvisé', 'Combat improvisé (2)', 'Combat improvisé (3)']);
    });

    it('un titre libre reste intact — on ne numérote pas pour le plaisir', () => {
        const store = s();
        const acteId = store.getState().ajouterActe('c1', 'Acte I');
        store.getState().creerSceneImprovisee(acteId, 'Une embuscade');
        expect(store.getState().scenes[0].titre).toBe('Une embuscade');
    });
});
