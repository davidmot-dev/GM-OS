import React from 'react';
import { useMediaUrl } from '../hooks/useMediaUrl';

interface ResolvedAssetProps {
    src?: string;
    isVideo?: boolean;
    alt?: string;
    className?: string;
    fallback?: React.ReactNode;
    title?: string;
}

/**
 * A component that resolves a Media Hub ID (m-xxxx) or a direct URL
 * and renders either an <img> tag or a <video> tag for thumbnails/previews.
 */
export const ResolvedAsset: React.FC<ResolvedAssetProps> = ({ 
    src, 
    isVideo = false,
    alt = "", 
    className, 
    fallback,
    title
}) => {
    const resolvedUrl = useMediaUrl(src);

    if (!resolvedUrl && fallback) {
        return <div className={className}>{fallback}</div>;
    }

    if (isVideo && resolvedUrl) {
        return (
            <video 
                src={resolvedUrl} 
                className={className}
                muted
                loop
                playsInline
                autoPlay
                title={title || alt}
            />
        );
    }

    return (
        <img 
            src={resolvedUrl || undefined} 
            alt={alt} 
            className={className} 
            title={title || alt}
        />
    );
};
