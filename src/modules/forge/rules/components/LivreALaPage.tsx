import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { demandePourLeLivre, livreDeLaSource, MOTIFS_D_OUVERTURE, type LivreDuJeu, type SourceDuLivre } from '../livres';

/**
 * **« Livre, p. N »** — « Les chemins des livres », étape D (06/11/2026), sans maquette sur décision
 * de David (pas d'écran neuf : le bouton prend la place du « p. N » déjà affiché).
 *
 * Ouvre le PDF du livre à la page imprimée, dans la fenêtre de lecture (étape C). Le bouton n'existe
 * que si le livre a un chemin dans le registre ; sinon, la page reste du texte, et son infobulle dit
 * où ajouter le PDF. Un livre qui ne répond pas le dit : jamais un échec muet.
 */
export interface RegistreDesLivres {
    /** `systems/<jeu>` ; `null` tant que le corpus du pilote n'est pas résolu. */
    racine: string | null;
    livres: readonly LivreDuJeu[];
}

interface LivreALaPageProps {
    registre: RegistreDesLivres;
    source: SourceDuLivre | undefined;
    /** Sans PDF : la page en texte (`texte`, défaut) ou rien (quand la page est déjà affichée à côté). */
    sansLivre?: 'texte' | 'rien';
    className?: string;
    /** Les classes de la page en texte, quand il n'y a pas de PDF (l'allure d'avant le bouton). */
    classeDuTexte?: string;
}

const AJOUTER = 'Ajouter le PDF de ce livre : Forge › Atelier de règles › PDF du livre';

const LivreALaPage: React.FC<LivreALaPageProps> = ({ registre, source, sansLivre = 'texte', className = '', classeDuTexte = '' }) => {
    const [etat, setEtat] = useState<{ genre: 'repos' } | { genre: 'ouverture' } | { genre: 'message'; texte: string; alerte: boolean }>({ genre: 'repos' });
    const page = source?.page;
    if (!page) return null;
    const pont = window.appBridge?.livres;
    const livre = livreDeLaSource(registre.livres, source);

    if (!livre || !registre.racine || !pont?.ouvrir) {
        return sansLivre === 'rien' ? null : <span className={`${className} ${classeDuTexte}`.trim()} title={AJOUTER}>p. {page}</span>;
    }

    const ouvrir = async (e: React.MouseEvent) => {
        // Le bouton vit parfois dans une ligne qu'un clic déplie ou choisit.
        e.stopPropagation();
        setEtat({ genre: 'ouverture' });
        const r = await pont.ouvrir(demandePourLeLivre(registre.livres, livre, registre.racine!, page));
        if (!r.ouvert) setEtat({ genre: 'message', texte: MOTIFS_D_OUVERTURE[r.motif], alerte: true });
        else if (!r.alaPage) setEtat({ genre: 'message', texte: 'Ouvert à la première page : allez à la page ' + (page + livre.decalage) + ' du PDF.', alerte: false });
        else setEtat({ genre: 'repos' });
    };

    return (
        <span className={`inline-flex items-center gap-2 ${className}`}>
            <button
                type="button"
                onClick={e => void ouvrir(e)}
                disabled={etat.genre === 'ouverture'}
                title={`${livre.titre} — page ${page} (page ${page + livre.decalage} du PDF)`}
                data-livre-a-la-page={page}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-accent/30 bg-accent/5 px-2 py-0.5 font-sans text-ui-12 font-bold text-accent hover:border-accent/60 hover:bg-accent/10 disabled:opacity-50"
            >
                <BookOpen size={13} /> {etat.genre === 'ouverture' ? 'Ouverture…' : `Livre, p. ${page}`}
            </button>
            {etat.genre === 'message' && (
                <span role="status" className={`font-sans text-ui-11 ${etat.alerte ? 'text-etat-alerte' : 'text-app-muted'}`}>{etat.texte}</span>
            )}
        </span>
    );
};

export default LivreALaPage;
