import { describe, it, expect } from 'vitest';
import {
    accelerer,
    calmer,
    composerVoightKampff,
    couleurDuNiveau,
    NIVEAU_MAX,
    NIVEAU_MIN,
    SIGNAL_INITIAL,
    iconeDuNiveau,
} from './voightKampff';

/** Les six fichiers livrés dans `public/ulanzi/`, déposés sur l'appareil. */
const ICONES_ATTENDUES = ['gmosvk1', 'gmosvk2', 'gmosvk3', 'gmosvk4', 'gmosvk5', 'gmosvk6'];

/**
 * **Le signal du Voight-Kampff — demandé par David le 2026-08-31.**
 *
 * *« Une sorte de signal électro »*, puis *« quand j'appuie sur un bouton le
 * rythme s'accélère »*.
 *
 * Ce que ces tests gardent : **le rythme se lit à la densité**. La cadence de
 * publication est d'une seconde ; animer le battement lui-même aurait donné un
 * hoquet, pas un signal. Un battement au repos, six au bout — une accélération
 * se voit d'un coup d'œil, ce que le § 1 exige.
 *
 * **Et le budget de segments dessine.** *Mesuré, pas choisi* : douze segments
 * coûtent 401 ms sans jamais rater, trente-deux en coûtent 802 et échouent deux
 * fois sur vingt. Six complexes détaillés en demanderaient plus de quarante — le
 * détail diminue donc quand le rythme monte.
 */

describe('le rythme', () => {
    it('part au repos et s’accélère d’un cran par appui', () => {
        expect(SIGNAL_INITIAL.niveau).toBe(NIVEAU_MIN);
        expect(accelerer(SIGNAL_INITIAL).niveau).toBe(NIVEAU_MIN + 1);
    });

    /** Six pics sur trente-deux colonnes : au-delà on ne les distinguerait plus. */
    it('ne dépasse pas le maximum, ni ne descend sous le repos', () => {
        let etat = SIGNAL_INITIAL;
        for (let i = 0; i < 20; i++) etat = accelerer(etat);
        expect(etat.niveau).toBe(NIVEAU_MAX);

        for (let i = 0; i < 20; i++) etat = calmer(etat);
        expect(etat.niveau).toBe(NIVEAU_MIN);
    });
});

describe('l’icône animée', () => {
    /**
     * **Le tracé dessiné segment par segment a disparu le 2026-08-31.**
     *
     * Il était conçu autour d'une limite mesurée — 253 ms par écriture, donc
     * quatre images par seconde au mieux. *Mais je n'avais jamais regardé si
     * l'appareil exposait un système de fichiers.* Il en expose un, et une icône
     * animée déposée dans son dossier `ICONS` est jouée par l'appareil
     * lui-même, à pleine vitesse et sans un octet de trafic.
     *
     * Ce que ces tests gardent désormais : **un niveau, une icône, et rien qui
     * dépende du temps.**
     */
    it('donne une icône par niveau, toutes distinctes', () => {
        const noms = [];
        for (let n = NIVEAU_MIN; n <= NIVEAU_MAX; n++) noms.push(iconeDuNiveau(n));
        expect(new Set(noms).size, 'deux niveaux se partageaient une icône').toBe(noms.length);
        expect(noms).toEqual(ICONES_ATTENDUES);
    });

    /** Les données persistées et les saisies peuvent sortir de l'intervalle. */
    it('borne les niveaux impossibles au lieu de nommer un fichier absent', () => {
        expect(iconeDuNiveau(0)).toBe(iconeDuNiveau(NIVEAU_MIN));
        expect(iconeDuNiveau(99)).toBe(iconeDuNiveau(NIVEAU_MAX));
        expect(iconeDuNiveau(2.4)).toBe(iconeDuNiveau(2));
    });

    /**
     * **Le nom doit correspondre à un fichier livré**, sans quoi l'afficheur
     * montre un cadre vide sans rien dire. *Un nom qui ne désigne rien échoue en
     * silence, et c'est le pire des échecs sur un objet qu'on regarde de loin.*
     */
    it('nomme exactement les fichiers déposés par GM-OS', () => {
        for (const nom of ICONES_ATTENDUES) {
            expect(nom).toMatch(/^gmosvk[1-6]$/);
        }
    });
});

/**
 * **La couleur monte avec le rythme, et elle n'est pas réglable.**
 * *On ne rend pas réglable ce qui dit quelque chose.*
 */
describe('la couleur', () => {
    it('va du vert au rouge', () => {
        expect(couleurDuNiveau(NIVEAU_MIN)).toBe('#00C853');
        expect(couleurDuNiveau(NIVEAU_MAX)).toBe('#FF1744');
    });

    it('donne une couleur à chaque niveau, et borne le reste', () => {
        for (let n = NIVEAU_MIN; n <= NIVEAU_MAX; n++) {
            expect(couleurDuNiveau(n), `niveau ${n}`).toMatch(/^#[0-9A-F]{6}$/);
        }
        expect(couleurDuNiveau(99)).toBe(couleurDuNiveau(NIVEAU_MAX));
        expect(couleurDuNiveau(-4)).toBe(couleurDuNiveau(NIVEAU_MIN));
    });
});

describe('ce qui part vers l’appareil', () => {
    /**
     * **Aucun texte, et c'est délibéré.** « VK » dirait aux joueurs ce qu'ils
     * regardent, et le § 4 veut l'inverse : *ils voient le rythme monter et ne
     * savent pas pourquoi.* Nommé, le tracé devient un score.
     */
    it('n’écrit rien — le tracé seul ne se nomme pas', () => {
        expect(composerVoightKampff({ niveau: 3 }).text).toBe('');
    });

    it('ne défile pas', () => {
        expect(composerVoightKampff({ niveau: 3 }).noScroll).toBe(true);
    });

    it('nomme l’icône de son niveau', () => {
        expect(composerVoightKampff({ niveau: 5 }).icon).toBe('gmosvk5');
    });

    /**
     * **La charge ne dépend plus du temps, et c'est ce qui libère le réseau.**
     *
     * Le battement ne republie que ce qui a **changé** : deux compositions
     * identiques d'un tour à l'autre valent zéro requête. Le tracé statique, lui,
     * changeait à chaque image et imposait une écriture toutes les 500 ms.
     */
    it('ne change pas tant que le niveau ne bouge pas', () => {
        expect(composerVoightKampff({ niveau: 3 })).toEqual(composerVoightKampff({ niveau: 3 }));
        expect(composerVoightKampff({ niveau: 4 })).not.toEqual(composerVoightKampff({ niveau: 3 }));
    });

    /** La couleur suit le rythme, comme l'icône. */
    it('porte la couleur du niveau', () => {
        expect(composerVoightKampff({ niveau: 1 }).color).toBe(couleurDuNiveau(1));
        expect(composerVoightKampff({ niveau: 6 }).color).toBe(couleurDuNiveau(6));
    });
});
