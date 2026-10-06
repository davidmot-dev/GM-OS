import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { EnTeteDeModule, GabaritDeModule } from '../../../components/socle';

/** T4 : le titre reste visible, seul le travail défile au-dessus des onglets. */
export function RemoteModule({ titre, icone: Icone, children }: {
    titre: string;
    icone: LucideIcon;
    children: ReactNode;
}) {
    return <GabaritDeModule className="mx-auto max-w-7xl" entete={
        <EnTeteDeModule habillage="libre" className="shrink-0">
            <h1 className="flex items-center gap-3 text-[24px] font-bold text-app-text">
                <Icone size={24} className="shrink-0 text-accent" />{titre}
            </h1>
        </EnTeteDeModule>
    }>{children}</GabaritDeModule>;
}
