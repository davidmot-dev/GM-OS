import { expect, it } from 'vitest';
import { contactsDeCabale, depenserLesFaveurs, rechargerLesFaveurs } from './faveursDeCabale';
it('les Contacts du Réseau possèdent chacun deux Faveurs, rechargeables au scénario', () => {
    const fiche = { 'assets.status.network': 3, 'network.contacts.0.favours': 0 };
    expect(contactsDeCabale(fiche).map(c => c.points)).toEqual([0, 2, 2]);
    expect(rechargerLesFaveurs(fiche)).toEqual({ 'network.contacts.0.favours': 2, 'network.contacts.1.favours': 2, 'network.contacts.2.favours': 2 });
});
it('cumule les Contacts choisis pour une grande faveur sans dépenser les autres', () => {
    const fiche = { 'assets.status.network': 3 };
    expect(depenserLesFaveurs(fiche, [1, 2], 3)).toEqual({ 'network.contacts.1.favours': 0, 'network.contacts.2.favours': 1 });
    expect(depenserLesFaveurs(fiche, [0, 0], 3)).toBeNull();
    expect(depenserLesFaveurs(fiche, [0, 1], 5)).toBeNull();
    expect(depenserLesFaveurs(fiche, [0, 1, 2], 5)).toEqual({ 'network.contacts.0.favours': 0, 'network.contacts.1.favours': 0, 'network.contacts.2.favours': 1 });
});
