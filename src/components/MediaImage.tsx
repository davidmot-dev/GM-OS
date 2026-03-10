import React from 'react';
import { useMediaUrl } from '../hooks/useMediaUrl';

interface MediaImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    source: string | undefined;
}

/**
 * A reusable image component that automatically resolves Media IDs (m-...) 
 * using the useMediaUrl hook. Falls back to standard URLs.
 */
export const MediaImage: React.FC<MediaImageProps> = ({ source, alt, className, ...props }) => {
    const resolvedUrl = useMediaUrl(source);

    if (!resolvedUrl && source) {
        // While loading or if resolving failed, show a placeholder
        return <div className={`animate-pulse bg-app-surface/50 rounded-lg ${className}`} />;
    }

    return (
        <img 
            src={resolvedUrl} 
            alt={alt} 
            className={className}
            {...props}
        />
    );
};
