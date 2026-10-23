import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import ContactsEtFortune from './ContactsEtFortune';
import CreationDeCrimes from './CreationDeCrimes';

/** **Contacts, fortune, création et progression de Crimes** — C7 et C8 (2026-10-23). */
afterEach(cleanup);

const CONTACTS = [
    { nom: 'contacts_0_name', loyaute: 'contacts_0_rating', appels: 'contacts_0_appels', influence: 'contacts_0_influence' },
    { nom: 'contacts_1_name', loyaute: 'contacts_1_rating', appels: 'contacts_1_appels' },
];
const FORTUNE = { niveau: 'fortune', jauge: 'fortune_piste' };

describe('les contacts et la fortune', () => {
    const valeurs = {
        contacts_0_name: 'Bertillon', contacts_0_rating: 3, contacts_0_appels: 1, contacts_0_influence: 3,
        contacts_1_name: '', psychose: 2, fortune: 2, fortune_piste: 9,
    };

    it('le meneur : loyauté actuelle sur base, un appel, la fin du scénario, un contact fidèle perdu', () => {
        const ecrire = vi.fn(), consigner = vi.fn();
        render(<ContactsEtFortune contacts={CONTACTS} fortune={FORTUNE} psychose="psychose" meneur valeurs={valeurs} ecrire={ecrire} consigner={consigner} />);
        const bertillon = screen.getByText('Bertillon').closest('[data-contact]') as HTMLElement;
        expect(within(bertillon).getByText('loyauté 2/3')).toBeTruthy();
        expect(document.querySelectorAll('[data-contact]')).toHaveLength(1);

        fireEvent.click(within(bertillon).getByText('Appel −1'));
        expect(ecrire).toHaveBeenLastCalledWith({ contacts_0_appels: 2 });
        expect(consigner.mock.calls.at(-1)?.[1]).toMatch(/Social GARDE 3/);

        fireEvent.click(screen.getByText('Fin du scénario : loyautés restaurées'));
        expect(ecrire).toHaveBeenLastCalledWith({ contacts_0_appels: 0 });

        fireEvent.click(within(bertillon).getByText('Perdu'));
        expect(ecrire).toHaveBeenLastCalledWith({ contacts_0_rating: 0, contacts_0_appels: 0, psychose: 3 });
    });

    it('le joueur ne voit que la fortune ; la jauge au seuil monte le niveau', () => {
        const ecrire = vi.fn();
        render(<ContactsEtFortune contacts={CONTACTS} fortune={FORTUNE} meneur={false} valeurs={valeurs} ecrire={ecrire} consigner={() => {}} />);
        expect(screen.queryByText('Bertillon')).toBeNull();
        expect(screen.getByText('jauge 9/10')).toBeTruthy();
        fireEvent.click(screen.getByText('Rétribution +1'));
        expect(ecrire).toHaveBeenLastCalledWith({ fortune: 3, fortune_piste: 5 });
    });
});

describe('la création et la progression', () => {
    const regle = {
        potentiels: ['physique', 'mental', 'social'], age: 'sexe_age', developpement: 'points_de_developpement',
        temperament: { emotivite: 'emo', activite: 'act', reactivite: 'rea', nom: 'tempérament', basePsychose: 'base_psychose' },
    };
    const psychologie = { angoisse: 'angoisse', nevrose: 'nevrose', seuilNevrose: 'seuil_nevrose', psychose: 'psychose', mental: 'mental' };
    const libelleDe = (id: string) => ({ physique: 'Physique', mental: 'Mental', social: 'Social', combat: 'Combat' } as Record<string, string>)[id] ?? id;

    it('le tempérament se reporte à la création, angoisse et psychose comprises', () => {
        const ecrire = vi.fn();
        render(<CreationDeCrimes regle={regle} psychologie={psychologie} competences={{ combat: 'specialties_combat_' }}
            valeurs={{ emo: 'Oui', act: 'Oui', rea: 'Primaire', seuil_nevrose: 0, physique: 3, mental: 4, social: 5, combat: 3, specialties_combat_unarmed: true }}
            libelleDe={libelleDe} ecrire={ecrire} consigner={() => {}} />);
        expect(screen.getByText('Colérique')).toBeTruthy();
        fireEvent.click(screen.getByText('Reporter sur la fiche'));
        expect(ecrire).toHaveBeenCalledWith({ tempérament: 'Colérique', base_psychose: 1, seuil_nevrose: 6, angoisse: 2, psychose: 1 });
        expect(screen.getByText(/Compétences : 18 \/ 45/)).toBeTruthy();
        expect(screen.getByText(/1, dont 1 offerte par la maîtrise/)).toBeTruthy();
    });

    it('personnage joué : l’angoisse et la psychose restent ; dépenser des points de développement', () => {
        const ecrire = vi.fn();
        render(<CreationDeCrimes regle={regle} psychologie={psychologie} competences={{ combat: 'specialties_combat_' }}
            valeurs={{ emo: 'Non', act: 'Non', rea: 'Secondaire', seuil_nevrose: 6, physique: 3, mental: 4, social: 5, combat: 1, points_de_developpement: 5 }}
            libelleDe={libelleDe} ecrire={ecrire} consigner={() => {}} />);
        fireEvent.click(screen.getByText('Reporter sur la fiche'));
        expect(ecrire).toHaveBeenLastCalledWith({ tempérament: 'Apathique', base_psychose: 3, seuil_nevrose: 8 });

        fireEvent.change(screen.getByLabelText('Amélioration'), { target: { value: 'mental' } });
        fireEvent.click(screen.getByText('Dépenser'));
        expect(ecrire).toHaveBeenLastCalledWith({ mental: 5, points_de_developpement: 0 });
        fireEvent.change(screen.getByLabelText('Amélioration'), { target: { value: 'social' } });
        expect(screen.queryByRole('option', { name: /Social 5/ })).toBeNull();
    });
});
