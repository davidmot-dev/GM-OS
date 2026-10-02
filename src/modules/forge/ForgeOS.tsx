import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Hammer, Layers, Network } from 'lucide-react';
import ForgeDashboard from './components/ForgeDashboard';
import AtelierDeCampagne from './campagne/AtelierDeCampagne';
import ForgeDeLaTrame from './campagne/ForgeDeLaTrame';
import { EnTeteDeModule } from '../../components/socle';

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

/**
 * **L'en-tête de la Forge dans la grammaire commune** — refonte, phase 4, L3,
 * étape 2 (2026-10-02). Le titre du module, puis **les trois ateliers
 * numérotés**, dans l'ordre où ils s'enchaînent : documenter le système, écrire
 * les fiches de la campagne, les projeter en trame. La maquette retenue les
 * numérote ; *un ordre qui ne se lit pas est un ordre qu'on refait.*
 */
const ForgeOS: React.FC = () => {
    const { t } = useTranslation(['modules']);
    const [mode, setMode] = useState<ModeForge>('system');

    const ateliers: { id: ModeForge; icone: React.ReactNode; libelle: string }[] = [
        { id: 'system', icone: <Hammer size={13} />, libelle: t('modules:session.header.forge') },
        { id: 'campagne', icone: <Layers size={13} />, libelle: 'Campagne' },
        { id: 'trame', icone: <Network size={13} />, libelle: 'Trame' },
    ];

    return (
        <div className="flex-1 h-full overflow-hidden flex flex-col bg-app-bg text-app-text">
            <div className="shrink-0 flex flex-wrap items-end justify-between gap-3 px-6 pt-4 pb-3 border-b border-app-border/50">
                <EnTeteDeModule titre={t('modules:names.forge')} />
                <nav aria-label="Ateliers de la Forge" className="flex gap-1 rounded-xl border border-app-border/50 bg-app-surface/50 p-1">
                    {ateliers.map(({ id, icone, libelle }, rang) => (
                        <button
                            key={id}
                            onClick={() => setMode(id)}
                            aria-pressed={mode === id}
                            className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-ui-10 font-black uppercase tracking-widest transition-all ${mode === id
                                ? 'bg-accent text-app-on-accent shadow-glow-accent'
                                : 'text-app-text/60 hover:text-app-text hover:bg-app-surface'}`}
                        >
                            <span className="font-mono opacity-70">{rang + 1}.</span> {icone} {libelle}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
                {mode === 'campagne' ? <AtelierDeCampagne />
                    : mode === 'trame' ? <ForgeDeLaTrame />
                    : <ForgeDashboard />}
            </div>
        </div>
    );
};

export default ForgeOS;
