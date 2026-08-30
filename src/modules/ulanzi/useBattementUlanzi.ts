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
    const { setRoutine, memoriserLaRoutine, setJoignable } = useUlanziStore.getState();

    /** Vrai pendant que l'afficheur nous appartient. */
    const enMain = useRef(false);
    /** La restitution de sortie, partagée : plusieurs abonnés, un seul travail. */
    const restitutionDeSortie = useRef<Promise<void> | null>(null);
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

    /**
     * **Rendre l'afficheur quand GM-OS se ferme.**
     *
     * *Signalé par David le 2026-08-30, après l'essai en conditions :* **« quand
     * je ferme l'application, le Ulanzi ne reprend pas sa routine »**.
     *
     * Le nettoyage d'effet ci-dessous ne pouvait pas s'en charger, et pour deux
     * raisons qui se cumulent : **fermer une fenêtre Electron ne démonte pas
     * l'arbre React**, donc il n'était même pas appelé ; et quand bien même, il
     * tire quatre requêtes HTTP *sans les attendre* dans un rendu qu'on est en
     * train de détruire. D'où le symptôme exact — fermer la **séance**
     * fonctionnait, fermer l'**application** non.
     *
     * *Une restitution ne peut pas vivre dans un processus qui meurt avant elle.*
     * Le process principal retient donc la fermeture pendant qu'on rend la main.
     *
     * **On répond toujours, même sans rien à rendre** : sans réponse, chaque
     * fermeture de GM-OS attendrait le délai de sécurité de quatre secondes.
     */
    useEffect(() => {
        const pont = window.appBridge?.ulanzi;
        if (!pont?.surDemandeDeFermeture) return;

        pont.surDemandeDeFermeture(() => {
            /*
              **Un seul travail, et personne ne répond avant qu'il soit fini.**

              *L'écran noir du 2026-08-30, deuxième round.* React tourne en
              `StrictMode` et monte cet effet **deux fois** : deux abonnés
              recevaient la demande. Le premier partait rendre la main et posait
              `enMain` à faux ; le second voyait ce faux, croyait n'avoir rien à
              faire et **répondait aussitôt**. Le principal ne retient la
              fermeture que jusqu'à la première réponse — il quittait donc
              pendant que la restitution était encore en vol, et la tuait.
              *Quand plusieurs répondent pour un seul travail, c'est le plus
              rapide qui décide, et le plus rapide est celui qui n'a rien fait.*

              La promesse est partagée : quel que soit le nombre d'abonnés, le
              travail n'a lieu qu'une fois et **tous** attendent sa fin.
            */
            restitutionDeSortie.current ??= (async () => {
                if (!enMain.current) return;
                enMain.current = false;
                try {
                    await new UlanziService(dernier.current.hote)
                        .rendreLaMain(useUlanziStore.getState().routine, [NOM_DU_WIDGET]);
                    setRoutine(null);
                } catch {
                    // Un échec ne retient pas la fermeture : le rattrapage au
                    // démarrage suivant reste le filet, et la routine reste
                    // persistée pour qu'il ait de quoi rendre.
                }
            })();

            void restitutionDeSortie.current.finally(() => pont.fermetureTerminee?.());
        });
        // Enregistré une seule fois : ce crochet est monté en permanence dans
        // `Shell`, et le pont n'offre pas de désabonnement.
    }, [setRoutine]);

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
                // **Mémoriser, pas écraser.** Une reprise sur un appareil déjà
                // muet enregistrerait « tout était éteint », et la restitution
                // n'aurait plus rien à rendre. Voir `memoriserLaRoutine`.
                memoriserLaRoutine(avant);
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
    }, [doitAfficher, hote, silencerLesNatives, setRoutine, memoriserLaRoutine, setJoignable]);

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
                    // Même règle qu'à la prise : ce rattrapage s'exécute
                    // justement quand l'appareil peut déjà être muet.
                    memoriserLaRoutine(avant);
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
    }, [doitAfficher, hote, quarts, seuilSansPause, secondesParWidget, silencerLesNatives, setJoignable, setRoutine, memoriserLaRoutine]);
}
