import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Check, RotateCcw, Save } from 'lucide-react';
import { useGemStore } from '../../../stores/useGemStore';
import { useCorpusDuPilote, type PiloteAResoudre } from './useCorpusDuPilote';

/**
 * Les personas du corpus, montrées et — si on l'autorise — modifiables.
 *
 * **Ce que ça corrige, dit par David le 2026-08-14 : « il n'a pas récupéré les
 * personas ».** Il regardait l'éditeur du moteur de règles, qui affiche huit
 * zones de texte vides parce qu'il ne montre que `driver.aiPersonas`, un
 * *override*. Les huit personas d'Alien étaient là depuis le début, dans
 * `docs/systems/alien/gems.json`, et servaient à chaque réponse de l'Oracle.
 * Aucun écran ne les montrait.
 *
 * **Un seul écran écrit, tous les autres montrent.** L'écriture n'est ouverte
 * que dans la Forge, parce que `ForgeOS` pose la règle : on documente un corpus
 * là, et nulle part ailleurs — c'est ce qui a évité qu'on abîme une campagne
 * Blade Runner pour enrichir Dune. Ailleurs, `lectureSeule` affiche le même
 * texte sans permettre d'y toucher.
 *
 * **On n'écrit que ce qui a été modifié.** Le brouillon reste local tant qu'il
 * n'est pas enregistré ; une persona vidée est retirée du fichier plutôt
 * qu'écrite à blanc, sinon elle écraserait par du vide l'instruction par défaut
 * de la gemme.
 */

const PanneauDesPersonas: React.FC<{
    pilote: PiloteAResoudre | null | undefined;
    systemPath?: string;
    lectureSeule?: boolean;
    /** Ce que l'écran propose quand il ne sait pas écrire — « ouvrez la Forge ». */
    noteLectureSeule?: React.ReactNode;
    /** Une seule colonne — pour la colonne de désignation de la Forge, qui est étroite. */
    compact?: boolean;
}> = ({ pilote, systemPath, lectureSeule = false, noteLectureSeule, compact = false }) => {
    const { t } = useTranslation(['settings']);
    const gems = useGemStore(s => s.gems);
    const { corpus, personas, chargement, enregistrer } = useCorpusDuPilote(pilote, systemPath);

    /** Le brouillon, `null` tant que rien n'a été touché : on suit alors le disque. */
    const [brouillon, setBrouillon] = React.useState<Record<string, string> | null>(null);
    const [echec, setEchec] = React.useState<string | null>(null);
    const [enregistre, setEnregistre] = React.useState(false);

    // Le disque a changé (relecture, autre pilote) : le brouillon n'a plus d'objet.
    React.useEffect(() => { setBrouillon(null); setEnregistre(false); }, [personas]);

    const courant = brouillon ?? personas.personas;
    const modifie = brouillon !== null;

    const modifier = (gemId: string, valeur: string) => {
        setEnregistre(false);
        setBrouillon({ ...courant, [gemId]: valeur });
    };

    const sauver = async () => {
        setEchec(null);
        const message = await enregistrer(courant);
        if (message) { setEchec(message); return; }
        setBrouillon(null);
        setEnregistre(true);
    };

    if (!pilote) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-app-text/40">
                        Personas du corpus
                    </h3>
                    <p className="text-ui-11 text-app-text/40 mt-1 leading-relaxed max-w-2xl">
                        Le texte que l'Oracle emploie réellement, lu dans{' '}
                        <code className="font-mono text-app-text/60">
                            docs/{corpus?.racine ?? '…'}/gems.json
                        </code>
                        . Il l'emporte sur l'instruction par défaut de chaque gemme, et il est
                        lui-même écrasé par l'override du pilote s'il y en a un.
                    </p>
                </div>

                {!lectureSeule && (
                    <div className="flex items-center gap-3">
                        {modifie && (
                            <button
                                onClick={() => { setBrouillon(null); setEchec(null); }}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-app-border/40 text-ui-10 font-black uppercase tracking-widest text-app-text/50 hover:text-app-text/80 transition-all"
                            >
                                <RotateCcw size={12} /> Annuler
                            </button>
                        )}
                        <button
                            onClick={sauver}
                            disabled={!modifie || !corpus}
                            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-ui-10 font-black uppercase tracking-widest transition-all ${
                                modifie && corpus
                                    ? 'bg-accent text-app-bg shadow-glow-accent/20'
                                    : 'bg-app-surface/40 text-app-text/20 cursor-not-allowed'
                            }`}
                        >
                            <Save size={12} /> Écrire dans le corpus
                        </button>
                    </div>
                )}
            </div>

            {chargement && <p className="text-xs text-app-text/40">Lecture du disque…</p>}

            {enregistre && (
                <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
                    <Check size={14} className="text-emerald-400 shrink-0" />
                    <p className="text-ui-11 text-emerald-300/80">
                        Écrit dans le corpus. Toutes les campagnes qui l'emploient en héritent.
                    </p>
                </div>
            )}

            {echec && (
                <div className="flex items-start gap-3 bg-red-500/5 border border-red-500/20 rounded-xl p-3">
                    <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
                    <p className="text-ui-11 text-red-300/80">L'écriture a échoué — {echec}</p>
                </div>
            )}

            {personas.erreur && (
                <div className="flex items-start gap-3 bg-red-500/5 border border-red-500/20 rounded-xl p-3">
                    <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
                    <p className="text-ui-11 text-red-300/80 leading-relaxed">
                        Le fichier existe mais ne se lit pas — {personas.erreur}. Les gemmes jouent
                        leurs instructions par défaut en attendant qu'il soit réparé.
                    </p>
                </div>
            )}

            {!chargement && !personas.present && !personas.erreur && (
                <p className="text-ui-11 text-app-text/40 leading-relaxed">
                    Ce corpus n'a pas de <code className="font-mono">gems.json</code>. Ce n'est pas
                    une anomalie : les gemmes emploient alors leurs instructions par défaut.
                    {!lectureSeule && ' Écrire ici en créera un.'}
                </p>
            )}

            <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
                {gems.map(gem => {
                    const valeur = courant[gem.id] ?? '';
                    const vientDuCorpus = !!personas.personas[gem.id];
                    return (
                        <div
                            key={gem.id}
                            className={`p-5 rounded-2xl border transition-all ${
                                vientDuCorpus
                                    ? 'bg-accent/5 border-accent/30'
                                    : 'bg-app-surface/20 border-app-border/10'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className={`text-ui-11 font-black uppercase tracking-[0.2em] ${
                                    vientDuCorpus ? 'text-accent' : 'text-app-text/40'
                                }`}>
                                    {t(gem.name)}
                                </span>
                                <code className="font-mono text-ui-10 text-app-text/30">{gem.id}</code>
                            </div>
                            <textarea
                                value={valeur}
                                readOnly={lectureSeule}
                                onChange={e => modifier(gem.id, e.target.value)}
                                placeholder={
                                    lectureSeule
                                        ? 'Le corpus ne définit pas cette persona — instruction par défaut de la gemme.'
                                        : 'Vide : la gemme emploiera son instruction par défaut.'
                                }
                                className={`w-full h-36 bg-app-bg/40 border border-app-border/10 rounded-xl p-3 text-ui-11 text-app-text/70 outline-none transition-all font-mono resize-none leading-relaxed custom-scrollbar ${
                                    lectureSeule ? 'cursor-default opacity-80' : 'focus:border-accent/40'
                                }`}
                            />
                        </div>
                    );
                })}
            </div>

            {lectureSeule && noteLectureSeule}
        </div>
    );
};

export default PanneauDesPersonas;
