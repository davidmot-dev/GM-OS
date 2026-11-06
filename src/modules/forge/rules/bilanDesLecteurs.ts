import type { FamilleDObjet } from '../../../types/drivers';
import { remplirDepuisLesFiches } from '../../equipement/depuisLeCorpus';
import { remplirLeBestiaire } from '../../bestiaire/depuisLeCorpus';
import { parleDEquipement, parleDeCreatures } from './natureDuSujet';

/**
 * **Ce que le catalogue et le bestiaire liront d'une fiche** — étape F1 du plan
 * `documentation/Planning/2026-11-06-forge-tableaux-equipement-bestiaire.md` (06/11/2026).
 *
 * David, sur COC : *« malgré le fait que j'ai une fiche, rien ne se remplit »*. La fiche forgée était
 * en prose, la Forge l'avait publiée sans rien dire. À la relecture, on passe désormais la fiche aux
 * **deux lecteurs réels**, à blanc — `remplirDepuisLesFiches` et `remplirLeBestiaire`, ceux de
 * « Remplir depuis le corpus » —, et l'atelier montre ce qu'ils en tirent. Rien n'est versé.
 *
 * Décision de David : une fiche qui parle d'équipement (ou de créatures) sans rien donner au lecteur
 * est **publiée avec une alerte**, pas refusée.
 */
export interface BilanDesLecteurs {
    equipement: {
        /** La fiche parle d'équipement (nom de fichier ou `sujet:`). */
        parle: boolean;
        objets: number;
        parFamille: Partial<Record<FamilleDObjet, number>>;
    };
    bestiaire: {
        parle: boolean;
        creatures: number;
        tablesDAttaques: number;
    };
    /** Les lignes d'un tableau reconnu que l'un des lecteurs n'a pas su lire. */
    lignesNonLues: { ligne: string; raison: string }[];
    /** Une fiche qui parle du sujet sans rien donner à son lecteur. */
    alerte: 'equipement' | 'bestiaire' | null;
}

export function bilanDesLecteurs(chemin: string, contenu: string): BilanDesLecteurs {
    const fiche = { chemin, contenu, livre: '' };
    const { journal: equipement } = remplirDepuisLesFiches(undefined, [fiche]);
    const { journal: bestiaire } = remplirLeBestiaire(undefined, [fiche]);
    const parFamille: Partial<Record<FamilleDObjet, number>> = {};
    for (const o of equipement.objetsAjoutes) parFamille[o.famille] = (parFamille[o.famille] ?? 0) + 1;
    const bilan: BilanDesLecteurs = {
        equipement: { parle: parleDEquipement(chemin, contenu), objets: equipement.objetsAjoutes.length, parFamille },
        bestiaire: { parle: parleDeCreatures(chemin, contenu), creatures: bestiaire.creaturesAjoutees.length, tablesDAttaques: bestiaire.attaquesRattachees.length },
        lignesNonLues: [...equipement.lignesNonLues, ...bestiaire.lignesNonLues].map(l => ({ ligne: l.ligne.trim(), raison: l.raison })),
        alerte: null,
    };
    if (bilan.equipement.parle && bilan.equipement.objets === 0) bilan.alerte = 'equipement';
    else if (bilan.bestiaire.parle && bilan.bestiaire.creatures === 0) bilan.alerte = 'bestiaire';
    return bilan;
}

/** Le bilan vaut-il d'être montré ? Une fiche de règles ordinaire ne l'affiche pas. */
export const bilanAMontrer = (b: BilanDesLecteurs) =>
    b.equipement.objets > 0 || b.bestiaire.creatures > 0 || b.alerte !== null || b.lignesNonLues.length > 0;
