import React, { useState, useEffect } from 'react';
import ZenSplash from './ZenSplash';
import GrimoireSplash from './GrimoireSplash';
import RecoverySplash from './RecoverySplash';
import CyberpunkSplash from './CyberpunkSplash';

interface SplashScreenSelectorProps {
    onComplete: () => void;
}

const SplashScreenSelector: React.FC<SplashScreenSelectorProps> = ({ onComplete }) => {
    // Initializing state with a function ensures it only runs once and keeps the component pure
    const [SelectedSplash] = useState(() => {
        const splashes = [ZenSplash, GrimoireSplash, RecoverySplash, CyberpunkSplash];
        return splashes[Math.floor(Math.random() * splashes.length)];
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete();
        }, 5000);

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        /* `data-ecran-d-accueil` : la vitrine l'attend par ce nom — la palette porte les mêmes classes. */
        <div className="fixed inset-0 z-[9999]" data-ecran-d-accueil="">
            <SelectedSplash />
        </div>
    );
};

export default SplashScreenSelector;
