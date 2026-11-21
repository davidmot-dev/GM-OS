import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserCheck, UserMinus } from 'lucide-react';
import { useSessionOSStore } from '../useSessionOSStore';
import { useCombatStore } from '../../combat/useCombatStore';
import { gmToast } from '../../../stores/useToastStore';
import { suitesDeLaTransformation, type RefusDeTransformation } from '../logic/transformationDuPersonnage';
import { leVerrouDeLAncienJoueur } from '../logic/transfertDePersonnage';
import type { Entity } from '../../../types/entity.types';
import type { PlayerCharacter } from '../../../types/player.types';

/**
 * **Les deux gestes de la transformation** (§ 268, 21/11/2026).
 *
 * David : « je voudrais pouvoir transformer un PNJ en Personnage Joueur, et
 * vice-versa ». Décision Q2 : « Faire un personnage joueur… » sur la fiche du
 * PNJ, « Faire un PNJ… » sur la carte du PJ dans le roster. Chaque bouton
 * déplie, **sous lui**, une confirmation qui dit ce qui va changer (C6) — pas de
 * fenêtre de plus, donc rien à inscrire au registre des surcouches.
 *
 * L'ordre des écritures : le magasin de séance d'abord (une seule écriture,
 * `transformerEn…`), puis, seulement s'il a accepté, ce qui vit ailleurs — le
 * combattant du plateau (`changerLeGenreDuCombattant`) et les cartes tenues.
 */

const ROLES: Entity['role'][] = ['ally', 'neutral', 'hostile', 'boss'];

const BOUTON = 'flex items-center justify-center gap-2 bg-app-surface border border-app-border text-app-text hover:border-accent/50 hover:text-accent font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-widest transition-all';
const PANNEAU = 'basis-full w-full rounded-xl border border-accent/40 bg-app-surface/80 p-4 space-y-3 text-sm';
const LISTE = 'w-full py-2 text-xs rounded-lg bg-app-surface border border-app-border text-app-text focus:ring-1 focus:ring-accent/50 focus:outline-none pl-2 pr-6';

function Confirmation({ titre, children, peutConfirmer, onConfirmer, onAnnuler }: {
    titre: string;
    children: React.ReactNode;
    peutConfirmer: boolean;
    onConfirmer: () => void;
    onAnnuler: () => void;
}) {
    const { t } = useTranslation();
    return (
        <div role="group" aria-label={titre} className={PANNEAU}>
            <p className="font-black uppercase tracking-widest text-xs text-accent">{titre}</p>
            {children}
            <div className="flex gap-2 justify-end">
                <button type="button" onClick={onAnnuler} className="px-4 py-2 rounded-lg border border-app-border text-xs font-bold uppercase tracking-widest text-app-muted hover:text-app-text">
                    {t('modules:session.transformation.annuler')}
                </button>
                <button type="button" onClick={onConfirmer} disabled={!peutConfirmer} className="px-4 py-2 rounded-lg bg-accent text-app-on-accent text-xs font-black uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed">
                    {t('modules:session.transformation.confirmer')}
                </button>
            </div>
        </div>
    );
}

const direLeRefus = (t: (cle: string, o?: Record<string, unknown>) => string, refus: RefusDeTransformation, nom: string) =>
    gmToast(t(`modules:session.transformation.refus.${refus}`, { name: nom }), 'error');

/** **« Faire un personnage joueur… »**, sur la fiche d'un PNJ. */
export function FaireUnPersonnageJoueur({ entite }: { entite: Entity }) {
    const { t } = useTranslation();
    const players = useSessionOSStore(s => s.players);
    const rencontres = useSessionOSStore(s => s.rencontres);
    const [ouvert, setOuvert] = useState(false);

    // Ceux qui jouent déjà dans la campagne de ce PNJ, en tête : c'est presque toujours l'un d'eux.
    const joueurs = useMemo(() => {
        const dansLaCampagne = (j: typeof players[number]) => j.characters.some(c => c.campaignId === entite.campaignId);
        return [...players.filter(dansLaCampagne), ...players.filter(j => !dansLaCampagne(j))];
    }, [players, entite.campaignId]);
    const [joueurId, setJoueurId] = useState('');
    const choisi = joueurId || joueurs[0]?.id || '';
    const suites = useMemo(() => suitesDeLaTransformation({ rencontres }, entite.id, true), [rencontres, entite.id]);

    const confirmer = () => {
        const joueur = joueurs.find(j => j.id === choisi);
        const refus = useSessionOSStore.getState().transformerEnPersonnage(entite.id, choisi);
        if (refus !== null) { direLeRefus(t, refus, entite.name); return; }
        useCombatStore.getState().changerLeGenreDuCombattant(entite.id, true);
        // La fiche ouverte était celle d'un PNJ qui n'existe plus : on la relâche, comme le transfert.
        useSessionOSStore.getState().setSelectedEntity(null);
        gmToast(t('modules:session.transformation.vers_pj_fait', { name: entite.name, joueur: joueur?.realName ?? '' }));
    };

    return (
        <>
            <button type="button" onClick={() => setOuvert(o => !o)} aria-expanded={ouvert} className={BOUTON}>
                <UserCheck size={16} />{t('modules:session.transformation.vers_pj')}
            </button>
            {ouvert && (
                <Confirmation
                    titre={t('modules:session.transformation.vers_pj_titre', { name: entite.name })}
                    peutConfirmer={!!choisi}
                    onConfirmer={confirmer}
                    onAnnuler={() => setOuvert(false)}
                >
                    {joueurs.length === 0 ? (
                        <p className="text-etat-alerte">{t('modules:session.transformation.vers_pj_sans_joueur')}</p>
                    ) : (
                        <label className="block space-y-1">
                            <span className="text-xs text-app-muted">{t('modules:session.transformation.vers_pj_joueur')}</span>
                            <select value={choisi} onChange={e => setJoueurId(e.target.value)} className={LISTE}>
                                {joueurs.map(j => <option key={j.id} value={j.id} className="bg-app-bg">{j.realName}</option>)}
                            </select>
                        </label>
                    )}
                    <p className="text-app-muted">{t('modules:session.transformation.vers_pj_explication', { name: entite.name })}</p>
                    {suites.rencontres.length > 0 && (
                        <p className="text-etat-alerte">{t('modules:session.transformation.vers_pj_rencontres', { noms: suites.rencontres.join(', ') })}</p>
                    )}
                </Confirmation>
            )}
        </>
    );
}

/** **« Faire un PNJ… »**, sur la carte d'un PJ du roster. */
export function FaireUnPnj({ joueurId, personnage }: { joueurId: string; personnage: PlayerCharacter }) {
    const { t } = useTranslation();
    const players = useSessionOSStore(s => s.players);
    const deckStates = useSessionOSStore(s => s.deckStates);
    const connectedCharacters = useSessionOSStore(s => s.connectedCharacters);
    const [ouvert, setOuvert] = useState(false);
    // Le rôle qu'il avait s'il a déjà été PNJ ; « Allié » sinon (détail tranché au § 268).
    const [role, setRole] = useState<Entity['role']>(personnage.reserveDeTransformation?.pnj?.role ?? 'ally');
    const suites = useMemo(() => suitesDeLaTransformation({ deckStates }, personnage.id, false), [deckStates, personnage.id]);
    const joueur = players.find(j => j.id === joueurId);

    const confirmer = () => {
        const tenuPar = leVerrouDeLAncienJoueur(connectedCharacters, personnage.id);
        const magasin = useSessionOSStore.getState();
        const refus = magasin.transformerEnPnj(joueurId, personnage.id, role);
        if (refus !== null) { direLeRefus(t, refus, personnage.name); return; }
        useCombatStore.getState().changerLeGenreDuCombattant(personnage.id, false, role);
        // Un PNJ ne tient pas de main : ses cartes reviennent au meneur.
        suites.cartesTenues.forEach(c => useSessionOSStore.getState().donnerLaCarte(c.deckId, c.index, null));
        if (magasin.selectedCharacterId === personnage.id) magasin.setSelectedCharacter(null);
        gmToast(t('modules:session.transformation.vers_pnj_fait', { name: personnage.name }));
        if (tenuPar) gmToast(t('modules:session.transformation.vers_pnj_tablette', { name: personnage.name }), 'info');
    };

    return (
        <>
            <button
                type="button"
                onClick={e => { e.stopPropagation(); setOuvert(o => !o); }}
                aria-expanded={ouvert}
                className="w-full flex items-center justify-center gap-2 py-1.5 text-xs rounded-lg bg-app-surface border border-app-border text-app-text/60 hover:border-accent/50 hover:text-accent transition-all"
            >
                <UserMinus size={12} />{t('modules:session.transformation.vers_pnj')}
            </button>
            {ouvert && (
                <div onClick={e => e.stopPropagation()}>
                    <Confirmation
                        titre={t('modules:session.transformation.vers_pnj_titre', { name: personnage.name })}
                        peutConfirmer
                        onConfirmer={confirmer}
                        onAnnuler={() => setOuvert(false)}
                    >
                        <label className="block space-y-1">
                            <span className="text-xs text-app-muted">{t('modules:session.transformation.vers_pnj_role')}</span>
                            <select value={role} onChange={e => setRole(e.target.value as Entity['role'])} className={LISTE}>
                                {ROLES.map(r => <option key={r} value={r} className="bg-app-bg">{t(`modules:session.npc_detail.affinity.${r}`)}</option>)}
                            </select>
                        </label>
                        <p className="text-app-muted">{t('modules:session.transformation.vers_pnj_explication', { name: personnage.name, joueur: joueur?.realName ?? '' })}</p>
                        {suites.cartesTenues.length > 0 && (
                            <p className="text-etat-alerte">{t('modules:session.transformation.vers_pnj_cartes', { count: suites.cartesTenues.length })}</p>
                        )}
                        {leVerrouDeLAncienJoueur(connectedCharacters, personnage.id) && (
                            <p className="text-etat-alerte">{t('modules:session.transformation.vers_pnj_tablette', { name: personnage.name })}</p>
                        )}
                    </Confirmation>
                </div>
            )}
        </>
    );
}
