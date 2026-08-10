import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Hammer, Sparkles } from 'lucide-react';
import ForgeDashboard from './components/ForgeDashboard';
import { useSessionStore } from '../../store/useSessionStore';

/**
 * Forge OS — le point d'entrée du module.
 *
 * **Pourquoi la Forge sort de Session OS.** On y documente un système de jeu,
 * pas une partie : le corpus de Dune est le même pour toutes les campagnes
 * Dune, et il vit dans `docs/systems/`, hors des données de campagne. Y accéder
 * par le cockpit d'une campagne obligeait à en avoir une ouverte pour
 * travailler sur un livre — et le 2026-08-10 cela a conduit à réaffecter le
 * pilote d'une campagne Blade Runner pour pouvoir enrichir Dune, abîmant une
 * campagne pour documenter un livre qui ne la concernait pas.
 *
 * Le module ne lit donc plus la campagne active. Le corpus visé se choisit ici,
 * et nulle part ailleurs.
 *
 * La bascule des deux ateliers vivait dans l'en-tête de Session OS, qui n'existe
 * plus sur ce chemin : elle est portée par le module lui-même.
 */
export type ModeForge = 'system' | 'chronicle';

const ForgeOS: React.FC = () => {
    const { t } = useTranslation(['modules']);
    const { theme } = useSessionStore();
    const [mode, setMode] = useState<ModeForge>('system');

    return (
        <div className="flex-1 h-full overflow-hidden flex flex-col bg-app-bg text-app-text">
            <header className={`flex items-center justify-between h-16 px-6 shrink-0 z-30 relative transition-all duration-500 ${
                theme === 'medieval' ? 'bg-app-surface/90 border-b-2 border-app-border/40' : 'premium-glass'
            }`}>
                <div className={`flex items-center gap-3 ${theme === 'medieval' ? 'text-accent' : 'text-gm-gold'}`}>
                    <Hammer size={26} className={theme === 'medieval' ? 'opacity-80' : ''} />
                    <h1 className={`text-app-text text-lg tracking-[0.15em] uppercase ${
                        theme === 'medieval' ? 'font-display' : 'font-bold tracking-tight'
                    }`}>
                        {t('modules:names.forge')} <span className="text-accent opacity-80">OS</span>
                    </h1>
                </div>

                <div className={`flex p-1 bg-app-surface/50 border border-app-border/50 shadow-lg ${
                    theme === 'medieval' ? 'rounded-md' : 'rounded-xl'
                }`}>
                    <button
                        onClick={() => setMode('system')}
                        className={`px-6 py-1.5 transition-all flex items-center gap-2 ${
                            theme === 'medieval' ? 'rounded-sm text-[11px] font-display tracking-widest' : 'rounded-lg text-[10px] font-black uppercase tracking-widest'
                        } ${mode === 'system' ? 'bg-accent text-white shadow-glow-accent' : 'text-app-text/60'}`}
                    >
                        <Hammer size={12} /> {t('modules:session.header.forge')}
                    </button>
                    <button
                        onClick={() => setMode('chronicle')}
                        className={`px-6 py-1.5 transition-all flex items-center gap-2 ${
                            theme === 'medieval' ? 'rounded-sm text-[11px] font-display tracking-widest' : 'rounded-lg text-[10px] font-black uppercase tracking-widest'
                        } ${mode === 'chronicle' ? 'bg-fuchsia-600/80 text-white shadow-glow-fuchsia/40' : 'text-app-text/60'}`}
                    >
                        <Sparkles size={12} /> {t('modules:session.header.chronicle_forge')}
                    </button>
                </div>
            </header>

            <div className="flex-1 min-h-0 overflow-hidden">
                <ForgeDashboard mode={mode} />
            </div>
        </div>
    );
};

export default ForgeOS;
