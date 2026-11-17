// Le bestiaire et le catalogue de Vampire V5 — 17/11/2026, pilote 2.2.0.
// Demande de David : « tu peux vérifier le drivers Vampire avec le livre, vérifier l'équipement et le
// bestiaire ? », puis « gm-os est fermé » (les corrections proposées). Livre de base français, pages
// IMPRIMÉES (PDF − 4), lues en image le 17/11.
//
// Le bestiaire forgé par David (23 créatures, chiffres CONFORMES au livre p. 370-377) ne remplissait
// aucun champ de la fiche : une créature invoquée entrait au combat avec une fiche vide et la santé par
// défaut (10 / 10 pour un lieutenant de police, Santé 6 au livre). Il était aussi rangé de trois façons
// (colonnes, texte « Compétences », texte « Attributs »), sans page ni catégorie. On le RESTRUCTURE sans
// changer un chiffre :
//  - mortels et animaux (« antagonistes simplifiés », p. 370) : des groupements NOMMÉS, Physique,
//    Social, Mental puis les exceptionnels, chacun complet et lancé seul (« Armes à feu 5 ») ;
//  - vampires et créatures d'épouvante : les neuf attributs, les compétences et les disciplines dans les
//    champs du personnage joueur, l'Humanité et la Puissance du sang ;
//  - la Santé et la Volonté dans leurs champs, une catégorie et la page de chaque créature ;
//  - la règle commune des créatures d'épouvante (test d'Exaltation raté, p. 376) et le sang de loup-garou.
//
// Le catalogue forgé (9 armes, 4 armures, conformes à la table p. 304) citait la p. 303 pour les armes :
// leur table est p. 304. Le chapitre « Matériel » (p. 378-381) manquait : on l'ajoute.
import assert from 'node:assert/strict';

const sansAccents = t => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’']/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * La section de la fiche qui porte les groupements des antagonistes simplifiés (p. 370) : neuf
 * groupements NOMMÉS, chacun complet et lancé seul. Les trois premiers sont Physique, Social et Mental,
 * les suivants les groupements exceptionnels (« Armes à feu 5 »). Un groupement sans nom reste hors du
 * menu du jet (règle `libelleSur`, comme une discipline sans nom) : rien n'apparaît chez un joueur.
 */
export const NOMBRE_DE_GROUPEMENTS = 9;
export function sectionDesAntagonistes() {
    return {
        id: 'antagoniste', label: 'Antagoniste simplifié (p. 370)', fields: Array.from({ length: NOMBRE_DE_GROUPEMENTS }, (_, i) => [
            { id: `groupement_${i + 1}_nom`, label: `Groupement ${i + 1} — nom`, type: 'text', defaultValue: '' },
            { id: `groupement_${i + 1}`, label: `Groupement ${i + 1}`, type: 'number', defaultValue: 0, max: 15, libelleSur: `groupement_${i + 1}_nom` },
        ]).flat(),
    };
}

/** Les pages et catégories du livre, créature par créature (p. 371-377). */
const PAGES = {
    'lieutenant-de-police': [371, 'Mortels'], truand: [371, 'Mortels'], ecclesiastiques: [371, 'Mortels'], 'chasseur-de-la-foi': [371, 'Mortels'],
    'detective-inquisiteur': [372, 'Mortels'], 'inquisiteur-delta': [372, 'Mortels'], goule: [372, 'Mortels'],
    'chauve-souris-grande-taille': [373, 'Animaux'], cheval: [373, 'Animaux'], 'chien-de-garde': [373, 'Animaux'], loup: [373, 'Animaux'],
    'oiseau-de-proie': [373, 'Animaux'], ours: [373, 'Animaux'], rat: [373, 'Animaux'],
    'harpie-de-l-elysium': [374, 'Vampires'], 'revolutionnaire-anarch': [374, 'Vampires'], 'eveque-nodiste': [375, 'Vampires'],
    'sherif-sanguinaire': [375, 'Vampires'], 'sans-ame': [375, 'Vampires'],
    'loup-garou': [376, 'Créatures d’épouvante'], mage: [377, 'Créatures d’épouvante'], fees: [377, 'Créatures d’épouvante'], spectre: [377, 'Créatures d’épouvante'],
};

/** « Armes à feu 5, Bagarre 5 » → [['Armes à feu', 5], …] ; « un domaine d’expertise à 9 » compris. */
function lireLesPaires(texte) {
    return String(texte ?? '').split(/[,;]/).map(s => s.trim()).filter(Boolean).map(s => {
        const expertise = s.match(/^un (domaine d.expertise) à (\d+)$/i);
        if (expertise) return ['Domaine d’expertise', Number(expertise[2])];
        const m = s.match(/^(.+?)\s+(\d+)$/);
        assert.ok(m, `paire illisible : « ${s} »`);
        return [m[1].trim(), Number(m[2])];
    });
}

/**
 * Restructure le bestiaire forgé. `fiche` donne les identifiants : attributs, compétences, disciplines.
 * Rend un bestiaire dont chaque colonne remplit un champ de la fiche.
 */
export function restructurerLeBestiaire(forge, { ATTRIBUTS, COMPETENCES }) {
    assert.equal(forge?.creatures?.length, 23, 'le bestiaire forgé : 23 créatures');
    const competences = Object.values(COMPETENCES).flat();
    const parNom = new Map([
        ...ATTRIBUTS.map(([id, nom]) => [sansAccents(nom), id]),
        ...competences.map(([id, nom]) => [sansAccents(nom), id]),
        // Les formes du livre qui diffèrent du nom de la fiche (« Artisanats », « Finance », « Science »).
        ['artisanats', 'artisanat'], ['finance', 'finances'], ['science', 'sciences'],
    ]);
    const idDuTrait = nom => parNom.get(sansAccents(nom));
    const libelleDe = c => c.libelle;

    const colonnes = [
        { id: 'sante', libelle: 'Santé', nature: 'nombre', champ: 'sante' },
        { id: 'volonte', libelle: 'Volonté', nature: 'nombre', champ: 'volonte' },
        ...Array.from({ length: NOMBRE_DE_GROUPEMENTS }, (_, i) => [
            { id: `groupement_${i + 1}_nom`, libelle: `Groupement ${i + 1}`, nature: 'texte', champ: `groupement_${i + 1}_nom` },
            { id: `groupement_${i + 1}`, libelle: `Dés ${i + 1}`, nature: 'nombre', champ: `groupement_${i + 1}` },
        ]).flat(),
        ...ATTRIBUTS.map(([id, nom]) => ({ id, libelle: nom, nature: 'nombre', champ: id })),
        ...competences.map(([id, nom]) => ({ id, libelle: nom, nature: 'nombre', champ: id })),
        ...Array.from({ length: 6 }, (_, i) => [
            { id: `discipline_${i + 1}_nom`, libelle: `Discipline ${i + 1}`, nature: 'texte', champ: `discipline_${i + 1}_nom` },
            { id: `discipline_${i + 1}`, libelle: `Niveau ${i + 1}`, nature: 'nombre', champ: `discipline_${i + 1}` },
        ]).flat(),
        { id: 'humanite', libelle: 'Humanité', nature: 'nombre', champ: 'humanite' },
        { id: 'puissance_du_sang', libelle: 'Puissance du sang', nature: 'nombre', champ: 'puissance_du_sang' },
    ];
    const colonneDe = new Map(forge.colonnes.map(c => [c.id, c]));

    const creatures = forge.creatures.map(cr => {
        const [page, categorie] = PAGES[cr.id] ?? assert.fail(`page inconnue : ${cr.id}`);
        const v = cr.valeurs;
        const valeurs = { sante: v.sante, volonte: v.volonte };
        let particularites = [...(cr.particularites ?? [])];
        const nommee = categorie === 'Vampires' || categorie === 'Créatures d’épouvante';
        if (!nommee) {
            // Groupements standards : colonnes forgées, ou « Physique 7, Social 1, Mental 1 » (Ours, Rat).
            const standards = v.attributs ? Object.fromEntries(lireLesPaires(v.attributs).map(([n, x]) => [sansAccents(n), x])) : v;
            // Groupements exceptionnels : colonnes forgées (« Armes à feu » 5) ou texte « Compétences ».
            const paires = [
                ...forge.colonnes.filter(c => !['physique', 'social', 'mental', 'sante', 'volonte', 'competences', 'attributs'].includes(c.id) && v[c.id] !== undefined)
                    .map(c => [libelleDe(colonneDe.get(c.id)), Number(v[c.id])]),
                ...lireLesPaires(v.competences),
            ];
            const groupements = [['Physique', standards.physique], ['Social', standards.social], ['Mental', standards.mental], ...paires];
            assert.ok(groupements.every(([, x]) => Number.isInteger(x)), `${cr.nom} : groupements lisibles`);
            assert.ok(groupements.length <= NOMBRE_DE_GROUPEMENTS, `${cr.nom} : ${groupements.length} groupements`);
            groupements.forEach(([nom, des], i) => Object.assign(valeurs, { [`groupement_${i + 1}_nom`]: nom, [`groupement_${i + 1}`]: des }));
        } else {
            for (const [nom, x] of lireLesPaires(v.attributs)) {
                const id = idDuTrait(nom);
                assert.ok(id && ATTRIBUTS.some(a => a[0] === id), `${cr.nom} : attribut « ${nom} »`);
                valeurs[id] = x;
            }
            for (const [nom, x] of lireLesPaires(v.competences)) {
                const id = idDuTrait(nom);
                assert.ok(id && competences.some(c => c[0] === id), `${cr.nom} : compétence « ${nom} »`);
                valeurs[id] = x;
            }
            // « Disciplines: Auspex 3, … », « Humanité 6 », « Puissance du sang 3 » : des champs, plus des notes.
            particularites = particularites.filter(p => {
                const d = p.match(/^Disciplines\s*:\s*(.+)$/i);
                if (d) { lireLesPaires(d[1]).forEach(([nom, x], i) => Object.assign(valeurs, { [`discipline_${i + 1}_nom`]: nom, [`discipline_${i + 1}`]: x })); return false; }
                const h = p.match(/^Humanité (\d+)$/i);
                if (h) { valeurs.humanite = Number(h[1]); return false; }
                const s = p.match(/^Puissance du sang (\d+)$/i);
                if (s) { valeurs.puissance_du_sang = Number(s[1]); return false; }
                return true;
            });
        }
        if (categorie === 'Créatures d’épouvante') {
            particularites.push('Test d’Exaltation raté : 1 dégât superficiel à la Volonté ou à la Santé, au lieu de gagner de la Soif ; ses pouvoirs se jouent comme des disciplines (p. 376)');
        }
        if (cr.id === 'loup-garou') {
            particularites.push('Son sang étanche deux fois la Soif (une gorgée en apaise 2) ; chaque point ainsi étanché ajoute +1 à la difficulté des jets contre la frénésie tant qu’il reste dans l’organisme ; Résonances animale et bilieuse, souvent intenses (encadré p. 376)');
        }
        for (const [cle, x] of Object.entries(valeurs)) if (x === undefined || x === '' || Number.isNaN(x)) delete valeurs[cle];
        return { ...cr, categorie, valeurs, particularites, source: { ...cr.source, page } };
    });
    return { ...forge, colonnes, creatures };
}

/** Le catalogue forgé, sa page corrigée, et le chapitre « Matériel » (p. 378-381). */
export function completerLeCatalogue(forge) {
    assert.equal(forge?.objets?.length, 13, 'le catalogue forgé : 9 armes et 4 armures');
    const source = (page, fiche = 'systems/vampire/rules/equipement-et-materiel.md') => ({ livre: 'Vampire: la Mascarade', page, fiche });
    const objets = forge.objets.map(o => (o.famille === 'arme' && o.source?.page === 303 ? { ...o, source: { ...o.source, page: 304 } } : o));
    const arme = (id, nom, degats, page, description, categorie = 'Armes conventionnelles') =>
        ({ id, famille: 'arme', nom, valeurs: degats === undefined ? {} : { 'valeur-de-degats': degats }, categorie, source: source(page), description });
    const materiel = (id, nom, page, description, categorie) => ({ id, famille: 'materiel', nom, valeurs: {}, categorie, source: source(page), description });
    const ajouts = [
        arme('armes-dissimulees', 'Armes dissimulées (canne-épée, stylo-pistolet .22, rasoir)', undefined, 379,
            'Fabrication : Intelligence + spécialité d’Artisanat. −1 dé au groupement d’attaque, sauf victoire critique à l’Artisanat du concepteur. La repérer : Astuce + Vigilance, difficulté 1 + la Furtivité du porteur ou l’Artisanat du créateur, la plus élevée.'),
        arme('armes-incendiaires-artisanales', 'Armes incendiaires artisanales', undefined, 379,
            '−1 dé de dégâts ; sur un échec total au jet d’attaque, elles enflamment les mains et le visage de l’utilisateur : 3 points de dégâts aggravés. Les munitions traçantes ordinaires ne causent pas de dégâts aggravés significatifs.'),
        arme('munitions-souffle-du-dragon', 'Munitions Souffle-du-Dragon (fusil à pompe)', '+0', 380,
            'Aucun bonus aux dégâts, mais dégâts aggravés aux vampires ; incendient ce qu’elles touchent : 1 point de dégâts aggravés par tour jusqu’à extinction. Munitions d’usine : un échec total enraye l’arme. Portée effective d’environ 15 mètres.'),
        arme('munitions-raufoss', 'Munitions Raufoss (12,7 mm)', '+5', 380, 'Explosives et incendiaires : ignorent toutes les armures ; dégâts aggravés.'),
        arme('hafla-dm34', 'Hafla DM34 (handflammpatrone)', undefined, 380,
            'Projectile de phosphore à environ 80 mètres ; difficulté d’au moins 3. En cas de victoire : 3 niveaux de dégâts aggravés immédiatement, puis 3 à chaque tour. S’éteint par immersion (suivie du retrait du matériau incendiaire), étouffement dans le sable ou procédure semblable.'),
        arme('lance-flammes', 'Lance-flammes portatif', '+0', 380,
            'Dégâts aggravés (+0) à l’impact, puis à chaque tour ; incendie tout sur son passage. S’éteint par immersion (suivie du retrait du matériau incendiaire), étouffement dans le sable ou procédure semblable. Portée limitée.'),
        arme('cocktail-molotov', 'Cocktail Molotov', undefined, 380,
            'Toucher : difficulté 4. 2 niveaux de dégâts aggravés à chaque tour ; un jet réussi de Sang-froid + Survie (difficulté 3) suffit le plus souvent à se débarrasser des substances enflammées.'),
        arme('fusil-a-filet', 'Fusil à filet', undefined, 380,
            'Ses dégâts réduisent la Dextérité de la cible, pas sa Santé, divisés par deux comme des superficiels. À Dextérité 0 : immobilisé, sans pouvoir attaquer. Se dégager : une action, Force + Athlétisme contre un groupement égal aux réussites cumulées des attaques au filet. Très inflammable.'),
        arme('lance-pieu', 'Lance-pieu (lance-grenades)', '+0', 381, 'Projette des pieux de bois quasiment à bout touchant : dégâts semblables à ceux d’un pieu ordinaire, +0 (voir le pieu, p. 304).'),
        materiel('sac-pare-soleil', 'Sac pare-soleil', 378, 'Sac de couchage aux matériaux épais résistant au soleil, fermeture à glissière intérieure : couvre tout le corps pour dormir hors d’un refuge.', 'Équipement'),
        materiel('chaoscope', 'Chaoscope', 378, 'Détecte les perturbations électromagnétiques des vampires, goules, fantômes et démons. Opérateur : Intelligence + Vigilance (difficulté 6), −1 pour chaque vampire du même clan ou de la même génération qu’il a déjà détecté ainsi. Les Couleurs de la vie n’y changent rien. Installé fixe ou à bord de camions.', 'Équipement'),
        materiel('xscope', 'XScope', 378, 'Repère à distance un individu mort ou vivant (pouls, respiration, température). Les Couleurs de la vie le trompent. Seconde génération (p. 379) : l’éluder demande les Couleurs de la vie et Sang-froid + Vigueur, difficulté 5 + la Résolution de l’opérateur.', 'Équipement'),
        ...[
            ['monnaies-anciennes', 'Monnaies anciennes', 'Bénies par une sainte personne, elles brûlent tout mort-vivant qu’elles touchent : dégâts aggravés ; une monnaie maudite inflige les mêmes aux vivants.'],
            ['pierres-gravees', 'Pierres gravées', 'Trois pierres gravées des noms de la Deuxième Génération, posées sur le lieu de repos d’un vampire : son âme passerait dans le corps de qui les y a mises.'],
            ['sang-preserve', 'Sang préservé', 'Vitae conservée par Sorcellerie du sang, souvent mêlée à un breuvage comme le vin : chère, peu désaltérante, appréciée en société.'],
            ['terre-de-sepulcre', 'Terre de sépulcre', 'Terre d’une tombe où une dépouille est revenue à la vie : qui dort près de quelques poignées sort du sommeil sans plus de soif qu’au coucher, une semaine environ.'],
            ['urne-des-ancetres', 'Urne des ancêtres', 'Les cendres de trois ancêtres directs dans une même urne, confiée à une goule : dès qu’elle (ou un humain de confiance) la touche, le vampire sort de torpeur, quel que soit son état.'],
        ].map(([id, nom, description]) => materiel(id, nom, 381, `${description} Mécanique laissée au conteur (p. 381).`, 'Équipement surnaturel')),
    ];
    for (const a of ajouts) assert.ok(!objets.some(o => o.id === a.id), `objet en double : ${a.id}`);
    return { ...forge, objets: [...objets, ...ajouts] };
}
