import { useEffect, type RefObject } from 'react';

/**
 * Hook qui déclenche une action lorsqu'on clique en dehors de l'élément référencé.
 * 
 * @param ref - Référence de l'élément à surveiller.
 * @param handler - Fonction à appeler lors du clic à l'extérieur.
 * @param active - Indique si le listener doit être actif (par défaut true).
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
    ref: RefObject<T | null>,
    handler: (event: MouseEvent | TouchEvent) => void,
    active: boolean = true
) {
    useEffect(() => {
        if (!active) return;

        const listener = (event: MouseEvent | TouchEvent) => {
            const el = ref?.current;
            
            // Ne rien faire si le clic est sur l'élément lui-même ou ses enfants
            if (!el || el.contains(event.target as Node)) {
                return;
            }

            handler(event);
        };

        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);

        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler, active]);
}
