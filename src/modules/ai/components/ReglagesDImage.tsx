import React from 'react';
import { ImagePlus, Eye, EyeOff, ExternalLink, Beaker, Loader2 } from 'lucide-react';
import { useAIStore } from '../../../stores/useAIStore';
import { genererViaCloudflare, octetsDeLImage } from '../cloudflareImage';

/**
 * Le service qui fabrique les images — **séparé de celui qui répond aux
 * questions**.
 *
 * **Pourquoi il fallait un bloc à part.** `AIProvider` désigne le fournisseur de
 * *texte*, celui que `activeProvider` sélectionne. Générer une image est un
 * autre métier : inscrire Cloudflare dans la même liste l'aurait proposé là où
 * il ne sait rien répondre. C'est d'ailleurs déjà la réalité du code — sur les
 * trois recours de `generateImage`, deux ignorent complètement le fournisseur
 * actif.
 *
 * **Pourquoi Cloudflare.** Le recours « gratuit » d'avant était un Space public
 * HuggingFace appartenant à un tiers, appelé en anonyme : file d'attente, mise
 * en veille, renommage — rien sous notre contrôle, et c'est ce qui avait cessé
 * de fonctionner. Workers AI offre 10 000 Neurons par jour, soit de l'ordre de
 * deux mille images en 512×512. *Un service qu'on a contractualisé passe avant
 * un service qu'on emprunte.*
 *
 * **Le jeton ne vit pas ici.** Il part au trousseau natif par
 * `updateImageConfig`, et `partialize` le retire de l'état enregistré — le même
 * traitement que les clés de conversation.
 */
const ReglagesDImage: React.FC = () => {
    const { image, updateImageConfig } = useAIStore();
    const [visible, setVisible] = React.useState(false);

    /**
     * Le résultat du dernier essai.
     *
     * **Il montre l'image, pas seulement un « OK ».** Un service peut répondre
     * 200 et rendre autre chose que ce qu'on croit — c'est arrivé assez souvent
     * dans ce projet pour qu'on ne s'en remette plus à un code de retour. Voir
     * la vignette, c'est vérifier ; lire « succès », c'est faire confiance.
     */
    const [essai, setEssai] = React.useState<
        { etat: 'encours' } | { etat: 'ok'; apercu: string; octets: number } | { etat: 'echec'; dit: string } | null
    >(null);

    const pret = !!image.accountId && !!image.apiKey;

    const tester = async () => {
        setEssai({ etat: 'encours' });
        try {
            // Le MÊME chemin que la génération réelle — un test qui emprunterait
            // une autre route ne testerait pas ce qui tourne en séance.
            const base64 = await genererViaCloudflare(
                'a lone astronaut helmet resting on red desert sand, cinematic lighting',
                image,
            );
            setEssai({ etat: 'ok', apercu: `data:image/jpeg;base64,${base64}`, octets: octetsDeLImage(base64).byteLength });
        } catch (err) {
            setEssai({ etat: 'echec', dit: err instanceof Error ? err.message : String(err) });
        }
    };

    return (
        <div className="p-6 rounded-2xl border border-app-border/20 bg-app-surface/40 space-y-5">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-black/20 flex items-center justify-center border border-white/5 text-orange-400">
                        <ImagePlus size={22} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h5 className="font-black uppercase tracking-tighter text-app-text">Génération d'image</h5>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                                pret ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40'
                            }`}>
                                {pret ? 'configuré' : 'non configuré'}
                            </span>
                        </div>
                        <p className="text-[10px] text-app-text/40 font-bold uppercase tracking-widest">
                            Cloudflare Workers AI — 10 000 neurones par jour
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={tester}
                    disabled={!pret || essai?.etat === 'encours'}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent/10 border border-accent/30 text-[10px] font-black uppercase tracking-widest text-accent hover:bg-accent/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    {essai?.etat === 'encours'
                        ? <><Loader2 size={12} className="animate-spin" /> Essai…</>
                        : <><Beaker size={12} /> Tester</>}
                </button>
                <a
                    href="https://dash.cloudflare.com/?to=/:account/ai/workers-ai"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-app-text/60 hover:text-app-text hover:bg-white/10 transition-all"
                >
                    <ExternalLink size={12} /> Tableau de bord
                </a>
                </div>
            </div>

            {/*
                Le résultat de l'essai, montré et non résumé. Un échec rend le
                message de Cloudflare tel quel : quota épuisé, jeton sans la
                permission Edit et identifiant de compte erroné sont trois
                problèmes distincts, et les confondre ferait chercher au mauvais
                endroit.
            */}
            {essai?.etat === 'ok' && (
                <div className="flex items-center gap-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <img src={essai.apercu} alt="Essai de génération" className="w-20 h-20 rounded-lg object-cover" />
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-emerald-400">Cloudflare répond</p>
                        <p className="text-[11px] text-app-text/50 mt-1">
                            {Math.round(essai.octets / 1024)} Ko reçus. La génération d'image passera par lui.
                        </p>
                    </div>
                </div>
            )}
            {essai?.etat === 'echec' && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                    <p className="text-[11px] font-black uppercase tracking-widest text-red-400">Cloudflare refuse</p>
                    <p className="text-[11px] text-app-text/60 mt-1 font-mono leading-relaxed">{essai.dit}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label htmlFor="cf-account" className="text-[10px] font-black uppercase tracking-widest text-app-text/40 px-1">
                        Identifiant de compte
                    </label>
                    <input
                        id="cf-account"
                        type="text"
                        value={image.accountId || ''}
                        onChange={e => updateImageConfig({ accountId: e.target.value.trim() })}
                        placeholder="Visible sur le tableau de bord Workers AI"
                        className="w-full bg-app-bg/40 px-4 py-3 rounded-xl border border-app-border/20 font-mono text-xs text-app-text focus:border-accent/50 outline-none"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="cf-token" className="text-[10px] font-black uppercase tracking-widest text-app-text/40 px-1">
                        Jeton d'API
                    </label>
                    <div className="relative">
                        <input
                            id="cf-token"
                            type={visible ? 'text' : 'password'}
                            value={image.apiKey || ''}
                            onChange={e => updateImageConfig({ apiKey: e.target.value.trim() })}
                            placeholder="Permissions Workers AI — Read et Edit"
                            className="w-full bg-app-bg/40 px-4 py-3 pr-11 rounded-xl border border-app-border/20 font-mono text-xs text-app-text focus:border-accent/50 outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => setVisible(v => !v)}
                            title={visible ? 'Masquer' : 'Afficher'}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-app-text/30 hover:text-app-text transition-colors"
                        >
                            {visible ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label htmlFor="cf-model" className="text-[10px] font-black uppercase tracking-widest text-app-text/40 px-1">
                    Modèle
                </label>
                <input
                    id="cf-model"
                    type="text"
                    value={image.modelId}
                    onChange={e => updateImageConfig({ modelId: e.target.value.trim() })}
                    className="w-full bg-app-bg/40 px-4 py-3 rounded-xl border border-app-border/20 font-mono text-xs text-app-text focus:border-accent/50 outline-none"
                />
            </div>

            {/*
                Ce que l'écran doit dire, parce que personne ne devrait avoir à
                le déduire d'un échec : d'où viennent les deux valeurs, et où va
                le jeton.
            */}
            <p className="text-[11px] text-app-text/40 leading-relaxed italic">
                Les deux valeurs se récupèrent sur le tableau de bord Workers AI, en cliquant
                « Use REST API » puis « Create a Workers AI API Token ». Aucun Worker n'est à
                déployer. <span className="text-app-text/60">Le jeton est enregistré dans le trousseau
                du système, jamais dans les préférences de l'application.</span>
            </p>

            <p className="text-[11px] text-app-text/30 leading-relaxed">
                Sans ces valeurs, la génération d'image retombe sur ses recours précédents —
                Ollama en local s'il tourne, puis un espace HuggingFace public dont la
                disponibilité ne dépend pas de nous.
            </p>
        </div>
    );
};

export default ReglagesDImage;
