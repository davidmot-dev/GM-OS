import { describe, it, expect } from 'vitest';
import { remplirDepuisLesFiches, type FicheACataloguer } from './depuisLeCorpus';
import { controlerLeCatalogue, modifierUnObjet } from './catalogue';

/**
 * Le remplissage depuis le corpus — § 203, étape C. Les fiches sont les vraies,
 * celles de Colonial Marines relues contre le livre le 02/11/2026 : un tableau
 * qu'on retouche dans le corpus se voit ici.
 */
const brutes = import.meta.glob('/docs/systems/alien/supplements/colonial-marines/rules/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const LIVRE = 'Colonial Marines Operations Manual';
const fiches: FicheACataloguer[] = Object.entries(brutes).sort(([a], [b]) => a.localeCompare(b))
    .map(([chemin, contenu]) => ({ chemin: chemin.replace('/docs/', ''), contenu, livre: LIVRE }));
const champs = [{ id: 'mobilite', label: 'Mobilité' }, { id: 'endurance', label: 'Endurance' }, { id: 'observation', label: 'Observation' }];

const remplir = () => remplirDepuisLesFiches(undefined, fiches, champs);
const objet = (r: ReturnType<typeof remplir>, debut: string) => r.catalogue.objets.find(o => o.nom.startsWith(debut))!;

describe('remplirDepuisLesFiches — Colonial Marines', () => {
    it('lit les 66 objets des huit fiches d’équipement, sans perdre une ligne', () => {
        const r = remplir();
        expect(fiches).toHaveLength(19); // 18 fiches et l'inventaire
        expect(r.journal.fiches.filter(f => f.objets > 0)).toHaveLength(8);
        expect(r.catalogue.objets).toHaveLength(66);
        expect(r.journal.lignesNonLues).toEqual([]);
        const parFamille = (f: string) => r.catalogue.objets.filter(o => o.famille === f).length;
        expect([parFamille('arme'), parFamille('protection'), parFamille('vehicule'), parFamille('materiel')]).toEqual([26, 5, 23, 12]);
        // Les tables de D66, de terrain ou de spécialités sont nommées, pas lues.
        expect(r.journal.tableauxIgnores.map(t => t.chemin)).toEqual(expect.arrayContaining([
            expect.stringContaining('evenements-de-terrain'), expect.stringContaining('specialites-militaires'),
        ]));
        expect(controlerLeCatalogue(r.catalogue).filter(c => c.gravite === 'erreur')).toEqual([]);
    });

    it('rend les valeurs témoins du livre', () => {
        const r = remplir();
        expect(objet(r, 'Cartouches à mitraille M108')).toMatchObject({ famille: 'arme', categorie: 'Explosifs, mines et armes chimiques', valeurs: { degats: 3 }, poids: '¼', cout: '30 $' });
        expect(objet(r, 'Charge de brèche Armat Type 4')).toMatchObject({ valeurs: { degats: 'Puissance 9' }, cout: '200 $' });
        expect(objet(r, 'Pistolet semi-automatique VP-70MA6')).toMatchObject({
            id: 'pistolet-semi-automatique-vp-70ma6', categorie: 'Pistolets',
            valeurs: { bonus: '+2', degats: 1, portee: 'Moyenne' }, poids: '½', cout: '250 $',
            source: { livre: LIVRE, fiche: 'systems/alien/supplements/colonial-marines/rules/armes-de-poing-pistolets.md' },
        });
        expect(objet(r, 'Bottes de jungle M7')).toMatchObject({ famille: 'materiel', nomOriginal: 'M7 Jungle Boots', cout: '60 $' });
        expect(objet(r, 'Tank lourd Ridgeway M40-E')).toMatchObject({ famille: 'vehicule', categorie: 'Blindés', valeurs: { passagers: 3, maniabilite: '+0', coque: 9, protection: 12 } });
        expect(objet(r, 'Modèle Mantis')).toMatchObject({ categorie: 'Vaisseaux spatiaux', valeurs: { longueur: '44 m', 'cadence-ftl': 14 } });
    });

    it('déclare les colonnes de chaque famille, en nombre quand le tableau en porte', () => {
        const { catalogue } = remplir();
        expect(catalogue.colonnes.arme).toEqual([
            { id: 'bonus', libelle: 'Bonus', nature: 'nombre' },
            { id: 'degats', libelle: 'Dégâts', nature: 'nombre' },
            { id: 'portee', libelle: 'Portée', nature: 'texte' },
        ]);
        expect(catalogue.colonnes.protection?.map(c => c.id)).toEqual(['protection', 'reserve-d-air']);
        expect(catalogue.colonnes.materiel).toBeUndefined();
    });

    it('tire les propriétés courtes des armes et les effets du matériel', () => {
        const r = remplir();
        expect(objet(r, 'Lance-roquettes M5A3').proprietes).toEqual(['Perce-armure', 'Tir unique']);
        expect(objet(r, 'Palmes d’ornithorynque M11').effets).toEqual([{ cible: 'mobilite', valeur: 2, condition: 'sous l’eau', texte: 'Bonus de +2 aux tests de Mobilité sous l’eau' }]);
        expect(objet(r, 'Combinaison de compression offensive CCC5').effets).toEqual([{ cible: 'observation', valeur: -1, texte: 'Malus de -1 aux tests d’Observation' }]);
    });

    it('rattache « compris dans … » à son porteur, et dit celui qu’il ne trouve pas', () => {
        const r = remplir();
        expect(objet(r, 'Combinaison de compression offensive CCC5').contient).toEqual(['canon-a-impulsion-integre-norcomm-ak-104s']);
        expect(objet(r, 'Fusil d’assaut Weyland-Yutani NSG23').contient).toEqual(['incinerateur-amovible-weyland-yutani-id23']);
        // L'armure M3 est au livre de base, pas dans ce supplément.
        expect(r.journal.renvoisNonResolus).toEqual([expect.stringContaining('Casque pare-balles M10')]);
    });

    it('prend la page de la section que l’index du livre a résolue', () => {
        const avecPages = fiches.map(f => (f.chemin.endsWith('armes-de-poing-pistolets.md') ? { ...f, pages: [{ titre: 'ARMES', page: 64 }, { titre: 'PISTOLETS', page: 66 }] } : f));
        const r = remplirDepuisLesFiches(undefined, avecPages, champs);
        expect(objet(r, 'Pistolet semi-automatique VP-70MA6').source?.page).toBe(66);
    });

    it('un objet déjà présent sans page reçoit celle de la fiche ; une page posée ne bouge pas', () => {
        // 07/11/2026, Barbarians : le catalogue forgé d'abord gardait « sans page ».
        const avecPages = fiches.map(f => (f.chemin.endsWith('armes-de-poing-pistolets.md') ? { ...f, pages: [{ titre: 'PISTOLETS', page: 66 }] } : f));
        const premier = remplirDepuisLesFiches(undefined, fiches, champs);
        expect(objet(premier, 'Pistolet semi-automatique VP-70MA6').source?.page).toBeUndefined();
        const second = remplirDepuisLesFiches(premier.catalogue, avecPages, champs);
        expect(objet(second, 'Pistolet semi-automatique VP-70MA6').source).toMatchObject({ livre: LIVRE, page: 66 });
        expect(second.journal.objetsCompletes).toEqual(expect.arrayContaining([{ id: 'pistolet-semi-automatique-vp-70ma6', nom: 'Pistolet semi-automatique VP-70MA6', champs: ['page'] }]));
        const troisieme = remplirDepuisLesFiches(second.catalogue, avecPages, champs);
        expect(troisieme.journal.objetsCompletes).toEqual([]);
    });

    it('ne remplace jamais ce que le meneur a corrigé, et ne double rien au second passage', () => {
        const premier = remplir();
        const corrige = modifierUnObjet(premier.catalogue, 'pistolet-semi-automatique-vp-70ma6', { valeurs: { bonus: '+3', degats: 1 } });
        const second = remplirDepuisLesFiches(corrige, fiches, champs);
        expect(second.journal.objetsAjoutes).toEqual([]);
        expect(second.journal.colonnesAjoutees).toEqual([]);
        expect(second.catalogue.objets).toHaveLength(66);
        expect(objet(second, 'Pistolet semi-automatique VP-70MA6').valeurs).toEqual({ bonus: '+3', degats: 1, portee: 'Moyenne' });
        expect(second.journal.objetsCompletes).toEqual([{ id: 'pistolet-semi-automatique-vp-70ma6', nom: 'Pistolet semi-automatique VP-70MA6', champs: ['portee'] }]);
        expect(second.journal.conserves).toEqual(['Pistolet semi-automatique VP-70MA6 · bonus : catalogue « +3 », fiche « +2 »']);
        expect(second.journal.rattachements).toEqual([]);
        // Le catalogue reçu n'est pas modifié : l'écran peut renoncer.
        expect(corrige.objets.find(o => o.id === 'pistolet-semi-automatique-vp-70ma6')!.valeurs).toEqual({ bonus: '+3', degats: 1 });
    });
});

/**
 * Le livre de base, transcrit depuis le PDF lu en image le 02/11/2026 (décision
 * de David : pas de carnet pour des chiffres). Les identifiants des champs sont
 * ceux de la fiche d'Alien (`docs/systems/alien/fiche/correspondance.json`).
 */
const brutesDeBase = import.meta.glob('/docs/systems/alien/rules/equipement-*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const fichesDeBase: FicheACataloguer[] = Object.entries(brutesDeBase).sort(([a], [b]) => a.localeCompare(b))
    .map(([chemin, contenu]) => ({ chemin: chemin.replace('/docs/', ''), contenu, livre: 'ALIEN, le jeu de rôle' }));
const champsAlien = [
    ['agilite', 'Agilité'], ['esprit', 'Esprit'], ['combat_rapproche', 'Combat rapproché'], ['machines_lourdes', 'Machines lourdes'],
    ['endurance', 'Endurance'], ['combat_a_distance', 'Combat à distance'], ['mobilite', 'Mobilité'], ['pilotage', 'Pilotage'],
    ['commandement', 'Commandement'], ['observation', 'Observation'], ['survie', 'Survie'], ['comtech', 'Comtech'],
    ['soins_medicaux', 'Soins médicaux'], ['manipulation', 'Manipulation'], ['eau', 'Eau'], ['nourriture', 'Nourriture'],
    ['niveau_de_stress', 'Niveau de stress'],
].map(([id, label]) => ({ id, label }));

describe('remplirDepuisLesFiches — livre de base d’Alien', () => {
    const r = remplirDepuisLesFiches(undefined, fichesDeBase, champsAlien);
    const effets = (debut: string) => objet(r, debut).effets?.map(e => [e.cible, e.valeur, e.condition ?? '']);

    it('lit les 89 objets des quatre fiches, chaque tableau à sa page', () => {
        expect(fichesDeBase).toHaveLength(4);
        expect(r.journal.lignesNonLues).toEqual([]);
        expect(r.journal.tableauxIgnores).toEqual([]);
        const parFamille = (f: string) => r.catalogue.objets.filter(o => o.famille === f).length;
        expect([parFamille('arme'), parFamille('protection'), parFamille('vehicule'), parFamille('materiel')]).toEqual([28, 6, 6, 49]);
        expect(objet(r, 'Fusil à impulsion Armat M41A')).toMatchObject({
            categorie: 'Fusils', valeurs: { bonus: '+1', degats: 2, portee: 'Longue' }, cout: '1 200 $',
            proprietes: ['Lance-grenades intégré', 'Mode auto', 'Perce-armure'], source: { page: 120 },
        });
        // Le tableau des armes lourdes est p. 124, la section qui les décrit p. 125 : la page du tableau prime.
        expect(objet(r, 'Smartgun M56A2').source?.page).toBe(124);
        expect(objet(r, 'Armure personnelle M3')).toMatchObject({ famille: 'protection', valeurs: { protection: 6 }, cout: '1 200 $' });
        expect(objet(r, 'MU/TH/UR 9000').valeurs).toEqual({ competences: 'Comtech 10, Pilotage 8, Observation 10, Combat à distance 9' });
        expect(controlerLeCatalogue(r.catalogue).filter(c => c.gravite === 'erreur')).toEqual([]);
    });

    it('rejoint les identifiants des compétences de la fiche, sous toutes les formes du livre', () => {
        expect(effets('Jumelles')).toEqual([['observation', 2, '']]);
        expect(effets('HoloTab')).toEqual([['commandement', 2, ''], ['observation', 2, '']]);
        expect(effets('Élévateur P-5000')).toEqual([['machines_lourdes', 3, ''], ['combat_rapproche', 3, '']]);
        expect(effets('Nécessaire chirurgical')).toEqual([['soins_medicaux', 1, 'pour éviter la mort']]);
        expect(effets('Alcool fort')).toEqual([['niveau_de_stress', -1, ''], ['esprit', -1, 'par verre']]);
        expect(effets('Boisson protéinée')).toEqual([['eau', 1, ''], ['nourriture', 1, '']]);
        expect(effets('Combinaison de compression IRC Mk.50')).toEqual([['agilite', -1, '']]);
        // Un nombre sans signe est la compétence de l'appareil, pas un effet.
        expect(objet(r, 'Autodoc').effets).toBeUndefined();
        expect(objet(r, 'Combinaison de survie Eco Tous Mondes').effets).toBeUndefined();
    });

    it('rejoint les compétences du gabarit de David, préfixées de leur attribut (« Es_Observation »)', () => {
        // Vu par David le 02/11 : « je ne vois pas les jumelles pour le bonus ». Elles étaient entrées sans effet.
        const prefixes = [
            { id: 'observation', label: 'Es_Observation' }, { id: 'machines_lourdes', label: 'Fo_Machines lourdes' },
            { id: 'soins_medicaux', label: 'Em_Soins médicaux' }, { id: 'niveau_de_stress', label: 'Niveau de Stress' },
        ];
        const p = remplirDepuisLesFiches(undefined, fichesDeBase, prefixes);
        const de = (debut: string) => objet(p, debut).effets?.map(e => [e.cible, e.valeur]);
        expect(de('Jumelles')).toEqual([['observation', 2]]);
        expect(de('Cric d’entretien')).toEqual([['machines_lourdes', 1]]);
        expect(de('Médikit personnel')).toEqual([['soins_medicaux', 2]]);
        expect(de('Café')).toEqual([['niveau_de_stress', 1]]);
        // « sous l'eau » est une condition, pas la Réserve d'Eau (audit du 02/11).
        const avecEau = remplirDepuisLesFiches(undefined, fiches, [...prefixes, { id: 'mobilite', label: 'Ag_Mobilité' }, { id: 'eau', label: 'Eau' }]);
        expect(objet(avecEau, 'Palmes d’ornithorynque M11').effets).toEqual([{ cible: 'mobilite', valeur: 2, condition: 'sous l’eau', texte: 'Bonus de +2 aux tests de Mobilité sous l’eau' }]);
        expect(de('Boisson protéinée')).toBeUndefined(); // pas de champ Eau ni Nourriture dans cette liste
        // Les objets d'un catalogue rempli avant la correction reçoivent leurs effets au remplissage suivant.
        const ancien = remplirDepuisLesFiches(undefined, fichesDeBase, []).catalogue;
        expect(ancien.objets.find(o => o.nom === 'Jumelles')?.effets).toBeUndefined();
        const repris = remplirDepuisLesFiches(ancien, fichesDeBase, prefixes);
        expect(repris.journal.objetsCompletes).toEqual(expect.arrayContaining([expect.objectContaining({ nom: 'Jumelles', champs: ['effets'] })]));
        expect(repris.catalogue.objets.find(o => o.nom === 'Jumelles')?.effets?.[0]).toMatchObject({ cible: 'observation', valeur: 2 });
    });

    it('lu avec Colonial Marines : le casque M10 trouve l’armure M3, le Cheyenne n’est pas doublé', () => {
        const ensemble = remplirDepuisLesFiches(undefined, [...fichesDeBase, ...fiches], champsAlien);
        expect(ensemble.journal.renvoisNonResolus).toEqual([]);
        expect(ensemble.journal.rattachements).toContain('Armure personnelle M3 emporte Casque pare-balles M10');
        expect(ensemble.catalogue.objets.filter(o => o.nom.startsWith('Convoyeur aérien UD-4L Cheyenne'))).toHaveLength(1);
        expect(ensemble.journal.conserves).toContain('Convoyeur aérien UD-4L Cheyenne à décollage vertical · categorie : catalogue « Véhicules », fiche « Appareils d\'assaut »');
        expect(ensemble.catalogue.objets).toHaveLength(89 + 66 - 1);
    });
});

describe('F5 — les familles telles que le livre les imprime (06/11/2026)', () => {
    const lire = (tableau: string) => remplirDepuisLesFiches(undefined, [{ chemin: 'systems/coc/rules/x.md', livre: 'COC', contenu: tableau }]);

    it('« Armes à distance légères », « Explosif », « Armures » ouvrent un tableau d’équipement', () => {
        const { catalogue } = lire([
            '### Tableau des Armes à distance (p. 94)', '', '| Armes à distance légères | Portée | DM |', '|:--- |:--- |:--- |', '| Taser | Contact | 1d4 |', '',
            '### Tableau des Explosifs (p. 95)', '', '| Explosif | DM |', '|:--- |:--- |', '| Mine | 4d6 |', '',
            '### Tableau des Armures (p. 96)', '', '| Armures | RD |', '|:--- |:--- |', '| Gilet souple | 4 |',
        ].join('\n'));
        expect(catalogue.objets.map(o => [o.nom, o.famille, o.source?.page])).toEqual([
            ['Taser', 'arme', 94], ['Mine', 'arme', 95], ['Gilet souple', 'protection', 96],
        ]);
    });

    it('« Prix des armes » ne commence pas par une famille : il est écarté', () => {
        const { catalogue, journal } = lire('### Prix (p. 53)\n\n| Prix des armes | 2025 |\n|:--- |:--- |\n| Machette | 30 |\n');
        expect(catalogue.objets).toEqual([]);
        expect(journal.tableauxIgnores).toHaveLength(1);
    });
});

/*
 * Cthulhu Hack, 07/11/2026 — David : « j'ai essayé de forger les équipements… et cela n'a pas
 * fonctionné ». Extrait de la fiche forgée : la séparation à un seul tiret, et un tableau d'« Objet »
 * générique dont la colonne « Type » dit la famille de chaque ligne.
 */
describe('Cthulhu Hack — un tiret, et la famille lue dans la colonne « Type »', () => {
    const FICHE_CH = `### Tableau des Exemple de matériel
| Objet | Type | Dé de Matériel | Portée | Particularités |
|:- |:- |:- |:- |:- |
| **Revolver** | Arme à distance | d6 | Proche | Dissimulable |
| **Machette** | Arme de contact / Outil | d10 | – | Peut servir d'outil en jungle. |
| **Grenade explosive** | Explosifs | – | 3 x Force mètres | + 3 niveaux de dégâts |
| **Armure lourde** | Protection | d8 | – | 3 Points d'Armure. |
| **Lampe-torche** | Accessoire | d8 | – | Éclaire jusqu'à Loin. |`;
    const { catalogue, journal } = remplirDepuisLesFiches(undefined, [{ chemin: 'objets-et-equipement.md', contenu: FICHE_CH, livre: 'Cthulhu Hack' }]);
    const parNom = (nom: string) => catalogue.objets.find(o => o.nom === nom)!;

    it('le tableau à un tiret est lu : cinq objets, aucune ligne perdue', () => {
        expect(catalogue.objets).toHaveLength(5);
        expect(journal.lignesNonLues).toEqual([]);
    });

    it('chaque ligne prend la famille de son type, et son type pour catégorie', () => {
        expect(parNom('Revolver')).toMatchObject({ famille: 'arme', categorie: 'Arme à distance' });
        expect(parNom('Machette').famille).toBe('arme');
        expect(parNom('Grenade explosive').famille).toBe('arme');
        expect(parNom('Armure lourde')).toMatchObject({ famille: 'protection', categorie: 'Protection' });
        // Un type qui ne nomme aucune famille garde celle du tableau.
        expect(parNom('Lampe-torche')).toMatchObject({ famille: 'materiel', categorie: 'Accessoire' });
    });

    it('chaque famille ne reçoit que les colonnes qu’elle remplit ; « Particularités » va à la description', () => {
        // Vu par David le 07/11 : sept colonnes chez les armures, des textes qui débordaient.
        expect(catalogue.colonnes.arme!.map(c => c.libelle)).toEqual(['Dé de Matériel', 'Portée']);
        expect(catalogue.colonnes.protection!.map(c => c.libelle)).toEqual(['Dé de Matériel']);
        expect(catalogue.colonnes.materiel!.map(c => c.libelle)).toEqual(['Dé de Matériel']);
        const deMateriel = catalogue.colonnes.arme!.find(c => c.libelle === 'Dé de Matériel')!.id;
        expect(parNom('Revolver').valeurs[deMateriel]).toBe('d6');
        expect(parNom('Armure lourde').description).toBe("3 Points d'Armure.");
    });
});
