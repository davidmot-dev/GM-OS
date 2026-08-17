import React from 'react';
import { Play, Square, Plus, ExternalLink, CheckCircle2, Circle, PauseCircle, ChevronRight, ChevronDown } from 'lucide-react';
import { useSessionOSStore } from '../useSessionOSStore';
import { useMapStore } from '../../map/useMapStore';
import { useStoryboardStore } from '../../storyboard/useStoryboardStore';
import {
    actesOrdonnes, etatDeLaScene, closeSansAvoirEteJouee,
    scenesDansLEtat, scenesACloreAvecLActe, repartirLesScenesPrevues, scenesOrdonnees,
} from '../logic/trame';
import { gmConfirm } from '../../../stores/useModalStore';
import PastilleDePreparation from './trame/PastilleDePreparation';
import type { GameSession } from '../../../types/session.types';
import type { Scene } from '../../../types/trame.types';

/**
 * Où on en est, pendant qu'on joue.
 *
 * **Le chaînon qui manquait, relevé par David le 2026-08-17.** Il déclarait son
 * acte et ses scènes en préparation, lançait la séance — et changeait d'écran
 * vers des vues qui ignoraient l'existence de la trame :
 * `PanneauDeTrameDeSeance` n'était monté que dans `SessionFocusEditor`. *Le plan
 * existait, on le perdait de vue au moment de jouer.*
 *
 * **Ce panneau n'est pas le jumeau de celui de préparation.** L'un coche ce
 * qu'on pense jouer, l'autre ouvre et ferme ce qu'on joue : deux gestes, deux
 * rendus. Ce qu'ils partagent — la lecture de la trame et la pastille — vit dans
 * `logic/trame.ts` et `PastilleDePreparation`, et c'était là le vrai risque de
 * divergence.
 *
 * **Plusieurs scènes peuvent être ouvertes en même temps**, et c'est l'exigence
 * qui a écarté le pointeur unique : le groupe se sépare, deux scènes tournent.
 */
const PanneauDeTrameEnCours: React.FC<{ session: GameSession }> = ({ session }) => {
    const {
        actes, scenes, activeCampaignId, setCurrentView,
        players, entities, atlasMaps,
        ouvrirLaScene, terminerLaScene, creerSceneImprovisee, modifierActe, modifierScene,
    } = useSessionOSStore();
    const setMap = useMapStore(s => s.setMap);
    const { moments, activeMomentId, triggerMoment, arreterLeMoment } = useStoryboardStore();

    /*
      **La troupe de la séance, et pas tous les personnages de la campagne.**
      `sessionEntityIds` porte ceux qui jouent ce soir ; proposer un absent
      reviendrait à laisser marquer présent quelqu'un qui n'est pas à la table.
      Repli sur la campagne entière quand la séance ne déclare personne — sinon
      la fiche n'offrirait rien du tout, et le champ paraîtrait cassé.
    */
    const troupe = React.useMemo(() => {
        const tous = players.flatMap(p => p.characters ?? [])
            .filter(c => c.campaignId === activeCampaignId)
            .map(c => ({ id: c.id, name: c.name }));
        const declares = new Set(session.sessionEntityIds ?? []);
        const presents = tous.filter(c => declares.has(c.id));
        return presents.length > 0 ? presents : tous;
    }, [players, activeCampaignId, session.sessionEntityIds]);

    const pnjDeLaCampagne = React.useMemo(
        () => entities.filter(e => e.campaignId === activeCampaignId).map(e => ({ id: e.id, name: e.name })),
        [entities, activeCampaignId],
    );
    const lieux = React.useMemo(
        () => atlasMaps.filter(m => m.campaignId === activeCampaignId).map(m => ({ id: m.id, name: m.name })),
        [atlasMaps, activeCampaignId],
    );

    /** Le titre qu'on tape pour une scène improvisée. `null` : on n'en crée pas. */
    const [titreImprovise, setTitreImprovise] = React.useState<string | null>(null);

    const acte = actesOrdonnes(actes, activeCampaignId).find(a => a.id === session.acteId);
    const enCours = scenesDansLEtat(scenes, actes, activeCampaignId, 'en-cours');
    const enPause = scenesDansLEtat(scenes, actes, activeCampaignId, 'en-pause');

    /*
      **TOUTES les scènes de l'acte, et pas seulement celles qu'on a cochées.**

      Relevé par David le 2026-08-17, panneau sous les yeux : « je ne vois pas
      les scènes prévues ». La première version ne listait que
      `session.scenesPrevuesIds` — les scènes annoncées en préparation. Un acte
      dont on n'a rien coché n'affichait donc RIEN, et surtout : *on ne pouvait
      démarrer que ce qu'on avait prévu la veille.*

      C'est le contraire de la règle que le panneau de préparation porte déjà —
      *ne pas imposer la linéarité, une partie ne suit jamais le plan.* Ce qui
      était annoncé se signale d'un badge ; ça ne filtre rien.

      S'y ajoutent les scènes prévues venues d'un AUTRE acte : le groupe prend de
      l'avance, on les a cochées, elles doivent rester atteignables.
    */
    const dejaMontrees = new Set([...enCours, ...enPause].map(s => s.id));
    const prevuesIds = new Set(session.scenesPrevuesIds ?? []);
    const { horsActe } = repartirLesScenesPrevues(scenes, session.acteId, [...prevuesIds]);
    const aJouer = [...scenesOrdonnees(scenes, session.acteId), ...horsActe]
        .filter(s => !dejaMontrees.has(s.id));

    /** La cascade se dit avant de tomber — même geste que la suppression d'un acte. */
    const basculerLActe = () => {
        if (!acte) return;
        if (acte.acheve) {
            // Dé-marquer ne ressuscite rien : on ne saurait pas lesquelles.
            modifierActe(acte.id, { acheve: false });
            return;
        }
        const { total, enCours: tournent, jamaisJouees } = scenesACloreAvecLActe(scenes, acte.id);
        if (total === 0) {
            modifierActe(acte.id, { acheve: true });
            return;
        }
        const details = [
            tournent.length > 0 ? `${tournent.length} en cours` : '',
            jamaisJouees.length > 0 ? `${jamaisJouees.length} jamais jouée${jamaisJouees.length > 1 ? 's' : ''}` : '',
        ].filter(Boolean).join(', ');
        gmConfirm(
            `Achever « ${acte.titre} » terminera ses ${total} scène${total > 1 ? 's' : ''}`
            + (details ? ` (${details})` : '') + '. Les scènes ne restent pas ouvertes après leur acte.',
            () => modifierActe(acte.id, { acheve: true }),
        );
    };

    /**
     * Ouvrir une scène amène son décor sur la table.
     *
     * La scène porte déjà son `lieuId` ; le meneur le rechargeait à la main à
     * chaque bascule. **On ne projette rien si la scène ne désigne pas de
     * lieu** — vider l'écran de la table serait pire que de laisser la carte
     * précédente, qui reste au moins un décor plausible.
     */
    const ouvrirEtProjeter = (scene: Scene) => {
        ouvrirLaScene(scene.id, session.id);
        const lieu = scene.lieuId ? atlasMaps.find(m => m.id === scene.lieuId) : undefined;
        if (lieu?.fileUrl) setMap(lieu.fileUrl, lieu.isVideo, lieu.name, lieu.narrativeDescription);
    };

    const improviser = () => {
        const titre = (titreImprovise ?? '').trim();
        if (!titre || !session.acteId) return;
        creerSceneImprovisee(session.acteId, titre, session.id);
        setTitreImprovise(null);
    };

    return (
        /*
          `shrink-0` n'est pas décoratif. L'espace de séance est une colonne
          flex : sans lui, ce panneau se fait comprimer par le double journal qui
          porte `flex-1 min-h-[400px]`, et **son contenu est coupé net sans
          barre de défilement** — David n'a d'abord vu que l'en-tête, puis
          l'en-tête et le titre de section. La barre du groupe, juste au-dessus,
          porte `flex-shrink-0` pour exactement la même raison.
        */
        <div className="glass-bento rounded-3xl border border-app-border/15 p-5 flex flex-col gap-4 shrink-0">
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Trame en cours</p>
                    <p className="text-sm font-bold text-app-text truncate mt-0.5">
                        {acte ? acte.titre : 'Aucun acte annoncé pour cette séance'}
                    </p>
                </div>
                <button
                    onClick={() => setCurrentView('trame')}
                    title="Ouvrir la trame complète"
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-app-text/50 hover:text-app-text transition-all"
                >
                    <ExternalLink size={11} /> Trame
                </button>
            </div>

            {/* Combien de scènes tournent — l'information qu'on cherche d'un coup d'œil
                quand le groupe s'est séparé. */}
            {enCours.length > 0 && (
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/80">
                    {enCours.length} scène{enCours.length > 1 ? 's' : ''} en cours
                </p>
            )}

            {enCours.map(scene => (
                <LigneDeSceneJouee
                    key={scene.id} scene={scene} etat="en-cours"
                    troupe={troupe} pnjDeLaCampagne={pnjDeLaCampagne} lieux={lieux}
                            ambiance={moments.find(m => m.id === scene.momentDeStoryboardId)}
                            momentEnCours={!!scene.momentDeStoryboardId && activeMomentId === scene.momentDeStoryboardId}
                            triggerMoment={triggerMoment} arreterLeMoment={arreterLeMoment}
                    onOuvrir={() => ouvrirEtProjeter(scene)}
                    onTerminer={() => terminerLaScene(scene.id)}
                    onModifier={u => modifierScene(scene.id, u)}
                />
            ))}

            {/* En pause : la séance précédente s'est arrêtée là. Elles repartiront
                seules à la prochaine ouverture de séance, mais on peut les
                reprendre à la main dès maintenant. */}
            {enPause.length > 0 && (
                <div className="flex flex-col gap-1.5 pt-2 border-t border-app-border/15">
                    <p className="text-[10px] font-black uppercase tracking-widest text-app-text/40 px-1">
                        En pause
                    </p>
                    {enPause.map(scene => (
                        <LigneDeSceneJouee
                            key={scene.id} scene={scene} etat="en-pause"
                            troupe={troupe} pnjDeLaCampagne={pnjDeLaCampagne} lieux={lieux}
                            ambiance={moments.find(m => m.id === scene.momentDeStoryboardId)}
                            momentEnCours={!!scene.momentDeStoryboardId && activeMomentId === scene.momentDeStoryboardId}
                            triggerMoment={triggerMoment} arreterLeMoment={arreterLeMoment}
                            onOuvrir={() => ouvrirEtProjeter(scene)}
                            onTerminer={() => terminerLaScene(scene.id)}
                            onModifier={u => modifierScene(scene.id, u)}
                        />
                    ))}
                </div>
            )}

            {aJouer.length > 0 && (
                <div className="flex flex-col gap-1.5 pt-2 border-t border-app-border/15">
                    <p className="text-[10px] font-black uppercase tracking-widest text-app-text/40 px-1">
                        Scènes de l'acte
                    </p>
                    {aJouer.map(scene => (
                        <LigneDeSceneJouee
                            key={scene.id} scene={scene} etat={etatDeLaScene(scene)}
                            prevueCeSoir={prevuesIds.has(scene.id)}
                            troupe={troupe} pnjDeLaCampagne={pnjDeLaCampagne} lieux={lieux}
                            ambiance={moments.find(m => m.id === scene.momentDeStoryboardId)}
                            momentEnCours={!!scene.momentDeStoryboardId && activeMomentId === scene.momentDeStoryboardId}
                            triggerMoment={triggerMoment} arreterLeMoment={arreterLeMoment}
                            onOuvrir={() => ouvrirEtProjeter(scene)}
                            onTerminer={() => terminerLaScene(scene.id)}
                            onModifier={u => modifierScene(scene.id, u)}
                        />
                    ))}
                </div>
            )}

            {enCours.length === 0 && enPause.length === 0 && aJouer.length === 0 && (
                <p className="text-[11px] text-app-text/40 italic px-1 leading-relaxed">
                    {acte
                        ? 'Cet acte n’a encore aucune scène. Une scène improvisée s’ouvre du même geste qu’elle se crée.'
                        : 'Aucun acte annoncé pour cette séance — déclare-le en préparation, ou depuis la trame.'}
                </p>
            )}

            {/*
                **La scène improvisée n'est pas réservée au combat.** Elle naît
                ouverte : on l'improvise parce qu'on y est déjà. Sans acte
                annoncé, elle n'aurait nulle part où se ranger — on le dit au
                lieu de deviner un acte.
            */}
            <div className="pt-2 border-t border-app-border/15">
                {!session.acteId ? (
                    <p className="text-[11px] text-app-text/30 italic px-1">
                        Annonce un acte pour cette séance : une scène improvisée doit pouvoir s'y ranger.
                    </p>
                ) : titreImprovise === null ? (
                    <button
                        onClick={() => setTitreImprovise('')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-accent/30 text-accent text-[10px] font-black uppercase tracking-widest hover:bg-accent/10 transition-all"
                    ><Plus size={14} /> Scène improvisée</button>
                ) : (
                    <input
                        autoFocus
                        value={titreImprovise}
                        onChange={e => setTitreImprovise(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') improviser();
                            if (e.key === 'Escape') setTitreImprovise(null);
                        }}
                        onBlur={improviser}
                        placeholder="Ce qui vient de se passer — Entrée pour ouvrir"
                        className="w-full bg-app-bg/40 px-4 py-2.5 rounded-xl border border-accent/40 text-sm focus:outline-none"
                    />
                )}
            </div>

            {acte && (
                <button
                    onClick={basculerLActe}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        acte.acheve
                            ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                            : 'text-app-text/40 border border-app-border/20 hover:text-app-text'
                    }`}
                >
                    {acte.acheve ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                    {acte.acheve ? 'Acte achevé' : 'Marquer l’acte achevé'}
                </button>
            )}
        </div>
    );
};

/**
 * Une scène et son geste : la commencer, ou la clore.
 *
 * Une scène terminée reste **lisible et barrée** — on n'efface rien. Celle que
 * l'acte a close sans qu'on y soit jamais passé se grise en plus : *les
 * confondre ferait croire à une partie qui n'a pas eu lieu*, et le journal les
 * lirait comme du vécu.
 */
const LigneDeSceneJouee: React.FC<{
    scene: Scene;
    etat: ReturnType<typeof etatDeLaScene>;
    /** Annoncée en préparation. Un repère, jamais un filtre. */
    prevueCeSoir?: boolean;
    /** Les personnages rattachés à la séance — le seul choix qui ait un sens ici. */
    troupe: { id: string; name: string }[];
    pnjDeLaCampagne: { id: string; name: string }[];
    lieux: { id: string; name: string }[];
    /** Le moment de storyboard que la scène désigne, s'il existe encore. */
    ambiance?: { id: string; name: string };
    /** Ce moment tourne-t-il en ce moment ? */
    momentEnCours: boolean;
    triggerMoment: (id: string) => void;
    arreterLeMoment: () => void;
    onOuvrir: () => void;
    onTerminer: () => void;
    onModifier: (updates: Partial<Scene>) => void;
}> = ({
    scene, etat, prevueCeSoir = false, onOuvrir, onTerminer,
    troupe, pnjDeLaCampagne, lieux, onModifier,
    ambiance, momentEnCours, triggerMoment, arreterLeMoment,
}) => {
    const jamaisJouee = closeSansAvoirEteJouee(scene);
    const [depliee, setDepliee] = React.useState(false);
    const presents = scene.personnagesIds ?? [];

    const basculerLePJ = (id: string) => onModifier({
        personnagesIds: presents.includes(id) ? presents.filter(x => x !== id) : [...presents, id],
    });

    const nomsDesPNJ = scene.entiteIds
        .map(id => pnjDeLaCampagne.find(e => e.id === id)?.name)
        .filter(Boolean) as string[];
    const lieu = scene.lieuId ? lieux.find(l => l.id === scene.lieuId)?.name : undefined;

    return (
        <div className={`rounded-xl border transition-colors ${
            etat === 'en-cours'
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : etat === 'terminee'
                    ? 'bg-transparent border-transparent'
                    : 'bg-app-bg/30 border-app-border/20'
        }`}>
        <div className="flex items-center gap-3 px-3 py-2">
            {/*
                Déplier plutôt que changer d'écran. *En pleine partie, on ne
                quitte pas l'espace de séance pour noter trois mots* — et donc
                on ne note pas. L'onglet Trame garde sa fiche complète pour la
                préparation ; ici on ne montre que ce qui sert en jeu.
            */}
            <button
                onClick={() => setDepliee(d => !d)}
                title={depliee ? 'Replier' : 'Qui est là, et ce qui s’y dit'}
                className="shrink-0 p-0.5 rounded text-app-text/30 hover:text-app-text transition-colors"
            >{depliee ? <ChevronDown size={13} /> : <ChevronRight size={13} />}</button>
            <PastilleDePreparation scene={scene} />
            {etat === 'en-pause' && <PauseCircle size={12} className="text-app-text/30 shrink-0" />}
            <span
                className={`flex-1 min-w-0 text-sm truncate ${
                    etat === 'terminee'
                        ? `line-through ${jamaisJouee ? 'text-app-text/20' : 'text-app-text/40'}`
                        : 'text-app-text'
                }`}
                title={jamaisJouee ? 'Close avec son acte, sans avoir été jouée' : scene.titre}
            >
                {scene.titre}
            </span>
            {prevueCeSoir && etat === 'prevue' && (
                <span
                    title="Annoncée en préparation pour cette séance"
                    className="text-[8px] font-black uppercase tracking-widest text-accent/70 shrink-0"
                >prévue</span>
            )}
            {scene.origine === 'improvisee' && (
                <span className="text-[8px] font-black uppercase tracking-widest text-amber-400/70 shrink-0">
                    improvisée
                </span>
            )}
            {etat === 'en-cours' ? (
                <button
                    onClick={onTerminer}
                    title="Terminer la scène"
                    className="shrink-0 p-1.5 rounded-lg text-app-text/40 hover:text-red-300 hover:bg-red-500/10 transition-all"
                ><Square size={13} /></button>
            ) : (
                <button
                    onClick={onOuvrir}
                    title={etat === 'terminee' ? 'Rouvrir cette scène' : 'Commencer la scène'}
                    className="shrink-0 p-1.5 rounded-lg text-app-text/40 hover:text-emerald-300 hover:bg-emerald-500/10 transition-all"
                ><Play size={13} /></button>
            )}
        </div>

        {depliee && (
            <div className="px-3 pb-3 pt-1 flex flex-col gap-3 border-t border-app-border/10">
                {/*
                    **Ce qui s'y joue, en tête.** C'est ce qu'on vient relire
                    quand on déplie une scène en pleine partie — avant de savoir
                    qui est là et bien avant l'ambiance.

                    Affiché et non éditable : le résumé se prépare, il ne
                    s'écrit pas à la table. Les notes du meneur, plus bas, sont
                    là pour ce qu'on ajoute en jouant — et les deux séparés
                    disent lequel est le plan et lequel est le vécu.

                    Rien quand il est vide : une scène improvisée n'en a pas, et
                    un cadre vide serait un reproche adressé à un état normal.
                */}
                {scene.resume.trim().length > 0 && (
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-app-text/40 mb-1.5">
                            Ce qui s'y joue
                        </p>
                        <p className="text-[12px] leading-relaxed text-app-text/80 whitespace-pre-wrap">
                            {scene.resume}
                        </p>
                    </div>
                )}

                {/*
                    **Qui est là.** C'est la moitié manquante des scènes
                    simultanées : le groupe se sépare, deux scènes tournent, et
                    sans ce champ rien ne dit qui est où. On ne propose que la
                    troupe de la séance — inviter un personnage absent ce soir
                    n'aurait aucun sens.
                */}
                <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-app-text/40 mb-1.5">
                        Personnages présents
                    </p>
                    {troupe.length === 0 ? (
                        <p className="text-[11px] text-app-text/30 italic">
                            Aucun personnage rattaché à cette séance.
                        </p>
                    ) : (
                        <div className="flex flex-wrap gap-1.5">
                            {troupe.map(pj => (
                                <button
                                    key={pj.id}
                                    onClick={() => basculerLePJ(pj.id)}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                                        presents.includes(pj.id)
                                            ? 'bg-accent/20 border-accent/50 text-app-text'
                                            : 'bg-app-bg/40 border-app-border/20 text-app-text/40 hover:text-app-text/70'
                                    }`}
                                >{pj.name}</button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Lu, jamais édité ici : ces deux-là se préparent dans la trame. */}
                {(nomsDesPNJ.length > 0 || lieu) && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-app-text/50">
                        {lieu && <span><span className="opacity-50">Lieu </span>{lieu}</span>}
                        {nomsDesPNJ.length > 0 && (
                            <span><span className="opacity-50">PNJ </span>{nomsDesPNJ.join(', ')}</span>
                        )}
                    </div>
                )}

                {/*
                    **L'ambiance se déclenche à la main, jamais toute seule.**

                    La scène nomme son moment depuis le 2026-08-08 — et
                    jusqu'ici PERSONNE ne le déclenchait : le lien comptait dans
                    le taux de préparation, la pastille verdissait, et il fallait
                    aller lancer l'ambiance dans un autre onglet. Troisième lien
                    mort de la trame, après le badge « improvisée ».

                    L'ouverture de la scène ne l'allume pas : *une ambiance se
                    lance quand le meneur juge le moment venu*, pas quand la
                    scène commence. Le moment est une parenthèse — son image
                    prend la place de celle de la scène, et l'arrêt la rend.
                */}
                {ambiance && (
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-app-text/40">
                            Ambiance
                        </span>
                        <span className="text-[11px] text-app-text/60 truncate flex-1 min-w-0">
                            {ambiance.name}
                        </span>
                        <button
                            onClick={() => (momentEnCours ? arreterLeMoment() : triggerMoment(ambiance.id))}
                            title={momentEnCours
                                ? 'Arrêter l’ambiance — l’image de la scène revient'
                                : 'Lancer l’ambiance — son image remplace celle de la scène'}
                            className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                                momentEnCours
                                    ? 'bg-accent/20 border-accent/50 text-accent'
                                    : 'bg-app-bg/40 border-app-border/20 text-app-text/50 hover:text-app-text'
                            }`}
                        >
                            {momentEnCours ? <Square size={11} /> : <Play size={11} />}
                            {momentEnCours ? 'En cours' : 'Lancer'}
                        </button>
                    </div>
                )}

                {/*
                    Les notes du meneur, éditables en séance. C'est le même champ
                    que celui de la trame — deux zones de notes pour une scène
                    auraient fini par se contredire, et on ne saurait laquelle le
                    journal doit lire.
                */}
                <textarea
                    value={scene.notesDuMeneur ?? ''}
                    onChange={e => onModifier({ notesDuMeneur: e.target.value })}
                    rows={3}
                    placeholder="Ce qui s’y passe — notes du meneur"
                    className="w-full bg-app-bg/40 px-3 py-2 rounded-lg border border-app-border/20 text-[12px] leading-relaxed focus:border-accent/50 outline-none resize-y"
                />
            </div>
        )}
        </div>
    );
};

export default PanneauDeTrameEnCours;
