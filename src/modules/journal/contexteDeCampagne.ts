/**
 * Ce que le modèle doit savoir avant d'écrire le compte rendu d'une séance.
 *
 * **Le défaut, relevé le 2026-08-19 en lisant un vrai résumé.** `summarizeSession`
 * ne recevait que le fil des événements et la note finale. Rien sur le jeu, rien
 * sur la campagne. Le modèle a donc intitulé une séance d'Alien sur Hadley Hope
 * « **Chroniques des Terres Oubliées** » et l'a écrite en heroic-fantasy — ce
 * qui est la seule chose raisonnable à faire quand on ne vous dit rien : il a
 * inventé un cadre, parce qu'il en fallait un.
 *
 * *Un modèle à qui l'on ne donne pas le cadre ne se tait pas sur le cadre : il
 * en invente un.* C'est la même leçon que « HP undefined/undefined » envoyé à
 * l'Oracle le 2026-08-14 — le Sage ne pouvait qu'ignorer ces nombres ou les
 * inventer.
 *
 * **Le store de séance est atteint par le global**, comme le fait déjà
 * `clotureDeSeance` : un import direct fermerait un cycle entre le journal et la
 * séance. Et toute absence est un cas normal — *un résumé ne doit pas échouer
 * parce qu'une campagne a été supprimée entre-temps.*
 */

/** Ce qu'on sait dire d'une campagne au modèle. Tout y est facultatif. */
export interface ContexteDeCampagne {
    /** Le nom de la campagne, tel qu'il se lit. */
    campagne?: string;
    /** Le jeu — « alien », « cthulhu hack »… tel que la campagne le déclare. */
    systeme?: string;
    /** Le pitch, s'il a été écrit : c'est lui qui porte le ton. */
    synopsis?: string;
    /** Les personnages joueurs présents en fin de séance. */
    personnages?: string[];
}

/** Vrai quand il n'y a rien à dire — auquel cas on n'écrit pas d'en-tête vide. */
export const contexteEstVide = (c: ContexteDeCampagne): boolean =>
    !c.campagne && !c.systeme && !c.synopsis && !(c.personnages && c.personnages.length > 0);

/**
 * Le contexte d'un journal, relevé au moment de résumer.
 *
 * **Les personnages viennent de l'état de fin du journal, pas de la table
 * d'aujourd'hui.** Un journal se relit des mois plus tard : nommer les
 * personnages actuels d'une campagne dans le compte rendu d'une vieille séance
 * ferait apparaître des gens qui n'y étaient pas. `etatDeFin` est une
 * photographie, et c'est précisément pour cela qu'il est conservé.
 */
export function contexteDuJournal(journal: {
    campaignId?: string;
    etatDeFin?: { presentPCs?: Array<{ name: string }> };
}): ContexteDeCampagne {
    const personnages = (journal.etatDeFin?.presentPCs ?? [])
        .map(p => p.name?.trim())
        .filter((n): n is string => !!n);

    const campagne = journal.campaignId ? campagneParId(journal.campaignId) : undefined;

    return {
        ...(campagne?.name?.trim() ? { campagne: campagne.name.trim() } : {}),
        ...(campagne?.system?.trim() ? { systeme: campagne.system.trim() } : {}),
        /*
          `synopsis` d'abord, `description` en repli : le premier est le pitch
          que la Forge écrit, le second la ligne que le meneur tape à la
          création. L'un des deux suffit à poser le ton, et c'est tout ce qu'on
          demande ici.
        */
        ...(pitch(campagne) ? { synopsis: pitch(campagne) } : {}),
        ...(personnages.length > 0 ? { personnages } : {}),
    };
}

type CampagneLue = { name?: string; system?: string; synopsis?: string; description?: string };

const pitch = (c: CampagneLue | undefined): string | undefined =>
    c?.synopsis?.trim() || c?.description?.trim() || undefined;

function campagneParId(id: string): CampagneLue | undefined {
    try {
        const magasin = (window as unknown as {
            useSessionOSStore?: { getState: () => { campaigns?: (CampagneLue & { id: string })[] } };
        }).useSessionOSStore?.getState();
        return (magasin?.campaigns ?? []).find(c => c.id === id);
    } catch {
        // Un contexte manquant dégrade le résumé ; une exception l'empêcherait.
        return undefined;
    }
}
