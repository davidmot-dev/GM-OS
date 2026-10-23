import React from 'react';
import { Plus, Minus, Users, Crown, Hourglass, Sunrise, RotateCcw, Coffee, Flame, Moon } from 'lucide-react';
import { gmToast } from '../../stores/useToastStore';
import { gmConfirm, gmCustom } from '../../stores/useModalStore';
import { useRessourcesDeTableStore } from './useRessourcesDeTableStore';
import { useSessionOSStore } from '../session/useSessionOSStore';
import {
    visiblePourUnJoueur, manipulableParUnJoueur, plafondDe,
    type RessourceDeTable, type ResultatDeMouvement,
} from './RessourcesDeTable';
import type { GestesDesHeros, MouvementDeFiche } from '../../types/drivers';
import { changementsEffectifs, herosDeLaCampagne, recuperationDesHeros } from './gestesDesHeros';
import { ecrireLesHeros } from './ecrireLesHeros';

/**
 * Les réserves de la table, sous la main du meneur.
 *
 * **Pourquoi une bande permanente et non un panneau à ouvrir.** L'Impulsion et
 * la Menace changent à presque chaque test. Une réserve qu'il faut aller
 * chercher n'est pas tenue à jour, et une réserve fausse est pire qu'une
 * réserve absente : elle se lit comme une information.
 *
 * **Elle n'apparaît que si le pilote déclare des ressources.** Même règle que le
 * panneau de jet : mieux vaut rien qu'un bandeau vide, qui donnerait à croire à
 * un oubli de configuration.
 */
interface PanneauDesRessourcesProps {
    campaignId: string;
    ressources: RessourceDeTable[];
    /**
     * Vue joueur — sur la tablette.
     *
     * **Le même composant, et c'est délibéré.** Une réserve doit se dessiner au
     * même endroit pour tout le monde : deux composants auraient fini par
     * afficher deux vérités, et c'est précisément le genre d'écart qu'on ne
     * détecte qu'en séance, quand le joueur annonce un chiffre que le meneur ne
     * voit pas.
     *
     * Ce que le mode change, et rien d'autre : on ne montre que ce que le
     * pilote déclare **visible aux joueurs**, on ne donne les boutons que sur ce
     * qu'il déclare **manipulable par eux**, la fin de scène reste au meneur —
     * lui seul sait qu'une scène s'achève —, et les mouvements repartent chez
     * lui au lieu d'être seulement appliqués.
     */
    pourLesJoueurs?: boolean;
    /**
     * Les gestes qui touchent chaque Héros (NOC, 2026-10-16) : le moment de
     * calme, les effets du débordement, et ce que la séance et le scénario
     * rendent aux fiches — le Vécu. Réservés au meneur.
     */
    gestes?: GestesDesHeros;
    /** Ce que la feuille du groupe regagne à « Nouveau scénario » — les pistes de la Cabale (NOC). */
    rechargeDuGroupe?: MouvementDeFiche[];
}

const CLASSE_DU_GESTE = 'flex items-center gap-1.5 px-3 py-1 rounded-lg border border-app-border/40 text-ui-9 font-black uppercase tracking-widest text-app-text/50 hover:border-accent/40 hover:text-accent transition-colors';

/** Ce qu'un mouvement a produit, dit à voix haute. */
function annoncer(resultat: ResultatDeMouvement) {
    for (const a of resultat.avertissements) {
        gmToast(a, resultat.perdu > 0 ? 'warning' : 'info');
    }
}

const PanneauDesRessources: React.FC<PanneauDesRessourcesProps> = ({
    campaignId, ressources, pourLesJoueurs = false, gestes, rechargeDuGroupe,
}) => {
    const { etatDe, gagner, depenser, finDeScene, debutDeSeance, nouveauScenario, ajusterDepuisLaTablette } = useRessourcesDeTableStore();
    const etat = etatDe(campaignId, ressources);
    const players = useSessionOSStore(s => s.players);
    const updateCharacter = useSessionOSStore(s => s.updateCharacter);
    const updateCharacterHealth = useSessionOSStore(s => s.updateCharacterHealth);
    const gestesDuMeneur = pourLesJoueurs ? undefined : gestes;
    const campagnes = useSessionOSStore(s => s.campaigns);
    const updateCampaign = useSessionOSStore(s => s.updateCampaign);
    const rechargeDuMeneur = pourLesJoueurs ? undefined : rechargeDuGroupe;

    // Les réserves de la Cabale se lisent dans le panneau de jet, là où l'on puise.
    const dansLeBandeau = ressources.filter(r => !r.horsDuBandeau);
    const montrees = pourLesJoueurs ? dansLeBandeau.filter(visiblePourUnJoueur) : dansLeBandeau;
    const erosionPossible = !pourLesJoueurs && ressources.some(r => r.erosionFinDeScene);
    // La fin de scène qui touche aussi les fiches s'ouvre sur un aperçu, Héros par Héros.
    const finDeSceneDesHeros = !!gestesDuMeneur?.finDeScene?.length;
    // La bonne nuit (Crimes) : l'épuisement se repose, avec le même aperçu.
    const bonneNuitDesHeros = !!gestesDuMeneur?.bonneNuit?.length;
    const seancePossible = !pourLesJoueurs && (ressources.some(r => r.erosionDebutDeSeance) || !!gestesDuMeneur?.debutDeSeance?.length);
    const scenarioPossible = !pourLesJoueurs && (ressources.some(r => r.remiseAuDepartParScenario)
        || !!gestesDuMeneur?.nouveauScenario?.length || !!rechargeDuMeneur?.length);
    const calmePossible = !!gestesDuMeneur?.momentDeCalme;
    const debordement = gestesDuMeneur?.effetsDuDebordement;
    const nomDe = (id: string) => ressources.find(r => r.id === id)?.label ?? id;

    /**
     * Ce que la séance ou le scénario rend à chaque Héros — le Vécu de NOC.
     * Écrit sur la fiche ; le nombre de fiches touchées est dit.
     */
    const rendreAuxHeros = (mouvements: MouvementDeFiche[] | undefined): number => {
        const changements = changementsEffectifs(recuperationDesHeros(mouvements, herosDeLaCampagne(players, campaignId)));
        return ecrireLesHeros(changements, { players, updateCharacter, updateCharacterHealth });
    };
    /**
     * Ce que la feuille du groupe regagne au nouveau scénario — l'Espoir, le Vécu et
     * la Singularité de la Cabale, chacun jusqu'au niveau de son Atout. Rend ce qui
     * a changé, dit pour le meneur.
     */
    const rendreAuGroupe = (): string[] => {
        const campagne = campagnes.find(c => c.id === campaignId);
        if (!rechargeDuMeneur?.length || !campagne?.groupe) return [];
        const fiche = campagne.groupe.sheetData ?? {};
        const [c] = recuperationDesHeros(rechargeDuMeneur, [{ joueurId: '', id: 'groupe', nom: '', valeurs: fiche }]);
        if (!c || Object.keys(c.maj).length === 0) return [];
        updateCampaign(campaignId, { groupe: { ...campagne.groupe, sheetData: { ...fiche, ...c.maj } } });
        return c.lignes;
    };
    const direLesHeros = (n: number, quoi: string) => {
        if (n > 0) gmToast(`${quoi} : ${n} fiche${n > 1 ? 's' : ''} de Héros mise${n > 1 ? 's' : ''} à jour.`, 'info');
    };
    const nomsDesMouvements = (mouvements: MouvementDeFiche[] | undefined) =>
        [...new Set((mouvements ?? []).map(m => m.label ?? m.champ))].join(', ');

    /** Les réserves qui reviennent à leur départ, nommées — la confirmation dit ce qu'elle efface. */
    const remisesAuDepart = dansLeBandeau.filter(r => r.remiseAuDepartParScenario);
    const reservesCachees = ressources.some(r => r.horsDuBandeau && r.remiseAuDepartParScenario);

    /**
     * Un point en plus ou en moins.
     *
     * Côté joueur le geste passe par `ajusterDepuisLaTablette`, qui applique
     * **et** prévient le meneur ; côté meneur il s'applique sur place. Les deux
     * chemins traversent les mêmes fonctions pures — *la règle ne change pas
     * selon qui l'applique* —, donc le report en Menace et le plafond valent
     * pour tout le monde.
     */
    const bouger = (r: RessourceDeTable, delta: number) => {
        if (pourLesJoueurs) {
            ajusterDepuisLaTablette(campaignId, ressources, r.id, delta);
            return;
        }
        annoncer(delta < 0
            ? depenser(campaignId, ressources, r.id, -delta)
            : gagner(campaignId, ressources, r.id, delta));
    };

    const gestesPossibles = erosionPossible || finDeSceneDesHeros || bonneNuitDesHeros || seancePossible || scenarioPossible
        || calmePossible || !!debordement;
    // Un pilote sans réserve visible ni geste ne laisse pas une bande vide derrière
    // lui, qui donnerait à croire à un oubli de configuration.
    if (montrees.length === 0 && !gestesPossibles) return null;

    return (
        <div data-bandeau-des-reserves className={`flex items-center border-b border-app-border/20 bg-app-bg/40 ${pourLesJoueurs ? 'flex-wrap gap-3 p-3' : 'gap-6 px-6 py-2'}`}>
            {montrees.map(r => {
                const valeur = etat[r.id] ?? r.depart;
                // Le plafond peut être la valeur d'une autre réserve : le Seuil RK de Nephilim.
                const max = plafondDe(ressources, etat, r);
                const auPlafond = max !== undefined && valeur >= max;
                const manipulable = !pourLesJoueurs || manipulableParUnJoueur(r);

                return (
                    <div key={r.id} className={`flex items-center gap-2 ${pourLesJoueurs ? 'min-w-0 flex-wrap' : ''}`} title={r.description}>
                        {r.proprietaire === 'joueurs'
                            ? <Users size={12} className="text-app-text/30" />
                            : <Crown size={12} className="text-app-text/30" />}

                        <span className={pourLesJoueurs ? 'text-[14px] font-bold text-app-text' : 'text-ui-9 font-black uppercase tracking-widest text-app-text/40'}>
                            {r.label}
                        </span>

                        {/*
                            Une réserve qu'on regarde sans y toucher n'affiche
                            pas de boutons morts : chez Dune, la Menace est
                            publique et appartient au meneur. Un bouton grisé
                            invite à cliquer et fait croire à une panne.
                        */}
                        {manipulable && (
                        <button
                            onClick={() => bouger(r, -1)}
                            className={`p-1 rounded-md bg-app-bg/60 border border-app-border/40 hover:border-accent/40 transition-colors ${pourLesJoueurs ? 'min-h-[44px] min-w-[44px] flex items-center justify-center' : ''}`}
                            aria-label={`Retirer un point de ${r.label}`}
                        ><Minus size={11} /></button>
                        )}

                        {/*
                            Une réserve bornée se lit d'un coup d'œil en segments ;
                            une réserve sans plafond ne le peut pas — la Menace n'a
                            pas de maximum, et six carrés lui en inventeraient un.
                        */}
                        {r.libelles?.length ? (
                            // Une réserve qui se lit par son nom : le lieu magique de Nephilim.
                            <span data-libelle-de-reserve className="font-bold text-sm text-app-text/80 min-w-[7rem] text-center">
                                {r.libelles[valeur - r.min] ?? valeur}
                            </span>
                        ) : max !== undefined ? (
                            <div className={`flex items-center gap-1 ${pourLesJoueurs ? 'flex-wrap' : ''}`}>
                                {Array.from({ length: Math.max(0, max) }, (_, i) => (
                                    <span
                                        key={i}
                                        className={`w-2.5 h-4 rounded-sm border ${
                                            i < valeur
                                                ? 'bg-accent border-accent'
                                                : 'bg-app-text/5 border-app-border/30'
                                        }`}
                                    />
                                ))}
                                <span className={`ml-1 font-mono text-sm font-black ${auPlafond ? 'text-etat-alerte' : 'text-app-text/70'}`}>
                                    {valeur}
                                </span>
                            </div>
                        ) : (
                            <span className="font-mono text-sm font-black text-app-text/70 w-8 text-center">
                                {valeur}
                            </span>
                        )}

                        {manipulable && (
                        <button
                            onClick={() => bouger(r, 1)}
                            className={`p-1 rounded-md bg-app-bg/60 border border-app-border/40 hover:border-accent/40 transition-colors ${pourLesJoueurs ? 'min-h-[44px] min-w-[44px] flex items-center justify-center' : ''}`}
                            aria-label={`Ajouter un point de ${r.label}`}
                        ><Plus size={11} /></button>
                        )}
                    </div>
                );
            })}

            {/*
                Rien dans l'application ne sait quand une scène se termine : c'est
                le meneur qui le décide. On lui donne le bouton plutôt que de
                deviner à partir d'un combat ou d'un changement de carte.
            */}
            {gestesPossibles && (
                <div className="ml-auto flex items-center gap-2">
                    {/*
                        Le moment de calme et les effets du débordement écrivent sur
                        chaque fiche : ils ouvrent un aperçu, Héros par Héros, avant
                        d'appliquer.
                    */}
                    {calmePossible && (
                        <button
                            onClick={() => gmCustom('gestes-des-heros', { geste: 'calme' })}
                            className={CLASSE_DU_GESTE}
                            title="La table respire : ce que chaque Héros récupère, à relire avant d'appliquer"
                        >
                            <Coffee size={11} /> Moment de calme
                        </button>
                    )}
                    {debordement && (
                        <button
                            onClick={() => gmCustom('gestes-des-heros', { geste: 'debordement' })}
                            className={CLASSE_DU_GESTE}
                            title={`Choisir autant d'effets que vaut ${nomDe(debordement.nombreSelon)}, puis les appliquer à chaque Héros`}
                        >
                            <Flame size={11} /> Effets du {nomDe(debordement.ressource)}
                        </button>
                    )}
                    {finDeSceneDesHeros && (
                        <button
                            onClick={() => gmCustom('gestes-des-heros', { geste: 'finDeScene' })}
                            className={CLASSE_DU_GESTE}
                            title={`Ce que la fin de scène change sur chaque fiche (${nomsDesMouvements(gestesDuMeneur?.finDeScene)}), à relire avant d'appliquer`}
                        >
                            <Hourglass size={11} /> Fin de scène
                        </button>
                    )}
                    {bonneNuitDesHeros && (
                        <button
                            onClick={() => gmCustom('gestes-des-heros', { geste: 'bonneNuit' })}
                            className={CLASSE_DU_GESTE}
                            title={`Ce qu'une bonne nuit change sur chaque fiche (${nomsDesMouvements(gestesDuMeneur?.bonneNuit)}), à relire avant d'appliquer`}
                        >
                            <Moon size={11} /> Bonne nuit
                        </button>
                    )}
                    {erosionPossible && !finDeSceneDesHeros && (
                        <button
                            onClick={() => {
                                const r = finDeScene(campaignId, ressources);
                                annoncer(r);
                                if (r.mouvements.length === 0) gmToast('Rien à éroder : les réserves sont au plancher.', 'info');
                            }}
                            className={CLASSE_DU_GESTE}
                            title="Applique l'érosion de fin de scène déclarée par le système"
                        >
                            <Hourglass size={11} /> Fin de scène
                        </button>
                    )}
                    {/*
                        La séance, c'est la soirée de jeu — pas le temps du
                        récit. Comme la fin de scène, rien ne la détecte : le
                        meneur l'ouvre.
                    */}
                    {seancePossible && (
                        <button
                            onClick={() => {
                                const r = debutDeSeance(campaignId, ressources);
                                annoncer(r);
                                const heros = rendreAuxHeros(gestesDuMeneur?.debutDeSeance);
                                direLesHeros(heros, `Début de séance (${nomsDesMouvements(gestesDuMeneur?.debutDeSeance)})`);
                                if (r.mouvements.length === 0 && heros === 0) gmToast('Rien à éroder : les réserves sont au plancher.', 'info');
                            }}
                            className={CLASSE_DU_GESTE}
                            title="Applique l'érosion de début de séance déclarée par le système"
                        >
                            <Sunrise size={11} /> Début de séance
                        </button>
                    )}
                    {/*
                        Le seul geste qui efface d'un coup une valeur sans
                        plafond — une Menace à sept ne se remonte pas au clic.
                        D'où la confirmation, qui nomme ce qu'elle remet.
                    */}
                    {scenarioPossible && (
                        <button
                            onClick={() => gmConfirm(
                                `Nouveau scénario : ${[
                                    ...remisesAuDepart.map(r => `${r.label} revient à ${r.depart}`),
                                    ...(reservesCachees ? ['les réserves du groupe se rechargent'] : []),
                                    ...(gestesDuMeneur?.nouveauScenario?.length
                                        ? [`chaque Héros récupère : ${nomsDesMouvements(gestesDuMeneur.nouveauScenario)}`] : []),
                                    ...(rechargeDuMeneur?.length
                                        ? [`le groupe se recharge : ${nomsDesMouvements(rechargeDuMeneur)}`] : []),
                                ].join(', ')}.`,
                                () => {
                                    const r = nouveauScenario(campaignId, ressources);
                                    annoncer(r);
                                    const heros = rendreAuxHeros(gestesDuMeneur?.nouveauScenario);
                                    direLesHeros(heros, 'Nouveau scénario');
                                    const groupe = rendreAuGroupe();
                                    if (groupe.length) gmToast(`Le groupe se recharge : ${groupe.join(' ; ')}.`, 'info');
                                    if (r.mouvements.length === 0 && heros === 0 && groupe.length === 0) gmToast('Les réserves sont déjà à leur départ.', 'info');
                                },
                                undefined,
                                'Remettre',
                                'Annuler',
                            )}
                            className={CLASSE_DU_GESTE}
                            title="Remet à leur départ les réserves que le système remet à chaque scénario"
                        >
                            <RotateCcw size={11} /> Nouveau scénario
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default PanneauDesRessources;
