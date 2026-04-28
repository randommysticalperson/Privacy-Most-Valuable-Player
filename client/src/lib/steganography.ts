/**
 * steganography.ts — LSB (Least Significant Bit) Image Steganography
 * Design: Zero-Knowledge Glass — Dark Space Glassmorphism
 *
 * Technique: LSB substitution
 * - Each pixel has 4 channels: R, G, B, A (0–255 each)
 * - We modify the least significant bit of R, G, B channels
 * - This changes each channel value by at most ±1 — visually imperceptible
 * - We can hide 3 bits per pixel (1 bit per RGB channel)
 *
 * Encoding scheme:
 * 1. Convert message to UTF-8 bytes
 * 2. Prepend a 32-bit length header (so we know how many bytes to extract)
 * 3. Encode each bit into the LSB of successive R/G/B values
 *
 * Capacity: (width × height × 3 bits) / 8 bytes
 * Example: 512×512 image → 98,304 bytes ≈ 96 KB of hidden text
 *
 * Security note: LSB alone is not secure — combine with AES-GCM encryption
 * (encrypt the message FIRST, then hide the ciphertext in the image).
 */

export interface StegoResult {
  imageDataUrl: string;
  bitsUsed: number;
  bitsAvailable: number;
  capacityPercent: number;
  messageBytes: number;
}

export interface StegoExtractResult {
  message: string;
  messageBytes: number;
  bitsRead: number;
}

export interface StegoCapacity {
  maxBytes: number;
  maxChars: number;
  width: number;
  height: number;
  pixels: number;
}

/**
 * Calculate the steganographic capacity of an image.
 */
export function calculateCapacity(width: number, height: number): StegoCapacity {
  const pixels = width * height;
  const maxBits = pixels * 3; // 3 channels (R, G, B)
  const maxBytes = Math.floor(maxBits / 8) - 4; // subtract 4 bytes for length header
  return {
    maxBytes: Math.max(0, maxBytes),
    maxChars: Math.max(0, maxBytes), // UTF-8 ASCII chars
    width,
    height,
    pixels,
  };
}

/**
 * Encode a text message into an image using LSB steganography.
 * Returns a new PNG data URL with the hidden message.
 *
 * @param imageDataUrl - Source image as data URL
 * @param message - Text to hide (will be UTF-8 encoded)
 * @returns StegoResult with the new image data URL
 */
export async function encodeMessage(
  imageDataUrl: string,
  message: string
): Promise<StegoResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data; // Uint8ClampedArray: [R,G,B,A, R,G,B,A, ...]

      // Encode message to UTF-8 bytes
      const msgBytes = new TextEncoder().encode(message);
      const msgLen = msgBytes.length;

      // Capacity check
      const capacity = calculateCapacity(canvas.width, canvas.height);
      if (msgLen > capacity.maxBytes) {
        reject(new Error(`Message too long: ${msgLen} bytes, capacity: ${capacity.maxBytes} bytes`));
        return;
      }

      // Build bit array: [32-bit length header] + [message bytes]
      const allBytes = new Uint8Array(4 + msgLen);
      // Store length as big-endian 32-bit integer
      allBytes[0] = (msgLen >> 24) & 0xff;
      allBytes[1] = (msgLen >> 16) & 0xff;
      allBytes[2] = (msgLen >> 8) & 0xff;
      allBytes[3] = msgLen & 0xff;
      allBytes.set(msgBytes, 4);

      // Convert bytes to bit array
      const bits: number[] = [];
      for (const byte of allBytes) {
        for (let b = 7; b >= 0; b--) {
          bits.push((byte >> b) & 1);
        }
      }

      // Embed bits into LSBs of R, G, B channels (skip Alpha)
      let bitIndex = 0;
      for (let i = 0; i < pixels.length && bitIndex < bits.length; i++) {
        // Skip alpha channel (every 4th byte)
        if ((i % 4) === 3) continue;
        // Replace LSB
        pixels[i] = (pixels[i] & 0xfe) | bits[bitIndex++];
      }

      ctx.putImageData(imageData, 0, 0);
      const outputDataUrl = canvas.toDataURL('image/png');

      resolve({
        imageDataUrl: outputDataUrl,
        bitsUsed: bits.length,
        bitsAvailable: capacity.maxBytes * 8,
        capacityPercent: (bits.length / (capacity.maxBytes * 8)) * 100,
        messageBytes: msgLen,
      });
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageDataUrl;
  });
}

/**
 * Extract a hidden message from an LSB-encoded image.
 *
 * @param imageDataUrl - Stego image as data URL
 * @returns Extracted message text
 */
export async function extractMessage(imageDataUrl: string): Promise<StegoExtractResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      // Extract bits from LSBs (skip alpha)
      const extractBits = (count: number, startBit: number): number => {
        let value = 0;
        let bitsRead = 0;
        let pixelByte = 0;

        // Find the starting pixel byte (skip alpha channels)
        let bytePos = 0;
        let nonAlphaCount = 0;
        while (nonAlphaCount < startBit) {
          if ((bytePos % 4) !== 3) nonAlphaCount++;
          bytePos++;
        }

        while (bitsRead < count && bytePos < pixels.length) {
          if ((bytePos % 4) === 3) { bytePos++; continue; }
          value = (value << 1) | (pixels[bytePos] & 1);
          bitsRead++;
          bytePos++;
          pixelByte = bytePos;
        }
        void pixelByte;
        return value;
      };

      // Read length header (first 32 bits = 4 bytes)
      let bitPos = 0;
      let msgLen = 0;
      for (let i = 0; i < 32; i++) {
        // Extract one bit at a time from non-alpha channels
        let bytePos = 0;
        let nonAlpha = 0;
        while (nonAlpha <= bitPos) {
          if ((bytePos % 4) !== 3) nonAlpha++;
          if (nonAlpha <= bitPos) bytePos++;
        }
        msgLen = (msgLen << 1) | (pixels[bytePos] & 1);
        bitPos++;
      }

      if (msgLen <= 0 || msgLen > 100000) {
        reject(new Error('No hidden message found or image is not a stego image'));
        return;
      }

      // Read message bytes
      const msgBytes = new Uint8Array(msgLen);
      for (let byteIdx = 0; byteIdx < msgLen; byteIdx++) {
        let byte = 0;
        for (let b = 7; b >= 0; b--) {
          let bytePos = 0;
          let nonAlpha = 0;
          while (nonAlpha <= bitPos) {
            if ((bytePos % 4) !== 3) nonAlpha++;
            if (nonAlpha <= bitPos) bytePos++;
          }
          byte |= (pixels[bytePos] & 1) << b;
          bitPos++;
        }
        msgBytes[byteIdx] = byte;
      }

      try {
        const message = new TextDecoder().decode(msgBytes);
        resolve({
          message,
          messageBytes: msgLen,
          bitsRead: bitPos,
        });
      } catch {
        reject(new Error('Failed to decode message — may be encrypted ciphertext'));
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageDataUrl;
  });
}

/**
 * Generate a simple carrier image (gradient canvas) for demo purposes.
 * In production, users would upload their own cover images.
 */
export function generateCarrierImage(width = 400, height = 300): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Create a visually interesting gradient that hides LSB changes well
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#0d1b2a');
  gradient.addColorStop(0.3, '#1a2744');
  gradient.addColorStop(0.6, '#0f2a1a');
  gradient.addColorStop(1, '#1a1a2e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Add some noise texture to better conceal LSB changes
  const imageData = ctx.getImageData(0, 0, width, height);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 20;
    imageData.data[i] = Math.max(0, Math.min(255, imageData.data[i] + noise));
    imageData.data[i + 1] = Math.max(0, Math.min(255, imageData.data[i + 1] + noise));
    imageData.data[i + 2] = Math.max(0, Math.min(255, imageData.data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);

  // Add subtle grid pattern
  ctx.strokeStyle = 'rgba(100, 150, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 20) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
  }
  for (let y = 0; y < height; y += 20) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }

  return canvas.toDataURL('image/png');
}

/**
 * Calculate PSNR (Peak Signal-to-Noise Ratio) between two images.
 * Higher PSNR = less visible difference. >40dB is considered imperceptible.
 */
export async function calculatePSNR(
  originalDataUrl: string,
  stegoDataUrl: string
): Promise<number> {
  const getPixels = (dataUrl: string): Promise<Uint8ClampedArray> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d')!.drawImage(img, 0, 0);
        resolve(canvas.getContext('2d')!.getImageData(0, 0, img.width, img.height).data);
      };
      img.onerror = reject;
      img.src = dataUrl;
    });

  const [orig, stego] = await Promise.all([getPixels(originalDataUrl), getPixels(stegoDataUrl)]);

  let mse = 0;
  for (let i = 0; i < orig.length; i++) {
    const diff = orig[i] - stego[i];
    mse += diff * diff;
  }
  mse /= orig.length;

  if (mse === 0) return Infinity;
  return 10 * Math.log10((255 * 255) / mse);
}
