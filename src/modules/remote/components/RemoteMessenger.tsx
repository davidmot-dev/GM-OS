import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Send, User, Shield } from 'lucide-react';
import type { SessionMessage } from '../../../types/session.types';

/**
 * **La messagerie du meneur, sur sa tablette — 2026-09-05.**
 *
 * Demandée par David. Le mécanisme existait entièrement côté meneur
 * (`CockpitMessenger`) et **rien n'en arrivait ici** : le fil n'était pas dans
 * le flux, et aucune action ne permettait d'en émettre un.
 *
 * ⚠️ **Le piège qu'il fallait éviter.** `session:send-message` existe, mais son
 * handler ne fait qu'ajouter le message à la liste du meneur — *il ne le
 * rediffuse pas*. S'en servir aurait produit des messages qui apparaissent dans
 * le fil du cockpit **sans jamais atteindre le joueur** : on croit avoir parlé.
 * D'où `remote:session:gm-message`, qui passe par `sendDirectMessage`.
 */

interface RemoteMessengerProps {
    messages: SessionMessage[];
    /** Les personnages joignables, tirés des joueurs de la campagne. */
    destinataires: { id: string; nom: string }[];
    onEnvoyer: (toId: string, toName: string, contenu: string) => void;
}

/** L'heure seule : sur une tablette, la date d'un message du soir n'apprend rien. */
function heure(instant: number): string {
    return new Date(instant).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

const RemoteMessenger: React.FC<RemoteMessengerProps> = ({ messages, destinataires, onEnvoyer }) => {
    const [filtre, setFiltre] = useState<string>('tous');
    const [texte, setTexte] = useState('');
    const finDuFil = useRef<HTMLDivElement>(null);

    /*
      **Les correspondants viennent des deux côtés.** Un joueur qui a écrit puis
      s'est déconnecté doit rester joignable : *une conversation ne disparaît pas
      parce que l'appareil d'en face s'est éteint.* C'est la règle du messager du
      cockpit, reprise telle quelle.
    */
    const correspondants = useMemo(() => {
        const connus = new Map(destinataires.map(d => [d.id, d.nom]));
        messages.forEach((m) => {
            if (m.fromId !== 'GM') connus.set(m.fromId, m.fromName);
        });
        return [...connus.entries()].map(([id, nom]) => ({ id, nom }))
            .sort((a, b) => a.nom.localeCompare(b.nom));
    }, [destinataires, messages]);

    const fil = useMemo(() => {
        const tries = [...messages].sort((a, b) => a.timestamp - b.timestamp);
        if (filtre === 'tous') return tries;
        return tries.filter(m => m.fromId === filtre || m.toId === filtre);
    }, [messages, filtre]);

    /* Le fil se lit par le bas : c'est le dernier message qui compte. */
    useEffect(() => {
        finDuFil.current?.scrollIntoView({ block: 'end' });
    }, [fil.length]);

    const destinataireChoisi = correspondants.find(c => c.id === filtre);

    const envoyer = () => {
        if (!destinataireChoisi || !texte.trim()) return;
        onEnvoyer(destinataireChoisi.id, destinataireChoisi.nom, texte.trim());
        setTexte('');
    };

    return (
        <div className="flex flex-col gap-3 h-full">
            <div className="flex gap-1 overflow-x-auto no-scrollbar shrink-0">
                <button
                    onClick={() => setFiltre('tous')}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-colors ${filtre === 'tous' ? 'bg-accent text-app-bg' : 'bg-white/5 text-slate-500 hover:text-slate-300'}`}
                >
                    Tous
                </button>
                {correspondants.map(({ id, nom }) => (
                    <button
                        key={id}
                        onClick={() => setFiltre(id)}
                        className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-colors ${filtre === id ? 'bg-accent text-app-bg' : 'bg-white/5 text-slate-500 hover:text-slate-300'}`}
                    >
                        {nom}
                    </button>
                ))}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar rounded-2xl bg-white/[0.03] border border-white/5 p-3 flex flex-col gap-2">
                {fil.length === 0 ? (
                    <p className="text-sm italic text-slate-500 text-center py-10">
                        {correspondants.length === 0
                            ? 'Aucun joueur connecté, et aucun message.'
                            : 'Rien dans ce fil.'}
                    </p>
                ) : fil.map((m) => {
                    const duMeneur = m.fromId === 'GM';
                    return (
                        <div key={m.id} className={`flex ${duMeneur ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] rounded-xl px-3 py-2 flex flex-col gap-0.5 ${duMeneur ? 'bg-accent/15 border border-accent/30' : 'bg-white/5 border border-white/10'}`}>
                                <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-slate-500">
                                    {duMeneur ? <Shield size={10} /> : <User size={10} />}
                                    {duMeneur ? `→ ${m.toName}` : m.fromName}
                                    <span className="ml-auto font-mono tabular-nums">{heure(m.timestamp)}</span>
                                </span>
                                <span className="text-xs leading-relaxed text-slate-200 whitespace-pre-wrap">{m.content}</span>
                            </div>
                        </div>
                    );
                })}
                <div ref={finDuFil} />
            </div>

            {/*
              **On n'écrit qu'à quelqu'un.** Le champ reste fermé tant que « Tous »
              est sélectionné : *un message sans destinataire n'existe pas dans ce
              modèle*, et deviner le dernier correspondant enverrait un jour le
              secret d'un joueur à un autre.
            */}
            <div className="shrink-0 flex items-center gap-2">
                <input
                    type="text"
                    value={texte}
                    onChange={(e) => setTexte(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') envoyer(); }}
                    disabled={!destinataireChoisi}
                    placeholder={destinataireChoisi
                        ? `Écrire à ${destinataireChoisi.nom}…`
                        : 'Choisissez un destinataire ci-dessus'}
                    aria-label="Message à envoyer"
                    className="flex-1 h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-sm text-app-text placeholder:text-slate-600 outline-none focus:border-accent/40 disabled:opacity-40"
                />
                <button
                    onClick={envoyer}
                    disabled={!destinataireChoisi || !texte.trim()}
                    aria-label="Envoyer le message"
                    className="shrink-0 w-10 h-10 rounded-xl bg-accent text-app-bg flex items-center justify-center active:scale-95 transition-transform disabled:opacity-30 disabled:grayscale"
                >
                    <Send size={16} />
                </button>
            </div>
        </div>
    );
};

export default RemoteMessenger;
