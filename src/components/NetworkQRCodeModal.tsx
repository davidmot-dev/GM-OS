import React, { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Wifi, X, Smartphone } from 'lucide-react';
import { useModalStore } from '../stores/useModalStore';
import { useFermetureParEchap } from '../hooks/useFermetureParEchap';
import { adresseDeLaTablette, type InfoDeConnexion } from '../utils/portsDuRenderer';

export const NetworkQRCodeModal: React.FC = () => {
    const { isNetworkModalOpen, closeNetworkModal } = useModalStore();
    const lireConnexion = window.appBridge?.remote?.getConnectionInfo;
    const contexte = useMemo(() => ({ ouvert: isNetworkModalOpen, lireConnexion }),
        [isNetworkModalOpen, lireConnexion]);
    const [lecture, setLecture] = useState<{ contexte: typeof contexte; info: InfoDeConnexion } | null>(null);

    // Hors Electron, le repli vient du rendu ; dans Electron, une réponse
    // appartient à l'ouverture qui l'a demandée, jamais à la suivante.
    const networkInfo = lireConnexion
        ? (lecture?.contexte === contexte ? lecture.info : null)
        : { ip: window.location.hostname, port: parseInt(window.location.port) || 80 };

    useEffect(() => {
        if (!contexte.ouvert || !contexte.lireConnexion) return;
        let vivant = true;
        void contexte.lireConnexion().then(info => {
            if (vivant) setLecture({ contexte, info });
        }).catch(erreur => { if (vivant) console.error(erreur); });
        return () => { vivant = false; };
    }, [contexte]);

    /*
      Elle vit à côté du `ModalProvider` et non dedans — son drapeau est
      distinct, et les deux peuvent être à l'écran en même temps. Elle
      s'inscrit donc pour son propre compte : c'est la pile qui départage, et
      celle du dessus est celle qu'Échap ferme.
    */
    useFermetureParEchap(isNetworkModalOpen, closeNetworkModal, 'Réseau local');

    if (!isNetworkModalOpen) return null;

    /*
      ⛔ **L'adresse ne se compose pas ici.** Elle portait
      `http://${ip}:${port}/?window=tablet` — donc le port de **Vite** en
      développement, où la tablette ouvrait sa WebSocket sur le serveur de
      rechargement à chaud : connectée en apparence, muette en fait, et restée
      sur la campagne de démonstration. Voir `adresseDeLaTablette`, qui porte
      les deux ports.
    */
    const tabletUrl = adresseDeLaTablette(networkInfo) ?? window.location.href;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-app-bg/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-app-surface border border-app-border rounded-2xl shadow-2xl p-6 w-full max-w-sm flex flex-col items-center animate-in zoom-in-95 duration-200">
                <div className="w-full flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2 text-accent">
                        <Wifi size={20} />
                        <h2 className="text-lg font-bold">Réseau Local</h2>
                    </div>
                    <button onClick={closeNetworkModal} className="text-app-text/50 hover:text-etat-danger transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="bg-app-text p-4 rounded-xl shadow-inner mb-6">
                    <QRCodeSVG 
                        value={tabletUrl} 
                        size={200} 
                        bgColor={"#ffffff"}
                        fgColor={"#000000"}
                        level={"Q"}
                    />
                </div>

                <div className="flex flex-col items-center text-center gap-2 w-full">
                    <p className="text-sm text-app-text/70">
                        Scannez ce code avec la tablette d'un joueur pour installer le <strong className="text-accent">Tablet Hub</strong>.
                    </p>
                    <div className="flex items-center gap-2 mt-2 px-4 py-2 bg-app-bg/20 rounded-lg border border-app-border/50 w-full justify-center">
                        <Smartphone size={16} className="text-app-text/40" />
                        <code className="text-xs font-mono text-app-text/80 select-all">
                            {tabletUrl}
                        </code>
                    </div>
                </div>
            </div>
        </div>
    );
};
