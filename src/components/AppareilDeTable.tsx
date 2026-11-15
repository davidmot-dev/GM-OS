import React, { useState } from 'react';
import { CadreDeTablette } from './socle/CadreDeTablette';
import { VueDeModule } from '../modules/modulesDuJeu/vuesDuRegistre';
import { useAppareilDeTable } from '../modules/modulesDuJeu/useAppareilDeTable';

/**
 * **L'appareil de table** (`?window=appareil-de-table`) — Fire HD 8, registre § 256, T11.
 *
 * Décisions de David du 15/11/2026 : la Fire posée au milieu de la table devient l'appareil commun
 * du groupe (Q2) ; le meneur y ouvre un module comme à un personnage, en cochant « La table » ; le
 * M314 d'abord (Q7). Dessin : maquette Stitch validée
 * (`documentation/Planning/visuels/fire-hd8-2026-11-15/4-appareil-de-table.png`) — un bandeau de
 * 40 px, le module en plein écran avec son propre dessin.
 *
 * La Fire ne reçoit que le flux caviardé des joueurs (rôle `table`) et n'écrit rien : ses gestes
 * sont des commandes que le service des modules accepte ou refuse.
 */
const AppareilDeTable: React.FC = () => {
    const { etat, vue, commander } = useAppareilDeTable();
    const [choisi, choisir] = useState<string | null>(null);
    const modules = vue?.modules ?? [];
    const ouvert = modules.find(m => m.id === choisi) ?? modules[0] ?? null;

    return (
        <CadreDeTablette className="h-dvh bg-app-bg text-app-text font-inter overflow-hidden flex flex-col">
            <header className="shrink-0 h-10 flex items-center gap-3 border-b border-app-border px-4 text-[13px]">
                <span className="flex items-center gap-2 uppercase tracking-widest text-app-muted">
                    <span aria-hidden className={`h-2 w-2 rounded-full ${etat === 'connecte' ? 'bg-accent' : 'bg-app-text/30'}`} />
                    Appareil de table{ouvert ? ' · Ouvert par le meneur' : ''}
                </span>
                {modules.length > 1 ? (
                    <nav aria-label="Modules ouverts à la table" className="mx-auto flex gap-1">
                        {modules.map(m => (
                            <button type="button" key={m.id} onClick={() => choisir(m.id)} aria-pressed={m.id === ouvert?.id}
                                className="min-h-[36px] rounded px-3 text-app-muted aria-pressed:bg-accent/10 aria-pressed:text-accent">{m.libelle}</button>
                        ))}
                    </nav>
                ) : <span className="mx-auto font-bold text-app-text">{ouvert?.libelle ?? ''}</span>}
            </header>

            <main className="flex-1 min-h-0 overflow-auto">
                {ouvert ? (
                    <VueDeModule key={`${vue?.campagneId}:${ouvert.id}:${ouvert.ouverture ?? vue?.contexte}`} id={ouvert.id} role="joueur"
                        vue={ouvert.vue} horloge={vue?.horloge} envoyerCommande={commande => commander(ouvert.id, commande)} />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-3 p-6 text-center">
                        <p className="text-[22px] font-bold text-app-text">
                            {etat === 'table-prise' ? 'Une autre tablette sert déjà d’appareil de table.'
                                : etat === 'connecte' ? 'Aucun module ouvert à la table.'
                                : 'Connexion au poste du meneur…'}
                        </p>
                        <p className="max-w-[42ch] text-[15px] text-app-muted">
                            {etat === 'table-prise' ? 'Ferme-la, ou choisis un autre rôle pour celle-ci.'
                                : 'Le meneur ouvre un module en cochant « La table » dans ses accès.'}
                        </p>
                    </div>
                )}
            </main>
        </CadreDeTablette>
    );
};

export default AppareilDeTable;
