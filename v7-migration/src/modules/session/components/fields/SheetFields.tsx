import React from 'react';
import { CheckSquare, Square } from 'lucide-react';
import type { SheetField } from '../../../../data/defaultSheetTemplates';
import { Select, type SelectOption } from '../../../../components/common/Select';

export const FieldGauge: React.FC<{
    field: SheetField;
    value: number;
    onChange: (val: number) => void;
}> = ({ field, value, onChange }) => {
    const ref = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        if (ref.current) ref.current.style.width = `${value}%`;
    }, [value]);

    return (
        <div className="group space-y-2">
            <div className="flex justify-between items-center">
                <label htmlFor={field.id} className="text-[10px] font-black uppercase tracking-widest text-app-text/40">{field.label}</label>
                <span className="text-[10px] font-black text-accent font-mono">{value}%</span>
            </div>
            <div className="relative h-2 bg-app-bg rounded-full overflow-hidden border border-app-border/40">
                <div
                    ref={ref}
                    className="absolute inset-y-0 left-0 bg-accent transition-all duration-300"
                />
                <input
                    id={field.id}
                    type="range" min={0} max={100} step={1} value={value}
                    onChange={e => onChange(parseInt(e.target.value))}
                    title={field.label}
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

export const FieldRating: React.FC<{
    field: SheetField;
    value: number;
    onChange: (val: number) => void;
}> = ({ field, value, onChange }) => {
    const max = field.max || 5;
    return (
        <div className="flex items-center justify-between p-3 bg-app-bg/40 rounded-xl border border-app-border/40 hover:border-accent/20 transition-all">
            <span className="text-[10px] font-black uppercase tracking-widest text-app-text/40">{field.label}</span>
            <div className="flex items-center gap-1.5" role="group" aria-label={`Évaluation: ${field.label}`}>
                {Array.from({ length: max }).map((_, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => onChange(i + 1 === value ? 0 : i + 1)}
                        title={`${field.label} ${i + 1}`}
                        className={`w-3.5 h-3.5 rounded-full transition-all border focus:outline-none focus:ring-2 focus:ring-accent/50 ${
                            i < value 
                                ? 'bg-accent border-accent scale-110 shadow-[0_0_8px_rgba(var(--color-accent),0.5)]' 
                                : 'bg-black/20 border-white/10 hover:border-accent/50'
                        }`}
                        aria-label={`Étoile ${i + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};
