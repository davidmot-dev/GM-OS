import React from 'react';
import { MonitorPlay } from 'lucide-react';
import { useImageStore } from '../../image/useImageStore';
import type { AtlasMap } from '../useSessionOSStore';

/**
 * **Projeter l'image d'un lieu, d'un clic, sur l'écran par défaut d'Image-OS**
 * (L5, 2026-10-12). David : *« s'il y a un lieu, on projette l'image sur le
 * défaut d'Image-OS ; si c'est une battlemap, on la charge dans Map-OS »*.
 *
 * Même geste que « Projeter » dans la fiche de l'Atlas, sans le menu des
 * écrans : à la table, on n'a pas le temps de choisir. Un second clic retire
 * l'image.
 *
 * **Le lieu occupe l'écran sous SON identifiant, et non sous celui de son
 * image** — comme dans l'Atlas : c'est ce que lisent les écrans pour savoir ce
 * qui est à l'antenne.
 */
export const BoutonProjeterSurLEcranParDefaut: React.FC<{
    lieu: Pick<AtlasMap, 'id' | 'name' | 'fileUrl'>;
    className?: string;
}> = ({ lieu, className = '' }) => {
    const ecranParDefaut = useImageStore((e) => e.projectionTarget);
    const projections = useImageStore((e) => e.projections);
    const dejaALAntenne = projections[ecranParDefaut] === lieu.id;

    const basculer = async () => {
        const { ImageService } = await import('../../image/logic/ImageService');
        if (dejaALAntenne) {
            await ImageService.blackout(ecranParDefaut);
            return;
        }
        await ImageService.projectMedia(lieu.fileUrl, ecranParDefaut as never, lieu.id);
    };

    return (
        <button
            type="button"
            disabled={!lieu.fileUrl}
            aria-pressed={dejaALAntenne}
            title="Montrer ce lieu sur l'écran par défaut d'Image-OS"
            onClick={() => void basculer()}
            className={className}
        >
            <MonitorPlay size={12} /> {dejaALAntenne ? 'Retirer l’image' : 'Projeter l’image'}
        </button>
    );
};
