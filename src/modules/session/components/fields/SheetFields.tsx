import React from 'react';
import { CheckSquare, Square } from 'lucide-react';
import type { SheetField } from '../../../../data/defaultSheetTemplates';
import { Select, type SelectOption } from '../../../../components/common/Select';

/**
 * Une jauge de fiche — **à l'échelle du jeu, et lisible de loin**.
 *
 * **Deux défauts corrigés le 2026-08-15, à la demande de David** (« tu peux
 * rendre les jauges un peu plus visibles ? »).
 *
 * *Le premier n'était pas cosmétique.* La jauge forçait `min={0} max={100}` et
 * affichait un **pourcentage**, alors que chaque champ déclare son propre
 * maximum — `max` existe dans `SheetField` précisément « pour rating ou gauge ».
 * Une Santé d'Alien qui va de 0 à 4 s'affichait « 45 % », un nombre qui
 * n'existe nulle part dans le jeu, et le curseur laissait monter à 100 sur une
 * échelle qui s'arrête à 4. *L'outil suit l'état, il n'arbitre pas* — imposer
 * une échelle de cent revenait à arbitrer.
 *
 * *Le second est la visibilité.* Une barre de deux pixels sous un libellé à
 * quarante pour cent d'opacité : les jauges sont ce qu'on regarde le plus en
 * séance — le Stress qui monte, la Santé qui descend — et c'était le plus
 * discret de la fiche.
 */
export const FieldGauge: React.FC<{
    field: SheetField;
    value: number;
    onChange: (val: number) => void;
}> = ({ field, value, onChange }) => {
    // Sans maximum déclaré, on garde cent : c'est le comportement d'avant, et
    // les fiches qui n'en déclarent pas continuent de fonctionner à l'identique.
    const max = typeof field.max === 'number' && field.max > 0 ? field.max : 100;
    const part = Math.max(0, Math.min(1, value / max));

    const ref = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        if (ref.current) ref.current.style.width = `${part * 100}%`;
    }, [part]);

    /*
      Le rouge en dessous d'un quart, l'ambre en dessous de la moitié. Une jauge
      basse doit se voir sans qu'on lise le nombre — c'est le propre d'une
      jauge, et l'accent uniforme ne le permettait pas.
    */
    const couleur = part <= 0.25 ? 'bg-rose-500' : part <= 0.5 ? 'bg-amber-500' : 'bg-accent';

    return (
        <div className="group space-y-1.5">
            <div className="flex justify-between items-baseline gap-2">
                <label htmlFor={field.id} className="text-[11px] font-black uppercase tracking-widest text-app-text/70">
                    {field.label}
                </label>
                <span className="font-mono font-black text-app-text tabular-nums">
                    <span className="text-base">{value}</span>
                    <span className="text-[11px] text-app-text/40"> / {max}</span>
                </span>
            </div>
            <div className="relative h-4 bg-app-bg rounded-lg overflow-hidden border border-app-border/60 shadow-inner">
                <div
                    ref={ref}
                    className={`absolute inset-y-0 left-0 ${couleur} transition-all duration-300`}
                />
                {/* Les graduations ne s'affichent que si elles restent lisibles :
                    quatre traits sur une Santé d'Alien aident, cent sur une jauge
                    de pourcentage feraient une bouillie. */}
                {max <= 12 && (
                    <div className="absolute inset-0 flex pointer-events-none">
                        {Array.from({ length: max - 1 }, (_, i) => (
                            <div key={i} className="flex-1 border-r border-app-bg/60" />
                        ))}
                        <div className="flex-1" />
                    </div>
                )}
                <input
                    id={field.id}
                    type="range" min={0} max={max} step={1} value={value}
                    onChange={e => onChange(parseInt(e.target.value))}
                    title={`${field.label} — ${value} sur ${max}`}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer z-10 h-full"
                />
            </div>
        </div>
    );
};

export const FieldNumber: React.FC<{
    field: SheetField;
    value: number;
    onChange: (val: number) => void;
}> = ({ field, value, onChange }) => (
    <div className="flex items-center justify-between p-3 bg-app-bg/40 rounded-xl border border-app-border/40">
        <label htmlFor={field.id} className="text-[10px] font-black uppercase tracking-widest text-app-text/40">{field.label}</label>
        <input
            id={field.id}
            type="number"
            value={value}
            onChange={e => onChange(Number(e.target.value))}
            title={field.label}
            className="w-16 bg-app-surface text-app-text text-center font-mono text-sm font-bold rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-accent/40"
        />
    </div>
);

export const FieldText: React.FC<{
    field: SheetField;
    value: string;
    onChange: (val: string) => void;
}> = ({ field, value, onChange }) => (
    <div className="flex items-center gap-3 p-3 bg-app-bg/40 rounded-xl border border-app-border/40">
        <label htmlFor={field.id} className="text-[10px] font-black uppercase tracking-widest text-app-text/40 w-28 flex-shrink-0">{field.label}</label>
        <input
            id={field.id}
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            title={field.label}
            className="flex-1 bg-transparent text-app-text text-sm font-medium focus:outline-none border-b border-app-border focus:border-accent/50 transition-colors pb-0.5"
        />
    </div>
);

export const FieldCheckbox: React.FC<{
    field: SheetField;
    value: boolean;
    onChange: (val: boolean) => void;
}> = ({ field, value, onChange }) => (
    <button
        type="button"
        role="checkbox"
        aria-checked={value ? "true" : "false"}
        id={field.id}
        onClick={() => onChange(!value)}
        className="flex items-center gap-3 p-3 bg-app-bg/40 rounded-xl border border-app-border/40 w-full hover:border-accent/20 transition-all focus:outline-none focus:ring-2 focus:ring-accent/40"
    >
        {value ? <CheckSquare size={16} className="text-accent flex-shrink-0" /> : <Square size={16} className="text-app-text/20 flex-shrink-0" />}
        <span className="text-[10px] font-black uppercase tracking-widest text-app-text/40 cursor-pointer">{field.label}</span>
    </button>
);

export const FieldSelect: React.FC<{
    field: SheetField;
    value: string;
    onChange: (val: string) => void;
}> = ({ field, value, onChange }) => {
    const options: SelectOption[] = (field.options || []).map(opt => ({
        value: opt,
        label: opt
    }));

    return (
        <div className="flex items-center justify-between p-3 bg-app-bg/40 rounded-xl border border-app-border/40 overflow-visible">
            <label htmlFor={field.id} className="text-[10px] font-black uppercase tracking-widest text-app-text/40">{field.label}</label>
            <Select
                value={value}
                onChange={onChange}
                options={options}
                className="w-48"
                placeholder="-- Sélectionner --"
                title={field.label}
            />
        </div>
    );
};

export const FieldTextarea: React.FC<{
    field: SheetField;
    value: string;
    onChange: (val: string) => void;
}> = ({ field, value, onChange }) => (
    <div className="flex flex-col gap-2 p-3 bg-app-bg/40 rounded-xl border border-app-border/40">
        <label htmlFor={field.id} className="text-[10px] font-black uppercase tracking-widest text-app-text/40">{field.label}</label>
        <textarea
            id={field.id}
            value={value}
            onChange={e => onChange(e.target.value)}
            title={field.label}
            rows={2}
            className="w-full bg-transparent text-app-text text-sm focus:outline-none border-b border-app-border/40 focus:border-accent/40 transition-colors resize-none custom-scrollbar"
        />
    </div>
);

/**
 * Une échelle en pastilles — **et les vides doivent se voir autant que les
 * pleines**.
 *
 * **Ce que David a relevé le 2026-08-15** : *« elles sont peu visibles quand
 * elles sont vides »*. Elles l'étaient : `bg-black/20 border-white/10` sur un
 * fond déjà sombre, soit un cercle presque invisible. Or **une pastille vide
 * porte autant d'information qu'une pleine** — c'est elle qui dit ce qu'il
 * reste. Un Stress à 5 sur 10 et un Stress à 5 sur 6 se jouent très
 * différemment, et on ne pouvait pas les distinguer d'un coup d'œil.
 *
 * Trois corrections, dans l'ordre de ce qui se voit :
 *
 * 1. **La pastille vide devient un contour net**, pas une absence — bordure
 *    lisible et fond légèrement éclairci.
 * 2. **Le compte chiffré est affiché** à côté. Au-delà de cinq ou six
 *    pastilles, personne ne les dénombre à l'œil : sur la capture, « Radiation »
 *    en portait dix et il fallait l'infobulle pour savoir où l'on en était.
 * 3. **Le libellé cesse d'être en retrait** — il était à quarante pour cent
 *    d'opacité, plus pâle que la donnée qu'il nomme.
 */
export const FieldRating: React.FC<{
    field: SheetField;
    value: number;
    onChange: (val: number) => void;
}> = ({ field, value, onChange }) => {
    const max = field.max || 5;
    return (
        <div className="flex items-center justify-between gap-3 p-3 bg-app-bg/40 rounded-xl border border-app-border/40 hover:border-accent/20 transition-all">
            <span className="text-[11px] font-black uppercase tracking-widest text-app-text/70">{field.label}</span>
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5" role="group" aria-label={`Évaluation: ${field.label}`}>
                    {Array.from({ length: max }).map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => onChange(i + 1 === value ? 0 : i + 1)}
                            title={`${field.label} ${i + 1} sur ${max}`}
                            className={`w-3.5 h-3.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-accent/50 ${
                                i < value
                                    ? 'bg-accent border border-accent scale-110 shadow-[0_0_8px_rgba(var(--color-accent),0.5)]'
                                    : 'bg-app-surface border-2 border-app-text/30 hover:border-accent/60 hover:bg-accent/10'
                            }`}
                            aria-label={`${field.label} ${i + 1} sur ${max}`}
                        />
                    ))}
                </div>
                {/* Le nombre, parce qu'au-delà de six pastilles on ne compte plus. */}
                <span className="font-mono font-black tabular-nums shrink-0 text-app-text">
                    {value}<span className="text-[11px] text-app-text/40">/{max}</span>
                </span>
            </div>
        </div>
    );
};
