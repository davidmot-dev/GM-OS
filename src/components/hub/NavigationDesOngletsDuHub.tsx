import { Bouton } from '../socle/Bouton';

const ONGLETS = [
    { id: 'live', label: 'Direct' }, { id: 'archives', label: 'Archives' },
    { id: 'trombinoscope', label: 'PNJ' }, { id: 'atlas', label: 'Lieux' },
    { id: 'inventory', label: 'Inventaire' }, { id: 'cartes', label: 'Cartes' },
    { id: 'modules-du-jeu', label: 'Modules du jeu' },
] as const;
export type OngletDuHub = typeof ONGLETS[number]['id'];

export function NavigationDesOngletsDuHub({ courant, onChange, cartesProposees }: {
    courant: OngletDuHub; onChange: (onglet: OngletDuHub) => void; cartesProposees: number;
}) {
    return <div className="grid grid-cols-4 gap-1 lg:grid-cols-7">
        {ONGLETS.map(tab => <Bouton habillage="socle" variante={courant === tab.id ? 'accent' : 'neutre'} cibleTactile
            key={tab.id} data-hub-tab={tab.id} onClick={() => onChange(tab.id)} aria-pressed={courant === tab.id}
            className="relative w-full min-w-[44px] px-1" title={tab.label}>
            <span className="text-[12px] tracking-normal">{tab.label}</span>
            {tab.id === 'cartes' && cartesProposees > 0 && courant !== 'cartes' && <span className="absolute top-0 right-0 md:-top-1 md:-right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-etat-danger opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-etat-danger text-ui-9 items-center justify-center font-bold text-app-bg">{cartesProposees}</span>
            </span>}
        </Bouton>)}
    </div>;
}
