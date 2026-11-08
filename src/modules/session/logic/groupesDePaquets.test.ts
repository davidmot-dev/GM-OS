import { describe, it, expect } from 'vitest';
import { grouperParPilote, paquetsDuFiltre } from './groupesDePaquets';
import type { DeckManifest } from '../store/types';

const paquet = (id: string, systemId: string): DeckManifest => ({
    id, name: id, systemId, folderPath: `assets/decks/${id}`, cardCount: 1,
    format: 'poker', orientation: 'portrait', useDiscard: true,
});

const BIBLIOTHEQUE = [
    paquet('tarot', 'generic'),
    paquet('replicants', 'blade-runner'),
    paquet('action', 'torg'),
    paquet('destin', 'torg'),
    paquet('alien', 'alien'),
];
const NOMS: Record<string, string> = { generic: 'Générique', torg: 'Torg Eternity', 'blade-runner': 'Blade Runner', alien: 'Alien' };
const nommer = (id: string) => NOMS[id] ?? id;

describe('les paquets rangés par pilote (08/11/2026)', () => {
    it('le jeu de la campagne d’abord, les autres par nom, les génériques en dernier', () => {
        const groupes = grouperParPilote(BIBLIOTHEQUE, 'torg', nommer);
        expect(groupes.map(g => g.systemId)).toEqual(['torg', 'alien', 'blade-runner', 'generic']);
        expect(groupes[0].paquets.map(p => p.id)).toEqual(['action', 'destin']);
    });

    it('filtrer sur un pilote ne garde que ses paquets, sans les génériques', () => {
        expect(paquetsDuFiltre(BIBLIOTHEQUE, 'torg', 'alien').map(p => p.id)).toEqual(['action', 'destin']);
    });

    it('« actif » reste la règle commune : le jeu de la campagne et les génériques', () => {
        expect(paquetsDuFiltre(BIBLIOTHEQUE, 'actif', 'torg').map(p => p.id)).toEqual(['tarot', 'action', 'destin']);
    });

    it('un pilote sans paquet ne laisse pas une liste vide : retour à tous', () => {
        expect(paquetsDuFiltre(BIBLIOTHEQUE, 'nephilim', 'torg')).toHaveLength(5);
    });
});
