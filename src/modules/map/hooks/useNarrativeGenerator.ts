import { useState } from 'react';
import { useMapStore } from '../useMapStore';
import { useCombatStore } from '../../combat/useCombatStore';
import { useJournalStore } from '../../journal/useJournalStore';
import { aiService } from '../../ai/AIService';

export const useNarrativeGenerator = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [lastNarrative, setLastNarrative] = useState<string | null>(null);

    const generateNarrative = async () => {
        const mapStore = useMapStore.getState();
        const combatStore = useCombatStore.getState();
        
        const tokens = mapStore.tokens;
        const weather = mapStore.weatherType !== 'none' ? `${mapStore.weatherType} (intensité ${Math.round(mapStore.weatherIntensity * 100)}%)` : 'Calme';
        const dangerZones = mapStore.dangerZones.map(z => z.name).join(', ');

        // Enrichment with combat data
        const enrichedTokens = tokens.map(token => {
            const combatant = token.linkedCombatantId 
                ? combatStore.combatants.find(c => c.id === token.linkedCombatantId)
                : null;
            
            return {
                name: token.name,
                faction: combatant?.faction || 'neutral',
                hp: combatant ? `${combatant.hp}/${combatant.hpMax}` : 'Inconnu',
                statuses: combatant?.statuses.map(s => s.name).join(', ') || 'Aucun',
                x: token.x,
                y: token.y
            };
        });

        const playerTokens = enrichedTokens.filter(t => t.faction === 'player');
        const enemyTokens = enrichedTokens.filter(t => t.faction === 'enemy');
        const allyTokens = enrichedTokens.filter(t => t.faction === 'ally');
        const neutralTokens = enrichedTokens.filter(t => t.faction === 'neutral');

        const prompt = `
En tant qu'Oracle de GM-OS, génère une description d'ambiance immersive et des conseils tactiques basés sur l'état actuel de la carte tactique.

CONTEXTE ENVIRONNEMENTAL :
- Carte : ${mapStore.mapName || 'Zone inconnue'}
- Météo : ${weather}
- Zones de danger actives : ${dangerZones || 'Aucune'}

FORCES EN PRÉSENCE :
- Héros (PJ) : ${playerTokens.map(t => `${t.name} (${t.hp} PV, Statuts: ${t.statuses})`).join(', ') || 'Aucun'}
- Hostiles (Ennemis) : ${enemyTokens.map(t => `${t.name} (${t.hp} PV, Statuts: ${t.statuses})`).join(', ') || 'Aucun'}
- Alliés : ${allyTokens.map(t => `${t.name} (${t.hp} PV, Statuts: ${t.statuses})`).join(', ') || 'Aucun'}
- Neutres : ${neutralTokens.map(t => `${t.name} (${t.hp} PV, Statuts: ${t.statuses})`).join(', ') || 'Aucun'}

DIRECTIVES :
1. DESCRIPTION D'AMBIANCE (1 paragraphe) : Utilise un style riche et évocateur pour décrire la scène. Mentionne la météo, l'atmosphère générale et la tension entre les factions.
2. ANALYSE TACTIQUE (1-2 phrases par camp) : 
   - Pour les PJ : Suggère une approche stratégique basée sur le positionnement ou les menaces immédiates.
   - Pour les Hostiles : Suggère au MJ comment les jouer de manière intelligente et agressive.
3. TON : Mystérieux, immersif, digne d'un grand maître de jeu.

Réponds en français. Pas d'introduction méta, commence directement par la description.
`;

        setIsGenerating(true);
        try {
            /*
              **Une narration de carte ne cite aucune règle** — axe F.3 du plan
              du 2026-08-07, fait le 2026-08-21.

              Cet appel emportait le corpus de règles entier pour décrire une
              ambiance et suggérer comment jouer des hostiles. `lite` sans
              `systemOnly` ne charge AUCUNE fiche et réduit le contexte vivant
              au groupe et aux PNJ — c'est-à-dire exactement ce que cette
              description met en scène.

              *On ne fait pas payer à la narration le budget des règles.*
            */
            const response = await aiService.generateText(prompt, undefined, 'sage', {}, true);
            const text = response.text.trim();
            setLastNarrative(text);
            return text;
        } catch (error) {
            console.error("[useNarrativeGenerator] Error:", error);
            return "Une erreur est survenue lors de la génération de la narration.";
        } finally {
            setIsGenerating(false);
        }
    };

    /*
      **Le seul evenement que le meneur ajoute EXPRES au journal, et il n'y
      arrivait qu'a moitie.**

      Il partait avec `type: 'STORY' as any` -- un type qui **n'existe pas** dans
      `JournalEventType`. Le `as any` eteignait le compilateur, et les
      consequences etaient silencieuses : `natureParDefaut` ne le reconnait pas,
      donc il retombait sur `trace`, donc `generateAISummary` -- qui ne garde que
      la chronique -- **l'ecartait**. La vision generee par l'Oracle, la matiere
      la plus narrative de toute l'application, n'atteignait jamais le resume.
      Et `eventIcons` n'ayant pas de `STORY`, la ligne s'affichait sans icone.

      `ORACLE` dit d'ou elle vient, `nature: 'chronique'` dit ce qu'elle est. Le
      type est mecanique et la nature ne l'est pas : c'est exactement le cas que
      le paragraphe 4.3 prevoit qu'un emetteur declare.
    */
    const addToJournal = (text: string) => {
        useJournalStore.getState().addEvent({
            type: 'ORACLE',
            nature: 'chronique',
            title: '📜 Vision de l\'Oracle',
            content: text
        });
    };

    return {
        generateNarrative,
        isGenerating,
        lastNarrative,
        addToJournal
    };
};
