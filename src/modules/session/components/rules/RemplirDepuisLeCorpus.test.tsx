import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import RemplirDepuisLeCorpus from './RemplirDepuisLeCorpus';
import EditeurDuCatalogue from './EditeurDuCatalogue';
import type { CatalogueDEquipement, GameDriver } from '../../../../types/drivers';
import { parleDEquipement, type LivreACataloguer } from '../../../equipement/livresDuJeu';
import { estUneFicheDEquipement } from '../../../equipement/depuisLeCorpus';

/**
 * L'aperçu « Remplir depuis le corpus » — § 203, étape C. Les livres sont lus
 * dans les vraies fiches du dépôt, comme l'écran les lirait sur le disque.
 */
const livre = (cle: string, titre: string, brutes: Record<string, string>): LivreACataloguer => {
    const toutes = Object.entries(brutes).sort(([a], [b]) => a.localeCompare(b));
    return {
        cle, titre, total: toutes.length,
        fiches: toutes.filter(([, c]) => estUneFicheDEquipement(c)).map(([chemin, contenu]) => ({ chemin: chemin.replace('/docs/', ''), contenu, livre: titre })),
    };
};
const BASE = livre('jeu', 'Livre de base', import.meta.glob('/docs/systems/alien/rules/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>);
const CM = livre('colonial-marines', 'Colonial Marines Operations Manual', import.meta.glob('/docs/systems/alien/supplements/colonial-marines/rules/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>);
const CHAMPS = [{ id: 'machines_lourdes', label: 'Machines lourdes' }, { id: 'observation', label: 'Observation' }];
const pilote = (catalogue?: CatalogueDEquipement) => ({ id: 'alien', name: 'Alien', catalogue } as unknown as GameDriver);

const monter = (catalogue?: CatalogueDEquipement, livres = [BASE, CM]) => {
    const onVerser = vi.fn();
    const onFermer = vi.fn();
    render(<RemplirDepuisLeCorpus driver={pilote(catalogue)} champsDeLaFiche={CHAMPS} onVerser={onVerser} onFermer={onFermer} livresFournis={livres} />);
    return { onVerser, onFermer };
};

describe('RemplirDepuisLeCorpus — COC, 06/11/2026', () => {
    // David : « malgré le fait que j'ai une fiche, rien ne se remplit » — la fiche forgée était en prose.
    const brutes = import.meta.glob('/docs/systems/coc/rules/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
    const COC: LivreACataloguer = {
        ...livre('jeu', 'Livre de base', brutes),
        sansTableau: Object.entries(brutes).filter(([c, t]) => !estUneFicheDEquipement(t) && parleDEquipement(c, t)).map(([c]) => c.split('/').pop()!),
    };

    it('la fiche transcrite donne 36 armes et 8 protections, prix par époque ; la fiche en prose est nommée', () => {
        monter(undefined, [COC]);
        expect(screen.getByRole('status').textContent).toContain('44 objet(s) à ajouter');
        const note = screen.getByRole('note');
        expect(note.textContent).toContain('equipements-et-objets.md');
        expect(note.textContent).toContain('Arme, Protection, Véhicule ou Objet');
    });

    it('sans aucun tableau lisible, le livre le dit au lieu de se taire', () => {
        monter(undefined, [{ cle: 'jeu', titre: 'Livre de base', total: 20, fiches: [], sansTableau: ['equipements-et-objets.md'] }]);
        expect(screen.getByText('aucun tableau d’équipement lisible')).toBeTruthy();
        expect(screen.getByRole('note').textContent).toMatch(/Cette fiche parle d’équipement sans tableau/);
    });
});

describe('RemplirDepuisLeCorpus', () => {
    it('dit ce que chaque livre apporte, et verse les deux livres dans le catalogue', () => {
        const { onVerser, onFermer } = monter();
        // 31 depuis le 06/11/2026 : la fiche du bestiaire du livre de base (sans équipement).
        expect(screen.getByText('4 fiches d’équipement sur 31')).toBeTruthy();
        expect(screen.getByText('8 fiches d’équipement sur 19')).toBeTruthy();
        expect(screen.getByRole('status').textContent).toContain('154 objet(s) à ajouter');
        fireEvent.click(screen.getByRole('button', { name: /Verser au catalogue/ }));
        const verse = onVerser.mock.calls[0][0] as CatalogueDEquipement;
        expect(verse.objets).toHaveLength(154);
        expect(verse.objets.find(o => o.nom === 'Cric d’entretien')?.effets).toEqual([{ cible: 'machines_lourdes', valeur: 1, texte: 'Machines lourdes +1' }]);
        expect(onFermer).toHaveBeenCalled();
    });

    it('recalcule quand on décoche un livre', () => {
        monter();
        fireEvent.click(screen.getByRole('checkbox', { name: /Livre de base/ }));
        expect(screen.getByRole('status').textContent).toContain('66 objet(s) à ajouter');
        // Sans l'armure M3 du livre de base, le casque M10 n'a plus de porteur.
        expect(screen.getByText(/Casque pare-balles M10.*porteur absent du catalogue/)).toBeTruthy();
    });

    it('montre les objets par famille et par catégorie, avec les colonnes du jeu', () => {
        monter(undefined, [CM]);
        const armes = screen.getByRole('button', { name: /Armes/, expanded: true });
        expect(armes.textContent).toContain('26');
        fireEvent.click(screen.getByRole('tab', { name: /Explosifs, mines et armes chimiques 10/ }));
        expect(screen.getByText('Charge de brèche Armat Type 4')).toBeTruthy();
        expect(screen.getAllByText('Puissance 9').length).toBeGreaterThan(0);
        // L'en-tête de la liste suit les colonnes déclarées (« Portée » est aussi une colonne à déclarer).
        expect(screen.getAllByText('Portée').some(e => e.classList.contains('text-center'))).toBe(true);
    });

    it('garde ce que le meneur a corrigé et le dit dans « À regarder »', () => {
        const corrige: CatalogueDEquipement = {
            colonnes: { arme: [{ id: 'bonus', libelle: 'Bonus', nature: 'nombre' }] },
            objets: [{ id: 'vp', famille: 'arme', nom: 'Pistolet semi-automatique VP-70MA6', valeurs: { bonus: '+3' } }],
        };
        const { onVerser } = monter(corrige, [CM]);
        expect(screen.getByText(/VP-70MA6 · bonus : catalogue « \+3 », fiche « \+2 » — gardé tel quel/)).toBeTruthy();
        expect(screen.getByRole('status').textContent).toContain('65 objet(s) à ajouter · 1 objet(s) complété(s)');
        fireEvent.click(screen.getByRole('button', { name: /Verser au catalogue/ }));
        expect((onVerser.mock.calls[0][0] as CatalogueDEquipement).objets[0].valeurs.bonus).toBe('+3');
    });

    it('grise un livre sans fiche d’équipement, et ne verse rien quand il n’y a rien', () => {
        monter(undefined, [{ cle: 'jeu', titre: 'Livre de base', fiches: [], total: 12 }]);
        const ligne = screen.getByRole('checkbox', { name: /Livre de base/ });
        expect((ligne as HTMLInputElement).disabled).toBe(true);
        expect(screen.getByText('aucune fiche d’équipement relue')).toBeTruthy();
        expect((screen.getByRole('button', { name: /Verser au catalogue/ }) as HTMLButtonElement).disabled).toBe(true);
    });

    it('s’ouvre depuis la section Équipement', () => {
        render(<EditeurDuCatalogue driver={pilote(undefined)} onUpdate={vi.fn()} />);
        fireEvent.click(screen.getByRole('button', { name: /Remplir depuis le corpus/ }));
        const fenetre = screen.getByRole('dialog', { name: 'Remplir depuis le corpus' });
        expect(within(fenetre).getByText(/Les tableaux des fiches relues/)).toBeTruthy();
    });
});
