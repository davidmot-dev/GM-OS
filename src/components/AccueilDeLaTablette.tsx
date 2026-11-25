import React, { useEffect, useState } from 'react';
import { Box, ChevronLeft, LayoutGrid, Lock, MonitorDot, TriangleAlert } from 'lucide-react';
import { CadreDeTablette } from './socle/CadreDeTablette';
import { usePleinEcranAuToucher } from '../hooks/usePleinEcranAuToucher';
import { useVerrouDuMeneur, type ResultatDuCode } from '../modules/tablette/useVerrouDuMeneur';
import { adresseDuRole, estPublic, lireRoleMemorise, memoriserRole, type RoleDeLaTablette } from '../modules/tablette/roleDeLaTablette';
import { clearPairingToken, enregistrerPairingToken, getPairingToken } from '../modules/remote/pairingToken';

/**
 * **L'accueil de la tablette de la table** (`?window=accueil-tablette`) — Fire HD 8, registre § 256,
 * T14 (24/11/2026, David : « Fais t14 »). Maquettes validées le 15/11 :
 * `documentation/Planning/visuels/fire-hd8-2026-11-15/1-accueil.png` et `2-code-du-meneur.png`.
 *
 * - Au démarrage, l'accueil rouvre le rôle mémorisé (C11) ; « Changer de rôle » y revient avec
 *   `choisir=1` pour qu'on puisse en prendre un autre.
 * - Un rôle public (Appareil de table, Écran de table) fait **oublier le secret d'appairage** quand un
 *   code est réglé au poste : la tablette ne peut plus réclamer le rôle du meneur, même en tapant
 *   l'adresse de la télécommande. Sans code réglé, elle le garde, et l'accueil le dit.
 * - L'Aide au MJ redemande ce secret par le code du meneur (C12), comparé par le serveur.
 */
const ROLES: { role: RoleDeLaTablette; titre: string; phrase: string; Icone: typeof Box }[] = [
    { role: 'aide', titre: 'Aide au MJ', phrase: 'Combat, dés, tables et campagne active.', Icone: Box },
    { role: 'appareil', titre: 'Appareil de table', phrase: 'Les modules que le meneur ouvre à toute la table.', Icone: LayoutGrid },
    { role: 'ecran', titre: 'Écran de table', phrase: 'Jauges, compte à rebours et ordre du tour, en grand.', Icone: MonitorDot },
];

const naviguer = (adresse: string) => window.location.assign(adresse);

const AccueilDeLaTablette: React.FC<{ aller?: (adresse: string) => void }> = ({ aller = naviguer }) => {
    const choisir = new URLSearchParams(window.location.search).get('choisir') === '1';
    const memorise = lireRoleMemorise();
    const { connecte, codeRegle, ouvrir } = useVerrouDuMeneur();
    const { demander: passerEnPleinEcran } = usePleinEcranAuToucher();
    const [code, setCode] = useState<boolean>(false);

    // Au démarrage : le dernier rôle, sans détour par l'accueil.
    useEffect(() => {
        if (!choisir && memorise) aller(adresseDuRole(memorise));
    }, [choisir, memorise, aller]);

    const prendre = (role: RoleDeLaTablette) => {
        memoriserRole(role);
        // Un rôle public oublie le secret, seulement si le code permet de le retrouver.
        if (estPublic(role) && codeRegle === true) clearPairingToken();
        aller(adresseDuRole(role));
    };
    const choisirLeRole = (role: RoleDeLaTablette) => {
        if (role === 'aide' && !getPairingToken() && codeRegle === true) { setCode(true); return; }
        prendre(role);
    };

    if (!choisir && memorise) return null;
    // Tant que le poste n'a pas dit s'il a un code, choisir un rôle public pourrait garder le secret.
    const pret = connecte && codeRegle !== null;

    if (code) {
        return (
            <CadreDeTablette className="min-h-dvh bg-app-bg text-app-text font-inter" onClickCapture={passerEnPleinEcran}>
                <CodeDuMeneur ouvrir={ouvrir} retour={() => setCode(false)}
                    ouvert={token => { enregistrerPairingToken(token); prendre('aide'); }} />
            </CadreDeTablette>
        );
    }

    return (
        <CadreDeTablette className="min-h-dvh bg-app-bg text-app-text font-inter px-6 py-6 flex flex-col" onClickCapture={passerEnPleinEcran}>
            <header className="space-y-2">
                <p className="text-[12px] font-bold uppercase tracking-[0.3em] text-app-muted">GM-OS · Tablette de la table</p>
                <h1 className="text-[30px] font-bold">Que fait cette tablette ?</h1>
                <p className="flex items-center gap-2 text-[15px] text-app-muted" data-etat-du-poste>
                    <span aria-hidden className={`h-2 w-2 rounded-full ${connecte ? 'bg-etat-succes' : 'bg-app-text/30'}`} />
                    {connecte ? 'Connectée au poste du meneur' : 'Connexion au poste du meneur…'}
                </p>
            </header>

            <ul className="mt-6 flex max-w-[640px] flex-col gap-4">
                {ROLES.map(({ role, titre, phrase, Icone }) => {
                    const actuel = role === memorise;
                    const codeDemande = role === 'aide' && !getPairingToken() && codeRegle === true;
                    return (
                        <li key={role}>
                            <button type="button" disabled={!pret} onClick={() => choisirLeRole(role)} data-role={role}
                                className={`flex w-full min-h-[96px] items-center gap-5 rounded-2xl border px-5 py-5 text-left transition-colors disabled:opacity-50 ${
                                    actuel ? 'border-accent bg-accent/5' : 'border-app-border bg-app-surface hover:border-accent/50'}`}>
                                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${actuel ? 'border-accent/40 text-accent' : 'border-app-border text-app-text'}`}>
                                    <Icone size={22} aria-hidden />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-[20px] font-bold">{titre}</span>
                                    <span className="block text-[15px] text-app-muted">{phrase}</span>
                                </span>
                                {actuel && <span className="rounded-md bg-accent/15 px-2.5 py-1 text-[12px] font-bold uppercase tracking-widest text-accent">Rôle actuel</span>}
                                {!actuel && codeDemande && (
                                    <span className="flex items-center gap-1.5 rounded-md border border-app-border px-2 py-1 text-[12px] text-app-muted">
                                        <Lock size={13} aria-hidden /> Code du meneur demandé
                                    </span>
                                )}
                            </button>
                        </li>
                    );
                })}
            </ul>

            <footer className="mt-auto max-w-[640px] pt-6 text-center text-[14px] text-app-muted space-y-1">
                {codeRegle === false && (
                    <p data-sans-code>Aucun code du meneur n’est réglé au poste : l’Aide au MJ s’ouvre sans code depuis les autres rôles.</p>
                )}
                <p>La tablette rouvre ce rôle à son démarrage.</p>
            </footer>
        </CadreDeTablette>
    );
};

/** Le pavé du code du meneur (maquette `2-code-du-meneur.png`). */
const CodeDuMeneur: React.FC<{
    ouvrir: (code: string) => Promise<ResultatDuCode>;
    ouvert: (token: string) => void;
    retour: () => void;
}> = ({ ouvrir, ouvert, retour }) => {
    const [saisie, setSaisie] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [envoi, setEnvoi] = useState(false);

    const taper = (chiffre: string) => { setMessage(null); setSaisie(s => (s.length < 4 ? s + chiffre : s)); };
    const valider = async () => {
        if (saisie.length !== 4 || envoi) return;
        setEnvoi(true);
        const r = await ouvrir(saisie);
        setEnvoi(false);
        setSaisie('');
        if (r.ok) { ouvert(r.token); return; }
        setMessage(r.raison === 'faux' ? `Code incorrect. Encore ${r.restants} essai${r.restants > 1 ? 's' : ''}.`
            : r.raison === 'bloque' ? `Trop d’essais. Réessaie dans ${Math.max(1, Math.ceil(r.attenteMs / 60_000))} min.`
            : r.raison === 'aucun-code' ? 'Aucun code n’est réglé au poste du meneur.'
            : 'Le poste du meneur ne répond pas.');
    };
    // Tient en 600 px de haut, « Retour aux rôles » compris (la Fire en paysage).
    const cadre = 'min-h-[52px] rounded-xl border border-app-border bg-app-surface active:border-accent';
    const touche = `${cadre} text-[24px] font-bold`;

    return (
        <section aria-label="Code du meneur" className="mx-auto flex min-h-dvh max-w-[360px] flex-col items-center justify-center gap-3 py-4">
            <p className="rounded-full border border-accent/30 px-3 py-1 text-[12px] font-bold uppercase tracking-widest text-accent">● Aide au MJ</p>
            <h1 className="text-[30px] font-bold">Code du meneur</h1>
            <p className="text-center text-[15px] text-app-muted">Le code se règle dans les Paramètres du poste.</p>
            <div className="flex gap-3" aria-label={`${saisie.length} chiffre${saisie.length > 1 ? 's' : ''} sur 4`} data-cases>
                {[0, 1, 2, 3].map(i => (
                    <span key={i} className={`flex h-[52px] w-12 items-center justify-center rounded-xl border-2 ${i < saisie.length ? 'border-accent' : 'border-app-border'}`}>
                        {i < saisie.length && <span aria-hidden className="h-3.5 w-3.5 rounded-full bg-accent" />}
                    </span>
                ))}
            </div>
            <p role="alert" className="flex min-h-[22px] items-center gap-1.5 text-[15px] font-bold text-etat-danger">
                {message && <><TriangleAlert size={16} aria-hidden /> {message}</>}
            </p>
            <div className="grid w-full grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(c => (
                    <button key={c} type="button" className={touche} onClick={() => taper(c)}>{c}</button>
                ))}
                <button type="button" className={`${cadre} text-[16px] font-medium text-app-muted`} onClick={() => setSaisie(s => s.slice(0, -1))}>Effacer</button>
                <button type="button" className={touche} onClick={() => taper('0')}>0</button>
                <button type="button" disabled={saisie.length !== 4 || envoi} onClick={valider}
                    className="min-h-[52px] rounded-xl border border-accent bg-accent/10 text-[16px] font-bold text-accent disabled:opacity-40">Valider</button>
            </div>
            <button type="button" onClick={retour} className="mt-1 flex min-h-[44px] items-center gap-1 text-[15px] text-app-muted">
                <ChevronLeft size={16} aria-hidden /> Retour aux rôles
            </button>
        </section>
    );
};

export default AccueilDeLaTablette;
