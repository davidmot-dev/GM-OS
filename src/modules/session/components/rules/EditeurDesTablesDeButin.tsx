import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Archive, Plus, Trash2, Dices, Layers } from 'lucide-react';
import type { GameDriver, LootEntry, LootTable } from '../../../../types/drivers';
import { pontDesTables } from '../../../tables/pontDesTables';
import { raretesDuJeu } from '../../logic/vocabulaireDuButin';

/**
 * **Les tables de butin d'un jeu, éditées sans rien deviner.**
 *
 * Cette section vivait au milieu de `RuleEngineEditor`, et trois choses y
 * échouaient en silence :
 *
 * 1. **Une case à cocher « pondéré »** faisait basculer le sens du champ voisin
 *    — poids relatif d'un côté, pourcentage de chance de l'autre. *Le même nombre
 *    voulait dire deux choses*, et rien ne le disait.
 * 2. **L'imbrication se recopiait à la main**, dans un champ de texte libre. Une
 *    faute de frappe ne produisait aucun objet et ne se plaignait qu'à la
 *    console : en séance, le meneur lisait « aucun objet » sans pouvoir savoir
 *    pourquoi. On choisit désormais dans une liste — *le défaut devient
 *    inexprimable au lieu d'être rattrapé après coup*, comme pour les sections de
 *    fiche du descripteur de jet.
 * 3. **Ni rareté, ni valeur, ni description n'avaient de champ**, alors que le
 *    générateur les lit depuis toujours dans `metadata`. Les deux compteurs du
 *    panneau de Loot-OS valaient donc zéro pour tout ce qui venait d'une table.
 *
 * S'y ajoute le pont vers Table-OS : une entrée de type **oracle** tire sur une
 * table de `databases/tables/` et verse ce que l'entrée tirée **déclare**.
 */
interface EditeurDesTablesDeButinProps {
    driver: GameDriver;
    onUpdate: (patch: Partial<GameDriver>) => void;
}

const EditeurDesTablesDeButin: React.FC<EditeurDesTablesDeButinProps> = ({ driver, onUpdate }) => {
    const { t } = useTranslation(['modules', 'common']);
    const tables = useMemo(() => driver.lootTables || [], [driver.lootTables]);
    const raretes = raretesDuJeu(driver);

    /* ── Les oracles disponibles, lus une fois ────────────────────────────── */
    const [univers, setUnivers] = useState<string[]>([]);
    const [tablesParUnivers, setTablesParUnivers] = useState<Record<string, string[]>>({});

    useEffect(() => {
        const bridge = pontDesTables();
        if (!bridge) return;
        let vivant = true;

        (async () => {
            try {
                const liste = await bridge.listUniverses();
                if (!vivant) return;
                setUnivers(liste);

                const paires = await Promise.all(
                    liste.map(async u => [u, await bridge.listTables(u)] as const),
                );
                if (vivant) setTablesParUnivers(Object.fromEntries(paires));
            } catch (err) {
                console.error('[EditeurDesTablesDeButin] oracles illisibles :', err);
            }
        })();

        return () => { vivant = false; };
    }, []);

    /* ── Écritures ────────────────────────────────────────────────────────── */

    const majTable = (index: number, patch: Partial<LootTable>) => {
        const suivantes = [...tables];
        suivantes[index] = { ...suivantes[index], ...patch };
        onUpdate({ lootTables: suivantes });
    };

    const majEntree = (tIdx: number, eIdx: number, patch: Partial<LootEntry>) => {
        const suivantes = [...tables];
        const entrees = [...suivantes[tIdx].entries];
        entrees[eIdx] = { ...entrees[eIdx], ...patch };
        suivantes[tIdx] = { ...suivantes[tIdx], entries: entrees };
        onUpdate({ lootTables: suivantes });
    };

    const majMetadata = (tIdx: number, eIdx: number, patch: Record<string, unknown>) => {
        const entree = tables[tIdx].entries[eIdx];
        majEntree(tIdx, eIdx, { metadata: { ...(entree.metadata || {}), ...patch } });
    };

    const champ = 'w-full bg-black/20 px-2 py-1.5 rounded border border-white/5 text-[10px] text-app-text outline-none focus:border-amber-500/40';
    const etiquette = 'text-[7px] font-bold uppercase text-app-text/20 mb-0.5 block';

    return (
        <div className="space-y-8">
            {/* ─── Le vocabulaire du jeu ─────────────────────────────────── */}
            <div className="p-6 bg-app-surface/20 border border-app-border/10 rounded-[2rem] space-y-5">
                <div className="space-y-1">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400/60">
                        {t('modules:session.rule_engine_editor.loot.vocabulary_title')}
                    </h3>
                    <p className="text-[10px] text-app-text/40 leading-relaxed max-w-2xl">
                        {t('modules:session.rule_engine_editor.loot.vocabulary_hint')}
                    </p>
                </div>

                <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-4">
                        <label className={etiquette}>{t('modules:session.rule_engine_editor.loot.currency_label')}</label>
                        <input
                            type="text"
                            value={driver.vocabulaireDuButin?.monnaie || ''}
                            onChange={e => onUpdate({
                                vocabulaireDuButin: { ...(driver.vocabulaireDuButin || {}), monnaie: e.target.value },
                            })}
                            placeholder={t('modules:session.rule_engine_editor.loot.currency_placeholder')}
                            className={champ}
                        />
                    </div>

                    <div className="col-span-8 space-y-2">
                        <div className="flex items-center justify-between">
                            <label className={etiquette}>{t('modules:session.rule_engine_editor.loot.rarities_label')}</label>
                            <button
                                onClick={() => onUpdate({
                                    vocabulaireDuButin: {
                                        ...(driver.vocabulaireDuButin || {}),
                                        raretes: [...(driver.vocabulaireDuButin?.raretes || raretes), { id: '', label: '' }],
                                    },
                                })}
                                className="flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.2em] text-amber-400 hover:text-amber-300"
                            >
                                <Plus size={10} /> {t('modules:session.rule_engine_editor.loot.add_rarity_btn')}
                            </button>
                        </div>

                        {(driver.vocabulaireDuButin?.raretes || []).length === 0 ? (
                            <p className="text-[9px] text-app-text/30 italic">
                                {t('modules:session.rule_engine_editor.loot.rarities_default', {
                                    liste: raretes.map(p => p.label).join(' · '),
                                })}
                            </p>
                        ) : (
                            <div className="space-y-1.5">
                                {(driver.vocabulaireDuButin?.raretes || []).map((palier, rIdx) => (
                                    <div key={rIdx} className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={palier.id}
                                            onChange={e => {
                                                const suivants = [...(driver.vocabulaireDuButin?.raretes || [])];
                                                suivants[rIdx] = { ...palier, id: e.target.value };
                                                onUpdate({ vocabulaireDuButin: { ...(driver.vocabulaireDuButin || {}), raretes: suivants } });
                                            }}
                                            placeholder={t('modules:session.rule_engine_editor.loot.rarity_id_placeholder')}
                                            className={`${champ} font-mono text-violet-400 flex-1`}
                                        />
                                        <input
                                            type="text"
                                            value={palier.label}
                                            onChange={e => {
                                                const suivants = [...(driver.vocabulaireDuButin?.raretes || [])];
                                                suivants[rIdx] = { ...palier, label: e.target.value };
                                                onUpdate({ vocabulaireDuButin: { ...(driver.vocabulaireDuButin || {}), raretes: suivants } });
                                            }}
                                            placeholder={t('modules:session.rule_engine_editor.loot.rarity_label_placeholder')}
                                            className={`${champ} flex-[2]`}
                                        />
                                        <button
                                            onClick={() => {
                                                const suivants = (driver.vocabulaireDuButin?.raretes || []).filter((_, i) => i !== rIdx);
                                                onUpdate({
                                                    vocabulaireDuButin: {
                                                        ...(driver.vocabulaireDuButin || {}),
                                                        raretes: suivants.length > 0 ? suivants : undefined,
                                                    },
                                                });
                                            }}
                                            className="p-1 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded"
                                        >
                                            <Trash2 size={10} />
                                        </button>
                                    </div>
                                ))}
                                <p className="text-[8px] text-app-text/25 italic">
                                    {t('modules:session.rule_engine_editor.loot.rarities_order_hint')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ─── Les tables ────────────────────────────────────────────── */}
            <div className="flex justify-end">
                <button
                    onClick={() => onUpdate({
                        lootTables: [...tables, {
                            id: `table-${Date.now()}`,
                            name: t('modules:session.rule_engine_editor.loot.new_table_name'),
                            rolls: '1',
                            rollMode: 'weighted',
                            entries: [],
                        }],
                    })}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all font-black text-[10px] uppercase tracking-widest"
                >
                    <Plus size={14} /> {t('modules:session.rule_engine_editor.loot.create_btn')}
                </button>
            </div>

            <div className="grid grid-cols-1 gap-8 pb-20">
                {tables.map((table, tIdx) => (
                    <div key={table.id} className="p-8 bg-app-surface/20 border border-app-border/10 rounded-[2.5rem] backdrop-blur-sm group relative overflow-hidden transition-all hover:bg-app-surface/30">
                        <div className="absolute top-0 right-0 p-8 text-amber-500/5 -rotate-12 pointer-events-none">
                            <Archive size={120} />
                        </div>

                        <button
                            onClick={() => onUpdate({ lootTables: tables.filter(t2 => t2.id !== table.id) })}
                            className="absolute top-6 right-6 p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                            title={t('modules:session.rule_engine_editor.loot.delete_table')}
                        >
                            <Trash2 size={16} />
                        </button>

                        <div className="grid grid-cols-12 gap-8 mb-8 relative z-10">
                            <div className="col-span-6">
                                <div className="flex items-center justify-between mb-2 px-1">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400/60">
                                        {t('modules:session.rule_engine_editor.loot.table_name_label')}
                                    </label>
                                    <span className="text-[8px] font-mono text-app-text/20 bg-black/20 px-2 py-0.5 rounded border border-white/5 select-all">
                                        {t('common:id_label')}: {table.id}
                                    </span>
                                </div>
                                <input
                                    type="text"
                                    value={table.name}
                                    onChange={e => majTable(tIdx, { name: e.target.value })}
                                    className="w-full bg-app-bg/40 px-5 py-4 rounded-2xl border border-app-border/10 text-lg font-bold text-app-text focus:border-amber-500/50 outline-none shadow-inner"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400/60 mb-2 block px-1">
                                    {t('modules:session.rule_engine_editor.loot.rolls_label')}
                                </label>
                                <input
                                    type="text"
                                    value={table.rolls || ''}
                                    onChange={e => majTable(tIdx, { rolls: e.target.value })}
                                    placeholder="1"
                                    className="w-full bg-app-bg/40 px-5 py-4 rounded-2xl border border-app-border/10 font-mono text-center text-amber-400 focus:border-amber-500/50 outline-none shadow-inner text-sm"
                                />
                            </div>

                            {/*
                                **Le mode se lit, il ne se coche pas.**

                                « Pondéré » coché ou non changeait le sens du champ
                                d'à côté sans le dire. Deux choix nommés, chacun avec
                                sa phrase : ce que le tirage fait est écrit.
                            */}
                            <div className="col-span-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400/60 mb-2 block px-1">
                                    {t('modules:session.rule_engine_editor.loot.mode_label')}
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['weighted', 'independent'] as const).map(mode => (
                                        <button
                                            key={mode}
                                            onClick={() => majTable(tIdx, { rollMode: mode })}
                                            className={`px-3 py-2 rounded-xl border text-left transition-all ${
                                                (table.rollMode || 'weighted') === mode
                                                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                                                    : 'bg-app-bg/40 border-app-border/10 text-app-text/40 hover:text-app-text/70'
                                            }`}
                                        >
                                            <span className="block text-[9px] font-black uppercase tracking-widest">
                                                {t(`modules:session.rule_engine_editor.loot.modes.${mode}`)}
                                            </span>
                                            <span className="block text-[8px] leading-tight opacity-60 mt-0.5">
                                                {t(`modules:session.rule_engine_editor.loot.modes.${mode}_hint`)}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 relative z-10">
                            <div className="flex items-center justify-between px-2">
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-app-text/30">
                                    {t('modules:session.rule_engine_editor.loot.entries_title')}
                                </span>
                                <button
                                    onClick={() => {
                                        const suivantes = [...tables];
                                        suivantes[tIdx] = {
                                            ...table,
                                            entries: [...table.entries, {
                                                name: t('modules:session.rule_engine_editor.loot.new_item_name'),
                                                type: 'item',
                                                weight: 1,
                                                minAmount: '1',
                                            }],
                                        };
                                        onUpdate({ lootTables: suivantes });
                                    }}
                                    className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-amber-400 hover:text-amber-300 transition-colors"
                                >
                                    <Plus size={12} /> {t('modules:session.rule_engine_editor.loot.add_entry_btn')}
                                </button>
                            </div>

                            <div className="space-y-2">
                                {table.entries.map((entry, eIdx) => {
                                    const estRenvoi = entry.type === 'table' || entry.type === 'oracle';
                                    const universChoisi = String(entry.metadata?.oracleUnivers || '');

                                    return (
                                        <div key={eIdx} className="p-3 bg-app-bg/20 rounded-xl border border-app-border/5 hover:bg-app-bg/40 transition-all space-y-2">
                                            {/* Première ligne : ce que c'est, et à quelle fréquence */}
                                            <div className="grid grid-cols-12 gap-2 items-end">
                                                <div className="col-span-3">
                                                    <label className={etiquette}>{t('modules:session.rule_engine_editor.loot.type_label')}</label>
                                                    <select
                                                        value={entry.type || 'item'}
                                                        onChange={e => majEntree(tIdx, eIdx, { type: e.target.value as LootEntry['type'] })}
                                                        className={`${champ} font-black uppercase tracking-wider text-amber-400`}
                                                    >
                                                        <option value="item">{t('modules:session.rule_engine_editor.loot.entry_types.item')}</option>
                                                        <option value="currency">{t('modules:session.rule_engine_editor.loot.entry_types.currency')}</option>
                                                        <option value="table">{t('modules:session.rule_engine_editor.loot.entry_types.table')}</option>
                                                        <option value="oracle">{t('modules:session.rule_engine_editor.loot.entry_types.oracle')}</option>
                                                    </select>
                                                </div>

                                                <div className="col-span-4">
                                                    <label className={etiquette}>
                                                        {estRenvoi
                                                            ? t('modules:session.rule_engine_editor.loot.display_name_label')
                                                            : t('modules:session.rule_engine_editor.loot.name_label')}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={entry.name}
                                                        onChange={e => majEntree(tIdx, eIdx, { name: e.target.value })}
                                                        className={champ}
                                                        placeholder={estRenvoi
                                                            ? t('modules:session.rule_engine_editor.loot.placeholder_display_name')
                                                            : t('modules:session.rule_engine_editor.loot.placeholder_name')}
                                                    />
                                                </div>

                                                <div className="col-span-2">
                                                    <label className={etiquette}>
                                                        {(table.rollMode || 'weighted') === 'weighted'
                                                            ? t('modules:session.rule_engine_editor.loot.weight_label')
                                                            : t('modules:session.rule_engine_editor.loot.chance_label')}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={entry.weight}
                                                        onChange={e => majEntree(tIdx, eIdx, { weight: parseInt(e.target.value) || 0 })}
                                                        className={`${champ} text-center font-mono text-amber-500`}
                                                    />
                                                </div>

                                                <div className="col-span-2">
                                                    {!estRenvoi && (
                                                        <>
                                                            <label className={etiquette}>{t('modules:session.rule_engine_editor.loot.qty_label')}</label>
                                                            <input
                                                                type="text"
                                                                value={entry.minAmount ?? ''}
                                                                onChange={e => majEntree(tIdx, eIdx, { minAmount: e.target.value })}
                                                                className={`${champ} text-center font-mono text-cyan-400`}
                                                                placeholder="1"
                                                            />
                                                        </>
                                                    )}
                                                </div>

                                                <div className="col-span-1 flex justify-end pb-1">
                                                    <button
                                                        onClick={() => {
                                                            const suivantes = [...tables];
                                                            suivantes[tIdx] = {
                                                                ...table,
                                                                entries: table.entries.filter((_, i) => i !== eIdx),
                                                            };
                                                            onUpdate({ lootTables: suivantes });
                                                        }}
                                                        className="p-1 px-2 text-red-400 hover:bg-red-500/20 rounded transition-all"
                                                    >
                                                        <Trash2 size={10} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Seconde ligne : ce que l'entrée désigne, ou ce qu'elle décrit */}
                                            {entry.type === 'table' && (
                                                <div className="grid grid-cols-12 gap-2 items-end">
                                                    <div className="col-span-12">
                                                        <label className={etiquette}>
                                                            <Layers size={8} className="inline mr-1" />
                                                            {t('modules:session.rule_engine_editor.loot.target_table_label')}
                                                        </label>
                                                        <select
                                                            value={String(entry.metadata?.tableId || '')}
                                                            onChange={e => majMetadata(tIdx, eIdx, { tableId: e.target.value })}
                                                            className={`${champ} text-violet-400`}
                                                        >
                                                            <option value="">{t('modules:session.rule_engine_editor.loot.target_table_none')}</option>
                                                            {tables.filter(t2 => t2.id !== table.id).map(t2 => (
                                                                <option key={t2.id} value={t2.id}>{t2.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            )}

                                            {entry.type === 'oracle' && (
                                                <div className="grid grid-cols-12 gap-2 items-end">
                                                    <div className="col-span-4">
                                                        <label className={etiquette}>
                                                            <Dices size={8} className="inline mr-1" />
                                                            {t('modules:session.rule_engine_editor.loot.oracle_universe_label')}
                                                        </label>
                                                        <select
                                                            value={universChoisi}
                                                            onChange={e => majMetadata(tIdx, eIdx, { oracleUnivers: e.target.value, oracleTable: '' })}
                                                            className={`${champ} text-violet-400`}
                                                        >
                                                            <option value="">{t('modules:session.rule_engine_editor.loot.oracle_choose')}</option>
                                                            {univers.map(u => <option key={u} value={u}>{u}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="col-span-8">
                                                        <label className={etiquette}>{t('modules:session.rule_engine_editor.loot.oracle_table_label')}</label>
                                                        <select
                                                            value={String(entry.metadata?.oracleTable || '')}
                                                            onChange={e => majMetadata(tIdx, eIdx, { oracleTable: e.target.value })}
                                                            disabled={!universChoisi}
                                                            className={`${champ} text-violet-400 disabled:opacity-40`}
                                                        >
                                                            <option value="">{t('modules:session.rule_engine_editor.loot.oracle_choose')}</option>
                                                            {(tablesParUnivers[universChoisi] || []).map(nom => (
                                                                <option key={nom} value={nom}>{nom}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="col-span-12">
                                                        <p className="text-[8px] text-app-text/25 italic leading-relaxed">
                                                            {t('modules:session.rule_engine_editor.loot.oracle_hint')}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {!estRenvoi && (
                                                <div className="grid grid-cols-12 gap-2 items-end">
                                                    <div className="col-span-3">
                                                        <label className={etiquette}>{t('modules:session.rule_engine_editor.loot.rarity_label')}</label>
                                                        <select
                                                            value={String(entry.metadata?.rarity || raretes[0]?.id || 'common')}
                                                            onChange={e => majMetadata(tIdx, eIdx, { rarity: e.target.value })}
                                                            className={champ}
                                                        >
                                                            {raretes.map(palier => (
                                                                <option key={palier.id} value={palier.id}>{palier.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label className={etiquette}>{t('modules:session.rule_engine_editor.loot.value_label')}</label>
                                                        <input
                                                            type="number"
                                                            value={Number(entry.metadata?.value ?? 0)}
                                                            onChange={e => majMetadata(tIdx, eIdx, { value: parseFloat(e.target.value) || 0 })}
                                                            className={`${champ} text-center font-mono text-gm-gold`}
                                                        />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label className={etiquette}>{t('modules:session.rule_engine_editor.loot.mass_label')}</label>
                                                        <input
                                                            type="number"
                                                            value={Number(entry.metadata?.weight ?? 0)}
                                                            onChange={e => majMetadata(tIdx, eIdx, { weight: parseFloat(e.target.value) || 0 })}
                                                            className={`${champ} text-center font-mono text-app-text/60`}
                                                        />
                                                    </div>
                                                    <div className="col-span-5">
                                                        <label className={etiquette}>{t('modules:session.rule_engine_editor.loot.description_label')}</label>
                                                        <input
                                                            type="text"
                                                            value={String(entry.metadata?.description || '')}
                                                            onChange={e => majMetadata(tIdx, eIdx, { description: e.target.value })}
                                                            className={champ}
                                                            placeholder={t('modules:session.rule_engine_editor.loot.description_placeholder')}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EditeurDesTablesDeButin;
