import React, { useState } from 'react';
import { FileText, Wand2 } from 'lucide-react';
import {
    decalageDepuis, enregistrerLeLivre, livreDeLaCle, MOTIFS_DU_LIVRE, nomDuFichier, retirerLeLivre,
    type LivreDuJeu, type MotifDuLivre,
} from '../livres';

/**
 * **La carte « PDF du livre »** de la Forge, sous le choix du livre documenté — « Les chemins des
 * livres », étape B (06/11/2026), maquette Stitch validée par David (`stitch/livres/pdf-du-livre.png`).
 *
 * David : *« je n'ai pas envie de recopier mes livres un peu partout, donc un chemin pour moi est une
 * bonne idée »*. On garde le chemin du PDF et le décalage de ses pages ; le livre n'est jamais copié.
 * Le décalage se saisit comme on le constate (« la page imprimée 291 est la page 294 du PDF ») ou se
 * **propose** depuis le livre : une proposition qu'on retient, jamais une écriture silencieuse.
 */
interface PdfDuLivreProps {
    /** `jeu` ou le slug du supplément choisi. */
    cle: string;
    /** Le titre affiché du livre (« Livre de base », le titre du supplément). */
    titre: string;
    livres: LivreDuJeu[];
    onEcrire: (livres: LivreDuJeu[]) => Promise<boolean>;
    /** Le registre, pour la note de pied (`docs/systems/alien/livres.json`). */
    cheminDuRegistre: string | null;
}

type Etat =
    | { genre: 'inconnu' }
    | { genre: 'verification' }
    | { genre: 'repond'; pages: number }
    | { genre: 'muet'; motif: MotifDuLivre };

const BOUTON = 'px-3 py-1.5 rounded-lg border border-app-text/10 bg-app-text/5 text-ui-11 font-bold text-app-text/80 hover:border-gm-violet/40 disabled:opacity-40 disabled:cursor-not-allowed';
const CHAMP_PAGE = 'w-12 bg-app-bg border border-app-text/15 rounded-md px-1.5 py-1 text-center text-ui-12 font-mono text-app-text focus:outline-none focus:border-gm-violet/60';

const PdfDuLivre: React.FC<PdfDuLivreProps> = ({ cle, titre, livres, onEcrire, cheminDuRegistre }) => {
    const livre = livreDeLaCle(livres, cle);
    // Le formulaire repart du livre enregistré quand on change de livre documenté (la clé).
    const [cleLue, setCleLue] = useState(cle);
    const [chemin, setChemin] = useState(livre?.chemin ?? '');
    const [imprimee, setImprimee] = useState('');
    const [pdf, setPdf] = useState('');
    const [decalage, setDecalage] = useState<number>(livre?.decalage ?? 0);
    const [etat, setEtat] = useState<Etat>({ genre: 'inconnu' });
    const [proposition, setProposition] = useState<{ decalage: number; concordantes: number } | { motif: string } | 'mesure' | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    // Le livre enregistré peut arriver après le premier rendu (le registre se lit sur le disque) :
    // vu à l'e2e le 06/11, la carte restait vide. Elle reprend le chemin et le décalage enregistrés
    // chaque fois qu'ils changent ; changer de livre efface aussi l'état et la proposition.
    const enregistre = `${livre?.chemin ?? ''}|${livre?.decalage ?? 0}`;
    const [enregistreLu, setEnregistreLu] = useState(enregistre);
    if (cleLue !== cle || enregistreLu !== enregistre) {
        if (cleLue !== cle) { setEtat({ genre: 'inconnu' }); setProposition(null); setMessage(null); }
        setCleLue(cle);
        setEnregistreLu(enregistre);
        setChemin(livre?.chemin ?? '');
        setDecalage(livre?.decalage ?? 0);
        setImprimee(''); setPdf('');
    }

    const pont = window.appBridge?.livres;
    const cheminPropre = chemin.trim();
    const modifie = cheminPropre !== (livre?.chemin ?? '') || decalage !== (livre?.decalage ?? 0);

    const changerLesPages = (i: string, p: string) => {
        setImprimee(i); setPdf(p);
        const a = Number(i), b = Number(p);
        if (i.trim() && p.trim() && Number.isInteger(a) && Number.isInteger(b)) setDecalage(decalageDepuis(a, b));
    };

    const choisir = async () => {
        const choisi = await pont?.choisir(cheminPropre || undefined);
        if (choisi) { setChemin(choisi); setEtat({ genre: 'inconnu' }); setProposition(null); }
    };

    const verifier = async () => {
        if (!pont || !cheminPropre) return;
        setEtat({ genre: 'verification' });
        const v = await pont.verifier(cheminPropre);
        setEtat(v.repond ? { genre: 'repond', pages: v.pages } : { genre: 'muet', motif: v.motif });
    };

    const proposer = async () => {
        if (!pont || !cheminPropre) return;
        setProposition('mesure');
        const p = await pont.proposerDecalage(cheminPropre);
        setProposition(p.trouve ? { decalage: p.mesure.decalage, concordantes: p.mesure.concordantes } : { motif: MOTIFS_DU_LIVRE[p.motif] });
        if (p.trouve) setEtat({ genre: 'repond', pages: p.pages });
    };

    const enregistrer = async () => {
        if (!cheminPropre) return;
        const ok = await onEcrire(enregistrerLeLivre(livres, cle, { chemin: cheminPropre, decalage, ...(livre ? {} : { titre }) }));
        setMessage(ok ? 'Enregistré.' : 'L’enregistrement a échoué : le registre n’a pas changé.');
    };

    const retirer = async () => {
        if (!livre) { setChemin(''); return; }
        const ok = await onEcrire(retirerLeLivre(livres, cle));
        if (ok) { setChemin(''); setDecalage(0); setEtat({ genre: 'inconnu' }); setProposition(null); }
        setMessage(ok ? 'Le livre est retiré du registre.' : 'Le retrait a échoué : le registre n’a pas changé.');
    };

    return (
        <section className="rounded-xl border border-app-text/10 bg-app-text/[0.03] p-4 space-y-3" data-pdf-du-livre aria-label="PDF du livre">
            <h3 className="flex items-center gap-2 text-ui-10 font-black uppercase tracking-[0.2em] text-gm-violet font-display">
                <FileText size={14} /> PDF du livre
            </h3>

            <input
                value={chemin}
                onChange={e => { setChemin(e.target.value); setEtat({ genre: 'inconnu' }); setProposition(null); }}
                placeholder="Aucun PDF — choisissez-le, ou collez son chemin"
                aria-label="Chemin du PDF du livre"
                title={chemin || undefined}
                className="w-full bg-app-bg border border-app-text/10 rounded-lg px-3 py-2 text-ui-11 font-mono text-app-text/80 focus:outline-none focus:border-gm-violet/50 placeholder:text-app-text/25 placeholder:font-sans"
            />
            {/* Le panneau est étroit (≈ 250 px) : le champ ne montre que la racine du NAS. Le nom du
                fichier dit quel livre est choisi (vu sur la capture du 06/11). */}
            {cheminPropre && (
                <p className="-mt-2 text-ui-11 font-mono font-bold text-app-text/80 break-all" data-nom-du-fichier>
                    {nomDuFichier(cheminPropre)}
                </p>
            )}

            <div role="status" className="text-ui-11 min-h-[1rem]">
                {etat.genre === 'verification' && <span className="text-app-text/50">Vérification…</span>}
                {etat.genre === 'repond' && (
                    <span className="flex items-center gap-2 text-etat-succes">
                        <span className="h-2 w-2 rounded-full bg-etat-succes" /> Le livre répond — {etat.pages} pages
                    </span>
                )}
                {etat.genre === 'muet' && (
                    <span className="flex items-center gap-2 text-etat-alerte">
                        <span className="h-2 w-2 rounded-full bg-etat-alerte" /> {MOTIFS_DU_LIVRE[etat.motif]}
                    </span>
                )}
            </div>

            <div className="flex items-center gap-2">
                <button type="button" className={BOUTON} onClick={() => void choisir()} disabled={!pont}>Choisir…</button>
                <button type="button" className={BOUTON} onClick={() => void verifier()} disabled={!pont || !cheminPropre || etat.genre === 'verification'}>Vérifier</button>
                <button type="button" className="px-2 py-1.5 text-ui-11 text-app-text/45 hover:text-etat-danger disabled:opacity-30" onClick={() => void retirer()} disabled={!cheminPropre && !livre}>
                    Retirer
                </button>
            </div>

            <div className="h-px bg-app-text/10" />

            <h4 className="text-ui-10 font-black uppercase tracking-[0.15em] text-app-text/50">Décalage des pages</h4>
            {/* Deux champs étiquetés, l'un sous l'autre : la phrase de la maquette se cassait mal
                dans le panneau réel (capture du 06/11). Le sens reste : la page imprimée N est la
                page M du PDF. */}
            <div className="flex items-center gap-2.5 rounded-lg border border-app-text/10 bg-app-bg/60 p-2.5">
                <div className="flex-1 grid grid-cols-[1fr_auto] items-center gap-x-2 gap-y-1.5 text-ui-11 text-app-text/65 whitespace-nowrap">
                    <label htmlFor={`imprimee-${cle}`}>Page imprimée</label>
                    <input id={`imprimee-${cle}`} value={imprimee} onChange={e => changerLesPages(e.target.value, pdf)} inputMode="numeric" aria-label="Page imprimée" className={CHAMP_PAGE} />
                    <label htmlFor={`pdf-${cle}`}>Page du PDF</label>
                    <input id={`pdf-${cle}`} value={pdf} onChange={e => changerLesPages(imprimee, e.target.value)} inputMode="numeric" aria-label="Page du PDF" className={CHAMP_PAGE} />
                </div>
                <span className="border-l border-app-text/15 pl-2.5 text-xl font-black tabular-nums text-app-text" aria-label="Décalage">
                    {decalage > 0 ? `+${decalage}` : decalage}
                </span>
            </div>

            <button
                type="button"
                className={`${BOUTON} w-full flex items-center justify-center gap-2`}
                onClick={() => void proposer()}
                disabled={!pont || !cheminPropre || proposition === 'mesure'}
            >
                <Wand2 size={14} className="text-gm-violet" /> {proposition === 'mesure' ? 'Lecture du livre…' : 'Proposer depuis le livre'}
            </button>
            {proposition && proposition !== 'mesure' && (
                'motif' in proposition ? (
                    <p className="text-ui-11 text-etat-alerte/80">{proposition.motif}</p>
                ) : (
                    <p className="text-ui-11 text-app-text/55">
                        Proposé : {proposition.decalage > 0 ? '+' : ''}{proposition.decalage} — {proposition.concordantes} pages concordent.{' '}
                        {proposition.decalage === decalage ? (
                            <span className="text-app-text/40">Retenu.</span>
                        ) : (
                            <button type="button" className="text-gm-violet font-bold hover:underline" onClick={() => { setDecalage(proposition.decalage); setImprimee(''); setPdf(''); }}>
                                Retenir ?
                            </button>
                        )}
                    </p>
                )
            )}

            <div className="flex items-center justify-end gap-3">
                {message && <span className="text-ui-11 text-app-text/50" role="status">{message}</span>}
                <button
                    type="button"
                    onClick={() => void enregistrer()}
                    disabled={!cheminPropre || !modifie}
                    className="px-4 py-2 rounded-xl text-ui-10 font-black uppercase tracking-widest bg-gm-violet text-app-bg disabled:bg-app-text/5 disabled:text-app-text/20 disabled:cursor-not-allowed"
                >
                    Enregistrer
                </button>
            </div>

            {cheminDuRegistre && (
                <p className="text-ui-10 text-app-text/35 leading-relaxed">
                    Enregistré dans <span className="font-mono">docs/{cheminDuRegistre}</span> — le livre n’est jamais copié.
                </p>
            )}
        </section>
    );
};

export default PdfDuLivre;
