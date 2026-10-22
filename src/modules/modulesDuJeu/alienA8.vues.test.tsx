// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { PupitreMJ } from '../../../outils/alien/modules/muthur/vues.mjs';
import * as maman from '../../../outils/alien/modules/muthur/moteur.mjs';
afterEach(()=>{cleanup();vi.restoreAllMocks();});
it('prépare dans le vrai formulaire un objectif par acte, le remet une fois et le retrouve verrouillé après réouverture',async()=>{
    let etat=maman.appliquerCommande(maman.creerEtat(),{id:'preparer-operateur',charge:{personnageId:'alice',nom:'Alice'}},{role:'mj'});
    const props=()=>({vue:maman.vuePour(etat,{role:'mj'}),envoyerCommande:async(commande:maman.CommandeMuthur)=>{
        etat=maman.appliquerCommande(etat,commande,{role:'mj'});vue.rerender(<PupitreMJ {...props()}/>);return {ok:true as const};
    }});
    const vue=render(<PupitreMJ {...props()}/>);
    const cliquer=async(nom:string)=>{await act(async()=>fireEvent.click(vue.getByRole('button',{name:nom})));};
    await cliquer('Actes');
    fireEvent.change(vue.getByLabelText('Scénario (nom unique)'),{target:{value:'Quarantaine'}});
    fireEvent.change(vue.getByLabelText('Destinataire de l’objectif'),{target:{value:'alice'}});
    fireEvent.change(vue.getByLabelText('Objectif secret (MJ uniquement)'),{target:{value:'Protéger les prélèvements.'}});
    await act(async()=>fireEvent.submit(vue.getByRole('form',{name:'Objectif de l’acte'})));
    expect(JSON.stringify(maman.vuePour(etat,{role:'joueur',personnageId:'alice'}))).not.toContain('prélèvements');
    await cliquer('Remettre dans le terminal privé');
    expect(JSON.stringify(maman.vuePour(etat,{role:'joueur',personnageId:'alice'}))).toContain('prélèvements');
    expect((vue.getByRole('button',{name:'Objectif déjà remis'}) as HTMLButtonElement).disabled).toBe(true);
    vue.unmount();etat=maman.migrerEtat(etat,4);
    const reprise=render(<PupitreMJ vue={maman.vuePour(etat,{role:'mj'})} envoyerCommande={vi.fn()}/>);
    fireEvent.click(reprise.getByRole('button',{name:'Actes'}));
    fireEvent.change(reprise.getByLabelText('Destinataire de l’objectif'),{target:{value:'alice'}});
    expect((reprise.getByLabelText('Objectif secret (MJ uniquement)') as HTMLTextAreaElement).disabled).toBe(true);
    expect((reprise.getByLabelText('Objectif secret (MJ uniquement)') as HTMLTextAreaElement).value).toBe('Protéger les prélèvements.');
});
