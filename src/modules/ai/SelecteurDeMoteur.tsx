import React from 'react';
import { Cloud, Cpu } from 'lucide-react';
import { useAIStore } from '../../stores/useAIStore';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { pauseRestanteMs } from '../session/pauseDeSeance';
import { estEnPause } from '../session/pauseDeSeance';
import {
    DUREE_ESTIMEE, minutesHautesEstimees, moteurDeLaForge,
    useMoteurParForge, type NomDeForge,
} from './moteurParForge';
import type { AIProvider } from './types';

/**
 * **Le sélecteur de moteur d'une Forge — axe J, points 2 à 4.**
 *
 * *« Le badge moteur devient un sélecteur, avec estimation de durée. »* Il était
 * un badge : il disait ce qui allait servir, sans offrir d'en changer. Le
 * meneur devait passer par les réglages globaux — donc **basculer aussi
 * l'Oracle et le Cortex**, et penser à revenir.
 *
 * **Un seul composant pour les deux Forges**, et c'est la mise en garde du § 8
 * du plan : *« une préoccupation partagée corrigée dans un seul de ses deux
 * exemplaires »* est exactement le bug de la migration Gemini du 07/08. Ce
 * projet a passé la journée du 22 à défaire ce motif ; on ne le refabrique pas
 * ici.
 *
 * **Mémorisé, et toujours affiché.** Les deux moitiés comptent : mémoriser sans
 * montrer redonnerait un réglage qu'on a oublié d'avoir posé.
 */
export const SelecteurDeMoteur: React.FC<{
    forge: NomDeForge;
    /** Les moteurs proposés. Par défaut : le local et Gemini. */
    moteurs?: AIProvider[];
}> = ({ forge, moteurs = ['ollama', 'gemini'] }) => {
    const activeProvider = useAIStore(e => e.activeProvider);
    const choix = useMoteurParForge(e => e.choix);
    const retenir = useMoteurParForge(e => e.retenir);
    const sessions = useSessionOSStore(e => e.sessions);

    const retenu = moteurDeLaForge(forge, choix, activeProvider);
    const configs = useAIStore(e => e.configs);

    /*
      **« Pause de 15 min : cette Forge en demande 4, on y va. »**

      Le plan relève la convergence entre les axes I et G : à vingt-cinq minutes
      une Forge ne rentre dans aucune pause honnête, à deux-cinq elle rentre
      confortablement dans un quart d'heure. Le dire au moment du choix est ce
      qui rend la pause utile — *sinon on relance et on espère.*
    */
    const seanceEnPause = sessions.find(estEnPause);
    const minutesRestantes = seanceEnPause
        ? Math.floor(pauseRestanteMs(seanceEnPause) / 60000)
        : undefined;

    const verdictDePause = (p: AIProvider): string | null => {
        if (minutesRestantes === undefined) return null;
        const hautes = minutesHautesEstimees(p);
        if (hautes === undefined) return null;
        return hautes <= minutesRestantes
            ? `tient dans les ${minutesRestantes} min de pause`
            : `dépasse les ${minutesRestantes} min de pause`;
    };

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-0.5 w-fit">
                {moteurs.map(p => {
                    const distant = p !== 'ollama';
                    const Icone = distant ? Cloud : Cpu;
                    /*
                      **Un moteur sans clé se propose quand même, mais grisé.**
                      Le masquer laisserait croire qu'il n'existe pas ; l'offrir
                      sans le dire ferait échouer la Forge au bout de son invite.
                    */
                    const utilisable = !distant || !!configs[p]?.apiKey;
                    const actif = retenu === p;
                    return (
                        <button
                            key={p}
                            disabled={!utilisable}
                            title={utilisable ? undefined : 'Aucune clé enregistrée pour ce moteur'}
                            onClick={() => retenir(forge, p === activeProvider ? undefined : p)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-ui-10 font-bold uppercase tracking-widest transition-all
                                ${actif ? 'bg-indigo-500/20 text-indigo-300' : 'text-app-text/40 hover:text-app-text/70'}
                                ${utilisable ? '' : 'opacity-30 cursor-not-allowed'}`}
                        >
                            <Icone size={11} />
                            {distant ? 'Distant' : 'Local'}
                            <span className="font-mono opacity-60 normal-case tracking-normal">
                                {DUREE_ESTIMEE[p]}
                            </span>
                        </button>
                    );
                })}
            </div>

            {verdictDePause(retenu) && (
                <span className="text-ui-10 text-app-text/40 pl-1">
                    {verdictDePause(retenu)}
                </span>
            )}
        </div>
    );
};

export default SelecteurDeMoteur;
