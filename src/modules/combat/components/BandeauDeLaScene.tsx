import React from 'react';
import { Layers, AlertTriangle } from 'lucide-react';
import { useCombatStore } from '../useCombatStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { scenesDansLEtat } from '../../session/logic/trame';

/**
 * À quelle scène ce combat appartient, et comment passer à l'autre.
 *
 * **Pourquoi ce bandeau existe.** Un combat non rattaché n'entre dans aucun
 * résumé de séance : le journal saura dire qu'il a eu lieu, jamais où ni dans
 * quel fil de l'histoire. Le rattachement est automatique quand il n'y a qu'une
 * scène ouverte — mais quand le groupe s'est séparé, **l'outil ne choisit pas à
 * la place du meneur** : un combat rangé dans la mauvaise scène fausserait le
 * résumé sans jamais se signaler.
 *
 * **Un bandeau, pas une fenêtre modale.** Une modale au moment où les figurines
 * arrivent sur la table bloque tout le monde pour une question d'archivage. Le
 * bandeau pose la même question, reste jusqu'à ce qu'on y réponde, et n'empêche
 * pas de jouer.
 *
 * **Et la bascule.** *Un meneur ne joue pas deux combats à la fois, il alterne.*
 * Changer de scène gare le plateau courant — combattants, tour, round, **et la
 * carte avec la position de chaque pion** — puis restaure celui de la scène
 * qu'on rejoint.
 */
const BandeauDeLaScene: React.FC = () => {
    const { sceneId, combatants, combatsGares, rattacherLeCombat, basculerVersLaScene } = useCombatStore();
    const { scenes, actes, activeCampaignId } = useSessionOSStore();

    const ouvertes = scenesDansLEtat(scenes, actes, activeCampaignId, 'en-cours');
    const scene = scenes.find(s => s.id === sceneId);

    // Rien à dire tant qu'aucun combat ne tourne et qu'aucune scène n'est
    // ouverte : un bandeau permanent sur un écran au repos devient un décor
    // qu'on cesse de lire.
    if (combatants.length === 0 && ouvertes.length === 0) return null;

    const aChoisir = !scene && ouvertes.length > 1 && combatants.length > 0;

    return (
        <div className={`px-4 py-2.5 border-b flex flex-wrap items-center gap-3 ${
            aChoisir
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-app-surface/40 border-app-border/20'
        }`}>
            {aChoisir ? (
                <>
                    <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                    <span className="text-[11px] font-bold text-amber-200">
                        Plusieurs scènes sont en cours — à laquelle ce combat appartient-il ?
                    </span>
                </>
            ) : (
                <>
                    <Layers size={14} className="text-accent shrink-0" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-app-text/40">
                        Scène
                    </span>
                    <span className="text-[12px] font-bold text-app-text">
                        {scene ? scene.titre : 'aucune — ce combat n’entrera dans aucun résumé'}
                    </span>
                </>
            )}

            <div className="flex flex-wrap items-center gap-1.5 ml-auto">
                {ouvertes.map(s => {
                    const active = s.id === sceneId;
                    const gare = !!combatsGares[s.id] && !active;
                    return (
                        <button
                            key={s.id}
                            onClick={() => (sceneId ? basculerVersLaScene(s.id) : rattacherLeCombat(s.id))}
                            title={active
                                ? 'Le combat en cours appartient à cette scène'
                                : gare
                                    ? 'Reprendre le combat garé de cette scène — plateau, tour et carte'
                                    : 'Basculer sur cette scène'}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                                active
                                    ? 'bg-accent/20 border-accent/50 text-app-text'
                                    : 'bg-app-bg/40 border-app-border/20 text-app-text/50 hover:text-app-text'
                            }`}
                        >
                            {s.titre}
                            {/* Le point dit qu'un plateau attend là, sans l'ouvrir :
                                repartir sur un combat garé n'est pas le même geste
                                que d'en commencer un. */}
                            {gare && <span className="ml-1.5 text-emerald-400" title="Combat garé">●</span>}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default BandeauDeLaScene;
