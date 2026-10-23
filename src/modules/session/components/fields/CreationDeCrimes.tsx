import React, { useState } from 'react';
import {
    MAX_DE_LA_COMPETENCE, MAX_DU_POTENTIEL, ageDe, coutDeLaCompetence, coutDuPotentiel, temperamentDe, verifierLaCreation,
} from '../../../dice/systemes/creationDeCrimes';
import type { DescripteurDeJet } from '../../../dice/DescripteurDeJet';

/**
 * **Création et progression de Crimes** — C8 (2026-10-23), livre p. 324-334 et 404-405.
 *
 * Trois choses : le **tempérament** que les trois choix de Jung désignent, et ce
 * qu'il fixe (p. 334) ; les **règles de création** vérifiées ligne par ligne ;
 * les **points de développement**, gagnés et dépensés entre les scénarios. Le
 * tempérament ne remplace l'angoisse et la psychose courantes qu'à la création
 * (seuil de névrose encore à 0) : un personnage joué garde les siennes.
 */
type Garde = NonNullable<DescripteurDeJet['garde']>;

const bouton = 'px-2 py-0.5 rounded-md border border-app-border/40 text-ui-10 font-bold hover:border-accent/50 disabled:opacity-30';
const etiquette = 'font-black uppercase tracking-widest text-ui-9 text-app-text/60';

const CreationDeCrimes: React.FC<{
    regle: NonNullable<Garde['creation']>;
    psychologie?: Garde['psychologie'];
    /** Les compétences et le préfixe de leurs spécialisations (`garde.specialisations.parCompetence`). */
    competences: Record<string, string>;
    valeurs: Record<string, unknown>;
    libelleDe: (champ: string) => string;
    ecrire: (maj: Record<string, number | string>) => void;
    consigner: (titre: string, ligne: string) => void;
}> = ({ regle, psychologie, competences, valeurs, libelleDe, ecrire, consigner }) => {
    const n = (champ?: string) => (champ ? Math.max(0, Number(valeurs[champ]) || 0) : 0);
    const [cible, setCible] = useState('');

    const t = regle.temperament;
    const temperament = t ? temperamentDe(valeurs[t.emotivite], valeurs[t.activite], valeurs[t.reactivite]) : undefined;
    const enCreation = !psychologie?.seuilNevrose || n(psychologie.seuilNevrose) === 0;
    const reporter = () => {
        if (!t || !temperament) return;
        const maj: Record<string, number | string> = { [t.nom]: temperament.nom };
        if (t.basePsychose) maj[t.basePsychose] = temperament.psychose;
        if (psychologie?.seuilNevrose) maj[psychologie.seuilNevrose] = temperament.seuilNevrose;
        if (enCreation && psychologie) {
            maj[psychologie.angoisse] = temperament.angoisse;
            maj[psychologie.psychose] = temperament.psychose;
        }
        ecrire(maj);
        consigner('Création', `Tempérament ${temperament.nom} : seuil de névrose ${temperament.seuilNevrose}, psychose de base ${temperament.psychose}`
            + (enCreation ? `, angoisse ${temperament.angoisse} au départ` : ''));
    };
    const dejaReporte = !!temperament && !!t && String(valeurs[t.nom] ?? '').trim() === temperament.nom
        && (!psychologie?.seuilNevrose || n(psychologie.seuilNevrose) === temperament.seuilNevrose);

    const age = regle.age ? ageDe(valeurs[regle.age]) : undefined;
    const constats = verifierLaCreation({
        potentiels: regle.potentiels.map(p => ({ label: libelleDe(p), valeur: n(p) })),
        competences: Object.entries(competences).map(([id, prefixe]) => ({
            label: libelleDe(id), niveau: n(id),
            specialisations: Object.keys(valeurs).filter(k => k.startsWith(prefixe) && valeurs[k] === true).length,
        })),
        ...(age !== undefined ? { age } : {}),
        ...(psychologie?.innocence ? { seuilInnocence: n(psychologie.innocence.seuil) } : {}),
    });

    const points = n(regle.developpement);
    const ameliorations = [
        ...regle.potentiels.map(p => ({ id: p, actuel: n(p), max: MAX_DU_POTENTIEL, cout: coutDuPotentiel(n(p) + 1) })),
        ...Object.keys(competences).map(c => ({ id: c, actuel: n(c), max: MAX_DE_LA_COMPETENCE, cout: coutDeLaCompetence(n(c) + 1) })),
    ].filter(a => a.actuel < a.max);
    const choisie = ameliorations.find(a => a.id === cible);

    return (
        <section data-creation className="flex flex-col gap-2 text-xs">
            {t && (
                <div className="flex flex-wrap items-center gap-2" data-temperament>
                    <span className={etiquette}>Tempérament</span>
                    {temperament ? (
                        <>
                            <strong>{temperament.nom}</strong>
                            <span className="font-mono text-app-text/60">
                                angoisse {temperament.angoisse} · psychose {temperament.psychose} · seuil de névrose {temperament.seuilNevrose}
                            </span>
                            {!dejaReporte && (
                                <button type="button" className={bouton} onClick={reporter}
                                    title={enCreation ? 'À la création : le tempérament, le seuil de névrose, la psychose de base, l’angoisse et la psychose de départ (p. 334)'
                                        : 'Personnage joué : le tempérament, le seuil de névrose et la psychose de base ; l’angoisse et la psychose courantes restent'}>
                                    Reporter sur la fiche
                                </button>
                            )}
                        </>
                    ) : (
                        <span className="text-app-text/50">Choisir émotivité, activité et réactivité sur la fiche (p. 328).</span>
                    )}
                </div>
            )}

            <ul className="flex flex-col gap-0.5 border-t border-app-border/30 pt-2" data-regles-de-creation>
                {constats.map(c => (
                    <li key={c.ligne} className={c.ok ? 'text-app-text/70' : 'text-etat-alerte'}>{c.ok ? '✓' : '⚠'} {c.ligne}</li>
                ))}
            </ul>

            {regle.developpement && (
                <div className="flex flex-wrap items-center gap-2 border-t border-app-border/30 pt-2" data-developpement>
                    <span className={etiquette}>Développement</span>
                    <strong className="font-mono text-base">{points} pt{points > 1 ? 's' : ''}</strong>
                    <button type="button" className={bouton}
                        title="Enquête réussie 1 à 6 ; objectif personnel 1 à 3 ; conviction ou passion mise en scène, évolution du personnage, échec retentissant, belle interprétation : 1 (p. 404)"
                        onClick={() => { ecrire({ [regle.developpement!]: points + 1 }); consigner('Développement', `+1 point (${points} → ${points + 1})`); }}>
                        +1
                    </button>
                    <select value={cible} onChange={e => setCible(e.target.value)} aria-label="Amélioration" data-amelioration
                        className="bg-app-bg/60 border border-app-border/40 rounded-lg px-2 py-1 text-ui-11 font-bold">
                        <option value="">Améliorer…</option>
                        {ameliorations.map(a => (
                            <option key={a.id} value={a.id}>{libelleDe(a.id)} {a.actuel} → {a.actuel + 1} : {a.cout} pts</option>
                        ))}
                    </select>
                    <button type="button" className={bouton} disabled={!choisie || choisie.cout > points}
                        title="Entre les scénarios, et justifié dans l'histoire : le meneur refuse ce qui est trop « mécanique » (p. 404-405)"
                        onClick={() => {
                            if (!choisie || !regle.developpement) return;
                            ecrire({ [choisie.id]: choisie.actuel + 1, [regle.developpement]: points - choisie.cout });
                            consigner('Développement', `${libelleDe(choisie.id)} ${choisie.actuel} → ${choisie.actuel + 1} (−${choisie.cout} points, reste ${points - choisie.cout})`);
                            setCible('');
                        }}>
                        Dépenser
                    </button>
                </div>
            )}
        </section>
    );
};

export default CreationDeCrimes;
