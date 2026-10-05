import React from 'react';
import { EtiquetteDuDegre } from '../../dice/EtiquetteDuDegre';
import { motion, AnimatePresence } from 'framer-motion';
import { type RollRecord } from '../hooks/useRemoteSync';
import { type DieResult } from '../../dice/DiceEngine';
import { Panneau } from '../../../components/socle/Panneau';

interface RemoteDiceResultOverlayProps {
    result: RollRecord | null;
    onClose: () => void;
}

const RemoteDiceResultOverlay: React.FC<RemoteDiceResultOverlayProps> = ({ result, onClose }) => {
    // Standard timer for 15s
    React.useEffect(() => {
        if (result) {
            const timer = setTimeout(onClose, 15000);
            return () => clearTimeout(timer);
        }
    }, [result, onClose]);

    return (
        <AnimatePresence>
            {result && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-app-bg/60 backdrop-blur-md cursor-pointer"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: -20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-lg"
                    >
                        <Panneau as="div" habillage="libre" className="relative w-full premium-glass rounded-[40px] border border-app-text/10 shadow-3xl overflow-hidden p-8 flex flex-col items-center gap-6">
                        {/* Progress bar for auto-dismiss */}
                        <motion.div 
                            initial={{ width: '100%' }}
                            animate={{ width: '0%' }}
                            transition={{ duration: 15, ease: "linear" }}
                            className="absolute bottom-0 left-0 h-1.5 bg-accent/60 shadow-glow-accent/40"
                        />

                        <div className="text-center space-y-1">
                            <span className="text-xs font-black uppercase tracking-[0.3em] text-accent/80 drop-shadow-sm">
                                {result.title || 'DÉTAIL DU JET'}
                            </span>
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-0 bg-app-text/5 rounded-full blur-3xl group-hover:bg-app-text/10 transition-all duration-500" />
                            <h2 className="relative text-7xl md:text-9xl font-black text-app-text tracking-tighter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                                {result.totalDisplay || result.total}
                            </h2>
                        </div>

                        <div className="flex flex-wrap gap-3 justify-center max-w-full">
                            {(result.rolls as DieResult[]).map((r, i) => (
                                <div 
                                    key={i} 
                                    className={`size-12 md:size-14 flex items-center justify-center rounded-xl md:rounded-2xl text-xl md:text-2xl border transition-all ${
                                        r.cssClass ? r.cssClass : 
                                        r.isCritMax ? '!bg-etat-succes border-etat-succes !text-app-bg shadow-glow-emerald/40' :
                                        r.isCritMin ? '!bg-etat-danger border-etat-danger !text-app-bg shadow-glow-rose/40' :
                                        r.isExploded ? '!bg-etat-alerte/20 border-etat-alerte/50 text-etat-alerte shadow-glow-amber/20' :
                                        'bg-app-bg/40 border-app-border/20 text-app-text/40'
                                    }`}
                                >
                                    {r.displayStr || r.val}
                                </div>
                            ))}
                            {result.modifier !== 0 && (
                                <div className="size-12 md:size-14 flex items-center justify-center rounded-xl md:rounded-2xl text-lg md:text-xl border border-accent/20 bg-accent/5 text-accent font-black">
                                    {result.modifier > 0 ? '+' : ''}{result.modifier}
                                </div>
                            )}
                        </div>

                        {/*
                            **Elle écrivait « Succès » en dur** quand la tablette
                            écrivait « Réussite » : deux mots pour le même jet, sur
                            deux écrans côte à côte. Le mot vient d'un seul endroit
                            désormais.

                            Le repli sur `successes` est conservé : une réserve
                            peut ne pas porter de verdict booléen, et c'est alors
                            le nombre de réussites qui tranche.
                        */}
                        <EtiquetteDuDegre
                            resultat={{
                                degre: result.degre,
                                tagSuccess: result.tagSuccess
                                    ?? (result.successes !== undefined ? result.successes > 0 : undefined),
                            }}
                            classes={reussi => 'px-10 py-3 rounded-full border-2 text-xl font-black uppercase tracking-[0.25em] backdrop-blur-md shadow-2xl transition-all '
                                + (reussi
                                    ? 'bg-etat-succes/10 text-etat-succes border-etat-succes/50 shadow-glow-emerald/30'
                                    : 'bg-etat-danger/10 text-etat-danger border-etat-danger/50 shadow-glow-rose/30')}
                            enveloppe={contenu => (
                                <motion.div
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="mt-2"
                                >
                                    {contenu}
                                </motion.div>
                            )}
                        />

                        <div className="mt-2 text-ui-10 font-black text-app-text/20 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-4 h-px bg-app-text/10" />
                            CLIQUER POUR FERMER
                            <span className="w-4 h-px bg-app-text/10" />
                        </div>
                        </Panneau>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default RemoteDiceResultOverlay;
