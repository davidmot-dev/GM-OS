import React from 'react';
import { Layers, EyeOff, Eye, Inbox, ChevronDown, ChevronRight, Feather, Cog } from 'lucide-react';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { useJournalStore } from './useJournalStore';
import {
    preparerLaRevue, ceQuiResteAReviser, natureDe, sceneEcartee,
    type EvenementCure, type SceneAReviser,
} from './curation';
import type { Journal } from './types';

/**
 * **La revue de fin de séance, scène par scène** — étape 6 du § 8, l'étape 1
 * des deux du § 4.1.
 *
 * *« Une dizaine de scènes se revoit en quelques minutes là où deux cents
 * événements ne se revoient jamais. »* Tout l'écran découle de cette phrase :
 * l'unité de travail est la scène, jamais l'événement. On ouvre une scène, on
 * corrige son titre et son résumé, on la garde ou on la met de côté — et on ne
 * descend au niveau de l'événement que pour l'ambigu.
 *
 * **Il n'écrit rien qui lui appartienne.** Le titre et le résumé vivent sur la
 * scène, la nature et le rattachement sur l'événement : des objets déjà
 * persistés, déjà lus ailleurs. Un artefact de curation séparé aurait été un
 * troisième endroit où la même vérité se serait mise à diverger — c'est ce
 * qu'on vient de payer trois fois, sur les listes de session, sur les portes
 * d'une scène et sur le module de santé.
 *
 * **Les traces sont repliées, pas cachées.** Elles ne partent pas au résumé,
 * mais c'est en les lisant qu'on se rappelle ce qui s'est passé dans une scène
 * dont le récit est mince. *On ne supprime pas, on distingue.*
 */
const RevueDeSeance: React.FC<{ journal: Journal }> = ({ journal }) => {
    const { scenes, actes, activeCampaignId, modifierScene } = useSessionOSStore();
    const updateEvent = useJournalStore(s => s.updateEvent);

    /*
      La campagne du journal d'abord, celle qui est active ensuite. Un journal
      relu des semaines plus tard ne doit pas se faire ranger dans la trame de
      la campagne qu'on a ouverte entre-temps — c'est la fragilité déjà corrigée
      deux fois sur le résumé et le carnet.
    */
    const campagne = journal.campaignId ?? activeCampaignId;
    const revue = React.useMemo(
        () => preparerLaRevue(journal.events, scenes, actes, campagne),
        [journal.events, scenes, actes, campagne],
    );
    const reste = ceQuiResteAReviser(revue);

    if (revue.vide) return null;

    return (
        <div className="mt-16 pt-12 border-t border-app-border/30 space-y-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h3 className="text-base font-black uppercase tracking-[0.2em] text-accent">
                        Revue de la séance
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-xl leading-relaxed">
                        Scène par scène. Ce qui est retenu ici part au résumé ; le reste demeure au
                        journal sans y aller. Rien n'est effacé.
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Compteur valeur={reste.scenes} mot="scènes" />
                    {reste.ecartees > 0 && <Compteur valeur={reste.ecartees} mot="mises de côté" sourd />}
                    {reste.aRanger > 0 && <Compteur valeur={reste.aRanger} mot="à ranger" alerte />}
                    <Compteur valeur={reste.recit} mot="au résumé" accent />
                </div>
            </div>

            {revue.sansScene.length > 0 && (
                <ARanger
                    evenements={revue.sansScene}
                    scenes={revue.scenes}
                    ranger={(eventId, sceneId) => updateEvent(journal.id, eventId, { sceneId })}
                />
            )}

            <div className="space-y-4">
                {revue.scenes.map(s => (
                    <BlocDeScene
                        key={s.scene.id}
                        revue={s}
                        modifierScene={modifierScene}
                        basculerLaNature={(e) => updateEvent(journal.id, e.id, {
                            nature: natureDe(e) === 'chronique' ? 'trace' : 'chronique',
                        })}
                    />
                ))}
            </div>
        </div>
    );
};

const Compteur: React.FC<{
    valeur: number; mot: string; accent?: boolean; alerte?: boolean; sourd?: boolean;
}> = ({ valeur, mot, accent, alerte, sourd }) => (
    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
        alerte ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            : accent ? 'bg-accent/10 border-accent/30 text-accent'
                : sourd ? 'bg-app-bg/40 border-app-border/20 text-slate-600'
                    : 'bg-app-surface/40 border-app-border/30 text-slate-400'
    }`}>
        {valeur} {mot}
    </span>
);

/**
 * Ce que le rattachement automatique n'a pas su ranger.
 *
 * **En tête, et non en bas.** C'est le seul endroit de la revue qui demande une
 * décision qu'aucun code ne pouvait prendre : quand deux scènes sont ouvertes en
 * même temps, l'outil s'abstient plutôt que de deviner. Le reste de l'écran se
 * survole ; ceci se traite.
 */
const ARanger: React.FC<{
    evenements: EvenementCure[];
    scenes: SceneAReviser[];
    ranger: (eventId: string, sceneId: string) => void;
}> = ({ evenements, scenes, ranger }) => (
    <div className="border border-amber-500/30 bg-amber-500/[0.04] rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-3">
            <Inbox size={16} className="text-amber-400 shrink-0" />
            <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-amber-200">
                    À ranger
                </p>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                    Deux scènes étaient ouvertes à la fois : l'outil n'a pas voulu choisir à votre place.
                </p>
            </div>
        </div>
        <ul className="space-y-1.5">
            {evenements.map(e => (
                <li key={e.id} className="flex items-center gap-3 flex-wrap text-[12px]">
                    <PastilleDeNature evenement={e} />
                    <span className="text-slate-300 font-semibold">{e.title}</span>
                    {scenes.length > 0 && (
                        <select
                            defaultValue=""
                            onChange={ev => ev.target.value && ranger(e.id, ev.target.value)}
                            className="ml-auto bg-app-bg border border-app-border/40 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-300"
                        >
                            <option value="">Ranger dans…</option>
                            {scenes.map(s => (
                                <option key={s.scene.id} value={s.scene.id}>{s.scene.titre}</option>
                            ))}
                        </select>
                    )}
                </li>
            ))}
        </ul>
    </div>
);

const BlocDeScene: React.FC<{
    revue: SceneAReviser;
    modifierScene: (id: string, updates: { titre?: string; resume?: string; ecarteeDeLaChronique?: boolean }) => void;
    basculerLaNature: (e: EvenementCure) => void;
}> = ({ revue, modifierScene, basculerLaNature }) => {
    const [deplie, setDeplie] = React.useState(false);
    const { scene, acte, recit, traces } = revue;
    const ecartee = sceneEcartee(scene);

    return (
        <div className={`border rounded-2xl overflow-hidden transition-all ${
            ecartee
                ? 'border-app-border/20 bg-app-bg/30 opacity-50'
                : 'border-app-border/40 bg-app-surface/20'
        }`}>
            <div className="p-5 space-y-3">
                <div className="flex items-start gap-3">
                    <Layers size={15} className="text-accent/60 shrink-0 mt-1" />
                    <div className="flex-1 min-w-0 space-y-2">
                        {acte && (
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">
                                {acte.titre}
                            </p>
                        )}
                        {/* Le titre s'édite là où on le relit : le renvoyer vers
                            l'écran de trame ferait perdre le fil de la revue. */}
                        <input
                            value={scene.titre}
                            onChange={e => modifierScene(scene.id, { titre: e.target.value })}
                            className={`w-full bg-transparent text-sm font-bold text-app-text outline-none border-b border-transparent focus:border-accent/40 transition-colors ${
                                ecartee ? 'line-through' : ''
                            }`}
                        />
                        <textarea
                            value={scene.resume}
                            onChange={e => modifierScene(scene.id, { resume: e.target.value })}
                            rows={2}
                            placeholder="Ce qui s'y est joué — c'est ce résumé que la chronique reprendra."
                            className="w-full bg-app-bg/40 border border-app-border/30 rounded-xl px-3 py-2 text-[12px] text-slate-300 outline-none focus:border-accent/40 resize-y leading-relaxed"
                        />
                    </div>
                    <button
                        onClick={() => modifierScene(scene.id, { ecarteeDeLaChronique: !ecartee })}
                        title={ecartee
                            ? 'La remettre dans la chronique'
                            : 'La mettre de côté : elle reste au journal, mais ne part pas au résumé'}
                        className="shrink-0 p-2 rounded-lg border border-app-border/30 text-slate-500 hover:text-accent hover:border-accent/40 transition-all"
                    >
                        {ecartee ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                </div>

                <ul className="space-y-1 pl-8">
                    {recit.map(e => (
                        <LigneDEvenement key={e.id} evenement={e} basculer={basculerLaNature} />
                    ))}
                    {recit.length === 0 && (
                        <li className="text-[11px] text-slate-600 italic">
                            Rien qui raconte — cette scène n'entrera pas dans le résumé.
                        </li>
                    )}
                </ul>

                {traces.length > 0 && (
                    <div className="pl-8">
                        <button
                            onClick={() => setDeplie(!deplie)}
                            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-slate-400 transition-colors"
                        >
                            {deplie ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            {traces.length} trace{traces.length > 1 ? 's' : ''}
                        </button>
                        {deplie && (
                            <ul className="mt-2 space-y-1">
                                {traces.map(e => (
                                    <LigneDEvenement key={e.id} evenement={e} basculer={basculerLaNature} />
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

/** Un événement, et le seul geste qu'on lui applique : changer sa nature. */
const LigneDEvenement: React.FC<{
    evenement: EvenementCure;
    basculer: (e: EvenementCure) => void;
}> = ({ evenement, basculer }) => (
    <li className="flex items-center gap-2.5 text-[12px] group">
        <button
            onClick={() => basculer(evenement)}
            title={natureDe(evenement) === 'chronique'
                ? 'Récit — part au résumé. Cliquer pour en faire une trace.'
                : 'Trace — reste au journal. Cliquer pour l’envoyer au résumé.'}
        >
            <PastilleDeNature evenement={evenement} />
        </button>
        <span className={natureDe(evenement) === 'chronique' ? 'text-slate-300' : 'text-slate-600'}>
            {evenement.title}
        </span>
    </li>
);

const PastilleDeNature: React.FC<{ evenement: EvenementCure }> = ({ evenement }) => (
    natureDe(evenement) === 'chronique'
        ? <Feather size={12} className="text-accent shrink-0" />
        : <Cog size={12} className="text-slate-600 shrink-0" />
);

export default RevueDeSeance;
