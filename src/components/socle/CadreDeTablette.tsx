import type { HTMLAttributes } from 'react';
import { MotionConfig, useReducedMotion } from 'framer-motion';
import { usePerformanceControl } from '../../hooks/usePerformanceControl';
import './tablettes.css';

/**
 * T5, 2026-10-06, David : « commit, push et fais T5, GM-os est fermé ».
 * Le fini appartient au cadre des deux tablettes : leurs écrans gardent
 * leur disposition. Le mode léger et la préférence système éteignent les
 * mouvements décoratifs ; les durées fonctionnelles explicites (résultat
 * de quinze secondes, maintien de sept cents millisecondes) restent intactes.
 */
export function CadreDeTablette({ children, ...attributs }: HTMLAttributes<HTMLDivElement>) {
    const mouvementReduit = useReducedMotion();
    const { isLowGraphics } = usePerformanceControl();
    const reduit = mouvementReduit || isLowGraphics;
    return (
        <MotionConfig reducedMotion={isLowGraphics ? 'always' : 'user'} transition={{ duration: reduit ? 0 : 0.16 }}>
            <div {...attributs} data-tablette=""
                data-graphismes-legers={isLowGraphics ? '' : undefined}
                data-mouvement-reduit={reduit ? '' : undefined}>
                {children}
            </div>
        </MotionConfig>
    );
}
