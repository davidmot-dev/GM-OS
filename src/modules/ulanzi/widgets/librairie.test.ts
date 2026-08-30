import { describe, it, expect } from 'vitest';
import {
    LIBRAIRIE,
    COMPOSITEURS,
    applicationsAPousser,
    basculer,
    bornerLesSecondes,
    demandeUneCadenceRapide,
    estActif,
    horlogesPourLaTable,
    minuteurPourLaTable,
    reservesPourLaTable,
    reglerLaCouleur,
    nomAwtrix,
    nomsAwtrixDeTousLesWidgets,
    reglerLesSecondes,
    SECONDES_MAX,
    SECONDES_MIN,
    SECONDES_PAR_DEFAUT,
    widgetsActifs,
    widgetsDuJeu,
    type WidgetDeTable,
} from './librairie';
import { COULEURS_DU_COMPTE } from './compteARebours';
import { SIGNAL_INITIAL } from './voightKampff';

/**
 * **La librairie de widgets — § 12 du plan, construite le 2026-08-30.**
 *
 * Ce que ces tests gardent avant tout : **rien ne s'allume ni ne s'éteint tout
 * seul.** C'est la famille de défauts que ce projet paie le plus cher, et un
 * afficheur est l'endroit où elle se voit le moins — personne ne remarque un
 * widget qui aurait dû être là.
 */

/** Un catalogue de laboratoire : la vraie librairie n'a qu'une entrée. */
const CATALOGUE: WidgetDeTable[] = [
    { id: 'quarts', nom: 'Quarts', type: 'rang', systemId: 'blade-runner', source: { de: 'main' }, parDefaut: true },
    { id: 'impulsion', nom: 'Impulsion', type: 'jauge', systemId: 'dune', source: { de: 'pilote', champ: 'impulsion' } },
    { id: 'tension', nom: 'Tension', type: 'compte-a-rebours', source: { de: 'pilote', champ: 'clock' } },
];

const ids = (actifs: { widget: WidgetDeTable }[]) => actifs.map(a => a.widget.id);

describe('ce qu’un jeu peut montrer', () => {
    it('prend les siens et les universels, jamais ceux d’un autre jeu', () => {
        expect(widgetsDuJeu('blade-runner', CATALOGUE).map(w => w.id)).toEqual(['quarts', 'tension']);
        expect(widgetsDuJeu('dune', CATALOGUE).map(w => w.id)).toEqual(['impulsion', 'tension']);
    });

    it('ne garde que les universels quand aucun jeu n’est ouvert', () => {
        expect(widgetsDuJeu(null, CATALOGUE).map(w => w.id)).toEqual(['tension']);
    });
});

describe('ce qui défile', () => {
    /** C'est ce qui fait que le défilé marchait avant qu'un tableau de bord existe. */
    it('sans sélection, prend les widgets marqués par défaut', () => {
        expect(ids(widgetsActifs('blade-runner', undefined, CATALOGUE))).toEqual(['quarts']);
    });

    /**
     * **Absent n'est pas vide, et la nuance est tout le sujet.** Si « rien de
     * choisi » valait « tout allumé », ajouter une entrée au catalogue
     * allumerait un widget chez quelqu'un qui ne l'a jamais demandé.
     */
    it('une sélection vide ne pousse rien — c’est un choix', () => {
        expect(widgetsActifs('blade-runner', { 'blade-runner': [] }, CATALOGUE)).toEqual([]);
    });

    it('respecte l’ordre de la sélection', () => {
        const selection = { 'blade-runner': [
            { widgetId: 'tension', secondes: 10 },
            { widgetId: 'quarts', secondes: 20 },
        ] };
        expect(ids(widgetsActifs('blade-runner', selection, CATALOGUE))).toEqual(['tension', 'quarts']);
    });

    /** Changer de campagne ne doit pas pousser l'Impulsion de Dune chez Blade Runner. */
    it('écarte un widget d’un autre jeu resté dans la sélection', () => {
        const selection = { 'blade-runner': [{ widgetId: 'impulsion', secondes: 20 }] };
        expect(widgetsActifs('blade-runner', selection, CATALOGUE)).toEqual([]);
    });

    /** Une sélection est persistée : elle survit à une version qui retire une entrée. */
    it('écarte un widget disparu du catalogue', () => {
        const selection = { 'blade-runner': [{ widgetId: 'widget-supprime', secondes: 20 }] };
        expect(widgetsActifs('blade-runner', selection, CATALOGUE)).toEqual([]);
    });

    it('borne la part d’écran lue depuis la sélection', () => {
        const selection = { 'blade-runner': [{ widgetId: 'quarts', secondes: 999 }] };
        expect(widgetsActifs('blade-runner', selection, CATALOGUE)[0].secondes).toBe(SECONDES_MAX);
    });
});

describe('allumer et éteindre', () => {
    /**
     * **Le premier geste fige l'implicite.** Sans cela, éteindre un widget actif
     * par défaut n'aurait aucun effet : la sélection resterait absente, et le
     * tour suivant le rallumerait.
     */
    it('éteindre un widget par défaut le retire vraiment', () => {
        const apres = basculer('quarts', 'blade-runner', undefined, CATALOGUE);

        expect(apres).toEqual([]);
        expect(estActif('quarts', 'blade-runner', { 'blade-runner': apres }, CATALOGUE)).toBe(false);
    });

    it('allumer ajoute à la fin, sans passer devant les autres', () => {
        const apres = basculer('tension', 'blade-runner', undefined, CATALOGUE);
        expect(apres.map(e => e.widgetId)).toEqual(['quarts', 'tension']);
    });

    it('rallumer après extinction remet le widget', () => {
        const eteint = basculer('quarts', 'blade-runner', undefined, CATALOGUE);
        const rallume = basculer('quarts', 'blade-runner', { 'blade-runner': eteint }, CATALOGUE);

        expect(rallume.map(e => e.widgetId)).toEqual(['quarts']);
        expect(rallume[0].secondes).toBe(SECONDES_PAR_DEFAUT);
    });

    it('change la part d’écran d’un seul widget', () => {
        const deux = basculer('tension', 'blade-runner', undefined, CATALOGUE);
        const apres = reglerLesSecondes('tension', 9, 'blade-runner', { 'blade-runner': deux }, CATALOGUE);

        expect(apres).toEqual([
            { widgetId: 'quarts', secondes: SECONDES_PAR_DEFAUT },
            { widgetId: 'tension', secondes: 9 },
        ]);
    });

    it('borne les secondes plutôt que d’accepter n’importe quoi', () => {
        expect(bornerLesSecondes(0)).toBe(SECONDES_MIN);
        expect(bornerLesSecondes(1000)).toBe(SECONDES_MAX);
        expect(bornerLesSecondes(12.4)).toBe(12);
    });
});

/**
 * **Un widget, plusieurs applications — le cœur de l'étape B.**
 *
 * Le catalogue reste statique : une entrée « Horloges de tension ». Mais une
 * campagne peut en porter six, et 32 × 8 n'en montre qu'une à la fois. On déplie
 * donc à la publication, et la rotation native de l'appareil fait le reste.
 */
describe('ce qui part vers l’appareil', () => {
    const HORLOGES = [
        { id: 'clock-1', nom: 'Alerte', remplis: 1, total: 4 },
        { id: 'clock-2', nom: 'Fuite', remplis: 3, total: 6 },
    ];
    const monde = (horloges = HORLOGES, minuteur = null) => ({
        instruments: { quarts: { quartDuJour: 0, consecutifs: 1 }, seuilSansPause: 3, signal: SIGNAL_INITIAL },
        horloges,
        minuteur,
        temps: null,
        reserves: [],
        maintenant: 0,
    });

    const AVEC_HORLOGES = { 'blade-runner': [
        { widgetId: 'quarts', secondes: 20 },
        { widgetId: 'tension', secondes: 8 },
    ] };
    /** Le catalogue de laboratoire, dont `tension` est la source « horloge ». */
    const CAT: WidgetDeTable[] = [
        CATALOGUE[0],
        { id: 'tension', nom: 'Tension', type: 'compte-a-rebours', source: { de: 'horloge' } },
    ];

    it('déplie une entrée en une application par horloge', () => {
        const apps = applicationsAPousser('blade-runner', AVEC_HORLOGES, monde(), CAT);

        expect(apps.map(a => a.nom)).toEqual(['gmos_quarts', 'gmos_h_clock_1', 'gmos_h_clock_2']);
    });

    /** Chaque horloge hérite de la part d'écran réglée sur son widget. */
    it('donne à chaque horloge la durée du widget', () => {
        const apps = applicationsAPousser('blade-runner', AVEC_HORLOGES, monde(), CAT);
        expect(apps.filter(a => a.nom.startsWith('gmos_h_')).map(a => a.secondes)).toEqual([8, 8]);
    });

    /**
     * **Aucune horloge n'est un cas normal**, pas une erreur : le meneur n'en a
     * pas encore créé, ou ne les projette pas. On ne pousse simplement rien.
     */
    it('ne pousse rien quand il n’y a aucune horloge à montrer', () => {
        const apps = applicationsAPousser('blade-runner', AVEC_HORLOGES, monde([]), CAT);
        expect(apps.map(a => a.nom)).toEqual(['gmos_quarts']);
    });

    it('ne pousse rien pour un widget décoché', () => {
        const seul = { 'blade-runner': [{ widgetId: 'tension', secondes: 8 }] };
        const apps = applicationsAPousser('blade-runner', seul, monde(), CAT);

        expect(apps.every(a => a.nom.startsWith('gmos_h_'))).toBe(true);
    });

    it('compose vraiment la charge de chaque horloge', () => {
        const apps = applicationsAPousser('blade-runner', AVEC_HORLOGES, monde(), CAT);
        const premiere = apps[1].charge as unknown as { text: string; draw: unknown[] };

        expect(premiere.text).toBe('ALERTE');
        expect(premiere.draw).toHaveLength(4);
    });
});

/**
 * **L'afficheur est public par construction.**
 *
 * ⚠️ Cette règle vivait d'abord dans le crochet, et **rien ne la couvrait** : la
 * dégradation a montré qu'on pouvait la supprimer sans faire tomber un seul
 * test. Elle est donc descendue ici, pure. *Un garde-fou qu'aucun test ne tient
 * n'est pas un garde-fou, c'est une intention.*
 */
describe('ce que la table a le droit de voir', () => {
    const TENSIONS = [
        { id: 'c1', name: 'Alerte', totalSegments: 4, filledSegments: 1, color: '#00C853' },
        { id: 'c2', name: 'Fuite', totalSegments: 6, filledSegments: 3 },
    ];

    it('ne montre RIEN quand les horloges ne sont pas projetées', () => {
        expect(horlogesPourLaTable({ isClockProjected: false, tensions: TENSIONS })).toEqual([]);
    });

    /** Un état incomplet — magasin en cours de réhydratation — vaut « non projeté ». */
    it('ne montre rien quand la projection n’est pas déclarée', () => {
        expect(horlogesPourLaTable({ tensions: TENSIONS })).toEqual([]);
        expect(horlogesPourLaTable({})).toEqual([]);
    });

    /** Le minuteur suit exactement la même règle et le même interrupteur. */
    it('cache aussi le minuteur quand rien n’est projeté', () => {
        expect(minuteurPourLaTable({ isClockProjected: false, timerDuration: 900, timerRemaining: 300 }))
            .toBeNull();
    });

    it('montre le minuteur posé, et rien quand il n’y en a pas', () => {
        expect(minuteurPourLaTable({ isClockProjected: true, timerDuration: 900, timerRemaining: 300 }))
            .toEqual({ restant: 300, duree: 900 });
        expect(minuteurPourLaTable({ isClockProjected: true })).toBeNull();
    });

    /**
     * **Le drapeau choisit lesquelles, l'interrupteur décide si.**
     *
     * *Demandé le 2026-08-31 pour l'instrument du § 4 — le Voight-Kampff.* On
     * veut **celle-là** au milieu de la table et pas les cinq autres.
     */
    it('n’envoie que les jauges marquées pour l’afficheur', () => {
        const vues = horlogesPourLaTable({
            isClockProjected: true,
            tensions: [
                { ...TENSIONS[0], surLAfficheur: false },
                { ...TENSIONS[1], surLAfficheur: true },
            ],
        });

        expect(vues.map(h => h.id)).toEqual(['c2']);
    });

    /** *Absent = elle part*, comme avant ce champ. Aucune migration. */
    it('envoie une jauge qui n’a pas le drapeau', () => {
        expect(horlogesPourLaTable({ isClockProjected: true, tensions: TENSIONS })).toHaveLength(2);
    });

    it('traduit les horloges projetées sans rien inventer', () => {
        expect(horlogesPourLaTable({ isClockProjected: true, tensions: TENSIONS })).toEqual([
            { id: 'c1', nom: 'Alerte', remplis: 1, total: 4, couleur: '#00C853' },
            { id: 'c2', nom: 'Fuite', remplis: 3, total: 6, couleur: undefined },
        ]);
    });
});

/**
 * **Le point sensible de l'étape C.** L'afficheur est posé au milieu de la
 * table : montrer une réserve que le pilote déclare invisible aux joueurs
 * révélerait un secret du meneur à tout le monde, sans que rien ne le dise.
 */
describe('les réserves que la table a le droit de voir', () => {
    const IMPULSION = { id: 'impulsion', label: 'Impulsion', proprietaire: 'joueurs' as const, depart: 2, min: 0, max: 6 };
    const SECRETE = { id: 'complot', label: 'Complot', proprietaire: 'meneur' as const, depart: 0, min: 0, visibleAuxJoueurs: false };
    const MENACE = { id: 'menace', label: 'Menace', proprietaire: 'meneur' as const, depart: 0, min: 0, visibleAuxJoueurs: true };

    it('écarte une réserve déclarée invisible aux joueurs', () => {
        const vues = reservesPourLaTable([IMPULSION, SECRETE], {});
        expect(vues.map(r => r.id)).toEqual(['impulsion']);
    });

    /** Chez Dune la Menace est celle du meneur **et pourtant publique**. */
    it('garde une réserve du meneur que le pilote déclare publique', () => {
        expect(reservesPourLaTable([MENACE], {}).map(r => r.id)).toEqual(['menace']);
    });

    it('prend la valeur courante, et le départ tant qu’elle n’a pas bougé', () => {
        expect(reservesPourLaTable([IMPULSION], { impulsion: 5 })[0].valeur).toBe(5);
        expect(reservesPourLaTable([IMPULSION], {})[0].valeur).toBe(2);
    });

    /** Un pilote sans réserves est le cas NORMAL — la plupart des jeux n'en ont pas. */
    it('ne rend rien quand le pilote n’en déclare aucune', () => {
        expect(reservesPourLaTable(undefined, {})).toEqual([]);
    });

    it('conserve l’absence de plafond, qui est une différence de nature', () => {
        expect(reservesPourLaTable([MENACE], {})[0].max).toBeUndefined();
        expect(reservesPourLaTable([IMPULSION], {})[0].max).toBe(6);
    });
});

/**
 * **Les couleurs, réglables par widget ET par horloge — demandé le 2026-08-31.**
 *
 * Ce que ces tests gardent : **la couleur choisie n'efface jamais l'alerte**.
 * Rouge à zéro, rouge à sec, rouge une fois plein — c'est la seule chose que la
 * table lit de l'autre bout de la pièce, et la rendre réglable reviendrait à
 * permettre de la rendre muette.
 */
describe('les couleurs', () => {
    const CAT: WidgetDeTable[] = [
        { id: 'horloges', nom: 'Horloges', type: 'compte-a-rebours', source: { de: 'horloge' }, couleurReglable: true },
    ];
    const monde = (horloges: { id: string; nom: string; remplis: number; total: number; couleur?: string }[]) => ({
        instruments: { quarts: { quartDuJour: 0, consecutifs: 0 }, seuilSansPause: 3, signal: SIGNAL_INITIAL },
        horloges,
        minuteur: null,
        temps: null,
        reserves: [],
        maintenant: 0,
    });
    const couleurDe = (apps: { charge: unknown }[]) => (apps[0].charge as { color: string }).color;

    it('applique la couleur du widget à ses horloges', () => {
        const sel = { j: [{ widgetId: 'horloges', secondes: 10, couleur: '#00FF00' }] };
        const apps = applicationsAPousser('j', sel, monde([{ id: 'c', nom: 'A', remplis: 1, total: 4 }]), CAT);

        expect(couleurDe(apps)).toBe('#00FF00');
    });

    /**
     * **La plus précise gagne.** *Le réglage le plus proche de l'objet l'emporte
     * sur le réglage collectif*, sinon le second effacerait le premier sans
     * qu'on comprenne pourquoi.
     */
    it('la couleur de l’horloge l’emporte sur celle du widget', () => {
        const sel = { j: [{ widgetId: 'horloges', secondes: 10, couleur: '#00FF00' }] };
        const apps = applicationsAPousser('j', sel,
            monde([{ id: 'c', nom: 'A', remplis: 1, total: 4, couleur: '#0000FF' }]), CAT);

        expect(couleurDe(apps)).toBe('#0000FF');
    });

    /** **Le test qui compte.** Pleine, elle passe au rouge quoi qu'on ait choisi. */
    it('l’alerte n’est jamais remplacée par la couleur choisie', () => {
        const sel = { j: [{ widgetId: 'horloges', secondes: 10, couleur: '#00FF00' }] };
        const apps = applicationsAPousser('j', sel,
            monde([{ id: 'c', nom: 'A', remplis: 4, total: 4, couleur: '#0000FF' }]), CAT);

        expect(couleurDe(apps)).toBe(COULEURS_DU_COMPTE.pleine);
    });

    it('sans couleur choisie, le widget garde la sienne', () => {
        const sel = { j: [{ widgetId: 'horloges', secondes: 10 }] };
        const apps = applicationsAPousser('j', sel, monde([{ id: 'c', nom: 'A', remplis: 1, total: 4 }]), CAT);

        expect(couleurDe(apps)).toBe(COULEURS_DU_COMPTE.plein);
    });

    it('effacer la couleur la retire, plutôt que d’enregistrer du noir', () => {
        const sel = { j: [{ widgetId: 'horloges', secondes: 10, couleur: '#00FF00' }] };
        const apres = reglerLaCouleur('horloges', null, 'j', sel, CAT);

        expect(apres[0].couleur).toBeUndefined();
    });

    /** *On ne rend pas réglable ce qui dit quelque chose.* */
    it('le défilé des Quarts n’est pas réglable — il se colore par moment du jour', () => {
        expect(LIBRAIRIE.find(w => w.id === 'quarts')?.couleurReglable).toBeUndefined();
        expect(LIBRAIRIE.filter(w => w.couleurReglable).map(w => w.id))
            .toEqual(['horloges', 'minuteur', 'heure', 'reserves']);
    });
});

describe('les noms sur l’appareil', () => {
    /** Le nom historique ne change pas : deux applications se seraient superposées. */
    it('garde gmos_quarts au défilé', () => {
        expect(nomAwtrix('quarts')).toBe('gmos_quarts');
    });

    /**
     * **La restitution retire TOUT ce que GM-OS a pu poser**, pas seulement les
     * actifs : un widget éteint en cours de séance reste sur l'appareil jusqu'à
     * l'expiration de sa durée de vie.
     */
    it('énumère tous les noms du catalogue, actifs ou non', () => {
        expect(nomsAwtrixDeTousLesWidgets(CATALOGUE))
            .toEqual(['gmos_quarts', 'gmos_impulsion', 'gmos_tension']);
    });
});

describe('le catalogue livré', () => {
    it('porte les six widgets', () => {
        expect(LIBRAIRIE.map(w => w.id))
            .toEqual(['quarts', 'horloges', 'minuteur', 'heure', 'reserves', 'vk']);
    });

    /**
     * **L'étagère composée doit rester rare.** Un dessin propre coûte du code à
     * chaque fois ; la promesse « ajouter un jeu ne coûte aucune ligne » ne vaut
     * que pour l'étagère générique. Ce test se remarque si elle enfle.
     */
    it('n’a que deux widgets composés — le défilé et le signal', () => {
        expect(LIBRAIRIE.filter(w => w.source.de === 'main').map(w => w.id))
            .toEqual(['quarts', 'vk']);
    });

    /**
     * ⚠️ **Un seul widget déroge au § 1 du plan.** Tous les autres posent
     * `noScroll` ; l'heure du monde défile, sur décision de David. Ce test
     * existe pour que la dérogation reste **une**, et se remarque si elle se
     * répand.
     */
    it('un seul widget défile, et c’est l’heure du monde', () => {
        const monde = {
            instruments: { quarts: { quartDuJour: 0, consecutifs: 0 }, seuilSansPause: 3, signal: SIGNAL_INITIAL },
            horloges: [{ id: 'c1', nom: 'A', remplis: 1, total: 4 }],
            minuteur: { restant: 60, duree: 120 },
            temps: { mode: 'static' as const, timestamp: 0 },
            reserves: [{ id: 'impulsion', nom: 'Impulsion', valeur: 3, min: 0, max: 6 }],
            maintenant: 0,
        };
        const tout = { blade: LIBRAIRIE.map(w => ({ widgetId: w.id, secondes: 10 })) };

        /*
          On regarde la VALEUR, pas la présence de la clé. Un premier jet
          testait `'noScroll' in charge` : un widget qui l'aurait posé à
          `undefined` ou `false` aurait défilé sur l'appareil **en passant le
          test**. La dégradation l'a montré, et c'est exactement le genre
          d'assertion creuse que ce projet paie.
        */
        const defilent = applicationsAPousser('blade', tout, monde)
            .filter(a => (a.charge as Record<string, unknown>).noScroll !== true);

        expect(defilent.map(a => a.nom)).toEqual(['gmos_heure']);
    });

    /**
     * **Seul le minuteur demande la seconde.** Faire battre l'afficheur à 1 Hz
     * en permanence coûterait un tour de boucle par seconde pour ne rien
     * publier la plupart du temps.
     */
    it('seul le minuteur impose une cadence rapide', () => {
        const avec = { 'blade-runner': [{ widgetId: 'minuteur', secondes: 20 }] };
        const sans = { 'blade-runner': [{ widgetId: 'quarts', secondes: 20 }] };

        expect(demandeUneCadenceRapide('blade-runner', avec)).toBe(true);
        expect(demandeUneCadenceRapide('blade-runner', sans)).toBe(false);
        // Sans rien de choisi, on suit les `parDefaut` — donc le défilé seul.
        expect(demandeUneCadenceRapide('blade-runner', undefined)).toBe(false);
    });

    /**
     * **L'invariant qui remplace celui de l'étape A.**
     *
     * A gardait « une seule entrée » pour qu'on sache laquelle avait validé la
     * librairie. B en ajoute une, et la règle qui compte devient : *ajouter une
     * entrée au catalogue ne doit jamais allumer un widget chez quelqu'un qui ne
     * l'a pas demandé.* Seul le défilé est allumé d'office, parce qu'il
     * fonctionnait déjà avant qu'un tableau de bord existe.
     */
    it('n’allume d’office que ce qui marchait déjà sans tableau de bord', () => {
        expect(LIBRAIRIE.filter(w => w.parDefaut).map(w => w.id)).toEqual(['quarts']);
    });

    it('les horloges sont universelles — toute campagne peut en porter', () => {
        expect(LIBRAIRIE.find(w => w.id === 'horloges')?.systemId).toBeUndefined();
    });

    it('chaque widget composé a son compositeur', () => {
        for (const widget of LIBRAIRIE) {
            if (widget.source.de === 'main') {
                expect(COMPOSITEURS[widget.id], widget.id).toBeTypeOf('function');
            }
        }
    });

    it('le compositeur du défilé produit une charge dessinable', () => {
        const charge = COMPOSITEURS.quarts({
            quarts: { quartDuJour: 1, consecutifs: 4 },
            seuilSansPause: 3,
            signal: SIGNAL_INITIAL,
        }, 0) as unknown as { text: string; draw: unknown[] };

        expect(charge.text).toBe('JOURNEE');
        expect(charge.draw.length).toBeGreaterThan(0);
    });

    /**
     * **Le signal du Voight-Kampff dérive avec le temps** — une colonne par
     * seconde. C'est ce qui distingue une machine qui tourne d'un dessin figé,
     * et c'est pour ça que ce widget demande la cadence rapide.
     */
    it('le compositeur du signal dérive avec le temps', () => {
        const instruments = {
            quarts: { quartDuJour: 0, consecutifs: 0 },
            seuilSansPause: 3,
            signal: { niveau: 3 },
        };
        const a = COMPOSITEURS.vk(instruments, 0) as unknown as { draw: unknown[] };
        const b = COMPOSITEURS.vk(instruments, 1000) as unknown as { draw: unknown[] };

        expect(b.draw).not.toEqual(a.draw);
    });

    /** *Une propriété qu'on devine en énumérant des cas se trompe.* */
    it('déclare la cadence rapide plutôt que de la déduire de la source', () => {
        expect(LIBRAIRIE.filter(w => w.cadenceRapide).map(w => w.id))
            .toEqual(['minuteur', 'heure', 'vk']);
    });
});
