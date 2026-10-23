import React, { useState } from 'react';
import { Skull, Brain } from 'lucide-react';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { useDiceStore } from '../../../stores/useDiceStore';
import { gmToast } from '../../../stores/useToastStore';
import { DiceEngine } from '../../dice/DiceEngine';
import { entreeDeLaTable, lancerLEffetDuBrise, noterSurLaFiche, tableDuBrise, type EtatBrise } from '../../dice/systemes/yearZero';
import { facesDeLaTable, lancerUneFormule } from '../../dice/suitesDuJetDeFiche';
import { pontDesTables } from '../../tables/pontDesTables';
import { estHorsDeCombat, santePrincipaleDeLaFiche } from '../logic/SanteDuCombattant';
import { ecrireLaFicheDuCombattant } from '../ficheDesCombattants';
import type { GameDriver } from '../../../types/drivers';
import type { TableEntry } from '../../tables/types';
import type { Combatant } from '../types';
import SuiviCthulhuHack from '../../session/components/fields/SuiviCthulhuHack';
import { santePrincipaleDuPersonnage } from '../../session/logic/santePrincipale';
import { resolveSheetTemplate } from '../../session/logic/templateResolver';
import { DEFAULT_SHEET_TEMPLATES } from '../../../data/defaultSheetTemplates';

/**
 * **Tomber à zéro, sur la carte du combattant** — 2026-10-16.
 *
 * - **Le Hors Jeu** de Cthulhu Hack (carnet, « Hors Jeu ») : à zéro PV, une fois
 *   le danger écarté, 1d10 sur la table des Conséquences ; qui survit récupère
 *   1d4 PV.
 * - **Brisé par les dégâts** de Blade Runner (carnet, « BRISÉ PAR LES DÉGÂTS ») :
 *   à zéro de Santé, il s'effondre ; chaque nouveau coup est une **blessure
 *   critique**, tirée avec le dé de critique de l'arme (D6 à D12) dans la table
 *   Percutant ou Perforant, et notée sur la fiche.
 * - **Brisé par le stress** de Blade Runner (« BRISÉ PAR LE STRESS ») : le
 *   Sang-froid à zéro sur la carte, et non plus seulement après un forçage — le
 *   dé d'Empathie sur la table humain ou réplicant, un 1 coûte un point de
 *   Sang-froid maximal à vie.
 *
 * Le meneur choisit le moment de chaque geste : l'outil ne sait pas quand le
 * danger est écarté ni quel coup vient de tomber. Les panneaux n'existent que
 * pendant la chute : relevé puis retombé, le combattant en retrouve un neuf.
 */
type RegleDuHorsJeu = NonNullable<GameDriver['combat']['horsJeu']>;
type Ref = { univers: string; table: string };

const BOUTON = 'px-3 py-1 rounded-lg border text-ui-10 font-bold transition-colors';

/** Une table de Table-OS, lue par le pont — `null` si elle ne se lit pas. */
async function lireLaTable(ref: Ref) {
    const pont = pontDesTables();
    return pont ? pont.loadTable(ref.univers, ref.table).catch(() => null) : null;
}

/** Le résultat d'une table, dit au journal et à l'historique. */
function consigner(combatant: Combatant, titre: string, de: number, faces: number, entree: TableEntry | undefined, precision = '') {
    useDiceStore.getState().setLastRoll({
        id: `${titre}-${combatant.id}-${Date.now()}`, timestamp: new Date(),
        title: `${combatant.name} — ${titre}`, total: de, modifier: 0, rolls: [{ val: de, sides: faces }], tagSuccess: false,
        totalDisplay: `${de}${entree ? ` — ${entree.title}${entree.effect ? ` : ${entree.effect}` : ''}` : ''}${precision}`,
    });
}

const PanneauDuHorsJeu: React.FC<{ combatant: Combatant; regle: RegleDuHorsJeu; valeurs: Record<string, unknown> }> = ({ combatant, regle, valeurs }) => {
    const handleApplyImpact = useSessionOSStore(s => s.handleApplyImpact);
    const [tirages, setTirages] = useState<{ de: number; entree?: TableEntry; table?: string }[]>([]);
    const [recupere, setRecupere] = useState(false);
    const [tableChoisie, setTableChoisie] = useState(0);
    const [deChoisi, setDeChoisi] = useState(regle.desAuChoix?.[0] ?? 0);
    const nom = regle.label ?? 'Hors Jeu';
    const tables = regle.tables?.length ? regle.tables : regle.table ? [{ label: nom, table: regle.table }] : [];

    const tirer = async () => {
        const choix = tables[tableChoisie];
        const data = choix ? await lireLaTable(choix.table) : null;
        const faces = regle.desAuChoix?.length ? deChoisi : data ? facesDeLaTable(data.dice) : 0;
        if (!choix || !data || !faces) {
            gmToast(`${nom} : la table « ${choix ? `${choix.table.univers} / ${choix.table.table}` : '?'} » est introuvable — tirez à la main.`, 'warning');
            return;
        }
        // D66 : deux d6 ordonnés, jamais un entier uniforme de 1 à 66.
        const de = faces === 66 ? DiceEngine.rollStandard(66, 1).total : DiceEngine.roll(faces);
        const entree = entreeDeLaTable(data.entries, de);
        const precision = regle.desAuChoix?.length ? ` (D${faces}${tables.length > 1 ? `, ${choix.label}` : ''})` : '';
        setTirages(t => [...t, { de, entree, table: tables.length > 1 ? choix.label : undefined }]);
        consigner(combatant, tables.length > 1 ? `${nom} · ${choix.label}` : nom, de, faces, entree, precision);
        // La blessure se garde sur la fiche, à la suite des précédentes.
        if (entree && regle.noterDans) {
            ecrireLaFicheDuCombattant(combatant, { [regle.noterDans]: noterSurLaFiche(valeurs[regle.noterDans], `${entree.title}${tables.length > 1 ? ` (${choix.label})` : ''}`) });
        }
    };

    const recuperer = () => {
        const pv = lancerUneFormule(regle.recuperation, faces => DiceEngine.roll(faces));
        if (pv === null || pv <= 0 || !combatant.sourcePlayerId) return;
        handleApplyImpact(combatant.sourcePlayerId, 'pc', { value: pv, isRecovery: true });
        setRecupere(true);
        gmToast(`${combatant.name} reprend ses esprits : +${pv} PV (${regle.recuperation}).`, 'success');
    };

    const peutTirer = tables.length > 0 && (regle.repetable || tirages.length === 0);
    return (
        <div data-hors-jeu className="mx-3 my-2 space-y-1 rounded-lg border border-etat-danger/40 bg-etat-danger/10 p-2">
            <p className="flex items-center gap-2 text-ui-11 font-black uppercase tracking-widest text-etat-danger">
                <Skull size={12} /> {nom}
            </p>
            {regle.rappel && <p className="text-ui-11 text-app-text/70">{regle.rappel}</p>}
            {tirages.map((t, i) => (
                <p key={i} className="text-ui-11 text-app-text/80">
                    <strong>{t.de}{t.entree ? ` — ${t.entree.title}` : ''}</strong>{t.table ? ` (${t.table})` : ''}
                    {t.entree?.effect ? ` : ${t.entree.effect}` : ''}
                </p>
            ))}
            {peutTirer && (
                <div className="flex flex-wrap items-center gap-2">
                    {tables.length > 1 && (
                        <select aria-label="Table" value={tableChoisie} onChange={e => setTableChoisie(Number(e.target.value))}
                            className="rounded-lg border border-app-border/40 bg-app-bg py-1 pl-2 pr-7 text-ui-10">
                            {tables.map((t, i) => <option key={t.label} value={i}>{t.label}</option>)}
                        </select>
                    )}
                    {!!regle.desAuChoix?.length && (
                        <select aria-label="Dé de critique" value={deChoisi} onChange={e => setDeChoisi(Number(e.target.value))}
                            className="rounded-lg border border-app-border/40 bg-app-bg py-1 pl-2 pr-7 text-ui-10">
                            {regle.desAuChoix.map(f => <option key={f} value={f}>D{f}</option>)}
                        </select>
                    )}
                    <button type="button" onClick={() => { void tirer(); }}
                        className={`${BOUTON} border-etat-danger/50 text-etat-danger hover:bg-etat-danger/20`}>
                        {regle.repetable ? (tirages.length ? 'Encore une blessure critique' : 'Blessure critique') : 'Tirer les conséquences'}
                    </button>
                </div>
            )}
            {tirages.length > 0 && regle.recuperation && !recupere && (
                <button type="button" onClick={recuperer}
                    className={`${BOUTON} border-etat-succes/50 text-etat-succes hover:bg-etat-succes/20`}>
                    S'il survit : récupérer {regle.recuperation} PV
                </button>
            )}
        </div>
    );
};

const PanneauDuBrise: React.FC<{ combatant: Combatant; brise: EtatBrise; valeurs: Record<string, unknown> }> = ({ combatant, brise, valeurs }) => {
    const [effet, setEffet] = useState<{ de: number; faces: number; entree?: TableEntry; perte?: string } | null>(null);

    const jouer = async () => {
        const lance = lancerLEffetDuBrise(brise, valeurs, champ => Number(valeurs[champ]) || 0, faces => DiceEngine.roll(faces));
        const ecrits: Record<string, string | number> = {};
        let perte: string | undefined;
        if (lance.perte) {
            ecrits[lance.perte.champ] = lance.perte.reste;
            perte = `maximum −1 à vie → ${lance.perte.reste}${lance.perte.reste === 0 ? ' — le personnage quitte la partie' : ''}`;
        }
        const ref = tableDuBrise(brise, valeurs, {});
        const data = ref ? await lireLaTable(ref) : null;
        const entree = data ? entreeDeLaTable(data.entries, lance.tire) : undefined;
        if (entree && brise.noterDans) ecrits[brise.noterDans] = noterSurLaFiche(valeurs[brise.noterDans], entree.title);
        if (Object.keys(ecrits).length) ecrireLaFicheDuCombattant(combatant, ecrits);
        setEffet({ de: lance.tire, faces: lance.faces, entree, perte });
        consigner(combatant, brise.label, lance.tire, lance.faces, entree, perte ? ` ; ${perte}` : '');
    };

    return (
        <div data-brise-en-combat={brise.champ} className="mx-3 my-2 space-y-1 rounded-lg border border-etat-alerte/40 bg-etat-alerte/10 p-2">
            <p className="flex items-center gap-2 text-ui-11 font-black uppercase tracking-widest text-etat-alerte">
                <Brain size={12} /> {brise.label}
            </p>
            <p className="text-ui-11 text-app-text/70">{brise.rappel}</p>
            {effet ? (
                <p className="text-ui-11 text-app-text/80">
                    <strong>D{effet.faces} = {effet.de}{effet.entree ? ` — ${effet.entree.title}` : ''}</strong>
                    {effet.entree?.effect ? ` : ${effet.entree.effect}` : ''}{effet.perte ? ` ; ${effet.perte}` : ''}
                </p>
            ) : (
                <button type="button" onClick={() => { void jouer(); }}
                    className={`${BOUTON} border-etat-alerte/60 text-etat-alerte hover:bg-etat-alerte/20`}>
                    Lancer l'effet critique
                </button>
            )}
        </div>
    );
};

/** Un nombre lu sur la fiche, `null` quand il n'y en a pas. */
const nombreDe = (brut: unknown) => {
    if (brut === undefined || brut === null || brut === '') return null;
    const n = Number(brut);
    return Number.isFinite(n) ? n : null;
};

const HorsJeuDuCombattant: React.FC<{ combatant: Combatant; valeurs?: Record<string, unknown> }> = ({ combatant, valeurs = {} }) => {
    const pilote = useSessionOSStore(s => s.getActiveDriver());
    const personnageCH = useSessionOSStore(s=>s.players.flatMap(p=>p.characters).find(c=>c.id===combatant.sourcePlayerId));
    const etatCH=useSessionOSStore.getState();
    const maxCH=santePrincipaleDuPersonnage(personnageCH,pilote,etatCH.campaigns,etatCH.customSheetTemplates)?.max;
    const gabaritCH=personnageCH?resolveSheetTemplate(personnageCH,etatCH.campaigns,[...DEFAULT_SHEET_TEMPLATES,...etatCH.customSheetTemplates]):undefined;
    if (pilote?.jet?.cthulhuHack && combatant.isPlayer && combatant.sourcePlayerId) return <SuiviCthulhuHack
        regle={pilote.jet.cthulhuHack} valeurs={valeurs} maxPV={maxCH??combatant.hpMax} libelle={id=>gabaritCH?.sections.flatMap(s=>s.fields).find(f=>f.id===id)?.label??id} ecrire={maj=>{
            const store=useSessionOSStore.getState(),joueur=store.players.find(p=>p.characters.some(c=>c.id===combatant.sourcePlayerId));
            const personnage=joueur?.characters.find(c=>c.id===combatant.sourcePlayerId);
            if(joueur&&personnage)store.updateCharacter(joueur.id,personnage.id,{sheetData:{...personnage.sheetData,...maj}});
        }}/>;
    const regle = pilote?.combat?.horsJeu;
    const principal = pilote?.combat?.statsToTrack?.find(s => s.isMainHP)?.fieldId;
    // Le Brisé de la santé principale, c'est le Hors Jeu ; les autres (le Sang-froid) se lisent sur la fiche.
    const brises = (pilote?.jet?.brise ?? []).filter(b => b.de && b.champ !== principal && nombreDe(valeurs[b.champ]) === 0);
    // Un PJ en points de vie tombe quand sa fiche le dit (2026-10-16) : la santé principale fait foi.
    const principale = combatant.isPlayer ? santePrincipaleDeLaFiche(pilote, valeurs) : null;
    const tombe = principale ? principale.courant <= 0 : estHorsDeCombat(combatant);
    // Le Hors Jeu d'un adversaire n'a de sens que si sa chute se note (Blade Runner) — pas ses Conséquences.
    const horsJeu = !!regle && tombe && (combatant.isPlayer ? !!combatant.sourcePlayerId : !!regle.noterDans);
    if (!horsJeu && brises.length === 0) return null;
    return (
        <>
            {horsJeu && regle && <PanneauDuHorsJeu combatant={combatant} regle={regle} valeurs={valeurs} />}
            {brises.map(b => <PanneauDuBrise key={b.champ} combatant={combatant} brise={b} valeurs={valeurs} />)}
        </>
    );
};

export default HorsJeuDuCombattant;
