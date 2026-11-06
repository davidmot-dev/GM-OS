import { describe, expect, it } from 'vitest';
import COC_ARMES from '../../../../docs/systems/coc/rules/equipement-armes-et-protections-du-livre-de-base.md?raw';
import COC_ADVERSAIRES from '../../../../docs/systems/coc/rules/la-gestion-simplifiee-des-adversaires-par-roles-et-bandes-de-sbires.md?raw';
import COC_BESTIAIRE from '../../../../docs/systems/coc/rules/bestiaire-du-livre-de-base.md?raw';
import { lignesAVerifier, pagesAVerifier, valeursDeLaCellule, verifierAuLivre } from './verificationAuLivre';
import { demandeDePagesValide, PLAFOND_DES_PAGES } from './livres';

/*
 * F4 — le livre vérifie la fiche (06/11/2026). Le texte de page ci-dessous est celui que pdf-parse
 * rend du livre de COC, page imprimée 93 (PDF 96), recopié de l'essai sur le vrai PDF : une ligne du
 * tableau par ligne de texte, les colonnes séparées par des tabulations.
 */
const PAGE_93 = [
    'Chapitre 6 w paGe 93',
    'A R M E S',
    'ARMES DE CONTACT',
    'Arme \tAllonge1 \tDM \tBonus critique',
    'Fouet \tGrande \t1d4+FOR \t4',
    'Couteau / poignard / baïonnette \tPetite \t1d6+FOR \t6',
    'Batte de base-ball / matraque / tonfa2 \tMoyenne \t1d6+FOR \t6',
    'Marteau / maillet / nunchaku2 \tMoyenne \t1d6+1+FOR \t7',
    'Hachette / hache de jet \tPetite \t1d6+FOR \t6',
    'Fleuret / rapière / canne-épée \tMoyenne \t1d8+FOR \t8',
].join('\n');

const contactSeul = (fiche: string) => lignesAVerifier(fiche).filter(l => l.tableau.startsWith('Tableau des Armes de contact')).slice(0, 5);

describe('F4 — les lignes à vérifier', () => {
    it('la fiche des armes de COC : 44 lignes, les prix par époque et le Spécial écartés', () => {
        const lignes = lignesAVerifier(COC_ARMES);
        expect(lignes).toHaveLength(44);
        const couteau = lignes.find(l => l.nom.startsWith('Couteau'))!;
        expect(couteau.page).toBe(93);
        // Allonge (texte), DM, Bonus critique — pas 50, 20, 10, 5, 3 (les prix viennent du chapitre 3).
        expect(couteau.valeurs).toEqual(['1d6', '6']);
    });

    it('le tableau de profils des adversaires de COC est lu ; une fiche sans tableau lisible ne donne rien', () => {
        expect(lignesAVerifier(COC_ADVERSAIRES).map(l => l.nom)).toEqual(['Figurant', 'Second rôle', 'Premier rôle']);
        expect(lignesAVerifier('## Règle\n\n| Sujet | Valeur |\n| --- | --- |\n| **Initiative** | 10 |')).toEqual([]);
    });

    it('les valeurs d’une cellule : dés et nombres ; « and 3 » n’est pas un dé', () => {
        expect(valeursDeLaCellule('1d6+1+FOR')).toEqual(['1d6', '1']);
        expect(valeursDeLaCellule('2d6 + 1d6/round pour 4 rounds')).toEqual(['2d6', '1d6', '4']);
        expect(valeursDeLaCellule('1,5 kg')).toEqual(['1,5']);
        expect(valeursDeLaCellule('and 3')).toEqual(['3']);
    });

    it('les pages : celle du tableau et ses voisines, sinon la plage des sections', () => {
        expect(pagesAVerifier([{ tableau: 't', nom: 'a', page: 93, valeurs: [] }])).toEqual([92, 93, 94]);
        expect(pagesAVerifier([{ tableau: 't', nom: 'a', valeurs: [] }], { min: 108, max: 110 })).toEqual([107, 108, 109, 110, 111]);
        expect(pagesAVerifier([{ tableau: 't', nom: 'a', valeurs: [] }], null)).toEqual([]);
    });
});

describe('F4 — la confrontation au livre', () => {
    it('les cinq premières armes de contact, telles que le livre les imprime : toutes retrouvées', () => {
        const r = verifierAuLivre(contactSeul(COC_ARMES), [{ page: 93, texte: PAGE_93 }]);
        expect(r).toMatchObject({ retrouvees: 5, aConfirmer: 0, introuvables: 0, total: 5 });
    });

    /*
     * L'essai qui a fait passer la recherche de la page à la ligne : un couteau à 1d8 et un marteau à
     * 1d6+3 passaient, puisque 1d8 et 3 figurent sur la page (le fleuret, les notes de bas de page).
     */
    it('une valeur faussée, présente ailleurs sur la page, est à confirmer, pas retrouvée', () => {
        const faussee = COC_ARMES
            .replace('| **Couteau / poignard / baïonnette** | Petite | 1d6+FOR |', '| **Couteau / poignard / baïonnette** | Petite | 1d8+FOR |');
        const r = verifierAuLivre(contactSeul(faussee), [{ page: 93, texte: PAGE_93 }]);
        expect(r).toMatchObject({ retrouvees: 4, aConfirmer: 1, introuvables: 0 });
        expect(r.lignes.find(l => !l.retrouvee)).toMatchObject({ nom: 'Couteau / poignard / baïonnette', ailleurs: [{ valeur: '1d8', page: 93 }], manquantes: [] });
    });

    it('une valeur qu’aucune page ne porte est introuvable ; un nom absent aussi', () => {
        const faussee = COC_ARMES
            .replace('| **Fouet** | Grande | 1d4+FOR | 4 |', '| **Fouet** | Grande | 1d12+FOR | 4 |')
            .replace('| **Hachette / hache de jet** |', '| **Tronçonneuse** |');
        const r = verifierAuLivre(contactSeul(faussee), [{ page: 93, texte: PAGE_93 }]);
        expect(r).toMatchObject({ retrouvees: 3, introuvables: 2 });
        expect(r.lignes.find(l => l.nom === 'Fouet')?.manquantes).toEqual(['1d12']);
        expect(r.lignes.find(l => l.nom === 'Tronçonneuse')?.nomTrouve).toBe(false);
    });

    it('une ligne qui réunit deux sections : la valeur lue sur l’autre page est à confirmer, avec sa page', () => {
        const lignes = [{ tableau: 'Valeurs', nom: 'Premier rôle', valeurs: ['15', '24'] }];
        const r = verifierAuLivre(lignes, [
            { page: 92, texte: 'MODE PULP\nPremier rôle : 24 échelons' },
            { page: 108, texte: 'LES RÔLES\nPremier rôle \tDEF 15 \tInit. 15' },
        ]);
        expect(r.lignes[0]).toMatchObject({ retrouvee: false, manquantes: [] });
        expect(r.lignes[0].ailleurs).toHaveLength(1);
        expect(r.aConfirmer).toBe(1);
    });

    it('« 15 000 » est un nombre, des deux côtés ; deux colonnes séparées par une tabulation restent deux valeurs', () => {
        expect(valeursDeLaCellule('15 000 $')).toEqual(['15000']);
        const r = verifierAuLivre(
            [{ tableau: 't', nom: 'Combinaison', valeurs: ['15000', '4', '300'] }],
            [{ page: 1, texte: 'Combinaison \t15 000 $ \t4 \t300' }],
        );
        expect(r.lignes[0].retrouvee).toBe(true);
        expect(verifierAuLivre([{ tableau: 't', nom: 'Gilet', valeurs: ['4300'] }], [{ page: 1, texte: 'Gilet \t4 \t300' }]).lignes[0].retrouvee).toBe(false);
    });

    it('« 20 » ne se lit pas dans « 120 », ni « 1,5 » dans « 11,5 »', () => {
        const r = verifierAuLivre(
            [{ tableau: 't', nom: 'Fusil', valeurs: ['20', '1,5'] }],
            [{ page: 1, texte: 'Fusil \t120 \t11,5' }],
        );
        expect(r.lignes[0].manquantes).toEqual(['20', '1,5']);
    });
});

describe('F4 — la demande de pages reçue par le processus principal', () => {
    it('accepte le jeu, la clé et des pages entières ; refuse le reste', () => {
        expect(demandeDePagesValide({ racine: 'systems/coc', cle: 'jeu', pages: [93, 93, 94] }))
            .toEqual({ racine: 'systems/coc', cle: 'jeu', pages: [93, 94] });
        expect(demandeDePagesValide({ racine: 'systems/../x', cle: 'jeu', pages: [1] })).toBeNull();
        expect(demandeDePagesValide({ racine: 'systems/coc', cle: 'jeu', pages: [] })).toBeNull();
        expect(demandeDePagesValide({ racine: 'systems/coc', cle: 'jeu', pages: [1.5] })).toBeNull();
        expect(demandeDePagesValide({ racine: 'systems/coc', cle: 'jeu', pages: Array.from({ length: PLAFOND_DES_PAGES + 1 }, (_, i) => i + 1) })).toBeNull();
        expect(demandeDePagesValide({ racine: 'systems/coc', cle: 'jeu', pages: [1], chemin: 'C:/x.pdf' })).toEqual({ racine: 'systems/coc', cle: 'jeu', pages: [1] });
    });
});

/*
 * Le bestiaire de COC, transcrit du livre le 06/11/2026 : des profils imprimés en bloc, sur une
 * douzaine de lignes, et une colonne « Page » qui donne la page de chaque profil. Le texte ci-dessous
 * est celui que pdf-parse rend de la page imprimée 117 (PDF 120).
 */
const PAGE_117 = [
    'L I S T E D E C R É A T U R E S',
    '\\ Rat',
    'ET AUTRES RONGEURS DE',
    'TAILLE ÉQUIVALENTE',
    'TAI 2',
    'AGI +2 | CON -4 | FOR -4 | PER +2',
    'CHA 0 | INT -4 | VOL 0',
    'SDEF 16 IInit. 16',
    'Échelle de santé 4',
    'ARMES NATURELLES',
    'Morsure +4 / DM 1 + infection / BC +1',
    'CAPACITÉS SPÉCIALES :',
    'Armes naturelles',
    '\\ Serpent venimeux',
    'CROTALE, VIPÈRE, ETC.',
    'TAI 2',
    'AGI +2 | CON -4 | FOR -4 | PER +2',
    'CHA 0 | INT -4 | VOL 0',
    'SDEF 16 IInit. 18',
    'Échelle de santé 4',
    'ARMES NATURELLES',
    'Morsure +6 / DM 1 + Venin / BC +1',
].join('\n');

describe('F4 — les profils en bloc (le bestiaire de COC)', () => {
    const rat = () => lignesAVerifier(COC_BESTIAIRE).filter(l => l.nom === 'Rat' || l.nom === 'Serpent venimeux');

    it('la colonne « Page » donne la page de chaque profil, et n’est pas une valeur', () => {
        const lignes = lignesAVerifier(COC_BESTIAIRE);
        expect(lignes).toHaveLength(15);
        expect(lignes.find(l => l.nom === "Éléphant d'Afrique")).toMatchObject({ page: 119 });
        expect(lignes.find(l => l.nom === 'Rat')!.valeurs).not.toContain('117');
    });

    it('un titre « (p. 117-119) » fait lire toutes ses pages', () => {
        expect(pagesAVerifier([{ tableau: 't', nom: 'a', page: 117, pageFin: 119, valeurs: [] }])).toEqual([116, 117, 118, 119, 120]);
    });

    it('le bloc d’un profil court jusqu’au nom suivant : le rat et le serpent retrouvés', () => {
        const r = verifierAuLivre(rat(), [{ page: 117, texte: PAGE_117 }]);
        expect(r).toMatchObject({ retrouvees: 2, total: 2 });
    });

    it('le bloc s’arrête au nom suivant : l’Init. 18 du serpent ne valide pas un rat faussé', () => {
        const faux = rat().map(l => (l.nom === 'Rat' ? { ...l, valeurs: [...l.valeurs.filter(v => v !== '16'), '18'] } : l));
        const r = verifierAuLivre(faux, [{ page: 117, texte: PAGE_117 }]);
        expect(r.lignes.find(l => l.nom === 'Rat')).toMatchObject({ retrouvee: false, ailleurs: [{ valeur: '18', page: 117 }] });
    });
});
