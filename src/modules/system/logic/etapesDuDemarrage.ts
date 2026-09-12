/**
 * **Le démarrage ne peut plus se bloquer : il peut seulement être incomplet.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ L'ÉCRAN BLOQUÉ DU 2026-09-12 — CE QUE CE MODULE REFERME
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `BootstrapService.bootstrap()` attendait **trois choses sans borne**, et
 * l'interface entière restait sur `GM-OS BOOTING...` tant qu'elles ne
 * répondaient pas. Trois façons de ne jamais finir :
 *
 * | Attendu | Comment ça bloque |
 * | --- | --- |
 * | `initDB()` | `openDB` **ne résout jamais** quand une autre fenêtre tient la base : le rappel `blocked` se contente d'un avertissement. Projecteur, Player Hub et tablette partagent l'origine du meneur — il suffit qu'une reste ouverte |
 * | les deux `syncWithKeychain()` | un `Promise.all` : **un seul rejet** et les étapes suivantes ne partent pas |
 * | le `catch` final | il laissait `isSystemReady` à `false` *exprès*, « pour bloquer l'interface si critique » — sans message, sans reprise, sans bouton |
 *
 * ⭐ **Et c'est pourquoi le 12/09 n'a rien donné.** Le symptôme a disparu parce
 * que la cause était transitoire, pas parce qu'elle était réparée : *un écran
 * qui ne dit ni ce qu'il attend ni pourquoi il a renoncé ne se diagnostique pas
 * après coup.* Le registre portait deux questions pour trancher entre le splash
 * et `LoadingOverlay` — le vrai écran était le troisième, et personne ne l'avait
 * nommé.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LE PARTI PRIS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⭐ **On ne cherche pas laquelle des trois a bloqué ce jour-là.** On retire la
 * possibilité de bloquer. Chaque étape est **nommée** et **bornée** ; celle qui
 * dépasse son délai ne retient plus personne, elle se déclare.
 *
 * ⭐ **Un démarrage dégradé vaut mieux qu'une absence de démarrage.** Ni la
 * médiathèque ni le trousseau ne portent les campagnes — celles-ci arrivent par
 * la réhydratation du magasin persisté, qui ne passe pas par ici. Rien de ce que
 * fait le démarrage ne justifie de garder le meneur dehors.
 *
 * ⛔ **Mais une étape manquée doit SE VOIR.** Sans cela on aurait échangé un
 * blocage visible contre une panne muette — *et une panne muette se découvre en
 * séance.* Le rapport dit ce qui manque, l'écran l'affiche, et l'appelant le
 * dit à voix haute.
 *
 * ⚠️ **Expirer n'est pas annuler.** Une promesse ne s'interrompt pas : on cesse
 * de l'attendre, elle continue. Si elle aboutit plus tard, son résultat est
 * simplement ignoré — la médiathèque, elle, sera rechargée à la première
 * ouverture, parce que ses lecteurs testent `isInitialized` avant de s'en
 * servir.
 */

/** Ce qu'une étape est devenue. */
export type EtatDEtape = 'faite' | 'echouee' | 'expiree';

export interface EtapeDeDemarrage {
    /** Affiché tel quel à l'écran d'attente : il doit se lire, pas se décoder. */
    readonly nom: string;
    /**
     * ⛔ Le délai au-delà duquel on cesse d'attendre. **Sans lui, tout ce module
     * ne sert à rien** — c'est la borne, et pas la liste, qui referme le défaut.
     */
    readonly delaiMs: number;
    readonly faire: () => Promise<unknown>;
}

export interface ResultatDEtape {
    readonly nom: string;
    readonly etat: EtatDEtape;
    /** Pourquoi elle a manqué — vide quand elle est faite. */
    readonly motif?: string;
}

export interface RapportDeDemarrage {
    readonly etapes: readonly ResultatDEtape[];
    /** Au moins une étape n'a pas abouti : l'application tourne, amputée. */
    readonly degrade: boolean;
}

/** Le texte d'une erreur, quoi qu'on nous ait jeté. */
function motifDe(erreur: unknown): string {
    if (erreur instanceof Error) return erreur.message;
    if (typeof erreur === 'string' && erreur.trim() !== '') return erreur;
    return 'erreur sans message';
}

/**
 * Mène **une** étape, et rend toujours un résultat — jamais un rejet.
 *
 * ⚠️ `faire()` est appelée **dans** une promesse : une fonction qui lève
 * *avant* son premier `await` lèverait sinon de façon synchrone, hors de toute
 * capture, et reconstituerait exactement le blocage qu'on referme.
 */
export function menerUneEtape(etape: EtapeDeDemarrage): Promise<ResultatDEtape> {
    let minuteur: ReturnType<typeof setTimeout> | undefined;

    const expiration = new Promise<ResultatDEtape>(resoudre => {
        minuteur = setTimeout(
            () => resoudre({
                nom: etape.nom,
                etat: 'expiree',
                motif: `aucune réponse après ${Math.round(etape.delaiMs / 1000)} s`,
            }),
            etape.delaiMs,
        );
    });

    const travail = Promise.resolve()
        .then(() => etape.faire())
        .then<ResultatDEtape, ResultatDEtape>(
            () => ({ nom: etape.nom, etat: 'faite' }),
            (erreur: unknown) => ({ nom: etape.nom, etat: 'echouee', motif: motifDe(erreur) }),
        );

    return Promise.race([travail, expiration]).finally(() => clearTimeout(minuteur));
}

/**
 * Mène toutes les étapes, **l'une après l'autre**, et rend le rapport.
 *
 * ⚠️ **En file et non de front, alors que deux d'entre elles se faisaient en
 * parallèle avant.** Chacune porte désormais son propre budget : de front, une
 * étape lente masquerait le nom de celle qui bloque vraiment, et c'est
 * précisément ce nom qu'on est venu chercher. Le surcoût est de l'ordre du
 * millième de seconde sur un démarrage sain ; sur un démarrage malade, la somme
 * des délais est bornée et connue d'avance.
 *
 * `surAvancement` est appelée **avant** chaque étape avec son nom, puis une
 * dernière fois avec `null` — c'est ce qui alimente l'écran d'attente.
 */
export async function menerLeDemarrage(
    etapes: readonly EtapeDeDemarrage[],
    surAvancement?: (enCours: string | null, rendus: readonly ResultatDEtape[]) => void,
): Promise<RapportDeDemarrage> {
    const rendus: ResultatDEtape[] = [];

    for (const etape of etapes) {
        surAvancement?.(etape.nom, [...rendus]);
        rendus.push(await menerUneEtape(etape));
    }

    surAvancement?.(null, [...rendus]);

    return { etapes: rendus, degrade: rendus.some(r => r.etat !== 'faite') };
}

/**
 * Ce qu'on dit au meneur quand le démarrage est incomplet — ou `null` s'il ne
 * l'est pas.
 *
 * ⛔ **Les noms des étapes manquées, et pas un compte.** « 2 étapes ont échoué »
 * n'aide personne ; « Médiathèque » dit où regarder. *Un avertissement qui ne
 * désigne rien se referme sans être lu.*
 */
export function alerteDuDemarrage(rapport: RapportDeDemarrage): string | null {
    const manquees = rapport.etapes.filter(e => e.etat !== 'faite');
    if (manquees.length === 0) return null;

    return `Démarrage incomplet — ${manquees.map(e => `${e.nom} (${e.motif ?? e.etat})`).join(', ')}`;
}
