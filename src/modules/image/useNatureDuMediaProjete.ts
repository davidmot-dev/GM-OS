import { useEffect, useState } from 'react';
import { useMediaStore } from '../../stores/useMediaStore';
import { PREFIXE_YOUTUBE } from '../web/youtube';

type Nature = 'image' | 'video' | 'youtube' | 'unknown';

/** Les marqueurs se lisent au rendu ; seule la base demande un chargement. */
export function useNatureDuMediaProjete(source: string | null): Nature {
    const getMediaBlob = useMediaStore(s => s.getMediaBlob);
    const estEnBase = useMediaStore(s => s.mediaList.some(m => m.id === source));
    const [lecture, setLecture] = useState<{
        source: string; lecteur: typeof getMediaBlob; estEnBase: boolean; nature: Nature;
    } | null>(null);

    useEffect(() => {
        if (!source?.startsWith('m-')) return;
        let abandonnee = false;
        const lire = async () => {
            let nature: Nature = 'image';
            try {
                const blob = await getMediaBlob(source);
                nature = blob?.type.startsWith('video/') ? 'video' : 'image';
            } catch (raison) {
                if (!abandonnee) console.warn('[ProjectorView] Type du média indisponible :', raison);
            }
            if (!abandonnee) setLecture({ source, lecteur: getMediaBlob, estEnBase, nature });
        };
        void lire();
        return () => { abandonnee = true; };
    }, [source, getMediaBlob, estEnBase]);

    if (source?.startsWith(PREFIXE_YOUTUBE)) return 'youtube';
    if (!source || source.startsWith('__')) return 'unknown';
    if (!source.startsWith('m-')) return 'image';
    return lecture?.source === source && lecture.lecteur === getMediaBlob && lecture.estEnBase === estEnBase
        ? lecture.nature : 'unknown';
}
