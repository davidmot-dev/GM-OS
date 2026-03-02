import React from 'react';
import { useSessionOSStore } from '../useSessionOSStore';

const SessionChecklist: React.FC = () => {
    const { checklist, toggleChecklist } = useSessionOSStore();

    return (
        <div className="flex flex-col gap-3">
            <p className="text-slate-500 text-xs uppercase tracking-widest mb-1 px-3">Session Prep</p>

            <div className="flex flex-col gap-1 px-1">
                {checklist.map(item => (
                    <label
                        key={item.id}
                        className="flex items-center gap-3 p-2 hover:bg-slate-800/30 rounded-lg cursor-pointer group transition-colors"
                    >
                        <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => toggleChecklist(item.id)}
                            className="rounded border-slate-700 bg-slate-800 text-gm-gold focus:ring-gm-gold focus:ring-offset-slate-900 h-4 w-4 cursor-pointer"
                        />
                        <span className={`text-sm group-hover:text-slate-100 transition-colors ${item.checked ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                            {item.label}
                        </span>
                    </label>
                ))}
            </div>
        </div>
    );
};

export default SessionChecklist;
