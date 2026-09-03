/**
 * **La porte du micro et le ducking — les deux décisions, sans audio.**
 *
 * *Défauts signalés par David le 2026-09-03 : « le son se coupe ou sature trop
 * facilement ».*
 *
 * Ces deux décisions vivaient dans la boucle de mesure du `VoiceEngine`, mêlées
 * au calcul du RMS, aux envois vers le Hub et à un `setTimeout`. Elles sortent
 * ici pour la même raison que `suivreLaVoix.ts` : **une règle qui décide de
 * couper la voix du meneur doit pouvoir être éprouvée sans micro ni enceinte.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI LA PORTE COUPAIT DES MOTS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * L'ancienne règle tenait en une ligne : `db < seuil` → on ferme. Un seul seuil,
 * aucun maintien. Deux conséquences, toutes deux audibles :
 *
 * - **Le broutage.** La parole passe le seuil des dizaines de fois par phrase —
 *   entre deux mots, sur une consonne sourde, à la fin d'un souffle. La porte
 *   commençait à se refermer à chaque creux, et le mot suivant repartait d'un
 *   gain déjà descendu. *Un seuil unique transforme un silence de 80 ms en
 *   coupure.*
 * - **Le seuil qui ne veut rien dire.** La mesure était prise **après** le
 *   compresseur (ratio 8:1) et **après** le gain de sortie. Un compresseur
 *   écrase justement les écarts que le seuil cherche à lire, et baisser le
 *   volume de sortie faisait descendre la mesure : *le curseur de volume
 *   fermait la porte.*
 *
 * D'où les deux remèdes classiques, qui n'y étaient pas :
 *
 * 1. **Une hystérésis** : on ouvre à `seuil`, on ne se ferme qu'à
 *    `seuil - MARGE_DE_FERMETURE_DB`. Entre les deux, l'état ne change pas.
 * 2. **Un maintien** : une fois ouverte, la porte reste ouverte tant que le
 *    niveau n'est pas resté sous le seuil de fermeture pendant `MAINTIEN_MS`.
 *
 * Et la mesure est désormais prise **avant** le compresseur, juste après le
 * coupe-bas — c'est-à-dire sur la voix, pas sur ce qu'on en a fait.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LA PORTE S'OUVRE VITE, ELLE SE FERME LENTEMENT — ET ELLE ÉCHOUE OUVERTE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Les deux constantes de temps ne sont pas symétriques : une ouverture lente
 * mange l'attaque du premier mot, une fermeture rapide claque. Et si la boucle
 * de mesure s'arrête — fenêtre réduite, onglet en arrière-plan —, l'état
 * courant persiste : **une porte bloquée ouverte laisse passer du souffle, une
 * porte bloquée fermée rend le meneur muet en pleine partie.** C'est pour ça
 * que rien ici ne ferme sans une mesure qui le demande.
 */

/** De combien il faut descendre SOUS le seuil d'ouverture pour fermer. */
export const MARGE_DE_FERMETURE_DB = 6;

/** Combien de temps le niveau doit rester bas avant que la porte se ferme. */
export const MAINTIEN_MS = 250;

/** Constante de temps d'ouverture : assez courte pour ne pas manger l'attaque. */
export const OUVERTURE_S = 0.005;

/** Constante de temps de fermeture : assez longue pour ne pas claquer. */
export const FERMETURE_S = 0.12;

/** Ce que la porte retient d'une mesure à l'autre. */
export interface EtatDeLaPorte {
    ouverte: boolean;
    /**
     * Dernier instant où le niveau était **au-dessus du seuil de fermeture**.
     *
     * C'est lui qui porte le maintien. Il se rafraîchit dans toute la bande
     * d'hystérésis, et pas seulement au-dessus du seuil d'ouverture : sinon le
     * maintien commencerait à courir pendant qu'on parle encore.
     */
    derniereVoixMs: number;
}

export interface MesureDeLaPorte {
    /** Le niveau mesuré, en dB (RMS, 0 dB = pleine échelle). */
    db: number;
    /** Le seuil d'ouverture réglé par le meneur. */
    seuilDb: number;
    /** Le micro est-il ouvert ? */
    micro: boolean;
    /** La porte est-elle armée ? Désarmée, elle laisse tout passer. */
    armee: boolean;
    /**
     * Le modèle de débruitage dit-il qu'on est en train de parler ?
     *
     * *Ajouté le 2026-09-03 avec RNNoise, qui rend une probabilité de voix par
     * trame.* Un détecteur entraîné sait ce qu'un seuil de niveau ne saura
     * jamais : qu'une fin de phrase soufflée à −55 dB est encore de la parole.
     *
     * ⚠️ **Il ne peut que TENIR la porte ouverte, jamais l'ouvrir.** Un modèle
     * qui se tromperait sur un bruit de fond ouvrirait alors le micro tout seul,
     * et le meneur n'aurait plus aucun moyen de se taire. *On accorde à une
     * estimation le droit de prolonger une décision, pas de la prendre.*
     */
    voix?: boolean;
    maintenantMs: number;
}

export const PORTE_FERMEE: EtatDeLaPorte = { ouverte: false, derniereVoixMs: 0 };

/**
 * L'état suivant de la porte.
 *
 * Fonction pure : le même état et la même mesure rendent toujours la même
 * décision, ce qui est la seule façon d'éprouver un broutage — on rejoue une
 * suite de mesures et on compte les changements d'état.
 */
export function porteSuivante(etat: EtatDeLaPorte, mesure: MesureDeLaPorte): EtatDeLaPorte {
    /*
      Micro fermé : la porte suit, et on ne touche pas à `derniereVoixMs` — le
      meneur qui rouvre son micro ne doit pas hériter d'un maintien qui a couru
      pendant qu'il était muet.
    */
    if (!mesure.micro) return { ouverte: false, derniereVoixMs: etat.derniereVoixMs };

    /* Porte désarmée : elle est grande ouverte, et son maintien reste à jour. */
    if (!mesure.armee) return { ouverte: true, derniereVoixMs: mesure.maintenantMs };

    const seuilDeFermeture = mesure.seuilDb - MARGE_DE_FERMETURE_DB;

    if (mesure.db >= mesure.seuilDb) {
        return { ouverte: true, derniereVoixMs: mesure.maintenantMs };
    }

    /*
      La voix détectée rafraîchit le maintien — mais seulement si la porte est
      déjà ouverte, cf. la remarque sur `voix`.
    */
    if (etat.ouverte && mesure.voix) {
        return { ouverte: true, derniereVoixMs: mesure.maintenantMs };
    }

    if (mesure.db >= seuilDeFermeture) {
        /*
          **La bande d'hystérésis ne décide de rien.** On garde l'état, et on
          rafraîchit le maintien seulement si la porte est ouverte : un souffle
          qui flotte dans cette bande ne doit pas ouvrir la porte, mais il ne
          doit pas non plus la fermer alors qu'on parle bas.
        */
        return {
            ouverte: etat.ouverte,
            derniereVoixMs: etat.ouverte ? mesure.maintenantMs : etat.derniereVoixMs,
        };
    }

    if (etat.ouverte && mesure.maintenantMs - etat.derniereVoixMs < MAINTIEN_MS) {
        return etat;
    }

    return { ouverte: false, derniereVoixMs: etat.derniereVoixMs };
}

/** Ce que le ducking retient d'une mesure à l'autre. */
export interface EtatDuDucking {
    duck: boolean;
    /** Dernier instant où la voix passait le seuil. */
    derniereVoixMs: number;
}

export interface MesureDuDucking {
    db: number;
    seuilDb: number;
    /** Le délai avant que l'ambiance remonte, en ms. */
    relacheMs: number;
    /** Le ducking est-il demandé, et le micro ouvert ? */
    actif: boolean;
    maintenantMs: number;
}

export const DUCKING_INACTIF: EtatDuDucking = { duck: false, derniereVoixMs: 0 };

/**
 * L'état suivant du ducking.
 *
 * **Le relâchement se compte, il ne se programme pas.** L'ancienne version
 * posait un `setTimeout` de 800 ms : un minuteur qui, dans une fenêtre réduite
 * par Chromium, ne se déclenche qu'une fois par seconde — *l'ambiance restait
 * alors baissée bien après la dernière phrase.* Ici, chaque mesure recalcule ;
 * si la boucle s'arrête, la mesure suivante rattrape le retard d'un coup.
 */
export function duckingSuivant(etat: EtatDuDucking, mesure: MesureDuDucking): EtatDuDucking {
    if (!mesure.actif) return DUCKING_INACTIF;

    if (mesure.db >= mesure.seuilDb) {
        return { duck: true, derniereVoixMs: mesure.maintenantMs };
    }

    if (etat.duck && mesure.maintenantMs - etat.derniereVoixMs < mesure.relacheMs) {
        return etat;
    }

    return { duck: false, derniereVoixMs: etat.derniereVoixMs };
}

/**
 * Le niveau RMS d'une trame, en linéaire et en dB.
 *
 * ⚠️ **Lit des flottants, et c'est le point.** La boucle lisait
 * `getByteTimeDomainData` — huit bits, soit un pas de quantification de 1/128.
 * Toute la plage sous **−42 dB** y tient en un seul pas : un seuil de porte
 * réglé à −50 dB portait donc sur une mesure incapable de distinguer −45 de
 * −70. `getFloatTimeDomainData` coûte exactement la même chose.
 */
export function niveauRMS(trame: Float32Array): { rms: number; db: number } {
    let somme = 0;
    for (let i = 0; i < trame.length; i++) somme += trame[i] * trame[i];
    const rms = Math.sqrt(somme / (trame.length || 1));
    return { rms, db: 20 * Math.log10(rms || 1e-7) };
}
