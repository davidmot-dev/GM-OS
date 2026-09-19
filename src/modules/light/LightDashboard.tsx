import React, { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopControls } from './components/TopControls';
import { SceneGrid } from './components/SceneGrid';
import { BulbFooter } from './components/BulbFooter';
import { useLightStore } from './useLightStore';
import { useSessionOSStore } from '../session/useSessionOSStore';

const LightDashboard: React.FC = () => {
    const { status } = useLightStore();
    const campagneId = useSessionOSStore(s => s.activeCampaignId);

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
      ⛔ **`grid-rows-1` n'est pas décoratif — c'est le correctif.**

      Sans lui, la rangée est en `auto` : elle se règle sur **le plus grand de
      ses deux enfants**. Le panneau de gauche, qui ne défilait pas, imposait
      donc sa hauteur au `<main>` d'à côté — et le pied de page des lampes
      passait **sous la ligne de flottaison**, coupé par l'`overflow-hidden` du
      châssis.

      David, le 2026-09-17, sur un écran 2880×1800 à 200 % — soit 1440×900
      points pour l'application : *« je ne vois plus mes lumières »*. Elles
      n'étaient pas perdues, elles étaient en dessous de l'écran.

      `grid-rows-1` vaut `minmax(0, 1fr)` : la rangée fait exactement la hauteur
      disponible, et aucun enfant ne peut plus la pousser. *Une hauteur qui se
      règle sur son contenu n'est pas une hauteur, c'est une promesse que le
      contenu tiendra.*
    */
    return (
        <div className="grid grid-cols-12 grid-rows-1 h-full bg-app-bg text-app-text font-sans overflow-hidden">
            <Sidebar />

            <main className="col-span-9 min-h-0 flex flex-col overflow-hidden relative">
                {/* Background glow base */}
                <div className="absolute inset-0 bg-gradient-to-br from-app-surface/50 via-app-bg to-app-bg opacity-50 pointer-events-none" />

                <TopControls />
                <SceneGrid />
                <BulbFooter />
            </main>
        </div>
    );
};

export default LightDashboard;
