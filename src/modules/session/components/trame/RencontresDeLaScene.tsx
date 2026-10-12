import React, { useMemo, useState } from 'react';
import { Swords, Plus, Trash2, Unlink, X, ChevronDown, ChevronRight } from 'lucide-react';
import { useSessionOSStore } from '../../useSessionOSStore';
import { useBestiaireStore } from '../../../combat/useBestiaireStore';
import { gmConfirm } from '../../../../stores/useModalStore';
import { ARCHETYPES, RANGS } from '../../../combat/logic/archetypes';
import {
    avecLeNombre, libelleDeLaLigne, ligneDeLArchetype, ligneDuGabarit, ligneDuPNJ, resumeDeLaRencontre,
} from '../../../combat/logic/lignesDeRencontre';
import type { Scene } from '../../../../types/trame.types';
import type { CampDeRencontre, LigneDeRencontre, RencontrePreparee } from '../../../../types/rencontres.types';

/**
 * **Les rencontres d'une scène, composées dans la Trame** (2026-10-12, R3).
 *
 * L'autre porte que « Garder le plateau comme rencontre » dans Combat-OS (R2) :
 * on y prépare la scène, et c'est là qu'on pense à ce qui s'y oppose. Une ligne
 * se prend dans le bestiaire du jeu, dans un archétype, ou parmi les PNJ — ceux
 * de la scène en tête. L'invocation reste dans Combat-OS (décision de David).
 */
const CAMPS: { id: CampDeRencontre; label: string }[] = [
    { id: 'enemy', label: 'Ennemi' }, { id: 'ally', label: 'Allié' }, { id: 'neutral', label: 'Neutre' },
];

const champ = 'bg-app-bg/40 px-2.5 py-1.5 rounded-lg border border-app-border/20 text-xs focus:border-accent/50 outline-none';

const RencontresDeLaScene: React.FC<{ scene: Scene }> = ({ scene }) => {
    const { rencontres, entities, ajouterUneRencontre, modifierUneRencontre, supprimerUneRencontre } = useSessionOSStore();
    const driver = useSessionOSStore(s => s.getActiveDriver());
    /* Les gabarits eux-mêmes, et non `gabaritsDuJeu` : sélectionner la fonction
       ne réabonnerait pas l'écran quand le bestiaire change. */
    const tousLesGabarits = useBestiaireStore(s => s.gabarits);
    const jeuId = driver?.id ?? 'sans-pilote';
    const gabarits = useMemo(
        () => tousLesGabarits.filter(g => g.jeuId === jeuId).sort((x, y) => y.creeLe - x.creeLe),
        [tousLesGabarits, jeuId],
    );
    const [ouverte, setOuverte] = useState<string | null>(null);

    const deLaScene = (rencontres ?? []).filter(r => r.sceneId === scene.id);
    const libres = (rencontres ?? []).filter(r => r.campaignId === scene.campaignId && !r.sceneId);
    const pnjDeLaCampagne = entities.filter(e => e.campaignId === scene.campaignId && e.type !== 'pc');
    const pnjDeLaScene = pnjDeLaCampagne.filter(e => scene.entiteIds.includes(e.id));
    const autresPnj = pnjDeLaCampagne.filter(e => !scene.entiteIds.includes(e.id));
    const nomDuPNJ = (id: string) => entities.find(e => e.id === id)?.name;

    const changerLesLignes = (r: RencontrePreparee, lignes: LigneDeRencontre[]) => modifierUneRencontre(r.id, { lignes });

    /** La valeur du choix « Ajouter… » : `g:` gabarit, `a:` archétype, `e:` PNJ. */
    const ajouterLaLigne = (r: RencontrePreparee, valeur: string) => {
        const [genre, id] = [valeur.slice(0, 1), valeur.slice(2)];
        const gabarit = gabarits.find(g => g.id === id);
        const ligne = genre === 'g' && gabarit ? ligneDuGabarit(gabarit)
            : genre === 'a' ? ligneDeLArchetype(id)
                : genre === 'e' ? ligneDuPNJ(id) : null;
        if (ligne) changerLesLignes(r, [...r.lignes, ligne]);
    };

    const nouvelle = () => {
        const id = ajouterUneRencontre({
            campaignId: scene.campaignId, sceneId: scene.id,
            nom: deLaScene.length === 0 ? 'Rencontre' : `Rencontre ${deLaScene.length + 1}`, lignes: [],
        });
        setOuverte(id);
    };

    return (
        <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-ui-10 font-black uppercase tracking-widest text-app-text/40 px-1">
                <Swords size={12} /> Rencontres
            </label>
            <p className="text-ui-11 text-app-text/30 px-1 leading-relaxed">
                Préparées ici, invoquées dans Combat-OS — les PJ se cochent au moment de commencer.
            </p>

            {deLaScene.map(r => {
                const depliee = ouverte === r.id;
                return (
                    <div key={r.id} className="rounded-xl border border-app-border/20 bg-app-bg/30">
                        <div className="flex items-center gap-2 px-3 py-2">
                            <button
                                type="button"
                                className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                                onClick={() => setOuverte(depliee ? null : r.id)}
                            >
                                {depliee ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                <span className="truncate text-xs font-bold">{r.nom}</span>
                                <span className="truncate text-ui-11 text-app-text/40">
                                    {resumeDeLaRencontre(r, nomDuPNJ) || 'vide'}
                                </span>
                            </button>
                            <button
                                type="button" title="Détacher : la rencontre devient libre"
                                className="p-1 text-app-text/40 hover:text-app-text"
                                onClick={() => modifierUneRencontre(r.id, { sceneId: undefined })}
                            ><Unlink size={12} /></button>
                            <button
                                type="button" title="Supprimer la rencontre"
                                className="p-1 text-app-text/40 hover:text-etat-danger"
                                onClick={() => gmConfirm(`Supprimer la rencontre « ${r.nom} » ?`, () => supprimerUneRencontre(r.id))}
                            ><Trash2 size={12} /></button>
                        </div>

                        {depliee && (
                            <div className="space-y-2 border-t border-app-border/20 px-3 py-2">
                                <input
                                    aria-label="Nom de la rencontre"
                                    value={r.nom}
                                    onChange={e => modifierUneRencontre(r.id, { nom: e.target.value })}
                                    className={`w-full font-bold ${champ}`}
                                />

                                {r.lignes.map((l, i) => {
                                    const remplacer = (suivante: LigneDeRencontre) =>
                                        changerLesLignes(r, r.lignes.map((x, j) => (j === i ? suivante : x)));
                                    return (
                                        <div key={i} className="flex flex-wrap items-center gap-1.5">
                                            {l.genre !== 'entite' && (
                                                <input
                                                    type="number" min={1} max={20} aria-label="Nombre"
                                                    value={l.nombre}
                                                    onChange={e => remplacer(avecLeNombre(l, Number(e.target.value)))}
                                                    className={`w-14 ${champ}`}
                                                />
                                            )}
                                            <span className="min-w-0 flex-1 truncate text-xs">
                                                {libelleDeLaLigne(l.genre === 'entite' ? l : { ...l, nombre: 1 }, nomDuPNJ)}
                                            </span>
                                            {l.genre === 'archetype' && (
                                                <select
                                                    aria-label="Rang" value={l.rangId}
                                                    onChange={e => remplacer({ ...l, rangId: e.target.value })}
                                                    className={champ}
                                                >
                                                    {RANGS.map(rg => <option key={rg.id} value={rg.id}>{rg.nom}</option>)}
                                                </select>
                                            )}
                                            <select
                                                aria-label="Camp" value={l.faction ?? (l.genre === 'entite' ? '' : 'enemy')}
                                                onChange={e => remplacer({ ...l, faction: (e.target.value || undefined) as CampDeRencontre | undefined })}
                                                className={champ}
                                            >
                                                {l.genre === 'entite' && <option value="">Selon son rôle</option>}
                                                {CAMPS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                            </select>
                                            <button
                                                type="button" title="Retirer la ligne"
                                                className="p-1 text-app-text/40 hover:text-etat-danger"
                                                onClick={() => changerLesLignes(r, r.lignes.filter((_, j) => j !== i))}
                                            ><X size={12} /></button>
                                        </div>
                                    );
                                })}

                                <select
                                    aria-label="Ajouter un adversaire"
                                    value=""
                                    onChange={e => { if (e.target.value) ajouterLaLigne(r, e.target.value); }}
                                    className={`w-full ${champ}`}
                                >
                                    <option value="">+ Ajouter…</option>
                                    {gabarits.length > 0 && (
                                        <optgroup label="Bestiaire du jeu">
                                            {gabarits.map(g => <option key={g.id} value={`g:${g.id}`}>{g.nom}</option>)}
                                        </optgroup>
                                    )}
                                    {pnjDeLaScene.length > 0 && (
                                        <optgroup label="PNJ de la scène">
                                            {pnjDeLaScene.map(e => <option key={e.id} value={`e:${e.id}`}>{e.name}</option>)}
                                        </optgroup>
                                    )}
                                    <optgroup label="Archétypes">
                                        {ARCHETYPES.map(a => <option key={a.id} value={`a:${a.id}`}>{a.nom}</option>)}
                                    </optgroup>
                                    {autresPnj.length > 0 && (
                                        <optgroup label="Autres PNJ de la campagne">
                                            {autresPnj.map(e => <option key={e.id} value={`e:${e.id}`}>{e.name}</option>)}
                                        </optgroup>
                                    )}
                                </select>

                                <textarea
                                    aria-label="Notes de la rencontre"
                                    placeholder="Tactique, déclencheur, terrain"
                                    rows={2}
                                    value={r.notes ?? ''}
                                    onChange={e => modifierUneRencontre(r.id, { notes: e.target.value || undefined })}
                                    className={`w-full resize-none ${champ}`}
                                />
                            </div>
                        )}
                    </div>
                );
            })}

            <div className="flex flex-wrap gap-1.5">
                <button
                    type="button"
                    onClick={nouvelle}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-ui-10 font-bold border bg-app-bg/30 border-app-border/20 text-app-text/60 hover:text-accent hover:border-accent/40"
                >
                    <Plus size={12} /> Nouvelle rencontre
                </button>
                {libres.length > 0 && (
                    <select
                        aria-label="Rattacher une rencontre libre"
                        value=""
                        onChange={e => { if (e.target.value) modifierUneRencontre(e.target.value, { sceneId: scene.id }); }}
                        className={champ}
                    >
                        <option value="">Rattacher une rencontre libre…</option>
                        {libres.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
                    </select>
                )}
            </div>
        </div>
    );
};

export default RencontresDeLaScene;
