import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    X, Plus, Trash2, Save, Dices, AlertTriangle, Info, CheckCircle2,
    Scissors, ArrowDownUp, Loader2, ClipboardPaste,
} from 'lucide-react';
import { pontDesTables } from '../pontDesTables';
import { TableEngine } from '../TableEngine';
import { controlerLaTable, decouperLaPortee, laTableEstFautive } from '../logic/formeDeLaTable';
import { BandeDeCouverture } from './BandeDeCouverture';
import { ImportDeTable } from './ImportDeTable';
import { useFermetureParEchap } from '../../../hooks/useFermetureParEchap';
import { gmToast } from '../../../stores/useToastStore';
import type { TableData, TableEntry } from '../types';

/**
 * **L'Atelier des tables — écrire un oracle sans écrire de JSON.**
 *
 * Demandé par David le 2026-09-15 : *« un module dans Table-OS qui aide à la
 * création des fichiers JSON »*. Les 46 tables livrées avaient toutes été
 * tapées à la main, ou collées depuis une conversation avec ChatGPT.
 *
 * ⭐ **Mais le vrai problème n'était pas de taper du JSON — c'était que rien ne
 * relisait ce qu'on avait tapé.** Deux tables sur 46 étaient cassées, et
 * personne ne pouvait le voir : `blessures_critiques` déclarait `1d66`, 45 % de
 * ses jets ne tombaient sur aucune entrée, et un 17 rendait l'entrée 66 — la
 * pire blessure du jeu, lue à voix haute, sans un mot d'avertissement.
 *
 * D'où l'ordre des choses ici : **la bande de couverture d'abord**, les champs
 * ensuite. *Un éditeur qui ne montre que ce qu'on a écrit ne vaut pas mieux
 * qu'un éditeur de texte.*
 *
 * ⚠️ **Le dé se choisit, il ne se tape pas.** `1d66` devient inexprimable au
 * lieu d'être rattrapé après coup — c'est le geste de l'éditeur des tables de
 * butin, et il vaut ici pour la même raison : *rendre le défaut impossible à
 * écrire plutôt que de le signaler.* Le champ libre reste, pour les formules
 * qu'aucune liste ne prévoit, et le contrôle veille dessus.
 */

interface Props {
    ouvert: boolean;
    onFermer: () => void;
    /** Pour que le pupitre recharge sa liste après une écriture. */
    onTablesChangees: (univers: string) => void;
    universDepart?: string;
}

/** Les dés qu'on propose, dans l'ordre où on les cherche. */
const DES_COURANTS = [
    '1d4', '1d6', '1d8', '1d10', '1d12', '1d20', '1d100',
    '2d6', '3d6',
    'd44', 'd66', 'd88', 'd666',
];

const ENTREE_NEUVE: TableEntry = { min: 1, max: 1, title: '', description: '' };

const TABLE_NEUVE = (): TableData => ({
    name: '',
    dice: '1d6',
    entries: decouperLaPortee('1d6', 3).map((p, i) => ({
        ...p, title: `Entrée ${i + 1}`, description: '',
    })),
});

export const AtelierDesTables: React.FC<Props> = ({
    ouvert, onFermer, onTablesChangees, universDepart,
}) => {
    const [univers, setUnivers] = useState<string[]>([]);
    const [universChoisi, setUniversChoisi] = useState(universDepart ?? '');
    const [universNeuf, setUniversNeuf] = useState('');
    const [tables, setTables] = useState<string[]>([]);
    const [nomDeFichier, setNomDeFichier] = useState('');
    const [table, setTable] = useState<TableData>(TABLE_NEUVE);
    const [enCours, setEnCours] = useState(false);
    const [survolee, setSurvolee] = useState<number | null>(null);
    const [essai, setEssai] = useState<{ jet: number; entree: TableEntry } | null>(null);
    const [importOuvert, setImportOuvert] = useState(false);

    useFermetureParEchap(ouvert, onFermer, 'Atelier des tables');

    /* ── Ce qu'on peut lire ───────────────────────────────────────────────── */

    useEffect(() => {
        if (!ouvert) return;
        pontDesTables()?.listUniverses().then(setUnivers).catch(() => setUnivers([]));
    }, [ouvert]);

    const rechargerLesTables = useCallback((u: string) => {
        if (!u) { setTables([]); return; }
        pontDesTables()?.listTables(u).then(setTables).catch(() => setTables([]));
    }, []);

    useEffect(() => { rechargerLesTables(universChoisi); }, [universChoisi, rechargerLesTables]);

    const ouvrirUneTable = async (nom: string) => {
        setEssai(null);
        if (!nom) { setNomDeFichier(''); setTable(TABLE_NEUVE()); return; }
        const lue = await pontDesTables()?.loadTable(universChoisi, nom);
        if (!lue) { gmToast('Table illisible.', 'error'); return; }
        setNomDeFichier(nom);
        setTable({ ...lue, entries: [...(lue.entries ?? [])] });
    };

    /* ── Ce qu'on écrit ───────────────────────────────────────────────────── */

    const constats = useMemo(() => controlerLaTable(table), [table]);
    const universVise = (universNeuf.trim() || universChoisi).trim();

    const modifierEntree = (rang: number, patch: Partial<TableEntry>) => {
        setTable(t => ({
            ...t,
            entries: t.entries.map((e, i) => (i === rang ? { ...e, ...patch } : e)),
        }));
    };

    const decouper = () => {
        const plages = decouperLaPortee(table.dice, table.entries.length);
        if (plages.length === 0) {
            gmToast('Ce dé n’a pas assez de valeurs pour autant d’entrées.', 'warning');
            return;
        }
        setTable(t => ({ ...t, entries: t.entries.map((e, i) => ({ ...e, ...plages[i] })) }));
    };

    const enregistrer = async () => {
        const pont = pontDesTables();
        if (!pont) { gmToast('Écriture indisponible hors de GM-OS.', 'error'); return; }
        if (!universVise) { gmToast('Choisissez ou nommez un univers.', 'warning'); return; }

        const fichier = (nomDeFichier.trim() || table.name.trim());
        if (!fichier) { gmToast('Donnez un nom à la table.', 'warning'); return; }

        /*
          ⚠️ **On prévient, on n'interdit pas.** Une table fautive est
          enregistrable : le meneur travaille par étapes, et refuser une
          sauvegarde à moitié faite lui ferait tout perdre. La garde du dépôt,
          elle, refuse ce qui serait *livré* — les deux ne protègent pas la même
          chose.
        */
        if (laTableEstFautive(table)
            && !window.confirm(
                'Cette table a des jets qui ne tombent sur aucune entrée, ou une formule que le '
                + 'moteur ne lira pas comme vous croyez.\n\nEnregistrer quand même ?')) return;

        setEnCours(true);
        const reponse = await pont.saveTable(universVise, fichier, table);
        setEnCours(false);

        if (!reponse.ok) {
            gmToast(reponse.motif === 'chemin-refuse'
                ? 'Ce nom d’univers ou de table n’est pas acceptable.'
                : 'Écriture impossible — voir le journal.', 'error');
            return;
        }

        gmToast(`« ${fichier} » enregistrée dans ${universVise}.`, 'success');
        setNomDeFichier(fichier);
        if (universNeuf.trim()) {
            setUniversChoisi(universVise);
            setUniversNeuf('');
            pontDesTables()?.listUniverses().then(setUnivers).catch(() => {});
        }
        rechargerLesTables(universVise);
        onTablesChangees(universVise);
    };

    const supprimer = async () => {
        if (!nomDeFichier || !universChoisi) return;
        if (!window.confirm(`Supprimer « ${nomDeFichier} » ? C’est définitif.`)) return;

        const reponse = await pontDesTables()?.deleteTable(universChoisi, nomDeFichier);
        if (!reponse?.ok) { gmToast('Suppression impossible.', 'error'); return; }

        gmToast(`« ${nomDeFichier} » supprimée.`);
        setNomDeFichier('');
        setTable(TABLE_NEUVE());
        rechargerLesTables(universChoisi);
        onTablesChangees(universChoisi);
    };

    if (!ouvert) return null;

    const icone = { faute: AlertTriangle, doute: Info, note: Info } as const;
    const teinte = {
        faute: 'text-red-400', doute: 'text-amber-400', note: 'text-app-text/40',
    } as const;

    return (
        <>
        {/*
          ⚠️ **Elle s'empile au-dessus, et c'est voulu.** Échap ferme la
          surcouche du dessus : l'import d'abord, l'atelier ensuite. C'est le
          registre des surcouches (§ 54) qui l'ordonne, pas l'ordre du JSX.
        */}
        <ImportDeTable
            ouvert={importOuvert}
            onFermer={() => setImportOuvert(false)}
            de={table.dice}
            entreesExistantes={table.entries.length}
            onAppliquer={(entrees, nom, deImporte) => {
                setEssai(null);
                setTable(t => ({
                    ...t,
                    entries: entrees,
                    /* Le nom ne remplace pas celui qu'on a déjà tapé ; le dé, si,
                       parce qu'une table importée porte le sien et que le garder
                       ferait de la bande un mensonge. */
                    ...(nom && !t.name.trim() ? { name: nom } : {}),
                    ...(deImporte ? { dice: deImporte } : {}),
                }));
            }}
        />
        <div className="fixed inset-0 z-[180] flex bg-app-bg/95 backdrop-blur-sm"
            role="dialog" aria-modal="true" aria-label="Atelier des tables">

            {/* ── Colonne de gauche : où l'on range ───────────────────────── */}
            <aside className="w-72 shrink-0 border-r border-app-border bg-app-surface/60 p-5 flex flex-col gap-5 overflow-y-auto custom-scrollbar">
                <h2 className="text-xs font-bold uppercase tracking-widest text-accent flex items-center gap-2">
                    <Dices className="w-4 h-4" /> Atelier des tables
                </h2>

                <div>
                    <label className="block text-xs text-app-text/50 mb-1">Univers</label>
                    <select
                        value={universChoisi}
                        onChange={e => { setUniversChoisi(e.target.value); setNomDeFichier(''); setTable(TABLE_NEUVE()); }}
                        className="w-full bg-app-surface border border-app-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent/50"
                    >
                        <option value="">— choisir —</option>
                        {univers.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <input
                        value={universNeuf}
                        onChange={e => setUniversNeuf(e.target.value)}
                        placeholder="…ou un nouvel univers"
                        className="mt-2 w-full bg-app-surface border border-app-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent/50"
                    />
                    {/* Créer un univers, c'est y déposer sa première table : pas
                        de bouton séparé pour un dossier vide que rien ne lirait. */}
                    <p className="mt-1 text-ui-9 text-app-text/30 leading-snug">
                        Un univers naît avec sa première table.
                    </p>
                </div>

                <div className="flex-1 min-h-0">
                    <label className="block text-xs text-app-text/50 mb-1">Tables</label>
                    <button
                        onClick={() => ouvrirUneTable('')}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
                            nomDeFichier === '' ? 'bg-accent text-app-bg font-bold' : 'text-app-text/60 hover:bg-app-surface'}`}
                    >
                        <Plus size={12} className="inline mr-1.5" />Nouvelle table
                    </button>
                    {tables.map(nom => (
                        <button
                            key={nom}
                            onClick={() => ouvrirUneTable(nom)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${
                                nom === nomDeFichier ? 'bg-accent text-app-bg font-bold' : 'text-app-text/60 hover:bg-app-surface'}`}
                        >
                            {nom}
                        </button>
                    ))}
                </div>
            </aside>

            {/* ── Le plan de travail ──────────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="flex items-center gap-3 px-6 py-4 border-b border-app-border">
                    <input
                        value={table.name}
                        onChange={e => setTable(t => ({ ...t, name: e.target.value }))}
                        placeholder="Titre de la table"
                        className="flex-1 bg-transparent text-lg font-bold text-app-text placeholder:text-app-text/20 focus:outline-none"
                    />
                    <select
                        value={DES_COURANTS.includes(table.dice) ? table.dice : ''}
                        onChange={e => e.target.value && setTable(t => ({ ...t, dice: e.target.value }))}
                        title="Le dé de cette table"
                        className="bg-app-surface border border-app-border rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent/50"
                    >
                        <option value="">— autre —</option>
                        {DES_COURANTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <input
                        value={table.dice}
                        onChange={e => setTable(t => ({ ...t, dice: e.target.value }))}
                        title="La formule, si aucune de la liste ne convient"
                        className="w-28 bg-app-surface border border-app-border rounded-lg py-1.5 px-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-accent/50"
                    />
                    <button onClick={onFermer} title="Fermer l’atelier"
                        className="p-2 text-app-text/40 hover:text-app-text transition-colors">
                        <X size={20} />
                    </button>
                </header>

                {/* La bande d'abord : c'est elle qui fait voir. */}
                <div className="px-6 py-4 border-b border-app-border bg-app-surface/30">
                    <BandeDeCouverture table={table} entreeSurvolee={survolee} />
                </div>

                {constats.length > 0 && (
                    <ul className="px-6 py-3 border-b border-app-border space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                        {constats.map((c, i) => {
                            const Icone = icone[c.gravite];
                            return (
                                <li key={i} className={`flex items-start gap-2 text-xs ${teinte[c.gravite]}`}>
                                    <Icone size={13} className="mt-[1px] shrink-0" />
                                    <span>{c.message}</span>
                                </li>
                            );
                        })}
                    </ul>
                )}

                {/* ── Les entrées ─────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-2">
                    {table.entries.map((entree, rang) => (
                        <div
                            key={rang}
                            onMouseEnter={() => setSurvolee(rang)}
                            onMouseLeave={() => setSurvolee(null)}
                            className="flex gap-2 items-start bg-app-surface/40 border border-app-border/60 rounded-xl p-3"
                        >
                            <input type="number" value={entree.min} aria-label={`Borne basse de l’entrée ${rang + 1}`}
                                onChange={e => modifierEntree(rang, { min: parseInt(e.target.value, 10) })}
                                className="w-16 bg-app-surface border border-app-border rounded-lg py-1.5 px-2 text-sm font-mono text-center focus:outline-none focus:ring-1 focus:ring-accent/50" />
                            <input type="number" value={entree.max} aria-label={`Borne haute de l’entrée ${rang + 1}`}
                                onChange={e => modifierEntree(rang, { max: parseInt(e.target.value, 10) })}
                                className="w-16 bg-app-surface border border-app-border rounded-lg py-1.5 px-2 text-sm font-mono text-center focus:outline-none focus:ring-1 focus:ring-accent/50" />
                            <div className="flex-1 space-y-1.5 min-w-0">
                                <input value={entree.title} placeholder="Titre du résultat"
                                    aria-label={`Titre de l’entrée ${rang + 1}`}
                                    onChange={e => modifierEntree(rang, { title: e.target.value })}
                                    className="w-full bg-app-surface border border-app-border rounded-lg py-1.5 px-2 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-accent/50" />
                                <textarea value={entree.description} placeholder="Ambiance narrative…" rows={2}
                                    aria-label={`Description de l’entrée ${rang + 1}`}
                                    onChange={e => modifierEntree(rang, { description: e.target.value })}
                                    className="w-full bg-app-surface border border-app-border rounded-lg py-1.5 px-2 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-accent/50" />
                                <input value={entree.effect ?? ''} placeholder="Effet mécanique (facultatif)"
                                    aria-label={`Effet de l’entrée ${rang + 1}`}
                                    onChange={e => modifierEntree(rang, { effect: e.target.value })}
                                    className="w-full bg-app-surface border border-app-border rounded-lg py-1.5 px-2 text-xs text-app-text/70 focus:outline-none focus:ring-1 focus:ring-accent/50" />
                            </div>
                            <button
                                onClick={() => setTable(t => ({ ...t, entries: t.entries.filter((_, i) => i !== rang) }))}
                                title={`Retirer l’entrée ${rang + 1}`}
                                className="p-1.5 text-app-text/20 hover:text-red-500 transition-colors">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}

                    <button
                        onClick={() => setTable(t => ({ ...t, entries: [...t.entries, { ...ENTREE_NEUVE }] }))}
                        className="w-full py-2 rounded-xl border border-dashed border-app-border text-sm text-app-text/40 hover:text-app-text hover:border-accent/40 transition-colors">
                        <Plus size={13} className="inline mr-1" />Ajouter une entrée
                    </button>
                </div>

                {/* ── Les gestes ──────────────────────────────────────────── */}
                <footer className="flex flex-wrap items-center gap-2 px-6 py-4 border-t border-app-border bg-app-surface/40">
                    <button onClick={() => setImportOuvert(true)}
                        title="Coller une table de manuel"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-app-border text-sm text-app-text/70 hover:text-app-text transition-colors">
                        <ClipboardPaste size={14} />Importer
                    </button>
                    <button onClick={decouper}
                        title="Répartir la portée du dé sur les entrées existantes"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-app-border text-sm text-app-text/70 hover:text-app-text transition-colors">
                        <Scissors size={14} />Découper
                    </button>
                    <button
                        onClick={() => setTable(t => ({ ...t, entries: [...t.entries].sort((a, b) => a.min - b.min) }))}
                        title="Ranger les entrées par borne basse"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-app-border text-sm text-app-text/70 hover:text-app-text transition-colors">
                        <ArrowDownUp size={14} />Ranger
                    </button>

                    {/* Essayer sans quitter l'atelier : une table se juge en la tirant. */}
                    <button
                        onClick={() => {
                            if (table.entries.length === 0) return;
                            const jet = TableEngine.rollDice(table.dice);
                            setEssai({ jet, entree: TableEngine.resolveEntry(table, jet) });
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-accent/40 text-sm text-accent hover:bg-accent/10 transition-colors">
                        <Dices size={14} />Essayer
                    </button>
                    {essai && (
                        <span className="text-xs text-app-text/60 truncate max-w-xs">
                            <b className="font-mono text-accent">{essai.jet}</b> → {essai.entree.title || '(sans titre)'}
                        </span>
                    )}

                    <div className="flex-1" />

                    {nomDeFichier && (
                        <button onClick={supprimer}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-500/30 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                            <Trash2 size={14} />Supprimer
                        </button>
                    )}
                    <button onClick={enregistrer} disabled={enCours}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-app-bg font-bold text-sm hover:brightness-110 disabled:opacity-50 transition-all">
                        {enCours ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Enregistrer
                    </button>
                    {constats.length === 0 && (
                        <CheckCircle2 size={16} className="text-emerald-500" aria-label="Rien à signaler" />
                    )}
                </footer>
            </div>
        </div>
        </>
    );
};

export default AtelierDesTables;
