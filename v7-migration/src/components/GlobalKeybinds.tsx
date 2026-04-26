import React from 'react';
import { useKeyboardControls as useSoundKeyboardControls } from '../modules/sound/useKeyboardControls';
import { useMusicKeyboardControls } from '../modules/music/useMusicKeyboardControls';

export const GlobalKeybinds: React.FC = () => {
    // Mount the keyboard listener hooks here so they run globally out of the box
    useSoundKeyboardControls();
    useMusicKeyboardControls();

    // This component renders nothing, it just sets up global listeners
    return null;
};
