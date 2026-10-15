import { resoudreCorpus } from '../../../electron/corpusSysteme';
import { validerLeManifeste, validerLesReferences } from '../../../outils/modules-du-jeu/contrat.mjs';
import manifesteMuthur from '../../../outils/alien/modules/muthur/manifeste.json';
import type { GameDriver } from '../../types/drivers';
import type { ModuleDuCatalogue, ModuleDuPilote, ReferenceDeModuleDuJeu } from './types';

// Registre explicite : aucun chemin, script ou URL fourni par un pilote n'est exécuté.
if (validerLeManifeste(manifesteMuthur).length) throw new Error('Manifeste MU/TH/UR invalide.');
export const CATALOGUE_DES_MODULES: readonly ModuleDuCatalogue[] = [
    { id: manifesteMuthur.id, libelle: manifesteMuthur.libelle, description: manifesteMuthur.description,
        corpusCompatibles: manifesteMuthur.corpusCompatibles, adaptation: 'prete' },
    { id: 'alien-detecteur', libelle: 'Détecteur de mouvement',
        description: 'Contacts et proximité scénarisés, avec intensité réglée par le meneur.',
        corpusCompatibles: ['alien'], adaptation: 'a-faire' },
];

export { validerLesReferences };
export function exigerReferencesDeModules(references: unknown): void {
    const erreurs = validerLesReferences(references);
    if (erreurs.length) throw new Error(`Modules du jeu invalides : ${erreurs.join(' ')}`);
}

type IdentiteDuPilote = Pick<GameDriver, 'id' | 'name' | 'corpusId' | 'ragPath' | 'modulesDuJeu'>;
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
