import { useSessionOSStore } from '../../session/useSessionOSStore';
import { tousLesPilotes } from '../../session/store/tousLesPilotes';
import { useTableStore } from '../../tables/useTableStore';
import { pontDesTables } from '../../tables/pontDesTables';
import { universDuJeu } from '../../tables/logic/universDuJeu';
import type { TableResult } from '../../tables/types';
import type { ActionContext, ActionRegistry } from './types';

/**
 * **Table-OS sur la télécommande du meneur** — Fire HD 8, registre § 256, T6.
 *
 * Décision de David (15/11/2026) : *les tables du jeu actif, résultat au MJ seul*, avec
 * « Montrer aux joueurs ». Trois actions, sur le motif question/réponse du coffre Obsidian :
 *
 * - `remote:tables:lister` → `tables:liste` : les tables du dossier du jeu de la campagne
 *   active (`universDuJeu`), avec leur nom et leur dé ;
 * - `remote:tables:tirer` → `tables:resultat` : le tirage, **fait ici, au poste du MJ**, par
 *   `tirerSur` — même moteur, même historique que le tableau de bord ;
 * - `remote:tables:montrer` : journal (`journaliserUnTirage`) **et** annonce sur les tablettes
 *   (`addHubNotification`, comme le butin). Au PC, « partager » n'écrit qu'au journal, que les
 *   joueurs ne voient pas ; le bouton de la Fire s'appelle « Montrer aux joueurs ».
 *
 * ⚠️ **Les réponses ne partent qu'au rôle `remote`.** Un tirage non montré est au meneur seul :
 * le diffuser à tous le déposerait sur la tablette de chaque joueur, caché ou non à l'écran.
 * Ces types ne sont pas dans la liste des joueurs (`electron/actionPolicy.ts`) : seule une
 * tablette appairée peut les émettre.
 *
 * ⚠️ **Rien de ce qui arrive du réseau n'est cru sur parole** : le dossier est recalculé ici
 * depuis la campagne active, la table doit y figurer, le modificateur est un entier borné, et
 * « montrer » désigne un tirage de l'historique par son horodatage — la tablette ne peut pas
 * faire annoncer un résultat qu'elle aurait écrit elle-même.
 */

export interface TableDuJeu { id: string; nom: string; des: string }

export type ReponseDesTables =
    | { type: 'tables:liste'; payload: { univers: string | null; tables: TableDuJeu[]; raison?: string } }
    | { type: 'tables:resultat'; payload: { table: string; resultat: TableResult | null; erreur?: string } }
    | { type: 'tables:montre'; payload: { timestamp: number; montre: boolean } };

const MODIFICATEUR_MAX = 100;

function repondre(reponse: ReponseDesTables): void {
    window.appBridge?.remote?.broadcastUIAction?.(reponse, 'remote');
}

/** Le dossier de tables du jeu de la campagne active, ou la raison de son absence. */
async function dossierDuJeu(ctx: ActionContext): Promise<{ univers: string | null; raison?: string }> {
    const pont = pontDesTables();
    if (!pont) return { univers: null, raison: 'Les tables ne sont pas joignables depuis ce poste.' };
    const session = useSessionOSStore.getState();
    const campagne = session.campaigns.find(c => c.id === ctx.activeCampaignId);
    if (!campagne) return { univers: null, raison: 'Aucune campagne active : ouvre une campagne au poste.' };
    const pilote = tousLesPilotes(session.customGameDrivers).find(d => d.id === campagne.system);
    if (!pilote) return { univers: null, raison: 'Le jeu de la campagne active est introuvable.' };
    const univers = universDuJeu(pilote, await pont.listUniverses());
    return univers ? { univers } : { univers: null, raison: `Aucune table pour ${pilote.name}.` };
}

const lister = async (_payload: unknown, ctx: ActionContext) => {
    const { univers, raison } = await dossierDuJeu(ctx);
    const pont = pontDesTables();
    if (!univers || !pont) {
        repondre({ type: 'tables:liste', payload: { univers: null, tables: [], raison } });
        return;
    }
    const ids = await pont.listTables(univers);
    const tables = await Promise.all(ids.map(async (id): Promise<TableDuJeu> => {
        try {
            const data = await pont.loadTable(univers, id);
            return { id, nom: data?.name || id, des: data?.dice ?? '' };
        } catch {
            return { id, nom: id, des: '' };
        }
    }));
    tables.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
    repondre({ type: 'tables:liste', payload: { univers, tables } });
};

const tirer = async (payload: unknown, ctx: ActionContext) => {
    const { table, modificateur = 0 } = (payload ?? {}) as { table?: unknown; modificateur?: unknown };
    if (typeof table !== 'string' || !table) return;
    if (typeof modificateur !== 'number' || !Number.isInteger(modificateur) || Math.abs(modificateur) > MODIFICATEUR_MAX) {
        repondre({ type: 'tables:resultat', payload: { table, resultat: null, erreur: 'Modificateur refusé.' } });
        return;
    }
    const { univers, raison } = await dossierDuJeu(ctx);
    const pont = pontDesTables();
    if (!univers || !pont || !(await pont.listTables(univers)).includes(table)) {
        repondre({ type: 'tables:resultat', payload: { table, resultat: null, erreur: raison ?? 'Cette table n’est pas une table du jeu actif.' } });
        return;
    }
    const resultat = await useTableStore.getState().tirerSur(univers, table, modificateur);
    repondre({ type: 'tables:resultat', payload: resultat ? { table, resultat } : { table, resultat: null, erreur: 'Tirage impossible.' } });
};

const montrer = (payload: unknown) => {
    const { timestamp } = (payload ?? {}) as { timestamp?: unknown };
    if (typeof timestamp !== 'number') return;
    const resultat = useTableStore.getState().history.find(r => r.timestamp === timestamp);
    if (!resultat) {
        repondre({ type: 'tables:montre', payload: { timestamp, montre: false } });
        return;
    }
    useTableStore.getState().journaliserUnTirage(resultat);
    const { entry } = resultat;
    useSessionOSStore.getState().addHubNotification({
        type: 'system',
        title: resultat.tableName,
        content: [`${resultat.finalValue} · ${entry.title}`, entry.description, entry.effect].filter(Boolean).join('\n'),
        fromName: 'Le meneur',
    });
    repondre({ type: 'tables:montre', payload: { timestamp, montre: true } });
};

export const tablesOSActions: ActionRegistry = {
    'remote:tables:lister': lister,
    'remote:tables:tirer': tirer,
    'remote:tables:montrer': montrer,
};
