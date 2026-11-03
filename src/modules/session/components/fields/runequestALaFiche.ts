import type { SheetSection } from '../../../../data/defaultSheetTemplates';
import type { RegleDeLaProgression } from '../../../dice/systemes/progressionDeRuneQuest';

/**
 * Ce que le jet et les deux cartes de RuneQuest (RQ-A5, RQ-A6, 03/11/2026) partagent :
 * l'habillage des gestes, et la façon de nommer une aptitude comme la feuille la nomme.
 */
export const BOUTON_RQ = 'px-2 py-0.5 rounded-md border border-app-border/40 text-ui-10 font-bold hover:border-accent/50 disabled:opacity-30';
export const BOUTON_PRINCIPAL_RQ = 'px-3 py-1 rounded-md bg-accent text-app-on-accent text-ui-10 font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-30';
export const ETIQUETTE_RQ = 'font-black uppercase tracking-widest text-ui-9 text-app-text/60';
export const CHAMP_RQ = 'rounded-md border border-app-border/40 bg-app-bg px-2 py-0.5 font-mono text-xs';

const texte = (v: unknown) => (v === undefined || v === null ? '' : String(v).trim());

/**
 * Le nom d'une aptitude : le nom saisi d'une arme ou d'une Passion (`libelleSur`), sinon
 * le libellé de la fiche ; une Passion dit son sujet — « Haine (Empire lunar) ».
 */
export function libelleDuChamp(sections: SheetSection[], valeurs: Record<string, unknown>, champ: string): string {
    const f = sections.flatMap(s => s.fields).find(x => x.id === champ);
    const nom = (f?.libelleSur ? texte(valeurs[f.libelleSur]) : '') || f?.label || champ;
    const sujet = texte(valeurs[`${champ}_sujet`]);
    return sujet ? `${nom} (${sujet})` : nom;
}

export const sectionDuChamp = (sections: SheetSection[], champ: string) => sections.find(s => s.fields.some(f => f.id === champ))?.id;

/** Ce qui se lit à côté d'une arme sans se lancer : ses dégâts, son RA, son ENC… */
const NON_LANCE = /_(nom|sujet|degats|ra|enc|durabilite|portee|cadence|pv)$/;

export interface AptitudeDeLaFiche { champ: string; libelle: string; valeur: number; genre: 'competence' | 'rune' | 'passion' }

/**
 * Les aptitudes qui progressent par l'expérience : les compétences des sections que le
 * pilote range dans une catégorie (armes comprises), les Runes et les Passions. Ni la
 * Réputation (p. 237) ni les caractéristiques.
 */
export function aptitudesDeLaFiche(regle: RegleDeLaProgression, sections: SheetSection[], valeurs: Record<string, unknown>): AptitudeDeLaFiche[] {
    const liste: AptitudeDeLaFiche[] = [];
    const vu = new Set<string>();
    const ajouter = (champ: string, genre: AptitudeDeLaFiche['genre']) => {
        if (vu.has(champ)) return;
        vu.add(champ);
        liste.push({ champ, libelle: libelleDuChamp(sections, valeurs, champ), valeur: Number(valeurs[champ]) || 0, genre });
    };
    for (const s of sections) {
        if (!(s.id in regle.categories)) continue;
        for (const f of s.fields) if (f.type === 'number' && !NON_LANCE.test(f.id)) ajouter(f.id, 'competence');
    }
    regle.runes.forEach(c => ajouter(c, 'rune'));
    regle.passions.forEach(c => ajouter(c, 'passion'));
    return liste;
}
