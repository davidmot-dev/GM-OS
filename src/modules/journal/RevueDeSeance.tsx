import React from 'react';
import { Layers, EyeOff, Eye, Inbox, ChevronDown, ChevronRight, Feather, Cog, Scissors, Combine } from 'lucide-react';
import { gmConfirm } from '../../stores/useModalStore';
import { gmToast } from '../../stores/useToastStore';
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
    const {
        scenes, actes, activeCampaignId, modifierScene,
        fusionnerDeuxScenes, scinderLaSceneAuTemps,
    } = useSessionOSStore();
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
                        autres={revue.scenes.filter(a => a.scene.id !== s.scene.id)}
                        modifierScene={modifierScene}
                        basculerLaNature={(e) => updateEvent(journal.id, e.id, {
                            nature: natureDe(e) === 'chronique' ? 'trace' : 'chronique',
                        })}
                        fusionner={(absorbee) => gmConfirm(
                            `« ${absorbee.titre} » sera absorbée dans « ${s.scene.titre} » : ses événements, `
                            + 'ses PNJ, ses indices et son résumé la rejoignent, et elle disparaît de la trame. '
                            + "Rien n'est effacé du journal.",
                            () => {
                                const deplaces = fusionnerDeuxScenes(s.scene.id, absorbee.id);
                                gmToast(
                                    deplaces === null
                                        ? 'Fusion impossible — les deux scènes doivent appartenir à la même campagne.'
                                        : `« ${absorbee.titre} » absorbée : ${deplaces} événement${deplaces > 1 ? 's' : ''} déplacé${deplaces > 1 ? 's' : ''}.`,
                                    deplaces === null ? 'warning' : 'success',
                                );
                            },
                            undefined,
                            'FUSIONNER',
                            'ANNULER',
                        )}
                        scinder={(depuis) => {
                            const id = scinderLaSceneAuTemps(s.scene.id, depuis);
                            gmToast(
                                id
                                    ? 'Scène scindée : la seconde moitié se trouve juste en dessous, à nommer.'
                                    : 'Scission impossible — la scène est introuvable.',
                                id ? 'success' : 'warning',
                            );
                        }}
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
    /** Les autres scènes de la revue — celles qu'on peut absorber dans celle-ci. */
    autres: SceneAReviser[];
    modifierScene: (id: string, updates: { titre?: string; resume?: string; ecarteeDeLaChronique?: boolean }) => void;
    basculerLaNature: (e: EvenementCure) => void;
    fusionner: (absorbee: SceneAReviser['scene']) => void;
    scinder: (depuis: number) => void;
}> = ({ revue, autres, modifierScene, basculerLaNature, fusionner, scinder }) => {
    const [deplie, setDeplie] = React.useState(false);
    const { scene, acte, recit, traces } = revue;
    const ecartee = sceneEcartee(scene);

    /*
      **Le premier événement de la scène ne porte pas de ciseaux.** Couper
      dessus donnerait tout à la seconde moitié et rien à la première : le
      moteur l'accepte — il n'y a rien d'abîmé là-dedans — mais l'offrir
      reviendrait à proposer un geste dont le résultat n'est pas celui qu'on
      lit. Les traces comptent dans ce calcul : c'est souvent une trace qui
      ouvre une scène.
    */
    const premier = React.useMemo(
        () => Math.min(...[...recit, ...traces].map(e => e.timestamp)),
        [recit, traces],
    );

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
                    {/*
                      **Fusionner : on désigne celle qui SURVIT, on choisit celle
                      qui disparaît.** Le menu est posé sur la scène gardée, et
                      son intitulé le dit — « Absorber… ». C'est le seul
                      agencement où le meneur sait d'avance ce qu'il va obtenir ;
                      un menu « fusionner avec » laisserait la question ouverte
                      de savoir laquelle des deux reste.
                    */}
                    {autres.length > 0 && !ecartee && (
                        <div className="shrink-0 relative">
                            <select
                                value=""
                                onChange={e => {
                                    const cible = autres.find(a => a.scene.id === e.target.value);
                                    if (cible) fusionner(cible.scene);
                                    e.target.value = '';
                                }}
                                title="Absorber une autre scène dans celle-ci : elles n'en faisaient qu'une"
                                className="appearance-none bg-app-bg border border-app-border/30 rounded-lg pl-7 pr-2 py-2 text-[10px] font-bold text-slate-500 hover:text-accent hover:border-accent/40 transition-all cursor-pointer"
                            >
                                <option value="">Absorber…</option>
                                {autres.map(a => (
                                    <option key={a.scene.id} value={a.scene.id}>{a.scene.titre}</option>
                                ))}
                            </select>
                            <Combine
                                size={14}
                                className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"
                            />
                        </div>
                    )}
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
                        <LigneDEvenement
                            key={e.id} evenement={e} basculer={basculerLaNature}
                            scinder={e.timestamp > premier ? scinder : undefined}
                        />
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
                                    <LigneDEvenement
                                        key={e.id} evenement={e} basculer={basculerLaNature}
                                        scinder={e.timestamp > premier ? scinder : undefined}
                                    />
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Un événement, et les deux gestes qu'on lui applique : changer sa nature, et
 * **couper la scène juste avant lui**.
 *
 * *La coupure se désigne sur le fil.* Scinder demande de dire OÙ la seconde
 * scène commence, et le seul endroit où cette question a une réponse est la
 * ligne de l'événement qui l'ouvre. Un formulaire à part aurait obligé à
 * retrouver ce même événement dans une liste, hors de son contexte.
 *
 * Les ciseaux ne se montrent qu'au survol : ils ne concernent qu'une ligne sur
 * dix, et une rangée d'icônes permanentes ferait de la revue un tableau de bord
 * là où elle doit se lire.
 */
const LigneDEvenement: React.FC<{
    evenement: EvenementCure;
    basculer: (e: EvenementCure) => void;
    /** Absent sur le premier événement de la scène : voir `premier` ci-dessus. */
    scinder?: (depuis: number) => void;
}> = ({ evenement, basculer, scinder }) => (
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
        {scinder && (
            <button
                onClick={() => scinder(evenement.timestamp)}
                title="Scinder ici : cet événement et tous les suivants passent dans une nouvelle scène"
                className="ml-auto shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 text-slate-600 hover:text-accent transition-all"
            >
                <Scissors size={12} />
            </button>
        )}
    </li>
);

const PastilleDeNature: React.FC<{ evenement: EvenementCure }> = ({ evenement }) => (
    natureDe(evenement) === 'chronique'
        ? <Feather size={12} className="text-accent shrink-0" />
        : <Cog size={12} className="text-slate-600 shrink-0" />
);

export default RevueDeSeance;
