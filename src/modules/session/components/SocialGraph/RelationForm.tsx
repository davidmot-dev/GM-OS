import { Plus } from 'lucide-react';
import { CustomSelect } from './SocialGraphFilters';
import { NATURES_ORDONNEES, NATURES_DE_RELATION } from '../../logic/relationsSociales';
import { useTranslation } from 'react-i18next';


interface RelationFormProps {
    newRelTarget: string;
    setNewRelTarget: (val: string) => void;
    newRelType: string;
    setNewRelType: (val: string) => void;
    newRelDesc: string;
    setNewRelDesc: (val: string) => void;
    /** Le nom propre de la relation, s'il y en a un. */
    newRelLibelle: string;
    setNewRelLibelle: (val: string) => void;
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
    newRelLibelle,
    setNewRelLibelle,
    potentialTargets,
    onAddRelation
}) => {
    const { t } = useTranslation();
    return (

        <section className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
                <div className="flex items-center gap-2 text-neonCyan">
                    <Plus size={14} />
                    <h3 className="text-ui-10 font-black uppercase tracking-widest">{t('modules:session.social_graph.relation_form.add_btn')}</h3>
                </div>

                
                <div className="space-y-3">
                    <CustomSelect 
                        label={t('modules:session.social_graph.relation_form.target_label')}
                        value={newRelTarget}
                        options={potentialTargets.map(t => ({ value: t.id, label: t.name }))}
                        onChange={setNewRelTarget}
                        placeholder={t('modules:session.social_graph.filters.search_placeholder')}
                    />


                    {/*
                        **La liste vient des natures, elle n'est plus recopiée.**

                        Écrite à la main, elle avait divergé de l'union des types :
                        « Ami » enregistrait `romantic`, « Neutre » apparaissait
                        deux fois — une pour `mentor`, une pour `neutral` — et
                        `other` n'était pas proposé. *Un contrôle qui enregistre
                        autre chose que ce qu'il affiche est pire qu'un contrôle
                        absent : on ne soupçonne pas ce qu'on a soi-même choisi.*
                    */}
                    <CustomSelect 
                        label={t('modules:session.social_graph.relation_form.type_label')}
                        value={newRelType}
                        options={NATURES_ORDONNEES.map(nature => ({
                            value: nature,
                            label: t(`modules:session.social_graph.legend.${NATURES_DE_RELATION[nature].cle}`),
                        }))}
                        onChange={setNewRelType}
                    />

                    {/*
                        **Le nom propre de la relation — facultatif, et c'est ce
                        qui rend les types personnalisés gratuits.** La nature
                        choisie ci-dessus décide de la couleur et de la distance
                        dans le graphe ; ce champ décide de ce qui s'affiche.
                        « Serment de sang » fondé sur une alliance reste une
                        alliance pour la physique, et porte son nom pour l'œil.
                    */}
                    <div className="space-y-1">
                        <label className="text-ui-9 font-bold text-slate-500 uppercase px-1">{t('modules:session.social_graph.relation_form.libelle_label')}</label>
                        <input
                            type="text"
                            placeholder={t('modules:session.social_graph.relation_form.libelle_placeholder')}
                            value={newRelLibelle}
                            onChange={(e) => setNewRelLibelle(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-neonCyan/50"
                        />
                    </div>


                    <div className="space-y-1">
                        <label className="text-ui-9 font-bold text-slate-500 uppercase px-1">{t('modules:session.social_graph.relation_form.desc_label')}</label>
                        <input 
                            type="text"
                            placeholder={t('modules:session.social_graph.relation_form.desc_placeholder')}
                            value={newRelDesc}
                            onChange={(e) => setNewRelDesc(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-neonCyan/50 transition-all font-display"
                        />
                    </div>


                    <button 
                        onClick={onAddRelation}
                        disabled={!newRelTarget}
                        className="w-full py-3 bg-neonCyan/20 border border-neonCyan/30 text-neonCyan text-ui-10 font-black uppercase tracking-widest rounded-xl hover:bg-neonCyan hover:text-black transition-all disabled:opacity-30 disabled:hover:bg-neonCyan/20 disabled:hover:text-neonCyan"
                    >
                        {t('modules:session.social_graph.relation_form.add_btn')}
                    </button>

                </div>
            </div>
        </section>
    );
};

export default RelationForm;
