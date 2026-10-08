import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AIPromptOverlay from './AIPromptOverlay';

const options = () => ({ isOpen: true, onClose: vi.fn(), onGenerate: vi.fn(), initialPrompt: 'Une station' });
const texte = () => (screen.getByRole('textbox') as HTMLTextAreaElement).value;

describe('la saisie de l’invite IA', () => {
    it('sert le texte, lui donne le focus et lance la saisie avec Ctrl+Entrée', () => {
        const props = options();
        render(<AIPromptOverlay {...props} />);
        expect(texte()).toBe('Une station');
        expect(document.activeElement).toBe(screen.getByRole('textbox'));
        fireEvent.change(screen.getByRole('textbox'), { target: { value: '  Une colonie  ' } });
        fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter', ctrlKey: true });
        expect(props.onGenerate).toHaveBeenCalledWith('Une colonie');
    });

    it('préserve la saisie et les suggestions lors d’une nouvelle proposition', () => {
        const props = { ...options(), suggestions: ['Peinture'] };
        const { rerender } = render(<AIPromptOverlay {...props} />);
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Un port' } });
        rerender(<AIPromptOverlay {...props} initialPrompt="Autre proposition" />);
        fireEvent.click(screen.getByText('Peinture'));
        fireEvent.click(screen.getByText('Lancer la création'));
        expect(props.onGenerate).toHaveBeenCalledWith('Un port, Peinture');
    });

    it('sert une nouvelle proposition à un champ vide, mais laisse effacer la précédente', () => {
        const props = options();
        const { rerender } = render(<AIPromptOverlay {...props} />);
        fireEvent.change(screen.getByRole('textbox'), { target: { value: '' } });
        rerender(<AIPromptOverlay {...props} />);
        expect(texte()).toBe('');
        rerender(<AIPromptOverlay {...props} initialPrompt="Une cité" />);
        expect(texte()).toBe('Une cité');
    });

    it('abandonne le brouillon fermé et garde Échap et les champs désactivés', () => {
        const props = options();
        const { rerender } = render(<AIPromptOverlay {...props} />);
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Brouillon' } });
        fireEvent.keyDown(window, { key: 'Escape' });
        expect(props.onClose).toHaveBeenCalledOnce();
        rerender(<AIPromptOverlay {...props} isOpen={false} />);
        expect(screen.queryByRole('textbox')).toBeNull();
        rerender(<AIPromptOverlay {...props} isGenerating />);
        expect(texte()).toBe('Une station');
        expect((screen.getByRole('textbox') as HTMLTextAreaElement).disabled).toBe(true);
    });
});
