import { soundEngine } from '../../sound/SoundEngine';

export class AudioCurationService {
  private static instance: AudioCurationService;
  private activeAmbientSource: AudioBufferSourceNode | null = null;
  private ambientGain: GainNode | null = null;

  private constructor() {}

  private get audioContext(): AudioContext {
    return soundEngine.context;
  }

  private get masterGain(): GainNode {
    return soundEngine.masterGain;
  }

  public static getInstance(): AudioCurationService {
    if (!AudioCurationService.instance) {
      AudioCurationService.instance = new AudioCurationService();
    }
    return AudioCurationService.instance;
  }

  /**
   * Plays a tactical sound effect immediately, interrupting nothing but playing on top
   */
  public async playTacticalCut(filePath: string, volume: number = 0.8): Promise<void> {
    try {
      // Robust URL resolution: 
      // 1. If absolute URL, use it.
      // 2. Otherwise, resolve relative to current window location (handles file:// and http://)
      let url: string;
      if (filePath.startsWith('http') || filePath.startsWith('blob:')) {
        url = filePath;
      } else {
        // Resolve relative to the app origin
        // Strip leading slash if present to avoid drive-root resolution on file://
        const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
        url = new URL(cleanPath, window.location.origin + '/').href;
      }
      
      console.log(`[AudioCurationService] 🔊 Playback request: ${filePath} -> Resolved: ${url}`);
      
      const response = await fetch(url);
      
      // Robust error handling: Check status, content-type and size
      const contentType = response.headers.get('content-type') || '';
      const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
      
      if (!response.ok || !contentType.includes('audio') && contentLength < 3000) {
        console.error(`[AudioCurationService] ❌ Audio file invalid or missing: ${filePath} (Status: ${response.status}, Type: ${contentType}, Size: ${contentLength}b)`);
        
        // Prevent infinite recursion if the fallback itself is failing
        if (filePath.includes('tactical') && !filePath.endsWith('target_lock.mp3')) {
           console.log(`[AudioCurationService] 🔄 Falling back to known stable file: target_lock.mp3`);
           return this.playTacticalCut('assets/sounds/tactical/target_lock.mp3', volume * 0.8);
        }
        return;
      }
      
      const arrayBuffer = await response.arrayBuffer();
      
      // Secondary size check (if headers were missing)
      if (arrayBuffer.byteLength < 1000) {
          console.warn(`[AudioCurationService] ⚠️ Buffer too small to be valid audio (${arrayBuffer.byteLength} bytes). Skipping.`);
          return;
      }

      console.log(`[AudioCurationService] Decoding buffer (${arrayBuffer.byteLength} bytes) for: ${filePath}`);
      
      let audioBuffer: AudioBuffer;
      try {
        audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        console.log(`[AudioCurationService] Buffer decoded. Duration: ${audioBuffer.duration}s.`);
      } catch (decodeError) {
        console.error(`[AudioCurationService] ❌ Erreur de décodage pour ${filePath}:`, decodeError);
        
        // Final fallback: try a known stable file if we aren't already trying it
        if (!filePath.endsWith('target_lock.mp3')) {
          console.warn(`[AudioCurationService] 🔄 Repli sur target_lock.mp3 suite à erreur de décodage.`);
          return this.playTacticalCut('assets/sounds/tactical/target_lock.mp3', volume * 0.5);
        }
        return;
      }

      if (this.audioContext.state === 'suspended') {
        console.warn('[AudioCurationService] AudioContext is SUSPENDED. Attempting resume...');
        await this.audioContext.resume();
      }

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = audioBuffer;
      gainNode.gain.value = volume;
      
      source.connect(gainNode);
      gainNode.connect(this.masterGain);
      
      source.start(0);
      console.log(`[AudioCurationService] Playback started.`);
    } catch (error) {
      console.error('[AudioCurationService] Unexpected error in playTacticalCut:', error);
    }
  }

  /**
   * Cross-fades into a new ambient background
   */
  public async transitionAmbiance(filePath: string, fadeDuration: number = 2.0) {
    const response = await fetch(filePath);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    const newSource = this.audioContext.createBufferSource();
    const newGain = this.audioContext.createGain();
    
    newSource.buffer = audioBuffer;
    newSource.loop = true;
    newGain.gain.setValueAtTime(0, this.audioContext.currentTime);
    
    newSource.connect(newGain);
    newGain.connect(this.masterGain);
    
    const now = this.audioContext.currentTime;
    
    // Fade out old
    if (this.ambientGain) {
      this.ambientGain.gain.exponentialRampToValueAtTime(0.001, now + fadeDuration);
      const oldSource = this.activeAmbientSource;
      setTimeout(() => oldSource?.stop(), fadeDuration * 1000);
    }

    // Fade in new
    newGain.gain.exponentialRampToValueAtTime(0.6, now + fadeDuration);
    
    this.activeAmbientSource = newSource;
    this.ambientGain = newGain;
    newSource.start(0);
  }
}

export const audioCurationService = AudioCurationService.getInstance();
