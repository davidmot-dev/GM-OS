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
