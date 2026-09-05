import React, { useEffect, useRef } from 'react';
import { videoDuMarqueur, adresseDIntegration } from '../../modules/web/youtube';
import { useNiveauDuLecteurYouTube } from '../../modules/web/pilotageDuLecteurYouTube';

/**
 * **Ce que le Hub affiche derrière tout le reste : image, film, ou cadre distant.**
 *
 * Écrit le 2026-09-05, sur un retour de David : *« la vidéo ne se lance pas sur
 * le Player Hub »*.
 *
 * ⛔ **Le Hub peignait toute projection en `background-image`.** Une image de
 * fond CSS ne peut pas jouer un film : la vidéo arrivait bien, et **rien ne
 * s'affichait**. Les deux hubs — celui de la table et celui des tablettes —
 * portaient chacun leur copie de ce fond ; ils partagent désormais celui-ci,
 * *parce que deux écrivains pour une même donnée finissent toujours par
 * diverger.*
 *
 * ⚠️ **Le Hub ne devine pas ce qu'il reçoit.** Il lui arrive une adresse déjà
 * résolue — `http://…/temp/m-1757…` — sans extension. `estUneVideo` lui est donc
 * **annoncé** par le meneur ; voir [[natureDuMedia]]. Seul le marqueur YouTube
 * se reconnaît tout seul, puisqu'il voyage en clair.
 */

interface FondProjeteProps {
    /** L'adresse résolue du média, ou un marqueur `__youtube__…`. */
    url: string;
    /** Le meneur a-t-il annoncé un film ? */
    estUneVideo: boolean;
    /**
     * Le son est-il permis sur cette surface ?
     *
     * ⛔ **Faux sur les tablettes des joueurs, et c'est délibéré.** L'écran de la
     * table est unique ; les tablettes sont cinq. *Cinq appareils jouant la même
     * bande-son avec un décalage de réseau ne font pas une ambiance, ils font du
     * bruit.* Le son de la table appartient aux enceintes de la table.
     */
    avecSon?: boolean;
    /** Le niveau dicté par le meneur, entre 0 et 1. */
    niveauSonore?: number;
    className?: string;
    style?: React.CSSProperties;
}

const FondProjete: React.FC<FondProjeteProps> = ({
    url,
    estUneVideo,
    avecSon = false,
    niveauSonore = 1,
    className = '',
    style,
}) => {
    const element = useRef<HTMLVideoElement | null>(null);
    const cadre = useRef<HTMLIFrameElement | null>(null);
    const video = videoDuMarqueur(url);

    /*
      ⭐ **Le volume d'une vidéo YouTube obéit aussi — 2026-09-05.**

      J'avais annoncé le contraire à David. C'était confondre l'enceinte et le
      niveau : la première reste hors de portée, le second se commande. Voir
      [[pilotageDuLecteurYouTube]].
    */
    useNiveauDuLecteurYouTube(cadre, niveauSonore, avecSon);

    /*
      **Le cadre naît muet si la table l'est.** Le lecteur commence à jouer avant
      d'écouter quoi que ce soit : sur une table coupée, il ferait entrer un
      éclat de son que l'ordre suivant éteindrait une seconde trop tard.

      ⚠️ **Figé au montage, exprès.** Recalculer l'adresse à chaque changement de
      niveau rechargerait le cadre — *la vidéo repartirait du début à chaque coup
      de curseur.*
    */
    const muetAuDepart = useRef(!avecSon || niveauSonore === 0);

    /*
      **Le niveau s'applique à l'élément, pas par un attribut** — React n'a pas de
      propriété `volume`. L'effet se rejoue aussi quand l'adresse change : un
      nouveau `<video>` naît toujours à plein volume, et *un réglage qui ne se
      réapplique pas à la relève n'est vrai qu'une fois.*
    */
    useEffect(() => {
        if (element.current) element.current.volume = avecSon ? niveauSonore : 0;
    }, [niveauSonore, avecSon, url]);

    /*
      **Si la lecture avec son est refusée, on joue en muet plutôt que rien.**

      Un navigateur de tablette refuse la lecture automatique sonore sans geste
      de l'utilisateur, et **le refus est silencieux** : la vidéo resterait figée
      sur sa première image, indiscernable d'une photographie. *Une dégradation
      annoncée vaut mieux qu'une panne muette.*
    */
    useEffect(() => {
        const noeud = element.current;
        if (!noeud) return;

        noeud.play().catch((raison) => {
            console.warn('[FondProjete] Lecture avec son refusée, reprise en muet :', raison);
            noeud.muted = true;
            noeud.play().catch(() => { /* Là, il n'y a plus rien à tenter. */ });
        });
    }, [url]);

    if (video) {
        return (
            <iframe
                ref={cadre}
                src={adresseDIntegration(video, { muet: muetAuDepart.current })}
                title="Vidéo YouTube projetée"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className={`${className} border-0`}
                style={style}
            />
        );
    }

    if (estUneVideo) {
        return (
            <video
                ref={element}
                key={url}
                src={url}
                autoPlay
                loop
                playsInline
                muted={!avecSon}
                className={`${className} object-cover`}
                style={style}
            />
        );
    }

    return (
        <div
            className={className}
            style={{ ...style, backgroundImage: `url('${url}')` }}
        />
    );
};

export default FondProjete;
