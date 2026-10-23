import React from 'react';
import {
    NIVEAUX_DE_FORTUNE, SEUIL_DE_FORTUNE_PAR_DEFAUT, loyauteActuelle, mouvementDeFortune, pertePsychotique, testDeLoyaute,
} from '../../../dice/systemes/contactsEtFortuneDeCrimes';
import type { DescripteurDeJet } from '../../../dice/DescripteurDeJet';

/**
 * **Les contacts et la fortune de Crimes** — C7 (2026-10-23), livre p. 428-431.
 *
 * Les contacts sont au meneur seul : « ce point relève de la gestion du meneur
 * pour que les PJ n'en soient pas conscients » (p. 430). Un appel retire un point
 * pour le scénario ; « Fin du scénario » rend les loyautés de base. La fortune,
 * elle, se montre aussi au joueur. Rien ne s'écrit sans un clic.
 */
type Garde = NonNullable<DescripteurDeJet['garde']>;

const bouton = 'px-2 py-0.5 rounded-md border border-app-border/40 text-ui-10 font-bold hover:border-accent/50 disabled:opacity-30';
const etiquette = 'font-black uppercase tracking-widest text-ui-9 text-app-text/60';

const ContactsEtFortune: React.FC<{
    contacts?: Garde['contacts'];
    fortune?: Garde['fortune'];
    /** Le champ de la psychose : un contact fidèle perdu en coûte un point. */
    psychose?: string;
    /** Le meneur voit les contacts ; le joueur, la fortune seule. */
    meneur: boolean;
    valeurs: Record<string, unknown>;
    ecrire: (maj: Record<string, number>) => void;
    consigner: (titre: string, ligne: string) => void;
}> = ({ contacts, fortune, psychose, meneur, valeurs, ecrire, consigner }) => {
    const n = (champ?: string) => (champ ? Math.max(0, Number(valeurs[champ]) || 0) : 0);
    const connus = (contacts ?? [])
        .map(c => ({ regle: c, nom: String(valeurs[c.nom] ?? '').trim(), base: n(c.loyaute), appels: n(c.appels) }))
        .filter(c => c.nom !== '');
    const ecrireEtDire = (maj: Record<string, number>, titre: string, ligne: string) => { ecrire(maj); consigner(titre, ligne); };

    const niveau = fortune ? Math.min(4, Math.max(1, n(fortune.niveau) || 1)) : 1;
    const jauge = fortune ? n(fortune.jauge) : 0;
    const seuil = fortune?.seuil ?? SEUIL_DE_FORTUNE_PAR_DEFAUT;
    const bougerLaFortune = (delta: 1 | -1, pourquoi: string) => {
        if (!fortune) return;
        const m = mouvementDeFortune(niveau, jauge, delta, seuil);
        ecrireEtDire({ [fortune.niveau]: m.niveau, [fortune.jauge]: m.jauge }, 'Fortune', `${m.ligne} — ${pourquoi}`);
    };

    return (
        <section data-contacts-et-fortune className="flex flex-col gap-2 text-xs">
            {meneur && contacts && (
                <div className="flex flex-col gap-1.5" data-contacts>
                    {connus.length === 0 && <p className="text-app-text/50">Aucun contact nommé sur la fiche.</p>}
                    {connus.map(c => {
                        const actuelle = loyauteActuelle(c);
                        return (
                            <div key={c.regle.nom} className="flex flex-wrap items-center gap-2" data-contact={c.nom}>
                                <strong className="min-w-28">{c.nom}</strong>
                                <span className="font-mono" title="Loyauté actuelle / de base : chaque appel retire un point pour le scénario (p. 430)">
                                    loyauté {actuelle}/{c.base}
                                </span>
                                {c.regle.influence && (
                                    <label className="flex items-center gap-1">
                                        <span className={etiquette}>Influence</span>
                                        <input type="number" min={0} max={4} value={n(c.regle.influence)} data-influence
                                            onChange={e => ecrire({ [c.regle.influence!]: Math.min(4, Math.max(0, Number(e.target.value) || 0)) })}
                                            className="w-12 bg-app-bg/60 border border-app-border/40 rounded-md px-1 py-0.5 font-mono" />
                                    </label>
                                )}
                                {c.regle.appels && (
                                    <button type="button" className={bouton} data-appel
                                        title={`Une demande dans ses moyens : il s'exécute. Au-delà : une contrepartie, ou un test de loyauté ${testDeLoyaute(c)}. Dans tous les cas, un point de moins pour le scénario (p. 429).`}
                                        onClick={() => ecrireEtDire({ [c.regle.appels!]: c.appels + 1 }, 'Contacts',
                                            `Appel à ${c.nom} : loyauté ${actuelle} → ${Math.max(0, actuelle - 1)} pour le scénario (au-delà de ses moyens : ${testDeLoyaute(c)})`)}>
                                        Appel −1
                                    </button>
                                )}
                                <button type="button" className={bouton} disabled={c.base >= 4}
                                    title="Une intrigue secondaire bouclée qui l'aide directement (p. 430)"
                                    onClick={() => ecrireEtDire({ [c.regle.loyaute]: c.base + 1 }, 'Contacts', `${c.nom} : loyauté de base ${c.base} → ${c.base + 1} (intrigue bouclée)`)}>
                                    Intrigue bouclée +1
                                </button>
                                <button type="button" className={bouton} disabled={c.base <= 0}
                                    title="Une action qui lui déplaît : ses intérêts trahis, une parole reniée, ses ennemis fréquentés (p. 430)"
                                    onClick={() => ecrireEtDire({ [c.regle.loyaute]: c.base - 1 }, 'Contacts', `${c.nom} : loyauté de base ${c.base} → ${c.base - 1} (il lui en veut)`)}>
                                    Brouille −1
                                </button>
                                <button type="button" className={`${bouton} border-etat-danger/40 text-etat-danger`}
                                    title={`Mort, disparu, mis au placard, brouillé ou remboursé (p. 430)${pertePsychotique(c) ? ' ; loyauté d’au moins 3 : +1 Psychose' : ''}`}
                                    onClick={() => {
                                        const maj: Record<string, number> = { [c.regle.loyaute]: 0 };
                                        if (c.regle.appels) maj[c.regle.appels] = 0;
                                        const psy = pertePsychotique(c) && psychose ? Math.min(10, n(psychose) + 1) : undefined;
                                        if (psy !== undefined && psychose) maj[psychose] = psy;
                                        ecrireEtDire(maj, 'Contacts', `${c.nom} perdu (loyauté ${c.base} → 0)${psy !== undefined ? `, Psychose ${n(psychose)} → ${psy} (p. 430)` : ''}`);
                                    }}>
                                    Perdu
                                </button>
                            </div>
                        );
                    })}
                    {connus.some(c => c.appels > 0) && (
                        <button type="button" className={`${bouton} self-start`} data-fin-du-scenario
                            title="« Le niveau de base est restauré dès la fin du scénario » (p. 430)"
                            onClick={() => ecrireEtDire(
                                Object.fromEntries(connus.filter(c => c.regle.appels).map(c => [c.regle.appels!, 0])),
                                'Contacts', `Fin du scénario : loyautés restaurées (${connus.filter(c => c.appels > 0).map(c => c.nom).join(', ')})`,
                            )}>
                            Fin du scénario : loyautés restaurées
                        </button>
                    )}
                </div>
            )}

            {fortune && (
                <div className={`flex flex-wrap items-center gap-2 ${meneur && contacts ? 'border-t border-app-border/30 pt-2' : ''}`} data-fortune>
                    <span className={etiquette}>Fortune</span>
                    <strong className="font-mono text-base">niveau {niveau}</strong>
                    <span className="text-app-text/60">{NIVEAUX_DE_FORTUNE[niveau]}</span>
                    <span className="font-mono" title={`Le seuil de la jauge : ${seuil} — le livre ne le chiffre pas`}>jauge {jauge}/{seuil}</span>
                    <button type="button" className={bouton} onClick={() => bougerLaFortune(-1, 'achat conséquent')}
                        title="Un achat conséquent pour ce niveau ; une dépense que le niveau couvre ne se compte pas (p. 431)">Achat conséquent −1</button>
                    <button type="button" className={bouton} onClick={() => bougerLaFortune(1, 'rétribution')}
                        title="Une rétribution en nature ou en argent (p. 431)">Rétribution +1</button>
                    <button type="button" className={bouton} onClick={() => bougerLaFortune(-1, 'limites dépassées')}
                        title="Demander plus que son niveau : un test simple, Mental pour un montage financier, Social pour un donateur ou un prêteur ; quel que soit le résultat, un point de jauge en moins (p. 431)">
                        Dépasser ses limites
                    </button>
                </div>
            )}
        </section>
    );
};

export default ContactsEtFortune;
