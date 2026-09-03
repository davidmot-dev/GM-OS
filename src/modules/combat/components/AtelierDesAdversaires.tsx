import React, { useMemo, useState } from 'react';
import { Swords, X, BookMarked, Wand2, Users, Save, Trash2, Pencil, Check } from 'lucide-react';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { tousLesPilotes } from '../../session/store/tousLesPilotes';
import { useCombatStore } from '../useCombatStore';
import { useBestiaireStore } from '../useBestiaireStore';
import { gmToast } from '../../../stores/useToastStore';
import { DEFAULT_SHEET_TEMPLATES, type SheetField } from '../../../data/defaultSheetTemplates';
import { HealthInterpreter } from '../../session/logic/HealthInterpreter';
import { santeDeDepart, valeurDuChamp } from '../logic/SanteDuCombattant';
import { ARCHETYPES, archetypeParId, proposerLesChamps, RANGS, rangParId } from '../logic/archetypes';
import { fabriquer, hasardDeGraine, nommerLExemplaire } from '../logic/fabriqueDAdversaire';
import {
    NOMBRE_MAX, NOMBRE_MIN, nombreApresChangementDeRang, nombreSaisi, reprendreLaSuggestion,
} from '../logic/nombreDExemplaires';

/**
 * **L'atelier des adversaires — demandé par David le 2026-09-03.**
 *
 * *« Il me manque un module pour créer des adversaires de combat aléatoire. »*
 * Puis, sur la question de l'origine des chiffres : *« une combinaison du pilote
 * + archétypes et d'un bestiaire que je remplis »*, et *« les deux »* pour la
 * destination.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUI EXISTAIT, ET POURQUOI ÇA NE SUFFISAIT PAS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `EncounterGenerator` savait **assembler** une rencontre en clonant des
 * prototypes déjà saisis dans la campagne. Il ne savait rien **créer** : sans
 * bestiaire patiemment rempli, il ne produisait rien. Et l'ajout manuel de
 * Combat-OS donnait une coquille — un nom, dix points de vie en dur, une fiche
 * de zéros.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LES TROIS DÉCISIONS DE CET ÉCRAN
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 1. **Ce que l'atelier a deviné est montré avant de fabriquer.** Les champs
 *    favorisés et négligés sont des puces cliquables, pré-remplies par
 *    mots-clés. GM-OS ne sait pas lequel des champs d'un jeu veut dire « fort » ;
 *    il propose, le meneur tranche, et le bestiaire retient — *un outil qui
 *    devine en silence fabrique des erreurs invisibles.*
 * 2. **L'aperçu est le premier exemplaire, pas une moyenne.** On voit ce qu'on
 *    va obtenir, et « relancer » en donne un autre. Une moyenne rassurerait sur
 *    quelque chose que personne ne jouera jamais.
 * 3. **La santé n'est pas calculée ici.** `addCombatant` la déduit de la fiche
 *    par la formule du pilote dès qu'on lui passe `sheetData` : la recopier
 *    ferait un huitième lecteur d'une même vérité, et c'est le motif que ce
 *    projet paie le plus souvent.
 */

interface Props {
    onClose: () => void;
    /**
     * Le jeu dont on veut le bestiaire, quand ce n'est pas celui de la campagne.
     *
     * *Demande de David le 2026-09-03 : une seconde porte depuis la Forge.* On y
     * regarde un pilote **choisi dans une liste**, qui n'est pas forcement celui
     * de la partie en cours — et ouvrir le bestiaire d'un autre jeu que celui
     * qu'on a sous les yeux serait le genre de discordance qu'on ne remarque
     * qu'apres avoir fabrique trois adversaires injouables.
     */
    jeuDemande?: string;
}

type Source = { genre: 'archetype'; id: string } | { genre: 'gabarit'; id: string };

export const AtelierDesAdversaires: React.FC<Props> = ({ onClose, jeuDemande }) => {
    const {
        getActiveDriver, customGameDrivers, customSheetTemplates, addEntity, activeCampaignId,
    } = useSessionOSStore();
    const addCombatant = useCombatStore(e => e.addCombatant);
    const {
        gabaritsDuJeu, enregistrer, oublier, renommer, retenirLaRepartition, repartitionRetenue,
    } = useBestiaireStore();

    /*
      Le pilote demande l'emporte sur celui de la campagne — et il se resout
      dans la liste COMPLETE, references comprises : la Forge en montre dix, et
      seuls les pilotes forges vivent dans `customGameDrivers`.
    */
    const driver = jeuDemande
        ? tousLesPilotes(customGameDrivers ?? []).find(d => d.id === jeuDemande) ?? getActiveDriver()
        : getActiveDriver();
    const jeuId = driver?.id ?? 'sans-pilote';

    /** Les champs de la fiche du jeu — la seule source des échelles. */
    const champs: SheetField[] = useMemo(() => {
        const tous = [...DEFAULT_SHEET_TEMPLATES, ...(customSheetTemplates || [])];
        const gabarit = tous.find(t => t.id === driver?.templateId);
        return gabarit ? gabarit.sections.flatMap(s => s.fields) : [];
    }, [driver?.templateId, customSheetTemplates]);

    const gabarits = gabaritsDuJeu(jeuId);

    const [source, setSource] = useState<Source>({ genre: 'archetype', id: 'brute' });
    const [rangId, setRangId] = useState('pietaille');
    /*
      ⛔ **Le nombre porte desormais QUI l'a decide.** Il etait un simple entier,
      et le selecteur de rang le reecrivait a chaque changement : David saisissait
      1, choisissait « Aguerri », et deux tireurs arrivaient — voir
      `logic/nombreDExemplaires.ts`.
    */
    const [exemplaires, setExemplaires] = useState({ nombre: 1, choisiParLeMeneur: false });
    const nombre = exemplaires.nombre;
    const [nom, setNom] = useState('');
    const [onglet, setOnglet] = useState<'fabriquer' | 'bestiaire'>('fabriquer');
    /** Le gabarit en cours de renommage, et le nom qu'on lui tape. */
    const [renommage, setRenommage] = useState<{ id: string; nom: string } | null>(null);
    const [graine, setGraine] = useState(() => Math.floor(Math.random() * 1e9));

    const archetypeCourant = archetypeParId(
        source.genre === 'archetype' ? source.id : gabarits.find(g => g.id === source.id)?.archetypeId,
    );

    /* La répartition : celle que le meneur a retenue, sinon la proposition. */
    const [repartition, setRepartition] = useState(() =>
        repartitionRetenue(jeuId, archetypeCourant.id) ?? proposerLesChamps(archetypeCourant, champs));

    const changerDArchetype = (prochain: Source) => {
        setSource(prochain);
        const archetype = archetypeParId(
            prochain.genre === 'archetype' ? prochain.id : gabarits.find(g => g.id === prochain.id)?.archetypeId,
        );
        setRepartition(repartitionRetenue(jeuId, archetype.id) ?? proposerLesChamps(archetype, champs));
        if (prochain.genre === 'gabarit') {
            const gabarit = gabarits.find(g => g.id === prochain.id);
            if (gabarit) {
                setRangId(gabarit.rangId);
                setNom(gabarit.nom);
            }
        }
    };

    /** Bascule un champ entre favorisé, négligé et neutre. */
    const basculerLeChamp = (champId: string) => {
        const prochaine = { favorises: [...repartition.favorises], negliges: [...repartition.negliges] };
        if (prochaine.favorises.includes(champId)) {
            prochaine.favorises = prochaine.favorises.filter(c => c !== champId);
            prochaine.negliges.push(champId);
        } else if (prochaine.negliges.includes(champId)) {
            prochaine.negliges = prochaine.negliges.filter(c => c !== champId);
        } else {
            prochaine.favorises.push(champId);
        }
        setRepartition(prochaine);
        retenirLaRepartition(jeuId, archetypeCourant.id, prochaine);
    };

    /**
     * Valide un renommage — et **dit pourquoi** quand il est refuse.
     *
     * Le magasin rend un verdict plutot qu'un booleen : « ca n'a pas marche »
     * ne suffit pas a un ecran. Un nom deja pris est refuse et non absorbe,
     * sans quoi l'autre gabarit disparaitrait en silence.
     */
    const validerLeRenommage = () => {
        if (!renommage) return;
        const verdict = renommer(renommage.id, renommage.nom);
        if (verdict === 'ok') {
            setRenommage(null);
            return;
        }
        gmToast(
            verdict === 'nom-pris' ? 'Un gabarit de ce jeu porte deja ce nom.'
                : verdict === 'nom-vide' ? 'Un gabarit sans nom ne se retrouve pas.'
                    : 'Ce gabarit n’existe plus.',
            'error',
        );
    };

    /** Fabrique un exemplaire. Le gabarit du bestiaire, s'il y en a un, fait foi. */
    const fabriquerUn = (index: number) => {
        const gabarit = source.genre === 'gabarit' ? gabarits.find(g => g.id === source.id) : undefined;
        const fabrique = fabriquer({
            champs, repartition, archetypeId: archetypeCourant.id, rangId,
            hasard: hasardDeGraine(graine + index * 7919),
        });

        /*
          **Le gabarit passe par-dessus la fabrique, champ par champ.** C'est la
          réponse à « une combinaison des deux » : ce que David a saisi est une
          décision, ce que la fabrique tire est un remplissage. *Une décision
          passe devant un tirage* — et les champs qu'il n'a pas renseignés sont
          quand même remplis, au lieu de rester à zéro.
        */
        const sheetData = gabarit ? { ...fabrique.sheetData, ...gabarit.sheetData } : fabrique.sheetData;
        return { sheetData, fabrique, gabarit };
    };

    const apercu = useMemo(() => fabriquerUn(0), [source, rangId, repartition, graine, champs, gabarits]);

    const nomDeBase = nom.trim()
        || (source.genre === 'gabarit' ? gabarits.find(g => g.id === source.id)?.nom : '')
        || `${archetypeCourant.nom} (${rangParId(rangId).nom})`;

    const envoyerAuCombat = () => {
        for (let i = 0; i < nombre; i++) {
            const { sheetData } = fabriquerUn(i);
            addCombatant({
                name: nommerLExemplaire(nomDeBase, i, nombre),
                init: 0,
                isPlayer: false,
                faction: 'enemy',
                statuses: [],
                sheetData,
                healthSystem: HealthInterpreter.createDefault(driver?.combat?.defaultHealthType ?? 'hp'),
                /* Pour que sa fiche sache le ranger au bestiaire plus tard. */
                origineFabriquee: { archetypeId: archetypeCourant.id, rangId },
                roleplayingNotes: source.genre === 'gabarit'
                    ? gabarits.find(g => g.id === source.id)?.notes ?? ''
                    : archetypeCourant.resume,
            });
        }
        gmToast(`${nombre} adversaire(s) dans l’ordre du tour`, 'success');
        onClose();
    };

    const garderDansLaCampagne = () => {
        if (!activeCampaignId) {
            gmToast('Aucune campagne ouverte : rien où les ranger.', 'error');
            return;
        }
        for (let i = 0; i < nombre; i++) {
            const { sheetData } = fabriquerUn(i);
            const depart = santeDeDepart(
                driver?.combat?.santeDeDepart,
                champ => valeurDuChamp(sheetData, champ),
            ) ?? 10;

            addEntity({
                name: nommerLExemplaire(nomDeBase, i, nombre),
                type: 'monster',
                role: 'hostile',
                status: 'alive',
                avatar: '',
                hp: depart,
                maxHp: depart,
                ac: 0,
                speed: 0,
                initiative: 0,
                description: archetypeCourant.resume,
                roleplayingNotes: '',
                gmSecretInfo: `Fabriqué par l’atelier — ${archetypeCourant.nom}, ${rangParId(rangId).nom}.`,
                linkedMapIds: [],
                campaignId: activeCampaignId,
                templateId: driver?.templateId,
                sheetData,
                healthSystem: HealthInterpreter.createDefault(driver?.combat?.defaultHealthType ?? 'hp'),
            });
        }
        gmToast(`${nombre} PNJ ajouté(s) à la campagne`, 'success');
        onClose();
    };

    const rangerAuBestiaire = () => {
        if (!nom.trim()) {
            gmToast('Donne-lui un nom avant de le ranger.', 'error');
            return;
        }
        enregistrer({
            jeuId, nom: nom.trim(), archetypeId: archetypeCourant.id, rangId,
            sheetData: apercu.sheetData,
            notes: archetypeCourant.resume,
        });
        gmToast(`« ${nom.trim()} » est au bestiaire`, 'success');
    };

    if (!driver) {
        return (
            <div className="p-10 text-center space-y-3">
                <Swords className="w-14 h-14 mx-auto text-slate-700 opacity-20" />
                <p className="text-slate-400 font-medium">Aucun système de jeu actif.</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                    L’atelier tire les caractéristiques dans l’échelle du jeu : sans pilote, il n’a pas d’échelle.
                </p>
            </div>
        );
    }

    const champsChiffres = champs.filter(c => ['number', 'gauge', 'rating', 'select'].includes(c.type));

    const puce = (champ: SheetField) => {
        const favorise = repartition.favorises.includes(champ.id);
        const neglige = repartition.negliges.includes(champ.id);
        return (
            <button
                key={champ.id}
                onClick={() => basculerLeChamp(champ.id)}
                title="Favorisé → négligé → neutre"
                className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter border transition-all ${favorise
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : neglige
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        : 'bg-app-bg border-app-border/50 text-slate-600 hover:text-slate-400'}`}
            >
                {favorise && '▲ '}{neglige && '▼ '}{champ.label}
            </button>
        );
    };

    return (
        <div className="flex flex-col h-full max-h-[80vh] text-app-text">
            <div className="flex items-center justify-between px-5 py-3 border-b border-app-border/50">
                <div className="flex items-center gap-2">
                    <Swords size={16} className="text-accent" />
                    <h2 className="text-sm font-black uppercase tracking-widest">Atelier des adversaires</h2>
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{driver.name}</span>
                </div>
                <button onClick={onClose} className="text-slate-500 hover:text-app-text transition-colors">
                    <X size={18} />
                </button>
            </div>

            {/*
              **Deux onglets, et non deux ecrans.** Le bestiaire n'existe que
              pour alimenter la Fabrique : lui donner un module a lui, dans la
              barre laterale, ferait un ecran qu'on n'ouvre jamais et qui
              vieillit mal. Il vit donc la ou il sert.
            */}
            <div className="flex gap-1 px-5 pt-3">
                {([['fabriquer', 'Fabriquer', Wand2], ['bestiaire', 'Bestiaire', BookMarked]] as const).map(
                    ([id, libelle, Icone]) => (
                        <button
                            key={id}
                            onClick={() => setOnglet(id)}
                            className={`px-3 py-1.5 rounded-t-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 border-b-2 ${onglet === id
                                ? 'text-accent border-accent'
                                : 'text-slate-600 border-transparent hover:text-slate-400'}`}
                        >
                            <Icone size={12} /> {libelle}
                            {id === 'bestiaire' && gabarits.length > 0 && (
                                <span className="font-mono opacity-60">{gabarits.length}</span>
                            )}
                        </button>
                    ),
                )}
            </div>

            {onglet === 'bestiaire' && (
                <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
                    {gabarits.length === 0 ? (
                        <div className="text-center py-10 space-y-2">
                            <BookMarked className="w-12 h-12 mx-auto text-slate-700 opacity-20" />
                            <p className="text-slate-400 text-sm">Aucun gabarit pour {driver.name}.</p>
                            <p className="text-[10px] text-slate-600 uppercase tracking-widest max-w-sm mx-auto">
                                Fabriquez un adversaire qui vous plaît, puis « Au bestiaire » —
                                ici ou depuis sa fiche en plein combat. Le bestiaire appartient
                                au jeu : celui d’un autre système ne s’affiche pas ici.
                            </p>
                        </div>
                    ) : gabarits.map(g => {
                        const enRenommage = renommage?.id === g.id;
                        return (
                            <article key={g.id} className="p-3 rounded-xl bg-app-bg/40 border border-app-border/50 space-y-2">
                                <div className="flex items-center gap-2">
                                    {enRenommage ? (
                                        <input
                                            autoFocus
                                            value={renommage.nom}
                                            onChange={e => setRenommage({ id: g.id, nom: e.target.value })}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') validerLeRenommage();
                                                if (e.key === 'Escape') setRenommage(null);
                                            }}
                                            className="flex-1 bg-app-surface border border-accent/40 rounded-lg px-2 py-1 text-sm font-black"
                                        />
                                    ) : (
                                        <h4 className="flex-1 text-sm font-black text-app-text truncate">{g.nom}</h4>
                                    )}

                                    <button
                                        onClick={() => (enRenommage ? validerLeRenommage() : setRenommage({ id: g.id, nom: g.nom }))}
                                        title={enRenommage ? 'Valider' : 'Renommer'}
                                        className="p-1.5 rounded-lg text-slate-600 hover:text-accent transition-colors"
                                    >
                                        {enRenommage ? <Check size={13} /> : <Pencil size={13} />}
                                    </button>
                                    <button
                                        onClick={() => oublier(g.id)}
                                        title="Oublier ce gabarit"
                                        className="p-1.5 rounded-lg text-slate-700 hover:text-rose-400 transition-colors"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>

                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                                    {archetypeParId(g.archetypeId).nom} · {rangParId(g.rangId).nom}
                                </p>

                                {/* Les valeurs saisies, celles qui passeront par-dessus le tirage. */}
                                <div className="grid grid-cols-3 gap-x-4 gap-y-0.5">
                                    {champsChiffres
                                        .filter(champ => g.sheetData[champ.id] !== undefined && g.sheetData[champ.id] !== '')
                                        .map(champ => (
                                            <div key={champ.id} className="flex items-baseline justify-between gap-2">
                                                <span className="text-[10px] text-slate-500 truncate">{champ.label}</span>
                                                <span className="text-[11px] font-black font-mono text-app-text">
                                                    {String(g.sheetData[champ.id])}
                                                </span>
                                            </div>
                                        ))}
                                </div>

                                {g.notes && <p className="text-[10px] text-slate-500 italic">{g.notes}</p>}

                                <button
                                    onClick={() => { changerDArchetype({ genre: 'gabarit', id: g.id }); setOnglet('fabriquer'); }}
                                    className="w-full mt-1 px-3 py-1.5 rounded-lg border border-app-border/50 text-slate-400 hover:text-accent hover:border-accent/40 transition-all text-[9px] font-black uppercase tracking-widest"
                                >
                                    Fabriquer depuis celui-ci
                                </button>
                            </article>
                        );
                    })}
                </div>
            )}

            {onglet === 'fabriquer' && (
            <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
                {/* La source : un archétype, ou un gabarit déjà rangé */}
                <section className="space-y-2">
                    <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-1.5">
                        <Wand2 size={11} /> Fabriquer depuis un archétype
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                        {ARCHETYPES.map(a => (
                            <button
                                key={a.id}
                                onClick={() => changerDArchetype({ genre: 'archetype', id: a.id })}
                                title={a.resume}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter border transition-all ${source.genre === 'archetype' && source.id === a.id
                                    ? 'bg-accent/10 border-accent/30 text-accent'
                                    : 'bg-app-surface/50 border-transparent text-slate-500 hover:text-slate-300'}`}
                            >
                                {a.nom}
                            </button>
                        ))}
                    </div>
                    <p className="text-[10px] text-slate-500 italic">{archetypeCourant.resume}</p>
                </section>

                {/*
                  **Ces puces ne font pas double emploi avec l'onglet Bestiaire.**
                  Un sélecteur n'est pas une bibliothèque : ici on choisit une
                  source sans quitter le flux de fabrication ; là-bas on relit,
                  on renomme, on jette. Les deux montrent la même liste parce
                  qu'ils servent deux gestes différents.
                */}
                {gabarits.length > 0 && (
                    <section className="space-y-2">
                        <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-1.5">
                            <BookMarked size={11} /> Ou reprendre du bestiaire
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                            {gabarits.map(g => (
                                <div key={g.id} className="flex items-center">
                                    <button
                                        onClick={() => changerDArchetype({ genre: 'gabarit', id: g.id })}
                                        className={`px-3 py-1.5 rounded-l-xl text-[10px] font-black uppercase tracking-tighter border transition-all ${source.genre === 'gabarit' && source.id === g.id
                                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                            : 'bg-app-surface/50 border-transparent text-slate-500 hover:text-slate-300'}`}
                                    >
                                        {g.nom}
                                    </button>
                                    <button
                                        onClick={() => oublier(g.id)}
                                        title="Oublier ce gabarit"
                                        className="px-1.5 py-1.5 rounded-r-xl border border-transparent bg-app-surface/50 text-slate-700 hover:text-rose-400 transition-colors"
                                    >
                                        <Trash2 size={11} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Ce que l'atelier a compris des champs du jeu */}
                <section className="space-y-2">
                    <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                        Ce qu’il pousse et ce qu’il néglige
                    </h3>
                    <div className="flex flex-wrap gap-1.5">{champsChiffres.map(puce)}</div>
                    <p className="text-[9px] text-slate-600 italic">
                        Proposé d’après les libellés du jeu — clique pour corriger, ton choix est retenu.
                    </p>
                </section>

                {/* Rang, nombre, nom */}
                <section className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Rang</label>
                        <select
                            value={rangId}
                            onChange={e => {
                                setRangId(e.target.value);
                                setExemplaires(etat => nombreApresChangementDeRang(etat, e.target.value));
                            }}
                            className="w-full bg-app-surface border border-app-border rounded-lg p-2 text-xs font-bold"
                        >
                            {RANGS.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex items-baseline justify-between gap-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Combien</label>
                            {/*
                              La suggestion du rang reste offerte, mais elle ne
                              s'applique plus toute seule des que le meneur a
                              tranche : on n'enleve pas la commodite, on lui
                              retire le droit de decider.
                            */}
                            {exemplaires.choisiParLeMeneur
                                && exemplaires.nombre !== rangParId(rangId).nombreSuggere && (
                                <button
                                    onClick={() => setExemplaires(reprendreLaSuggestion(rangId))}
                                    className="text-[9px] font-black uppercase tracking-tighter text-slate-600 hover:text-accent transition-colors"
                                    title="Reprendre le nombre suggere par le rang"
                                >
                                    ↺ {rangParId(rangId).nombreSuggere}
                                </button>
                            )}
                        </div>
                        <input
                            type="number" min={NOMBRE_MIN} max={NOMBRE_MAX} value={nombre}
                            onChange={e => setExemplaires(nombreSaisi(parseInt(e.target.value, 10)))}
                            className="w-full bg-app-surface border border-app-border rounded-lg p-2 text-xs font-bold"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Nom</label>
                        <input
                            value={nom} onChange={e => setNom(e.target.value)}
                            placeholder={nomDeBase}
                            className="w-full bg-app-surface border border-app-border rounded-lg p-2 text-xs font-bold"
                        />
                    </div>
                </section>

                {/* L'aperçu : le PREMIER exemplaire, pas une moyenne */}
                <section className="space-y-2 p-3 rounded-xl bg-app-bg/40 border border-app-border/50">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                            Aperçu — {nommerLExemplaire(nomDeBase, 0, nombre)}
                        </h3>
                        <button
                            onClick={() => setGraine(Math.floor(Math.random() * 1e9))}
                            className="text-[9px] font-black uppercase tracking-widest text-accent hover:underline"
                        >
                            ↻ Relancer
                        </button>
                    </div>
                    <div className="grid grid-cols-3 gap-x-4 gap-y-1">
                        {champsChiffres.map(champ => (
                            <div key={champ.id} className="flex items-baseline justify-between gap-2">
                                <span className="text-[10px] text-slate-500 truncate">{champ.label}</span>
                                <span className="text-xs font-black font-mono text-app-text">
                                    {String(apercu.sheetData[champ.id] ?? '—')}
                                </span>
                            </div>
                        ))}
                    </div>
                    {apercu.fabrique.pointsForts.length > 0 && (
                        <p className="text-[10px] text-emerald-400/80 italic">
                            Fort en : {apercu.fabrique.pointsForts.join(', ')}
                        </p>
                    )}
                    {apercu.fabrique.pointsFaibles.length > 0 && (
                        <p className="text-[10px] text-rose-400/70 italic">
                            Faible en : {apercu.fabrique.pointsFaibles.join(', ')}
                        </p>
                    )}
                    {apercu.gabarit && (
                        <p className="text-[9px] text-amber-400/70 italic">
                            Les valeurs saisies dans « {apercu.gabarit.nom} » passent par-dessus le tirage.
                        </p>
                    )}
                </section>
            </div>
            )}

            <div className="p-4 border-t border-app-border/50 flex items-center gap-2">
                <button
                    onClick={rangerAuBestiaire}
                    className="px-3 py-2.5 rounded-xl border border-app-border/50 text-slate-400 hover:text-amber-400 hover:border-amber-500/30 transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"
                >
                    <Save size={12} /> Au bestiaire
                </button>
                <div className="flex-1" />
                <button
                    onClick={garderDansLaCampagne}
                    className="px-4 py-2.5 rounded-xl border border-app-border/50 text-slate-300 hover:border-accent/40 hover:text-accent transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"
                >
                    <Users size={12} /> Garder dans la campagne
                </button>
                <button
                    onClick={envoyerAuCombat}
                    className="px-4 py-2.5 rounded-xl bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"
                >
                    <Swords size={12} /> Envoyer au combat
                </button>
            </div>
        </div>
    );
};

export default AtelierDesAdversaires;
