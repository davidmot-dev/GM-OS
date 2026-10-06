import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Bouton } from '../../../components/socle/Bouton';
import { Panneau } from '../../../components/socle/Panneau';
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
 *
 * ⛔ **Et une restriction que j'avais posée à tort** (corrigée le 2026-09-05,
 * dans la foulée) : le champ d'écriture restait fermé sur « Tous », au motif
 * qu'un message sans destinataire n'existe pas. C'était faux — **le meneur peut
 * écrire à tout le monde depuis son cockpit depuis toujours**, en envoyant à
 * l'identifiant `'all'`, et le Tablet Hub des joueurs le reçoit comme *Canal
 * Général*. Tout le circuit existait ; je l'avais fermé côté tablette.
 *
 * *Une précaution qui interdit ce que le reste de l'application permet n'est pas
 * une précaution, c'est une régression.*
 */

interface RemoteMessengerProps {
    messages: SessionMessage[];
    /** Les personnages joignables, tirés des joueurs de la campagne. */
    destinataires: { id: string; nom: string }[];
    onEnvoyer: (toId: string, toName: string, contenu: string) => void;
}

/**
 * L'identifiant du canal général, tel que le cockpit et le Tablet Hub le
 * connaissent déjà. **Il ne s'invente pas ici** : le hub teste `toId === 'all'`
 * pour afficher « Canal Général », et une valeur différente n'atteindrait
 * personne.
 */
const CANAL_GENERAL = 'all';

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

    /*
      Le fil se lit par le bas : c'est le dernier message qui compte.

      `scrollIntoView` est appelé avec précaution — il manque dans jsdom, et un
      composant qui **casse** parce qu'une commodité du DOM est absente rend un
      écran blanc pour un défilement. *Le confort ne doit jamais faire tomber ce
      qu'il accompagne.*
    */
    useEffect(() => {
        finDuFil.current?.scrollIntoView?.({ block: 'end' });
    }, [fil.length]);

    /*
      **« Tous » est un destinataire, pas une absence de destinataire.** C'est le
      canal général, celui que le hub des joueurs affiche à part.
    */
    const destinataireChoisi = filtre === 'tous'
        ? { id: CANAL_GENERAL, nom: 'Tous les joueurs' }
        : correspondants.find(c => c.id === filtre);

    const envoyer = () => {
        if (!destinataireChoisi || !texte.trim()) return;
        onEnvoyer(destinataireChoisi.id, destinataireChoisi.nom, texte.trim());
        setTexte('');
    };

    return (
        <div className="flex min-w-0 min-h-0 flex-col gap-3 h-full">
            <nav aria-label="Destinataires des messages" className="grid grid-cols-2 min-[700px]:grid-cols-4 gap-2 shrink-0">
                <Bouton habillage="libre" cibleTactile
                    onClick={() => setFiltre('tous')}
                    aria-pressed={filtre === 'tous'}
                    title="Tout le fil, et le canal général pour écrire"
                    className={`min-w-0 min-h-[44px] px-3 py-2 rounded-lg text-[14px] font-bold [overflow-wrap:anywhere] transition-colors ${filtre === 'tous' ? 'bg-accent text-app-on-accent' : 'bg-app-text/5 text-app-muted hover:text-app-text'}`}
                >
                    Tous
                </Bouton>
                {correspondants.map(({ id, nom }) => (
                    <Bouton habillage="libre" cibleTactile
                        key={id}
                        onClick={() => setFiltre(id)}
                        aria-pressed={filtre === id}
                        className={`min-w-0 min-h-[44px] px-3 py-2 rounded-lg text-[14px] font-bold [overflow-wrap:anywhere] transition-colors ${filtre === id ? 'bg-accent text-app-on-accent' : 'bg-app-text/5 text-app-muted hover:text-app-text'}`}
                    >
                        {nom}
                    </Bouton>
                ))}
            </nav>

            <Panneau as="div" habillage="libre" className="flex-1 min-h-0 overflow-y-auto no-scrollbar rounded-2xl bg-app-text/[0.03] border border-app-text/5 p-3 flex flex-col gap-2">
                {fil.length === 0 ? (
                    <p className="text-[16px] italic text-app-muted text-center py-10">
                        {correspondants.length === 0
                            ? 'Aucun joueur connecté, et aucun message.'
                            : 'Rien dans ce fil.'}
                    </p>
                ) : fil.map((m) => {
                    const duMeneur = m.fromId === 'GM';
                    return (
                        <div key={m.id} className={`flex ${duMeneur ? 'justify-end' : 'justify-start'}`}>
                            <div className={`min-w-0 max-w-[90%] rounded-xl px-3 py-2 flex flex-col gap-1 [overflow-wrap:anywhere] ${duMeneur ? 'bg-accent/15 border border-accent/30' : 'bg-app-text/5 border border-app-text/10'}`}>
                                <span className="flex flex-wrap items-center gap-1.5 text-[14px] font-bold text-app-muted">
                                    {duMeneur ? <Shield size={10} /> : <User size={10} />}
                                    {duMeneur
                                        ? `→ ${m.toId === CANAL_GENERAL ? 'Tous' : m.toName}`
                                        : m.fromName}
                                    <span className="ml-auto font-mono tabular-nums">{heure(m.timestamp)}</span>
                                </span>
                                <span className="text-[16px] leading-relaxed text-app-text whitespace-pre-wrap">{m.content}</span>
                            </div>
                        </div>
                    );
                })}
                <div ref={finDuFil} />
            </Panneau>

            {/*
              **Le champ dit toujours à qui l'on parle.** C'est la seule garde qui
              compte ici : *deviner le destinataire enverrait un jour le secret
              d'un joueur à un autre.* Sur « Tous », il dit « Tous les joueurs » —
              le message part au canal général, et tout le monde le lit.
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
                    title={destinataireChoisi ? `Message à ${destinataireChoisi.nom}` : undefined}
                    aria-label="Message à envoyer"
                    className="min-w-0 flex-1 h-[44px] px-3 rounded-xl bg-app-text/5 border border-app-text/10 text-[16px] text-app-text placeholder:text-app-subtle outline-none focus:border-accent/40 disabled:opacity-40"
                />
                <Bouton habillage="libre" cibleTactile
                    onClick={envoyer}
                    disabled={!destinataireChoisi || !texte.trim()}
                    aria-label="Envoyer le message"
                    className="shrink-0 min-h-[44px] px-3 rounded-xl bg-accent text-app-on-accent flex items-center justify-center gap-2 text-[14px] font-bold active:scale-95 transition-transform disabled:opacity-30 disabled:grayscale"
                >
                    <Send size={16} /> Envoyer
                </Bouton>
            </div>
        </div>
    );
};

export default RemoteMessenger;
