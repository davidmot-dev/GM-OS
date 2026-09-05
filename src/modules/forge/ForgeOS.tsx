import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Hammer, Layers, Network } from 'lucide-react';
import ForgeDashboard from './components/ForgeDashboard';
import AtelierDeCampagne from './campagne/AtelierDeCampagne';
import ForgeDeLaTrame from './campagne/ForgeDeLaTrame';
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
/**
 * `campagne` est l'**Atelier** de campagne — il interroge NotebookLM et écrit
 * des fiches sourcées, comme l'atelier des règles. `trame` est la **Forge** de
 * campagne, qui projette ces fiches en actes, scènes, PNJ et indices : les deux
 * étages du même chantier, dans cet ordre.
 *
 * **`chronicle` a été retiré le 2026-08-16**, une fois `trame` éprouvée sur une
 * vraie campagne. Elle déversait des documents en **un seul appel** — au-delà
 * des ~8 000 tokens d'invite mesurés le 12 août, tout ce qui débordait se
 * perdait sans un mot — et ne connaissait ni actes, ni scènes, ni indices.
 * *Deux productions indépendantes des mêmes faits divergeront, et rien ne les
 * comparera jamais.* Son unique capacité propre, avaler un PDF sans corpus, se
 * remplace en ajoutant le PDF à un carnet.
 */
export type ModeForge = 'system' | 'campagne' | 'trame';

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
                            theme === 'medieval' ? 'rounded-sm text-ui-11 font-display tracking-widest' : 'rounded-lg text-ui-10 font-black uppercase tracking-widest'
                        } ${mode === 'system' ? 'bg-accent text-white shadow-glow-accent' : 'text-app-text/60'}`}
                    >
                        <Hammer size={12} /> {t('modules:session.header.forge')}
                    </button>
                    <button
                        onClick={() => setMode('campagne')}
                        className={`px-6 py-1.5 transition-all flex items-center gap-2 ${
                            theme === 'medieval' ? 'rounded-sm text-ui-11 font-display tracking-widest' : 'rounded-lg text-ui-10 font-black uppercase tracking-widest'
                        } ${mode === 'campagne' ? 'bg-accent text-white shadow-glow-accent' : 'text-app-text/60'}`}
                    >
                        <Layers size={12} /> Campagne
                    </button>
                    <button
                        onClick={() => setMode('trame')}
                        className={`px-6 py-1.5 transition-all flex items-center gap-2 ${
                            theme === 'medieval' ? 'rounded-sm text-ui-11 font-display tracking-widest' : 'rounded-lg text-ui-10 font-black uppercase tracking-widest'
                        } ${mode === 'trame' ? 'bg-accent text-white shadow-glow-accent' : 'text-app-text/60'}`}
                    >
                        <Network size={12} /> Trame
                    </button>
                </div>
            </header>

            <div className="flex-1 min-h-0 overflow-hidden">
                {mode === 'campagne' ? <AtelierDeCampagne />
                    : mode === 'trame' ? <ForgeDeLaTrame />
                    : <ForgeDashboard />}
            </div>
        </div>
    );
};

export default ForgeOS;
