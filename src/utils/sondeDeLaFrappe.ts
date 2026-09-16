/**
 * **Où va la frappe ?** — la sonde qui nommera le coupable.
 *
 * *Signalé par David le 2026-09-16 : « je n'arrive pas à changer le titre d'un
 * indice. De temps en temps, je n'arrive pas à modifier un champ texte ».*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ POURQUOI UNE SONDE, ET PAS UN CORRECTIF
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Six pistes ont été lues et écartées : l'`AIPromptOverlay` (il rend `null`
 * fermé), la garde des pastilles (elle écarte bien `INPUT` et `TEXTAREA`), le
 * vol de focus de la main de cartes (tablette seulement), l'état local du
 * formulaire, l'enregistrement, et le Spotlight (il ne lit que `Ctrl+K` et les
 * flèches).
 *
 * ⚠️ **Et la première sonde proposée était la mauvaise.** J'avais supposé un
 * fil d'affichage bloqué et proposé un observateur de tâches longues. David a
 * répondu que **le reste de l'écran répond normalement** : le fil n'est pas
 * bloqué, et cet observateur n'aurait rien trouvé. *Une mesure fondée sur une
 * hypothèse fausse ne corrige pas l'hypothèse, elle la confirme.*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QU'ELLE DISTINGUE — trois causes, trois verdicts
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * | Verdict | Ce que ça veut dire | Où chercher ensuite |
 * | --- | --- | --- |
 * | `hors-champ` | La touche est partie alors qu'**aucun champ n'avait le focus** | Quelque chose a volé ou refusé le focus |
 * | `frappe-refusee` | Le champ avait le focus, **et sa valeur n'a pas bougé** | `defaultPrevented`, `disabled`, `readOnly`, ou un rendu qui réécrit |
 * | *(rien)* | La lettre s'est inscrite | — |
 *
 * ⚠️ **Elle écrit dans le journal de débogage PERSISTÉ, pas dans la console.**
 * Le défaut est intermittent : *un instrument qu'il faut armer d'avance est un
 * instrument éteint au moment qui compte.* Le journal survit au rechargement, et
 * David peut le relire après coup.
 *
 * ⚠️ **Elle est silencieuse tant que tout va bien**, et elle se tait aussi
 * pendant une rafale : sans cela, une seconde de blocage écrirait quarante
 * lignes et noierait la seule qui compte.
 */

/** Ce qu'une frappe perdue nous apprend. */
export interface FrappePerdue {
    verdict: 'hors-champ' | 'frappe-refusee';
    /** La touche, telle que le clavier l'a rendue. */
    touche: string;
    /** `INPUT`, `TEXTAREA`, `BODY`… — ce qui avait le focus au moment de la frappe. */
    cible: string;
    /** L'identifiant du champ visé, quand il en porte un. */
    champ?: string;
    /** Quelqu'un a-t-il appelé `preventDefault` ? **La question qui tranche.** */
    refusee: boolean;
    /** Le champ était-il inerte ? */
    inerte: boolean;
    /** Le focus a-t-il changé pendant la frappe ? */
    focusDeplace: boolean;
}

/** Une frappe qui écrit un caractère — les autres n'ont rien à inscrire. */
function estUneFrappeDEcriture(evenement: KeyboardEvent): boolean {
    if (evenement.ctrlKey || evenement.metaKey || evenement.altKey) return false;
    /* `e.key` d'une touche imprimable fait exactement un caractère : « a », « 1 »,
       « é ». `Shift`, `ArrowLeft`, `Enter` en font plusieurs. */
    return evenement.key.length === 1;
}

/** Le champ de saisie qui a le focus, ou `null`. */
function champActif(): HTMLInputElement | HTMLTextAreaElement | null {
    const actif = typeof document !== 'undefined' ? document.activeElement : null;
    if (actif instanceof HTMLInputElement || actif instanceof HTMLTextAreaElement) return actif;
    return null;
}

/**
 * ⚠️ **Les champs qui n'écrivent pas de texte ne comptent pas.** Une case à
 * cocher ou un curseur ont bien un `value`, mais taper dedans ne doit rien y
 * inscrire : les signaler remplirait le journal de faux positifs, *et un
 * journal qui crie tout le temps ne se lit plus.*
 */
const TYPES_MUETS = new Set([
    'checkbox', 'radio', 'range', 'color', 'file', 'button', 'submit', 'reset', 'image',
]);

function ecritDuTexte(champ: HTMLInputElement | HTMLTextAreaElement): boolean {
    if (champ instanceof HTMLTextAreaElement) return true;
    return !TYPES_MUETS.has(champ.type);
}

/** Le délai avant de constater : assez pour laisser React réécrire la valeur. */
const DELAI_DE_CONSTAT = 60;

/** Le temps de silence après un signalement. Voir l'en-tête : on ne noie pas. */
export const SILENCE_APRES_UN_SIGNALEMENT = 3000;

/**
 * Surveille les frappes et signale celles qui se perdent.
 *
 * Rend la fonction qui démonte la sonde. `maintenant` et `differer` sont
 * injectés pour que les essais n'aient pas à attendre.
 */
export function surveillerLaFrappe(
    signaler: (perdue: FrappePerdue) => void,
    options: {
        cible?: Pick<Window, 'addEventListener' | 'removeEventListener'>;
        differer?: (rappel: () => void, delai: number) => unknown;
        maintenant?: () => number;
    } = {},
): () => void {
    const cible = options.cible ?? (typeof window !== 'undefined' ? window : null);
    if (!cible) return () => { /* rien à démonter */ };

    const differer = options.differer
        ?? ((rappel: () => void, delai: number) => setTimeout(rappel, delai));
    const maintenant = options.maintenant ?? (() => Date.now());

    let dernierSignalement = -Infinity;

    const auClavier = (evenement: KeyboardEvent) => {
        if (!estUneFrappeDEcriture(evenement)) return;

        const avant = champActif();
        const valeurAvant = avant?.value;

        differer(() => {
            /* Une rafale n'écrit qu'une ligne. */
            if (maintenant() - dernierSignalement < SILENCE_APRES_UN_SIGNALEMENT) return;

            const apres = champActif();

            /*
              **Aucun champ n'avait le focus.** C'est le cas le plus parlant : la
              touche est bien arrivée à la fenêtre, mais personne n'était là pour
              l'inscrire. On ne le signale que si le focus n'était pas non plus
              sur un champ AVANT — sinon c'est un simple changement de champ.
            */
            if (!avant) {
                const actif = typeof document !== 'undefined' ? document.activeElement : null;
                dernierSignalement = maintenant();
                signaler({
                    verdict: 'hors-champ',
                    touche: evenement.key,
                    cible: actif?.tagName ?? 'AUCUN',
                    refusee: evenement.defaultPrevented,
                    inerte: false,
                    focusDeplace: false,
                });
                return;
            }

            if (!ecritDuTexte(avant)) return;

            /* La lettre s'est inscrite : rien à dire. */
            if (avant.value !== valeurAvant) return;

            dernierSignalement = maintenant();
            signaler({
                verdict: 'frappe-refusee',
                touche: evenement.key,
                cible: avant.tagName,
                ...(avant.id ? { champ: avant.id } : {}),
                refusee: evenement.defaultPrevented,
                inerte: avant.disabled || avant.readOnly,
                focusDeplace: apres !== avant,
            });
        }, DELAI_DE_CONSTAT);
    };

    /*
      **En phase de CAPTURE.** Un écouteur de bulle ne verrait rien si quelqu'un
      appelait `stopPropagation` en chemin — et c'est précisément l'une des trois
      causes qu'on cherche à distinguer. *Une sonde qu'on peut faire taire ne
      mesure que les cas où elle n'était pas utile.*
    */
    cible.addEventListener('keydown', auClavier as EventListener, true);
    return () => cible.removeEventListener('keydown', auClavier as EventListener, true);
}

/** Ce qu'on écrit au journal, à partir d'un constat. */
export function messageDeLaFrappePerdue(perdue: FrappePerdue): string {
    if (perdue.verdict === 'hors-champ') {
        return `Frappe « ${perdue.touche} » perdue : aucun champ n'avait le focus `
            + `(${perdue.cible}).`;
    }

    const causes = [
        perdue.refusee ? 'preventDefault appelé' : null,
        perdue.inerte ? 'champ inerte (disabled/readOnly)' : null,
        perdue.focusDeplace ? 'le focus a changé pendant la frappe' : null,
    ].filter(Boolean);

    return `Frappe « ${perdue.touche} » refusée par ${perdue.champ ?? perdue.cible} `
        + `— ${causes.length > 0 ? causes.join(', ') : 'la valeur n’a pas bougé, sans cause visible'}.`;
}
