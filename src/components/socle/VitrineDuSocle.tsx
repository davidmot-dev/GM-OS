import React, { useState } from 'react';
import { Dices, Music, Swords, Plus } from 'lucide-react';
import { useSessionStore } from '../../store/useSessionStore';
import { useSessionOSStore } from '../../modules/session/useSessionOSStore';
import {
    Bouton, Etiquette, EnTeteDeModule, GabaritDeModule, Jauge, Panneau, Separateur, Tuile,
    type VarianteDeBouton, type TonDEtiquette,
} from './index';

/**
 * **La vitrine du socle** — P3.8, décision de David du 2026-09-30 : *un écran
 * dans GM-OS*, ouvert depuis la palette (`Ctrl+K`, « Vitrine du socle »), pour
 * juger chaque composant **sous le thème de base et le jeu actifs** — en
 * basculant les personnalités ou la campagne, la vitrine suit.
 *
 * Elle est elle-même montée dans le gabarit : c'est la grammaire d'écran, vue
 * en vrai.
 */
const VARIANTES: VarianteDeBouton[] = ['accent', 'neutre', 'succes', 'danger'];
const TONS: TonDEtiquette[] = ['neutre', 'accent', 'succes', 'alerte', 'danger', 'info'];

export const VitrineDuSocle: React.FC = () => {
    const theme = useSessionStore(s => s.theme);
    const personnalites = useSessionStore(s => s.personnalites);
    const campagne = useSessionOSStore(s => s.campaigns.find(c => c.id === s.activeCampaignId)?.name);
    const [aLaTable, setALaTable] = useState(false);
    const [reglagesOuverts, setReglagesOuverts] = useState(true);
    const [tuileActive, setTuileActive] = useState(1);

    return (
        <div className="h-[75vh]" data-vitrine-du-socle="">
            <GabaritDeModule
                aLaTable={aLaTable}
                reglagesOuverts={reglagesOuverts}
                entete={
                    <EnTeteDeModule
                        surtitre="Refonte · phase 3"
                        titre="Vitrine du socle"
                        etat={<>
                            <Etiquette ton="accent">thème {theme}</Etiquette>
                            <Etiquette ton={personnalites ? 'succes' : 'neutre'}>personnalités {personnalites ? 'allumées' : 'éteintes'}</Etiquette>
                            <Etiquette>{campagne ?? 'aucune campagne'}</Etiquette>
                        </>}
                        actions={<Bouton onClick={() => setALaTable(v => !v)}>{aLaTable ? 'Régime atelier' : 'Régime table'}</Bouton>}
                    />
                }
                barreDOutils={<>
                    <Bouton variante="accent" icone={<Plus size={14} />}>Action principale</Bouton>
                    <Bouton>Secondaire</Bouton>
                    <Bouton disabled>Désactivé</Bouton>
                    {aLaTable && <Bouton onClick={() => setReglagesOuverts(v => !v)}>{reglagesOuverts ? 'Replier les réglages' : 'Réglages'}</Bouton>}
                </>}
                reglages={<>
                    <Panneau niveau={1} className="p-4">
                        <h3 className="mb-3 font-display text-sm text-app-text">Boutons</h3>
                        <div className="flex flex-col gap-2">
                            {VARIANTES.map(v => <Bouton key={v} variante={v} aLaTable={aLaTable}>{v}</Bouton>)}
                        </div>
                    </Panneau>
                    <Separateur />
                    <Panneau niveau={1} className="p-4">
                        <h3 className="mb-3 font-display text-sm text-app-text">Étiquettes</h3>
                        <div className="flex flex-wrap gap-1.5">
                            {TONS.map(t => <Etiquette key={t} ton={t}>{t}</Etiquette>)}
                        </div>
                    </Panneau>
                </>}
            >
                <div className="grid grid-cols-3 gap-4">
                    <Panneau niveau={1} orne className="p-5">
                        <p className="text-ui-11 font-bold uppercase text-app-muted">Niveau 1 · posé · orné</p>
                        <p className="mt-2 text-sm text-app-text">Une carte, un bloc de réglages. Ses coins sont ceux du thème.</p>
                    </Panneau>
                    <Panneau niveau={2} className="p-5">
                        <p className="text-ui-11 font-bold uppercase text-app-muted">Niveau 2 · flottant</p>
                        <p className="mt-2 text-sm text-app-text">Un panneau surélevé, sur la deuxième surface.</p>
                    </Panneau>
                    <Panneau niveau={3} className="p-5">
                        <p className="text-ui-11 font-bold uppercase text-app-muted">Niveau 3 · dialogue</p>
                        <p className="mt-2 text-sm text-app-text">Une fenêtre au-dessus du reste.</p>
                    </Panneau>

                    <Panneau niveau={1} className="col-span-2 flex flex-col gap-3 p-5">
                        <p className="text-ui-11 font-bold uppercase text-app-muted">Jauges — vert, puis ambre sous la moitié, rouge sous 25 %</p>
                        {[1, 0.6, 0.4, 0.15].map(v => (
                            <div key={v} className="flex items-center gap-3">
                                <span className="w-10 font-mono text-sm text-app-text">{Math.round(v * 100)}%</span>
                                <Jauge valeur={v} libelle={`Jauge à ${Math.round(v * 100)} %`} />
                            </div>
                        ))}
                    </Panneau>
                    <Panneau niveau={1} vide className="min-h-40 p-5">
                        <p className="text-ui-11 font-bold uppercase text-app-muted">Panneau vide · filigrane</p>
                    </Panneau>

                    <div className="col-span-3 grid grid-cols-4 gap-3">
                        {[Swords, Dices, Music].map((Icone, i) => (
                            <Tuile key={i} actif={tuileActive === i} onClick={() => setTuileActive(i)}>
                                <Icone size={28} className="text-accent" />
                                <span className="text-sm">Tuile {i + 1}</span>
                            </Tuile>
                        ))}
                        <Tuile disabled><span className="text-sm">Désactivée</span></Tuile>
                    </div>
                </div>
            </GabaritDeModule>
        </div>
    );
};

export default VitrineDuSocle;
