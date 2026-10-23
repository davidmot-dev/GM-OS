import { useState } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';

const consigne = vi.fn();
vi.mock('../../../journal/consignerLeJet', () => ({ consignerLeJet: (e: unknown) => consigne(e) }));

import PanneauDeJet from './PanneauDeJet';
import { useSessionOSStore } from '../../useSessionOSStore';
import { useCombatStore } from '../../../combat/useCombatStore';
import { DiceEngine } from '../../../dice/DiceEngine';
import type { DescripteurDeJet } from '../../../dice/DescripteurDeJet';
import type { SheetTemplate } from '../../../../data/defaultSheetTemplates';
import type { DiceConfig } from '../../../../types/drivers';

/**
 * **Potentiel GARDE Compétence au panneau** — Crimes, C1 (2026-10-22). Le
 * jet du pilote corrigé (`outils/crime/corriger_le_jet_garde.py`) sur une
 * fiche réduite : Physique, Sport et deux spécialisations de Sport.
 */
const JET: DescripteurDeJet = {
    reserve: { base: 0, max: 10, faces: 10, composantes: [{ id: 'potentiel', label: 'Potentiel', sectionId: 'potentiels' }] },
    sens: 'superieur-ou-egal',
    garde: {
        competence: { id: 'competence', label: 'Compétence', sectionId: 'competences' },
        seuil: 9, competent: 1, specialise: 2,
        specialisations: { parCompetence: { sport: 'specialties_sport_' } },
    },
} as DescripteurDeJet;
const FICHE = {
    id: 'crime', name: 'Crimes',
    sections: [
        { id: 'potentiels', label: 'Potentiels', fields: [{ id: 'physique', label: 'Physique', type: 'number', defaultValue: 0 }] },
        { id: 'competences', label: 'Compétences', fields: [{ id: 'sport', label: 'Sport', type: 'number', defaultValue: 0 }] },
        { id: 'specialisations', label: 'Spécialisations', fields: [
            { id: 'specialties_sport_climbing', label: 'Sport — Escalade', type: 'checkbox', defaultValue: false },
            { id: 'specialties_sport_riding', label: 'Sport — Équitation', type: 'checkbox', defaultValue: false },
        ] },
    ],
} as unknown as SheetTemplate;
const DICE = { defaultDice: 'D10', logic: 'count-success', engine: 'pool' } as unknown as DiceConfig;

let de: ReturnType<typeof vi.spyOn>;
const faces = (...f: number[]) => de.mockImplementation(() => f.shift() ?? 5);
beforeEach(() => { de = vi.spyOn(DiceEngine, 'roll'); consigne.mockClear(); });
afterEach(() => { cleanup(); de.mockRestore(); });

const monter = (valeurs: Record<string, unknown>) => {
    render(<PanneauDeJet descripteur={JET} dice={DICE} template={FICHE} valeurs={valeurs} />);
    const [potentiel, competence] = screen.getAllByRole('combobox');
    fireEvent.change(potentiel, { target: { value: 'physique' } });
    fireEvent.change(competence, { target: { value: 'sport' } });
};
const lancer = () => fireEvent.click(screen.getByText('Lancer', { exact: true }));
const desDuResultat = () => Array.from(document.querySelectorAll('[data-panneau-de-jet] .min-w-11')) as HTMLElement[];

describe('le jet gardé de Crimes', () => {
    it('l’exemple du livre : Physique 5, Sport 2, [1, 3, 4, 6, 8] → on garde 1 et 8, réussite mitigée', () => {
        monter({ physique: 5, sport: 2 });
        expect(within(document.querySelector('[data-garde]') as HTMLElement).getByText('8')).toBeTruthy();
        faces(1, 3, 4, 6, 8);
        lancer();
        expect(screen.getAllByText('Réussite mitigée').length).toBeGreaterThan(0);
        expect(screen.getByText(/gardés 1, 8 \(seuil 8\)/)).toBeTruthy();
        expect(desDuResultat().filter(d => d.textContent?.includes('Écarté'))).toHaveLength(3);
        // Ni dés à acheter, ni « fléau » : le Potentiel dit le nombre de dés, le bilan compte les 1.
        expect(screen.getByText('Dés', { exact: true }).closest('div')?.className).toContain('hidden');
        expect(screen.queryByText(/fléau/i)).toBeNull();
        expect(consigne).toHaveBeenCalledWith(expect.objectContaining({
            titre: 'Physique 5 · Sport 2', degre: 'reussite-normale', tagSuccess: true,
        }));
    });

    it('la spécialisation cochée baisse le seuil à 7 ; un succès important dit sa Névrose', () => {
        monter({ physique: 4, sport: 3, specialties_sport_climbing: true });
        const specialisation = screen.getByRole('combobox', { name: /Spécialisation/ }) as HTMLSelectElement;
        expect(Array.from(specialisation.options).map(o => o.textContent)).toEqual(['— aucune —', 'Escalade']);
        fireEvent.change(specialisation, { target: { value: 'specialties_sport_climbing' } });
        faces(7, 7, 9, 2);
        lancer();
        expect(screen.getAllByText('Réussite — succès important').length).toBeGreaterThan(0);
        expect(screen.getByText('Succès important : −1 Névrose.')).toBeTruthy();
    });

    it('sans compétence, un seul dé gardé au seuil de 9 (Rachel Attar, p. 411)', () => {
        monter({ physique: 3, sport: 0 });
        faces(8, 6, 5);
        lancer();
        expect(screen.getByText(/gardés 8 \(seuil 9\)/)).toBeTruthy();
        expect(screen.getByText('Échec : +1 Névrose.')).toBeTruthy();
    });

    it('échouer volontairement : garder un mauvais dé, puis le consigner', () => {
        monter({ physique: 3, sport: 1 });
        faces(9, 3, 2);
        lancer();
        expect(screen.getAllByText('Réussite').length).toBeGreaterThan(0);
        expect(screen.queryByText('Consigner cette garde')).toBeNull();
        fireEvent.click(desDuResultat()[1]);
        expect(screen.getByText(/gardés 3 \(seuil 8\)/)).toBeTruthy();
        expect(screen.getByText('1 réussite non gardée : +1 Névrose.')).toBeTruthy();
        consigne.mockClear();
        fireEvent.click(screen.getByText('Consigner cette garde'));
        expect(consigne).toHaveBeenCalledWith(expect.objectContaining({
            titre: 'Physique 3 · Sport 1 · garde choisie', tagSuccess: false,
        }));
        expect(screen.queryByText('Consigner cette garde')).toBeNull();
    });

    it('les 1 restent gardés : on ne les échange pas', () => {
        monter({ physique: 3, sport: 1 });
        faces(1, 9, 9);
        lancer();
        expect(screen.getAllByText('Échec critique').length).toBeGreaterThan(0);
        expect(desDuResultat().some(d => d.getAttribute('role') === 'button')).toBe(false);
    });
});

/**
 * **Les atteintes et le dépassement** — C2 et C3 (2026-10-22). Un hôte qui
 * garde la fiche, comme l'éditeur du meneur : ce que le panneau écrit revient.
 */
const JET_C2: DescripteurDeJet = {
    ...JET,
    garde: {
        ...JET.garde!,
        atteintes: { parPotentiel: { physique: { fatigue: 'fatigue_physique', epuisement: 'epuisement_physique', blessures: 'blessures_physique' } }, incapacite: 'physique' },
        depassement: { champ: 'depassement_de_la_scene' },
    },
};
const ecrits = vi.fn();
function Hote({ depart }: { depart: Record<string, unknown> }) {
    const [valeurs, setValeurs] = useState(depart);
    return <PanneauDeJet descripteur={JET_C2} dice={DICE} template={FICHE} valeurs={valeurs}
        ecrireSurLaFiche={maj => { ecrits(maj); setValeurs(v => ({ ...v, ...maj })); }} />;
}
const monterC2 = (depart: Record<string, unknown>) => {
    ecrits.mockClear();
    render(<Hote depart={depart} />);
    const [potentiel, competence] = screen.getAllByRole('combobox');
    fireEvent.change(potentiel, { target: { value: 'physique' } });
    fireEvent.change(competence, { target: { value: 'sport' } });
};

describe('les atteintes et le dépassement de Crimes', () => {
    it('une blessure posée à la carte retire un dé au prochain jet, et le calcul le dit', () => {
        monterC2({ physique: 5, sport: 2 });
        const ligne = document.querySelector('[data-atteintes-du-potentiel="physique"]') as HTMLElement;
        fireEvent.click(within(ligne).getByText('+ Blessure'));
        expect(ecrits).toHaveBeenLastCalledWith({ fatigue_physique: 0, epuisement_physique: 0, blessures_physique: 1 });
        expect(within(ligne).getByText('4')).toBeTruthy();
        expect(screen.getByText(/− 1 \(atteintes\)/)).toBeTruthy();
        expect(consigne).toHaveBeenCalledWith(expect.objectContaining({ titre: 'Atteintes', totalDisplay: 'Physique : +1 Blessure → actuel 4' }));
        faces(9, 9, 9, 9, 9);
        lancer();
        expect(de).toHaveBeenCalledTimes(4);
    });

    it('à Physique 0, la carte dit « hors de combat », sans mort', () => {
        monterC2({ physique: 2, sport: 2, blessures_physique: 2 });
        expect(screen.getByText(/^Hors de combat/)).toBeTruthy();
    });

    it('se dépasser : annoncé avant, deux réussites de plus, deux fatigues, une fois par scène', () => {
        monterC2({ physique: 5, sport: 2 });
        fireEvent.click(document.querySelector('[data-depassement]') as HTMLElement);
        faces(9, 9, 8, 8, 3);
        lancer();
        expect(screen.getAllByText('Réussite').length).toBeGreaterThan(0);
        fireEvent.click(screen.getByText('Se dépasser : +2 réussites (2 fatigue)'));
        expect(ecrits).toHaveBeenLastCalledWith({ fatigue_physique: 2, depassement_de_la_scene: 1 });
        expect(screen.getAllByText('Réussite — succès important').length).toBeGreaterThan(0);
        expect(screen.getByText(/dont 2 par dépassement/)).toBeTruthy();
        expect(consigne).toHaveBeenLastCalledWith(expect.objectContaining({ titre: 'Physique 5 · Sport 2 · dépassement' }));
        // La scène ne permet plus de se dépasser, et le Potentiel actuel a baissé de deux.
        expect((document.querySelector('[data-depassement]') as HTMLInputElement).disabled).toBe(true);
        expect(screen.getByText(/− 2 \(atteintes\)/)).toBeTruthy();
    });

    it('sans annonce, pas de dépassement proposé', () => {
        monterC2({ physique: 5, sport: 2 });
        faces(9, 9, 8, 8, 3);
        lancer();
        expect(screen.queryByText(/Se dépasser :/)).toBeNull();
    });
});

/** **Les points d'enquête du jet** — C5 (2026-10-22), p. 436 : au meneur, dans les styles possédés. */
describe('les points d’enquête proposés après un jet de Crimes', () => {
    const PILOTE = Object.freeze({ enquete: { styles: [
        { id: 'limier', label: 'Limier', niveau: 'limier', points: 'compteur_limier' },
        { id: 'conde', label: 'Condé', niveau: 'conde', points: 'compteur_conde' },
    ] } });
    const initial = useSessionOSStore.getState();
    afterEach(() => useSessionOSStore.setState(initial, true));

    it('deux réussites : « +2 Limier », pas de Condé ; un clic écrit et se consigne', () => {
        useSessionOSStore.setState({ getActiveDriver: () => PILOTE } as never);
        monterC2({ physique: 5, sport: 2, limier: 1, compteur_limier: 1, conde: 0 });
        faces(9, 9, 3, 2, 2);
        lancer();
        expect(document.querySelector('[data-point-d-enquete="conde"]')).toBeNull();
        fireEvent.click(screen.getByText('+2 Limier'));
        expect(ecrits).toHaveBeenLastCalledWith({ compteur_limier: 3 });
        expect(screen.getByText('Limier +2 → 3')).toBeTruthy();
        expect(consigne).toHaveBeenLastCalledWith(expect.objectContaining({ titre: 'Points d’enquête', totalDisplay: 'Limier +2 → 3' }));
    });

    it('sur un échec, rien n’est proposé', () => {
        useSessionOSStore.setState({ getActiveDriver: () => PILOTE } as never);
        monterC2({ physique: 5, sport: 2, limier: 1, compteur_limier: 1 });
        faces(3, 3, 3, 2, 2);
        lancer();
        expect(document.querySelector('[data-point-d-enquete]')).toBeNull();
    });
});

/** **L'attaque** — C6 (2026-10-22), livre p. 389–395 : l'arme, la cible, et les marques écrites. */
describe('l’attaque de Crimes', () => {
    const JET_C6: DescripteurDeJet = { ...JET_C2, garde: { ...JET_C2.garde!, armes: 'crimes' } };
    const initial = useSessionOSStore.getState();
    const initialCombat = useCombatStore.getState();
    const updateCharacterSheetData = vi.fn();
    beforeEach(() => {
        updateCharacterSheetData.mockClear();
        useSessionOSStore.setState({
            players: [{ id: 'j2', characters: [{ id: 'apache', name: 'Le surineur', campaignId: 'c',
                sheetData: { physique: 3, fatigue_physique: 1, epuisement_physique: 0, blessures_physique: 0 } }] }],
            entities: [], updateCharacterSheetData,
        } as never);
        useCombatStore.setState({ combatants: [{ id: 'k1', name: 'Le surineur', init: 0, isPlayer: true, faction: 'enemy', sourcePlayerId: 'apache', statuses: [] }] } as never);
    });
    afterEach(() => { useSessionOSStore.setState(initial, true); useCombatStore.setState(initialCombat, true); });

    const monterC6 = () => {
        render(<PanneauDeJet descripteur={JET_C6} dice={DICE} template={FICHE} valeurs={{ physique: 4, sport: 2 }} ecrireSurLaFiche={() => {}} />);
        const [potentiel, competence] = screen.getAllByRole('combobox');
        fireEvent.change(potentiel, { target: { value: 'physique' } });
        fireEvent.change(competence, { target: { value: 'sport' } });
        const prep = document.querySelector('[data-attaque-de-crimes]') as HTMLElement;
        fireEvent.change(within(prep).getAllByRole('combobox')[0], { target: { value: 'canne-epee' } });
        fireEvent.change(prep.querySelector('[data-cible]') as HTMLElement, { target: { value: 'k1' } });
        return prep;
    };

    it('la canne-épée : Physique 4 + 2, contre un Physique actuel de 2 (3 moins une fatigue) — et « Infliger »', () => {
        const prep = monterC6();
        expect(within(prep).getByText('Physique de la cible 2')).toBeTruthy();
        faces(9, 3, 2, 2);
        lancer();
        // 1 succès + 4 + 2 − 0 − 2 − 0 = 5 blessures : la première prend la place de la fatigue.
        expect(screen.getByText('Touché : 5 blessures')).toBeTruthy();
        fireEvent.click(screen.getByText('Infliger à Le surineur'));
        expect(updateCharacterSheetData).toHaveBeenCalledWith('j2', 'apache', 'blessures_physique', 5);
        expect(updateCharacterSheetData).toHaveBeenCalledWith('j2', 'apache', 'fatigue_physique', 0);
        expect(consigne).toHaveBeenLastCalledWith(expect.objectContaining({ titre: 'Attaque',
            totalDisplay: 'Le surineur : +5 blessures (Canne-épée) → Physique actuel -2' }));
    });

    it('en opposition, à égalité, pas de blessure ; une arme à feu hors de portée se dit', () => {
        const prep = monterC6();
        fireEvent.change(prep.querySelector('[data-adverses]') as HTMLElement, { target: { value: '1' } });
        faces(9, 3, 2, 2);
        lancer();
        expect(screen.getByText(/Pas de blessure/)).toBeTruthy();
        fireEvent.change(within(prep).getAllByRole('combobox')[0], { target: { value: 'clic-clac' } });
        fireEvent.change(prep.querySelector('[data-distance]') as HTMLElement, { target: { value: '45' } });
        expect(within(prep).getByText('au-delà de 40 m : tir impossible')).toBeTruthy();
    });
});

/** **Les circonstances du seuil** — C0.1 (2026-10-23), p. 389-390 et 412. */
describe('les circonstances qui déplacent le seuil', () => {
    const JET_C01: DescripteurDeJet = { ...JET, garde: { ...JET.garde!, armes: 'crimes', circonstances: { angoisse: 'angoisse' } } };
    const monterC01 = (valeurs: Record<string, unknown>) => {
        render(<PanneauDeJet descripteur={JET_C01} dice={DICE} template={FICHE} valeurs={valeurs} />);
        const [potentiel, competence] = screen.getAllByRole('combobox');
        fireEvent.change(potentiel, { target: { value: 'physique' } });
        fireEvent.change(competence, { target: { value: 'sport' } });
    };
    const garde = () => (document.querySelector('[data-garde]') as HTMLElement).textContent;

    it('sans arme à feu, un seul réglage libre ; avec une arme à feu, distance, cible et taille', () => {
        monterC01({ physique: 4, sport: 1 });
        expect(document.querySelector('[data-distance-du-tir]')).toBeNull();
        fireEvent.change(document.querySelector('[data-autre-circonstance]') as HTMLElement, { target: { value: '1' } });
        expect(garde()).toMatch(/Seuil par dé9.*= 8 \+ 1 \(circonstances\)/);
        const prep = document.querySelector('[data-attaque-de-crimes]') as HTMLElement;
        fireEvent.change(within(prep).getAllByRole('combobox')[0], { target: { value: 'galand' } });
        fireEvent.change(document.querySelector('[data-autre-circonstance]') as HTMLElement, { target: { value: '0' } });
        // L'exemple du livre : une crapule lointaine (+1) mais immobile (−1) — seuil 8.
        fireEvent.change(document.querySelector('[data-distance-du-tir]') as HTMLElement, { target: { value: '1' } });
        fireEvent.change(document.querySelector('[data-mobilite]') as HTMLElement, { target: { value: '-1' } });
        expect(garde()).toMatch(/Seuil par dé8compétent$/);
    });

    it('un tireur angoissé : +1 d’office au-dessus de 3 ; à 3 et plus, le seuil de 9 peut être imposé', () => {
        monterC01({ physique: 4, sport: 1, angoisse: 4 });
        const prep = document.querySelector('[data-attaque-de-crimes]') as HTMLElement;
        fireEvent.change(within(prep).getAllByRole('combobox')[0], { target: { value: 'galand' } });
        expect(garde()).toMatch(/Seuil par dé9.*= 8 \+ 1 \(circonstances\)/);
        fireEvent.click(document.querySelector('[data-seuil-impose]') as HTMLElement);
        expect(garde()).toMatch(/Seuil par dé9imposé \(angoisse\)$/);
        expect(document.querySelector('[data-distance-du-tir]')).toBeNull();
    });
});

/** **Les compétences hermétiques** — C0.3 (2026-10-23), p. 323-325. */
describe('une action hermétique', () => {
    const JET_C03: DescripteurDeJet = { ...JET, garde: { ...JET.garde!, hermetiques: ['specialties_sport_climbing'] } };
    it('sans la spécialisation, le jet est refusé et le panneau dit pourquoi ; avec, il part', () => {
        render(<PanneauDeJet descripteur={JET_C03} dice={DICE} template={FICHE} valeurs={{ physique: 4, sport: 2 }} />);
        const [potentiel, competence] = screen.getAllByRole('combobox');
        fireEvent.change(potentiel, { target: { value: 'physique' } });
        fireEvent.change(competence, { target: { value: 'sport' } });
        const menu = document.querySelector('[data-action-hermetique]') as HTMLSelectElement;
        expect(Array.from(menu.options).map(o => o.textContent)).toEqual(['— non —', 'Escalade (non possédée)']);
        fireEvent.change(menu, { target: { value: 'specialties_sport_climbing' } });
        expect(screen.getByText(/Escalade est hermétique : sans cette spécialisation/)).toBeTruthy();
        expect((screen.getByText('Lancer', { exact: true }) as HTMLButtonElement).disabled).toBe(true);
        cleanup();
        render(<PanneauDeJet descripteur={JET_C03} dice={DICE} template={FICHE} valeurs={{ physique: 4, sport: 2, specialties_sport_climbing: true }} />);
        const [p2, c2] = screen.getAllByRole('combobox');
        fireEvent.change(p2, { target: { value: 'physique' } });
        fireEvent.change(c2, { target: { value: 'sport' } });
        fireEvent.change(document.querySelector('[data-action-hermetique]') as HTMLElement, { target: { value: 'specialties_sport_climbing' } });
        expect((screen.getByText('Lancer', { exact: true }) as HTMLButtonElement).disabled).toBe(false);
    });
});

/** **La psychologie** — C4 (2026-10-23), livre p. 409-418. */
describe('la psychologie de Crimes au panneau', () => {
    const JET_C4: DescripteurDeJet = {
        ...JET_C2,
        garde: { ...JET_C2.garde!, psychologie: { angoisse: 'angoisse', nevrose: 'nevrose', seuilNevrose: 'seuil_nevrose', psychose: 'psychose', mental: 'mental', inclinaison: 'inclinaison' } },
    };
    const ecritsC4 = vi.fn();
    function HoteC4({ depart }: { depart: Record<string, unknown> }) {
        const [valeurs, setValeurs] = useState(depart);
        return <PanneauDeJet descripteur={JET_C4} dice={DICE} template={FICHE} valeurs={valeurs}
            ecrireSurLaFiche={maj => { ecritsC4(maj); setValeurs(v => ({ ...v, ...maj })); }} />;
    }
    const carte = () => document.querySelector('[data-psychologie]') as HTMLElement;
    beforeEach(() => ecritsC4.mockClear());

    it('l’angoisse monte, la névrose suit (p. 411) ; à 3, le panneau rappelle ce que le meneur peut exiger', () => {
        render(<HoteC4 depart={{ physique: 4, mental: 3, sport: 1, angoisse: 2, nevrose: 4, seuil_nevrose: 7, psychose: 2 }} />);
        fireEvent.click(within(carte().querySelector('[data-jauge="angoisse"]') as HTMLElement).getByText('+1'));
        expect(ecritsC4).toHaveBeenLastCalledWith({ angoisse: 3, nevrose: 5 });
        expect(within(carte()).getByText(/Le meneur peut exiger des jets même faciles/)).toBeTruthy();
    });

    it('le test psychotique : Mental 3 GARDE 2 contre psychose + angoisse ; raté, la folie et « Noter +1 Psychose »', () => {
        render(<HoteC4 depart={{ physique: 4, mental: 3, sport: 1, angoisse: 2, nevrose: 4, seuil_nevrose: 7, psychose: 3, inclinaison: 'paranoïaque' }} />);
        expect(within(carte()).getByText('Mental 3 contre 5')).toBeTruthy();
        faces(2, 3, 4);
        fireEvent.click(within(carte().querySelector('[data-test-psychotique]') as HTMLElement).getByText('Lancer le test psychotique'));
        expect(within(carte()).getByText(/État de folie selon l'inclinaison « paranoïaque »/)).toBeTruthy();
        fireEvent.click(within(carte()).getByText('Noter +1 Psychose'));
        expect(ecritsC4).toHaveBeenLastCalledWith({ psychose: 4 });
        expect(consigne).toHaveBeenCalledWith(expect.objectContaining({ titre: 'Test psychotique' }));
    });

    it('après un échec, « Noter : Névrose +1 » écrit la névrose du jet, une fois', () => {
        render(<HoteC4 depart={{ physique: 4, mental: 3, sport: 1, angoisse: 0, nevrose: 4, seuil_nevrose: 7, psychose: 2 }} />);
        const [potentiel, competence] = screen.getAllByRole('combobox');
        fireEvent.change(potentiel, { target: { value: 'physique' } });
        fireEvent.change(competence, { target: { value: 'sport' } });
        faces(2, 3, 4, 5);
        lancer();
        fireEvent.click(screen.getByText('Noter : Névrose +1'));
        expect(ecritsC4).toHaveBeenLastCalledWith({ nevrose: 5 });
        expect(screen.getByText('Névrose 4 → 5 (+1, jet)')).toBeTruthy();
    });
});

/** **Le test en opposition** — C1, reste (2026-10-23), livre p. 385. */
describe('le test en opposition', () => {
    it('sous le résultat : les réussites adverses disent qui l’emporte ; l’échec critique compte ses 1 à l’autre', () => {
        monter({ physique: 4, sport: 2 });
        faces(9, 8, 3, 2);
        lancer();
        fireEvent.change(document.querySelector('[data-reussites-adverses]') as HTMLElement, { target: { value: '1' } });
        expect(screen.getByText(/Opposition remportée : 2 contre 1, marge 1/)).toBeTruthy();
        fireEvent.change(document.querySelector('[data-reussites-adverses]') as HTMLElement, { target: { value: '0' } });
        fireEvent.change(document.querySelector('[data-uns-adverses]') as HTMLElement, { target: { value: '2' } });
        expect(screen.getByText(/4 contre 0 \(les 1 de l’échec critique comptés à l’adversaire\), marge 4/)).toBeTruthy();
    });
});
