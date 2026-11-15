import {
    LIBRAIRIE, horlogesPourLaTable, widgetsActifs,
    type MondeDesWidgets, type SelectionParJeu, type WidgetDeTable,
} from './widgets/librairie';
import type { MinuteurAAfficher } from './widgets/minuteur';
import type { TempsAAfficher } from './widgets/heureDuMonde';

/**
 * **L'écran de table** — Fire HD 8, registre § 256, T12.
 *
 * Décision de David (15/11/2026, Q3 et Q5) : une tablette debout face aux joueurs montre en grand
 * les widgets que le meneur coche **pour elle**, à côté de la sélection de l'Ulanzi. Mêmes données
 * que l'afficheur (`MondeDesWidgets`), même doctrine : public par construction, des nombres, des
 * barres, des couleurs — pas de phrases.
 *
 * Pur : le poste compose (`composerLEcranDeTable`) et diffuse au rôle `hub` ; la Fire n'affiche que
 * ce qu'elle reçoit et ne lit aucun magasin du meneur.
 */

/**
 * **« Ordre du tour »** — le *rang* de la doctrine de l'afficheur, qui n'existait pas encore. Propre
 * à l'écran : l'Ulanzi ne le reçoit pas tant que David ne le demande pas (spécification, T12).
 */
export const WIDGET_ORDRE_DU_TOUR: WidgetDeTable = { id: 'ordre', nom: 'Ordre du tour', type: 'rang', source: { de: 'main' } };

/**
 * Ce que l'écran sait dessiner en grand. Les trois widgets de Blade Runner (Quarts, Jour, Voight-
 * Kampff) sont des compositions de 32 × 8 pixels : ils restent à l'Ulanzi jusqu'à ce qu'on les
 * redessine pour un écran.
 */
const PRIS_EN_CHARGE = new Set(['horloges', 'minuteur', 'heure', 'reserves']);
export const CATALOGUE_DE_L_ECRAN: readonly WidgetDeTable[] = [
    WIDGET_ORDRE_DU_TOUR,
    ...LIBRAIRIE.filter(w => PRIS_EN_CHARGE.has(w.id)),
];

export interface OrdreAAfficher { round: number; actif: string; suivants: string[] }

export type TuileDeLEcran =
    | { forme: 'jauge'; id: string; nom: string; valeur: number; max?: number; min?: number; couleur?: string; seVide?: boolean }
    | { forme: 'compte-a-rebours'; id: string; nom: string; restant: number; duree: number; couleur?: string }
    | { forme: 'temps'; id: string; nom: string; temps: TempsAAfficher; maintenant: number; couleur?: string }
    | { forme: 'rang'; id: string; nom: string; ordre: OrdreAAfficher };

export interface EtatDeLEcran {
    /** Vide quand le meneur n'a rien coché pour ce jeu, ou que rien de coché n'a de quoi s'afficher. */
    tuiles: TuileDeLEcran[];
    /** Le meneur a-t-il choisi quelque chose pour ce jeu ? Distingue « rien coché » de « rien à montrer ». */
    choisi: boolean;
}

const CACHES = ['invisible', 'invisibilité', 'caché', 'hidden'];
interface CombattantLu { name: string; isPlayer?: boolean; statuses?: { name: string }[] }

/**
 * Qui joue, et les deux suivants — seulement si le combat est **projeté**, et sans les combattants
 * cachés aux joueurs (la règle du suivi de combat des tablettes, `TabletHub.tsx`).
 */
export function ordreDuTourPourLaTable(combat: {
    isCombatProjected?: boolean; combatants?: CombattantLu[]; currentTurnIdx?: number; round?: number;
}): OrdreAAfficher | null {
    const tous = combat.combatants ?? [];
    if (!combat.isCombatProjected || !tous.length) return null;
    const visible = (c: CombattantLu) => c.isPlayer || !c.statuses?.some(s => CACHES.includes(s.name.toLowerCase()));
    const courant = Math.max(0, Math.min(tous.length - 1, combat.currentTurnIdx ?? 0));
    const actif = tous[courant];
    const suivants: string[] = [];
    for (let pas = 1; pas < tous.length && suivants.length < 2; pas++) {
        const c = tous[(courant + pas) % tous.length];
        if (visible(c)) suivants.push(c.name);
    }
    if (!tous.some(visible)) return null;
    return { round: combat.round ?? 1, actif: visible(actif) ? actif.name : '?', suivants };
}

/**
 * Les jauges de tension pour l'écran : toutes celles que **les joueurs ont le droit de voir**. Le
 * drapeau `surLAfficheur` ne vaut que pour les 32 pixels de l'Ulanzi ; `vueParLesJoueurs` l'emporte
 * toujours, comme sur l'afficheur.
 */
export function horlogesPourLEcran(etat: Parameters<typeof horlogesPourLaTable>[0]) {
    return horlogesPourLaTable({ ...etat, tensions: (etat.tensions ?? []).map(t => ({ ...t, surLAfficheur: true })) });
}

export function composerLEcranDeTable(
    systemId: string | null | undefined,
    selection: SelectionParJeu | undefined,
    monde: Omit<MondeDesWidgets, 'instruments'> & { ordre: OrdreAAfficher | null },
): EtatDeLEcran {
    const choisi = !!(systemId && selection?.[systemId]?.length);
    const tuiles = widgetsActifs(systemId, selection, CATALOGUE_DE_L_ECRAN).flatMap(({ widget, couleur }): TuileDeLEcran[] => {
        switch (widget.id) {
            case 'ordre':
                return monde.ordre ? [{ forme: 'rang', id: 'ordre', nom: widget.nom, ordre: monde.ordre }] : [];
            case 'horloges':
                return monde.horloges.map(h => ({ forme: 'jauge', id: `horloge:${h.id}`, nom: h.nom, valeur: h.remplis, max: h.total,
                    couleur: h.couleur ?? couleur, seVide: h.seVide }));
            case 'minuteur':
                return monde.minuteur ? [{ forme: 'compte-a-rebours', id: 'minuteur', nom: widget.nom, ...(monde.minuteur as MinuteurAAfficher), couleur }] : [];
            case 'heure':
                return monde.temps ? [{ forme: 'temps', id: 'heure', nom: widget.nom, temps: monde.temps, maintenant: monde.maintenant, couleur }] : [];
            case 'reserves':
                return monde.reserves.map(r => ({ forme: 'jauge', id: `reserve:${r.id}`, nom: r.nom, valeur: r.valeur, min: r.min, max: r.max, couleur }));
            default:
                return [];
        }
    });
    return { tuiles, choisi };
}

const deuxChiffres = (n: number) => String(n).padStart(2, '0');

/**
 * L'heure du monde en clair, telle que l'écran la montre : toujours les chiffres (`heure`), et le nom
 * de l'heure à part (`nom`) quand le calendrier en donne un. Le nom tenait la place des chiffres, à
 * leur taille : sur la Fire, il n'en restait que « Le » (photo de David, 15/11/2026).
 */
export function lireLeTemps(temps: TempsAAfficher, maintenant: number): { haut?: string; heure: string; nom?: string } {
    const f = temps.dateFantastique;
    if (temps.mode === 'fantasy' && f) {
        return { haut: `${f.jour} ${f.mois}`, heure: `${deuxChiffres(f.heure)}:${deuxChiffres(f.minute)}`,
            ...(f.nomDeLHeure ? { nom: f.nomDeLHeure } : {}) };
    }
    const date = new Date(temps.mode === 'realtime' ? maintenant : temps.timestamp);
    return { heure: `${deuxChiffres(date.getHours())}:${deuxChiffres(date.getMinutes())}` };
}

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`;

/**
 * **Pourquoi un widget coché ne montre rien** — dit au tableau de bord, à côté de sa case (David,
 * 15/11/2026 : « je ne vois pas les horloges de tensions »). Une jauge neuve naît secrète
 * (`addTensionClock`), et l'horloge doit être projetée : *un absent silencieux se cherche une heure.*
 */
export function etatDuWidgetDeLEcran(widgetId: string, m: {
    isClockProjected?: boolean;
    tensions?: Parameters<typeof horlogesPourLaTable>[0]['tensions'];
    timerDuration?: number;
    combat: Parameters<typeof ordreDuTourPourLaTable>[0];
    reserves: number;
}): { texte: string; vide: boolean } {
    const nonProjetee = { texte: 'horloge non projetée', vide: true };
    switch (widgetId) {
        case 'horloges': {
            if (!m.isClockProjected) return nonProjetee;
            const vues = horlogesPourLEcran({ isClockProjected: true, tensions: m.tensions }).length;
            const secretes = (m.tensions?.length ?? 0) - vues;
            if (!vues) return { texte: secretes ? `aucune jauge visible (${pluriel(secretes, 'secrète')})` : 'aucune jauge', vide: true };
            return { texte: `${vues} affichée${vues > 1 ? 's' : ''}${secretes ? ` · ${pluriel(secretes, 'secrète')}` : ''}`, vide: false };
        }
        case 'minuteur':
            if (!m.isClockProjected) return nonProjetee;
            return (m.timerDuration ?? 0) > 0 ? { texte: 'affiché', vide: false } : { texte: 'aucun minuteur', vide: true };
        case 'heure':
            return m.isClockProjected ? { texte: 'affichée', vide: false } : nonProjetee;
        case 'ordre':
            if (ordreDuTourPourLaTable(m.combat)) return { texte: 'affiché', vide: false };
            return { texte: m.combat.isCombatProjected ? 'aucun combattant visible' : 'combat non projeté', vide: true };
        case 'reserves':
            return m.reserves ? { texte: `${m.reserves} affichée${m.reserves > 1 ? 's' : ''}`, vide: false } : { texte: 'aucune réserve', vide: true };
        default:
            return { texte: '', vide: false };
    }
}
