import { useEffect, useRef } from 'react';
import { useUlanziStore } from './useUlanziStore';
import { UlanziService } from './UlanziService';
import { useClockStore } from '../../store/useClockStore';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { useRessourcesDeTableStore } from '../table/useRessourcesDeTableStore';
import { DEFAULT_GAME_DRIVERS } from '../../data/defaultGameDrivers';
import type { ReserveAAfficher } from './widgets/jaugeDeTable';
import {
    applicationsAPousser,
    demandeUneCadenceRapide,
    horlogesPourLaTable,
    minuteurPourLaTable,
    nomsAwtrixDeTousLesWidgets,
    reservesPourLaTable,
    tempsPourLaTable,
} from './widgets/librairie';

/**
 * **Tout ce que GM-OS a pu poser sur l'appareil**, et donc tout ce que la
 * restitution doit retirer — pas seulement ce qui est actif.
 *
 * Un widget éteint en cours de séance reste sur l'appareil jusqu'à l'expiration
 * de sa durée de vie : le laisser reviendrait à rendre un afficheur qui montre
 * encore quelque chose que GM-OS ne pousse plus.
 */
export const NOMS_DES_WIDGETS = nomsAwtrixDeTousLesWidgets();

/**
 * **Les réserves de la campagne ouverte — étape C.**
 *
 * Le pilote déclare *quelles* réserves existent, le magasin de table dit *où
 * elles en sont* : deux questions différentes, donc deux sources, et c'est déjà
 * le partage du § 12 entre disponibilité et état.
 *
 * On cherche le pilote parmi ceux que la Forge a produits **et** ceux livrés
 * avec l'application : Dune est le seul du second groupe, et c'est justement
 * celui qui déclare des réserves aujourd'hui.
 */
function reservesDeLaCampagne(): ReserveAAfficher[] {
    const session = useSessionOSStore.getState();
    const campagne = session.campaigns?.find(c => c.id === session.activeCampaignId);
    if (!campagne) return [];

    const pilote = [...(session.customGameDrivers ?? []), ...DEFAULT_GAME_DRIVERS]
        .find(d => d.id === campagne.system);

    return reservesPourLaTable(
        pilote?.ressourcesDeTable,
        useRessourcesDeTableStore.getState().reserves[campagne.id],
    );
}

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
 * La cadence quand un widget affiche des secondes.
 *
 * **Elle ne fait pas six requêtes par seconde** : le battement ne republie que
 * les applications dont la charge a changé. Seul le minuteur bouge à ce
 * rythme-là ; le défilé et les horloges ne repartent qu'au `BATTEMENT_MS`, pour
 * renouveler leur durée de vie.
 */
export const CADENCE_RAPIDE_MS = 500;

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
export function useBattementUlanzi(seanceOuverte: boolean, systemId?: string | null): void {
    // `routine` n'est volontairement pas lu ici : la restitution la relit dans
    // le store au moment de rendre la main, pour ne jamais rendre une valeur
    // capturée par une fermeture devenue périmée.
    const { hote, actif, selection, seuilSansPause, quarts, signal, silencerLesNatives } = useUlanziStore();
    /*
      Abonnés, et pas seulement lus : un segment rempli doit se voir sur
      l'afficheur tout de suite, pas au prochain battement. C'est ce qui
      distingue un miroir d'un instrument — personne ne pousse le miroir.
    */
    const tensions = useClockStore(s => s.tensions);
    const isClockProjected = useClockStore(s => s.isClockProjected);
    /* Le mode et l'heure posée : changer de mode doit se voir tout de suite. */
    const modeDeLHorloge = useClockStore(s => s.mode);
    const horodatage = useClockStore(s => s.timestamp);
    /* Une réserve dépensée doit se voir tout de suite : c'est un miroir aussi. */
    const reservesDeTable = useRessourcesDeTableStore(s => s.reserves);
    const campagneOuverte = useSessionOSStore(s => s.activeCampaignId);
    const { setRoutine, memoriserLaRoutine, setJoignable } = useUlanziStore.getState();

    /** Vrai pendant que l'afficheur nous appartient. */
    const enMain = useRef(false);
    /** La restitution de sortie, partagée : plusieurs abonnés, un seul travail. */
    const restitutionDeSortie = useRef<Promise<void> | null>(null);
    /**
     * **Les applications réellement posées sur l'appareil au dernier tour.**
     *
     * Le catalogue ne suffit plus à les nommer : une horloge de tension porte un
     * identifiant fabriqué à l'exécution. C'est donc cette trace, et elle seule,
     * qui sait ce qu'il y a à reprendre.
     */
    const posees = useRef<Map<string, { signature: string; quand: number }>>(new Map());
    /** Le dernier état de contact écrit dans le magasin, pour ne pas le réécrire. */
    const joignableConnu = useRef<boolean | null>(null);

    /**
     * **Tout ce qu'il faut retirer pour rendre l'appareil.**
     *
     * Les noms du catalogue **et** les applications réellement posées : une
     * horloge de tension porte un identifiant fabriqué à l'exécution, que le
     * catalogue ne peut pas nommer. Ne rendre que le catalogue laisserait ses
     * compteurs sur l'objet jusqu'à leur expiration.
     *
     * Ne lit que `poussees.current`, une référence stable : une fermeture
     * capturée au premier rendu reste donc juste.
     */
    const toutARendre = () => [...new Set([...NOMS_DES_WIDGETS, ...posees.current.keys()])];
    /** Les valeurs les plus fraîches, pour que le battement ne serve pas du périmé. */
    const dernier = useRef({ quarts, seuilSansPause, hote, selection, systemId, signal });
    dernier.current = { quarts, seuilSansPause, hote, selection, systemId, signal };

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
            .rendreLaMain(perdue, toutARendre())
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
                        .rendreLaMain(useUlanziStore.getState().routine, toutARendre());
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

                /*
                  **Les icônes animées du signal, déposées une fois pour toutes.**

                  Ici et pas ailleurs : c'est le seul endroit où l'on sait que
                  l'appareil a répondu. Le dépôt ne fait qu'une lecture quand
                  elles sont déjà là — le cas courant après la première séance,
                  puisqu'elles vivent en flash et **y restent** (décision de
                  David le 2026-08-31).

                  Sans `await` : un widget dont l'icône manque montre un cadre
                  vide pendant quelques secondes, ce qui est très préférable à
                  retarder la prise de main de tout l'afficheur.
                */
                void window.appBridge?.ulanzi?.deposerLesIcones?.(dernier.current.hote)
                    .catch(() => undefined);
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
                .rendreLaMain(useUlanziStore.getState().routine, toutARendre())
                .then(() => setRoutine(null))
                .catch(() => undefined);
        };
        // La cadence n'est plus dans ces dépendances : elle ne passe plus par
        // `ATIME`, donc la changer ne demande plus de reprendre la main.
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
        /*
          **Une publication à la fois — imposé par la mesure du 2026-08-31.**

          Une poussée coûte **401 ms** à l'appareil, et la cadence rapide est
          descendue à 500 ms pour le tracé du Voight-Kampff. Deux applications à
          republier dans le même tour dépassent donc l'intervalle, et
          `setInterval` n'attend rien : les publications se chevaucheraient, et
          celle qui finit en dernier écraserait la plus récente.

          On saute le tour plutôt que d'empiler. *Perdre une image d'un tracé qui
          dérive ne se voit pas ; deux publications qui se doublent, si.*
        */
        let enCours = false;

        const publier = async () => {
            if (enCours) return;
            enCours = true;
            try { await publierVraiment(); } finally { enCours = false; }
        };

        const publierVraiment = async () => {
            const { quarts: q, seuilSansPause: s, selection: sel, systemId: jeu, signal: sig } = dernier.current;
            try {
                if (!enMain.current) {
                    const avant = await service.prendreLaMain(silencerLesNatives);
                    // Même règle qu'à la prise : ce rattrapage s'exécute
                    // justement quand l'appareil peut déjà être muet.
                    memoriserLaRoutine(avant);
                    enMain.current = true;
                }

                /*
                  **N widgets, et la part d'écran se règle sur CHACUN.**

                  Le § 12 du plan disait « pousser N applications, écrire
                  `ATIME` ». On ne touche plus à `ATIME` : `duration` posé sur
                  le widget lui-même laisse l'horloge native à sa cadence
                  d'origine — *un réglage de moins à rendre* — et donne au
                  passage une cadence **par widget** au lieu d'une seule pour
                  tout le monde. Le plan est corrigé en conséquence.

                  Un widget sans compositeur est **sauté en silence** : le
                  catalogue peut annoncer une entrée générique avant que son
                  rendu par type n'existe, et une exception ici arrêterait la
                  publication de tous les autres.
                */
                const etatDeLHorloge = useClockStore.getState();
                const aPousser = applicationsAPousser(jeu, sel, {
                    instruments: { quarts: q, seuilSansPause: s, signal: sig },
                    horloges: horlogesPourLaTable(etatDeLHorloge),
                    minuteur: minuteurPourLaTable(etatDeLHorloge),
                    temps: tempsPourLaTable(etatDeLHorloge),
                    reserves: reservesDeLaCampagne(),
                    // L'heure système, pour le mode temps réel : le `timestamp`
                    // du magasin y est celui de la dernière pose manuelle.
                    maintenant: Date.now(),
                });

                /*
                  **On ne republie que ce qui a changé** — imposé par le minuteur.

                  David a tranché le 2026-08-30 : `MM:SS` en permanence. Le
                  battement doit donc tourner à la seconde. Republier les six
                  applications à chaque tour ferait six requêtes par seconde vers
                  un ESP32 pour n'en changer qu'une.

                  On compare donc la charge à celle du tour précédent. Et on
                  republie quand même toutes les `BATTEMENT_MS` : `lifetime` est
                  ce qui rend l'afficheur à sa routine quand GM-OS meurt, et une
                  application qu'on cesse de republier expire — *le silence est
                  le filet, il ne faut pas le déclencher par inadvertance.*
                */
                const maintenant = Date.now();
                for (const { nom, charge, secondes } of aPousser) {
                    const signature = JSON.stringify(charge);
                    const posee = posees.current.get(nom);
                    const perime = !posee || maintenant - posee.quand >= BATTEMENT_MS;

                    if (posee && posee.signature === signature && !perime) continue;

                    await service.pousserWidget(nom, {
                        ...charge,
                        lifetime: DUREE_DE_VIE,
                        lifetimeMode: 0,
                        duration: secondes,
                    });
                    posees.current.set(nom, { signature, quand: maintenant });
                }

                /*
                  **Ce qu'on a poussé, on sait le reprendre.**

                  *Nouveau avec le premier miroir.* Un instrument ne disparaît
                  pas : le défilé est là ou n'est pas coché. Une horloge de
                  tension, elle, **peut être supprimée en pleine séance** — et
                  son application resterait alors sur l'appareil jusqu'à
                  l'expiration de sa durée de vie, à montrer un compteur qui
                  n'existe plus. *Un miroir qui ment est un bug, et il ment de
                  façon crédible.*

                  Le mécanisme est volontairement générique : on retire tout ce
                  qui était poussé au tour précédent et ne l'est plus. Il couvre
                  donc aussi un widget décoché, sans qu'on ait à le prévoir.
                */
                const noms = new Set(aPousser.map(a => a.nom));
                const aRetirer = [...posees.current.keys()].filter(n => !noms.has(n));
                await Promise.all(
                    aRetirer.map(n => service.retirerWidget(n).catch(() => undefined)));
                for (const n of aRetirer) posees.current.delete(n);

                // On n'écrit dans le magasin que si l'état change : à la
                // seconde, une écriture par tour repeindrait le pupitre en
                // permanence pour dire la même chose.
                if (joignableConnu.current !== true) {
                    joignableConnu.current = true;
                    setJoignable(true, null);
                }
            } catch (e: unknown) {
                const raison = e instanceof Error ? e.message : String(e);
                if (joignableConnu.current !== false) {
                    joignableConnu.current = false;
                    setJoignable(false, raison);
                }
            }
        };

        void publier();
        /*
          **La cadence suit ce qui est affiché.** Seul le minuteur demande la
          seconde ; le reste se contente du battement. Faire tourner l'afficheur
          à 1 Hz en permanence coûterait un tour de boucle par seconde pour ne
          rien publier la plupart du temps.
        */
        const periode = demandeUneCadenceRapide(systemId, selection) ? CADENCE_RAPIDE_MS : BATTEMENT_MS;
        const minuteur = setInterval(() => void publier(), periode);
        return () => clearInterval(minuteur);
        // `quarts` en dépendance : un Quart poussé depuis le cockpit doit se
        // voir tout de suite, pas au prochain battement.
        // `selection` et `systemId` : cocher un widget ou changer de campagne
        // doit se voir tout de suite. `tensions` et `isClockProjected` : un
        // segment rempli aussi — c'est un miroir, personne ne le pousse.
    }, [doitAfficher, hote, quarts, signal, seuilSansPause, selection, systemId, tensions, isClockProjected,
        modeDeLHorloge, horodatage, reservesDeTable, campagneOuverte,
        silencerLesNatives, setJoignable, setRoutine, memoriserLaRoutine]);
}
