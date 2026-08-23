/**
 * Parler à l'afficheur Ulanzi (AWTRIX 3).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TROIS FAITS VÉRIFIÉS SUR L'APPAREIL LE 2026-08-23, ET NON SUPPOSÉS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **1. `Content-Type: application/json` est obligatoire.** Sans lui, AWTRIX
 * **refuse la requête en silence** : aucune erreur, aucun refus visible,
 * l'application n'apparaît simplement jamais dans `/api/loop`. Le relais du
 * Light OS ne posait pas d'en-tête — le pont Hue s'en passe — d'où l'ajout de
 * `headers` dans `light:request` le même jour. *Un échec silencieux est pire
 * qu'un échec bruyant : rien ne le signale au moment où on le cause.*
 *
 * **2. `lifetime` fonctionne.** Une application poussée avec `lifetime: 25` et
 * `lifetimeMode: 0` se retire d'elle-même. C'est le filet de sécurité : si
 * GM-OS meurt, l'afficheur revient seul à sa routine **sans que GM-OS ait eu à
 * mourir proprement**. D'où le battement : on republie plus souvent qu'on
 * n'expire.
 *
 * **3. Mais `lifetime` rend les pixels, pas la routine.** Les applications
 * natives se coupent par les réglages `TIM`/`DAT`/`HUM`/`TEMP`/`BAT`. Si GM-OS
 * plante **après** les avoir coupées, `lifetime` retire bien nos widgets — et
 * l'afficheur reste **noir**. D'où la règle ci-dessous, qui est la plus
 * importante de ce fichier.
 *
 * @see documentation/Planning/2026-08-23-afficheur-ulanzi.md
 */

/** L'appareil de David, trouvé sur le réseau le 2026-08-23. */
export const HOTE_PAR_DEFAUT = 'awtrix_73f7a4.local';

/**
 * Les applications natives que la séance fait taire — **l'horloge comprise**.
 *
 * **Une première version gardait `TIM` allumée**, pour qu'un plantage de GM-OS
 * laisse un afficheur montrant l'heure plutôt qu'un écran noir. David, le
 * 2026-08-23 : *« on ne sait pas enlever Time aussi ? »* — si, et c'est mieux.
 * Vérifié : `TIM: false` + redémarrage laisse `{"gmos_quarts": 0}` seul dans la
 * boucle, donc le défilé en permanence.
 *
 * **Le filet n'a pas disparu, il a changé de nature — et il est plus honnête.**
 * Une horloge laissée par un GM-OS mort est *indiscernable d'un fonctionnement
 * normal* : elle cache la panne. Un afficheur éteint la montre. Et la vraie
 * réparation ne se joue pas là : `rendreLaMain` est rejouée **au prochain
 * démarrage** de GM-OS depuis la routine persistée. *Un filet qui ne rattrape
 * qu'à l'instant de la chute n'en est pas un.*
 */
export const NATIVES_A_COUPER = ['TIM', 'HUM', 'TEMP', 'BAT'] as const;

/** Ce qu'on relève avant de prendre la main, pour pouvoir le remettre. */
export interface RoutineSauvegardee {
    ATIME: number;
    /** Facultatif : les routines enregistrées avant le 2026-08-23 n'en ont pas. */
    TIM?: boolean;
    HUM: boolean;
    TEMP: boolean;
    BAT: boolean;
}

export interface ChargeDeWidget {
    draw?: unknown[];
    text?: string;
    lifetime?: number;
    lifetimeMode?: 0 | 1;
    duration?: number;
    [autre: string]: unknown;
}

type Relais = (
    url: string,
    method: string,
    body?: unknown,
    headers?: Record<string, string>,
) => Promise<unknown>;

/** Les en-têtes sans lesquels AWTRIX ignore tout ce qu'on lui envoie. */
const EN_TETES_JSON = { 'Content-Type': 'application/json' };

function relais(): Relais | null {
    // `ulanzi` est un alias de `light` : les deux mènent au même canal. On
    // accepte les deux pour ne pas dépendre de l'ordre des mises à jour.
    const pont = window.appBridge?.ulanzi ?? window.appBridge?.light;
    return (pont?.request as Relais) ?? null;
}

export class UlanziService {
    /** Champ déclaré à part : le projet interdit les propriétés de constructeur
     *  (`erasableSyntaxOnly`), qui ne s'effacent pas à la compilation. */
    private readonly hote: string;

    constructor(hote: string = HOTE_PAR_DEFAUT) {
        this.hote = hote;
    }

    private get base(): string {
        // L'hôte peut être saisi avec ou sans schéma : on n'impose pas à David
        // de se souvenir duquel.
        const nu = this.hote.replace(/^https?:\/\//, '').replace(/\/+$/, '');
        return `http://${nu}`;
    }

    /**
     * **Toute erreur dit d'où elle vient.**
     *
     * La première version rendait un booléen : l'écran affichait « injoignable »
     * sans jamais dire si le pont manquait, si le nom ne résolvait pas, ou si
     * l'appareil avait refusé. *Un diagnostic qui ne distingue pas ses causes
     * oblige à toutes les chercher* — c'est le défaut que ce projet paie le plus
     * souvent. On nomme donc l'appel et on garde le message d'origine.
     */
    private async appeler(
        chemin: string,
        method: 'GET' | 'POST' = 'GET',
        corps?: unknown,
    ): Promise<unknown> {
        const envoyer = relais();
        if (!envoyer) {
            throw new Error(
                "pont Electron absent (window.appBridge.ulanzi et .light sont indisponibles) — " +
                'application lancée hors Electron, ou preload non rechargé.',
            );
        }
        const url = `${this.base}${chemin}`;
        try {
            return await envoyer(url, method, corps, EN_TETES_JSON);
        } catch (e) {
            const cause = e instanceof Error ? e.message : String(e);
            console.warn(`[Ulanzi] ${method} ${url} a échoué :`, cause);
            throw new Error(`${method} ${chemin} — ${cause}`);
        }
    }

    /**
     * L'appareil répond-il ?
     *
     * `/api/stats` est l'empreinte : c'est ce qui a permis de le distinguer
     * d'une imprimante et de deux autres hôtes en écoute sur le port 80.
     */
    async estJoignable(): Promise<{ ok: true } | { ok: false; pourquoi: string }> {
        try {
            const s = (await this.appeler('/api/stats')) as { uid?: string } | null;
            if (s && typeof s.uid === 'string') return { ok: true };
            return {
                ok: false,
                pourquoi: `l'hôte a répondu, mais sans « uid » — ce n'est pas un AWTRIX (reçu : ${JSON.stringify(s)?.slice(0, 80)})`,
            };
        } catch (e) {
            return { ok: false, pourquoi: e instanceof Error ? e.message : String(e) };
        }
    }

    async reglages(): Promise<Record<string, unknown>> {
        return (await this.appeler('/api/settings')) as Record<string, unknown>;
    }

    private async ecrireReglages(patch: Record<string, unknown>): Promise<void> {
        await this.appeler('/api/settings', 'POST', patch);
    }

    /** Pousse — ou remplace — une application personnalisée. */
    async pousserWidget(nom: string, charge: ChargeDeWidget): Promise<void> {
        await this.appeler(`/api/custom?name=${encodeURIComponent(nom)}`, 'POST', charge);
    }

    /** Retire une application personnalisée : un corps vide la supprime. */
    async retirerWidget(nom: string): Promise<void> {
        await this.appeler(`/api/custom?name=${encodeURIComponent(nom)}`, 'POST', {});
    }

    /** Redémarre l'appareil. Il revient en une dizaine de secondes. */
    async redemarrer(): Promise<void> {
        await this.appeler('/api/reboot', 'POST', {});
    }

    /**
     * Prendre la main pour la séance.
     *
     * **Mesuré le 2026-08-23, et contraire à ce que le plan supposait : les
     * interrupteurs `HUM`/`TEMP`/`BAT` ne s'appliquent PAS à chaud.** Mis à
     * `false`, les applications continuent de s'afficher ; c'est au démarrage
     * que la liste se construit. Vérifié en interrogeant `/api/stats.app`
     * toutes les 1,5 s : avant redémarrage la séquence était
     * `Temperature → Humidity → Battery → gmos_quarts → Time` ; après, il ne
     * restait que `Time → gmos_quarts`.
     *
     * *Un réglage qui s'écrit sans effet ne se distingue pas d'un réglage qui
     * marche — sauf à regarder ce que l'objet fait vraiment.* `/api/settings`
     * relisait bien `false`, et l'afficheur montrait la météo.
     *
     * D'où le redémarrage, et d'où **le fait qu'on ne l'inflige que si quelque
     * chose doit réellement changer**.
     *
     * On ne touche plus à `ATIME` : la durée du défilé se règle par `duration`
     * sur le widget lui-même, ce qui laisse l'horloge à sa cadence d'origine et
     * fait **un réglage de moins à rendre**.
     */
    async prendreLaMain(silencerLesNatives: boolean): Promise<RoutineSauvegardee> {
        const avant = await this.reglages();
        const routine: RoutineSauvegardee = {
            ATIME: Number(avant.ATIME ?? 7),
            TIM: avant.TIM !== false,
            HUM: avant.HUM !== false,
            TEMP: avant.TEMP !== false,
            BAT: avant.BAT !== false,
        };

        if (!silencerLesNatives) return routine;

        // Rien à faire si elles sont déjà muettes : un redémarrage gratuit est
        // dix secondes d'écran noir qu'on impose pour rien.
        const aChanger = NATIVES_A_COUPER.filter(clef => avant[clef] !== false);
        if (aChanger.length === 0) return routine;

        const patch: Record<string, unknown> = {};
        for (const clef of aChanger) patch[clef] = false;
        await this.ecrireReglages(patch);
        await this.redemarrer();

        return routine;
    }

    /**
     * Rendre la main.
     *
     * Remet exactement ce qui était là, et retire les widgets nommés. Tolère
     * l'absence de routine sauvegardée — après un redémarrage de GM-OS, on ne
     * sait plus ce qu'on avait pris, et on rend alors les valeurs d'usine
     * plutôt que de laisser l'afficheur amputé.
     */
    async rendreLaMain(routine: RoutineSauvegardee | null, widgets: string[]): Promise<void> {
        for (const nom of widgets) {
            try {
                await this.retirerWidget(nom);
            } catch {
                // Un widget qu'on n'arrive pas à retirer expirera de lui-même :
                // `lifetime` est là pour ça. On continue plutôt que d'abandonner
                // la restitution des réglages, qui elle n'a pas de filet.
            }
        }

        // Sans routine connue, on rend l'appareil à ses valeurs d'usine plutôt
        // que de le laisser amputé : mieux vaut rendre trop que pas assez.
        const aRemettre: RoutineSauvegardee =
            routine ?? { ATIME: 7, TIM: true, HUM: true, TEMP: true, BAT: true };
        const actuel = await this.reglages().catch(() => ({}) as Record<string, unknown>);

        const patch: Record<string, unknown> = {};
        for (const clef of NATIVES_A_COUPER) {
            // `TIM` absent d'une routine ancienne : on le rend allumé, qui est
            // sa valeur d'usine, plutôt que de le laisser éteint pour toujours.
            const etaitAllume = clef === 'TIM' ? aRemettre.TIM !== false : aRemettre[clef];
            if (etaitAllume && actuel[clef] === false) patch[clef] = true;
        }

        if (Object.keys(patch).length === 0) return;

        // **Rendre exige le même redémarrage que prendre.** Se contenter
        // d'écrire les réglages laisserait l'afficheur amputé jusqu'à sa
        // prochaine coupure de courant — c'est-à-dire ne pas rendre du tout.
        await this.ecrireReglages(patch);
        await this.redemarrer();
    }
}
