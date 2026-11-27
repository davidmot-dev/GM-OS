import React, { useState } from 'react';
import { Brain } from 'lucide-react';
import { depenseDePsi } from '../../../dice/systemes/depensesDeTraveller';
import { porteeAllongee, pouvoirsDuTalent, type TalentPsionique } from '../../../dice/systemes/pouvoirsPsioniques';

/**
 * **Un pouvoir psionique de Traveller** — TRV-A6, 27/11/2026 (spécification
 * `2026-11-27-traveller-depenses-et-durees.md`, C3, C4, C9 ; David : « Les cinq »).
 *
 * Quand le test porte sur un talent (une ligne de compétence nommée Télépathie, Clairvoyance,
 * Télékinésie, Conscience ou Téléportation) : le pouvoir, sa difficulté — posée sur le test —, sa
 * portée et son coût (p. 225-229) ; la portée allongée double ou quadruple le coût. Après le jet :
 * « Réussite — dépenser 3 PSI » ou « Échec — dépenser 1 PSI » ; ce qui passe sous zéro part en
 * dégâts (p. 225). Sans point de PSI, la carte refuse la tentative. Rien ne s'écrit sans clic.
 */
const etiquette = 'font-black uppercase tracking-widest text-ui-9 text-app-text/60';
const champ = 'rounded-md border border-app-border/40 bg-app-bg px-2 py-0.5 font-mono text-xs';
const bouton = 'flex items-center gap-1 rounded-md border border-accent/60 px-2 py-0.5 text-ui-10 font-black text-accent hover:bg-accent/10';

export const PsioniqueTraveller: React.FC<{
    talent: TalentPsionique;
    /** La PSI actuelle, lue sur la fiche ; `undefined` : la fiche n'en a pas. */
    psi: number | undefined;
    /** Le dernier test de ce talent : son Effet et son numéro, pour ne dépenser qu'une fois. */
    resultat: { effet: number; compte: number } | null;
    /** Pose la difficulté du pouvoir sur le test. */
    poserLaDifficulte: (cible: number) => void;
    /** Écrit la PSI après la dépense, et les dégâts de l'excédent ; sans lui, la carte informe seulement. */
    depenser?: (psiApres: number, degats: number, texte: string) => void;
}> = ({ talent, psi, resultat, poserLaDifficulte, depenser }) => {
    const pouvoirs = pouvoirsDuTalent(talent);
    const [rang, setRang] = useState(-1);
    const [zones, setZones] = useState(0);
    const [coutSaisi, setCoutSaisi] = useState(1);
    const [depensePour, setDepensePour] = useState<{ compte: number; texte: string } | null>(null);
    const pouvoir = pouvoirs[rang];
    const allongee = porteeAllongee(pouvoir?.portee ?? null, zones);
    const cout = pouvoir ? (pouvoir.cout ?? Math.max(1, coutSaisi)) * allongee.facteur : 0;
    const reste = Math.max(0, Math.trunc(Number(psi) || 0));

    const choisir = (i: number) => {
        setRang(i); setZones(0);
        const p = pouvoirs[i];
        if (p) poserLaDifficulte(p.difficulte);
    };
    const reussie = !!resultat && resultat.effet >= 0;
    const depense = pouvoir && resultat ? depenseDePsi({ cout, reussie, psi: reste }) : null;
    const dejaDepense = depensePour && resultat && depensePour.compte === resultat.compte;

    const payer = () => {
        if (!depense || !pouvoir || !depenser || !resultat) return;
        const texte = `${pouvoir.nom} (${talent}) : ${reussie ? 'réussite' : 'échec'}, ${depense.depense} PSI dépensé${depense.depense > 1 ? 's' : ''} — PSI ${reste} → ${depense.psiApres}`
            + (depense.degats ? ` ; ${depense.degats} point${depense.degats > 1 ? 's' : ''} sous zéro, appliqué${depense.degats > 1 ? 's' : ''} en dégâts` : '') + ' (p. 225).';
        depenser(depense.psiApres, depense.degats, texte);
        setDepensePour({ compte: resultat.compte, texte });
    };

    return (
        <div data-pouvoir-psionique={talent} className="flex flex-col gap-1.5 rounded-md border border-accent/30 p-2 text-xs">
            <div className="flex flex-wrap items-center gap-3">
                <span className={etiquette}><Brain size={10} className="inline" /> Pouvoir psionique</span>
                <select aria-label="Pouvoir psionique" value={rang} className={champ} onChange={e => choisir(Number(e.target.value))}>
                    <option value={-1}>— {talent} : choisir —</option>
                    {pouvoirs.map((p, i) => <option key={p.nom} value={i}>{p.nom} ({p.difficulte}+, {p.coutDuLivre} PSI)</option>)}
                </select>
                {pouvoir?.portee && (
                    <label className="flex items-center gap-1" title="Une Zone de plus : coût doublé ; deux Zones : coût quadruplé (p. 225).">
                        Portée
                        <select aria-label="Portée du pouvoir" value={zones} className={champ} onChange={e => setZones(Number(e.target.value))}>
                            {[0, 1, 2].map(z => <option key={z} value={z}>{porteeAllongee(pouvoir.portee, z).portee}{z ? ` (×${[1, 2, 4][z]})` : ''}</option>)}
                        </select>
                    </label>
                )}
                {pouvoir && pouvoir.cout === null && (
                    <label className="flex items-center gap-1" title={`Le livre : ${pouvoir.coutDuLivre}.`}>
                        Coût choisi
                        <input aria-label="Coût choisi en PSI" type="number" min={1} value={coutSaisi} className={`w-12 ${champ}`}
                            onChange={e => setCoutSaisi(Math.max(1, Math.trunc(Number(e.target.value)) || 1))} />
                    </label>
                )}
            </div>
            {pouvoir && (
                <p data-cout-psionique className="text-app-text/70">
                    {talent} {pouvoir.difficulte}+ (avec le MD de PSI) ; {cout} PSI en cas de réussite, 1 en cas d’échec ;
                    {' '}PSI actuelle : {reste} (p. {pouvoir.page}).
                </p>
            )}
            {psi !== undefined && reste <= 0 && (
                <p data-psi-epuisee className="font-black text-etat-alerte">Sans point de PSI, pas de tentative (p. 225).</p>
            )}
            {dejaDepense ? (
                <p data-psi-depensee className="font-black text-etat-succes">{depensePour!.texte}</p>
            ) : depense && depenser && (
                <button type="button" className={bouton} onClick={payer} data-depenser-la-psi>
                    {reussie ? 'Réussite' : 'Échec'} — dépenser {depense.depense} PSI{depense.degats ? ` (${depense.degats} en dégâts)` : ''}
                </button>
            )}
        </div>
    );
};
