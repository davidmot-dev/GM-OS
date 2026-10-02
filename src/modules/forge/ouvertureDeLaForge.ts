/**
 * **Ouvrir la Forge sur l'atelier des règles**, depuis un autre écran.
 *
 * L'atelier du Grimoire offrait « Créer une règle » — une fiche vide — et
 * renvoyait à la Forge pour la générer, **sans y mener** (refonte, L5, étape
 * 2, note de David du 2026-09-27). Le chemin « La générer avec l'IA » doit
 * appeler **le même moteur que la Forge** (`useBrainstormStore` : carnet,
 * sources, sujet, candidates), pas en dupliquer un : on y va donc.
 *
 * L'onglet de la Forge vit dans son état local ; une demande à usage unique,
 * déposée ici et reprise à son montage, suffit. *Une demande qui resterait
 * posée rouvrirait l'atelier des règles à chaque visite, sans qu'on l'ait
 * demandé* : `prendreLaDemande` la consomme.
 */
let demande: 'rules' | null = null;

export function demanderLAtelierDesRegles(): void {
    demande = 'rules';
}

export function prendreLaDemande(): 'rules' | null {
    const lue = demande;
    demande = null;
    return lue;
}
