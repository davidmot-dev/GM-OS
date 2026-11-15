import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, RefreshCw, Eye, EyeOff, Minus, Plus, Dices } from 'lucide-react';
import { Bouton } from '../../../components/socle/Bouton';
import type { TablesDuJeu } from '../hooks/useRemoteSync';

/**
 * **Les tables du jeu actif sur la télécommande** — Fire HD 8, registre § 256, T7.
 *
 * Décision de David du 15/11/2026 : *les tables du jeu actif, résultat au MJ seul*, avec
 * « Montrer aux joueurs ». Dessin : maquette Stitch validée le même jour
 * (`documentation/Planning/visuels/fire-hd8-2026-11-15/3-onglet-tables.png`), sans ce que Stitch
 * avait inventé (numéro de table, version, badge « NEW », « Effet critique »).
 *
 * Le tirage n'est pas fait ici : la télécommande demande, **le poste du MJ tire** (même moteur,
 * même historique que Table-OS) et répond à elle seule. Voir `tablesOSActions`.
 */

interface RemoteTablesProps {
    tables: TablesDuJeu;
    appaire: boolean;
    onCharger: () => void;
    onTirer: (table: string, modificateur: number) => void;
    onMontrer: (timestamp: number) => void;
}

const aplati = (texte: string) => texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const MODIFICATEUR_MAX = 100;

const RemoteTables: React.FC<RemoteTablesProps> = ({ tables, appaire, onCharger, onTirer, onMontrer }) => {
    const [filtre, setFiltre] = useState('');
    const [choisie, choisir] = useState<string | null>(null);
    const [modificateur, setModificateur] = useState(0);

    /* Demandé une fois à l'ouverture de l'onglet, comme le coffre ; le bouton recharge le reste. */
    const dejaDemande = useRef(false);
    useEffect(() => {
        if (!appaire || dejaDemande.current) return;
        dejaDemande.current = true;
        onCharger();
    }, [appaire, onCharger]);

    const visibles = useMemo(() => {
        const cherche = aplati(filtre.trim());
        return cherche ? tables.liste.filter(t => aplati(t.nom).includes(cherche)) : tables.liste;
    }, [tables.liste, filtre]);

    /* Une table disparue de la liste (autre campagne ouverte au PC) n'est plus choisie. */
    const selection = tables.liste.find(t => t.id === choisie) ?? null;
    const resultat = tables.resultat;
    const dejaMontre = !!resultat && tables.montres.includes(resultat.timestamp);
    const enCours = tables.tirageEnCours !== null;

    const changerLaTable = (id: string) => {
        choisir(id);
        setModificateur(0);
    };
    const regler = (delta: number) =>
        setModificateur(m => Math.max(-MODIFICATEUR_MAX, Math.min(MODIFICATEUR_MAX, m + delta)));

    if (!appaire) {
        return <p className="text-[16px] italic text-app-muted text-center py-10">Appaire la tablette pour tirer sur les tables.</p>;
    }

    return (
        <div className="flex min-w-0 min-h-0 flex-col gap-3 h-full">
            {/* Le titre « Tables » est déjà posé par la télécommande au-dessus de l'onglet (vu sur la Fire, 15/11). */}
            <div className="shrink-0 flex items-center gap-2">
                {tables.univers && (
                    <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-0.5 text-[13px] font-bold uppercase tracking-widest text-accent">
                        {tables.univers}
                    </span>
                )}
                <Bouton habillage="libre" cibleTactile onClick={onCharger} aria-label="Recharger les tables"
                    className="ml-auto min-h-[44px] min-w-[44px] rounded-lg bg-app-text/5 border border-app-text/10 flex items-center justify-center text-app-muted hover:text-app-text">
                    <RefreshCw size={16} className={tables.chargement ? 'animate-spin' : ''} />
                </Bouton>
            </div>

            {tables.chargement && tables.liste.length === 0 ? (
                <p className="text-[16px] italic text-app-muted text-center py-10">Lecture des tables…</p>
            ) : !tables.univers ? (
                <p className="text-[16px] italic text-app-muted text-center py-10">{tables.raison ?? 'Aucune table pour le jeu actif.'}</p>
            ) : (
                <>
                    <div className="relative shrink-0">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-subtle pointer-events-none" />
                        <input type="search" value={filtre} onChange={(e) => setFiltre(e.target.value)}
                            placeholder="Filtrer les tables…" aria-label="Filtrer les tables"
                            className="w-full h-[44px] pl-9 pr-12 rounded-xl bg-app-text/5 border border-app-text/10 text-[16px] text-app-text placeholder:text-app-subtle outline-none focus:border-accent/40" />
                        {filtre && (
                            <Bouton habillage="libre" cibleTactile onClick={() => setFiltre('')} aria-label="Effacer le filtre"
                                className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] h-[40px] rounded-lg flex items-center justify-center text-app-muted hover:text-app-text">
                                <X size={14} />
                            </Bouton>
                        )}
                    </div>

                    <ul aria-label="Tables du jeu" className="min-h-[132px] flex-1 overflow-y-auto no-scrollbar rounded-xl border border-app-text/10 bg-app-text/[0.03] p-1">
                        {visibles.length === 0 && (
                            <li className="px-3 py-4 text-[14px] italic text-app-muted">Aucune table ne correspond.</li>
                        )}
                        {visibles.map(t => (
                            <li key={t.id}>
                                <button type="button" onClick={() => changerLaTable(t.id)} aria-pressed={t.id === choisie}
                                    className={`w-full min-h-[44px] flex items-center gap-2 rounded-lg px-3 text-left text-[15px] ${t.id === choisie
                                        ? 'border border-accent/60 bg-accent/10 text-app-text font-bold'
                                        : 'border border-transparent text-app-muted hover:text-app-text'}`}>
                                    <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{t.nom}</span>
                                    {t.des && <span className="shrink-0 rounded border border-app-text/15 px-1.5 text-[12px] font-mono uppercase text-app-subtle">{t.des}</span>}
                                </button>
                            </li>
                        ))}
                    </ul>

                    {selection && (
                        <div className="shrink-0 rounded-xl border border-app-text/10 bg-app-text/[0.04] p-3 flex flex-col gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="min-w-0 flex-1 text-[17px] font-bold text-app-text [overflow-wrap:anywhere]">{selection.nom}</span>
                                <div className="flex items-center gap-1" role="group" aria-label="Modificateur">
                                    <span className="mr-1 text-[12px] font-bold uppercase tracking-widest text-app-subtle">Modificateur</span>
                                    <Bouton habillage="libre" cibleTactile onClick={() => regler(-1)} aria-label="Retirer 1"
                                        className="min-h-[44px] min-w-[44px] rounded-lg bg-app-text/5 border border-app-text/10 flex items-center justify-center text-app-text">
                                        <Minus size={16} />
                                    </Bouton>
                                    <output aria-live="polite" className="min-w-[3ch] text-center text-[18px] font-bold text-accent">{modificateur > 0 ? `+${modificateur}` : modificateur}</output>
                                    <Bouton habillage="libre" cibleTactile onClick={() => regler(1)} aria-label="Ajouter 1"
                                        className="min-h-[44px] min-w-[44px] rounded-lg bg-app-text/5 border border-app-text/10 flex items-center justify-center text-app-text">
                                        <Plus size={16} />
                                    </Bouton>
                                </div>
                            </div>
                            <Bouton habillage="libre" cibleTactile disabled={enCours} onClick={() => onTirer(selection.id, modificateur)}
                                className="min-h-[52px] w-full rounded-xl bg-accent text-app-bg font-bold uppercase tracking-widest text-[16px] flex items-center justify-center gap-2 disabled:opacity-50">
                                <Dices size={18} /> {enCours ? 'Tirage…' : 'Tirer'}
                            </Bouton>
                        </div>
                    )}

                    {tables.erreur && <p role="alert" className="shrink-0 text-[14px] text-etat-danger">{tables.erreur}</p>}

                    {resultat && (
                        <section aria-label="Résultat du tirage" className="shrink-0 max-h-[40%] overflow-y-auto no-scrollbar rounded-xl border border-app-text/10 bg-app-text/[0.04] p-3 flex flex-col gap-2">
                            <div className="flex items-start gap-3">
                                <span className="text-[40px] leading-none font-black text-accent">{resultat.finalValue}</span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[12px] font-mono uppercase tracking-widest text-app-subtle">
                                        {resultat.tableName} · jet {resultat.rawRoll} · modificateur {resultat.modifier > 0 ? `+${resultat.modifier}` : resultat.modifier}
                                    </p>
                                    <p className="text-[18px] font-bold text-app-text [overflow-wrap:anywhere]">{resultat.entry.title}</p>
                                </div>
                                <span className="shrink-0 flex items-center gap-1 rounded-full border border-app-text/15 px-2 py-0.5 text-[12px] text-app-muted">
                                    {dejaMontre ? <><Eye size={12} /> Montré aux joueurs</> : <><EyeOff size={12} /> Vu par toi seul</>}
                                </span>
                            </div>
                            {resultat.entry.description && <p className="text-[15px] text-app-muted [overflow-wrap:anywhere]">{resultat.entry.description}</p>}
                            {resultat.entry.effect && (
                                <div className="rounded-lg border border-accent/50 bg-accent/5 px-3 py-2">
                                    <p className="text-[12px] font-bold uppercase tracking-widest text-accent">Effet</p>
                                    <p className="text-[15px] text-app-text [overflow-wrap:anywhere]">{resultat.entry.effect}</p>
                                </div>
                            )}
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                <Bouton habillage="libre" cibleTactile disabled={dejaMontre} onClick={() => onMontrer(resultat.timestamp)}
                                    className="min-h-[44px] rounded-lg border border-accent/60 px-4 text-[14px] font-bold uppercase tracking-widest text-accent flex items-center gap-2 disabled:opacity-50">
                                    <Eye size={16} /> Montrer aux joueurs
                                </Bouton>
                                {selection && (
                                    <Bouton habillage="libre" cibleTactile disabled={enCours} onClick={() => onTirer(selection.id, modificateur)}
                                        className="ml-auto min-h-[44px] px-3 text-[14px] font-bold uppercase tracking-widest text-app-muted hover:text-app-text flex items-center gap-2 disabled:opacity-50">
                                        <RefreshCw size={14} /> Tirer encore
                                    </Bouton>
                                )}
                            </div>
                        </section>
                    )}
                </>
            )}
        </div>
    );
};

export default RemoteTables;
