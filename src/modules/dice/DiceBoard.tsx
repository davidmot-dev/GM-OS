import React, { useState, useCallback } from 'react';
import { EtiquetteDuDegre } from './EtiquetteDuDegre';
import { DiceEngine } from './DiceEngine';
import type { RollResult, ModificateurDeSauvegarde } from './DiceEngine';
import { Dices, RotateCcw, Zap, BookmarkPlus, X, Target, Info, XCircle, Cast, SlidersHorizontal } from 'lucide-react';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { useMapStore } from '../map/useMapStore';
import { tacticalService } from '../map/TacticalService';
import { useDiceStore } from '../../stores/useDiceStore';
import { useTranslation } from 'react-i18next';
import { getFateRankLabel, getDieCssClass } from './DiceUIUtils';
import { facesDuNiveau, poigneeDepuisLesLettres, type ModificateurDeDes } from './desEchelonnes';
import { STYLES_DE_DES } from './logic/stylesDeDes';
import { DES_D_USURE } from './desDUsure';
import { deCourant, ecrireLeDe, ressourcesDUsure } from './ressourcesDUsure';
import { estUneSauvegarde, decrireLeJetDuPilote } from './lectureDuPilote';
import { Panneau, Bouton, Etiquette, EnTeteDeModule, GabaritDeModule } from '../../components/socle';
import { useRegimeDInterface } from '../session/hooks/useRegimeDInterface';

const generateId = () => Math.random().toString(36).substring(7);

interface RollRecord extends RollResult {
    id: string;
    timestamp: Date;
    title: string;
    batchId?: string;
}

type DiceMode = 'standard' | 'formula' | 'pool' | 'pool_explode' | 'threshold' | 'advantage' | 'disadvantage' | 'exploding' | 'fate' | 'rolemaster' | 'yze' | 'yze-echelonne'
    /** Cthulhu Hack, 2026-09-30 : la Sauvegarde (d20 sous la caractéristique) et le dé de ressource. */
    | 'sauvegarde' | 'usure';

/**
 * Les niveaux que le pupitre propose, du meilleur au pire.
 *
 * L'échelle elle-même — A vaut D12, B vaut D10… — vit dans `desEchelonnes`, et
 * n'est transcrite nulle part ailleurs. Ici on ne nomme que **les lettres
 * saisissables**, et le dé affiché à côté vient de la table.
 */
const LETTRES_ECHELONNEES = ['A', 'B', 'C', 'D'] as const;

/**
 * **Les modes dont le dé est déjà décidé — ils n'offrent pas la rangée d4 à d100.**
 *
 * ⭐ Depuis le 2026-09-30 (phase 4, L1, étape 2), **tous les modes ont le bouton
 * « Lancer »**, et les faces ne font plus que CHOISIR le dé. Ce qui suit dit
 * pourquoi la liste existe ; avant ce jour, les autres modes lançaient au clic
 * sur une face. Un mode absent de cette liste propose de choisir un nombre de
 * faces que son moteur ignore. C'est ce qui est arrivé à `yze-echelonne` le
 * 2026-08-30 — et, le bouton n'existant alors que pour les modes listés, il
 * n'avait **aucun moyen de lancer** : signalé par David, une heure après avoir
 * signalé le même oubli un cran plus haut, dans la reconnaissance du moteur.
 *
 * *Une liste de noms recopiée à la main dérive le jour où un nom s'ajoute.*
 * Elle est nommée ici, une fois, plutôt qu'écrite dans le JSX — et elle répond
 * à une question qui lui est propre : **« ce mode a-t-il une face à choisir ? »**
 * Ce n'est pas celle de `DiceEngine.MOTEURS_A_RESOLUTION_PROPRE`, qui demande
 * si le moteur impose sa propre résolution ; les deux ensembles se croisent
 * sans se confondre — `formula` et `fate` sont ici et pas là-bas.
 */
const MODES_SANS_CHOIX_DE_FACES: readonly DiceMode[] = [
    'formula', 'fate', 'rolemaster', 'yze', 'yze-echelonne', 'sauvegarde',
];

/**
 * **Les modes que le meneur choisit, et que le pilote ne remplace pas.** Un dé
 * de ressource n'est jamais le jet principal du jeu ; la Sauvegarde se lance
 * avec l'avantage que l'écran tient, et que `rollFromConfig` ne connaît pas.
 */
const MODES_HORS_DU_PILOTE: readonly DiceMode[] = ['usure', 'sauvegarde'];

interface RemoteDiceOptions {
    sides?: number;
    die?: number;
    count?: number;
    modifier?: number;
    mode?: string;
    target?: number;
    gearCount?: number;
    title?: string;
}

const DiceBoard: React.FC = () => {
    const { t } = useTranslation(['modules', 'common']);
    // Tactical Bridge State
    const { tokens, gridSize } = useMapStore();
    const [lastSelectedTokenId, setLastSelectedTokenId] = useState<string | null>(null);
    const [targetTokenId, setTargetTokenId] = useState<string | null>(null);
    const { 
        isDiceProjected, 
        setIsDiceProjected, 
        triggerDiceProjection, 
        quickRolls, 
        addQuickRoll: storeAddQuickRoll, 
        removeQuickRoll: storeRemoveQuickRoll,
        history,
        setLastRoll,
        clearHistory,
        enable3D,
        setEnable3D,
        styleDesDes,
        setStyleDesDes
    } = useDiceStore();
    // Le timer est désormais géré au niveau du Player Hub via projectionTrigger

    const handleToggleProjection = () => {
        setIsDiceProjected(!isDiceProjected);
        if (!isDiceProjected) {
            triggerDiceProjection(); // Déclencher immédiatement si on l'allume
        }
    };
    // Config
    const [mode, setMode] = useState<DiceMode>('standard');
    const [diceCount, setDiceCount] = useState<number>(1);
    const [modifier, setModifier] = useState<number | string>(0);
    const [target, setTarget] = useState<number>(10);
    const [gearCount, setGearCount] = useState<number>(1); // For YZE secondary pool
    const [formulaInput, setFormulaInput] = useState<string>('2d6+5');

    // v3 Features State
    const [targetRule, setTargetRule] = useState<'over' | 'under'>('over');
    const [batchCount, setBatchCount] = useState<number>(1);

    const [newQuickRollLabel, setNewQuickRollLabel] = useState('');
    const [newQuickRollFormula, setNewQuickRollFormula] = useState('');
    const [isAddingQuickRoll, setIsAddingQuickRoll] = useState(false);

    const diceTypes = [4, 6, 8, 10, 12, 20, 100];

    const resetConfig = () => {
        setDiceCount(1);
        setModifier(0);
        setTarget(10);
        setGearCount(1);
        setBatchCount(1);
        setTargetRule('over');
        setFormulaInput('2d6+5');
    };

    const { getActiveDriver, players, activeCampaignId, updateCharacterSheetData } = useSessionOSStore();
    const activeDriver = getActiveDriver();
    const [useSystemDriver, setUseSystemDriver] = useState(false);

    /*
      **Les dés échelonnés au pupitre — David, 2026-08-30.**

      Le moteur savait les résoudre depuis le 29 ; c'est l'entrée qui manquait.
      Faute de fiche, `rollFromConfig` retombait sur une poignée de d6 — le plus
      petit dé de l'échelle, choisi exprès pour ne jamais *inventer* un dé plus
      gros. Prudent, et faux dès qu'on veut le vrai jet d'un PNJ.

      Le meneur nomme donc les deux niveaux lui-même. Les valeurs par défaut
      décrivent un personnage ordinaire — ni le meilleur, ni le pire.
    */
    const [niveauAttribut, setNiveauAttribut] = useState('B');
    const [niveauCompetence, setNiveauCompetence] = useState('C');
    /*
      L'équipement est **facultatif et échelonné lui aussi**. Le lui donner un
      compte de d6, comme le faisait le repli, referait exactement le défaut
      qu'on corrige : un dé d'arme trop petit, et personne pour le voir.
    */
    const [niveauEquipement, setNiveauEquipement] = useState('');
    const [modificateurEchelonne, setModificateurEchelonne] = useState<ModificateurDeDes>('aucun');
    const [modificateurSauvegarde, setModificateurSauvegarde] = useState<ModificateurDeSauvegarde>('aucun');

    /*
      **Le dé de ressource d'un personnage** — Cthulhu Hack, étape 4
      (2026-09-30). Le dé courant vit sur la fiche ; le pupitre le lit, le
      lance, et y réécrit ce qu'il devient. Sans personnage choisi, le mode
      reste un dé libre.
    */
    const [personnageId, setPersonnageId] = useState('');
    const [ressourceId, setRessourceId] = useState('');
    const personnages = React.useMemo(
        () => players.flatMap(joueur => joueur.characters
            .filter(c => c.campaignId === activeCampaignId)
            .map(c => ({ joueurId: joueur.id, personnage: c }))),
        [players, activeCampaignId],
    );
    const lien = personnages.find(p => p.personnage.id === personnageId);
    const ressourcesDuPersonnage = lien ? ressourcesDUsure(activeDriver, lien.personnage.sheetData ?? {}) : [];
    const ressourceLiee = ressourcesDuPersonnage.find(r => r.fieldId === ressourceId);
    const deDeLaFiche = ressourceLiee ? deCourant(lien!.personnage.sheetData?.[ressourceLiee.fieldId]) : undefined;
    const libelleDeLaRessource = ressourceLiee ? `${ressourceLiee.label} · ${lien!.personnage.name}` : '';

    /**
     * La poignée telle que le pupitre la lancera — modificateur et bornes du
     * livre compris. C'est la **même** composition que celle du panneau de
     * fiche : voir `composerLaPoignee`.
     */
    const poigneeEchelonnee = React.useMemo(
        () => poigneeDepuisLesLettres(
            [
                { label: 'Attribut', lettre: niveauAttribut },
                { label: 'Compétence', lettre: niveauCompetence },
            ],
            modificateurEchelonne,
        ),
        [niveauAttribut, niveauCompetence, modificateurEchelonne],
    );

    const facesDeLEquipement = facesDuNiveau(niveauEquipement);

    /**
     * La poignée telle qu'elle se lit — « D12 + D12 + D8 ».
     *
     * **Le même libellé que le pilote soit actif ou non.** C'est ce que le
     * meneur relit dans l'historique pour vérifier qu'il a lancé ce qu'il
     * voulait ; sans lui, un jet échelonné passé par le pilote s'intitulait
     * « Système : Blade Runner » et ne disait **rien** des dés lancés — or
     * c'est exactement le point où ce chemin s'est trompé deux fois.
     */
    const libelleDeLaPoignee = poigneeEchelonnee.des.map(d => `D${d.faces}`).join(' + ')
        + (facesDeLEquipement !== null ? ` + D${facesDeLEquipement}` : '');

    // Auto-sync with active system driver
    React.useEffect(() => {
        if (activeDriver) {
            setUseSystemDriver(true);
            
            // Map engine to local mode
            const engine = activeDriver.dice.engine as string | undefined;
            
            /*
              **Un pilote qui déclare `jet.desEchelonnes` lance des dés
              échelonnés, quel que soit son moteur** — `executeRoll` le force
              déjà. L'écran, lui, restait sur « Year Zero Engine » avec des
              champs B et E ignorés, et les lettres réellement lancées
              invisibles (Blade Runner, trouvé en réagençant, 2026-09-30).
            */
            if (engine === 'yze-echelonne' || activeDriver.jet?.desEchelonnes) {
                /*
                  **La variante à dés échelonnés n'était reconnue nulle part
                  ici.** Elle tombait dans le `else`, n'y trouvait aucun nom
                  connu et finissait en `standard` : le bandeau annonçait
                  « Système : Blade Runner » au-dessus des réglages d'un d20.
                  Le jet, lui, partait bien vers le bon moteur — *l'écran
                  mentait, le résultat était juste, et les deux étaient
                  invérifiables l'un par l'autre.*
                */
                setMode('yze-echelonne');
            } else if (estUneSauvegarde(decrireLeJetDuPilote(activeDriver))) {
                /*
                  **Un d20 sous une valeur de la fiche : la Sauvegarde.** Nommée
                  ou seulement décrite — voir `lectureDuPilote`. Le pilote de
                  Cthulhu Hack la décrivait parfaitement, et tombait plus bas
                  dans « count-success » : réserve de dés, seuil 8.
                */
                setMode('sauvegarde');
                setTarget(activeDriver.dice.successThreshold || 10);
            } else if (engine === 'yze' || engine === 'year-zero') {
                setMode('yze');
                const dCount = parseInt(activeDriver.dice.defaultDice) || 6;
                setDiceCount(dCount);
            } else {
                // Try to extract count from "XdY"
                const dicePart = activeDriver.dice.defaultDice.match(/(\d+)d(\d+)/i);
                if (dicePart) {
                    setDiceCount(parseInt(dicePart[1]));
                }
                
                if (engine === 'rolemaster' || engine === 'd100') {
                    setMode('rolemaster');
                } else if (engine === '2d20') {
                    setMode('standard'); // Handled by engine logic
                } else if (engine === 'pool' || engine === 'pool_explode') {
                    setMode(engine);
                    setTarget(activeDriver.dice.successThreshold || 8);
                } else if (engine === 'threshold') {
                    setMode('threshold');
                    setTarget(activeDriver.dice.successThreshold || 10);
                } else if (engine === 'advantage' || engine === 'disadvantage') {
                    setMode(engine);
                } else if (engine === 'fate') {
                    setMode('fate');
                } else if (engine === 'exploding') {
                    setMode('exploding');
                } else if (engine === 'formula') {
                    setMode('formula');
                } else if (activeDriver.dice.logic === 'count-success') {
                    setMode('pool');
                    setTarget(activeDriver.dice.successThreshold || 8);
                } else {
                    setMode('standard');
                }
            }
        } else {
            setUseSystemDriver(false);
            setMode('standard');
        }
    }, [activeDriver, activeDriver?.id]); // Only re-run when actual system changes

    const executeRoll = useCallback((sides: number = 20, isFormulaText: boolean = false, customFormula: string = "", remoteOverrides?: RemoteDiceOptions) => {
        let result: RollResult;
        
        // Paramètres finaux (priorité aux overrides distants, puis à l'UI locale)
        const finalCount = (remoteOverrides?.count !== undefined) ? remoteOverrides.count : diceCount;
        const finalModifier = (remoteOverrides?.modifier !== undefined) ? remoteOverrides.modifier : modifier;
        const finalMode = (remoteOverrides?.mode as DiceMode) ?? mode;
        const finalTarget = (remoteOverrides?.target !== undefined) ? remoteOverrides.target : target;
        const finalGearCount = (remoteOverrides?.gearCount !== undefined) ? remoteOverrides.gearCount : gearCount;

        if (useSystemDriver && activeDriver && !remoteOverrides && !MODES_HORS_DU_PILOTE.includes(finalMode)) {
            const modVal = typeof finalModifier === 'string' ? (parseInt(finalModifier.replace('+', ''), 10) || 0) : finalModifier;
            // Le sens du comptage vit sur `jet`, pas sur `dice` : sans ce
            // passage, une réserve « sous le seuil » se résolvait à l'envers.
            /*
              **Les tailles, quand le jeu en a.** Sans elles, la branche
              `yze-echelonne` du moteur retombe sur des d6 — un repli voulu pour
              ne jamais inventer un dé plus gros, mais qui rendait le pupitre
              inutilisable sur Blade Runner : le meneur y lançait toujours la
              poignée d'un débutant.
            */
            /*
              **TROIS façons de savoir qu'on lance des dés échelonnés, et une
              seule suffit.**

              *Défaut trouvé par David le 2026-09-03 : « quand je mets 2x A(D12),
              les valeurs ne dépassent jamais 6 », et l'avantage n'ajoutait aucun
              dé.* Le pupitre ne regardait que `dice.engine`. Or :

              1. un pilote peut déclarer `jet.desEchelonnes` **et** un moteur qui
                 dit autre chose — c'est si courant que la Forge a un contrôle
                 exprès pour ça (`controlesDuPilote`), et le panneau de fiche
                 force déjà `yze-echelonne` pour cette raison. Le pupitre, lui,
                 obéissait au champ menteur et lançait une réserve de d6 ;
              2. **le meneur peut choisir le mode lui-même.** Le sélecteur était
                 **affiché et ignoré** dès qu'un pilote était actif : on lui
                 montrait les lettres, la poignée « D12 + D12 » et les boutons
                 d'avantage, et on lançait tout autre chose. *Le même défaut que
                 le sélecteur ≥ / ≤ des réserves, deux écrans plus haut.*

              On force alors le moteur, comme le panneau de fiche : le reste du
              pilote — le sens du comptage, le seuil — continue de valoir.
            */
            const echelonne = activeDriver.dice.engine === 'yze-echelonne'
                || !!activeDriver.jet?.desEchelonnes
                || finalMode === 'yze-echelonne';
            result = DiceEngine.rollFromConfig(
                {
                    ...activeDriver.dice,
                    ...(activeDriver.jet?.sens ? { sens: activeDriver.jet.sens } : {}),
                    ...(echelonne ? { engine: 'yze-echelonne' as const } : {}),
                },
                {
                    modifier: modVal,
                    baseCount: finalCount,
                    gearCount: finalGearCount,
                    targetOverwrite: finalTarget,
                    ...(echelonne ? {
                        taillesDeBase: poigneeEchelonnee.des.map(d => d.faces),
                        taillesSecondaires: facesDeLEquipement !== null ? [facesDeLEquipement] : [],
                    } : {}),
                },
            );
            const titreDuSysteme = t('dice.results.system', { name: activeDriver.name });
            return {
                result,
                title: echelonne ? `${titreDuSysteme} — ${libelleDeLaPoignee}` : titreDuSysteme,
            };
        }

        let title = remoteOverrides?.title || `${finalCount}d${sides}`;
        const modVal = typeof finalModifier === 'string' ? (parseInt(finalModifier.replace('+', ''), 10) || 0) : finalModifier;

        if (isFormulaText) {
            const formObj = customFormula || formulaInput;
            result = DiceEngine.rollFormula(formObj);
            title = t('dice.results.formula', { formula: formObj });
        } else {
            switch (finalMode) {
                case 'standard':
                    result = DiceEngine.rollStandard(sides, finalCount, modVal, false);
                    break;
                case 'exploding':
                    result = DiceEngine.rollStandard(sides, finalCount, modVal, true);
                    title = t('dice.results.exploding', { count: finalCount, sides });
                    break;
                /*
                  **Le sélecteur ≥ / ≤ était affiché et ignoré**, relevé par
                  David le 2026-08-16 : « lorsque je choisis Pool de Dés
                  (Succès), il ne tient pas compte du signe ». Les réserves
                  comptaient toujours AU-DESSUS du seuil, quel que soit le
                  réglage — un 19 passait pour une réussite sous un seuil de 15.

                  Le moteur savait faire depuis le 2026-08-10 : `rollPool` prend
                  un `sens`, et `threshold`, `advantage` et `disadvantage` le lui
                  passaient déjà. Les deux modes de réserve, non. *Le chemin
                  s'arrêtait avant le moteur* — le même geste manquant que les
                  dés de stress d'Alien.

                  Un jet résolu à l'envers ne se voit jamais en séance : il rend
                  des réussites plausibles, simplement inverses.
                */
                case 'pool':
                    result = DiceEngine.rollPool(sides, finalCount, modVal, finalTarget, false, { sens: targetRule });
                    title = t('dice.results.pool', { count: finalCount, sides, target: finalTarget });
                    break;
                case 'pool_explode':
                    result = DiceEngine.rollPool(sides, finalCount, modVal, finalTarget, true, { sens: targetRule });
                    title = t('dice.results.pool_explode', { count: finalCount, sides, target: finalTarget });
                    break;
                case 'threshold':
                    result = DiceEngine.rollThreshold(sides, finalCount, modVal, finalTarget, targetRule);
                    const ruleSym = targetRule === 'over' ? '≥' : '≤';
                    title = t('dice.results.threshold', { count: finalCount, sides, rule: ruleSym, target: finalTarget });
                    break;
                case 'advantage':
                    result = DiceEngine.rollAdvantage(sides, modVal, true, finalTarget, targetRule);
                    title = t('dice.results.advantage', { sides });
                    break;
                case 'disadvantage':
                    result = DiceEngine.rollAdvantage(sides, modVal, false, finalTarget, targetRule);
                    title = t('dice.results.disadvantage', { sides });
                    break;
                case 'fate':
                    result = DiceEngine.rollFate(finalCount, modVal);
                    title = t('dice.results.fate', { count: finalCount });
                    break;
                case 'rolemaster':
                    result = DiceEngine.rollRolemaster(modVal);
                    title = t('dice.results.rolemaster');
                    break;
                case 'yze':
                    result = DiceEngine.rollYZE(finalCount, finalGearCount);
                    title = t('dice.results.yze', { base: finalCount, gear: finalGearCount });
                    break;
                /*
                  Le même jet **sans pilote actif** : le meneur choisit le mode
                  à la main pour un PNJ improvisé. Rien n'oblige à avoir ouvert
                  une campagne Blade Runner pour lancer deux dés échelonnés.
                */
                /* Cthulhu Hack (2026-09-30) : voir `rollSauvegarde` et `desDUsure`. */
                case 'sauvegarde':
                    result = DiceEngine.rollSauvegarde(finalTarget, modificateurSauvegarde, modVal);
                    title = t('dice.results.sauvegarde', { target: finalTarget })
                        + (modificateurSauvegarde === 'avantage' ? ` · ${t('dice.agencement.avantage')}`
                            : modificateurSauvegarde === 'desavantage' ? ` · ${t('dice.agencement.desavantage')}` : '');
                    if (useSystemDriver && activeDriver) title = `${activeDriver.name} — ${title}`;
                    break;
                case 'usure':
                    result = DiceEngine.rollUsure(sides);
                    title = t('dice.results.usure', { faces: sides }) + (libelleDeLaRessource ? ` — ${libelleDeLaRessource}` : '');
                    break;
                case 'yze-echelonne':
                    result = DiceEngine.rollYZEEchelonne(
                        poigneeEchelonnee.des.map(d => d.faces),
                        facesDeLEquipement !== null ? [facesDeLEquipement] : [],
                    );
                    title = libelleDeLaPoignee;
                    break;
                default:
                    result = DiceEngine.rollStandard(sides, finalCount, modVal);
            }
        }
        return { result, title };
    }, [useSystemDriver, activeDriver, modifier, diceCount, gearCount, target, formulaInput, mode, targetRule,
        // Sans elles, un changement de niveau ne serait pas relu : le pupitre
        // lancerait la poignée d'avant, et le résultat resterait plausible.
        poigneeEchelonnee, facesDeLEquipement, libelleDeLaPoignee, modificateurSauvegarde, libelleDeLaRessource]);

    const handleRoll = useCallback((sides: number = 20, isFormulaText: boolean = false, customFormula: string = "", remoteOverrides?: RemoteDiceOptions): RollRecord | null => {
        try {
            /* Un dé de ressource se lance une fois : il change à chaque jet. */
            const repetitions = mode === 'usure' ? 1 : batchCount;
            const batchId = repetitions > 1 ? generateId() : undefined;
            const newRecords: RollRecord[] = [];
            
            for (let i = 0; i < repetitions; i++) {
                const { result, title } = executeRoll(sides, isFormulaText, customFormula, remoteOverrides);

                let repTitle = title;
                if (repetitions > 1) repTitle = t('dice.results.batch', { title, current: i + 1, total: repetitions });

                const record = {
                    ...result,
                    id: generateId(),
                    timestamp: new Date(),
                    title: repTitle,
                    batchId
                };
                newRecords.push(record);
                
                // Only set as last global roll the very last one of the batch
                if (i === repetitions - 1) {
                    setLastRoll(record);
                    // Automatiquement projeter sur le Player Hub si le mode est activé
                    if (isDiceProjected) {
                        triggerDiceProjection();
                    }
                }
            }
            return newRecords[newRecords.length - 1] ?? null;
        } catch (error) {
            console.error("Erreur de lancer:", error);
            return null;
        }
    }, [batchCount, mode, executeRoll, isDiceProjected, triggerDiceProjection, setLastRoll]);

    const handleQuickRoll = (formula: string, label: string) => {
        handleRoll(0, true, formula, { mode: 'formula', title: label });
    };

    const addQuickRoll = () => {
        if (newQuickRollLabel && newQuickRollFormula) {
            storeAddQuickRoll(newQuickRollLabel, newQuickRollFormula);
            setIsAddingQuickRoll(false);
            setNewQuickRollLabel('');
            setNewQuickRollFormula('');
        }
    };

    const removeQuickRoll = (id: string) => {
        storeRemoveQuickRoll(id);
    };

    // --- Remote Control Listeners removed: handled globally in App.tsx now ---

    /*
      **L'étape 2 du lot 1 — le réagencement, dans la grammaire commune**
      (décisions de David, 2026-09-30).

      La barre porte l'action : « Lancer », puis les jets rapides. Le centre
      montre ce qui vient de tomber, et l'historique dessous, sobre. La colonne
      de droite règle le jet — *ce qui se règle, séparé de ce qui se fait*.

      ⭐ **Un seul geste pour tous les modes** : les dés d4 à d100 CHOISISSENT
      le dé, ils ne lancent plus. Avant, cinq modes avaient un bouton et les
      autres lançaient au clic sur une face — *« comment se fait-il que parfois
      j'ai un bouton et parfois non ? »*, David, le même jour. Le dé choisi reste
      retenu : le plus souvent, un seul clic sur « Lancer ».
    */
    const regime = useRegimeDInterface();
    /*
      À la table, le gabarit replie les réglages derrière un bouton. Ici ils
      restent **dépliés par défaut** : on y choisit le dé à chaque jet, et un
      d6 caché derrière un bouton, c'est deux gestes de plus par lancer.
    */
    const [reglagesOuverts, setReglagesOuverts] = useState(true);
    const [faces, setFaces] = useState<number>(20);

    /*
      ⚠️ **En mode système, le jet part avec les dés du pilote** :
      `rollFromConfig` ne reçoit pas de faces. La rangée d4 à d100 y était
      offerte quand même — on choisissait un d8, le jeu lançait ses propres dés.
      *Un réglage affiché et ignoré*, la famille du sélecteur ≥ / ≤ du 16/08.
      Elle ne paraît donc que lorsqu'elle décide vraiment.
    */
    const jetDuSysteme = useSystemDriver && !!activeDriver;
    /* Le dé de ressource se choisit toujours, pilote ou pas : c'est lui qu'on lance. */
    /*
      Le dé d'une ressource liée se lit sur la fiche : la rangée ne s'offre que
      si la fiche ne dit rien de lisible — le premier jet l'y écrira.
    */
    const deLuSurLaFiche = mode === 'usure' && ressourceLiee !== undefined && deDeLaFiche !== undefined;
    const avecFaces = (mode === 'usure' && !deLuSurLaFiche) || (!MODES_SANS_CHOIX_DE_FACES.includes(mode) && !jetDuSysteme);
    const ressourceEpuisee = deLuSurLaFiche && deDeLaFiche === null;
    const facesOffertes: readonly number[] = mode === 'usure' ? DES_D_USURE : diceTypes;
    const valeurDuModificateur = typeof modifier === 'number' ? modifier : (parseInt(String(modifier).replace('+', ''), 10) || 0);
    const avecLeModificateur = (des: string) => valeurDuModificateur === 0
        ? des
        : `${des}${valeurDuModificateur > 0 ? '+' : ''}${valeurDuModificateur}`;
    const echelonne = mode === 'yze-echelonne'
        || (jetDuSysteme && (activeDriver!.dice.engine === 'yze-echelonne' || !!activeDriver!.jet?.desEchelonnes));

    /** Ce que « Lancer » va lancer, écrit à côté du bouton. */
    const resumeDuJet = mode === 'formula' ? formulaInput
        : echelonne ? libelleDeLaPoignee
        : mode === 'usure' ? (ressourceEpuisee ? 'épuisée' : `d${faces}`) + (ressourceLiee ? ` · ${ressourceLiee.label}` : '')
        : mode === 'sauvegarde' ? avecLeModificateur(`d20 ≤ ${target}`) + (modificateurSauvegarde === 'avantage' ? ' · avantage' : modificateurSauvegarde === 'desavantage' ? ' · désavantage' : '')
        : mode === 'yze' ? `${diceCount}B + ${gearCount}E`
        : mode === 'fate' ? avecLeModificateur(`${diceCount}dF`)
        : mode === 'rolemaster' ? avecLeModificateur('d100')
        : jetDuSysteme ? avecLeModificateur(activeDriver!.dice.defaultDice)
        : avecLeModificateur(`${diceCount}d${faces}`);

    /*
      **Le dé de ressource descend tout seul** : un 1 ou un 2 au d8, et le
      prochain jet part d'un d6 — ce que la table ferait à la main. Épuisée, la
      ressource garde son dernier dé : le résultat dit « épuisée », au meneur de
      décider de la suite.
    */
    const lancer = () => {
        /* En mode ressource, le dé part toujours — lu sur la fiche, la rangée est masquée. */
        const jet = handleRoll(avecFaces || mode === 'usure' ? faces : 0, mode === 'formula');
        if (mode === 'usure' && jet?.usure?.apres) setFaces(jet.usure.apres);
        /* La fiche garde la vérité : on y réécrit le dé qu'est devenue la ressource. */
        if (mode === 'usure' && jet?.usure && lien && ressourceLiee && jet.usure.apres !== deDeLaFiche) {
            updateCharacterSheetData(lien.joueurId, lien.personnage.id, ressourceLiee.fieldId, ecrireLeDe(jet.usure.apres));
        }
    };
    React.useEffect(() => {
        if (mode === 'usure' && !(DES_D_USURE as readonly number[]).includes(faces)) setFaces(12);
    }, [mode, faces]);
    /* Le dé d'une ressource liée suit la fiche. */
    React.useEffect(() => {
        if (typeof deDeLaFiche === 'number') setFaces(deDeLaFiche);
    }, [deDeLaFiche]);

    const libelleDuMode = (m: DiceMode) => m === 'yze-echelonne' ? 'Year Zero — dés échelonnés' : t(`dice.modes.${m}`);
    const etiquetteDeChamp = 'text-ui-11 font-semibold text-app-muted uppercase tracking-widest';
    const champ = 'flex bg-app-bg border border-app-border rounded-lg overflow-hidden h-[38px]';
    const sansFleches = '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';
    const dernier = history[0];

    /*
      ── La colonne de droite : ce qui se règle ──
      ⚠️ **Chaque panneau y est `shrink-0`** : la colonne est un empilement
      vertical et le panneau du socle coupe ce qui dépasse. Sans cela, quand la
      fenêtre est moins haute, le panneau se comprime et la rangée d12 à d100
      disparaît au lieu de faire défiler la colonne (David, 2026-09-30).
    */
    const reglages = (
        <>
            <Panneau niveau={1} className="shrink-0 p-4 flex flex-col gap-4">
                <h2 className={etiquetteDeChamp}>{t('dice.agencement.parameters')}</h2>

                {activeDriver && (
                    <button
                        onClick={() => setUseSystemDriver(!useSystemDriver)}
                        aria-pressed={useSystemDriver}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border text-left ${useSystemDriver ? 'bg-accent text-app-on-accent border-accent/40' : 'bg-app-bg text-app-muted border-app-border hover:border-accent/50'}`}
                    >
                        <Zap size={14} className={`shrink-0 ${useSystemDriver ? 'animate-pulse' : ''}`} />
                        {t('dice.system_mode', { name: activeDriver.name.toUpperCase() })}
                    </button>
                )}

                <div className="space-y-1.5">
                    <label className={etiquetteDeChamp}>{t('dice.inputs.mode')}</label>
                    <select
                        value={mode}
                        onChange={(e) => setMode(e.target.value as DiceMode)}
                        title={t('dice.inputs.mode')}
                        aria-label={t('dice.inputs.mode')}
                        className="w-full bg-app-bg border border-app-border rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-all text-app-text"
                    >
                        <option value="standard">{t('dice.modes.standard')}</option>
                        <option value="exploding">{t('dice.modes.exploding')}</option>
                        <option value="formula">{t('dice.modes.formula')}</option>
                        <option value="threshold">{t('dice.modes.threshold')}</option>
                        <option value="pool">{t('dice.modes.pool')}</option>
                        <option value="pool_explode">{t('dice.modes.pool_explode')}</option>
                        <option value="advantage">{t('dice.modes.advantage')}</option>
                        <option value="disadvantage">{t('dice.modes.disadvantage')}</option>
                        <option value="yze">{t('dice.modes.yze')}</option>
                        <option value="yze-echelonne">Year Zero — dés échelonnés</option>
                        <option value="fate">{t('dice.modes.fate')}</option>
                        <option value="rolemaster">{t('dice.modes.rolemaster')}</option>
                        <option value="sauvegarde">{t('dice.modes.sauvegarde')}</option>
                        <option value="usure">{t('dice.modes.usure')}</option>
                    </select>
                </div>

                {mode === 'formula' ? (
                    <div className="space-y-1.5">
                        <label className={etiquetteDeChamp}>{t('dice.inputs.formula_label')}</label>
                        <div className={`${champ} focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/50`}>
                            <input
                                type="text" value={formulaInput} onChange={e => setFormulaInput(e.target.value)}
                                className="w-full bg-transparent px-3 py-2 font-mono text-sm text-app-text outline-none"
                                placeholder={t('dice.inputs.formula_placeholder')}
                            />
                        </div>
                    </div>
                ) : mode === 'sauvegarde' ? (
                    /*
                      **La Sauvegarde : d20 sous la caractéristique.** Le seuil
                      est la caractéristique du personnage ; l'avantage et le
                      désavantage se choisissent en boutons, comme pour les dés
                      échelonnés — un seul mode, trois gestes.
                    */
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className={etiquetteDeChamp}>{t('dice.agencement.caracteristique')}</label>
                                <div className={champ}>
                                    <button onClick={() => setTarget(target - 1)} className="px-2.5 hover:bg-app-surface-2 text-app-muted transition-colors">-</button>
                                    <input
                                        type="number" value={target}
                                        onChange={(e) => setTarget(parseInt(e.target.value) || 0)}
                                        title={t('dice.agencement.caracteristique')} aria-label={t('dice.agencement.caracteristique')}
                                        className={`w-full min-w-0 bg-transparent text-center font-semibold text-app-text outline-none ${sansFleches}`}
                                    />
                                    <button onClick={() => setTarget(target + 1)} className="px-2.5 hover:bg-app-surface-2 text-app-muted transition-colors">+</button>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className={etiquetteDeChamp}>{t('dice.inputs.mod')}</label>
                                <div className={champ}>
                                    <button onClick={() => setModifier(valeurDuModificateur - 1)} className="px-2.5 hover:bg-app-surface-2 text-app-muted transition-colors">-</button>
                                    <input
                                        type="text"
                                        value={modifier === 0 || modifier === "0" ? "0" : typeof modifier === 'number' && modifier > 0 ? `+${modifier}` : modifier}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/[^0-9+-]/g, '');
                                            if (raw === '' || raw === '-' || raw === '+') setModifier(raw);
                                            else setModifier(parseInt(raw.replace('+', ''), 10) || 0);
                                        }}
                                        title={t('dice.inputs.mod')} aria-label={t('dice.inputs.mod')}
                                        className="w-full min-w-0 bg-transparent text-center font-semibold text-app-text outline-none"
                                    />
                                    <button onClick={() => setModifier(valeurDuModificateur + 1)} className="px-2.5 hover:bg-app-surface-2 text-app-muted transition-colors">+</button>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                            {([
                                { cle: 'aucun', titre: t('dice.agencement.normal') },
                                { cle: 'avantage', titre: t('dice.agencement.avantage') },
                                { cle: 'desavantage', titre: t('dice.agencement.desavantage') },
                            ] as const).map(({ cle, titre }) => (
                                <button
                                    key={cle}
                                    onClick={() => setModificateurSauvegarde(cle)}
                                    aria-pressed={modificateurSauvegarde === cle}
                                    className={`px-1 py-1.5 rounded-lg border text-ui-10 font-bold uppercase tracking-wider transition-all ${modificateurSauvegarde === cle
                                        ? 'bg-accent/20 border-accent/60 text-accent'
                                        : 'bg-app-bg border-app-border text-app-muted hover:text-app-text'}`}
                                >
                                    {titre}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : mode === 'usure' ? (
                    <div className="space-y-3">
                        <p className="text-ui-11 text-app-muted">{t('dice.agencement.usureAide')}</p>
                        {personnages.length > 0 && (
                            <div className="space-y-1.5">
                                <label className={etiquetteDeChamp}>{t('dice.agencement.personnage')}</label>
                                <select
                                    value={personnageId}
                                    onChange={e => { setPersonnageId(e.target.value); setRessourceId(''); }}
                                    aria-label={t('dice.agencement.personnage')}
                                    className="w-full bg-app-bg border border-app-border rounded-lg py-2 px-3 text-sm text-app-text focus:outline-none focus:border-accent"
                                >
                                    <option value="">{t('dice.agencement.deLibre')}</option>
                                    {personnages.map(({ personnage }) => (
                                        <option key={personnage.id} value={personnage.id}>{personnage.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {lien && (ressourcesDuPersonnage.length > 0 ? (
                            <div className="space-y-1.5">
                                <label className={etiquetteDeChamp}>{t('dice.agencement.ressource')}</label>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {ressourcesDuPersonnage.map(r => {
                                        const de = deCourant(lien.personnage.sheetData?.[r.fieldId]);
                                        return (
                                            <button
                                                key={r.fieldId}
                                                onClick={() => setRessourceId(r.fieldId)}
                                                aria-pressed={ressourceId === r.fieldId}
                                                className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border text-left transition-all ${ressourceId === r.fieldId
                                                    ? 'bg-accent/20 border-accent text-accent'
                                                    : 'bg-app-bg border-app-border text-app-text hover:border-accent/50'}`}
                                            >
                                                <span className="truncate text-xs font-semibold">{r.label}</span>
                                                <span className={`shrink-0 font-mono text-xs ${de === null ? 'text-etat-danger' : 'text-app-muted'}`}>
                                                    {de === null ? t('dice.agencement.epuisee') : de ? `d${de}` : '—'}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                                {ressourceEpuisee && (
                                    <p className="text-ui-11 text-etat-danger">{t('dice.agencement.ressourceEpuisee')}</p>
                                )}
                            </div>
                        ) : (
                            <p className="text-ui-11 text-app-muted italic">{t('dice.agencement.aucuneRessource')}</p>
                        ))}
                    </div>
                ) : mode === 'yze-echelonne' ? (
                    /*
                      **Le meneur nomme les niveaux ; l'échelle reste dans
                      `desEchelonnes`.** Le dé écrit à côté de chaque lettre vient
                      de la table et n'est jamais saisi — une fiche où quelqu'un a
                      tapé « B (D8) » est corrigée au passage plutôt que propagée.
                    */
                    <div className="space-y-2">
                        {([
                            { cle: 'attribut', titre: 'Attribut', valeur: niveauAttribut, poser: setNiveauAttribut, facultatif: false },
                            { cle: 'competence', titre: 'Compétence', valeur: niveauCompetence, poser: setNiveauCompetence, facultatif: false },
                            { cle: 'equipement', titre: 'Équipement', valeur: niveauEquipement, poser: setNiveauEquipement, facultatif: true },
                        ] as const).map(({ cle, titre, valeur, poser, facultatif }) => (
                            <div key={cle} className={champ}>
                                <span className="w-28 shrink-0 bg-app-surface-2 text-app-muted text-ui-11 px-2 flex items-center border-r border-app-border uppercase tracking-wider">
                                    {titre}
                                </span>
                                <select
                                    value={valeur}
                                    onChange={(e) => poser(e.target.value)}
                                    title={titre}
                                    aria-label={titre}
                                    className="w-full bg-transparent text-center font-semibold text-app-text outline-none text-sm"
                                >
                                    {facultatif && <option value="">—</option>}
                                    {LETTRES_ECHELONNEES.map(lettre => (
                                        <option key={lettre} value={lettre}>
                                            {lettre} (D{facesDuNiveau(lettre)})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ))}

                        <div className="grid grid-cols-3 gap-1.5 pt-1">
                            {([
                                { cle: 'aucun', titre: 'Normal' },
                                { cle: 'avantage', titre: 'Avantage' },
                                { cle: 'desavantage', titre: 'Désavantage' },
                            ] as const).map(({ cle, titre }) => (
                                <button
                                    key={cle}
                                    onClick={() => setModificateurEchelonne(cle)}
                                    aria-pressed={modificateurEchelonne === cle}
                                    className={`px-1 py-1.5 rounded-lg border text-ui-10 font-bold uppercase tracking-wider transition-all ${modificateurEchelonne === cle
                                        ? 'bg-accent/20 border-accent/60 text-accent'
                                        : 'bg-app-bg border-app-border text-app-muted hover:text-app-text'}`}
                                >
                                    {titre}
                                </button>
                            ))}
                        </div>

                        {/*
                          *Une correction muette est une règle perdue.* Le livre
                          plafonne à deux D12 et un désavantage ne vide jamais la
                          poignée : quand la composition corrige quelque chose,
                          elle le dit.
                        */}
                        {poigneeEchelonnee.remarques.map((remarque, i) => (
                            <p key={i} className="text-ui-11 italic text-etat-alerte/80">{remarque}</p>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {mode === 'yze' ? (
                            <>
                                {([
                                    { cle: 'B', titre: t('dice.inputs.base_dice'), valeur: diceCount, poser: (n: number) => setDiceCount(Math.max(1, n)), ton: 'bg-accent/20 text-accent' },
                                    { cle: 'E', titre: t('dice.inputs.gear_dice'), valeur: gearCount, poser: (n: number) => setGearCount(Math.max(0, n)), ton: 'bg-app-surface-2 text-app-muted' },
                                ]).map(({ cle, titre, valeur, poser, ton }) => (
                                    <div key={cle} className="space-y-1.5">
                                        <label className={etiquetteDeChamp}>{titre}</label>
                                        <div className={champ}>
                                            <span className={`${ton} text-xs px-2 flex items-center border-r border-app-border`}>{cle}</span>
                                            <input
                                                type="number" value={valeur}
                                                onChange={(e) => poser(parseInt(e.target.value) || 0)}
                                                title={titre} aria-label={titre}
                                                className={`w-full min-w-0 bg-transparent text-center font-semibold text-app-text outline-none ${sansFleches}`}
                                            />
                                            <div className="flex flex-col border-l border-app-border">
                                                <button onClick={() => poser(valeur + 1)} className="flex-1 px-1.5 flex items-center justify-center hover:bg-app-surface-2 text-xs">+</button>
                                                <button onClick={() => poser(valeur - 1)} className="flex-1 px-1.5 flex items-center justify-center hover:bg-app-surface-2 text-xs border-t border-app-border">-</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : (
                            <div className="space-y-1.5">
                                <label className={etiquetteDeChamp}>{t('dice.inputs.qty')}</label>
                                <div className={champ}>
                                    <button onClick={() => setDiceCount(Math.max(1, diceCount - 1))} className="px-2.5 hover:bg-app-surface-2 text-app-muted transition-colors">-</button>
                                    <input
                                        type="number" value={diceCount}
                                        onChange={(e) => setDiceCount(Math.max(1, parseInt(e.target.value) || 1))}
                                        title={t('dice.inputs.qty')} aria-label={t('dice.inputs.qty')}
                                        className={`w-full min-w-0 bg-transparent text-center font-semibold text-app-text outline-none ${sansFleches}`}
                                    />
                                    <button onClick={() => setDiceCount(diceCount + 1)} className="px-2.5 hover:bg-app-surface-2 text-app-muted transition-colors">+</button>
                                </div>
                            </div>
                        )}

                        {mode !== 'yze' && (
                            <div className="space-y-1.5">
                                <label className={etiquetteDeChamp}>{t('dice.inputs.mod')}</label>
                                <div className={champ}>
                                    <button onClick={() => setModifier(valeurDuModificateur - 1)} className="px-2.5 hover:bg-app-surface-2 text-app-muted transition-colors">-</button>
                                    <input
                                        type="text"
                                        value={modifier === 0 || modifier === "0" ? "0" : typeof modifier === 'number' && modifier > 0 ? `+${modifier}` : modifier}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/[^0-9+-]/g, '');
                                            if (raw === '' || raw === '-' || raw === '+') setModifier(raw);
                                            else setModifier(parseInt(raw.replace('+', ''), 10) || 0);
                                        }}
                                        title={t('dice.inputs.mod')} aria-label={t('dice.inputs.mod')}
                                        className="w-full min-w-0 bg-transparent text-center font-semibold text-app-text outline-none"
                                    />
                                    <button onClick={() => setModifier(valeurDuModificateur + 1)} className="px-2.5 hover:bg-app-surface-2 text-app-muted transition-colors">+</button>
                                </div>
                            </div>
                        )}

                        {['pool', 'pool_explode', 'threshold', 'advantage', 'disadvantage'].includes(mode) && (
                            <div className="space-y-1.5">
                                <label className={etiquetteDeChamp}>{t('dice.inputs.threshold_rule')}</label>
                                <div className={champ}>
                                    <select
                                        value={targetRule}
                                        onChange={e => setTargetRule(e.target.value as 'over' | 'under')}
                                        title={t('dice.inputs.threshold_rule')}
                                        aria-label={t('dice.inputs.threshold_rule')}
                                        className="w-12 shrink-0 bg-app-surface-2 text-app-text text-sm text-center px-1 outline-none border-r border-app-border"
                                    >
                                        <option value="over">≥</option>
                                        <option value="under">≤</option>
                                    </select>
                                    <input
                                        type="number" value={target}
                                        onChange={(e) => setTarget(parseInt(e.target.value) || 0)}
                                        title={t('dice.inputs.threshold_rule')} aria-label={t('dice.inputs.threshold_rule')}
                                        className={`w-full min-w-0 bg-transparent text-center font-semibold text-app-text outline-none ${sansFleches}`}
                                    />
                                    <div className="flex flex-col border-l border-app-border">
                                        <button onClick={() => setTarget(target + 1)} className="flex-1 px-1.5 flex items-center justify-center hover:bg-app-surface-2 text-xs">+</button>
                                        <button onClick={() => setTarget(target - 1)} className="flex-1 px-1.5 flex items-center justify-center hover:bg-app-surface-2 text-xs border-t border-app-border">-</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {mode !== 'usure' && <div className="space-y-1.5">
                    <label className={etiquetteDeChamp}>{t('dice.inputs.repeat')}</label>
                    <div className={champ}>
                        <button onClick={() => setBatchCount(Math.max(1, batchCount - 1))} className="px-2.5 hover:bg-app-surface-2 text-app-muted transition-colors">-</button>
                        <input
                            type="number" value={batchCount}
                            onChange={(e) => setBatchCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
                            title={t('dice.inputs.repeat')} aria-label={t('dice.inputs.repeat')}
                            className={`w-full min-w-0 bg-transparent text-center font-semibold text-app-text outline-none ${sansFleches}`}
                        />
                        <button onClick={() => setBatchCount(Math.min(20, batchCount + 1))} className="px-2.5 hover:bg-app-surface-2 text-app-muted transition-colors">+</button>
                    </div>
                </div>}

                {avecFaces ? (
                    <div className="space-y-1.5">
                        <label className={etiquetteDeChamp}>{t('dice.agencement.die')}</label>
                        <div className="grid grid-cols-4 gap-1.5">
                            {facesOffertes.map((sides) => (
                                <button
                                    key={sides}
                                    onClick={() => setFaces(sides)}
                                    aria-pressed={faces === sides}
                                    className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg border transition-all ${faces === sides
                                        ? 'bg-accent/20 border-accent text-accent'
                                        : 'bg-app-bg border-app-border text-app-muted hover:border-accent/50 hover:text-app-text'}`}
                                >
                                    {/*
                                      ⛔ **Chemin RELATIF, et c'est tout le correctif.**
                                      Il a longtemps ete `/icons/...`, absolu depuis la
                                      racine : en dev, Vite le sert depuis `localhost:5173`
                                      et tout va bien ; dans le paquet construit, la page est
                                      chargee par `loadFile`, donc en `file://`, et le meme
                                      chemin vise **la racine du disque C:**. Les sept icones
                                      de des ne s'affichaient donc QUE en developpement.
                                      Trouve le 2026-09-12 par la traversee E2E des modules,
                                      qui tourne sur le paquet construit -- jamais en dev.
                                    */}
                                    <img src={`./icons/D${sides}b.png`} alt="" className="w-6 h-6 object-contain invert dark:invert-0" />
                                    <span className="text-ui-11 font-bold tracking-widest">d{sides}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : jetDuSysteme && !MODES_SANS_CHOIX_DE_FACES.includes(mode) && mode !== 'usure' && (
                    <p className="text-ui-11 text-app-muted">
                        {t('dice.agencement.game_dice')} : <span className="font-mono text-app-text">{activeDriver!.dice.defaultDice}</span>
                    </p>
                )}
            </Panneau>

            {/* Tactical Advice Panel — il règle le modificateur : sa place est ici. */}
            {tokens.length >= 2 && (
                <Panneau niveau={1} className="shrink-0 p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Target className="text-accent" size={16} />
                        <h3 className="text-xs font-bold text-accent uppercase tracking-widest">{t('dice.tactical.title')}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="space-y-1">
                            <label className="text-ui-10 text-app-muted uppercase">{t('dice.tactical.attacker')}</label>
                            <select
                                value={lastSelectedTokenId || ''}
                                onChange={e => setLastSelectedTokenId(e.target.value)}
                                title={t('dice.tactical.attacker')}
                                className="w-full bg-app-bg/50 border border-app-border rounded-lg text-xs py-1 px-2 outline-none"
                            >
                                <option value="">{t('common:actions.select')}...</option>
                                {tokens.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-ui-10 text-app-muted uppercase">{t('dice.tactical.target')}</label>
                            <select
                                value={targetTokenId || ''}
                                onChange={e => setTargetTokenId(e.target.value)}
                                title={t('dice.tactical.target')}
                                className="w-full bg-app-bg/50 border border-app-border rounded-lg text-xs py-1 px-2 outline-none"
                            >
                                <option value="">{t('common:actions.select')}...</option>
                                {tokens.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {lastSelectedTokenId && targetTokenId && lastSelectedTokenId !== targetTokenId && (() => {
                        const tA = tokens.find(t => t.id === lastSelectedTokenId);
                        const tB = tokens.find(t => t.id === targetTokenId);
                        if (tA && tB) {
                            const range = tacticalService.getRangeInfo(tA, tB, gridSize, activeDriver?.tactical);
                            return (
                                <div className="bg-app-bg/40 rounded-xl p-3 border border-accent/20 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex flex-col">
                                        <span className="text-ui-10 text-accent font-bold uppercase">{t('dice.tactical.range_category', { category: range.category })}</span>
                                        <span className="text-xs text-app-text/80">{t('dice.tactical.distance', { units: range.distanceUnits, px: Math.round(range.distancePx) })}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-ui-10 text-app-muted uppercase">{t('dice.inputs.mod')}</span>
                                        <button
                                            onClick={() => setModifier(range.modifier)}
                                            className="text-sm font-black text-accent hover:text-accent/80 transition-colors bg-accent/10 px-2 py-0.5 rounded border border-accent/30 flex items-center gap-1"
                                        >
                                            {range.modifier > 0 ? '+' : ''}{range.modifier}
                                            <Zap size={10} />
                                        </button>
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })()}
                    {!lastSelectedTokenId || !targetTokenId ? (
                        <div className="text-ui-10 text-app-subtle italic flex items-center gap-1.5 justify-center py-2">
                            <Info size={12} /> {t('dice.tactical.hint')}
                        </div>
                    ) : lastSelectedTokenId === targetTokenId ? (
                        <div className="text-ui-10 text-etat-danger/70 italic flex items-center gap-1.5 justify-center py-2">
                            {t('dice.tactical.error_same')}
                        </div>
                    ) : null}
                </Panneau>
            )}

            <Panneau niveau={1} className="shrink-0 p-4 flex flex-col gap-3">
                <h2 className={etiquetteDeChamp}>{t('dice.agencement.display')}</h2>
                <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                        <input
                            type="checkbox"
                            checked={enable3D}
                            onChange={e => setEnable3D(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-app-surface border border-app-border rounded-full peer peer-checked:bg-etat-succes/20 peer-checked:border-etat-succes/50 transition-all"></div>
                        <div className="absolute left-1 top-1 w-3 h-3 bg-app-text/20 rounded-full transition-all peer-checked:translate-x-5 peer-checked:bg-etat-succes shadow-sm"></div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-app-text/80 group-hover:text-app-text">{t('dice.settings.enable_3d')}</span>
                        <span className="text-ui-10 text-app-muted">{t('dice.settings.enable_3d_desc')}</span>
                    </div>
                </label>

                {/*
                  ⭐ **La matière des dés appartient au meneur.** Demandé par
                  David le 2026-09-17 : *« est-ce que je peux choisir le style ? »*.

                  ⚠️ Le sélecteur ne s'affiche que si la 3D est active — *un
                  réglage qui ne change rien à l'écran est un réglage qui fait
                  douter du reste.*
                */}
                {enable3D && (
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold text-app-text/80">{t('dice.settings.dice_style')}</span>
                        <div className="flex flex-wrap gap-1 p-1 rounded-lg bg-app-surface border border-app-border">
                            {STYLES_DE_DES.map(style => (
                                <button
                                    key={style}
                                    type="button"
                                    onClick={() => setStyleDesDes(style)}
                                    aria-pressed={styleDesDes === style}
                                    className={`px-3 py-1 rounded-md text-ui-10 font-bold uppercase tracking-wider transition-all ${
                                        styleDesDes === style
                                            ? 'bg-accent/20 text-accent border border-accent/40'
                                            : 'text-app-muted border border-transparent hover:text-app-text'
                                    }`}
                                >
                                    {t(`dice.settings.styles.${style}`)}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </Panneau>
        </>
    );

    /* ── La barre : l'action, puis les jets rapides ─────────────────────── */
    const barreDOutils = (
        <>
            <Bouton
                variante="accent"
                aLaTable={regime.aLaTable}
                icone={<Dices size={20} />}
                onClick={lancer}
                /* Une ressource épuisée ne se lance plus : elle se regagne. */
                disabled={ressourceEpuisee}
                aria-label={t('dice.actions.roll')}
                title={resumeDuJet}
                className="px-8 text-sm"
            >
                <span>{t('dice.actions.roll')}</span>
                <span className="font-mono normal-case tracking-normal opacity-80">{resumeDuJet}</span>
            </Bouton>

            <span className="mx-1 h-8 w-px bg-app-border" aria-hidden="true" />

            {quickRolls.map(qr => (
                <div key={qr.id} className="group flex items-stretch bg-app-surface border border-app-border hover:border-accent/50 rounded-lg overflow-hidden transition-all">
                    <button
                        onClick={() => handleQuickRoll(qr.formula, t(qr.label))}
                        className="px-3 py-1 hover:bg-app-surface-2 transition-colors flex flex-col items-start"
                    >
                        <span className="text-xs font-semibold text-app-text">{t(qr.label)}</span>
                        <span className="text-ui-11 text-accent font-mono tracking-wider">{qr.formula}</span>
                    </button>
                    <button onClick={() => removeQuickRoll(qr.id)} title={t('common:actions.delete') + " " + t(qr.label)} className="px-1.5 hover:bg-etat-danger/20 text-app-subtle hover:text-etat-danger transition-colors">
                        <X size={13} />
                    </button>
                </div>
            ))}
            {quickRolls.length === 0 && !isAddingQuickRoll && <p className="text-xs text-app-muted italic">{t('dice.quick_rolls.empty')}</p>}

            {isAddingQuickRoll ? (
                <div className="flex items-center gap-2 bg-app-bg px-3 py-1.5 rounded-lg border border-accent/30">
                    <input
                        type="text" placeholder={t('dice.quick_rolls.placeholder_name')} value={newQuickRollLabel} onChange={(e) => setNewQuickRollLabel(e.target.value)}
                        className="w-32 bg-transparent border-b border-app-border focus:border-accent text-sm py-0.5 outline-none text-app-text"
                    />
                    <input
                        type="text" placeholder={t('dice.quick_rolls.placeholder_formula')} value={newQuickRollFormula} onChange={(e) => setNewQuickRollFormula(e.target.value)}
                        className="w-24 bg-transparent border-b border-app-border focus:border-accent text-sm py-0.5 outline-none text-app-text font-mono"
                    />
                    <button onClick={addQuickRoll} className="px-3 py-1 bg-accent hover:bg-accent/90 text-app-on-accent rounded-md text-xs font-semibold transition-colors">OK</button>
                    <button onClick={() => setIsAddingQuickRoll(false)} title="Annuler" className="px-1 text-app-muted hover:text-etat-danger transition-colors"><X size={16} /></button>
                </div>
            ) : (
                <button onClick={() => setIsAddingQuickRoll(true)} title={t('dice.quick_rolls.title')} className="text-xs flex items-center gap-1 text-app-muted hover:text-accent transition-colors px-2 py-1.5 rounded-lg border border-dashed border-app-border hover:border-accent/50">
                    <BookmarkPlus size={14} /> {t('dice.actions.add_quick')}
                </button>
            )}
        </>
    );

    return (
        <GabaritDeModule
            aLaTable={regime.aLaTable}
            reglagesOuverts={reglagesOuverts}
            className="text-app-text"
            entete={
                <EnTeteDeModule
                    titre={t('dice.title')}
                    etat={<>
                        <Etiquette ton={jetDuSysteme ? 'accent' : 'neutre'}>
                            {jetDuSysteme ? activeDriver!.name : libelleDuMode(mode)}
                        </Etiquette>
                        {batchCount > 1 && <Etiquette ton="info">× {batchCount}</Etiquette>}
                        {isDiceProjected && <Etiquette ton="accent"><Cast size={11} /> {t('dice.status.projected')}</Etiquette>}
                    </>}
                    actions={<>
                        {regime.aLaTable && (
                            <Bouton aLaTable icone={<SlidersHorizontal size={16} />} aria-pressed={reglagesOuverts} onClick={() => setReglagesOuverts(!reglagesOuverts)}>
                                {t('dice.agencement.settings_toggle')}
                            </Bouton>
                        )}
                        <Bouton aLaTable={regime.aLaTable} icone={<RotateCcw size={14} />} onClick={resetConfig} title={t('dice.reset')}>
                            {t('dice.reset')}
                        </Bouton>
                    </>}
                />
            }
            barreDOutils={barreDOutils}
            reglages={reglages}
        >
            <div className="flex h-full min-h-0 flex-col gap-4">
                {/* ── Le dernier jet domine ── */}
                <Panneau niveau={2} orne className="shrink-0 p-6 flex flex-col items-center">
                    <div className="flex w-full items-center justify-between mb-2">
                        <h2 className={etiquetteDeChamp}>{t('dice.agencement.last_roll')}</h2>
                        {/*
                          **Le bouton de projection reste visible.** Défaut T5 du
                          § 12i, tranché le 2026-09-04 : il vivait en
                          `opacity-0 group-hover`, il fallait savoir qu'il
                          existait. *Un geste qu'on ne peut faire qu'en le
                          connaissant déjà n'est pas offert, il est caché.* Sans
                          jet, il n'y a rien à projeter.
                        */}
                        {history.length > 0 && (
                            <Bouton
                                variante={isDiceProjected ? 'danger' : 'neutre'}
                                aLaTable={regime.aLaTable}
                                icone={isDiceProjected ? <XCircle size={16} /> : <Cast size={16} />}
                                onClick={handleToggleProjection}
                                title={isDiceProjected ? t('dice.status.project_stop') : t('dice.status.project_start')}
                            >
                                {isDiceProjected ? t('dice.agencement.stop_projection') : t('dice.agencement.project')}
                            </Bouton>
                        )}
                    </div>

                    {dernier ? (
                        <>
                            <p className="text-app-muted font-medium mb-2 text-sm text-center line-clamp-2">{dernier.title}</p>
                            <div className={`font-display font-black text-app-text mb-3 text-center w-full px-2 break-words ${
                                dernier.totalDisplay.length > 12 ? 'text-4xl' :
                                dernier.totalDisplay.length > 8 ? 'text-5xl' :
                                'text-6xl'
                            }`}>
                                {dernier.totalDisplay}
                            </div>
                            {dernier.fateRank !== undefined && (
                                <div className="text-xs text-accent font-bold uppercase tracking-wider mb-2">
                                    {getFateRankLabel(dernier.fateRank, t)}
                                </div>
                            )}
                            <EtiquetteDuDegre
                                resultat={dernier}
                                classes={reussi => 'px-5 py-1 mb-3 rounded-full text-xs font-bold uppercase tracking-widest '
                                    + (reussi
                                        ? 'bg-etat-succes/20 text-etat-succes border border-etat-succes/50'
                                        : 'bg-etat-danger/20 text-etat-danger border border-etat-danger/50')}
                            />
                            {/* Chaque dé, avec ce qu'il est : ses faces, et sa réserve s'il en a une. */}
                            <div className="flex flex-wrap gap-2 justify-center max-h-[9rem] w-full overflow-y-auto custom-scrollbar px-2 py-1">
                                {dernier.rolls.map((r, i) => (
                                    <div key={i} className="flex flex-col items-center gap-1">
                                        <span className={`w-12 h-12 flex items-center justify-center rounded-lg text-base font-black ${getDieCssClass(r)} ${r.isDropped ? 'opacity-40 line-through' : ''}`}>
                                            {r.displayStr ? r.displayStr : r.val}
                                        </span>
                                        {(r.sides || r.source) && (
                                            <span className="text-ui-10 text-app-subtle uppercase tracking-wider">
                                                {r.source === 'base' ? t('dice.agencement.base') : r.source === 'gear' ? t('dice.agencement.gear') : ''}
                                                {r.source && r.source !== 'digit' && r.sides ? ' · ' : ''}
                                                {r.sides ? `d${r.sides}` : ''}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-6">
                            <Dices size={44} className="mx-auto mb-3 text-app-subtle" />
                            <p className="text-app-muted font-medium">{t('dice.status.waiting')}</p>
                        </div>
                    )}
                </Panneau>

                {/* ── L'historique, sobre : une ligne par jet ── */}
                <Panneau niveau={1} className="flex-1 min-h-0 p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-app-border">
                        <h2 className={etiquetteDeChamp}>{t('dice.history.title')}</h2>
                        <button
                            onClick={clearHistory}
                            disabled={history.length === 0}
                            className="flex items-center gap-1.5 text-xs font-medium text-app-muted hover:text-app-text transition-colors disabled:opacity-30"
                        >
                            <RotateCcw size={12} /> {t('dice.actions.clear')}
                        </button>
                    </div>

                    <ul className="flex-1 overflow-y-auto custom-scrollbar pr-1 divide-y divide-app-border/50">
                        {history.map(record => (
                            <li key={record.id} className={`grid grid-cols-[4.5rem_minmax(0,1fr)_auto_auto] items-center gap-3 py-1.5 pl-2 ${record.batchId ? 'border-l-2 border-etat-info/40' : ''}`}>
                                <span className="text-ui-11 font-mono text-app-subtle">
                                    {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                                <div className="min-w-0 flex items-center gap-2">
                                    <span className="text-xs font-semibold text-accent truncate">{record.title}</span>
                                    <span className="flex flex-wrap gap-1 items-center">
                                        {record.rolls.slice(0, 8).map((r, idx) => (
                                            <span key={idx} className={`text-ui-10 px-1.5 py-0.5 rounded font-bold ${getDieCssClass(r)}`}>
                                                {r.displayStr || r.val}
                                            </span>
                                        ))}
                                        {record.rolls.length > 8 && <span className="text-ui-10 text-app-subtle">+{record.rolls.length - 8}</span>}
                                        {record.modifier !== 0 && (
                                            <span className="text-ui-10 px-1.5 py-0.5 rounded bg-etat-info/20 text-etat-info font-bold">
                                                {record.modifier > 0 ? '+' : ''}{record.modifier}
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <span className="text-base font-black text-app-text text-right">{record.totalDisplay}</span>
                                <EtiquetteDuDegre
                                    resultat={record}
                                    classes={reussi => 'text-ui-10 uppercase font-bold text-right '
                                        + (reussi ? 'text-etat-succes' : 'text-etat-danger')}
                                />
                            </li>
                        ))}
                    </ul>
                </Panneau>
            </div>
        </GabaritDeModule>
    );
};

export default DiceBoard;
