import React from 'react';
import { ArrowLeft, Users2 } from 'lucide-react';
import FicheHote from '../../fiches/FicheHote';
import { useCorrespondanceDuGroupe } from '../../fiches/useCorrespondanceDuGroupe';
import { useSessionOSStore } from '../useSessionOSStore';
import { tousLesPilotes } from '../store/tousLesPilotes';
import { appliquerAuGroupe, groupePourLHote, lierLeGroupe, nomDuGroupe } from '../logic/groupeDeLaCampagne';
import type { Rapprochement } from '../../fiches/rapprochementDeLaFiche';
import FaveursDeLaCabale from '../../table/FaveursDeLaCabale';

/**
 * **La fiche du groupe de la campagne** — la Cabale de NOC, 2026-10-13.
 *
 * Un personnage commun à toute la table : sa fiche HTML s'affiche et se
 * branche exactement comme celle d'un PJ, par `FicheHote`, et ses valeurs
 * redescendent sur la campagne. **Le seul écrivain reste le store**
 * (`updateCampaign`) : cette vue ne fait que lui transmettre ce que la fiche
 * impose.
 */
const FicheDuGroupe: React.FC = () => {
    const { campaigns, activeCampaignId, customGameDrivers, updateCampaign, setCurrentView } = useSessionOSStore();
    const campagne = campaigns.find(c => c.id === activeCampaignId);
    const pilote = tousLesPilotes(customGameDrivers).find(d => d.id === campagne?.system);
    const table = useCorrespondanceDuGroupe(campagne, pilote);

    const retour = (
        <button
            onClick={() => setCurrentView('cockpit')}
            className="flex items-center gap-2 px-4 py-2 bg-app-surface border border-app-border text-app-text/40 hover:text-accent hover:border-accent/50 rounded-xl transition-all font-bold text-sm uppercase tracking-widest group"
        >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            Cockpit
        </button>
    );

    // Un état persisté peut rouvrir cette vue sur une campagne sans groupe :
    // on le dit, plutôt qu'un écran vide.
    if (!campagne || !pilote?.ficheDeGroupe) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-app-text/40">
                <p className="text-sm italic">Le jeu de cette campagne n'a pas de fiche de groupe.</p>
                {retour}
            </div>
        );
    }

    const { libelle } = pilote.ficheDeGroupe;
    const groupe = campagne.groupe;
    const nom = nomDuGroupe(groupe, table, libelle);

    const lier = (ficheId: string) => updateCampaign(campagne.id, { groupe: lierLeGroupe(groupe, ficheId) });
    const appliquer = (releve: Rapprochement) => updateCampaign(campagne.id, { groupe: appliquerAuGroupe(groupe, releve) });

    return (
        <div className="flex-1 h-full bg-app-bg/60 flex flex-col overflow-hidden">
            <div className="flex items-center gap-6 px-12 py-6 border-b border-app-border/50 bg-app-surface/60 backdrop-blur-md flex-shrink-0">
                {retour}
                <div className="flex items-center gap-3 min-w-0">
                    <Users2 size={20} className="text-accent shrink-0" />
                    <div className="min-w-0">
                        <h2 className="text-xl font-black text-app-text truncate">{nom}</h2>
                        <p className="text-ui-10 text-app-text/40 uppercase tracking-widest">
                            {libelle} · commune à toute la table · {campagne.name}
                        </p>
                    </div>
                </div>
            </div>

            {pilote.gestesDesHeros?.entraideNocturne && <FaveursDeLaCabale fiche={groupe?.sheetData ?? {}}
                ecrire={maj => appliquer({ aEcrire: maj, divergences: [] })} />}
            <div className="flex-1 min-h-0 overflow-hidden p-4">
                <FicheHote
                    personnage={groupePourLHote(campagne, groupe, nom)}
                    table={table}
                    onFicheLiee={lier}
                    onRapprochement={appliquer}
                />
            </div>
        </div>
    );
};

export default FicheDuGroupe;
