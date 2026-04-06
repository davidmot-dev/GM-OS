import { HueEngine } from '../../light/HueEngine';

export const HuePriority = {
  P1_FLASH: 1,      // Immediate/Damage/Impact
  P2_TACTICAL: 2,   // Combat state changes/Suggestions
  P3_AMBIANCE: 3    // Background cycles (LIFO)
} as const;

export type HuePriority = typeof HuePriority[keyof typeof HuePriority];

export interface HueCommand {
  priority: HuePriority;
  execute: (engine: HueEngine) => Promise<void>;
  id?: string;
}

export class HuePriorityQueue {
  private static instance: HuePriorityQueue;
  private queue: HueCommand[] = [];
  private isProcessing = false;
  private _engine: HueEngine | null = null;

  private constructor() {}

  private get engine(): HueEngine {
    if (!this._engine) {
      this._engine = new HueEngine();
    }
    return this._engine;
  }

  public static getInstance(): HuePriorityQueue {
    if (!HuePriorityQueue.instance) {
      HuePriorityQueue.instance = new HuePriorityQueue();
    }
    return HuePriorityQueue.instance;
  }

  /**
   * Adds a command to the queue and triggers processing
   */
  public enqueue(command: HueCommand) {
    if (command.priority === HuePriority.P1_FLASH) {
      // P1 (Flash) clears EVERYTHING and jumps to front
      // We want to interrupt and process the MUST-SEE event
      this.queue = [];
      this.queue.unshift(command);
    } else {
      // P2 and P3 follow "Latest Wins":
      // Remove any existing commands of the same priority to avoid backlog
      this.queue = this.queue.filter(c => c.priority !== command.priority);
      this.queue.push(command);
      
      // Keep sorted by priority
      this.queue.sort((a, b) => a.priority - b.priority);
    }

    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    
    while (this.queue.length > 0) {
      const command = this.queue.shift();
      if (command) {
        try {
          await command.execute(this.engine);
        } catch (error) {
          console.error('[HuePriorityQueue] Command execution failed:', error);
        }
      }
      
      // Artificial debounce to respect Bridge limits (~10ms)
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    this.isProcessing = false;
  }
}

export const huePriorityQueue = HuePriorityQueue.getInstance();
