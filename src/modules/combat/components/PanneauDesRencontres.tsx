import React, { useMemo, useState } from 'react';
import { Swords, Trash2, Users, MapPin, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { scenesDansLEtat } from '../../session/logic/trame';
import { useCombatStore } from '../useCombatStore';
import { useBestiaireStore } from '../useBestiaireStore';
import { gmConfirm } from '../../../stores/useModalStore';
import { gmToast } from '../../../stores/useToastStore';
import { BoutonPrincipal, BoutonSecondaire } from '../../../components/socle';
import { archetypeParId, proposerLesChamps } from '../logic/archetypes';
import {
    adversairesDeLaRencontre, champsDuPilote, pjsCandidats, sceneDeLInvocation,
} from '../logic/invocationDeRencontre';
import type { RencontrePreparee } from '../../../types/rencontres.types';

/**
 * **Les rencontres préparées, invoquées depuis Combat-OS** (2026-10-12, R1).
 *
 * *Constat de la première séance jouée : « je n'ai pas utilisé Combat-OS parce
 * que la mise en place est trop longue ».* Une rencontre se prépare à l'avance ;
 * en séance, on l'invoque : les adversaires sont fabriqués, les PNJ arrivent,
 * et **le meneur coche les PJ qui entrent**. L'initiative ne se tire pas.
 *
 * L'ordre de la liste suit la question qu'on se pose à la table — *qu'est-ce
 * qui m'attend ici ?* : la scène du combat, les scènes en cours, les rencontres
 * libres, puis le reste, replié.
 */
interface Props {
    onClose: () => void;
}

const resumeDesLignes = (r: RencontrePreparee, nomDuPNJ: (id: string) => string | undefined) =>
    r.lignes.map(l => {
        if (l.genre === 'entite') return nomDuPNJ(l.entiteId) ?? 'PNJ disparu';
        const nom = l.genre === 'gabarit' ? l.nom : (l.nom?.trim() || archetypeParId(l.archetypeId).nom);
        return l.nombre > 1 ? `${l.nombre} × ${nom}` : nom;
    }).join(', ');

const PanneauDesRencontres: React.FC<Props> = ({ onClose }) => {
    const {
        rencontres, scenes, actes, entities, players, activeCampaignId, customSheetTemplates,
        supprimerUneRencontre,
    } = useSessionOSStore();
    const driver = useSessionOSStore(s => s.getActiveDriver());
    const { sceneId: sceneDuCombat, combatants, invoquerLaRencontre } = useCombatStore();
    const { gabaritsDuJeu, repartitionRetenue } = useBestiaireStore();

    const [enChoix, setEnChoix] = useState<RencontrePreparee | null>(null);
    const [coches, setCoches] = useState<Set<string>>(new Set());
    const [autresOuvertes, setAutresOuvertes] = useState(false);

    const deLaCampagne = useMemo(
        () => (rencontres ?? []).filter(r => r.campaignId === activeCampaignId),
        [rencontres, activeCampaignId],
    );
    const enCours = useMemo(
        () => scenesDansLEtat(scenes, actes, activeCampaignId, 'en-cours').map(s => s.id),
        [scenes, actes, activeCampaignId],
    );
    const titreDeScene = (id?: string) => scenes.find(s => s.id === id)?.titre;
    const nomDuPNJ = (id: string) => entities.find(e => e.id === id)?.name;

    const groupes = useMemo(() => {
        const ici = deLaCampagne.filter(r => r.sceneId && r.sceneId === sceneDuCombat);
        const ouvertes = deLaCampagne.filter(r => r.sceneId && r.sceneId !== sceneDuCombat && enCours.includes(r.sceneId));
        const libres = deLaCampagne.filter(r => !r.sceneId);
        const autres = deLaCampagne.filter(r => r.sceneId && r.sceneId !== sceneDuCombat && !enCours.includes(r.sceneId));
        return { ici, ouvertes, libres, autres };
    }, [deLaCampagne, sceneDuCombat, enCours]);

    const personnages = useMemo(() => players.flatMap(p => p.characters ?? []), [players]);
    const engages = combatants.map(c => c.sourcePlayerId).filter((id): id is string => !!id);

    /** Ouvre « Qui entre ? », cochés d'avance : les PJ que la scène déclare présents. */
    const choisirLesPJ = (r: RencontrePreparee) => {
        const cible = sceneDeLInvocation(r, sceneDuCombat, enCours);
        const presents = scenes.find(s => s.id === cible)?.personnagesIds ?? [];
        const candidats = pjsCandidats(personnages, activeCampaignId, presents, engages);
        setCoches(new Set(candidats.filter(c => c.present && !c.dejaEngage).map(c => c.id)));
        setEnChoix(r);
    };

    const candidats = enChoix
        ? pjsCandidats(
            personnages, activeCampaignId,
            scenes.find(s => s.id === sceneDeLInvocation(enChoix, sceneDuCombat, enCours))?.personnagesIds ?? [],
            engages,
        )
        : [];

    const invoquer = () => {
        if (!enChoix) return;
        const jeuId = driver?.id ?? 'sans-pilote';
        const champs = champsDuPilote(driver?.templateId, customSheetTemplates);
        const { combattants, avertissements } = adversairesDeLaRencontre(enChoix, {
            champs,
            typeDeSante: driver?.combat?.defaultHealthType ?? 'hp',
            gabarits: gabaritsDuJeu(jeuId),
            entites: entities,
            repartitionDe: (archetypeId) =>
                repartitionRetenue(jeuId, archetypeId) ?? proposerLesChamps(archetypeParId(archetypeId), champs),
            graine: Math.floor(Math.random() * 1e9),
        });
        invoquerLaRencontre({
            sceneId: sceneDeLInvocation(enChoix, sceneDuCombat, enCours),
            adversaires: combattants,
            pjs: candidats.filter(c => coches.has(c.id) && !c.dejaEngage),
        });
        avertissements.forEach(a => gmToast(a, 'warning'));
        gmToast(`« ${enChoix.nom} » : ${combattants.length} adversaire(s) dans l’ordre du tour`, 'success');
        onClose();
    };

    /* ── « Qui entre ? » ───────────────────────────────────── */
    if (enChoix) {
        return (
            <div
                className="flex flex-col gap-4 p-5"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); invoquer(); } }}
            >
                <div>
                    <p className="text-ui-11 font-bold uppercase tracking-widest text-app-muted">Qui entre ?</p>
                    <p className="text-lg font-bold text-app-text">{enChoix.nom}</p>
                    <p className="text-sm text-app-muted">{resumeDesLignes(enChoix, nomDuPNJ)}</p>
                </div>

                {candidats.length === 0 ? (
                    <p className="text-sm text-app-muted">Aucun PJ dans cette campagne.</p>
                ) : (
                    <ul className="grid grid-cols-1 gap-2 min-[560px]:grid-cols-2">
                        {candidats.map(c => (
                            <li key={c.id}>
                                <label className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
                                    c.dejaEngage ? 'border-app-border/40 opacity-50' : 'border-app-border hover:border-accent/50 cursor-pointer'
                                }`}>
                                    <input
                                        type="checkbox"
                                        className="accent-[var(--accent)]"
                                        disabled={c.dejaEngage}
                                        checked={c.dejaEngage || coches.has(c.id)}
                                        onChange={(e) => setCoches(prev => {
                                            const suite = new Set(prev);
                                            if (e.target.checked) suite.add(c.id); else suite.delete(c.id);
                                            return suite;
                                        })}
                                    />
                                    <span className="font-bold text-app-text">{c.name}</span>
                                    {c.dejaEngage && <span className="ml-auto text-ui-10 text-app-muted">déjà au combat</span>}
                                </label>
                            </li>
                        ))}
                    </ul>
                )}

                <p className="text-ui-11 text-app-muted">
                    L’initiative ne se tire pas : à toi de la lancer, ou aux joueurs.
                </p>

                <div className="flex justify-end gap-2">
                    <BoutonSecondaire onClick={() => setEnChoix(null)}>Retour</BoutonSecondaire>
                    <BoutonPrincipal autoFocus onClick={invoquer}>Invoquer</BoutonPrincipal>
                </div>
            </div>
        );
    }

    /* ── La liste ──────────────────────────────────────────── */
    const ligne = (r: RencontrePreparee) => (
        <li key={r.id} className="flex items-start gap-3 rounded-lg border border-app-border bg-app-bg/40 px-3 py-2">
            <div className="min-w-0 flex-1">
                <p className="font-bold text-app-text">{r.nom}</p>
                <p className="truncate text-sm text-app-muted">{resumeDesLignes(r, nomDuPNJ) || 'Aucun adversaire'}</p>
                {r.sceneId && (
                    <p className="mt-0.5 flex items-center gap-1 text-ui-11 text-app-muted">
                        <MapPin size={11} /> {titreDeScene(r.sceneId) ?? 'Scène introuvable'}
                    </p>
                )}
                {r.notes && <p className="mt-1 text-ui-11 text-app-text/70">{r.notes}</p>}
            </div>
            <BoutonPrincipal
                className="shrink-0 flex items-center gap-1.5"
                disabled={r.lignes.length === 0}
                onClick={() => choisirLesPJ(r)}
            >
                <Swords size={14} /> Invoquer
            </BoutonPrincipal>
            <button
                type="button"
                title="Supprimer cette rencontre"
                className="shrink-0 rounded-lg p-2 text-app-muted hover:text-etat-danger"
                onClick={() => gmConfirm(`Supprimer la rencontre « ${r.nom} » ?`, () => supprimerUneRencontre(r.id))}
            >
                <Trash2 size={14} />
            </button>
        </li>
    );

    const section = (titre: string, liste: RencontrePreparee[]) => liste.length > 0 && (
        <section className="flex flex-col gap-2">
            <h3 className="text-ui-11 font-bold uppercase tracking-widest text-app-muted">{titre}</h3>
            <ul className="flex flex-col gap-2">{liste.map(ligne)}</ul>
        </section>
    );

    return (
        <div className="flex flex-col gap-5 p-5">
            {deLaCampagne.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <Users size={28} className="text-app-muted" />
                    <p className="font-bold text-app-text">Aucune rencontre préparée dans cette campagne.</p>
                    <p className="max-w-md text-sm text-app-muted">
                        Une rencontre se prépare à l’avance — une scène peut en avoir plusieurs, et une
                        rencontre peut n’en avoir aucune.
                    </p>
                </div>
            ) : (
                <>
                    {section(`Scène du combat — ${titreDeScene(sceneDuCombat ?? undefined) ?? ''}`, groupes.ici)}
                    {section('Scènes en cours', groupes.ouvertes)}
                    {section('Rencontres libres', groupes.libres)}
                    {groupes.autres.length > 0 && (
                        <section className="flex flex-col gap-2">
                            <button
                                type="button"
                                className="flex items-center gap-1 text-left text-ui-11 font-bold uppercase tracking-widest text-app-muted hover:text-app-text"
                                onClick={() => setAutresOuvertes(o => !o)}
                            >
                                {autresOuvertes ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                Autres scènes ({groupes.autres.length})
                            </button>
                            {autresOuvertes && <ul className="flex flex-col gap-2">{groupes.autres.map(ligne)}</ul>}
                        </section>
                    )}
                    {enCours.length > 1 && !sceneDuCombat && (
                        <p className="flex items-center gap-2 text-ui-11 text-etat-alerte">
                            <AlertTriangle size={12} />
                            Plusieurs scènes sont en cours : une rencontre libre entrera sans scène, et le bandeau te demandera laquelle.
                        </p>
                    )}
                </>
            )}
        </div>
    );
};

export default PanneauDesRencontres;
