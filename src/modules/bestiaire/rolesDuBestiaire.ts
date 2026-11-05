import type { BestiaireDuJeu, CreatureDuBestiaire, GameDriver, LigneDAttaque } from '../../types/drivers';
import { CLE_COMBAT_ALIEN, lireLeCombatAlien, type RegleDeCombatAlien } from '../dice/systemes/combatAlien';
import { xenoViergeAlien, type XenomorpheAlien } from '../dice/systemes/xenomorphesAlien';

/**
 * **Le propre de chaque jeu : le rôle des colonnes du bestiaire** — registre § 210, étape E
 * (05/11/2026), à la demande de David (« On peut faire le E ? ») ; choix du même jour : Alien d'abord,
 * la créature posée **d'office** en xénomorphe, des **rôles déclarés** (proposés d'après le libellé),
 * les attaques propres **tirées au D6**.
 *
 * Une colonne remplit un champ de la fiche (`champ`) ; elle peut aussi jouer un **rôle** dans une
 * mécanique du jeu. Pour Alien, le profil xénomorphe de Combat-OS (`XenomorpheAlien`) : Vitesse
 * (cartes d'initiative), santé maximale, Protection, éclaboussure d'acide, compétences de l'espèce.
 */

export interface RoleDuBestiaire { id: string; libelle: string }

/** Les rôles qu'Alien donne à une colonne : le profil xénomorphe. */
export const ROLES_ALIEN: readonly RoleDuBestiaire[] = [
    { id: 'vitesse', libelle: 'Vitesse' },
    { id: 'sante', libelle: 'Santé maximale' },
    { id: 'protection', libelle: 'Protection' },
    { id: 'acide', libelle: 'Acide' },
    { id: 'competence', libelle: 'Compétence' },
];

/** Les rôles que propose le pilote : aucun hors d'Alien (les autres jeux viendront à la demande). */
export function rolesDuPilote(pilote: Pick<GameDriver, 'combat'> | null | undefined): readonly RoleDuBestiaire[] {
    return pilote?.combat?.alien ? ROLES_ALIEN : [];
}

const clef = (texte: string) => texte.normalize('NFD').replace(/\p{Mn}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Le rôle **proposé** d'après le libellé, au remplissage : Vitesse, Santé, Protection, Acide ; une
 * autre colonne de nombres est proposée comme compétence. Proposé, jamais caché : l'éditeur le
 * montre et le meneur le change.
 */
export function proposerLeRole(libelle: string, nature: 'nombre' | 'texte', roles: readonly RoleDuBestiaire[]): string | undefined {
    if (!roles.length || nature !== 'nombre') return undefined;
    const k = clef(libelle);
    const ids = new Set(roles.map(r => r.id));
    const propose = k.startsWith('vitesse') ? 'vitesse'
        : k.startsWith('sante') || k === 'pv' ? 'sante'
        : k.startsWith('protection') || k.startsWith('armure') ? 'protection'
        : k.includes('acide') ? 'acide'
        : 'competence';
    return ids.has(propose) ? propose : undefined;
}

const nombre = (v: unknown) => {
    const n = Number(String(v ?? '').replace(',', '.'));
    return Number.isFinite(n) ? Math.trunc(n) : undefined;
};

/**
 * **Le profil xénomorphe d'une créature du livre**, ou `null` quand aucune colonne n'en joue le
 * rôle (le meneur garde alors « Déclarer cette créature xénomorphe »). Espèce XX121 : l'étiquette
 * « XX121 », ou une éclaboussure d'acide. Les attaques : les lignes propres, sinon la table du jeu.
 */
export function profilXenomorphe(bestiaire: BestiaireDuJeu, creature: CreatureDuBestiaire): XenomorpheAlien | null {
    const parRole = (role: string) => bestiaire.colonnes.filter(c => c.role === role);
    if (!bestiaire.colonnes.some(c => c.role)) return null;
    const lire = (role: string) => {
        for (const c of parRole(role)) { const n = nombre(creature.valeurs[c.id]); if (n !== undefined) return n; }
        return undefined;
    };
    const competences: Record<string, number> = {};
    for (const c of parRole('competence')) {
        const n = nombre(creature.valeurs[c.id]);
        if (n !== undefined) competences[c.libelle.toLowerCase()] = n;
    }
    const vierge = xenoViergeAlien();
    const acide = lire('acide') ?? 0;
    const lignes: LigneDAttaque[] | undefined = creature.attaques?.lignes?.length ? creature.attaques.lignes : undefined;
    const table = creature.attaques?.table?.table?.trim();
    return {
        ...vierge,
        vitesse: Math.max(1, lire('vitesse') ?? vierge.vitesse),
        maximum: Math.max(1, lire('sante') ?? vierge.maximum),
        protection: Math.max(0, lire('protection') ?? 0),
        acide: Math.max(0, acide),
        xx121: (creature.etiquettes ?? []).some(e => clef(e) === 'xx121') || acide > 0,
        competences,
        ...(table ? { table } : {}),
        ...(lignes ? { lignes } : {}),
    };
}

/**
 * Ce que la fiche de plateau d'une créature reçoit en plus pour Alien : le suivi de combat déclaré
 * xénomorphe, et la santé à son maximum. Rien quand la créature n'a pas de profil.
 */
export function ficheAlienDeLaCreature(regle: RegleDeCombatAlien | undefined, bestiaire: BestiaireDuJeu, creature: CreatureDuBestiaire): Record<string, unknown> {
    if (!regle?.actions) return {};
    const xenomorphe = profilXenomorphe(bestiaire, creature);
    if (!xenomorphe) return {};
    return {
        [CLE_COMBAT_ALIEN]: { ...lireLeCombatAlien({}), xenomorphe },
        [regle.sante]: xenomorphe.maximum,
    };
}
