import type { EffetAuJet } from '../../../equipement/equiperLaFiche';

/**
 * **« Équipement porté »** au panneau de jet — registre § 203, étape E
 * (02/11/2026). Écran retenu dans Stitch, généré par le MCP :
 * `documentation/Planning/stitch/equipement/equipement-jet.png`.
 *
 * Les effets des objets portés (Sac à dos et armes de la fiche) qui visent un
 * champ du jet. **Rien n'est coché par défaut** : décision de David du 02/11,
 * les effets sont rappelés, jamais appliqués d'office, puisque « sous l'eau »
 * ou « dans l'obscurité » se jugent à la table.
 */
const signe = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0');

export function EquipementPorte({ effets, coches, basculer, total }: {
    effets: EffetAuJet[];
    coches: ReadonlySet<string>;
    basculer: (cle: string) => void;
    total: number;
}) {
    return <section data-equipement-porte aria-label="Équipement porté" className="space-y-2 rounded-lg border border-app-border p-2 text-ui-12 text-app-text">
        <p className="font-bold">Équipement porté</p>
        <p className="text-app-muted">Les effets des objets portés qui visent ce jet. Cochez ceux qui jouent ici ; rien n’est appliqué d’office.</p>
        <ul className="space-y-1">
            {effets.map(e => (
                <li key={e.cle}>
                    <label className="flex items-baseline gap-2">
                        <input type="checkbox" checked={coches.has(e.cle)} onChange={() => basculer(e.cle)} className="accent-accent" />
                        <span className="min-w-0 flex-1">
                            <strong>{e.objet}</strong> <span className="text-app-muted">{e.effet.texte}</span>
                            {e.effet.condition && <em className="text-app-muted"> — {e.effet.condition}</em>}
                        </span>
                        <span className="font-mono font-bold">{signe(e.effet.valeur ?? 0)}</span>
                    </label>
                </li>
            ))}
        </ul>
        <p className="text-right font-mono font-bold text-accent">Équipement : {signe(total)}</p>
    </section>;
}
