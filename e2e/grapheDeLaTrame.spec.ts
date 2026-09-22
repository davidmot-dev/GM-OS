import { test, expect } from '@playwright/test';
import { lancerGmOs, attendreLHydratation, CAMPAGNE_TEMOIN, type GmOsLance } from './lancerGmOs';

/**
 * **Le graphe de la trame s'ouvre, se règle, et revient à la fiche.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE FICHIER EXISTE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le calcul du graphe est couvert par 31 essais sans fenêtre
 * (`grapheDeLaTrame.test.ts`). **Rien de ce qui suit n'en fait partie** :
 *
 * - ⛔ **Le canevas se dessine-t-il vraiment ?** `ForceGraph2D` ne rend rien tant
 *   que son conteneur mesure zéro — et `ResizeObserver` ne répond jamais sur un
 *   élément `hidden`. *Un écran vide ne lève aucune erreur.*
 * - ⛔ **La porte existe-t-elle ?** Quatre fois en trois jours, ce dépôt a livré
 *   une fonctionnalité dont le chemin n'existait pas depuis l'endroit où le
 *   meneur se tenait. Un essai qui appelle la fonction ne prouve pas qu'on peut
 *   y aller.
 * - ⛔ **Le retour à l'arbre ramène-t-il sur la bonne fiche ?**
 *
 * ⚠️ **Il faut un `npm run build` à jour** : `lancerGmOs` démarre Electron sur
 * `dist/index.html`, et un `dist/` périmé ferait passer ces essais sur le code
 * d'hier — ce qui est arrivé pour de vrai les 20 et 21 septembre.
 */

/** Amène l'écran de trame, que rien n'expose dans la barre latérale. */
async function ouvrirLaTrame(gmos: GmOsLance): Promise<void> {
    await gmos.fenetre.evaluate(() => {
        const S = (window as never as {
            useSessionOSStore: { getState: () => { setCurrentView: (v: string) => void } };
        }).useSessionOSStore;
        S.getState().setCurrentView('trame');
    });
    /* `exact` : l'en-tête de Session OS porte le même nom que l'écran. */
    await expect(gmos.fenetre.getByRole('heading', { name: 'Trame narrative', exact: true }))
        .toBeVisible();
}

/**
 * **Épingle des nœuds à des coordonnées connues.**
 *
 * ⛔ **Sans ça, aucun geste sur la toile n’est testable.** La simulation pose
 * les nœuds où elle veut, et un canevas n’offre aucune cible à Playwright. Une
 * épingle donne à la fois une position **et** l’immobilité : `placerLeNoeud`
 * rend `fx/fy` pour un nœud épinglé, donc d3 ne le déplace plus.
 *
 * ⚠️ Les identifiants sont ceux **du graphe**, préfixés par leur type.
 */
async function epingler(gmos: GmOsLance, places: Record<string, { x: number; y: number }>): Promise<void> {
    await gmos.fenetre.evaluate((carte) => {
        const S = (window as never as {
            useSessionOSStore: {
                getState: () => {
                    activeCampaignId: string | null;
                    epinglerDansLaTrame: (c: string, n: string, p: { x: number; y: number }) => void;
                };
            };
        }).useSessionOSStore;
        const etat = S.getState();
        if (!etat.activeCampaignId) throw new Error('aucune campagne active');
        for (const [noeud, place] of Object.entries(carte)) {
            etat.epinglerDansLaTrame(etat.activeCampaignId, noeud, place);
        }
    }, places);

    /*
      ⚠️ **Une attente en dur, et c’est le bon outil ici.** Épingler déclenche un
      rendu, puis `placerLeNoeud` donne au nœud ses `fx/fy`, puis d3 redessine.
      Un canevas n’expose **aucun état accessible** à attendre : il n’y a ni rôle,
      ni texte, ni attribut qui dise « le nœud est arrivé ». *La première version
      de ces essais cliquait avant, et échouait sans que rien ne soit cassé.*
    */
    await gmos.fenetre.waitForTimeout(900);
}

/** Les épingles de la campagne — c’est là qu’un glisser laisse sa trace. */
async function lireLesEpingles(gmos: GmOsLance): Promise<Record<string, { x: number; y: number }>> {
    return gmos.fenetre.evaluate(() => {
        const S = (window as never as {
            useSessionOSStore: {
                getState: () => {
                    activeCampaignId: string | null;
                    campaigns: { id: string; noeudsEpinglesDeLaTrame?: Record<string, { x: number; y: number }> }[];
                };
            };
        }).useSessionOSStore;
        const etat = S.getState();
        return etat.campaigns.find(c => c.id === etat.activeCampaignId)?.noeudsEpinglesDeLaTrame ?? {};
    });
}

/**
 * **Combien de pixels d’écran valent une unité de graphe.**
 *
 * ⛔ **Mesurée, jamais supposée.** La toile s’ouvre à une échelle de 2 dans cet
 * environnement : un glisser de 110 px ne déplace le nœud que de 55 unités.
 * *Mes premiers essais de glisser échouaient pour ça, et rien dans le code
 * n’était cassé.* L’inscrire en dur les aurait rendus faux le jour où la
 * bibliothèque change son cadrage par défaut — **sans les faire échouer pour la
 * bonne raison**.
 *
 * On glisse donc ce qui se trouve au centre, et on lit dans le magasin de combien
 * il a bougé. Peu importe de quel nœud il s’agit : le rapport est le même pour
 * tous.
 */
async function mesurerLEchelle(gmos: GmOsLance): Promise<number> {
    const PAS = 40;
    const avant = await lireLesEpingles(gmos);
    const depart = await point(gmos, 0);
    await glisser(gmos, depart, { x: depart.x + PAS, y: depart.y });
    await gmos.fenetre.waitForTimeout(400);

    /* Un glisser de calibrage peut poser une scène sur un voisin : on refuse. */
    const question = gmos.fenetre.getByRole('button', { name: 'Annuler' });
    if (await question.count() > 0) await question.click();

    const apres = await lireLesEpingles(gmos);
    for (const [noeud, place] of Object.entries(apres)) {
        const ancien = avant[noeud];
        const bouge = ancien ? place.x - ancien.x : 0;
        if (Math.abs(bouge) > 1) return PAS / bouge;
    }
    throw new Error('calibrage impossible : aucun nœud n’a bougé au centre de la toile');
}

/**
 * Entre dans le mode liaison, **et attend qu'il soit là**.
 *
 * ⛔ **L'attente n'est pas une précaution, c'est la correction d'un échec réel.**
 * Mes premiers essais glissaient dès le clic sur « Relier » : React n'avait pas
 * encore appliqué l'état, les gestionnaires du pointeur repartaient aussitôt, et
 * *le lien n'était pas créé sans qu'aucun code soit en cause.* Le bandeau du mode
 * est la preuve visible que l'état est posé.
 */
async function entrerEnLiaison(gmos: GmOsLance): Promise<void> {
    await gmos.fenetre.getByRole('button', { name: 'Relier', exact: true }).click();
    await expect(gmos.fenetre.getByText(/Glisse d’une scène vers une autre/)).toBeVisible();
}

/** Et en sortir, de même. */
async function sortirDeLiaison(gmos: GmOsLance): Promise<void> {
    await gmos.fenetre.getByRole('button', { name: 'Relier', exact: true }).click();
    await expect(gmos.fenetre.getByText(/Glisse d’une scène vers une autre/)).toHaveCount(0);
}

/** Une scène telle que le magasin la porte — la seule preuve qui compte. */
async function lireLaScene(gmos: GmOsLance, id: string) {
    return gmos.fenetre.evaluate((sceneId) => {
        const S = (window as never as {
            useSessionOSStore: { getState: () => { scenes: Record<string, unknown>[] } };
        }).useSessionOSStore;
        return S.getState().scenes.find((sc) => sc.id === sceneId) as {
            acteId: string; entiteIds: string[]; indiceIds: string[]; titre: string;
            importance?: string; lieuId?: string;
            enchainements?: { vers: string; libelle?: string }[];
        };
    }, id);
}

/**
 * Le centre du canevas, et un point à `dx` pixels de lui.
 *
 * ⚠️ **Le graphe n’est jamais recadré** — aucun `zoomToFit` n’est appelé —
 * donc l’origine du repère du graphe tombe au centre du canevas, à l’échelle 1.
 * *Un recadrage automatique rendrait ces essais faux sans les faire échouer.*
 */
async function point(gmos: GmOsLance, dx: number, dy = 0): Promise<{ x: number; y: number }> {
    const cadre = await gmos.fenetre.locator('canvas').first().boundingBox();
    if (!cadre) throw new Error('canevas introuvable');
    return { x: cadre.x + cadre.width / 2 + dx, y: cadre.y + cadre.height / 2 + dy };
}

async function glisser(gmos: GmOsLance, de: { x: number; y: number }, vers: { x: number; y: number }) {
    await gmos.fenetre.mouse.move(de.x, de.y);
    await gmos.fenetre.mouse.down();
    /* Deux pas : un seul mouvement ne produit qu’un `pointermove`, et le fil
       élastique ne serait jamais dessiné. */
    await gmos.fenetre.mouse.move((de.x + vers.x) / 2, (de.y + vers.y) / 2);
    await gmos.fenetre.mouse.move(vers.x, vers.y);
    await gmos.fenetre.mouse.up();
}

const bouton = (gmos: GmOsLance, nom: string) =>
    gmos.fenetre.getByRole('button', { name: nom, exact: true });

/**
 * Un cran du curseur de niveau, par son infobulle.
 *
 * ⚠️ **Et pas par son nom** : le cran 0 s'appelle « Trame », comme l'écran et
 * comme le bouton de l'en-tête de Session OS. *Trois boutons du même nom sur un
 * écran, c'est un essai qui clique au hasard.*
 */
const cran = (gmos: GmOsLance, index: number, libelle: string) =>
    gmos.fenetre.getByTitle(index === 0 ? 'Les actes et leurs scènes' : `Jusqu'aux ${libelle}`);

test.describe('le graphe de la trame', () => {
    /*
      ⚠️ Chaque essai démarre Electron (~8 s), attend l'hydratation, puis pose des
      épingles avec leur temps de dépôt. Les trente secondes par défaut suffisaient
      aux six premiers et **plus à ceux qui calibrent l'échelle** : un échec par
      dépassement de délai ressemble à un échec de code.
    */
    test.describe.configure({ timeout: 90_000 });

    let gmos: GmOsLance;

    test.beforeEach(async () => {
        gmos = await lancerGmOs({ semence: CAMPAGNE_TEMOIN });
        await attendreLHydratation(gmos);
        await ouvrirLaTrame(gmos);
    });

    test.afterEach(async () => { await gmos?.fermer(); });

    /**
     * ⛔ **La porte, et le canevas derrière.** Le `<canvas>` est la seule preuve
     * que `ForceGraph2D` a reçu une taille : *son conteneur mesurait zéro, il
     * n'aurait rien dessiné et rien dit.*
     */
    test('s’ouvre depuis l’arbre et dessine quelque chose', async () => {
        await expect(bouton(gmos, 'Graphe')).toBeVisible();
        await bouton(gmos, 'Graphe').click();

        const canevas = gmos.fenetre.locator('canvas');
        await expect(canevas.first()).toBeVisible();

        const taille = await canevas.first().evaluate((el: HTMLCanvasElement) => ({
            largeur: el.width, hauteur: el.height,
        }));
        expect(taille.largeur, 'le conteneur du graphe mesure zéro').toBeGreaterThan(100);
        expect(taille.hauteur).toBeGreaterThan(100);
    });

    /**
     * ⭐ **Le curseur de niveau — l'idée de David.** On vérifie qu'il agit
     * vraiment sur ce qui est dessiné, par la légende : elle ne nomme que les
     * sortes que le cran affiche.
     */
    test('le niveau ajoute des sortes de nœuds, et n’en retire aucune', async () => {
        await bouton(gmos, 'Graphe').click();

        const legende = gmos.fenetre.locator('.absolute.bottom-3.left-3');
        await expect(legende).toContainText('Acte');
        await expect(legende).toContainText('Scène');

        /* Le défaut est à deux crans : PNJ visible, Indices non. */
        await expect(legende).toContainText('PNJ');
        await expect(legende).not.toContainText('Indice');

        await cran(gmos, 0, 'trame').click();
        await expect(legende).not.toContainText('PNJ');
        await expect(legende).toContainText('Acte');

        await cran(gmos, 5, 'ambiances').click();
        for (const sorte of ['Acte', 'Scène', 'Lieu', 'PNJ', 'Indice', 'Personnage', 'Ambiance']) {
            await expect(legende, `« ${sorte} » manque au dernier cran`).toContainText(sorte);
        }
    });

    /**
     * ⚠️ **Un écran vide doit dire pourquoi.** « Intrigue principale seule » sur
     * une campagne que personne n'a classée ne rend aucune scène : *sans phrase,
     * ça ressemble à un graphe cassé*, et le meneur chercherait le défaut
     * ailleurs.
     */
    test('explique son vide au lieu de le laisser croire à une panne', async () => {
        await bouton(gmos, 'Graphe').click();
        await gmos.fenetre.getByRole('combobox').first().selectOption('principale');

        await expect(gmos.fenetre.getByText(/Aucune scène n’est classée/)).toBeVisible();
    });

    /**
     * ⭐ **Les constats se comptent et s'isolent.** Le témoin porte deux scènes
     * sans lieu — vérifié dans `e2e/donnees/campagne-temoin.json`, et c'est le
     * seul constat qu'il déclenche. *Viser un constat que la semence ne produit
     * pas aurait fait échouer l'essai pour la mauvaise raison.*
     */
    test('les constats se comptent et s’isolent', async () => {
        await bouton(gmos, 'Graphe').click();

        const constat = gmos.fenetre.getByRole('button', { name: /2\s*scènes? sans lieu/ });
        await expect(constat).toBeVisible();
        await constat.click();

        /* Le retour existe : sans lui, un constat cliqué par curiosité laisserait
           le graphe estompé sans dire comment en sortir. */
        await expect(bouton(gmos, 'Tout remontrer')).toBeVisible();
        await bouton(gmos, 'Tout remontrer').click();
        await expect(bouton(gmos, 'Tout remontrer')).toHaveCount(0);
    });

    /** La disposition se garde : *une disposition à refaire n'en est pas une.* */
    test('se fige et se libère', async () => {
        await bouton(gmos, 'Graphe').click();

        await expect(bouton(gmos, 'Libre')).toBeVisible();
        await bouton(gmos, 'Libre').click();
        await expect(bouton(gmos, 'Figé')).toBeVisible();

        const fige = await gmos.fenetre.evaluate(() => {
            const S = (window as never as {
                useSessionOSStore: {
                    getState: () => {
                        campaigns: { id: string; trameFigee?: boolean }[];
                        activeCampaignId: string | null;
                    };
                };
            }).useSessionOSStore;
            const etat = S.getState();
            return etat.campaigns.find(c => c.id === etat.activeCampaignId)?.trameFigee;
        });
        expect(fige, 'le figeage n’a pas été retenu dans la campagne').toBe(true);

        await bouton(gmos, 'Figé').click();
        await expect(bouton(gmos, 'Libre')).toBeVisible();
    });

    /**
     * ⛔ **Le graphe n'est pas une impasse.** Sans ce chemin, on verrait un
     * problème sans pouvoir le corriger — et il faudrait retrouver la scène dans
     * l'arbre à la main.
     */
    test('revient à l’arbre, sur la fiche du nœud choisi', async () => {
        await bouton(gmos, 'Graphe').click();
        await expect(gmos.fenetre.locator('canvas').first()).toBeVisible();

        await bouton(gmos, 'Arbre').click();

        /* On prouve qu'on a bien changé de vue : le curseur de niveau appartient
           au graphe et ne survit pas au retour. Et l'arbre montre ses actes. */
        await expect(cran(gmos, 0, 'trame')).toHaveCount(0);
        await expect(gmos.fenetre.getByText("L'arrivee")).toBeVisible();
    });

    /* ─────────────────────────────────────────────
       MODIFIER LA TRAME DEPUIS LE GRAPHE (2026-09-22)
       ───────────────────────────────────────────── */

    /**
     * ⭐ **Relier en glissant, dans le mode liaison.** C’est le geste que seul un
     * graphe permet : il fait en un mouvement ce que trois listes de cases font
     * dans la fiche.
     */
    test('relie une scène à un indice en glissant', async () => {
        await bouton(gmos, 'Graphe').click();
        /* Les indices n’apparaissent qu’au quatrième cran. */
        await cran(gmos, 3, 'indices').click();
        await epingler(gmos, {
            'scene:temoin-scene-3': { x: 0, y: 0 },
            'indice:temoin-indice-1': { x: 90, y: 0 },
        });

        const avant = await lireLaScene(gmos, 'temoin-scene-3');
        expect(avant.indiceIds, 'la semence a changé : cette scène porte déjà un indice').toEqual([]);

        const echelle = await mesurerLEchelle(gmos);
        /* ⚠️ Le calibrage a déplacé UN des deux nœuds, et on ne sait pas lequel :
           on les repose donc tous les deux. */
        await epingler(gmos, {
            'scene:temoin-scene-3': { x: 0, y: 0 },
            'indice:temoin-indice-1': { x: 90, y: 0 },
        });

        await entrerEnLiaison(gmos);
        await glisser(gmos, await point(gmos, 0), await point(gmos, 90 * echelle));

        await expect.poll(async () => (await lireLaScene(gmos, 'temoin-scene-3')).indiceIds)
            .toEqual(['temoin-indice-1']);
    });

    /**
     * ⛔ **Hors du mode liaison, la toile n’écrit rien.** Un clic sur un trait
     * est facile à rater ; c’est la même règle que la confirmation du
     * rattachement — *le geste de rangement ne doit jamais modifier la trame par
     * accident.*
     */
    test('délie un renvoi, et seulement dans le mode liaison', async () => {
        await bouton(gmos, 'Graphe').click();
        await epingler(gmos, {
            'scene:temoin-scene-2': { x: 0, y: 0 },
            'pnj:temoin-pnj-1': { x: 90, y: 0 },
        });

        /* Le trait est droit — voir `linkCurvature` — donc il passe bien à
           mi-chemin des deux nœuds épinglés. */
        const milieu = await point(gmos, 45);
        await gmos.fenetre.mouse.click(milieu.x, milieu.y);
        await expect.poll(async () => (await lireLaScene(gmos, 'temoin-scene-2')).entiteIds)
            .toEqual(['temoin-pnj-1']);

        await entrerEnLiaison(gmos);
        /* Quelques pixels de marge : la zone sensible d'un trait est fine, et
           l'essai ne doit pas échouer pour un demi-pixel d'arrondi. */
        for (const dy of [0, -2, 2, -4, 4]) {
            const vise = await point(gmos, 45, dy);
            await gmos.fenetre.mouse.click(vise.x, vise.y);
            const scene = await lireLaScene(gmos, 'temoin-scene-2');
            if (scene.entiteIds.length === 0) break;
        }
        await expect.poll(async () => (await lireLaScene(gmos, 'temoin-scene-2')).entiteIds)
            .toEqual([]);
    });

    /**
     * ⚠️ **La confirmation n’est pas une politesse.** On lâche des nœuds pour
     * ranger, et l’un tombera un jour pile sur un acte : *sans question, un geste
     * de rangement changerait l’acte d’une scène sans le dire.*
     */
    test('rattache une scène à un autre acte, après confirmation', async () => {
        await bouton(gmos, 'Graphe').click();
        await epingler(gmos, {
            'scene:temoin-scene-1': { x: 0, y: 0 },
            'acte:temoin-acte-2': { x: 110, y: 0 },
        });

        expect((await lireLaScene(gmos, 'temoin-scene-1')).acteId).toBe('temoin-acte-1');

        const echelle = await mesurerLEchelle(gmos);
        await epingler(gmos, { 'scene:temoin-scene-1': { x: 0, y: 0 } });
        await glisser(gmos, await point(gmos, 0), await point(gmos, 110 * echelle));

        await expect(gmos.fenetre.getByText(/Rattacher .* à l’acte/)).toBeVisible();
        await gmos.fenetre.getByRole('button', { name: 'Confirmer' }).click();

        await expect.poll(async () => (await lireLaScene(gmos, 'temoin-scene-1')).acteId)
            .toBe('temoin-acte-2');
    });

    /** Et refuser ne change rien — sinon la question serait décorative. */
    test('un rattachement refusé ne change rien', async () => {
        await bouton(gmos, 'Graphe').click();
        await epingler(gmos, {
            'scene:temoin-scene-1': { x: 0, y: 0 },
            'acte:temoin-acte-2': { x: 110, y: 0 },
        });

        const echelle = await mesurerLEchelle(gmos);
        await epingler(gmos, { 'scene:temoin-scene-1': { x: 0, y: 0 } });
        await glisser(gmos, await point(gmos, 0), await point(gmos, 110 * echelle));

        await expect(gmos.fenetre.getByText(/Rattacher .* à l’acte/)).toBeVisible();
        await gmos.fenetre.getByRole('button', { name: 'Annuler' }).click();

        expect((await lireLaScene(gmos, 'temoin-scene-1')).acteId).toBe('temoin-acte-1');
    });

    /** Le panneau écrit par les mêmes actions que la fiche. */
    test('renomme une scène et la classe depuis le panneau', async () => {
        await bouton(gmos, 'Graphe').click();
        await epingler(gmos, { 'scene:temoin-scene-2': { x: 0, y: 0 } });

        const centre = await point(gmos, 0);
        await gmos.fenetre.mouse.click(centre.x, centre.y);

        const champ = gmos.fenetre.getByRole('textbox').first();
        await expect(champ).toHaveValue('Entretien avec Hale');
        await champ.fill('Entretien avec Hale, seconde fois');

        await gmos.fenetre.getByRole('button', { name: 'Principale', exact: true }).click();

        await expect.poll(async () => {
            const sc = await lireLaScene(gmos, 'temoin-scene-2');
            return { titre: sc.titre, rang: sc.importance };
        }).toEqual({ titre: 'Entretien avec Hale, seconde fois', rang: 'principale' });
    });

    /* ─────────────────────────────────────────────
       « UNE SCÈNE A MÈNE VERS UNE SCÈNE B OU C » (2026-09-22)
       ───────────────────────────────────────────── */

    /**
     * ⭐ **L'embranchement, du geste jusqu'à sa condition.** C'est ce qui fait
     * d'un graphe un plan de scénario et non une carte de ce qui existe.
     */
    test('déclare qu’une scène mène à une autre, et nomme la condition', async () => {
        await bouton(gmos, 'Graphe').click();
        await epingler(gmos, {
            'scene:temoin-scene-2': { x: 0, y: 0 },
            'scene:temoin-scene-3': { x: 90, y: 0 },
        });
        const echelle = await mesurerLEchelle(gmos);
        await epingler(gmos, {
            'scene:temoin-scene-2': { x: 0, y: 0 },
            'scene:temoin-scene-3': { x: 90, y: 0 },
        });

        await entrerEnLiaison(gmos);
        await glisser(gmos, await point(gmos, 0), await point(gmos, 90 * echelle));

        await expect.poll(async () => (await lireLaScene(gmos, 'temoin-scene-2')).enchainements)
            .toEqual([{ vers: 'temoin-scene-3' }]);

        /* La condition se tape dans le panneau — le geste crée la branche, le
           panneau lui donne son sens. */
        await sortirDeLiaison(gmos);
        const centre = await point(gmos, 0);
        await gmos.fenetre.mouse.click(centre.x, centre.y);
        /*
          ⛔ **`pressSequentially` et non `fill`, et c'est tout le sujet.** David a
          trouvé le 2026-09-22 qu'on ne pouvait **pas taper d'espace** dans une
          condition : le libellé était rogné à chaque frappe, et l'espace était
          mangé avant d'exister. *`fill` pose la valeur d'un seul coup : il ne
          pouvait pas le voir.* Frapper caractère par caractère le voit.
        */
        await gmos.fenetre.getByPlaceholder('à quelle condition ?')
            .pressSequentially('si Hale se tait');

        await expect.poll(async () => (await lireLaScene(gmos, 'temoin-scene-2')).enchainements)
            .toEqual([{ vers: 'temoin-scene-3', libelle: 'si Hale se tait' }]);
    });

    /**
     * ⛔ **La porte de l'arbre.** *Une fonctionnalité qui n'existe qu'au bout
     * d'un geste de toile est absente pour qui n'ouvre pas la toile* — quatre fois
     * payé en trois jours. La fiche montre la suite, et sait la défaire.
     */
    test('la fiche de l’arbre montre la suite et sait la retirer', async () => {
        /* On pose la sortie par le magasin : ce qu'on éprouve ici est la FICHE,
           pas le geste — il a son propre essai juste au-dessus. */
        await gmos.fenetre.evaluate(() => {
            const S = (window as never as {
                useSessionOSStore: {
                    getState: () => { ajouterUnEnchainement: (a: string, b: string, c?: string) => void };
                };
            }).useSessionOSStore;
            S.getState().ajouterUnEnchainement('temoin-scene-2', 'temoin-scene-3', 's’il refuse');
        });

        /*
          ⚠️ **On désigne la scène par l'arbre, pas par la toile.** Un clic au
          centre du canevas attrapait *un autre nœud* : la simulation y regroupe
          tout ce qui n'est pas épinglé, et l'essai lisait alors la fiche d'une
          scène sans sortie. *Un essai qui désigne sa cible au hasard finit par
          échouer pour une raison qui n'a rien à voir.* L'arbre, lui, offre de
          vraies cibles.
        */
        await gmos.fenetre.getByText("Ce que Hale n'a pas dit").click();
        await gmos.fenetre.getByText('Entretien avec Hale').first().click();

        await expect(gmos.fenetre.getByText('Mène à — les suites possibles')).toBeVisible();
        await expect(gmos.fenetre.getByPlaceholder(/à quelle condition/))
            .toHaveValue('s’il refuse');
        /* Et la scène cible est nommée, pas son identifiant. */
        await expect(gmos.fenetre.getByRole('button', { name: 'La voix dans le relais' })).toBeVisible();

        await gmos.fenetre.getByTitle('Retirer cette suite').click();
        await expect.poll(async () => (await lireLaScene(gmos, 'temoin-scene-2')).enchainements)
            .toBeUndefined();
        await expect(gmos.fenetre.getByText(/Aucune suite déclarée/)).toBeVisible();
    });

    /**
     * ⛔ **Supprimer une scène efface les flèches qui la visaient.** Sans ça, le
     * meneur lit une sortie vers le vide comme une sortie valide jusqu’à cliquer.
     */
    test('supprimer la cible d’une suite recoud la scène de départ', async () => {
        await bouton(gmos, 'Graphe').click();
        await epingler(gmos, { 'scene:temoin-scene-3': { x: 0, y: 0 } });

        await gmos.fenetre.evaluate(() => {
            const S = (window as never as {
                useSessionOSStore: {
                    getState: () => { ajouterUnEnchainement: (a: string, b: string) => void };
                };
            }).useSessionOSStore;
            S.getState().ajouterUnEnchainement('temoin-scene-2', 'temoin-scene-3');
        });
        await expect.poll(async () => (await lireLaScene(gmos, 'temoin-scene-2')).enchainements)
            .toEqual([{ vers: 'temoin-scene-3' }]);

        const centre = await point(gmos, 0);
        await gmos.fenetre.mouse.click(centre.x, centre.y);
        await bouton(gmos, 'Supprimer').click();
        await gmos.fenetre.getByRole('button', { name: 'Confirmer' }).click();

        await expect.poll(async () => (await lireLaScene(gmos, 'temoin-scene-2')).enchainements)
            .toBeUndefined();
    });
});
