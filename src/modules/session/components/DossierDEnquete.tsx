import React, { useState } from 'react';
import { Eye, Minus, Plus, Users } from 'lucide-react';
import { useSessionOSStore } from '../useSessionOSStore';
import { useJournalStore } from '../../journal/useJournalStore';
import { gmToast } from '../../../stores/useToastStore';
import { herosDeLaCampagne } from '../../table/gestesDesHeros';
import {
    apresLeGain, indicesAPortee, niveauDuStyle, nouvelleAffaire, peutGagner, pointsDuStyle, revelerA,
    type Enqueteur,
} from '../logic/pointsDEnquete';
import type { StyleDEnquete } from '../../../types/drivers';

/**
 * **Le dossier d'enquête** — Crimes, C5 (2026-10-22), livre p. 436–440.
 *
 * En tête des indices, au meneur seul : les points d'enquête de chaque
 * enquêteur dans ses cinq styles, qu'il distribue quand une routine fait
 * **réellement** avancer l'affaire ; les indices que quelqu'un atteint, à lui
 * révéler à lui seul — sa seule tablette le reçoit, avec son origine ; puis à
 * partager à la table quand il en parle. Rien ne se valide tout seul : l'outil
 * compte et prévient, le meneur décide.
 */
/** L'heure d'un geste, lue au clic. */
const maintenant = () => Date.now();

const DossierDEnquete: React.FC<{ styles: StyleDEnquete[] }> = ({ styles }) => {
    const players = useSessionOSStore(s => s.players);
    const clues = useSessionOSStore(s => s.clues);
    const activeCampaignId = useSessionOSStore(s => s.activeCampaignId);
    const updateClue = useSessionOSStore(s => s.updateClue);
    const updateCharacterSheetData = useSessionOSStore(s => s.updateCharacterSheetData);
    const atlasMaps = useSessionOSStore(s => s.atlasMaps);
    const entities = useSessionOSStore(s => s.entities);
    const campaigns = useSessionOSStore(s => s.campaigns);
    const updateCampaign = useSessionOSStore(s => s.updateCampaign);
    const [affaireAConfirmer, setAffaireAConfirmer] = useState(false);
    const [hypothese, setHypothese] = useState('');
    const [styleDeLHypothese, setStyleDeLHypothese] = useState('');

    const heros = herosDeLaCampagne(players, activeCampaignId);
    const enqueteurs: Enqueteur[] = heros.map(h => ({ id: h.id, nom: h.nom, fiche: h.valeurs }));
    const indices = clues.filter(c => c.campaignId === activeCampaignId);
    const aPortee = indicesAPortee(indices, enqueteurs, styles);
    const prives = indices.filter(c => !c.isRevealed && (c.connuDe?.length ?? 0) > 0);
    const noter = (title: string, content: string) =>
        useJournalStore.getState().addEvent({ type: 'NOTE', title, content, metadata: { type: 'evidence' } });

    const ecrire = (herosId: string, maj: Record<string, number>) => {
        const h = heros.find(x => x.id === herosId);
        if (!h) return;
        for (const [champ, valeur] of Object.entries(maj)) updateCharacterSheetData(h.joueurId, h.id, champ, valeur);
    };

    /** Un point de plus ou de moins ; et l'indice que ce point met à portée se dit tout de suite. */
    const bouger = (e: Enqueteur, style: StyleDEnquete, delta: number) => {
        const apres = apresLeGain(e.fiche, style, delta);
        ecrire(e.id, { [style.points]: apres });
        noter(`Points d'enquête — ${e.nom}`, `${style.label} ${delta > 0 ? '+' : ''}${delta} → ${apres}`);
        const avant = new Set(aPortee.filter(p => p.enqueteur.id === e.id).map(p => p.indice.id));
        const ouverts = indicesAPortee(indices, [{ ...e, fiche: { ...e.fiche, [style.points]: apres } }], styles)
            .filter(p => !avant.has(p.indice.id));
        for (const p of ouverts) gmToast(`${e.nom} atteint « ${p.indice.title} » (${p.seuil.style.label} ${p.seuil.atteints}/${p.seuil.points}).`, 'info');
    };

    const reveler = (p: (typeof aPortee)[number]) => {
        // L'origine garde le nom du style : la tablette, qui ne lit pas le pilote, l'affiche tel quel.
        const r = revelerA(p.indice, p.enqueteur, styles, p.seuil.style.label);
        updateClue(p.indice.id, r.indice);
        if (Object.keys(r.ecrits).length) ecrire(p.enqueteur.id, r.ecrits);
        noter(`Indice révélé à ${p.enqueteur.nom} — ${p.indice.title}`,
            [`Par ${p.seuil.style.label} (${p.seuil.atteints}/${p.seuil.points}). Sa seule tablette le reçoit.`, ...r.dits].join(' '));
        gmToast(`« ${p.indice.title} » révélé à ${p.enqueteur.nom} seul.`, 'success');
    };

    const partager = (id: string) => {
        const indice = indices.find(c => c.id === id);
        if (!indice) return;
        updateClue(id, { isRevealed: true, revealedAt: maintenant() });
        noter(`Indice partagé à la table — ${indice.title}`,
            indice.trouvePar ? `Trouvé par ${indice.trouvePar.nom}${indice.trouvePar.style ? ` (${styles.find(s => s.id === indice.trouvePar!.style)?.label ?? indice.trouvePar.style})` : ''}.` : '');
        gmToast(`« ${indice.title} » partagé à la table.`, 'success');
    };

    /*
      **L'affaire, par lieu et par témoin** (C5, p. 438-440) : chaque indice est
      relié à un lieu, à un PNJ — le témoin — ou aux deux ; le dossier les range
      ainsi, avec leur état : caché, à portée, connu d'un seul, partagé.
    */
    const campagne = campaigns.find(c => c.id === activeCampaignId);
    const hypotheses = campagne?.hypothesesDEnquete ?? [];
    const etatDe = (c: (typeof indices)[number]) => c.isRevealed ? 'partagé'
        : (c.connuDe?.length ?? 0) > 0 ? `connu de ${(c.connuDe ?? []).map(id => enqueteurs.find(e => e.id === id)?.nom ?? id).join(', ')}`
            : aPortee.some(p => p.indice.id === c.id) ? 'à portée' : 'caché';
    const groupes: { titre: string; indices: typeof indices }[] = [
        ...[...new Set(indices.map(c => c.locationId).filter((x): x is string => !!x))].map(id => ({
            titre: `Lieu — ${atlasMaps.find(m => m.id === id)?.name ?? id}`, indices: indices.filter(c => c.locationId === id),
        })),
        ...[...new Set(indices.map(c => c.ownerId).filter((x): x is string => !!x))].map(id => ({
            titre: `Témoin — ${entities.find(e => e.id === id)?.name ?? id}`, indices: indices.filter(c => c.ownerId === id),
        })),
    ];
    const noterLesHypotheses = (liste: typeof hypotheses) => { if (campagne) updateCampaign(campagne.id, { hypothesesDEnquete: liste }); };
    const ajouterUneHypothese = () => {
        const texte = hypothese.trim();
        if (!texte) return;
        noterLesHypotheses([...hypotheses, { id: `h-${maintenant()}`, texte, quand: maintenant(), ...(styleDeLHypothese ? { style: styleDeLHypothese } : {}) }]);
        noter('Hypothèse de l’affaire', `${texte}${styleDeLHypothese ? ` (${styleDeLHypothese})` : ''}`);
        setHypothese('');
    };

    const ouvrirUneAffaire = () => {
        for (const e of enqueteurs) ecrire(e.id, nouvelleAffaire(e.fiche, styles));
        noter('Nouvelle affaire', 'Les points d’enquête de chaque enquêteur reviennent au niveau de ses styles.');
        setAffaireAConfirmer(false);
        gmToast('Nouvelle affaire : points d’enquête remis au niveau des styles.', 'success');
    };

    return (
        <section data-dossier-d-enquete className="space-y-6 p-8 rounded-[2rem] glass-bento border border-app-text/5">
            <div className="flex items-center justify-between gap-4">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gm-gold">Dossier d’enquête</h3>
                {affaireAConfirmer ? (
                    <span className="flex items-center gap-2">
                        <button type="button" onClick={ouvrirUneAffaire}
                            className="px-3 py-1 rounded-lg bg-gm-gold text-app-bg text-ui-9 font-black uppercase tracking-widest">
                            Confirmer : points au niveau des styles
                        </button>
                        <button type="button" onClick={() => setAffaireAConfirmer(false)}
                            className="px-3 py-1 rounded-lg border border-app-text/10 text-ui-9 font-black uppercase tracking-widest text-app-text/50">
                            Annuler
                        </button>
                    </span>
                ) : (
                    <button type="button" onClick={() => setAffaireAConfirmer(true)}
                        title="Les points d’enquête de chaque enquêteur reviennent au niveau de ses styles (les ronds de la fiche)"
                        className="px-3 py-1 rounded-lg border border-app-text/10 text-ui-9 font-black uppercase tracking-widest text-app-text/50 hover:text-app-text">
                        Nouvelle affaire
                    </button>
                )}
            </div>

            {enqueteurs.length === 0 ? (
                <p className="text-xs text-app-text/40">Aucun enquêteur n’est lié à cette campagne.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-xs" data-points-d-enquete>
                        <thead>
                            <tr className="text-ui-9 font-black uppercase tracking-widest text-app-text/30">
                                <th className="text-left py-1 pr-3">Enquêteur</th>
                                {styles.map(s => <th key={s.id} className="py-1 px-2">{s.label}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {enqueteurs.map(e => (
                                <tr key={e.id} className="border-t border-app-text/5" data-enqueteur={e.id}>
                                    <td className="py-2 pr-3 font-bold text-app-text">{e.nom}</td>
                                    {styles.map(s => {
                                        const possede = peutGagner(e.fiche, s);
                                        return (
                                            <td key={s.id} className="py-2 px-2 text-center" data-style={s.id}>
                                                <span className="inline-flex items-center gap-1">
                                                    <button type="button" aria-label={`Un point de moins : ${e.nom}, ${s.label}`}
                                                        disabled={pointsDuStyle(e.fiche, s) === 0} onClick={() => bouger(e, s, -1)}
                                                        className="p-0.5 rounded border border-app-text/10 disabled:opacity-20"><Minus size={10} /></button>
                                                    <strong className={`w-6 font-mono ${possede ? 'text-app-text' : 'text-app-text/25'}`}
                                                        title={`Niveau ${niveauDuStyle(e.fiche, s)}`}>{pointsDuStyle(e.fiche, s)}</strong>
                                                    <button type="button" aria-label={`Un point de plus : ${e.nom}, ${s.label}`}
                                                        disabled={!possede} onClick={() => bouger(e, s, 1)}
                                                        title={possede ? undefined : 'On ne gagne de points que dans un style qu’on possède (p. 437)'}
                                                        className="p-0.5 rounded border border-app-text/10 disabled:opacity-20"><Plus size={10} /></button>
                                                </span>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="space-y-2" data-indices-a-portee>
                <p className="text-ui-9 font-black uppercase tracking-widest text-app-text/30">Indices à portée</p>
                {aPortee.length === 0 && <p className="text-xs text-app-text/30">Aucun enquêteur n’atteint encore le seuil d’un indice caché.</p>}
                {aPortee.map(p => (
                    <div key={`${p.indice.id}-${p.enqueteur.id}`} className="flex flex-wrap items-center gap-3 rounded-xl border border-gm-gold/20 px-3 py-2 text-xs">
                        <span className="font-bold text-app-text">{p.indice.title}</span>
                        <span className="text-app-text/50">{p.enqueteur.nom} — {p.seuil.style.label} {p.seuil.atteints}/{p.seuil.points}</span>
                        <button type="button" onClick={() => reveler(p)}
                            className="ml-auto flex items-center gap-1 px-3 py-1 rounded-lg bg-gm-gold/15 text-gm-gold text-ui-9 font-black uppercase tracking-widest hover:bg-gm-gold/25">
                            <Eye size={11} /> Révéler à {p.enqueteur.nom}
                        </button>
                    </div>
                ))}
            </div>

            {groupes.length > 0 && (
                <div className="space-y-2" data-affaire-par-lieu-et-temoin>
                    <p className="text-ui-9 font-black uppercase tracking-widest text-app-text/30">L’affaire, par lieu et par témoin</p>
                    {groupes.map(g => (
                        <div key={g.titre} className="rounded-xl border border-app-text/10 px-3 py-2 text-xs">
                            <p className="font-bold text-app-text">{g.titre}</p>
                            <ul className="mt-1 space-y-0.5">
                                {g.indices.map(c => (
                                    <li key={c.id} className="flex gap-2">
                                        <span className="text-app-text/80">{c.title}</span>
                                        <span className="text-app-text/40">— {etatDe(c)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}

            <div className="space-y-2" data-hypotheses>
                <p className="text-ui-9 font-black uppercase tracking-widest text-app-text/30"
                    title="Les théories de la table : l’outil ne les valide jamais (p. 437-438)">Hypothèses</p>
                {hypotheses.map(h => (
                    <div key={h.id} className="flex flex-wrap items-center gap-2 text-xs">
                        <span className={h.ecartee ? 'line-through text-app-text/30' : 'text-app-text/80'}>{h.texte}</span>
                        {h.style && <span className="text-app-text/40">({h.style})</span>}
                        <button type="button" className="ml-auto text-ui-9 font-black uppercase tracking-widest text-app-text/40 hover:text-app-text"
                            onClick={() => noterLesHypotheses(hypotheses.map(x => (x.id === h.id ? { ...x, ecartee: !x.ecartee } : x)))}>
                            {h.ecartee ? 'Rouvrir' : 'Écarter'}
                        </button>
                    </div>
                ))}
                <div className="flex flex-wrap items-center gap-2">
                    <input value={hypothese} onChange={e => setHypothese(e.target.value)} placeholder="Une théorie de la table…" data-nouvelle-hypothese
                        onKeyDown={e => { if (e.key === 'Enter') ajouterUneHypothese(); }}
                        className="flex-1 min-w-48 bg-app-bg/40 border border-app-text/10 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-gm-gold/40" />
                    <select value={styleDeLHypothese} onChange={e => setStyleDeLHypothese(e.target.value)} aria-label="Style de l’hypothèse"
                        className="bg-app-bg/40 border border-app-text/10 rounded-lg px-2 py-1.5 text-xs">
                        <option value="">— style —</option>
                        {styles.map(s => <option key={s.id} value={s.label}>{s.label}</option>)}
                    </select>
                    <button type="button" onClick={ajouterUneHypothese} disabled={!hypothese.trim()}
                        className="px-3 py-1 rounded-lg border border-app-text/10 text-ui-9 font-black uppercase tracking-widest text-app-text/60 disabled:opacity-30">
                        Noter
                    </button>
                </div>
            </div>

            {prives.length > 0 && (
                <div className="space-y-2" data-indices-prives>
                    <p className="text-ui-9 font-black uppercase tracking-widest text-app-text/30">Connus d’un seul</p>
                    {prives.map(c => (
                        <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-app-text/10 px-3 py-2 text-xs">
                            <span className="font-bold text-app-text">{c.title}</span>
                            <span className="text-app-text/50">
                                connu de {(c.connuDe ?? []).map(id => enqueteurs.find(e => e.id === id)?.nom ?? id).join(', ')}
                                {c.trouvePar?.style && ` — trouvé par ${styles.find(s => s.id === c.trouvePar!.style)?.label ?? c.trouvePar.style}`}
                            </span>
                            <button type="button" onClick={() => partager(c.id)}
                                className="ml-auto flex items-center gap-1 px-3 py-1 rounded-lg border border-app-text/10 text-ui-9 font-black uppercase tracking-widest text-app-text/60 hover:text-app-text">
                                <Users size={11} /> Partager à la table
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

export default DossierDEnquete;
