import React from 'react';
import { Pin, PinOff, ExternalLink, Trash2, Play, Square, Unlink } from 'lucide-react';
import { useSessionOSStore } from '../../useSessionOSStore';
import { gmConfirm } from '../../../../stores/useModalStore';
import { scenesEmportees, etatDeLaScene } from '../../logic/trame';
import { LIBELLE_DU_TYPE, idDuNoeud, type NoeudDeTrame, type TypeDeNoeud } from '../../logic/grapheDeLaTrame';
import { TEINTE_DE_TRAME } from '../../logic/adapterLeGrapheDeTrame';
import { sortiesDeLaScene, entreesDeLaScene, libelleLisible, LIBELLE_MAXIMUM } from '../../logic/enchainementsDeLaTrame';
import ChoixDuRang from './ChoixDuRang';

interface Props {
    noeudChoisi: NoeudDeTrame; voisins: NoeudDeTrame[];
    onChoisir: (id: string | null) => void; onDetacher: (id: string) => void;
    onOuvrirLaFiche: (type: TypeDeNoeud, refId: string) => void;
}
export const InspecteurDeTrame: React.FC<Props> = ({ noeudChoisi, voisins, onChoisir, onDetacher, onOuvrirLaFiche }) => {
    const { scenes, actes, sessions, campaigns, activeCampaignId, modifierScene, modifierActe,
        supprimerScene, supprimerActe, ouvrirLaScene, terminerLaScene, navigateToNpcDetail,
        retirerUnEnchainement, libellerUnEnchainement } = useSessionOSStore();
    const campagne = campaigns.find(c => c.id === activeCampaignId);
    const sceneChoisie = noeudChoisi.type === 'scene' ? scenes.find(s => s.id === noeudChoisi.refId) : undefined;
    const acteChoisi = noeudChoisi.type === 'acte' ? actes.find(a => a.id === noeudChoisi.refId) : undefined;
    const seanceActive = sessions.find(s => s.campaignId === activeCampaignId && s.status === 'active');
    const sorties = sceneChoisie ? sortiesDeLaScene(scenes, sceneChoisie) : [];
    const entrees = sceneChoisie ? entreesDeLaScene(scenes, sceneChoisie.id) : [];
    return (
                    <div className="inspecteur-de-trame custom-scrollbar space-y-3" aria-label="Inspecteur de trame">
                        <button className="text-ui-10 text-app-text/60" onClick={() => onChoisir(null)}>Fermer la sélection</button>
                        <div>
                            <p className="text-ui-9 font-black uppercase tracking-widest" style={{ color: TEINTE_DE_TRAME[noeudChoisi.type] }}>
                                {LIBELLE_DU_TYPE[noeudChoisi.type]}
                            </p>

                            {/*
                              ⭐ **Le titre s'édite ici.** Un champ, et pas un
                              double-clic sur la toile : *un texte qu'on tape par
                              dessus un canevas ne dit jamais où il commence ni ce
                              qu'il remplace.* L'écriture part vers la même action
                              que la fiche.
                            */}
                            {sceneChoisie || acteChoisi ? (
                                <div>
                                <h2 className="text-sm font-bold leading-snug break-words mt-1">{noeudChoisi.nom}</h2>
                                <input
                                    aria-label="Titre du nœud"
                                    value={noeudChoisi.nom}
                                    onChange={e => (sceneChoisie
                                        ? modifierScene(noeudChoisi.refId, { titre: e.target.value })
                                        : modifierActe(noeudChoisi.refId, { titre: e.target.value }))}
                                    className="w-full mt-1 bg-app-bg/40 px-2.5 py-1.5 rounded-lg border border-app-border/20 text-sm font-bold focus:border-accent/50 outline-none"
                                />
                                </div>
                            ) : (
                                <p className="text-sm font-bold leading-snug mt-0.5">{noeudChoisi.nom}</p>
                            )}

                            {noeudChoisi.etat && noeudChoisi.etat !== 'prevue' && (
                                <p className="text-ui-10 text-app-text/40 mt-1">{noeudChoisi.etat.replace('-', ' ')}</p>
                            )}
                        </div>

                        {/* Le rang, par le contrôle partagé avec la fiche — deux
                            copies auraient fini par ne plus offrir les mêmes rangs. */}
                        {sceneChoisie && (
                            <div className="space-y-1.5">
                                <p className="text-ui-9 font-black uppercase tracking-widest text-app-text/30">
                                    Rang dans l’intrigue
                                </p>
                                <ChoixDuRang
                                    scene={sceneChoisie}
                                    onChange={updates => modifierScene(sceneChoisie.id, updates)}
                                    compact
                                />
                            </div>
                        )}

                        {/* Commencer et terminer : les deux gestes du parcours réel,
                            et les mêmes actions qu’en séance. Une scène en pause a
                            besoin des DEUX — c’est le défaut du 2026-08-20. */}
                        {sceneChoisie && (
                            <div className="flex gap-1.5">
                                {etatDeLaScene(sceneChoisie) !== 'en-cours' && (
                                    <button
                                        onClick={() => ouvrirLaScene(sceneChoisie.id, seanceActive?.id)}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-app-border/20 text-ui-10 font-bold text-app-text/60 hover:text-etat-succes hover:bg-app-text/5 transition-all"
                                    ><Play size={11} /> {etatDeLaScene(sceneChoisie) === 'terminee' ? 'Rouvrir' : 'Commencer'}</button>
                                )}
                                {(etatDeLaScene(sceneChoisie) === 'en-cours' || etatDeLaScene(sceneChoisie) === 'en-pause') && (
                                    <button
                                        onClick={() => terminerLaScene(sceneChoisie.id)}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-app-border/20 text-ui-10 font-bold text-etat-succes hover:text-etat-danger hover:bg-app-text/5 transition-all"
                                    ><Square size={11} /> Terminer</button>
                                )}
                            </div>
                        )}

                        {/* Les deux gestes qui touchent à la disposition, jamais à la trame. */}
                        <div className="flex gap-1.5">
                            {campagne?.noeudsEpinglesDeLaTrame?.[noeudChoisi.id] ? (
                                <button
                                    onClick={() => onDetacher(noeudChoisi.id)}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-accent/30 bg-accent/10 text-accent text-ui-10 font-bold"
                                ><PinOff size={11} /> Détacher</button>
                            ) : (
                                <span className="flex items-center gap-1.5 px-2.5 py-1.5 text-ui-10 text-app-text/25">
                                    <Pin size={11} /> Glisse-le pour l’épingler
                                </span>
                            )}
                        </div>

                        {(noeudChoisi.type === 'scene' || noeudChoisi.type === 'acte' || noeudChoisi.type === 'pnj') && (
                            <button
                                onClick={() => {
                                    if (noeudChoisi.type === 'pnj') navigateToNpcDetail(noeudChoisi.refId);
                                    else onOuvrirLaFiche(noeudChoisi.type, noeudChoisi.refId);
                                }}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-accent/15 border border-accent/30 text-accent text-ui-10 font-black uppercase tracking-widest hover:bg-accent/25 transition-all"
                            ><ExternalLink size={12} /> Ouvrir la fiche</button>
                        )}

                        {/*
                          ⭐ **Les sorties de la scène, et leur condition.** C'est ici
                          qu'on écrit *« si elle survit »* — le geste de la toile crée
                          la branche, le panneau lui donne son sens. ⚠️ Et une porte
                          pour les défaire sans passer par le mode liaison : *un lien
                          qu'on ne peut retirer que d'une façon est un lien qu'on
                          n'ose plus créer.*
                        */}
                        {sceneChoisie && sorties.length > 0 && (
                            <div className="space-y-1.5">
                                <p className="text-ui-9 font-black uppercase tracking-widest text-etat-info/60">
                                    Mène à
                                </p>
                                {sorties.map(sortie => (
                                    <div key={sortie.vers.id} className="space-y-1 p-2 rounded-lg bg-etat-info/5 border border-etat-info/20">
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => onChoisir(idDuNoeud('scene', sortie.vers.id))}
                                                className="flex-1 min-w-0 text-left text-ui-11 font-bold text-etat-info/90 truncate hover:text-etat-info"
                                            >{sortie.vers.titre}</button>
                                            <button
                                                onClick={() => retirerUnEnchainement(sceneChoisie.id, sortie.vers.id)}
                                                title="Retirer cette sortie"
                                                className="p-0.5 rounded text-app-text/30 hover:text-etat-danger"
                                            ><Unlink size={11} /></button>
                                        </div>
                                        <input
                                            value={sortie.libelle ?? ''}
                                            onChange={e => libellerUnEnchainement(sceneChoisie.id, sortie.vers.id, e.target.value)}
                                            maxLength={LIBELLE_MAXIMUM}
                                            placeholder="à quelle condition ?"
                                            className="w-full bg-app-bg/40 px-2 py-1 rounded text-ui-10 border border-app-border/20 focus:border-etat-info/50 outline-none placeholder:text-app-text/25"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* D'où l'on peut arriver. **Déduit, jamais stocké** : le
                            garder des deux côtés aurait fait deux écritures pour un
                            seul lien, et un jour l'une sans l'autre. */}
                        {sceneChoisie && entrees.length > 0 && (
                            <div className="space-y-1">
                                <p className="text-ui-9 font-black uppercase tracking-widest text-app-text/30">
                                    On y arrive depuis
                                </p>
                                {entrees.map(entree => (
                                    <button
                                        key={entree.depuis.id}
                                        onClick={() => onChoisir(idDuNoeud('scene', entree.depuis.id))}
                                        className="w-full flex items-center gap-1.5 px-2 py-1 rounded-lg text-left hover:bg-app-text/5 transition-colors"
                                    >
                                        <span className="flex-1 min-w-0 text-ui-11 truncate text-app-text/60">{entree.depuis.titre}</span>
                                        {libelleLisible(entree.libelle) && (
                                            <span className="shrink-0 text-ui-9 italic text-app-text/35 max-w-[45%] truncate">
                                                {libelleLisible(entree.libelle)}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/*
                          ⛔ **Supprimer depuis une toile demande de dire ce que ça
                          coûte.** Sur un canevas on ne voit pas toujours ce qu’on
                          vise, et l’acte emporte ses scènes — la confirmation
                          reprend donc mot pour mot celle de la fiche.
                        */}
                        {(sceneChoisie || acteChoisi) && (
                            <button
                                onClick={() => {
                                    if (sceneChoisie) {
                                        gmConfirm(`Supprimer la scène « ${sceneChoisie.titre} » ?`, () => {
                                            supprimerScene(sceneChoisie.id);
                                            onChoisir(null);
                                        });
                                        return;
                                    }
                                    if (!acteChoisi) return;
                                    const emportees = scenesEmportees(scenes, acteChoisi.id).length;
                                    gmConfirm(
                                        emportees === 0
                                            ? `Supprimer « ${acteChoisi.titre} » ?`
                                            : `Supprimer « ${acteChoisi.titre} » et ses ${emportees} scène${emportees > 1 ? 's' : ''} ? `
                                              + 'Les scènes ne peuvent pas survivre à leur acte.',
                                        () => { supprimerActe(acteChoisi.id); onChoisir(null); },
                                    );
                                }}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-app-border/20 text-ui-10 font-bold text-app-text/40 hover:text-etat-danger hover:border-etat-danger/30 hover:bg-etat-danger/10 transition-all"
                            ><Trash2 size={12} /> Supprimer</button>
                        )}

                        {voisins.length > 0 && (
                            <div className="space-y-1.5">
                                <p className="text-ui-9 font-black uppercase tracking-widest text-app-text/30">
                                    {voisins.length} lien{voisins.length > 1 ? 's' : ''}
                                </p>
                                {voisins.map(voisin => (
                                    <button
                                        key={voisin.id}
                                        onClick={() => onChoisir(voisin.id)}
                                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left hover:bg-app-text/5 transition-colors"
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: TEINTE_DE_TRAME[voisin.type] }} />
                                        <span className="flex-1 min-w-0 text-ui-11 truncate text-app-text/70">{voisin.nom}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
    );
};
