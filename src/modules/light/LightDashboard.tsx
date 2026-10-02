import React, { useEffect } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SceneGrid } from './components/SceneGrid';
import { ReglagesDeLumiere } from './components/ReglagesDeLumiere';
import { BarreDeTransition, BarreDesGestes } from './components/BarresDeLumiere';
import { useLightStore } from './useLightStore';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { useRegimeDInterface } from '../session/hooks/useRegimeDInterface';
import { Bouton, Etiquette, EnTeteDeModule, GabaritDeModule } from '../../components/socle';

/**
 * **Light-OS réagencé — refonte, phase 4, L2, étape 2 (2026-10-02).**
 *
 * La maquette retenue avec Stitch le 2026-09-26 (`documentation/Planning/
 * stitch/lumiere/`), dans la grammaire d'écran commune : l'en-tête, les temps
 * de transition en barre d'outils, **la grille des tuiles au plus large**, les
 * gestes rapides en pied, et à droite le panneau de réglages — le pont, les
 * lampes en liste verticale, l'éclairage normal, la préparation, le blackout.
 *
 * Il répond aux deux plaintes de David : *« la disposition des lampes »* et
 * *« les pads sont trop fournis : difficile de modifier un pad ou même de
 * l'activer »*.
 */
const LightDashboard: React.FC = () => {
    const { status } = useLightStore();
    const campagneId = useSessionOSStore(s => s.activeCampaignId);
    const { t } = useTranslation('modules');
    const regime = useRegimeDInterface();
    const [reglagesOuverts, setReglagesOuverts] = React.useState(true);
    const sceneActive = useLightStore(s => (s.activeSceneId ? s.scenes[s.activeSceneId]?.name : null) ?? null);
    const eclairageNormal = useLightStore(s => (s.defaultSceneId ? s.scenes[s.defaultSceneId]?.name : null) ?? null);

    /*
      **Chaque campagne reçoit ses dix-huit cases à la première ouverture.**

      Ici et pas au démarrage de l'application : à ce moment-là le magasin
      n'a pas fini d'être relu, et garnir un râtelier qu'on n'a pas encore lu
      reviendrait à en fabriquer un deuxième. *Un écran qui s'ouvre est un
      moment où l'on sait ce qu'on a.*

      `garnirLeRatelier` est idempotente : rouvrir Light-OS ne crée rien. Le
      **pot commun** est garni lui aussi — c'est là que vivent les dix-huit
      tuiles d'origine, et une installation neuve doit y trouver ses cases.
    */
    useEffect(() => {
        const { garnirLeRatelier } = useLightStore.getState();
        garnirLeRatelier(null);
        if (campagneId) garnirLeRatelier(campagneId);
    }, [campagneId]);

    // Setup polling for mock lights state if in mock mode to simulate things
    useEffect(() => {
        if (status === 'mock') {
            const mockLights = {
                "1": { id: "1", name: "Main Chandelier", type: "Color", state: { on: true, bri: 254, xy: [0.4, 0.4] as [number, number], effect: 'none' } },
                "2": { id: "2", name: "Corner Lamp L", type: "Color", state: { on: false, bri: 100, xy: [0.1, 0.2] as [number, number], effect: 'none' } },
                "3": { id: "3", name: "Bookcase Accent", type: "Color", state: { on: true, bri: 200, xy: [0.2, 0.6] as [number, number], effect: 'none' } },
                "4": { id: "4", name: "Desk Backlight", type: "Color", state: { on: true, bri: 254, xy: [0.6, 0.3] as [number, number], effect: 'none' } }
            };
            useLightStore.getState().setLights(mockLights);
        } else if (status === 'disconnected') {
            useLightStore.getState().setLights({});
        }
    }, [status]);


    /*
      ⛔ **La hauteur ne se règle plus sur le contenu.** L'ancienne grille à
      deux colonnes avait besoin de `grid-rows-1` pour que le panneau de
      gauche n'impose pas sa hauteur au voisin — sans lui, le pied de page des
      lampes passait sous la ligne de flottaison (David, 2026-09-17 : *« je ne
      vois plus mes lumières »*). Le gabarit commun donne à la zone de travail
      et au panneau de réglages chacun son défilement : les lampes, désormais
      dans le panneau, ne peuvent plus être poussées hors de l'écran.
    */
    return (
        <GabaritDeModule
            aLaTable={regime.aLaTable}
            reglagesOuverts={reglagesOuverts}
            className="text-app-text"
            entete={
                <EnTeteDeModule
                    titre={t('names.light')}
                    etat={<>
                        <Etiquette ton={status === 'connected' ? 'succes' : status === 'mock' ? 'alerte' : 'neutre'}>
                            {t(`light.agencement.pont_${status}`)}
                        </Etiquette>
                        {sceneActive
                            ? <Etiquette ton="accent">{t('light.agencement.scene_active', { nom: sceneActive })}</Etiquette>
                            : <Etiquette>{t('light.agencement.aucune_scene')}</Etiquette>}
                        {eclairageNormal && <Etiquette>{t('light.agencement.eclairage_normal', { nom: eclairageNormal })}</Etiquette>}
                    </>}
                    actions={regime.aLaTable ? (
                        <Bouton aLaTable icone={<SlidersHorizontal size={16} />} aria-pressed={reglagesOuverts} onClick={() => setReglagesOuverts(!reglagesOuverts)}>
                            {t('light.agencement.reglages')}
                        </Bouton>
                    ) : undefined}
                />
            }
            barreDOutils={<BarreDeTransition aLaTable={regime.aLaTable} />}
            reglages={<ReglagesDeLumiere />}
        >
            <div className="flex min-h-full flex-col gap-4">
                <div className="flex-1">
                    <SceneGrid />
                </div>
                <BarreDesGestes />
            </div>
        </GabaritDeModule>
    );
};

export default LightDashboard;
