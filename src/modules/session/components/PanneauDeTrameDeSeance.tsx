import React from 'react';
import { ExternalLink, AlertTriangle } from 'lucide-react';
import { useSessionOSStore } from '../useSessionOSStore';
import { actesOrdonnes, scenesOrdonnees, repartirLesScenesPrevues } from '../logic/trame';
import PastilleDePreparation from './trame/PastilleDePreparation';
import type { GameSession } from '../../../types/session.types';
import type { Scene } from '../../../types/trame.types';

/**
 * Ce qu'on pense jouer pendant cette séance — l'acte, et ses scènes.
 *
 * **La face PRÉVUE de la trame, et elle seule.** Le parcours réel — ce qui a
 * effectivement été traversé — relève de la capture en partie et n'existe pas
 * encore. Les deux ne se confondront pas : *« la divergence entre les deux est
 * elle-même intéressante ; c'est là que la partie s'est écartée du plan, donc
 * là où il s'est passé quelque chose. »*
 *
 * **Rien n'est imposé.** Une séance peut n'annoncer aucun acte, en annoncer un
 * et n'en jouer aucune scène, ou prévoir des scènes venues d'ailleurs — ce
 * dernier cas est montré à part plutôt qu'écarté. *Ne pas imposer la
 * linéarité* : une partie ne suit jamais le plan, et l'outil n'a pas à faire
 * semblant du contraire.
 */
const PanneauDeTrameDeSeance: React.FC<{ session: GameSession }> = ({ session }) => {
    const { actes, scenes, activeCampaignId, updateSession, setCurrentView } = useSessionOSStore();

    const mesActes = actesOrdonnes(actes, activeCampaignId);
    const prevues = session.scenesPrevuesIds ?? [];
    const { horsActe, introuvables } = repartirLesScenesPrevues(scenes, session.acteId, prevues);
    const proposees = scenesOrdonnees(scenes, session.acteId);

    const bascule = (id: string) =>
        updateSession(session.id, {
            scenesPrevuesIds: prevues.includes(id) ? prevues.filter(x => x !== id) : [...prevues, id],
        });

    return (
        <div className="glass-bento rounded-[2.5rem] border border-white/5 p-8 shadow-xl flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <p className="text-[10px] text-app-text/40 font-black uppercase tracking-widest">
                    L'acte dans lequel cette séance se déroule, et les scènes qu'on pense jouer
                </p>
                <button
                    onClick={() => setCurrentView('trame')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-app-text/50 hover:text-app-text transition-all"
                >
                    <ExternalLink size={11} /> Ouvrir la trame
                </button>
            </div>

            {mesActes.length === 0 ? (
                <p className="text-sm text-app-text/30 italic leading-relaxed">
                    Cette campagne n'a pas encore de trame. Un acte porte un enjeu ; ses scènes portent
                    ce qui s'y joue.
                </p>
            ) : (
                <>
                    <select
                        value={session.acteId ?? ''}
                        onChange={e => updateSession(session.id, { acteId: e.target.value || undefined })}
                        className="w-full bg-app-bg/40 px-4 py-3 rounded-xl border border-app-border/20 text-sm text-app-text focus:border-accent/50 outline-none cursor-pointer"
                    >
                        <option value="">— aucun acte annoncé —</option>
                        {mesActes.map((a, i) => (
                            <option key={a.id} value={a.id}>
                                {String(i + 1).padStart(2, '0')} — {a.titre}{a.acheve ? ' (achevé)' : ''}
                            </option>
                        ))}
                    </select>

                    {session.acteId && (
                        proposees.length === 0 ? (
                            <p className="text-[11px] text-app-text/30 italic px-1">
                                Cet acte n'a encore aucune scène.
                            </p>
                        ) : (
                            <div className="flex flex-col gap-1.5">
                                {proposees.map(scene => (
                                    <CaseDeScene
                                        key={scene.id}
                                        scene={scene}
                                        choisie={prevues.includes(scene.id)}
                                        onBascule={() => bascule(scene.id)}
                                    />
                                ))}
                            </div>
                        )
                    )}

                    {/*
                        Changer d'acte n'efface rien : ce qui sort du cadre est
                        montré à part. Une séance déborde sur l'acte suivant, un
                        groupe prend de l'avance — et l'écarter en silence ferait
                        disparaître une préparation réelle.
                    */}
                    {horsActe.length > 0 && (
                        <div className="flex flex-col gap-1.5 pt-2 border-t border-white/5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-400/60 px-1">
                                Prévues hors de cet acte
                            </p>
                            {horsActe.map(scene => (
                                <CaseDeScene
                                    key={scene.id}
                                    scene={scene}
                                    choisie
                                    onBascule={() => bascule(scene.id)}
                                />
                            ))}
                        </div>
                    )}

                    {introuvables > 0 && (
                        <p className="flex items-center gap-2 text-[11px] text-amber-300/70 px-1">
                            <AlertTriangle size={12} className="shrink-0" />
                            {introuvables} scène{introuvables > 1 ? 's' : ''} prévue{introuvables > 1 ? 's' : ''} n'existe
                            {introuvables > 1 ? 'nt' : ''} plus dans la trame.
                        </p>
                    )}
                </>
            )}
        </div>
    );
};

const CaseDeScene: React.FC<{ scene: Scene; choisie: boolean; onBascule: () => void }> = ({ scene, choisie, onBascule }) => {
    return (
        <button
            onClick={onBascule}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-left transition-all ${
                choisie
                    ? 'bg-accent/15 border-accent/40 text-app-text'
                    : 'bg-app-bg/30 border-app-border/20 text-app-text/50 hover:text-app-text/80'
            }`}
        >
            <PastilleDePreparation scene={scene} />
            <span className="flex-1 min-w-0 text-sm truncate">{scene.titre}</span>
            {scene.origine === 'improvisee' && (
                <span className="text-[8px] font-black uppercase tracking-widest text-amber-400/70 shrink-0">improvisée</span>
            )}
        </button>
    );
};

export default PanneauDeTrameDeSeance;
