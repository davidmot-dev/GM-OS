import React from 'react';
import {
    Layers, Plus, ChevronUp, ChevronDown, Trash2, Users, Key,
    Clapperboard, CheckCircle2, Circle, Sparkles, CornerDownRight, Play, Square, Copy,
} from 'lucide-react';
import { useSessionOSStore } from '../useSessionOSStore';
import { useStoryboardStore } from '../../storyboard/useStoryboardStore';
import { gmConfirm } from '../../../stores/useModalStore';
import {
    actesOrdonnes, scenesOrdonnees, scenesEmportees,
    etatDeLaScene, closeSansAvoirEteJouee, scenesACloreAvecLActe,
} from '../logic/trame';
import PastilleDePreparation from './trame/PastilleDePreparation';
import type { Acte, Scene } from '../../../types/trame.types';

/**
 * La trame de la campagne : ses actes, et les scènes de chacun.
 *
 * **Ce que cet écran est, et ce qu'il n'est pas.** Il sert à *préparer* et à
 * *relire* une trame — l'écrire à la main, ou revoir celle que la Forge de
 * campagne produira. Il ne capture rien en séance : le parcours réel, les
 * marquages gratuits et la revue de fin de partie relèvent d'une autre
 * temporalité (plan du 2026-08-15, § 0), et le modèle ne porte volontairement
 * aucun champ que rien n'écrirait encore.
 *
 * **Une scène incomplète n'est jamais refusée.** L'anneau de remplissage dit ce
 * qui manque ; il ne bloque pas. Une scène de dialogue n'a pas d'indice à
 * porter, et une scène née d'un combat improvisé n'a qu'un titre — c'est un
 * état normal, pas une erreur. *L'outil suit l'état, il n'arbitre pas.*
 */
const TrameDashboard: React.FC = () => {
    const {
        actes, scenes, campaigns, activeCampaignId, atlasMaps, entities, clues, sessions, players,
        ajouterActe, modifierActe, supprimerActe, deplacerActe,
        ajouterScene, modifierScene, supprimerScene, deplacerScene,
        ouvrirLaScene, terminerLaScene, clonerLaScene,
    } = useSessionOSStore();
    const moments = useStoryboardStore(s => s.moments);

    /*
      La séance active, pour que les passages ouverts d'ici portent son nom.
      Sans elle on ouvre quand même — préparer sa trame un dimanche est
      légitime — mais le passage restera anonyme, et le journal ne saura pas à
      quelle soirée le rattacher.
    */
    const seanceActive = sessions.find(s => s.campaignId === activeCampaignId && s.status === 'active');

    const [acteOuvert, setActeOuvert] = React.useState<string | null>(null);
    const [selection, setSelection] = React.useState<{ type: 'acte' | 'scene'; id: string } | null>(null);

    const campagne = campaigns.find(c => c.id === activeCampaignId);
    const mesActes = actesOrdonnes(actes, activeCampaignId);

    // Les renvois ne proposent que ce qui appartient à cette campagne : un lieu
    // d'une autre campagne dans une liste déroulante est une invitation à
    // l'erreur, et le lien serait ensuite invisible à la relecture.
    const mesLieux = atlasMaps.filter(m => m.campaignId === activeCampaignId);
    const mesPnj = entities.filter(e => e.campaignId === activeCampaignId);
    const mesPersonnages = players
        .flatMap(p => p.characters ?? [])
        .filter(c => c.campaignId === activeCampaignId)
        .map(c => ({ id: c.id, name: c.name }));
    const mesIndices = clues.filter(c => c.campaignId === activeCampaignId);
    const mesAmbiances = moments.filter(m => m.campaignId === activeCampaignId);

    const acteSelectionne = selection?.type === 'acte' ? actes.find(a => a.id === selection.id) : undefined;
    const sceneSelectionnee = selection?.type === 'scene' ? scenes.find(s => s.id === selection.id) : undefined;

    if (!campagne) {
        return (
            <div className="flex-1 flex items-center justify-center text-app-text/40 text-sm">
                Aucune campagne active — la trame appartient à une campagne.
            </div>
        );
    }

    const creerActe = () => {
        const id = ajouterActe(campagne.id, `Acte ${mesActes.length + 1}`);
        setActeOuvert(id);
        setSelection({ type: 'acte', id });
    };

    const creerScene = (acteId: string) => {
        const id = ajouterScene(acteId, 'Nouvelle scène');
        if (id) setSelection({ type: 'scene', id });
    };

    /*
      **Achever un acte termine toutes ses scènes** depuis le 2026-08-17, y
      compris celles que le groupe n'a jamais visitées. C'est une cascade au même
      titre que la suppression, donc elle s'annonce — sinon on découvre après
      coup que six scènes viennent d'être barrées.

      Dé-marquer ne demande rien : ça ne ressuscite aucune scène, faute de savoir
      lesquelles avaient été closes par l'acte et lesquelles l'étaient déjà.
    */
    const demanderAchevementActe = (acte: Acte) => {
        if (acte.acheve) {
            modifierActe(acte.id, { acheve: false });
            return;
        }
        const { total, enCours, jamaisJouees } = scenesACloreAvecLActe(scenes, acte.id);
        if (total === 0) {
            modifierActe(acte.id, { acheve: true });
            return;
        }
        const details = [
            enCours.length > 0 ? `${enCours.length} en cours` : '',
            jamaisJouees.length > 0 ? `${jamaisJouees.length} jamais jouée${jamaisJouees.length > 1 ? 's' : ''}` : '',
        ].filter(Boolean).join(', ');
        gmConfirm(
            `Achever « ${acte.titre} » terminera ses ${total} scène${total > 1 ? 's' : ''}`
            + (details ? ` (${details})` : '') + '.',
            () => modifierActe(acte.id, { acheve: true }),
        );
    };

    /** La confirmation dit ce qu'elle coûte, au lieu de demander un accord à l'aveugle. */
    const demanderSuppressionActe = (acte: Acte) => {
        const emportees = scenesEmportees(scenes, acte.id).length;
        gmConfirm(
            emportees === 0
                ? `Supprimer « ${acte.titre} » ?`
                : `Supprimer « ${acte.titre} » et ses ${emportees} scène${emportees > 1 ? 's' : ''} ? `
                  + 'Les scènes ne peuvent pas survivre à leur acte.',
            () => {
                supprimerActe(acte.id);
                setSelection(null);
            },
        );
    };

    return (
        <div className="h-full overflow-hidden flex flex-col bg-app-bg text-app-text">
            <header className="flex items-center justify-between px-8 py-6 border-b border-app-border/10 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                        <Layers size={22} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-widest font-display">Trame narrative</h1>
                        <p className="text-[10px] font-bold text-app-text/40 uppercase tracking-[0.25em]">
                            {campagne.name} — {mesActes.length} acte{mesActes.length > 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                <button
                    onClick={creerActe}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-accent text-white text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                >
                    <Plus size={14} /> Ajouter un acte
                </button>
            </header>

            <div className="flex-1 min-h-0 grid grid-cols-12 gap-6 p-6">
                {/* Colonne gauche : l'arborescence */}
                <div className="col-span-5 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                    {mesActes.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-40 gap-3 py-20">
                            <Layers size={40} />
                            <p className="text-sm max-w-xs leading-relaxed">
                                Aucun acte. Un acte porte un enjeu ; ses scènes portent ce qui s'y joue.
                            </p>
                        </div>
                    )}

                    {mesActes.map((acte, index) => {
                        const sesScenes = scenesOrdonnees(scenes, acte.id);
                        const ouvert = acteOuvert === acte.id;
                        return (
                            <div key={acte.id} className="rounded-2xl border border-app-border/10 bg-app-surface/40 overflow-hidden">
                                <div
                                    className={`flex items-center gap-3 p-4 cursor-pointer transition-colors ${
                                        selection?.id === acte.id ? 'bg-accent/10' : 'hover:bg-white/5'
                                    }`}
                                    onClick={() => {
                                        setActeOuvert(ouvert ? null : acte.id);
                                        setSelection({ type: 'acte', id: acte.id });
                                    }}
                                >
                                    <span className="text-[10px] font-mono font-black text-app-text/30 w-6 shrink-0">
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-bold truncate ${acte.acheve ? 'line-through opacity-40' : ''}`}>
                                            {acte.titre}
                                        </p>
                                        <p className="text-[10px] text-app-text/40 uppercase tracking-widest">
                                            {sesScenes.length} scène{sesScenes.length > 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
                                        <button onClick={() => deplacerActe(acte.id, 'haut')} title="Monter"
                                            className="p-1.5 rounded-lg text-app-text/30 hover:text-app-text hover:bg-white/5"><ChevronUp size={14} /></button>
                                        <button onClick={() => deplacerActe(acte.id, 'bas')} title="Descendre"
                                            className="p-1.5 rounded-lg text-app-text/30 hover:text-app-text hover:bg-white/5"><ChevronDown size={14} /></button>
                                        <button onClick={() => demanderSuppressionActe(acte)} title="Supprimer l'acte"
                                            className="p-1.5 rounded-lg text-app-text/30 hover:text-red-400 hover:bg-red-500/10"><Trash2 size={14} /></button>
                                    </div>
                                </div>

                                {ouvert && (
                                    <div className="px-4 pb-4 space-y-1.5">
                                        {sesScenes.map(scene => (
                                            <LigneDeScene
                                                key={scene.id}
                                                scene={scene}
                                                actif={selection?.id === scene.id}
                                                onSelect={() => setSelection({ type: 'scene', id: scene.id })}
                                                onMonter={() => deplacerScene(scene.id, 'haut')}
                                                onDescendre={() => deplacerScene(scene.id, 'bas')}
                                                onSupprimer={() => gmConfirm(`Supprimer la scène « ${scene.titre} » ?`, () => {
                                                    supprimerScene(scene.id);
                                                    setSelection(null);
                                                })}
                                                onBasculerLEtat={() => (etatDeLaScene(scene) === 'en-cours'
                                                    ? terminerLaScene(scene.id)
                                                    : ouvrirLaScene(scene.id, seanceActive?.id))}
                                                onCloner={() => {
                                                    const id = clonerLaScene(scene.id);
                                                    if (id) setSelection({ type: 'scene', id });
                                                }}
                                            />
                                        ))}
                                        <button
                                            onClick={() => creerScene(acte.id)}
                                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-app-border/20 text-[10px] font-bold uppercase tracking-widest text-app-text/40 hover:text-accent hover:border-accent/30 transition-all"
                                        >
                                            <CornerDownRight size={12} /> Ajouter une scène
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Colonne droite : l'éditeur */}
                <div className="col-span-7 overflow-y-auto custom-scrollbar rounded-2xl border border-app-border/10 bg-app-surface/40 p-6">
                    {acteSelectionne && (
                        <div className="space-y-5">
                            <Champ label="Titre de l'acte">
                                <input
                                    value={acteSelectionne.titre}
                                    onChange={e => modifierActe(acteSelectionne.id, { titre: e.target.value })}
                                    className="w-full bg-app-bg/40 px-4 py-3 rounded-xl border border-app-border/20 text-sm focus:border-accent/50 outline-none"
                                />
                            </Champ>
                            <Champ label="L'enjeu — ce qui doit s'y jouer">
                                <textarea
                                    value={acteSelectionne.resume}
                                    onChange={e => modifierActe(acteSelectionne.id, { resume: e.target.value })}
                                    rows={4}
                                    className="w-full bg-app-bg/40 px-4 py-3 rounded-xl border border-app-border/20 text-sm focus:border-accent/50 outline-none resize-none leading-relaxed"
                                />
                            </Champ>
                            <Champ label="Notes du meneur">
                                <textarea
                                    value={acteSelectionne.notesDuMeneur ?? ''}
                                    onChange={e => modifierActe(acteSelectionne.id, { notesDuMeneur: e.target.value })}
                                    rows={4}
                                    className="w-full bg-app-bg/40 px-4 py-3 rounded-xl border border-app-border/20 text-sm focus:border-accent/50 outline-none resize-none leading-relaxed"
                                />
                            </Champ>
                            <button
                                onClick={() => demanderAchevementActe(acteSelectionne)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-app-border/20 text-[10px] font-black uppercase tracking-widest text-app-text/60 hover:text-app-text hover:bg-white/5 transition-all"
                            >
                                {acteSelectionne.acheve ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Circle size={14} />}
                                {acteSelectionne.acheve ? 'Acte achevé' : 'Marquer comme achevé'}
                            </button>
                            {/* On n'efface pas un acte joué : il reste lisible, barré. */}
                            <p className="text-[11px] text-app-text/30 italic leading-relaxed">
                                Un acte achevé reste dans la trame et se relit — c'est lui qui dit d'où la campagne vient.
                                Ses scènes se terminent avec lui.
                            </p>
                        </div>
                    )}

                    {sceneSelectionnee && (
                        <EditeurDeScene
                            scene={sceneSelectionnee}
                            lieux={mesLieux}
                            pnj={mesPnj}
                            personnages={mesPersonnages}
                            indices={mesIndices}
                            ambiances={mesAmbiances}
                            onChange={updates => modifierScene(sceneSelectionnee.id, updates)}
                        />
                    )}

                    {!acteSelectionne && !sceneSelectionnee && (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-30 gap-3">
                            <Sparkles size={36} />
                            <p className="text-sm">Choisis un acte ou une scène.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const Champ: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-app-text/40 px-1">{label}</label>
        {children}
    </div>
);

/**
 * Une scène dans l'arborescence, avec sa pastille de remplissage.
 *
 * Le taux **remplace un second type d'objet** : une scène improvisée est une
 * scène ordinaire peu remplie, et c'est ce que la pastille montre. Rien
 * n'oblige à la remplir.
 */
function LigneDeScene({ scene, actif, onSelect, onMonter, onDescendre, onSupprimer, onBasculerLEtat, onCloner }: {
    scene: Scene; actif: boolean;
    onSelect: () => void; onMonter: () => void; onDescendre: () => void; onSupprimer: () => void;
    onBasculerLEtat: () => void; onCloner: () => void;
}) {
    const etat = etatDeLaScene(scene);
    return (
        <div
            onClick={onSelect}
            className={`group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                actif ? 'bg-accent/15 border border-accent/30' : 'border border-transparent hover:bg-white/5'
            }`}
        >
            <PastilleDePreparation scene={scene} />
            {/* L'état de jeu se lit ici, à côté de la préparation et jamais
                confondu avec elle : une scène bien préparée n'est pas une scène
                déjà traversée. */}
            <span
                className={`flex-1 min-w-0 text-xs truncate ${
                    etat === 'terminee'
                        ? `line-through ${closeSansAvoirEteJouee(scene) ? 'text-app-text/20' : 'text-app-text/40'}`
                        : ''
                }`}
                title={closeSansAvoirEteJouee(scene) ? 'Close avec son acte, sans avoir été jouée' : undefined}
            >{scene.titre}</span>
            {etat === 'en-cours' && (
                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400 shrink-0">en cours</span>
            )}
            {etat === 'en-pause' && (
                <span className="text-[8px] font-black uppercase tracking-widest text-app-text/30 shrink-0">pause</span>
            )}
            {scene.origine === 'improvisee' && (
                <span className="text-[8px] font-black uppercase tracking-widest text-amber-400/70 shrink-0">improvisée</span>
            )}
            <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                {/*
                    Le même geste qu'en séance, là où les scènes vivent. On peut
                    préparer sa trame et y ouvrir une scène : rien n'oblige à
                    passer par l'espace de jeu, et refuser ici aurait fait de cet
                    écran une vue en lecture seule sur son propre objet.
                */}
                <button
                    onClick={onBasculerLEtat}
                    title={etat === 'en-cours' ? 'Terminer la scène' : etat === 'terminee' ? 'Rouvrir la scène' : 'Commencer la scène'}
                    className={`p-1 rounded ${etat === 'en-cours' ? 'text-emerald-400 hover:text-red-300' : 'text-app-text/30 hover:text-emerald-300'}`}
                >{etat === 'en-cours' ? <Square size={12} /> : <Play size={12} />}</button>
                <button onClick={onCloner} title="Cloner la scène — une copie vierge, juste après" className="p-1 rounded text-app-text/30 hover:text-app-text"><Copy size={12} /></button>
                <button onClick={onMonter} title="Monter" className="p-1 rounded text-app-text/30 hover:text-app-text"><ChevronUp size={12} /></button>
                <button onClick={onDescendre} title="Descendre" className="p-1 rounded text-app-text/30 hover:text-app-text"><ChevronDown size={12} /></button>
                <button onClick={onSupprimer} title="Supprimer la scène" className="p-1 rounded text-app-text/30 hover:text-red-400"><Trash2 size={12} /></button>
            </div>
        </div>
    );
}

const EditeurDeScene: React.FC<{
    scene: Scene;
    lieux: { id: string; name: string }[];
    pnj: { id: string; name: string }[];
    personnages: { id: string; name: string }[];
    indices: { id: string; title: string }[];
    ambiances: { id: string; name: string }[];
    onChange: (updates: Partial<Scene>) => void;
}> = ({ scene, lieux, pnj, personnages, indices, ambiances, onChange }) => {
    const bascule = (liste: string[], id: string) =>
        liste.includes(id) ? liste.filter(x => x !== id) : [...liste, id];

    return (
        <div className="space-y-5">
            <Champ label="Titre de la scène">
                <input
                    value={scene.titre}
                    onChange={e => onChange({ titre: e.target.value })}
                    className="w-full bg-app-bg/40 px-4 py-3 rounded-xl border border-app-border/20 text-sm focus:border-accent/50 outline-none"
                />
            </Champ>

            <Champ label="Ce qui s'y joue">
                <textarea
                    value={scene.resume}
                    onChange={e => onChange({ resume: e.target.value })}
                    rows={4}
                    className="w-full bg-app-bg/40 px-4 py-3 rounded-xl border border-app-border/20 text-sm focus:border-accent/50 outline-none resize-none leading-relaxed"
                />
            </Champ>

            <div className="grid grid-cols-2 gap-4">
                <Champ label="Lieu">
                    <select
                        value={scene.lieuId ?? ''}
                        onChange={e => onChange({ lieuId: e.target.value || undefined })}
                        className="w-full bg-app-bg/40 px-4 py-3 rounded-xl border border-app-border/20 text-xs focus:border-accent/50 outline-none cursor-pointer"
                    >
                        <option value="">— aucun —</option>
                        {lieux.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                </Champ>
                <Champ label="Ambiance">
                    <select
                        value={scene.momentDeStoryboardId ?? ''}
                        onChange={e => onChange({ momentDeStoryboardId: e.target.value || undefined })}
                        className="w-full bg-app-bg/40 px-4 py-3 rounded-xl border border-app-border/20 text-xs focus:border-accent/50 outline-none cursor-pointer"
                    >
                        <option value="">— aucune —</option>
                        {ambiances.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </Champ>
            </div>
            {/* On lie une ambiance, on ne la duplique pas : la même sert plusieurs scènes. */}

            {/*
                **Qui est là, du côté des joueurs.** Sans ce champ, deux scènes
                ouvertes en même temps — un groupe séparé — ne disent pas qui est
                où, et c'est pourtant la seule chose que le meneur relise à ce
                moment-là. Même geste que les PNJ, à dessein : deux listes de
                présence qui se rempliraient différemment finiraient par se
                contredire.
            */}
            <Cases
                icone={<Users size={12} />}
                label="Personnages présents"
                vide="Aucun personnage rattaché à cette campagne."
                options={personnages.map(p => ({ id: p.id, label: p.name }))}
                choisis={scene.personnagesIds ?? []}
                onBascule={id => onChange({ personnagesIds: bascule(scene.personnagesIds ?? [], id) })}
            />

            <Cases
                icone={<Users size={12} />}
                label="PNJ présents"
                vide="Aucun PNJ dans cette campagne."
                options={pnj.map(p => ({ id: p.id, label: p.name }))}
                choisis={scene.entiteIds}
                onBascule={id => onChange({ entiteIds: bascule(scene.entiteIds, id) })}
            />

            <Cases
                icone={<Key size={12} />}
                label="Indices que cette scène peut livrer"
                vide="Aucun indice dans cette campagne."
                options={indices.map(i => ({ id: i.id, label: i.title }))}
                choisis={scene.indiceIds}
                onBascule={id => onChange({ indiceIds: bascule(scene.indiceIds, id) })}
            />

            <Champ label="Notes du meneur">
                <textarea
                    value={scene.notesDuMeneur ?? ''}
                    onChange={e => onChange({ notesDuMeneur: e.target.value })}
                    rows={3}
                    className="w-full bg-app-bg/40 px-4 py-3 rounded-xl border border-app-border/20 text-sm focus:border-accent/50 outline-none resize-none leading-relaxed"
                />
            </Champ>

            <p className="text-[11px] text-app-text/30 italic leading-relaxed flex items-start gap-2">
                <Clapperboard size={13} className="shrink-0 mt-0.5" />
                Rien n'est obligatoire ici. Une scène peu remplie reste une scène — c'est le cas de
                toutes celles qui naissent en pleine partie.
            </p>
        </div>
    );
};

const Cases: React.FC<{
    icone: React.ReactNode;
    label: string;
    vide: string;
    options: { id: string; label: string }[];
    choisis: string[];
    onBascule: (id: string) => void;
}> = ({ icone, label, vide, options, choisis, onBascule }) => (
    <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-app-text/40 px-1">
            {icone} {label}
        </label>
        {options.length === 0 ? (
            <p className="text-[11px] text-app-text/25 italic px-1">{vide}</p>
        ) : (
            <div className="flex flex-wrap gap-1.5">
                {options.map(o => {
                    const actif = choisis.includes(o.id);
                    return (
                        <button
                            key={o.id}
                            onClick={() => onBascule(o.id)}
                            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                                actif
                                    ? 'bg-accent/20 border-accent/40 text-accent'
                                    : 'bg-app-bg/30 border-app-border/20 text-app-text/40 hover:text-app-text/70'
                            }`}
                        >
                            {o.label}
                        </button>
                    );
                })}
            </div>
        )}
    </div>
);

export default TrameDashboard;
