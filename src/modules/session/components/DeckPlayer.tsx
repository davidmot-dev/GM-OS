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
    EyeOff,
    Hand
} from 'lucide-react';
import { useDeckPlayer } from '../hooks/useDeckPlayer';

const DeckPlayer: React.FC = () => {
    const { t } = useTranslation();
    const { setCurrentView, decks } = useSessionOSStore();
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
            <div className="flex flex-col items-center justify-center h-full text-white/20 gap-4">
                <Layers size={48} strokeWidth={1} />
                <p className="text-sm font-black uppercase tracking-widest">{t('modules:session.deck_module.player.empty_state')}</p>
                <button 
                    type="button"
                    onClick={() => setCurrentView('deck-library')} 
                    className="px-6 py-2 bg-gm-gold/10 text-gm-gold border border-gm-gold/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gm-gold/20 transition-all focus:outline-none focus:ring-2 focus:ring-gm-gold/40"
                >
                    {t('modules:session.deck_module.player.go_to_library')}
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full bg-[#0a0a0c] overflow-hidden p-8 gap-8">
            {/* Header / Selector */}
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button 
                        type="button"
                        onClick={() => setCurrentView('deck-library')}
                        title={t('modules:session.deck_module.player.back_to_library')}
                        className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all focus:outline-none"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="h-8 w-px bg-white/10" />
                    <div>
                        <h1 className="text-xs font-black uppercase tracking-[0.2em] text-white/80 flex items-center gap-2">
                             Deck <span className="text-gm-gold">//</span> {activeDeck.name}
                        </h1>
                        <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest mt-0.5">
                            {activeDeck.format} — {activeDeck.orientation} — {activeDeck.systemId}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button 
                        type="button"
                        onClick={() => setCurrentView('deck-library')}
                        className="mr-4 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all bg-white/5 text-white/40 border border-white/5 hover:bg-white/10 hover:text-white flex items-center gap-2 focus:outline-none"
                    >
                        <Layers size={14} /> {t('modules:session.deck_module.player.library')}
                    </button>

                    {decks.map(d => (
                        <button
                            key={d.id}
                            type="button"
                            onClick={() => setActiveDeckId(d.id)}
                            className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border focus:outline-none ${
                                activeDeckId === d.id 
                                ? 'bg-gm-gold text-black border-gm-gold shadow-glow-gold/20' 
                                : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
                            }`}
                        >
                            {d.name}
                        </button>
                    ))}

                    <div className="h-8 w-px bg-white/10 mx-2" />

                    <button 
                        type="button"
                        onClick={toggleProjection}
                        title={isProjecting ? t('modules:session.deck_module.player.stop_projection') : t('modules:session.deck_module.player.start_projection')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border focus:outline-none ${
                            isProjecting 
                            ? 'bg-gm-blue/20 text-gm-blue border-gm-blue/40 shadow-glow-blue/20' 
                            : 'bg-white/5 text-white/20 border-white/5 hover:bg-white/10 hover:text-white/60'
                        }`}
                    >
                        {isProjecting ? <Eye size={14} className="animate-pulse" /> : <EyeOff size={14} />}
                        {isProjecting ? t('modules:session.deck_module.player.projection_active') : t('modules:session.deck_module.player.seers_eye')}
                    </button>
                </div>
            </header>

            {/* Main Interaction Area */}
            <div className="flex-1 flex items-center justify-center relative">
                {/* Left Side: The Pile (Pioche) */}
                <div className="absolute left-10 flex flex-col items-center gap-4">
                    <button 
                        type="button"
                        className={`relative group transition-all focus:outline-none ${activeState.remainingIndices.length > 0 ? 'cursor-pointer hover:scale-105 active:scale-95' : 'opacity-30 cursor-not-allowed'}`} 
                        onClick={() => activeState.remainingIndices.length > 0 && handleDraw()}
                        title={t('modules:session.deck_module.player.draw_card_tooltip')}
                        disabled={activeState.remainingIndices.length === 0}
                    >
                        {/* Stacked effect */}
                        {activeState.remainingIndices.length > 2 && <div className="absolute inset-0 translate-x-1 translate-y-1 bg-black/40 border border-white/5 rounded-xl -z-10" />}
                        {activeState.remainingIndices.length > 5 && <div className="absolute inset-0 translate-x-2 translate-y-2 bg-black/40 border border-white/5 rounded-xl -z-20" />}
                        
                        <div 
                            className="bg-[#121215] border border-white/10 rounded-xl overflow-hidden shadow-2xl transition-all group-hover:border-gm-gold/40"
                            style={{ width: activeDeck.orientation === 'landscape' ? '264px' : '220px', aspectRatio }}
                        >
                            <img src={`/${cardBackUrl}`} alt={t('modules:session.deck_module.player.card_back')} className="w-full h-full object-cover opacity-60 group-hover:opacity-100" />
                            <div className="absolute inset-x-0 bottom-4 flex flex-col items-center gap-2">
                                <span className="px-3 py-1 bg-black/80 rounded-full text-[10px] font-black text-gm-gold border border-gm-gold/30">
                                    {activeState.remainingIndices.length}
                                </span>
                                <div 
                                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                                        activeDeck.useDiscard 
                                        ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                                        : 'bg-gm-blue/10 text-gm-blue border-gm-blue/20'
                                    }`}
                                    title={activeDeck.useDiscard ? t('modules:session.deck_module.player.discard_mode_tooltip') : t('modules:session.deck_module.player.oracle_mode_tooltip')}
                                >
                                    {activeDeck.useDiscard ? <Trash2 size={10} /> : <InfinityIcon size={10} />}
                                    {activeDeck.useDiscard ? t('modules:session.deck_module.player.mode_standard') : t('modules:session.deck_module.player.mode_oracle')}
                                </div>
                            </div>
                        </div>
                    </button>
                    <span className="text-[10px] font-black uppercase tracking-tighter text-white/20">{t('modules:session.deck_module.player.draw_pile')}</span>
                </div>

                {/* Center: The Active Card (Zone de Jeu) */}
                <div className="flex flex-col items-center gap-12">
                    {currentCardUrl ? (
                        <button 
                            type="button"
                            key={`card-${drawCount}`}
                            className={`card-perspective animate-glide-card cursor-pointer focus:outline-none`}
                            style={{ width: activeDeck.orientation === 'landscape' ? '480px' : '400px', aspectRatio }}
                            onClick={() => handleFlip()}
                            title={t('modules:session.deck_module.player.flip_card_tooltip')}
                        >
                            <div className={`card-inner h-full w-full relative ${isFlipped ? 'card-flipped' : ''}`}>
                                {/* Front (or rather the actual card content) */}
                                <div className="card-face absolute inset-0 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl bg-[#0f0f12]">
                                    <img src={`/${currentCardUrl}`} alt={t('modules:session.deck_module.player.card_label')} className="w-full h-full object-cover" />
                                </div>
                                {/* Back (The hidden side before flip) */}
                                <div className="card-face card-back absolute inset-0 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl bg-[#0f0f12]">
                                    <img src={`/${cardBackUrl}`} alt={t('modules:session.deck_module.player.card_back')} className="w-full h-full object-cover grayscale opacity-40" />
                                </div>
                            </div>
                        </button>
                    ) : (
                        <div 
                            className="rounded-[2rem] border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-white/5 gap-4"
                            style={{ width: activeDeck.orientation === 'landscape' ? '480px' : '400px', aspectRatio }}
                        >
                            <Layers size={64} strokeWidth={1} />
                            <span className="text-xs font-bold uppercase tracking-[0.2em]">{t('modules:session.deck_module.player.draw_pile_empty_hint')}</span>
                        </div>
                    )}

                    {/* Bottom Controls */}
                    <div className="flex gap-4 p-4 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/5 shadow-2xl">
                        <button 
                            type="button"
                            onClick={handleDraw}
                            disabled={activeState.remainingIndices.length === 0}
                            className="flex flex-col items-center gap-1.5 p-4 rounded-2xl hover:bg-white/5 text-white/40 hover:text-gm-gold transition-all disabled:opacity-20 focus:outline-none"
                        >
                            <RefreshCw size={24} />
                            <span className="text-[9px] font-black uppercase tracking-widest">{t('modules:session.deck_module.player.draw_btn')}</span>
                        </button>
                        <div className="w-px h-12 self-center bg-white/5" />
                        <button 
                            type="button"
                            onClick={handleDiscard}
                            disabled={activeState.currentCardIndex === null}
                            className="flex flex-col items-center gap-1.5 p-4 rounded-2xl hover:bg-white/5 text-white/40 hover:text-red-400 transition-all disabled:opacity-20 focus:outline-none"
                        >
                            <Trash2 size={24} />
                            <span className="text-[9px] font-black uppercase tracking-widest">{t('modules:session.deck_module.player.discard_btn')}</span>
                        </button>
                        <div className="w-px h-12 self-center bg-white/5" />
                        {/*
                          **Garder la carte tirée** — le quatrième tas, décidé
                          le 2026-08-30. On choisit d'abord à qui elle va : le
                          meneur, ou un personnage de la campagne ouverte. Une
                          carte gardée arrive **face cachée**, parce que
                          l'inverse ne se rattrape pas — on peut toujours la
                          retourner, on ne peut pas la faire oublier.
                        */}
                        <div className="flex flex-col items-center justify-center gap-1.5 p-4">
                            <Hand size={24} className={activeState.currentCardIndex === null ? 'text-white/10' : 'text-white/40'} />
                            <select
                                value=""
                                disabled={activeState.currentCardIndex === null}
                                onChange={(e) => handleGarder(e.target.value === 'mj' ? null : e.target.value)}
                                title={t('modules:session.deck_module.player.hands.keep')}
                                aria-label={t('modules:session.deck_module.player.hands.keep')}
                                className="bg-transparent text-[9px] font-black uppercase tracking-widest text-white/40 outline-none disabled:opacity-20 hover:text-gm-gold cursor-pointer"
                            >
                                <option value="">{t('modules:session.deck_module.player.hands.keep')}</option>
                                {porteursPossibles.map(p => (
                                    <option key={p.id ?? 'mj'} value={p.id ?? 'mj'} className="bg-slate-900 text-white">
                                        {p.nom}{p.joueur ? ` · ${p.joueur}` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="w-px h-12 self-center bg-white/5" />
                        <button
                            type="button"
                            onClick={handleShuffle}
                            className="flex flex-col items-center gap-1.5 p-4 rounded-2xl hover:bg-white/5 text-white/40 hover:text-gm-purple transition-all focus:outline-none"
                        >
                            <RotateCcw size={24} />
                            <span className="text-[9px] font-black uppercase tracking-widest">{t('modules:session.deck_module.player.shuffle_btn')}</span>
                        </button>
                    </div>
                </div>

                {/* Right Side: The Discard (Défausse) */}
                <div className="absolute right-10 flex flex-col items-center gap-4">
                     <div 
                        className={`rounded-xl border border-dashed transition-all flex items-center justify-center ${
                            activeState.discardedIndices.length > 0 
                            ? 'bg-red-500/5 border-red-500/20' 
                            : 'bg-white/5 border-white/5'
                        }`}
                        style={{ width: activeDeck.orientation === 'landscape' ? '187px' : '156px', aspectRatio }}
                    >
                        {activeState.discardedIndices.length > 0 && (
                            <div className="text-red-500/40 font-black text-xl">
                                {activeState.discardedIndices.length}
                            </div>
                        )}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-tighter text-white/20">{t('modules:session.deck_module.player.discard_pile')}</span>
                </div>
            </div>

            {/*
              **Les cartes tenues — le quatrième tas.**

              Il ne s'affiche que lorsqu'il contient quelque chose : un cadre
              vide en permanence prendrait la place du paquet, qui est ce qu'on
              regarde. Chaque porteur a sa rangée, parce que la question posée
              en séance est *« qui a quoi »* et non *« combien de cartes sont
              sorties »*.
            */}
            {/*
              **Les propositions en attente.** Le destinataire tranche, mais le
              meneur doit pouvoir trancher aussi : un joueur parti de table ne
              doit pas bloquer une carte pendant tout un combat.
            */}
            {propositionsEnAttente.length > 0 && (
                <div className="shrink-0 border-t border-accent/30 bg-accent/5 px-8 py-4">
                    {propositionsEnAttente.map(d => (
                        <div key={d.id} className="flex flex-wrap items-center gap-4 py-1.5">
                            <span className="text-xs text-white/70">
                                <strong className="text-white">{d.deNom}</strong> propose{' '}
                                <strong className="text-gm-gold">{d.nomDeLaCarte}</strong> à{' '}
                                <strong className="text-white">{d.versNom}</strong>
                            </span>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => accepterLeDonDeCarte(d.id)}
                                    className="rounded-lg bg-gm-gold px-3 py-1 text-[9px] font-black uppercase tracking-widest text-black"
                                >
                                    {t('modules:session.deck_module.player.hands.accept')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => refuserLeDonDeCarte(d.id)}
                                    className="rounded-lg border border-white/20 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white/50 hover:text-white"
                                >
                                    {t('modules:session.deck_module.player.hands.refuse')}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {mainsOuvertes.length > 0 && (
                <div className="shrink-0 border-t border-white/5 bg-black/30 backdrop-blur-xl px-8 py-5">
                    <p className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/25">
                        {t('modules:session.deck_module.player.hands.title')}
                    </p>
                    <div className="flex flex-wrap gap-8">
                        {mainsOuvertes.map(main => (
                            <div key={main.porteur ?? 'mj'} className="flex flex-col gap-2">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${main.porteur === null ? 'text-gm-gold/70' : 'text-white/50'}`}>
                                    {main.nom}
                                </span>
                                <div className="flex gap-3">
                                    {main.cartes.map(carte => (
                                        <div key={carte.index} className="group relative">
                                            {/*
                                              Le meneur voit toujours la carte,
                                              même face cachée : c'est lui qui
                                              arbitre. Le voile dit seulement ce
                                              que la table, elle, ne voit pas.
                                            */}
                                            <img
                                                src={carte.face === 'scellee' ? `/${cardBackUrl}` : `/${carte.url}`}
                                                alt={carte.nomDeLaCarte}
                                                title={`${carte.nomDeLaCarte} — ${carte.face === 'scellee' ? t('modules:session.deck_module.player.hands.hidden') : t('modules:session.deck_module.player.hands.shown')}`}
                                                className={`h-24 rounded-lg border object-cover shadow-lg transition-all ${carte.face === 'scellee'
                                                    ? 'border-white/10 opacity-60'
                                                    : 'border-gm-gold/40'}`}
                                                style={{ aspectRatio }}
                                            />
                                            <div className="absolute inset-x-0 -bottom-1 flex justify-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRetourner(carte.index)}
                                                    /*
                                                      L'infobulle dit **l'action**, pas l'état : « Révéler »
                                                      sur une carte scellée, « Remettre sous scellé » sur
                                                      une carte révélée. C'est la leçon du bouton de
                                                      rattachement des atmosphères, payée le matin même —
                                                      un libellé qui décrit l'état ne dit jamais ce qu'un
                                                      clic va produire.
                                                    */
                                                    title={carte.face === 'scellee'
                                                        ? t('modules:session.deck_module.player.hands.reveal')
                                                        : t('modules:session.deck_module.player.hands.seal')}
                                                    className="rounded-md bg-slate-900 p-1 text-white/60 shadow-lg hover:text-gm-gold"
                                                >
                                                    {carte.face === 'scellee' ? <Eye size={12} /> : <EyeOff size={12} />}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRendre(carte.index)}
                                                    title={t('modules:session.deck_module.player.hands.return')}
                                                    className="rounded-md bg-slate-900 p-1 text-white/60 shadow-lg hover:text-gm-purple"
                                                >
                                                    <RotateCcw size={12} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleJouer(carte.index)}
                                                    title={t('modules:session.deck_module.player.hands.play')}
                                                    className="rounded-md bg-slate-900 p-1 text-white/60 shadow-lg hover:text-red-400"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Donner la main entière à quelqu'un d'autre. */}
                                <select
                                    value=""
                                    onChange={(e) => main.cartes.forEach(c =>
                                        handleDonner(c.index, e.target.value === 'mj' ? null : e.target.value))}
                                    title={t('modules:session.deck_module.player.hands.give')}
                                    aria-label={t('modules:session.deck_module.player.hands.give')}
                                    className="cursor-pointer bg-transparent text-[9px] font-black uppercase tracking-widest text-white/25 outline-none hover:text-white/60"
                                >
                                    <option value="">{t('modules:session.deck_module.player.hands.give')}</option>
                                    {porteursPossibles
                                        .filter(p => p.id !== main.porteur)
                                        .map(p => (
                                            <option key={p.id ?? 'mj'} value={p.id ?? 'mj'} className="bg-slate-900 text-white">
                                                {p.nom}
                                            </option>
                                        ))}
                                </select>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeckPlayer;
