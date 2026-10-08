import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionOSStore } from '../useSessionOSStore';
import { Activity, Swords, MapPin, Monitor, Shield, Wind, Zap, Lock, BookOpen, ArrowLeft, Edit2, CheckCircle, Image as ImageIcon, Sparkles, Layers, Skull, Search, Users, FolderOpen, Network, EyeOff } from 'lucide-react';
import { Panneau, Etiquette, EnTeteDeModule } from '../../../components/socle';
import { couleurDeRelation, libelleDeRelation } from '../logic/relationsSociales';
import { FieldGauge, FieldRating } from './fields/SheetFields';
import { DEFAULT_SHEET_TEMPLATES, type SheetField } from '../../../data/defaultSheetTemplates';
import { useMapStore } from '../../map/useMapStore';
import { useCombatStore } from '../../combat/useCombatStore';
import { useImageStore } from '../../image/useImageStore';
import { gmToast } from '../../../stores/useToastStore';
import { MediaBrowser } from '../../../components/MediaBrowser';
import { useModalStore } from '../../../stores/useModalStore';
import { ResolvedImage } from '../../../components/ResolvedImage';
import AIPromptOverlay from '../../ai/components/AIPromptOverlay';
import { useVoiceAutomation } from '../../voice/hooks/useVoiceAutomation';
import { useVoiceStore } from '../../voice/useVoiceStore';
import { depuisUnPnjDeCampagne } from '../../voice/logic/personnageAVoix';
import { AudioLines } from 'lucide-react';
import { HealthManager } from './health/HealthManager';
import { useSheetCalculator } from '../hooks/useSheetCalculator';
import { Calculator } from 'lucide-react';

const ROLE_COLORS = {
    ally: 'bg-etat-succes/10 text-etat-succes border-etat-succes/20 hover:bg-etat-succes/20',
    neutral: 'bg-app-muted/10 text-app-muted border-app-border/20 hover:bg-app-muted/20',
    hostile: 'bg-etat-danger/10 text-etat-danger border-etat-danger/20 hover:bg-etat-danger/20',
    boss: 'bg-gm-violet/10 text-gm-violet border-gm-violet/20 hover:bg-gm-violet/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]',
};

const ROLE_ICONS = {
    ally: Shield,
    neutral: Users,
    hostile: Swords,
    boss: Skull,
};

// --- Sub-components ---
/**
 * La jauge d'un PNJ — **la même que celle des personnages**.
 *
 * Cet écran en portait une copie qui affichait des pourcentages sur une échelle
 * de cent imposée, alors que chaque champ déclare son maximum. Deux jauges
 * divergentes pour la même donnée, c'est la garantie qu'un des deux écrans dira
 * un jour autre chose que l'autre — on emploie donc celle de `SheetFields`,
 * corrigée le 2026-08-15.
 */

const FieldNumber: React.FC<{
    field: SheetField;
    value: number;
    onChange: (val: number) => void;
    t: (key: string) => string;
}> = ({ field, value, onChange }) => (
    <div className="flex items-center justify-between gap-3 p-3 bg-app-bg/40 rounded-xl border border-app-border/40">
        <label className="min-w-0 truncate text-ui-11 font-black uppercase tracking-wider text-app-text/60">{field.label}</label>
        <input
            type="number"
            value={value ?? 0}
            onChange={e => onChange(Number(e.target.value))}
            className="w-16 shrink-0 bg-app-surface text-app-text text-center font-mono text-sm font-bold rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-accent/40"
            title={field.label}
        />
    </div>
);

const FieldText: React.FC<{
    field: SheetField;
    value: string;
    onChange: (val: string) => void;
    t: (key: string) => string;
}> = ({ field, value, onChange }) => (
    <div className="flex items-center gap-3 p-3 bg-app-bg/40 rounded-xl border border-app-border/40">
        <label className="text-ui-11 font-black uppercase tracking-wider text-app-text/60 max-w-[45%] shrink-0 truncate">{field.label}</label>
        <input
            type="text"
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-app-text text-sm font-medium focus:outline-none border-b border-app-border focus:border-accent/50 transition-colors pb-0.5"
            title={field.label}
        />
    </div>
);

const FieldCheckbox: React.FC<{
    field: SheetField;
    value: boolean;
    onChange: (val: boolean) => void;
    t: (key: string) => string;
}> = ({ field, value, onChange }) => (
    <button
        onClick={() => onChange(!value)}
        className="flex items-center gap-3 p-3 bg-app-bg/40 rounded-xl border border-app-border/40 w-full hover:border-accent/20 transition-all flex-shrink-0"
    >
        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${value ? 'bg-accent border-accent' : 'border-app-text/20'}`}>
            {value && <CheckCircle size={10} className="text-app-text" />}
        </div>
        <label className="text-ui-11 font-black uppercase tracking-wider text-app-text/60 cursor-pointer">{field.label}</label>
    </button>
);

const FieldSelect: React.FC<{
    field: SheetField;
    value: string;
    onChange: (val: string) => void;
    t: (key: string) => string;
}> = ({ field, value, onChange, t }) => (
    <div className="flex items-center justify-between gap-3 p-3 bg-app-bg/40 rounded-xl border border-app-border/40">
        <label className="min-w-0 truncate text-ui-11 font-black uppercase tracking-wider text-app-text/60">{field.label}</label>
        <select
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-28 shrink-0 bg-app-surface text-app-text text-ui-11 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent/40 border border-app-text/5"
            title={field.label}
        >
            <option value="" disabled>{t('common:actions.select_placeholder')}</option>
            {(field.options || []).map(opt => (
                <option key={opt} value={opt}>{opt}</option>
            ))}
        </select>
    </div>
);

const FieldTextarea: React.FC<{
    field: SheetField;
    value: string;
    onChange: (val: string) => void;
    t: (key: string) => string;
}> = ({ field, value, onChange }) => (
    <div className="flex flex-col gap-2 p-3 bg-app-bg/40 rounded-xl border border-app-border/40 col-span-full">
        <label className="text-ui-11 font-black uppercase tracking-wider text-app-text/60">{field.label}</label>
        <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            rows={2}
            className="w-full bg-transparent text-app-text text-sm focus:outline-none border-b border-app-border/40 focus:border-accent/40 transition-colors resize-none custom-scrollbar"
            title={field.label}
            placeholder={field.label}
        />
    </div>
);


/**
 * `FieldRating` vient de `SheetFields`, comme `FieldGauge`.
 *
 * Cet écran en portait une copie avec les mêmes pastilles vides invisibles —
 * `bg-app-bg/20 border-app-text/10`. Deux composants pour la même donnée, c'est la
 * garantie qu'une correction n'en atteindra qu'un : celle du 2026-08-15 aurait
 * laissé les fiches de PNJ illisibles.
 */

const FieldFormula: React.FC<{
    field: SheetField;
    value: number;
}> = ({ field, value }) => (
    <div className="flex items-center justify-between p-3 bg-accent/5 rounded-xl border border-accent/20 shadow-inner group">
        <label className="text-ui-10 font-black uppercase tracking-widest text-accent/60 flex items-center gap-2">
            <Calculator size={12} className="group-hover:rotate-12 transition-transform" />
            {field.label}
        </label>
        <span className="text-ui-11 font-black text-app-text bg-accent/20 px-3 py-1 rounded-lg border border-accent/10 min-w-[3rem] text-center font-mono">
            {value}
        </span>
    </div>
);


interface NpcDetailProps {
    embeddedId?: string;
}

const NpcDetail: React.FC<NpcDetailProps> = ({ embeddedId }) => {
    const { t } = useTranslation(['modules', 'common']);
    const { 
        entities, 
        selectedEntityId, 
        setSelectedEntity, 
        updateEntity, 
        updateEntitySheetData,
        toggleEntityVisibility,
        customSheetTemplates,
        atlasMaps,
        clues, campaigns, players, activeCampaignId, setCurrentView, setActiveCampaignFormSection, setEditingClueId,
        generateEntityPortrait, isGeneratingAIImage, getActiveDriver
    } = useSessionOSStore();

    /**
     * Ce jeu ordonne-t-il son tour par un **nombre** ?
     *
     * Alien tire des cartes numérotées, Dune alterne entre les camps : dans les
     * deux cas l'initiative chiffrée d'un PNJ ne sera jamais lue. Même règle que
     * dans le formulaire de création — *un champ qu'aucun chemin n'atteint est
     * un champ mort qui a l'air vivant.*
     */
    const piloteActif = getActiveDriver();
    const initiativeChiffree = !piloteActif?.combat?.initiativeCards
        && piloteActif?.combat?.initiative?.mode !== 'alternance';
    const { closeModal } = useModalStore();
    const { addToken } = useMapStore();
    const currentId = embeddedId || selectedEntityId;
    const selectedNpc = entities.find(e => e.id === currentId);
    const currentTemplate = customSheetTemplates.find(t => t.id === selectedNpc?.templateId);
    const { evaluateFormula } = useSheetCalculator(selectedNpc || null, currentTemplate || null);
    useVoiceAutomation();
    const { generateVoiceProfile, appliquerProfil } = useVoiceStore();
    const [profilageEnCours, setProfilageEnCours] = useState(false);

    const ROLE_LABELS = {
        ally: t('modules:session.npc_detail.affinity.ally'),
        neutral: t('modules:session.npc_detail.affinity.neutral'),
        hostile: t('modules:session.npc_detail.affinity.hostile'),
        boss: t('modules:session.npc_detail.affinity.boss'),
    };

    const [isEditing, setIsEditing] = useState(false);
    const [isMediaBrowserOpen, setIsMediaBrowserOpen] = useState(false);
    const [showAIPrompt, setShowAIPrompt] = useState(false);


    const handleClose = () => {
        if (embeddedId) {
            closeModal();
        } else {
            setSelectedEntity(null);
        }
    };

    if (!selectedNpc) {
        return (
            <div className="flex-1 flex items-center justify-center bg-app-bg/20 text-app-text/20 italic text-sm p-20">
                {t('modules:session.npc_detail.placeholder')}
            </div>
        );
    }

    const handleSendToMap = () => {
        const { selectedAtlasMapId } = useSessionOSStore.getState();
        addToken({
            sourceEntityId: selectedNpc.id,
            name: selectedNpc.name,
            avatar: selectedNpc.avatar,
            x: 200, y: 200, size: 1,
        });
        const linkedMapIds = selectedNpc.linkedMapIds || [];
        if (selectedAtlasMapId && !linkedMapIds.includes(selectedAtlasMapId)) {
            updateEntity(selectedNpc.id, { linkedMapIds: [...linkedMapIds, selectedAtlasMapId] });
        }
        gmToast(t('modules:session.toasts.entity_added_to_map', { name: selectedNpc.name }));
    };

    const handleAddToCombat = () => {
        useCombatStore.getState().addCombatant({
            name: selectedNpc.name,
            init: selectedNpc.initiative,
            hp: selectedNpc.hp,
            hpMax: selectedNpc.maxHp,
            avatar: selectedNpc.avatar,
            isPlayer: false,
            faction: 'enemy',
            sourceEntityId: selectedNpc.id,
            statuses: []
        });
        gmToast(t('modules:session.toasts.entity_added_to_combat', { name: selectedNpc.name }));
    };

    const linkedMaps = atlasMaps.filter(m => (selectedNpc.linkedMapIds || []).includes(m.id));
    const linkedClues = clues.filter(c => c.ownerId === selectedNpc.id && c.campaignId === activeCampaignId);

    const handleClueClick = (clueId?: string) => {
        setActiveCampaignFormSection('clues');
        if (clueId) setEditingClueId(clueId);
        setCurrentView('campaign-editor');
        if (embeddedId) closeModal();
    };

    const allTemplates = [...DEFAULT_SHEET_TEMPLATES, ...(customSheetTemplates || [])];
    const template = allTemplates.find(t => t.id === selectedNpc.templateId) || DEFAULT_SHEET_TEMPLATES[0];
    /*
      **La fiche suit le jeu** — refonte, L5, étape 2. Le bloc fixe Vitalité /
      CA / Vitesse posait un autre jeu au-dessus de la fiche Blade Runner : la
      santé vit dans la console de dommage (`HealthManager`, qui lit le modèle
      de santé du pilote et règle le maximum), et le reste de la fiche devient
      un bloc titré par section du modèle. Le modèle générique n'a pas de
      champs de jeu : on le dit au lieu de montrer des `stat1`.
    */
    const sectionsDuJeu = template.id !== 'generic' ? template.sections : [];
    const mort = selectedNpc.status === 'dead';
    const campagne = campaigns.find(c => c.id === (selectedNpc.campaignId || activeCampaignId));
    /*
      **Les relations clés sont celles du graphe social**, lues sur la fiche :
      c'est la même donnée (`relations`) que le graphe dessine. Une relation
      dont la cible a disparu reste listée, nommée comme telle — *un lien qui
      s'efface sans rien dire est une information perdue sans que personne ne
      l'ait décidé.*
    */
    const relationsCles = (selectedNpc.relations || []).map(rel => ({
        rel,
        nom: rel.targetType === 'pc'
            ? players.flatMap(p => p.characters).find(c => c.id === rel.targetId)?.name
            : entities.find(e => e.id === rel.targetId)?.name,
    }));
    /* Les repères de combat ne paraissent que s'ils portent quelque chose : la
       CA et la vitesse là où elles ont une valeur, l'initiative seulement si
       le jeu ordonne son tour par un nombre. */
    const reperesDeCombat = initiativeChiffree || !!selectedNpc.ac || !!selectedNpc.speed;

    const titreDeBloc = (icone: React.ReactNode, titre: React.ReactNode, aside?: React.ReactNode) => (
        <div className="flex items-center justify-between gap-3 border-b border-app-border px-4 py-3">
            <h3 className="flex min-w-0 items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-app-text">
                <span className="shrink-0 text-accent">{icone}</span>
                <span className="truncate">{titre}</span>
            </h3>
            {aside}
        </div>
    );

    return (
        <div className="flex-1 h-full bg-app-bg/60 p-6 flex flex-col gap-4 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
            <EnTeteDeModule
                surtitre={`${t('modules:session.npc_detail.agencement.surtitre')}${sectionsDuJeu.length > 0 ? ` · ${template.name}` : ''}`}
                titre={<span className={mort ? 'line-through text-app-subtle' : ''}>{selectedNpc.name}</span>}
                actions={<>
                    <button
                        onClick={handleClose}
                        className="flex items-center gap-2 px-4 py-2 bg-app-surface border border-app-border text-app-muted hover:text-accent hover:border-accent/50 rounded-xl transition-all font-bold text-sm uppercase tracking-widest group"
                    >
                        <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                        {embeddedId ? t('common:close') : t('modules:favorite.back')}
                    </button>
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`flex items-center gap-2 px-5 py-2 rounded-xl border transition-all font-bold text-sm uppercase tracking-widest ${
                            isEditing
                            ? 'bg-accent text-app-on-accent border-accent shadow-glow-accent'
                            : 'bg-app-surface border-app-border text-app-muted hover:text-app-text hover:border-app-text/30'
                        }`}
                    >
                        {isEditing ? <CheckCircle size={18} /> : <Edit2 size={18} />}
                        {isEditing ? t('modules:session.npc_detail.actions.finish') : t('modules:session.npc_detail.actions.edit')}
                    </button>
                </>}
                etat={<>
                    {/*
                      **Le TYPE se corrige, comme le rôle.**

                      Signalé par David le 2026-08-21 : « je ne
                      sais pas marquer un PNJ comme Monstre ». Il
                      ne pouvait pas — `type` ne se choisissait
                      qu'à la création, dans `AddEntityForm`,
                      pendant que le rôle juste à côté se change
                      d'un clic depuis toujours. Une entité née
                      `npc`, ou importée par la Forge de campagne
                      qui décide du type à notre place, restait
                      `npc` pour la vie.

                      *Une valeur qu'on ne peut pas corriger à la
                      main est une valeur qu'on subit* — la règle
                      posée pour `dice.logic` le 2026-08-17, et
                      le même remède.

                      Ça dépasse le filtre « Monstres » de la
                      galerie : `ObsidianExportService` range les
                      `monster` dans `Bestiaire/` et le reste
                      dans `PNJs/`. Un type faux se paie aussi à
                      l'export.
                    */}
                    <button
                        onClick={() => {
                            const types = ['npc', 'monster', 'pc'] as const;
                            const rang = types.indexOf(selectedNpc.type as typeof types[number]);
                            // Un type inconnu repart sur « PNJ » plutôt que
                            // de bloquer le cycle : -1 + 1 = 0.
                            updateEntity(selectedNpc.id, { type: types[(rang + 1) % types.length] });
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-app-border bg-app-surface text-app-muted hover:text-accent hover:border-accent/40 transition-all"
                        title={t('modules:session.npc_detail.change_type')}
                    >
                        {selectedNpc.type === 'monster' ? <Skull size={14} /> : <Users size={14} />}
                        <span className="text-ui-10 font-black uppercase tracking-widest">
                            {t(`modules:session.forms.types.${selectedNpc.type || 'npc'}`)}
                        </span>
                    </button>
                    <button
                        onClick={() => {
                            const roles: (keyof typeof ROLE_LABELS)[] = ['ally', 'neutral', 'hostile', 'boss'];
                            const nextRole = roles[(roles.indexOf(selectedNpc.role || 'neutral') + 1) % roles.length];
                            updateEntity(selectedNpc.id, { role: nextRole });
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${ROLE_COLORS[selectedNpc.role || 'neutral']}`}
                        title={t('common:actions.edit')}
                    >
                        {React.createElement(ROLE_ICONS[selectedNpc.role || 'neutral'], { size: 14 })}
                        <span className="text-ui-10 font-black uppercase tracking-widest">{ROLE_LABELS[selectedNpc.role as keyof typeof ROLE_LABELS || 'neutral']}</span>
                    </button>
                    <button
                        onClick={() => updateEntity(selectedNpc.id, { status: mort ? 'alive' : 'dead' })}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${mort ? 'bg-etat-danger border-etat-danger text-app-bg' : 'bg-app-surface border-app-border text-app-subtle hover:text-etat-danger hover:border-etat-danger/50'}`}
                        title={t('modules:session.npc_detail.status.dead')}
                    >
                        <Skull size={14} />
                        {mort && <span className="text-ui-10 font-black uppercase tracking-widest">{t('modules:session.npc_detail.status.dead')}</span>}
                    </button>
                    <button
                        onClick={() => toggleEntityVisibility(selectedNpc.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${selectedNpc.isVisibleByPlayers ? 'bg-accent/20 border-accent/40 text-accent' : 'bg-app-surface/40 border-app-border/40 text-app-muted'}`}
                    >
                        <Monitor size={14} />
                        <span className="text-ui-10 font-black uppercase tracking-widest">{selectedNpc.isVisibleByPlayers ? t('common:status.online') : t('common:status.offline')}</span>
                    </button>

                    {/*
                        **La voix des PNJ de la campagne, enfin ici.**

                        Le profilage vocal existait depuis toujours, mais
                        seulement dans NPC-OS — un module à part, qui ne
                        contient qu'une poignée de fiches. Les cent et
                        quelques PNJ que le meneur joue vraiment sont dans
                        cette galerie, et n'avaient aucun bouton : la case
                        « Sync PNJ » leur devinait des réglages par
                        mots-clés et les écrasait à la sélection suivante.
                    */}
                    <button
                        onClick={async () => {
                            if (profilageEnCours) return;
                            setProfilageEnCours(true);
                            try {
                                const profil = await generateVoiceProfile(depuisUnPnjDeCampagne(selectedNpc));
                                // `generateVoiceProfile` dit déjà ses échecs :
                                // un `null` a été expliqué, on n'écrit rien.
                                if (profil) updateEntity(selectedNpc.id, { voiceProfile: profil });
                            } finally {
                                setProfilageEnCours(false);
                            }
                        }}
                        disabled={profilageEnCours}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-etat-succes/20 bg-etat-succes/10 text-etat-succes/80 hover:bg-etat-succes/20 transition-all disabled:opacity-40"
                        title={t('modules:session.npc_detail.voice_gen_tooltip')}
                    >
                        <Sparkles size={14} className={profilageEnCours ? 'animate-pulse' : ''} />
                        <span className="text-ui-10 font-black uppercase tracking-widest">
                            {t('modules:session.npc_detail.voice_gen')}
                        </span>
                    </button>

                    {/* Rien à rappeler tant que rien n'a été réglé : un
                        bouton qui reposerait un profil inexistant remettrait
                        le rack à des valeurs que personne n'a choisies. */}
                    {selectedNpc.voiceProfile && (
                        <button
                            onClick={() => {
                                appliquerProfil(selectedNpc.voiceProfile!);
                                gmToast(t('modules:session.npc_detail.voice_recalled', { name: selectedNpc.name }), 'info');
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gm-cyan/20 bg-gm-cyan/10 text-gm-cyan/80 hover:bg-gm-cyan/20 transition-all"
                            title={t('modules:session.npc_detail.voice_recall_tooltip')}
                        >
                            <AudioLines size={14} />
                            <span className="text-ui-10 font-black uppercase tracking-widest">
                                {t('modules:session.npc_detail.voice_recall')}
                            </span>
                        </button>
                    )}
                </>}
            />

            {/* Les trois gestes de la fiche, en barre — Projeter en premier,
                c'est celui qu'on cherche en séance. */}
            {!isEditing && (
                <div className="flex flex-wrap gap-3">
                    <button onClick={() => useImageStore.getState().projectEntity(selectedNpc)} className="flex items-center justify-center gap-2 bg-accent text-app-on-accent font-black px-6 py-3 rounded-xl text-xs uppercase tracking-widest transition-all shadow-glow-accent"><Monitor size={16}/>{t('modules:session.npc_detail.actions.project')}</button>
                    <button onClick={handleAddToCombat} className="flex items-center justify-center gap-2 bg-app-surface hover:bg-app-surface-2 text-app-text font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-widest transition-all border border-app-border"><Swords size={16}/>{t('modules:session.npc_detail.actions.combat')}</button>
                    <button onClick={handleSendToMap} className="flex items-center justify-center gap-2 bg-app-surface border border-app-border text-app-text hover:border-accent/50 hover:text-accent font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-widest transition-all"><MapPin size={16}/>{t('modules:session.npc_detail.actions.map')}</button>
                </div>
            )}

            {/*
              **Les colonnes se replient selon la place de la fiche, pas de la
              fenêtre.** Entre la barre de GM-OS et celle de Session-OS, la fiche
              n'a parfois que 640 px sur un écran de 1 200 : un seuil lu sur la
              fenêtre posait trois colonnes illisibles, ou une seule colonne là
              où deux tenaient. La droite passe dessous quand elle ne tient plus.
            */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1">
            <div className="flex flex-wrap items-start gap-4">
                {/* Gauche — le portrait, le profil, la console de dommage */}
                <div className="flex min-w-0 flex-[0_0_20rem] max-w-full flex-col gap-4">
                    <div
                        className={`aspect-[4/5] rounded-2xl overflow-hidden border-2 shadow-2xl relative group bg-app-surface transition-all flex-shrink-0 ${
                            isEditing ? 'border-accent cursor-pointer hover:shadow-glow-accent' : 'border-app-border'
                        }`}
                        onClick={() => isEditing && setIsMediaBrowserOpen(true)}
                    >
                        {/* Sans portrait, une silhouette : l'image vide
                            montrait son texte de remplacement, cassée. */}
                        {selectedNpc.avatar ? (
                        <div className="absolute inset-0">
                            <ResolvedImage src={selectedNpc.avatar} alt="" className="absolute inset-0 w-full h-full object-cover blur-xl opacity-30 scale-110" />
                            <ResolvedImage src={selectedNpc.avatar} alt={selectedNpc.name} className={`relative z-10 w-full h-full object-contain ${mort ? 'grayscale contrast-125 brightness-75' : ''}`} />
                        </div>
                        ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-app-subtle">
                            <Users size={72} strokeWidth={1} />
                        </div>
                        )}

                        {mort && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-etat-danger/20 backdrop-grayscale-[0.5]">
                                <div className="bg-etat-danger text-app-bg text-ui-10 font-black px-3 py-1 rounded uppercase tracking-widest rotate-[-10deg] border border-etat-danger/50">{t('modules:session.npc_detail.status.dead')}</div>
                            </div>
                        )}

                        <div className="absolute inset-0 bg-app-bg/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 gap-4">
                            <button onClick={(e) => { e.stopPropagation(); setIsMediaBrowserOpen(true); }} className="p-3 bg-app-text/10 hover:bg-app-text/20 rounded-full transition-all"><ImageIcon size={32} /></button>
                            <button onClick={(e) => { e.stopPropagation(); setShowAIPrompt(true); }} className="p-3 bg-accent text-app-on-accent rounded-full hover:scale-110 shadow-glow-accent"><Sparkles size={32} /></button>
                        </div>

                        {isGeneratingAIImage && (
                            <div className="absolute inset-0 bg-app-bg/60 backdrop-blur-sm flex items-center justify-center z-30">
                                <div className="flex flex-col items-center gap-4 animate-pulse">
                                    <Sparkles size={48} className="text-accent animate-spin" />
                                    <span className="text-ui-10 font-black uppercase tracking-[0.2em] text-accent">{t('modules:session.npc_detail.status.generating')}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <Panneau className="p-4 flex flex-col gap-2 flex-shrink-0">
                        <span className="text-ui-10 font-black uppercase tracking-widest text-app-muted">{t('modules:session.npc_detail.agencement.profil')}</span>
                        {isEditing ? (
                            <textarea
                                value={selectedNpc.description || ''}
                                onChange={(e) => updateEntity(selectedNpc.id, { description: e.target.value })}
                                rows={4}
                                className="w-full bg-app-bg/40 border border-app-border rounded-lg px-3 py-2 text-sm text-app-text focus:outline-none focus:border-accent resize-none custom-scrollbar"
                                title={t('modules:session.npc_detail.agencement.profil')}
                            />
                        ) : (
                            <p className={`text-sm leading-relaxed ${selectedNpc.description ? 'text-app-text' : 'text-app-subtle italic'}`}>
                                {selectedNpc.description || t('modules:session.npc_detail.agencement.sans_profil')}
                            </p>
                        )}
                    </Panneau>

                    <Panneau className="flex-shrink-0">
                        {titreDeBloc(<Activity size={16} />, t('modules:session.npc_detail.agencement.console'))}
                        <div className="p-3">
                            <HealthManager id={selectedNpc.id} type="npc" disposition="carte" />
                        </div>
                    </Panneau>

                    {reperesDeCombat && (
                        <Panneau className="p-3 flex flex-wrap gap-2 flex-shrink-0">
                            {/* La classe d'armure : un seuil contre des
                                attaques qui retirent des points. Le jour où
                                un pilote dira quel champ de fiche porte la
                                protection, cette heuristique lui laissera la place. */}
                            {!!selectedNpc.ac && (
                                <label className="flex flex-1 items-center gap-2 rounded-lg border border-app-border bg-app-bg/40 px-3 py-2">
                                    <Shield size={14} className="text-etat-info" />
                                    <span className="text-ui-10 font-bold uppercase text-app-muted">{t('modules:session.forms.labels.ac')}</span>
                                    <input type="number" value={selectedNpc.ac} onChange={e => updateEntity(selectedNpc.id, { ac: parseInt(e.target.value) || 0 })} className="w-12 ml-auto bg-transparent text-right text-app-text font-black text-sm outline-none" title={t('modules:session.forms.labels.ac')} />
                                </label>
                            )}
                            {/* La vitesse n'est lue par AUCUN mécanisme — ni
                                le combat, ni la carte. On la garde là où elle
                                porte une valeur, on ne la propose plus à blanc. */}
                            {!!selectedNpc.speed && (
                                <label className="flex flex-1 items-center gap-2 rounded-lg border border-app-border bg-app-bg/40 px-3 py-2">
                                    <Wind size={14} className="text-etat-succes" />
                                    <span className="text-ui-10 font-bold uppercase text-app-muted">{t('modules:session.forms.labels.speed')}</span>
                                    <input type="number" value={selectedNpc.speed} onChange={e => updateEntity(selectedNpc.id, { speed: parseInt(e.target.value) || 0 })} className="w-12 ml-auto bg-transparent text-right text-app-text font-black text-sm outline-none" title={t('modules:session.forms.labels.speed')} />
                                </label>
                            )}
                            {/* L'initiative chiffrée n'a de sens que si le jeu
                                ordonne son tour par un nombre. Alien tire des
                                cartes, Dune alterne entre les camps. */}
                            {initiativeChiffree && (
                                <label className="flex flex-1 items-center gap-2 rounded-lg border border-app-border bg-app-bg/40 px-3 py-2">
                                    <Zap size={14} className="text-etat-alerte" />
                                    <span className="text-ui-10 font-bold uppercase text-app-muted">{t('modules:session.forms.labels.initiative')}</span>
                                    <input type="number" value={selectedNpc.initiative ?? 0} onChange={e => updateEntity(selectedNpc.id, { initiative: parseInt(e.target.value) || 0 })} className="w-12 ml-auto bg-transparent text-right text-app-text font-black text-sm outline-none" title={t('modules:session.forms.labels.initiative')} />
                                </label>
                            )}
                        </Panneau>
                    )}
                </div>

                {/* Centre — la fiche du jeu, un bloc titré par section */}
                <div className="flex min-w-0 flex-[3_1_20rem] flex-col gap-4">
                    {isEditing && (
                        <Panneau className="p-4 space-y-4 flex-shrink-0">
                            <input
                                type="text" value={selectedNpc.name || ''}
                                onChange={(e) => updateEntity(selectedNpc.id, { name: e.target.value })}
                                className="bg-app-bg/40 border border-accent/30 rounded-xl px-4 py-2 text-2xl font-black text-app-text w-full focus:outline-none focus:border-accent"
                                title={t('modules:session.npc_detail.agencement.surtitre')}
                            />
                            <div className="space-y-3">
                                <div className="flex items-center gap-2"><Layers size={14} className="text-accent"/><label className="text-ui-11 font-black uppercase tracking-widest text-app-muted">{t('modules:session.npc_detail.sections.sheet_template')}</label></div>
                                <div className="grid grid-cols-2 gap-2">
                                    {allTemplates.map(t => (
                                        <button
                                            key={t.id} onClick={() => updateEntity(selectedNpc.id, { templateId: t.id })}
                                            className={`px-3 py-2 rounded-xl text-ui-10 font-black uppercase border transition-all ${selectedNpc.templateId === t.id ? 'bg-accent/10 border-accent text-accent' : 'bg-app-bg border-app-border text-app-muted'}`}
                                        >
                                            {t.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </Panneau>
                    )}

                    {!isEditing && sectionsDuJeu.length === 0 && (
                        <Panneau vide className="p-8 text-center text-sm italic text-app-muted flex-shrink-0">
                            {t('modules:session.npc_detail.agencement.sans_fiche')}
                        </Panneau>
                    )}

                    {!isEditing && sectionsDuJeu.map((section, sidx) => (
                        <Panneau key={section.id || sidx} className="flex-shrink-0">
                            {titreDeBloc(
                                <span className="font-mono text-ui-11">{String(sidx + 1).padStart(2, '0')}</span>,
                                section.label,
                            )}
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] gap-3 p-4">
                                {section.fields.map(field => {
                                    const value = selectedNpc.sheetData?.[field.id] ?? field.defaultValue;
                                    const onChange = (v: string | number | boolean) => updateEntitySheetData(selectedNpc.id, field.id, v);

                                    if (field.type === 'gauge') return <FieldGauge key={field.id} field={field} value={value as number} onChange={onChange} />;
                                    if (field.type === 'number') return <FieldNumber key={field.id} field={field} value={value as number} onChange={onChange} t={t} />;
                                    if (field.type === 'text') return <FieldText key={field.id} field={field} value={value as string} onChange={onChange} t={t} />;
                                    if (field.type === 'checkbox') return <FieldCheckbox key={field.id} field={field} value={value as boolean} onChange={onChange} t={t} />;
                                    if (field.type === 'select') return <FieldSelect key={field.id} field={field} value={value as string} onChange={onChange} t={t} />;
                                    if (field.type === 'textarea') return <FieldTextarea key={field.id} field={field} value={value as string} onChange={onChange} t={t} />;
                                    if (field.type === 'rating') return <FieldRating key={field.id} field={field} value={value as number} onChange={onChange} />;
                                    if (field.type === 'formula') return <FieldFormula key={field.id} field={field} value={evaluateFormula(field.formula || '')} />;

                                    return null;
                                })}
                            </div>
                        </Panneau>
                    ))}
                </div>

                {/* Droite — la campagne, les relations, ce que le meneur garde pour lui */}
                <div className="flex min-w-0 flex-[1_1_16rem] flex-col gap-4">
                    {campagne && (
                        <Panneau className="flex-shrink-0">
                            {titreDeBloc(<FolderOpen size={16} />, t('modules:session.npc_detail.agencement.campagne'))}
                            <div className="px-4 py-3">
                                <p className="font-display text-lg font-bold text-app-text leading-tight">{campagne.name}</p>
                                {campagne.system && <p className="mt-1 text-ui-10 font-bold uppercase tracking-widest text-app-muted">{campagne.system}</p>}
                            </div>
                        </Panneau>
                    )}

                    <Panneau className="flex-shrink-0">
                        {titreDeBloc(
                            <Network size={16} />,
                            t('modules:session.npc_detail.agencement.relations'),
                            relationsCles.length > 0 && <Etiquette>{relationsCles.length}</Etiquette>,
                        )}
                        <div className="flex flex-col gap-1.5 p-3">
                            {relationsCles.map(({ rel, nom }, i) => {
                                const couleur = couleurDeRelation(rel.type);
                                // Ouvrir un PNJ lié remplace la fiche : seulement
                                // hors fenêtre, où la sélection décide de l'écran.
                                const ouvrable = !embeddedId && rel.targetType === 'npc' && !!nom;
                                return (
                                    <button
                                        key={`${rel.targetId}-${i}`}
                                        type="button"
                                        disabled={!ouvrable}
                                        onClick={() => ouvrable && setSelectedEntity(rel.targetId)}
                                        className="flex items-center gap-3 rounded-lg border border-app-border bg-app-bg/40 px-3 py-2 text-left transition-all enabled:hover:border-accent/40 disabled:cursor-default"
                                        title={rel.description || undefined}
                                    >
                                        <span className="min-w-0 flex-1">
                                            <span className={`block truncate text-xs font-black uppercase tracking-wide ${nom ? 'text-app-text' : 'text-app-subtle italic'}`}>
                                                {nom ?? t('modules:session.npc_detail.agencement.cible_disparue')}
                                            </span>
                                            {rel.description && <span className="block truncate text-ui-10 text-app-muted">{rel.description}</span>}
                                        </span>
                                        <span
                                            className="shrink-0 rounded border px-2 py-0.5 text-ui-9 font-black uppercase tracking-widest"
                                            style={{ color: couleur, borderColor: `${couleur}66`, backgroundColor: `${couleur}1a` }}
                                        >
                                            {libelleDeRelation(rel, t)}
                                        </span>
                                    </button>
                                );
                            })}
                            {relationsCles.length === 0 && (
                                <span className="px-1 py-2 text-ui-10 italic text-app-subtle">{t('modules:session.npc_detail.agencement.sans_relation')}</span>
                            )}
                        </div>
                    </Panneau>

                    {/* Les notes privées ne sortent jamais : la projection
                        n'envoie que le nom et le portrait, et la
                        synchronisation des tablettes masque ces deux champs. */}
                    <Panneau className="flex-shrink-0 border-accent/30">
                        {titreDeBloc(
                            <Lock size={16} />,
                            t('modules:session.npc_detail.sections.secrets'),
                            <Etiquette ton="accent"><EyeOff size={10} className="inline -mt-0.5 mr-1" />{t('modules:session.npc_detail.agencement.non_projete')}</Etiquette>,
                        )}
                        <textarea className="w-full bg-transparent px-4 py-3 text-sm text-app-text outline-none resize-none min-h-[8rem] custom-scrollbar" value={selectedNpc.gmSecretInfo || ''} onChange={e => updateEntity(selectedNpc.id, { gmSecretInfo: e.target.value })} placeholder={t('modules:session.npc_detail.placeholders.secrets')} title={t('modules:session.npc_detail.sections.secrets')} />
                    </Panneau>

                    <Panneau className="flex-shrink-0">
                        {titreDeBloc(<BookOpen size={16} />, t('modules:session.npc_detail.sections.notes'))}
                        <textarea className="w-full bg-transparent px-4 py-3 text-sm text-app-text outline-none resize-none min-h-[6rem] custom-scrollbar" value={selectedNpc.roleplayingNotes || ''} onChange={e => updateEntity(selectedNpc.id, { roleplayingNotes: e.target.value })} placeholder={t('modules:session.npc_detail.placeholders.roleplay')} title={t('modules:session.npc_detail.sections.notes')} />
                    </Panneau>

                    <Panneau className="p-4 space-y-4 flex-shrink-0">
                        <div className="space-y-2">
                            <h4 className="text-ui-10 font-black uppercase text-gm-gold flex items-center gap-2"><Search size={14}/> {t('modules:session.npc_detail.sections.clues')}</h4>
                            <div className="flex flex-wrap gap-2">
                                {linkedClues.map(c => (
                                    <button key={c.id} onClick={() => handleClueClick(c.id)} className="px-3 py-1.5 rounded-xl bg-app-bg/40 border border-app-border text-ui-9 font-black text-app-muted hover:text-gm-gold hover:border-gm-gold/40 transition-all">{c.title}</button>
                                ))}
                                {linkedClues.length === 0 && <span className="text-ui-10 italic text-app-subtle">{t('modules:session.npc_detail.sections.no_clue')}</span>}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-ui-10 font-black uppercase text-app-muted flex items-center gap-2"><MapPin size={14}/> {t('modules:session.npc_detail.sections.maps')}</h4>
                            <div className="flex flex-wrap gap-2">
                                {linkedMaps.map(m => (
                                    <span key={m.id} className="px-3 py-1.5 rounded-xl bg-app-bg/40 border border-app-border text-ui-9 font-black text-app-muted">{m.name}</span>
                                ))}
                                {linkedMaps.length === 0 && <span className="text-ui-10 italic text-app-subtle">{t('modules:session.npc_detail.sections.no_map')}</span>}
                            </div>
                        </div>
                    </Panneau>
                </div>
            </div>
            </div>

            <MediaBrowser isOpen={isMediaBrowserOpen} onClose={() => setIsMediaBrowserOpen(false)} onSelect={(id) => { updateEntity(selectedNpc.id, { avatar: id }); setIsMediaBrowserOpen(false); }} allowedTypes={['image']} title={t('modules:session.npc_detail.sections.portrait')} />
            <AIPromptOverlay isOpen={showAIPrompt} onClose={() => setShowAIPrompt(false)} isGenerating={isGeneratingAIImage} title={t('modules:session.npc_gallery.ai_title', { name: selectedNpc.name })} onGenerate={(inst) => generateEntityPortrait(selectedNpc.id, inst).then(() => setShowAIPrompt(false))} />
        </div>
    );
};

export default NpcDetail;
