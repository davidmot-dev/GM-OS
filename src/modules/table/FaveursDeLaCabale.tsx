import { useState } from 'react';
import { cleDuContact, contactsDeCabale, depenserLesFaveurs } from './faveursDeCabale';
/** Complément de la feuille imprimée : aucune nouvelle piste n'est dessinée sur son fond. */
export default function FaveursDeLaCabale({ fiche, ecrire, interdit = false }: { fiche: Record<string, unknown>; ecrire: (maj: Record<string, unknown>) => void; interdit?: boolean }) {
    const [retenus, retenir] = useState<number[]>([]);
    const contacts = contactsDeCabale(fiche);
    return <details className="shrink-0 rounded border border-app-border bg-app-surface p-2 text-app-text" data-faveurs-cabale>
        <summary className="cursor-pointer text-sm font-bold">Réseau et Faveurs de la Cabale</summary>
        <p className="my-2 text-xs text-app-muted">Deux Faveurs par Contact de Réseau, rechargées au Nouveau scénario. Choisissez les Contacts à solliciter : une heure par Contact mobilisé, à apprécier par la Loi.</p>
        {interdit && <p role="status" className="text-xs text-etat-alerte">Bouleversement administratif : ce Héros ne peut pas recourir à ses Contacts durant ce cycle.</p>}
        {!contacts.length && <p className="text-xs">Renseignez l’Atout Réseau sur la feuille pour disposer de Contacts.</p>}
        <div className="flex flex-wrap gap-3">{contacts.map(c => <label key={c.i} className="flex items-center gap-1 text-xs">
            <input type="checkbox" checked={retenus.includes(c.i)} onChange={e => retenir(e.target.checked ? [...retenus, c.i] : retenus.filter(i => i !== c.i))} />
            <input aria-label={`Nom du Contact ${c.i + 1}`} value={c.nom} onChange={e => ecrire({ [cleDuContact(c.i, 'name')]: e.target.value })}
                className="w-32 rounded border border-app-border bg-app-bg p-1" />
            <span>{c.points}/2</span>
        </label>)}</div>
        <div className="mt-2 flex flex-wrap gap-2">{[[1, 'Petite faveur'], [3, 'Grande faveur'], [5, 'Énorme faveur']].map(([cout, nom]) => {
            const maj = depenserLesFaveurs(fiche, retenus, Number(cout));
            return <button type="button" key={cout} disabled={!maj || interdit} onClick={() => { if (maj && !interdit) ecrire(maj); }}
                className="rounded border border-accent/40 px-2 py-1 text-xs text-accent disabled:opacity-30">{nom} ({cout})</button>;
        })}</div>
    </details>;
}
