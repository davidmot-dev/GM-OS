import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChecklistItem {
    id: string;
    label: string;
    checked: boolean;
}

export interface PlayerCharacter {
    id: string;
    name: string;
    role: string;
    avatar: string;
    hp: number;
    hpMax: number;
    conditions: string[];
}

export interface JournalEntry {
    id: string;
    title: string;
    content: string;
    timestamp: number;
    isPublic: boolean;
    author: string;
}

interface SessionState {
    campaignName: string;
    campaignStatus: string;
    sessionNumber: number;
    sessionMax: number;

    checklist: ChecklistItem[];
    toggleChecklist: (id: string) => void;

    publicSummary: string;
    setPublicSummary: (text: string) => void;

    gmSecrets: string;
    setGmSecrets: (text: string) => void;

    journal: JournalEntry[];
    addJournalEntry: (entry: JournalEntry) => void;

    party: PlayerCharacter[];
    updatePlayerHp: (id: string, hp: number) => void;
    healParty: () => void;
    setCampaignName: (name: string) => void;
}

export const useSessionOSStore = create<SessionState>()(
    persist(
        (set) => ({
            campaignName: 'The Eternal Quest',
            campaignStatus: 'Active Campaign',
            sessionNumber: 4,
            sessionMax: 12,

            checklist: [
                { id: '1', label: 'Review map coordinates', checked: true },
                { id: '2', label: 'Audit NPC stat blocks', checked: true },
                { id: '3', label: 'Set atmospheric lighting', checked: false },
                { id: '4', label: 'Queue combat soundtrack', checked: false }
            ],

            toggleChecklist: (id) => set((state) => ({
                checklist: state.checklist.map(item =>
                    item.id === id ? { ...item, checked: !item.checked } : item
                )
            })),

            publicSummary: "The party has arrived at the gates of Ironhelm Fortress. The guards seem uneasy about the heavy mist rolling in from the Forbidden Peaks.\n\nCurrently meeting with Captain Varick to discuss the recent disappearances near the old well.\n\n- Objective: Infiltrate the fortress\n- Clue found: Silver pendant with a raven",
            setPublicSummary: (text) => set({ publicSummary: text }),

            gmSecrets: "Captain Varick is actually a Doppelganger working for the Cult of the Pale Moon. He will try to separate the Cleric from the group.\n\nThe mist contains Spectral Ghouls (Challenge Rating 5). If the party stays outside for more than 1 hour, initiate the 'Ambush' event.\n\nTRIGGER:\nWhen the Rogue opens the silver chest, roll 1d20 for DC 18 Dexterity Save or trigger a Cloudkill trap.",
            setGmSecrets: (text) => set({ gmSecrets: text }),

            journal: [],
            addJournalEntry: (entry) => set((state) => ({ journal: [entry, ...state.journal] })),

            party: [
                { id: 'p1', name: 'Drogthar', role: 'Warrior', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC7Ly-KWdINIXSLb_hnmp8A-gZLcn5zLhr5yt8wcjUg8SQohiI1ylzS6Cd9cFmeaq0DGVGJ3qV2Dp4vBPZY7hpPaBwbfZqRY8ZSfDRCI9A0YUfzBFQ2VCiVGc23hciaWsOSJQnVVEnwpWd73CmqXCB5wLaBSIk20LPHnKjgO8m4xJ41FXa4Stpvh3KNobTSrWXB30YOCCyaDmvwqEr-k2yBXMK2-JFJk2R9CdbWdRKdYPoBLCOhSM3JkFsvIhCTDJhky2aWgJTcFRc', hp: 45, hpMax: 50, conditions: ['Inspired'] },
                { id: 'p2', name: 'Lyra', role: 'Mage', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCBTyI7J_D8D-GO4ooijVdZViAJpDNTgm07YBeKcBQgciteqTrXl9vKtVo2INKWZcf84gisyID6cW7uwbwKdiwmu1K08T_Tyhrs-VeMudTuhDWwhEvGWOBPXIM6IRkKXiXjZ3eS7_vDAJ4ZES3zv0M0PrfmrZMWnXyZ1TmknmnruVfU9V-7JFVvykUur_1xE-bG5_WChJfdy2PINkiXggTTb0-wG5PqeyyQ4YQ-9z8p8LiFKtdmtYoKtjps6ePefI55z-7oK2OXG10', hp: 20, hpMax: 30, conditions: ['Blinded'] },
                { id: 'p3', name: 'Elara', role: 'Rogue', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuANXovZVG56CIZEr9tdrW6SYp6Bw6vH-bkwRMJ4HEGbS_vJsTnrJFJzqtQ3TV7cEwLwpfpGUj4BCugeug1uW6ZfIS4v_pgR-_wf3AtdFbu_m7e-WJO85LBeP938Sdy49o2PWIGIMjRpJldohOiY1E_GT4SJEOKERuQr_yZMIlukB8h0WpssLmic1_5338kVU5KpfMjKpPTiaQPb6a-NYxd4YsSjtg_9Y5N4m_EK7ENDbDlRva2Ltl2t8aHaHqv0fQK_1aMOLo2lxIY', hp: 12, hpMax: 35, conditions: ['Fear'] },
                { id: 'p4', name: 'Kael', role: 'Cleric', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2UuEcnNO7cWviHYN4QuSbMycNRmu3PqaYZQBaCeRZRkW0263XO4Ch0qkrWqacSaAhIBEjZBuKDa-EabuAVKZTBagu8psUp0WcruTx_eWIsw5oYw8-DxntYplI4NfEa9bn41JPnM-Lrmmn3vi5NHykl_Re4hQwqmS1MKy371RYCcW1NPHJUxxsETklobi_7yaGByibduzihqh3QnTDryJor79YR3bSE_TV04UeJ3pmLkdP4Vm9gGQCz2hGUlfo_0-ohRiAbDbV-Hg', hp: 40, hpMax: 40, conditions: [] }
            ],

            updatePlayerHp: (id, hp) => set((state) => ({
                party: state.party.map(p => p.id === id ? { ...p, hp } : p)
            })),

            healParty: () => set((state) => ({
                party: state.party.map(p => ({ ...p, hp: p.hpMax }))
            })),

            setCampaignName: (name) => set({ campaignName: name })
        }),
        {
            name: 'gmos-session-storage'
        }
    )
);
