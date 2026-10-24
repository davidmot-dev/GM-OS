import { degreDuDe, estUneReussite, type DegreDeReussite } from '../../dice/degresDeReussite';
import { bandesAvecBonusDeCase, bandesDuJet } from '../../dice/systemes/revesDeDragons';
import {
    DESIRS_LANCINANTS, FORCE_DES_CASES_HUMIDES, IDEES_FIXES, OMBRES_DE_THANATOS, QUEUES_DE_DRAGON, RELANCE_DES_NON_HAUT_REVANTS,
    NOM_DES_TERRES, SOUFFLES_DE_DRAGON, TETES_DE_DRAGON, TETES_DES_HAUT_REVANTS, VOIES_DU_DRACONIC, bornesDeLaForce, coutDuSort, effetDuD100,
    jetDeMaitrise, limiteDeReserve, rencontre, rencontreDuD100, testDeRefoulement, voieNommee,
    type EffetDeTable, type GenreDeTerre, type IdDeRencontre,
} from '../../dice/systemes/hautReve';
import { operationDeVoyageur, type DonneesDeVoyage } from './operationsDeVoyageur';
import { etatDuVoyageur } from './fatigueDuVoyageur';
import { entierVoyageur as entier } from './moralDuVoyageur';
import { lireProgression } from './progressionDuVoyageur';
import { lireRepos } from './reposDuVoyageur';

/** Le Haut-Rêve du Voyageur — Livre du Haut-Rêve 2.3.1, p. 181–210 (24/10/2026).
 * Rencontres, cases humides, sorts, réserves, résistance, refoulement et effets de
 * Dragon. Chaque opération est un aperçu validé par le MJ ; les dés sont donnés,
 * jamais tirés ici. Le compteur de refoulement et le texte des queues sont
 * recopiés dans les champs du livret (`magic_repression`, `magic_dragonEffects`).
 */
export const CLE_HAUT_REVE = '__rddHautReve231';
export type TableDeDragon = 'queue' | 'ombre' | 'souffle' | 'tete' | 'tete-hr';
export interface EffetDeDragonActif { id: string; table: TableDeDragon; nom: string; effet: string; precision: string; refoulable: number | null; source: string; }
export interface EffetEnAttente { id: string; type: 'queue' | 'souffle' | 'tete'; nombre: number; motif: string; }
export interface LutteEnCours { rencontre: IdDeRencontre; force: number; rounds: number; refoulement: number; }
export interface HautReveVoyageur {
    version: 1; refoulement: number; actifs: EffetDeDragonActif[]; enAttente: EffetEnAttente[];
    lutte: LutteEnCours | null;
    /** La prochaine queue se tire sur les Ombres de Thanatos (p. 199). */
    ombre: boolean;
}
const TABLES: Record<TableDeDragon, readonly EffetDeTable[]> = {
    queue: QUEUES_DE_DRAGON, ombre: OMBRES_DE_THANATOS, souffle: SOUFFLES_DE_DRAGON, tete: TETES_DE_DRAGON, 'tete-hr': TETES_DES_HAUT_REVANTS,
};
export const NOM_DES_TABLES: Record<TableDeDragon, string> = {
    queue: 'Queue de Dragon', ombre: 'Ombre de Thanatos', souffle: 'Souffle de Dragon', tete: 'Tête de Dragon', 'tete-hr': 'Tête de Dragon (haut-rêvant)',
};

export function lireHautReve(d: DonneesDeVoyage): HautReveVoyageur {
    const h = d[CLE_HAUT_REVE] as HautReveVoyageur | undefined;
    if (h === undefined) return { version: 1, refoulement: entier(Number.parseInt(String(d.magic_repression ?? '0'), 10) || 0), actifs: [], enAttente: [], lutte: null, ombre: false };
    if (!h || h.version !== 1 || !Number.isSafeInteger(h.refoulement) || h.refoulement < 0 || !Array.isArray(h.actifs) || h.actifs.length > 200
        || !Array.isArray(h.enAttente) || h.enAttente.length > 60 || typeof h.ombre !== 'boolean'
        || h.enAttente.some(e => !e || typeof e.id !== 'string' || !['queue', 'souffle', 'tete'].includes(e.type) || !Number.isInteger(e.nombre) || e.nombre < 1)
        || h.actifs.some(e => !e || typeof e.id !== 'string' || !(e.table in TABLES) || typeof e.nom !== 'string')
        || (h.lutte !== null && (!h.lutte || !Number.isInteger(h.lutte.force) || !Number.isInteger(h.lutte.rounds) || !Number.isInteger(h.lutte.refoulement)))) {
        throw new Error('Suivi du Haut-Rêve invalide : conserver les données.');
    }
    return structuredClone(h);
}

/** Le compteur et les queues, recopiés là où le livret les montre. */
function avecMiroir(h: HautReveVoyageur): DonneesDeVoyage {
    return {
        [CLE_HAUT_REVE]: h, magic_repression: String(h.refoulement),
        magic_dragonEffects: h.actifs.map(e => `${e.nom}${e.precision ? ` — ${e.precision}` : ''}`).join('\n'),
    };
}

/** L'état général du jet, ou zéro quand le suivi de fatigue n'est pas actif (le MJ l'ajoute alors à la main). */
export function etatGeneralDuHautReve(d: DonneesDeVoyage): number {
    try { return etatDuVoyageur(d).total; } catch { return 0; }
}
export function meilleureVoie(d: DonneesDeVoyage): { champ: string; nom: string; niveau: number } {
    return VOIES_DU_DRACONIC.map(v => ({ champ: v.champ, nom: v.nom, niveau: Number(d[v.champ] ?? -11) }))
        .reduce((a, b) => (b.niveau > a.niveau ? b : a));
}
const de100 = (v: number | undefined, quoi: string) => { if (!Number.isInteger(v) || v! < 1 || v! > 100) throw new Error(`${quoi} : un d100 de 1 à 100.`); return v!; };
const nombre = (d: DonneesDeVoyage, cle: string, defaut = 0) => { const n = Number(d[cle] ?? defaut); return Number.isFinite(n) ? n : defaut; };

/** XP d'une particulière à ajustement final négatif : moitié en RÊVE, moitié dans la voie (p. 186, 189, 209). */
function experienceDraconique(d: DonneesDeVoyage, ajustement: number, voie: string, details: string[]): DonneesDeVoyage {
    if (ajustement >= 0) return {};
    const p = lireProgression(d), total = -ajustement;
    p.exercice[voie] = (p.exercice[voie] ?? 0) + Math.ceil(total / 2);
    p.exercice.reve = (p.exercice.reve ?? 0) + Math.floor(total / 2);
    details.push(`Particulière à ${ajustement} : +${Math.ceil(total / 2)} XP ${voie}, +${Math.floor(total / 2)} XP RÊVE (voie, jamais sort).`);
    return { __rddProgression231: p };
}
/** Plus de trois fois le seuil : le rêve éclate, zéro point et un souffle (p. 208). */
function eclatement(reve: number, d: DonneesDeVoyage, h: HautReveVoyageur, id: string, details: string[]): number {
    if (reve <= 3 * nombre(d, 'reve_seuil', 1)) return reve;
    h.enAttente.push({ id: `${id}-eclatement`, type: 'souffle', nombre: 1, motif: 'Éclatement du rêve' });
    details.push('Triple du seuil dépassé : le rêve éclate, zéro point et un souffle de Dragon à tirer.');
    return 0;
}
function refoulerDe(h: HautReveVoyageur, points: number, d20: number | undefined, id: string, motif: string, details: string[]) {
    if (!Number.isInteger(d20)) throw new Error('Refouler : renseigner le d20 du test de refoulement.');
    h.refoulement += points;
    const t = testDeRefoulement(h.refoulement, d20!);
    if (t.souffle) {
        h.enAttente.push({ id: `${id}-refoulement`, type: 'souffle', nombre: 1, motif: `Test de refoulement (${motif})` });
        details.push(`+${points} refoulement : d20 ${d20} ≤ ${h.refoulement}, le mental craque — souffle de Dragon, compteur remis à zéro.`);
    } else details.push(`+${points} refoulement (total ${h.refoulement}) : d20 ${d20} > ${h.refoulement}, on s’en tire pour cette fois.`);
    h.refoulement = t.points;
}

export interface ChoixDeRencontre {
    genre: GenreDeTerre;
    /** Le d100 de la table, ou la rencontre imposée (table spéciale, rencontre retrouvée). */
    d100?: number; rencontreId?: IdDeRencontre;
    force: number;
    choix: 'maitriser' | 'derober' | 'refouler' | 'laisser';
    d100Maitrise?: number; d20?: number;
    /** Tirée sur la table spéciale : la refouler coûte 2 points, 3 pour le Tourbillon rouge (p. 197). */
    speciale?: boolean;
}
/** Une rencontre en TMR : maîtriser, se dérober ou refouler (p. 183–187). */
export function proposerRencontre(d: DonneesDeVoyage, c: ChoixDeRencontre, id: string) {
    const h = lireHautReve(d);
    if (h.lutte) throw new Error('Une rencontre emprisonne déjà le demi-rêve : poursuivre la lutte.');
    const r = c.rencontreId ? rencontre(c.rencontreId) : rencontreDuD100(c.genre, de100(c.d100, 'Table des rencontres'));
    const [min, max] = bornesDeLaForce(r.force, 0);
    if (!Number.isInteger(c.force) || c.force < min || c.force > max + 4) throw new Error(`${r.nom} : force ${r.force} (de ${min} à ${max === Infinity ? '…' : max}, +4 sur la table spéciale).`);
    const details = [`${r.nom} de force ${c.force}${c.d100 ? ` (d100 ${c.d100} en ${NOM_DES_TERRES[c.genre]})` : ''}.`];
    const prixDuRefoulement = c.speciale ? (r.id === 'tourbillon-rouge' ? 3 : 2) : r.refoulement;
    let reve = nombre(d, 'reve_pts'), maj: DonneesDeVoyage = {}, vie = nombre(d, 'vie');
    if (c.choix === 'laisser') {
        if (!r.ignorable) throw new Error(`On ne laisse pas passer un ${r.nom} : maîtriser, se dérober ou refouler.`);
        details.push('Laissé passer, sans le maîtriser ni se dérober (p. 184).');
    } else if (c.choix === 'derober') {
        details.push('Dérobade : la concentration est rompue, le haut-rêvant quitte les TMR. La rencontre l’attend sur la case jusqu’à la fin de la prochaine même heure ; on ne se dérobe pas deux fois.');
    } else if (c.choix === 'refouler') {
        refoulerDe(h, prixDuRefoulement, c.d20, id, r.nom, details);
    } else {
        const v = meilleureVoie(d), etat = etatGeneralDuHautReve(d), jet = jetDeMaitrise(reve, v.niveau, c.force, etat);
        const tirage = de100(c.d100Maitrise, 'Maîtrise'), brut = degreDuDe(tirage, jet);
        const reveDeDragon = r.id === 'reve-de-dragon';
        const degre: DegreDeReussite = reveDeDragon ? brut : estUneReussite(brut) ? 'reussite-normale' : 'echec-normal';
        const ok = estUneReussite(degre);
        details.push(`Maîtrise : rêve actuel ${reve} à ${jet.ajustement} (${v.nom} ${v.niveau}, force −${c.force}, état ${etat}) — ${jet.chances} %, d100 ${tirage} : ${ok ? 'maîtrisé' : 'non maîtrisé'}${reveDeDragon ? ` (${degre})` : ''}.`);
        details.push(ok ? r.maitrisee : r.nonMaitrisee);
        if (r.id === 'fleur' && ok) reve = eclatement(reve + c.force, d, h, id, details);
        if (r.id === 'mangeur' && !ok) reve = Math.max(0, reve - c.force);
        if (reveDeDragon && ok) {
            reve = eclatement(reve + c.force, d, h, id, details);
            if (nombre(d, 'reve_seuil') < nombre(d, 'reve')) { maj.reve_seuil = nombre(d, 'reve_seuil') + 1; details.push('Un point de seuil regagné.'); }
            if (degre === 'reussite-particuliere') {
                h.enAttente.push({ id: `${id}-tete`, type: 'tete', nombre: 1, motif: `Rêve de Dragon ${c.force}` });
                maj = { ...maj, ...experienceDraconique(d, jet.ajustement, v.champ, details) };
            }
        }
        if (reveDeDragon && !ok) h.enAttente.push({ id: `${id}-queue`, type: 'queue', nombre: degre === 'echec-total' ? 2 : 1, motif: `Rêve de Dragon ${c.force}` });
        if (r.prison && !ok) {
            h.lutte = { rencontre: r.id, force: c.force, rounds: 1, refoulement: prixDuRefoulement };
            reve = Math.max(0, reve - r.prison.reveParRound); vie -= r.prison.vieParRound;
            details.push('Emprisonné : plus de dérobade ni de refoulement ; la lutte reprend au round suivant. Fatigue d’un point par round, comptée avec le séjour en TMR.');
        }
    }
    if (reve === 0 && nombre(d, 'reve_pts') > 0) details.push('Zéro point de rêve : endormi, rien ne le réveille avant d’avoir regagné un point.');
    return operationDeVoyageur(d, id, { ...maj, reve_pts: reve, ...(vie !== nombre(d, 'vie') ? { vie } : {}), ...avecMiroir(h) }, `Rencontre en TMR — ${r.nom}`, details);
}

/** Un round de lutte contre un Reflet ou un Tourbillon (p. 185–186). */
export function proposerLutte(d: DonneesDeVoyage, d100: number, id: string, d20?: number) {
    const h = lireHautReve(d), l = h.lutte;
    if (!l) throw new Error('Aucune rencontre n’emprisonne le demi-rêve.');
    const r = rencontre(l.rencontre), v = meilleureVoie(d), etat = etatGeneralDuHautReve(d);
    let reve = nombre(d, 'reve_pts'), vie = nombre(d, 'vie');
    const jet = jetDeMaitrise(reve, v.niveau, l.force, etat), tirage = de100(d100, 'Maîtrise'), ok = estUneReussite(degreDuDe(tirage, jet));
    const details = [`${r.nom} ${l.force}, round ${l.rounds + 1} : rêve ${reve} à ${jet.ajustement} — ${jet.chances} %, d100 ${tirage} : ${ok ? 'maîtrisé' : 'toujours prisonnier'}.`];
    if (ok) {
        const derive = l.rounds * r.prison!.deriveParRound;
        details.push(derive ? `Libéré après ${l.rounds} round(s) de défaite : dérive de ${derive} case(s) dans une direction tirée par le meneur, qui ne dit que le genre de terre.` : 'Libéré : le round redevient normal.');
        details.push('Une case humide de libération se maîtrise aussitôt ; un sort en réserve sur la case se déclenche.');
        h.lutte = null;
    } else {
        reve = Math.max(0, reve - r.prison!.reveParRound); vie -= r.prison!.vieParRound; l.rounds++;
        if (reve === 0) {
            details.push('Plus de rêve : endormi, concentration rompue — refoulement obligatoire.');
            refoulerDe(h, l.refoulement, d20, id, r.nom, details); h.lutte = null;
        }
    }
    return operationDeVoyageur(d, id, { reve_pts: reve, ...(vie !== nombre(d, 'vie') ? { vie } : {}), ...avecMiroir(h) }, `Lutte — ${r.nom}`, details);
}

/** Fleuve, lac, marais : force 7, ni dérobade ni refoulement (p. 187). */
export function proposerCaseHumide(d: DonneesDeVoyage, d100: number, id: string) {
    const h = lireHautReve(d), v = meilleureVoie(d), etat = etatGeneralDuHautReve(d), reve = nombre(d, 'reve_pts');
    const jet = jetDeMaitrise(reve, v.niveau, FORCE_DES_CASES_HUMIDES, etat), tirage = de100(d100, 'Maîtrise'), degre = degreDuDe(tirage, jet);
    const details = [`Case humide : rêve ${reve} à ${jet.ajustement} (${v.nom} ${v.niveau}, −7, état ${etat}) — ${jet.chances} %, d100 ${tirage} : ${degre}.`];
    let maj: DonneesDeVoyage = {};
    if (degre === 'echec-total') {
        h.enAttente.push({ id: `${id}-souffle`, type: 'souffle', nombre: 1, motif: 'Case humide, échec total' });
        details.push('Souffle de Dragon ; concentration rompue, le haut-rêvant quitte les TMR. Le demi-rêve reste sur la case.');
    } else if (!estUneReussite(degre)) details.push('Concentration rompue : le haut-rêvant quitte les TMR ; le demi-rêve reste sur la case et devra la maîtriser en remontant.');
    else {
        details.push('Case maîtrisée : libre d’agir pour le reste du round.');
        if (degre === 'reussite-particuliere') maj = experienceDraconique(d, jet.ajustement, v.champ, details);
    }
    return operationDeVoyageur(d, id, { ...maj, ...avecMiroir(h) }, 'Maîtriser une case humide', details);
}

export interface SortDuLivret { ligne: number; voie: string; nom: string; tmr: string; difficulte: number; cout: number; bonusCase: number; }
/** Les sorts du livret (21 lignes), lisibles quand ils ont un nom. */
export function sortsDuLivret(d: DonneesDeVoyage): SortDuLivret[] {
    return Array.from({ length: 21 }, (_, ligne) => ({
        ligne, voie: String(d[`spells_${ligne}_path`] ?? ''), nom: String(d[`spells_${ligne}_name`] ?? ''), tmr: String(d[`spells_${ligne}_tmr`] ?? ''),
        difficulte: -Math.abs(nombre(d, `spells_${ligne}_difficulty`)), cout: Math.abs(nombre(d, `spells_${ligne}_dreamCost`)),
        bonusCase: Number.parseInt(String(d[`spells_${ligne}_cellBonus`] ?? '0'), 10) || 0,
    })).filter(s => s.nom.trim());
}
/** Les sorts en réserve du livret (7 lignes). */
export function reservesDuLivret(d: DonneesDeVoyage) {
    return Array.from({ length: 7 }, (_, ligne) => ({
        ligne, voie: String(d[`reservedSpells_${ligne}_path`] ?? ''), nom: String(d[`reservedSpells_${ligne}_name`] ?? ''),
        tmr: String(d[`reservedSpells_${ligne}_tmr`] ?? ''), heure: String(d[`reservedSpells_${ligne}_birthHour`] ?? ''), reve: nombre(d, `reservedSpells_${ligne}_dream`),
    }));
}

export interface LancerDeSort {
    ligne: number; d100: number;
    /** Le sort est un rituel : pas de réserve ; l'astrologie s'applique (p. 155). */
    rituel: boolean; astrologie: number;
    /** Lancé depuis la case où ses bonus ont été acquis. */
    depuisSaCase: boolean;
    reserve: boolean; heureDeLaCible?: string;
}
/** Lancer un sort : RÊVE (la caractéristique), la voie, la difficulté R, le coût r (p. 188–193). */
export function proposerSort(d: DonneesDeVoyage, l: LancerDeSort, id: string) {
    const h = lireHautReve(d), s = sortsDuLivret(d).find(x => x.ligne === l.ligne);
    if (!s) throw new Error('Choisir un sort nommé du livret.');
    const voie = voieNommee(s.voie);
    if (!voie) throw new Error(`« ${s.voie} » : la voie du sort doit être Oniros, Hypnos, Narcos ou Thanatos.`);
    if (l.reserve && l.rituel) throw new Error('Les rituels ne se mettent pas en réserve (p. 191).');
    const niveau = nombre(d, voie.champ, -11), etat = etatGeneralDuHautReve(d), astro = l.rituel ? l.astrologie : 0;
    const ajustement = niveau + s.difficulte + etat + astro, bonus = l.depuisSaCase ? s.bonusCase : 0;
    const jet = bandesAvecBonusDeCase(nombre(d, 'reve', 1), ajustement, bonus), tirage = de100(l.d100, 'Lancer'), degre = degreDuDe(tirage, jet);
    const details = [`${s.nom} (${voie.nom}, ${s.tmr || 'case non notée'}) : RÊVE ${nombre(d, 'reve')} à ${ajustement} (voie ${niveau}, R ${s.difficulte}, état ${etat}${astro ? `, astrologie ${astro}` : ''})${bonus ? ` + ${bonus} % de case` : ''} — ${jet.chances} %, d100 ${tirage} : ${degre}.`];
    const reveAvant = nombre(d, 'reve_pts');
    let cout = coutDuSort(s.cout, degre), maj: DonneesDeVoyage = {};
    const reussi = estUneReussite(degre);
    if (reussi && l.reserve) {
        const reserves = reservesDuLivret(d), memeVoie = reserves.filter(r => r.nom.trim() && voieNommee(r.voie)?.id === voie.id).length;
        if (memeVoie >= limiteDeReserve(niveau)) throw new Error(`${voie.nom} ${niveau} : ${limiteDeReserve(niveau)} sort(s) en réserve au plus, déjà ${memeVoie}.`);
        const libre = reserves.find(r => !r.nom.trim());
        if (!libre) throw new Error('Les sept lignes de réserve du livret sont pleines.');
        cout += 1;
        Object.assign(maj, { [`reservedSpells_${libre.ligne}_path`]: voie.nom, [`reservedSpells_${libre.ligne}_name`]: s.nom, [`reservedSpells_${libre.ligne}_tmr`]: s.tmr,
            [`reservedSpells_${libre.ligne}_birthHour`]: l.heureDeLaCible ?? '', [`reservedSpells_${libre.ligne}_dream`]: s.cout });
        details.push(`Mis en réserve sur ${s.tmr || 'sa case'} pour un point de rêve de plus ; il se déclenche quand le demi-rêve y revient.`);
    }
    if (reussi) {
        details.push(degre === 'reussite-particuliere' ? `Particulière : la moitié du coût, ${cout} point(s).` : `Coût : ${cout} point(s) de rêve.`);
        if (!l.reserve) details.push('Le sort fait effet au début du round suivant, en redescendant ; le haut-rêvant le cible alors du doigt.');
        if (l.depuisSaCase) { maj[`spells_${s.ligne}_cellBonus`] = String(s.bonusCase + 1); details.push(`Bonus de case : ${s.bonusCase} → ${s.bonusCase + 1} %.`); }
        if (degre === 'reussite-particuliere') maj = { ...maj, ...experienceDraconique(d, ajustement, voie.champ, details) };
    } else if (degre === 'echec-total') details.push(`Échec total : ${cout} point(s) de rêve (150 %) et un effet erroné, au choix du meneur, n’importe où dans la portée.`);
    else details.push('Échec : aucun rêve dépensé ; concentration brisée, le haut-rêvant quitte les TMR.');
    let reve = reveAvant - cout;
    if (reve <= 0 && cout > 0) {
        details.push(reve < 0 ? 'Pas assez de rêve : zéro point, endormi, et l’effet erratique a lieu quand même.' : 'Le dernier point de rêve dépensé : endormi ; l’effet se centre sur le haut-rêvant ou devient une magie impossible.');
        reve = 0;
    }
    if (voie.id === 'thanatos') { h.ombre = true; details.push('Thanatos employé : la prochaine queue de Dragon se tire sur les Ombres de Thanatos.'); }
    return operationDeVoyageur(d, id, { ...maj, reve_pts: reve, ...avecMiroir(h) }, `Lancer un sort — ${s.nom}`, details);
}

/** Le retour du demi-rêve sur la case déclenche le sort ; la ligne de réserve se libère (p. 192). */
export function proposerDeclenchement(d: DonneesDeVoyage, ligne: number, id: string) {
    const r = reservesDuLivret(d).find(x => x.ligne === ligne && x.nom.trim());
    if (!r) throw new Error('Choisir un sort en réserve.');
    const maj = Object.fromEntries(['path', 'name', 'tmr', 'birthHour'].map(c => [`reservedSpells_${ligne}_${c}`, ''])) as DonneesDeVoyage;
    maj[`reservedSpells_${ligne}_dream`] = 0;
    return operationDeVoyageur(d, id, maj, `Déclencher — ${r.nom}`, [`${r.nom} (${r.voie}, ${r.tmr}) se déclenche : redescente au début du round suivant, ciblage sans jet ni dépense, paramètres inchangés.`]);
}

/** Le jet de résistance : rêve actuel, sans compétence ni état général (p. 190–191). */
export function proposerResistance(d: DonneesDeVoyage, difficulte: number, d100: number, id: string) {
    if (!Number.isInteger(difficulte) || difficulte > 0 || difficulte < -20) throw new Error('JR : une difficulté de 0 à −20 (r−8 le plus souvent).');
    const reve = nombre(d, 'reve_pts'), jet = bandesDuJet(Math.max(0, reve), difficulte), tirage = de100(d100, 'JR'), degre = degreDuDe(tirage, jet);
    const details = [`JR r${difficulte} : rêve actuel ${reve} — ${jet.chances} %, d100 ${tirage} : ${degre}. ${estUneReussite(degre) ? 'Le sort revient sur le lanceur, qui joue un JR r0.' : 'La cible est affectée.'}`];
    let maj: DonneesDeVoyage = {};
    if (degre === 'reussite-particuliere' && difficulte < 0) {
        const p = lireProgression(d); p.exercice.reve = (p.exercice.reve ?? 0) + 1; maj = { __rddProgression231: p };
        details.push('Particulière à difficulté négative : +1 XP en RÊVE (un seul, jamais en Draconic).');
    }
    return operationDeVoyageur(d, id, maj, `Jet de résistance r${difficulte}`, details);
}

/** Refouler une queue, ou marquer des points pour une autre raison : le test suit toujours (p. 183, 195). */
export function proposerRefoulement(d: DonneesDeVoyage, d20: number, id: string, effetId?: string, points = 1) {
    const h = lireHautReve(d), details: string[] = [];
    let motif = 'Refoulement';
    if (effetId) {
        const e = h.actifs.find(x => x.id === effetId);
        if (!e || e.refoulable === null) throw new Error('Cet effet ne se refoule pas.');
        points = e.refoulable; motif = e.nom; h.actifs = h.actifs.filter(x => x.id !== effetId);
        details.push(`${e.nom} refoulé : l’effet est annulé.`);
    }
    entier(points, 1, 10);
    refoulerDe(h, points, d20, id, motif, details);
    return operationDeVoyageur(d, id, avecMiroir(h), `Refouler — ${motif}`, details);
}

export interface TirageDEffet {
    /** L'effet en attente consommé : celui du Haut-Rêve, ou celui du Château Dormant (`repos:<id>`). */
    source: string;
    d100: number;
    /** Pour une tête : la table 2 des haut-rêvants. */
    tableDesHautRevants?: boolean;
    nonHautRevant?: boolean;
    /** Le d20 d'un désir ou d'une idée fixe, le d100 d'un souvenir obsessionnel. */
    sousDe?: number;
}
/** Tirer une queue, un souffle ou une tête en attente (p. 195–206). */
export function proposerEffetDeDragon(d: DonneesDeVoyage, t: TirageDEffet, id: string) {
    const h = lireHautReve(d), details: string[] = [];
    let type: EffetEnAttente['type'], motif: string, majRepos: DonneesDeVoyage = {};
    if (t.source.startsWith('repos:')) {
        const r = lireRepos(d), e = r?.effets.find(x => x.id === t.source.slice(6));
        if (!r || !e) throw new Error('Effet du Château Dormant introuvable.');
        type = e.type; motif = e.motif;
        e.nombre--; r.effets = r.effets.filter(x => x.nombre > 0); majRepos = { __rddRepos231: r };
    } else {
        const e = h.enAttente.find(x => x.id === t.source);
        if (!e) throw new Error('Effet en attente introuvable.');
        type = e.type; motif = e.motif; e.nombre--; h.enAttente = h.enAttente.filter(x => x.nombre > 0);
    }
    const table: TableDeDragon = type === 'souffle' ? 'souffle' : type === 'tete' ? (t.tableDesHautRevants ? 'tete-hr' : 'tete') : h.ombre ? 'ombre' : 'queue';
    const tirage = de100(t.d100, NOM_DES_TABLES[table]);
    if (t.nonHautRevant && table === 'queue' && tirage < RELANCE_DES_NON_HAUT_REVANTS.queue) throw new Error('Non haut-rêvant : relancer les queues sous 29.');
    if (t.nonHautRevant && table === 'souffle' && tirage < RELANCE_DES_NON_HAUT_REVANTS.souffle) throw new Error('Non haut-rêvant : relancer les souffles sous 61.');
    const e = effetDuD100(TABLES[table], tirage);
    let precision = '';
    if (e.sousTable === 'desirs' || e.sousTable === 'idees') {
        const n = entier(t.sousDe, 1, 20);
        precision = (e.sousTable === 'desirs' ? DESIRS_LANCINANTS : IDEES_FIXES)[n - 1];
    } else if (e.sousTable === 'souvenir') precision = 'compétence à tirer sur la table du souvenir (p. 199)';
    if (table === 'ombre') h.ombre = false;
    details.push(`${NOM_DES_TABLES[table]} (${motif}) — d100 ${tirage} : ${e.nom}${precision ? ` — ${precision}` : ''}.`, e.effet);
    let maj: DonneesDeVoyage = {};
    if (e.nom === 'Infarctus') {
        maj = { vie: nombre(d, 'vie') - 4, endurance: Math.max(0, nombre(d, 'endurance') - 8) };
        details.push('Appliqué : −4 points de vie, −8 d’endurance.');
    }
    const ponctuel = e.duree === 'immediat';
    if (!ponctuel) h.actifs.push({ id, table, nom: e.nom, effet: e.effet, precision, refoulable: e.refoulable ?? null, source: motif });
    if (e.refoulable) details.push(`Refoulable pour ${e.refoulable} point(s) de refoulement.`);
    return operationDeVoyageur(d, id, { ...majRepos, ...maj, ...avecMiroir(h) }, `${NOM_DES_TABLES[table]} — ${e.nom}`, details);
}

/** Un effet prend fin : satisfait, expiré, ou décidé par le meneur. */
export function proposerFinDEffet(d: DonneesDeVoyage, effetId: string, id: string) {
    const h = lireHautReve(d), e = h.actifs.find(x => x.id === effetId);
    if (!e) throw new Error('Effet introuvable.');
    h.actifs = h.actifs.filter(x => x.id !== effetId);
    return operationDeVoyageur(d, id, avecMiroir(h), `Fin — ${e.nom}`, [`${e.nom} prend fin.`]);
}

/** Le meneur décide d'un effet sans passer par une rencontre (scénario, rituel, livre…). */
export function proposerEffetDecide(d: DonneesDeVoyage, type: EffetEnAttente['type'], motif: string, id: string) {
    if (!motif.trim()) throw new Error('Préciser l’origine de l’effet.');
    const h = lireHautReve(d);
    if (h.enAttente.length >= 60) throw new Error('Tirer d’abord les effets en attente.');
    h.enAttente.push({ id, type, nombre: 1, motif: motif.slice(0, 120) });
    return operationDeVoyageur(d, id, avecMiroir(h), 'Noter un effet de Dragon', [`${type === 'queue' ? 'Queue' : type === 'souffle' ? 'Souffle' : 'Tête'} de Dragon à tirer : ${motif.slice(0, 120)}.`]);
}
