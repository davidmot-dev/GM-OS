import { useEffect, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import PanneauDeJet from './PanneauDeJet';
import PaniqueAlien from './PaniqueAlien';
import { DiceEngine } from '../../../dice/DiceEngine';
import { appliquerLaPaniqueAlien, lireLaPaniqueAlien, type RegleDePaniqueAlien } from '../../../dice/systemes/paniqueAlien';
import { useSessionOSStore } from '../../useSessionOSStore';
import type { SheetTemplate } from '../../../../data/defaultSheetTemplates';
import type { DescripteurDeJet } from '../../../dice/DescripteurDeJet';
import type { Player } from '../../../../types/player.types';
import { CLE_JET_ALIEN, lireLeJetAlien } from '../../../dice/systemes/jetsAlien';
import { CLE_COMBAT_ALIEN, combatAlienVierge, lireLeCombatAlien } from '../../../dice/systemes/combatAlien';

vi.mock('../../../journal/consignerLeJet', () => ({ consignerLeJet: vi.fn() }));
vi.mock('../../../tables/pontDesTables', () => ({ pontDesTables: () => null }));
const regle: RegleDePaniqueAlien = { mecanique: 'alien', stress: 'stress', agilite: 'agilite', empathie: 'empathie', androide: 'androide', talents: 'talent' };
const jet: DescripteurDeJet = {
    sens: 'superieur-ou-egal', reserve: { base: 0, max: 10, faces: 6,
        composantes: [{ id: 'attribut', label: 'Attribut', sectionId: 'attributs' }, { id: 'competence', label: 'Compétence', sectionId: 'competences' }],
        secondaire: { label: 'Stress', libelleDuUn: 'Panique', composantes: [{ id: 'stress', label: 'Stress', sectionId: 'jauges' }] } },
    panique: { faces: 6, champ: 'panique', seuil: 7, suites: regle },
    reussiteDepensee: { champ: 'recit', label: 'Point de Récit' },
};
const template = { id: 'test', name: 'Alien fictif', sections: [
    { id: 'attributs', label: 'Attributs', fields: [{ id: 'agilite', label: 'Agilité', type: 'number' }] },
    { id: 'competences', label: 'Compétences', fields: [{ id: 'mobilite', label: 'Mobilité', type: 'number' }] },
    { id: 'jauges', label: 'Jauges', fields: [{ id: 'stress', label: 'Stress', type: 'number' }] },
] } as SheetTemplate;
let fiche: Record<string, unknown>;
function Hote({ donnees = {}, joueur = false, a2 = false, a3 = false }: { donnees?: Record<string, unknown>; joueur?: boolean; a2?: boolean; a3?: boolean }) {
    const [v, setV] = useState({ agilite: 2, mobilite: 0, stress: 4, empathie: 2, recit: 1, panique: 0, ...donnees });
    useEffect(() => { fiche = v; }, [v]);
    const combat = { sante:'sante',force:'agilite',endurance:'mobilite',protection:'protection',talents:'talent',proprietesArmes:'proprietes',stress:'stress',androide:'androide' };
    const config = a2 || a3 ? { ...jet, forcer: { garde: 'reussites' as const, monteeDeLaSeconde: 1, bloqueParLaSeconde: true }, reserve: { ...jet.reserve!, sansPlafond: true }, alien: { competence: 'competence', competences: { mobilite: a3 ? 'distance' as const : 'mobilite' as const }, equipement: { noms: 'armes', bonus: 'bonus', degats: 'degats', portees: 'portees' }, ...(a3 ? {combat} : {}) } } : jet;
    return <PanneauDeJet descripteur={config} dice={{ engine: 'yze', defaultDice: 'd6', logic: 'count-success', successThreshold: 6 }}
        template={template} valeurs={v} personnageId="pj" campaignId="c" pourLesJoueurs={joueur}
        ecrireSurLaFiche={m => setV(a => ({ ...a, ...m }))} />;
}
let de: ReturnType<typeof vi.spyOn>;
function faces(...valeurs: number[]) { de.mockImplementation(() => { const v = valeurs.shift(); if (v === undefined) throw new Error('Dé imprévu'); return v; }); }
function lancer() {
    const selects = screen.getAllByRole('combobox');
    ['agilite', 'mobilite', 'stress'].forEach((v, i) => fireEvent.change(selects[i], { target: { value: v } }));
    fireEvent.click(screen.getByRole('button', { name: 'Lancer' }));
}
beforeEach(() => { de = vi.spyOn(DiceEngine, 'roll'); });
afterEach(() => { cleanup(); de.mockRestore(); useSessionOSStore.setState({ players: [] }); });

describe('A1 : le jet Alien conserve son verdict et ses conséquences', () => {
    it('des six sont provisoires puis annulés à 10 ; le Point de Récit reste indisponible', () => {
        render(<Hote />);
        faces(6, 6, 1, 2, 2, 2); lancer();
        expect(screen.getByText(/Résultat provisoire/)).toBeTruthy();
        const recit = screen.getByRole('button', { name: /Dépenser un Point de Récit/ }) as HTMLButtonElement;
        expect(recit.disabled).toBe(true);
        faces(6); fireEvent.click(screen.getByRole('button', { name: 'Test de Panique' }));
        expect(screen.getByText(/Action annulée :/)).toBeTruthy();
        expect(fiche.stress).toBe(5);
        expect(fiche.recit).toBe(1);
        fireEvent.click(recit);
        expect(fiche.recit).toBe(1);
        expect(screen.getByText(/^0 réussite/)).toBeTruthy();
    });
    it('Nerfs d’acier donne 8 au lieu de 10 ; Tremblement retire deux dés au prochain jet d’Agilité', () => {
        render(<Hote donnees={{ talent: 'Nerfs d’acier' }} />);
        faces(6, 2, 1, 2, 2, 2); lancer();
        faces(6); fireEvent.click(screen.getByRole('button', { name: 'Test de Panique' }));
        expect(fiche.panique).toBe(8);
        expect(screen.getByText(/Tremblement : −2 dés/)).toBeTruthy();
        de.mockClear(); faces(2, 2, 2, 2);
        fireEvent.click(screen.getByRole('button', { name: 'Lancer' }));
        expect(de).toHaveBeenCalledTimes(4);
        fireEvent.click(screen.getByRole('button', { name: 'Commandement réussi' }));
        expect(fiche.panique).toBe(0);
        expect(fiche.stress).toBe(4);
    });
    it('un effet rechargé ne regagne pas de Stress et la tablette ne choisit pas les alliés', () => {
        const donnees = { stress: 4, ...appliquerLaPaniqueAlien(regle, 'panique', { stress: 4 }, 'ancien', 10) };
        render(<Hote donnees={JSON.parse(JSON.stringify(donnees))} joueur />);
        expect(fiche.stress).toBe(5);
        expect(screen.getByText('Figé (10)')).toBeTruthy();
        expect(screen.queryByText(/Contagion : choisir/)).toBeNull();
        expect(screen.queryByRole('button', { name: 'Demander un test de Panique' })).toBeNull();
        expect(de).not.toHaveBeenCalled();
    });
    it('un bilan de traumatisme lance seulement Empathie, et la réussite provoque le traumatisme', async () => {
        const donnees = appliquerLaPaniqueAlien(regle, 'panique', { stress: 4 }, 'fuite', 13);
        render(<Hote donnees={donnees} />);
        faces(6, 2, 3);
        fireEvent.click(screen.getByRole('button', { name: /Bilan de séance/ }));
        await waitFor(() => expect(lireLaPaniqueAlien(fiche).traumaEnAttente).toBe(false));
        expect(de).toHaveBeenCalledTimes(3); // 2 dés d'Empathie, un D6 de traumatisme.
        expect(lireLaPaniqueAlien(fiche).traumatismes[0]).toContain('résultat 3');
        expect(screen.queryByRole('button', { name: /Bilan de séance/ })).toBeNull();
    });
    it('une demande de Panique sans jet de compétence est consommée une fois', () => {
        render(<Hote />);
        fireEvent.click(screen.getByRole('button', { name: 'Demander un test de Panique' }));
        expect(lireLaPaniqueAlien(fiche).demandes).toHaveLength(1);
        faces(3);
        fireEvent.click(screen.getByRole('button', { name: 'Résoudre cette Panique' }));
        expect(fiche.panique).toBe(7);
        expect(fiche.stress).toBe(5);
        expect(lireLaPaniqueAlien(fiche).demandes).toEqual([]);
    });
    it('la contagion vise seulement les PJ choisis de la campagne et ne se répète pas', () => {
        const characters = [
            { id: 'ami', name: 'Ami', campaignId: 'c', sheetData: { stress: 2 } },
            { id: 'autre', name: 'Autre campagne', campaignId: 'autre', sheetData: { stress: 2 } },
            { id: 'synthetique', name: 'Androïde', campaignId: 'c', sheetData: { androide: true, stress: 2 } },
        ];
        useSessionOSStore.setState({ players: [{ id: 'joueur', realName: 'Test', avatarUrl: '', isOnline: false,
            characters: characters.map(c => ({ ...c, portraitUrl: '', templateId: 'test' })) }] as Player[] });
        const v = { ...appliquerLaPaniqueAlien(regle, 'panique', { stress: 2 }, 'fige', 10), stress: 3 };
        function Cible() {
            const [donnees, setDonnees] = useState<Record<string, unknown>>(v);
            return <PaniqueAlien regle={regle} champPanique="panique" valeurs={donnees} ecrire={m => setDonnees(a => ({ ...a, ...m }))}
                personnageId="pj" campaignId="c" pourLesJoueurs={false} consigner={vi.fn()} />;
        }
        render(<Cible />);
        expect(screen.queryByLabelText('Autre campagne')).toBeNull();
        expect(screen.queryByLabelText('Androïde')).toBeNull();
        fireEvent.click(screen.getByLabelText('Ami'));
        fireEvent.click(screen.getByRole('button', { name: /Appliquer la contagion de Figé/ }));
        expect(useSessionOSStore.getState().players[0].characters[0].sheetData?.stress).toBe(3);
        expect(useSessionOSStore.getState().players[0].characters[1].sheetData?.stress).toBe(2);
    });
});

describe('A3 : tir et chargeur sur le vrai panneau', () => {
    it('monte le Stress avant le tir auto, attend la Panique puis vide et recharge une seule fois', () => {
        render(<Hote a3 donnees={{sante:2,stress:0,armes:'Fusil',bonus:'+1',degats:'2',portees:'Longue',proprietes:'munitions, mode auto',
            [CLE_COMBAT_ALIEN]:{...combatAlienVierge(),armes:{'0':{vide:false,chargeurs:1}}}}} />);
        fireEvent.change(screen.getByLabelText('Arme de la fiche'),{target:{value:'0'}});
        // La préparation de tir paraît après choix de compétence.
        const selects = screen.getAllByRole('combobox'); ['agilite','mobilite','stress'].forEach((v,i)=>fireEvent.change(selects[i],{target:{value:v}}));
        fireEvent.click(screen.getByLabelText(/Mode automatique/));
        faces(6,2,2,2,2,1); fireEvent.click(screen.getByRole('button',{name:'Lancer'}));
        expect(fiche.stress).toBe(1); expect(lireLeCombatAlien(fiche).armes['0'].vide).toBe(false);
        faces(6); fireEvent.click(screen.getByRole('button',{name:'Test de Panique'}));
        expect(lireLeCombatAlien(fiche).armes['0'].vide).toBe(true);
        const recharge = screen.getByRole('button',{name:'Recharger — action lente'}) as HTMLButtonElement;
        fireEvent.click(recharge); expect(lireLeCombatAlien(fiche).armes['0']).toEqual({vide:false,chargeurs:0});
        expect(recharge.disabled).toBe(true);
    });
    it('un humain Brisé ne lance aucun test ordinaire', () => {
        render(<Hote a3 donnees={{sante:0}} />);
        const selects = screen.getAllByRole('combobox'); ['agilite','mobilite','stress'].forEach((v,i)=>fireEvent.change(selects[i],{target:{value:v}}));
        expect((screen.getByRole('button',{name:'Lancer'}) as HTMLButtonElement).disabled).toBe(true);
        expect(de).not.toHaveBeenCalled();
    });
});

describe('A2 : préparer, opposer et dépenser sans rejouer un budget', () => {
    it('le défenseur transmet ses réussites et ne force jamais', () => {
        render(<Hote a2 donnees={{ stress: 0 }} />);
        fireEvent.change(screen.getByLabelText('Rôle dans le test'), { target: { value: 'defenseur' } });
        faces(6, 2); lancer();
        expect((screen.getByRole('button', { name: /Forcer le jet/ }) as HTMLButtonElement).disabled).toBe(true);
        expect(lireLeJetAlien(fiche)).toMatchObject({ role: 'defenseur', reussites: 1 });
        expect(screen.getByText('1 réussite(s) de défense à transmettre. Le défenseur ne peut pas forcer.')).toBeTruthy();
    });
    it('garde un bonus d’arme et trois aides au-delà de dix dés', () => {
        render(<Hote a2 donnees={{ agilite: 5, mobilite: 5, stress: 0, armes: 'Outil', bonus: '+2', degats: '1', portees: 'Contact' }} />);
        fireEvent.change(screen.getByLabelText('Arme de la fiche'), { target: { value: '0' } });
        fireEvent.change(screen.getByLabelText('Personnes qui aident'), { target: { value: '3' } });
        de.mockReturnValue(2); lancer();
        expect(de).toHaveBeenCalledTimes(15);
        expect(lireLeJetAlien(fiche)?.equipement).toMatchObject({ nom: 'Outil', bonus: 2, degats: 1, portee: 'Contact' });
    });
    it('applique un malus au Stress restant et explique un test sans dés', () => {
        render(<Hote a2 donnees={{ stress: 3 }} />);
        fireEvent.change(screen.getByLabelText('Modificateur de situation'), { target: { value: '-4' } });
        faces(2); lancer(); expect(de).toHaveBeenCalledTimes(1);
        fireEvent.change(screen.getByLabelText('Modificateur de situation'), { target: { value: '-5' } });
        expect((screen.getByRole('button', { name: 'Lancer' }) as HTMLButtonElement).disabled).toBe(true);
        expect(screen.getByText(/Aucun dé ne reste/)).toBeTruthy();
    });
    it('attend l’opposition, consomme un seul excédent puis retrouve le choix après remontage', () => {
        const rendu = render(<Hote a2 donnees={{ agilite: 4, stress: 0 }} />);
        fireEvent.change(screen.getByLabelText('Rôle dans le test'), { target: { value: 'attaquant' } });
        faces(6, 6, 6, 2); lancer();
        expect((screen.getByRole('button', { name: 'Préparer le prochain test' }) as HTMLButtonElement).disabled).toBe(true);
        fireEvent.change(screen.getByLabelText('Réussites du défenseur'), { target: { value: '1' } });
        fireEvent.click(screen.getByRole('button', { name: 'Résoudre l’opposition' }));
        fireEvent.click(screen.getByRole('button', { name: 'Préparer le prochain test' }));
        expect(lireLeJetAlien(fiche)?.eclats).toHaveLength(1);
        expect((screen.getByRole('button', { name: /Dépenser un Point de Récit/ }) as HTMLButtonElement).disabled).toBe(true);
        const sauvegarde = JSON.parse(JSON.stringify(fiche)); rendu.unmount();
        render(<Hote a2 donnees={sauvegarde} />);
        expect(lireLeJetAlien(fiche)?.defense).toBe(1);
        expect(screen.getByText('Actions d’éclat disponibles : 0.')).toBeTruthy();
        expect(fiche[CLE_JET_ALIEN]).toBeDefined();
    });
});
