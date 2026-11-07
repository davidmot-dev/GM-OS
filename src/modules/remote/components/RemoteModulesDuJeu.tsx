import { useMemo } from 'react';
import { CATALOGUE_DES_MODULES } from '../../modulesDuJeu/catalogue';
import { PanneauDesModulesMJ } from '../../modulesDuJeu/PanneauDesModulesMJ';
import type { GestesDuMeneur } from '../../modulesDuJeu/canalMeneur';
import type { VueDesModulesMJ } from '../../modulesDuJeu/protocole';
import type { ModuleDuPilote } from '../../modulesDuJeu/types';

/**
 * **L'onglet « Modules » de la tablette du meneur** — 07/11/2026, maquette Stitch validée par
 * David (*« je suis d'accord avec la maquette »*). La tablette ne connaît pas le pilote : elle
 * montre les modules que le poste a rendus disponibles, avec la description du catalogue. Les
 * modules à adapter ou absents du catalogue se règlent au poste, qui seul configure le pilote.
 */
export function RemoteModulesDuJeu({ vue, gestes, appaire }: { vue: VueDesModulesMJ | null; gestes: GestesDuMeneur; appaire: boolean }) {
    const proposes = useMemo<ModuleDuPilote[]>(() => (vue?.modules ?? []).map(m => ({
        reference: { id: m.id }, libelle: m.libelle, disponibilite: 'pret',
        description: CATALOGUE_DES_MODULES.find(c => c.id === m.id)?.description ?? '',
    })), [vue?.modules]);
    if (!appaire) return <p className="text-[16px] text-app-muted">Les modules du jeu s’ouvrent sur une tablette appairée au poste MJ. Scanne le QR code d’appairage.</p>;
    if (vue && !vue.campagneId) return <p className="text-[16px] text-app-muted">Aucune campagne ouverte au poste MJ.</p>;
    return <PanneauDesModulesMJ habillage="tablette" campagneId={vue?.campagneId ?? null} vue={vue} erreur={vue?.erreur ?? null}
        proposes={proposes} personnages={vue?.personnages ?? []} enSeance={!!vue?.enSeance} gestes={gestes} />;
}
