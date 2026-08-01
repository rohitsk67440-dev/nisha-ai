/**
 * Converts Float32Array audio samples (-1.0 to 1.0) to 16-bit signed Int PCM ArrayBuffer.
 */
export function float32ToPCM16(float32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    // 16-bit signed integer value range: -32768 to 32767
    const int16 = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(i * 2, int16, true); // Little endian
  }
  return buffer;
}

/**
 * Encodes ArrayBuffer to base64 string.
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Decodes base64 string representing 16-bit PCM little endian into Float32Array (-1.0 to 1.0).
 */
export function base64ToPCM16Float32(base64: string): Float32Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const dataView = new DataView(bytes.buffer);
  const samplesCount = Math.floor(len / 2);
  const float32 = new Float32Array(samplesCount);

  for (let i = 0; i < samplesCount; i++) {
    const int16 = dataView.getInt16(i * 2, true); // Little endian
    float32[i] = int16 / (int16 < 0 ? 32768 : 32767);
  }

  return float32;
}

/**
 * Calculates RMS volume level (0 to 1) from Float32Array audio buffer.
 */
export function calculateAudioLevel(samples: Float32Array): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i] * samples[i];
  }
  const rms = Math.sqrt(sum / samples.length);
  return Math.min(1, rms * 4); // Scale for visual effect
}
