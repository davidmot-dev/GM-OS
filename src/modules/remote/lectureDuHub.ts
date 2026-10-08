import { estObjet } from './actions/contratsSessionDistante';
import type { DonneesDuHub, HorlogesDuHub, CombatDuHub, CarteDuHub, TableauDuHub, SessionDuHub, DesDuHub, JetTransmis, RegleDuHub } from './types/donneesDuHub';
import type { ProjectedEntity } from '../image/types';
import type { ApparenceTablettes } from '../../theme/apparenceTablettes';
import type { EtatsDuHub } from '../../utils/magasinsDuHub';

const texte = (v: unknown) => typeof v === 'string';
const nombre = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
const booleen = (v: unknown) => typeof v === 'boolean';
const nullable = (verifier: (v: unknown) => boolean) => (v: unknown) => v === null || verifier(v);
const choix = (...valeurs: string[]) => (v: unknown) => typeof v === 'string' && valeurs.includes(v);
const tableau = (verifier: (v: unknown) => boolean) => (v: unknown) => Array.isArray(v) && v.every(verifier);
const dictionnaire = (verifier: (v: unknown) => boolean) => (v: unknown) => estObjet(v) && Object.values(v).every(verifier);
const identifie = (v: unknown) => estObjet(v) && texte(v.id);
const nomme = (v: unknown) => identifie(v) && estObjet(v) && texte(v.name);
const point = (v: unknown) => estObjet(v) && nombre(v.x) && nombre(v.y);
const outil = choix('brush', 'eraser', 'rect', 'circle', 'laser', 'pion', 'cible', 'regle');
const trace = (v: unknown) => identifie(v) && estObjet(v) && tableau(point)(v.points)
    && texte(v.color) && nombre(v.width) && outil(v.tool);
const jeton = (v: unknown) => nomme(v) && estObjet(v) && point(v) && texte(v.avatar) && nombre(v.size);
const ping = (v: unknown) => identifie(v) && estObjet(v) && point(v) && texte(v.color) && nombre(v.createdAt);

type Regles<T> = { [Cle in keyof T]-?: (valeur: unknown) => boolean };

/**
 * Frontière du transport interne : ne retenir que les données déclarées.
 * Les règles relisent les conteneurs, les scalaires et les champs nécessaires au
 * Hub ; ce n'est pas une validation exhaustive des modèles métier imbriqués.
 * Ceux-ci restent construits sous le contrat DonneesDuHub dans le synchroniseur.
 * La conversion est regroupée ici, jamais vers un état complet avec ses méthodes.
 * Aucun défaut n'est ajouté : une absence dans un diff doit rester une absence.
 */
function lireChamps<T>(valeur: unknown, regles: Regles<T>): Partial<T> | null {
    if (!estObjet(valeur)) return null;
    const lus: Record<string, unknown> = {};
    for (const cle of Object.keys(regles) as (keyof T & string)[]) {
        if (valeur[cle] === undefined) continue;
        if (!regles[cle](valeur[cle])) return null;
        lus[cle] = valeur[cle];
    }
    return lus as Partial<T>;
}

const horloges: Regles<HorlogesDuHub> = {
    timestamp: nombre, mode: choix('realtime', 'static', 'timer', 'fantasy'),
    theme: choix('cyberpunk', 'oldstyle', 'modern'),
    tensions: tableau(v => nomme(v) && estObjet(v) && nombre(v.totalSegments) && nombre(v.filledSegments)),
    timerRemaining: nombre, timerIsRunning: booleen, timerLabel: texte,
    timerDuration: nombre, isClockProjected: booleen,
};
const combat: Regles<CombatDuHub> = {
    combatants: tableau(v => nomme(v) && estObjet(v) && nombre(v.init) && booleen(v.isPlayer)
        && choix('player', 'enemy', 'neutral', 'ally')(v.faction) && tableau(nomme)(v.statuses)
        && (v.hp === undefined || nombre(v.hp)) && (v.hpMax === undefined || nombre(v.hpMax))),
    currentTurnIdx: nombre, round: nombre, isCombatProjected: booleen,
};
const carte: Regles<CarteDuHub> = {
    projectionTarget: nullable(choix('hub', 'monitor')), projectedMapUrl: nullable(texte),
    projectedIsVideo: booleen, projectedTokens: tableau(jeton), projectedPings: tableau(ping),
    projectedFogDataUrl: nullable(texte), projectedMapWidth: nombre, projectedMapHeight: nombre,
    projectedIsGridEnabled: booleen, projectedGridSize: nombre, projectedGridColor: texte,
    projectedGridOpacity: nombre, projectedIsMapMuted: booleen, projectedMapVolume: nombre,
};
const tableauBlanc: Regles<TableauDuHub> = {
    paths: tableau(trace), activePath: nullable(trace), laserPointer: nullable(point),
    backgroundMode: choix('dark', 'light'), currentTool: outil, currentColor: texte,
    currentWidth: nombre, activeDrawerId: nullable(texte), version: nombre,
    projectionTarget: nullable(choix('hub', 'monitor')), pathsCount: nombre,
};
const session: Regles<SessionDuHub> = {
    sessions: tableau(identifie), campaigns: tableau(nomme),
    players: tableau(v => identifie(v) && estObjet(v) && texte(v.realName) && texte(v.avatarUrl)
        && booleen(v.isOnline) && tableau(c => nomme(c) && estObjet(c) && texte(c.portraitUrl))(v.characters)),
    clues: tableau(identifie), entities: tableau(nomme), atlasMaps: tableau(nomme),
    customSheetTemplates: tableau(identifie), customGameDrivers: tableau(identifie),
    decks: tableau(identifie), mainsDesPaquets: dictionnaire(tableau(estObjet)),
    demandesDeCarte: tableau(identifie), cartesRestantes: dictionnaire(nombre),
    connectedCharacters: dictionnaire(texte), characterLocks: dictionnaire(texte),
    activeCampaignId: nullable(texte), activeCampaignName: nullable(texte), activeCampaignWallpaper: nullable(texte),
    favorites: tableau(identifie), reservesDeTable: dictionnaire(nombre),
    activeDiceConfig: nullable(estObjet), desEchelonnes: booleen,
};

function estJet(v: unknown): boolean {
    if (!nommeJet(v)) return false;
    return nombre(v.total) && nombre(v.modifier) && texte(v.totalDisplay)
        && tableau(d => estObjet(d) && (texte(d.val) || nombre(d.val)))(v.rolls)
        && ((v.timestamp instanceof Date && Number.isFinite(v.timestamp.getTime()))
            || (typeof v.timestamp === 'string' && Number.isFinite(Date.parse(v.timestamp))));
}
function nommeJet(v: unknown): v is Record<string, unknown> {
    return identifie(v) && estObjet(v) && texte(v.title);
}
const des: Regles<DesDuHub> = {
    lastRoll: nullable(estJet), isDiceProjected: booleen, projectionTrigger: nombre,
    enable3D: booleen, styleDesDes: choix('resine', 'verre', 'metal'),
};
const apparence: Regles<ApparenceTablettes> = {
    theme: choix('cyberpunk', 'medieval', 'modern', 'claire'), accent: texte,
    personnalites: booleen, jeu: nullable(v => estObjet(v) && estObjet(v.jetons)), polices: texte,
};

export function lireDonneesDuHub(valeur: unknown): DonneesDuHub | null {
    if (!estObjet(valeur)) return null;
    const clock = valeur.clock === undefined ? undefined : lireChamps(valeur.clock, horloges);
    const combatLu = valeur.combat === undefined ? undefined : lireChamps(valeur.combat, combat);
    const map = valeur.map === undefined ? undefined : lireChamps(valeur.map, carte);
    const whiteboard = valeur.whiteboard === undefined ? undefined : lireChamps(valeur.whiteboard, tableauBlanc);
    const sessionLue = valeur.session === undefined ? undefined : lireChamps(valeur.session, session);
    const dice = valeur.dice === undefined ? undefined : lireChamps(valeur.dice, des);
    const notes = valeur.notes === undefined ? undefined : lireChamps<NonNullable<DonneesDuHub['notes']>>(valeur.notes, { public: texte, private: texte });
    if ([clock, combatLu, map, whiteboard, sessionLue, dice, notes].includes(null)) return null;
    if (valeur.voiceLevel !== undefined && !nombre(valeur.voiceLevel)) return null;
    let apparenceLue: ApparenceTablettes | null | undefined;
    if (valeur.apparence === null) apparenceLue = null;
    else if (valeur.apparence !== undefined) {
        const lue = lireChamps(valeur.apparence, apparence);
        // L'apparence est un segment entier : tous ses champs sont nécessaires.
        if (!lue || Object.keys(lue).length !== Object.keys(apparence).length) return null;
        apparenceLue = lue as ApparenceTablettes;
    }
    return {
        ...(clock && { clock }), ...(combatLu && { combat: combatLu }), ...(map && { map }),
        ...(whiteboard && { whiteboard }), ...(sessionLue && { session: sessionLue }),
        ...(dice && { dice }), ...(notes && { notes }),
        ...(valeur.voiceLevel !== undefined && { voiceLevel: valeur.voiceLevel as number }),
        ...(apparenceLue !== undefined && { apparence: apparenceLue }),
    };
}

export function jetDuMagasin(jet: JetTransmis): EtatsDuHub['useDiceStore']['lastRoll'] {
    return { ...jet, timestamp: jet.timestamp instanceof Date ? jet.timestamp : new Date(jet.timestamp) };
}

export function lireEntiteProjetee(valeur: unknown): ProjectedEntity | null | undefined {
    if (valeur === null || valeur === '') return null;
    if (typeof valeur === 'string') {
        try { valeur = JSON.parse(valeur) as unknown; } catch { return undefined; }
    }
    const lue = lireChamps<ProjectedEntity>(valeur, {
        id: texte, name: texte, subtitle: texte, avatar: texte, imageUrl: texte,
        portraitUrl: texte, description: texte, lore: texte, type: texte, fields: dictionnaire(texte),
    });
    return lue && typeof lue.id === 'string' && typeof lue.name === 'string' ? { ...lue, id: lue.id, name: lue.name } : undefined;
}

export function lireRegleDuHub(valeur: unknown): RegleDuHub | null | undefined {
    if (valeur === null) return null;
    const lue = lireChamps<RegleDuHub>(valeur, { title: texte, content: texte, category: texte });
    return lue && typeof lue.title === 'string' && typeof lue.content === 'string'
        ? { ...lue, title: lue.title, content: lue.content } : undefined;
}
