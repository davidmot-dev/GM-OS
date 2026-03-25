import { Plus } from 'lucide-react';
import { CustomSelect } from './SocialGraphFilters';

interface RelationFormProps {
    newRelTarget: string;
    setNewRelTarget: (val: string) => void;
    newRelType: string;
    setNewRelType: (val: string) => void;
    newRelDesc: string;
    setNewRelDesc: (val: string) => void;
    potentialTargets: { id: string, name: string }[];
    onAddRelation: () => void;
}

const RelationForm: React.FC<RelationFormProps> = ({
    newRelTarget,
    setNewRelTarget,
    newRelType,
    setNewRelType,
    newRelDesc,
    setNewRelDesc,
    potentialTargets,
    onAddRelation
}) => {
    return (
        <section className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
                <div className="flex items-center gap-2 text-neonCyan">
                    <Plus size={14} />
                    <h3 className="text-[10px] font-black uppercase tracking-widest">Nouveau Lien</h3>
                </div>
                
                <div className="space-y-3">
                    <CustomSelect 
                        label="Cible"
                        value={newRelTarget}
                        options={potentialTargets.map(t => ({ value: t.id, label: t.name }))}
                        onChange={setNewRelTarget}
                        placeholder="Sélectionner une cible..."
                    />

                    <CustomSelect 
                        label="Type"
                        value={newRelType}
                        options={[
                            { value: 'ally', label: 'Allié' },
                            { value: 'hostile', label: 'Ennemi' },
                            { value: 'family', label: 'Famille' },
                            { value: 'romantic', label: 'Romance' },
                            { value: 'mentor', label: 'Mentor' },
                            { value: 'rival', label: 'Rival' },
                            { value: 'neutral', label: 'Neutre' },
                        ]}
                        onChange={setNewRelType}
                    />

                    <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase px-1">Description</label>
                        <input 
                            type="text"
                            placeholder="Lien entre les personnages..."
                            value={newRelDesc}
                            onChange={(e) => setNewRelDesc(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-neonCyan/50 transition-all font-display"
                        />
                    </div>

                    <button 
                        onClick={onAddRelation}
                        disabled={!newRelTarget}
                        className="w-full py-3 bg-neonCyan/20 border border-neonCyan/30 text-neonCyan text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-neonCyan hover:text-black transition-all disabled:opacity-30 disabled:hover:bg-neonCyan/20 disabled:hover:text-neonCyan"
                    >
                        Ajouter le lien
                    </button>
                </div>
            </div>
        </section>
    );
};

export default RelationForm;
