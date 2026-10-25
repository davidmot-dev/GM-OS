import React, { useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { useRessourcesDeTableStore } from './useRessourcesDeTableStore';
import { ressourcesDeLaTable } from './reservesDuGroupe';
import { gmToast } from '../../stores/useToastStore';
import { ecrireLesHeros } from './ecrireLesHeros';
import { DEFAULT_SHEET_TEMPLATES } from '../../data/defaultSheetTemplates';
import { BoutonPrincipal, BoutonSecondaire } from '../../components/socle/CadreDeSurcouche';
import ChoixEntraideNocturne from './ChoixEntraideNocturne';
import { calmeNocturne, debordementNocturne, type ChoixEntraideNocturne as Entraide } from './entraideNocturne';
import { HealthInterpreter } from '../session/logic/HealthInterpreter';
import { avecOrigine } from '../session/logic/origineDesModifications';
import {
    changementsEffectifs, effetsDuDebordement, herosDeLaCampagne, momentDeCalme, nombreDEffetsAChoisir, recuperationDesHeros,
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
export type GesteDesHeros = 'calme' | 'debordement' | 'finDeScene' | 'bonneNuit';

const FenetreDesGestesDesHeros: React.FC<{ geste: GesteDesHeros; onClose: () => void }> = ({ geste, onClose }) => {
    const players = useSessionOSStore(s => s.players);
    const entities = useSessionOSStore(s => s.entities);
    const campaigns = useSessionOSStore(s => s.campaigns);
    const activeCampaignId = useSessionOSStore(s => s.activeCampaignId);
    const updateCharacter = useSessionOSStore(s => s.updateCharacter);
    const updateCharacterHealth = useSessionOSStore(s => s.updateCharacterHealth);
    const pilote = useSessionOSStore(s => s.getActiveDriver());
    const fichesPerso = useSessionOSStore(s => s.customSheetTemplates);
    const { etatDe, gagner, depenser, finDeScene: eroderEnFinDeScene } = useRessourcesDeTableStore();
    const [choix, setChoix] = useState<Record<string, number>>({});
    const [entraide, setEntraide] = useState<Entraide>({});
    const applique = useRef(false);
    // L'aperçu dit « Fatigué », « Extase » — les libellés de la fiche du jeu, pas les identifiants.
    const gabarit = [...(fichesPerso ?? []), ...DEFAULT_SHEET_TEMPLATES].find(t => t.id === pilote?.templateId);
    const libelles = new Map((gabarit?.sections ?? []).flatMap(s => s.fields.map(f => [f.id, f.label] as const)));
    const nom = (champ: string) => libelles.get(champ) ?? champ;

    const campagne = campaigns.find(c => c.id === activeCampaignId);
    const ressources = ressourcesDeLaTable(pilote, campagne);
    const etat = activeCampaignId ? etatDe(activeCampaignId, ressources) : {};
    const heros = herosDeLaCampagne(players, activeCampaignId);
    const participantsNocturnes = [...heros, ...entities.filter(e => e.campaignId === activeCampaignId && e.role === 'ally' && e.status !== 'dead' && e.sheetData?.espoir !== undefined)
        .map(e => ({ id: e.id, joueurId: '', nom: `${e.name} (allié)`, valeurs: e.sheetData ?? {}, allie: true }))];
    const calme = pilote?.gestesDesHeros?.momentDeCalme;
    const debordement = pilote?.gestesDesHeros?.effetsDuDebordement;
    // La fin de scène (Symbaroum, 2026-10-22) : les fiches, puis l'érosion des réserves qui en déclarent une.
    const finDeScene = pilote?.gestesDesHeros?.finDeScene;
    // La bonne nuit (Crimes, 2026-10-22) : l'épuisement qui se repose, lu Héros par Héros comme la fin de scène.
    const bonneNuit = pilote?.gestesDesHeros?.bonneNuit;
    const declare = { calme: !!calme, debordement: !!debordement, finDeScene: !!finDeScene?.length, bonneNuit: !!bonneNuit?.length }[geste];

    if (!activeCampaignId || !declare) {
        return <p className="px-5 py-4 text-app-muted">Le jeu de cette campagne ne déclare pas ce geste.</p>;
    }

    const nomDe = (id: string) => ressources.find(r => r.id === id)?.label ?? id;
    const aChoisir = debordement ? nombreDEffetsAChoisir(etat[debordement.nombreSelon]) : 0;
    const choisis = Object.values(choix).reduce((a, b) => a + b, 0);
    const erosion = geste === 'finDeScene' && ressources.some(r => r.erosionFinDeScene);
    const nocturne = pilote?.gestesDesHeros?.entraideNocturne;
    const repos = nocturne && geste === 'calme' ? calmeNocturne(calme!, participantsNocturnes, entraide, nom) : undefined;
    const effets = nocturne && geste === 'debordement' ? debordementNocturne(debordement!.effets, choix, participantsNocturnes, entraide, nom) : undefined;
    const erreurs = repos?.erreurs ?? effets?.erreurs ?? [];
    const apercu: { changements: ChangementDuHeros[]; aDire: string[] } = geste === 'calme'
        ? repos ?? { changements: momentDeCalme(calme!, heros, nom), aDire: [] }
        : geste === 'finDeScene'
            ? { changements: recuperationDesHeros(finDeScene, heros, nom), aDire: erosion ? ['Les réserves de table s’érodent aussi.'] : [] }
            : geste === 'bonneNuit'
                ? { changements: recuperationDesHeros(bonneNuit, heros, nom), aDire: [] }
                : effets ?? effetsDuDebordement(debordement!.effets, choix, heros, nom);
    const effectifs = changementsEffectifs(apercu.changements);
    const tableQuiBouge = geste === 'calme' && (!repos || repos.collectif) ? (calme!.table ?? []) : [];

    const appliquer = () => {
        if (applique.current || erreurs.length) return;
        applique.current = true;
        ecrireLesHeros(effectifs, { players, updateCharacter, updateCharacterHealth });
        if (nocturne) avecOrigine('geste de table', () => {
            const session = useSessionOSStore.getState();
            for (const c of effectifs.filter(c => !c.joueurId)) {
                const allie = session.entities.find(e => e.id === c.herosId && e.campaignId === activeCampaignId && e.role === 'ally');
                if (!allie) continue;
                session.updateEntity(allie.id, { sheetData: { ...allie.sheetData, ...c.maj } });
                if (allie.healthSystem?.type === 'boxes' && typeof c.maj.blessures === 'number') {
                    const avant = (Array.isArray(allie.healthSystem.data.boxes) ? allie.healthSystem.data.boxes as { filled?: boolean }[] : []).filter(b => b.filled).length;
                    const ecart = c.maj.blessures - avant;
                    if (ecart) session.updateEntityHealth(allie.id, HealthInterpreter.handleBoxes(allie.healthSystem, { value: Math.abs(ecart), isRecovery: ecart < 0 }));
                }
            }
        });
        if (erosion) for (const a of eroderEnFinDeScene(activeCampaignId, ressources).avertissements) gmToast(a, 'info');
        const motif = geste === 'calme' ? 'moment de calme' : geste === 'finDeScene' ? 'fin de scène'
            : geste === 'bonneNuit' ? 'bonne nuit' : `effets du ${nomDe(debordement!.ressource)}`;
        for (const t of tableQuiBouge) {
            const r = t.delta < 0
                ? depenser(activeCampaignId, ressources, t.ressource, -t.delta, motif)
                : gagner(activeCampaignId, ressources, t.ressource, t.delta, motif);
            for (const a of r.avertissements) gmToast(a, 'info');
        }
        if (geste !== 'finDeScene' && geste !== 'bonneNuit') for (const a of apercu.aDire) gmToast(a, 'info');
        gmToast(effectifs.length
            ? `${{ calme: 'Moment de calme', debordement: 'Effets appliqués', finDeScene: 'Fin de scène', bonneNuit: 'Bonne nuit' }[geste]} : ${effectifs.length} fiche${effectifs.length > 1 ? 's' : ''} mise${effectifs.length > 1 ? 's' : ''} à jour.`
            : 'Aucune fiche à changer.', 'success');
        onClose();
    };

    return (
        <div className="flex flex-col gap-4 px-5 py-4" data-gestes-des-heros={geste}>
            {nocturne && (geste === 'calme' || geste === 'debordement') && <ChoixEntraideNocturne
                calme={geste === 'calme'} heros={participantsNocturnes} choix={entraide} changer={setEntraide}
                recuperations={repos?.recuperations} amputations={repos?.amputations} />}
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
                {erreurs.length > 0 && <ul role="alert" className="text-xs text-etat-alerte">{erreurs.map((e, i) => <li key={i}>{e}</li>)}</ul>}
                <BoutonSecondaire onClick={onClose}>Annuler</BoutonSecondaire>
                <BoutonPrincipal onClick={appliquer} disabled={erreurs.length > 0 || (geste === 'debordement' && choisis === 0) || (repos && repos.changements.length === 0)}
                    className="disabled:opacity-30 disabled:cursor-not-allowed">
                    Appliquer
                </BoutonPrincipal>
            </div>
        </div>
    );
};

export default FenetreDesGestesDesHeros;
