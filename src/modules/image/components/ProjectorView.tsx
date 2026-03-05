import React, { useEffect, useState } from 'react';

const ProjectorView: React.FC = () => {
    const [imagePath, setImagePath] = useState<string | null>(null);

    useEffect(() => {
        // Hide scrollbars and set black background
        document.body.style.overflow = 'hidden';
        document.body.style.backgroundColor = '#000';
        document.body.style.margin = '0';
        document.body.style.padding = '0';

        // Listen for IPC updates
        // @ts-expect-error global
        if (window.appBridge?.on) {
            // @ts-expect-error global
            window.appBridge.on('image:update-display', (_event, paths: string[]) => {
                if (paths && paths.length > 0 && paths[0]) {
                    setImagePath(paths[0]);
                } else {
                    setImagePath(null); // Blackout
                }
            });
        }

        return () => {
            document.body.style.overflow = '';
            document.body.style.backgroundColor = '';
        };
    }, []);

    if (!imagePath) {
        return <div className="w-screen h-screen bg-black" />; // Blackout
    }

    const safePath = imagePath.startsWith('http') || imagePath.startsWith('file://') || imagePath.startsWith('data:')
        ? imagePath
        // @ts-expect-error global
        : (window.appBridge?.utils?.formatFileUrl ? window.appBridge.utils.formatFileUrl(imagePath) : imagePath.replace(/\\/g, '/'));

    return (
        <div className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden">
            <img
                src={safePath}
                alt="Projection"
                className="max-w-full max-h-full object-contain transition-opacity duration-1000 animate-in fade-in"
                style={{
                    // Optional styling if we want it to cover instead of contain
                    // objectFit: 'contain' by default with tailwind object-contain
                }}
            />
        </div>
    );
};

export default ProjectorView;
