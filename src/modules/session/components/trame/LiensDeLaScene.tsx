import React, { useEffect, useMemo } from 'react';
import { Music2, FileText, X, Swords } from 'lucide-react';
import { useMusicStore } from '../../../music/useMusicStore';
import { playlistsVisibles } from '../../../music/logic/playlistsDeLaCampagne';
import { useSessionOSStore } from '../../useSessionOSStore';
import { useObsidianStore } from '../../useObsidianStore';
import { nomDeLaNote, notesDuCoffre } from '../../logic/noteDeLaScene';
import {
    ajouterLaBattlemap, battlemapsDeLaScene, battlemapsDuLieu, estUneBattlemap, retirerLaBattlemap,
} from '../../logic/battlemapsDeLaScene';
import type { Scene } from '../../../../types/trame.types';

/**
 * **Ce qu'une scène emporte avec elle à l'écran « Scène en cours »** —
 * ses morceaux de Music-OS et sa note Obsidian (2026-10-12, L1).
 *
 * Des renvois, jamais des contenus : la scène garde des identifiants de pads et
 * un chemin relatif au coffre.
 */

const champ = 'bg-app-bg/40 px-3 py-2 rounded-lg border border-app-border/20 text-xs focus:border-accent/50 outline-none';
const etiquette = 'flex items-center gap-1.5 text-ui-10 font-black uppercase tracking-widest text-app-text/40 px-1';

/** Les morceaux liés : des pads des playlists visibles dans la campagne de la scène. */
export const ChoixDesMorceaux: React.FC<{
    campagneId: string;
    choisis: string[];
    onChange: (ids: string[] | undefined) => void;
}> = ({ campagneId, choisis, onChange }) => {
    const playlists = useMusicStore(s => s.playlists);
    const campagnes = useSessionOSStore(s => s.campaigns);
    const visibles = useMemo(
        () => playlistsVisibles(playlists, campagneId, campagnes.map(c => c.id)),
        [playlists, campagneId, campagnes],
    );
    const nomDuPad = (id: string) =>
        playlists.flatMap(p => p.pads).find(p => p.id === id)?.label ?? 'Morceau disparu';

    return (
        <div className="space-y-2">
            <label className={etiquette}><Music2 size={12} /> Morceaux liés</label>
            {choisis.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {choisis.map(id => (
                        <span key={id} className="flex items-center gap-1 rounded-lg border border-accent/40 bg-accent/15 px-2 py-1 text-ui-10 font-bold text-accent">
                            {nomDuPad(id)}
                            <button
                                type="button" title="Retirer ce morceau"
                                onClick={() => {
                                    const reste = choisis.filter(x => x !== id);
                                    onChange(reste.length > 0 ? reste : undefined);
                                }}
                            ><X size={10} /></button>
                        </span>
                    ))}
                </div>
            )}
            <select
                aria-label="Ajouter un morceau"
                value=""
                onChange={e => { if (e.target.value) onChange([...choisis, e.target.value]); }}
                className={`w-full cursor-pointer ${champ}`}
            >
                <option value="">+ Ajouter un morceau de Music-OS…</option>
                {visibles.map(p => (
                    <optgroup key={p.id} label={p.name}>
                        {p.pads.filter(pad => pad.url && !choisis.includes(pad.id)).map(pad => (
                            <option key={pad.id} value={pad.id}>{pad.label || pad.id}</option>
                        ))}
                    </optgroup>
                ))}
            </select>
        </div>
    );
};

/**
 * **Les battlemaps de la scène** (L5, 2026-10-12) : celles que son lieu propose,
 * plus celles qu'on ajoute, moins celles qu'on écarte. Retirer une battlemap du
 * lieu ne touche pas au lieu — les autres scènes la gardent.
 */
export const ChoixDesBattlemaps: React.FC<{
    scene: Scene;
    onChange: (updates: Pick<Scene, 'battlemapIds' | 'battlemapsRetirees'>) => void;
}> = ({ scene, onChange }) => {
    const atlasMaps = useSessionOSStore(s => s.atlasMaps);
    const atlas = useMemo(() => atlasMaps.filter(m => m.campaignId === scene.campaignId), [atlasMaps, scene.campaignId]);
    const lieu = atlas.find(m => m.id === scene.lieuId);
    const choisies = battlemapsDeLaScene(scene, atlas);
    const duLieu = new Set(battlemapsDuLieu(lieu, atlas).map(m => m.id));
    const proposables = atlas.filter(m => estUneBattlemap(m) && m.id !== lieu?.id && !choisies.some(c => c.id === m.id));

    return (
        <div className="space-y-2">
            <label className={etiquette}><Swords size={12} /> Battlemaps</label>
            {lieu && estUneBattlemap(lieu) && (
                <p className="text-ui-11 text-app-text/40 px-1">Le lieu est lui-même une battlemap : il se charge dans Map-OS.</p>
            )}
            {choisies.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {choisies.map(m => (
                        <span key={m.id} className="flex items-center gap-1 rounded-lg border border-accent/40 bg-accent/15 px-2 py-1 text-ui-10 font-bold text-accent">
                            {m.name}
                            {duLieu.has(m.id) && <span className="font-normal text-accent/60">· du lieu</span>}
                            <button
                                type="button" title="Retirer cette battlemap de la scène"
                                onClick={() => onChange(retirerLaBattlemap(scene, m.id, atlas))}
                            ><X size={10} /></button>
                        </span>
                    ))}
                </div>
            )}
            {proposables.length > 0 && (
                <select
                    aria-label="Ajouter une battlemap"
                    value=""
                    onChange={e => { if (e.target.value) onChange(ajouterLaBattlemap(scene, e.target.value)); }}
                    className={`w-full cursor-pointer ${champ}`}
                >
                    <option value="">+ Ajouter une battlemap de l’Atlas…</option>
                    {proposables.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
            )}
            {choisies.length === 0 && proposables.length === 0 && !(lieu && estUneBattlemap(lieu)) && (
                <p className="text-ui-11 text-app-text/25 italic px-1">Aucune battlemap dans l’Atlas de cette campagne.</p>
            )}
        </div>
    );
};

/** La note de la scène dans le coffre : une saisie qui propose les notes existantes. */
export const ChoixDeLaNote: React.FC<{
    valeur?: string;
    onChange: (chemin: string | undefined) => void;
}> = ({ valeur, onChange }) => {
    const notes = useObsidianStore(s => s.notes);
    const fetchNotes = useObsidianStore(s => s.fetchNotes);
    useEffect(() => {
        if (notes.length === 0) void fetchNotes();
    }, [notes.length, fetchNotes]);
    const chemins = useMemo(() => notesDuCoffre(notes), [notes]);
    const inconnue = !!valeur && chemins.length > 0 && !chemins.includes(valeur);

    return (
        <div className="space-y-2">
            <label className={etiquette}><FileText size={12} /> Note Obsidian</label>
            <input
                aria-label="Note Obsidian de la scène"
                list="notes-du-coffre"
                value={valeur ?? ''}
                placeholder="Commence à taper le nom de la note…"
                onChange={e => onChange(e.target.value.trim() ? e.target.value : undefined)}
                className={`w-full ${champ}`}
            />
            <datalist id="notes-du-coffre">
                {chemins.map(c => <option key={c} value={c}>{nomDeLaNote(c)}</option>)}
            </datalist>
            {inconnue && (
                <p className="text-ui-11 text-etat-alerte px-1">Aucune note de ce nom dans le coffre.</p>
            )}
        </div>
    );
};
