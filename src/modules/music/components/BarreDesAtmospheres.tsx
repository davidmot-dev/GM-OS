import React from 'react';
import { Plus, Music, CloudSnow, Sword, Skull, Beer, StopCircle, Keyboard, Activity, Globe, Bookmark, Unlink } from 'lucide-react';
import { useMusicStore } from '../useMusicStore';
import { usePlaylistsVisibles } from '../usePlaylistsVisibles';
import { musicEngine } from '../MusicEngine';
import { gmPrompt, gmConfirm } from '../../../stores/useModalStore';

/**
 * **La barre d'outils de la Musique** — refonte, phase 4, L2, étape 2
 * (2026-10-02). Elle reprend la moitié gauche de l'ancien `MusicHeader` : les
 * atmosphères, leur rattachement, Key learn, la relance du moteur et l'arrêt.
 *
 * Le choix de la sortie et la réinitialisation sont passés au panneau de
 * réglages (`ReglagesDeLaMusique`) : la maquette retenue les montrait **deux
 * fois**, en haut et dans le panneau — *un réglage qu'on trouve à deux
 * endroits finit par en avoir deux valeurs dans la tête du meneur.*
 */
const BarreDesAtmospheres: React.FC<{ aLaTable?: boolean }> = ({ aLaTable = false }) => {
    const {
        setActivePlaylistId,
        addPlaylist,
        removePlaylist,
        renamePlaylist,
        assignerLaPlaylist,
        stopAll,
        isKeyLearnActive,
        toggleKeyLearn,
    } = useMusicStore();

    /*
      **Les onglets ne montrent plus toute la bibliothèque** — seulement les
      atmosphères de la campagne ouverte, les communes, et les orphelines.
      Le tri et la re-sélection viennent d'un seul endroit : voir
      `usePlaylistsVisibles`.
    */
    const { classees, visibles, active, campagneId } = usePlaylistsVisibles();
    const currentId = active?.id;

    const getIcon = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('wood') || n.includes('forest') || n.includes('snow')) return <CloudSnow size={12} />;
        if (n.includes('orc') || n.includes('battle') || n.includes('combat')) return <Sword size={12} />;
        if (n.includes('abyss') || n.includes('skull') || n.includes('death')) return <Skull size={12} />;
        if (n.includes('tavern') || n.includes('inn') || n.includes('city')) return <Beer size={12} />;
        return <Music size={12} />;
    };

    /*
      Un seul parcours d'onglets, avec le genre porté à côté : sans campagne
      ouverte il n'y a rien à distinguer, et trois listes rendues séparément
      auraient trois fois la même trentaine de lignes de classes.
    */
    type Genre = 'libre' | 'campagne' | 'commune' | 'orpheline';
    const onglets: { p: typeof visibles[number]; genre: Genre }[] = campagneId === null
        ? visibles.map(p => ({ p, genre: 'libre' as const }))
        : [
            ...classees.deLaCampagne.map(p => ({ p, genre: 'campagne' as const })),
            ...classees.communes.map(p => ({ p, genre: 'commune' as const })),
            ...classees.orphelines.map(p => ({ p, genre: 'orpheline' as const })),
        ];

    const infobulleDuGenre: Record<Genre, string> = {
        libre: 'Aucune campagne ouverte — toute la bibliothèque est visible',
        campagne: 'Atmosphère de cette campagne',
        commune: 'Atmosphère commune — visible dans toutes les campagnes',
        orpheline: 'Rattachée à une campagne qui n’existe plus. Rendez-la commune ou rattachez-la.',
    };

    /*
      **Le rattachement de l'atmosphère sélectionnée.** Un aller-retour : la
      rendre commune, ou la rattacher à la campagne ouverte. Rien d'autre —
      lier une atmosphère à une campagne qu'on ne joue pas la ferait
      disparaître de l'écran dans le même geste.

      **C'était un bouton-bascule, et David ne l'a pas vu.** Il affichait l'état
      courant et faisait l'inverse au clic ; dans l'état « commune » il était
      gris, donc impossible à distinguer d'une étiquette d'état. On regarde un
      badge, on ne clique pas dessus.

      Deux boutons montrent l'état ET l'action au même endroit : celui qui est
      allumé dit où l'on est, l'autre dit où l'on peut aller. *Un bouton dont
      le libellé décrit l'état ne dit jamais ce qu'un clic va produire.*
    */
    const estCommune = active ? (active.campagneId ?? null) === null : false;
    const hauteur = aLaTable ? 'min-h-11' : 'min-h-9';

    return (
        <div className="flex w-full flex-wrap items-center gap-2">
            {/* Les atmosphères */}
            <div className={`flex items-center flex-wrap gap-1 bg-app-surface/40 p-1 rounded-xl border border-app-border/50 ${hauteur}`}>
                {onglets.length === 0 && (
                    <span className="px-4 py-2 text-ui-9 font-black uppercase tracking-widest text-app-subtle">
                        Aucune atmosphère ici
                    </span>
                )}
                {onglets.map(({ p, genre }, rang) => (
                    <React.Fragment key={p.id}>
                        {/* Le trait ne sépare que des genres différents. */}
                        {rang > 0 && onglets[rang - 1].genre !== genre && (
                            <div className="w-px self-stretch my-1 mx-1.5 bg-app-border/60 shrink-0" />
                        )}
                        <button
                            onClick={() => setActivePlaylistId(p.id)}
                            onDoubleClick={() => gmPrompt(`Renommer "${p.name}" :`, p.name, (newName) => {
                                if (newName && newName.trim()) renamePlaylist(p.id, newName.trim());
                            })}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                gmConfirm(`Supprimer "${p.name}" ?`, () => removePlaylist(p.id), () => {}, "Supprimer", "Annuler");
                            }}
                            aria-pressed={currentId === p.id}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-ui-9 font-black uppercase tracking-widest transition-all ${currentId === p.id
                                ? 'bg-accent text-app-on-accent shadow-glow-accent'
                                : 'text-app-muted hover:text-app-text hover:bg-app-surface/60'}`}
                            title={`${infobulleDuGenre[genre]}\nDouble-clic pour renommer, Clic-droit pour supprimer`}
                        >
                            {getIcon(p.name)}
                            <span>{p.name}</span>
                            {genre === 'commune' && <Globe size={9} className="opacity-50 shrink-0" />}
                            {genre === 'orpheline' && <Unlink size={9} className="text-etat-alerte shrink-0" />}
                        </button>
                    </React.Fragment>
                ))}
                <button
                    onClick={() => gmPrompt("Nom de l'atmosphère :", "", (n) => n && addPlaylist(n, campagneId))}
                    title={campagneId
                        ? "Nouvelle atmosphère, rattachée à la campagne ouverte"
                        : "Nouvelle atmosphère commune (aucune campagne ouverte)"}
                    aria-label="Nouvelle atmosphère"
                    className="size-7 shrink-0 flex items-center justify-center rounded-lg border border-dashed border-app-border text-app-subtle hover:text-accent hover:border-accent/50 transition-all"
                >
                    <Plus size={13} />
                </button>
            </div>

            {/*
              **Le rattachement de l'atmosphère sélectionnée.**

              Sans campagne ouverte, il n'y a rien à rattacher *à* quoi
              que ce soit : le bouton disparaît plutôt que de proposer
              un geste sans effet. — David, 2026-08-30.
            */}
            {campagneId !== null && active && (
                <div className={`flex items-center bg-app-surface/40 p-1 rounded-xl border border-app-border/50 ${hauteur}`}>
                    {([
                        { pour: null, icone: <Globe size={11} />, texte: 'Commune', actif: estCommune },
                        { pour: campagneId, icone: <Bookmark size={11} />, texte: 'Cette campagne', actif: !estCommune },
                    ] as const).map(({ pour, icone, texte, actif }) => (
                        <button
                            key={texte}
                            onClick={() => assignerLaPlaylist(active.id, pour)}
                            aria-pressed={actif}
                            title={actif
                                ? `"${active.name}" est déjà ${pour === null ? 'commune' : 'rattachée à cette campagne'}`
                                : pour === null
                                    ? `Rendre "${active.name}" commune — elle apparaîtra dans toutes les campagnes`
                                    : `Rattacher "${active.name}" à la campagne ouverte — elle n'apparaîtra plus ailleurs`}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-ui-8 font-black uppercase tracking-widest transition-all ${actif
                                ? 'bg-accent text-app-on-accent shadow-glow-accent'
                                : 'text-app-subtle hover:text-app-text hover:bg-app-surface/60'}`}
                        >
                            {icone}
                            <span>{texte}</span>
                        </button>
                    ))}
                </div>
            )}

            <div className="ml-auto flex items-center gap-2">
                <button
                    onClick={toggleKeyLearn}
                    aria-pressed={isKeyLearnActive}
                    title="Assigner une touche du clavier à une pastille : cliquer la pastille, puis la touche"
                    className={`flex items-center gap-2 px-3 rounded-xl border text-ui-8 font-black uppercase tracking-widest transition-all ${hauteur} ${isKeyLearnActive
                        ? 'bg-gm-cyan/15 border-gm-cyan text-gm-cyan shadow-glow-cyan'
                        : 'bg-app-surface/40 border-app-border/50 text-app-muted hover:text-app-text'}`}
                >
                    <Keyboard size={12} />
                    <span>Key learn</span>
                </button>
                <button
                    onClick={async () => {
                        await musicEngine.resume();
                        const gWin = window as unknown as { useToastStore?: { getState: () => { gmToast: (t: string, m: string) => void } } };
                        if (gWin.useToastStore) gWin.useToastStore.getState().gmToast('info', 'Moteur Audio relancé !');
                    }}
                    title="Forcer la reprise du moteur audio (en cas de blocage)"
                    aria-label="Relancer le moteur audio"
                    className={`aspect-square flex items-center justify-center rounded-xl border bg-accent/10 border-accent/20 text-accent hover:bg-accent hover:text-app-on-accent transition-all active:scale-95 ${hauteur}`}
                >
                    <Activity size={14} />
                </button>
                <button
                    onClick={() => stopAll()}
                    title="Arrêt brutal de toutes les pistes"
                    className={`flex items-center gap-2 px-3 rounded-xl border bg-etat-danger/10 border-etat-danger/30 text-etat-danger text-ui-8 font-black uppercase tracking-widest hover:bg-etat-danger hover:text-app-bg transition-all active:scale-95 ${hauteur}`}
                >
                    <StopCircle size={14} />
                    <span>Tout arrêter</span>
                </button>
            </div>
        </div>
    );
};

export default BarreDesAtmospheres;
