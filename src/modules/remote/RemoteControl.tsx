import React, { useState } from 'react';
import {
    LayoutDashboard,
    Dices,
    Volume2,
    Sword,
    PenTool,
    BookOpen,
    Film,
} from 'lucide-react';
import { useRemoteSync } from './hooks/useRemoteSync';
import { type RemoteActionType } from './types/remote.types';
import RemoteUniversalPads from './components/RemoteUniversalPads';
import RemoteDicePad from './components/RemoteDicePad';
import RemoteSoundboard from './components/RemoteSoundboard';
import RemoteCombatTracker from './components/RemoteCombatTracker';
import RemoteStoryboard from './components/RemoteStoryboard';
import RemoteNotes from './components/RemoteNotes';
import RemoteDiceResultOverlay from './components/RemoteDiceResultOverlay';
import RemoteWhiteboardView from './components/RemoteWhiteboardView';
import RemoteStatusBar from './components/RemoteStatusBar';

/**
 * **La télécommande, refaite pour une tablette tenue en paysage (2026-09-05).**
 *
 * Le châssis mangeait **272 px de haut sur 768, soit 35 %** : un en-tête de
 * 104 px pour un titre qu'on connaît et un point de connexion, 40 px de marge,
 * et **128 px réservés à une barre flottante** qui occupait toute la largeur
 * pour 336 px de boutons — les deux tiers étaient du vide.
 *
 * La navigation passe **à gauche, en colonne** : sur une tablette en paysage
 * elle ne coûte **aucun pixel vertical**, et la place qu'elle prend en largeur
 * était de toute façon perdue. C'est ce qui permet enfin d'écrire les libellés :
 * les sept onglets étaient des icônes nues dont les noms vivaient dans `title`,
 * *c'est-à-dire nulle part sur un écran tactile, où l'on ne survole rien.*
 *
 * Sous 900 px de large — un téléphone, une tablette tenue debout — la colonne
 * redevient une barre en bas. Ce n'est pas une seconde conception : c'est le
 * filet qui évite qu'améliorer le paysage casse le portrait.
 */

type Onglet = 'pads' | 'dice' | 'sound' | 'combat' | 'whiteboard' | 'notes' | 'story';

const ONGLETS = [
    { id: 'pads', icon: LayoutDashboard, label: 'Pads' },
    { id: 'dice', icon: Dices, label: 'Dés' },
    { id: 'sound', icon: Volume2, label: 'Sons' },
    { id: 'story', icon: Film, label: 'Scénario' },
    { id: 'combat', icon: Sword, label: 'Combat' },
    { id: 'whiteboard', icon: PenTool, label: 'Tableau' },
    { id: 'notes', icon: BookOpen, label: 'Notes' },
] as const;

const RemoteControl: React.FC = () => {
    const { status, isPaired, syncData, lastDiceResult, clearDiceResult, sendAction } = useRemoteSync();
    const [activeTab, setActiveTab] = useState<Onglet>('pads');
    const [isAventureMode] = useState(() => typeof window !== 'undefined' ? window.location.search.includes('mode=adventure') : false);

    const renderContent = () => {
        switch (activeTab) {
            case 'pads':
                return (
                    <RemoteUniversalPads
                        pads={syncData.universalPads}
                        comptes={syncData.comptesDePads}
                        onTrigger={(id) => sendAction('remote:pad:trigger', { id })}
                    />
                );
            case 'dice':
                return (
                    <RemoteDicePad
                        activeDiceConfig={syncData.session?.activeDiceConfig}
                        desEchelonnes={syncData.session?.desEchelonnes}
                        onRoll={(dice) => sendAction('remote:dice:roll', dice)}
                        onClear={() => sendAction('remote:dice:clear', {})}
                    />
                );
            case 'sound':
                return (
                    <RemoteSoundboard
                        sounds={syncData.sounds}
                        masterVolume={syncData.masterVolume}
                        onVolumeChange={(vol) => sendAction('remote:sound:volume', { volume: vol })}
                        onTrigger={(id) => sendAction('remote:sound:trigger', { id })}
                    />
                );
            case 'combat':
                return (
                    <RemoteCombatTracker
                        combat={syncData.combat}
                        isAventureMode={isAventureMode}
                        onNextTurn={() => sendAction('remote:combat:next', {})}
                        onUpdateHp={(id, delta) => sendAction('remote:combat:hp', { id, delta })}
                    />
                );
            case 'whiteboard':
                return (
                    <RemoteWhiteboardView
                        whiteboard={syncData.whiteboard}
                        onAction={(type, payload) => sendAction(type as RemoteActionType, payload)}
                    />
                );
            case 'notes':
                return (
                    <RemoteNotes
                        notes={syncData.notes}
                        isAventureMode={isAventureMode}
                    />
                );
            case 'story':
                return (
                    <RemoteStoryboard
                        moments={syncData.moments}
                        onTrigger={(index) => sendAction('remote:story:trigger', { index })}
                    />
                );
            default:
                return null;
        }
    };

    /*
      Un seul jeu de boutons pour les deux dispositions : la colonne les empile,
      la barre les aligne. *Deux listes d'onglets finiraient par diverger* — le
      motif payé assez de fois ailleurs dans ce dépôt pour ne pas le rejouer ici.
    */
    const boutonsDOnglet = (enColonne: boolean) => ONGLETS.map((onglet) => {
        const Icon = onglet.icon;
        const actif = activeTab === onglet.id;
        return (
            <button
                key={onglet.id}
                onClick={() => setActiveTab(onglet.id)}
                aria-current={actif ? 'page' : undefined}
                className={`flex items-center transition-colors duration-200 select-none ${
                    enColonne
                        ? `w-full gap-3 px-3 py-2.5 rounded-xl ${actif ? 'bg-accent/15 text-accent' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`
                        : `flex-1 flex-col gap-0.5 py-1.5 rounded-lg ${actif ? 'text-accent' : 'text-slate-500'}`
                }`}
            >
                <Icon size={enColonne ? 18 : 20} strokeWidth={actif ? 2.5 : 2} className="shrink-0" />
                <span className={`font-black uppercase tracking-wider ${enColonne ? 'text-[11px]' : 'text-[9px]'}`}>
                    {onglet.label}
                </span>
            </button>
        );
    });

    return (
        <div className="h-[100dvh] bg-app-bg text-app-text font-sans selection:bg-accent/30 flex overflow-hidden">
            {/*
              **La colonne de navigation.** Cachée sous 900 px, où la barre du bas
              prend le relais. `w-32` suffit au plus long des sept libellés
              (« Scénario ») sans jamais imposer de coupure.
            */}
            <nav className="hidden min-[900px]:flex flex-col gap-1 w-32 shrink-0 p-2 border-r border-white/5 bg-app-bg">
                <div className="px-3 pt-2 pb-3">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">GM Remote</span>
                    {isAventureMode && (
                        <span className="block mt-1 text-[9px] font-black uppercase tracking-widest text-amber-500">Aventure</span>
                    )}
                </div>
                {boutonsDOnglet(true)}
            </nav>

            <div className="flex-1 flex flex-col min-w-0 relative">
                <RemoteStatusBar
                    status={status}
                    isPaired={isPaired}
                    lecture={syncData.lecture}
                    combat={syncData.combat}
                    minuteur={syncData.clock}
                    onStopAll={() => sendAction('remote:sound:stop-all', {})}
                />

                {/*
                  `p-3` au lieu de `p-4 md:p-10` : quarante pixels de marge de
                  chaque côté sur une tablette, c'est une colonne de pads perdue.
                */}
                <main className="flex-1 overflow-y-auto no-scrollbar p-3">
                    {renderContent()}
                </main>

                {/* Le repli sous 900 px : collée au bord, sans marge flottante. */}
                <nav className="min-[900px]:hidden shrink-0 flex items-stretch gap-0.5 px-1 py-1 border-t border-white/5 bg-app-bg">
                    {boutonsDOnglet(false)}
                </nav>
            </div>

            <RemoteDiceResultOverlay
                result={lastDiceResult}
                onClose={clearDiceResult}
            />
        </div>
    );
};

export default RemoteControl;
