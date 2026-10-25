import React, { Fragment, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Info, Plus, Minus, Coins } from 'lucide-react';
import { EtiquetteDuDegre } from '../../../dice/EtiquetteDuDegre';
import { consignerLeJet } from '../../../journal/consignerLeJet';
import { DiceEngine, type RollResult } from '../../../dice/DiceEngine';
import {
    preparerLeJet, sectionsDeLaComposante, verdict,
    type ComposanteDeJet, type DescripteurDeJet,
} from '../../../dice/DescripteurDeJet';
import { plafondDe, valeurDe, ventilerLaDepense, type RessourceDeTable } from '../../../table/RessourcesDeTable';
import { useRessourcesDeTableStore } from '../../../table/useRessourcesDeTableStore';
import { apportsDisponibles, effetDesApports, idDeReserveDuGroupe, niveauDuGroupe, type ApportDisponible } from '../../../table/reservesDuGroupe';
import { malusDePeril, resoudreLeDestin } from '../../../dice/systemes/nocturne';
import {
    lancerUneChaine, lancerLaPossibilite, ceQueLAnnulationAnnule, resoudreTorg, ND_DE_L_ANNULATION,
    type DesDeTorg, type OptionsDeTorg,
} from '../../../dice/systemes/torg';
import {
    cumulDePanique, entreeDeLaTable, forcerLeJet, lancerLEffetDuBrise, noterSurLaFiche, pourquoiNePasForcer, prixDuForcage,
    relancableMalgreSaReussite, tableDuBrise, testDePanique, type EtatBrise, type FamilleYearZero,
} from '../../../dice/systemes/yearZero';
import { pontDesTables } from '../../../tables/pontDesTables';
import StressSubi from './StressSubi';
import SuiviCthulhuHack from './SuiviCthulhuHack';
import { CLE_CTHULHU_HACK, memoriserTestCH, modificateursCH } from '../../../dice/systemes/cthulhuHack';
import PaniqueAlien from './PaniqueAlien';
import SanteAlien from './SanteAlien';
import MunitionsAlien from './MunitionsAlien';
import ActionsAlien from '../../../combat/components/ActionsAlien';
import ProgressionAlien from './ProgressionAlien';
import { lireProgressionAlien } from '../../../dice/systemes/progressionAlien';
import { CLE_COMBAT_ALIEN, lireLeCombatAlien, malusDesBlessures, preparerLeTir, rechargerUneArme } from '../../../dice/systemes/combatAlien';
import { systemeArrete } from '../../../dice/systemes/synthetiquesAlien';
import { PreparationAlien, SuitesDuJetAlien } from './JetsAlien';
import { CLE_JET_ALIEN, REGLAGES_ALIEN, actualiserLeJetAlien, composerLesDesAlien, equipementsAlien, lireLeJetAlien, resultatDuJetAlien, type JetAlien } from '../../../dice/systemes/jetsAlien';
import {
    appliquerLaPaniqueAlien, cumulAlien, desApresTremblement, estUnAndroide,
    lireLaPaniqueAlien, modifierDePanique, resultatAvecPanique,
} from '../../../dice/systemes/paniqueAlien';
import type { TableEntry } from '../../../tables/types';
import { useEffetsDuRound } from '../../../combat/useEffetsDuRound';
import { LigneDuReferentiel } from './ChampDuReferentiel';
import { champDeLaSuite, jetVientDe, suitesDuJet, valeurApresLaSuite, type SuiteDUnCritique } from '../../../dice/suitesDesCritiques';
import { consommationsDuJet, direLaConsommation } from '../../../dice/consommationAuJet';
import { effetsSurLaNevrose, potentielActuel, resoudreLaGarde, type JetGarde } from '../../../dice/systemes/potentielGarde';
import AtteintesDesPotentiels from './AtteintesDesPotentiels';
import PsychologieDeCrimes from './PsychologieDeCrimes';
import ContactsEtFortune from './ContactsEtFortune';
import CreationDeCrimes from './CreationDeCrimes';
import OppositionDeCrimes from './OppositionDeCrimes';
import { nevroseDuJet } from '../../../dice/systemes/psychologieDeCrimes';
import { IssueDeLAttaque, PreparationDeLAttaque } from './AttaqueDeCrimes';
import { ARMES_DE_CRIMES, REGLAGES_D_ATTAQUE, type ReglagesDAttaque } from '../../../dice/systemes/armesDeCrimes';
import CirconstancesDuSeuil from './CirconstancesDuSeuil';
import { CIRCONSTANCES, totalDesCirconstances, type Circonstances } from '../../../dice/systemes/circonstancesDuSeuil';
import { apresLeGain, peutGagner, pointsDuJet } from '../../logic/pointsDEnquete';
import { useCosmsCourants } from '../../hooks/useCosmsCourants';
import { malusDesCiblesMultiples } from '../../../combat/logic/sbiresEtHordes';
import { loiEnVigueur } from '../../logic/cosmsCourants';
import { useSessionOSStore } from '../../useSessionOSStore';
import { useOrdreDuTourStore } from '../../../combat/useOrdreDuTourStore';
import { useCombatStore } from '../../../combat/useCombatStore';
import { facesDuNiveau } from '../../../dice/desEchelonnes';
import { dejaUtilise, ecrireLeSuivi, lireLeSuivi } from '../../../dice/systemes/bladeRunner';
import { seanceOuverteDe } from '../../logic/seanceOuverte';
import { tousLesPilotes } from '../../store/tousLesPilotes';
import { appliquerAuGroupe } from '../../logic/groupeDeLaCampagne';
import ApportsDuGroupe from './ApportsDuGroupe';
import { CarteDuJeu, Etape } from './EtapesDuJet';
import { ChutesNephilim, ExperienceNephilim, PreparationNephilim, SanteNephilim, StaseNephilim, SuitesNephilim } from './NephilimAuJet';
import type { ChoixDeNephilim, JetDeNephilim } from '../../../dice/systemes/nephilimRegles';
import {
    BourseSymbaroum, CorruptionSymbaroum, DeriveesSymbaroum, EnduranceSymbaroum, OptionsSymbaroum, PreparationSymbaroum,
    ProgressionSymbaroum, SuitesSymbaroum, TourSymbaroum, VoyageSymbaroum, type Options as OptionsDeSymbaroum,
} from './SymbaroumAuJet';
import { lireSymbaroum, sansCritiqueDeBase, type NatureDuTest } from '../../../dice/systemes/symbaroumRegles';
import { CreationStarTrek, PreparationStarTrek, ReputationStarTrek, StressEtBlessuresStarTrek, SuitesStarTrek, TourStarTrek, type VaisseauPourLAide } from './StarTrekAuJet';
import { CarnetDune, PreparationDune, SuitesDune } from './DuneAuJet';
import { CHOIX_DUNE, CLE_DUNE, bilanDune, conserverDune, depenserDune, desDune, difficulteDune, entierDune, lireDune, lignesDune, noterDune, resultatDune,
    type ChoixDune, type DeDune, type BilanDune } from '../../../dice/systemes/duneRegles';
import {
    CHOIX_STAR_TREK, coutDesAssistants, desDeLaTache, oppositionDeLaTache, resultatDeStarTrek, seuilDeComplication,
    type ChoixStarTrek, type DeDuJet,
} from '../../../dice/systemes/starTrekRegles';
import { useModulesDuJeuJoueur, useModulesDuJeuMJ } from '../../../modulesDuJeu/magasins';
import type { SheetTemplate } from '../../../../data/defaultSheetTemplates';
import type { ApportDuGroupe, DiceConfig } from '../../../../types/drivers';

/**
 * Lancer depuis la fiche de personnage.
 *
 * **Ce qu'il change.** Jusqu'ici la fiche était un formulaire : on y notait des
 * valeurs qu'il fallait reporter à la main dans Dice OS pour lancer. Le seuil,
 * chez Dune, se calcule à partir de deux champs de la fiche — une compétence et
 * un principe — et personne ne pouvait faire ce calcul à la place du joueur.
 *
 * **Le résultat reste sur la fiche**, à côté des valeurs qui l'ont produit. On
 * voit d'où vient le seuil, ce qui est la moitié de l'intérêt : un jet dont on
 * ne sait pas de quoi il est fait ne se vérifie pas.
 *
 * Le panneau ne s'affiche que si le pilote décrit ses jets. Un système sans
 * descripteur garde sa fiche telle quelle, sans bouton mort.
 */
/** Ce que le sélecteur affiche, et ce que le journal de séance retient. */
const LIBELLES = { avantage: 'Avantage', desavantage: 'Désavantage' } as const;
/**
 * **Quand le jeu a un Avantage tactique, le tirage ne s'appelle plus « Avantage »**
 * (Symbaroum, S3, 2026-10-22) : lancer deux d20 sert à la cécité et à certains
 * Talents, et l'Avantage du jeu est +2 au seuil. Deux choses, deux noms.
 */
const LIBELLES_DU_DOUBLE_LANCER = { avantage: 'Deux dés, le meilleur', desavantage: 'Deux dés, le pire' } as const;

interface PanneauDeJetProps {
    descripteur: DescripteurDeJet;
    dice: DiceConfig;
    template: SheetTemplate;
    /** Valeurs courantes de la fiche, telles que l'éditeur les tient. */
    valeurs: Record<string, unknown>;
    /**
     * De quoi faire payer les dés et créditer l'excédent.
     *
     * Les deux facultatifs et solidaires : un système sans monnaie de table
     * garde le panneau tel quel, les dés y sont simplement gratuits.
     */
    campaignId?: string;
    ressourcesDeTable?: RessourceDeTable[];
    /**
     * Le panneau tourne sur la tablette d'un joueur.
     *
     * Le jet est **exactement le même** — mêmes dés, même seuil, même règle :
     * *un jet qui change selon l'écran d'où on le lance n'est pas le même jet.*
     * Seule la dépense change de chemin : elle doit remonter au meneur au lieu
     * de rester dans la fenêtre où elle a été faite.
     */
    pourLesJoueurs?: boolean;
    /**
     * Le personnage qui lance, sur la tablette : son jet **remonte au meneur**
     * (`fiche:resultat`) au lieu de s'écrire dans le journal de la tablette,
     * que personne ne lit (demandé par David le 2026-09-30).
     */
    personnageId?: string;
    /**
     * Écrit sur la fiche du personnage ce que ses réserves ont donné — le Vécu,
     * l'Espoir, la Singularité d'un Héros de NOC. Sans elle, ces réserves ne se
     * proposent pas : on ne dépense pas ce qu'on ne saurait décompter.
     */
    ecrireSurLaFiche?: (maj: Record<string, unknown>) => void;
}

const PanneauDeJet: React.FC<PanneauDeJetProps> = ({
    descripteur, dice, template, valeurs, campaignId, ressourcesDeTable, pourLesJoueurs = false, personnageId,
    ecrireSurLaFiche,
}) => {
    /** Champ retenu pour chaque composante — `{ competence: 'combat' }`. */
    const [choix, setChoix] = useState<Record<string, string>>({});
    const [desAchetes, setDesAchetes] = useState(0);
    // Un jeu sans difficulté déclarée n'en affiche pas, et part de zéro : chez
    // Alien, un seul six suffit — il n'y a pas de seuil à atteindre.
    const [difficulte, setDifficulte] = useState(descripteur.difficulte?.defaut ?? 0);
    /**
     * L'ajustement de difficulté — **et ce n'est pas la même chose que
     * `difficulte`**, qui compte des réussites à atteindre. Celui-ci déplace la
     * colonne de la table et change le pourcentage. Zéro est la difficulté
     * moyenne, et c'est pourquoi il est le défaut.
     */
    const [ajustementDeDifficulte, setAjustementDeDifficulte] = useState(0);
    /**
     * **Le seuil que le meneur déplace** (Symbaroum, 2026-10-22) : un
     * modificateur de situation, et la valeur adverse d'une opposition —
     * vide, pas d'opposition. Ni l'un ni l'autre n'est `difficulte`.
     */
    const seuilDeplacable = descripteur.sens === 'sous-ou-egal' && !descripteur.cible && !descripteur.desEchelonnes
        && !descripteur.tableDeBonus && !descripteur.destin ? descripteur.modificateurDuSeuil : undefined;
    const libellesDuTirage = seuilDeplacable?.avantage ? LIBELLES_DU_DOUBLE_LANCER : LIBELLES;
    const [modificateurDuSeuil, setModificateurDuSeuil] = useState(descripteur.modificateurDuSeuil?.defaut ?? 0);
    const [valeurAdverse, setValeurAdverse] = useState('');
    /** L'Avantage tactique de Symbaroum (+2, +1D4 aux dégâts) — S3, 2026-10-22. */
    const [avantageTactique, setAvantageTactique] = useState(false);
    const [resultat, setResultat] = useState<RollResult | null>(null);
    const [suiteDuDestin, setSuiteDuDestin] = useState<{ personnageId?: string; texte: string; disponibles: number; ajouter: () => void; terminer: () => void } | null>(null);
    const generationDuDestin = useRef(0);
    const [ecritsCH, setEcritsCH] = useState({base:valeurs, personnageId, maj:{} as Record<string,unknown>});
    const refCH=useRef(ecritsCH);
    const valeursCH=useMemo(()=>({...valeurs,...(ecritsCH.base===valeurs&&ecritsCH.personnageId===personnageId?ecritsCH.maj:{})}),[valeurs,ecritsCH,personnageId]);
    const ecrireCH=(maj:Record<string,unknown>)=>{
        const avant=refCH.current.base===valeurs&&refCH.current.personnageId===personnageId?refCH.current.maj:{};
        refCH.current={base:valeurs,personnageId,maj:{...avant,...maj}};setEcritsCH(refCH.current);ecrireSurLaFiche?.(refCH.current.maj);
    };
    const [avantPanique, setAvantPanique] = useState<RollResult | null>(null);
    const [folieMeurtriere, setFolieMeurtriere] = useState(false);
    const [ecritsAlien, setEcritsAlien] = useState({ base: valeurs, personnageId, maj: {} as Record<string, unknown> });
    const refAlien = useRef(ecritsAlien);
    const paniqueDejaJouee = useRef(false);
    const evenementPanique = useRef('');
    const suitesAlien = descripteur.panique?.suites;
    const regleJetAlien = descripteur.alien;
    const [reglagesAlien, setReglagesAlien] = useState(REGLAGES_ALIEN);
    const dernierJetAlien = useRef<JetAlien | undefined>(undefined);
    // Les écritures locales ne complètent que la version de fiche qui les a
    // produites ; une nouvelle fiche reçue fait autorité sans effet de remise à zéro.
    const valeursAlien = useMemo(() => ({ ...valeurs,
        ...(ecritsAlien.base === valeurs && ecritsAlien.personnageId === personnageId ? ecritsAlien.maj : {}),
    }), [valeurs, ecritsAlien, personnageId]);
    const ecrireAlien = (maj: Record<string, unknown>) => {
        if (!Object.keys(maj).length) return;
        const precedent = refAlien.current.base === valeurs && refAlien.current.personnageId === personnageId ? refAlien.current.maj : {};
        refAlien.current = { base: valeurs, personnageId, maj: { ...precedent, ...maj } };
        setEcritsAlien(refAlien.current);
        ecrireSurLaFiche?.(refAlien.current.maj);
    };
    const equipements = regleJetAlien ? equipementsAlien(regleJetAlien, valeursAlien) : [];
    const equipementAlien = equipements.find(a => a.id === reglagesAlien.equipement);
    const suiviJetAlien = regleJetAlien ? lireLeJetAlien(valeursAlien) : undefined;
    const combatAlien = regleJetAlien?.combat;
    const synthetiqueAlien = !!suitesAlien && estUnAndroide(suitesAlien, valeursAlien);
    const etatCombatAlien = lireLeCombatAlien(valeursAlien);
    const tirAlien = !!combatAlien && !!regleJetAlien && regleJetAlien.competences[choix[regleJetAlien.competence]] === 'distance';
    const tirPrepareAlien = tirAlien ? preparerLeTir(reglagesAlien,equipementAlien) : undefined;
    const enregistrerLeResultatAlien = (res: RollResult, enAttente = false, annule = false) => {
        if (!regleJetAlien || !dernierJetAlien.current) return res;
        const recu = lireLeJetAlien({ ...valeursAlien, ...(refAlien.current.base === valeurs ? refAlien.current.maj : {}) });
        let suivi = actualiserLeJetAlien(recu?.id === dernierJetAlien.current.id ? recu : dernierJetAlien.current, res, enAttente, annule);
        const equipementDuJet = suivi.equipement;
        if (combatAlien && suivi.competence === 'distance' && equipementDuJet?.proprietes?.munitions) {
            const aVider = suivi.chargeurAVider || equipementDuJet.proprietes.unique || (!synthetiqueAlien && res.rolls.some(d => d.source === 'gear' && d.val === 1));
            suivi = { ...suivi, chargeurAVider: aVider };
            if (aVider && !enAttente && !suivi.resolu) {
                const s = lireLeCombatAlien({ ...valeursAlien, ...(refAlien.current.base === valeurs ? refAlien.current.maj : {}) });
                const arme = s.armes[equipementDuJet.id];
                ecrireAlien({ [CLE_COMBAT_ALIEN]: { ...s, armes: { ...s.armes, [equipementDuJet.id]: { chargeurs: arme?.chargeurs ?? 0, vide: true } } } });
                suivi = { ...suivi, resolu: true };
            }
        }
        dernierJetAlien.current = suivi;
        ecrireAlien({ [CLE_JET_ALIEN]: suivi });
        return resultatDuJetAlien(res, suivi);
    };
    const [seuilDuLancer, setSeuilDuLancer] = useState(0);
    /**
     * Avantage, désavantage, ou rien — **la règle de Dice OS**, et c'est
     * délibérément la même : *un jet qui change selon l'écran d'où on le lance
     * n'est pas le même jet.* On lance deux dés et on garde le meilleur, ou le
     * moins bon ; « meilleur » se lit selon le sens du comptage, donc le PLUS
     * BAS sur un jeu qui jette sous un seuil.
     */
    const [modificateur, setModificateur] = useState<'aucun' | 'avantage' | 'desavantage'>('aucun');
    /**
     * **Le soutien** (Blade Runner, « Soutien », p. 57 — B2, 2026-10-24) : un allié
     * présent apporte le dé de son niveau dans la compétence du jet. Une lettre
     * (un PNJ), ou `pj:<id>` : un personnage du groupe, dont on lit la lettre.
     */
    const [soutien, setSoutien] = useState('');
    // La liste des joueurs elle-même : un `flatMap` dans le sélecteur rendrait un tableau neuf à chaque rendu.
    const joueursDuGroupe = useSessionOSStore(s => s.players);
    const personnagesDuGroupe = useMemo(() => joueursDuGroupe.flatMap(p => p.characters), [joueursDuGroupe]);
    const composanteDeCompetence = descripteur.desEchelonnes?.composantes.find(c => c.id === 'competence') ?? descripteur.desEchelonnes?.composantes.at(-1);
    const champDeCompetence = choix[composanteDeCompetence?.id ?? ''] ?? '';
    const echelonne = !!descripteur.desEchelonnes;
    const allies = useMemo(() => echelonne
        ? personnagesDuGroupe
            .filter(c => c.id !== personnageId && facesDuNiveau(c.sheetData?.[champDeCompetence]) !== null)
            .map(c => ({ id: c.id, nom: c.name, lettre: String(c.sheetData?.[champDeCompetence]).trim().charAt(0).toUpperCase() }))
        : [], [echelonne, personnagesDuGroupe, personnageId, champDeCompetence]);
    const soutienDuJet = useMemo(() => {
        if (!echelonne || !soutien) return undefined;
        const allie = soutien.startsWith('pj:') ? allies.find(a => `pj:${a.id}` === soutien) : undefined;
        const faces = facesDuNiveau(allie ? allie.lettre : soutien);
        return faces ? { label: allie ? `Soutien de ${allie.nom}` : `Soutien ${soutien}`, faces } : undefined;
    }, [echelonne, soutien, allies]);
    /**
     * **Le souvenir clé** (Blade Runner, « Souvenirs clés », p. 56 — B7, 2026-10-24) :
     * une fois par séance, un avantage d'office ; ou, après le jet et avant de le
     * forcer, un dé de plus. Raté malgré lui et un forçage : 1 point de stress.
     * Il se marque sur la fiche : le panneau doit pouvoir l'écrire.
     */
    const regleBR = descripteur.bladeRunner;
    const souvenirDeLaFiche = regleBR?.souvenirCle ? String(valeurs[regleBR.souvenirCle] ?? '').trim() : '';
    const seanceOuverteBR = useSessionOSStore(s => seanceOuverteDe(s.campaigns, s.sessions, s.activeCampaignId)?.id);
    const seanceBR = seanceOuverteBR ?? `jour ${new Date().toDateString()}`;
    const souvenirDisponible = !!regleBR && !!souvenirDeLaFiche && !!ecrireSurLaFiche
        && !dejaUtilise(lireLeSuivi(valeurs), 'souvenirCle', seanceBR);
    const [souvenirAuJet, setSouvenirAuJet] = useState(false);
    const [souvenirDuJet, setSouvenirDuJet] = useState<'avant' | 'apres' | null>(null);
    const [stressDuSouvenir, setStressDuSouvenir] = useState(false);
    const souvenirRetenu = souvenirAuJet && souvenirDisponible;
    const marquerLeSouvenir = () => {
        if (regleBR) ecrireSurLaFiche?.(ecrireLeSuivi(regleBR, { ...lireLeSuivi(valeurs), souvenirCle: seanceBR }, valeurs));
    };
    /** La spécialisation s'applique à ce jet — c'est le joueur qui le sait (Star Trek). */
    const [specialisation, setSpecialisation] = useState(false);
    /** La spécialisation retenue pour un jet gardé (Crimes) : l'identifiant de sa case. */
    const [specialisationDeLaGarde, setSpecialisationDeLaGarde] = useState('');
    /** Les dés gardés que le journal connaît : une garde changée ensuite se consigne à la demande. */
    const [gardeAuJournal, setGardeAuJournal] = useState('');
    /** L'attaque de Crimes (C6) : l'arme, la portée, l'opposition, la cible ; et ce qui a été infligé. */
    const [reglagesDAttaque, setReglagesDAttaque] = useState<ReglagesDAttaque>(REGLAGES_D_ATTAQUE);
    const [attaqueInfligee, setAttaqueInfligee] = useState<string | null>(null);
    /** Les circonstances qui déplacent le seuil du jet gardé (Crimes, C0.1). */
    const [circonstances, setCirconstances] = useState<Circonstances>(CIRCONSTANCES);
    const [seuilDeBaseImpose, setSeuilDeBaseImpose] = useState(false);
    /** L'action relève d'une spécialisation hermétique (Crimes, C0.3) : l'identifiant de sa case. */
    const [actionHermetique, setActionHermetique] = useState('');
    const tirDeCrimes = ARMES_DE_CRIMES.find(a => a.id === reglagesDAttaque.arme)?.famille === 'feu';
    const champDAngoisse = descripteur.garde?.circonstances?.angoisse;
    const angoisseDuTireur = champDAngoisse ? Math.max(0, Number(valeurs[champDAngoisse]) || 0) : undefined;
    const modificateurDeLaGarde = descripteur.garde?.circonstances ? totalDesCirconstances(circonstances, tirDeCrimes, angoisseDuTireur) : 0;
    /** La Névrose du jet notée sur la fiche (Crimes, C4) : une seule fois par lancer. */
    const [nevroseNotee, setNevroseNotee] = useState<string | null>(null);
    /** Le style d'enquête crédité pour ce jet (Crimes, C5) : une seule fois par lancer. */
    const [enqueteNotee, setEnqueteNotee] = useState<string | null>(null);
    const stylesDEnquete = useSessionOSStore(s => s.getActiveDriver())?.enquete?.styles;
    /** Le dépassement annoncé avant de jeter les dés (Crimes, C3, p. 385). */
    const [depassementAnnonce, setDepassementAnnonce] = useState(false);
    /** Ce que le jet gardé savait au lancer : le Potentiel, ses marques, le dépassement permis. */
    const [gardeDuLancer, setGardeDuLancer] = useState<{
        atteintes?: NonNullable<ReturnType<typeof preparerLeJet>['garde']>['atteintes'];
        depassement?: NonNullable<ReturnType<typeof preparerLeJet>['garde']>['depassement'];
    } | null>(null);
    /*
      **Les atteintes écrites d'ici** (C2) : elles complètent la version de fiche
      qui les a produites, le temps que la fiche revienne — comme chez Alien.
    */
    const [ecritsDesAtteintes, setEcritsDesAtteintes] = useState({ base: valeurs, maj: {} as Record<string, number> });
    const valeursDesAtteintes = useMemo(() => ({
        ...valeurs, ...(ecritsDesAtteintes.base === valeurs ? ecritsDesAtteintes.maj : {}),
    }), [valeurs, ecritsDesAtteintes]);
    const ecrireLesAtteintes = (maj: Record<string, number>) => {
        setEcritsDesAtteintes(e => ({ base: valeurs, maj: { ...(e.base === valeurs ? e.maj : {}), ...maj } }));
        ecrireSurLaFiche?.(maj);
    };
    /** Ce que le dernier lancer a fait aux réserves de la table. */
    const [mouvements, setMouvements] = useState<string[]>([]);
    /**
     * **Payer en Menace par choix** — Dune, lot D2 (2026-10-22) : la part des dés
     * achetés que le joueur met sur le report, même avec de l'Impulsion en
     * réserve. Seulement si la réserve le déclare (`paiementAuChoix`).
     */
    const [enReport, setEnReport] = useState(0);
    /**
     * **L'Impulsion du jet que la réserve pleine ne peut pas garder** — lot D2.
     * Le livre la laisse dépenser sur le test avant de conserver le reliquat
     * (p. 151) ; la verser d'office au plafond la détruisait sans un mot.
     */
    const [impulsionDuJet, setImpulsionDuJet] = useState<{ reste: number; enTete: string } | null>(null);
    /**
     * **Nephilim jusqu'au bout** (2026-10-23) : les options du jet, ce que le
     * dernier lancer savait, et les écritures des cartes — elles complètent la
     * version de fiche qui les a produites, comme chez Alien.
     */
    const regleNephilim = descripteur.cible?.mecanique === 'nephilim' ? descripteur.nephilim : undefined;
    const [choixNephilim, setChoixNephilim] = useState<ChoixDeNephilim>({ actionPhysique: true });
    const [nephilimDuLancer, setNephilimDuLancer] = useState<{ jet: JetDeNephilim; degres: number } | null>(null);
    const [ecritsNephilim, setEcritsNephilim] = useState({ base: valeurs, personnageId, maj: {} as Record<string, unknown> });
    const valeursNephilim = useMemo(() => ({ ...valeurs,
        ...(ecritsNephilim.base === valeurs && ecritsNephilim.personnageId === personnageId ? ecritsNephilim.maj : {}),
    }), [valeurs, ecritsNephilim, personnageId]);
    const ecrireNephilim = (maj: Record<string, unknown>) => {
        setEcritsNephilim(e => ({ base: valeurs, personnageId, maj: { ...(e.base === valeurs && e.personnageId === personnageId ? e.maj : {}), ...maj } }));
        ecrireSurLaFiche?.(maj);
    };

    /**
     * **Symbaroum jusqu'au bout** (2026-10-23) : la nature du test (attaque,
     * Défense), ce que le dernier lancer savait, la relance déjà faite, et les
     * écritures des cartes — elles complètent la fiche qui les a produites.
     */
    const regleSymbaroum = descripteur.sens === 'sous-ou-egal' && !descripteur.cible ? descripteur.symbaroum : undefined;
    const [natureSymbaroum, setNatureSymbaroum] = useState<NatureDuTest>('test');
    const [symbaroumDuLancer, setSymbaroumDuLancer] = useState<{ nature: NatureDuTest; avantage: boolean; compte: number; dejaRelance: boolean } | null>(null);
    const relanceSymbaroum = useRef(false);
    const [ecritsSymbaroum, setEcritsSymbaroum] = useState({ base: valeurs, personnageId, maj: {} as Record<string, unknown> });
    const valeursSymbaroum = useMemo(() => ({ ...valeurs,
        ...(ecritsSymbaroum.base === valeurs && ecritsSymbaroum.personnageId === personnageId ? ecritsSymbaroum.maj : {}),
    }), [valeurs, ecritsSymbaroum, personnageId]);
    const ecrireSymbaroum = (maj: Record<string, unknown>) => {
        if (!Object.keys(maj).length) return;
        setEcritsSymbaroum(e => ({ base: valeurs, personnageId, maj: { ...(e.base === valeurs && e.personnageId === personnageId ? e.maj : {}), ...maj } }));
        ecrireSurLaFiche?.(maj);
    };

    /**
     * **Star Trek jusqu'au bout** (2026-10-23) : la tâche complète — nature, marge,
     * opposition, assistants, vaisseau, Détermination — et ce que le dernier lancer
     * savait, pour le recompter après une relance.
     */
    const regleStarTrek = descripteur.sens === 'sous-ou-egal' && !descripteur.cible ? descripteur.starTrek : undefined;
    const regleDune = descripteur.dune;
    const [choixDune, setChoixDune] = useState<ChoixDune>(CHOIX_DUNE);
    const [ecritsDune, setEcritsDune] = useState({ base: valeurs, personnageId, maj: {} as Record<string, unknown> });
    const valeursDune = useMemo(() => ({ ...valeurs, ...(ecritsDune.base === valeurs && ecritsDune.personnageId === personnageId ? ecritsDune.maj : {}) }), [valeurs, ecritsDune, personnageId]);
    const ecrireDune = (maj: Record<string, unknown>) => {
        setEcritsDune(e => ({ base: valeurs, personnageId, maj: { ...(e.base === valeurs && e.personnageId === personnageId ? e.maj : {}), ...maj } }));
        ecrireSurLaFiche?.(maj);
    };
    const [duneDuLancer, setDuneDuLancer] = useState<{ des: DeDune[]; choix: ChoixDune; difficulte: number; bilan: BilanDune; principe: string; compte: number } | null>(null);
    const suiviDune = lireDune(valeursDune);
    const determinationDune = regleDune ? entierDune(valeursDune[regleDune.determination], 0, 3) : 0;
    const principeDune = choix.principe;
    const maximeDune = suiviDune.maximes[principeDune] ?? '';
    const tourDune = useOrdreDuTourStore(s => s.tour);
    const acteursDune = useCombatStore(s => s.combatants);
    const acteurDune = acteursDune.find(c => c.sourcePlayerId === personnageId && personnageId);
    const difficulteDeRepriseDune = regleDune && acteurDune?.id === tourDune?.dernierAgissant ? tourDune?.difficulteDune ?? 0 : 0;
    const [choixStarTrek, setChoixStarTrek] = useState<ChoixStarTrek>(CHOIX_STAR_TREK);
    const [starTrekDuLancer, setStarTrekDuLancer] = useState<{ des: DeDuJet[]; complication: number; difficulte: number; choix: ChoixStarTrek; compte: number } | null>(null);
    const [ecritsStarTrek, setEcritsStarTrek] = useState({ base: valeurs, personnageId, maj: {} as Record<string, unknown> });
    const valeursStarTrek = useMemo(() => ({ ...valeurs,
        ...(ecritsStarTrek.base === valeurs && ecritsStarTrek.personnageId === personnageId ? ecritsStarTrek.maj : {}),
    }), [valeurs, ecritsStarTrek, personnageId]);
    const ecrireStarTrek = (maj: Record<string, unknown>) => {
        if (!Object.keys(maj).length) return;
        setEcritsStarTrek(e => ({ base: valeurs, personnageId, maj: { ...(e.base === valeurs && e.personnageId === personnageId ? e.maj : {}), ...maj } }));
        ecrireSurLaFiche?.(maj);
    };
    const determinationStarTrek = regleStarTrek?.determination ? Math.max(0, Number(valeursStarTrek[regleStarTrek.determination]) || 0) : 0;
    /** Le vaisseau de l'équipage, quand le module « Bataille spatiale » le tient : son aide se lit sans ressaisie. */
    const vueModulesMJ = useModulesDuJeuMJ(st => st.vue);
    const vueModulesJoueur = useModulesDuJeuJoueur(st => st.vue);
    const vaisseauStarTrek: VaisseauPourLAide | null = useMemo(() => {
        if (!regleStarTrek) return null;
        const module = (pourLesJoueurs ? vueModulesJoueur : vueModulesMJ)?.modules.find(m => m.id === 'star-trek-operations');
        const lu = (module?.vue as { vaisseaux?: { camp: string; nom: string; systemes?: Record<string, number>; fonctions?: Record<string, number> }[] } | undefined)
            ?.vaisseaux?.find(v => v.camp === 'joueurs' && v.systemes && v.fonctions);
        return lu ? { nom: lu.nom, systemes: lu.systemes!, fonctions: lu.fonctions! } : null;
    }, [regleStarTrek, pourLesJoueurs, vueModulesJoueur, vueModulesMJ]);

    const { etatDe, depenser, gagner, ajusterDepuisLaTablette } = useRessourcesDeTableStore();
    const monnaie = useMemo(
        () => campaignId && ressourcesDeTable?.length ? { campaignId, ressourcesDeTable } : null,
        [campaignId, ressourcesDeTable],
    );

    /**
     * **Ce que le groupe apporte au jet** — la Cabale de NOC (2026-10-13) : les
     * dés de ses Domaines, son Espoir, son Vécu, ses Atouts. Le groupe est celui
     * de la campagne où l'on joue, déclaré par son pilote.
     *
     * Absent des dés échelonnés : ils décident seuls de leur poignée, et une
     * réserve ajoutée n'y aurait pas de sens.
     */
    const campagnes = useSessionOSStore(s => s.campaigns);
    const pilotesPerso = useSessionOSStore(s => s.customGameDrivers);
    const updateCampaign = useSessionOSStore(s => s.updateCampaign);
    const remoteEcrireLeGroupe = useSessionOSStore(s => s.remoteEcrireLeGroupe);
    const campagne = campaignId ? campagnes.find(c => c.id === campaignId) : undefined;
    /** Les règles optionnelles de Symbaroum que la table a retenues (p. 183–184) : sur la campagne. */
    const optionsSymbaroum: OptionsDeSymbaroum = regleSymbaroum ? (campagne?.reglesOptionnelles ?? {}) : {};
    const ficheDeGroupe = campagne
        ? tousLesPilotes(pilotesPerso).find(d => d.id === campagne.system)?.ficheDeGroupe
        : undefined;
    const apports = descripteur.desEchelonnes ? [] : (ficheDeGroupe?.apports ?? []);
    const [engages, setEngages] = useState<Record<string, number>>({});
    /** Le bonus que le groupe a donné au dernier lancer — dit à côté des réussites. */
    const [bonusDuLancer, setBonusDuLancer] = useState(0);
    const [choixDesApports, setChoixDesApports] = useState<Record<string, string>>({});
    const etatDesReserves = monnaie ? etatDe(monnaie.campaignId, monnaie.ressourcesDeTable) : {};
    /*
      **Une réserve qui ne sert qu'à certains jets** (`si`, Nephilim, 2026-10-18) :
      la Stase au lancer d'un sort, l'Effet Mnémos à un test de Vécu. Écartée du
      panneau, elle n'est ni proposée ni débitée.
    */
    const retenusDuJet = Object.values(choix).filter(Boolean);
    const applicable = (a: ApportDuGroupe) => jetVientDe(a.si, retenusDuJet, template.sections);
    const disponibles = apportsDisponibles(
        apports.filter(applicable), choix, choixDesApports, engages, campagne?.groupe?.sheetData, etatDesReserves,
    );
    const { des: desDuGroupe, bonus: bonusDuGroupe, annule: annuleDuGroupe, degres: degresDuGroupe } = effetDesApports(disponibles);

    /*
      **Les réserves du personnage** — le Vécu, l'Espoir, la Singularité d'un Héros
      de NOC. Même forme que les apports du groupe ; les stocks se lisent sur SA
      fiche et s'y décomptent, par `ecrireSurLaFiche`.
    */
    const reservesPerso = ecrireSurLaFiche && !descripteur.desEchelonnes ? (descripteur.reservesDuPersonnage ?? []) : [];
    const [engagesPerso, setEngagesPerso] = useState<Record<string, number>>({});
    const disponiblesPerso = apportsDisponibles(reservesPerso.filter(applicable), choix, {}, engagesPerso, valeurs, {});
    const { des: desPerso, bonus: bonusPerso, annule: annulePerso, degres: degresPerso } = effetDesApports(disponiblesPerso);
    /** Les degrés puisés s'ajoutent à la cible avant le ×10 : seulement là où le jeu en calcule une. */
    const degresPuises = descripteur.cible ? degresDuGroupe + degresPerso : 0;

    /** Ce qui reste dans un stock précis — pour proposer les Atouts encore garnis. */
    const resteDe = (apportId: string, champ: string) => {
        const apport = apports.find(a => a.id === apportId);
        if (!apport) return 0;
        return Math.max(0, apport.epuisement === 'piste'
            ? niveauDuGroupe(campagne?.groupe?.sheetData, champ)
            : (etatDesReserves[idDeReserveDuGroupe(champ)] ?? 0));
    };

    /**
     * Débiter ou créditer la réserve, du bon côté du réseau.
     *
     * Sur la tablette, `depenser` n'écrirait que dans la fenêtre du joueur : sa
     * réserve baisserait chez lui et nulle part ailleurs, ce qui est pire que
     * de ne pas la lui donner — deux tables joueraient avec deux Impulsions.
     *
     * `motif` accompagne le mouvement jusqu'au journal de séance : *une
     * Impulsion qui passe de quatre à un ne veut rien dire sans le jet qui l'a
     * dépensée.*
     */
    const mouvoir = (id: string, delta: number, motif: string, enReportChoisi = 0) => {
        if (!monnaie) return { avertissements: [] as string[] };
        if (pourLesJoueurs) {
            return ajusterDepuisLaTablette(monnaie.campaignId, monnaie.ressourcesDeTable, id, delta, motif, enReportChoisi);
        }
        return delta < 0
            ? depenser(monnaie.campaignId, monnaie.ressourcesDeTable, id, -delta, motif, enReportChoisi)
            : gagner(monnaie.campaignId, monnaie.ressourcesDeTable, id, delta, motif);
    };

    /**
     * Les champs proposés pour une composante, **groupés par sous-groupe**.
     *
     * **La résolution est partagée avec `preparerLeJet`**, et c'est essentiel :
     * un menu rempli depuis une section que le calcul ignorerait — ou l'inverse
     * — rendrait un jet dont l'écran et le moteur ne parlent plus du même
     * endroit de la fiche.
     *
     * **On rend les sections, pas une liste à plat de champs.** Chez Rêves de
     * Dragons une composante peut couvrir plusieurs sous-groupes de compétences,
     * et fondre trente entrées en une seule liste rendrait le menu illisible là
     * où il sert : à table, de loin, en parlant. Les sections deviennent des
     * `optgroup`, ce qui garde le geste que le meneur connaît — le sous-groupe,
     * puis la compétence — **en un seul menu au lieu de deux.**
     */
    const sousGroupesDe = (composante: ComposanteDeJet) =>
        sectionsDeLaComposante(template.sections, composante).sections;

    /** Le lieu magique, la conjonction et le Seuil RK, lus au bandeau pour le jet de Nephilim. */
    const tableN = regleNephilim?.table;
    const lieuN = tableN?.lieu ? etatDesReserves[tableN.lieu] : undefined;
    const conjonctionN = tableN?.conjonction ? etatDesReserves[tableN.conjonction] : undefined;
    const intensiteN = tableN?.intensite ? etatDesReserves[tableN.intensite] : undefined;
    const seuilRKN = tableN?.seuilRK ? etatDesReserves[tableN.seuilRK] : undefined;
    const jet = useMemo(
        () => {
            const prepare = preparerLeJet(
            descripteur, regleDune ? valeursDune : descripteur.cthulhuHack ? valeursCH : suitesAlien ? valeursAlien : regleNephilim ? valeursNephilim : valeurs,
            {
                ...(regleNephilim ? { nephilim: { ...choixNephilim, lieu: lieuN, conjonction: conjonctionN, intensite: intensiteN, seuilRK: seuilRKN } } : {}),
                champs: choix, desSupplementaires: desAchetes, difficulte,
                ajustementDeDifficulte: ajustementDeDifficulte + degresPuises, specialisation,
                modificateurDuSeuil,
                valeurAdverse: valeurAdverse.trim() === '' ? undefined : Number(valeurAdverse),
                avantageTactique,
                ...(specialisationDeLaGarde ? { specialisationDeLaGarde } : {}),
                ...(depassementAnnonce ? { depassementAnnonce } : {}),
                ...(modificateurDeLaGarde ? { modificateurDeLaGarde } : {}),
                ...(seuilDeBaseImpose ? { seuilDeBaseImpose } : {}),
                ...(actionHermetique ? { actionHermetique } : {}),
                /*
                  Sur un jeu à dés échelonnés, avantage et désavantage ajoutent
                  ou retirent un DÉ : c'est `preparerLeJet` qui les applique à la
                  poignée. Ailleurs, ils font garder un dé sur deux, et c'est
                  `rollAdvantage` — deux mécaniques, un seul sélecteur à l'écran.
                */
                // Le souvenir clé est un avantage : il annule un désavantage, et deux avantages n'en font qu'un (p. 56).
                modificateurDeDes: !descripteur.desEchelonnes ? 'aucun'
                    : !souvenirRetenu ? modificateur : modificateur === 'desavantage' ? 'aucun' : 'avantage',
                ...(soutienDuJet ? { soutien: soutienDuJet } : {}),
            },
            template.sections,
            );
            if (regleDune) return { ...prepare, ...(choixDune.ennemi ? { cout: { ...prepare.cout, ressource: 'menace' } } : {}),
                reussitesRequises: (choixDune.opposition ? difficulteDune(choixDune.opposition) : prepare.reussitesRequises) + difficulteDeRepriseDune };
            if (!suitesAlien) return prepare;
            const stress = estUnAndroide(suitesAlien, valeursAlien) ? 0 : prepare.desSecondaires;
            const effet = lireLaPaniqueAlien(valeursAlien).effet;
            const enPanique = !estUnAndroide(suitesAlien, valeursAlien) && (!descripteur.panique?.champ || Number(valeursAlien[descripteur.panique.champ]) >= 7);
            const tremblement = effet?.malusAgilite && enPanique && Object.values(choix).includes(suitesAlien.agilite) ? effet.malusAgilite : 0;
            if (regleJetAlien) {
                const blessure = combatAlien && !estUnAndroide(suitesAlien, valeursAlien) ? malusDesBlessures(lireLeCombatAlien(valeursAlien),regleJetAlien.competences[choix[regleJetAlien.competence]]) : 0;
                const tir = combatAlien && regleJetAlien.competences[choix[regleJetAlien.competence]] === 'distance' ? preparerLeTir(reglagesAlien,equipementAlien) : undefined;
                const apres = composerLesDesAlien(prepare.nombreDeDes, stress + (estUnAndroide(suitesAlien,valeursAlien) ? 0 : tir?.stress ?? 0), reglagesAlien, equipementAlien?.bonus, tremblement + blessure + (tir?.bonus ?? 0));
                const arme = lireLeCombatAlien(valeursAlien).armes[equipementAlien?.id ?? ''];
                const erreurMunition = tir && equipementAlien?.proprietes?.munitions && (!arme || arme.vide) ? 'Arme vide ou chargeur non confirmé : préparer les munitions avant de tirer.' : undefined;
                return { ...prepare, nombreDeDes: apres.base, desSecondaires: apres.stress,
                    avertissements: [...prepare.avertissements, ...[equipementAlien?.erreur,tir?.erreur,erreurMunition].filter((x): x is string => !!x)],
                    remarques: [...prepare.remarques, `Base ${prepare.nombreDeDes} + arme ${equipementAlien?.bonus ?? 0} + outil/talent ${reglagesAlien.outil} + situation ${reglagesAlien.situation} + aide ${apres.aide}${tremblement ? ` −2 Tremblement` : ''}${tir ? ` ; tir ${tir.bonus >= 0 ? '+' : ''}${tir.bonus}, Stress préalable +${estUnAndroide(suitesAlien,valeursAlien) ? 0 : tir.stress}` : ''}${blessure ? ` ; blessures ${blessure}` : ''} → ${apres.base} dés de base, ${apres.stress} de Stress.`, ...(apres.base + apres.stress === 0 ? ['Aucun dé ne reste : ce test est impossible. Changez de stratégie.'] : [])] };
            }
            if (effet?.malusAgilite && enPanique && Object.values(choix).includes(suitesAlien.agilite)) {
                const apres = desApresTremblement(prepare.nombreDeDes, prepare.desSecondaires, effet.malusAgilite);
                return { ...prepare, nombreDeDes: apres.base, desSecondaires: apres.stress,
                    remarques: [...prepare.remarques, 'Tremblement : −2 dés (base, puis Stress).'] };
            }
            return { ...prepare, desSecondaires: stress };
        },
        [descripteur, valeurs, valeursCH, suitesAlien, valeursAlien, choix, desAchetes, difficulte, ajustementDeDifficulte, modificateurDuSeuil, valeurAdverse, avantageTactique, specialisationDeLaGarde, depassementAnnonce, modificateurDeLaGarde, seuilDeBaseImpose, actionHermetique, degresPuises, modificateur, specialisation, template.sections, regleJetAlien, reglagesAlien, equipementAlien, combatAlien, regleNephilim, valeursNephilim, choixNephilim, lieuN, conjonctionN, intensiteN, seuilRKN, soutienDuJet, souvenirRetenu, regleDune, choixDune.opposition, choixDune.ennemi, difficulteDeRepriseDune, valeursDune],
    );

    /*
      **Provoquer le destin** (NOC). Le plafond des dés est le Domaine, moins les
      malus de péril ; le joueur en lance autant qu'il veut, de zéro au plafond.
      `null` : il n'a pas touché au compte, on propose le plafond.
    */
    const destin = descripteur.destin;
    const malus = destin?.peril ? malusDePeril(destin.peril, valeurs, choix) : { domaines: 0, talents: 0, etats: [] as string[] };
    const plafondDuDestin = destin ? Math.max(0, jet.nombreDeDes - malus.domaines) : 0;
    const [desDeDestin, setDesDeDestin] = useState<number | null>(null);
    const desLances = Math.min(desDeDestin ?? plafondDuDestin, plafondDuDestin);
    /*
      **Torg : le test se complète APRÈS le premier dé** — la Possibilité se
      dépense quand on a vu le dé, la compétence favorisée relance le premier,
      « Un de plus ! » vient de la carte d'action. On garde donc les dés du
      dernier test pour les compléter (carnet « Torg », 2026-10-13).
    */
    const torg = descripteur.tableDeBonus === 'torg';
    /** Une compétence facultative laissée vide : sans entraînement, le 20 n'explose pas. */
    const entraine = !(descripteur.seuil ?? []).some(c => c.facultative && !choix[c.id]);
    const blessuresTorg = torg && descripteur.torg?.blessures
        ? Math.min(3, Math.max(0, niveauDuGroupe(valeurs, descripteur.torg.blessures))) : 0;
    const possibilitesTorg = torg && descripteur.torg?.possibilites
        ? Math.max(0, niveauDuGroupe(valeurs, descripteur.torg.possibilites)) : 0;
    /*
      **La carte d'Action du round** (2026-10-13) : le panneau de jet est celui
      des fiches de personnage, donc des Héros. « Déstabilisés » retire 2 au
      total d'action ; « Un de plus ! » se signale sur son bouton.
    */
    const effetsDuRound = useEffetsDuRound('joueurs');
    const destabilises = torg && effetsDuRound.includes('destabilises');
    const unDePlusDeLaCarte = torg && effetsDuRound.includes('un-de-plus');
    /** Les Cibles multiples (livre p. 122) : −2 par cible supplémentaire. */
    const [cibles, setCibles] = useState(1);
    const malusDesCibles = torg ? malusDesCiblesMultiples(cibles) : 0;
    const malusTorg = blessuresTorg + (destabilises ? 2 : 0) + malusDesCibles;
    const raisonsDuMalusTorg = [
        blessuresTorg ? `${blessuresTorg} Blessure${blessuresTorg > 1 ? 's' : ''}` : '',
        destabilises ? 'Déstabilisés (carte d’Action)' : '',
        malusDesCibles ? `${cibles} cibles` : '',
    ].filter(Boolean).join(', ');
    const nombreDeRaisons = [blessuresTorg, destabilises, malusDesCibles].filter(Boolean).length;
    const [plageCritique, setPlageCritique] = useState(1);
    const [testDeTorg, setTestDeTorg] = useState<{
        des: DesDeTorg; options: OptionsDeTorg; niveau: number; difficulte: number; entraine: boolean; titre: string;
    } | null>(null);

    /*
      **Forcer le jet** (Year Zero, 2026-10-14 — `systemes/yearZero.ts`). Le
      forçage se décide APRÈS avoir vu les dés : on garde le dernier lancer, ce
      que le joueur avait retenu sur sa fiche, et ce que les forçages y ont déjà
      écrit — sur la tablette, la fiche ne revient du meneur qu'après coup, et un
      second forçage de réplicant ne doit pas relire l'ancienne Santé.
    */
    const regleDuForcage = descripteur.forcer && (descripteur.reserve || descripteur.desEchelonnes) && !torg && !destin
        ? descripteur.forcer : undefined;
    const familleYearZero: FamilleYearZero = descripteur.desEchelonnes ? 'echelonnee' : 'reserve';
    const libelleDuUn = descripteur.reserve?.secondaire?.libelleDuUn;
    const [dernierLancer, setDernierLancer] = useState<{
        titre: string;
        choix: Record<string, string>;
        /** Le champ de la seconde réserve — le Niveau de Stress d'Alien. */
        seconde?: { champ: string; label: string };
    } | null>(null);
    /** Les dés qu'on relancera malgré leur réussite (un D10, un D12 à une seule) — Blade Runner. */
    const [aRelancerAussi, setARelancerAussi] = useState<number[]>([]);
    const [forcage, setForcage] = useState<{ fois: number; unsPayes: number; ecrits: Record<string, number> }>(
        { fois: 0, unsPayes: 0, ecrits: {} },
    );
    const [paniqueJouee, setPaniqueJouee] = useState<{
        de: number; niveau: number; total: number; entree?: TableEntry; modificateur?: number;
        /** Le total qui s'applique, après le cumul avec une panique en cours. */
        effectif: number; precedent: number; cumule: boolean;
    } | null>(null);
    const lireLeNombre = (champ: string) => suitesAlien
        ? Number(valeursAlien[champ]) || 0
        : forcage.ecrits[champ] ?? (Number(valeurs[champ]) || 0);
    /**
     * Les jetons de Fortune déjà placés par ce panneau, datés de la valeur de la
     * fiche qu'ils complètent : dès que la fiche les a relus (sa valeur change),
     * c'est elle qui fait foi.
     */
    const [placement, setPlacement] = useState<{ depuis: unknown; jetons: number } | null>(null);
    const valeurDeLaFortune = descripteur.fortune ? valeurs[descripteur.fortune.champ] : undefined;
    const jetonsPlaces = placement && placement.depuis === valeurDeLaFortune ? placement.jetons : null;
    const setJetonsPlaces = (jetons: number) => setPlacement({ depuis: valeurDeLaFortune, jetons });
    const [reussiParLaFortune, setReussiParLaFortune] = useState(false);

    /*
      **Les Lois du Monde du cosm courant** (Torg, 2026-10-14) : la Loi de l'Action
      (une seconde Possibilité, la meilleure compte), la Persévérance (Annulation
      réduite), la Magie (Choc volontaire en bonus aux compétences magiques).
    */
    const cosms = useCosmsCourants();
    const loiAction = torg ? loiEnVigueur(cosms, 'action') : undefined;
    const loiPerseverance = torg ? loiEnVigueur(cosms, 'perseverance') : undefined;
    const loiMagie = torg ? loiEnVigueur(cosms, 'magie') : undefined;
    /** La compétence magique retenue pour ce jet, s'il y en a une. */
    const champMagique = loiMagie ? Object.values(choix).find(c => loiMagie.competences?.includes(c)) : undefined;
    /** « Jusqu'à un maximum égal à son nombre de rangs dans la compétence utilisée. » */
    const rangsMagiques = champMagique ? Math.max(0, Number(valeurs[champMagique]) || 0) : 0;
    const [chocVolontaire, setChocVolontaire] = useState(0);
    const chocDeMagie = champMagique && descripteur.torg?.choc && ecrireSurLaFiche ? Math.min(chocVolontaire, rangsMagiques) : 0;
    /** Les Possibilités restantes, y compris celles que ce jet vient de dépenser. */
    const possibilitesRestantes = descripteur.torg?.possibilites
        ? (forcage.ecrits[descripteur.torg.possibilites] ?? possibilitesTorg) : 0;

    /** Le niveau du Talent, malus retirés, Vécu et Atouts ajoutés — avant les dés. */
    const niveauDuDestin = jet.seuil - malus.talents + bonusPerso + bonusDuGroupe;

    /*
      **Le seuil composé ne remplace un seuil fixe que s'il existe.**

      Le panneau écrasait `dice.successThreshold` par `jet.seuil` dans tous les
      cas. Or un jeu à réserve n'en compose aucun : `jet.seuil` vaut alors
      **zéro**, et `rollFromConfig` traite ce zéro comme une absence —
      `(… ?? config.successThreshold) || 10`. Un pilote déclarant « chaque six
      est une réussite » aurait donc lancé contre **dix**.

      Alien y échappait par chance : son moteur `yze` court-circuite ce chemin et
      compte les six en dur. Le défaut n'attendait que le premier jeu à réserve
      déclarant un autre moteur.
    */
    const seuilDuMoteur = jet.composantes.length > 0 ? jet.seuil : dice.successThreshold;

    /**
     * L'Avantage ne s'offre que là où il veut dire quelque chose.
     *
     * *Lancer un dé de plus et garder celui qu'on préfère* suppose qu'un seul
     * dé tranche, et qu'il y ait une valeur à comparer. Sur une réserve il n'y a
     * pas de « meilleur dé », il y a un compte de réussites — proposer le
     * sélecteur là inviterait à inventer une règle que le jeu n'a pas, ce que
     * l'outil ne fait jamais.
     *
     * La liste des moteurs qui résolvent eux-mêmes vit dans `DiceEngine`, et
     * nulle part ailleurs : recopiée ici, elle dériverait.
     */
    const avantagePossible = descripteur.tableDeBonus
        // Torg n'a pas d'avantage : son dé se relance quand il explose, il ne se double pas.
        ? false
        : descripteur.desEchelonnes
        // Sur les dés échelonnés, le livre les décrit explicitement : un
        // troisième dé copié du plus petit, ou le plus petit retiré.
        ? jet.desEchelonnes.length > 0
        : DiceEngine.unSeulDeDecide(dice.engine, jet.nombreDeDes) && !!seuilDuMoteur;

    /**
     * **Tout ce que le joueur doit retenir sur sa fiche, en une seule liste.**
     *
     * Elle vivait en deux exemplaires — l'une pour savoir si le jet est prêt,
     * l'autre pour dessiner les menus — et elles ne portaient pas le même ordre.
     * *Deux listes de la même chose finissent par diverger* : ajouter la cible
     * à l'une seulement aurait donné un menu qu'on ne peut pas remplir, ou un
     * bouton qui part sans caractéristique.
     */
    const composantesARetenir = useMemo(() => [
        /*
          **Ce que les dés échelonnés décident, ils le décident seuls.**

          La Forge enrichit sans jamais remplacer : un pilote qui portait déjà un
          `seuil` le garde après une nouvelle dérivation. Continuer à réclamer
          ses composantes demanderait au joueur de choisir deux fois la même
          chose — et le bouton resterait gris sur un pilote pourtant corrigé.
          `preparerLeJet` applique la même préséance.
        */
        ...(descripteur.desEchelonnes
            ? descripteur.desEchelonnes.composantes
            : [
                ...(descripteur.cible ? [descripteur.cible.caracteristique] : []),
                ...(descripteur.cible?.ajustement ?? []),
                ...(descripteur.seuil ?? []),
            ]),
        ...(descripteur.reserve?.composantes ?? []),
        ...(descripteur.reserve?.secondaire?.composantes ?? []),
        // Crimes : la compétence ne s'additionne pas, elle dit combien de dés se gardent.
        ...(descripteur.garde ? [descripteur.garde.competence] : []),
    ], [descripteur]);

    /** Rien ne part tant que chaque composante n'a pas son champ. */
    // Un jeu qui ne compose rien depuis la fiche est prêt d'emblée. Les
    // composantes de la réserve comptent autant que celles du seuil : lancer
    // sans attribut ni compétence donnerait une poignée de dés arbitraire.
    const pret = composantesARetenir.every(c => c.facultative || choix[c.id]) && jet.avertissements.length === 0
        && !(suitesAlien && resultat?.rolls.some(d => d.source === 'gear' && d.val === 1) && !paniqueJouee)
        && !(suitesAlien && jet.nombreDeDes + jet.desSecondaires === 0);
    const briseAlien = !!combatAlien && !!suitesAlien && (synthetiqueAlien ? systemeArrete(etatCombatAlien)
        : etatCombatAlien.mort || Number(valeursAlien[combatAlien.sante]) <= 0);

    /**
     * D'où sortiront les points, **avant** de lancer.
     *
     * Chez Dune, les dés qu'on ne peut pas payer en Impulsion se paient en
     * Menace : la dépense alimente la réserve du meneur. Ce n'est jamais une
     * surprise acceptable — donc on l'annonce, et le joueur décide ensuite.
     */
    const reserveDuCout = monnaie?.ressourcesDeTable.find(r => r.id === jet.cout.ressource);
    const reportAuChoix = reserveDuCout?.paiementAuChoix ? reserveDuCout.reportSurEpuisement : undefined;
    const choisiEnReport = reportAuChoix ? Math.min(enReport, jet.cout.total) : 0;
    const ventilation = useMemo(() => {
        if (!monnaie || !jet.cout.ressource || jet.cout.total === 0) return null;
        const etat = etatDe(monnaie.campaignId, monnaie.ressourcesDeTable);
        return ventilerLaDepense(monnaie.ressourcesDeTable, etat, jet.cout.ressource, jet.cout.total, choisiEnReport);
    }, [monnaie, jet.cout.ressource, jet.cout.total, etatDe, choisiEnReport]);

    const nomDe = (id?: string) =>
        ressourcesDeTable?.find(r => r.id === id)?.label ?? id ?? '';

    const lancer = () => {
        if (!pret || briseAlien) return;
        if (suiteDuDestin?.personnageId === personnageId && suiteDuDestin) return;
        if (regleDune && (suiviDune.bafoues.includes(principeDune) || (duneDuLancer && !duneDuLancer.bilan.clos))) return;
        if (regleDune && choixDune.contradiction === 'bafouer' && suiviDune.recuperes.includes(principeDune)) return;
        if (regleDune && choixDune.unAutomatique && (!maximeDune || !choixDune.maximeAlignee || determinationDune < 1 || !ecrireSurLaFiche)) return;
        const dits: string[] = [];
        generationDuDestin.current++;
        setSuiteDuDestin(null);
        // Un nouveau jet : rien n'est encore forcé, aucune Panique n'est jouée.
        setForcage({ fois: 0, unsPayes: 0, ecrits: {} });
        setStressDuSouvenir(false);
        if (souvenirRetenu) { marquerLeSouvenir(); setSouvenirDuJet('avant'); dits.push('Souvenir clé : avantage (une fois par séance).'); }
        else setSouvenirDuJet(null);
        setSouvenirAuJet(false);
        setPaniqueJouee(null);
        setFolieMeurtriere(false);
        paniqueDejaJouee.current = false;
        evenementPanique.current = `alien-jet-${crypto.randomUUID()}`;
        if (regleJetAlien) {
            const champ = choix[regleJetAlien.competence];
            dernierJetAlien.current = { version: 1, id: evenementPanique.current,
                competence: regleJetAlien.competences[champ], nomCompetence: template.sections.flatMap(s => s.fields).find(f => f.id === champ)?.label ?? champ,
                composition: jet.remarques.join(' '), equipement: equipementAlien ? { ...equipementAlien } : undefined,
                role: reglagesAlien.role, reussites: 0, paniqueEnAttente: false, annule: false, eclats: [] };
            if (tirAlien) {
                dernierJetAlien.current.automatique = !!reglagesAlien.automatique;
                if (tirPrepareAlien?.stress && suitesAlien && !estUnAndroide(suitesAlien,valeursAlien)) ecrireAlien({ [suitesAlien.stress]: (Number(valeursAlien[suitesAlien.stress]) || 0) + 1 });
                setReglagesAlien(r => ({ ...r, viser: false }));
            }
        }
        setEffetsDuBrise({});
        setSuitesNotees({});
        setDernierLancer(null);
        setReussiParLaFortune(false);
        setARelancerAussi([]);
        setImpulsionDuJet(null);

        // Le coût se prélève au moment où l'on s'engage, pas pendant qu'on
        // tourne les boutons : régler avant de lancer ferait payer les
        // hésitations.
        /**
         * Ce que le jet a coûté, dit au journal avec ce qui l'a composé.
         *
         * « Jet : Combat + Devoir (seuil 11), 2 dés achetés » — relire une
         * séance et y trouver une Impulsion tombée de quatre à un sans savoir
         * pourquoi ne renseigne sur rien.
         */
        const dit = modificateur === 'aucun' ? '' : ` avec ${libellesDuTirage[modificateur]}`;
        /*
          Une poignée échelonnée se dit dé par dé — « D10 + D6 » —, jamais
          « 2d10 » : les deux dés n'ont pas la même taille, et c'est justement
          ce que le joueur doit retrouver en relisant sa séance.
        */
        const poigneeDite = jet.desEchelonnes.map(d => `D${d.faces}`).join(' + ');
        const enTete = (jet.composantes.length > 0
            ? `Jet : ${jet.composantes.map(c => c.label).join(' + ')} (seuil ${jet.seuil})`
            : jet.desEchelonnes.length > 0
                ? `Jet : ${poigneeDite}`
                : `Jet : ${jet.nombreDeDes}d${jet.faces}`) + dit;

        /*
          **Ce qu'on a puisé dans le groupe part avec le lancer.** Une piste
          (l'Espoir de la Cabale) descend sur sa feuille — par le meneur, ou par
          la tablette qui le prévient ; une réserve de scénario (les dés d'un
          Domaine) se débite comme toute réserve de table.
        */
        const engagesDuGroupe = disponibles.filter(d => d.points > 0 && d.stock);
        const engagesPerso = disponiblesPerso.filter(d => d.points > 0 && d.stock);

        /**
         * Dépense ce que des apports ont donné. `combien` dit ce qui part
         * vraiment : tout ce qu'on a engagé pour des dés ou un bonus, mais
         * seulement les 1 effectivement annulés pour la Singularité.
         */
        const ecritsPersonnels: Record<string, number> = {};
        const depenser = (liste: ApportDisponible[], porteur: 'groupe' | 'personnage', combien: (d: ApportDisponible) => number) => {
            const surLaFeuille: Record<string, number> = {};
            for (const d of liste) {
                const n = combien(d);
                if (n <= 0 || !d.stock) continue;
                const nom = d.apport.stocks.length > 1 ? `${d.apport.label} (${d.stock.label})` : d.apport.label;
                dits.push(`${nom} −${n} → ${d.reste - n}`);
                if (d.apport.epuisement === 'piste') surLaFeuille[d.stock.champ] = d.reste - n;
                else dits.push(...mouvoir(idDeReserveDuGroupe(d.stock.champ), -n, `${enTete}, ${nom}`).avertissements);
            }
            if (Object.keys(surLaFeuille).length === 0) return;
            if (porteur === 'personnage') {
                Object.assign(ecritsPersonnels, surLaFeuille);
                ecrireSurLaFiche?.({ ...ecritsPersonnels });
            } else if (campagne) {
                if (pourLesJoueurs && personnageId) remoteEcrireLeGroupe(campagne.id, personnageId, surLaFeuille);
                else if (!pourLesJoueurs) updateCampaign(campagne.id, { groupe: appliquerAuGroupe(useSessionOSStore.getState().campaigns.find(c => c.id === campagne.id)?.groupe, { aEcrire: surLaFeuille }) });
            }
        };
        // Avant le lancer : les dés et les bonus. Les annulations attendent de voir les 1.
        const avant = (d: ApportDisponible) => (d.apport.effet === 'annuleLesUns' ? 0 : d.points);
        depenser(engagesDuGroupe, 'groupe', avant);
        depenser(engagesPerso, 'personnage', avant);
        setEngages({});
        setEngagesPerso({});

        if (monnaie && jet.cout.ressource && jet.cout.total > 0) {
            dits.push(...mouvoir(
                jet.cout.ressource, -jet.cout.total,
                `${enTete}, ${jet.desAchetes} dé${jet.desAchetes > 1 ? 's' : ''} acheté${jet.desAchetes > 1 ? 's' : ''}`,
                choisiEnReport,
            ).avertissements);
        }

        /*
          **Nephilim : ce que le jet coûte se paie en s'engageant** — les PS de
          l'Effet Mnémos (d'abord ceux d'une Chute mise en jeu) et du Sacrifice,
          le jeton de Traque d'Impressionner (p. 113, 119, 152, 183).
        */
        if (regleNephilim && jet.nephilim) {
            const { sapience, traque, deChute } = jet.nephilim.couts;
            const maj: Record<string, unknown> = {};
            if (deChute > 0 && regleNephilim.chutes?.sapienceDeChute) {
                const avant = Number(valeursNephilim[regleNephilim.chutes.sapienceDeChute]) || 0;
                maj[regleNephilim.chutes.sapienceDeChute] = Math.max(0, avant - deChute);
                dits.push(`PS de Chute −${deChute} → ${Math.max(0, avant - deChute)}`);
            }
            if (sapience > 0 && regleNephilim.sapience) {
                const avant = Number(valeursNephilim[regleNephilim.sapience]) || 0;
                maj[regleNephilim.sapience] = Math.max(0, avant - sapience);
                dits.push(`Points de Sapience −${sapience} → ${Math.max(0, avant - sapience)}`);
            }
            if (Object.keys(maj).length) ecrireNephilim(maj);
            if (traque > 0 && regleNephilim.table?.traque) {
                dits.push(...mouvoir(regleNephilim.table.traque, traque, `${enTete}, Impressionner`).avertissements, `Jauge de Traque +${traque} (Impressionner)`);
            }
            setNephilimDuLancer({ jet: jet.nephilim, degres: Math.round(jet.seuil / 10) });
            setChoixNephilim(c => ({ actionPhysique: c.actionPhysique }));
        }

        /*
          **La seconde poule part avec la première, et compte à part.**

          `rollYZE` distingue les deux depuis toujours — les 1 de la seconde
          deviennent des « fléaux » — mais **personne ne lui passait le
          nombre** : `gearCount` restait à zéro. Un personnage d'Alien lançait
          donc sa réserve sans ses dés de stress, et la Panique ne pouvait pas
          se déclencher. Le moteur savait faire ; le chemin s'arrêtait avant lui.
        */
        /*
          **Avantage et désavantage court-circuitent le pilote, et c'est voulu.**

          Le jet ne se compte plus, il se tranche : deux dés, on en garde un.
          `rollAdvantage` sait déjà lire le sens — en « sous-ou-egal », le
          meilleur dé est le PLUS BAS —, et il conserve le dé écarté dans son
          résultat, marqué `isDropped`. *On montre les deux dés :* garder pour
          le joueur la trace de ce qu'il a évité est la moitié de l'intérêt, et
          c'est aussi ce qui permet au meneur de trancher autrement quand la
          fiche dit « généralement le plus bas ».

          Le verdict se relit ensuite dans la monnaie commune du panneau — une
          réussite ou zéro —, sans quoi l'écran afficherait « Échec » sur un dé
          qui passe : `verdict` compte des réussites, et `rollAdvantage` n'en
          rend pas.
        */
        /*
          **Les dés échelonnés passent par `rollFromConfig`, comme tout le reste.**

          *Question de David, le 2026-08-29 : « ne faudrait-il pas construire un
          nouveau moteur dans Dice-OS ? »* Ce panneau appelait `rollYZEEchelonne`
          en direct, et ça marchait — pour lui seul. Le pupitre et la tablette
          passent par `rollFromConfig` : un raccourci ici aurait laissé les deux
          autres lancer des d6 pour Blade Runner, sans que rien ne le dise.
          *C'est le motif que ce fichier a déjà payé quatre fois : le chemin
          s'arrête avant le moteur, et le résultat reste plausible.*

          La poignée voyage par `taillesDeBase` : elle n'a pas de taille commune,
          et `jet.faces` seul ferait lancer deux D10 là où le personnage a un D10
          et un D6. L'avantage et le désavantage sont déjà appliqués par
          `preparerLeJet` — ils ajoutent ou retirent un dé, ils n'en gardent pas
          un sur deux comme `rollAdvantage`.
        */
        /*
          **Provoquer le destin** (NOC) : les dés du Héros, ceux de l'Espoir et
          ceux de la Cabale partent ensemble ; chaque 8 et plus élève le niveau,
          un 10 fait lancer un dé de plus (le moteur `pool_explode`), un 1 verse
          une goutte de Fiel — sauf ceux qu'une Singularité annule.
        */
        if (destin) {
            const nombre = desLances + desPerso + desDuGroupe;
            const payes = new Map<ApportDisponible, number>();
            let fielVerse = 0;
            const reglerDestin = (rolls: RollResult['rolls']) => {
                const verdict = resoudreLeDestin(niveauDuDestin, difficulte, rolls.map(r => Number(r.val)), annulePerso + annuleDuGroupe);
                let aPayer = verdict.annules;
                for (const [liste, porteur] of [[engagesPerso, 'personnage'], [engagesDuGroupe, 'groupe']] as const) for (const d of liste) {
                    if (d.apport.effet !== 'annuleLesUns') continue;
                    const annules = Math.min(aPayer, d.points * d.apport.parPoint); aPayer -= annules;
                    const cumul = Math.ceil(annules / Math.max(1, d.apport.parPoint)), avant = payes.get(d) ?? 0;
                    if (cumul > avant) depenser([{ ...d, reste: d.reste - avant }], porteur, () => cumul - avant);
                    payes.set(d, cumul);
                }
                if (destin.fiel && verdict.fiel > fielVerse) {
                    dits.push(...mouvoir(destin.fiel, verdict.fiel - fielVerse, `${enTete}, gouttes de Fiel`).avertissements);
                    fielVerse = verdict.fiel;
                }
                return verdict;
            };
            const finaliserDestin = (rolls: RollResult['rolls']) => {
            setSuiteDuDestin(null);
            const tires = { rolls };
            const verdictDuDestin = reglerDestin(rolls);

            const resultatDuDestin: RollResult = {
                total: verdictDuDestin.niveauFinal,
                rolls: tires?.rolls ?? [],
                modifier: 0,
                successes: verdictDuDestin.marge >= 0 ? 1 : 0,
                // Les 1 sont du Fiel, dit dans la ligne : pas des « fléaux » à compter.
                fails: 0,
                tagSuccess: verdictDuDestin.marge >= 0,
                degre: verdictDuDestin.degre,
                totalDisplay: verdictDuDestin.texte,
            };
            setSeuilDuLancer(jet.seuil);
            setBonusDuLancer(0);
            setResultat(resultatDuDestin);
            setDesDeDestin(null);
            const titre = `${jet.composantes.map(c => c.label).join(' + ') || 'Destin'}`;
            if (pourLesJoueurs && personnageId) {
                window.dispatchEvent(new CustomEvent('fiche:resultat', {
                    detail: {
                        characterId: personnageId, titre, total: resultatDuDestin.total, modifier: 0,
                        totalDisplay: verdictDuDestin.texte, rolls: resultatDuDestin.rolls,
                        successes: resultatDuDestin.successes, tagSuccess: resultatDuDestin.tagSuccess, degre: resultatDuDestin.degre,
                    },
                }));
            } else {
                consignerLeJet({ titre, totalDisplay: verdictDuDestin.texte, degre: verdictDuDestin.degre, tagSuccess: resultatDuDestin.tagSuccess });
            }
            setMouvements(dits);
            };
            if (destin.desSurDixAuChoix) {
                const generation = generationDuDestin.current;
                let revision = 0;
                const proposer = (rolls: RollResult['rolls'], disponibles: number) => {
                    const verdict = reglerDestin(rolls);
                    if (disponibles === 0) { finaliserDestin(rolls); return; }
                    const jeton = ++revision;
                    const valable = () => generationDuDestin.current === generation && jeton === revision;
                    setSuiteDuDestin({ personnageId, disponibles,
                        texte: verdict.texte,
                        ajouter: () => {
                            if (!valable()) return; revision++;
                            const val = DiceEngine.roll(10);
                            proposer([...rolls, { val, sides: 10, isExploded: true }], disponibles - 1 + (val === 10 ? 1 : 0));
                        },
                        terminer: () => { if (!valable()) return; revision++; finaliserDestin(rolls); },
                    });
                };
                const rolls = Array.from({ length: nombre }, () => ({ val: DiceEngine.roll(10), sides: 10 }));
                setResultat(null);
                proposer(rolls, rolls.filter(d => d.val === 10).length);
            } else finaliserDestin(nombre > 0 ? DiceEngine.rollFromConfig({ ...dice, successThreshold: 8 }, { baseCount: nombre }).rolls : []);
            return;
        }

        // Torg : le niveau est le seuil additionné, la difficulté le Niveau de Difficulté.
        const optionsTorg: OptionsDeTorg = {
            plageCritique,
            malus: malusTorg,
            // « −3 Blessures », « −2 Déstabilisés », « −4 (2 Blessures, Déstabilisés) ».
            raisonDuMalus: nombreDeRaisons > 1 ? `(${raisonsDuMalusTorg.replace(' (carte d’Action)', '')})`
                : blessuresTorg ? `Blessure${blessuresTorg > 1 ? 's' : ''}`
                : destabilises ? 'Déstabilisés'
                : malusDesCibles ? `Cibles multiples (${cibles})` : undefined,
            bonus: chocDeMagie,
            raisonDuBonus: chocDeMagie ? 'Choc volontaire (Loi de la Magie)' : undefined,
        };
        if (torg && chocDeMagie > 0 && descripteur.torg?.choc) {
            const choc = (Number(valeurs[descripteur.torg.choc]) || 0) + chocDeMagie;
            ecrireSurLaFiche?.({ [descripteur.torg.choc]: choc });
            dits.push(`Choc +${chocDeMagie} → ${choc} (Loi de la Magie) — ne se récupère pas avant la fin du sort`);
            setChocVolontaire(0);
        }
        const desTorg: DesDeTorg | null = torg ? { premier: lancerUneChaine(() => DiceEngine.roll(20), entraine) } : null;
        setTestDeTorg(desTorg ? {
            des: desTorg, options: optionsTorg, niveau: jet.seuil, difficulte, entraine,
            titre: jet.composantes.map(c => c.label).join(' + '),
        } : null);
        /*
          **Potentiel GARDE Compétence** (Crimes, C1) : autant de d10 que le
          Potentiel, puis `resoudreLaGarde` garde les 1 et les meilleurs dés.
          Le joueur peut ensuite changer sa garde, au résultat.
        */
        const effetCH = descripteur.cthulhuHack ? modificateursCH(descripteur.cthulhuHack, valeursCH, jet.composantes[0]?.champ) : undefined;
        const modificateurCH = effetCH?.desavantage ? (modificateur === 'avantage' ? 'aucun' : 'desavantage') : modificateur;
        const brutDuMoteur = descripteur.cthulhuHack
            ? DiceEngine.rollSauvegarde(jet.seuil, modificateurCH)
            : jet.garde
            ? resoudreLaGarde(Array.from({ length: jet.nombreDeDes }, () => DiceEngine.roll(10)), jet.garde.quota, jet.garde.seuil)
            : desTorg
            ? DiceEngine.resultatDeTorg(jet.seuil, difficulte, desTorg, optionsTorg)
            : jet.desEchelonnes.length > 0
            ? DiceEngine.rollFromConfig(
                { ...dice, engine: 'yze-echelonne' },
                { taillesDeBase: jet.desEchelonnes.map(d => d.faces) },
            )
            : modificateur !== 'aucun' && avantagePossible
            ? (() => {
                const brut = DiceEngine.rollAdvantage(
                    jet.faces,
                    0,
                    modificateur === 'avantage',
                    seuilDuMoteur!,
                    jet.sens === 'sous-ou-egal' ? 'under' : 'over',
                    jet.echelle,
                );
                return { ...brut, successes: brut.tagSuccess ? 1 : 0, fails: 0 };
            })()
            : DiceEngine.rollFromConfig(
                // `jet.sens` accompagne le seuil : sans lui, une réserve « sous
                // le seuil » comptait les dés au-dessus, et rendait des
                // réussites plausibles et exactement inverses.
                { ...dice, successThreshold: seuilDuMoteur, sens: jet.sens },
                {
                    // Les dés puisés dans le groupe s'ajoutent à la réserve.
                    baseCount: jet.nombreDeDes + desDuGroupe + desPerso,
                    gearCount: jet.desSecondaires,
                    doubleSous: jet.doubleSous,
                    // Sans elle, le moteur retomberait sur le booléen : réussi ou
                    // raté, et jamais « particulière ». C'est le même oubli que
                    // `jet.sens`, qui n'arrivait pas non plus jusqu'ici.
                    echelle: jet.echelle,
                },
            );
        // Le d20 de Symbaroum n'a pas de critique de base (S8) : l'effet optionnel se dit à part.
        /*
          **La tâche de Star Trek** (2026-10-23) : les dés du moteur restent ceux du
          personnage ; s'y ajoutent l'Occasion parfaite, les assistants et le vaisseau,
          chacun avec son seuil, comptés selon le livre (p. 255–257).
        */
        const complicationStarTrek = seuilDeComplication(choixStarTrek.marge);
        const desStarTrek = regleStarTrek
            ? desDeLaTache(brutDuMoteur.rolls.filter(d => !d.isDropped).map(d => Number(d.val) || 0), seuilDuMoteur ?? jet.seuil, jet.doubleSous, choixStarTrek, () => DiceEngine.roll(20))
            : null;
        const choixDuneValide = { ...choixDune, unAutomatique: choixDune.unAutomatique && !!maximeDune && choixDune.maximeAlignee && determinationDune > 0 };
        const desDuTestDune = regleDune ? desDune(brutDuMoteur.rolls.filter(d => !d.isDropped).map(d => Number(d.val)), seuilDuMoteur ?? jet.seuil, jet.doubleSous, choixDuneValide, () => DiceEngine.roll(20)) : null;
        const brut = desDuTestDune ? resultatDune(desDuTestDune, choixDune.marge, jet.reussitesRequises)
            : regleSymbaroum ? sansCritiqueDeBase(brutDuMoteur)
            : desStarTrek ? resultatDeStarTrek(desStarTrek, complicationStarTrek, jet.reussitesRequises)
            : brutDuMoteur;
        /*
          Le bonus du groupe (Vécu, Atout) s'ajoute au résultat compté : chez NOC
          chaque réussite élève le niveau d'un point, comme lui.
        */
        const bonusTotal = bonusDuGroupe + bonusPerso;
        const resBrut: RollResult = bonusTotal > 0
            ? { ...brut, successes: (brut.successes ?? 0) + bonusTotal, totalDisplay: `${brut.totalDisplay} (+${bonusTotal})` }
            : brut;
        // Le Sacrifice de Nephilim : le rituel réussit d'office, quels que soient les dés (p. 183).
        const resDuJet: RollResult = regleNephilim && jet.nephilim?.sacrifice?.retenu
            ? { ...resBrut, successes: 1, tagSuccess: true, degre: 'reussite-normale', totalDisplay: `${resBrut.totalDisplay} — réussi d’office (Sacrifice, 5 PS)` }
            : resBrut;
        setAvantPanique(resDuJet);
        const enAttente = !!suitesAlien && resDuJet.rolls.some(d => d.source === 'gear' && d.val === 1);
        const res = regleJetAlien ? enregistrerLeResultatAlien(resDuJet, enAttente)
            : enAttente ? resultatAvecPanique(resDuJet) : resDuJet;
        setSeuilDuLancer(jet.seuil);
        setBonusDuLancer(bonusDuGroupe + bonusPerso);
        setResultat(res);
        if (regleDune && desDuTestDune) {
            setDuneDuLancer(d => ({ des: desDuTestDune, choix: choixDuneValide, difficulte: jet.reussitesRequises,
                bilan: bilanDune(res.successes ?? 0, jet.reussitesRequises, choixDune.bonus), principe: principeDune, compte: (d?.compte ?? 0) + 1 }));
            const delta = (choixDune.contradiction !== 'aucune' ? 1 : 0) - (choixDuneValide.unAutomatique ? 1 : 0);
            if (delta && ecrireSurLaFiche) ecrireDune({ [regleDune.determination]: entierDune(determinationDune + delta, 0, 3),
                [CLE_DUNE]: noterDune({ ...suiviDune, determinationDansLaScene: true }, `Détermination : ${delta > 0 ? '+' : ''}${delta}`) });
            setChoixDune(c => ({ ...c, unAutomatique: false, contradiction: 'aucune' }));
        }
        if (regleStarTrek && desStarTrek) {
            setStarTrekDuLancer(d => ({ des: desStarTrek, complication: complicationStarTrek, difficulte: jet.reussitesRequises, choix: choixStarTrek, compte: (d?.compte ?? 0) + 1 }));
            // L'Occasion parfaite se paie d'un point de Détermination (p. 262) ; le deuxième assistant et les suivants, d'un point d'Impulsion ou de Menace (p. 255).
            if (choixStarTrek.occasionParfaite && regleStarTrek.determination) {
                ecrireStarTrek({ [regleStarTrek.determination]: Math.max(0, determinationStarTrek - 1) });
                dits.push(`Occasion parfaite : Détermination ${determinationStarTrek} → ${Math.max(0, determinationStarTrek - 1)}`);
            }
            const coutAide = coutDesAssistants(choixStarTrek.assistants.length);
            if (coutAide > 0 && monnaie && jet.cout.ressource) dits.push(...mouvoir(jet.cout.ressource, -coutAide, `${enTete}, assistants au-delà du premier`).avertissements, `${coutAide} pour les assistants`);
            setChoixStarTrek(c => ({ ...c, occasionParfaite: false }));
        }
        if (regleSymbaroum) {
            const retenu = jet.composantes[0]?.champ;
            const dejaRelance = relanceSymbaroum.current;
            setSymbaroumDuLancer(d => ({
                nature: retenu && retenu === regleSymbaroum.defense ? 'defense' : natureSymbaroum,
                avantage: !!jet.modificationDuSeuil?.avantage,
                compte: (d?.compte ?? 0) + 1,
                dejaRelance,
            }));
            relanceSymbaroum.current = false;
        }
        if (descripteur.cthulhuHack && !pourLesJoueurs && ecrireSurLaFiche && jet.composantes[0]) {
            const suivi=memoriserTestCH(valeursCH,{id:crypto.randomUUID(),champ:jet.composantes[0].champ,genre:'sauvegarde',seuil:jet.seuil,modificateur:modificateurCH,desavantagePresent:!!effetCH?.desavantage||modificateur==='desavantage',reussi:res.tagSuccess===true});
            ecrireCH({[CLE_CTHULHU_HACK]:suivi[CLE_CTHULHU_HACK]});
        }

        /*
          **Le panneau de fiche ne traverse pas le registre des dés**, donc il
          consigne lui-même. Ses jets n'apparaissaient ni dans l'historique du
          pupitre, ni au journal : le seul moment où ils laissaient une trace
          était quand ils dépensaient une ressource, et c'est le MOUVEMENT de
          réserve qui était consigné, pas le jet.

          Le brancher sur `setLastRoll` l'aurait aussi projeté sur le Hub des
          joueurs — un changement de comportement que ce chantier n'a pas à
          faire. On appelle donc le même décideur, par l'autre porte.
        */
        const titreDuJet = (jet.garde
            ? [
                // Le Potentiel se nomme par son champ : « Physique 5 », pas « Potentiel 5 ».
                `${jet.composantesDeLaReserve.map(c => template.sections.flatMap(sec => sec.fields).find(f => f.id === c.champ)?.label ?? c.label).join(' + ')} ${jet.nombreDeDes}`,
                jet.garde.niveau > 0 ? `${jet.garde.competence?.label ?? 'Compétence'} ${jet.garde.niveau}` : 'sans compétence',
                ...(jet.garde.specialisation ? [jet.garde.specialisation.label] : []),
            ].join(' · ')
            : jet.composantes.length > 0
            ? jet.composantes.map(c => c.label).join(' + ')
            : jet.desEchelonnes.length > 0
                ? jet.desEchelonnes.map(d => `${d.label} D${d.faces}`).join(' + ')
                : `${jet.nombreDeDes}d${jet.faces}`)
            // L'opposition et le modificateur se relisent avec le jet (Symbaroum).
            + (jet.modificationDuSeuil?.opposition
                ? ` · ${jet.modificationDuSeuil.opposition.label} ${jet.modificationDuSeuil.opposition.adverse}` : '')
            + (jet.modificationDuSeuil?.situation
                ? ` · ${jet.modificationDuSeuil.situation > 0 ? '+' : '−'}${Math.abs(jet.modificationDuSeuil.situation)}` : '')
            + (jet.modificationDuSeuil?.avantage ? ` · ${jet.modificationDuSeuil.avantage.label}` : '')
            // Ce qu'on a puisé dans le groupe se relit avec le jet.
            + (engagesDuGroupe.length > 0
                ? ` · ${engagesDuGroupe.map(d => `${d.apport.label}${d.apport.stocks.length > 1 ? ` (${d.stock!.label})` : ''} ×${d.points}`).join(', ')}`
                : '');
        const seconde = jet.composantesDeLaSecondeReserve[0];
        setDernierLancer({
            titre: titreDuJet + (modificateur !== 'aucun' ? ` · ${libellesDuTirage[modificateur]}` : ''),
            choix: { ...choix },
            seconde: seconde ? { champ: seconde.champ, label: seconde.label } : undefined,
        });
        /*
          ⛔ **Sur la tablette, le jet restait chez le joueur** (David,
          2026-09-30 : *« je voudrais que les jets des tablettes remontent vers
          GM-OS pour que je les voie et pour qu'ils soient pris en compte dans le
          journal »*). `consignerLeJet` écrivait dans le journal de la TABLETTE —
          un journal que personne ne lit. Le résultat part donc au meneur, qui
          l'inscrit à son historique et à son journal (`fiche:resultat`).
        */
        if (pourLesJoueurs && personnageId) {
            window.dispatchEvent(new CustomEvent('fiche:resultat', {
                detail: {
                    characterId: personnageId,
                    titre: titreDuJet + (modificateur !== 'aucun' ? ` · ${libellesDuTirage[modificateur]}` : ''),
                    total: res.total,
                    modifier: res.modifier,
                    /* Le seuil voyage avec le total, comme le journal l'écrit ici. */
                    totalDisplay: descripteur.cible || jet.composantes.length > 0
                        ? `${res.totalDisplay} (seuil ${jet.seuil})`
                        : avecLaNevrose(res),
                    rolls: res.rolls,
                    successes: res.successes,
                    tagSuccess: res.tagSuccess,
                    degre: res.degre,
                },
            }));
        } else {
            consignerLeJet({
                titre: titreDuJet,
                totalDisplay: avecLaNevrose(res),
                degre: res.degre,
                tagSuccess: res.tagSuccess,
                seuil: descripteur.cible || jet.composantes.length > 0 ? jet.seuil : undefined,
            });
        }

        /**
         * « Après la résolution d'un test réussi, chaque réussite excédentaire
         * génère un point d'Impulsion ajouté à la réserve du groupe. »
         *
         * Le crédit est automatique parce que la règle l'est — `verdict` rend
         * un excédent nul sur un échec, ce qui couvre « aucune Impulsion ne
         * peut être générée si le test échoue ». Le plafond, lui, se dit :
         * gagner trois points et n'en voir arriver qu'un doit s'expliquer.
         */
        if (monnaie && jet.cout.ressource && !regleDune) {
            const excedent = verdict(res.successes ?? 0, jet.reussitesRequises).excedent;
            /*
              **Ce que la réserve peut garder entre, le reste attend sur le test**
              (lot D2, 2026-10-22). Créditer tout l'excédent sur une réserve
              pleine le détruisait aussitôt ; le livre le laisse dépenser sur le
              test, puis conserver le reliquat. Le plafond se lit après le
              paiement des dés — l'état du magasin est déjà à jour.
            */
            const etatApres = etatDe(monnaie.campaignId, monnaie.ressourcesDeTable);
            const plafond = reserveDuCout ? plafondDe(monnaie.ressourcesDeTable, etatApres, reserveDuCout) : undefined;
            const place = plafond === undefined ? excedent
                : Math.max(0, plafond - valeurDe(monnaie.ressourcesDeTable, etatApres, jet.cout.ressource));
            const verse = Math.min(excedent, place);
            if (verse > 0) {
                dits.push(...mouvoir(
                    jet.cout.ressource, verse,
                    `${enTete}, ${excedent} réussite${excedent > 1 ? 's' : ''} excédentaire${excedent > 1 ? 's' : ''}`,
                ).avertissements);
            }
            if (excedent > verse) {
                const n = excedent - verse;
                setImpulsionDuJet({ reste: n, enTete });
                dits.push(`${n} ${nomDe(jet.cout.ressource)} hors réserve, pleine : à dépenser sur ce test, sinon perdu${n > 1 ? 's' : ''}.`);
            }
        }

        /*
          **Ce que le jet consomme sur la fiche** (Nephilim, 2026-10-18) : les
          Materiae Primae d'une transmutation, retirées au lancer — la règle ne
          laisse pas de choix (Quintessence p. 220) —, conservées sur un critique.
        */
        // L'Œuvre au blanc consomme deux éléments (2026-10-23).
        for (const consomme of ecrireSurLaFiche ? consommationsDuJet(descripteur.consommation, choix, valeurs, res.degre) : []) {
            if (!consomme.conservee) ecrireSurLaFiche?.({ [consomme.champ]: consomme.apres });
            dits.push(direLaConsommation(consomme));
        }

        // L'Avantage tactique ajoute aux dégâts : le jet ne les lance pas, il le rappelle (S3).
        const avantage = jet.modificationDuSeuil?.avantage;
        if (avantage?.degats) dits.push(`${avantage.label} : +${avantage.degats.toUpperCase()} aux dégâts.`);

        if ('garde' in res) setGardeAuJournal((res as JetGarde).garde.gardes.join(','));
        setGardeDuLancer(jet.garde ? { atteintes: jet.garde.atteintes, depassement: jet.garde.depassement } : null);
        setEnqueteNotee(null);
        setAttaqueInfligee(null);
        setNevroseNotee(null);
        setMouvements(dits);
    };

    /**
     * Complète le dernier test de Torg et le redit — au journal, ou au meneur
     * depuis la tablette, comme un jet neuf : c'est le résultat qui compte.
     */
    const completerTorg = (geste: 'relance' | 'possibilite' | 'action' | 'unDePlus') => {
        if (!testDeTorg) return;
        const { des, options, niveau, difficulte: nd, entraine: ok, titre } = testDeTorg;
        const de = () => DiceEngine.roll(20);
        const suivants: DesDeTorg = geste === 'relance'
            ? { ...des, premier: lancerUneChaine(de, ok), relance: true }
            : geste === 'possibilite'
                ? { ...des, possibilite: lancerLaPossibilite(de, ok) }
                : geste === 'action'
                    ? { ...des, possibiliteDeLAction: lancerLaPossibilite(de, ok) }
                    : { ...des, unDePlus: lancerUneChaine(de, ok) };
        const res = DiceEngine.resultatDeTorg(niveau, nd, suivants, options);
        setTestDeTorg({ ...testDeTorg, des: suivants });
        setResultat(res);

        const nomDuGeste = geste === 'relance' ? 'compétence favorisée' : geste === 'possibilite' ? 'Possibilité'
            : geste === 'action' ? 'Loi de l’Action' : 'Un de plus !';
        if ((geste === 'possibilite' || geste === 'action') && descripteur.torg?.possibilites) {
            const champ = descripteur.torg.possibilites;
            const reste = possibilitesRestantes - 1;
            setForcage(f => ({ ...f, ecrits: { ...f.ecrits, [champ]: reste } }));
            ecrireSurLaFiche?.({ [champ]: reste });
            setMouvements(m => [...m, `Possibilités −1 → ${reste}${geste === 'action' ? ' (Loi de l’Action : la meilleure des deux compte)' : ''}`]);
        }
        if (pourLesJoueurs && personnageId) {
            window.dispatchEvent(new CustomEvent('fiche:resultat', {
                detail: {
                    characterId: personnageId, titre: `${titre} · ${nomDuGeste}`, total: res.total, modifier: res.modifier,
                    totalDisplay: res.totalDisplay, rolls: res.rolls, successes: res.successes, tagSuccess: res.tagSuccess, degre: res.degre,
                },
            }));
        } else {
            consignerLeJet({ titre: `${titre} · ${nomDuGeste}`, totalDisplay: res.totalDisplay, degre: res.degre, tagSuccess: res.tagSuccess });
        }
    };
    const torgCritique = resultat?.degre === 'echec-total';

    /**
     * **L'Annulation des dommages** : une Possibilité, un test de Réalité
     * (attribut + compétence) contre ND 10, et ce qu'il annule de l'attaque en
     * cours. Le résultat se dit ; les cases se décochent par « Soins », sur la
     * carte de combattant — GM-OS ne sait pas quelle part de quel coup annuler.
     */
    const annulation = torg ? descripteur.torg?.annulation : undefined;
    const annuler = () => {
        if (!annulation || !descripteur.torg?.possibilites) return;
        const niveau = niveauDuGroupe(valeurs, annulation.attribut) + niveauDuGroupe(valeurs, annulation.competence);
        const options: OptionsDeTorg = { malus: blessuresTorg, raisonDuMalus: blessuresTorg ? `Blessure${blessuresTorg > 1 ? 's' : ''}` : undefined };
        const des: DesDeTorg = { premier: lancerUneChaine(() => DiceEngine.roll(20)) };
        const res = DiceEngine.resultatDeTorg(niveau, ND_DE_L_ANNULATION, des, options);
        const effet = ceQueLAnnulationAnnule(resoudreTorg(niveau, ND_DE_L_ANNULATION, des, options), { perseverance: !!loiPerseverance });
        const ecrit: RollResult = { ...res, totalDisplay: `Annulation des dommages : ${effet} — ${res.totalDisplay}` };
        ecrireSurLaFiche?.({ [descripteur.torg.possibilites]: possibilitesTorg - 1 });
        setTestDeTorg(null);
        setResultat(ecrit);
        setMouvements([`Possibilités −1 → ${possibilitesTorg - 1}`]);
        if (pourLesJoueurs && personnageId) {
            window.dispatchEvent(new CustomEvent('fiche:resultat', {
                detail: {
                    characterId: personnageId, titre: 'Annulation des dommages', total: ecrit.total, modifier: ecrit.modifier,
                    totalDisplay: ecrit.totalDisplay, rolls: ecrit.rolls, successes: ecrit.successes, tagSuccess: ecrit.tagSuccess, degre: ecrit.degre,
                },
            }));
        } else {
            consignerLeJet({ titre: 'Annulation des dommages', totalDisplay: ecrit.totalDisplay, degre: ecrit.degre, tagSuccess: ecrit.tagSuccess });
        }
    };

    /**
     * **Changer sa garde** (Crimes, livre p. 385) : le joueur peut garder de
     * mauvais dés pour échouer volontairement. Cliquer un dé écarté le fait
     * entrer à la place du meilleur gardé ; cliquer un dé gardé le fait sortir
     * au profit du meilleur écarté. Les 1 restent gardés d'office.
     */
    const changerLaGarde = (i: number) => {
        const g = (resultat as JetGarde | null)?.garde;
        if (!g || !resultat || g.depassement > 0) return;
        const des = resultat.rolls.map(d => Number(d.val));
        const place = Math.max(0, g.quota - des.filter(v => v === 1).length);
        if (des[i] === 1 || place === 0) return;
        const voulus = g.gardes.filter(j => des[j] !== 1);
        const ecartes = des.map((_, j) => j).filter(j => !g.gardes.includes(j) && des[j] !== 1);
        const meilleur = (js: number[]) => js.reduce((a, b) => (des[b] > des[a] ? b : a));
        const suivants = g.gardes.includes(i)
            ? (ecartes.length > 0 ? [...voulus.filter(j => j !== i), meilleur(ecartes)] : null)
            : voulus.length < place ? [...voulus, i] : [...voulus.filter(j => j !== meilleur(voulus)), i];
        if (suivants) setResultat(resoudreLaGarde(des, g.quota, g.seuil, suivants));
    };

    /** Ce que le journal lit d'un jet gardé : le bilan et ce qu'il fait à la Névrose. */
    function avecLaNevrose(res: RollResult): string {
        const g = (res as Partial<JetGarde>).garde;
        return g ? [res.totalDisplay, ...effetsSurLaNevrose(g)].join(' ') : res.totalDisplay ?? '';
    }

    /** Redit un jet complété — au journal, ou au meneur depuis la tablette. */
    const redire = (titre: string, res: RollResult) => {
        if (pourLesJoueurs && personnageId) {
            window.dispatchEvent(new CustomEvent('fiche:resultat', {
                detail: {
                    characterId: personnageId, titre, total: res.total, modifier: res.modifier,
                    totalDisplay: res.totalDisplay, rolls: res.rolls, successes: res.successes, tagSuccess: res.tagSuccess, degre: res.degre,
                },
            }));
        } else {
            consignerLeJet({ titre, totalDisplay: res.totalDisplay, degre: res.degre, tagSuccess: res.tagSuccess });
        }
    };

    /**
     * **Se dépasser** (Crimes, C3, p. 385 et 407) : garder `n` des réussites restées
     * hors de la garde. Chacune coûte une fatigue sur le Potentiel utilisé ; un
     * seul dépassement par scène, que la fin de scène rend. Le meneur juge si la
     * passion ou la conviction invoquée vaut — l'outil compte, il n'arbitre pas.
     */
    const seDepasser = (n: number) => {
        const g = (resultat as JetGarde | null)?.garde;
        const a = gardeDuLancer?.atteintes;
        const d = gardeDuLancer?.depassement;
        if (!g || !resultat || !a || !d || !dernierLancer || g.depassement > 0 || n < 1) return;
        const des = resultat.rolls.map(x => Number(x.val));
        const res = resoudreLaGarde(des, g.quota, g.seuil, g.gardes.filter(j => des[j] !== 1), n);
        const fatigue = (Number(valeursDesAtteintes[a.champs.fatigue]) || 0) + n;
        ecrireLesAtteintes({ [a.champs.fatigue]: fatigue, [d.champ]: 1 });
        setResultat(res);
        const nom = template.sections.flatMap(sec => sec.fields).find(f => f.id === a.potentiel)?.label ?? a.potentiel;
        setMouvements(m => [...m, `Dépassement : ${n} réussite${n > 1 ? 's' : ''} gardée${n > 1 ? 's' : ''} en plus — ${nom} : +${n} fatigue jusqu’à la fin de la scène.`]);
        redire(`${dernierLancer.titre} · dépassement`, { ...res, totalDisplay: avecLaNevrose(res) });
        setGardeAuJournal(res.garde.gardes.join(','));
    };

    const consignerLaGarde = () => {
        const g = (resultat as JetGarde | null)?.garde;
        if (!g || !resultat || !dernierLancer) return;
        redire(`${dernierLancer.titre} · garde choisie`, { ...resultat, totalDisplay: avecLaNevrose(resultat) });
        setGardeAuJournal(g.gardes.join(','));
    };

    const raisonDeNePasForcer = synthetiqueAlien ? 'Un androïde ne force jamais.'
        : briseAlien ? 'Brisé ou mort : aucun test ordinaire ni forçage.'
        : regleJetAlien && dernierLancer && suiviJetAlien?.role === 'defenseur'
        ? 'Le défenseur ne peut pas forcer un test opposé.'
        : regleJetAlien && dernierLancer && (suiviJetAlien?.eclats.length ?? 0) > 0
        ? 'Des actions d’éclat sont déjà dépensées : ce test est clos.'
        : regleDuForcage && resultat && dernierLancer
        ? pourquoiNePasForcer(regleDuForcage, {
            resultat, valeurs, choix: dernierLancer.choix, dejaForce: forcage.fois, libelleDuUn,
        })
        : null;

    /**
     * **Forcer le jet.** Ce qui se paie AVANT la relance (le Stress d'Alien, qui
     * ajoute son dé) puis ce qui se paie APRÈS (un point par 1 chez Blade Runner),
     * écrit sur la fiche et dit sous le résultat.
     */
    const forcer = () => {
        if (!regleDuForcage || !resultat || !dernierLancer || raisonDeNePasForcer) return;
        const ecrits = { ...forcage.ecrits };
        const dits: string[] = [];
        if (aRelancerAussi.length) dits.push(`Relancé${aRelancerAussi.length > 1 ? 's' : ''} malgré sa réussite : ${aRelancerAussi.length} dé${aRelancerAussi.length > 1 ? 's' : ''}`);
        const aReporter = ecrireSurLaFiche ? '' : ' (à reporter sur la fiche)';

        const montee = dernierLancer.seconde ? (regleDuForcage.monteeDeLaSeconde ?? 0) : 0;
        if (montee > 0 && dernierLancer.seconde) {
            const { champ, label } = dernierLancer.seconde;
            ecrits[champ] = lireLeNombre(champ) + montee;
            if (suitesAlien) ecrireAlien({ [champ]: ecrits[champ] });
            else ecrireSurLaFiche?.({ [champ]: ecrits[champ] });
            dits.push(`${label} +${montee} → ${ecrits[champ]}${aReporter}`);
        }

        // Le souvenir clé rappelé après le jet : un dé de plus, du type du plus faible, entre dans la relance (p. 56).
        const plusFaible = Math.min(...resultat.rolls.filter(d => !d.isDropped).map(d => d.sides ?? 6));
        const avecLeSouvenir = souvenirDuJet === 'apres' && forcage.fois === 0 && Number.isFinite(plusFaible)
            ? { ...resultat, rolls: [...resultat.rolls, { val: 0, sides: plusFaible, source: 'base' as const }] } : resultat;
        if (avecLeSouvenir !== resultat) dits.push(`Souvenir clé : un D${plusFaible} de plus`);
        const res = forcerLeJet(avecLeSouvenir, regleDuForcage, {
            famille: familleYearZero, desEnPlus: montee, libelleDuUn, aussi: aRelancerAussi,
            de: faces => DiceEngine.roll(faces),
        });
        setARelancerAussi([]);
        if (souvenirDuJet && (res.successes ?? 0) === 0) setStressDuSouvenir(true);

        const prix = prixDuForcage(regleDuForcage, {
            resultat: res, valeurs, choix: dernierLancer.choix, dejaPayes: forcage.unsPayes,
        });
        if (prix && prix.points > 0) {
            const reste = Math.max(0, lireLeNombre(prix.champ) - prix.points);
            ecrits[prix.champ] = reste;
            ecrireSurLaFiche?.({ [prix.champ]: reste });
            dits.push(`${prix.label} −${prix.points} (${prix.points > 1 ? `${prix.points} dés` : 'un dé'} sur 1) → ${reste}${aReporter}`
                // « L'action est résolue avant d'être Brisé. »
                + (reste === 0 ? ' — Brisé, une fois l’action résolue' : ''));
        } else if (prix) {
            dits.push('Aucun 1 : le forçage ne coûte rien.');
        }

        const gardes = res.rolls.filter(d => d.relance === false).length;
        const relances = res.rolls.length - gardes;
        setForcage({ fois: forcage.fois + 1, unsPayes: forcage.unsPayes + (prix?.points ?? 0), ecrits });
        setPaniqueJouee(null);
        paniqueDejaJouee.current = false;
        evenementPanique.current = `alien-forcage-${crypto.randomUUID()}`;
        setAvantPanique(res);
        const enAttente = !!suitesAlien && res.rolls.some(d => d.source === 'gear' && d.val === 1);
        const definitif = regleJetAlien ? enregistrerLeResultatAlien(res, enAttente)
            : enAttente ? resultatAvecPanique(res) : res;
        setResultat(definitif);
        setMouvements(m => [
            ...m,
            `Jet forcé : ${gardes} dé${gardes > 1 ? 's' : ''} gardé${gardes > 1 ? 's' : ''}, ${relances} relancé${relances > 1 ? 's' : ''}`,
            ...dits,
        ]);
        redire(`${dernierLancer.titre} · forcé`, definitif);
    };

    /*
      **Le test de Panique** (Alien) : un 1 sur un dé de la seconde réserve le
      déclenche. Un dé, plus le Niveau de Stress — celui d'après le forçage. La
      table vit dans Table-OS, que seul le poste du meneur atteint : la tablette
      dit le total, et c'est le meneur qui lit la ligne.
    */
    const paniqueDeclenchee = !!descripteur.panique && !synthetiqueAlien
        && !!resultat?.rolls.some(d => d.source === 'gear' && d.val === 1);
    const paniqueEnAttente = !!suitesAlien && paniqueDeclenchee && !paniqueJouee;
    const actionAnnulee = !!suitesAlien && !!paniqueJouee && paniqueJouee.effectif >= 10;
    const jouerLaPanique = () => {
        const regle = descripteur.panique;
        if (!regle || !dernierLancer || paniqueDejaJouee.current || synthetiqueAlien) return;
        paniqueDejaJouee.current = true;
        const niveau = dernierLancer.seconde ? lireLeNombre(dernierLancer.seconde.champ) : 0;
        const tire = testDePanique(niveau, regle.faces, faces => DiceEngine.roll(faces));
        const modificateur = suitesAlien ? modifierDePanique(suitesAlien, valeursAlien) : 0;
        tire.total += modificateur;
        /*
          **Le cumul** : déjà en panique, un total plus bas ou égal donne la ligne
          juste au-dessus de la panique en cours. Celle-ci se garde sur la fiche,
          et se remet à 0 sur la carte du combattant quand elle cesse.
        */
        const seuil = regle.seuil ?? 1;
        const precedent = regle.champ ? lireLeNombre(regle.champ) : 0;
        const { effectif, cumule } = suitesAlien ? cumulAlien(tire.total, precedent) : cumulDePanique(tire.total, precedent, seuil);
        const joue = { ...tire, effectif, precedent, cumule, modificateur };
        setPaniqueJouee(joue);
        if (suitesAlien) {
            const talentMeurtrier = suitesAlien.talents && String(valeursAlien[suitesAlien.talents] ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('folie meurtriere');
            const maj = appliquerLaPaniqueAlien(suitesAlien, regle.champ, valeursAlien, evenementPanique.current, effectif, folieMeurtriere && !!talentMeurtrier);
            ecrireAlien(maj);
            setForcage(f => ({ ...f, ecrits: { ...f.ecrits, ...(regle.champ ? { [regle.champ]: effectif >= 7 ? effectif : 0 } : {}),
                ...(typeof maj[suitesAlien.stress] === 'number' ? { [suitesAlien.stress]: maj[suitesAlien.stress] as number } : {}) } }));
            const final = avantPanique ? regleJetAlien ? enregistrerLeResultatAlien(avantPanique, false, effectif >= 10)
                : resultatAvecPanique(avantPanique, effectif) : null;
            if (final) { setResultat(final); redire(`${dernierLancer.titre} · après Panique`, final); }
        } else if (regle.champ && effectif >= seuil) {
            const champ = regle.champ;
            setForcage(f => ({ ...f, ecrits: { ...f.ecrits, [champ]: effectif } }));
            ecrireSurLaFiche?.({ [champ]: effectif });
        }
        const nom = libelleDuUn ?? 'Panique';
        const calcul = `1d${regle.faces} (${tire.de}) + ${dernierLancer.seconde?.label ?? 'Stress'} ${niveau}`
            + (modificateur ? ' −2 (Nerfs d’acier)' : '') + ` = ${tire.total}`
            + (cumule ? ` ; déjà en panique (${precedent}) : ${effectif}` : '');
        const dire = (entree?: TableEntry) => redire(`Test de ${nom}`, {
            total: effectif, modifier: niveau, rolls: [{ val: tire.de, sides: regle.faces }],
            totalDisplay: entree ? `${calcul} — ${entree.title}` : calcul,
        });
        const pont = pontDesTables();
        if (!regle.table || !pont || pourLesJoueurs) {
            dire();
            return;
        }
        pont.loadTable(regle.table.univers, regle.table.table)
            .then(data => {
                const entree = data ? entreeDeLaTable(data.entries, effectif) : undefined;
                if (entree) setPaniqueJouee({ ...joue, entree });
                dire(entree);
            })
            .catch(() => dire());
    };

    /*
      **Une réussite qui se paie** (le Point de Récit d'Alien) : après le lancer,
      un point de la fiche ajoute un six au jet. Il reste sur la table si l'on
      force ensuite — c'est une réussite.
    */
    /*
      **Brisé** (Blade Runner, 2026-10-14) : un forçage a mis la Santé ou le
      Sang-froid à zéro. Le panneau le dit, et lance l'effet critique quand le jeu
      en a un — le dé d'Empathie sur la table des effets de stress critiques.
    */
    const brises = (descripteur.brise ?? []).filter(b => forcage.ecrits[b.champ] === 0);
    const [effetsDuBrise, setEffetsDuBrise] = useState<Record<string, { de: number; faces: number; entree?: TableEntry; perte?: string }>>({});
    const nomDuChamp = (id: string) => template.sections.flatMap(s => s.fields).find(c => c.id === id)?.label ?? id;
    const jouerLeBrise = (b: EtatBrise) => {
        if (!dernierLancer) return;
        const lance = lancerLEffetDuBrise(b, valeurs, lireLeNombre, faces => DiceEngine.roll(faces));
        const { faces, tire } = lance;
        let perte: string | undefined;
        if (lance.perte) {
            const { champ, reste } = lance.perte;
            setForcage(f => ({ ...f, ecrits: { ...f.ecrits, [champ]: reste } }));
            ecrireSurLaFiche?.({ [champ]: reste });
            perte = `${nomDuChamp(champ)} −1 à vie → ${reste}${reste === 0 ? ' — le personnage quitte la partie' : ''}`;
        }
        const effet = { de: tire, faces, perte };
        setEffetsDuBrise(e => ({ ...e, [b.champ]: effet }));
        const calcul = `${b.label} : D${faces}${b.de ? ` (${nomDuChamp(b.de)})` : ''} = ${tire}${perte ? ` ; ${perte}` : ''}`;
        const dire = (entree?: TableEntry) => redire(b.label, {
            total: tire, modifier: 0, rolls: [{ val: tire, sides: faces }],
            totalDisplay: entree ? `${calcul} — ${entree.title}` : calcul,
        });
        const table = tableDuBrise(b, valeurs, dernierLancer.choix);
        const pont = pontDesTables();
        if (!table || !pont || pourLesJoueurs) { dire(); return; }
        pont.loadTable(table.univers, table.table)
            .then(data => {
                const entree = data ? entreeDeLaTable(data.entries, tire) : undefined;
                if (entree) setEffetsDuBrise(e => ({ ...e, [b.champ]: { ...effet, entree } }));
                // L'effet tiré se garde sur la fiche, quand le jeu lui donne une place.
                if (entree && b.noterDans) ecrireSurLaFiche?.({ [b.noterDans]: noterSurLaFiche(valeurs[b.noterDans], entree.title) });
                dire(entree);
            })
            .catch(() => dire());
    };

    /*
      **Les suites d'une maladresse ou d'un critique** (Nephilim, 2026-10-18) :
      la jauge à monter dépend de ce qui a été lancé — Khaïba sur un Art occulte,
      Ombre sur le Vécu contemporain. Un bouton, jamais une écriture seule : le
      meneur tranche (une invocation ratée rompt le pacte sans Khaïba).
    */
    const suites = resultat && dernierLancer
        ? suitesDuJet(descripteur.suitesDesCritiques, resultat.degre, Object.values(dernierLancer.choix).filter(Boolean), template.sections)
        : [];
    const [suitesNotees, setSuitesNotees] = useState<Record<string, string>>({});
    const champDuGeste = (suite: SuiteDUnCritique) =>
        dernierLancer ? champDeLaSuite(suite, dernierLancer.choix, template.sections) : undefined;
    const noterLaSuite = (suite: SuiteDUnCritique) => {
        const champ = champDuGeste(suite);
        if (!suite.ajouter || !champ || suitesNotees[suite.label]) return;
        const pas = suite.ajouter.pas ?? 1;
        const max = template.sections.flatMap(s => s.fields).find(f => f.id === champ)?.max;
        const avant = lireLeNombre(champ);
        const apres = valeurApresLaSuite(avant, pas, max);
        setForcage(f => ({ ...f, ecrits: { ...f.ecrits, [champ]: apres } }));
        ecrireSurLaFiche?.({ [champ]: apres });
        setSuitesNotees(n => ({ ...n, [suite.label]: `${nomDuChamp(champ)} : ${avant} → ${apres}` }));
    };

    const reussiteDepensee = descripteur.reussiteDepensee && ecrireSurLaFiche && !torg && !destin && (!combatAlien?.progression||lireProgressionAlien(valeursAlien).mode==='cinema')
        ? descripteur.reussiteDepensee : undefined;
    const pointsDisponibles = reussiteDepensee ? lireLeNombre(reussiteDepensee.champ) : 0;
    const depenserUneReussite = () => {
        if (!reussiteDepensee || !resultat || !dernierLancer || pointsDisponibles <= 0) return;
        if (briseAlien) return;
        if (regleJetAlien && (suiviJetAlien?.eclats.length ?? 0) > 0) return;
        if (suitesAlien && paniqueDeclenchee && (!paniqueJouee || paniqueJouee.effectif >= 10)) return;
        const { champ, label } = reussiteDepensee;
        const reste = pointsDisponibles - 1;
        setForcage(f => ({ ...f, ecrits: { ...f.ecrits, [champ]: reste } }));
        if (suitesAlien) ecrireAlien({ [champ]: reste });
        else ecrireSurLaFiche?.({ [champ]: reste });
        const successes = (regleJetAlien ? suiviJetAlien?.reussites ?? resultat.successes ?? 0 : resultat.successes ?? 0) + 1;
        const res: RollResult = {
            ...resultat,
            rolls: [...resultat.rolls, { val: 6, sides: 6, source: 'base', isCritMax: true, cssClass: 'reussite-depensee' }],
            total: successes,
            successes,
            tagSuccess: true,
            degre: 'reussite-normale',
            totalDisplay: `${resultat.totalDisplay} (+1 ${label})`,
        };
        setAvantPanique(res);
        const affiche = enregistrerLeResultatAlien(res);
        setResultat(affiche);
        setMouvements(m => [...m, `${label} −1 → ${reste} : un 6 ajouté`]);
        redire(`${dernierLancer.titre} · ${label}`, affiche);
    };

    /*
      **La Fortune** (Cthulhu Hack, 2026-10-16) : après un jet raté, le joueur
      PLACE des jetons sur sa fiche — un pour relancer, deux pour réussir —, sans
      jamais dépasser le maximum. Le compte placé se garde ici, à part de
      `forcage`, qu'une relance remet à zéro.
    */
    const fortune = descripteur.fortune && ecrireSurLaFiche && !torg && !destin ? descripteur.fortune : undefined;
    const jetonsDeFortune = fortune ? Math.max(0, descripteur.cthulhuHack ? Number(valeursCH[fortune.champ])||0 : jetonsPlaces ?? (Number(valeurs[fortune.champ]) || 0)) : 0;
    const fortuneOfferte = !!fortune && !!resultat && !!dernierLancer && resultat.tagSuccess === false && !reussiParLaFortune;
    const placerLaFortune = (quoi: 'relance' | 'reussite') => {
        if (!fortune || !fortuneOfferte || !resultat || !dernierLancer) return;
        const cout = quoi === 'relance' ? fortune.relance : fortune.reussite;
        const jetons = jetonsDeFortune + cout;
        if (jetons > fortune.max) return;
        const nom = fortune.label ?? 'Fortune';
        setJetonsPlaces(jetons);
        if(descripteur.cthulhuHack)ecrireCH({[fortune.champ]:jetons});
        else ecrireSurLaFiche?.({ [fortune.champ]: jetons });
        const note = `${nom} : ${cout} jeton${cout > 1 ? 's' : ''} placé${cout > 1 ? 's' : ''} → ${jetons} sur la fiche`;
        if (quoi === 'relance') {
            lancer();
            setMouvements(m => [...m, `${note}, jet relancé`]);
            return;
        }
        const res: RollResult = {
            ...resultat, tagSuccess: true, degre: 'reussite-normale',
            totalDisplay: `${resultat.totalDisplay} → réussi (${nom})`,
        };
        setReussiParLaFortune(true);
        if(descripteur.cthulhuHack&&!pourLesJoueurs&&jet.composantes[0]){
            const suivi=memoriserTestCH(valeursCH,{id:crypto.randomUUID(),champ:jet.composantes[0].champ,genre:'sauvegarde',seuil:jet.seuil,modificateur:'aucun',reussi:true});
            ecrireCH({[CLE_CTHULHU_HACK]:suivi[CLE_CTHULHU_HACK]});
        }
        setResultat(res);
        setMouvements(m => [...m, `${note}, jet réussi`]);
        redire(`${dernierLancer.titre} · ${nom}`, res);
    };

    const reussites = resultat?.successes ?? 0;
    /** Le jet gardé de Crimes : son bilan se nomme, il ne se compte pas contre une difficulté. */
    const gardeDuResultat = (resultat as JetGarde | null)?.garde;
    /** Une réserve, qui compte ses réussites — et non un verdict sur un seul dé. */
    const compteDeReussites = !descripteur.cible && !descripteur.tableDeBonus && !descripteur.destin && !gardeDuResultat
        && (jet.desEchelonnes.length > 0 || jet.nombreDeDes + jet.desSecondaires > 1);
    const v = verdict(reussites, regleDune && duneDuLancer ? duneDuLancer.difficulte : jet.reussitesRequises);
    // Un dé écarté n'a rien déclenché : le compter ici annoncerait une
    // complication que le tirage vient précisément d'éviter.
    // La marge de complication de Star Trek (p. 258) : celle du lancer, pas celle du réglage d'après.
    const seuilDeComplicationDuLancer = regleDune && duneDuLancer ? 21 - duneDuLancer.choix.marge : regleStarTrek && starTrekDuLancer ? starTrekDuLancer.complication : descripteur.complication;
    const complications = seuilDeComplicationDuLancer
        ? (resultat?.rolls ?? []).filter(
            d => !d.isDropped && typeof d.val === 'number' && d.val >= seuilDeComplicationDuLancer!,
        ).length
        : 0;

    /*
      **Les étapes du test** (maquette du 2026-10-22). « Préparer » n'existe que
      si le jeu y a quelque chose : une difficulté, des réserves où puiser, la
      préparation d'Alien… — une étape vide numérotée mentirait sur l'ordre.
    */
    const aPreparer = !!descripteur.cible || torg || !!destin || disponiblesPerso.length > 0
        || (apports.length > 0 && !!ficheDeGroupe) || !!regleJetAlien
        || !!(combatAlien && equipementAlien?.proprietes?.munitions)
        || !!descripteur.specialisation || !!(descripteur.difficulte && !descripteur.cible) || !!seuilDeplacable
        || !!descripteur.garde?.specialisations || !!descripteur.garde?.depassement || !!descripteur.garde?.armes
        || !!descripteur.garde?.circonstances || !!descripteur.garde?.hermetiques?.length;
    const numeros = { composer: 1, preparer: 2, lancer: aPreparer ? 3 : 2, resultat: aPreparer ? 4 : 3 };
    /*
      **Le septième lecteur, et il écrivait lui aussi son propre mot.** Le degré
      l'emporte quand le jeu en gradue ; sinon c'est le verdict du compte de
      réussites, qui reste l'autorité sur une réserve. Il se lit en tête du
      résultat, à droite du titre.
    */
    const verdictDuResultat = resultat && gardeDuResultat
        // Le bilan du livre (p. 385), et non le degré générique du moteur.
        ? <span className={'font-black uppercase tracking-widest ' + (resultat.tagSuccess ? 'text-etat-succes' : 'text-etat-danger')}>
            {gardeDuResultat.libelle}
        </span>
        : resultat && !paniqueEnAttente
        && !(regleJetAlien && (suiviJetAlien?.role === 'defenseur' || (suiviJetAlien?.role === 'attaquant' && suiviJetAlien.defense === undefined)))
        ? <EtiquetteDuDegre
            resultat={{ degre: resultat.degre, tagSuccess: v.reussi }}
            classes={reussi => 'font-black uppercase tracking-widest ' + (reussi ? 'text-etat-succes' : 'text-etat-danger')}
        />
        : null;

    return (
        <div data-panneau-de-jet className="space-y-4">
            <h3 className="sr-only">Lancer un test</h3>

            <Etape numero={numeros.composer} titre="Composer">
                {/*
                    Les composantes que le joueur retient sur sa fiche : celles du
                    seuil, et **celles de la réserve**.

                    Chez Alien le nombre de dés vaut un attribut plus une compétence
                    — le pilote ne savait offrir qu'un nombre fixe, et tous les
                    personnages lançaient la même poignée. Les deux familles se
                    choisissent au même endroit parce que c'est le même geste : le
                    joueur désigne ce qu'il invoque, avant de lancer.
                */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {composantesARetenir.map(composante => {
                      const sousGroupes = sousGroupesDe(composante);
                      return (
                        <label key={composante.id} className="flex flex-col gap-1">
                            <span className="text-ui-9 font-black uppercase tracking-widest text-app-text/40">
                                {composante.label}
                            </span>
                            <select
                                value={choix[composante.id] ?? ''}
                                onChange={e => setChoix(c => ({ ...c, [composante.id]: e.target.value }))}
                                className="bg-app-bg/60 border border-app-border/40 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-accent/50"
                            >
                                {/* Facultative : la laisser vide est un choix (Torg, compétence non entraînée). */}
                                <option value="">{composante.facultative ? '— aucune —' : '— choisir —'}</option>
                                {/*
                                    **Un seul sous-groupe ne s'annonce pas.** Coiffer
                                    une liste unique du nom de sa section ajouterait
                                    une ligne qui ne distingue rien — l'`optgroup` ne
                                    sert que là où il y a un choix de sous-groupe à
                                    faire, et c'est le cas de Rêves de Dragons, pas
                                    celui de Dune.
                                */}
                                {sousGroupes.map(section => {
                                    /*
                                      **Un nom n'est pas une valeur** (Nephilim, 2026-10-17) :
                                      le champ qu'un autre désigne par `libelleSur` le nomme,
                                      il ne se lance pas. Et une ligne sans nom saisi —
                                      un Vécu vide — n'a rien à proposer.
                                    */
                                    const noms = new Set(section.fields.map(f => f.libelleSur).filter(Boolean));
                                    // Le motif de la composante : le degré d'une formule, pas son aire (Nephilim).
                                    const motif = (() => { try { return composante.motif ? new RegExp(composante.motif) : null; } catch { return null; } })();
                                    const options = section.fields
                                        .filter(f => !noms.has(f.id))
                                        .filter(f => !motif || motif.test(f.id))
                                        .filter(f => !f.libelleSur || String(valeurs[f.libelleSur] ?? '').trim() !== '')
                                        .map(f => (
                                            <option key={f.id} value={f.id}>
                                                {(f.libelleSur && String(valeurs[f.libelleSur] ?? '').trim()) || f.label} ({String(valeurs[f.id] ?? f.defaultValue)})
                                            </option>
                                        ));
                                    return sousGroupes.length > 1
                                        ? <optgroup key={section.id} label={section.label || section.id}>{options}</optgroup>
                                        : <Fragment key={section.id}>{options}</Fragment>;
                                })}
                            </select>
                        </label>
                      );
                    })}
                </div>

                {/*
                    **Le Vécu retenu, relié à sa liste** (Nephilim, 2026-10-17) : quand le
                    champ choisi tire son nom d'un champ relié à un référentiel, ce que le
                    corpus dit de ce nom s'affiche ici.
                */}
                {composantesARetenir.map(composante => {
                    const champ = template.sections.flatMap(sec => sec.fields).find(f => f.id === choix[composante.id]);
                    const nomDuChamp = champ?.libelleSur ? template.sections.flatMap(sec => sec.fields).find(f => f.id === champ.libelleSur) : undefined;
                    if (!nomDuChamp?.referentiel) return null;
                    const pilote = tousLesPilotes(pilotesPerso).find(d => d.id === campagne?.system)
                        ?? tousLesPilotes(pilotesPerso).find(d => d.templateId === template.id);
                    return <LigneDuReferentiel key={composante.id} pilote={pilote} chemin={nomDuChamp.referentiel} nom={String(valeurs[nomDuChamp.id] ?? '')} />;
                })}

                {/* Le calcul, sous les choix : d'où sortent le seuil et la réserve. */}
                {((descripteur.seuil ?? []).length > 0 || !!descripteur.cible || jet.desEchelonnes.length > 0
                    || jet.desSecondaires > 0 || jet.composantesDeLaReserve.length > 0) && (
                    <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t border-app-border/40 pt-3">
                        {/* Le seuil, décomposé — on doit voir d'où il sort. Un jeu à
                            réserve pure n'en compose aucun : on ne montre pas un « Seuil 0 »
                            qui se lirait comme une mesure. */}
                        {((descripteur.seuil ?? []).length > 0 || descripteur.cible) && (
                            <div className="flex items-baseline gap-2 text-xs">
                                <span className="text-app-text/40 font-bold uppercase tracking-widest text-ui-9">
                                    {descripteur.cible ? 'Chances' : descripteur.tableDeBonus || destin ? 'Niveau' : 'Seuil'}
                                </span>
                                <span className="font-mono text-lg font-black text-accent">
                                    {jet.seuil}{descripteur.cible ? ' %' : ''}
                                </span>
                                {/*
                                    **L'explication vient du calcul, jamais d'ici.** Joindre
                                    les valeurs par « + » dit vrai sur un jeu qui additionne
                                    et faux sur un jeu qui multiplie : il aurait montré
                                    « 12 + 3 » sous une cible de 78.
                                */}
                                {jet.explicationDuSeuil ? (
                                    <span className="text-app-text/30 font-mono">
                                        = {jet.explicationDuSeuil}
                                        {jet.composantes.length > 0 && (
                                            <span className="ml-1 opacity-60">
                                                ({jet.composantes.map(c => c.champ).join(', ')})
                                            </span>
                                        )}
                                    </span>
                                ) : jet.composantes.length > 0 && (
                                    <span className="text-app-text/30 font-mono">
                                        = {jet.composantes.map(c => `${c.valeur}`).join(' + ')}
                                        <span className="ml-1 opacity-60">({jet.composantes.map(c => c.champ).join(' + ')})</span>
                                    </span>
                                )}
                            </div>
                        )}

                        {/*
                            **La poignée échelonnée se montre dé par dé.**

                            Un nombre seul — « 2 dés » — ne dirait rien ici : deux D6 et deux
                            D12 ne sont pas le même jet, et c'est la fiche qui décide. Le
                            joueur doit voir « Attribut D10 + Compétence D6 » pour reconnaître
                            son personnage dans ce qu'il lance.
                        */}
                        {jet.desEchelonnes.length > 0 && (
                            <div className="flex items-baseline gap-2 text-xs flex-wrap">
                                <span className="text-app-text/40 font-bold uppercase tracking-widest text-ui-9">Dés</span>
                                {jet.desEchelonnes.map((d, i) => (
                                    <span key={`${d.champ}-${i}`} className="font-mono">
                                        {i > 0 && <span className="text-app-text/30 mr-2">+</span>}
                                        <span className="text-lg font-black text-accent">D{d.faces}</span>
                                        <span className="text-app-text/30 ml-1">({d.label})</span>
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* La réserve, décomposée pour la même raison : un joueur d'Alien
                            doit voir que ses cinq dés sont « Force 4 + Pilotage 1 », et non
                            un nombre tombé du ciel. */}
                        {jet.composantesDeLaReserve.length > 0 && (
                            <div className="flex items-baseline gap-2 text-xs">
                                <span className="text-app-text/40 font-bold uppercase tracking-widest text-ui-9">{destin ? 'Domaine' : 'Réserve'}</span>
                                <span className="font-mono text-lg font-black text-accent">{jet.nombreDeDes}</span>
                                {regleJetAlien ? <span className="text-app-text/50">dés de base + {jet.desSecondaires} dés de Stress, après modificateurs</span> : <span className="text-app-text/30 font-mono">
                                    = {[
                                        ...(descripteur.reserve?.base ? [`${descripteur.reserve.base}`] : []),
                                        ...jet.composantesDeLaReserve.map(c => `${c.valeur}`),
                                        ...(jet.desAchetes > 0 ? [`${jet.desAchetes}`] : []),
                                    ].join(' + ')}
                                    {/* Le Potentiel actuel (Crimes, C2) : les marques se retirent de la réserve. */}
                                    {jet.garde?.atteintes && jet.garde.atteintes.actuel !== jet.garde.atteintes.base
                                        && ` − ${jet.garde.atteintes.base - jet.garde.atteintes.actuel} (atteintes)`}
                                    <span className="ml-1 opacity-60">
                                        ({[
                                            ...(descripteur.reserve?.base ? ['base'] : []),
                                            ...jet.composantesDeLaReserve.map(c => c.champ),
                                            ...(jet.desAchetes > 0 ? ['achetés'] : []),
                                        ].join(' + ')})
                                    </span>
                                </span>}
                            </div>
                        )}

                        {/*
                            **La garde** (Crimes) : combien de dés se gardent, et à quel
                            seuil chacun réussit — on doit voir d'où sortent les deux.
                        */}
                        {jet.garde && (
                            <div data-garde className="flex items-baseline gap-2 text-xs flex-wrap">
                                <span className="text-app-text/40 font-bold uppercase tracking-widest text-ui-9">Gardés</span>
                                <span className="font-mono text-lg font-black text-accent">{jet.garde.quota}</span>
                                <span className="text-app-text/30 font-mono">
                                    {jet.garde.niveau > 0
                                        ? `= ${jet.garde.competence?.label ?? 'compétence'} ${jet.garde.niveau}`
                                        : '— sans compétence, un seul dé'}
                                </span>
                                <span className="ml-3 text-app-text/40 font-bold uppercase tracking-widest text-ui-9">Seuil par dé</span>
                                <span className="font-mono text-lg font-black text-accent">{jet.garde.seuil}</span>
                                <span className="text-app-text/30 font-mono">
                                    {jet.garde.seuilImpose ? 'imposé (angoisse)'
                                        : jet.garde.specialisation ? `spécialisé (${jet.garde.specialisation.label})`
                                            : jet.garde.niveau > 0 ? 'compétent' : 'de base'}
                                    {/* Les circonstances (C0.1) : « seuil de 8 +1 −1 = 8 », p. 390. */}
                                    {!jet.garde.seuilImpose && jet.garde.modificateur !== 0
                                        && ` = ${jet.garde.seuilDeLaCompetence} ${jet.garde.modificateur > 0 ? '+' : '−'} ${Math.abs(jet.garde.modificateur)} (circonstances)`}
                                </span>
                            </div>
                        )}

                        {/* La seconde poule, nommée par le jeu. Elle se montre à part parce
                            qu'elle se compte à part : chez Alien, un 1 sur un dé de stress
                            déclenche la Panique, ce qu'un dé de base ne fait jamais. */}
                        {jet.desSecondaires > 0 && (
                            <div className="flex items-baseline gap-2 text-xs">
                                <span className="text-etat-alerte/60 font-bold uppercase tracking-widest text-ui-9">
                                    {descripteur.reserve?.secondaire?.label ?? 'Seconde réserve'}
                                </span>
                                <span className="font-mono text-lg font-black text-etat-alerte">{jet.desSecondaires}</span>
                                {jet.composantesDeLaSecondeReserve.length > 0 && (
                                    <span className="text-app-text/30 font-mono">
                                        ({jet.composantesDeLaSecondeReserve.map(c => c.champ).join(' + ')})
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/*
                    Ce que le calcul a dû supposer — hors de la table du livre, borné
                    à son dernier palier — s'affiche **avec les remarques du pilote**,
                    plus bas, et pas ici : le panneau en a déjà un endroit, et deux
                    listes de la même chose finissent par diverger.
                */}

                {/*
                    Ce qui manque se dit. Un champ absent de la fiche est une erreur
                    de configuration du pilote, et le joueur doit savoir pourquoi le
                    bouton refuse plutôt que de le voir grisé sans explication.
                */}
                {jet.avertissements.length > 0 && (
                    <ul className="space-y-1">
                        {jet.avertissements.map((a, i) => (
                            <li key={i} className="flex items-start gap-2 text-ui-11 text-etat-alerte/70">
                                <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {a}
                            </li>
                        ))}
                    </ul>
                )}

                {/*
                    Ce qui s'est raccordé malgré une dérive du pilote. Plus discret
                    que les avertissements — le jet est juste et part —, mais dit :
                    un défaut silencieux finit toujours par coûter plus cher qu'une
                    ligne de texte.
                */}
                {jet.remarques.length > 0 && (
                    <ul className="space-y-1">
                        {jet.remarques.map((r, i) => (
                            <li key={i} className="flex items-start gap-2 text-ui-10 text-app-text/35">
                                <Info size={11} className="mt-0.5 shrink-0" /> {r}
                            </li>
                        ))}
                    </ul>
                )}
            </Etape>

            {aPreparer && (
                <Etape numero={numeros.preparer} titre={regleJetAlien ? 'Préparer le test Alien' : 'Préparer'}
                    className="[&>[data-preparation-alien]]:border-0 [&>[data-preparation-alien]]:p-0 [&>[data-preparation-alien]>p:first-child]:hidden">
                    {/*
                        L'ajustement de difficulté, quand la cible se calcule. Il ne
                        s'affiche que là : sur un jeu qui compte des réussites, il n'a
                        aucun sens, et deux réglages nommés « difficulté » côte à côte
                        seraient exactement le piège que ce chantier a défait.
                    */}
                    {descripteur.cible && (
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-app-text/40 font-bold uppercase tracking-widest text-ui-9">
                                Difficulté
                            </span>
                            <input
                                type="range"
                                min={-10}
                                max={7}
                                value={ajustementDeDifficulte}
                                onChange={e => setAjustementDeDifficulte(Number(e.target.value))}
                                className="flex-1 accent-accent"
                            />
                            <span className="font-mono font-black text-accent w-8 text-right">
                                {ajustementDeDifficulte > 0 ? `+${ajustementDeDifficulte}` : ajustementDeDifficulte}
                            </span>
                        </div>
                    )}

                    {/*
                        **Les malus de péril, dits avant de lancer.** Ils retirent au
                        Domaine (donc aux dés de destin) et au Talent ; on nomme les états
                        qui les causent, pour que le joueur sache d'où vient le moins.
                    */}
                    {torg && (
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                            <label className="flex items-center gap-2">
                                <span className="text-ui-9 font-black uppercase tracking-widest text-app-text/40">Échec critique sur</span>
                                <select
                                    value={plageCritique}
                                    onChange={e => setPlageCritique(Number(e.target.value))}
                                    data-plage-critique
                                    title="Le livre l'étend selon le risque : rafale, axiomes, certains Atouts et pouvoirs"
                                    className="bg-app-bg/60 border border-app-border/40 rounded-lg px-2 py-1 text-ui-11 font-bold focus:outline-none focus:border-accent/50"
                                >
                                    <option value={1}>1</option>
                                    <option value={2}>1 – 2</option>
                                    <option value={3}>1 – 3</option>
                                    <option value={4}>1 – 4</option>
                                </select>
                            </label>
                            <label className="flex items-center gap-2" title="Livre p. 122 : −2 par cible supplémentaire ; toutes les cibles touchées subissent les dommages">
                                <span className="text-ui-9 font-black uppercase tracking-widest text-app-text/40">Cibles</span>
                                <select
                                    value={cibles}
                                    onChange={e => setCibles(Number(e.target.value))}
                                    data-cibles-multiples
                                    className="bg-app-bg/60 border border-app-border/40 rounded-lg px-2 py-1 text-ui-11 font-bold focus:outline-none focus:border-accent/50"
                                >
                                    {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}{n > 1 ? ` (−${malusDesCiblesMultiples(n)})` : ''}</option>)}
                                </select>
                            </label>
                            {malusTorg > 0 && (
                                <span className="text-etat-alerte/80" data-malus-de-torg>
                                    Malus : −{malusTorg} au total d'action — {raisonsDuMalusTorg}
                                </span>
                            )}
                            {unDePlusDeLaCarte && (
                                <span className="text-etat-succes/80" data-un-de-plus-de-la-carte>
                                    La carte d’Action accorde « Un de plus ! » aux Héros ce round.
                                </span>
                            )}
                            {!entraine && <span className="text-app-text/40 italic">Sans compétence : seul le 10 explose, pas le 20.</span>}
                            {champMagique && descripteur.torg?.choc && ecrireSurLaFiche && (
                                <label className="flex items-center gap-2" data-loi-de-la-magie
                                    title={`${loiMagie?.nom ?? 'Loi de la Magie'} : +1 par point de Choc, jusqu'aux rangs de la compétence (${rangsMagiques}). Annoncé avant le jet, il ne se récupère pas avant la fin du sort.`}>
                                    <span className="text-ui-9 font-black uppercase tracking-widest text-app-text/40">Choc volontaire</span>
                                    <input type="number" min={0} max={rangsMagiques} value={chocVolontaire}
                                        onChange={e => setChocVolontaire(Math.max(0, Math.min(rangsMagiques, Number(e.target.value) || 0)))}
                                        className="w-14 bg-app-bg/60 border border-app-border/40 rounded-lg px-2 py-1 text-xs font-mono font-bold focus:outline-none focus:border-accent/50" />
                                    <span className="text-app-text/40">max {rangsMagiques}</span>
                                </label>
                            )}
                            {annulation && ecrireSurLaFiche && descripteur.torg?.possibilites && (
                                <button
                                    type="button"
                                    disabled={possibilitesTorg <= 0}
                                    onClick={annuler}
                                    title="Une Possibilité, un test de Réalité contre ND 10 — avant que les dommages de l'attaque ne prennent effet"
                                    className="ml-auto px-3 py-1 rounded-lg border border-accent/40 bg-accent/10 text-accent text-ui-10 font-bold hover:bg-accent/20 transition-colors disabled:opacity-30"
                                >
                                    Annulation des dommages ({possibilitesTorg})
                                </button>
                            )}
                        </div>
                    )}

                    {destin && (malus.domaines > 0 || malus.talents > 0) && (
                        <p className="text-ui-11 text-etat-alerte/80">
                            Malus : {malus.domaines > 0 && `−${malus.domaines} au Domaine`}
                            {malus.domaines > 0 && malus.talents > 0 && ', '}
                            {malus.talents > 0 && `−${malus.talents} au Talent`} — {malus.etats.join(', ')}
                        </p>
                    )}

                    {destin && (
                        <div data-destin className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="text-ui-9 font-black uppercase tracking-widest text-app-text/40">Provoquer le destin</span>
                            <button
                                type="button"
                                onClick={() => setDesDeDestin(Math.max(0, desLances - 1))}
                                aria-label="Un dé de destin de moins"
                                className="p-1 rounded-md bg-app-bg/60 border border-app-border/40 hover:border-accent/40 transition-colors"
                            ><Minus size={12} /></button>
                            <span className="font-mono text-sm font-black w-6 text-center">{desLances}</span>
                            <button
                                type="button"
                                disabled={desLances >= plafondDuDestin}
                                onClick={() => setDesDeDestin(Math.min(plafondDuDestin, desLances + 1))}
                                aria-label="Un dé de destin de plus"
                                className="p-1 rounded-md bg-app-bg/60 border border-app-border/40 hover:border-accent/40 transition-colors disabled:opacity-30"
                            ><Plus size={12} /></button>
                            <span className="text-app-text/40">
                                sur {plafondDuDestin} — niveau {niveauDuDestin}
                                {desLances === 0 && ' : sans dé, le Talent seul contre la difficulté'}
                            </span>
                        </div>
                    )}

                    {disponiblesPerso.length > 0 && (
                        <ApportsDuGroupe
                            titre="Puiser dans ses réserves"
                            disponibles={disponiblesPerso}
                            choixDuJoueur={{}}
                            onChoisir={() => { /* un seul stock par réserve */ }}
                            onEngager={(id, points) => setEngagesPerso(e => ({ ...e, [id]: points }))}
                            resteDe={(_id, champ) => Math.max(0, niveauDuGroupe(valeurs, champ))}
                        />
                    )}

                    {apports.length > 0 && ficheDeGroupe && (
                        <ApportsDuGroupe
                            titre={`Puiser dans la ${ficheDeGroupe.libelle}`}
                            disponibles={disponibles}
                            choixDuJoueur={choixDesApports}
                            onChoisir={(id, champ) => {
                                setChoixDesApports(c => ({ ...c, [id]: champ }));
                                setEngages(e => ({ ...e, [id]: 0 }));
                            }}
                            onEngager={(id, points) => setEngages(e => ({ ...e, [id]: points }))}
                            resteDe={resteDe}
                        />
                    )}

                    {regleJetAlien && <PreparationAlien reglages={reglagesAlien} changer={setReglagesAlien} equipements={equipements} tir={tirAlien} />}
                    {combatAlien && equipementAlien?.proprietes?.munitions && <MunitionsAlien arme={equipementAlien} suivi={etatCombatAlien}
                        rapide={String(valeursAlien[combatAlien.talents] ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes('rechargement rapide')}
                        agir={(action,nombre,vide) => {
                            const s = lireLeCombatAlien({ ...valeursAlien, ...(refAlien.current.base === valeurs ? refAlien.current.maj : {}) });
                            const id = equipementAlien.id, a = s.armes[id];
                            if (action === 'recharger') { const apres = rechargerUneArme(s,id); if (apres !== s) { ecrireAlien({ [CLE_COMBAT_ALIEN]: apres }); redire('Rechargement', { total: 0, modifier: 0, rolls: [], totalDisplay: `${equipementAlien.nom} rechargée : un chargeur complet consommé ; action ${String(valeursAlien[combatAlien.talents] ?? '').toLowerCase().includes('rechargement rapide') ? 'rapide' : 'lente'}.` }); } }
                            else if (action === 'reserve' && a) ecrireAlien({ [CLE_COMBAT_ALIEN]: { ...s, armes: { ...s.armes, [id]: { ...a, chargeurs: nombre } } } });
                            else if (action === 'initialiser' && !a) ecrireAlien({ [CLE_COMBAT_ALIEN]: { ...s, armes: { ...s.armes, [id]: { vide, chargeurs: nombre } } } });
                        }} />}

                    {/*
                        Pas de champ pour ce que le jeu ne fixe pas : un sélecteur de
                        difficulté sur un jeu qui n'en a pas invite à en inventer une.

                        **Et pas non plus quand une cible est calculée.** Le
                        commentaire de l'ajustement, plus haut, affirmait que « deux
                        réglages nommés difficulté côte à côte » étaient le piège
                        « que ce chantier a défait ». Il ne l'était pas : les deux
                        gardes sont indépendants, et rien n'empêchait un pilote de
                        déclarer `cible` **et** `difficulte`. Le pilote de Rêves de
                        Dragons le faisait, et les deux s'affichaient — vu sur une
                        capture de David le 2026-08-23.

                        *L'exclusivité doit être écrite, pas supposée.* Ici la cible
                        l'emporte, comme partout ailleurs.
                    */}
                    {/*
                        **La spécialisation** (Star Trek) : cochée, chaque dé égal ou
                        inférieur à la composante nommée vaut deux réussites. La borne
                        se dit à côté, pour qu'on voie ce qu'elle change.
                    */}
                    {regleDune && <PreparationDune choix={choixDune} changer={c => setChoixDune(x => ({ ...x, ...c }))}
                        maxime={maximeDune} indisponible={suiviDune.bafoues.includes(principeDune)} determination={determinationDune}
                        specialisations={lignesDune(valeursDune[regleDune.specialisations])} retenirSpecialisation={s => setSpecialisation(!!s)} recupere={suiviDune.recuperes.includes(principeDune)}
                        peutEcrire={!!ecrireSurLaFiche} verrouille={!!duneDuLancer && !duneDuLancer.bilan.clos} meneur={!pourLesJoueurs} />}
                    {descripteur.specialisation && (
                        <label className="flex items-center gap-2" title="Chaque dé inférieur ou égal à cette valeur vaut deux réussites">
                            <input
                                type="checkbox"
                                checked={specialisation}
                                onChange={e => setSpecialisation(e.target.checked)}
                                className="accent-current"
                            />
                            <span className="text-ui-9 font-black uppercase tracking-widest text-app-text/40">
                                {descripteur.specialisation.label}
                                {specialisation && jet.doubleSous > (descripteur.critique ?? 0) && ` (critique ≤ ${jet.doubleSous})`}
                            </span>
                        </label>
                    )}

                    {/*
                        **La spécialisation d'un jet gardé** (Crimes) : seulement celles que
                        la fiche coche pour la compétence retenue. Appropriée, elle baisse le
                        seuil de chaque dé à 7 ; c'est au meneur d'en juger.
                    */}
                    {regleNephilim && (
                        <PreparationNephilim jet={jet.nephilim} choix={choixNephilim} changer={c => setChoixNephilim(x => ({ ...x, ...c }))} />
                    )}
                    {regleStarTrek && (
                        <PreparationStarTrek
                            choix={choixStarTrek}
                            changer={c => {
                                setChoixStarTrek(x => ({ ...x, ...c }));
                                // En opposition, la difficulté est le nombre de réussites du réactif (p. 256).
                                if (c.opposition) setDifficulte(oppositionDeLaTache(c.opposition.reussites, c.opposition.facteurs, 0).difficulte);
                            }}
                            choisirLaNature={nature => {
                                setChoixStarTrek(x => ({ ...x, nature }));
                                // Corps à corps : Audace + Sécurité, difficulté 1 ; à distance : Maîtrise + Sécurité, difficulté 2 (p. 290).
                                const [attr, fonc] = descripteur.seuil ?? [];
                                if (nature !== 'test' && attr && fonc) {
                                    setChoix(c => ({ ...c, [attr.id]: nature === 'melee' ? 'audace' : 'maitrise', [fonc.id]: 'securite' }));
                                    setDifficulte(nature === 'melee' ? 1 : 2);
                                }
                            }}
                            determination={determinationStarTrek}
                            difficulte={difficulte}
                            vaisseau={vaisseauStarTrek}
                            reussirSansLancer={() => redire(`${jet.composantes.map(c => c.label).join(' + ') || 'Tâche'} · difficulté 0`,
                                { total: 0, modifier: 0, rolls: [], tagSuccess: true, totalDisplay: 'Réussie sans lancer : ni Impulsion ni complication (p. 254).' })}
                        />
                    )}
                    {regleSymbaroum && (
                        <PreparationSymbaroum
                            nature={jet.composantes[0]?.champ && jet.composantes[0].champ === regleSymbaroum.defense ? 'defense' : natureSymbaroum}
                            changer={nature => {
                                setNatureSymbaroum(nature);
                                // La Défense se jette sur sa valeur secondaire (p. 164) ; un Talent peut en substituer une autre.
                                const composante = descripteur.seuil?.[0]?.id;
                                if (nature === 'defense' && composante && regleSymbaroum.defense) setChoix(c => ({ ...c, [composante]: regleSymbaroum.defense! }));
                            }}
                            grievement={optionsSymbaroum.degatsCritiques && lireSymbaroum(valeursSymbaroum).grievementTouche
                                ? { appliquer: () => setModificateur('desavantage') } : undefined}
                        />
                    )}
                    {descripteur.garde?.specialisations && (
                        <label className="flex items-center gap-2">
                            <span className="text-ui-9 font-black uppercase tracking-widest text-app-text/40">Spécialisation</span>
                            <select
                                value={jet.garde?.specialisation?.champ ?? ''}
                                onChange={e => setSpecialisationDeLaGarde(e.target.value)}
                                disabled={!jet.garde?.niveau || !jet.garde.specialisationsPossibles.length}
                                className="min-w-32 bg-app-bg/60 border border-app-border/40 rounded-lg px-2 py-1 text-ui-11 font-bold focus:outline-none focus:border-accent/50 disabled:opacity-40"
                            >
                                <option value="">
                                    {jet.garde?.specialisationsPossibles.length ? '— aucune —' : '— aucune cochée —'}
                                </option>
                                {jet.garde?.specialisationsPossibles.map(sp => (
                                    <option key={sp.champ} value={sp.champ}>{sp.label}</option>
                                ))}
                            </select>
                        </label>
                    )}

                    {/* **L'attaque** (Crimes, C6) : l'arme, la distance, l'opposition et la cible. */}
                    {descripteur.garde?.armes && (
                        <PreparationDeLAttaque reglages={reglagesDAttaque} atteintes={descripteur.garde.atteintes}
                            changer={r => setReglagesDAttaque(x => ({ ...x, ...r }))} />
                    )}
                    {/* Les circonstances du seuil (C0.1) : au tir, distance, cible, taille, angoisse. */}
                    {descripteur.garde?.circonstances && (
                        <CirconstancesDuSeuil circonstances={circonstances} tir={tirDeCrimes} angoisse={angoisseDuTireur}
                            changer={c => setCirconstances(x => ({ ...x, ...c }))}
                            seuilImpose={seuilDeBaseImpose} imposer={setSeuilDeBaseImpose} />
                    )}

                    {/*
                        **Une action hermétique** (Crimes, C0.3, p. 323-325) : on ne la tente
                        pas sans la spécialisation. Le menu liste celles de la compétence
                        retenue ; choisir une spécialisation que la fiche ne coche pas refuse
                        le jet, et le panneau dit pourquoi.
                    */}
                    {!!jet.garde?.hermetiques.length && (
                        <label className="flex items-center gap-2" title="Une action qui relève d'une compétence hermétique ne se tente pas sans la posséder">
                            <span className="text-ui-9 font-black uppercase tracking-widest text-app-text/40">Action hermétique</span>
                            <select value={jet.garde.actionHermetique?.champ ?? ''} onChange={e => setActionHermetique(e.target.value)} data-action-hermetique
                                className="bg-app-bg/60 border border-app-border/40 rounded-lg px-2 py-1 text-ui-11 font-bold focus:outline-none focus:border-accent/50">
                                <option value="">— non —</option>
                                {jet.garde.hermetiques.map(h => (
                                    <option key={h.champ} value={h.champ}>{h.label}{h.possede ? '' : ' (non possédée)'}</option>
                                ))}
                            </select>
                        </label>
                    )}

                    {/*
                        **Se dépasser** (Crimes, C3) : le livre veut l'annonce **avant** de
                        jeter les dés (p. 385). Une passion ou une conviction engagée, ou le
                        combat (une fois, p. 389) ; le meneur en juge.
                    */}
                    {jet.garde?.depassement && (
                        <label className="flex items-center gap-2"
                            title={jet.garde.depassement.raison
                                ?? 'Une passion ou une conviction est engagée (ou un combat) : le meneur en juge. Chaque réussite gardée en plus coûte une fatigue.'}>
                            <input
                                type="checkbox"
                                checked={depassementAnnonce && jet.garde.depassement.possible}
                                disabled={!jet.garde.depassement.possible}
                                onChange={e => setDepassementAnnonce(e.target.checked)}
                                data-depassement
                                className="accent-current"
                            />
                            <span className="text-ui-9 font-black uppercase tracking-widest text-app-text/40">
                                Se dépasser{!jet.garde.depassement.possible && ' — déjà fait dans cette scène'}
                            </span>
                        </label>
                    )}

                    {descripteur.difficulte && !descripteur.cible && (
                        <label className="flex items-center gap-2">
                            <span className="text-ui-9 font-black uppercase tracking-widest text-app-text/40">Difficulté</span>
                            <input
                                type="number"
                                min={descripteur.difficulte.min}
                                max={descripteur.difficulte.max}
                                value={difficulte}
                                onChange={e => setDifficulte(Number(e.target.value))}
                                className="w-14 bg-app-bg/60 border border-app-border/40 rounded-lg px-2 py-1 text-xs font-mono font-bold focus:outline-none focus:border-accent/50"
                            />
                        </label>
                    )}

                    {/*
                        **L'opposition et le modificateur, deux réglages qui s'ajoutent**
                        (Symbaroum, 2026-10-22). La valeur adverse se saisit : le calcul
                        `12 + (10 − 13)` se lit sous « Seuil », à l'étape Composer.
                        L'Avantage (+2) passe par le modificateur, même contre un adversaire.
                    */}
                    {seuilDeplacable?.opposition && (
                        <label className="flex items-center gap-2">
                            <span className="text-ui-9 font-black uppercase tracking-widest text-app-text/40">
                                {seuilDeplacable.opposition.label ?? 'Opposition'}
                            </span>
                            <input
                                type="number"
                                inputMode="numeric"
                                value={valeurAdverse}
                                placeholder="—"
                                onChange={e => setValeurAdverse(e.target.value)}
                                data-valeur-adverse
                                className="w-14 bg-app-bg/60 border border-app-border/40 rounded-lg px-2 py-1 text-xs font-mono font-bold focus:outline-none focus:border-accent/50"
                            />
                            {jet.modificationDuSeuil?.opposition && (
                                <span className="font-mono text-ui-11 text-app-text/50">
                                    {jet.modificationDuSeuil.opposition.modificateur > 0 ? '+' : jet.modificationDuSeuil.opposition.modificateur < 0 ? '−' : ''}
                                    {Math.abs(jet.modificationDuSeuil.opposition.modificateur)}
                                </span>
                            )}
                        </label>
                    )}
                    {seuilDeplacable && (
                        <label className="flex items-center gap-2">
                            <span className="text-ui-9 font-black uppercase tracking-widest text-app-text/40">Modificateur</span>
                            <input
                                type="range"
                                min={seuilDeplacable.min}
                                max={seuilDeplacable.max}
                                value={modificateurDuSeuil}
                                onChange={e => setModificateurDuSeuil(Number(e.target.value))}
                                data-modificateur-du-seuil
                                className="w-28 accent-accent"
                            />
                            <span className="font-mono font-black text-accent w-8 text-right">
                                {modificateurDuSeuil > 0 ? `+${modificateurDuSeuil}` : modificateurDuSeuil < 0 ? `−${-modificateurDuSeuil}` : '0'}
                            </span>
                        </label>
                    )}
                    {seuilDeplacable?.avantage && (
                        <label className="flex items-center gap-2" title="Encerclement, attaque surprise… : les avantages ne se cumulent pas">
                            <input
                                type="checkbox"
                                checked={avantageTactique}
                                onChange={e => setAvantageTactique(e.target.checked)}
                                data-avantage-tactique
                                className="accent-current"
                            />
                            <span className="text-ui-9 font-black uppercase tracking-widest text-app-text/40">
                                {seuilDeplacable.avantage.label ?? 'Avantage tactique'}
                                {` (+${seuilDeplacable.avantage.seuil}${seuilDeplacable.avantage.degats ? `, +${seuilDeplacable.avantage.degats.toUpperCase()} aux dégâts` : ''})`}
                            </span>
                        </label>
                    )}
                </Etape>
            )}

            <Etape numero={numeros.lancer} titre="Lancer les dés">
                {briseAlien && <p className="text-xs text-etat-danger">{synthetiqueAlien ? 'Arrêt du système : aucun test ordinaire ; réactivation et réparation par Comtech.' : `${etatCombatAlien.mort ? 'Mort' : 'Brisé'} : aucun test de compétence ordinaire. Les premiers soins et le Trépas ont leurs gestes séparés.`}</p>}
                <div className="flex flex-wrap items-center gap-4">
                    {/* Réserve : les dés supplémentaires s'achètent, jusqu'au plafond du système.
                        Pas chez Crimes : le Potentiel dit le nombre de dés, rien ne s'y ajoute. */}
                    <div className={`flex items-center gap-2 ${destin || torg || regleJetAlien || descripteur.garde ? 'hidden' : ''}`}>
                        <span className="text-ui-9 font-black uppercase tracking-widest text-app-text/40">Dés</span>
                        <button
                            onClick={() => setDesAchetes(d => Math.max(0, d - 1))}
                            className="p-1 rounded-md bg-app-bg/60 border border-app-border/40 hover:border-accent/40 transition-colors"
                        ><Minus size={12} /></button>
                        <span className="font-mono text-sm font-black w-6 text-center">{jet.nombreDeDes}</span>
                        <button
                            /* Le plafond se compte à partir de la réserve RÉELLE du
                               personnage, composantes comprises — sinon un joueur
                               d'Alien à cinq dés pourrait en acheter dix de plus. */
                            onClick={() => setDesAchetes(d => Math.min(
                                (descripteur.reserve?.max ?? 0)
                                    - (descripteur.reserve?.base ?? 0)
                                    - jet.composantesDeLaReserve.reduce((s, c) => s + c.valeur, 0),
                                d + 1,
                            ))}
                            className="p-1 rounded-md bg-app-bg/60 border border-app-border/40 hover:border-accent/40 transition-colors"
                        ><Plus size={12} /></button>
                    </div>

                    {/*
                        Le prix des dés achetés, ventilé. « 3 — 2 d'Impulsion,
                        1 de Menace » : ce qui part chez le meneur se voit avant
                        le lancer, pas après.
                    */}
                    {ventilation && (
                        <span
                            className="flex items-center gap-1.5 text-ui-10 font-bold text-etat-alerte/80"
                            title="Coût des dés supplémentaires"
                        >
                            <Coins size={11} />
                            {ventilation.surLaReserve > 0 && (
                                <span>{ventilation.surLaReserve} {nomDe(jet.cout.ressource)}</span>
                            )}
                            {ventilation.reporte > 0 && (
                                <span className="text-etat-danger/80">
                                    {ventilation.surLaReserve > 0 && '+ '}
                                    {ventilation.reporte} {nomDe(ventilation.ressourceDeReport)}
                                </span>
                            )}
                        </span>
                    )}

                    {/*
                        **« Dont en Menace »** (Dune, lot D2) : le joueur paie tout ou
                        partie en Menace, même avec de l'Impulsion en réserve. À zéro,
                        la règle d'avant : l'Impulsion d'abord, le manque en Menace.
                    */}
                    {reportAuChoix && jet.cout.total > 0 && (
                        <span data-paiement-au-choix className="flex items-center gap-1.5">
                            <span className="text-ui-9 font-black uppercase tracking-widest text-app-text/40">
                                dont en {nomDe(reportAuChoix)}
                            </span>
                            <button
                                onClick={() => setEnReport(Math.max(0, choisiEnReport - 1))}
                                aria-label={`Un point de moins en ${nomDe(reportAuChoix)}`}
                                className="p-1 rounded-md bg-app-bg/60 border border-app-border/40 hover:border-accent/40 transition-colors"
                            ><Minus size={12} /></button>
                            <span className="font-mono text-sm font-black w-5 text-center">{choisiEnReport}</span>
                            <button
                                onClick={() => setEnReport(Math.min(jet.cout.total, choisiEnReport + 1))}
                                aria-label={`Un point de plus en ${nomDe(reportAuChoix)}`}
                                className="p-1 rounded-md bg-app-bg/60 border border-app-border/40 hover:border-accent/40 transition-colors"
                            ><Plus size={12} /></button>
                        </span>
                    )}

                    {/*
                        **Avantage / Désavantage — la règle de Dice OS, à l'identique.**

                        Deux dés, on garde le meilleur ou le moins bon. Le sélecteur
                        ne paraît que là où un seul dé tranche : sur une réserve, il
                        n'y a pas de meilleur dé, et l'offrir inviterait à inventer
                        une règle que le jeu n'a pas.

                        Il reste affiché après le lancer, et c'est délibéré — un
                        modificateur qui se remettrait seul à zéro se rejouerait sans
                        qu'on le voie, et un qui persiste se lit à l'écran.
                    */}
                    {avantagePossible && (
                        <label className="flex items-center gap-2">
                            <span className="text-ui-9 font-black uppercase tracking-widest text-app-text/40">Tirage</span>
                            <select
                                value={modificateur}
                                onChange={e => setModificateur(e.target.value as typeof modificateur)}
                                title={jet.sens === 'sous-ou-egal'
                                    ? 'Deux dés : l’Avantage garde le plus BAS, le Désavantage le plus haut'
                                    : 'Deux dés : l’Avantage garde le plus HAUT, le Désavantage le plus bas'}
                                className={`bg-app-bg/60 border rounded-lg px-2 py-1 text-ui-11 font-bold focus:outline-none focus:border-accent/50 ${
                                    modificateur === 'avantage'
                                        ? 'border-etat-succes/50 text-etat-succes'
                                        : modificateur === 'desavantage'
                                            ? 'border-etat-danger/50 text-etat-danger'
                                            : 'border-app-border/40 text-app-text/60'
                                }`}
                            >
                                <option value="aucun">Normal</option>
                                <option value="avantage">{libellesDuTirage.avantage}</option>
                                <option value="desavantage">{libellesDuTirage.desavantage}</option>
                            </select>
                        </label>
                    )}
                    {descripteur.desEchelonnes && (
                        <label className="flex items-center gap-2" title="Un allié présent apporte le dé de son niveau dans la compétence du jet — à déclarer avant de lancer (p. 57)">
                            <span className="text-ui-9 font-black uppercase tracking-widest text-app-text/40">Soutien</span>
                            <select
                                aria-label="Soutien"
                                value={soutien}
                                onChange={e => setSoutien(e.target.value)}
                                className="bg-app-bg/60 border border-app-border/40 rounded-lg px-2 py-1 text-ui-11 font-bold focus:outline-none focus:border-accent/50 text-app-text/70"
                            >
                                <option value="">Aucun</option>
                                {allies.map(a => <option key={a.id} value={`pj:${a.id}`}>{a.nom} ({a.lettre})</option>)}
                                {['A', 'B', 'C', 'D'].map(l => <option key={l} value={l}>Un PNJ de niveau {l} (D{facesDuNiveau(l)})</option>)}
                            </select>
                        </label>
                    )}
                    {souvenirDisponible && (
                        <label className="flex items-center gap-2 text-ui-11" title={`« ${souvenirDeLaFiche} » — expliquez comment il vous soutient (p. 56)`}>
                            <input type="checkbox" checked={souvenirAuJet} onChange={e => setSouvenirAuJet(e.target.checked)} data-souvenir-cle />
                            <span className="text-ui-9 font-black uppercase tracking-widest text-app-text/40">Souvenir clé</span>
                            <span className="text-app-text/50">avantage, une fois par séance</span>
                        </label>
                    )}

                    <button
                        onClick={lancer}
                        disabled={!pret || briseAlien || (!!suiteDuDestin && suiteDuDestin.personnageId === personnageId) || (!!regleDune && (suiviDune.bafoues.includes(principeDune) || (!!duneDuLancer && !duneDuLancer.bilan.clos)))}
                        className={`ml-auto w-full sm:w-auto min-h-[44px] px-10 py-3 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all ${
                            pret
                                ? 'bg-accent text-app-on-accent hover:scale-105 active:scale-95'
                                : 'bg-app-text/5 text-app-text/20 cursor-not-allowed'
                        }`}
                    >
                        Lancer
                    </button>
                </div>
            </Etape>

            {suiteDuDestin && suiteDuDestin.personnageId === personnageId && <section aria-label="Dés supplémentaires de destin" className="space-y-2 rounded-xl border border-accent/40 p-3">
                <p className="text-sm text-app-text">{suiteDuDestin.texte}</p>
                <p className="text-xs text-app-muted">{suiteDuDestin.disponibles} dé(s) supplémentaire(s) offert(s) par les 10. Chaque nouveau dé peut aussi apporter du Fiel. Fiel et Singularité sont réglés à chaque lancer ; vous choisissez quand arrêter.</p>
                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={suiteDuDestin.ajouter} className="rounded border border-accent px-3 py-2 text-accent">Lancer un dé supplémentaire</button>
                    <button type="button" onClick={suiteDuDestin.terminer} className="rounded border border-app-border px-3 py-2 text-app-text">Garder ce résultat</button>
                </div>
            </section>}
            {resultat && (
                <Etape numero={numeros.resultat} titre="Résultat" droite={verdictDuResultat}>
                    <div className="flex flex-wrap gap-2">
                        {resultat.rolls.map((d, i) => {
                            const val = typeof d.val === 'number' ? d.val : 0;
                            /*
                              **Le dé écarté se montre, et ne compte pour rien.**
                              C'est le dé qu'on a évité — un joueur doit voir de
                              quoi l'Avantage l'a sauvé. Mais lui appliquer les
                              couleurs du critique ou de la complication
                              annoncerait un événement qui n'a pas eu lieu.
                            */
                            const ecarte = d.isDropped === true;
                            // Star Trek : chaque dé porte son propre seuil — les dés d'aide ont leur critique (2026-10-23).
                            const aideStarTrek = d.cssClass === 'aide-star-trek' || d.cssClass === 'aide-dune' ? d.displayStr : undefined;
                            const critique = !ecarte && ((regleStarTrek && starTrekDuLancer) || (regleDune && duneDuLancer) ? !!d.isCritMax : descripteur.critique !== undefined && val <= jet.doubleSous);
                            const complique = !ecarte && ((regleStarTrek && starTrekDuLancer) || (regleDune && duneDuLancer) ? !!d.isCritMin : descripteur.complication !== undefined && val >= descripteur.complication);
                            /*
                              **Quel dé a déclenché, et pas seulement combien.**
                              Un compte de Paniques sans savoir lequel des huit
                              dés l'a causée n'aide personne à raconter la scène.
                              La seconde poule se distingue à l'œil, et son 1
                              porte le nom que le jeu lui donne.
                            */
                            const seconde = d.source === 'gear';
                            const declenche = seconde && d.isCritMin;
                            // Jet gardé : un 1 gardé d'office, et les autres dés qu'on peut échanger.
                            const unGarde = !!gardeDuResultat && !ecarte && val === 1;
                            const echangeable = !!gardeDuResultat && val !== 1 && gardeDuResultat.depassement === 0
                                && gardeDuResultat.quota > resultat.rolls.filter(r => r.val === 1).length;
                            const nomDuUn = descripteur.reserve?.secondaire?.libelleDuUn ?? 'Fléau';
                            /*
                              **Le nom sous le dé** (maquette du 2026-10-22) : on lit un dé sans
                              dépendre de sa couleur. Seulement ce que le code sait : « Succès »
                              n'est écrit que sur une réserve de dés égaux sans seuil (Year Zero),
                              où le succès est la face maximale ; ailleurs, un 7 réussi sur un D10
                              resterait sans nom à côté d'un 10 nommé.
                            */
                            const mention = aideStarTrek ? `${aideStarTrek}${critique ? ' · 2' : complique ? ' · compl.' : ''}`
                                : ecarte ? 'Écarté'
                                : gardeDuResultat ? (unGarde ? 'Un' : d.isCritMax ? 'Réussite' : 'Gardé')
                                : declenche ? nomDuUn
                                : seconde ? descripteur.reserve?.secondaire?.label
                                : critique ? 'Critique'
                                : complique ? 'Complication'
                                : d.isCritMax && compteDeReussites && !(descripteur.seuil ?? []).length && jet.desEchelonnes.length === 0 ? 'Succès'
                                : undefined;
                            return (
                                <span
                                    key={i}
                                    {...(echangeable ? {
                                        role: 'button', tabIndex: 0, 'data-de-de-la-garde': i,
                                        onClick: () => changerLaGarde(i),
                                        onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); changerLaGarde(i); } },
                                    } : {})}
                                    title={echangeable ? (ecarte ? 'Garder ce dé à la place du meilleur gardé' : 'Écarter ce dé au profit du meilleur écarté')
                                        : unGarde ? 'Un 1 : gardé d’office'
                                        : ecarte ? 'Dé écarté — celui que le tirage n’a pas retenu'
                                        : declenche ? nomDuUn
                                        : seconde ? descripteur.reserve?.secondaire?.label
                                        : critique ? 'Deux réussites'
                                        : complique ? 'Complication' : undefined}
                                    className={`min-w-11 h-12 px-1 rounded-lg flex flex-col items-center justify-center font-mono text-base font-black border ${
                                        ecarte
                                            ? 'bg-transparent border-dashed border-app-border/30 text-app-text/25 line-through'
                                        : declenche
                                            ? 'bg-etat-alerte/25 border-etat-alerte text-etat-alerte shadow-[0_0_10px_rgba(251,191,36,0.35)]'
                                        : unGarde
                                            ? 'bg-etat-danger/20 border-etat-danger/50 text-etat-danger'
                                            : critique
                                                ? 'bg-etat-succes/20 border-etat-succes/50 text-etat-succes'
                                                : d.isCritMax
                                                    ? 'bg-etat-succes/10 border-etat-succes/20 text-etat-succes/80'
                                                    : complique
                                                        ? 'bg-etat-danger/20 border-etat-danger/50 text-etat-danger'
                                                        : seconde
                                                            ? 'bg-app-text/5 border-dashed border-etat-alerte/40 text-app-text/50'
                                                            : 'bg-app-text/5 border-app-border/30 text-app-text/40'
                                    }${d.relance ? ' ring-2 ring-accent/50' : ''}${d.cssClass === 'reussite-depensee' ? ' ring-2 ring-etat-succes/60' : ''}${echangeable ? ' cursor-pointer hover:border-accent/60' : ''}`}
                                >
                                    {val}
                                    {mention && <span className="font-sans text-ui-8 font-black uppercase tracking-wide leading-none">{mention}</span>}
                                </span>
                            );
                        })}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                        {/* « difficulté 0 » ne voulait rien dire sur un jeu qui
                            n'en gradue aucune : il en faut une, et c'est ça
                            qu'on annonce. */}
                        {/*
                            **Un compte de réussites n'a de sens que sur une réserve.**
                            Sous une Sauvegarde, un pourcentage ou le jet de Torg, il
                            écrivait « 0 réussite / 1 requise » à côté d'un verdict
                            réussi (vu sur les captures du manuel, 2026-10-13) : on y
                            dit plutôt ce que le moteur a calculé.
                        */}
                        {compteDeReussites ? (
                            <span className="text-app-text/50 font-mono">
                                {reussites} réussite{reussites > 1 ? 's' : ''}
                                {bonusDuLancer > 0 && ` (dont +${bonusDuLancer} ${ficheDeGroupe?.libelle ?? 'groupe'})`}
                                {descripteur.difficulte
                                    ? ` / difficulté ${regleStarTrek && starTrekDuLancer ? starTrekDuLancer.difficulte : difficulte}`
                                    : ` / ${jet.reussitesRequises} requise${jet.reussitesRequises > 1 ? 's' : ''}`}
                                {/* Star Trek : ce que l'aide a donné, ou pourquoi elle ne compte pas (p. 256). */}
                                {regleStarTrek && starTrekDuLancer && resultat.totalDisplay.replace(/^\d+ réussites?/, '')}
                            </span>
                        ) : (
                            <span className="text-app-text/50 font-mono">{resultat.totalDisplay}</span>
                        )}
                        {/*
                            **Les 1 de la seconde poule, nommés par le jeu.**

                            `rollYZE` les compte comme des « fléaux » — un terme
                            générique de la famille Year Zero. Chez Alien, ce
                            sont des **Paniques**, et le mot compte : c'est lui
                            qui dit au meneur d'ouvrir la table de Panique. On
                            affiche donc ce que le pilote déclare, et « fléau »
                            seulement à défaut.

                            **On annonce, on ne déclenche pas.** Jouer la
                            Panique est une décision de table — l'outil tient le
                            compte, il n'arbitre pas.
                        */}
                        {/* Un 1 gardé de Crimes n'est pas un fléau : le bilan le compte déjà. */}
                        {(resultat?.fails ?? 0) > 0 && !gardeDuResultat && (
                            <span className="text-etat-alerte font-black uppercase tracking-widest">
                                {resultat!.fails} {regleDune ? 'complication' : descripteur.reserve?.secondaire?.libelleDuUn ?? 'fléau'}
                                {resultat!.fails! > 1 ? 's' : ''}
                            </span>
                        )}
                        {/* L'excédent alimente la monnaie de table — et depuis
                            le mur n° 4, il y est réellement versé. */}
                        {v.excedent > 0 && !regleJetAlien && !gardeDuResultat && (
                            <span className="text-etat-alerte/80 font-mono">
                                +{v.excedent}{monnaie && jet.cout.ressource ? ` ${nomDe(jet.cout.ressource)}` : ' excédent'}
                            </span>
                        )}
                        {gardeDuResultat && effetsSurLaNevrose(gardeDuResultat).map(effet => (
                            <span key={effet} className="text-etat-alerte/80 font-mono">{effet}</span>
                        ))}
                        {/*
                            **La Névrose du jet, écrite** (Crimes, C4, p. 409) : ce que le panneau dit
                            sous les dés, le meneur le note d'un clic — une fois par lancer.
                        */}
                        {regleDune && duneDuLancer && (
                            <SuitesDune key={duneDuLancer.compte} resultat={resultat} des={duneDuLancer.des} choix={duneDuLancer.choix}
                                bilan={duneDuLancer.bilan} difficulte={duneDuLancer.difficulte} determination={determinationDune}
                                maximeAlignee={duneDuLancer.choix.maximeAlignee && !!suiviDune.maximes[duneDuLancer.principe]}
                                valeurs={valeursDune} regle={regleDune} ecrire={ecrireSurLaFiche ? ecrireDune : undefined} reserver={!!monnaie} meneur={!pourLesJoueurs}
                                remplacer={des => {
                                    const nouveau = resultatDune(des, duneDuLancer.choix.marge, duneDuLancer.difficulte);
                                    setDuneDuLancer(d => d && { ...d, des, bilan: bilanDune(nouveau.successes ?? 0, d.difficulte, d.choix.bonus) });
                                    setResultat(nouveau); redire('Dune · relance sélective', nouveau);
                                }}
                                depenser={(montant, motif) => {
                                    if (!monnaie) return false;
                                    try {
                                        const r = depenserDune(duneDuLancer.bilan, montant, useRessourcesDeTableStore.getState().valeur(campaignId!, ressourcesDeTable!, duneDuLancer.choix.ennemi ? 'menace' : 'impulsion'));
                                        if (r.table) mouvoir(duneDuLancer.choix.ennemi ? 'menace' : 'impulsion', -r.table, motif);
                                        setDuneDuLancer(d => d && { ...d, bilan: r.bilan }); return true;
                                    } catch (e) { setMouvements(m => [...m, (e as Error).message]); return false; }
                                }}
                                racheter={() => {
                                    if (!monnaie) return false;
                                    const ennemi = duneDuLancer.choix.ennemi;
                                    if (ennemi && useRessourcesDeTableStore.getState().valeur(campaignId!, ressourcesDeTable!, 'menace') < 2) return false;
                                    mouvoir('menace', ennemi ? -2 : 2, 'Dune : complication rachetée'); return true;
                                }}
                                ecrireDetermination={apres => ecrireDune({ [regleDune.determination]: apres, [CLE_DUNE]: { ...suiviDune, determinationDansLaScene: true } })}
                                mitiger={n => {
                                    const nouveau = { ...resultat, totalDisplay: `${resultat.totalDisplay} — réussite mitigée : ${n} complication(s) de plus ; test échoué, aucune dépense d’Impulsion` };
                                    setResultat(nouveau); redire('Dune · réussite mitigée', nouveau);
                                }}
                                clore={depenseDuDefenseur => {
                                    const r = conserverDune(duneDuLancer.bilan, monnaie ? useRessourcesDeTableStore.getState().valeur(campaignId!, ressourcesDeTable!, 'impulsion') : 0, duneDuLancer.choix.ennemi);
                                    if (r.verse) mouvoir(duneDuLancer.choix.ennemi ? 'menace' : 'impulsion', r.verse, 'Dune : reliquat du test');
                                    if (!pourLesJoueurs && duneDuLancer.choix.opposition?.pnj && !resultat.tagSuccess) {
                                        const duDefenseur = Math.max(0, duneDuLancer.difficulte - (resultat.successes ?? 0));
                                        const reliquat = Math.max(0, duDefenseur - entierDune(depenseDuDefenseur, 0, duDefenseur));
                                        if (reliquat) mouvoir('menace', reliquat, 'Dune : Impulsion inutilisée du défenseur ennemi');
                                    }
                                    if (duneDuLancer.choix.contradiction === 'bafouer' && ecrireSurLaFiche) ecrireDune({ [CLE_DUNE]: noterDune({ ...suiviDune, bafoues: [...new Set([...suiviDune.bafoues, duneDuLancer.principe])] }, `Principe bafoué après résolution : ${duneDuLancer.principe}`) });
                                    setDuneDuLancer(d => d && { ...d, bilan: r.bilan });
                                    redire('Dune · fin du test', { total: 0, modifier: 0, rolls: [], totalDisplay: `${r.verse} conservé(s), ${r.perdu} perdu(s) (bonus ou plafond)` });
                                }}
                                consigner={(titre, ligne) => redire(titre, { total: 0, modifier: 0, rolls: [], totalDisplay: ligne })} />
                        )}
                        {regleStarTrek && starTrekDuLancer && (
                            <SuitesStarTrek key={starTrekDuLancer.compte} resultat={resultat} des={starTrekDuLancer.des}
                                complication={starTrekDuLancer.complication} difficulte={starTrekDuLancer.difficulte} choix={starTrekDuLancer.choix}
                                determination={determinationStarTrek} meneur={!pourLesJoueurs}
                                remplacer={(des, motif) => {
                                    const nouveau = resultatDeStarTrek(des, starTrekDuLancer.complication, starTrekDuLancer.difficulte);
                                    // L'Impulsion déjà versée suit le nouveau compte (p. 253 : le nouveau jet remplace l'ancien).
                                    const ecart = verdict(nouveau.successes ?? 0, starTrekDuLancer.difficulte).excedent - verdict(resultat.successes ?? 0, starTrekDuLancer.difficulte).excedent;
                                    if (ecart !== 0 && monnaie && jet.cout.ressource) setMouvements(m => [...m, ...mouvoir(jet.cout.ressource!, ecart, motif).avertissements, `${ecart > 0 ? '+' : ''}${ecart} ${nomDe(jet.cout.ressource!)} (${motif})`]);
                                    setStarTrekDuLancer(d => d && { ...d, des });
                                    setResultat(nouveau);
                                    redire(`${dernierLancer?.titre ?? 'Tâche'} · ${motif}`, nouveau);
                                }}
                                mitiger={() => {
                                    const mitige: RollResult = { ...resultat, successes: Math.max(resultat.successes ?? 0, starTrekDuLancer.difficulte), tagSuccess: true, degre: 'reussite-normale',
                                        totalDisplay: `${resultat.totalDisplay} — réussite mitigée : une complication de plus, pas d’Impulsion à dépenser` };
                                    setResultat(mitige);
                                    redire(`${dernierLancer?.titre ?? 'Tâche'} · réussite mitigée`, mitige);
                                }}
                                mouvoir={(ressource, delta, motif) => {
                                    if (!monnaie) return;
                                    setMouvements(m => [...m, ...mouvoir(ressource, delta, motif).avertissements, `${delta > 0 ? '+' : ''}${delta} ${nomDe(ressource)} (${motif})`]);
                                }}
                                ecrireDetermination={apres => regleStarTrek.determination && ecrireStarTrek({ [regleStarTrek.determination]: apres })}
                                consigner={(titre, ligne) => redire(titre, { total: 0, modifier: 0, rolls: [], totalDisplay: ligne })} />
                        )}
                        {regleSymbaroum && symbaroumDuLancer && ecrireSurLaFiche && (
                            <SuitesSymbaroum key={symbaroumDuLancer.compte} regle={regleSymbaroum} nature={symbaroumDuLancer.nature}
                                resultat={resultat} seuil={seuilDuLancer} avantage={symbaroumDuLancer.avantage}
                                degatsDeLAvantage={descripteur.modificateurDuSeuil?.avantage?.degats}
                                options={optionsSymbaroum} valeurs={valeursSymbaroum} ecrire={ecrireSymbaroum}
                                consigner={(titre, ligne) => redire(titre, { total: 0, modifier: 0, rolls: [], totalDisplay: ligne })}
                                relancer={symbaroumDuLancer.dejaRelance ? undefined : () => { relanceSymbaroum.current = true; lancer(); }} />
                        )}
                        {regleNephilim && nephilimDuLancer && ecrireSurLaFiche && (() => {
                            // Le PS du critique d'un Art occulte peut soigner une Chute : il ne se note plus alors (p. 149).
                            const suiteDeSapience = suites.find(s => s.quand === 'critique' && s.ajouter?.champ === regleNephilim.sapience);
                            const champSapience = regleNephilim.sapience;
                            return (
                                <SuitesNephilim regle={regleNephilim} jet={nephilimDuLancer.jet} degre={resultat.degre} degres={nephilimDuLancer.degres}
                                    valeurs={valeursNephilim} sections={template.sections} ecrire={ecrireNephilim}
                                    consigner={(titre, ligne) => redire(titre, { total: 0, modifier: 0, rolls: [], totalDisplay: ligne })}
                                    ajouterUnJetonDeTraque={regleNephilim.table?.traque ? () => setMouvements(m => [...m,
                                        ...mouvoir(regleNephilim.table!.traque!, 1, `${dernierLancer?.titre ?? 'Jet'}, Traque`).avertissements, 'Jauge de Traque +1']) : undefined}
                                    relancer={lancer}
                                    sapienceDuCritique={suiteDeSapience && champSapience ? {
                                        notee: !!suitesNotees[suiteDeSapience.label],
                                        depenser: () => {
                                            if (suitesNotees[suiteDeSapience.label]) {
                                                const avant = Number(valeursNephilim[champSapience]) || 0;
                                                ecrireNephilim({ [champSapience]: Math.max(0, avant - 1) });
                                            }
                                            setSuitesNotees(n => ({ ...n, [suiteDeSapience.label]: 'Point de Sapience dépensé pour soigner une Chute' }));
                                        },
                                    } : undefined} />
                            );
                        })()}
                        {gardeDuResultat && descripteur.garde?.psychologie && ecrireSurLaFiche && !pourLesJoueurs && (() => {
                            const d = nevroseDuJet(gardeDuResultat);
                            if (d === 0) return null;
                            if (nevroseNotee) return <span className="font-mono text-etat-alerte" data-nevrose-notee>{nevroseNotee}</span>;
                            const champ = descripteur.garde.psychologie.nevrose;
                            return (
                                <button data-noter-la-nevrose onClick={() => {
                                    const avant = Math.max(0, Number(valeursDesAtteintes[champ]) || 0);
                                    const apres = Math.max(0, avant + d);
                                    ecrireLesAtteintes({ [champ]: apres });
                                    const dit = `Névrose ${avant} → ${apres} (${d > 0 ? '+' : ''}${d}, jet)`;
                                    setNevroseNotee(dit);
                                    redire('Névrose', { total: 0, modifier: 0, rolls: [], totalDisplay: dit });
                                }}
                                    className="px-2 py-1 rounded-lg border border-etat-alerte/50 text-etat-alerte text-ui-10 font-black uppercase tracking-widest hover:bg-etat-alerte/10">
                                    Noter : Névrose {d > 0 ? '+' : ''}{d}
                                </button>
                            );
                        })()}
                        {/* Le test en opposition (C1, p. 385) : hors d'une attaque, qui l'emporte et de combien. */}
                        {gardeDuResultat && !reglagesDAttaque.arme && (
                            <OppositionDeCrimes reussites={gardeDuResultat.reussites} uns={gardeDuResultat.uns} />
                        )}
                        {/* L'issue de l'attaque (C6) : touché ou non, le calcul du livre, et « Infliger ». */}
                        {gardeDuResultat && descripteur.garde?.armes && reglagesDAttaque.arme && (
                            <IssueDeLAttaque reglages={reglagesDAttaque} resultat={resultat as JetGarde}
                                atteintes={descripteur.garde.atteintes}
                                physiqueAttaquant={gardeDuLancer?.atteintes?.potentiel === (descripteur.garde.atteintes?.incapacite ?? 'physique')
                                    ? gardeDuLancer.atteintes.actuel
                                    : Number(valeursDesAtteintes[descripteur.garde.atteintes?.incapacite ?? 'physique']) || 0}
                                peutInfliger={!pourLesJoueurs}
                                maitrise={jet.garde?.niveau}
                                {...(descripteur.garde.munitions && ecrireSurLaFiche ? {
                                    munitions: {
                                        valeur: Math.max(0, Number(valeursDesAtteintes[descripteur.garde.munitions]) || 0),
                                        ecrire: (n: number) => ecrireLesAtteintes({ [descripteur.garde!.munitions!]: Math.max(0, n) }),
                                    },
                                } : {})}
                                infligee={attaqueInfligee}
                                onInfligee={ligne => {
                                    setAttaqueInfligee(ligne);
                                    setMouvements(m => [...m, ligne]);
                                    redire('Attaque', { total: 0, modifier: 0, rolls: [], totalDisplay: ligne });
                                }} />
                        )}
                        {/*
                            **Les points d'enquête du jet** (Crimes, C5, p. 436) : au meneur, qui
                            juge si la routine fait avancer l'affaire. Le compte suit la règle
                            générale ; seuls les styles que l'enquêteur possède se proposent.
                        */}
                        {gardeDuResultat && stylesDEnquete && ecrireSurLaFiche && !pourLesJoueurs && (() => {
                            const n = pointsDuJet(gardeDuResultat.bilan, gardeDuResultat.reussites);
                            if (n === 0) return null;
                            if (enqueteNotee) return <span className="text-gm-gold font-mono" data-enquete-notee>{enqueteNotee}</span>;
                            return stylesDEnquete.filter(st => peutGagner(valeursDesAtteintes, st)).map(st => (
                                <button key={st.id} data-point-d-enquete={st.id}
                                    title={`Si la routine de ${st.label} fait avancer l’enquête (p. 436)`}
                                    onClick={() => {
                                        const apres = apresLeGain(valeursDesAtteintes, st, n);
                                        ecrireLesAtteintes({ [st.points]: apres });
                                        const dit = `${st.label} ${n > 0 ? '+' : ''}${n} → ${apres}`;
                                        setEnqueteNotee(dit);
                                        redire('Points d’enquête', { total: 0, modifier: 0, rolls: [], totalDisplay: dit });
                                    }}
                                    className="px-2 py-1 rounded-lg border border-gm-gold/40 text-gm-gold text-ui-10 font-black uppercase tracking-widest hover:bg-gm-gold/10">
                                    {n > 0 ? '+' : ''}{n} {st.label}
                                </button>
                            ));
                        })()}
                        {/* Le dépassement annoncé : garder une ou plusieurs réussites de plus, une fatigue chacune. */}
                        {gardeDuResultat && gardeDuLancer?.depassement?.annonce && gardeDuLancer.depassement.possible
                            && gardeDuLancer.atteintes && ecrireSurLaFiche && gardeDuResultat.depassement === 0 && (
                            gardeDuResultat.reussitesNonGardees > 0
                                ? Array.from({ length: gardeDuResultat.reussitesNonGardees }, (_, i) => i + 1).map(n => (
                                    <button key={n} onClick={() => seDepasser(n)} data-se-depasser={n}
                                        className="px-3 py-1 rounded-lg border border-etat-alerte/50 text-etat-alerte text-ui-10 font-black uppercase tracking-widest hover:bg-etat-alerte/10">
                                        Se dépasser : +{n} réussite{n > 1 ? 's' : ''} ({n} fatigue)
                                    </button>
                                ))
                                : <span className="text-app-text/40 font-mono">Aucune réussite hors de la garde : rien à dépasser.</span>
                        )}
                        {gardeDuResultat && gardeDuResultat.gardes.join(',') !== gardeAuJournal && (
                            <button
                                onClick={consignerLaGarde}
                                className="px-3 py-1 rounded-lg border border-accent/40 text-accent text-ui-10 font-black uppercase tracking-widest hover:bg-accent/10"
                            >
                                Consigner cette garde
                            </button>
                        )}
                        {complications > 0 && (
                            <span className="text-etat-danger/80 font-mono">
                                {complications} complication{complications > 1 ? 's' : ''}
                            </span>
                        )}
                        {/* Torg ne lance pas sous un seuil : son calcul dit déjà le ND. Une
                            réserve sans seuil (NOC, Alien) affichait « sous 0 ». */}
                        {!descripteur.tableDeBonus && !destin && seuilDuLancer > 0 && (
                            <span className="ml-auto text-app-text/25 font-mono text-ui-10">sous {seuilDuLancer}</span>
                        )}
                    </div>

                    {/*
                        **L'Impulsion du jet que la réserve pleine ne garde pas** (Dune,
                        lot D2) : elle se dépense sur ce test, ou se verse quand la
                        réserve a fait de la place — sinon elle est perdue, et c'est dit.
                    */}
                    {impulsionDuJet && monnaie && jet.cout.ressource && (
                        <div data-impulsion-du-jet className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-bold text-etat-alerte">
                                {impulsionDuJet.reste} {nomDe(jet.cout.ressource)} hors réserve
                            </span>
                            <span className="text-app-text/50">
                                la réserve est pleine : à dépenser sur ce test, sinon perdu{impulsionDuJet.reste > 1 ? 's' : ''}.
                            </span>
                            <button type="button"
                                onClick={() => {
                                    const reste = impulsionDuJet.reste - 1;
                                    setImpulsionDuJet(reste > 0 ? { ...impulsionDuJet, reste } : null);
                                    setMouvements(m => [...m, `1 ${nomDe(jet.cout.ressource)} du jet dépensé sur le test.`]);
                                }}
                                className="px-3 py-1 rounded-lg border border-accent/40 bg-accent/10 text-accent text-ui-10 font-bold hover:bg-accent/20 transition-colors">
                                Dépenser un point
                            </button>
                            <button type="button"
                                onClick={() => {
                                    const dits = mouvoir(jet.cout.ressource!, impulsionDuJet.reste,
                                        `${impulsionDuJet.enTete}, reliquat de l'Impulsion du jet`).avertissements;
                                    setImpulsionDuJet(null);
                                    setMouvements(m => [...m, `Reliquat versé à la réserve.`, ...dits]);
                                }}
                                className="px-3 py-1 rounded-lg border border-app-border/40 text-ui-10 font-bold hover:border-accent/40 transition-colors">
                                Verser à la réserve
                            </button>
                        </div>
                    )}

                    {/*
                        **Compléter le test de Torg.** Chaque geste ne sert qu'une fois ; la
                        relance favorisée seulement avant les autres ; rien après un échec
                        critique — « aucune Possibilité ne peut modifier ce jet ».
                    */}
                    {torg && testDeTorg && resultat && !torgCritique && (
                        <div data-gestes-de-torg className="flex flex-wrap items-center gap-2">
                            {!testDeTorg.des.relance && !testDeTorg.des.possibilite && !testDeTorg.des.unDePlus && (
                                <button type="button" onClick={() => completerTorg('relance')}
                                    className="px-3 py-1 rounded-lg border border-app-border/40 text-ui-10 font-bold hover:border-accent/40 transition-colors">
                                    Relancer (compétence favorisée)
                                </button>
                            )}
                            {!testDeTorg.des.possibilite && ecrireSurLaFiche && descripteur.torg?.possibilites && (
                                <button type="button" disabled={possibilitesRestantes <= 0} onClick={() => completerTorg('possibilite')}
                                    className="px-3 py-1 rounded-lg border border-accent/40 bg-accent/10 text-accent text-ui-10 font-bold hover:bg-accent/20 transition-colors disabled:opacity-30">
                                    Dépenser une Possibilité ({possibilitesRestantes})
                                </button>
                            )}
                            {loiAction && testDeTorg.des.possibilite && !testDeTorg.des.possibiliteDeLAction && ecrireSurLaFiche && descripteur.torg?.possibilites && (
                                <button type="button" disabled={possibilitesRestantes <= 0} onClick={() => completerTorg('action')}
                                    title={loiAction.texte}
                                    className="px-3 py-1 rounded-lg border border-accent/40 bg-accent/10 text-accent text-ui-10 font-bold hover:bg-accent/20 transition-colors disabled:opacity-30">
                                    {loiAction.nom} : seconde Possibilité ({possibilitesRestantes})
                                </button>
                            )}
                            {!testDeTorg.des.unDePlus && (
                                <button type="button" onClick={() => completerTorg('unDePlus')}
                                    className={`px-3 py-1 rounded-lg border text-ui-10 font-bold hover:border-accent/40 transition-colors ${
                                        unDePlusDeLaCarte ? 'border-etat-succes/60 bg-etat-succes/10 text-etat-succes' : 'border-app-border/40'}`}>
                                    Un de plus !
                                </button>
                            )}
                        </div>
                    )}

                    {/*
                        **Forcer le jet, jouer la Panique** (Year Zero). Le bouton se grise
                        avec sa raison — une Panique, un forçage déjà fait, un androïde —,
                        jamais en silence.
                    */}
                    {/* **La Fortune** (Cthulhu Hack) : sous un jet raté, placer un jeton pour relancer, deux pour réussir. */}
                    {fortuneOfferte && fortune && (
                        <div data-fortune className="flex flex-wrap items-center gap-2">
                            <span className="text-ui-10 text-app-text/50">{fortune.label ?? 'Fortune'} : {jetonsDeFortune} / {fortune.max}</span>
                            <button type="button" onClick={() => placerLaFortune('relance')} disabled={jetonsDeFortune + fortune.relance > fortune.max}
                                className="px-3 py-1 rounded-lg border border-accent/40 bg-accent/10 text-accent text-ui-10 font-bold hover:bg-accent/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                                Relancer (+{fortune.relance} {fortune.label ?? 'Fortune'})
                            </button>
                            <button type="button" onClick={() => placerLaFortune('reussite')} disabled={jetonsDeFortune + fortune.reussite > fortune.max}
                                className="px-3 py-1 rounded-lg border border-etat-succes/50 bg-etat-succes/10 text-etat-succes text-ui-10 font-bold hover:bg-etat-succes/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                                Réussir (+{fortune.reussite} {fortune.label ?? 'Fortune'})
                            </button>
                        </div>
                    )}

                    {resultat && dernierLancer && (regleDuForcage || paniqueDeclenchee || reussiteDepensee) && (
                        <div data-gestes-year-zero className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                                {regleDuForcage && (
                                    <button type="button" onClick={forcer} disabled={!!raisonDeNePasForcer}
                                        className="px-3 py-1 rounded-lg border border-accent/40 bg-accent/10 text-accent text-ui-10 font-bold hover:bg-accent/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                                        Forcer le jet{forcage.fois > 0 ? ` (${forcage.fois + 1}e fois)` : ''}
                                    </button>
                                )}
                                {reussiteDepensee && compteDeReussites && (
                                    <button type="button" onClick={depenserUneReussite} disabled={briseAlien || pointsDisponibles <= 0 || paniqueEnAttente || actionAnnulee || (regleJetAlien && (suiviJetAlien?.eclats.length ?? 0) > 0)}
                                        className="px-3 py-1 rounded-lg border border-etat-succes/50 bg-etat-succes/10 text-etat-succes text-ui-10 font-bold hover:bg-etat-succes/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                                        Dépenser un {reussiteDepensee.label} ({pointsDisponibles})
                                    </button>
                                )}
                                {paniqueDeclenchee && !paniqueJouee && (
                                    <button type="button" onClick={jouerLaPanique}
                                        className="px-3 py-1 rounded-lg border border-etat-alerte/60 bg-etat-alerte/10 text-etat-alerte text-ui-10 font-bold hover:bg-etat-alerte/20 transition-colors">
                                        Test de {libelleDuUn ?? 'Panique'}
                                    </button>
                                )}
                                {paniqueEnAttente && suitesAlien?.talents && String(valeursAlien[suitesAlien.talents] ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('folie meurtriere') && (
                                    <label className="text-xs flex gap-2"><input type="checkbox" checked={folieMeurtriere} onChange={e => setFolieMeurtriere(e.target.checked)} />Ennemis en vue : Folie meurtrière remplace 11+</label>
                                )}
                                {(paniqueEnAttente || actionAnnulee) && <p className="text-etat-alerte">
                                    {paniqueEnAttente ? 'Résultat provisoire : résoudre la Panique avant les effets du test.' : 'Action annulée : les réussites et le Point de Récit ne contournent pas la Panique.'}
                                </p>}
                            </div>
                            {/*
                              **Relancer malgré une réussite** (Blade Runner, « Forcer un jet ») : un D10
                              ou un D12 qui n'en montre qu'une peut viser deux — ou la perdre.
                            */}
                            {regleDuForcage && !raisonDeNePasForcer && forcage.fois === 0 && souvenirDisponible && !souvenirDuJet && (
                                <button type="button" data-souvenir-apres
                                    onClick={() => { marquerLeSouvenir(); setSouvenirDuJet('apres'); setMouvements(m => [...m, 'Souvenir clé : un dé de plus au forçage (une fois par séance).']); }}
                                    title={`« ${souvenirDeLaFiche} » — après le jet et avant de le forcer : un dé supplémentaire (p. 56)`}
                                    className="self-start px-3 py-1 rounded-lg border border-accent/40 text-accent text-ui-10 font-bold hover:bg-accent/10">
                                    Souvenir clé : un dé de plus au forçage
                                </button>
                            )}
                            {stressDuSouvenir && regleBR && (
                                <div data-souvenir-rate className="flex flex-wrap items-center gap-2 text-ui-10 text-etat-alerte">
                                    <span>Raté malgré le souvenir clé et un forçage : 1 point de stress (p. 56).</span>
                                    <button type="button" className="px-2 py-0.5 rounded-lg border border-etat-alerte/50 hover:bg-etat-alerte/10"
                                        onClick={() => {
                                            const reste = Math.max(0, lireLeNombre(regleBR.sangFroid) - 1);
                                            ecrireSurLaFiche?.({ [regleBR.sangFroid]: reste });
                                            setForcage(f => ({ ...f, ecrits: { ...f.ecrits, [regleBR.sangFroid]: reste } }));
                                            setStressDuSouvenir(false);
                                            setMouvements(m => [...m, `Souvenir clé raté : Sang-froid −1 → ${reste}`]);
                                        }}>
                                        −1 Sang-froid
                                    </button>
                                </div>
                            )}
                            {regleDuForcage?.relancerUneReussite && !raisonDeNePasForcer && resultat.rolls.some(relancableMalgreSaReussite) && (
                                <div data-relancer-aussi className="flex flex-wrap items-center gap-2 text-ui-10 text-app-text/60">
                                    <span>Relancer aussi, au risque de perdre la réussite :</span>
                                    {resultat.rolls.map((d, i) => relancableMalgreSaReussite(d) && (
                                        <label key={i} className="flex items-center gap-1 rounded-md border border-app-border/40 px-2 py-0.5">
                                            <input
                                                type="checkbox"
                                                checked={aRelancerAussi.includes(i)}
                                                onChange={e => setARelancerAussi(a => e.target.checked ? [...a, i] : a.filter(x => x !== i))}
                                            />
                                            D{d.sides} ({d.val})
                                        </label>
                                    ))}
                                </div>
                            )}
                            {regleDuForcage && raisonDeNePasForcer && (
                                <p className="flex items-start gap-2 text-ui-10 text-app-text/40">
                                    <Info size={11} className="mt-0.5 shrink-0" /> {raisonDeNePasForcer}
                                </p>
                            )}
                            {brises.map(b => {
                                const effet = effetsDuBrise[b.champ];
                                return (
                                    <div key={b.champ} data-brise={b.champ} className="space-y-1 rounded-lg border border-etat-danger/40 bg-etat-danger/10 p-2">
                                        <p className="text-ui-11 font-black uppercase tracking-widest text-etat-danger">{b.label}</p>
                                        <p className="text-ui-11 text-app-text/70">{b.rappel}</p>
                                        {b.de && !effet && (
                                            <button type="button" onClick={() => jouerLeBrise(b)}
                                                className="px-3 py-1 rounded-lg border border-etat-danger/60 text-etat-danger text-ui-10 font-bold hover:bg-etat-danger/20 transition-colors">
                                                Lancer l’effet critique ({nomDuChamp(b.de)})
                                            </button>
                                        )}
                                        {effet && (
                                            <div className="text-ui-11">
                                                <p className="font-bold text-etat-danger">
                                                    D{effet.faces} = {effet.de}{effet.entree ? ` — ${effet.entree.title}` : ''}
                                                </p>
                                                {effet.entree?.effect && <p className="text-app-text/80">{effet.entree.effect}</p>}
                                                {!effet.entree && b.table && (
                                                    <p className="text-app-text/50">{pourLesJoueurs ? 'Le meneur lit la ligne dans la table.' : 'Cherchez ce résultat dans la table du jeu.'}</p>
                                                )}
                                                {effet.perte && <p className="font-bold text-etat-danger">{effet.perte}</p>}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/*
                        Ce que le lancer a fait aux réserves de la table : un
                        report en Menace, un gain refusé par le plafond. Une
                        réserve qui bouge sans le dire est exactement le genre
                        de silence qu'on traque.
                    */}
                    {mouvements.length > 0 && (
                        <ul className="space-y-1 pt-1 border-t border-app-border/20">
                            {mouvements.map((m, i) => (
                                <li key={i} className="flex items-start gap-2 text-ui-11 text-etat-alerte/70">
                                    <Coins size={11} className="mt-0.5 shrink-0" /> {m}
                                </li>
                            ))}
                        </ul>
                    )}

                    {paniqueJouee && (
                        <div data-test-de-panique className="rounded-lg border border-etat-alerte/40 bg-etat-alerte/10 p-2 space-y-1">
                            <p className="text-ui-11 font-black uppercase tracking-widest text-etat-alerte">
                                Test de {libelleDuUn ?? 'Panique'} : {paniqueJouee.de} + {paniqueJouee.niveau}{paniqueJouee.modificateur ? ' −2 (Nerfs d’acier)' : ''} = {paniqueJouee.total}
                                {paniqueJouee.cumule ? ` ; déjà en panique (${paniqueJouee.precedent}) : ${paniqueJouee.effectif}` : ''}
                                {paniqueJouee.entree ? ` — ${paniqueJouee.entree.title}` : ''}
                            </p>
                            {paniqueJouee.entree ? (
                                <>
                                    {paniqueJouee.entree.description && (
                                        <p className="text-ui-11 text-app-text/70">{paniqueJouee.entree.description}</p>
                                    )}
                                    {paniqueJouee.entree.effect && (
                                        <p className="text-ui-11 font-bold text-app-text/80">{paniqueJouee.entree.effect}</p>
                                    )}
                                </>
                            ) : (
                                <p className="text-ui-10 text-app-text/50">
                                    {pourLesJoueurs ? 'Le meneur lit la ligne dans la table.' : 'Cherchez ce total dans la table du jeu.'}
                                </p>
                            )}
                        </div>
                    )}

                    {suites.map(suite => {
                        const maladresse = suite.quand === 'maladresse';
                        const notee = suitesNotees[suite.label];
                        const pas = suite.ajouter?.pas ?? 1;
                        return (
                            <div key={suite.label} data-suite-du-critique={suite.quand}
                                className={`rounded-lg border p-2 space-y-1 ${maladresse ? 'border-etat-danger/40 bg-etat-danger/10' : 'border-etat-succes/40 bg-etat-succes/10'}`}>
                                <p className={`text-ui-11 font-black uppercase tracking-widest ${maladresse ? 'text-etat-danger' : 'text-etat-succes'}`}>{suite.label}</p>
                                {suite.rappel && <p className="text-ui-11 text-app-text/70">{suite.rappel}</p>}
                                {suite.ajouter && champDuGeste(suite) && ecrireSurLaFiche && !notee && (
                                    <button type="button" onClick={() => noterLaSuite(suite)}
                                        className={`px-3 py-1 rounded-lg border text-ui-10 font-bold transition-colors ${maladresse
                                            ? 'border-etat-danger/60 text-etat-danger hover:bg-etat-danger/20'
                                            : 'border-etat-succes/60 text-etat-succes hover:bg-etat-succes/20'}`}>
                                        Noter {pas > 0 ? '+' : '−'}{Math.abs(pas)} {nomDuChamp(champDuGeste(suite)!)}
                                    </button>
                                )}
                                {notee && <p className={`text-ui-11 font-bold ${maladresse ? 'text-etat-danger' : 'text-etat-succes'}`}>{notee}</p>}
                            </div>
                        );
                    })}
                </Etape>
            )}

            {regleJetAlien && suiviJetAlien && ecrireSurLaFiche && (
                <CarteDuJeu id="dernier-test-alien" titre={`Dernier test Alien — ${suiviJetAlien.nomCompetence}`}>
                    <SuitesDuJetAlien jet={suiviJetAlien} ecrire={(suite, texte) => {
                        // Une ancienne fermeture de rendu ne doit pas dépenser deux fois le même budget.
                        const actuel = lireLeJetAlien({ ...valeursAlien, ...(refAlien.current.base === valeurs ? refAlien.current.maj : {}) });
                        if (!actuel || actuel.id !== suite.id || actuel.eclats.length !== suiviJetAlien.eclats.length) return;
                        dernierJetAlien.current = suite;
                        ecrireAlien({ [CLE_JET_ALIEN]: suite });
                        const res = resultatDuJetAlien(resultat ?? { total: 0, modifier: 0, rolls: [], totalDisplay: '' }, suite);
                        if (resultat) setResultat(res);
                        redire(`Alien — ${suite.nomCompetence}`, { ...res, totalDisplay: `${res.totalDisplay} — ${texte}` });
                    }} />
                </CarteDuJeu>
            )}
            {descripteur.garde?.atteintes && ecrireSurLaFiche && (
                <CarteDuJeu id="atteintes-crimes" titre="Potentiels et atteintes">
                    <AtteintesDesPotentiels
                        regle={descripteur.garde.atteintes}
                        valeurs={valeursDesAtteintes}
                        libelleDe={id => template.sections.flatMap(sec => sec.fields).find(f => f.id === id)?.label ?? id}
                        ecrire={ecrireLesAtteintes}
                        consigner={ligne => redire('Atteintes', { total: 0, modifier: 0, rolls: [], totalDisplay: ligne })}
                    />
                </CarteDuJeu>
            )}
            {descripteur.garde?.psychologie && ecrireSurLaFiche && (() => {
                const regle = descripteur.garde.psychologie;
                // Le Mental du test psychotique, marques comprises (C2).
                const marques = descripteur.garde.atteintes?.parPotentiel[regle.mental];
                const n = (c?: string) => (c ? Math.max(0, Number(valeursDesAtteintes[c]) || 0) : 0);
                const mental = potentielActuel(Number(valeursDesAtteintes[regle.mental]) || 0,
                    { fatigue: n(marques?.fatigue), epuisement: n(marques?.epuisement), blessures: n(marques?.blessures) });
                return (
                    <CarteDuJeu id="psychologie-crimes" titre="Psychologie">
                        <PsychologieDeCrimes regle={regle} valeurs={valeursDesAtteintes} mentalActuel={mental}
                            ecrire={ecrireLesAtteintes}
                            consigner={(titre, ligne) => redire(titre, { total: 0, modifier: 0, rolls: [], totalDisplay: ligne })} />
                    </CarteDuJeu>
                );
            })()}
            {(descripteur.garde?.fortune || (descripteur.garde?.contacts && !pourLesJoueurs)) && ecrireSurLaFiche && (
                <CarteDuJeu id="contacts-fortune-crimes" titre={pourLesJoueurs || !descripteur.garde.contacts ? 'Fortune' : 'Contacts et fortune'}>
                    <ContactsEtFortune contacts={descripteur.garde.contacts} fortune={descripteur.garde.fortune}
                        psychose={descripteur.garde.psychologie?.psychose} meneur={!pourLesJoueurs}
                        valeurs={valeursDesAtteintes} ecrire={ecrireLesAtteintes}
                        consigner={(titre, ligne) => redire(titre, { total: 0, modifier: 0, rolls: [], totalDisplay: ligne })} />
                </CarteDuJeu>
            )}
            {descripteur.garde?.creation && ecrireSurLaFiche && (
                <CarteDuJeu id="creation-crimes" titre="Création et progression">
                    <CreationDeCrimes regle={descripteur.garde.creation} psychologie={descripteur.garde.psychologie}
                        competences={descripteur.garde.specialisations?.parCompetence ?? {}}
                        valeurs={valeursDesAtteintes}
                        libelleDe={id => template.sections.flatMap(sec => sec.fields).find(f => f.id === id)?.label ?? id}
                        ecrire={maj => {
                            const nombres = Object.fromEntries(Object.entries(maj).filter(([, v]) => typeof v === 'number')) as Record<string, number>;
                            const textes = Object.fromEntries(Object.entries(maj).filter(([, v]) => typeof v !== 'number'));
                            if (Object.keys(nombres).length) ecrireLesAtteintes(nombres);
                            if (Object.keys(textes).length) ecrireSurLaFiche(textes);
                        }}
                        consigner={(titre, ligne) => redire(titre, { total: 0, modifier: 0, rolls: [], totalDisplay: ligne })} />
                </CarteDuJeu>
            )}
            {regleNephilim && ecrireSurLaFiche && (() => {
                const consigner = (titre: string, ligne: string) => redire(titre, { total: 0, modifier: 0, rolls: [], totalDisplay: ligne });
                return (
                    <>
                        {regleNephilim.sante && (
                            <CarteDuJeu id="sante-nephilim" titre="Santé et dommages">
                                <SanteNephilim regle={regleNephilim} valeurs={valeursNephilim} ecrire={ecrireNephilim} consigner={consigner} />
                            </CarteDuJeu>
                        )}
                        {regleNephilim.chutes && (
                            <CarteDuJeu id="chutes-nephilim" titre="Les Chutes">
                                <ChutesNephilim regle={regleNephilim} valeurs={valeursNephilim} ecrire={ecrireNephilim} consigner={consigner} meneur={!pourLesJoueurs} />
                            </CarteDuJeu>
                        )}
                        {regleNephilim.stase && (
                            <CarteDuJeu id="stase-nephilim" titre="La stase">
                                <StaseNephilim regle={regleNephilim} valeurs={valeursNephilim} ecrire={ecrireNephilim} consigner={consigner} />
                            </CarteDuJeu>
                        )}
                        {regleNephilim.experience && !pourLesJoueurs && (
                            <CarteDuJeu id="experience-nephilim" titre="Expérience">
                                <ExperienceNephilim regle={regleNephilim} valeurs={valeursNephilim} sections={template.sections} ecrire={ecrireNephilim} consigner={consigner} />
                            </CarteDuJeu>
                        )}
                    </>
                );
            })()}
            {regleDune && ecrireSurLaFiche && <CarteDuJeu id="carnet-dune" titre="Dune : principes, atouts et progression">
                <CarnetDune regle={regleDune} valeurs={valeursDune} ecrire={ecrireDune} meneur={!pourLesJoueurs}
                    consigner={(titre, ligne) => redire(titre, { total: 0, modifier: 0, rolls: [], totalDisplay: ligne })} />
            </CarteDuJeu>}
            {regleStarTrek && ecrireSurLaFiche && (() => {
                const consigner = (titre: string, ligne: string) => redire(titre, { total: 0, modifier: 0, rolls: [], totalDisplay: ligne });
                const champsDe = (ids: string[] | undefined) => (ids ?? []).map(i => ({ id: i, label: template.sections.flatMap(sec => sec.fields).find(f => f.id === i)?.label ?? i }));
                return (
                    <>
                        {regleStarTrek.stress && (
                            <CarteDuJeu id="stress-star-trek" titre="Stress et blessures">
                                <StressEtBlessuresStarTrek regle={regleStarTrek} valeurs={valeursStarTrek} ecrire={ecrireStarTrek} consigner={consigner} meneur={!pourLesJoueurs}
                                    attributs={champsDe(regleStarTrek.attributs)}
                                    payerImpulsion={monnaie ? (cout, motif) => setMouvements(m => [...m, ...mouvoir('impulsion', -cout, motif).avertissements, `−${cout} Impulsion (${motif})`]) : undefined} />
                            </CarteDuJeu>
                        )}
                        <CarteDuJeu id="tour-star-trek" titre="Le tour de conflit"><TourStarTrek /></CarteDuJeu>
                        {!pourLesJoueurs && regleStarTrek.reputation && (
                            <CarteDuJeu id="reputation-star-trek" titre="Réputation de fin de mission">
                                <ReputationStarTrek regle={regleStarTrek} valeurs={valeursStarTrek} ecrire={ecrireStarTrek} consigner={consigner} />
                            </CarteDuJeu>
                        )}
                        {!pourLesJoueurs && (regleStarTrek.attributs || regleStarTrek.fonctions) && (
                            <CarteDuJeu id="creation-star-trek" titre="Création et progression"><CreationStarTrek regle={regleStarTrek} valeurs={valeursStarTrek} /></CarteDuJeu>
                        )}
                    </>
                );
            })()}
            {regleSymbaroum && ecrireSurLaFiche && (() => {
                const consigner = (titre: string, ligne: string) => redire(titre, { total: 0, modifier: 0, rolls: [], totalDisplay: ligne });
                const props = { regle: regleSymbaroum, valeurs: valeursSymbaroum, ecrire: ecrireSymbaroum, consigner };
                const libelle = (id: string) => template.sections.flatMap(sec => sec.fields).find(f => f.id === id)?.label ?? id;
                return (
                    <>
                        {regleSymbaroum.endurance && (
                            <CarteDuJeu id="endurance-symbaroum" titre="Endurance et agonie">
                                <EnduranceSymbaroum {...props} meneur={!pourLesJoueurs} />
                            </CarteDuJeu>
                        )}
                        {regleSymbaroum.corruption && (
                            <CarteDuJeu id="corruption-symbaroum" titre="Corruption et Stigmates">
                                <CorruptionSymbaroum {...props} />
                            </CarteDuJeu>
                        )}
                        <CarteDuJeu id="tour-symbaroum" titre="Le tour de combat"><TourSymbaroum /></CarteDuJeu>
                        {regleSymbaroum.argent && (
                            <CarteDuJeu id="bourse-symbaroum" titre="Bourse"><BourseSymbaroum {...props} /></CarteDuJeu>
                        )}
                        {!pourLesJoueurs && (
                            <>
                                <CarteDuJeu id="derivees-symbaroum" titre="Valeurs dérivées"><DeriveesSymbaroum {...props} libelle={libelle} /></CarteDuJeu>
                                <CarteDuJeu id="progression-symbaroum" titre="Création et progression"><ProgressionSymbaroum {...props} /></CarteDuJeu>
                                <CarteDuJeu id="voyage-symbaroum" titre="Voyage"><VoyageSymbaroum {...props} /></CarteDuJeu>
                            </>
                        )}
                        {campagne && (
                            <CarteDuJeu id="options-symbaroum" titre="Règles optionnelles">
                                <OptionsSymbaroum proposees={regleSymbaroum.options} options={optionsSymbaroum}
                                    changer={pourLesJoueurs ? undefined : o => updateCampaign(campagne.id, { reglesOptionnelles: { ...campagne.reglesOptionnelles, ...o } })} />
                            </CarteDuJeu>
                        )}
                    </>
                );
            })()}
            {combatAlien?.actions&&<ActionsAlien personnageId={personnageId} joueur={pourLesJoueurs}/>}
            {combatAlien?.progression&&ecrireSurLaFiche&&<ProgressionAlien regle={combatAlien} valeurs={valeursAlien} ecrire={ecrireAlien} personnageId={personnageId} campaignId={campaignId} joueur={pourLesJoueurs}/>}
            {combatAlien && ecrireSurLaFiche && (
                <CarteDuJeu id="sante-alien" titre="Blessures et soins">
                    <SanteAlien regle={combatAlien} valeurs={valeursAlien} ecrire={ecrireAlien}
                        personnageId={personnageId} campaignId={campaignId} pourLesJoueurs={pourLesJoueurs} consigner={redire} />
                </CarteDuJeu>
            )}
            {suitesAlien && ecrireSurLaFiche && (
                <CarteDuJeu id="panique-alien" titre="Stress et Panique">
                    <PaniqueAlien regle={suitesAlien} champPanique={descripteur.panique?.champ}
                        valeurs={valeursAlien} ecrire={ecrireAlien} personnageId={personnageId}
                        campaignId={campaignId} pourLesJoueurs={pourLesJoueurs} consigner={redire} />
                </CarteDuJeu>
            )}
            {descripteur.cthulhuHack && ecrireSurLaFiche && <SuiviCthulhuHack key={personnageId} regle={descripteur.cthulhuHack} valeurs={valeursCH} ecrire={ecrireCH}
                maxPV={useSessionOSStore.getState().players.flatMap(p=>p.characters).find(c=>c.id===personnageId)?.maxHp
                    ?? Number(template.sections.flatMap(s=>s.fields).find(f=>f.id===descripteur.cthulhuHack?.pv)?.defaultValue)}
                joueur={pourLesJoueurs} libelle={id=>template.sections.flatMap(s=>s.fields).find(f=>f.id===id)?.label??id}
                consigner={(titre,texte)=>redire(titre,{total:0,modifier:0,rolls:[],totalDisplay:texte})}/>}
            {/* **Le stress subi** (Blade Runner) : au meneur, sous le jet — un geste à part, sans lancer le test. */}
            {descripteur.stressSubi && ecrireSurLaFiche && !pourLesJoueurs && (
                <StressSubi
                    regle={descripteur.stressSubi}
                    valeurs={{ ...valeurs, ...forcage.ecrits }}
                    nom={String(valeurs.nom || valeurs.name || 'Personnage')}
                    ecrire={maj => { setForcage(f => ({ ...f, ecrits: { ...f.ecrits, ...maj } })); ecrireSurLaFiche(maj); }}
                />
            )}
        </div>
    );
};

export default PanneauDeJet;
