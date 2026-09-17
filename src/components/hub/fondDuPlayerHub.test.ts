import { describe, it, expect } from 'vitest';
import { fondDuPlayerHub, imageApresMessage, papierPeintDeLaCampagne } from './fondDuPlayerHub';
import CROCHET from '../../modules/session/hooks/useHubSync.ts?raw';
import TABLEAU_DE_BORD from '../../modules/image/ImageDashboard.tsx?raw';

/**
 * **Le fond de l'écran des joueurs — l'écran noir du 2026-09-13.**
 *
 * `Ctrl+0` devait fermer la carte de projection. Il posait `null`, et **tout
 * l'écran passait au noir**, décor compris. David : *« je voulais que la fenêtre
 * encadrée en rouge se ferme, pas le background derrière cette fenêtre »*.
 *
 * ⛔ La cause tenait dans un ternaire d'une ligne, sans commentaire, où
 * `undefined` et `null` ne veulent pas dire la même chose. *L'un est une
 * absence, l'autre une décision.*
 */

const DECOR = 'm-papier-peint';
const PROJETE = 'm-image-projetee';

describe('ce que le fond devient', () => {
    /*
      ⛔ **LE TEST DE LA RÉGRESSION.** Rien n'est projeté : le décor reprend la
      main. C'est ce que `FULL_RESET` doit produire.
    */
    it('sans rien de projeté, le décor de la campagne reprend la main', () => {
        expect(fondDuPlayerHub({
            imageEnDirect: undefined,
            papierPeintDeLaCampagne: DECOR,
        })).toBe(DECOR);
    });

    /*
      ⚠️ **`null` reste une extinction délibérée.** On ne supprime pas ce cas :
      il faut une porte vers le noir, comme `extinguishAll` en garde une pour
      Light-OS. *Un geste nommé « éteindre » doit éteindre.*
    */
    it('mais `null` éteint vraiment — c’est une décision, pas une absence', () => {
        expect(fondDuPlayerHub({
            imageEnDirect: null,
            papierPeintDeLaCampagne: DECOR,
        })).toBeNull();
    });

    it('une image projetée passe devant tout', () => {
        expect(fondDuPlayerHub({
            imageEnDirect: PROJETE,
            projectionVersLeHub: 'm-autre',
            papierPeintDeLaCampagne: DECOR,
        })).toBe(PROJETE);
    });

    /*
      Sans image en direct, la projection connue du magasin vaut mieux que le
      papier peint : c'est ce que le meneur a choisi de montrer.
    */
    it('à défaut, la projection connue du magasin', () => {
        expect(fondDuPlayerHub({
            imageEnDirect: undefined,
            projectionVersLeHub: PROJETE,
            papierPeintDeLaCampagne: DECOR,
        })).toBe(PROJETE);
    });

    it('et le décor en dernier recours', () => {
        expect(fondDuPlayerHub({
            imageEnDirect: undefined,
            projectionVersLeHub: null,
            papierPeintDeLaCampagne: DECOR,
        })).toBe(DECOR);
    });

    /* Une campagne sans papier peint donne un fond vide, pas une exception. */
    it('sans rien du tout, le fond est vide', () => {
        expect(fondDuPlayerHub({ imageEnDirect: undefined })).toBeNull();
    });

    /*
      ⭐ **La distinction en une assertion.** Si un jour quelqu'un remplace le
      `!== undefined` par un `??`, ce test est le seul à s'en apercevoir — et
      c'est exactement la substitution qui a noirci l'écran.
    */
    it('⛔ `undefined` et `null` ne donnent PAS le même fond', () => {
        const commun = { projectionVersLeHub: null, papierPeintDeLaCampagne: DECOR };

        expect(fondDuPlayerHub({ ...commun, imageEnDirect: undefined }))
            .not.toBe(fondDuPlayerHub({ ...commun, imageEnDirect: null }));
    });
});

/**
 * ⭐ **LE DÉCOR NE REVENAIT JAMAIS, ET LE COMMENTAIRE CI-DESSUS DISAIT POURTANT
 * COMMENT IL AURAIT DÛ (2026-09-17).**
 *
 * David : *« sur le Player Hub, peux-tu, sans qu'il n'y ait conflit, projeter
 * l'image de base de la campagne lorsque le Player Hub n'affiche rien ? »*
 *
 * **Le décor existait déjà**, et sa campagne ouverte en avait un — vérifié dans
 * sa sauvegarde. Mais quatre endroits de `useHubSync` écrivaient
 * `setLiveImagePath(data || null)`, et arrêter une projection envoie une **chaîne
 * vide** : `'' || null` vaut `null`, c'est-à-dire *« écran éteint »*.
 *
 * ⚠️ **Le correctif du 2026-09-13 avait traité le chemin qui avait fait mal, pas
 * la règle** : `FULL_RESET` posait déjà `undefined` — et les essais ci-dessus le
 * vérifiaient —, pendant que les quatre autres chemins écrivaient `null`. *La
 * question « qui d'autre a la même rustine à poser ? » n'avait pas été posée, et
 * ces essais ne pouvaient pas la poser à ma place : ils gardaient la fonction,
 * pas ses appelants.*
 */
describe('ce que devient le fond quand un message arrive', () => {
    it('une charge vide rend la main au décor, elle n’éteint pas', () => {
        expect(imageApresMessage('')).toBeUndefined();
        expect(imageApresMessage(null)).toBeUndefined();
        expect(imageApresMessage(undefined)).toBeUndefined();
    });

    it('une adresse est prise telle quelle', () => {
        expect(imageApresMessage('m-1234')).toBe('m-1234');
    });

    /** ⭐ Le bout à bout, celui qui décrit ce que David voyait. */
    it('arrêter une projection ramène l’image de la campagne', () => {
        expect(fondDuPlayerHub({
            imageEnDirect: imageApresMessage(''),
            projectionVersLeHub: null,
            papierPeintDeLaCampagne: DECOR,
        })).toBe(DECOR);
    });

    /** Sans image de campagne, on retombe sur le fond uni — pas d'invention. */
    it('sans image de campagne, il n’y a rien à rendre', () => {
        expect(fondDuPlayerHub({
            imageEnDirect: imageApresMessage(''),
            projectionVersLeHub: null,
            papierPeintDeLaCampagne: null,
        })).toBeNull();
    });
});

/**
 * ⚠️ **Le branchement, que la fonction seule ne prouve pas.**
 *
 * *Une distinction énoncée dans un commentaire et non tenue par une fonction ne
 * survit pas à son quatrième appelant* — c'est exactement ce qui s'est passé.
 */
describe('les quatre chemins passent tous par la même règle', () => {
    it('plus aucun chemin n’écrit `|| null` sur l’image en direct', () => {
        expect(CROCHET).not.toMatch(/setLiveImagePath\([^)]*\|\|\s*null\)/);
    });

    it('les quatre passent par la règle commune', () => {
        expect(CROCHET.match(/setLiveImagePath\(imageApresMessage\(/g) ?? []).toHaveLength(4);
    });

    /**
     * ⭐ **Le vrai noir reste possible, et il est le seul à poser `null`.** David
     * a voulu **garder les deux gestes** : *deux intentions qui produisent le même
     * pixel ne sont pas la même intention.*
     */
    it('seul le message d’extinction pose `null`', () => {
        expect(CROCHET.match(/setLiveImagePath\(null\)/g) ?? []).toHaveLength(1);

        const depart = CROCHET.indexOf("payload?.type === 'BLACKOUT'");
        expect(depart, 'le message d’extinction est introuvable').toBeGreaterThan(0);
        expect(CROCHET.slice(depart, depart + 400)).toContain('setLiveImagePath(null)');
    });

    it('la remise à zéro rend le décor, elle n’éteint pas', () => {
        const depart = CROCHET.indexOf("payload?.type === 'FULL_RESET'");
        expect(depart).toBeGreaterThan(0);
        expect(CROCHET.slice(depart, depart + 900)).toContain('setLiveImagePath(undefined)');
    });
});

/**
 * ⭐ **LE HUB ATTENDAIT CE QU'IL POUVAIT DÉDUIRE (2026-09-17, second signalement).**
 *
 * David, après le premier correctif : *« l'image de fond n'apparaît pas quand je
 * lance le Player Hub »*.
 *
 * Le Hub lisait un seul champ, `activeCampaignWallpaper` — **le seul des deux à
 * ne pas être persisté.** Au lancement il vaut `null` et ne se remplit qu'à
 * l'arrivée d'une synchronisation complète, alors que `activeCampaignId` et
 * `campaigns[].wallpaperUrl` étaient déjà sur son disque.
 *
 * ⭐ ***La même vérité était DÉDUITE du côté du meneur et ATTENDUE du côté du
 * Hub.*** *Un écran qui attend ce qu'il peut calculer reste vide aussi longtemps
 * que le réseau met à répondre.*
 */
describe('le décor de la campagne ouverte', () => {
    const CAMPAGNES = [
        { id: 'c-1', wallpaperUrl: 'm-anges-de-feu' },
        { id: 'c-2', wallpaperUrl: null },
        { id: 'c-3' },
    ];

    it('se déduit du disque quand rien n’a encore été envoyé', () => {
        expect(papierPeintDeLaCampagne(null, CAMPAGNES, 'c-1')).toBe('m-anges-de-feu');
    });

    /**
     * ⚠️ **L'envoyé passe d'abord, et ce n'est pas un détail** : il est **déjà
     * résolu** en adresse utilisable par n'importe quel écran, là où le repli
     * local rend une référence média qui ne vaut que dans une fenêtre partageant
     * la base du meneur. *Le repli comble une attente, il ne remplace pas le
     * transport.*
     */
    it('mais ce qui a été envoyé l’emporte, car il est déjà résolu', () => {
        expect(papierPeintDeLaCampagne('http://192.168.0.2:3001/media/x.png', CAMPAGNES, 'c-1'))
            .toBe('http://192.168.0.2:3001/media/x.png');
    });

    it('rend null pour une campagne sans image', () => {
        expect(papierPeintDeLaCampagne(null, CAMPAGNES, 'c-2')).toBeNull();
        expect(papierPeintDeLaCampagne(null, CAMPAGNES, 'c-3')).toBeNull();
    });

    it('rend null quand aucune campagne n’est ouverte', () => {
        expect(papierPeintDeLaCampagne(null, CAMPAGNES, null)).toBeNull();
        expect(papierPeintDeLaCampagne(null, CAMPAGNES, undefined)).toBeNull();
    });

    it('supporte une liste absente ou une campagne inconnue', () => {
        expect(papierPeintDeLaCampagne(null, null, 'c-1')).toBeNull();
        expect(papierPeintDeLaCampagne(null, [], 'c-1')).toBeNull();
        expect(papierPeintDeLaCampagne(null, CAMPAGNES, 'c-inconnue')).toBeNull();
    });

    /** ⚠️ Les identifiants voyagent parfois en nombre : *une comparaison stricte les raterait.* */
    it('compare les identifiants sans se soucier de leur type', () => {
        expect(papierPeintDeLaCampagne(null, [{ id: 42 as never, wallpaperUrl: 'm-x' }], '42'))
            .toBe('m-x');
    });

    /** ⭐ Le bout à bout : au lancement, rien de projeté, le décor doit être là. */
    it('au lancement, sans rien de projeté, le décor est à l’écran', () => {
        expect(fondDuPlayerHub({
            imageEnDirect: undefined,
            projectionVersLeHub: null,
            papierPeintDeLaCampagne: papierPeintDeLaCampagne(null, CAMPAGNES, 'c-1'),
        })).toBe('m-anges-de-feu');
    });
});

/** Le Hub doit vraiment s'en servir — *une déduction non branchée est une déduction absente.* */
describe('le hub déduit vraiment son décor', () => {
    it('le crochet passe par la déduction, pas par le seul champ envoyé', () => {
        expect(CROCHET).toContain('papierPeintDeLaCampagne(wallpaperEnvoye, campaigns, activeCampaignId)');
    });
});

/**
 * ⭐ **LE BOUTON QUOTIDIEN NE DOIT PAS CHANGER DE SENS (2026-09-18).**
 *
 * ⛔ Le 2026-09-17 au soir, j'avais rebranché les deux boutons rouges d'Image-OS
 * sur l'extinction, au motif que leur infobulle disait « Éteindre l'écran ». Or
 * ce sont ceux que David utilise pour **arrêter une projection**. Le lendemain
 * matin : *« quand j'arrête de projeter je tombe sur un écran noir, il ne revient
 * pas sur l'image de la campagne »*.
 *
 * ⭐ ***Un libellé décrit une intention ; un geste quotidien EST une intention.***
 * Quand les deux se contredisent, c'est le geste qui a raison — on corrige le
 * libellé, on ne détourne pas le bouton.
 */
describe('les boutons d’Image-OS gardent leur geste', () => {
    it('les deux boutons rouges arrêtent la projection, ils n’éteignent pas', () => {
        expect(TABLEAU_DE_BORD).toContain('onClick={blackout}');
        expect(TABLEAU_DE_BORD).toContain('onClick={blackoutAll}');
    });

    /** Le vrai noir existe, et il a **son** bouton — il ne prend celui de personne. */
    it('le vrai noir a son propre bouton', () => {
        expect(TABLEAU_DE_BORD).toContain('onClick={noirTotal}');
        expect(TABLEAU_DE_BORD).toContain('blackout.darkTooltip');
    });

    /**
     * ⚠️ **Et il n'y en a qu'un.** Si `noirTotal` se retrouvait un jour sur trois
     * boutons, ce serait le signe qu'on a recommencé à confondre les deux gestes.
     */
    it('un seul bouton éteint vraiment', () => {
        expect(TABLEAU_DE_BORD.match(/onClick=\{noirTotal\}/g) ?? []).toHaveLength(1);
    });
});
