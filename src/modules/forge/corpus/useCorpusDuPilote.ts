import React from 'react';
import { resoudreCorpus, cheminDesPersonas, type Corpus } from '../../../../electron/corpusSysteme';
import { lirePersonas, ecrirePersonas, type PersonasDuCorpus } from './personasDuCorpus';

/**
 * Le corpus d'un pilote, résolu **comme `AIService` le résout**, et ses personas.
 *
 * **Pourquoi un seul endroit pour ça.** Quatre écrans doivent désormais dire à
 * quel corpus un pilote est rattaché — la revue de forge, le tableau des
 * pilotes, l'éditeur du moteur de règles et la Forge elle-même. Quatre
 * résolutions écrites séparément divergeraient, et l'écart serait indétectable
 * par construction : chacune afficherait un chemin plausible.
 *
 * C'est la règle déjà tenue par `electron/corpusSysteme.ts`, où l'écriture
 * résout **comme la lecture** pour la même raison.
 *
 * **Ce hook ne décide de rien.** Il lit le disque et rend ce qu'il a trouvé,
 * y compris l'absence. Un corpus sans `gems.json` est un corpus ordinaire, pas
 * une erreur : les gemmes jouent alors leurs instructions par défaut.
 */
export interface CorpusDuPilote {
    corpus: Corpus | null;
    personas: PersonasDuCorpus;
    chargement: boolean;
    /** Écrit `gems.json` et rafraîchit. Rend le message d'échec, ou `null`. */
    enregistrer: (personas: Record<string, string>) => Promise<string | null>;
    /** Relit le disque — après une écriture faite ailleurs, par exemple. */
    relire: () => void;
}

/** Ce qu'il faut d'un pilote pour retrouver son corpus. Volontairement minimal. */
export interface PiloteAResoudre {
    id?: string;
    name?: string;
    corpusId?: string;
    ragPath?: string;
}

export function useCorpusDuPilote(
    pilote: PiloteAResoudre | null | undefined,
    /** Chemin déclaré sur la campagne, quand l'écran en connaît une. Souverain. */
    systemPath?: string,
): CorpusDuPilote {
    const [corpus, setCorpus] = React.useState<Corpus | null>(null);
    const [personas, setPersonas] = React.useState<PersonasDuCorpus>({ personas: {}, present: false });
    const [chargement, setChargement] = React.useState(false);
    const [tour, setTour] = React.useState(0);

    const identite = `${pilote?.id ?? ''}|${pilote?.name ?? ''}|${pilote?.corpusId ?? ''}|${pilote?.ragPath ?? ''}|${systemPath ?? ''}`;

    React.useEffect(() => {
        if (!pilote) {
            setCorpus(null);
            setPersonas({ personas: {}, present: false });
            return;
        }
        let annule = false;
        setChargement(true);

        (async () => {
            try {
                const dossiersConnus = (await window.appBridge?.ai?.listSystems?.()) ?? [];
                const resolu = resoudreCorpus({
                    systemId: pilote.id ?? '',
                    systemName: pilote.name,
                    systemPath,
                    corpusId: pilote.corpusId,
                    ragPath: pilote.ragPath,
                    dossiersConnus,
                });
                const brut = await window.appBridge?.ai?.readDoc?.(cheminDesPersonas(resolu));
                if (annule) return;
                setCorpus(resolu);
                setPersonas(lirePersonas(brut));
            } catch (erreur) {
                if (annule) return;
                /*
                  Un pont absent n'est pas une anomalie — l'application tourne
                  aussi dans un navigateur, sans Electron. On rend l'absence,
                  jamais une exception : l'écran doit rester ouvrable.
                */
                setCorpus(null);
                setPersonas({
                    personas: {},
                    present: false,
                    erreur: erreur instanceof Error ? erreur.message : String(erreur),
                });
            } finally {
                if (!annule) setChargement(false);
            }
        })();

        return () => { annule = true; };
        // `identite` résume le pilote : se lier à l'objet relancerait la lecture
        // à chaque rendu du parent, donc à chaque frappe dans une zone de texte.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [identite, tour]);

    const enregistrer = React.useCallback(async (aEcrire: Record<string, string>): Promise<string | null> => {
        if (!corpus) return "Aucun corpus n'est résolu pour ce pilote.";
        try {
            const ok = await window.appBridge?.ai?.writeDoc?.(cheminDesPersonas(corpus), ecrirePersonas(aEcrire));
            if (ok === false) return "L'écriture a été refusée par l'application.";
            setTour(n => n + 1);
            return null;
        } catch (erreur) {
            return erreur instanceof Error ? erreur.message : String(erreur);
        }
    }, [corpus]);

    const relire = React.useCallback(() => setTour(n => n + 1), []);

    return { corpus, personas, chargement, enregistrer, relire };
}
