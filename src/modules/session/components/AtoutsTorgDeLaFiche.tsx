import { useSessionOSStore } from '../useSessionOSStore';
import { CarteDuJeu } from './fields/EtapesDuJet';
import GestesDesAtoutsTorg from './GestesDesAtoutsTorg';

export default function AtoutsTorgDeLaFiche({ personnageId, saisiesEnAttente }: { personnageId: string; saisiesEnAttente: boolean }) {
    const pilote = useSessionOSStore(s => s.getActiveDriver());
    const joueurs = useSessionOSStore(s => s.players);
    const campagne = useSessionOSStore(s => s.activeCampaignId);
    const decks = useSessionOSStore(s => s.decks);
    if (!pilote?.torg) return null;
    const deck = decks.find(d => d.role === 'destin' && d.systemId === pilote.id);
    const personnages = joueurs.flatMap(j => j.characters).filter(c => c.campaignId === campagne);
    return <CarteDuJeu id="atouts-torg" titre="Atouts et Cartes du Destin">
        {saisiesEnAttente && <p className="text-ui-11 text-app-muted">Sauvegarder les saisies avant d’utiliser un Atout et de payer ses coûts.</p>}
        {deck ? <fieldset disabled={saisiesEnAttente}><GestesDesAtoutsTorg key={`${deck.id}:${personnageId}`} deck={deck} personnages={personnages} acteurImpose={personnageId} /></fieldset>
                : <p className="text-ui-11 text-app-muted">Déclarer un Paquet du Destin pour ce jeu dans Deck-OS.</p>}
    </CarteDuJeu>;
}
