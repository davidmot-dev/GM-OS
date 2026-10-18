import { useEffect, useState } from 'react';
import { racineDuPilote } from '../logic/banniereDuPilote';
import { lireLeReferentiel, sectionDuMarkdown, type EntreeDeReferentiel, type Referentiel } from '../logic/referentiels';
import type { GameDriver } from '../../../types/drivers';
import { origineDesFiches } from '../../fiches/pontDeLaFiche';

/**
 * **Lire un référentiel du corpus du jeu** — 2026-10-17 (les Vécus de Nephilim).
 *
 * Dans Electron, le fichier se lit par `gmos://media/docs/<dossier du jeu>/<chemin>`,
 * comme la bannière : le protocole accepte `fetch`. **Sur une tablette**
 * (2026-10-18), `gmos://` n'existe pas : on passe par le serveur des fiches, qui
 * sert déjà à la tablette les `.json` de `systems/` (la correspondance) — même
 * origine que les fiches, `origineDesFiches`. Il ne sert pas les `.md` : la
 * description vient alors de l'index lui-même (`EntreeDeReferentiel.description`). Chaque fichier n'est lu
 * qu'une fois par lancement ; un fichier introuvable rend `null`, et l'écran ne
 * montre alors ni suggestion ni bouton — *rien plutôt qu'un lien qui mène nulle
 * part.*
 */
type PiloteDuJeu = Pick<GameDriver, 'id' | 'name'> & { corpusId?: string; ragPath?: string };

const lus = new Map<string, Promise<string | null>>();

/** Le texte d'un fichier du corpus, lu une seule fois. */
function lireUneFois(adresse: string): Promise<string | null> {
    let lecture = lus.get(adresse);
    if (!lecture) {
        lecture = fetch(adresse).then(r => (r.ok ? r.text() : null)).catch(() => null);
        lus.set(adresse, lecture);
    }
    return lecture;
}

/**
 * L'adresse d'un fichier du dossier du jeu, chaque segment encodé — sous
 * `gmos://media/docs` dans Electron, sous le serveur des fiches ailleurs.
 */
export function adresseDansLeCorpus(racine: string, chemin: string, origine = origineDesFiches()): string | null {
    const segments = [...racine.split('/'), ...chemin.split('/')].filter(Boolean);
    if (segments.some(s => s === '..' || s === '.')) return null;
    return `${origine}/${segments.map(encodeURIComponent).join('/')}`;
}

/** Le dossier du chemin d'un index : les fichiers des entrées s'y trouvent. */
const dossierDe = (chemin: string) => chemin.split('/').slice(0, -1).join('/');

export function useReferentiel(pilote: PiloteDuJeu | null | undefined, chemin: string | undefined): Referentiel | null {
    const cle = pilote && chemin ? `${pilote.id}|${pilote.corpusId ?? ''}|${chemin}` : '';
    const [lu, setLu] = useState<{ cle: string; referentiel: Referentiel | null }>({ cle: '', referentiel: null });
    useEffect(() => {
        if (!pilote || !chemin) return;
        let vivant = true;
        void racineDuPilote(pilote)
            .then(racine => {
                const adresse = adresseDansLeCorpus(racine, chemin);
                return adresse ? lireUneFois(adresse) : null;
            })
            .then(texte => {
                if (!vivant) return;
                let referentiel: Referentiel | null = null;
                try { referentiel = texte ? lireLeReferentiel(JSON.parse(texte)) : null; } catch { referentiel = null; }
                setLu({ cle, referentiel });
            })
            .catch(() => { if (vivant) setLu({ cle, referentiel: null }); });
        return () => { vivant = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cle]);
    return lu.cle === cle ? lu.referentiel : null;
}

/** La description d'une entrée, prise dans son fichier Markdown ; `null` tant qu'elle n'est pas lue. */
export function useDescriptionDeLEntree(
    pilote: PiloteDuJeu | null | undefined,
    chemin: string | undefined,
    entree: EntreeDeReferentiel | null | undefined,
): string | null {
    // La description déjà dans l'index (la tablette ne lit pas les `.md`) : rien à aller chercher.
    const cle = pilote && chemin && entree?.fichier && !entree.description ? `${pilote.id}|${chemin}|${entree.fichier}|${entree.nom}` : '';
    const [lu, setLu] = useState<{ cle: string; texte: string | null }>({ cle: '', texte: null });
    useEffect(() => {
        if (!pilote || !chemin || !entree?.fichier || entree.description) return;
        let vivant = true;
        void racineDuPilote(pilote)
            .then(racine => {
                const adresse = adresseDansLeCorpus(racine, [dossierDe(chemin), entree.fichier].filter(Boolean).join('/'));
                return adresse ? lireUneFois(adresse) : null;
            })
            .then(markdown => { if (vivant) setLu({ cle, texte: markdown ? sectionDuMarkdown(markdown, entree.nom) : null }); })
            .catch(() => { if (vivant) setLu({ cle, texte: null }); });
        return () => { vivant = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cle]);
    if (entree?.description) return entree.description;
    return lu.cle === cle ? lu.texte : null;
}
