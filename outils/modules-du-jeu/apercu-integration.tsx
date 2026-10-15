/** Hôte et composants réels, stockage en mémoire et données fictives ; aucun service réseau. */
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { EditeurDesModules } from '../../src/modules/modulesDuJeu/EditeurDesModules';
import { ModulesDuJeuMJ } from '../../src/modules/modulesDuJeu/ModulesDuJeuMJ';
import { HubModulesDuJeu } from '../../src/components/hub/HubModulesDuJeu';
import { NavigationDesOngletsDuHub, type OngletDuHub } from '../../src/components/hub/NavigationDesOngletsDuHub';
import type { GameDriver } from '../../src/types/drivers';
import { ServiceDesModules } from '../../electron/modulesDuJeu/service';
import { recevoirModulesMJ, useModulesDuJeuJoueur } from '../../src/modules/modulesDuJeu/magasins';
import { CanalDesModulesJoueur } from '../../src/modules/modulesDuJeu/canalJoueur';
import type { ContexteDesModules, RequeteDeModule, PontDesModules } from '../../src/modules/modulesDuJeu/protocole';

const alien = { id: 'custom-demo-alien', name: 'ALIEN, le jeu de rôle', corpusId: 'alien' } as GameDriver;
const personnages = [{ id: 'alice', nom: 'Dana Okoro' }, { id: 'bob', nom: 'Parker' }];
let personnageId = 'alice', canal: CanalDesModulesJoueur;
const hote = new ServiceDesModules({ lire: async () => null, ecrire: async () => {} }, () => { void actualiser(); });
async function actualiser() {
    recevoirModulesMJ({ ...await hote.vueMJ(), appareils: personnages.map(p => ({ id: `tablette-${p.id}`, libelle: p.nom, personnageId: p.id })) });
    canal?.recevoir({ type: 'modules:vue', payload: await hote.vueJoueur(personnageId, `tablette-${personnageId}`) });
}
function changerPersonnage(id: string) {
    canal?.fermer(); personnageId = id;
    Object.assign(globalThis, { identiteDeDemo: { characterId: id } });
    const identite = id;
    canal = new CanalDesModulesJoueur(message => {
        const requete = (message as { payload: RequeteDeModule }).payload;
        void hote.commander(requete, { role: 'joueur', personnageId: identite, appareilId: `tablette-${identite}` }).then(() => {
            canal.recevoir({ type: 'modules:resultat', payload: { requeteId: requete.requeteId, ok: true } });
        }).catch(() => canal.recevoir({ type: 'modules:resultat', payload: { requeteId: requete.requeteId, ok: false } }));
    }, () => ({ personnageId, campagneId: 'demo' }), vue => useModulesDuJeuJoueur.setState({ vue }));
    useModulesDuJeuJoueur.setState({ commander: (id, commande) => canal.commander(id, commande) });
    void actualiser();
}
const contexte = (pilote = alien): ContexteDesModules => ({ campagneId: 'demo', seanceId: 'demo-seance', pilote, personnages });
const resultat = async (action: () => Promise<unknown>) => {
    try { await action(); await actualiser(); return { ok: true as const }; }
    catch (e) { return { ok: false as const, erreur: e instanceof Error ? e.message : 'Refus' }; }
};
const pont: PontDesModules = {
    contexte: charge => resultat(() => hote.changerContexte(charge)), lire: async () => ({ ...await hote.vueMJ(), appareils: personnages.map(p => ({ id: `tablette-${p.id}`, libelle: p.nom, personnageId: p.id })) }),
    commander: charge => resultat(() => hote.commander(charge, { role: 'mj', appareilId: 'poste-mj' })),
    autoriser: charge => resultat(() => hote.autoriser(charge)), importer: charge => resultat(() => hote.importer(charge)),
    choisirDiffusion: charge => resultat(() => hote.choisirDiffusion(charge, { id: charge.appareilId, personnageId: charge.appareilId.replace('tablette-', '') })),
    surChangement: () => () => {},
};
window.appBridge = { modulesDuJeu: pont } as Window['appBridge'];
changerPersonnage('alice');
void resultat(() => hote.changerContexte(contexte()));
export function Apercu() {
    const [vue, setVue] = useState('pilote');
    const [pilote, setPilote] = useState(alien);
    const [onglet, setOnglet] = useState<OngletDuHub>('modules-du-jeu');
    Object.assign(globalThis, { etatDeDemonstration: {
        campaigns: [{ id: 'demo', name: 'Le dernier signal', systemPath: 'systems/alien' }], activeCampaignId: 'demo',
        sessions: [{ id: 'demo-seance', campaignId: 'demo', status: 'active' }],
        players: [{ id: 'equipage', characters: personnages.map(p => ({ id: p.id, name: p.nom, campaignId: 'demo' })) }],
        customGameDrivers: [pilote], getActiveDriver: () => pilote, setEditingDriverId: () => {},
        setCurrentView: (valeur: string) => setVue(valeur === 'driver-editor' ? 'pilote' : 'mj'),
    } });
    return <div className="flex h-screen flex-col bg-app-bg text-app-text">
        <nav aria-label="Démonstration" className="flex shrink-0 flex-wrap gap-2 border-b border-app-border p-3">
            {['pilote', 'mj', 'hub'].map(v => <button key={v} onClick={() => setVue(v)} className="min-h-[44px] rounded border border-app-border px-4">{v === 'pilote' ? 'Pilote' : v === 'mj' ? 'Cockpit MJ' : 'Tablet Hub'}</button>)}
            {personnages.map(p => <button key={p.id} onClick={() => { changerPersonnage(p.id); setVue('hub'); }} className="min-h-[44px] rounded border border-app-border px-4">Vue {p.nom}</button>)}
        </nav>
        <main className="min-h-0 flex-1 overflow-auto">
            {vue === 'pilote' ? <div className="mx-auto max-w-5xl p-4"><EditeurDesModules pilote={pilote} onChange={modulesDuJeu => { const nouveau = { ...pilote, modulesDuJeu }; setPilote(nouveau); void pont.contexte(contexte(nouveau)); }} /></div>
                : vue === 'mj' ? <ModulesDuJeuMJ /> : <div className="flex h-full flex-col">
                    <div className="min-h-0 flex-1">{onglet === 'modules-du-jeu' ? <HubModulesDuJeu /> : <p className="p-4">Autre onglet du banc de démonstration.</p>}</div>
                    <nav aria-label="Navigation Hub" className="shrink-0 border-t border-app-border bg-app-surface p-1"><NavigationDesOngletsDuHub courant={onglet} onChange={setOnglet} cartesProposees={0} /></nav>
                </div>}
        </main>
    </div>;
}
createRoot(document.getElementById('root')!).render(<Apercu />);
