import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Wifi, X, Smartphone } from 'lucide-react';
import { useModalStore } from '../stores/useModalStore';

export const NetworkQRCodeModal: React.FC = () => {
    const { isNetworkModalOpen, closeNetworkModal } = useModalStore();
    const [networkInfo, setNetworkInfo] = useState<{ ip: string; port: number } | null>(null);

    useEffect(() => {
        if (isNetworkModalOpen && window.appBridge?.remote?.getConnectionInfo) {
            window.appBridge.remote.getConnectionInfo().then((info: { ip: string; port: number }) => {
                setNetworkInfo(info);
            }).catch(console.error);
        } else if (isNetworkModalOpen) {
            // Fallback pour le dev en web
            setNetworkInfo({ ip: window.location.hostname, port: parseInt(window.location.port) || 80 });
        }
    }, [isNetworkModalOpen]);

    if (!isNetworkModalOpen) return null;

    const tabletUrl = networkInfo 
        ? `http://${networkInfo.ip}:${networkInfo.port}/?window=tablet` 
        : window.location.href;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-app-surface border border-app-border rounded-2xl shadow-2xl p-6 w-full max-w-sm flex flex-col items-center animate-in zoom-in-95 duration-200">
                <div className="w-full flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2 text-indigo-400">
                        <Wifi size={20} />
                        <h2 className="text-lg font-bold">Réseau Local</h2>
                    </div>
                    <button onClick={closeNetworkModal} className="text-app-text/50 hover:text-rose-400 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-inner mb-6">
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
                        Scannez ce code avec la tablette d'un joueur pour installer le <strong className="text-indigo-400">Tablet Hub</strong>.
                    </p>
                    <div className="flex items-center gap-2 mt-2 px-4 py-2 bg-black/20 rounded-lg border border-app-border/50 w-full justify-center">
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
