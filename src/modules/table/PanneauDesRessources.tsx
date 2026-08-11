import React from 'react';
import { Plus, Minus, Users, Crown, Hourglass } from 'lucide-react';
import { gmToast } from '../../stores/useToastStore';
import { useRessourcesDeTableStore } from './useRessourcesDeTableStore';
import type { RessourceDeTable, ResultatDeMouvement } from './RessourcesDeTable';

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
}

/** Ce qu'un mouvement a produit, dit à voix haute. */
function annoncer(resultat: ResultatDeMouvement) {
    for (const a of resultat.avertissements) {
        gmToast(a, resultat.perdu > 0 ? 'warning' : 'info');
    }
}

const PanneauDesRessources: React.FC<PanneauDesRessourcesProps> = ({ campaignId, ressources }) => {
    const { etatDe, gagner, depenser, finDeScene } = useRessourcesDeTableStore();
    const etat = etatDe(campaignId, ressources);

    const erosionPossible = ressources.some(r => r.erosionFinDeScene);

    return (
        <div className="flex items-center gap-6 px-6 py-2 border-b border-app-border/20 bg-app-bg/40">
            {ressources.map(r => {
                const valeur = etat[r.id] ?? r.depart;
                const auPlafond = r.max !== undefined && valeur >= r.max;

                return (
                    <div key={r.id} className="flex items-center gap-2" title={r.description}>
                        {r.proprietaire === 'joueurs'
                            ? <Users size={12} className="text-app-text/30" />
                            : <Crown size={12} className="text-app-text/30" />}

                        <span className="text-[9px] font-black uppercase tracking-widest text-app-text/40">
                            {r.label}
                        </span>

                        <button
                            onClick={() => annoncer(depenser(campaignId, ressources, r.id, 1))}
                            className="p-1 rounded-md bg-app-bg/60 border border-app-border/40 hover:border-accent/40 transition-colors"
                            aria-label={`Retirer un point de ${r.label}`}
                        ><Minus size={11} /></button>

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

                        <button
                            onClick={() => annoncer(gagner(campaignId, ressources, r.id, 1))}
                            className="p-1 rounded-md bg-app-bg/60 border border-app-border/40 hover:border-accent/40 transition-colors"
                            aria-label={`Ajouter un point de ${r.label}`}
                        ><Plus size={11} /></button>
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
