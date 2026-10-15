import { Blocks } from 'lucide-react';
import { HubConsultation, type CommandesDeConsultation } from './HubConsultation';

/** Les ouvertures autorisées arriveront par le futur canal privé ; aucun état MJ n'est lu ici. */
export function HubModulesDuJeu(props: CommandesDeConsultation) {
    return <HubConsultation ecran="modules-du-jeu" titre="Modules du jeu" description="Les outils de ta partie, ouverts par le meneur." compteur="Aucun module ouvert" icone={Blocks} {...props}>
        <div className="rounded-lg border border-app-border bg-app-surface p-5 text-[14px] text-app-muted">Aucun module ouvert par le meneur.</div>
    </HubConsultation>;
}
