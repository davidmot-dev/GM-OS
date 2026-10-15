import { Blocks } from 'lucide-react';
import { useState } from 'react';
import { HubConsultation, type CommandesDeConsultation } from './HubConsultation';
import { useModulesDuJeuJoueur } from '../../modules/modulesDuJeu/magasins';
import { VueDeModule } from '../../modules/modulesDuJeu/vuesDuRegistre';
import { useClientStore } from '../../stores/useClientStore';
import { useSessionOSStore } from '../../modules/session/useSessionOSStore';

/** Seules les projections privées remises à ce personnage sont consultables. */
export function HubModulesDuJeu(props: CommandesDeConsultation) {
    const { vue, commander } = useModulesDuJeuJoueur();
    const personnageId = useClientStore(s => s.characterId);
    const campagneId = useSessionOSStore(s => s.activeCampaignId);
    const [selection, choisir] = useState<{ id: string; contexte: number } | null>(null);
    const modules = vue?.personnageId === personnageId && vue.campagneId === campagneId ? vue.modules : [];
    const ouvert = selection?.contexte === vue?.contexte ? modules.find(m => m.id === selection?.id) : undefined;
    return <HubConsultation ecran="modules-du-jeu" titre="Modules du jeu" description="Les outils de ta partie, ouverts par le meneur."
        compteur={modules.length ? `${modules.length} ${modules.length === 1 ? 'module ouvert' : 'modules ouverts'}` : 'Aucun module ouvert'} icone={Blocks} {...props}>
        {ouvert ? <div className="space-y-3">
            <button type="button" className="min-h-[44px] rounded border border-app-border px-4 text-app-text" onClick={() => choisir(null)}>Retour aux modules</button>
            <VueDeModule key={`${campagneId}:${personnageId}:${ouvert.id}`} id={ouvert.id} role="joueur" vue={ouvert.vue} envoyerCommande={commande => commander(ouvert.id, commande)} />
        </div> : modules.length ? modules.map(module => <button type="button" key={module.id}
            className="block min-h-[48px] w-full rounded-lg border border-app-border bg-app-surface p-4 text-left text-app-text"
            onClick={() => choisir({ id: module.id, contexte: vue!.contexte })}>Ouvrir {module.libelle}</button>)
            : <div className="rounded-lg border border-app-border bg-app-surface p-5 text-[14px] text-app-muted">Aucun module ouvert par le meneur.</div>}
    </HubConsultation>;
}
