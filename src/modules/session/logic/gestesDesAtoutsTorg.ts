import { useSessionOSStore } from '../useSessionOSStore';
import { DiceEngine } from '../../dice/DiceEngine';
import { lancerUneChaine } from '../../dice/systemes/torg';
import { NOMS_DES_ATOUTS_TORG, nombreDeCartesTorg, possedeAtoutTorg, refusEtatTorg, type AtoutDeTorg } from '../../dice/systemes/torgPersonnage';
import { DeckInterpreter } from './DeckInterpreter';
import { garderUneParmi, piocherPour, prendreUneCarte, regarderLesProchaines } from './cartesDuDestin';
import { consignerLeJet } from '../../journal/consignerLeJet';
import { useJournalStore } from '../../journal/useJournalStore';
import { useDiceStore } from '../../../stores/useDiceStore';
import { gmToast } from '../../../stores/useToastStore';
import { cosmsDesIds, idsDesCosmsCourants, loiEnVigueur } from './cosmsCourants';

/** TORG-A1, 07/11/2026 : présence, coût et fréquence se contrôlent au geste, sur la fiche enregistrée. */
function contexte(deckId: string, acteur: string, atout?: AtoutDeTorg) {
    const s = useSessionOSStore.getState();
    const pilote = s.getActiveDriver();
    const joueur = s.players.find(p => p.characters.some(c => c.id === acteur && c.campaignId === s.activeCampaignId));
    const personnage = joueur?.characters.find(c => c.id === acteur);
    const deck = s.decks.find(d => d.id === deckId && d.role === 'destin' && d.systemId === pilote?.id);
    const etat = s.deckStates[deckId];
    if (!pilote?.torg || !joueur || !personnage || !deck || !etat || (atout && !possedeAtoutTorg(pilote.torg, personnage.sheetData ?? {}, atout))) {
        gmToast('Cet Atout doit être coché sur la fiche enregistrée du personnage.', 'info');
        return null;
    }
    const refus = refusEtatTorg(pilote.torg, personnage.sheetData ?? {}, atout === 'ingenieux' || atout === 'chefNaturel');
    if (refus) { gmToast(refus, 'info'); return null; }
    return { s, pilote, joueur, personnage, deck, etat, valeurs: personnage.sheetData ?? {}, cle: `${acteur}:${atout}` };
}

function tracer(titre: string, texte: string) {
    useJournalStore.getState().addEvent({ type: 'SYSTEM', title: titre, content: texte, nature: 'trace' });
    gmToast(texte, 'success');
}

/** Occultiste : le MJ confirme le combat surnaturel ; Ingénieux paie et tire d'abord une carte pour soi. */
export function ouvrirChoixAtoutTorg(deckId: string, acteur: string, atout: 'occultiste' | 'ingenieux' | 'aspectEffrayant', beneficiaire: string): boolean {
    const c = contexte(deckId, acteur, atout);
    if (!c) return false;
    const { s, pilote, personnage, joueur, valeurs, cle } = c;
    if (!s.players.some(p => p.characters.some(ch => ch.id === beneficiaire && ch.campaignId === s.activeCampaignId))) return false;
    if (c.etat.torgChoix?.[acteur]) { gmToast('Terminez d’abord le choix de cartes déjà ouvert.', 'info'); return false; }
    const usages = atout === 'ingenieux' ? c.etat.torgUsagesScene : atout === 'occultiste' ? c.etat.torgUsagesCombat : [];
    if (usages?.includes(cle)) { gmToast(atout === 'ingenieux' ? 'Ingénieux est déjà utilisé dans cette scène.' : 'Occultiste est déjà utilisé pour ce combat.', 'info'); return false; }
    const champ = pilote.jet?.torg?.possibilites;
    const avant = Number(champ ? valeurs[champ] : 0) || 0;
    if (atout === 'ingenieux' && (!champ || avant < 1)) { gmToast('Ingénieux coûte une Possibilité.', 'info'); return false; }
    if (!c.etat.remainingIndices.length && !c.etat.discardedIndices.length) { gmToast('Le Paquet du Destin est vide.', 'info'); return false; }
    let etat = c.etat;
    let nombre = 2;
    if (atout === 'ingenieux') {
        s.updateCharacter(joueur.id, acteur, { sheetData: { ...valeurs, [champ!]: avant - 1 } });
        etat = piocherPour(etat, acteur, DeckInterpreter.shuffle).etat;
        etat = { ...etat, torgUsagesScene: [...(etat.torgUsagesScene ?? []), cle] };
        tracer(`${personnage.name} — Ingénieux`, `${personnage.name} : Possibilités ${avant} → ${avant - 1}, une carte piochée pour soi ; test de Raison.`);
    } else if (atout === 'occultiste') {
        etat = { ...etat, torgEnRounds: true, torgUsagesCombat: [...(etat.torgUsagesCombat ?? []), cle] };
    }
    if (atout !== 'aspectEffrayant') {
        const raison = Number(valeurs[pilote.torg!.raison]) || 0;
        const rangs = atout === 'occultiste' ? Number(valeurs[pilote.torg!.sciencesHumaines]) || 0 : 0;
        const niveau = raison + rangs;
        const malus = Math.min(3, Math.max(0, Number(valeurs[pilote.jet?.torg?.blessures ?? '']) || 0));
        const jet = DiceEngine.resultatDeTorg(niveau, 10, { premier: lancerUneChaine(() => DiceEngine.roll(20), atout === 'ingenieux' || rangs > 0) }, { malus });
        const titre = `${personnage.name} — ${NOMS_DES_ATOUTS_TORG[atout]}`;
        useDiceStore.getState().setLastRoll({ ...jet, title: titre, id: crypto.randomUUID(), timestamp: new Date() });
        consignerLeJet({ ...jet, titre, seuil: 10 });
        nombre = nombreDeCartesTorg(jet.total - 10, jet.degre === 'echec-total');
    }
    const regard = regarderLesProchaines(etat, nombre, DeckInterpreter.shuffle);
    etat = regard.etat;
    if (regard.indices.length) etat = { ...etat, torgChoix: { ...etat.torgChoix, [acteur]: { atout, indices: regard.indices, beneficiaire: atout === 'ingenieux' ? beneficiaire : acteur } } };
    s.appliquerAuPaquet(deckId, () => etat);
    return true;
}

export function garderChoixAtoutTorg(deckId: string, acteur: string, garde: number): void {
    const s = useSessionOSStore.getState(), etat = s.deckStates[deckId], deck = s.decks.find(d => d.id === deckId);
    const choix = etat?.torgChoix?.[acteur];
    if (!choix || !deck) return;
    const apres = garderUneParmi(etat, choix.indices, garde, choix.beneficiaire, deck.useDiscard);
    if (apres === etat) { gmToast('La pioche a changé : ce choix ne peut plus être appliqué.', 'warning'); return; }
    const restants = { ...apres.torgChoix }; delete restants[acteur];
    s.appliquerAuPaquet(deckId, () => ({ ...apres, torgChoix: restants }));
    tracer(choix.atout === 'domination' ? 'Loi de la Domination' : NOMS_DES_ATOUTS_TORG[choix.atout], `Carte ${garde} gardée par ${choix.beneficiaire} ; ${choix.indices.length - 1} autre(s) défaussée(s).`);
}

/** La pioche a bougé pendant le choix : reprendre les cartes autorisées, sans relancer ni repayer. */
export function reprendreChoixAtoutTorg(deckId: string, acteur: string): void {
    const s = useSessionOSStore.getState(), etat = s.deckStates[deckId], choix = etat?.torgChoix?.[acteur];
    if (!choix || choix.indices.every(i => etat.remainingIndices.includes(i))) return;
    const regard = regarderLesProchaines(etat, choix.indices.length, DeckInterpreter.shuffle);
    if (!regard.indices.length) { gmToast('Le paquet est épuisé : terminer ce choix quand une pioche sera disponible.', 'info'); return; }
    s.appliquerAuPaquet(deckId, () => ({ ...regard.etat, torgChoix: { ...regard.etat.torgChoix, [acteur]: { ...choix, indices: regard.indices } } }));
}

export function ouvrirChoixDominationTorg(deckId: string, acteur: string): boolean {
    const c = contexte(deckId, acteur); if (!c || c.etat.torgChoix?.[acteur]) return false;
    const cosms = cosmsDesIds(c.pilote.cosms, idsDesCosmsCourants(c.s.campaigns.find(x => x.id === c.s.activeCampaignId), c.s.scenes));
    if (!loiEnVigueur(cosms, 'domination')) return false;
    const regard = regarderLesProchaines(c.etat, 2, DeckInterpreter.shuffle);
    if (!regard.indices.length) return false;
    c.s.appliquerAuPaquet(deckId, () => ({ ...regard.etat, torgChoix: { ...regard.etat.torgChoix, [acteur]: { atout: 'domination', indices: regard.indices, beneficiaire: acteur } } }));
    return true;
}

export function poserCarteOccultisteTorg(deckId: string, acteur: string, index: number): void {
    const c = contexte(deckId, acteur, 'occultiste'); if (!c || c.etat.torgChoix?.[acteur]) return;
    if (!c.etat.torgUsagesCombat?.includes(c.cle) || c.etat.torgUsagesCombat.includes(`${c.cle}:reserve`)) return;
    if (!c.etat.enMain?.some(x => x.index === index && x.porteur === acteur && !x.enReserve)) return;
    c.s.appliquerAuPaquet(deckId, e => ({ ...e, enMain: e.enMain?.map(x => x.index === index ? { ...x, enReserve: true, face: 'revelee' } : x),
        torgUsagesCombat: [...(e.torgUsagesCombat ?? []), `${c.cle}:reserve`] }));
    tracer('Occultiste', `${c.personnage.name} pose immédiatement une carte en Réserve au début du combat (p. 94).`);
}

export function estUneRelationTorg(nom: string | undefined): boolean {
    return !!nom && /^relation(?:\s|$|[(:—-])/i.test(nom.trim());
}

export function prendreRelationTorg(deckId: string, acteur: string, index: number): void {
    const c = contexte(deckId, acteur, 'populaire'); if (!c) return;
    if (c.etat.torgUsagesActe?.includes(c.cle)) { gmToast('Populaire est déjà utilisé dans cet Acte.', 'info'); return; }
    if (!estUneRelationTorg(c.deck.cardMetadata?.[index]?.name)) { gmToast('Populaire ne permet de prendre qu’une carte nommée Relation.', 'info'); return; }
    const apres = prendreUneCarte(c.etat, index, acteur); if (apres === c.etat) return;
    c.s.appliquerAuPaquet(deckId, () => ({ ...apres, torgUsagesActe: [...(apres.torgUsagesActe ?? []), c.cle] }));
    tracer('Populaire', `${c.personnage.name} ajoute une Relation à sa main (une fois par Acte).`);
}

export function poserParAtoutTorg(deckId: string, acteur: string, atout: 'chefNaturel' | 'conscienceEnvironnementale', indices: number[], beneficiaire: string): void {
    const c = contexte(deckId, acteur, atout); if (!c) return;
    const n = atout === 'chefNaturel' ? 2 : 1;
    if (indices.length !== n || new Set(indices).size !== n || indices.some(i => !c.etat.enMain?.some(x => x.index === i && x.porteur === acteur && !x.enReserve))) return;
    if (atout === 'conscienceEnvironnementale' && c.etat.torgUsagesScene?.includes(c.cle)) { gmToast('Conscience environnementale est déjà utilisée dans cette scène.', 'info'); return; }
    if (atout === 'chefNaturel' && (acteur === beneficiaire || !c.s.players.some(p => p.characters.some(ch => ch.id === beneficiaire && ch.campaignId === c.s.activeCampaignId)))) return;
    const champ = c.pilote.jet?.torg?.possibilites, avant = Number(champ ? c.valeurs[champ] : 0) || 0;
    if (atout === 'chefNaturel') {
        if (!champ || avant < 1) { gmToast('Chef naturel coûte une Possibilité.', 'info'); return; }
        c.s.updateCharacter(c.joueur.id, acteur, { sheetData: { ...c.valeurs, [champ]: avant - 1 } });
    }
    c.s.appliquerAuPaquet(deckId, e => ({ ...e,
        enMain: e.enMain?.map(x => indices.includes(x.index) ? { ...x, porteur: atout === 'chefNaturel' ? beneficiaire : acteur, enReserve: true, face: 'revelee' } : x),
        torgUsagesScene: atout === 'conscienceEnvironnementale' ? [...(e.torgUsagesScene ?? []), c.cle] : e.torgUsagesScene,
    }));
    tracer(NOMS_DES_ATOUTS_TORG[atout], `${c.personnage.name} pose ${n} carte(s) en Réserve pour ${atout === 'chefNaturel' ? beneficiaire : c.personnage.name}${atout === 'chefNaturel' ? ` ; Possibilités ${avant} → ${avant - 1}` : ''}.`);
}
