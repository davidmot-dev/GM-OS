import React, { useEffect, useState } from 'react';
import {
    Dices,
    Globe,
    Table2,
    SlidersHorizontal,
    History,
    Send,
    AlertTriangle,
    Trash2,
    Package,
    Loader2,
    Wand2,
    RotateCcw,
} from 'lucide-react';
import { useTableStore } from './useTableStore';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { objetsDepuisDeclaration, laDeclarationEstVide } from '../session/logic/butinDeclare';
import { proposerDesObjets } from '../session/logic/propositionDeButinIA';
import { gmToast } from '../../stores/useToastStore';
import { gmConfirm, useModalStore } from '../../stores/useModalStore';
import { ilYAUneSurcoucheOuverte } from '../../utils/surcouchesOuvertes';
import { useTranslation } from 'react-i18next';
import { AtelierDesTables } from './atelier/AtelierDesTables';
import { Panneau, Bouton, Etiquette, EnTeteDeModule, GabaritDeModule } from '../../components/socle';
import { useRegimeDInterface } from '../session/hooks/useRegimeDInterface';

const etiquetteDeChamp = 'flex items-center gap-1.5 text-ui-10 font-black uppercase tracking-widest text-app-muted';
const heure = (instant: number) => new Date(instant).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const signe = (n: number) => `${n >= 0 ? '+' : ''}${n}`;

/**
 * **Les tables aléatoires** — refonte, L6, maquette retenue le 2026-09-27
 * (`stitch/outils/outils-tables-aleatoires.png`), « rendre le tout plus
 * ergonomique ».
 *
 * Le réglage tient en **une rangée** — l'univers, la table, le modificateur,
 * le jet manuel —, puis un seul grand bouton qui lance le dé de la table ; **le
 * résultat domine** (le total en grand, l'effet mécanique dans son cadre, les
 * gestes dessous) ; l'historique est à droite, et chaque carte se réinjecte.
 */
const TableDashboard: React.FC = () => {
    const {
        universes,
        tables,
        selectedUniverse,
        selectedTable,
        currentTableData,
        currentResult,
        history,
        isLoading,
        modifier,
        fetchUniverses,
        selectUniverse,
        selectTable,
        setModifier,
        roll,
        clearCurrentResult,
        reinjecter,
        effacerLHistorique,
        sendToSession
    } = useTableStore();
    const { t } = useTranslation('modules');
    const regime = useRegimeDInterface();
    const [historiqueOuvert, setHistoriqueOuvert] = useState(true);

    /*
      **Table-OS ne donne plus rien à un personnage — il verse au butin.**

      Les deux modules ne font pas le même geste : celui-ci *consulte* — un dé,
      une plage, un résultat qu'on lit —, Loot-OS *compose* et distribue. Les
      brancher ne veut pas dire les confondre, et le point de rencontre est le
      **pool**, jamais le joueur.

      Avant le 2026-09-04, `addLootToCharacter` écrivait une ligne de texte dans
      le champ `inventory` du personnage — un bloc de prose que l'onglet
      Inventaire de la tablette ne regarde même pas, puisqu'il affiche
      `inventoryItems`. *L'objet donné n'apparaissait nulle part où le joueur
      cherche ses affaires.*
    */
    const {
        activeCampaignId,
        sessions,
        updateSessionGmSecrets,
        addLootToPool,
        getActiveDriver
    } = useSessionOSStore();

    const [conversionEnCours, setConversionEnCours] = useState(false);

    /*
      **L'Atelier est une surcouche, pas un onglet.** Écrire une table est un
      geste de préparation ; le pupitre, lui, sert pendant qu'on joue. Les
      superposer garde le pupitre entier derrière, et Échap le rend.
    */
    const [atelierOuvert, setAtelierOuvert] = useState(false);

    const activeSession = sessions.find(s =>
        s.campaignId === activeCampaignId && s.status === 'active'
    );

    const [manualRoll, setManualRoll] = useState<string>("");

    useEffect(() => {
        fetchUniverses();
    }, [fetchUniverses]);

    /*
      **Espace lance le dé** — retenu par David le 2026-09-29. Seulement quand
      personne d'autre n'a le clavier : un champ où l'on tape (l'espace y est un
      caractère), une surcouche ouverte (l'atelier, la palette), une boîte.
      Un bouton qui a gardé le focus après un clic (« + 1 ») le perd, sinon le
      relâchement de la touche le cliquerait une seconde fois.
    */
    useEffect(() => {
        const auClavier = (e: KeyboardEvent) => {
            if (e.code !== 'Space' || e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
            const cible = e.target;
            if (cible instanceof HTMLInputElement || cible instanceof HTMLTextAreaElement || cible instanceof HTMLSelectElement) return;
            if (cible instanceof HTMLElement && cible.isContentEditable) return;
            if (ilYAUneSurcoucheOuverte() || useModalStore.getState().type !== null) return;
            const etat = useTableStore.getState();
            if (!etat.currentTableData || etat.isLoading) return;
            e.preventDefault();
            if (cible instanceof HTMLButtonElement) cible.blur();
            etat.roll();
        };
        window.addEventListener('keydown', auClavier);
        return () => window.removeEventListener('keydown', auClavier);
    }, []);

    const handleSendToSession = () => {
        if (!currentResult || !activeSession) return;

        // Use the store's unified logging (Journal)
        sendToSession();

        const formatted = `\n--- TABLE ROLL: ${currentResult.tableName} ---\n` +
            `Roll: ${currentResult.rawRoll} ${currentResult.modifier >= 0 ? '+' : ''}${currentResult.modifier} = ${currentResult.finalValue}\n` +
            `Result: ${currentResult.entry.title}\n` +
            `${currentResult.entry.description}\n` +
            (currentResult.entry.effect ? `Effect: ${currentResult.entry.effect}\n` : '') +
            `----------------------------\n`;

        updateSessionGmSecrets(activeSession.id, (activeSession.gmSecrets || "") + formatted);
        gmToast(t('random_tables.pupitre.logged_toast'), 'success');
    };

    /** Ce que l'entrée déclare tombe dans le butin de séance, quantités résolues. */
    const handleVerserAuButin = () => {
        if (!currentResult) return;

        const objets = objetsDepuisDeclaration(currentResult.entry.butin, {
            table: currentResult.tableName,
            entree: currentResult.entry.title,
        });
        if (objets.length === 0) return;

        addLootToPool(objets);
        gmToast(t('random_tables.main.poured_toast', { count: objets.length }), 'success');
    };

    /**
     * L'entrée ne déclare rien : on **propose** des objets depuis son texte.
     *
     * On ne lit pas `effect` à la regex — une regex sur de la prose se trompe, et
     * *un contrôle qui se trompe est pire qu'un contrôle absent*. Le modèle
     * propose, le meneur relit dans le pool et jette ce qui ne va pas.
     */
    const handleProposerDesObjets = async () => {
        if (!currentResult || conversionEnCours) return;
        setConversionEnCours(true);

        const texte = [
            currentResult.entry.title,
            currentResult.entry.description,
            currentResult.entry.effect,
        ].filter(Boolean).join('\n');

        try {
            const objets = await proposerDesObjets(texte, getActiveDriver());
            if (objets.length > 0) {
                addLootToPool(objets);
                gmToast(t('random_tables.main.poured_toast', { count: objets.length }), 'success');
            } else {
                gmToast(t('random_tables.main.propose_empty'), 'warning');
            }
        } catch (err) {
            console.error('[Table-OS] conversion en objets impossible :', err);
            gmToast(t('random_tables.main.propose_failed'), 'error');
        } finally {
            setConversionEnCours(false);
        }
    };

    const validerLeJetManuel = () => {
        const val = parseInt(manualRoll);
        if (!isNaN(val)) roll(val);
        setManualRoll("");
    };

    const effacerTout = () => gmConfirm(
        t('random_tables.pupitre.clear_history_confirm', { count: history.length }),
        effacerLHistorique,
    );

    // ── L'historique, à droite ──────────────────────────────────────────
    const historique = (
        <Panneau className="flex min-h-0 flex-1 flex-col gap-3 p-4">
            <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-app-text">
                    <History size={15} className="text-accent" />{t('random_tables.sidebar.history_title')}
                </p>
                {history.length > 0 && (
                    <button
                        onClick={effacerTout}
                        className="text-ui-10 font-black uppercase tracking-widest text-app-muted transition-colors hover:text-etat-danger"
                    >
                        {t('random_tables.pupitre.clear_history')}
                    </button>
                )}
            </div>
            {history.length > 0 && <p className="text-ui-10 text-app-subtle">{t('random_tables.pupitre.reinject_hint')}</p>}
            <div className="-mr-2 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
                {history.length === 0 && (
                    <p className="rounded-lg border border-dashed border-app-border py-8 text-center text-xs text-app-muted">
                        {t('random_tables.pupitre.history_empty')}
                    </p>
                )}
                {history.slice(0, 20).map(res => {
                    const affiche = currentResult?.timestamp === res.timestamp;
                    return (
                        <button
                            key={res.timestamp}
                            onClick={() => reinjecter(res)}
                            aria-pressed={affiche}
                            className={`group flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors ${
                                affiche ? 'border-accent bg-accent/10' : 'border-app-border bg-app-bg/40 hover:border-accent/50'
                            }`}
                        >
                            <span className="flex items-baseline justify-between gap-2">
                                <span className={`font-display text-lg font-bold ${affiche ? 'text-accent' : 'text-app-text'}`}>
                                    {t('random_tables.pupitre.roll_short', { value: res.finalValue })}
                                </span>
                                <span className="font-mono text-ui-10 text-app-subtle">{heure(res.timestamp)}</span>
                            </span>
                            <span className="truncate text-xs font-bold text-app-text">{res.entry.title}</span>
                            <span className="flex items-center justify-between gap-2 text-ui-10">
                                <span className="font-mono text-app-muted">
                                    {t('random_tables.pupitre.raw_short', { raw: res.rawRoll, mod: signe(res.modifier) })}
                                </span>
                                <span className={`font-black uppercase tracking-widest ${affiche ? 'text-accent' : 'text-app-muted group-hover:text-accent'}`}>
                                    {t('random_tables.pupitre.reinject')}
                                </span>
                            </span>
                        </button>
                    );
                })}
            </div>
            <Bouton aLaTable={regime.aLaTable} icone={<Wand2 size={14} />} onClick={() => setAtelierOuvert(true)} title={t('random_tables.pupitre.atelier_tooltip')}>
                {t('random_tables.pupitre.open_atelier')}
            </Bouton>
        </Panneau>
    );

    return (
        <>
        <AtelierDesTables
            ouvert={atelierOuvert}
            onFermer={() => setAtelierOuvert(false)}
            universDepart={selectedUniverse}
            /* Le pupitre relit sa liste : une table qu'on vient d'écrire doit
               pouvoir être tirée sans quitter l'écran. */
            onTablesChangees={(u) => { fetchUniverses(); if (u === selectedUniverse) selectUniverse(u); }}
        />
        <GabaritDeModule
            aLaTable={regime.aLaTable}
            reglagesOuverts={historiqueOuvert}
            className="text-app-text"
            entete={
                <EnTeteDeModule
                    titre={t('random_tables.title')}
                    etat={currentTableData && <Etiquette ton="accent">{currentTableData.dice}</Etiquette>}
                    actions={regime.aLaTable && (
                        <Bouton aLaTable icone={<History size={16} />} aria-pressed={historiqueOuvert} onClick={() => setHistoriqueOuvert(!historiqueOuvert)}>
                            {t('random_tables.sidebar.history_title')}
                        </Bouton>
                    )}
                />
            }
            reglages={historique}
        >
            <div className="flex flex-col gap-4">
                {/* ── Le réglage, en une rangée, et le lancer ── */}
                <Panneau className="flex flex-col gap-4 p-4">
                    <div className="flex flex-wrap items-end gap-4">
                        <label className="flex min-w-[12rem] flex-1 flex-col gap-1.5">
                            <span className={etiquetteDeChamp}><Globe size={12} />1. {t('random_tables.sidebar.universe_label')}</span>
                            <select
                                value={selectedUniverse}
                                onChange={(e) => selectUniverse(e.target.value)}
                                className="min-h-11 w-full rounded-lg border border-app-border bg-app-bg px-3 text-sm font-bold text-app-text focus:outline-none focus:ring-2 focus:ring-accent/50"
                            >
                                <option value="">{t('random_tables.sidebar.choose_universe')}</option>
                                {universes.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </label>
                        <label className="flex min-w-[14rem] flex-[1.5] flex-col gap-1.5">
                            <span className={etiquetteDeChamp}><Table2 size={12} />2. {t('random_tables.sidebar.table_label')}</span>
                            <select
                                value={selectedTable}
                                onChange={(e) => selectTable(e.target.value)}
                                disabled={!selectedUniverse}
                                className="min-h-11 w-full rounded-lg border border-app-border bg-app-bg px-3 text-sm font-bold text-app-text focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50"
                            >
                                <option value="">{t('random_tables.sidebar.choose_table')}</option>
                                {tables.map(nom => <option key={nom} value={nom}>{nom}</option>)}
                            </select>
                        </label>
                        <div className="flex flex-col gap-1.5">
                            <span className={etiquetteDeChamp}><SlidersHorizontal size={12} />{t('random_tables.sidebar.modifier_label')}</span>
                            <div className="flex min-h-11 items-stretch overflow-hidden rounded-lg border border-app-border">
                                {[-5, -1].map(pas => (
                                    <button key={pas} onClick={() => setModifier(modifier + pas)} className="w-10 border-r border-app-border font-mono text-xs font-bold text-app-muted transition-colors hover:bg-accent/10 hover:text-accent">{pas}</button>
                                ))}
                                <input
                                    type="number"
                                    value={modifier}
                                    onChange={(e) => setModifier(parseInt(e.target.value) || 0)}
                                    aria-label={t('random_tables.sidebar.modifier_label')}
                                    className={`w-14 bg-app-bg text-center font-mono text-sm font-bold focus:outline-none ${modifier !== 0 ? 'text-accent' : 'text-app-text'}`}
                                />
                                {[1, 5].map(pas => (
                                    <button key={pas} onClick={() => setModifier(modifier + pas)} className="w-10 border-l border-app-border font-mono text-xs font-bold text-app-muted transition-colors hover:bg-accent/10 hover:text-accent">+{pas}</button>
                                ))}
                                {modifier !== 0 && (
                                    <button onClick={() => setModifier(0)} title={t('random_tables.pupitre.reset_modifier')} className="border-l border-app-border px-2.5 text-app-muted transition-colors hover:text-accent">
                                        <RotateCcw size={13} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <span className={etiquetteDeChamp}>{t('random_tables.sidebar.manual_roll_label')}</span>
                            <div className="flex min-h-11 items-stretch overflow-hidden rounded-lg border border-app-border">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={manualRoll}
                                    onChange={(e) => setManualRoll(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') validerLeJetManuel(); }}
                                    placeholder={t('random_tables.sidebar.manual_roll_placeholder')}
                                    className="w-24 shrink-0 bg-app-bg px-3 font-mono text-sm text-app-text placeholder:text-app-subtle focus:outline-none"
                                />
                                <button
                                    onClick={validerLeJetManuel}
                                    disabled={!currentTableData || manualRoll.trim() === ''}
                                    className="border-l border-app-border bg-app-surface-2 px-3 text-ui-10 font-black uppercase tracking-widest text-app-text transition-colors hover:text-accent disabled:opacity-40"
                                >
                                    {t('random_tables.sidebar.show_button')}
                                </button>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => roll()}
                        disabled={!currentTableData || isLoading}
                        className="flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-accent font-display text-lg font-bold uppercase tracking-widest text-app-on-accent transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-40"
                    >
                        <Dices size={22} />
                        {currentTableData ? t('random_tables.pupitre.launch_dice', { dice: currentTableData.dice }) : t('random_tables.sidebar.launch_button')}
                        <kbd className="rounded border border-app-on-accent/40 px-1.5 py-0.5 font-mono text-ui-10">{t('random_tables.pupitre.space_key')}</kbd>
                    </button>
                </Panneau>

                {!currentResult ? (
                    <Panneau vide className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                        <Dices size={40} className="text-app-subtle" />
                        <p className="font-display text-lg text-app-text">{t('random_tables.main.waiting_title')}</p>
                        <p className="max-w-sm text-sm text-app-muted">{t('random_tables.main.waiting_desc')}</p>
                    </Panneau>
                ) : (
                    <>
                        {/* ── Le jet : brut, modificateur, heure, et le total en grand ── */}
                        <Panneau className="flex flex-wrap items-center gap-x-8 gap-y-2 border-accent/50 p-4">
                            <div className="flex min-w-0 flex-1 flex-col gap-1">
                                <p className="truncate text-ui-10 font-black uppercase tracking-widest text-app-muted">
                                    {t('random_tables.main.source', { table: currentResult.tableName })}
                                </p>
                                <p className="flex flex-wrap items-baseline gap-x-6 gap-y-1 font-mono text-sm text-app-muted">
                                    <span>{t('random_tables.main.raw_roll')} : <strong className="text-lg text-app-text">{currentResult.rawRoll}</strong></span>
                                    <span>{t('random_tables.main.mod')} : <strong className="text-lg text-accent">{signe(currentResult.modifier)}</strong></span>
                                    <span className="text-xs">{heure(currentResult.timestamp)}</span>
                                </p>
                            </div>
                            <div className="flex items-center gap-3 rounded-lg border border-accent px-4 py-2">
                                <span className="text-ui-10 font-black uppercase tracking-widest text-app-muted">{t('random_tables.pupitre.total')}</span>
                                <span className="font-display text-4xl font-bold text-accent">{currentResult.finalValue}</span>
                            </div>
                        </Panneau>

                        {/* ── Le résultat domine ── */}
                        <Panneau niveau={2} orne className="flex flex-col gap-5 p-6">
                            <div className="flex items-start justify-between gap-4">
                                <h2 className="font-display text-3xl font-bold leading-tight text-app-text">{currentResult.entry.title}</h2>
                                <Etiquette ton="neutre" className="shrink-0">
                                    {currentResult.entry.min === currentResult.entry.max
                                        ? currentResult.entry.min
                                        : `${currentResult.entry.min}–${currentResult.entry.max}`}
                                </Etiquette>
                            </div>

                            {currentResult.entry.description && (
                                <p className="border-l-2 border-accent pl-4 text-lg leading-relaxed text-app-text/90">
                                    {currentResult.entry.description}
                                </p>
                            )}

                            {/* L'effet mécanique, dans son propre cadre */}
                            {currentResult.entry.effect && (
                                <div className="flex gap-3 rounded-lg border border-etat-alerte/50 bg-etat-alerte/10 p-4">
                                    <AlertTriangle size={20} className="mt-0.5 shrink-0 text-etat-alerte" />
                                    <div className="flex flex-col gap-1">
                                        <p className="text-xs font-black uppercase tracking-widest text-etat-alerte">{t('random_tables.main.mechanical_effect')}</p>
                                        <p className="text-base leading-relaxed text-app-text">{currentResult.entry.effect}</p>
                                    </div>
                                </div>
                            )}

                            {/* Les gestes réels */}
                            <div className="flex flex-wrap gap-3 border-t border-app-border pt-4">
                                {/*
                                    Verser ne s'affiche que si l'entrée déclare
                                    quelque chose. Un oracle qui ne donne rien se lit,
                                    il ne verse pas — et ne doit pas prétendre le
                                    contraire.
                                */}
                                {!laDeclarationEstVide(currentResult.entry) ? (
                                    <Bouton aLaTable={regime.aLaTable} variante="accent" icone={<Package size={16} />} onClick={handleVerserAuButin} title={t('random_tables.main.pour_tooltip')} className="flex-1">
                                        {t('random_tables.main.pour_button')}
                                    </Bouton>
                                ) : (
                                    <Bouton
                                        aLaTable={regime.aLaTable}
                                        icone={conversionEnCours ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                                        onClick={handleProposerDesObjets}
                                        disabled={conversionEnCours}
                                        title={t('random_tables.main.propose_tooltip')}
                                        className="flex-1"
                                    >
                                        {t('random_tables.main.propose_button')}
                                    </Bouton>
                                )}
                                {/*
                                    Sans séance en cours, journaliser ne ferait rien :
                                    le bouton le dit au lieu de se taire.
                                */}
                                <Bouton
                                    aLaTable={regime.aLaTable}
                                    icone={<Send size={16} />}
                                    onClick={handleSendToSession}
                                    disabled={!activeSession}
                                    title={activeSession ? undefined : t('random_tables.pupitre.log_no_session')}
                                    className="flex-1"
                                >
                                    {t('random_tables.main.log_session')}
                                </Bouton>
                                <Bouton aLaTable={regime.aLaTable} variante="danger" icone={<Trash2 size={16} />} onClick={clearCurrentResult} title={t('random_tables.main.clear_tooltip')} aria-label={t('random_tables.main.clear_tooltip')} />
                            </div>
                        </Panneau>
                    </>
                )}
            </div>
        </GabaritDeModule>
        </>
    );
};

export default TableDashboard;
