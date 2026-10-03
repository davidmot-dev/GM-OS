import React from 'react';
import { ImageIcon } from 'lucide-react';
import type { GameDriver } from '../../../../types/drivers';
import { racineDuPilote, imagesDuDossier, adresseDeLaBanniere } from '../../logic/banniereDuPilote';

/**
 * **Choisir la bannière du jeu** — David, 2026-10-03. Les images du dossier du
 * jeu (`docs/systems/<jeu>/`), et un aperçu recadré comme l'en-tête de
 * Session-OS le montrera : une bande fine, prise au centre.
 */
const ChoixDeLaBanniere: React.FC<{ pilote: GameDriver; onChange: (banniere: string | undefined) => void }> = ({ pilote, onChange }) => {
    const [racine, setRacine] = React.useState<string | null>(null);
    const [images, setImages] = React.useState<string[]>([]);

    React.useEffect(() => {
        let vivant = true;
        void racineDuPilote(pilote).then(async r => {
            if (!vivant) return;
            setRacine(r);
            const trouvees = await imagesDuDossier(r);
            if (vivant) setImages(trouvees);
        }).catch(() => { /* pas de dossier : la liste reste vide */ });
        return () => { vivant = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pilote.id, pilote.name]);

    const choisie = pilote.banniere ?? '';
    const apercu = racine ? adresseDeLaBanniere(racine, choisie) : null;
    // Une bannière déjà choisie reste dans la liste, même si le fichier a disparu : on le voit.
    const options = choisie && !images.includes(choisie) ? [choisie, ...images] : images;

    return (
        <div className="flex min-w-[18rem] flex-col gap-1.5">
            <label className="flex items-center gap-2 text-ui-9 font-black uppercase tracking-widest text-app-muted">
                <ImageIcon size={12} className="text-accent" />Bannière de l’en-tête
                <select
                    value={choisie}
                    onChange={e => onChange(e.target.value || undefined)}
                    className="min-w-0 flex-1 rounded-lg border border-app-border bg-app-bg px-2 py-1 text-xs font-medium normal-case tracking-normal text-app-text outline-none focus:border-accent/60"
                >
                    <option value="">Aucune</option>
                    {options.map(nom => <option key={nom} value={nom}>{nom}</option>)}
                </select>
            </label>
            {apercu ? (
                <div aria-hidden="true" className="h-6 w-full rounded border border-app-border bg-cover bg-center" style={{ backgroundImage: `url("${apercu}")` }} />
            ) : (
                <span className="text-ui-9 text-app-subtle">
                    {images.length === 0 ? `Aucune image dans ${racine ?? 'le dossier du jeu'}.` : 'Une image 4:1, recadrée sur sa bande centrale.'}
                </span>
            )}
        </div>
    );
};

export default ChoixDeLaBanniere;
