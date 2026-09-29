import { useEffect, useRef } from 'react';
import { jeuDeLaCampagneActive } from './jeuDeLaCampagne';
import { useSessionStore } from '../store/useSessionStore';
import { useSessionOSStore } from '../modules/session/useSessionOSStore';
import { appliquerLeTheme, type ThemeDuJeuApplique } from './themeDeLInterface';
import type { ThemeDuJeuCharge } from './themeDuJeu';
import {
    chargerLeThemeDuJeu, pontVersLInterface, poserLesPolices, verifierLesPolices,
} from './themeDuJeu';

/**
 * **L'interface suit le jeu de la campagne ouverte.**
 *
 * Le dernier maillon : la campagne dit son système, `resoudreCorpus` dit son
 * dossier, et `docs/systems/<jeu>/theme/theme.css` dit sa peau — s'il existe.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * AJOUTER UN THÈME = DÉPOSER UN FICHIER
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Rien ici ne connaît la liste des jeux. Aucun registre à compléter, aucun
 * `switch`, aucune recompilation : le dossier du système est déjà rapproché du
 * pilote par `resoudreCorpus` — y compris quand l'identifiant du pilote est un
 * horodatage fabriqué par la Forge, ce qui est le cas de tous les pilotes de
 * David sauf Dune.
 *
 * *C'était l'exigence de départ, et c'est elle qui a décidé de tout le reste.*
 */
export function useThemeDuJeu(): void {
    const theme = useSessionStore(s => s.theme);
    const themeColor = useSessionStore(s => s.themeColor);
    const personnalites = useSessionStore(s => s.personnalites);
    const activeCampaignId = useSessionOSStore(s => s.activeCampaignId);

    /*
      **Le thème du jeu survit aux changements d'accent.** Sans ce garde-fou, un
      clic sur une pastille de couleur relancerait la lecture du disque et
      repeindrait l'interface le temps d'un aller-retour. On ne relit que quand
      la campagne change.
    */
    const releveDuJeu = useRef<ThemeDuJeuCharge | null>(null);
    /*
      **Le pont se recalcule, le disque ne se relit pas** (P1.7) : allumer les
      personnalités ouvre au jeu des jetons qu'il déclarait déjà. Le relevé
      suffit ; seul le choix de ce qu'on en retient change.
    */
    const duJeu = (allumees: boolean): ThemeDuJeuApplique | undefined => {
        const releve = releveDuJeu.current;
        return releve
            ? { variables: pontVersLInterface(releve.jetons, { personnalites: allumees }), jetons: releve.jetons, clarte: releve.clarte }
            : undefined;
    };
    const campagneLue = useRef<string | null>(null);

    // 1. La campagne change : on va voir si son jeu a une peau.
    useEffect(() => {
        let annule = false;

        const relire = async () => {
            /*
              **La résolution du dossier vit dans `jeuDeLaCampagne`** depuis le
              2026-09-03 : l'atelier de thème a besoin de la même réponse, et
              deux endroits qui résolvent le même dossier finissent par ne plus
              le résoudre pareil.
            */
            const jeu = await jeuDeLaCampagneActive(activeCampaignId ?? null);
            if (annule) return;

            if (!jeu) {
                releveDuJeu.current = null;
                campagneLue.current = null;
                poserLesPolices([]);
                appliquerLeTheme(theme, themeColor, undefined, { personnalites });
                return;
            }

            const releve = await chargerLeThemeDuJeu(jeu.racine);
            if (annule) return;

            releveDuJeu.current = releve;
            campagneLue.current = activeCampaignId ?? null;

            /*
              **Dire ce qu'on a retenu.** Un thème qui ne s'applique pas se
              cherche autrement pendant une heure : la règle du journal de
              l'Oracle vaut ici aussi. Un jeu sans peau est le cas NORMAL et
              reste silencieux — *un absent silencieux, un incident bruyant.*
            */
            if (releve) {
                console.info(
                    `[ThèmeDuJeu] « ${jeu.campagne} » → docs/${jeu.racine}/theme/theme.css ` +
                    `(${Object.keys(releve.jetons).length} jetons, ${releve.clarte ?? 'polarité non déclarée'})`,
                );
            }

            /*
              **Les polices AVANT le thème.** La feuille se télécharge en
              parallèle du rendu ; la poser d'abord évite qu'on voie le texte
              basculer d'un repli vers la vraie police une fois la couleur déjà
              changée.
            */
            poserLesPolices(releve?.polices ?? []);
            appliquerLeTheme(theme, themeColor, duJeu(personnalites), { personnalites });

            /*
              Et on dit si elles ne sont pas arrivées. Une police absente ne
              lève pas : le navigateur prend le repli suivant, et le thème
              paraît appliqué alors que sa typographie ne l'est pas. Hors ligne,
              c'est le cas garanti.
            */
            if (releve) void verifierLesPolices(releve.jetons, { personnalites });
        };

        void relire();
        return () => { annule = true; };
        // `theme` et `themeColor` sont volontairement hors dépendances : ils
        // sont réappliqués par l'effet suivant, sans relire le disque.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeCampaignId]);

    // 2. Le thème d'atelier, l'accent ou les personnalités changent : on repeint, sans relire.
    useEffect(() => {
        appliquerLeTheme(theme, themeColor, duJeu(personnalites), { personnalites });
        if (personnalites && releveDuJeu.current) void verifierLesPolices(releveDuJeu.current.jetons, { personnalites });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [theme, themeColor, personnalites]);
}
