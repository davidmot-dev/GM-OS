import React from 'react';
import { AlertTriangle, Archive, FileText, RefreshCw } from 'lucide-react';
import { corpusChoisi } from '../../../../electron/corpusSysteme';
import { gmConfirm } from '../../../stores/useModalStore';
import { gmToast } from '../../../stores/useToastStore';
import { lireLesFiches, archiverUneFiche, type FicheDuDossier } from './archivage';

/**
 * Les fiches publiées d'un corpus, et de quoi en écarter une soi-même.
 *
 * **Demandé par David le 2026-08-14 : « il serait bon que je puisse faire ce
 * nettoyage moi-même ».** L'archivage automatique posé à la publication ne
 * couvre que ce que la Forge écrit ; un corpus se répare aussi à la main —
 * après une reforge ratée, un import, ou un défaut de lecture comme celui des
 * numéros en toutes lettres qui a fait compter 23 candidats pour 14 sujets.
 *
 * **Ce que l'écran montre et que rien ne montrait.** Le `sujet:` de chaque
 * fiche, et surtout **les doublons de sujet** — deux fichiers qui portent le
 * même sujet sous des noms différents, ce que produit toute reforge. C'est
 * exactement ce que le test d'unicité trouvait le 2026-08-11 sans que personne
 * puisse le voir depuis l'application : huit doublons dans quatre systèmes.
 *
 * **Écarter, jamais supprimer.** La fiche part dans `rules-v1/`, hors de
 * l'index de l'Oracle mais toujours sur le disque.
 */

const PanneauDesFiches: React.FC<{
    /** Identifiant du dossier de corpus — `alien`, `srd-yze`… */
    corpusId: string | null | undefined;
}> = ({ corpusId }) => {
    const [fiches, setFiches] = React.useState<FicheDuDossier[]>([]);
    const [chargement, setChargement] = React.useState(false);
    const [tour, setTour] = React.useState(0);

    const corpus = React.useMemo(() => (corpusId ? corpusChoisi(corpusId) : null), [corpusId]);

    React.useEffect(() => {
        const pont = window.appBridge?.ai;
        if (!corpus || !pont) { setFiches([]); return; }
        let annule = false;
        setChargement(true);
        lireLesFiches(corpus, pont)
            .then(lues => { if (!annule) setFiches(lues); })
            .catch(() => { if (!annule) setFiches([]); })
            .finally(() => { if (!annule) setChargement(false); });
        return () => { annule = true; };
    }, [corpus, tour]);

    if (!corpus) return null;

    const doublons = fiches.filter(f => f.enDouble).length;

    const archiver = (fiche: FicheDuDossier) => {
        gmConfirm(
            `« ${fiche.nom} » part dans rules-v1/. Elle sort du corpus et de l'index de l'Oracle, ` +
            'mais reste sur le disque : rien n\'est supprimé.',
            async () => {
                const pont = window.appBridge?.ai;
                if (!pont) return;
                const echec = await archiverUneFiche(corpus, fiche.nom, pont);
                gmToast(
                    echec ? `Archivage impossible — ${echec}` : `« ${fiche.nom} » archivée.`,
                    echec ? 'warning' : 'success',
                );
                setTour(n => n + 1);
            },
            undefined,
            'ARCHIVER',
            'ANNULER',
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-app-text/40 flex items-center gap-2">
                        <FileText size={12} /> Fiches du corpus
                    </h3>
                    <p className="text-ui-10 text-app-text/40 mt-1">
                        {chargement ? 'Lecture du disque…' : `${fiches.length} fiche${fiches.length > 1 ? 's' : ''} dans rules/`}
                    </p>
                </div>
                <button
                    onClick={() => setTour(n => n + 1)}
                    title="Relire le disque"
                    className="p-2 rounded-lg border border-app-border/30 text-app-text/40 hover:text-app-text/80 transition-all"
                >
                    <RefreshCw size={12} />
                </button>
            </div>

            {/*
              Le doublon de sujet est ce qu'on vient chercher ici : deux fiches
              du même sujet sous des noms différents, et l'Oracle reçoit les
              deux — dont celle qu'une reforge venait de remplacer.
            */}
            {doublons > 0 && (
                <div className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                    <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-ui-11 text-amber-200/70 leading-relaxed">
                        {doublons} fiches portent un sujet que porte déjà une autre. L'Oracle les
                        reçoit toutes. Vérifiez laquelle garder — elles ne sont pas forcément
                        redondantes : deux fiches peuvent couvrir deux aspects d'un même sujet.
                    </p>
                </div>
            )}

            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-1">
                {fiches.map(fiche => (
                    <div
                        key={fiche.nom}
                        className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                            fiche.enDouble
                                ? 'bg-amber-500/5 border-amber-500/20'
                                : 'bg-app-surface/20 border-app-border/10'
                        }`}
                    >
                        <div className="min-w-0">
                            <p className="text-ui-11 font-mono text-app-text/70 truncate">{fiche.nom}</p>
                            <p className="text-ui-10 text-app-text/40 truncate">
                                {fiche.sujet ?? <span className="italic">aucun sujet — hors de tout groupe</span>}
                            </p>
                        </div>
                        <button
                            onClick={() => archiver(fiche)}
                            title="Écarter vers rules-v1/"
                            className="flex items-center gap-1.5 px-3 py-1.5 shrink-0 rounded-lg border border-app-border/30 text-ui-9 font-black uppercase tracking-widest text-app-text/40 hover:text-amber-300 hover:border-amber-500/40 transition-all"
                        >
                            <Archive size={11} /> Écarter
                        </button>
                    </div>
                ))}

                {!chargement && fiches.length === 0 && (
                    <p className="text-ui-11 text-app-text/40 leading-relaxed">
                        Ce corpus n'a aucune fiche publiée. L'Atelier de Règles les produit, une par
                        sujet du canevas.
                    </p>
                )}
            </div>
        </div>
    );
};

export default PanneauDesFiches;
