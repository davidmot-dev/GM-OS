import { describe, it, expect } from 'vitest';
import {
  GROUPES,
  blocDuVocabulaire,
  promptDuGroupe,
  vocabulaireAcquis,
  type FicheDuCorpus,
} from './GroupesDeChamps';

/**
 * Ce que ces tests protègent : **un groupe ne désigne que des identifiants qui
 * existent**.
 *
 * Le défaut, relevé sur la première dérivation de Dune du 2026-08-12, et il
 * était total — *aucune* référence croisée n'a abouti :
 *
 * - `jet.seuil[0].sectionId` valait « les compétences » ;
 * - `combat.tacheDeDefaite.sectionDuSeuil` valait « Attaques réussies » ;
 * - `statsToTrack[0].fieldId` valait « determination », absent de la fiche.
 *
 * Deux causes, distinctes. **La première est un ordre** : cinq groupes
 * désignent des sections, des champs et des réserves que seuls `fiche` et
 * `ressources` inventent, et les huit étaient forgés dans l'ignorance les uns
 * des autres. **La seconde est un mot** : « section » désigne à la fois une
 * section de la fiche de personnage et un titre de chapitre du livre — que les
 * fiches v3 citent en toutes lettres, et c'est voulu, puisque c'est ce qui
 * permet de résoudre les pages. Le modèle recopiait le seul sens qu'il avait
 * sous les yeux.
 */

const fiches: FicheDuCorpus[] = [
  { sujet: 'Résolution des jets', contenu: 'Chaque dé sous le seuil est une réussite (section « Les compétences »).' },
  { sujet: 'Composition de la fiche de personnage', contenu: 'Cinq compétences, cinq principes.' },
];

const acquis = vocabulaireAcquis({
  template: {
    sections: [
      { id: 'competences', label: 'Compétences', fields: [{ id: 'combat', label: 'Combat', type: 'number', defaultValue: 4 }] },
      { id: 'jauges', label: 'Jauges', fields: [{ id: 'determination', label: 'Détermination', type: 'gauge', defaultValue: 0 }] },
    ],
  },
  driver: {
    ressourcesDeTable: [{ id: 'impulsion', label: 'Impulsion', proprietaire: 'joueurs', depart: 0, min: 0 }],
  },
});

describe('l\'ordre des groupes suit leurs dépendances', () => {
  it('la fiche et les réserves sont forgées avant ceux qui les désignent', () => {
    const rang = (id: string) => GROUPES.findIndex(g => g.id === id);
    for (const dependant of GROUPES.filter(g => g.dependDuVocabulaire)) {
      expect(rang(dependant.id), `« ${dependant.id} » passe avant la fiche`).toBeGreaterThan(rang('fiche'));
      expect(rang(dependant.id), `« ${dependant.id} » passe avant les réserves`).toBeGreaterThan(rang('ressources'));
    }
  });

  it('les groupes qui désignent des identifiants sont bien marqués', () => {
    // Si l'un d'eux perdait sa marque, il repartirait inventer en silence.
    expect(GROUPES.filter(g => g.dependDuVocabulaire).map(g => g.id).sort())
      .toEqual(['defaite', 'initiative', 'jauges', 'jet']);
  });

  it('la fiche prévoit une section pour les jauges suivies en combat', () => {
    /**
     * Sans cette consigne, le gabarit dérivé de Dune a porté les compétences et
     * un rôle, mais **aucune Détermination** — et les trois groupes qui la
     * désignaient ne pouvaient plus aboutir.
     */
    const fiche = GROUPES.find(g => g.id === 'fiche')!;
    expect(fiche.cible).toMatch(/jauges individuelles/i);
    expect(fiche.exemple).toContain('determination');
  });
});

describe('le bloc de vocabulaire', () => {
  it('énumère les sections, leurs champs et les réserves', () => {
    const bloc = blocDuVocabulaire(acquis);
    expect(bloc).toContain('section "competences" (Compétences) : "combat" (Combat)');
    expect(bloc).toContain('"determination" (Détermination)');
    expect(bloc).toContain('"impulsion" (Impulsion)');
  });

  it('interdit nommément de recopier un titre de chapitre du livre', () => {
    expect(blocDuVocabulaire(acquis)).toContain('titres de chapitre du LIVRE');
  });

  it('quand rien n\'est disponible, il demande d\'omettre plutôt que d\'inventer', () => {
    // Le cas se produit dès que le groupe `fiche` échoue : les suivants ne
    // doivent pas combler le vide, ils doivent le laisser voir.
    const bloc = blocDuVocabulaire({ sections: [], ressources: [] });
    expect(bloc).toContain('OMETS');
    expect(bloc).not.toContain('IDENTIFIANTS DISPONIBLES —');
  });
});

describe('l\'invite d\'un groupe', () => {
  it('porte le vocabulaire quand le groupe en dépend', () => {
    const jet = GROUPES.find(g => g.id === 'jet')!;
    expect(promptDuGroupe(jet, fiches, { vocabulaire: acquis })).toContain('IDENTIFIANTS DISPONIBLES');
  });

  it('ne le porte pas quand le groupe n\'y touche pas', () => {
    // Cent cinquante tokens de contrainte inutile dans un budget qui compte.
    const portees = GROUPES.find(g => g.id === 'portees')!;
    expect(promptDuGroupe(portees, fiches, { vocabulaire: acquis })).not.toContain('IDENTIFIANTS DISPONIBLES');
  });

  it('reste utilisable sans vocabulaire du tout', () => {
    const jet = GROUPES.find(g => g.id === 'jet')!;
    expect(promptDuGroupe(jet, fiches)).toContain('TÂCHE');
  });

  it('ancre le nom du jeu sur le dossier du corpus — la seule source qu\'il ait', () => {
    /**
     * **Aucune fiche ne dit comment le jeu s'appelle.** Elles décrivent des
     * mécaniques, et le frontmatter qui porte `systeme: alien` est retiré avant
     * l'envoi. Dérivée d'Alien le 2026-08-12, la Forge a donc nommé le pilote
     * « Identité et ambiance » — le titre de notre propre sujet, faute d'autre
     * chose à recopier.
     */
    const identite = GROUPES.find(g => g.id === 'identite')!;
    const invite = promptDuGroupe(identite, fiches, { corpus: 'alien' });
    expect(invite).toContain('« alien »');
    expect(invite).toContain("Jamais le");
  });

  it('n\'ancre que le groupe qui nomme le jeu', () => {
    const jet = GROUPES.find(g => g.id === 'jet')!;
    expect(promptDuGroupe(jet, fiches, { corpus: 'alien' })).not.toContain('ANCRAGE');
  });
});

describe('les valeurs que le moteur impose', () => {
  it('le groupe du jet énumère les logiques et les deux sens', () => {
    /**
     * Dérivée d'Alien, la Forge a rendu `sens: "sup_ou_egal"` — faux d'un
     * caractère. Le moteur n'accepte que deux valeurs, et le modèle ne pouvait
     * pas les deviner : on ne les lui avait jamais dites.
     */
    const jet = GROUPES.find(g => g.id === 'jet')!;
    expect(jet.cible).toContain('count-success');
    expect(jet.cible).toContain('"sous-ou-egal"');
    expect(jet.cible).toContain('"superieur-ou-egal"');
  });
});

/**
 * Ce que ces tests protègent : **les deux exigences qu'on ne rattrape pas
 * ensuite restent en tête de la cible du groupe `jet`**.
 *
 * Le 2026-08-16, j'y ai inséré au milieu les mises en garde sur `2d20` et
 * `d100-low`. La dérivation suivante a corrigé le moteur — et rendu `jet.seuil`
 * VIDE, là où la précédente donnait au moins une entrée. *Une consigne noyée est
 * une consigne perdue.*
 *
 * Ces deux-là ne se rattrapent pas à la revue comme une énumération : un seuil
 * absent, c'est un jeu qu'on ne peut pas lancer, et un sens inversé ne se voit
 * jamais en séance.
 */
describe('la cible du groupe « jet »', () => {
    const jet = GROUPES.find(g => g.id === 'jet')!;

    it('nomme le seuil et le sens avant les énumérations', () => {
        const rangSeuil = jet.cible.indexOf('"jet.seuil"');
        const rangSens = jet.cible.indexOf('"jet.sens"');
        /*
          **L'ancre nomme le champ, et pas seulement la tournure.** Elle valait
          « vaut EXACTEMENT », qui est la formule de TOUTE valeur imposée : le
          jour où une exigence en a porté une — le choix de la mécanique de
          cible, le 2026-08-22 —, le test a désigné cette exigence-là comme
          « les énumérations » et s'est mis à mesurer l'inverse de ce qu'il
          protège. *Un repère trop court finit par désigner autre chose.*
        */
        const rangEnums = jet.cible.indexOf('"dice.logic" vaut EXACTEMENT');

        expect(rangSeuil).toBeGreaterThan(-1);
        expect(rangSens).toBeGreaterThan(-1);
        expect(rangEnums, 'les valeurs imposées de "dice" sont bien là').toBeGreaterThan(-1);
        expect(rangSeuil, 'le seuil passe avant les énumérations').toBeLessThan(rangEnums);
        expect(rangSens, 'le sens passe avant les énumérations').toBeLessThan(rangEnums);
    });

    /**
     * **La fourche passe avant tout le reste, et c'est la leçon du 2026-08-21.**
     *
     * Additionner et croiser sur une table ne se rattrapent pas l'un l'autre :
     * un jeu en pourcentage rempli en « seuil » rend une cible **cinq fois trop
     * basse**, et rien ne le dit. *Ce qui décide du COMPTE doit s'énoncer avant
     * ce qui décide du CONTENU* — ici, avant même de dire comment remplir le
     * seuil, il faut savoir s'il y en a un.
     */
    it('demande COMMENT le jet se résout AVANT de remplir le seuil', () => {
        const rangFourche = jet.cible.indexOf('COMMENT LE JET SE RÉSOUT-IL ?');
        const rangSeuil = jet.cible.indexOf('"jet.seuil"');

        expect(rangFourche).toBeGreaterThan(-1);
        expect(rangFourche, 'la fourche ouvre la cible').toBeLessThan(rangSeuil);
    });

    /**
     * **La fourche a TROIS voies, et elle n'en avait que deux.**
     *
     * *Le défaut du 2026-08-29 :* David a redérivé son pilote Blade Runner
     * **après** que le moteur ait appris les dés échelonnés, et il est ressorti
     * avec un `jet.seuil` — donc une addition de valeurs qui sont des lettres.
     * L'invite ne proposait que « additionner » ou « croiser sur une table ».
     *
     * *Une voie qu'on n'offre pas est une voie que le modèle ne prend pas* — et
     * le défaut ressemble alors à un manquement du modèle, alors qu'on ne lui
     * avait rien demandé. C'est la troisième fois que ce fichier paie l'écart
     * entre ce que le code sait faire et ce que l'invite sait demander.
     */
    it('offre les trois voies, et exige qu’une seule soit remplie', () => {
        const rangFourche = jet.cible.indexOf('COMMENT LE JET SE RÉSOUT-IL ?');
        const rangDetail = jet.cible.indexOf('"jet.desEchelonnes" porte');

        for (const voie of ['"jet.seuil"', '"jet.cible"', '"jet.desEchelonnes"']) {
            expect(jet.cible.indexOf(voie), voie).toBeGreaterThan(-1);
        }
        expect(jet.cible).toContain('UNE SEULE DES TROIS');

        // La fourche se lit d'abord, le remplissage ensuite — la règle du 21/08.
        expect(rangDetail, 'le détail des dés échelonnés vient APRÈS la fourche')
            .toBeGreaterThan(rangFourche);
    });

    /**
     * Même règle que pour `cible` : le pilote **nomme** l'échelle, il ne la
     * transcrit pas. Un pilote est forgé par un modèle de langage, et une table
     * qu'il recopie est une table qu'il peut recopier de travers.
     */
    it('interdit de recopier la table des lettres dans le pilote', () => {
        expect(jet.cible).toContain('yze-lettres');
        expect(jet.cible).toContain('NE METS JAMAIS LA TABLE DES LETTRES');
        expect(jet.cible, 'aucune taille de dé ne doit être dictée').not.toMatch(/A\s*(vaut|=)\s*12/);
    });

    /**
     * **Le compte se dit LÀ OÙ le champ se décrit, et pas plus loin.**
     *
     * La première rédaction de la fourche décrivait le contenu de l'ajustement
     * — « les composantes lues sur la fiche » — et laissait son compte à
     * l'exigence (1). La dérivation du 2026-08-22 a rendu **onze** composantes,
     * « Compétence 1 » à « Compétence 12 » : le défaut des douze compétences
     * n'avait pas été corrigé, il avait DÉMÉNAGÉ du seuil vers la cible.
     *
     * *C'est la règle de la veille — ce qui décide du compte s'énonce avant ce
     * qui décide du contenu — enfreinte dans la consigne écrite pour
     * l'appliquer.*
     */
    it('dit le compte de la cible dans la fourche, avant l’exigence (1)', () => {
        const rangCompte = jet.cible.indexOf('UNE ENTRÉE PAR SECTION DE FICHE, jamais une par champ');
        const rangExigence1 = jet.cible.indexOf('**(1)');

        expect(rangCompte).toBeGreaterThan(-1);
        expect(rangCompte, 'le compte se lit avant l’exigence (1)').toBeLessThan(rangExigence1);
        expect(jet.cible, 'et la caractéristique est unique').toContain('UNE SEULE composante');
    });

    /**
     * **Un `sectionId` manquant ne calcule rien**, et un `sectionId` inventé ne
     * désigne rien. La dérivation du 2026-08-22 a produit les deux : une
     * caractéristique sans section, et un ajustement visant
     * « juste_une_comp_par_action » — une phrase de règle prise pour un
     * identifiant.
     */
    it('exige un sectionId, et interdit de l’inventer', () => {
        expect(jet.cible).toContain('"sectionId" est OBLIGATOIRE');
        expect(jet.cible).toContain('IDENTIFIANTS DISPONIBLES');
        expect(jet.cible).toContain('jamais une phrase de règle');
    });

    /**
     * **Aucun nombre de table ne doit venir du modèle.** Les multiplicateurs et
     * les bandes sont saisis depuis le livre et protégés par des tests : une
     * Forge qui les « dérive » produirait des nombres plausibles et faux que
     * personne ne verrait avant six séances.
     */
    it('interdit d’inventer une mécanique et d’y mettre des nombres', () => {
        expect(jet.cible).toContain('N\'EN INVENTE AUCUN');
        expect(jet.cible).toContain('NE METS JAMAIS DE NOMBRES DE CETTE TABLE');
    });

    /**
     * **La consigne remontée en tête le 2026-08-16 disait vrai sur la forme et
     * faux sur le fond**, et Cthulhu Hack l'a payé le lendemain : elle réclamait
     * les six Sauvegardes dans `jet.seuil`, où les composantes s'ADDITIONNENT.
     *
     * Ce que ce test verrouille, c'est la distinction elle-même — le nombre
     * d'entrées dit ce qui s'ajoute, la section dit entre quoi on choisit. La
     * perdre une seconde fois rendrait un pilote qu'on ne peut pas lancer.
     */
    it('dit que le nombre d\'entrées du seuil est une somme, pas un choix', () => {
        expect(jet.cible).toContain('S\'ADDITIONNE');
        expect(jet.cible).toContain('UNE SEULE entrée');
        expect(jet.cible, 'le choix se joue dans la section').toContain('"sectionId"');
    });

    /**
     * **La règle disait vrai, mais dans le mauvais ordre** — troisième forme du
     * même défaut, relevée par David le 2026-08-21. Rêves de Dragons est
     * ressorti avec DOUZE composantes « Compétence 1 » à « Compétence 12 »,
     * toutes sur la section `competences`.
     *
     * La tête de consigne annonçait « une entrée PAR VALEUR AJOUTÉE » : douze
     * compétences, douze entrées, et c'est cette phrase-là qui se lit en
     * premier. La correction — « six Sauvegardes = UNE SEULE entrée » — venait
     * après et sous condition, donc trop tard.
     *
     * *Ce qui décide du COMPTE doit s'énoncer avant ce qui décide du contenu.*
     * Ce test verrouille l'ordre autant que la règle : la phrase qui donne le
     * nombre d'entrées ouvre la cible.
     */
    it('donne la règle du COMPTE avant celle du contenu', () => {
        const rangDuCompte = jet.cible.indexOf('UNE ENTRÉE PAR SECTION DE FICHE LUE');
        const rangDuDetail = jet.cible.indexOf('Chaque entrée porte son "id"');

        expect(rangDuCompte, 'la règle du compte doit exister').toBeGreaterThan(-1);
        expect(rangDuCompte).toBeLessThan(rangDuDetail);
        // Et elle interdit explicitement ce que Rêves de Dragons a produit.
        expect(jet.cible).toContain('JAMAIS UNE PAR CHAMP');
        expect(jet.cible).toContain('deux entrées portant le même "sectionId"');
    });

    it('dit que « sous-ou-egal » sans seuil ne veut rien dire', () => {
        expect(jet.cible).toContain('SANS seuil ne veut rien dire');
    });

    it('distingue la famille 2d20 du fait de lancer un d20', () => {
        expect(jet.cible).toContain('FAMILLE MODIPHIUS');
        expect(jet.cible).toContain('Dans le doute, "standard"');
    });

    it("interdit la forme « section.champ » dans la santé de départ", () => {
        const defaite = GROUPES.find(g => g.id === 'defaite')!;
        expect(defaite.cible).toContain('section.champ');
    });
});
