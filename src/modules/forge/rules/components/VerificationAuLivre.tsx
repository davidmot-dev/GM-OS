import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LivreALaPage, { type RegistreDesLivres } from './LivreALaPage';
import { livreDeLaCle, MOTIFS_D_OUVERTURE, type MotifDOuverture } from '../livres';
import { lignesAVerifier, pagesAVerifier, verifierAuLivre, type VerificationAuLivre as Resultat } from '../verificationAuLivre';

/**
 * **F4 — le livre vérifie la fiche** (06/11/2026), dans l'encart « Ce que le catalogue et le
 * bestiaire liront » de la relecture. Les lignes que les lecteurs prendront sont cherchées sur leur
 * page du PDF : le nom, et ses valeurs à côté de lui.
 *
 * Pourquoi : la reforge des adversaires de COC, le 06/11, avait de justes valeurs dans son tableau,
 * mais le carnet a déjà inventé des chiffres (Nephilim, Symbaroum) ; un tableau chiffré ne se publie
 * pas sans qu'on l'ait confronté au livre. **La lecture est automatique** : un contrôle qu'il faut
 * penser à demander est un contrôle qui se tait.
 */
interface Props {
    contenu: string;
    registre: RegistreDesLivres;
    /** `jeu`, ou le slug du supplément documenté. */
    cle: string;
    /** La plage des sections résolues par l'index (pages imprimées), pour les tableaux sans page. */
    plage: { min: number; max: number } | null;
    /** L'index résout encore : on attend sa plage avant de lire. */
    plageEnCours: boolean;
}

/** Le résultat porte la demande qui l'a produit : celui d'une fiche précédente ne s'affiche pas. */
type Etat =
    | { demande: string; genre: 'fait'; resultat: Resultat }
    | { demande: string; genre: 'echec'; motif: MotifDOuverture };

/** « 92-97, 108 » : les pages lues, en plages. */
function enPlages(pages: readonly number[]): string {
    const plages: string[] = [];
    for (let i = 0; i < pages.length; i++) {
        let j = i;
        while (j + 1 < pages.length && pages[j + 1] === pages[j] + 1) j++;
        plages.push(i === j ? `${pages[i]}` : `${pages[i]}-${pages[j]}`);
        i = j;
    }
    return plages.join(', ');
}

const VerificationAuLivre: React.FC<Props> = ({ contenu, registre, cle, plage, plageEnCours }) => {
    const { t } = useTranslation(['modules']);
    const lignes = useMemo(() => lignesAVerifier(contenu), [contenu]);
    const livre = livreDeLaCle(registre.livres, cle);
    const pages = useMemo(() => pagesAVerifier(lignes, plage), [lignes, plage]);
    const attendLaPlage = plageEnCours && lignes.some(l => !l.page);
    const lire = window.appBridge?.livres?.lirePages;
    const [lu, setLu] = useState<Etat | null>(null);
    const demande = `${livre?.chemin ?? ''}|${pages.join(',')}|${contenu}`;
    const etat = lu && lu.demande === demande ? lu : null;

    useEffect(() => {
        if (!lignes.length || !livre || !registre.racine || !lire || attendLaPlage || !pages.length) return;
        let abandonne = false;
        const rang = registre.livres.filter(l => l.cle === livre.cle).indexOf(livre);
        lire({ racine: registre.racine, cle: livre.cle, ...(rang > 0 ? { rang } : {}), pages })
            .then(r => {
                if (abandonne) return;
                setLu(r.lu
                    ? { demande, genre: 'fait', resultat: verifierAuLivre(lignes, r.pages) }
                    : { demande, genre: 'echec', motif: r.motif });
            })
            .catch(() => { if (!abandonne) setLu({ demande, genre: 'echec', motif: 'illisible' }); });
        return () => { abandonne = true; };
    }, [demande, lignes, livre, registre, lire, attendLaPlage, pages]);

    if (!lignes.length) return null;
    if (!livre || !registre.racine) {
        return <p data-verification-au-livre="sans-livre" className="text-app-text/40">{t('session.forge_module.atelier.lecteurs_livre_sans')}</p>;
    }
    if (!attendLaPlage && !pages.length) {
        return <p data-verification-au-livre="sans-pages" className="text-app-text/40">{t('session.forge_module.atelier.lecteurs_livre_sans_pages')}</p>;
    }
    if (!etat) {
        return (
            <p data-verification-au-livre="lecture" className="text-app-text/40 animate-pulse">
                {t('session.forge_module.atelier.lecteurs_livre_lecture', { pages: pages.length ? enPlages(pages) : '…' })}
            </p>
        );
    }
    if (etat.genre === 'echec') {
        return <p data-verification-au-livre="echec" className="text-etat-alerte/70">{t('session.forge_module.atelier.lecteurs_livre_echec', { motif: MOTIFS_D_OUVERTURE[etat.motif] })}</p>;
    }

    const r = etat.resultat;
    const douteuses = r.lignes.filter(l => !l.retrouvee);
    return (
        <div data-verification-au-livre="fait" className={r.introuvables ? 'text-etat-alerte/80' : ''}>
            <p {...(r.introuvables ? { role: 'alert' } : {})}>
                {t('session.forge_module.atelier.lecteurs_livre_resultat', {
                    retrouvees: r.retrouvees, total: r.total, aConfirmer: r.aConfirmer, introuvables: r.introuvables, pages: enPlages(r.pages),
                })}
            </p>
            {douteuses.length > 0 && (
                <ul className="mt-1 space-y-1 text-xs list-disc pl-6">
                    {douteuses.slice(0, 8).map((l, i) => (
                        <li key={i} data-ligne-douteuse={l.nom}>
                            <span className="font-bold">{l.nom}</span>
                            {' — '}
                            {!l.nomTrouve
                                ? t('session.forge_module.atelier.lecteurs_livre_nom_absent')
                                : [
                                    l.manquantes.length ? t('session.forge_module.atelier.lecteurs_livre_manquantes', { valeurs: l.manquantes.join(', ') }) : '',
                                    l.ailleurs.length ? t('session.forge_module.atelier.lecteurs_livre_ailleurs', { valeurs: l.ailleurs.map(a => `${a.valeur} (p. ${a.page})`).join(', ') }) : '',
                                ].filter(Boolean).join(' ; ')}
                            {l.page && (
                                <>
                                    {' '}
                                    <LivreALaPage registre={registre} source={{ cle, page: l.page }} sansLivre="rien" />
                                </>
                            )}
                        </li>
                    ))}
                    {douteuses.length > 8 && <li>{t('session.forge_module.atelier.lecteurs_livre_et_autres', { n: douteuses.length - 8 })}</li>}
                </ul>
            )}
        </div>
    );
};

export default VerificationAuLivre;
