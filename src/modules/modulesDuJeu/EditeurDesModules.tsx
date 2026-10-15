import { CATALOGUE_DES_MODULES, modulesDuPilote } from './catalogue';
import type { GameDriver } from '../../types/drivers';

export function EditeurDesModules({ pilote, onChange }: {
    pilote: GameDriver; onChange: (modules: NonNullable<GameDriver['modulesDuJeu']>) => void;
}) {
    const resultat = modulesDuPilote(pilote);
    const compatibles = CATALOGUE_DES_MODULES.filter(m => m.corpusCompatibles.includes(resultat.corpusId || ''));
    return <section className="space-y-6" aria-label="Modules du jeu">
        <header className="space-y-2">
            <h2 className="text-2xl font-bold text-app-text">Modules du jeu</h2>
            <p className="text-sm text-app-muted">Choisis les outils proposés au meneur pour ce pilote. Ce choix est enregistré automatiquement et accompagne son export.</p>
        </header>
        <p className="text-sm text-app-muted">Prépare les outils depuis le cockpit, dans Modules du jeu. Pendant une séance, ouvre séparément leurs accès aux personnages choisis.</p>
        {resultat.implicite && <p className="text-sm text-accent">Sélection héritée du jeu. Ta première modification enregistrera un choix explicite.</p>}
        {resultat.erreurs.map(erreur => <p key={erreur} role="alert" className="text-etat-danger">{erreur}</p>)}
        {!compatibles.length && <p className="text-app-muted">Aucun module compatible n’est encore référencé pour ce jeu.</p>}
        <div className="space-y-3">
            {compatibles.map(module => <label key={module.id} className="flex gap-3 rounded-lg border border-app-border bg-app-surface p-4">
                <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-accent"
                    checked={resultat.references.some(r => r.id === module.id)}
                    disabled={resultat.erreurs.length > 0 || (!resultat.references.some(r => r.id === module.id) && resultat.references.length >= 32)}
                    onChange={e => onChange(e.target.checked ? [...resultat.references, { id: module.id }]
                        : resultat.references.filter(r => r.id !== module.id))} />
                <span className="min-w-0 space-y-1">
                    <span className="block font-bold text-app-text">{module.libelle}</span>
                    <span className="block text-sm text-app-muted">{module.description}</span>
                    <span className="block text-sm text-app-muted">{module.adaptation === 'prete' ? 'Disponible dans Modules du jeu au cockpit.' : 'Adaptateur à préparer.'}</span>
                </span>
            </label>)}
        </div>
        {resultat.references.length >= 32 && <p className="text-sm text-app-muted">La limite de 32 modules est atteinte. Retire une référence avant d’en ajouter une.</p>}
        {resultat.modules.filter(m => m.disponibilite === 'inconnu' || m.disponibilite === 'incompatible').map(module =>
            <div key={module.reference.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-app-border p-4">
                <p className="min-w-0 break-words text-sm text-app-muted">{module.libelle} — {module.disponibilite === 'inconnu' ? 'absent du catalogue' : 'incompatible avec ce jeu'}. Référence conservée à l’export.</p>
                <button type="button" className="rounded border border-app-border px-3 py-2 text-sm text-app-text"
                    onClick={() => onChange(resultat.references.filter(r => r.id !== module.reference.id))}>Retirer {module.libelle}</button>
            </div>)}
        {resultat.references.length > 0 && <button type="button" className="rounded border border-app-border px-4 py-2 text-sm text-app-text" onClick={() => onChange([])}>Ne proposer aucun module</button>}
    </section>;
}
