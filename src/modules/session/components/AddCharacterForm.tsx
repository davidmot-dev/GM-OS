import React, { useState } from 'react';
import { User, Image as ImageIcon, Gamepad2 } from 'lucide-react';
import { useSessionOSStore } from '../useSessionOSStore';
import { useModalStore } from '../../../stores/useModalStore';
import { MediaBrowser } from '../../../components/MediaBrowser';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import { DEFAULT_SHEET_TEMPLATES } from '../../../data/defaultSheetTemplates';
import { DEFAULT_GAME_DRIVERS } from '../../../data/defaultGameDrivers';
import { ficheNeuve } from '../logic/ficheNeuve';
import { santeDeDepart } from '../../combat/logic/SanteDuCombattant';
import { HealthInterpreter } from '../logic/HealthInterpreter';

export const AddCharacterForm: React.FC = () => {
    const { addCharacterToPlayer, selectedPlayerId, customSheetTemplates, customGameDrivers, campaigns, activeCampaignId } = useSessionOSStore();
    const { closeModal } = useModalStore();

    const allTemplates = [...DEFAULT_SHEET_TEMPLATES, ...customSheetTemplates];

    /**
     * **On choisit un JEU, pas un gabarit de fiche.**
     *
     * L'écran était intitulé « Système de Jeu » et listait pourtant les
     * *gabarits* — d'où le mélange que David a relevé le 2026-08-15 : « Dune :
     * Aventures dans l'Imperium » côtoyait « Fiche de Personnage Dune » et
     * « Archive de Personnage », sans qu'on sache lequel choisir.
     *
     * Or c'est le **pilote** qui porte le jeu : les dés, le modèle de santé,
     * l'ordre d'action. Le gabarit n'est que sa fiche, et le pilote sait
     * lequel — `driver.templateId`. Le déduire au lieu de le demander supprime
     * une question à laquelle personne ne pouvait répondre juste, et garantit
     * que la fiche est bien celle du jeu retenu.
     */
    const jeux = [...DEFAULT_GAME_DRIVERS, ...customGameDrivers];
    const [systemId, setSystemId] = useState(jeux[0]?.id ?? '');
    const jeuChoisi = jeux.find(d => d.id === systemId);

    /*
      Le gabarit vient du pilote. Un pilote dont le gabarit a disparu — le
      défaut « Within » réparé le 2026-08-14 — retombe sur le premier
      disponible plutôt que de rendre la fiche introuvable.
    */
    const templateId = allTemplates.some(t => t.id === jeuChoisi?.templateId)
        ? jeuChoisi!.templateId
        : (allTemplates[0]?.id ?? 'generic');
    const gabarit = allTemplates.find(t => t.id === templateId);

    const [name, setName] = useState('');
    const [portraitMediaId, setPortraitMediaId] = useState('');

    /**
     * **La campagne se choisit, et seules celles du même jeu sont proposées.**
     *
     * Elle était imposée : `campaignId: activeCampaignId`, en dur. Un
     * personnage rejoignait donc la campagne ouverte **sans qu'on le
     * choisisse** — le mélange que David craignait (un PJ de Dune dans une
     * campagne Blade Runner) ne risquait pas d'arriver, il se produisait tout
     * seul, à chaque création.
     *
     * On filtre plutôt qu'on ne refuse, et **on dit pourquoi la liste est
     * courte** : une liste vide sans explication est exactement l'énigme que
     * la règle « ne rien refuser sans motif écrit » interdit.
     */
    const campagnesDuJeu = campaigns.filter(c => c.system === systemId);
    const [campaignId, setCampaignId] = useState<string | null>(
        campagnesDuJeu.some(c => c.id === activeCampaignId) ? activeCampaignId : null,
    );
    const [isMediaBrowserOpen, setIsMediaBrowserOpen] = useState(false);

    const portraitUrl = useMediaUrl(portraitMediaId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !selectedPlayerId) return;

        /*
          **La santé de départ vient de la fiche, plus d'un champ à remplir.**
          On la demandait avant même de savoir si le jeu comptait des points de
          vie, et `10` s'y inscrivait par défaut. La formule du pilote la
          calcule sur les valeurs neuves de la fiche ; sans formule, on garde
          le dix historique plutôt que d'inventer autre chose.
        */
        const valeurs = ficheNeuve(gabarit);
        const depart = santeDeDepart(
            jeuChoisi?.combat?.santeDeDepart,
            champ => {
                const brut = valeurs[champ];
                const n = typeof brut === 'number' ? brut : Number(brut);
                return Number.isFinite(n) ? n : undefined;
            },
        ) ?? 10;

        /*
          **Tout personnage naît avec un mécanisme de santé.** David, le
          2026-08-15 : *« normalement tout jeu a un mécanisme de Santé ; tu peux
          dire que s'il n'y en a pas, il peut mettre un système de HP par
          défaut »*. C'est le contrat qui débloque tout le reste : les points de
          vie deviennent facultatifs parce qu'ils ne sont qu'une forme parmi
          cinq, mais `healthSystem`, lui, est toujours là.

          Le modèle vient du pilote ; `hp` à défaut, comme demandé.
        */
        const modele = jeuChoisi?.combat?.defaultHealthType ?? 'hp';
        const sante = HealthInterpreter.createDefault(modele);

        addCharacterToPlayer(selectedPlayerId, {
            name,
            healthSystem: modele === 'hp'
                ? { ...sante, data: { ...sante.data, current: depart, max: depart } }
                : sante,
            maxHp: depart,
            hp: depart,
            portraitUrl: portraitMediaId || 'https://api.dicebear.com/9.x/adventurer/svg?seed=' + name,
            campaignId,
            systemId,
            templateId,
            /*
              **La fiche naît remplie de ses champs, plus vide.** Elle valait
              `{}` même quand le gabarit en déclarait seize : un personnage
              d'Alien naissait sans Force ni compétences, et tout ce qui se lit
              sur la fiche — santé de départ, seuil du jet, tâche de défaite —
              n'avait rien à lire.
            */
            sheetData: valeurs,
        });

        closeModal();
    };

    if (!selectedPlayerId) {
        return (
            <div className="p-4 text-center text-red-400">
                Erreur : Aucun joueur sélectionné.
                <button onClick={closeModal} className="mt-4 block w-full px-4 py-2 bg-slate-800 rounded-lg">Fermer</button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-1">
            {/* Portrait Section */}
            <div className="flex flex-col items-center gap-3">
                <div className="relative group cursor-pointer" onClick={() => setIsMediaBrowserOpen(true)}>
                    <div className="w-32 h-32 rounded-2xl bg-app-surface border-2 border-app-border overflow-hidden flex items-center justify-center transition-all group-hover:border-accent/50 group-hover:shadow-glow-accent/20">
                        {portraitUrl ? (
                            <img src={portraitUrl} alt="Portrait" className="w-full h-full object-cover object-top" />
                        ) : (
                            <User size={48} className="text-app-text/20 group-hover:text-accent transition-colors" />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <ImageIcon size={24} className="text-white" />
                        </div>
                    </div>
                </div>
                <p className="text-[10px] uppercase font-bold text-app-text/40 tracking-widest">Portrait de Personnage</p>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-app-text/40 uppercase tracking-wider pl-1">Nom du Personnage</label>
                    <div className="relative">
                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text/40 pointer-events-none" />
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Aldric le Brave"
                            autoFocus
                            className="w-full bg-app-bg border border-app-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-app-text focus:ring-1 focus:ring-accent/50 focus:border-accent/50 focus:outline-none transition-all"
                            required
                        />
                    </div>
                </div>

                {/*
                  **Classe/Race et PV Max ont disparu de cet écran.**

                  « Classe / Race » est une notion de D&D : Alien parle de
                  Carrière, Dune de Maison, et ces libellés vivent dans les
                  champs de la fiche. « PV Max » demandait un nombre avant même
                  qu'on sache si le jeu comptait des points de vie, avec 10 en
                  valeur par défaut — l'un des sept endroits où ce dix était
                  câblé.

                  Les deux se dérivent maintenant : les caractéristiques du
                  gabarit, la santé de `combat.santeDeDepart`.
                */}
            </div>

            {/* Le jeu — et la fiche qui en découle, montrée sans être choisie. */}
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-app-text/40 uppercase tracking-wider pl-1 flex items-center gap-1.5">
                    <Gamepad2 size={12} /> Jeu
                </label>
                <div className="flex flex-wrap gap-2">
                    {jeux.map(d => (
                        <button
                            key={d.id}
                            type="button"
                            onClick={() => setSystemId(d.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                                systemId === d.id
                                    ? 'bg-accent/10 border-accent/50 text-accent'
                                    : 'bg-app-bg border-app-border text-app-text/40 hover:text-app-text hover:border-app-border/60'
                            }`}
                        >
                            {d.emoji} {d.name}
                        </button>
                    ))}
                </div>

                {/*
                  La fiche n'est plus une question : elle appartient au jeu. On
                  la montre pour que le choix soit vérifiable — un pilote dont
                  le gabarit ne se résout pas se voit ici, avant la création, et
                  non le jour où la fiche s'ouvre vide.
                */}
                <p className="text-[10px] text-app-text/30 pl-1 pt-1">
                    {gabarit
                        ? <>Fiche : <span className="text-app-text/50">{gabarit.emoji} {gabarit.name}</span>
                            {' '}— {gabarit.sections.reduce((n, s) => n + s.fields.length, 0)} champs</>
                        : <span className="text-amber-300/70">Ce jeu ne désigne aucune fiche de personnage valide.</span>}
                </p>
            </div>

            {/* La campagne, choisie et non imposée — et seulement parmi celles du jeu. */}
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-app-text/40 uppercase tracking-wider pl-1">Campagne</label>
                <select
                    value={campaignId ?? ''}
                    onChange={(e) => setCampaignId(e.target.value || null)}
                    className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-sm text-app-text focus:ring-1 focus:ring-accent/50 focus:border-accent/50 focus:outline-none transition-all"
                >
                    <option value="">Aucune pour l'instant</option>
                    {campagnesDuJeu.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
                <p className="text-[10px] text-app-text/30 pl-1">
                    {campagnesDuJeu.length > 0
                        ? <>Seules les campagnes de {jeuChoisi?.name ?? 'ce jeu'} sont proposées : un personnage
                            n'a pas de fiche dans un autre système.</>
                        : <span className="text-amber-300/70">Aucune campagne ne tourne sur
                            {' '}{jeuChoisi?.name ?? 'ce jeu'}. Le personnage sera créé sans campagne, et
                            pourra en rejoindre une plus tard.</span>}
                </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-2">
                <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-3 rounded-xl border border-app-border text-app-text/40 font-bold text-sm hover:bg-app-surface hover:text-app-text/80 transition-all"
                >
                    Annuler
                </button>
                <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-accent hover:opacity-90 text-app-bg font-bold text-sm shadow-glow-accent/20 transition-all"
                >
                    Ajouter
                </button>
            </div>

            {/* Media Browser Portal-like */}
            <MediaBrowser
                isOpen={isMediaBrowserOpen}
                onClose={() => setIsMediaBrowserOpen(false)}
                onSelect={(id) => {
                    setPortraitMediaId(id);
                    setIsMediaBrowserOpen(false);
                }}
                allowedTypes={['image']}
                title="Portrait du Personnage"
            />
        </form>
    );
};
