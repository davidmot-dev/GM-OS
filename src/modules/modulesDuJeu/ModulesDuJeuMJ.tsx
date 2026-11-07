import { ArrowLeft, Blocks } from 'lucide-react';
import { useMemo } from 'react';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { HubConsultation } from '../../components/hub/HubConsultation';
import { modulesDuPilote } from './catalogue';
import { recevoirModulesMJ, useModulesDuJeuMJ } from './magasins';
import { PanneauDesModulesMJ } from './PanneauDesModulesMJ';
import type { GestesDuMeneur } from './canalMeneur';
import type { ResultatDeModule } from './protocole';

const horsDuPoste: ResultatDeModule = { ok: false, erreur: 'Les modules exigent le poste MJ de GM-OS.' };

/**
 * **Les modules du jeu au poste MJ.** Le panneau est commun avec la tablette du meneur depuis le
 * 07/11/2026 (`PanneauDesModulesMJ`) ; le poste lui donne ses gestes par l'IPC, et garde ce qui
 * n'appartient qu'à lui : le retour au cockpit et la configuration du pilote.
 */
export function ModulesDuJeuMJ() {
    const { campaigns, sessions, players, activeCampaignId, getActiveDriver, setCurrentView, setEditingDriverId, customGameDrivers } = useSessionOSStore();
    const { vue, erreur } = useModulesDuJeuMJ();
    const campagne = campaigns.find(c => c.id === activeCampaignId);
    const pilote = getActiveDriver();
    const resultat = modulesDuPilote(pilote, campagne?.systemPath);
    const courante = vue?.campagneId === activeCampaignId ? vue : null;
    const personnages = players.flatMap(j => j.characters.filter(p => p.campaignId === activeCampaignId)).map(p => ({ id: p.id, nom: p.name }));
    const enSeance = sessions.some(s => s.campaignId === activeCampaignId && s.status === 'active');
    const gestes = useMemo<GestesDuMeneur>(() => {
        const pont = () => window.appBridge?.modulesDuJeu;
        const contexte = () => useModulesDuJeuMJ.getState().vue?.contexte ?? -1;
        const campagneId = () => useSessionOSStore.getState().activeCampaignId ?? '';
        return {
            commander: async (moduleId, commande) => pont()?.commander({ requeteId: crypto.randomUUID(), campagneId: campagneId(), moduleId, contexte: contexte(), commande }) ?? horsDuPoste,
            autoriser: async (moduleId, personnages) => pont()?.autoriser({ campagneId: campagneId(), moduleId, contexte: contexte(), personnages }) ?? horsDuPoste,
            toutCouper: async () => pont()?.toutCouper({ campagneId: campagneId(), contexte: contexte() }) ?? horsDuPoste,
            choisirDiffusion: async (moduleId, appareilId) => pont()?.choisirDiffusion({ campagneId: campagneId(), moduleId, appareilId, contexte: contexte() }) ?? horsDuPoste,
        };
    }, []);
    return <HubConsultation ecran="modules-du-jeu-mj" titre="Modules du jeu" description={campagne ? `Outils de ${campagne.name}` : 'Sélectionne une campagne pour retrouver ses outils.'}
        compteur={`${resultat.modules.length} module(s) proposé(s)`} icone={Blocks}
        commandes={<div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setCurrentView('cockpit')} className="flex items-center gap-2 rounded border border-app-border px-3 py-2 text-sm text-app-text"><ArrowLeft size={16} />Retour au cockpit</button>
            {pilote && customGameDrivers.some(p => p.id === pilote.id) && <button type="button" className="rounded border border-app-border px-3 py-2 text-sm text-app-text"
                onClick={() => { setEditingDriverId(pilote.id); setCurrentView('driver-editor'); }}>Configurer le pilote</button>}
        </div>}>
        {resultat.erreurs.map(e => <p role="alert" key={e} className="text-etat-danger">{e}</p>)}
        <PanneauDesModulesMJ habillage="poste" campagneId={activeCampaignId} vue={courante} erreur={erreur} proposes={resultat.modules}
            personnages={personnages} enSeance={enSeance} gestes={gestes}
            apresUnGeste={async () => { const pont = window.appBridge?.modulesDuJeu; if (pont) recevoirModulesMJ(await pont.lire()); }} />
    </HubConsultation>;
}
