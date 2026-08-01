import { float32ToPCM16, arrayBufferToBase64, calculateAudioLevel } from "./pcmUtils";

export class AudioStreamer {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  private isRecording: boolean = false;

  private onAudioDataCallback: ((base64Pcm: string) => void) | null = null;
  private onLevelChangeCallback: ((level: number) => void) | null = null;

  constructor(
    onAudioData: (base64Pcm: string) => void,
    onLevelChange?: (level: number) => void
  ) {
    this.onAudioDataCallback = onAudioData;
    if (onLevelChange) this.onLevelChangeCallback = onLevelChange;
  }

  public async start(): Promise<boolean> {
    if (this.isRecording) return true;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 16000,
        },
      });

      // Sample rate 16000 as required by Gemini Live API
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });

      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }

      this.mediaStreamSource = this.audioContext.createMediaStreamSource(this.mediaStream);
      
      // 4096 buffer size gives ~256ms audio frames at 16kHz
      this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.scriptProcessor.onaudioprocess = (event: AudioProcessingEvent) => {
        if (!this.isRecording) return;

        const inputBuffer = event.inputBuffer;
        const channelData = inputBuffer.getChannelData(0);

        // Compute volume level
        if (this.onLevelChangeCallback) {
          const level = calculateAudioLevel(channelData);
          this.onLevelChangeCallback(level);
        }

        // Convert Float32 to Int16 PCM and base64
        const pcmBuffer = float32ToPCM16(channelData);
        const base64Pcm = arrayBufferToBase64(pcmBuffer);

        if (this.onAudioDataCallback && base64Pcm) {
          this.onAudioDataCallback(base64Pcm);
        }
      };

      this.mediaStreamSource.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.audioContext.destination);

      this.isRecording = true;
      console.log("[AudioStreamer] Microphone audio streaming started at 16kHz");
      return true;
    } catch (err) {
      console.error("[AudioStreamer] Failed to start audio input recording:", err);
      this.stop();
      return false;
    }
  }

  public stop(): void {
    this.isRecording = false;

    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor.onaudioprocess = null;
      this.scriptProcessor = null;
    }

    if (this.mediaStreamSource) {
      this.mediaStreamSource.disconnect();
      this.mediaStreamSource = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      if (this.audioContext.state !== "closed") {
        this.audioContext.close().catch(() => {});
      }
      this.audioContext = null;
    }

    if (this.onLevelChangeCallback) {
      this.onLevelChangeCallback(0);
    }

    console.log("[AudioStreamer] Microphone streaming stopped");
  }

  public isActive(): boolean {
    return this.isRecording;
  }
}
