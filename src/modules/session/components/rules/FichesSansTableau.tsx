import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { LivreACataloguer } from '../../../equipement/livresDuJeu';

/**
 * **Les fiches qui parlent du sujet sans tableau lisible** — « Remplir depuis le corpus », catalogue
 * et bestiaire (06/11/2026). David, sur COC : *« malgré le fait que j'ai une fiche, rien ne se
 * remplit »* — la fiche forgée était en prose, et l'écran se taisait. Il dit désormais laquelle, et
 * ce que le lecteur attend.
 */
interface FichesSansTableauProps {
    livres: readonly LivreACataloguer[] | null;
    /** « d’équipement », « de créatures ». */
    sujet: string;
    /** Ce que le lecteur attend, en clair : « la première colonne est Arme, Protection, Véhicule ou Objet ». */
    attendu: string;
}

const FichesSansTableau: React.FC<FichesSansTableauProps> = ({ livres, sujet, attendu }) => {
    const sans = (livres ?? []).flatMap(l => (l.sansTableau ?? []).map(nom => ({ nom, livre: l.titre })));
    if (!sans.length) return null;
    return (
        <div role="note" data-fiches-sans-tableau className="mt-3 flex gap-2.5 rounded-2xl border border-etat-alerte/30 bg-etat-alerte/5 p-3 text-ui-12 text-app-text">
            <AlertTriangle size={15} className="mt-0.5 shrink-0 text-etat-alerte" />
            <div className="space-y-1">
                <p>
                    {sans.length > 1 ? 'Ces fiches parlent' : 'Cette fiche parle'} {sujet} sans tableau que GM-OS sache lire :{' '}
                    {sans.map((s, i) => (
                        <React.Fragment key={`${s.livre}/${s.nom}`}>
                            {i > 0 && ', '}<span className="font-mono font-bold">{s.nom}</span> <span className="text-app-muted">({s.livre})</span>
                        </React.Fragment>
                    ))}.
                </p>
                <p className="text-app-muted">
                    Seuls les tableaux dont {attendu} sont lus. Relisez la fiche contre le livre et recopiez ses tableaux
                    (guide 50, Forge des systèmes).
                </p>
            </div>
        </div>
    );
};

export default FichesSansTableau;
