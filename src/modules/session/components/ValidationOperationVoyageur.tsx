import type { useOperationDeVoyageur } from '../hooks/useOperationDeVoyageur';
import { useTranslation } from 'react-i18next';
import { DEGRES_DE_REUSSITE, cleI18nDuDegre } from '../../dice/degresDeReussite';
export const CLASSE_OPERATION = 'min-w-0 max-w-full rounded border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text disabled:opacity-40';
export function ValidationOperationVoyageur({operation}: {operation: ReturnType<typeof useOperationDeVoyageur>}) {
    const {t} = useTranslation(['modules','common']);
    const libeller = (texte:string) => DEGRES_DE_REUSSITE.reduce((s,d)=>s.replaceAll(d,t(cleI18nDuDegre(d))),texte);
    return <>
        {operation.apercu && <div aria-label="Aperçu de l’opération RdD" className="p-3 border border-accent rounded space-y-2">
            <strong>{operation.apercu.motif}</strong>{operation.apercu.details.map((d,i) => <p className="text-sm" key={i}>{libeller(d)}</p>)}
            <div className="flex flex-wrap gap-2"><button type="button" className={CLASSE_OPERATION} onClick={operation.confirmer}>Valider cette opération</button>
                <button type="button" className={CLASSE_OPERATION} onClick={operation.annuler}>Abandonner cet aperçu</button></div>
        </div>}
        {operation.erreur && <p role="alert" className="text-sm text-etat-danger">{operation.erreur}</p>}
    </>;
}
