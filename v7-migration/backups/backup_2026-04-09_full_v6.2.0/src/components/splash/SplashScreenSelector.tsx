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
        <div className="fixed inset-0 z-[9999]">
            <SelectedSplash />
        </div>
    );
};

export default SplashScreenSelector;
