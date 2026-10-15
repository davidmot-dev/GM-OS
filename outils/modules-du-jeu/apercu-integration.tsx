/** Banc visuel isolé : composants réels, données fictives, aucun store ni transport de GM-OS. */
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { EditeurDesModules } from '../../src/modules/modulesDuJeu/EditeurDesModules';
import { ModulesDuJeuMJ } from '../../src/modules/modulesDuJeu/ModulesDuJeuMJ';
import { HubModulesDuJeu } from '../../src/components/hub/HubModulesDuJeu';
import { NavigationDesOngletsDuHub, type OngletDuHub } from '../../src/components/hub/NavigationDesOngletsDuHub';
import type { GameDriver } from '../../src/types/drivers';

const alien = { id: 'custom-demo-alien', name: 'ALIEN, le jeu de rôle', corpusId: 'alien' } as GameDriver;
export function Apercu() {
    const [vue, setVue] = useState('pilote');
    const [pilote, setPilote] = useState(alien);
    const [onglet, setOnglet] = useState<OngletDuHub>('modules-du-jeu');
    Object.assign(globalThis, { etatDeDemonstration: {
        campaigns: [{ id: 'demo', name: 'Le dernier signal', systemPath: 'systems/alien' }], activeCampaignId: 'demo',
        customGameDrivers: [pilote], getActiveDriver: () => pilote, setEditingDriverId: () => {},
        setCurrentView: (valeur: string) => setVue(valeur === 'driver-editor' ? 'pilote' : 'mj'),
    } });
    return <div className="flex h-screen flex-col bg-app-bg text-app-text">
        <nav aria-label="Démonstration" className="flex shrink-0 flex-wrap gap-2 border-b border-app-border p-3">
            {['pilote', 'mj', 'hub'].map(v => <button key={v} onClick={() => setVue(v)} className="min-h-[44px] rounded border border-app-border px-4">{v === 'pilote' ? 'Pilote' : v === 'mj' ? 'Cockpit MJ' : 'Tablet Hub'}</button>)}
        </nav>
        <main className="min-h-0 flex-1 overflow-auto">
            {vue === 'pilote' ? <div className="mx-auto max-w-5xl p-4"><EditeurDesModules pilote={pilote} onChange={modulesDuJeu => setPilote({ ...pilote, modulesDuJeu })} /></div>
                : vue === 'mj' ? <ModulesDuJeuMJ /> : <div className="flex h-full flex-col">
                    <div className="min-h-0 flex-1">{onglet === 'modules-du-jeu' ? <HubModulesDuJeu /> : <p className="p-4">Autre onglet du banc de démonstration.</p>}</div>
                    <nav aria-label="Navigation Hub" className="shrink-0 border-t border-app-border bg-app-surface p-1"><NavigationDesOngletsDuHub courant={onglet} onChange={setOnglet} cartesProposees={0} /></nav>
                </div>}
        </main>
    </div>;
}
createRoot(document.getElementById('root')!).render(<Apercu />);
