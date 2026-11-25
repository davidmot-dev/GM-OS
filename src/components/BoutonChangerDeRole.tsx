import React from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { adresseDeLAccueil } from '../modules/tablette/roleDeLaTablette';

/**
 * **« Changer de rôle »** — Fire HD 8, registre § 256, T14 (24/11/2026). Discret, il ramène à
 * l'accueil des rôles sans rouvrir le rôle mémorisé (`choisir=1`). Un lien et non un geste : il
 * marche même quand la connexion au poste est tombée.
 */
export const BoutonChangerDeRole: React.FC<{ className?: string }> = ({ className = '' }) => (
    <a href={adresseDeLAccueil()} data-changer-de-role
        className={`flex min-h-[36px] items-center gap-1.5 rounded px-2 normal-case tracking-normal text-app-muted hover:text-app-text ${className}`}>
        <ArrowLeftRight size={14} aria-hidden /> Changer de rôle
    </a>
);
