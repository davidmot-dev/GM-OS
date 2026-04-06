import { useEffect } from 'react';
import { keyboardEngine } from './KeyboardEngine';

export const useKeyboardControls = () => {
    useEffect(() => {
        // Initialiser via le singleton pour éviter la duplication des listeners
        keyboardEngine.initialize();
    }, []);
};
