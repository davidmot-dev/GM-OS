import React, { useMemo, useState } from 'react';
import { Swords, Trash2, Users, MapPin, ChevronDown, ChevronRight, AlertTriangle, Save } from 'lucide-react';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { actesOrdonnes, scenesDansLEtat, scenesOrdonnees } from '../../session/logic/trame';
import { useCombatStore } from '../useCombatStore';
import { useBestiaireStore } from '../useBestiaireStore';
import { gmConfirm } from '../../../stores/useModalStore';
import { gmToast } from '../../../stores/useToastStore';
import { BoutonPrincipal, BoutonSecondaire } from '../../../components/socle';
import { archetypeParId, proposerLesChamps } from '../logic/archetypes';
import {
    adversairesDeLaRencontre, champsDuPilote, pjsCandidats, sceneDeLInvocation,
} from '../logic/invocationDeRencontre';
import { rencontreDuPlateau } from '../logic/rencontreDuPlateau';
import { resumeDeLaRencontre } from '../logic/lignesDeRencontre';
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
    /**
     * Ouvre directement « Qui entre ? » pour cette rencontre — l'écran
     * « Scène en cours » invoque ainsi (R4, 2026-10-12).
     */
    rencontreInitiale?: string;
}

/* Une seule façon de lire une rencontre, partagée avec la Trame. */
const resumeDesLignes = resumeDeLaRencontre;

const PanneauDesRencontres: React.FC<Props> = ({ onClose, rencontreInitiale }) => {
    const {
        rencontres, scenes, actes, entities, players, activeCampaignId, customSheetTemplates,
        supprimerUneRencontre, ajouterUneRencontre,
    } = useSessionOSStore();
    const driver = useSessionOSStore(s => s.getActiveDriver());
    const { sceneId: sceneDuCombat, combatants, invoquerLaRencontre, reset: viderLePlateau } = useCombatStore();
    const { gabaritsDuJeu, repartitionRetenue } = useBestiaireStore();

    const [autresOuvertes, setAutresOuvertes] = useState(false);
    /** « Garder le plateau comme rencontre » (R2) : le formulaire, quand il est ouvert. */
    const [garde, setGarde] = useState<{ nom: string; sceneId: string; notes: string; vider: boolean } | null>(null);

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

    /** Cochés d'avance : les PJ que la scène déclare présents, et pas déjà au combat. */
    const cochesParDefaut = (r: RencontrePreparee) => {
        const cible = sceneDeLInvocation(r, sceneDuCombat, enCours);
        const presents = scenes.find(s => s.id === cible)?.personnagesIds ?? [];
        const candidats = pjsCandidats(personnages, activeCampaignId, presents, engages);
        return new Set(candidats.filter(c => c.present && !c.dejaEngage).map(c => c.id));
    };

    /* Initialisés à la première lecture, pour s'ouvrir sur « Qui entre ? »
       quand l'écran de la scène a désigné la rencontre. */
    const [enChoix, setEnChoix] = useState<RencontrePreparee | null>(
        () => deLaCampagne.find(r => r.id === rencontreInitiale) ?? null);
    const [coches, setCoches] = useState<Set<string>>(
        () => (enChoix ? cochesParDefaut(enChoix) : new Set()));

    /** Ouvre « Qui entre ? », cochés d'avance : les PJ que la scène déclare présents. */
    const choisirLesPJ = (r: RencontrePreparee) => {
        setCoches(cochesParDefaut(r));
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
            casesDeSante: driver?.combat?.casesDeSante,
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

    /* ── « Garder le plateau comme rencontre » (R2) ─────────── */
    const adversairesSurLePlateau = combatants.filter(c => !c.isPlayer && c.faction !== 'player').length;

    if (garde) {
        const jeuId = driver?.id ?? 'sans-pilote';
        const { lignes, avertissements } = rencontreDuPlateau(combatants, gabaritsDuJeu(jeuId));
        const brouillon: RencontrePreparee = {
            id: '', campaignId: activeCampaignId ?? '', nom: garde.nom, lignes, creeeLe: 0,
        };
        const garder = () => {
            if (!activeCampaignId || !garde.nom.trim() || lignes.length === 0) return;
            ajouterUneRencontre({
                campaignId: activeCampaignId,
                ...(garde.sceneId ? { sceneId: garde.sceneId } : {}),
                nom: garde.nom.trim(),
                ...(garde.notes.trim() ? { notes: garde.notes.trim() } : {}),
                lignes,
            });
            if (garde.vider) viderLePlateau();
            gmToast(`« ${garde.nom.trim()} » est gardée`, 'success');
            setGarde(null);
        };

        return (
            <div className="flex flex-col gap-4 p-5">
                <div>
                    <p className="text-ui-11 font-bold uppercase tracking-widest text-app-muted">Garder le plateau comme rencontre</p>
                    <p className="text-sm text-app-text">{resumeDesLignes(brouillon, nomDuPNJ) || 'Aucun adversaire sur le plateau.'}</p>
                    <p className="text-ui-11 text-app-muted">Les PJ ne sont pas gardés : tu les coches à l’invocation.</p>
                </div>

                <label className="flex flex-col gap-1">
                    <span className="text-ui-11 font-bold uppercase tracking-widest text-app-muted">Nom</span>
                    <input
                        autoFocus
                        className="rounded-lg border border-app-border bg-app-bg px-3 py-2 text-app-text"
                        value={garde.nom}
                        onChange={(e) => setGarde({ ...garde, nom: e.target.value })}
                        placeholder="La patrouille"
                    />
                </label>

                <label className="flex flex-col gap-1">
                    <span className="text-ui-11 font-bold uppercase tracking-widest text-app-muted">Scène</span>
                    <select
                        className="rounded-lg border border-app-border bg-app-bg px-3 py-2 text-app-text"
                        value={garde.sceneId}
                        onChange={(e) => setGarde({ ...garde, sceneId: e.target.value })}
                    >
                        <option value="">Aucune — une rencontre libre</option>
                        {actesOrdonnes(actes, activeCampaignId).map(acte => (
                            <optgroup key={acte.id} label={acte.titre}>
                                {scenesOrdonnees(scenes, acte.id).map(s => (
                                    <option key={s.id} value={s.id}>{s.titre}</option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                </label>

                <label className="flex flex-col gap-1">
                    <span className="text-ui-11 font-bold uppercase tracking-widest text-app-muted">Notes</span>
                    <textarea
                        rows={2}
                        className="rounded-lg border border-app-border bg-app-bg px-3 py-2 text-app-text"
                        value={garde.notes}
                        onChange={(e) => setGarde({ ...garde, notes: e.target.value })}
                        placeholder="Tactique, déclencheur, terrain"
                    />
                </label>

                <label className="flex items-center gap-2 text-sm text-app-text">
                    <input
                        type="checkbox"
                        className="accent-[var(--accent)]"
                        checked={garde.vider}
                        onChange={(e) => setGarde({ ...garde, vider: e.target.checked })}
                    />
                    Vider le plateau ensuite (préparation)
                </label>

                {avertissements.map(a => (
                    <p key={a} className="flex items-start gap-2 text-ui-11 text-etat-alerte">
                        <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {a}
                    </p>
                ))}

                <div className="flex justify-end gap-2">
                    <BoutonSecondaire onClick={() => setGarde(null)}>Retour</BoutonSecondaire>
                    <BoutonPrincipal
                        disabled={!garde.nom.trim() || lignes.length === 0 || !activeCampaignId}
                        onClick={garder}
                    >
                        Garder
                    </BoutonPrincipal>
                </div>
            </div>
        );
    }

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
            <BoutonSecondaire
                className="flex items-center justify-center gap-2"
                disabled={adversairesSurLePlateau === 0}
                title={adversairesSurLePlateau === 0 ? 'Compose d’abord le plateau : Atelier, PNJ…' : undefined}
                onClick={() => setGarde({
                    nom: '', sceneId: sceneDuCombat ?? '', notes: '',
                    // En préparation (aucune scène au combat), on vide d'habitude après avoir gardé.
                    vider: !sceneDuCombat,
                })}
            >
                <Save size={14} /> Garder le plateau comme rencontre…
            </BoutonSecondaire>
            {deLaCampagne.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <Users size={28} className="text-app-muted" />
                    <p className="font-bold text-app-text">Aucune rencontre préparée dans cette campagne.</p>
                    <p className="max-w-md text-sm text-app-muted">
                        Compose le plateau comme d’habitude — Atelier, PNJ —, puis garde-le comme
                        rencontre. Une scène peut en avoir plusieurs, et une rencontre peut n’en avoir aucune.
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
