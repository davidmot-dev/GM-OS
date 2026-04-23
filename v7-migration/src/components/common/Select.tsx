import React, { useState, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { useClickOutside } from '../../hooks/useClickOutside';

export interface SelectOption {
    value: string;
    label: string | ReactNode;
    icon?: ReactNode;
    isHeader?: boolean;
}

interface SelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    label?: string;
    placeholder?: string;
    className?: string;
    title?: string;
    disabled?: boolean;
    renderOption?: (option: SelectOption) => ReactNode;
    buttonClassName?: string;
}

/**
 * Composant Select personnalisé GM-OS.
 * Remplace l'élément <select> natif pour éviter les bugs de fenêtres externes
 * et offrir une expérience visuelle premium cohérente.
 */
export const Select: React.FC<SelectProps> = ({
    value,
    onChange,
    options,
    label,
    placeholder = 'Sélectionner...',
    className = '',
    title,
    disabled = false,
    renderOption,
    buttonClassName = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Détection de clic à l'extérieur pour fermer le menu
    useClickOutside(containerRef, () => setIsOpen(false), isOpen);

    const selectedOption = options.find(opt => opt.value === value);

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
    };

    return (
        <div 
            ref={containerRef} 
            className={`relative flex flex-col gap-1.5 overflow-visible ${className}`} 
            style={{ zIndex: isOpen ? 1000 : 'auto' }}
            title={title}
        >
            {label && (
                <span className="stitch-label px-1">{label}</span>
            )}
            
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    flex items-center justify-between w-full px-3 py-2
                    ${disabled ? 'opacity-50 cursor-not-allowed bg-app-bg/20' : 'bg-app-bg/50 hover:bg-app-surface/60 cursor-pointer'} 
                    border border-app-border/40 
                    rounded-lg text-sm text-app-text transition-all duration-300
                    focus:outline-none focus:border-app-accent/50
                    ${isOpen ? 'border-app-accent/50 shadow-glow-accent/10' : ''}
                    ${buttonClassName}
                `}
            >
                <div className="flex items-center gap-2 truncate">
                    {selectedOption?.icon && (
                        <span className="text-app-accent">{selectedOption.icon}</span>
                    )}
                    <span className={!selectedOption ? 'text-app-text/40' : 'text-app-text'}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <ChevronDown 
                    size={16} 
                    className={`text-app-text/40 transition-transform duration-300 ${isOpen ? 'rotate-180 text-app-accent' : ''}`} 
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="
                            absolute top-[calc(100%+0.5rem)] left-0 right-0 z-[1000]
                            bg-app-surface border border-app-border shadow-2xl rounded-xl 
                            overflow-hidden backdrop-blur-xl
                            max-h-64 overflow-y-auto custom-scrollbar
                        "
                    >
                        <div className="p-1.5 flex flex-col gap-0.5">
                            {options.length === 0 ? (
                                <div className="px-3 py-4 text-xs text-center text-app-text/40 italic">
                                    Aucune option disponible
                                </div>
                            ) : (
                                options.map((option, index) => (
                                    option.isHeader ? (
                                        <div 
                                            key={`header-${index}`} 
                                            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-app-accent/50 bg-app-accent/5 mt-1 first:mt-0"
                                        >
                                            {option.label}
                                        </div>
                                    ) : (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => handleSelect(option.value)}
                                            className={`
                                                flex items-center justify-between w-full px-3 py-2.5 rounded-lg
                                                text-sm text-left transition-all group
                                                ${value === option.value 
                                                    ? 'bg-app-accent/20 text-app-accent font-bold' 
                                                    : 'hover:bg-app-text/5 text-app-text/80'
                                                }
                                            `}
                                        >
                                            <div className="flex items-center gap-2.5 truncate">
                                                {option.icon && (
                                                    <span className={`${value === option.value ? 'text-app-accent' : 'text-app-text/40 group-hover:text-app-text/60'}`}>
                                                        {option.icon}
                                                    </span>
                                                )}
                                                {renderOption ? renderOption(option) : (
                                                    <span className="truncate">{option.label}</span>
                                                )}
                                            </div>
                                            {value === option.value && (
                                                <Check size={14} className="text-app-accent flex-shrink-0" />
                                            )}
                                        </button>
                                    )
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
