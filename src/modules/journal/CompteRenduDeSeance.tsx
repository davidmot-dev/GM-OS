import React from 'react';
import { Sparkles, Users, ListChecks, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';
import { rendreLeCompteRendu, laSuiteEstVide } from './compteRendu';
import type { Journal } from './types';

/**
 * Le compte rendu d'une séance, en trois sections.
 *
 * **Ce que cet écran corrige.** Deux fois aujourd'hui, on a produit un artefact
 * que rien n'affichait — *un artefact qu'on produit et qu'on ne voit pas est un
 * artefact qu'on croit perdu.* `rendreLeCompteRendu` existait, testé, et
 * personne ne le montrait.
 *
 * **Les sections manquantes ne s'écrivent pas.** Une séance qui n'a produit
 * aucun récit, ou qui n'a jamais été close, n'affiche que ce qu'elle a. Un titre
 * suivi de rien se lit comme une perte de données.
 */
const CompteRenduDeSeance: React.FC<{ journal: Journal }> = ({ journal }) => {
    const [copie, setCopie] = React.useState(false);

    const suite = journal.pourLaSuite;
    const etat = journal.etatDeFin;
    const aDeLEtat = !!(etat?.presentPCs?.length || etat?.sessionEntities?.length
        || etat?.clocks?.length || etat?.pendingChecklist?.length);

    // Rien de tout cela : on ne dessine pas un cadre vide.
    if (!journal.resumeIA && !aDeLEtat && laSuiteEstVide(suite)) return null;

    /*
      Copier plutôt qu'exporter : le compte rendu part dans un carnet, un fil de
      discussion, une note. Une boîte de dialogue d'enregistrement pour trois
      paragraphes serait un geste de plus pour rien.
    */
    const copier = async () => {
        try {
            await navigator.clipboard.writeText(rendreLeCompteRendu(journal));
            setCopie(true);
            setTimeout(() => setCopie(false), 2000);
        } catch {
            // Le presse-papier peut être refusé ; l'écran garde son texte.
        }
    };

    return (
        <div className="mt-16 pt-12 border-t border-app-border/30 space-y-10">
            <div className="flex items-center justify-between gap-4">
                <h3 className="text-base font-black uppercase tracking-[0.2em] text-accent">
                    Compte rendu de séance
                </h3>
                <button
                    onClick={copier}
                    title="Copier le compte rendu en Markdown"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-app-border/40 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-accent hover:border-accent/40 transition-all"
                >
                    {copie ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    {copie ? 'Copié' : 'Copier'}
                </button>
            </div>

            {journal.resumeIA && (
                <Section
                    icone={<Sparkles className="size-5 text-accent" />}
                    titre="Ce qui s’est joué"
                    /* La date se voit parce qu'elle se périme : un résumé plus
                       vieux que les derniers événements ne les raconte pas. */
                    sousTitre={journal.resumeGenereLe
                        ? format(journal.resumeGenereLe, 'dd/MM/yyyy à HH:mm')
                        : undefined}
                >
                    <p className="whitespace-pre-wrap">{journal.resumeIA}</p>
                </Section>
            )}

            {aDeLEtat && (
                <Section icone={<Users className="size-5 text-accent" />} titre="Où en sont les choses">
                    <Liste titre="Personnages" valeurs={(etat!.presentPCs ?? []).map(pc => {
                        // L'absence de jauge est une information, jamais un zéro.
                        const vie = typeof pc.hp === 'number' && typeof pc.maxHp === 'number'
                            ? ` — ${pc.hp}/${pc.maxHp}` : '';
                        return `${pc.name}${vie} (${pc.state})`;
                    })} />
                    <Liste titre="PNJ" valeurs={(etat!.sessionEntities ?? []).map(n => `${n.name} (${n.status})`)} />
                    <Liste titre="Horloges" valeurs={(etat!.clocks ?? []).map(c => `${c.name} : ${c.filled}/${c.total}`)} />
                    <Liste titre="Préparation restée en plan" valeurs={etat!.pendingChecklist ?? []} />
                </Section>
            )}

            {!laSuiteEstVide(suite) && (
                <Section icone={<ListChecks className="size-5 text-accent" />} titre="Ce qui attend">
                    <Liste titre="Actes encore ouverts" valeurs={suite!.actesOuverts} />
                    <Liste titre="Scènes en pause — elles reprendront" valeurs={suite!.scenesEnPause} />
                    <Liste titre="Scènes jamais jouées" valeurs={suite!.scenesNonJouees} />
                    <Liste titre="Indices non révélés" valeurs={suite!.indicesNonReveles} />
                </Section>
            )}
        </div>
    );
};

const Section: React.FC<{
    icone: React.ReactNode; titre: string; sousTitre?: string; children: React.ReactNode;
}> = ({ icone, titre, sousTitre, children }) => (
    <div>
        <div className="flex items-center gap-4 mb-4">
            <div className="size-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shadow-inner">
                {icone}
            </div>
            <div>
                <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-300">{titre}</h4>
                {sousTitre && (
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter opacity-80">
                        {sousTitre}
                    </p>
                )}
            </div>
        </div>
        <div className="bg-app-surface/20 border border-app-border/40 rounded-2xl p-6 text-sm text-slate-300 leading-relaxed shadow-inner space-y-4">
            {children}
        </div>
    </div>
);

/** Une liste, ou rien du tout — jamais un intitulé suivi du vide. */
const Liste: React.FC<{ titre: string; valeurs: readonly string[] }> = ({ titre, valeurs }) => {
    if (valeurs.length === 0) return null;
    return (
        <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">{titre}</p>
            <ul className="space-y-0.5">
                {valeurs.map((v, i) => (
                    <li key={i} className="flex gap-2"><span className="text-accent/50">·</span>{v}</li>
                ))}
            </ul>
        </div>
    );
};

export default CompteRenduDeSeance;
