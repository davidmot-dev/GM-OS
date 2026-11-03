import { useState } from 'react';
import type { GameDriver } from '../../../types/drivers';
import type { PlayerCharacter } from '../../../types/player.types';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';
import { appliquerRepriseSauvegardee, lireSauvegardeDeReprise, preparerRepriseDeFiche,
    sauvegarderReprise, type LiaisonDeReprise } from '../logic/repriseDeFiche';

const montrer = (v: unknown) => v === undefined ? 'Absent' : JSON.stringify(v);

/** Reprise volontaire, côté meneur ; ouvrir le diagnostic ne modifie aucune fiche. */
export function PanneauRepriseDeFiche({ personnage, joueurId, pilote, gabarit, brouillon, appliquer }: {
    personnage: PlayerCharacter; joueurId: string; pilote: GameDriver; gabarit: SheetTemplate;
    brouillon: boolean; appliquer: (changements: Partial<PlayerCharacter>) => void;
}) {
    const [liaisons, setLiaisons] = useState<LiaisonDeReprise[]>([]);
    const [sauvegarde, setSauvegarde] = useState('');
    const [erreur, setErreur] = useState('');
    const [message, setMessage] = useState('');
    const [restauration, setRestauration] = useState('');
    let lecture: ReturnType<typeof preparerRepriseDeFiche> | undefined;
    let plan: ReturnType<typeof preparerRepriseDeFiche> | undefined;
    let probleme = '';
    try {
        lecture = preparerRepriseDeFiche(personnage, pilote, gabarit);
        plan = preparerRepriseDeFiche(personnage, pilote, gabarit, liaisons);
    }
    catch (e) { probleme = (e as Error).message; }
    const fichier = plan ? JSON.stringify(sauvegarderReprise(joueurId, personnage.id, plan), null, 2) : '';
    const ecrire = (texte: string, restaurer = false) => {
        try {
            if (brouillon) throw new Error('Sauvegardez ou abandonnez les saisies du formulaire avant la reprise.');
            const copie = lireSauvegardeDeReprise(texte);
            appliquer(appliquerRepriseSauvegardee(copie, joueurId, personnage, restaurer));
            setLiaisons([]); setSauvegarde(''); setRestauration(''); setErreur('');
            setMessage(restaurer ? 'Anciennes valeurs restaurées. Notes, inventaire et santé conservés.'
                : 'Reprise enregistrée. Les anciennes clés sont conservées dans les données.');
        } catch (e) { setErreur((e as Error).message); }
    };
    const champs = gabarit.sections.flatMap(s => s.fields);
    return <details className="rounded-xl border border-app-border bg-app-surface p-4 text-app-text" data-reprise-de-fiche>
        <summary className="cursor-pointer font-bold">Diagnostic et reprise de fiche</summary>
        <div className="mt-3 space-y-3 text-sm">
            <p>Pilote installé : {pilote.name} · {pilote.version}. Gabarit : {gabarit.name}.</p>
            <p>Dernière référence enregistrée : {personnage.referenceDeFiche
                ? `${personnage.referenceDeFiche.version} (${personnage.referenceDeFiche.gabaritId})`
                : 'inconnue — la version de création ne peut pas être déduite des noms de champs'}.</p>
            {lecture && <>
                <p>{lecture.referenceConforme ? 'La référence correspond au pilote et au gabarit installés.'
                    : 'La référence est absente ou différente. Cela ne prouve pas à lui seul que la fiche est périmée.'}</p>
                <p>{lecture.horsGabarit.length} clé(s) hors du gabarit actuel, conservée(s).
                    {' '}{lecture.ajoutes.length} champ(s) absent(s) proposé(s) avec leur valeur initiale.</p>
                {lecture.incompatibles.length > 0 && <p role="status" className="text-etat-alerte">
                    Valeurs à vérifier, conservées sans correction automatique : {lecture.incompatibles.map(c => c.label).join(', ')}.
                </p>}
                <p>Choisissez les correspondances à reprendre. Aucune correspondance n’est déduite d’un libellé.
                    Une cible déjà remplie ne sera remplacée que si vous la choisissez ici.</p>
                {lecture.horsGabarit.map(source => <label key={source} className="block space-y-1">
                    <span className="break-all">{source} : {montrer(personnage.sheetData[source])}</span>
                    <select aria-label={`Reprendre ${source} vers`} className="block w-full rounded border border-app-border bg-app-bg p-2"
                        value={liaisons.find(l => l.source === source)?.cible ?? ''}
                        onChange={e => { setLiaisons(l => [...l.filter(x => x.source !== source),
                            ...(e.target.value ? [{ source, cible: e.target.value }] : [])]); setSauvegarde(''); setErreur(''); }}>
                        <option value="">Conserver seulement l’ancienne clé</option>
                        {champs.filter(c => c.type !== 'formula').map(c => <option key={c.id} value={c.id}>{c.label} ({c.id})</option>)}
                    </select>
                </label>)}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <caption className="text-left font-bold">Aperçu des valeurs proposées</caption>
                        <thead><tr><th>Champ</th><th>Avant</th><th>Après</th></tr></thead>
                        <tbody>{(plan?.changements ?? []).map(c => <tr key={c.id} className="border-t border-app-border">
                            <th className="p-2">{c.label}</th><td className="p-2 break-all">{montrer(c.avant)}</td><td className="p-2 break-all">{montrer(c.apres)}</td>
                        </tr>)}</tbody>
                    </table>
                </div>
                <p>Notes, inventaire et santé sont conservés. Le gabarit sera {gabarit.name} ; la référence sera {pilote.version}.
                    {personnage.templateId !== gabarit.id && personnage.ficheId && ' Le lien vers l’ancienne fiche HTML sera détaché, sans supprimer cette fiche.'}
                    {' '}Pour changer aussi la version du pilote, importez son fichier .gmos-driver avec « Remplacer » dans Nexus.
                    L’import d’une campagne conserve un pilote déjà installé de même identifiant.</p>
                <button type="button" className="rounded border border-accent px-3 py-2" disabled={brouillon || !plan}
                    onClick={() => {
                        try {
                            const url = URL.createObjectURL(new Blob([fichier], { type: 'application/json' }));
                            const lien = document.createElement('a'); lien.href = url;
                            lien.download = `reprise-fiche-${personnage.id.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;
                            lien.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); setSauvegarde(fichier); setErreur('');
                        } catch { setErreur('La sauvegarde n’a pas pu être préparée. Aucune reprise appliquée.'); }
                    }}>Télécharger la sauvegarde avant reprise</button>
                <button type="button" className="ml-2 rounded bg-accent px-3 py-2 font-bold text-app-bg disabled:opacity-40"
                    disabled={brouillon || sauvegarde !== fichier || !fichier} onClick={() => ecrire(sauvegarde)}>
                    Appliquer cette reprise
                </button>
            </>}
            <p>Retour arrière : choisissez la sauvegarde téléchargée pour revoir et restaurer les seules rubriques reprises.
                Une fiche modifiée depuis la reprise ne sera pas écrasée. Les changements ultérieurs de notes ou de santé restent en place.</p>
            <label className="block">Sauvegarde de reprise à restaurer
                <input type="file" accept=".json,application/json" className="block mt-1" onChange={async e => {
                    const f = e.target.files?.[0]; setRestauration('');
                    if (!f) return;
                    try {
                        if (f.size > 5_000_000) throw new Error('Cette sauvegarde dépasse 5 Mo.');
                        const texte = await f.text();
                        appliquerRepriseSauvegardee(lireSauvegardeDeReprise(texte), joueurId, personnage, true);
                        setRestauration(texte); setErreur('');
                    } catch (err) { setErreur((err as Error).message); }
                }} />
            </label>
            {restauration && <div>
                <pre className="max-h-60 overflow-auto whitespace-pre-wrap break-all">{JSON.stringify(lireSauvegardeDeReprise(restauration).avant, null, 2)}</pre>
                <button type="button" disabled={brouillon} className="rounded border border-accent px-3 py-2"
                    onClick={() => ecrire(restauration, true)}>Restaurer les anciennes valeurs</button>
            </div>}
            {brouillon && <p role="status">Sauvegardez ou abandonnez les saisies du formulaire avant la reprise.</p>}
            {(probleme || erreur) && <p role="alert" className="text-etat-danger">{probleme || erreur}</p>}
            {message && <p role="status">{message}</p>}
        </div>
    </details>;
}
