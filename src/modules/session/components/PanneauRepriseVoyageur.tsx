import { useState } from 'react';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';
import { CLE_ORIGINAUX, HEURES_DRACONIQUES, lireFicheDeVoyageur, reprendreFicheDeVoyageur, type ValeursDeVoyageur } from '../logic/ficheDeVoyageur';

const ORIGINES: Record<string, string> = {
    vie: 'Vie — ancienne fiche', points_de_vie: 'Vie — ancienne feuille de route', __rddVieCombat: 'Santé du combat',
    reve_pts: 'Rêve — ancienne fiche', reve_base: 'Rêve — ancienne feuille de route', points_de_reve: 'Rêve — anciennes jauges',
    reve_seuil: 'Seuil de récupération', reve_pts_max: 'Ancien champ « Rêve Max »',
    heure_naissance: 'Heure — ancienne identité', heure_de_naissance: 'Heure — anciennes caractéristiques',
    poids_kg: 'Poids — ancienne identité', poids: 'Poids — anciennes caractéristiques',
    beaute: 'Beauté — ancienne identité', beauter: 'Beauté — anciennes caractéristiques',
};

/** Le meneur arbitre les anciennes saisies avant la première écriture R0. */
export function PanneauRepriseVoyageur({ fiche, donnees, appliquer, vieCombat, maxVieCombat, brouillon }: {
    fiche: SheetTemplate; donnees: ValeursDeVoyageur; appliquer: (donnees: ValeursDeVoyageur) => void;
    vieCombat?: number; maxVieCombat?: number;
    brouillon?: ValeursDeVoyageur;
}) {
    const [choix, choisir] = useState<ValeursDeVoyageur>({});
    const [erreur, setErreur] = useState('');
    const sante = { ...(vieCombat !== undefined ? {__rddVieCombat: vieCombat} : {}),
        ...(maxVieCombat !== undefined ? {__rddMaxVieCombat: maxVieCombat} : {}) };
    const sources = { ...donnees, ...brouillon, ...sante };
    const lecture = lireFicheDeVoyageur(fiche, sources, choix);
    const initial = lireFicheDeVoyageur(fiche, sources);
    if (!lecture.aReprendre) return lecture.avertissements.length ? (
        <p role="status" className="text-sm text-etat-alerte">{lecture.avertissements.join(' ')}</p>
    ) : null;
    return (
        <section aria-label="Reprise de la fiche Voyageur" className="p-4 space-y-3 rounded-xl border border-accent/40 bg-app-surface text-app-text">
            <h3 className="font-bold">Reprendre la fiche du Voyageur</h3>
            <p className="text-sm">Les caractéristiques dérivées seront recalculées selon les règles 2.3.1.
                Les anciennes saisies seront conservées dans les données du personnage.
                La reprise enregistre également vos saisies en cours.</p>
            <p className="text-sm">Le seuil de récupération du rêve est indépendant de la caractéristique RÊVE.
                Les points de rêve peuvent dépasser ce seuil.</p>
            {initial.conflits.map(c => (
                <fieldset key={c.champ} className="p-3 rounded border border-app-border space-y-2">
                    <legend className="font-bold">{c.label} : quelle valeur conserver ?</legend>
                    {c.candidats.filter((v, i, a) => a.findIndex(autre => String(autre.valeur) === String(v.valeur)) === i).map((v, i) => (
                        <label key={v.champ} className="flex items-center gap-2 text-sm">
                            <input type="radio" name={`reprise-${c.champ}`} checked={choix[c.champ] === v.valeur}
                                onChange={() => choisir(p => ({ ...p, [c.champ]: v.valeur }))} />
                            {ORIGINES[v.champ] ?? `Saisie ${i + 1}`} : {String(v.valeur)}
                        </label>
                    ))}
                    {c.champ === 'heure_naissance' && <label className="block text-sm">Heure draconique
                        <select aria-label="Heure draconique à conserver" value={String(choix[c.champ] ?? '')}
                            className="ml-2 bg-app-bg border border-app-border rounded p-1"
                            onChange={e => choisir(p => ({ ...p, [c.champ]: e.target.value }))}>
                            <option value="">Choisir une heure</option>
                            {HEURES_DRACONIQUES.map(h => <option key={h}>{h}</option>)}
                        </select>
                    </label>}
                </fieldset>
            ))}
            {lecture.changements.length > 0 && <details>
                <summary className="cursor-pointer">Voir les valeurs recalculées ({lecture.changements.length})</summary>
                <ul className="text-sm list-disc pl-5">
                    {lecture.changements.map(c => <li key={c.champ}>
                        {fiche.sections.flatMap(s => s.fields).find(f => f.id === c.champ)?.label ?? c.champ} : {String(c.avant)} → {String(c.apres)}
                    </li>)}
                </ul>
            </details>}
            {lecture.avertissements.map(a => <p key={a} role="status" className="text-sm text-etat-alerte">{a}</p>)}
            {erreur && <p role="alert" className="text-sm text-etat-danger">{erreur}</p>}
            <button type="button" className="px-4 py-2 rounded bg-accent text-app-bg font-bold"
                onClick={() => {
                    try {
                        const suivantes = reprendreFicheDeVoyageur(fiche, sources, choix);
                        suivantes[CLE_ORIGINAUX] = donnees[CLE_ORIGINAUX] ?? structuredClone({...donnees, ...sante});
                        appliquer(suivantes); setErreur('');
                    }
                    catch (e) { setErreur(e instanceof Error ? e.message : 'La reprise a échoué.'); }
                }}>Appliquer la reprise et les calculs</button>
        </section>
    );
}
