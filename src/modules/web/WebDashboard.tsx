import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Plus,
    Trash2,
    FileUp,
    FileDown,
    Globe,
    RotateCcw,
    ArrowLeft,
    ArrowRight,
    RotateCw,
    Lock,
    LockOpen,
    ExternalLink,
    Loader2,
    AlertTriangle,
} from 'lucide-react';
import { useWebStore } from './useWebStore';
import { useImageStore } from '../image/useImageStore';
import type { WebLink } from './types';
import WebLinkPad from './components/WebLinkPad';
import AddEditWebLinkModal from './components/AddEditWebLinkModal';
import { gmConfirm } from '../../stores/useModalStore';
import { Bouton, Etiquette, EnTeteDeModule, Panneau } from '../../components/socle';
import { useRegimeDInterface } from '../session/hooks/useRegimeDInterface';
import { adresseDeLaBarre } from './adresseDeLaBarre';

/**
 * Ce qu'on demande à la `<webview>` d'Electron. Déclaré ici plutôt que tiré
 * des types d'Electron, que le rendu ne charge pas.
 */
interface VueWeb extends HTMLElement {
    loadURL(url: string): Promise<void>;
    getURL(): string;
    getTitle(): string;
    canGoBack(): boolean;
    canGoForward(): boolean;
    goBack(): void;
    goForward(): void;
    reload(): void;
}

/** La session à part de la page : la même que `electron/navigateurIntegre.ts`. */
const PARTITION = 'persist:navigateur';
const dansElectron = typeof navigator !== 'undefined' && navigator.userAgent.includes('Electron');

/**
 * **Le navigateur web** — refonte, L6, maquette retenue
 * (`stitch/outillage/outillage-navigateur.png`) : Précédent / Suivant /
 * Recharger et l'adresse ; Nouveau lien, Charger, Enregistrer, Effacer ; les
 * liens en tuiles numérotées ; **la page au plus large**.
 *
 * ⭐ **La page est intégrée** — choix de David, 2026-10-03. Elle s'ouvrait
 * jusque-là dans le navigateur de Windows, hors de GM-OS. Ce qu'elle a le
 * droit d'y faire — rien de GM-OS — se décide côté Electron
 * (`electron/navigateurIntegre.ts`). « Ouvrir dans le navigateur » reste en
 * tête, pour une page qui demande un compte ou un téléchargement.
 */
const WebDashboard: React.FC = () => {
    const {
        links,
        addLink,
        updateLink,
        importLinks,
        exportLinks,
        clearAll,
        reset,
        openLink,
    } = useWebStore();
    const regime = useRegimeDInterface();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLink, setEditingLink] = useState<WebLink | null>(null);

    // ── La page intégrée ──
    const vue = useRef<VueWeb | null>(null);
    const [src, setSrc] = useState<string | null>(null);
    const [pret, setPret] = useState(false);
    const [adresse, setAdresse] = useState('');
    const [urlCourante, setUrlCourante] = useState<string | null>(null);
    const [titre, setTitre] = useState('');
    const [chargement, setChargement] = useState(false);
    const [erreur, setErreur] = useState<string | null>(null);
    const [historique, setHistorique] = useState({ arriere: false, avant: false });

    /*
      **Web-OS demande la liste des écrans, parce qu'il en propose.**

      Depuis le 2026-09-05, une vidéo YouTube se projette d'ici, et le meneur
      choisit sa sortie sur le pad. Or `displays` n'est rempli que par
      `fetchDisplays`, appelé jusqu'ici **par le seul Image-OS** : un meneur qui
      n'y était pas passé depuis le démarrage se serait vu proposer le Player Hub
      et rien d'autre. *Un module qui affiche une liste doit la demander lui-même,
      et non compter sur la visite d'un autre écran.*
    */
    const fetchDisplays = useImageStore((e) => e.fetchDisplays);
    useEffect(() => { void fetchDisplays(); }, [fetchDisplays]);

    /** Aller à une adresse : par la vue si elle est prête, sinon en la créant. */
    const aller = useCallback((url: string) => {
        setErreur(null);
        setAdresse(url);
        if (vue.current && pret) void vue.current.loadURL(url).catch(() => { /* l'échec arrive par did-fail-load */ });
        else setSrc(url);
    }, [pret]);

    // Les événements de la vue : où elle est, ce qu'elle charge, ce qui a échoué.
    useEffect(() => {
        const v = vue.current;
        if (!v || !src) return;
        const lire = () => {
            try {
                setUrlCourante(v.getURL());
                setAdresse(v.getURL());
                setHistorique({ arriere: v.canGoBack(), avant: v.canGoForward() });
            } catch { /* la vue n'est pas encore attachée */ }
        };
        const surPret = () => { setPret(true); lire(); };
        const surDebut = () => setChargement(true);
        const surFin = () => { setChargement(false); lire(); };
        const surTitre = (e: Event) => setTitre((e as Event & { title?: string }).title ?? '');
        const surEchec = (e: Event) => {
            const { errorCode, errorDescription, isMainFrame } = e as Event & { errorCode: number; errorDescription: string; isMainFrame: boolean };
            // -3 : une navigation interrompue par une autre — pas une erreur.
            if (isMainFrame && errorCode !== -3) setErreur(errorDescription || String(errorCode));
        };
        v.addEventListener('dom-ready', surPret);
        v.addEventListener('did-start-loading', surDebut);
        v.addEventListener('did-stop-loading', surFin);
        v.addEventListener('did-navigate', lire);
        v.addEventListener('did-navigate-in-page', lire);
        v.addEventListener('page-title-updated', surTitre);
        v.addEventListener('did-fail-load', surEchec);
        return () => {
            v.removeEventListener('dom-ready', surPret);
            v.removeEventListener('did-start-loading', surDebut);
            v.removeEventListener('did-stop-loading', surFin);
            v.removeEventListener('did-navigate', lire);
            v.removeEventListener('did-navigate-in-page', lire);
            v.removeEventListener('page-title-updated', surTitre);
            v.removeEventListener('did-fail-load', surEchec);
        };
    }, [src]);

    const handleAddClick = () => {
        setEditingLink(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (link: WebLink) => {
        setEditingLink(link);
        setIsModalOpen(true);
    };

    const handleSave = (linkData: Omit<WebLink, 'id'>) => {
        if (editingLink) {
            updateLink(editingLink.id, linkData);
        } else {
            addLink(linkData);
        }
    };

    const valider = (e: React.FormEvent) => {
        e.preventDefault();
        const url = adresseDeLaBarre(adresse);
        if (url) aller(url);
    };

    const securisee = urlCourante?.startsWith('https://');
    const hote = (() => { try { return urlCourante ? new URL(urlCourante).host : ''; } catch { return ''; } })();

    return (
        <div className="flex h-full min-h-0 flex-col gap-3 p-4 text-app-text">
            <EnTeteDeModule
                titre="Navigateur web"
                etat={urlCourante && (
                    <Etiquette ton={securisee ? 'succes' : 'alerte'}>
                        {securisee ? <Lock size={11} /> : <LockOpen size={11} />}{hote}
                    </Etiquette>
                )}
                actions={urlCourante && (
                    <Bouton aLaTable={regime.aLaTable} icone={<ExternalLink size={15} />} onClick={() => openLink(urlCourante)} title="Ouvrir cette page dans le navigateur de Windows">
                        Ouvrir dans le navigateur
                    </Bouton>
                )}
            />

            <Panneau className="flex shrink-0 flex-col gap-3 p-3">
                {/* Précédent, Suivant, Recharger, et l'adresse */}
                <form onSubmit={valider} className="flex flex-wrap items-center gap-2">
                    <Bouton aLaTable={regime.aLaTable} icone={<ArrowLeft size={15} />} onClick={() => vue.current?.goBack()} disabled={!historique.arriere}>Précédent</Bouton>
                    <Bouton aLaTable={regime.aLaTable} icone={<ArrowRight size={15} />} onClick={() => vue.current?.goForward()} disabled={!historique.avant}>Suivant</Bouton>
                    <Bouton aLaTable={regime.aLaTable} icone={chargement ? <Loader2 size={15} className="animate-spin" /> : <RotateCw size={15} />} onClick={() => vue.current?.reload()} disabled={!pret}>Recharger</Bouton>
                    <label className="flex min-h-11 min-w-[16rem] flex-1 items-center gap-2 rounded-lg border border-app-border bg-app-bg px-3 focus-within:border-accent/60">
                        {urlCourante && !securisee ? <LockOpen size={14} className="text-etat-alerte" /> : <Lock size={14} className="text-app-muted" />}
                        <input
                            value={adresse}
                            onChange={(e) => setAdresse(e.target.value)}
                            placeholder="Une adresse — srd.exemple.org, ou https://…"
                            aria-label="Adresse"
                            className="flex-1 bg-transparent font-mono text-sm text-app-text placeholder:text-app-subtle focus:outline-none"
                        />
                    </label>
                </form>

                {/* Les liens, et ce qu'on fait de la liste */}
                <div className="flex flex-wrap items-center gap-2">
                    <Bouton aLaTable={regime.aLaTable} variante="accent" icone={<Plus size={15} />} onClick={handleAddClick}>Nouveau lien</Bouton>
                    <Bouton aLaTable={regime.aLaTable} icone={<FileUp size={15} />} onClick={importLinks} title="Importer une liste de liens (JSON)">Charger</Bouton>
                    <Bouton aLaTable={regime.aLaTable} icone={<FileDown size={15} />} onClick={exportLinks} title="Exporter la liste de liens (JSON)">Enregistrer</Bouton>
                    <Bouton
                        aLaTable={regime.aLaTable}
                        variante="danger"
                        icone={<Trash2 size={15} />}
                        disabled={links.length === 0}
                        onClick={() => gmConfirm(`Supprimer les ${links.length} lien(s) de la liste ? Cela ne s'annule pas.`, clearAll)}
                    >
                        Effacer
                    </Bouton>
                    <button
                        onClick={() => gmConfirm("Réinitialiser le navigateur ? La liste revient aux liens d'origine.", () => reset())}
                        className="ml-auto flex items-center gap-1.5 text-ui-10 font-black uppercase tracking-widest text-app-muted transition-colors hover:text-etat-danger"
                        title="Réinitialiser le module"
                    >
                        <RotateCcw size={13} />Réinitialiser
                    </button>
                </div>

                {links.length > 0 && (
                    <div className="-mb-1 flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                        {links.map((link, rang) => (
                            <WebLinkPad
                                key={link.id}
                                link={link}
                                numero={rang + 1}
                                actif={!!urlCourante && adresseDeLaBarre(link.url) === urlCourante}
                                onOuvrir={(l) => (dansElectron ? aller(l.url) : openLink(l.url))}
                                onEdit={handleEditClick}
                            />
                        ))}
                    </div>
                )}
            </Panneau>

            {/* ── La page, au plus large ── */}
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-app-border bg-app-surface">
                {src && dansElectron ? (
                    <>
                        <webview
                            ref={(el) => { vue.current = el as unknown as VueWeb | null; }}
                            src={src}
                            partition={PARTITION}
                            className="h-full w-full"
                            title={titre}
                        />
                        {erreur && (
                            <div className="absolute inset-x-0 top-0 flex items-center gap-2 border-b border-etat-alerte/50 bg-app-surface px-4 py-2 text-sm text-app-text">
                                <AlertTriangle size={15} className="shrink-0 text-etat-alerte" />
                                La page ne s'est pas chargée : <span className="font-mono text-xs text-app-muted">{erreur}</span>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                        <Globe size={40} className="text-app-subtle" />
                        <p className="font-display text-lg text-app-text">
                            {links.length === 0 ? 'Aucun lien pour l’instant' : 'Choisissez un lien, ou tapez une adresse'}
                        </p>
                        <p className="max-w-md text-sm text-app-muted">
                            {dansElectron
                                ? 'La page s’ouvre ici, au plus large. Les règles en ligne, un générateur, une playlist : à portée de main pendant la partie.'
                                : 'Hors de l’application, les liens s’ouvrent dans un nouvel onglet.'}
                        </p>
                        {links.length === 0 && (
                            <Bouton aLaTable={regime.aLaTable} variante="accent" icone={<Plus size={15} />} onClick={handleAddClick}>Ajouter un lien</Bouton>
                        )}
                    </div>
                )}
            </div>

            <AddEditWebLinkModal
                key={editingLink?.id || (isModalOpen ? 'new' : 'closed')}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={editingLink}
            />
        </div>
    );
};

export default WebDashboard;
