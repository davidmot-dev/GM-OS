import { useEffect, useRef } from 'react';
import { useUlanziStore } from './useUlanziStore';
import { UlanziService } from './UlanziService';
import { composerDefile } from './widgets/defileDesQuarts';

/** Le nom de l'application côté AWTRIX. Stable : republier remplace. */
export const NOM_DU_WIDGET = 'gmos_quarts';

/**
 * Combien de temps un widget survit sans être republié.
 *
 * **C'est le délai au bout duquel l'afficheur se libère si GM-OS meurt.**
 * Assez long pour qu'un hoquet réseau ne fasse pas clignoter la table, assez
 * court pour qu'un plantage ne laisse pas un Quart figé toute la soirée.
 */
export const DUREE_DE_VIE = 90;

/** On republie trois fois par durée de vie : deux pertes d'affilée pardonnées. */
export const BATTEMENT_MS = 30_000;

/**
 * Le battement : GM-OS republie, l'afficheur oublie.
 *
 * **Pourquoi une horloge et non un envoi.** Un widget poussé une fois resterait
 * là même si GM-OS disparaissait — et afficherait alors un Quart qui n'avance
 * plus. *Un afficheur qui ment sur un compteur est pire qu'un afficheur éteint,
 * parce qu'il est crédible.* En publiant avec une durée de vie courte et en
 * republiant régulièrement, on obtient la propriété voulue sans que GM-OS ait
 * à mourir proprement : **cesser d'émettre suffit à rendre l'objet.**
 *
 * C'est le pendant de la règle du journal d'Ollama — *un afficheur absent ne
 * doit jamais emporter ce qu'il décrivait* — vue de l'autre côté :
 * **l'absence de GM-OS ne doit rien laisser derrière.**
 */
export function useBattementUlanzi(seanceOuverte: boolean): void {
    // `routine` n'est volontairement pas lu ici : la restitution la relit dans
    // le store au moment de rendre la main, pour ne jamais rendre une valeur
    // capturée par une fermeture devenue périmée.
    const { hote, actif, secondesParWidget, seuilSansPause, quarts, silencerLesNatives } = useUlanziStore();
    const { setRoutine, setJoignable } = useUlanziStore.getState();

    /** Vrai pendant que l'afficheur nous appartient. */
    const enMain = useRef(false);
    /** Les valeurs les plus fraîches, pour que le battement ne serve pas du périmé. */
    const dernier = useRef({ quarts, seuilSansPause, hote });
    dernier.current = { quarts, seuilSansPause, hote };

    const doitAfficher = actif && seanceOuverte;

    /**
     * **La restitution de rattrapage, au démarrage de GM-OS.**
     *
     * C'est elle qui remplace l'horloge laissée allumée « au cas où ». Si GM-OS
     * s'est arrêté brutalement en pleine séance, l'afficheur garde ses natives
     * éteintes et son widget expire : il reste noir. Personne n'était là pour
     * rendre la main — mais **la routine est persistée**, donc on peut la rendre
     * au lancement suivant.
     *
     * *Un filet qui ne rattrape qu'à l'instant de la chute n'en est pas un.*
     *
     * Ne s'exécute que si l'on n'est pas en train de reprendre la main : une
     * séance rouverte doit garder l'afficheur, pas se le faire reprendre.
     */
    const rattrapageFait = useRef(false);
    useEffect(() => {
        if (rattrapageFait.current || doitAfficher) return;
        const { routine: perdue, hote: adresse } = useUlanziStore.getState();
        if (!perdue) return;
        rattrapageFait.current = true;
        void new UlanziService(adresse)
            .rendreLaMain(perdue, [NOM_DU_WIDGET])
            .then(() => setRoutine(null))
            .catch(() => undefined);
    }, [doitAfficher, setRoutine]);

    // ── Prise et restitution de la main ──────────────────────────────────────
    useEffect(() => {
        let annule = false;
        const service = new UlanziService(hote);

        if (doitAfficher) {
            (async () => {
                const contact = await service.estJoignable();
                if (annule) return;
                setJoignable(contact.ok, contact.ok ? null : contact.pourquoi);
                // **On n'écrit rien sur un appareil qui n'a pas répondu.** Sans
                // ce garde, on croirait avoir sauvegardé une routine qu'on n'a
                // jamais lue, et la restitution rendrait des valeurs inventées.
                if (!contact.ok) return;

                const avant = await service.prendreLaMain(silencerLesNatives);
                if (annule) return;
                setRoutine(avant);
                enMain.current = true;
            })().catch((e: unknown) =>
                setJoignable(false, e instanceof Error ? e.message : String(e)),
            );
        }

        return () => {
            annule = true;
            if (!enMain.current) return;
            enMain.current = false;
            // La restitution part sans qu'on l'attende : React ne patiente pas
            // sur un nettoyage. Si elle échoue, `lifetime` reste le filet.
            void new UlanziService(dernier.current.hote)
                .rendreLaMain(useUlanziStore.getState().routine, [NOM_DU_WIDGET])
                .then(() => setRoutine(null))
                .catch(() => undefined);
        };
        // `secondesParWidget` volontairement dans les dépendances : changer la
        // cadence doit reprendre la main pour réécrire `ATIME`.
    }, [doitAfficher, hote, silencerLesNatives, setRoutine, setJoignable]);

    // ── Le battement, et la publication immédiate à chaque changement ────────
    useEffect(() => {
        if (!doitAfficher) return;
        const service = new UlanziService(hote);

        /**
         * **Le battement rattrape une prise de main manquée.**
         *
         * La prise de main vit dans un effet qui ne rejoue qu'au changement de
         * ses dépendances : si le premier contact échouait — afficheur pas
         * encore allumé, réseau pas prêt — on republiait le widget toutes les
         * trente secondes **sans jamais reprendre la main**. Le widget
         * s'affichait alors en boucle avec la météo et la batterie, et la
         * cadence restait celle de l'appareil.
         *
         * *Un rattrapage qui ne rattrape qu'une fois ne rattrape pas.*
         */
        const publier = async () => {
            const { quarts: q, seuilSansPause: s } = dernier.current;
            try {
                if (!enMain.current) {
                    const avant = await service.prendreLaMain(silencerLesNatives);
                    setRoutine(avant);
                    enMain.current = true;
                }
                await service.pousserWidget(NOM_DU_WIDGET, {
                    ...composerDefile(q, s),
                    lifetime: DUREE_DE_VIE,
                    lifetimeMode: 0,
                    // Combien de temps le défilé reste à l'écran. C'est ce
                    // réglage, et non `ATIME`, qui décide de sa part : l'horloge
                    // garde sa cadence d'origine, qu'on n'a donc pas à rendre.
                    duration: secondesParWidget,
                });
                setJoignable(true, null);
            } catch (e: unknown) {
                setJoignable(false, e instanceof Error ? e.message : String(e));
            }
        };

        void publier();
        const minuteur = setInterval(() => void publier(), BATTEMENT_MS);
        return () => clearInterval(minuteur);
        // `quarts` en dépendance : un Quart poussé depuis le cockpit doit se
        // voir tout de suite, pas au prochain battement.
    }, [doitAfficher, hote, quarts, seuilSansPause, secondesParWidget, silencerLesNatives, setJoignable, setRoutine]);
}
