import { useDiceStore, type RollRecord } from '../../stores/useDiceStore';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { useRessourcesDeTableStore } from '../table/useRessourcesDeTableStore';
import { ressourcesDeLaTable } from '../table/reservesDuGroupe';
import { plafondDe, valeurDe } from '../table/RessourcesDeTable';
import { verdict, type DescripteurDeJet } from './DescripteurDeJet';

/**
 * **Les réserves d'un jet 2d20 lancé au pupitre ou à la télécommande** — C1 de
 * l'audit du 2026-10-22, décision de David : le pupitre gère les réserves.
 *
 * Le panneau de fiche payait les dés achetés et créditait l'Impulsion de
 * l'excédent ; le pupitre et la télécommande ne touchaient à rien. *Un jet qui
 * change selon l'écran d'où on le lance n'est pas le même jet.*
 *
 * Le pupitre ne sait pas qui lance — et la règle en dépend, comme pour le Fiel
 * de NOC (`fielAuPupitre`) : **un personnage** paie en Impulsion (le manque, ou
 * la part choisie, en Menace) et son excédent remplit l'Impulsion jusqu'au
 * plafond ; **un PNJ** paie en Menace, et son excédent va à la Menace (« les
 * personnages non joueurs […] ajoutent à la réserve de Menace »,
 * `docs/systems/dune/rules/monnaie-de-table.md`). Le meneur le dit, une fois
 * par jet ; le jet est alors marqué réglé.
 */

export type QuiLance = 'personnage' | 'pnj';

/** Ce que le jet a coûté : les dés au-delà de la base du système, au prix croissant. */
export function lireLeJetAuPupitre(jet: Pick<RollRecord, 'rolls'>, descripteur: DescripteurDeJet | undefined) {
    const reserve = descripteur?.reserve;
    const des = jet.rolls.filter(d => !d.isDropped && (d.sides === undefined || d.sides === reserve?.faces)).length;
    const desAchetes = Math.max(0, Math.min(des, reserve?.max ?? des) - (reserve?.base ?? 0));
    const cout = (reserve?.cout ?? []).slice(0, desAchetes).reduce((s, c) => s + c, 0);
    return { des, desAchetes, cout };
}

/** Ce jet du pupitre a-t-il des réserves à régler ? Un jeu qui paie ses dés, un jet de ses dés, pas encore réglé. */
export function jetARegler(jet: RollRecord | null | undefined, descripteur: DescripteurDeJet | undefined): boolean {
    const reserve = descripteur?.reserve;
    if (!jet || jet.reservesReglees || !reserve?.ressource || !reserve.cout?.length) return false;
    if (typeof jet.successes !== 'number' || jet.rolls.length === 0) return false;
    return jet.rolls.every(d => d.sides === undefined || d.sides === reserve.faces)
        && lireLeJetAuPupitre(jet, descripteur).des >= (reserve.base ?? 0);
}

/**
 * Règle les réserves du dernier jet : paie, puis verse l'excédent. Rend ce qui
 * s'est passé, dit pour le meneur. `difficulte` : les réussites exigées (le
 * pupitre ne la connaît pas d'avance) ; `enReport` : la part payée en Menace
 * par choix, pour un personnage.
 */
export function reglerLesReservesDuDernierJet(
    qui: QuiLance,
    options: { difficulte?: number; enReport?: number } = {},
): string[] {
    const des = useDiceStore.getState();
    // Le même jet que celui que le pupitre affiche — comme le forçage et le Fiel.
    const jet = des.history[0];
    const session = useSessionOSStore.getState();
    const pilote = session.getActiveDriver?.();
    const campaignId = session.activeCampaignId;
    const descripteur = pilote?.jet;
    if (!jet || !campaignId || !descripteur || !jetARegler(jet, descripteur)) return [];

    const ressources = ressourcesDeLaTable(pilote, session.campaigns.find(c => c.id === campaignId));
    const impulsion = ressources.find(r => r.id === descripteur.reserve!.ressource);
    const menace = impulsion?.reportSurEpuisement;
    if (!impulsion) return [];
    const nom = (id?: string) => ressources.find(r => r.id === id)?.label ?? id ?? '';
    const table = useRessourcesDeTableStore.getState();
    const { desAchetes, cout } = lireLeJetAuPupitre(jet, descripteur);
    const difficulte = options.difficulte ?? descripteur.difficulte?.defaut ?? 1;
    const excedent = verdict(jet.successes ?? 0, difficulte).excedent;
    const motif = `${jet.title} (${qui === 'pnj' ? 'PNJ' : 'personnage'})`;
    const dits: string[] = [];
    des.annoterLeJet(jet.id, { reservesReglees: qui });

    if (qui === 'pnj') {
        if (!menace) return [`Ce jeu ne déclare pas où un PNJ paie ses dés : rien n'a bougé.`];
        if (cout > 0) {
            const r = table.depenser(campaignId, ressources, menace, cout, `${motif}, ${desAchetes} dé${desAchetes > 1 ? 's' : ''} acheté${desAchetes > 1 ? 's' : ''}`);
            dits.push(`${nom(menace)} −${cout} (dés achetés).`, ...r.avertissements);
        }
        if (excedent > 0) {
            const r = table.gagner(campaignId, ressources, menace, excedent, `${motif}, ${excedent} réussite${excedent > 1 ? 's' : ''} excédentaire${excedent > 1 ? 's' : ''}`);
            dits.push(`${nom(menace)} +${excedent} (excédent du PNJ).`, ...r.avertissements);
        }
        return dits.length ? dits : ['Rien à régler : ni dé acheté, ni excédent.'];
    }

    if (cout > 0) {
        const choisi = impulsion.paiementAuChoix ? Math.min(cout, Math.max(0, options.enReport ?? 0)) : 0;
        const r = table.depenser(campaignId, ressources, impulsion.id, cout,
            `${motif}, ${desAchetes} dé${desAchetes > 1 ? 's' : ''} acheté${desAchetes > 1 ? 's' : ''}`, choisi);
        dits.push(`${cout} point${cout > 1 ? 's' : ''} pour ${desAchetes} dé${desAchetes > 1 ? 's' : ''} acheté${desAchetes > 1 ? 's' : ''}.`, ...r.avertissements);
    }
    if (excedent > 0) {
        // La place que la réserve a, lue après le paiement — comme au panneau de fiche (lot D2).
        const etat = table.etatDe(campaignId, ressources);
        const plafond = plafondDe(ressources, etat, impulsion);
        const place = plafond === undefined ? excedent : Math.max(0, plafond - valeurDe(ressources, etat, impulsion.id));
        const verse = Math.min(excedent, place);
        if (verse > 0) {
            const r = table.gagner(campaignId, ressources, impulsion.id, verse, `${motif}, ${excedent} réussite${excedent > 1 ? 's' : ''} excédentaire${excedent > 1 ? 's' : ''}`);
            dits.push(`${nom(impulsion.id)} +${verse}.`, ...r.avertissements);
        }
        if (excedent > verse) {
            const n = excedent - verse;
            dits.push(`${n} ${nom(impulsion.id)} hors réserve, pleine : à dépenser sur ce test, sinon perdu${n > 1 ? 's' : ''}.`);
        }
    }
    return dits.length ? dits : ['Rien à régler : ni dé acheté, ni excédent.'];
}
