import React, { useRef, useState } from 'react';
import { Palette, ImagePlus, X, Wand2, Loader2 } from 'lucide-react';
import { useAIStore } from '../../../stores/useAIStore';
import { reduireLImage, REFERENCES_MAX } from '../imagesDeReference';
import { accepterLaLicenceMeta, ErreurDeLicence, proposerUneIdentite } from '../analyseDeStyle';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { tousLesPilotes } from '../../session/store/tousLesPilotes';
import { identiteEnVigueur } from '../identiteVisuelle';
import { gmToast } from '../../../stores/useToastStore';
import type { Campaign } from '../../../types/campaign.types';

/**
 * **L'identité visuelle d'un jeu ou d'une campagne** — 2026-10-17. Le même
 * écran pour les deux : le jeu donne le défaut, la campagne le complète ou le
 * remplace. Ce qui sera ajouté aux images est montré en bas, tel quel.
 */
export type CibleDeLIdentite = { type: 'pilote'; id: string } | { type: 'campagne'; id: string };

type Mode = NonNullable<NonNullable<Campaign['identiteVisuelle']>['mode']>;

const EditeurDIdentiteVisuelle: React.FC<{ cible: CibleDeLIdentite; onClose: () => void }> = ({ cible, onClose }) => {
    const pilotes = tousLesPilotes(useSessionOSStore(s => s.customGameDrivers));
    const campaigns = useSessionOSStore(s => s.campaigns);
    const updateGameDriver = useSessionOSStore(s => s.updateGameDriver);
    const updateCampaign = useSessionOSStore(s => s.updateCampaign);

    const campagne = cible.type === 'campagne' ? campaigns.find(c => c.id === cible.id) : undefined;
    const pilote = cible.type === 'pilote' ? pilotes.find(d => d.id === cible.id) : pilotes.find(d => d.id === campagne?.system);
    const actuelle = cible.type === 'pilote' ? pilote?.identiteVisuelle : campagne?.identiteVisuelle;

    const [style, setStyle] = useState(actuelle?.style ?? '');
    const [aEviter, setAEviter] = useState(actuelle?.aEviter ?? '');
    const [mode, setMode] = useState<Mode>(campagne?.identiteVisuelle?.mode ?? 'complete');
    const [references, setReferences] = useState<string[]>(actuelle?.references ?? []);
    const [analyse, setAnalyse] = useState<{ etat: 'repos' | 'encours' | 'licence' | 'echec'; dit?: string }>({ etat: 'repos' });
    const choixDeFichier = useRef<HTMLInputElement>(null);
    const configDImage = useAIStore(st => st.image);

    if ((cible.type === 'pilote' && !pilote) || (cible.type === 'campagne' && !campagne)) {
        return <p className="p-6 text-sm text-app-text/60">Introuvable — il a peut-être été supprimé.</p>;
    }

    const brouillon = { style: style.trim(), aEviter: aEviter.trim() || undefined, ...(references.length ? { references } : {}) };

    const ajouterDesImages = async (fichiers: FileList | null) => {
        const place = REFERENCES_MAX - references.length;
        const choisis = Array.from(fichiers ?? []).filter(f => f.type.startsWith('image/')).slice(0, place);
        try {
            const reduites = await Promise.all(choisis.map(f => reduireLImage(f)));
            setReferences(r => [...r, ...reduites].slice(0, REFERENCES_MAX));
        } catch (err) {
            gmToast(`Image illisible — ${err instanceof Error ? err.message : String(err)}`, 'warning');
        }
    };

    /** Le modèle de vision propose ; le meneur relit avant d'enregistrer. */
    const proposer = async () => {
        setAnalyse({ etat: 'encours' });
        try {
            const proposition = await proposerUneIdentite(references, configDImage);
            setStyle(proposition.style);
            if (proposition.aEviter) setAEviter(proposition.aEviter);
            setAnalyse({ etat: 'repos' });
        } catch (err) {
            const dit = err instanceof Error ? err.message : String(err);
            setAnalyse({ etat: err instanceof ErreurDeLicence ? 'licence' : 'echec', dit });
        }
    };

    const accepterLaLicence = async () => {
        setAnalyse({ etat: 'encours' });
        try {
            await accepterLaLicenceMeta(configDImage);
            await proposer();
        } catch (err) {
            setAnalyse({ etat: 'echec', dit: err instanceof Error ? err.message : String(err) });
        }
    };
    const apercu = cible.type === 'pilote'
        ? identiteEnVigueur({ identiteVisuelle: brouillon }, null)
        : identiteEnVigueur(pilote, { identiteVisuelle: { ...brouillon, mode } });

    const enregistrer = () => {
        const vide = !brouillon.style && !brouillon.aEviter && references.length === 0;
        if (cible.type === 'pilote') updateGameDriver(cible.id, { identiteVisuelle: vide ? undefined : brouillon });
        else updateCampaign(cible.id, { identiteVisuelle: vide ? undefined : { ...brouillon, mode } });
        gmToast(vide ? 'Identité visuelle retirée.' : 'Identité visuelle enregistrée.', 'success');
        onClose();
    };

    const zone = 'w-full rounded-xl border border-app-border/50 bg-app-bg/40 p-3 text-sm text-app-text outline-none focus:border-accent/50 resize-y';
    const titre = 'text-ui-10 font-black uppercase tracking-widest text-app-text/50';

    return (
        <div className="flex flex-col gap-4 px-5 py-4" data-editeur-identite-visuelle={cible.type}>
            <p className="text-ui-11 text-app-text/60 leading-relaxed">
                {cible.type === 'pilote'
                    ? <>Ajoutée à chaque image générée pour <strong>{pilote!.name}</strong>. En anglais : les générateurs le comprennent mieux.</>
                    : <>Pour la campagne <strong>{campagne!.name}</strong>. En anglais : les générateurs le comprennent mieux.</>}
            </p>

            {cible.type === 'campagne' && (
                <div className="space-y-2">
                    <p className={titre}>Identité du jeu ({pilote?.name ?? '—'})</p>
                    <p className="text-ui-11 text-app-text/60 italic">
                        {pilote?.identiteVisuelle?.style || 'Aucune : le jeu n’en déclare pas.'}
                    </p>
                    <label className="flex items-center gap-2 text-sm">
                        <select value={mode} onChange={e => setMode(e.target.value as Mode)} aria-label="La campagne complète ou remplace"
                            className="rounded-lg border border-app-border bg-app-bg px-2 py-1 text-xs">
                            <option value="complete">La compléter</option>
                            <option value="remplace">La remplacer</option>
                        </select>
                    </label>
                </div>
            )}

            <div className="space-y-2" data-images-d-exemple>
                <p className={titre}>Images d’exemple — {references.length} / {REFERENCES_MAX}</p>
                <div className="flex flex-wrap items-center gap-2">
                    {references.map((r, i) => (
                        <div key={i} className="relative">
                            <img src={r} alt={`Exemple ${i + 1}`} className="h-20 w-20 rounded-lg border border-app-border object-cover" />
                            <button type="button" onClick={() => setReferences(rs => rs.filter((_, j) => j !== i))} aria-label={`Retirer l’exemple ${i + 1}`}
                                className="absolute -right-1.5 -top-1.5 rounded-full border border-app-border bg-app-surface p-0.5 text-app-text/60 hover:text-etat-danger">
                                <X size={11} />
                            </button>
                        </div>
                    ))}
                    {references.length < REFERENCES_MAX && (
                        <button type="button" onClick={() => choixDeFichier.current?.click()}
                            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-app-border text-ui-9 font-bold text-app-text/50 hover:border-accent/50 hover:text-accent">
                            <ImagePlus size={16} /> Ajouter
                        </button>
                    )}
                    <input ref={choixDeFichier} type="file" accept="image/*" multiple hidden aria-label="Choisir des images d’exemple"
                        onChange={e => { void ajouterDesImages(e.target.files); e.target.value = ''; }} />
                </div>
                <p className="text-ui-10 text-app-text/40">
                    Réduites à 512 pixels. Avec un modèle FLUX.2, elles accompagnent chaque image générée comme guide de style.
                </p>
                {references.length > 0 && (
                    <button type="button" onClick={() => void proposer()} disabled={analyse.etat === 'encours'}
                        className="flex items-center gap-1.5 rounded-lg border border-accent/40 px-3 py-1.5 text-ui-10 font-black uppercase tracking-widest text-accent hover:bg-accent/10 disabled:opacity-40">
                        {analyse.etat === 'encours' ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />} Proposer depuis ces images
                    </button>
                )}
                {analyse.etat === 'licence' && (
                    <div className="rounded-lg border border-etat-alerte/40 bg-etat-alerte/10 p-3 text-ui-11 space-y-2" data-licence-meta>
                        <p>Cloudflare demande d’accepter <strong>une fois</strong> la licence de Meta (Llama 3.2 Vision) et sa politique d’usage, pour ce compte.</p>
                        <button type="button" onClick={() => void accepterLaLicence()}
                            className="rounded-lg border border-etat-alerte/50 px-3 py-1 text-ui-10 font-black uppercase tracking-widest">
                            J’accepte la licence de Meta
                        </button>
                    </div>
                )}
                {analyse.etat === 'echec' && <p className="text-ui-11 text-etat-danger">Analyse impossible — {analyse.dit}</p>}
            </div>

            <label className="space-y-1">
                <span className={titre}>Style — médium, palette, lumière, matière, époque</span>
                <textarea value={style} onChange={e => setStyle(e.target.value)} rows={4} className={zone}
                    placeholder="e.g. 1980s neo-noir illustration, rain-soaked neon, teal and amber palette, grainy film texture, heavy shadows" />
            </label>
            <label className="space-y-1">
                <span className={titre}>À éviter</span>
                <textarea value={aEviter} onChange={e => setAEviter(e.target.value)} rows={2} className={zone}
                    placeholder="e.g. cartoon style, bright daylight, readable text" />
            </label>

            <div className="rounded-xl border border-accent/30 bg-accent/5 p-3 space-y-1" data-apercu-identite>
                <p className={`${titre} flex items-center gap-1.5`}><Palette size={11} className="text-accent" />Ce qui sera ajouté aux images</p>
                {apercu
                    ? <p className="text-ui-11 text-app-text/80">{`Visual identity: ${apercu.style}`}{apercu.aEviter ? ` · Never include: ${apercu.aEviter}` : ''}</p>
                    : <p className="text-ui-11 text-app-text/50 italic">Rien : les images partent sans identité.</p>}
                {apercu?.references?.length ? (
                    <p className="text-ui-10 text-app-text/50">+ {apercu.references.length} image{apercu.references.length > 1 ? 's' : ''} d’exemple, pour les modèles FLUX.2.</p>
                ) : null}
            </div>

            <div className="flex justify-end gap-2">
                <button type="button" onClick={onClose} className="rounded-lg border border-app-border px-4 py-2 text-ui-10 font-black uppercase tracking-widest">Annuler</button>
                <button type="button" onClick={enregistrer} className="rounded-lg bg-accent px-4 py-2 text-ui-10 font-black uppercase tracking-widest text-app-on-accent">Enregistrer</button>
            </div>
        </div>
    );
};

export default EditeurDIdentiteVisuelle;
