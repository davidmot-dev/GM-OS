import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionOSStore } from '../useSessionOSStore';
import { 
    Layers, 
    RefreshCw, 
    RotateCcw, 
    Trash2, 
    ChevronLeft,
    Infinity as InfinityIcon,
    Eye,
    Hand,
    Lock,
    MonitorUp,
} from 'lucide-react';
import { useDeckPlayer } from '../hooks/useDeckPlayer';
import { DeckInterpreter } from '../logic/DeckInterpreter';
import { Panneau, Etiquette } from '../../../components/socle';

const DeckPlayer: React.FC = () => {
    const { t } = useTranslation();
    const { setCurrentView, decks, updateDeck } = useSessionOSStore();
    const {
        propositionsEnAttente,
        accepterLeDonDeCarte,
        refuserLeDonDeCarte,
        porteursPossibles,
        mainsOuvertes,
        handleGarder,
        handleDonner,
        handleRetourner,
        handleJouer,
        handleRendre,
        activeDeck,
        activeState,
        activeDeckId,
        isFlipped,
        drawCount,
        cardBackUrl,
        currentCardUrl,
        aspectRatio,
        isProjecting,
        setActiveDeckId,
        handleFlip,
        handleDraw,
        handleDiscard,
        handleShuffle,
        toggleProjection
    } = useDeckPlayer();

    if (!activeDeck || !activeState) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-app-text/20 gap-4">
                <Layers size={48} strokeWidth={1} />
                <p className="text-sm font-black uppercase tracking-widest">{t('modules:session.deck_module.player.empty_state')}</p>
                <button 
                    type="button"
                    onClick={() => setCurrentView('deck-library')} 
                    className="px-6 py-2 bg-gm-gold/10 text-gm-gold border border-gm-gold/20 rounded-xl text-ui-10 font-black uppercase tracking-widest hover:bg-gm-gold/20 transition-all focus:outline-none focus:ring-2 focus:ring-gm-gold/40"
                >
                    {t('modules:session.deck_module.player.go_to_library')}
                </button>
            </div>
        );
    }

    const restantes = activeState.remainingIndices.length;
    const derniereDefaussee = activeState.discardedIndices[activeState.discardedIndices.length - 1];
    const urlDeLaDefausse = derniereDefaussee !== undefined
        ? DeckInterpreter.getCardImageUrl(activeDeck.folderPath, derniereDefaussee, activeDeck)
        : null;
    const nomDeLaCarte = (idx: number) => DeckInterpreter.getCardMetadata(activeDeck, idx)?.name
        ?? t('modules:session.deck_module.player.projection.card_name_fallback', { idx });
    const cartesEnMain = mainsOuvertes.flatMap(main => main.cartes.map(carte => ({ main, carte })));

    const titreDeTas = (numero: number, titre: string, aside?: React.ReactNode) => (
        <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-app-text">
                <span className="mr-2 font-mono text-ui-11 text-accent">{numero}</span>{titre}
            </h3>
            {aside}
        </div>
    );

    return (
        <div className="flex h-full w-full flex-col overflow-hidden bg-app-bg">
            {/* L'en-tête : le paquet, son système, ce qu'il reste ; les autres paquets ; la projection */}
            <header className="flex flex-wrap items-end justify-between gap-4 border-b border-app-border bg-app-surface/40 px-6 py-4 shrink-0">
                <div className="min-w-0">
                    <button
                        type="button"
                        onClick={() => setCurrentView('deck-library')}
                        className="flex items-center gap-1 text-ui-10 font-black uppercase tracking-widest text-app-muted transition-colors hover:text-accent"
                    >
                        <ChevronLeft size={14} />{t('modules:session.deck_module.player.back_to_library')}
                    </button>
                    <h1 className="mt-1 font-display text-2xl font-bold leading-tight text-app-text">
                        Deck-OS <span className="text-gm-gold">//</span> {activeDeck.name}
                    </h1>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <Etiquette>{activeDeck.systemId}</Etiquette>
                        <Etiquette ton="accent">{t('modules:session.deck_module.player.agencement.restantes', { restantes, total: activeDeck.cardCount })}</Etiquette>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {decks.length > 1 && decks.map(d => (
                        <button
                            key={d.id}
                            type="button"
                            onClick={() => setActiveDeckId(d.id)}
                            className={`rounded-lg border px-3 py-2 text-ui-10 font-black uppercase tracking-widest transition-all ${
                                activeDeckId === d.id
                                ? 'border-gm-gold bg-gm-gold text-app-bg'
                                : 'border-app-border bg-app-surface text-app-muted hover:text-app-text'
                            }`}
                        >
                            {d.name}
                        </button>
                    ))}
                    {/* `gm-blue` n'existe pas dans la palette : la projection
                        active ne se colorait pas. Elle prend l'accent. */}
                    <button
                        type="button"
                        onClick={toggleProjection}
                        title={isProjecting ? t('modules:session.deck_module.player.stop_projection') : t('modules:session.deck_module.player.start_projection')}
                        className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-ui-10 font-black uppercase tracking-widest transition-all ${
                            isProjecting
                            ? 'border-accent bg-accent text-app-on-accent'
                            : 'border-app-border bg-app-surface text-app-muted hover:border-accent/50 hover:text-accent'
                        }`}
                    >
                        {isProjecting ? <Eye size={14} className="animate-pulse" /> : <MonitorUp size={14} />}
                        {isProjecting ? t('modules:session.deck_module.player.projection_active') : t('modules:session.deck_module.player.start_projection')}
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="flex flex-col gap-4 p-5">
                    {/* Les gestes du paquet, et sa règle de pioche */}
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={handleDraw}
                            disabled={restantes === 0}
                            className="flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-ui-10 font-black uppercase tracking-widest text-app-on-accent transition-all hover:brightness-110 disabled:opacity-30"
                        >
                            <RefreshCw size={14} />{t('modules:session.deck_module.player.draw_btn')}
                        </button>
                        <button
                            type="button"
                            onClick={handleDiscard}
                            disabled={activeState.currentCardIndex === null}
                            className="flex items-center gap-2 rounded-lg border border-app-border bg-app-surface px-4 py-3 text-ui-10 font-black uppercase tracking-widest text-app-text transition-all hover:border-etat-danger/50 hover:text-etat-danger disabled:opacity-30"
                        >
                            <Trash2 size={14} />{t('modules:session.deck_module.player.discard_btn')}
                        </button>
                        {/*
                          **Garder la carte tirée** — le quatrième tas, décidé
                          le 2026-08-30. On choisit d'abord à qui elle va : le
                          meneur, ou un personnage de la campagne ouverte. Une
                          carte gardée arrive **face cachée**, parce que
                          l'inverse ne se rattrape pas — on peut toujours la
                          retourner, on ne peut pas la faire oublier.
                        */}
                        <label className={`flex items-center gap-2 rounded-lg border border-app-border bg-app-surface px-3 py-2 ${activeState.currentCardIndex === null ? 'opacity-30' : ''}`}>
                            <Hand size={14} className="text-app-muted" />
                            <select
                                value=""
                                disabled={activeState.currentCardIndex === null}
                                onChange={(e) => handleGarder(e.target.value === 'mj' ? null : e.target.value)}
                                title={t('modules:session.deck_module.player.hands.keep')}
                                aria-label={t('modules:session.deck_module.player.hands.keep')}
                                className="cursor-pointer bg-transparent text-ui-10 font-black uppercase tracking-widest text-app-text outline-none"
                            >
                                <option value="">{t('modules:session.deck_module.player.hands.keep')}</option>
                                {porteursPossibles.map(p => (
                                    <option key={p.id ?? 'mj'} value={p.id ?? 'mj'} className="bg-app-bg text-app-text">
                                        {p.nom}{p.joueur ? ` · ${p.joueur}` : ''}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <button
                            type="button"
                            onClick={handleShuffle}
                            className="flex items-center gap-2 rounded-lg border border-app-border bg-app-surface px-4 py-3 text-ui-10 font-black uppercase tracking-widest text-app-text transition-all hover:border-gm-violet/50 hover:text-gm-violet"
                        >
                            <RotateCcw size={14} />{t('modules:session.deck_module.player.shuffle_btn')}
                        </button>

                        {/* Standard / Oracle en bascule : la règle du paquet, à
                            portée de la main pendant qu'on joue. */}
                        <div className="ml-auto flex rounded-lg border border-app-border bg-app-bg/40 p-1">
                            {([true, false] as const).map(defausse => (
                                <button
                                    key={String(defausse)}
                                    type="button"
                                    onClick={() => updateDeck(activeDeck.id, { useDiscard: defausse })}
                                    title={defausse ? t('modules:session.deck_module.player.discard_mode_tooltip') : t('modules:session.deck_module.player.oracle_mode_tooltip')}
                                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-ui-10 font-black uppercase tracking-widest transition-all ${
                                        activeDeck.useDiscard === defausse ? 'bg-accent text-app-on-accent' : 'text-app-muted hover:text-app-text'
                                    }`}
                                >
                                    {defausse ? <Trash2 size={12} /> : <InfinityIcon size={12} />}
                                    {defausse ? t('modules:session.deck_module.player.mode_standard') : t('modules:session.deck_module.player.mode_oracle')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Les trois tas, d'un coup d'œil */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,1fr)]">
                        <Panneau className="flex flex-col">
                            {titreDeTas(1, t('modules:session.deck_module.player.draw_pile'), <Etiquette>{restantes}</Etiquette>)}
                            <div className="flex flex-1 flex-col items-center gap-3 px-4 pb-4">
                                <button
                                    type="button"
                                    className={`relative w-full max-w-[12rem] transition-all ${restantes > 0 ? 'cursor-pointer hover:scale-[1.03] active:scale-95' : 'cursor-not-allowed opacity-30'}`}
                                    onClick={() => restantes > 0 && handleDraw()}
                                    title={t('modules:session.deck_module.player.draw_card_tooltip')}
                                    disabled={restantes === 0}
                                    style={{ aspectRatio }}
                                >
                                    {restantes > 2 && <span className="absolute inset-0 translate-x-1 translate-y-1 rounded-xl border border-app-border bg-app-surface-2" />}
                                    <img src={`/${cardBackUrl}`} alt={t('modules:session.deck_module.player.card_back')} className="relative h-full w-full rounded-xl border border-app-border object-cover shadow-xl" />
                                </button>
                                <div className="w-full">
                                    <div className="flex items-baseline justify-between text-ui-10 font-black uppercase tracking-widest text-app-muted">
                                        <span>{t('modules:session.deck_module.player.agencement.reserve')}</span>
                                        <span className="font-display text-lg text-app-text">{restantes}</span>
                                    </div>
                                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-app-bg">
                                        <div className="h-full bg-accent" style={{ width: `${activeDeck.cardCount ? (restantes / activeDeck.cardCount) * 100 : 0}%` }} />
                                    </div>
                                </div>
                            </div>
                        </Panneau>

                        <Panneau className={`flex flex-col ${currentCardUrl ? 'border-accent/50' : ''}`}>
                            {titreDeTas(2, t('modules:session.deck_module.player.agencement.carte_tiree'),
                                activeState.currentCardIndex !== null && <Etiquette ton="accent">{t('modules:session.deck_module.player.agencement.numero', { n: activeState.currentCardIndex, total: activeDeck.cardCount })}</Etiquette>)}
                            <div className="flex flex-1 flex-col items-center gap-3 px-4 pb-4">
                                {currentCardUrl ? (
                                    <button
                                        type="button"
                                        key={`card-${drawCount}`}
                                        className="card-perspective animate-glide-card w-full max-w-[20rem] cursor-pointer"
                                        style={{ aspectRatio }}
                                        onClick={() => handleFlip()}
                                        title={t('modules:session.deck_module.player.flip_card_tooltip')}
                                    >
                                        <div className={`card-inner h-full w-full relative ${isFlipped ? 'card-flipped' : ''}`}>
                                            <div className="card-face absolute inset-0 overflow-hidden rounded-2xl border border-app-border bg-app-bg shadow-2xl">
                                                <img src={`/${currentCardUrl}`} alt={t('modules:session.deck_module.player.card_label')} className="h-full w-full object-cover" />
                                            </div>
                                            <div className="card-face card-back absolute inset-0 overflow-hidden rounded-2xl border border-app-border bg-app-bg shadow-2xl">
                                                <img src={`/${cardBackUrl}`} alt={t('modules:session.deck_module.player.card_back')} className="h-full w-full object-cover grayscale opacity-40" />
                                            </div>
                                        </div>
                                    </button>
                                ) : (
                                    <div
                                        className="flex w-full max-w-[20rem] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-app-border text-app-subtle"
                                        style={{ aspectRatio }}
                                    >
                                        <Layers size={48} strokeWidth={1} />
                                        <span className="text-xs font-bold uppercase tracking-[0.2em]">{t('modules:session.deck_module.player.draw_pile_empty_hint')}</span>
                                    </div>
                                )}
                                {activeState.currentCardIndex !== null && (
                                    <div className="text-center">
                                        <p className="font-display text-base font-bold text-app-text">{nomDeLaCarte(activeState.currentCardIndex)}</p>
                                        <p className="text-ui-10 text-app-muted">{t('modules:session.deck_module.player.flip_card_tooltip')}</p>
                                    </div>
                                )}
                            </div>
                        </Panneau>

                        <Panneau className="flex flex-col">
                            {titreDeTas(3, t('modules:session.deck_module.player.discard_pile'), <Etiquette ton={activeState.discardedIndices.length ? 'danger' : 'neutre'}>{activeState.discardedIndices.length}</Etiquette>)}
                            <div className="flex flex-1 flex-col items-center gap-3 px-4 pb-4">
                                {urlDeLaDefausse ? (
                                    <img
                                        src={`/${urlDeLaDefausse}`}
                                        alt={nomDeLaCarte(derniereDefaussee!)}
                                        className="w-full max-w-[12rem] rounded-xl border border-app-border object-cover opacity-70 grayscale-[0.4]"
                                        style={{ aspectRatio }}
                                    />
                                ) : (
                                    <div className="flex w-full max-w-[12rem] items-center justify-center rounded-xl border border-dashed border-app-border text-app-subtle" style={{ aspectRatio }}>
                                        <Trash2 size={32} strokeWidth={1} />
                                    </div>
                                )}
                                <p className="text-center text-xs text-app-muted">
                                    {derniereDefaussee !== undefined
                                        ? t('modules:session.deck_module.player.agencement.derniere', { nom: nomDeLaCarte(derniereDefaussee) })
                                        : activeDeck.useDiscard
                                            ? t('modules:session.deck_module.player.agencement.defausse_vide')
                                            : t('modules:session.deck_module.player.oracle_mode_tooltip')}
                                </p>
                            </div>
                        </Panneau>
                    </div>

                    {/*
                      **Les propositions en attente.** Le destinataire tranche, mais le
                      meneur doit pouvoir trancher aussi : un joueur parti de table ne
                      doit pas bloquer une carte pendant tout un combat.
                    */}
                    {propositionsEnAttente.length > 0 && (
                        <Panneau className="border-accent/40 px-4 py-3">
                            {propositionsEnAttente.map(d => (
                                <div key={d.id} className="flex flex-wrap items-center gap-4 py-1.5">
                                    <span className="text-xs text-app-text">
                                        <strong>{d.deNom}</strong> propose{' '}
                                        <strong className="text-gm-gold">{d.nomDeLaCarte}</strong> à{' '}
                                        <strong>{d.versNom}</strong>
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => accepterLeDonDeCarte(d.id)}
                                            className="rounded-lg bg-gm-gold px-3 py-1 text-ui-9 font-black uppercase tracking-widest text-app-bg"
                                        >
                                            {t('modules:session.deck_module.player.hands.accept')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => refuserLeDonDeCarte(d.id)}
                                            className="rounded-lg border border-app-border px-3 py-1 text-ui-9 font-black uppercase tracking-widest text-app-muted hover:text-app-text"
                                        >
                                            {t('modules:session.deck_module.player.hands.refuse')}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </Panneau>
                    )}

                    {/*
                      **Les cartes tenues — le quatrième tas.** Chaque carte dit qui
                      la tient, ce que la table en sait, et ses quatre gestes. *La
                      question posée en séance est « qui a quoi », et non « combien
                      de cartes sont sorties ».*
                    */}
                    <Panneau>
                        {titreDeTas(4, t('modules:session.deck_module.player.hands.title'), cartesEnMain.length > 0 && <Etiquette>{cartesEnMain.length}</Etiquette>)}
                        <div className="grid grid-cols-1 gap-3 px-4 pb-4 sm:grid-cols-2 xl:grid-cols-3">
                            {cartesEnMain.map(({ main, carte }) => {
                                const scellee = carte.face === 'scellee';
                                return (
                                    <div key={carte.index} className="flex gap-3 rounded-lg border border-app-border bg-app-bg/40 p-3">
                                        {/*
                                          Le meneur voit toujours la carte, même sous
                                          scellé : c'est lui qui arbitre. Le voile dit
                                          seulement ce que la table, elle, ne voit pas.
                                        */}
                                        <img
                                            src={scellee ? `/${cardBackUrl}` : `/${carte.url}`}
                                            alt={carte.nomDeLaCarte}
                                            className={`h-28 shrink-0 rounded-md border object-cover ${scellee ? 'border-app-border opacity-60' : 'border-gm-gold/50'}`}
                                            style={{ aspectRatio }}
                                        />
                                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                                            <Etiquette ton={main.porteur === null ? 'alerte' : 'succes'} className="self-start">{main.nom}</Etiquette>
                                            <p className="truncate text-sm font-black uppercase text-app-text" title={carte.nomDeLaCarte}>{carte.nomDeLaCarte}</p>
                                            <p className={`flex items-start gap-1.5 text-ui-10 font-bold ${scellee ? 'text-etat-alerte' : 'text-gm-cyan'}`}>
                                                {scellee ? <Lock size={11} className="mt-0.5 shrink-0" /> : <Eye size={11} className="mt-0.5 shrink-0" />}
                                                {scellee ? t('modules:session.deck_module.player.hands.hidden') : t('modules:session.deck_module.player.hands.shown')}
                                            </p>
                                            <div className="mt-auto grid grid-cols-2 gap-1.5">
                                                <select
                                                    value=""
                                                    onChange={(e) => handleDonner(carte.index, e.target.value === 'mj' ? null : e.target.value)}
                                                    title={t('modules:session.deck_module.player.hands.give')}
                                                    aria-label={t('modules:session.deck_module.player.hands.give')}
                                                    className="cursor-pointer rounded-md border border-app-border bg-app-surface px-2 py-1.5 text-ui-9 font-black uppercase tracking-widest text-app-text outline-none"
                                                >
                                                    <option value="">{t('modules:session.deck_module.player.hands.give')}…</option>
                                                    {porteursPossibles
                                                        .filter(p => p.id !== main.porteur)
                                                        .map(p => (
                                                            <option key={p.id ?? 'mj'} value={p.id ?? 'mj'} className="bg-app-bg text-app-text">{p.nom}</option>
                                                        ))}
                                                </select>
                                                {/* L'infobulle et le libellé disent l'action, pas
                                                    l'état : un libellé qui décrit l'état ne dit
                                                    jamais ce qu'un clic va produire. */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRetourner(carte.index)}
                                                    className="rounded-md border border-app-border px-2 py-1.5 text-ui-9 font-black uppercase tracking-widest text-gm-gold transition-all hover:border-gm-gold/50"
                                                >
                                                    {scellee ? t('modules:session.deck_module.player.agencement.reveler') : t('modules:session.deck_module.player.agencement.resceller')}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleJouer(carte.index)}
                                                    className="rounded-md bg-accent px-2 py-1.5 text-ui-9 font-black uppercase tracking-widest text-app-on-accent transition-all hover:brightness-110"
                                                >
                                                    {t('modules:session.deck_module.player.hands.play')}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRendre(carte.index)}
                                                    className="rounded-md border border-app-border px-2 py-1.5 text-ui-9 font-black uppercase tracking-widest text-app-muted transition-all hover:text-app-text"
                                                >
                                                    {t('modules:session.deck_module.player.hands.return')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {cartesEnMain.length === 0 && <p className="text-xs italic text-app-subtle">{t('modules:session.deck_module.player.agencement.aucune_en_main')}</p>}
                        </div>
                    </Panneau>
                </div>
            </div>
        </div>
    );
};

export default DeckPlayer;
