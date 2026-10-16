import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { useRessourcesDeTableStore } from './useRessourcesDeTableStore';
import { ressourcesDeLaTable } from './reservesDuGroupe';
import { gmToast } from '../../stores/useToastStore';
import { ecrireLesHeros } from './ecrireLesHeros';
import { BoutonPrincipal, BoutonSecondaire } from '../../components/socle/CadreDeSurcouche';
import {
    changementsEffectifs, effetsDuDebordement, herosDeLaCampagne, momentDeCalme, nombreDEffetsAChoisir,
    type ChangementDuHeros,
} from './gestesDesHeros';

/**
 * **Le moment de calme et les effets du débordement** — NOC, 2026-10-16.
 *
 * Deux gestes qui écrivent sur la fiche de chaque Héros d'un seul clic : on les
 * **lit avant de les appliquer**. La fenêtre montre, Héros par Héros, ce qui va
 * changer et pourquoi (« Trauma 3 → 4 (+1, folie 1) »), puis écrit.
 *
 * Les effets du Fiel se choisissent ici : autant que vaut la Menace, le même
 * plusieurs fois si la Loi le veut. Le compte est dit, pas imposé — c'est la Loi
 * qui décide, l'outil rappelle la règle.
 */
export type GesteDesHeros = 'calme' | 'debordement';

const FenetreDesGestesDesHeros: React.FC<{ geste: GesteDesHeros; onClose: () => void }> = ({ geste, onClose }) => {
    const players = useSessionOSStore(s => s.players);
    const campaigns = useSessionOSStore(s => s.campaigns);
    const activeCampaignId = useSessionOSStore(s => s.activeCampaignId);
    const updateCharacter = useSessionOSStore(s => s.updateCharacter);
    const updateCharacterHealth = useSessionOSStore(s => s.updateCharacterHealth);
    const pilote = useSessionOSStore(s => s.getActiveDriver());
    const { etatDe, gagner, depenser } = useRessourcesDeTableStore();
    const [choix, setChoix] = useState<Record<string, number>>({});

    const campagne = campaigns.find(c => c.id === activeCampaignId);
    const ressources = ressourcesDeLaTable(pilote, campagne);
    const etat = activeCampaignId ? etatDe(activeCampaignId, ressources) : {};
    const heros = herosDeLaCampagne(players, activeCampaignId);
    const calme = pilote?.gestesDesHeros?.momentDeCalme;
    const debordement = pilote?.gestesDesHeros?.effetsDuDebordement;

    if (!activeCampaignId || (geste === 'calme' ? !calme : !debordement)) {
        return <p className="px-5 py-4 text-app-muted">Le jeu de cette campagne ne déclare pas ce geste.</p>;
    }

    const nomDe = (id: string) => ressources.find(r => r.id === id)?.label ?? id;
    const aChoisir = debordement ? nombreDEffetsAChoisir(etat[debordement.nombreSelon]) : 0;
    const choisis = Object.values(choix).reduce((a, b) => a + b, 0);
    const apercu: { changements: ChangementDuHeros[]; aDire: string[] } = geste === 'calme'
        ? { changements: momentDeCalme(calme!, heros), aDire: [] }
        : effetsDuDebordement(debordement!.effets, choix, heros);
    const effectifs = changementsEffectifs(apercu.changements);
    const tableQuiBouge = geste === 'calme' ? (calme!.table ?? []) : [];

    const appliquer = () => {
        ecrireLesHeros(effectifs, { players, updateCharacter, updateCharacterHealth });
        const motif = geste === 'calme' ? 'moment de calme' : `effets du ${nomDe(debordement!.ressource)}`;
        for (const t of tableQuiBouge) {
            const r = t.delta < 0
                ? depenser(activeCampaignId, ressources, t.ressource, -t.delta, motif)
                : gagner(activeCampaignId, ressources, t.ressource, t.delta, motif);
            for (const a of r.avertissements) gmToast(a, 'info');
        }
        for (const a of apercu.aDire) gmToast(a, 'info');
        gmToast(effectifs.length
            ? `${geste === 'calme' ? 'Moment de calme' : 'Effets appliqués'} : ${effectifs.length} fiche${effectifs.length > 1 ? 's' : ''} mise${effectifs.length > 1 ? 's' : ''} à jour.`
            : 'Aucune fiche à changer.', 'success');
        onClose();
    };

    return (
        <div className="flex flex-col gap-4 px-5 py-4" data-gestes-des-heros={geste}>
            {geste === 'debordement' && debordement && (
                <section className="flex flex-col gap-2" aria-label="Effets à choisir">
                    <p className="text-sm text-app-text">
                        {nomDe(debordement.nombreSelon)} à {aChoisir} : <strong>{aChoisir} effet{aChoisir > 1 ? 's' : ''} à choisir</strong>
                        {' '}— le même peut l'être plusieurs fois. {choisis} choisi{choisis > 1 ? 's' : ''}.
                    </p>
                    {debordement.effets.map(e => {
                        const n = choix[e.id] ?? 0;
                        return (
                            <div key={e.id} className="flex items-start gap-3 rounded-lg border border-app-border/40 p-2">
                                <div className="flex items-center gap-1 shrink-0">
                                    <button type="button" aria-label={`Une fois de moins : ${e.label}`} disabled={n === 0}
                                        onClick={() => setChoix({ ...choix, [e.id]: n - 1 })}
                                        className="p-1 rounded-md border border-app-border/40 disabled:opacity-30"><Minus size={12} /></button>
                                    <span className="w-6 text-center font-mono font-black">{n}</span>
                                    <button type="button" aria-label={`Une fois de plus : ${e.label}`}
                                        onClick={() => setChoix({ ...choix, [e.id]: n + 1 })}
                                        className="p-1 rounded-md border border-app-border/40"><Plus size={12} /></button>
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-app-text">{e.label}</p>
                                    {e.description && <p className="text-xs text-app-muted">{e.description}</p>}
                                </div>
                            </div>
                        );
                    })}
                    {choisis !== aChoisir && (
                        <p className="text-xs text-etat-alerte" role="status">
                            La règle en demande {aChoisir} ; {choisis} choisi{choisis > 1 ? 's' : ''}.
                        </p>
                    )}
                </section>
            )}

            <section className="flex flex-col gap-2" aria-label="Ce qui va changer">
                {tableQuiBouge.map(t => (
                    <p key={t.ressource} className="text-sm text-app-text">
                        {nomDe(t.ressource)} {t.delta > 0 ? `+${t.delta}` : t.delta} ({etat[t.ressource] ?? 0} aujourd'hui)
                    </p>
                ))}
                {heros.length === 0 && <p className="text-sm text-app-muted">Aucun Héros n'est lié à cette campagne.</p>}
                {apercu.changements.map(c => (
                    <div key={c.herosId} className="rounded-lg border border-app-border/30 p-2">
                        <p className="font-bold text-app-text">{c.nom}</p>
                        {c.lignes.length
                            ? <ul className="text-xs text-app-text/80">{c.lignes.map((l, i) => <li key={i}>{l}</li>)}</ul>
                            : <p className="text-xs text-app-muted">Rien ne change.</p>}
                    </div>
                ))}
                {apercu.aDire.map((a, i) => <p key={i} className="text-xs text-app-muted">{a}</p>)}
            </section>

            <div className="flex justify-end gap-2">
                <BoutonSecondaire onClick={onClose}>Annuler</BoutonSecondaire>
                <BoutonPrincipal onClick={appliquer} disabled={geste === 'debordement' && choisis === 0}
                    className="disabled:opacity-30 disabled:cursor-not-allowed">
                    Appliquer
                </BoutonPrincipal>
            </div>
        </div>
    );
};

export default FenetreDesGestesDesHeros;
