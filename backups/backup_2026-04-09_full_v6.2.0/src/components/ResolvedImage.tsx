import React from 'react';
import { useMediaUrl } from '../hooks/useMediaUrl';

interface ResolvedImageProps {
    src?: string;
    alt?: string;
    className?: string;
    fallback?: React.ReactNode;
    title?: string;
}

/**
 * A component that resolves a Media Hub ID (m-xxxx) or a direct URL
 * and renders an <img> tag.
 */
export const ResolvedImage: React.FC<ResolvedImageProps> = ({ 
    src, 
    alt = "", 
    className, 
    fallback,
    title
}) => {
    const resolvedUrl = useMediaUrl(src);

    if (!resolvedUrl && fallback) {
        return <div className={className}>{fallback}</div>;
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
