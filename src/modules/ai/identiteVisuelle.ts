import type { IdentiteVisuelle } from '../../types/drivers';
import type { Campaign } from '../../types/campaign.types';

/**
 * **L'identité visuelle en vigueur, et sa place dans l'invite** — 2026-10-17.
 *
 * Le jeu donne le défaut ; la campagne le **complète** (`mode` absent ou
 * `complete`) ou le **remplace**. Tout est pur ici : `AIService` lit la partie
 * en cours et appelle ces deux fonctions, et la fenêtre d'invite montre la même
 * chose — *une identité qu'on applique sans la montrer serait un style qu'on ne
 * comprend pas.*
 */

type IdentiteDeCampagne = NonNullable<Campaign['identiteVisuelle']>;

const net = (texte: string | undefined) => (texte ?? '').replace(/\s+/g, ' ').trim();
const images = (i: IdentiteVisuelle | undefined) => (i?.references ?? []).filter(r => typeof r === 'string' && r.startsWith('data:image/')).slice(0, 4);
const vide = (i: IdentiteVisuelle | undefined) => !i || (!net(i.style) && !net(i.aEviter) && images(i).length === 0);
/** Les images d'exemple : celles de la campagne, sinon celles du jeu ; quatre au plus. */
const referencesDe = (duJeu: IdentiteVisuelle | undefined, deLaCampagne: IdentiteVisuelle | undefined) => {
    const choisies = images(deLaCampagne).length ? images(deLaCampagne) : images(duJeu);
    return choisies.length ? choisies : undefined;
};
const joindre = (...morceaux: (string | undefined)[]) => morceaux.map(net).filter(Boolean).join('. ');

/** Les images ne s'écrivent que s'il y en a : une identité sans image reste comparable à l'ancienne. */
function avecImages(identite: IdentiteVisuelle, references: string[] | undefined): IdentiteVisuelle {
    return references && references.length ? { ...identite, references } : identite;
}

export function identiteEnVigueur(
    pilote: { identiteVisuelle?: IdentiteVisuelle } | null | undefined,
    campagne: { identiteVisuelle?: IdentiteDeCampagne } | null | undefined,
): IdentiteVisuelle | null {
    const duJeu = pilote?.identiteVisuelle;
    const deLaCampagne = campagne?.identiteVisuelle;
    if (!vide(deLaCampagne)) {
        if (deLaCampagne!.mode === 'remplace' || vide(duJeu)) {
            return avecImages({ style: net(deLaCampagne!.style), aEviter: net(deLaCampagne!.aEviter) || undefined },
                deLaCampagne!.mode === 'remplace' ? images(deLaCampagne) : referencesDe(duJeu, deLaCampagne));
        }
        return avecImages({
            style: joindre(duJeu!.style, deLaCampagne!.style),
            aEviter: joindre(duJeu!.aEviter, deLaCampagne!.aEviter) || undefined,
        }, referencesDe(duJeu, deLaCampagne));
    }
    if (vide(duJeu)) return null;
    return avecImages({ style: net(duJeu!.style), aEviter: net(duJeu!.aEviter) || undefined }, images(duJeu));
}

/**
 * L'identité s'ajoute **en fin d'invite** : le sujet d'abord, qui dit quoi
 * montrer, puis le style, qui dit comment. Sans identité, l'invite part telle
 * quelle.
 *
 * « Never include » plutôt qu'une invite négative : FLUX n'en a pas, et la
 * consigne en clair est ce qui s'en approche le plus.
 */
export function inviteAvecLIdentite(invite: string, identite: IdentiteVisuelle | null): string {
    if (!identite) return invite;
    const morceaux = [invite.trim()];
    if (net(identite.style)) morceaux.push(`Visual identity: ${net(identite.style).replace(/\.$/, '')}.`);
    if (net(identite.aEviter)) morceaux.push(`Never include: ${net(identite.aEviter).replace(/\.$/, '')}.`);
    return morceaux.join(' ');
}
