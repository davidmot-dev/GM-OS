import React, { useEffect, useRef, useState } from 'react';
import { Music, Film, FileText } from 'lucide-react';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import type { MediaItem } from '../../../stores/useMediaStore';
import { useTranslation } from 'react-i18next';
import {
    ondeDuSon, dureeLisible, estDuTexte, debutDuTexte, TAILLE_MAX_POUR_L_ONDE,
    estUnPdf, premierePageDuPdf, TAILLE_MAX_POUR_LA_PAGE,
} from '../../../components/media/apercuDesMedias';

interface MediaItemThumbnailProps {
    media: MediaItem;
}

/** La durée en coin, sur toutes les vignettes qui en ont une. */
const Duree: React.FC<{ secondes: number | null }> = ({ secondes }) => (
    secondes !== null && Number.isFinite(secondes)
        ? <span className="absolute bottom-2 left-2 rounded bg-app-bg/85 px-1.5 py-0.5 font-mono text-ui-9 font-bold text-app-text">{dureeLisible(secondes)}</span>
        : null
);

/** Vrai quand l'élément entre à l'écran — et le reste : on ne décode qu'une fois. */
function useVisible<T extends Element>(): [React.RefObject<T | null>, boolean] {
    const ref = useRef<T>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el || visible) return;
        if (typeof IntersectionObserver === 'undefined') { setVisible(true); return; }
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { rootMargin: '200px' });
        obs.observe(el);
        return () => obs.disconnect();
    }, [visible]);
    return [ref, visible];
}

/**
 * **Le son montre sa forme d'onde et sa durée.** L'onde n'est calculée qu'une
 * fois la vignette à l'écran, une seule à la fois pour toute la grille ; au-delà
 * de 40 Mo on s'en tient à la durée, lue dans les métadonnées.
 */
const VignetteDuSon: React.FC<{ media: MediaItem; url: string }> = ({ media, url }) => {
    const { t } = useTranslation('modules');
    const [ref, visible] = useVisible<HTMLDivElement>();
    const [cretes, setCretes] = useState<number[] | null>(null);
    const [duree, setDuree] = useState<number | null>(null);

    useEffect(() => {
        if (!visible) return;
        let vivant = true;
        if (media.size <= TAILLE_MAX_POUR_L_ONDE) {
            void ondeDuSon(media.id, url).then(a => { if (vivant && a) { setCretes(a.cretes); setDuree(a.duree); } });
        } else {
            const son = new Audio();
            son.preload = 'metadata';
            son.onloadedmetadata = () => { if (vivant) setDuree(son.duration); };
            son.src = url;
        }
        return () => { vivant = false; };
    }, [visible, media.id, media.size, url]);

    return (
        <div ref={ref} className="relative flex h-full w-full flex-col items-center justify-center gap-2 bg-app-surface-2 px-3">
            {cretes ? (
                <div className="flex h-1/2 w-full items-center gap-[2px]" aria-label={t('image.thumbnail.audio')}>
                    {cretes.map((c, i) => (
                        <span key={i} className="flex-1 rounded-full bg-accent" style={{ height: `${Math.max(6, c * 100)}%`, opacity: 0.45 + c * 0.55 }} />
                    ))}
                </div>
            ) : (
                <Music size={30} className="text-accent/70" />
            )}
            <Duree secondes={duree} />
        </div>
    );
};

/** **La vidéo montre sa première image** — et sa durée. `#t=0.1` force le décodage d'une image. */
const VignetteDeVideo: React.FC<{ url: string }> = ({ url }) => {
    const [duree, setDuree] = useState<number | null>(null);
    return (
        <div className="relative h-full w-full bg-fixe-noir">
            <video
                src={`${url}#t=0.1`}
                preload="metadata"
                muted
                onLoadedMetadata={e => setDuree(e.currentTarget.duration)}
                className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="flex size-10 items-center justify-center rounded-full border border-fixe-blanc/30 bg-fixe-noir/50 text-fixe-blanc/90">
                    <Film size={18} />
                </span>
            </div>
            <Duree secondes={duree} />
        </div>
    );
};

/**
 * **Le document montre son début** — le texte (markdown, txt) ses premières
 * lignes, le PDF sa première page (pdf.js, jusqu'à 100 Mo). Le reste, ou un
 * PDF illisible, garde l'icône.
 */
const VignetteDeDocument: React.FC<{ media: MediaItem; url: string }> = ({ media, url }) => {
    const { t } = useTranslation('modules');
    const [ref, visible] = useVisible<HTMLDivElement>();
    const [lignes, setLignes] = useState<string[] | null>(null);
    const [page, setPage] = useState<string | null>(null);
    const texte = estDuTexte(media.name);
    const pdf = estUnPdf(media.name) && media.size <= TAILLE_MAX_POUR_LA_PAGE;
    const ext = media.name.split('.').pop()?.toUpperCase() ?? 'DOC';

    useEffect(() => {
        if (!visible) return;
        let vivant = true;
        if (texte) {
            fetch(url).then(r => r.text()).then(tx => { if (vivant) setLignes(debutDuTexte(tx)); }).catch(() => { /* l'icône reste */ });
        } else if (pdf) {
            void premierePageDuPdf(media.id, url).then(p => { if (vivant) setPage(p); });
        }
        return () => { vivant = false; };
    }, [visible, texte, pdf, media.id, url]);

    if (page) {
        return (
            <div ref={ref} className="relative h-full w-full bg-app-surface-2">
                <img src={page} alt={media.name} className="h-full w-full object-cover object-top" />
                <span className="absolute bottom-2 left-2 rounded bg-app-bg/85 px-1.5 py-0.5 text-ui-9 font-black uppercase tracking-widest text-app-text">{ext}</span>
            </div>
        );
    }
    if (texte && lignes && lignes.length > 0) {
        return (
            <div ref={ref} className="h-full w-full overflow-hidden bg-app-surface-2 p-3 pt-8">
                <p className="mb-1 truncate text-xs font-bold text-app-text">{lignes[0]}</p>
                {lignes.slice(1).map((l, i) => <p key={i} className="truncate font-mono text-ui-10 leading-relaxed text-app-muted">{l}</p>)}
            </div>
        );
    }
    return (
        <div ref={ref} className="flex h-full w-full flex-col items-center justify-center gap-2 bg-app-surface-2">
            <FileText size={32} className="text-accent/70" />
            <span className="text-ui-10 font-black uppercase tracking-widest text-app-muted">{t('image.thumbnail.document', { ext })}</span>
        </div>
    );
};

export const MediaItemThumbnail: React.FC<MediaItemThumbnailProps> = ({ media }) => {
    const url = useMediaUrl(media.id);

    if (!url) {
        return <div className="w-full h-full bg-app-bg/50 flex items-center justify-center animate-pulse" />;
    }

    if (media.type === 'image') {
        return <img src={url} alt={media.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />;
    }
    if (media.type === 'video') return <VignetteDeVideo url={url} />;
    if (media.type === 'audio') return <VignetteDuSon media={media} url={url} />;
    if (media.type === 'document') return <VignetteDeDocument media={media} url={url} />;
    return null;
};
