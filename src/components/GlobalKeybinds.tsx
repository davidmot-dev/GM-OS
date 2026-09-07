import React from 'react';
import { useKeyboardControls as useSoundKeyboardControls } from '../modules/sound/useKeyboardControls';
import { useMusicKeyboardControls } from '../modules/music/useMusicKeyboardControls';
import { useLightKeyboardControls } from '../modules/light/useLightKeyboardControls';

export const GlobalKeybinds: React.FC = () => {
    // Mount the keyboard listener hooks here so they run globally out of the box
    useSoundKeyboardControls();
    useMusicKeyboardControls();
    /*
      Light-OS entre ici le 2026-09-07, et **c'est le bon endroit** : une scène
      qu'il faudrait ouvrir Light-OS pour lancer n'aurait aucun intérêt. Le
      geste existe pour changer l'ambiance sans quitter ses notes.
    */
    useLightKeyboardControls();

    // This component renders nothing, it just sets up global listeners
    return null;
};
