import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Lightbulb, Play, Check, X, Undo2 } from 'lucide-react';
import { useLightStore } from '../useLightStore';
import { hueEngine } from '../HueEngine';
import { useStoryboardStore } from '../../storyboard/useStoryboardStore';
import { gmToast } from '../../../stores/useToastStore';
import { proposerUneAmbiance, type ScenePourLAmbiance } from '../logic/proposerUneAmbiance';
import { etatsDeLaProposition, lampeDesignee, nomDeLAmbiance, type AmbianceProposee } from '../logic/ambianceProposee';
import { caseLibreDuRatelier } from '../logic/caseLibreDuRatelier';
import { couleurValide } from '../logic/ambianceProposee';

interface Props {
    scene: ScenePourLAmbiance;
    campagneId: string | null;
    /** Le moment déjà rattaché à la scène, s'il y en a un. */
    momentExistantId?: string;
    /** Appelé avec l'identifiant du moment qui porte l'ambiance enregistrée. */
    onRattache: (momentId: string) => void;
}

/**
 * **L'IA propose une ambiance pour une scène — et n'écrit rien tant qu'on n'a
 * pas dit oui.**
 *
 * Demandé par David : *« est-ce qu'on pourrait demander à une IA de conseiller
 * une ambiance quand on prépare une scène dans la trame ? »*
 *
 * ⚠️ **Elle compose, elle ne choisit pas parmi l'existant.** C'est là qu'un
 * modèle vaut quelque chose : trouver une couleur par lampe et un effet parmi
 * quarante-huit. *Avec dix-huit tuiles sous les yeux, « laquelle convient ? »
 * est une question à laquelle le meneur répond déjà d'un coup d'œil.*
 *
 * ⛔ **Rien ne s'allume tout seul.** Une ambiance qui s'appliquerait dans la
 * pièce pendant qu'on prépare une scène — un dimanche après-midi, à côté de
 * quelqu'un qui lit — serait une surprise, pas un service.
 *
 * ⭐ **Mais « Essayer sur les lampes » existe depuis le 2026-09-20**, et il ne
 * contredit pas la règle : c'est un bouton qui dit ce qu'il fait, et la pièce
 * se rend d'un second clic. Ce qu'il remplace : « Enregistrer puis Jouer », qui
 * obligeait à **occuper une case du râtelier pour regarder une ambiance qu'on
 * allait peut-être refuser**.
 */
export const PropositionDAmbiance: React.FC<Props> = ({
    scene, campagneId, momentExistantId, onRattache,
}) => {
    const [enCours, setEnCours] = useState(false);
    const [proposition, setProposition] = useState<AmbianceProposee | null>(null);
    const [caseEcrite, setCaseEcrite] = useState<string | null>(null);
    const [essai, setEssai] = useState(false);

    const lampes = useLightStore(s => s.lights);
    const listeDesLampes = Object.values(lampes);

    /** Les états qu'une proposition commande — une seule façon de les lire. */
    const etatsDe = (p: AmbianceProposee | null) =>
        etatsDeLaProposition(p, lampes, hex => hueEngine.hexToXy(hex));

    /*
      ⛔ **Un essai ne survit pas à l'écran qui l'a lancé.** Fermer la scène
      pendant qu'on essaie laisserait la pièce sur une ambiance que plus aucun
      bouton ne sait défaire — il faudrait un Stop All, qui vise autre chose et
      qui **éteint** quand aucun éclairage normal n'est désigné. *Une porte de
      sortie qui disparaît avec le panneau n'est pas une porte de sortie.*

      Le `ref` existe parce que le nettoyage ne voit que la valeur du rendu où
      il a été posé : sans lui, il croirait toujours qu'aucun essai ne tourne.
    */
    const essaiRef = useRef(false);
    useEffect(() => { essaiRef.current = essai; }, [essai]);
    useEffect(() => () => {
        if (essaiRef.current) void hueEngine.rendreLaPieceApresLEssai();
    }, []);

    const demander = async () => {
        if (enCours) return;
        setEnCours(true);
        setCaseEcrite(null);
        try {
            const nouvelle = await proposerUneAmbiance(scene, listeDesLampes);
            setProposition(nouvelle);
            /* Un essai en cours **suit le panneau** : sinon la pièce montrerait
               la proposition d'avant pendant qu'on lit la nouvelle. */
            if (essaiRef.current) await hueEngine.essayerUneAmbiance(etatsDe(nouvelle));
        } catch (e) {
            /*
              On distingue les deux refus, parce qu'ils appellent deux gestes
              différents : brancher son pont, ou réessayer. *Un message unique
              enverrait le meneur chercher au mauvais endroit.*
            */
            gmToast(
                e instanceof Error && e.message === 'AUCUNE_LAMPE'
                    ? 'Aucune lampe connue : branchez le pont Hue, ou passez Light-OS en mode simulé.'
                    : 'L’IA n’a pas répondu. Réessayez, ou vérifiez le moteur dans les réglages.',
                'error',
            );
        } finally {
            setEnCours(false);
        }
    };

    const enregistrer = () => {
        if (!proposition) return;

        const { scenes, saveSceneSnapshot, updateSceneMetadata } = useLightStore.getState();
        const cible = caseLibreDuRatelier(scenes, campagneId);
        if (!cible) {
            gmToast(
                campagneId
                    ? 'Le râtelier de cette campagne est plein : effacez une tuile dans Light-OS.'
                    : 'Ouvrez une campagne : une ambiance composée se range dans son râtelier.',
                'warning',
            );
            return;
        }

        const etats = etatsDe(proposition);

        /*
          `saveSceneSnapshot` attend des lampes, pas des états : on lui en
          fabrique avec les états proposés. *Un second écrivain de `lightStates`
          serait un second endroit où la forme d'une tuile peut dériver.*
        */
        saveSceneSnapshot(cible, Object.fromEntries(
            Object.entries(etats).map(([id, state]) => [id, { ...lampes[id], state }]),
        ));

        /* La teinte de la tuile : celle de la lampe la plus vive, pour qu'on la
           reconnaisse dans la grille sans la lire. */
        const dominante = [...(proposition.lampes ?? [])]
            .sort((a, b) => (b?.brillance ?? 0) - (a?.brillance ?? 0))
            .map(l => couleurValide(l?.couleur))
            .find(Boolean) ?? '#334155';

        const nom = nomDeLAmbiance(proposition.nom, scene.titre);
        updateSceneMetadata(cible, nom, 'wb_incandescent', dominante);
        useLightStore.getState().assignerLaTuile(cible, campagneId);

        /*
          ⛔ **On complète le moment de la scène, on n'en crée pas un second.**
          Deux moments pour une même scène, ce sont deux portes vers la même
          chose — dont une seule fait entrer les PJ. Ce dépôt a déjà payé ce
          motif.
        */
        const { addMoment, updateMoment } = useStoryboardStore.getState();
        if (momentExistantId) {
            updateMoment(momentExistantId, { lightSceneId: cible });
            onRattache(momentExistantId);
        } else {
            const momentId = addMoment({
                name: nom,
                description: proposition.justification ?? '',
                color: dominante,
                icon: 'Sparkles',
                lightSceneId: cible,
                campaignId: campagneId ?? undefined,
            } as Parameters<typeof addMoment>[0]);
            onRattache(momentId);
        }

        setCaseEcrite(cible);

        /*
          L'essai cesse d'en être un : ce que la pièce montre est maintenant une
          tuile. On la rejoue **sous son identifiant** — la pièce ne change pas
          d'aspect, mais la grille dit enfin la vérité sur ce qui joue, et les
          effets se rattachent à la tuile, donc ses curseurs de vitesse et
          d'intensité les commandent. *Un essai anonyme n'obéit à aucun
          curseur.*
        */
        if (essai) {
            hueEngine.oublierLEssai();
            setEssai(false);
            void hueEngine.applyScene(cible, true);
        }

        gmToast(`« ${nom} » est rangée et rattachée à la scène.`, 'success');
    };

    /** Essayer, ou rendre la pièce — le même bouton, deux états. */
    const basculerLEssai = async () => {
        if (essai) {
            setEssai(false);
            await hueEngine.rendreLaPieceApresLEssai();
            return;
        }
        if (!proposition) return;
        setEssai(true);
        await hueEngine.essayerUneAmbiance(etatsDe(proposition));
    };

    const refuser = () => {
        if (essai) { setEssai(false); void hueEngine.rendreLaPieceApresLEssai(); }
        setProposition(null);
        setCaseEcrite(null);
    };

    /*
      ⛔ **La même règle que le moteur, jamais une seconde.** Le panneau
      comparait les noms à la lettre, le moteur sans espaces ni ponctuation :
      une lampe dont le nom commençait par une espace (2026-09-25)
      s'allumait tout en s'affichant « inconnue, ignorée ». *Un écran qui
      contredit les lampes envoie le meneur chercher une panne qui n'existe pas.*
    */
    const lampeConnue = (nom: string) => lampeDesignee(nom, lampes) !== null;

    return (
        <div className="flex flex-col gap-3">
            <button
                onClick={demander}
                disabled={enCours}
                title="L’IA lit la scène et compose un éclairage, lampe par lampe. Rien n’est écrit ni allumé sans votre accord."
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent/5 hover:bg-accent/20 border border-accent/20 text-accent/80 hover:text-accent transition-all active:scale-95 disabled:opacity-50"
            >
                <Sparkles size={14} className={enCours ? 'animate-pulse' : ''} />
                <span className="text-ui-10 font-bold uppercase tracking-widest leading-none">
                    {enCours ? 'L’IA compose…' : 'Proposer une ambiance'}
                </span>
            </button>

            {proposition && (
                <div className="rounded-xl border border-accent/20 bg-app-bg/40 p-4 flex flex-col gap-3">
                    <div className="flex items-baseline justify-between gap-3">
                        <span className="text-sm font-bold text-app-text">
                            « {nomDeLAmbiance(proposition.nom, scene.titre)} »
                        </span>
                        {/* La pièce a changé : le dire ici, parce que le meneur
                            peut regarder l'écran et non les lampes. */}
                        {essai && (
                            <span className="text-ui-9 font-bold uppercase tracking-widest text-amber-400 animate-pulse shrink-0">
                                essai en cours
                            </span>
                        )}
                        {caseEcrite && !essai && (
                            <span className="text-ui-9 font-bold uppercase tracking-widest text-emerald-400">
                                rangée
                            </span>
                        )}
                    </div>

                    <p className="text-ui-10 text-slate-400 italic leading-snug">
                        {proposition.justification}
                    </p>

                    <div className="flex flex-col gap-1.5">
                        {(proposition.lampes ?? []).map((lampe, i) => (
                            <div key={`${lampe?.lampe}-${i}`} className="flex items-center gap-2.5">
                                <span
                                    className="size-4 rounded shrink-0 border border-white/10"
                                    style={{ backgroundColor: couleurValide(lampe?.couleur) ?? 'transparent' }}
                                />
                                <span className={`text-ui-10 flex-1 truncate ${lampeConnue(lampe?.lampe) ? 'text-app-text/80' : 'text-amber-400'}`}>
                                    {lampe?.lampe}
                                    {/* Une lampe que le pont ne connaît pas sera ignorée : le dire ici
                                        plutôt que de laisser le meneur chercher pourquoi elle reste noire. */}
                                    {!lampeConnue(lampe?.lampe) && ' — inconnue, ignorée'}
                                </span>
                                <span className="text-ui-9 text-slate-500 uppercase tracking-widest">
                                    {lampe?.effet && lampe.effet !== 'none' ? lampe.effet : 'fixe'}
                                </span>
                                <span className="text-ui-9 text-slate-500 w-10 text-right tabular-nums">
                                    {Math.round(lampe?.brillance ?? 0)} %
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                        {caseEcrite ? (
                            <button
                                onClick={() => hueEngine.applyScene(caseEcrite)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent text-white text-ui-10 font-bold uppercase tracking-widest"
                            >
                                <Play size={12} /> Jouer maintenant
                            </button>
                        ) : (
                            <button
                                onClick={enregistrer}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent text-white text-ui-10 font-bold uppercase tracking-widest hover:brightness-110"
                            >
                                <Check size={12} /> Enregistrer
                            </button>
                        )}
                        {!caseEcrite && (
                            <button
                                onClick={basculerLEssai}
                                title={essai
                                    ? 'Remet les lampes comme elles étaient avant l’essai.'
                                    : 'Allume l’ambiance sur vos lampes, sans rien enregistrer.'}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-ui-10 font-bold uppercase tracking-widest border transition-colors ${
                                    essai
                                        ? 'border-amber-400/40 text-amber-400 hover:bg-amber-400/10'
                                        : 'border-accent/30 text-accent/80 hover:text-accent hover:bg-accent/10'
                                }`}
                            >
                                {essai
                                    ? <><Undo2 size={12} /> Revenir</>
                                    : <><Play size={12} /> Essayer</>}
                            </button>
                        )}
                        <button
                            onClick={demander}
                            disabled={enCours}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-400 hover:text-app-text text-ui-10 font-bold uppercase tracking-widest disabled:opacity-40"
                        >
                            <Lightbulb size={12} /> Une autre
                        </button>
                        <button
                            onClick={refuser}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-500 hover:text-red-400 text-ui-10 font-bold uppercase tracking-widest ml-auto"
                        >
                            <X size={12} /> Refuser
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
