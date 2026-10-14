import React, { useEffect, useMemo, useState } from 'react';
import {
    Clapperboard, Lock, Music2, Play, Search, Users, MapPin, Swords, FileText, Eye, EyeOff,
    ExternalLink, ChevronDown, ChevronRight, Cast, Sparkles, Map as MapIcon, Square,
} from 'lucide-react';
import { useSessionOSStore } from '../useSessionOSStore';
import { useEcranDeSceneStore } from '../useEcranDeSceneStore';
import { useObsidianStore } from '../useObsidianStore';
import { useMusicStore } from '../../music/useMusicStore';
import { useStoryboardStore } from '../../storyboard/useStoryboardStore';
import { useImageStore } from '../../image/useImageStore';
import { useMapStore } from '../../map/useMapStore';
import { useSessionStore } from '../../../store/useSessionStore';
import { useFermetureParEchap } from '../../../hooks/useFermetureParEchap';
import { gmCustom } from '../../../stores/useModalStore';
import { gmToast } from '../../../stores/useToastStore';
import { CadreDeSurcouche, Separateur } from '../../../components/socle';
import TexteMarkdown from '../../../components/TexteMarkdown';
import { ResolvedAsset } from '../../../components/ResolvedAsset';
import { actesOrdonnes, etatDeLaScene, scenesOrdonnees } from '../logic/trame';
import { ceQueDeclencheLeMoment, indiceProjete, scenesEntreesEnCours } from '../logic/ecranDeScene';
import { nomDeLaNote } from '../logic/noteDeLaScene';
import { battlemapsDeLaScene, estUneBattlemap } from '../logic/battlemapsDeLaScene';
import { BoutonProjeterSurLEcranParDefaut } from './BoutonProjeterLeLieu';
import { resumeDeLaRencontre } from '../../combat/logic/lignesDeRencontre';
import type { Scene } from '../../../types/trame.types';
import LoisDuCosm from './LoisDuCosm';
import { useCosmsDuJeu } from '../hooks/useCosmsCourants';
import { cosmsDesIds } from '../logic/cosmsCourants';
import type { AtlasMap } from '../../../types/chronicle.types';

/**
 * **L'écran « Scène en cours »** (2026-10-12, L2).
 *
 * *Né de la première séance jouée, le 11/10 : « lorsque je démarre une scène,
 * ses informations ne sont pas facilement accessibles ».* Tout ce que la Trame
 * a préparé pour la scène, en plein écran, dans l'ordre où on s'en sert : ce
 * qu'on décrit, ce qui se joue, ce qu'on dit — puis la musique, les indices,
 * les PNJ, le lieu, les rencontres et la note.
 *
 * Il s'ouvre **tout seul** quand une scène entre en cours, se ferme par Échap,
 * et Ctrl+E le rouvre (décisions de David, 11 et 12/10).
 */

const titreDeBloc = (icone: React.ReactNode, titre: string) => (
    <h3 className="flex items-center gap-2 text-ui-11 font-black uppercase tracking-widest text-app-muted">
        {icone} {titre}
    </h3>
);

const Bloc: React.FC<{ icone: React.ReactNode; titre: string; children: React.ReactNode }> = ({ icone, titre, children }) => (
    <section className="flex flex-col gap-2 rounded-xl border border-app-border bg-app-bg/40 p-4">
        {titreDeBloc(icone, titre)}
        {children}
    </section>
);

/* Les listes gardent leurs puces : sans elles, « - Obtenir l'aveu » devenait une
   ligne nue (vu sur la capture du manuel, 2026-10-12). */
const Texte: React.FC<{ children?: string }> = ({ children }) => (
    <div className="prose-p:my-1 break-words text-[15px] leading-relaxed text-app-text [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5">
        <TexteMarkdown>{children}</TexteMarkdown>
    </div>
);

const petitBouton = 'flex items-center gap-1.5 rounded-lg border border-app-border px-2.5 py-1.5 text-ui-10 font-bold text-app-text/80 transition-colors hover:border-accent/50 hover:text-accent';

/** Ouverture automatique et raccourci : montés une fois, avec l'écran. */
function useOuvertureDeLEcran() {
    const ouvrir = useEcranDeSceneStore(s => s.ouvrir);

    /*
      ⛔ **Sur l'état, pas sur les boutons** : voir `scenesEntreesEnCours`. Et
      jamais pendant une relecture de la base (démarrage, restauration, import
      Nexus-OS) : les scènes déjà en cours y « entrent » toutes d'un coup, et
      l'écran s'ouvrirait sur une scène que personne n'a commencée.
    */
    useEffect(() => useSessionOSStore.subscribe((etat, precedent) => {
        if (etat.scenes === precedent.scenes) return;
        if (!useSessionOSStore.persist.hasHydrated() || etat.isSystemSyncing) return;
        const entrees = scenesEntreesEnCours(precedent.scenes ?? [], etat.scenes ?? [])
            .filter(id => etat.scenes.find(s => s.id === id)?.campaignId === etat.activeCampaignId);
        if (entrees.length > 0) ouvrir(entrees[entrees.length - 1]);
    }), [ouvrir]);

    useEffect(() => {
        const auClavier = (e: KeyboardEvent) => {
            if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey || e.code !== 'KeyE') return;
            e.preventDefault();
            const ecran = useEcranDeSceneStore.getState();
            if (ecran.ouvert) { ecran.fermer(); return; }
            const { scenes, activeCampaignId } = useSessionOSStore.getState();
            const enCours = scenes.filter(s => s.campaignId === activeCampaignId && etatDeLaScene(s) === 'en-cours');
            if (enCours.length === 0 && !ecran.sceneId) {
                gmToast('Aucune scène en cours.', 'info');
                return;
            }
            ecran.ouvrir(enCours.some(s => s.id === ecran.sceneId) ? ecran.sceneId : enCours[0]?.id ?? ecran.sceneId);
        };
        window.addEventListener('keydown', auClavier);
        return () => window.removeEventListener('keydown', auClavier);
    }, []);
}

const EcranDeLaSceneEnCours: React.FC = () => {
    useOuvertureDeLEcran();
    const { ouvert, sceneId, ouvrir, fermer } = useEcranDeSceneStore();
    useFermetureParEchap(ouvert, fermer, 'Scène en cours');

    const { scenes, actes, activeCampaignId } = useSessionOSStore();
    const enCours = useMemo(
        () => scenes.filter(s => s.campaignId === activeCampaignId && etatDeLaScene(s) === 'en-cours'),
        [scenes, activeCampaignId],
    );
    const scene = scenes.find(s => s.id === sceneId && s.campaignId === activeCampaignId) ?? enCours[0];

    if (!ouvert) return null;

    const acte = actes.find(a => a.id === scene?.acteId);

    return (
        <div role="dialog" aria-modal="true" aria-label="Scène en cours"
            className="fixed inset-0 z-[140] flex bg-app-bg/90 backdrop-blur-md animate-in fade-in duration-200">
            <CadreDeSurcouche
                largeur="plein"
                icone={<Clapperboard size={18} />}
                titre={
                    <span className="flex flex-col">
                        <span className="text-ui-10 font-black uppercase tracking-widest text-app-muted">
                            {acte?.titre ?? 'Scène en cours'}
                        </span>
                        <span>{scene?.titre ?? 'Aucune scène en cours'}</span>
                    </span>
                }
                onFermer={fermer}
                libelleFermer="Fermer (Échap) — Ctrl+E le rouvre"
            >
                <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-app-border px-5 py-2">
                    {enCours.map(s => (
                        <button
                            key={s.id}
                            type="button"
                            onClick={() => ouvrir(s.id)}
                            className={`rounded-lg border px-3 py-1.5 text-ui-11 font-bold ${
                                s.id === scene?.id ? 'border-accent/50 bg-accent/15 text-accent' : 'border-app-border text-app-text/70 hover:text-app-text'
                            }`}
                        >
                            {s.titre}
                        </button>
                    ))}
                    <select
                        aria-label="Changer de scène"
                        value=""
                        onChange={e => { if (e.target.value) ouvrir(e.target.value); }}
                        className="ml-auto rounded-lg border border-app-border bg-app-bg px-2.5 py-1.5 text-ui-11 text-app-text"
                    >
                        <option value="">Changer de scène…</option>
                        {actesOrdonnes(actes, activeCampaignId).map(a => (
                            <optgroup key={a.id} label={a.titre}>
                                {scenesOrdonnees(scenes, a.id).map(s => <option key={s.id} value={s.id}>{s.titre}</option>)}
                            </optgroup>
                        ))}
                    </select>
                </div>

                {scene ? <ContenuDeLaScene scene={scene} fermer={fermer} /> : (
                    <p className="p-8 text-center text-app-muted">
                        Aucune scène n’est en cours. Commence-en une depuis la Trame ou le panneau de séance.
                    </p>
                )}
            </CadreDeSurcouche>
        </div>
    );
};

const ContenuDeLaScene: React.FC<{ scene: Scene; fermer: () => void }> = ({ scene, fermer }) => {
    const {
        modifierScene, clues, revealClue, entities, toggleEntityVisibility, atlasMaps, rencontres, campaigns,
    } = useSessionOSStore();
    /* Torg : les Lois du cosm de CETTE scène — le sien, sinon celui de la campagne. */
    const cosmsDuJeu = useCosmsDuJeu(scene.campaignId);
    const cosms = cosmsDesIds(cosmsDuJeu, scene.cosms?.length
        ? scene.cosms : campaigns.find(c => c.id === scene.campaignId)?.cosmsParDefaut ?? []);
    const projectEntity = useImageStore(s => s.projectEntity);
    const setActiveModule = useSessionStore(s => s.setActiveModule);

    const indices = clues.filter(c => scene.indiceIds.includes(c.id));
    const pnj = entities.filter(e => scene.entiteIds.includes(e.id));
    const lieu = atlasMaps.find(m => m.id === scene.lieuId);
    const battlemaps = battlemapsDeLaScene(scene, atlasMaps.filter(m => m.campaignId === scene.campaignId));
    const rencontresDeLaScene = (rencontres ?? []).filter(r => r.sceneId === scene.id);
    const nomDuPNJ = (id: string) => entities.find(e => e.id === id)?.name;
    const vide = (t?: string) => !t || !t.trim();
    const date = (quand: number) => new Date(quand).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

    return (
        <div className="custom-scrollbar grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-5 xl:grid-cols-2">
            {/* ── Ce qu'on décrit, ce qui se joue, ce qu'on dit ── */}
            <div className="flex flex-col gap-4">
                {!vide(scene.descriptionNarrative) && (
                    <Bloc icone={<Sparkles size={14} />} titre="Description narrative"><Texte>{scene.descriptionNarrative}</Texte></Bloc>
                )}
                {!vide(scene.enjeux) && <Bloc icone={<Swords size={14} />} titre="Enjeux"><Texte>{scene.enjeux}</Texte></Bloc>}
                {!vide(scene.repliques) && <Bloc icone={<Users size={14} />} titre="Exemples de répliques"><Texte>{scene.repliques}</Texte></Bloc>}
                <LoisDuCosm cosms={cosms} />
                {vide(scene.descriptionNarrative) && vide(scene.enjeux) && vide(scene.repliques) && !vide(scene.resume) && (
                    <Bloc icone={<Clapperboard size={14} />} titre="Ce qui s’y joue"><Texte>{scene.resume}</Texte></Bloc>
                )}

                {/* Ornements visibles (2026-10-13) : la narration, puis ce qui est au meneur. */}
                <Separateur />

                {/* Les notes du meneur : LE champ de la scène, pas une copie —
                    deux zones de notes pour une scène finiraient par se contredire. */}
                <Bloc icone={<Lock size={14} />} titre="Notes du meneur">
                    <textarea
                        aria-label="Notes du meneur"
                        value={scene.notesDuMeneur ?? ''}
                        onChange={e => modifierScene(scene.id, { notesDuMeneur: e.target.value || undefined })}
                        rows={5}
                        className="w-full resize-y rounded-lg border border-app-border/40 bg-app-bg/60 px-3 py-2 text-sm leading-relaxed text-app-text outline-none focus:border-accent/50"
                    />
                </Bloc>

                <NoteObsidian chemin={scene.noteObsidian} />
            </div>

            {/* ── Ce qu'on manipule ── */}
            <div className="flex flex-col gap-4">
                <MomentDeStoryboard scene={scene} />
                <Musique scene={scene} />

                {indices.length > 0 && (
                    <Bloc icone={<Search size={14} />} titre="Indices de la scène">
                        <ul className="flex flex-col gap-2">
                            {indices.map(i => (
                                <li key={i.id} className="flex flex-wrap items-center gap-2">
                                    <span className={`min-w-0 flex-1 truncate text-sm font-bold ${i.isRevealed ? 'text-app-text/60' : 'text-app-text'}`}>
                                        {i.title}
                                        {i.isRevealed && i.revealedAt && (
                                            <span className="ml-2 text-ui-10 font-normal text-app-muted">découvert le {date(i.revealedAt)}</span>
                                        )}
                                    </span>
                                    {!i.isRevealed && (
                                        <button type="button" className={petitBouton} onClick={() => revealClue(i.id)}>Révéler</button>
                                    )}
                                    <button
                                        type="button" className={petitBouton}
                                        onClick={() => { if (!i.isRevealed) revealClue(i.id); void projectEntity(indiceProjete(i)); }}
                                    >
                                        <Cast size={12} /> {i.isRevealed ? 'Projeter' : 'Révéler et projeter'}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </Bloc>
                )}

                {pnj.length > 0 && (
                    <Bloc icone={<Users size={14} />} titre="PNJ de la scène">
                        <ul className="flex flex-col gap-2">
                            {pnj.map(e => (
                                <li key={e.id} className="flex flex-wrap items-center gap-2">
                                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded bg-app-surface-2">
                                        {e.avatar && <ResolvedAsset src={e.avatar} className="h-full w-full object-cover" alt="" />}
                                    </div>
                                    <button type="button" className="min-w-0 flex-1 truncate text-left text-sm font-bold hover:text-accent"
                                        onClick={() => gmCustom('npc-detail', e.id)}>
                                        {e.name}
                                        {e.vuParLesJoueurs && (
                                            <span className="ml-2 text-ui-10 font-normal text-app-muted">rencontré le {date(e.vuParLesJoueurs.le)}</span>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        aria-pressed={!!e.isVisibleByPlayers}
                                        className={`${petitBouton} ${e.isVisibleByPlayers ? 'border-accent/50 bg-accent/15 text-accent' : ''}`}
                                        onClick={() => toggleEntityVisibility(e.id, scene.id)}
                                    >
                                        {e.isVisibleByPlayers ? <Eye size={12} /> : <EyeOff size={12} />}
                                        {e.isVisibleByPlayers ? 'Montré aux joueurs' : 'Caché aux joueurs'}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </Bloc>
                )}

                {/* Le lieu se PROJETTE (écran par défaut d'Image-OS) ; une battlemap se
                    CHARGE dans Map-OS (L5 — David, 2026-10-12). Rien ne part tout seul. */}
                {(lieu || battlemaps.length > 0) && (
                    <Bloc icone={<MapPin size={14} />} titre="Lieu">
                        <ul className="flex flex-col gap-2">
                            {lieu && (
                                <li className="flex items-center gap-3">
                                    <div className="h-14 w-20 shrink-0 overflow-hidden rounded bg-app-surface-2">
                                        <ResolvedAsset src={lieu.fileUrl} isVideo={lieu.isVideo} className="h-full w-full object-cover" alt="" />
                                    </div>
                                    <span className="min-w-0 flex-1 truncate text-sm font-bold">{lieu.name}</span>
                                    {estUneBattlemap(lieu)
                                        ? <BoutonCharger carte={lieu} />
                                        : <BoutonProjeterSurLEcranParDefaut lieu={lieu} className={petitBouton} />}
                                </li>
                            )}
                            {battlemaps.map(m => (
                                <li key={m.id} className="flex items-center gap-3">
                                    <div className="h-9 w-14 shrink-0 overflow-hidden rounded bg-app-surface-2">
                                        <ResolvedAsset src={m.fileUrl} isVideo={m.isVideo} className="h-full w-full object-cover" alt="" />
                                    </div>
                                    <span className="min-w-0 flex-1 truncate text-sm">
                                        <span className="mr-2 text-ui-10 uppercase tracking-widest text-app-muted">Battlemap</span>{m.name}
                                    </span>
                                    <BoutonCharger carte={m} />
                                </li>
                            ))}
                        </ul>
                    </Bloc>
                )}

                {/* R4 : invoquer une rencontre préparée — Combat-OS s'ouvre sur « Qui entre ? ». */}
                {rencontresDeLaScene.length > 0 && (
                    <Bloc icone={<Swords size={14} />} titre="Rencontres">
                        <ul className="flex flex-col gap-2">
                            {rencontresDeLaScene.map(r => (
                                <li key={r.id} className="flex items-center gap-2">
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-bold">{r.nom}</span>
                                        <span className="block truncate text-ui-11 text-app-muted">{resumeDeLaRencontre(r, nomDuPNJ) || 'vide'}</span>
                                    </span>
                                    <button
                                        type="button" className={petitBouton} disabled={r.lignes.length === 0}
                                        onClick={() => {
                                            fermer();
                                            setActiveModule('combat');
                                            gmCustom('rencontres', { rencontreId: r.id });
                                        }}
                                    >
                                        <Swords size={12} /> Invoquer
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </Bloc>
                )}
            </div>
        </div>
    );
};

/** Charge une battlemap dans Map-OS — allumé si c'est déjà la carte du plateau. */
const BoutonCharger: React.FC<{ carte: AtlasMap }> = ({ carte }) => {
    const setMap = useMapStore(s => s.setMap);
    const chargee = useMapStore(s => s.mapUrl) === carte.fileUrl;
    return (
        <button
            type="button"
            disabled={!carte.fileUrl}
            aria-pressed={chargee}
            className={`${petitBouton} ${chargee ? 'border-accent/50 bg-accent/15 text-accent' : ''}`}
            onClick={() => {
                void setMap(carte.fileUrl, carte.isVideo, carte.name, carte.narrativeDescription);
                gmToast(`« ${carte.name} » chargée dans Map-OS`, 'success');
            }}
        >
            <MapIcon size={12} /> {chargee ? 'Dans Map-OS' : 'Charger dans Map-OS'}
        </button>
    );
};

/**
 * **Le moment de storyboard de la scène — lancé d'ici, en séance** (David,
 * 2026-10-12 : *« si dans la définition d'une scène il y a une séquence du
 * storyboard, cela doit pouvoir être lancé à partir de l'écran de scène »*).
 *
 * Il avait d'abord sa place dans le bloc Musique, sous « Lancer l'ambiance » —
 * or un moment pose aussi la lumière, la carte, l'image, le son et le titre. Il
 * dit donc ce qu'il déclenche, et « Arrêter » referme la parenthèse quand il
 * joue (la musique reste : décision du 2026-09-13).
 */
const MomentDeStoryboard: React.FC<{ scene: Scene }> = ({ scene }) => {
    const moment = useStoryboardStore(s => s.moments.find(m => m.id === scene.momentDeStoryboardId));
    const momentActif = useStoryboardStore(s => s.activeMomentId);
    const triggerMoment = useStoryboardStore(s => s.triggerMoment);
    const arreterLeMoment = useStoryboardStore(s => s.arreterLeMoment);
    if (!moment) return null;
    const actif = momentActif === moment.id;
    const effets = ceQueDeclencheLeMoment(moment);

    return (
        <section className={`flex flex-col gap-2 rounded-xl border p-4 ${actif ? 'border-accent/60 bg-accent/10' : 'border-app-border bg-app-bg/40'}`}>
            {titreDeBloc(<Clapperboard size={14} />, actif ? 'Storyboard — en cours' : 'Storyboard')}
            <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-app-text">{moment.name}</p>
                    {moment.description && <p className="text-ui-11 text-app-muted">{moment.description}</p>}
                    {effets.length > 0 && (
                        <p className="mt-1 flex flex-wrap gap-1">
                            {effets.map(e => (
                                <span key={e} className="rounded border border-app-border px-1.5 py-0.5 text-ui-10 text-app-text/70">{e}</span>
                            ))}
                        </p>
                    )}
                </div>
                {actif ? (
                    <button type="button" className={`${petitBouton} border-accent/50 text-accent`} onClick={arreterLeMoment}>
                        <Square size={12} /> Arrêter
                    </button>
                ) : (
                    <button
                        type="button"
                        className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-ui-11 font-black uppercase tracking-widest text-app-on-accent hover:brightness-110"
                        onClick={() => void triggerMoment(moment.id)}
                    >
                        <Play size={12} /> Lancer
                    </button>
                )}
            </div>
        </section>
    );
};

/** Les idées et les morceaux jouables d'un clic — allumés s'ils jouent. */
const Musique: React.FC<{ scene: Scene }> = ({ scene }) => {
    const playlists = useMusicStore(s => s.playlists);
    const playPad = useMusicStore(s => s.playPad);
    const deckA = useMusicStore(s => s.deckA);
    const deckB = useMusicStore(s => s.deckB);

    const pads = (scene.morceauxIds ?? [])
        .map(id => playlists.flatMap(p => p.pads).find(p => p.id === id))
        .filter((p): p is NonNullable<typeof p> => !!p);
    const joue = (id: string) =>
        (deckA.activePadId === id && deckA.isPlaying) || (deckB.activePadId === id && deckB.isPlaying);

    if (pads.length === 0 && !scene.ideesMusicales?.trim()) return null;

    return (
        <Bloc icone={<Music2 size={14} />} titre="Musique">
            {scene.ideesMusicales?.trim() && <Texte>{scene.ideesMusicales}</Texte>}
            <div className="flex flex-wrap gap-2">
                {pads.map(pad => (
                    <button
                        key={pad.id} type="button"
                        aria-pressed={joue(pad.id)}
                        className={`${petitBouton} ${joue(pad.id) ? 'border-accent/50 bg-accent/15 text-accent' : ''}`}
                        onClick={() => void playPad(pad)}
                    >
                        <Play size={12} /> {pad.label || pad.id}
                    </button>
                ))}
            </div>
        </Bloc>
    );
};

/** La note de la scène, repliée : on la lit quand on en a besoin. */
const NoteObsidian: React.FC<{ chemin?: string }> = ({ chemin }) => {
    const vaultPath = useObsidianStore(s => s.vaultPath);
    const [depliee, setDepliee] = useState(false);
    const [contenu, setContenu] = useState<string | null>(null);

    useEffect(() => {
        if (!depliee || !chemin) return;
        let annule = false;
        void window.appBridge?.obsidian?.readNote?.(chemin, vaultPath).then(texte => {
            if (!annule) setContenu(texte ?? 'Note introuvable dans le coffre.');
        });
        return () => { annule = true; };
    }, [depliee, chemin, vaultPath]);

    if (!chemin) return null;
    const ouvrirDansObsidian = () => {
        const absolu = `${vaultPath.replace(/[\\/]+$/, '')}\\${chemin}`;
        window.appBridge?.web?.openExternal?.(`obsidian://open?path=${encodeURIComponent(absolu)}`);
    };

    return (
        <section className="flex flex-col gap-2 rounded-xl border border-app-border bg-app-bg/40 p-4">
            <div className="flex items-center gap-2">
                <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => setDepliee(d => !d)}>
                    {depliee ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    {titreDeBloc(<FileText size={14} />, `Note — ${nomDeLaNote(chemin)}`)}
                </button>
                <button type="button" className={petitBouton} onClick={ouvrirDansObsidian}>
                    <ExternalLink size={12} /> Ouvrir dans Obsidian
                </button>
            </div>
            {depliee && (contenu === null ? <p className="text-sm text-app-muted">Lecture…</p> : <Texte>{contenu}</Texte>)}
        </section>
    );
};

export default EcranDeLaSceneEnCours;
