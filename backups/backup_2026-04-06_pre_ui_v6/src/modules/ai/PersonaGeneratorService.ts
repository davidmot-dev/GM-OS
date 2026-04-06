import { aiService } from './AIService';

export interface PersonaGenerationContext {
    name: string;
    universe: string;
    style: string;
    objective?: string;
}

interface PersonaDef {
    id: string;
    name: string;
    description: string;
}

export class PersonaGeneratorService {
    private static instance: PersonaGeneratorService;

    private readonly PERSONAS: PersonaDef[] = [
        { id: 'sage', name: 'LE SAGE', description: 'Expert règles et statistiques. Technique, précis.' },
        { id: 'scribe', name: 'LE SCRIBE', description: 'Rapports, résumés et mémoire de mission.' },
        { id: 'oracle', name: 'L\'ORACLE', description: 'Ambiance, improvisation narrative et tension.' },
        { id: 'bard', name: 'LE BARDE', description: 'Poésie, Lore, Rumeurs et Musique.' },
        { id: 'alchemist', name: 'L\'ALCHIMISTE', description: 'Loot, PNJ secondaires et Objets.' },
        { id: 'cartographer', name: 'LE CARTOGRAPHE', description: 'Géographie, Lieux et Architectures.' },
        { id: 'actor', name: 'L\'ACTEUR', description: 'Incarnation de PNJ, dialogues et motivations.' },
    ];

    private constructor() {}

    public static getInstance(): PersonaGeneratorService {
        if (!PersonaGeneratorService.instance) {
            PersonaGeneratorService.instance = new PersonaGeneratorService();
        }
        return PersonaGeneratorService.instance;
    }

    /**
     * Genère tous les personas les uns après les autres.
     * Cette approche séquentielle est plus robuste pour Ollama et les modèles à petite fenêtre de réponse.
     */
    public async generateAllPersonas(context: PersonaGenerationContext, systemOnly: boolean = false): Promise<Record<string, string>> {
        const results: Record<string, string> = {};
        console.log(`[PersonaGeneratorService] Début de la génération séquentielle (${this.PERSONAS.length} personas, systemOnly: ${systemOnly})...`);

        for (const persona of this.PERSONAS) {
            try {
                console.log(`[PersonaGeneratorService] Génération de ${persona.id}...`);
                const startTime = Date.now();
                results[persona.id] = await this.generateSinglePersona(persona, context, systemOnly);
                const duration = ((Date.now() - startTime) / 1000).toFixed(1);
                console.log(`[PersonaGeneratorService] ✅ ${persona.id} généré en ${duration}s`);
            } catch (error) {
                console.error(`[PersonaGeneratorService] ❌ Échec pour ${persona.id}:`, error);
                results[persona.id] = `[ÉCHEC DE GÉNÉRATION] ${error instanceof Error ? error.message : String(error)}`;
            }
        }

        return results;
    }

    /**
     * Génère un seul persona avec un prompt dédié.
     */
    private async generateSinglePersona(persona: PersonaDef, context: PersonaGenerationContext, systemOnly: boolean): Promise<string> {
        const prompt = `Tu es un architecte de système multi-agents pour jeu de rôle. 
Ta mission est de générer un persona IA spécialisé : **${persona.name}** (${persona.description}).

CONTEXTE DU JEU :
Nom : ${context.name}
Univers : ${context.universe}
Style : ${context.style}
Objectif : ${context.objective || 'Immersion totale et aide à la narration'}

INSTRUCTIONS POUR LE PERSONA :
Génère un PROMPT SYSTÈME détaillé pour cet agent.
🧩 STRUCTURE OBLIGATOIRE DU TEXTE DU PROMPT :
1. IDENTITÉ (Nom, Rôle, Spécialité)
2. MISSION (Responsabilités, Doit faire / Ne doit pas faire)
3. CAPACITÉS (Actions possibles)
4. ENTRÉES / SORTIES (Type de données traitées)
5. FORMAT DE SORTIE (Structure type des réponses)
6. RÈGLES DE COMPORTEMENT (Ton, Univers, Cohérence)
7. STYLE (Vitesse, Niveau de détail)
8. SYNTHÈSE (Phrase d'activation interne)

RÈGLE CRITIQUE : 
Réponds UNIQUEMENT avec le texte du prompt système généré. 
- PAS d'introduction ("Voici le prompt...").
- PAS de conclusion ("J'espère que ça aide...").
- PAS de balises de code markdown (pas de \`\`\`json ou \`\`\`markdown).
Le texte doit être du texte brut directement utilisable comme instruction système.

RÉPONSE (PROMPT SYSTÈME) :`;

        const response = await aiService.generateText(prompt, undefined, persona.id, {
            systemOnly,
            systemName: context.universe // Note: 'universe' contains the system name in our context
        });
        let text = response.text.trim();
        
        // Nettoyage au cas où l'IA ignorerait les consignes de formatage
        text = text.replace(/^```(markdown|text)?\n/i, '').replace(/\n```$/i, '');
        
        if (text.length < 50) {
            throw new Error(`Le contenu généré est trop court (${text.length} car.).`);
        }
        
        return text;
    }
}

export const personaGeneratorService = PersonaGeneratorService.getInstance();
