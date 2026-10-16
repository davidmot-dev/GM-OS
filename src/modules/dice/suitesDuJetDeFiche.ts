import { DiceEngine } from './DiceEngine';
import { resoudreLeJetDeFiche } from './jetDepuisLaFiche';
import { ecrireLeDe, ressourcesDUsure, type RessourceDUsure } from './ressourcesDUsure';
import { entreeDeLaTable } from './systemes/yearZero';
import type { DescripteurDeJet } from './DescripteurDeJet';
import { useDiceStore, type RollRecord } from '../../stores/useDiceStore';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { piloteDuPersonnage } from '../session/logic/piloteDuPersonnage';
import { resolveSheetTemplate } from '../session/logic/templateResolver';
import { DEFAULT_SHEET_TEMPLATES } from '../../data/defaultSheetTemplates';
import { pontDesTables } from '../tables/pontDesTables';
import type { GameDriver } from '../../types/drivers';

/**
 * **Ce qui suit un jet de fiche, au pupitre** — Cthulhu Hack, 2026-10-16.
 *
 * Une Sauvegarde ratée, une ressource qui descend : deux suites que le livre
 * prévoit, et que le pupitre propose au meneur sur le dernier jet.
 *
 * - **La Fortune** (règle optionnelle) : le joueur **place** un jeton sur sa
 *   fiche pour relancer, deux pour réussir, sans jamais en avoir plus de deux.
 *   Sur une ressource, le dé perdu revient avant la relance.
 * - **La suite d'un déclin** : un 1 ou un 2 sur la Santé mentale inflige une
 *   Folie passagère, ou un Choc si le meneur le préfère — un bouton par table.
 *
 * Une seule suite par jet (`suite`) : une ressource sauvée par la Fortune n'a
 * plus de déclin, et une Folie tirée ne se refait pas.
 */

/** Un nombre lu sur la fiche — zéro pour ce qui n'en est pas un. */
const nombre = (brut: unknown) => {
    const n = typeof brut === 'number' ? brut : Number(brut);
    return Number.isFinite(n) ? Math.floor(n) : 0;
};

/** Ce jet est-il raté, au sens où la Fortune le rattrape ? */
export function jetRate(jet: Pick<RollRecord, 'deFiche' | 'tagSuccess' | 'usure'>): boolean {
    if (!jet.deFiche) return false;
    if (jet.deFiche.genre === 'ressource') return !!jet.usure && jet.usure.apres !== jet.usure.avant;
    return jet.tagSuccess === false;
}

/** Ce que la Fortune permet encore sur ce jet, selon les jetons déjà sur la fiche. */
export function fortuneDuJet(
    jet: Pick<RollRecord, 'deFiche' | 'tagSuccess' | 'usure' | 'suite'>,
    regle: DescripteurDeJet['fortune'],
    fiche: Record<string, unknown>,
): { jetons: number; relance: boolean; reussite: boolean } | null {
    if (!regle || jet.suite || !jetRate(jet)) return null;
    const jetons = Math.max(0, nombre(fiche[regle.champ]));
    return { jetons, relance: jetons + regle.relance <= regle.max, reussite: jetons + regle.reussite <= regle.max };
}

/** Les tables que ce déclin propose — la Folie passagère, le Choc. */
export function suitesDuDeclin(
    jet: Pick<RollRecord, 'deFiche' | 'usure' | 'suite'>,
    ressources: readonly RessourceDUsure[],
): NonNullable<RessourceDUsure['auDeclin']> {
    if (jet.suite || jet.deFiche?.genre !== 'ressource' || !jet.usure || jet.usure.apres === jet.usure.avant) return [];
    return ressources.find(r => r.fieldId === jet.deFiche!.champ)?.auDeclin ?? [];
}

/** Un nombre de dés écrit « 1d4 » ou « 2d6 » : sa somme tirée, ou `null` s'il ne se lit pas. */
export function lancerUneFormule(formule: string | undefined, de: (faces: number) => number): number | null {
    const m = /^\s*(\d*)d(\d+)\s*$/i.exec(formule ?? '');
    if (!m) return null;
    const nombre = Math.max(1, Number(m[1] || 1));
    let somme = 0;
    for (let i = 0; i < nombre; i++) somme += de(Number(m[2]));
    return somme;
}

/** Les faces d'une table — « 1d6 » → 6. */
export function facesDeLaTable(des: string): number {
    const m = /^\s*1?d(\d+)\s*$/i.exec(des);
    return m ? Number(m[1]) : 0;
}

/** Le personnage, son pilote et sa fiche, tels que le magasin les tient. */
function contexte(jet: RollRecord) {
    const store = useSessionOSStore.getState();
    const f = jet.deFiche;
    const joueur = f ? store.players.find(p => p.id === f.joueurId) : undefined;
    const personnage = joueur?.characters.find(c => c.id === f!.characterId);
    if (!f || !joueur || !personnage) return null;
    const pilote = piloteDuPersonnage(personnage, store.campaigns, store.customGameDrivers) as GameDriver | null;
    return { store, f, joueur, personnage, pilote };
}

/** Ce que le pupitre propose sur le dernier jet. */
export function suitesProposees(jet: RollRecord | null | undefined) {
    const c = jet ? contexte(jet) : null;
    if (!jet || !c) return { fortune: null, declin: [] as NonNullable<RessourceDUsure['auDeclin']> };
    const fiche = c.personnage.sheetData ?? {};
    return {
        fortune: fortuneDuJet(jet, c.pilote?.jet?.fortune, fiche),
        declin: suitesDuDeclin(jet, ressourcesDUsure(c.pilote, fiche)),
    };
}

/**
 * **Placer la Fortune** sur le dernier jet : un jeton pour relancer, deux pour
 * réussir. Rend ce qui s'est passé, dit pour le meneur.
 */
export function placerLaFortune(quoi: 'relance' | 'reussite'): string[] {
    const des = useDiceStore.getState();
    const jet = des.history[0];
    const c = jet ? contexte(jet) : null;
    const regle = c?.pilote?.jet?.fortune;
    if (!jet || !c || !regle) return [];
    const fiche = c.personnage.sheetData ?? {};
    const possible = fortuneDuJet(jet, regle, fiche);
    if (!possible || !possible[quoi]) return [];

    const cout = quoi === 'relance' ? regle.relance : regle.reussite;
    const jetons = possible.jetons + cout;
    const nomDeLaFortune = regle.label ?? 'Fortune';
    // Une ressource rattrapée retrouve d'abord le dé qu'elle venait de perdre.
    const restaure = c.f.genre === 'ressource' && jet.usure ? { [c.f.champ]: ecrireLeDe(jet.usure.avant) } : {};
    let maj: Record<string, unknown> = { ...fiche, ...restaure, [regle.champ]: jetons };
    des.annoterLeJet(jet.id, { suite: 'fortune' });
    const dits = [`${nomDeLaFortune} : ${jetons} jeton${jetons > 1 ? 's' : ''} sur la fiche de ${c.personnage.name}.`];

    if (quoi === 'reussite') {
        c.store.updateCharacter(c.joueur.id, c.personnage.id, { sheetData: maj as never });
        des.setLastRoll({
            ...jet, id: `${jet.id}-fortune`, timestamp: new Date(), suite: 'fortune',
            title: `${jet.title} · réussi par la ${nomDeLaFortune}`,
            tagSuccess: true, degre: 'reussite-normale',
            totalDisplay: `${jet.totalDisplay} → réussi (${nomDeLaFortune})`,
            ...(jet.usure ? { usure: { avant: jet.usure.avant, apres: jet.usure.avant } } : {}),
        });
        return dits;
    }

    // La relance : le même jet, sur la fiche telle qu'elle redevient.
    const gabarit = resolveSheetTemplate(c.personnage, c.store.campaigns, [...DEFAULT_SHEET_TEMPLATES, ...(c.store.customSheetTemplates ?? [])]);
    const relance = resoudreLeJetDeFiche(
        { playerId: c.joueur.id, characterId: c.personnage.id, genre: c.f.genre, champ: c.f.champ, modificateur: c.f.modificateur },
        { ...c.personnage, sheetData: maj }, c.pilote, gabarit,
    );
    if (relance?.ecrire) maj = { ...maj, [relance.ecrire.champ]: relance.ecrire.valeur };
    c.store.updateCharacter(c.joueur.id, c.personnage.id, { sheetData: maj as never });
    if (relance) {
        des.setLastRoll({
            ...relance.resultat, id: `${jet.id}-relance`, timestamp: new Date(), suite: 'fortune',
            title: `${relance.titre} · relancé (${nomDeLaFortune})`, deFiche: jet.deFiche,
        });
    } else {
        dits.push('La relance n’a pas pu se lire sur la fiche : relancez à la main.');
    }
    return dits;
}

/**
 * **Tirer la suite d'un déclin** — la Folie passagère ou le Choc — dans sa table
 * de Table-OS. Le résultat entre dans l'historique et le journal.
 */
export async function tirerLaSuiteDuDeclin(index: number): Promise<string[]> {
    const des = useDiceStore.getState();
    const jet = des.history[0];
    const c = jet ? contexte(jet) : null;
    if (!jet || !c) return [];
    const suite = suitesDuDeclin(jet, ressourcesDUsure(c.pilote, c.personnage.sheetData ?? {}))[index];
    const pont = pontDesTables();
    if (!suite) return [];
    if (!pont) return [`${suite.label} : Table-OS n’est pas joignable — tirez dans la table « ${suite.table.table} » à la main.`];
    const table = await pont.loadTable(suite.table.univers, suite.table.table).catch(() => null);
    const faces = table ? facesDeLaTable(table.dice) : 0;
    if (!table || !faces) return [`${suite.label} : la table « ${suite.table.univers} / ${suite.table.table} » est introuvable.`];

    const tire = DiceEngine.roll(faces);
    const entree = entreeDeLaTable(table.entries, tire);
    des.annoterLeJet(jet.id, { suite: 'declin' });
    des.setLastRoll({
        id: `${jet.id}-${suite.label}`, timestamp: new Date(), suite: 'declin',
        title: `${c.personnage.name} — ${suite.label}`,
        total: tire, modifier: 0, rolls: [{ val: tire, sides: faces }], tagSuccess: false,
        totalDisplay: entree ? `${tire} — ${entree.title}${entree.effect ? ` : ${entree.effect}` : ''}` : `${tire}`,
    });
    return [];
}
