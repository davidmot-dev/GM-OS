import React, { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopControls } from './components/TopControls';
import { SceneGrid } from './components/SceneGrid';
import { BulbFooter } from './components/BulbFooter';
import { useLightStore } from './useLightStore';
import { hueEngine } from './HueEngine';

const LightDashboard: React.FC = () => {
    const { status, bridgeIp, username } = useLightStore();

    // Auto-connect on mount if we have saved credentials
    useEffect(() => {
        if (status === 'disconnected' && bridgeIp && username) {
            useLightStore.getState().setConnection('connected');
            hueEngine.fetchLights().catch(() => {
                useLightStore.getState().setConnection('disconnected');
            });
        } else if (status === 'connected' && bridgeIp) {
            hueEngine.fetchLights().catch(() => {
                useLightStore.getState().setConnection('disconnected');
            });
        }
    }, [status, bridgeIp, username]);

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


    return (
        <div className="grid grid-cols-12 h-full bg-slate-950 text-slate-100 font-sans overflow-hidden">
            <Sidebar />

            <main className="col-span-9 flex flex-col overflow-hidden relative">
                {/* Background glow base */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 opacity-50 pointer-events-none" />

                <TopControls />
                <SceneGrid />
                <BulbFooter />
            </main>
        </div>
    );
};

export default LightDashboard;
