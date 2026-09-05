import React, { useMemo, useState } from 'react';
import { EyeOff, FileText, Layers, BookOpen, Search, X, Lightbulb, Vault } from 'lucide-react';
import { type RemoteLectureDuMeneur, type RemoteActe, type RemoteScene } from '../segmentDeLecture';
import RemoteObsidian from './RemoteObsidian';
import type { CoffreObsidian } from '../hooks/useRemoteSync';

/**
 * **Le panneau de lecture du meneur — élargi le 2026-09-05.**
 *
 * Demandé par David : *« je voudrais que les notes contiennent aussi d'autres
 * éléments comme la trame, les scènes prévues dans la session, l'accès au wiki
 * »*. Il ne portait que le résumé public et les secrets de la séance, deux
 * champs de texte libre — et tout ce qu'on relit vraiment en jouant vivait sur
 * l'écran du PC, c'est-à-dire hors de portée dès qu'on tient la tablette.
 *
 * Cinq vues, et **l'ordre est celui de la fréquence, pas celui du modèle** :
 * *Séance* d'abord, parce que « où en est-on » est la question qu'on se pose dix
 * fois par soirée.
 */

interface RemoteNotesProps {
    notes: { public: string, private: string };
    lecture?: RemoteLectureDuMeneur;
    isAventureMode: boolean;
    /** Le coffre Obsidian — hors du flux périodique, voir `RemoteObsidian`. */
    coffre: CoffreObsidian;
    onChargerLeCoffre: () => void;
    onOuvrirUneNote: (chemin: string) => void;
    onFermerLaNote: () => void;
}

type Vue = 'seance' | 'trame' | 'wiki' | 'obsidian' | 'indices' | 'secrets';

const aplati = (texte: string) =>
    texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Ce que chaque état de scène dit, et de quelle couleur. */
const ETATS = {
    'en-cours': { mot: 'En cours', teinte: 'text-emerald-400 border-emerald-500/40' },
    'en-pause': { mot: 'En pause', teinte: 'text-amber-400 border-amber-500/40' },
    'prevue': { mot: 'À jouer', teinte: 'text-slate-400 border-white/10' },
    'terminee': { mot: 'Close', teinte: 'text-slate-600 border-white/5' },
} as const;

const CATEGORIES: Record<string, string> = {
    npc: 'PNJ', location: 'Lieu', organization: 'Organisation', lore: 'Savoir',
    item: 'Objet', clue: 'Indice', rumor: 'Rumeur', other: 'Autre',
};

/** Une scène en une ligne : titre et état, le reste au déplié. */
const LigneDeScene: React.FC<{ scene: RemoteScene; ouverte: boolean; basculer: () => void }> = ({
    scene, ouverte, basculer,
}) => {
    const etat = ETATS[scene.etat];
    return (
        <div className={`rounded-lg border ${scene.etat === 'en-cours' ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-white/5 bg-white/[0.02]'}`}>
            <button onClick={basculer} className="w-full flex items-center gap-2 px-2.5 py-2 text-left">
                <span className={`shrink-0 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${etat.teinte}`}>
                    {etat.mot}
                </span>
                <span className={`flex-1 min-w-0 text-xs font-bold truncate ${scene.etat === 'terminee' ? 'text-slate-600 line-through' : 'text-slate-200'}`}>
                    {scene.titre}
                </span>
                {/*
                  *Close sans avoir été jouée* n'est pas *close* : le journal
                  lirait la seconde comme du vécu. La trame du meneur fait déjà
                  cette distinction — la tablette la garde.
                */}
                {scene.jamaisJouee && (
                    <span className="shrink-0 text-[9px] italic text-slate-600">jamais jouée</span>
                )}
            </button>
            {ouverte && (
                <div className="px-2.5 pb-2.5 flex flex-col gap-1.5">
                    {scene.resume && <p className="text-[11px] leading-relaxed text-slate-400">{scene.resume}</p>}
                    {scene.notesDuMeneur && (
                        <p className="text-[11px] leading-relaxed text-amber-400/80 border-l-2 border-amber-500/30 pl-2 whitespace-pre-wrap">
                            {scene.notesDuMeneur}
                        </p>
                    )}
                    {!scene.resume && !scene.notesDuMeneur && (
                        <p className="text-[11px] italic text-slate-600">Rien d'écrit sur cette scène.</p>
                    )}
                </div>
            )}
        </div>
    );
};

const RemoteNotes: React.FC<RemoteNotesProps> = ({
    notes, lecture, isAventureMode, coffre, onChargerLeCoffre, onOuvrirUneNote, onFermerLaNote,
}) => {
    const [vue, setVue] = useState<Vue>('seance');
    const [filtreWiki, setFiltreWiki] = useState('');
    const [ficheOuverte, setFicheOuverte] = useState<string | null>(null);
    const [scenesOuvertes, setScenesOuvertes] = useState<Set<string>>(new Set());
    const [actesReplies, setActesReplies] = useState<Set<string>>(new Set());

    const actes = useMemo(() => lecture?.actes ?? [], [lecture]);
    const wiki = useMemo(() => lecture?.wiki ?? [], [lecture]);
    const indices = lecture?.indices ?? [];

    const basculer = (id: string, poser: React.Dispatch<React.SetStateAction<Set<string>>>) =>
        poser((avant) => {
            const apres = new Set(avant);
            if (apres.has(id)) apres.delete(id); else apres.add(id);
            return apres;
        });

    /*
      **Ce qui se joue maintenant, tous actes confondus.** Une scène en cours
      peut appartenir à un acte qu'on croyait derrière soi — *la trame est un
      plan glissant tant que la campagne vit.*
    */
    const scenesDuMoment = useMemo(() => {
        const toutes = actes.flatMap((a) => a.scenes.map((s) => ({ scene: s, acte: a })));
        return {
            enCours: toutes.filter(({ scene }) => scene.etat === 'en-cours'),
            enPause: toutes.filter(({ scene }) => scene.etat === 'en-pause'),
            aJouer: toutes.filter(({ scene, acte }) => scene.etat === 'prevue' && !acte.acheve),
        };
    }, [actes]);

    const wikiFiltre = useMemo(() => {
        const cherche = aplati(filtreWiki.trim());
        if (!cherche) return wiki;
        return wiki.filter((f) => aplati(`${f.titre} ${f.contenu} ${f.tags.join(' ')}`).includes(cherche));
    }, [wiki, filtreWiki]);

    const VUES: { id: Vue; titre: string; icone: typeof Layers; compte?: number }[] = [
        { id: 'seance', titre: 'Séance', icone: FileText },
        { id: 'trame', titre: 'Trame', icone: Layers, compte: actes.length },
        { id: 'wiki', titre: 'Wiki', icone: BookOpen, compte: wiki.length },
        /*
          **Le coffre Obsidian est à côté du wiki, et pas dedans.** Le wiki
          appartient à la campagne ; le coffre est le carnet personnel du meneur,
          tous jeux confondus. *Les mêler ferait chercher dans l'un ce qui est
          dans l'autre.*
        */
        { id: 'obsidian', titre: 'Coffre', icone: Vault },
        { id: 'indices', titre: 'Indices', icone: Lightbulb, compte: indices.length },
        { id: 'secrets', titre: 'Secrets', icone: EyeOff },
    ];

    const cadre = 'flex-1 min-h-0 overflow-y-auto no-scrollbar rounded-2xl bg-white/[0.03] border border-white/5 p-3';

    return (
        <div className="flex flex-col gap-3 h-full">
            <div className="flex gap-0.5 bg-white/5 p-0.5 rounded-xl border border-white/10 self-start shrink-0">
                {VUES.map(({ id, titre, icone: Icone, compte }) => (
                    <button
                        key={id}
                        onClick={() => setVue(id)}
                        aria-current={vue === id ? 'page' : undefined}
                        className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-[10px] font-black uppercase transition-colors ${vue === id ? 'bg-accent text-app-bg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Icone size={13} /> {titre}
                        {compte !== undefined && compte > 0 && (
                            <span className={vue === id ? 'opacity-60' : 'text-slate-600'}>{compte}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── La séance : où en est-on ──────────────────────────────── */}
            {vue === 'seance' && (
                <div className={`${cadre} flex flex-col gap-4`}>
                    {([
                        ['Ce qui se joue', scenesDuMoment.enCours],
                        ['En pause', scenesDuMoment.enPause],
                        ['À jouer', scenesDuMoment.aJouer],
                    ] as const).map(([titre, lot]) => (
                        <section key={titre} className="flex flex-col gap-1.5">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">
                                {titre} <span className="text-slate-700">{lot.length}</span>
                            </h3>
                            {lot.length === 0 ? (
                                <p className="text-[11px] italic text-slate-600 px-1">Rien ici.</p>
                            ) : (
                                <div className="grid grid-cols-1 min-[900px]:grid-cols-2 gap-1.5">
                                    {lot.map(({ scene, acte }) => (
                                        <div key={scene.id} className="flex flex-col gap-0.5">
                                            <span className="text-[9px] uppercase tracking-wider text-slate-600 px-1 truncate">{acte.titre}</span>
                                            <LigneDeScene
                                                scene={scene}
                                                ouverte={scenesOuvertes.has(scene.id)}
                                                basculer={() => basculer(scene.id, setScenesOuvertes)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    ))}

                    {notes?.public && (
                        <section className="flex flex-col gap-1.5">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Résumé public</h3>
                            <p className="text-xs leading-relaxed text-slate-300 whitespace-pre-wrap px-1 max-w-[75ch]">{notes.public}</p>
                        </section>
                    )}
                </div>
            )}

            {/* ── La trame entière ──────────────────────────────────────── */}
            {vue === 'trame' && (
                <div className={`${cadre} flex flex-col gap-2`}>
                    {actes.length === 0 ? (
                        <p className="text-sm italic text-slate-500 text-center py-10">Aucune trame sur cette campagne.</p>
                    ) : actes.map((acte: RemoteActe) => (
                        <section key={acte.id} className={`rounded-xl border p-2 ${acte.acheve ? 'border-white/5 bg-white/[0.01]' : 'border-white/10 bg-white/[0.03]'}`}>
                            <button
                                onClick={() => basculer(acte.id, setActesReplies)}
                                className="w-full flex items-baseline gap-2 text-left px-1 pb-1.5"
                            >
                                <span className={`text-sm font-black ${acte.acheve ? 'text-slate-600' : 'text-accent'}`}>{acte.titre}</span>
                                {acte.acheve && <span className="text-[9px] uppercase tracking-wider text-slate-600">achevé</span>}
                                <span className="ml-auto shrink-0 text-[10px] text-slate-600">{acte.scenes.length} scènes</span>
                            </button>
                            {!actesReplies.has(acte.id) && (
                                <div className="flex flex-col gap-1.5">
                                    {acte.resume && <p className="text-[11px] italic text-slate-500 px-1">{acte.resume}</p>}
                                    {acte.notesDuMeneur && (
                                        <p className="text-[11px] text-amber-400/80 border-l-2 border-amber-500/30 pl-2 mx-1 whitespace-pre-wrap">
                                            {acte.notesDuMeneur}
                                        </p>
                                    )}
                                    {acte.scenes.map((scene) => (
                                        <LigneDeScene
                                            key={scene.id}
                                            scene={scene}
                                            ouverte={scenesOuvertes.has(scene.id)}
                                            basculer={() => basculer(scene.id, setScenesOuvertes)}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>
                    ))}
                </div>
            )}

            {/* ── Le wiki ───────────────────────────────────────────────── */}
            {vue === 'wiki' && (
                <>
                    <div className="relative shrink-0">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                        <input
                            type="search"
                            value={filtreWiki}
                            onChange={(e) => setFiltreWiki(e.target.value)}
                            placeholder="Chercher dans le wiki…"
                            aria-label="Chercher dans le wiki"
                            className="w-full h-9 pl-9 pr-9 rounded-xl bg-white/5 border border-white/10 text-sm text-app-text placeholder:text-slate-600 outline-none focus:border-accent/40"
                        />
                        {filtreWiki && (
                            <button
                                onClick={() => setFiltreWiki('')}
                                aria-label="Effacer la recherche"
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-200"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <div className={`${cadre} flex flex-col gap-1.5`}>
                        {wikiFiltre.length === 0 ? (
                            <p className="text-sm italic text-slate-500 text-center py-10">
                                {filtreWiki ? `Rien ne correspond à « ${filtreWiki} ».` : 'Le wiki de cette campagne est vide.'}
                            </p>
                        ) : wikiFiltre.map((fiche) => (
                            <div key={fiche.id} className="rounded-lg border border-white/5 bg-white/[0.02]">
                                <button
                                    onClick={() => setFicheOuverte(ficheOuverte === fiche.id ? null : fiche.id)}
                                    className="w-full flex items-center gap-2 px-2.5 py-2 text-left"
                                >
                                    <span className="shrink-0 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border border-white/10 text-slate-500">
                                        {CATEGORIES[fiche.categorie] ?? fiche.categorie}
                                    </span>
                                    <span className="flex-1 min-w-0 text-xs font-bold text-slate-200 truncate">{fiche.titre}</span>
                                </button>
                                {ficheOuverte === fiche.id && (
                                    <div className="px-2.5 pb-2.5 flex flex-col gap-2">
                                        <p className="text-[11px] leading-relaxed text-slate-300 whitespace-pre-wrap max-w-[80ch]">
                                            {fiche.contenu || "Cette fiche n'a pas de contenu."}
                                        </p>
                                        {fiche.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {fiche.tags.map((tag) => (
                                                    <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-500">{tag}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {vue === 'obsidian' && (
                <RemoteObsidian
                    coffre={coffre}
                    onCharger={onChargerLeCoffre}
                    onOuvrir={onOuvrirUneNote}
                    onFermer={onFermerLaNote}
                />
            )}

            {/* ── Les indices ───────────────────────────────────────────── */}
            {vue === 'indices' && (
                <div className={`${cadre} grid grid-cols-1 min-[900px]:grid-cols-2 gap-1.5 content-start`}>
                    {indices.length === 0 ? (
                        <p className="text-sm italic text-slate-500 text-center py-10 col-span-full">Aucun indice sur cette campagne.</p>
                    ) : indices.map((indice) => (
                        <div key={indice.id} className={`rounded-lg border p-2.5 flex flex-col gap-1 ${indice.revele ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/5 bg-white/[0.02]'}`}>
                            <div className="flex items-center gap-2">
                                <span className={`shrink-0 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${indice.revele ? 'border-emerald-500/40 text-emerald-400' : 'border-white/10 text-slate-500'}`}>
                                    {indice.revele ? 'Donné' : 'En main'}
                                </span>
                                <span className="text-xs font-bold text-slate-200 truncate">{indice.titre}</span>
                            </div>
                            {indice.contenu && (
                                <p className="text-[11px] leading-relaxed text-slate-400 whitespace-pre-wrap">{indice.contenu}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ── Les secrets du meneur ─────────────────────────────────── */}
            {vue === 'secrets' && (
                <div className={`${cadre} ${isAventureMode ? 'blur-md grayscale pointer-events-none' : ''}`}>
                    <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-300 max-w-[75ch]">
                        {isAventureMode
                            ? "Contenu protégé par le Mode Aventure."
                            : (notes?.private || "Aucun secret enregistré pour cette séance.")}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RemoteNotes;
