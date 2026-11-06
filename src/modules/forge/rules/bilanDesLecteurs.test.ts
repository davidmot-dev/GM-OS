import { describe, expect, it } from 'vitest';
import { bilanAMontrer, bilanDesLecteurs } from './bilanDesLecteurs';
// Les vraies fiches du dépôt, lues par Vite (pas de `node:fs` dans les essais de l'interface).
import COC_PROSE from '../../../../docs/systems/coc/rules/equipements-et-objets.md?raw';
import COC_TABLEAUX from '../../../../docs/systems/coc/rules/equipement-armes-et-protections-du-livre-de-base.md?raw';
import ALIEN_BESTIAIRE from '../../../../docs/systems/alien/rules/bestiaire-du-livre-de-base.md?raw';
import COC_DES from '../../../../docs/systems/coc/rules/resolution-des-jets.md?raw';

/**
 * **F1 — ce que le catalogue et le bestiaire liront d'une fiche relue** (06/11/2026). Les deux lecteurs
 * réels, à blanc, sur les fiches du corpus.
 */
describe('bilanDesLecteurs', () => {
    it('la fiche forgée de COC, en prose : elle parle d’équipement et ne donne rien — alerte', () => {
        const b = bilanDesLecteurs('systems/coc/rules/equipements-et-objets.md', COC_PROSE);
        expect(b.equipement).toEqual({ parle: true, objets: 0, parFamille: {} });
        expect(b.alerte).toBe('equipement');
        expect(bilanAMontrer(b)).toBe(true);
    });

    it('la fiche transcrite de COC : 36 armes et 8 protections, sans alerte', () => {
        const b = bilanDesLecteurs('systems/coc/rules/equipement-armes-et-protections-du-livre-de-base.md', COC_TABLEAUX);
        expect(b.equipement.objets).toBe(44);
        expect(b.equipement.parFamille).toEqual({ arme: 36, protection: 8 });
        expect(b.lignesNonLues).toEqual([]);
        expect(b.alerte).toBeNull();
    });

    it('le bestiaire d’Alien : 27 créatures ; une ligne mal formée est montrée', () => {
        const b = bilanDesLecteurs('systems/alien/rules/bestiaire-du-livre-de-base.md', ALIEN_BESTIAIRE);
        expect(b.bestiaire.creatures).toBe(27);
        expect(b.alerte).toBeNull();
        // Deux cases du Drone fusionnées : une case de moins que les colonnes.
        const abimee = ALIEN_BESTIAIRE.replace(/^(\| \*\*Drone\*\* \|[^|]*)\|/m, '$1');
        expect(bilanDesLecteurs('x/bestiaire.md', abimee).lignesNonLues).toHaveLength(1);
    });

    it('une fiche de règles ordinaire ne montre rien', () => {
        const b = bilanDesLecteurs('systems/coc/rules/resolution-des-jets.md', COC_DES);
        expect(b.alerte).toBeNull();
        expect(bilanAMontrer(b)).toBe(false);
    });

    it('un bestiaire en prose déclenche l’alerte du bestiaire', () => {
        const b = bilanDesLecteurs('systems/coc/rules/adversaires.md', '---\nsujet: Les adversaires\n---\n\nUn sbire a 10 PV.\n');
        expect(b.alerte).toBe('bestiaire');
    });
});
