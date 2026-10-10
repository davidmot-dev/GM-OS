import React, { useState } from 'react';
import { ExternalLink, AlertTriangle, ChevronDown, ChevronRight, Square, SquareCheck } from 'lucide-react';
import { useSessionOSStore } from '../useSessionOSStore';
import {
    actesOrdonnes, scenesOrdonnees, repartirLesScenesPrevues,
    etatDeLaScene, closeSansAvoirEteJouee,
} from '../logic/trame';
import PastilleDePreparation from './trame/PastilleDePreparation';
import MarqueDIntrigue from './trame/MarqueDIntrigue';
import {
    importanceDeLaScene, styleDuTitre, infobulle, infobulleDeLImportance,
} from '../logic/importanceDeLaScene';
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
    const { introuvables } = repartirLesScenesPrevues(scenes, session.acteId, prevues);
    /* Une scène prévue dont l'acte n'est plus dans cette campagne n'a aucun
       groupe où s'afficher : elle est montrée à part, plutôt qu'effacée. */
    const idsDesActes = new Set(mesActes.map(a => a.id));
    const sansActe = prevues
        .map(id => scenes.find(s => s.id === id))
        .filter((s): s is Scene => !!s && !idsDesActes.has(s.acteId));

    /*
      **Toutes les scènes de la campagne, groupées par acte** (2026-10-10).
      David, devant le panneau : *« je ne vois pas comment rajouter un acte ou
      une scène à ma préparation de séance »*, puis *« mais si je veux rajouter
      2 actes ? »*, et le choix : *« je veux afficher toutes les scènes »*.
      Avant, seules les scènes de l'acte annoncé s'affichaient : prévoir une
      scène d'un autre acte demandait de changer d'acte dans le menu, et rien
      ne disait que la ligne se cliquait. Le menu ne dit plus que l'acte
      principal ; les scènes se cochent dans n'importe quel acte.

      Ouverts d'emblée : l'acte principal et ceux qui ont une scène prévue —
      sinon tous, pour qu'une séance vierge ne montre pas une liste vide.
    */
    const ouvertsParDefaut = (): Set<string> => {
        const ouverts = new Set(mesActes
            .filter(a => a.id === session.acteId
                || scenes.some(s => s.acteId === a.id && prevues.includes(s.id)))
            .map(a => a.id));
        return ouverts.size > 0 ? ouverts : new Set(mesActes.map(a => a.id));
    };
    const [ouverts, setOuverts] = useState<Set<string>>(ouvertsParDefaut);
    const basculerActe = (id: string) => setOuverts(prec => {
        const suite = new Set(prec);
        if (suite.has(id)) suite.delete(id); else suite.add(id);
        return suite;
    });

    const bascule = (id: string) =>
        updateSession(session.id, {
            scenesPrevuesIds: prevues.includes(id) ? prevues.filter(x => x !== id) : [...prevues, id],
        });

    const nombrePrevues = prevues.length - introuvables;

    return (
        <div className="glass-bento rounded-[2.5rem] border border-app-text/5 p-8 shadow-xl flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <p className="text-ui-10 text-app-text/40 font-black uppercase tracking-widest">
                    L'acte dans lequel cette séance se déroule, et les scènes qu'on pense jouer
                </p>
                <button
                    onClick={() => setCurrentView('trame')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-app-text/5 border border-app-text/10 text-ui-10 font-black uppercase tracking-widest text-app-text/50 hover:text-app-text transition-all"
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
                    <label className="flex flex-col gap-2">
                        <span className="text-ui-10 font-black uppercase tracking-widest text-app-text/40 px-1">
                            Acte principal
                        </span>
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
                    </label>

                    <div className="flex items-baseline justify-between gap-3 px-1">
                        <p className="text-ui-11 text-app-text/50">
                            Cochez les scènes que vous pensez jouer, dans n'importe quel acte.
                        </p>
                        <span className="text-ui-10 font-black uppercase tracking-widest text-accent shrink-0">
                            {nombrePrevues} prévue{nombrePrevues > 1 ? 's' : ''}
                        </span>
                    </div>

                    <div className="flex flex-col gap-3">
                        {mesActes.map((acte, i) => {
                            const sesScenes = scenesOrdonnees(scenes, acte.id);
                            const cochees = sesScenes.filter(s => prevues.includes(s.id)).length;
                            const ouvert = ouverts.has(acte.id);
                            return (
                                <section key={acte.id} className="flex flex-col gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => basculerActe(acte.id)}
                                        aria-expanded={ouvert}
                                        className="flex items-center gap-2 px-1 py-1 text-left text-app-text/60 hover:text-app-text transition-colors"
                                    >
                                        {ouvert ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />}
                                        <span className="text-ui-10 font-black tracking-widest text-app-text/30 shrink-0">
                                            {String(i + 1).padStart(2, '0')}
                                        </span>
                                        <span className="flex-1 min-w-0 truncate text-sm font-bold">
                                            {acte.titre}{acte.acheve ? ' (achevé)' : ''}
                                        </span>
                                        {acte.id === session.acteId && (
                                            <span className="text-ui-8 font-black uppercase tracking-widest text-accent/70 shrink-0">principal</span>
                                        )}
                                        <span className="text-ui-10 text-app-text/30 shrink-0">
                                            {cochees > 0 ? `${cochees}/${sesScenes.length}` : sesScenes.length} scène{sesScenes.length > 1 ? 's' : ''}
                                        </span>
                                    </button>
                                    {ouvert && (sesScenes.length === 0 ? (
                                        <p className="text-ui-11 text-app-text/30 italic pl-8">
                                            Cet acte n'a encore aucune scène.
                                        </p>
                                    ) : sesScenes.map(scene => (
                                        <CaseDeScene
                                            key={scene.id}
                                            scene={scene}
                                            choisie={prevues.includes(scene.id)}
                                            onBascule={() => bascule(scene.id)}
                                        />
                                    )))}
                                </section>
                            );
                        })}
                    </div>

                    {/*
                        Une scène prévue dont l'acte a disparu de la campagne
                        reste visible : l'écarter en silence ferait disparaître
                        une préparation réelle.
                    */}
                    {sansActe.length > 0 && (
                        <div className="flex flex-col gap-1.5 pt-2 border-t border-app-text/5">
                            <p className="text-ui-10 font-black uppercase tracking-widest text-etat-alerte/60 px-1">
                                Prévues, sans acte dans cette campagne
                            </p>
                            {sansActe.map(scene => (
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
                        <p className="flex items-center gap-2 text-ui-11 text-etat-alerte/70 px-1">
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

/**
 * Une scène qu'on peut prévoir pour cette séance.
 *
 * **L'état de jeu s'y lit, et il a fallu qu'il manque pour qu'on le voie.**
 * Cette case n'affichait que la préparation : une scène déjà terminée y était
 * proposée exactement comme une scène jamais touchée. *On pouvait donc préparer
 * une séance autour d'une scène déjà finie, et rien ne le disait.* Signalé par
 * David le 2026-08-20, en même temps que le bouton de la trame qui ne savait
 * pas terminer.
 *
 * Les mêmes règles qu'ailleurs, parce qu'un état ne doit pas se lire de deux
 * façons selon l'écran : barrée quand elle est terminée, **grisée en plus** si
 * elle l'a été sans jamais avoir été jouée.
 */
const CaseDeScene: React.FC<{ scene: Scene; choisie: boolean; onBascule: () => void }> = ({ scene, choisie, onBascule }) => {
    const etat = etatDeLaScene(scene);
    const jamaisJouee = closeSansAvoirEteJouee(scene);
    /* **C'est ici que le rang sert le plus** : choisir ce qu'on joue ce soir, et
       savoir d'avance ce qu'on coupera si l'heure tourne. */
    const importance = importanceDeLaScene(scene);
    return (
        <button
            type="button"
            role="checkbox"
            aria-checked={choisie}
            onClick={onBascule}
            title={infobulle(
                jamaisJouee && 'Close sans avoir été jouée',
                infobulleDeLImportance(importance),
            )}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-left transition-all ${
                choisie
                    ? 'bg-accent/15 border-accent/40 text-app-text'
                    : 'bg-app-bg/30 border-app-border/20 text-app-text/50 hover:text-app-text/80'
            }`}
        >
            {/* La case dit qu'on coche : sans elle, rien ne montrait que la
                ligne se cliquait (David, 2026-10-10). */}
            {choisie
                ? <SquareCheck size={16} className="shrink-0 text-accent" aria-hidden />
                : <Square size={16} className="shrink-0 text-app-text/30" aria-hidden />}
            <MarqueDIntrigue scene={scene} />
            <PastilleDePreparation scene={scene} />
            <span className={`flex-1 min-w-0 text-sm truncate ${styleDuTitre(importance)} ${
                etat === 'terminee'
                    ? `line-through ${jamaisJouee ? 'text-app-text/20' : 'text-app-text/40'}`
                    : ''
            }`}>{scene.titre}</span>
            {etat === 'en-cours' && (
                <span className="text-ui-8 font-black uppercase tracking-widest text-etat-succes shrink-0">en cours</span>
            )}
            {etat === 'en-pause' && (
                <span className="text-ui-8 font-black uppercase tracking-widest text-app-text/30 shrink-0">pause</span>
            )}
            {scene.origine === 'improvisee' && (
                <span className="text-ui-8 font-black uppercase tracking-widest text-etat-alerte/70 shrink-0">improvisée</span>
            )}
        </button>
    );
};

export default PanneauDeTrameDeSeance;
