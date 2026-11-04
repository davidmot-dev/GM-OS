import { lancerDegenesis, reserveDeDegenesis, type JetDeDegenesis } from './degenesis';
import { lireLEtatDegenesis, type EtatDegenesisDeLaFiche } from './maximaDeDegenesis';

/**
 * **La Sporulation, la Brûlure et les Potentiels de Degenesis** — DEG-A5, 04/11/2026, à la
 * demande de David (« on va finir DEG-A5 et DEG-A6 ») ; choix du même jour : la stimulation
 * proposée aux jets, GM-OS lance les tests. Livre de base français Katharsys, pages
 * **imprimées** (PDF − 1).
 *
 * - **Sporulation** (p. 186) : dès 1, réaction de mollusk ; à 50 % du maximum, stigmates ;
 *   au-delà du maximum, un test de PSY + Foi/Volonté par point d'excédent, de difficulté
 *   l'excédent ; chaque échec, un point **permanent** que l'EX n'efface plus — le personnage
 *   est porteur du Germe ; à 50 % de points permanents, il devient Léperos.
 * - **Exposition** (p. 186-187) : un test de PHY + Résistance contre le niveau du tableau ;
 *   l'hermétique donne des succès d'office ; un échec coûte 1 ou 1D points.
 * - **EX** (p. 177) : −1D de Sporulation par dose, une dose par jour.
 * - **Brûlure** (p. 187-190) : légère, Puissance 1 ; intense, 1D. L'Égo remonte de la
 *   Puissance, la Sporulation aussi ; le Chakra stimulé agit Puissance heures ; seule la
 *   dernière stimulation compte. La Discordia n'offre ni euphorie ni stimulation : un attribut
 *   tiré au dé tombe à 1, ou monte à 6 sur un 6, pendant six heures.
 *
 * Tout ici est pur : des valeurs de fiche et un dé entrent, des corrections et un texte sortent.
 */

const entier = (n: unknown) => Math.max(0, Math.trunc(Number(n) || 0));

/** Ce que le pilote nomme (`jet.degenesis.contamination`, pilote 2.3.0) : des champs, jamais des valeurs. */
export interface RegleDeLaContamination {
    /** La jauge des Sporulations subies, permanentes comprises. */
    sporulations: string;
    /** La jauge d'Égo et son maximum. */
    ego?: string;
    egoMax?: string;
    /** PHY + Résistance : l'exposition, et les jets de résistance du Bion. */
    resistance: string[];
    /** Les six attributs, dans l'ordre du d6 de la Discordia. */
    attributs: string[];
    /** L'attribut que la Gloire renforce de la moitié de la Puissance. */
    physique: string;
    /** Les tests de résistance mentale (PSY + Foi, PSY + Volonté) : la Gloire et le test du Germe. */
    mental: string[][];
    /** Unité : CHA + Négociation, CHA + Expression. */
    social: string[][];
    /** Muse : INS + Perception, INS + Empathie. */
    sens: string[][];
    /** Les Potentiels de la fiche : leur nom et leur niveau. */
    potentiels?: { nom: string; niveau: string }[];
}

export type Chakra = 'bion' | 'gloire' | 'unite' | 'muse' | 'argus' | 'discordia';

export interface Stimulation {
    chakra: Chakra;
    puissance: number;
    /** La Discordia : l'attribut touché et sa valeur pendant six heures. */
    discordia?: { attribut: string; valeur: number };
}

export const CHAKRAS: Record<Chakra, { libelle: string; chakra: string; regle: string; effet: (p: number) => string }> = {
    bion: { libelle: 'Bion', chakra: 'Coccyx', regle: '+Puissance succès aux jets de résistance', effet: p => `+${p} succès aux jets de résistance (maladie, poison, froid)` },
    gloire: { libelle: 'Gloire', chakra: 'Plexus solaire', regle: '+Puissance succès en résistance mentale, PHY +Puissance/2', effet: p => `+${p} succès en résistance mentale, PHY +${Math.ceil(p / 2)}` },
    unite: { libelle: 'Unité', chakra: 'Cœur', regle: '+Puissance à CHA + Négociation et Expression ; il fuit le combat', effet: p => `+${p}D à CHA + Négociation et Expression, aucun malus de stress ; il fuit le combat` },
    muse: { libelle: 'Muse', chakra: 'Gorge', regle: '+Puissance à INS + Perception et Empathie', effet: p => `+${p}D à INS + Perception et Empathie ; peut transférer ses succès (−1 Égo par test)` },
    argus: { libelle: 'Argus', chakra: 'Front', regle: '+Puissance dés à l’initiative, ne peut être surpris', effet: p => `+${p} dés à l'initiative, ne peut être pris par surprise` },
    discordia: { libelle: 'Discordia', chakra: 'aucun', regle: 'un attribut au hasard à 1, ou à 6 sur un 6, pendant six heures', effet: () => 'un attribut à 1, ou à 6 sur un 6, pendant six heures' },
};

/** Le texte de la stimulation en cours : « Argus, Puissance 4 — +4 dés à l'initiative… (4 h) ». */
export function texteDeLaStimulation(s: Stimulation, libelleDuChamp: (c: string) => string = c => c): string {
    if (s.chakra === 'discordia' && s.discordia) {
        return `Discordia — ${libelleDuChamp(s.discordia.attribut)} vaut ${s.discordia.valeur} (6 h)`;
    }
    return `${CHAKRAS[s.chakra].libelle}, Puissance ${s.puissance} — ${CHAKRAS[s.chakra].effet(s.puissance)} (${s.puissance} h)`;
}

/* ───────────────────────────── La Sporulation ───────────────────────────── */

export interface EtatDeLaSporulation {
    subies: number;
    max: number;
    permanentes: number;
    exces: number;
    /** Les points d'excédent qui attendent leur test du Germe. */
    aTester: number;
    mollusk: boolean;
    stigmates: boolean;
    porteur: boolean;
    leperos: boolean;
}

export function etatDeLaSporulation(subies: number, max: number, etat: EtatDegenesisDeLaFiche): EtatDeLaSporulation {
    const s = entier(subies), m = entier(max);
    const permanentes = Math.min(s, entier(etat.sporulationPermanente));
    const exces = Math.max(0, s - m);
    return {
        subies: s, max: m, permanentes, exces,
        aTester: Math.max(0, exces - Math.min(exces, entier(etat.excesTeste))),
        mollusk: s >= 1,
        stigmates: m > 0 && s * 2 >= m,
        porteur: permanentes > 0,
        leperos: m > 0 && permanentes * 2 >= m,
    };
}

export interface IssueDuGerme {
    jets: JetDeDegenesis[];
    echecs: number;
    etat: EtatDegenesisDeLaFiche;
    texte: string;
}

/**
 * **Le test du Germe** (p. 186) : un test par point d'excédent pas encore testé, chacun de
 * difficulté l'excédent ; chaque échec, un point permanent. `base` : PSY + Foi ou Volonté.
 */
export function testerLeGerme(
    sp: EtatDeLaSporulation, etat: EtatDegenesisDeLaFiche, base: number,
    options: { traumatismes?: number; succes?: number }, de: () => number,
): IssueDuGerme | null {
    if (sp.aTester === 0) return null;
    const reserve = reserveDeDegenesis(base, { succes: options.succes }, options.traumatismes ?? 0);
    const jets = Array.from({ length: sp.aTester }, () => lancerDegenesis(reserve, sp.exces, de));
    const echecs = jets.filter(j => j.degenesis.bilan !== 'reussite').length;
    const permanentes = Math.min(sp.subies, sp.permanentes + echecs);
    const leperos = sp.max > 0 && permanentes * 2 >= sp.max;
    return {
        jets, echecs,
        etat: { ...etat, sporulationPermanente: permanentes, excesTeste: sp.exces },
        texte: `Test du Germe — ${jets.length} test${jets.length > 1 ? 's' : ''}, difficulté ${sp.exces} (${reserve.des} dés`
            + `${reserve.automatiques ? `, ${reserve.automatiques} succès d’office` : ''}) : `
            + jets.map(j => `${j.degenesis.succes} succès`).join(', ')
            + (echecs ? ` — ${echecs} échec${echecs > 1 ? 's' : ''}, Sporulation permanente ${sp.permanentes} → ${permanentes} : porteur du Germe` : ' — l’Amorce est repoussée')
            + (leperos ? ' ; la moitié de l’échelle est permanente : il devient Léperos (p. 186).' : ' (p. 186).'),
    };
}

/** Le tableau de la sporination (p. 186-187). */
export const SPORINATIONS = [
    { niveau: 1, cause: 'Légère sporination près d’un champ de spores', intervalle: '1×/jour', points: '1' },
    { niveau: 2, cause: 'Nuage de spores en zone à haut risque', intervalle: '1×/jour', points: '1' },
    { niveau: 3, cause: 'Forte sporination dans un champ adulte', intervalle: '1×/heure', points: '1D' },
    { niveau: 5, cause: 'Efflorescence fongique, champ adulte', intervalle: '1×/heure', points: '1D' },
    { niveau: 7, cause: 'Efflorescence fongique, champ de spores-mère', intervalle: '1×/heure', points: '1D' },
    { niveau: 10, cause: 'Saturation de spores : front sporique, Chakras terrestres', intervalle: '1×/heure', points: '1D' },
] as const;

export interface IssueDeLExposition { jet: JetDeDegenesis; gain: number; texte: string }

/** **L'exposition** : PHY + Résistance contre le niveau ; échoué, 1 ou 1D points (p. 186-187). */
export function exposition(
    niveau: number, base: number, options: { hermetique?: number; bion?: number; traumatismes?: number }, de: () => number,
): IssueDeLExposition {
    const ligne = SPORINATIONS.find(l => l.niveau === niveau) ?? SPORINATIONS[0];
    const succes = entier(options.hermetique) + entier(options.bion);
    const reserve = reserveDeDegenesis(base, { succes }, options.traumatismes ?? 0);
    const jet = lancerDegenesis(reserve, ligne.niveau, de);
    const gain = jet.degenesis.bilan === 'reussite' ? 0 : ligne.points === '1D' ? de() : 1;
    return {
        jet, gain,
        texte: `Exposition — ${ligne.cause} (${ligne.niveau}) : PHY + Résistance, ${reserve.des} dés`
            + `${succes ? `, ${succes} succès d’office` : ''} → ${jet.degenesis.succes} succès`
            + (gain ? ` ; échec, +${gain} Sporulation (p. 186).` : ' ; le corps repousse la Sepsie (p. 187).'),
    };
}

/** **Une dose d'EX** : −1D, jamais sous les points permanents ; une seule par jour (p. 177). */
export function doseDEx(sp: EtatDeLaSporulation, etat: EtatDegenesisDeLaFiche, de: () => number): { retires: number; jet: number; etat: EtatDegenesisDeLaFiche; texte: string } {
    if (etat.exDuJour) return { retires: 0, jet: 0, etat, texte: 'Une seconde dose d’EX dans la journée n’a aucun effet (p. 177).' };
    const jet = de();
    const retires = Math.min(jet, Math.max(0, sp.subies - sp.permanentes));
    const reste = sp.subies - retires;
    return {
        retires, jet,
        // L'excédent déjà testé ne dépasse pas l'excédent qui reste.
        etat: { ...etat, exDuJour: true, excesTeste: Math.min(entier(etat.excesTeste), Math.max(0, reste - sp.max)) },
        texte: `Dose d’EX : 1D = ${jet}, Sporulation ${sp.subies} → ${reste}`
            + (sp.permanentes ? ` (${sp.permanentes} permanente${sp.permanentes > 1 ? 's' : ''}, que l’EX n’efface pas)` : '') + ' (p. 177).',
    };
}

/* ───────────────────────────── La Brûlure ───────────────────────────── */

export interface PriseDeBrulure {
    puissance: number;
    stimulation: Stimulation;
    /** Ce qui s'écrit sur la fiche : Égo, Sporulation, et l'état caché. */
    maj: Record<string, unknown>;
    texte: string;
}

/**
 * **Inhaler un bourgeon** (p. 187-190). L'Égo remonte de la Puissance, sans dépasser son
 * maximum ; la Sporulation monte d'autant et peut dépasser le sien — le test du Germe suit.
 * La nouvelle stimulation remplace l'ancienne. La Discordia ne rend rien et ne sporule pas :
 * le livre ne lui donne ni euphorie ni stimulation (p. 190).
 */
export function inhaler(
    regle: RegleDeLaContamination, valeurs: Record<string, unknown>, chakra: Chakra, intense: boolean,
    egoMax: number | null, de: () => number, cle: string, libelleDuChamp: (c: string) => string = c => c,
): PriseDeBrulure {
    const etat = lireLEtatDegenesis(valeurs);
    if (chakra === 'discordia') {
        const attribut = regle.attributs[Math.min(regle.attributs.length, Math.max(1, de())) - 1];
        const d = de();
        const valeur = d === 6 ? 6 : 1;
        const stimulation: Stimulation = { chakra, puissance: 0, discordia: { attribut, valeur } };
        return {
            puissance: 0, stimulation,
            maj: { [cle]: { ...etat, stimulation } },
            texte: `Discordia : ${libelleDuChamp(attribut)} ${valeur === 6 ? 'monte à 6' : 'tombe à 1'} pendant six heures (1D = ${d}) ; ni Égo ni stimulation (p. 190).`,
        };
    }
    const puissance = intense ? de() : 1;
    const stimulation: Stimulation = { chakra, puissance };
    const maj: Record<string, unknown> = { [cle]: { ...etat, stimulation } };
    const morceaux: string[] = [];
    if (regle.ego) {
        const avant = entier(valeurs[regle.ego]);
        const apres = egoMax === null ? avant + puissance : Math.min(egoMax, avant + puissance);
        maj[regle.ego] = apres;
        morceaux.push(`Égo ${avant} → ${apres}`);
    }
    const sporAvant = entier(valeurs[regle.sporulations]);
    maj[regle.sporulations] = sporAvant + puissance;
    morceaux.push(`Sporulation ${sporAvant} → ${sporAvant + puissance}`);
    return {
        puissance, stimulation, maj,
        texte: `Brûlure ${intense ? 'intense' : 'légère'} (${CHAKRAS[chakra].libelle}), Puissance ${puissance}${intense ? ' (1D)' : ''} : `
            + `${morceaux.join(', ')} ; ${CHAKRAS[chakra].effet(puissance)} pendant ${puissance} h`
            + `${etat.stimulation ? ' — elle remplace la stimulation précédente' : ''} (p. 188-190).`,
    };
}

/** Ce que la stimulation en cours ajoute à un jet de ces champs (attribut et compétence). */
export interface BonusDeLaStimulation { des: number; succes: number; texte: string }

const correspond = (champs: readonly string[], paires: string[][]) => paires.some(p => p.every(c => champs.includes(c)));

export function bonusDeLaStimulation(
    s: Stimulation | undefined, regle: RegleDeLaContamination, champs: readonly string[], valeurs: Record<string, unknown>,
    libelleDuChamp: (c: string) => string = c => c,
): BonusDeLaStimulation | null {
    if (!s) return null;
    const p = s.puissance;
    switch (s.chakra) {
        case 'unite': return correspond(champs, regle.social) ? { des: p, succes: 0, texte: `Unité : +${p}D` } : null;
        case 'muse': return correspond(champs, regle.sens) ? { des: p, succes: 0, texte: `Muse : +${p}D` } : null;
        case 'bion': return correspond(champs, [regle.resistance]) ? { des: 0, succes: p, texte: `Bion : +${p} succès d’office (résistance)` } : null;
        case 'gloire': {
            const mental = correspond(champs, regle.mental);
            const phy = champs.includes(regle.physique) ? Math.ceil(p / 2) : 0;
            if (!mental && !phy) return null;
            return {
                des: phy, succes: mental ? p : 0,
                texte: ['Gloire :', mental ? `+${p} succès d’office (résistance mentale)` : '', phy ? `PHY +${phy}D` : ''].filter(Boolean).join(' '),
            };
        }
        case 'discordia': {
            const d = s.discordia;
            if (!d || !champs.includes(d.attribut)) return null;
            const ecart = d.valeur - entier(valeurs[d.attribut]);
            return ecart ? { des: ecart, succes: 0, texte: `Discordia : ${libelleDuChamp(d.attribut)} vaut ${d.valeur} (${ecart > 0 ? '+' : '−'}${Math.abs(ecart)}D)` } : null;
        }
        default: return null;
    }
}

/** L'Argus au round : des dés d'initiative, et la surprise impossible (p. 190). */
export const argusDe = (s: Stimulation | undefined) => (s?.chakra === 'argus' ? s.puissance : 0);

/** **Un nouveau jour** : +1 Égo au réveil, sans dépasser le maximum ; l'EX redevient possible. */
export function nouveauJour(regle: RegleDeLaContamination, valeurs: Record<string, unknown>, egoMax: number | null, cle: string): { maj: Record<string, unknown>; texte: string } {
    const etat = lireLEtatDegenesis(valeurs);
    const maj: Record<string, unknown> = { [cle]: { ...etat, exDuJour: false } };
    let texte = 'Nouveau jour : une dose d’EX est de nouveau possible';
    if (regle.ego) {
        const avant = entier(valeurs[regle.ego]);
        const apres = egoMax === null ? avant + 1 : Math.min(egoMax, avant + 1);
        maj[regle.ego] = apres;
        texte += ` ; Égo ${avant} → ${apres} au réveil`;
    }
    return { maj, texte: `${texte}.` };
}
