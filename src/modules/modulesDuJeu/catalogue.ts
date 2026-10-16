import { resoudreCorpus } from '../../../electron/corpusSysteme';
import { validerLeManifeste, validerLesReferences } from '../../../outils/modules-du-jeu/contrat.mjs';
import manifesteMuthur from '../../../outils/alien/modules/muthur/manifeste.json';
import manifesteDetecteur from '../../../outils/alien/modules/detecteur/manifeste.json';
import manifesteLcars from '../../../outils/star-trek/lcars/manifeste.json';
import type { ModuleDuCatalogue, ModuleDuPilote, ReferenceDeModuleDuJeu } from './types';

// Registre explicite : aucun chemin, script ou URL fourni par un pilote n'est exécuté.
if (validerLeManifeste(manifesteMuthur).length) throw new Error('Manifeste MU/TH/UR invalide.');
if (validerLeManifeste(manifesteDetecteur).length) throw new Error('Manifeste du détecteur invalide.');
if (validerLeManifeste(manifesteLcars).length) throw new Error('Manifeste LCARS invalide.');
export const CATALOGUE_DES_MODULES: readonly ModuleDuCatalogue[] = [
    { id: manifesteLcars.id, libelle: manifesteLcars.libelle,
        description: 'Sept consoles de passerelle pilotées par le MJ : interventions, ordres, rapports et médias privés, alertes et diffuseur sonore.',
        corpusCompatibles: manifesteLcars.corpusCompatibles, adaptation: 'prete' },
    { id: manifesteMuthur.id, libelle: manifesteMuthur.libelle, description: manifesteMuthur.description,
        corpusCompatibles: manifesteMuthur.corpusCompatibles, adaptation: 'prete' },
    { id: manifesteDetecteur.id, libelle: manifesteDetecteur.libelle, description: manifesteDetecteur.description,
        corpusCompatibles: manifesteDetecteur.corpusCompatibles, adaptation: 'prete' },
];

export { validerLesReferences };
export function exigerReferencesDeModules(references: unknown): void {
    const erreurs = validerLesReferences(references);
    if (erreurs.length) throw new Error(`Modules du jeu invalides : ${erreurs.join(' ')}`);
}

type IdentiteDuPilote = { id: string; name: string; corpusId?: string; ragPath?: string; modulesDuJeu?: ReferenceDeModuleDuJeu[] };
export function modulesDuPilote(pilote: IdentiteDuPilote | null | undefined, systemPath?: string) {
    if (!pilote) return { corpusId: null, implicite: false, references: [] as ReferenceDeModuleDuJeu[], modules: [] as ModuleDuPilote[], erreurs: [] as string[] };
    const corpusId = resoudreCorpus({ systemId: pilote.id, systemName: pilote.name, corpusId: pilote.corpusId,
        ragPath: pilote.ragPath, systemPath, dossiersConnus: [...new Set(CATALOGUE_DES_MODULES.flatMap(m => m.corpusCompatibles))] }).id;
    const implicite = pilote.modulesDuJeu === undefined;
    const erreurs = validerLesReferences(pilote.modulesDuJeu);
    const references: ReferenceDeModuleDuJeu[] = erreurs.length ? [] : implicite
        ? (corpusId === 'alien' ? CATALOGUE_DES_MODULES.filter(m => m.corpusCompatibles.includes(corpusId)).map(m => ({ id: m.id })) : [])
        : pilote.modulesDuJeu!.map(reference => ({ ...reference }));
    const modules: ModuleDuPilote[] = references.map(reference => {
        const connu = CATALOGUE_DES_MODULES.find(m => m.id === reference.id);
        return { reference, libelle: reference.libelle || connu?.libelle || reference.id,
            description: connu?.description || 'Ce module est absent du catalogue de cette version.',
            disponibilite: !connu ? 'inconnu' : !connu.corpusCompatibles.includes(corpusId) ? 'incompatible'
                : connu.adaptation === 'prete' ? 'pret' : 'a-adapter' };
    });
    return { corpusId, implicite, references, modules, erreurs };
}
