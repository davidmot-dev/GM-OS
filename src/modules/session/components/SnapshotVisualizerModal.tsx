import React from 'react';
import { Music, Waves, Volume2, Lightbulb, ImageIcon, Swords, Globe, RotateCcw } from 'lucide-react';
import type { SessionModuleSnapshot } from '../useSessionOSStore';
import { useSessionOSStore } from '../useSessionOSStore';
import { gmConfirm } from '../../../stores/useModalStore';
import { gmToast } from '../../../stores/useToastStore';
import { BoutonPrincipal, BoutonSecondaire, Etiquette } from '../../../components/socle';

interface SnapshotVisualizerModalProps {
    isOpen: boolean;
    onClose: () => void;
    snapshot: SessionModuleSnapshot;
    sessionName: string;
}

/**
 * **Voir le contenu d'un instantané** — refonte, L5, cadre commun des
 * surcouches. Un bloc par module figé, **en mots** : les deux platines et ce
 * qu'elles jouaient, l'ambiance, la scène de lumière, ce qui était projeté.
 * Le JSON brut reste derrière « Données brutes », pour qui veut vérifier.
 *
 * Le second en-tête et les icônes Material (une police en ligne : hors
 * connexion, on lisait « visibility ») sont partis : le cadre porte le titre.
 */
const SnapshotVisualizerModal: React.FC<SnapshotVisualizerModalProps> = ({ isOpen, onClose, snapshot, sessionName }) => {
    const applySystemSnapshot = useSessionOSStore(s => s.applySystemSnapshot);
    if (!isOpen) return null;

    const nomDuPad = (id: string | null | undefined) => {
        if (!id) return null;
        for (const pl of snapshot.music?.playlists ?? []) {
            const pad = (pl as { pads?: Array<{ id: string; label?: string }> }).pads?.find(p => p.id === id);
            if (pad) return pad.label || id;
        }
        return id;
    };
    const sceneDeLumiere = snapshot.light?.activeSceneId
        ? (snapshot.light.scenes?.[snapshot.light.activeSceneId] as { name?: string } | undefined)?.name ?? snapshot.light.activeSceneId
        : null;
    const projections = Object.entries(snapshot.image?.projections ?? {}).filter(([, chemin]) => !!chemin);

    const bloc = (cle: string, icone: React.ReactNode, titre: string, lignes: React.ReactNode[], brut: unknown) => (
        <div key={cle} className="flex flex-col gap-2 rounded-lg border border-app-border bg-app-bg/40 p-3">
            <p className="flex items-center gap-2 text-ui-10 font-black uppercase tracking-widest text-app-muted">
                <span className="text-accent">{icone}</span>{titre}
            </p>
            <ul className="space-y-1 text-sm text-app-text">
                {lignes.map((l, i) => <li key={i}>{l}</li>)}
            </ul>
            <details className="text-ui-10 text-app-muted">
                <summary className="cursor-pointer select-none hover:text-app-text">Données brutes</summary>
                <pre className="mt-2 max-h-48 overflow-auto rounded border border-app-border bg-app-bg p-2 font-mono text-ui-10 text-app-muted custom-scrollbar">{JSON.stringify(brut, null, 2)}</pre>
            </details>
        </div>
    );

    const blocs: React.ReactNode[] = [];
    if (snapshot.music) {
        blocs.push(bloc('music', <Music size={13} />, 'Musique', [
            <>Platine A : <strong>{nomDuPad(snapshot.music.deckA.activePadId) ?? 'vide'}</strong>{snapshot.music.deckA.isPlaying ? ' — en lecture' : ''}</>,
            <>Platine B : <strong>{nomDuPad(snapshot.music.deckB.activePadId) ?? 'vide'}</strong>{snapshot.music.deckB.isPlaying ? ' — en lecture' : ''}</>,
            <>Volume général : {Math.round(snapshot.music.masterVolume * 100)} %</>,
        ], snapshot.music));
    }
    if (snapshot.ambient) {
        const actives = snapshot.ambient.activeTracks.filter(t => t.isPlaying).length;
        blocs.push(bloc('ambient', <Waves size={13} />, 'Ambiance', [
            <>{actives} piste(s) en lecture</>,
            <>Volume général : {Math.round(snapshot.ambient.masterVolume * 100)} %</>,
        ], snapshot.ambient));
    }
    if (snapshot.sound) {
        blocs.push(bloc('sound', <Volume2 size={13} />, 'Bruitages', [
            <>{snapshot.sound.activePadIds.length} pastille(s) active(s)</>,
            <>Volume général : {Math.round(snapshot.sound.masterVolume * 100)} %</>,
        ], snapshot.sound));
    }
    if (snapshot.light) {
        blocs.push(bloc('light', <Lightbulb size={13} />, 'Lumière', [
            <>Scène : <strong>{sceneDeLumiere ?? 'aucune'}</strong></>,
            <>Luminosité : {Math.round(snapshot.light.globalBrightness)} %</>,
        ], snapshot.light));
    }
    if (snapshot.image) {
        blocs.push(bloc('image', <ImageIcon size={13} />, 'Projection', projections.length
            ? projections.map(([ecran, chemin]) => <><strong>{ecran === 'hub' ? 'Player Hub' : ecran}</strong> : {String(chemin).split(/[\\/]/).pop()}</>)
            : ['Rien de projeté'], snapshot.image));
    }
    if (snapshot.combat) {
        blocs.push(bloc('combat', <Swords size={13} />, 'Combat', [
            <>{snapshot.combat.combatants.length} combattant(s), round {snapshot.combat.round}</>,
        ], snapshot.combat));
    }
    if (snapshot.web) {
        blocs.push(bloc('web', <Globe size={13} />, 'Navigateur', [<>{snapshot.web.links.length} lien(s)</>], snapshot.web));
    }

    const restaurer = () => gmConfirm(
        `Restaurer l'instantané de ${sessionName} ? La musique, l'ambiance, la lumière et la projection reprennent l'état capturé.`,
        () => {
            void applySystemSnapshot(snapshot).then(() => gmToast(`État de ${sessionName} restauré.`, 'success'));
        },
    );

    return (
        <div className="flex h-full flex-col bg-app-bg">
            <div className="flex flex-wrap items-center gap-2 border-b border-app-border px-5 py-3 text-sm">
                <span className="font-display font-bold text-app-text">{sessionName}</span>
                <span className="text-app-muted">capturé le {new Date(snapshot.timestamp).toLocaleString(undefined, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
                <Etiquette ton="succes" className="ml-auto">Prêt pour la restauration</Etiquette>
            </div>
            <div className="grid flex-1 grid-cols-1 gap-3 overflow-y-auto p-5 md:grid-cols-2 custom-scrollbar">
                {blocs}
                {blocs.length === 0 && <p className="text-sm italic text-app-subtle">Cet instantané ne contient aucun module.</p>}
            </div>
            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-app-border px-5 py-3">
                <BoutonSecondaire onClick={onClose}>Fermer</BoutonSecondaire>
                <BoutonPrincipal onClick={restaurer} className="flex items-center gap-2">
                    <RotateCcw size={15} />Restaurer cet état
                </BoutonPrincipal>
            </div>
        </div>
    );
};

export default SnapshotVisualizerModal;
