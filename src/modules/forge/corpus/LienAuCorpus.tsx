import React from 'react';
import { AlertTriangle, FolderOpen, Info } from 'lucide-react';
import { raisonLisible } from './personasDuCorpus';
import { useCorpusDuPilote, type PiloteAResoudre } from './useCorpusDuPilote';

/**
 * À quel corpus ce pilote est rattaché — et **pourquoi celui-là**.
 *
 * **Ce que ça corrige.** `driver.corpusId` décide à lui seul quel dossier sera
 * lu, pour les fiches de l'Oracle comme pour les personas, et il n'apparaissait
 * sur aucun écran. Quand la résolution se trompait, rien ne le disait : les
 * personas de Dune sont restées inertes depuis leur création parce que le code
 * demandait `systems/custom-1754…/gems.json`, un chemin qui n'existe pas, et
 * qu'un `catch` avalait le vide.
 *
 * **La raison compte autant que le chemin.** Un corpus trouvé « parce que le
 * pilote le déclare » et un corpus trouvé « en rapprochant son nom affiché »
 * mènent au même dossier aujourd'hui et divergeront le jour où l'on renommera
 * le pilote. `resoudreCorpus` calcule déjà cette raison, ainsi que la
 * contradiction entre le nom et le chemin déclaré. Les deux se voient enfin.
 */

const Ligne: React.FC<{ clef: string; children: React.ReactNode }> = ({ clef, children }) => (
    <div className="flex gap-3 text-xs leading-relaxed">
        <span className="text-app-text/40 shrink-0 w-32">{clef}</span>
        <span className="text-app-text/80 min-w-0 break-words">{children}</span>
    </div>
);

const LienAuCorpus: React.FC<{
    pilote: PiloteAResoudre | null | undefined;
    /** Chemin déclaré sur la campagne, quand l'écran en connaît une. */
    systemPath?: string;
    /** Titre du bloc — les écrans ne l'appellent pas tous pareil. */
    titre?: string;
}> = ({ pilote, systemPath, titre = 'Corpus rattaché' }) => {
    const { corpus, personas, chargement } = useCorpusDuPilote(pilote, systemPath);

    if (!pilote) return null;

    return (
        <div className="bg-app-text/5 rounded-2xl border border-app-border/10 p-5 space-y-3">
            <p className="text-[10px] uppercase font-black text-accent tracking-[0.2em] font-display flex items-center gap-2">
                <FolderOpen size={12} /> {titre}
            </p>

            {chargement && <p className="text-xs text-app-text/40">Lecture du disque…</p>}

            {!chargement && !corpus && (
                <p className="text-xs text-app-text/40">
                    Corpus non résolu — l'application ne peut pas lire le disque depuis cet écran.
                </p>
            )}

            {!chargement && corpus && (
                <>
                    <Ligne clef="Dossier">
                        <code className="font-mono px-1.5 py-0.5 rounded bg-app-text/10 text-app-text/70">
                            docs/{corpus.racine}
                        </code>
                    </Ligne>
                    <Ligne clef="Résolu par">{raisonLisible(corpus)}</Ligne>

                    <Ligne clef="Personas">
                        {personas.erreur ? (
                            <span className="text-red-300">
                                gems.json illisible — {personas.erreur}
                            </span>
                        ) : personas.present ? (
                            <span className="text-emerald-300/80">
                                {Object.keys(personas.personas).length} lue
                                {Object.keys(personas.personas).length > 1 ? 's' : ''} dans gems.json
                                {' '}— c'est ce texte que l'Oracle emploie.
                            </span>
                        ) : (
                            <span className="text-app-text/50">
                                aucun gems.json : les gemmes joueront leurs instructions par défaut.
                            </span>
                        )}
                    </Ligne>

                    {/*
                      Le dossier n'existe pas encore. Ce n'est pas une faute — on
                      crée bien des corpus — mais tant qu'il est vide, l'Oracle
                      n'a rien à lire et l'écran doit le dire plutôt que
                      d'afficher un chemin rassurant.
                    */}
                    {corpus.aCreer && (
                        <div className="flex gap-2 items-start bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                            <Info size={14} className="text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-amber-200/70 leading-relaxed">
                                Ce dossier n'existe pas encore sur le disque. Il sera créé à
                                l'enregistrement, vide : ni fiches, ni personas tant qu'on n'y aura
                                rien écrit.
                            </p>
                        </div>
                    )}

                    {/*
                      Le nom du pilote désigne un autre dossier réel que celui
                      qu'il déclare. Le déclaré reste souverain — on ne change
                      rien — mais c'est très exactement la situation où quelqu'un
                      travaille depuis des heures dans le mauvais corpus.
                    */}
                    {corpus.contradiction && (
                        <div className="flex gap-2 items-start bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                            <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-amber-200/70 leading-relaxed">
                                Le nom de ce pilote désigne <code className="font-mono">{corpus.contradiction}</code>,
                                un autre dossier qui existe aussi. C'est le corpus déclaré qui
                                l'emporte, et c'est bien <code className="font-mono">{corpus.id}</code> qui
                                sera lu — mais si vous cherchiez l'autre, rien d'autre ne vous
                                l'aurait dit.
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default LienAuCorpus;
