import { base64ToPCM16Float32, calculateAudioLevel } from "./pcmUtils";

export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private nextStartTime: number = 0;
  private activeSources: Set<AudioBufferSourceNode> = new Set();
  private onLevelChangeCallback: ((level: number) => void) | null = null;
  private onSpeakingChangeCallback: ((isSpeaking: boolean) => void) | null = null;
  private volumeAnalyser: AnalyserNode | null = null;
  private animationFrameId: number | null = null;

  constructor(
    onLevelChange?: (level: number) => void,
    onSpeakingChange?: (isSpeaking: boolean) => void
  ) {
    if (onLevelChange) this.onLevelChangeCallback = onLevelChange;
    if (onSpeakingChange) this.onSpeakingChangeCallback = onSpeakingChange;
  }

  private initContext() {
    if (!this.audioContext || this.audioContext.state === "closed") {
      // 24kHz as required by Gemini Live API output
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });

      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 1.0;

      this.volumeAnalyser = this.audioContext.createAnalyser();
      this.volumeAnalyser.fftSize = 256;

      this.gainNode.connect(this.volumeAnalyser);
      this.volumeAnalyser.connect(this.audioContext.destination);

      this.startAnalyserLoop();
    }

    if (this.audioContext.state === "suspended") {
      this.audioContext.resume().catch(() => {});
    }
  }

  private startAnalyserLoop() {
    if (!this.volumeAnalyser) return;

    const dataArray = new Float32Array(this.volumeAnalyser.fftSize);

    const checkVolume = () => {
      if (this.volumeAnalyser && this.activeSources.size > 0) {
        this.volumeAnalyser.getFloatTimeDomainData(dataArray);
        const level = calculateAudioLevel(dataArray);
        if (this.onLevelChangeCallback) {
          this.onLevelChangeCallback(level);
        }
      } else {
        if (this.onLevelChangeCallback) {
          this.onLevelChangeCallback(0);
        }
      }
      this.animationFrameId = requestAnimationFrame(checkVolume);
    };

    checkVolume();
  }

  public playChunk(base64Pcm: string): void {
    try {
      this.initContext();

      if (!this.audioContext || !this.gainNode) return;

      const float32Samples = base64ToPCM16Float32(base64Pcm);
      if (float32Samples.length === 0) return;

      const audioBuffer = this.audioContext.createBuffer(
        1,
        float32Samples.length,
        24000
      );
      audioBuffer.getChannelData(0).set(float32Samples);

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.gainNode);

      const currentTime = this.audioContext.currentTime;
      // Precision scheduling for gapless playback
      const startTime = Math.max(currentTime, this.nextStartTime);
      
      source.start(startTime);
      this.nextStartTime = startTime + audioBuffer.duration;

      this.activeSources.add(source);

      if (this.onSpeakingChangeCallback && this.activeSources.size === 1) {
        this.onSpeakingChangeCallback(true);
      }

      source.onended = () => {
        source.disconnect();
        this.activeSources.delete(source);
        if (this.activeSources.size === 0) {
          if (this.onSpeakingChangeCallback) {
            this.onSpeakingChangeCallback(false);
          }
          if (this.onLevelChangeCallback) {
            this.onLevelChangeCallback(0);
          }
        }
      };
    } catch (err) {
      console.error("[AudioPlayer] Error playing audio chunk:", err);
    }
  }

  public stop(): void {
    // Clear queued and playing sources immediately for smooth interruption
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // Source might have already ended
      }
    }
    this.activeSources.clear();

    if (this.audioContext) {
      this.nextStartTime = this.audioContext.currentTime;
    } else {
      this.nextStartTime = 0;
    }

    if (this.onSpeakingChangeCallback) {
      this.onSpeakingChangeCallback(false);
    }
    if (this.onLevelChangeCallback) {
      this.onLevelChangeCallback(0);
    }

    console.log("[AudioPlayer] Audio playback stopped/cleared");
  }

  public setVolume(volume: number) {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  public isPlaying(): boolean {
    return this.activeSources.size > 0;
  }

  public destroy(): void {
    this.stop();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }
}
