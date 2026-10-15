import { ArrowLeft, Blocks } from 'lucide-react';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { HubConsultation } from '../../components/hub/HubConsultation';
import { modulesDuPilote } from './catalogue';

const ETATS = { pret: 'Adaptateur prêt', 'a-adapter': 'Adaptateur à préparer', inconnu: 'Absent du catalogue', incompatible: 'Incompatible avec ce jeu' };

export function ModulesDuJeuMJ() {
    const { campaigns, activeCampaignId, getActiveDriver, setCurrentView, setEditingDriverId, customGameDrivers } = useSessionOSStore();
    const campagne = campaigns.find(c => c.id === activeCampaignId);
    const pilote = getActiveDriver();
    const resultat = modulesDuPilote(pilote, campagne?.systemPath);
    return <HubConsultation ecran="modules-du-jeu-mj" titre="Modules du jeu" description={campagne ? `Outils de ${campagne.name}` : 'Sélectionne une campagne pour retrouver ses outils.'}
        compteur={`${resultat.modules.length} module(s) proposé(s)`} icone={Blocks}
        commandes={<div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setCurrentView('cockpit')} className="flex items-center gap-2 rounded border border-app-border px-3 py-2 text-sm text-app-text"><ArrowLeft size={16} />Retour au cockpit</button>
            {pilote && customGameDrivers.some(p => p.id === pilote.id) && <button type="button" className="rounded border border-app-border px-3 py-2 text-sm text-app-text"
                onClick={() => { setEditingDriverId(pilote.id); setCurrentView('driver-editor'); }}>Configurer le pilote</button>}
        </div>}>
        <p className="rounded-lg border border-app-border bg-app-surface p-4 text-sm text-app-muted">La sélection des modules est disponible dans le pilote. Leur ouverture aux joueurs et leur pilotage depuis cet écran seront disponibles après le raccordement privé au Tablet Hub.</p>
        {resultat.erreurs.map(e => <p role="alert" key={e} className="text-etat-danger">{e}</p>)}
        {!resultat.modules.length && <p className="text-sm text-app-muted">Aucun module proposé par ce pilote.</p>}
        {resultat.modules.map(m => <article key={m.reference.id} className="space-y-2 rounded-lg border border-app-border bg-app-surface p-4">
            <h3 className="break-words text-lg font-bold text-app-text">{m.libelle}</h3>
            <p className="text-sm text-app-muted">{m.description}</p>
            <p className="text-sm text-accent">{ETATS[m.disponibilite]}</p>
        </article>)}
    </HubConsultation>;
}
