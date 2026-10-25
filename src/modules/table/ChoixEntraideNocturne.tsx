import type { HerosDeLaTable } from './gestesDesHeros';
import { niveauNocturne, type ChoixEntraideNocturne } from './entraideNocturne';

export default function ChoixEntraideNocturne({ calme, heros, choix, changer, recuperations, amputations }: {
    calme: boolean; heros: HerosDeLaTable[]; choix: ChoixEntraideNocturne; changer: (c: ChoixEntraideNocturne) => void;
    recuperations?: Record<string, Record<string, number>>; amputations?: Record<string, number>;
}) {
    const talent = calme ? 'extase' : 'lumiere';
    const presents = calme ? heros.filter(h => choix.participants ? choix.participants.includes(h.id) : !h.allie) : heros;
    return <section className="space-y-3 rounded-lg border border-app-border p-3" aria-label="Entraide nocturne">
        <h3 className="font-bold text-app-text">{calme ? 'Qui partage le moment de calme ?' : 'Cibles et Aura de lumière'}</h3>
        <p className="text-xs text-app-muted">{calme
            ? 'Répartissez l’Extase entre les participants. Le Fiel ne diminue que si tous les Héros se reposent.'
            : 'La Loi valide la présence dans l’Aura : zone éclairée, au plus 10 × Lumière mètres ; pénombre 1 m ; ténèbres, contact. Chaque point ne protège qu’une fois.'}</p>
        <div className="flex flex-wrap gap-3">{heros.map(h => <label key={h.id} className="text-xs text-app-text">
            <input type="checkbox" checked={calme ? presents.some(p => p.id === h.id) : !choix.epargnes?.includes(h.id)}
                onChange={e => calme ? changer({ ...choix, participants: e.target.checked ? [...presents.map(p => p.id), h.id] : presents.filter(p => p.id !== h.id).map(p => p.id), extase: {}, amputation: {} })
                    : changer({ ...choix, epargnes: e.target.checked ? (choix.epargnes ?? []).filter(id => id !== h.id) : [...(choix.epargnes ?? []), h.id] })} /> {h.nom}
        </label>)}</div>
        {!calme && <p className="text-xs text-app-muted">Décochez les personnages épargnés par la Loi. Les Rouages alliés subissent la Fatigue ; les autres effets décrits ici touchent les Héros.</p>}
        {presents.filter(h => niveauNocturne(h.valeurs[talent]) > 0).map(source => {
            const budget = niveauNocturne(source.valeurs[talent]);
            const repartition = choix[talent]?.[source.id] ?? { [source.id]: budget };
            return <fieldset key={source.id} className="space-y-1 border-t border-app-border/40 pt-2">
                <legend className="text-xs font-bold">{source.nom} : {budget} {talent === 'extase' ? 'Extase' : 'Lumière'}</legend>
                <div className="flex flex-wrap gap-3">{presents.map(cible => <label key={cible.id} className="text-xs text-app-text">Vers {cible.nom}
                    <input type="number" min="0" max={budget} step="1" value={repartition[cible.id] ?? 0}
                        aria-label={`${talent} de ${source.nom} vers ${cible.nom}`}
                        onChange={e => changer({ ...choix, [talent]: { ...choix[talent], [source.id]: { ...repartition, [cible.id]: Number(e.target.value) } } })}
                        className="ml-1 w-14 rounded border border-app-border bg-app-bg p-1" />
                </label>)}</div>
            </fieldset>;
        })}
        {calme && presents.filter(h => (amputations?.[h.id] ?? 0) > 0).map(h => <fieldset key={h.id} className="border-t border-app-border/40 pt-2">
            <legend className="text-xs font-bold">Soupçon de {h.nom} : {amputations?.[h.id]} point(s) à reprendre</legend>
            <div className="flex flex-wrap gap-3">{Object.entries(recuperations?.[h.id] ?? {}).filter(([, n]) => n > 0).map(([champ, max]) => <label key={champ} className="text-xs text-app-text">{champ} (récupération {max})
                <input type="number" min="0" max={max} step="1" value={choix.amputation?.[h.id]?.[champ] ?? 0}
                    aria-label={`Soupçon de ${h.nom} sur ${champ}`}
                    onChange={e => changer({ ...choix, amputation: { ...choix.amputation, [h.id]: { ...choix.amputation?.[h.id], [champ]: Number(e.target.value) } } })}
                    className="ml-1 w-14 rounded border border-app-border bg-app-bg p-1" />
            </label>)}</div>
        </fieldset>)}
    </section>;
}
