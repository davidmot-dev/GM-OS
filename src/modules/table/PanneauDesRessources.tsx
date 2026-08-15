import React from 'react';
import { Plus, Minus, Users, Crown, Hourglass } from 'lucide-react';
import { gmToast } from '../../stores/useToastStore';
import { useRessourcesDeTableStore } from './useRessourcesDeTableStore';
import {
    visiblePourUnJoueur, manipulableParUnJoueur,
    type RessourceDeTable, type ResultatDeMouvement,
} from './RessourcesDeTable';

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
}

/** Ce qu'un mouvement a produit, dit à voix haute. */
function annoncer(resultat: ResultatDeMouvement) {
    for (const a of resultat.avertissements) {
        gmToast(a, resultat.perdu > 0 ? 'warning' : 'info');
    }
}

const PanneauDesRessources: React.FC<PanneauDesRessourcesProps> = ({
    campaignId, ressources, pourLesJoueurs = false,
}) => {
    const { etatDe, gagner, depenser, finDeScene, ajusterDepuisLaTablette } = useRessourcesDeTableStore();
    const etat = etatDe(campaignId, ressources);

    const montrees = pourLesJoueurs ? ressources.filter(visiblePourUnJoueur) : ressources;
    const erosionPossible = !pourLesJoueurs && ressources.some(r => r.erosionFinDeScene);

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

    // Un pilote sans réserve visible ne laisse pas une bande vide derrière lui,
    // qui donnerait à croire à un oubli de configuration.
    if (montrees.length === 0) return null;

    return (
        <div className="flex items-center gap-6 px-6 py-2 border-b border-app-border/20 bg-app-bg/40">
            {montrees.map(r => {
                const valeur = etat[r.id] ?? r.depart;
                const auPlafond = r.max !== undefined && valeur >= r.max;
                const manipulable = !pourLesJoueurs || manipulableParUnJoueur(r);

                return (
                    <div key={r.id} className="flex items-center gap-2" title={r.description}>
                        {r.proprietaire === 'joueurs'
                            ? <Users size={12} className="text-app-text/30" />
                            : <Crown size={12} className="text-app-text/30" />}

                        <span className="text-[9px] font-black uppercase tracking-widest text-app-text/40">
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
                            className="p-1 rounded-md bg-app-bg/60 border border-app-border/40 hover:border-accent/40 transition-colors"
                            aria-label={`Retirer un point de ${r.label}`}
                        ><Minus size={11} /></button>
                        )}

                        {/*
                            Une réserve bornée se lit d'un coup d'œil en segments ;
                            une réserve sans plafond ne le peut pas — la Menace n'a
                            pas de maximum, et six carrés lui en inventeraient un.
                        */}
                        {r.max !== undefined ? (
                            <div className="flex items-center gap-1">
                                {Array.from({ length: r.max }, (_, i) => (
                                    <span
                                        key={i}
                                        className={`w-2.5 h-4 rounded-sm border ${
                                            i < valeur
                                                ? 'bg-accent border-accent'
                                                : 'bg-app-text/5 border-app-border/30'
                                        }`}
                                    />
                                ))}
                                <span className={`ml-1 font-mono text-sm font-black ${auPlafond ? 'text-amber-300' : 'text-app-text/70'}`}>
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
                            className="p-1 rounded-md bg-app-bg/60 border border-app-border/40 hover:border-accent/40 transition-colors"
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
            {erosionPossible && (
                <button
                    onClick={() => {
                        const r = finDeScene(campaignId, ressources);
                        annoncer(r);
                        if (r.mouvements.length === 0) gmToast('Rien à éroder : les réserves sont au plancher.', 'info');
                    }}
                    className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-lg border border-app-border/40 text-[9px] font-black uppercase tracking-widest text-app-text/50 hover:border-accent/40 hover:text-accent transition-colors"
                    title="Applique l'érosion de fin de scène déclarée par le système"
                >
                    <Hourglass size={11} /> Fin de scène
                </button>
            )}
        </div>
    );
};

export default PanneauDesRessources;
