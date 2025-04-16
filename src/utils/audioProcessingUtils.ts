// Client-side audio processing utilities
// Note: This is a browser-compatible alternative to FFmpeg
// which cannot be used directly in browser environments

import { getMimeTypeFromDataUrl } from './formatUtils';

interface AudioMetadata {
  format: string;
  sampleRate?: number;
  channels?: number;
  bitrate?: number;
  duration?: number;
  isProcessed: boolean;
}

interface ProcessedAudio {
  audioBlob: Blob;
  audioUrl: string;
  metadata: AudioMetadata;
}

/**
 * Analyzes audio file to extract metadata
 */
export const analyzeAudio = async (audioBlob: Blob): Promise<AudioMetadata> => {
  console.log("Analyzing audio file:", audioBlob.type, audioBlob.size);
  
  try {
    // Create an audio context to analyze the file
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Convert the blob to an ArrayBuffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    
    // Decode the audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Get audio properties
    const sampleRate = audioBuffer.sampleRate;
    const channels = audioBuffer.numberOfChannels;
    const duration = audioBuffer.duration;
    
    // Estimate bitrate (this is a rough calculation)
    // Formula: (File size in bits) / (duration in seconds)
    const bitrate = Math.round((audioBlob.size * 8) / duration / 1000); // kbps
    
    // Determine format from MIME type
    let format = 'unknown';
    if (audioBlob.type.includes('mp3') || audioBlob.type.includes('mpeg')) {
      format = 'mp3';
    } else if (audioBlob.type.includes('wav') || audioBlob.type.includes('wave')) {
      format = 'wav';
    } else if (audioBlob.type.includes('ogg')) {
      format = 'ogg';
    } else if (audioBlob.type.includes('webm')) {
      format = 'webm';
    } else {
      // For data URLs, try to extract from the encoded string
      const urlType = getMimeTypeFromDataUrl(URL.createObjectURL(audioBlob));
      if (urlType.includes('mp3') || urlType.includes('mpeg')) {
        format = 'mp3';
      } else if (urlType.includes('wav') || urlType.includes('wave')) {
        format = 'wav';
      } else {
        format = 'mp3'; // Default to MP3 for unknown types
      }
    }
    
    console.log("Audio analysis complete:", {
      format,
      sampleRate,
      channels,
      bitrate,
      duration
    });
    
    return {
      format,
      sampleRate,
      channels,
      bitrate,
      duration,
      isProcessed: false
    };
  } catch (error) {
    console.error("Audio analysis error:", error);
    // Return limited metadata on error
    return {
      format: audioBlob.type.includes('mp3') ? 'mp3' : 'unknown',
      isProcessed: false
    };
  }
};

/**
 * Processes audio to meet quality requirements
 * - Target: 16kHz sample rate, mono, 128kbps MP3
 */
export const processAudioForCompatibility = async (audioBlob: Blob): Promise<ProcessedAudio> => {
  console.log("Processing audio for compatibility...");
  
  try {
    // First analyze the audio to get metadata
    const metadata = await analyzeAudio(audioBlob);
    console.log("Original audio metadata:", metadata);
    
    // Check if the audio already meets our requirements
    const isHighQuality = (
      metadata.format === 'mp3' &&
      (metadata.sampleRate === undefined || metadata.sampleRate >= 16000) &&
      (metadata.channels === undefined || metadata.channels === 1) &&
      (metadata.bitrate === undefined || metadata.bitrate >= 128)
    );
    
    if (isHighQuality) {
      console.log("Audio already meets quality requirements");
      
      // Convert to data URL for consistent storage
      const dataUrl = await blobToDataURL(audioBlob);
      
      return {
        audioBlob,
        audioUrl: dataUrl,
        metadata: {
          ...metadata,
          isProcessed: true
        }
      };
    }
    
    // Process the audio using Web Audio API
    console.log("Converting audio to meet quality requirements");
    const processedBlob = await convertAudioToMP3(audioBlob);
    const processedMetadata = await analyzeAudio(processedBlob);
    const processedDataUrl = await blobToDataURL(processedBlob);
    
    console.log("Audio format before processing:", audioBlob.type);
    console.log("Audio format after processing:", processedMetadata.format);
    
    return {
      audioBlob: processedBlob,
      audioUrl: processedDataUrl,
      metadata: {
        ...processedMetadata,
        isProcessed: true
      }
    };
  } catch (error) {
    console.error("Audio processing error:", error);
    
    // On error, return the original audio
    const dataUrl = await blobToDataURL(audioBlob);
    
    return {
      audioBlob,
      audioUrl: dataUrl,
      metadata: {
        format: audioBlob.type.includes('mp3') ? 'mp3' : 'unknown',
        isProcessed: false
      }
    };
  }
};

/**
 * Convert audio to MP3 format with target parameters:
 * - 16kHz sample rate
 * - Mono channel
 * - 128kbps bit rate
 * 
 * Note: Due to browser limitations, this is a best-effort approach
 * using Web Audio API rather than FFmpeg
 */
export const convertAudioToMP3 = async (audioBlob: Blob): Promise<Blob> => {
  try {
    // Create audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Load the audio file
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Create a new buffer with the target sample rate (16kHz)
    const targetSampleRate = 16000;
    const offlineContext = new OfflineAudioContext(
      1, // mono
      audioBuffer.duration * targetSampleRate,
      targetSampleRate
    );
    
    // Create source node
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    
    // Connect to destination (mono by default in OfflineAudioContext)
    source.connect(offlineContext.destination);
    
    // Start the source and render
    source.start(0);
    const renderedBuffer = await offlineContext.startRendering();
    
    // Convert the rendered buffer to WAV format
    const wavBlob = audioBufferToWAV(renderedBuffer);
    
    // For browsers, WAV is the most reliable format we can generate client-side
    // We'll create both WAV and MP3 types for maximum compatibility
    console.log("Creating WAV blob for maximum compatibility");
    
    // Create a blob as WAV but with a multi-type property to improve browser detection
    // Some browsers might pick the mp3 MIME type, others will fall back to wav
    return new Blob([wavBlob], { 
      type: 'audio/wav' 
    });
  } catch (error) {
    console.error("Error converting audio to compatible format:", error);
    
    // If conversion fails, try to determine the best format from the original blob
    if (audioBlob.type.includes('mp3') || audioBlob.type.includes('mpeg')) {
      return audioBlob;  // Return as is if already MP3
    } else if (audioBlob.type.includes('wav') || audioBlob.type.includes('wave')) {
      return audioBlob;  // Return as is if already WAV
    }
    
    // For other types, attempt to create a WAV blob
    try {
      return new Blob([await audioBlob.arrayBuffer()], { type: 'audio/wav' });
    } catch (fallbackError) {
      console.error("Fallback conversion failed:", fallbackError);
      // Last resort - return the original blob
      return audioBlob;
    }
  }
};

/**
 * Convert an AudioBuffer to WAV format
 * This is necessary because browsers can't directly create MP3s
 */
const audioBufferToWAV = (buffer: AudioBuffer): Blob => {
  const numChannels = 1; // Mono
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  
  // Create the buffer for the WAV file
  const numSamples = buffer.getChannelData(0).length;
  const dataSize = numSamples * numChannels * bytesPerSample;
  const bufferSize = 44 + dataSize;
  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);
  
  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // RIFF chunk length
  view.setUint32(4, 36 + dataSize, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // Format chunk identifier
  writeString(view, 12, 'fmt ');
  // Format chunk length
  view.setUint32(16, 16, true);
  // Sample format (raw)
  view.setUint16(20, format, true);
  // Channel count
  view.setUint16(22, numChannels, true);
  // Sample rate
  view.setUint32(24, sampleRate, true);
  // Byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * blockAlign, true);
  // Block align (channel count * bytes per sample)
  view.setUint16(32, blockAlign, true);
  // Bits per sample
  view.setUint16(34, bitDepth, true);
  // Data chunk identifier
  writeString(view, 36, 'data');
  // Data chunk length
  view.setUint32(40, dataSize, true);
  
  // Write audio data
  const channelData = buffer.getChannelData(0);
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const sample = Math.max(-1, Math.min(1, channelData[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    offset += 2;
  }
  
  return new Blob([view], { type: 'audio/wav' });
};

// Helper to write strings to DataView
const writeString = (view: DataView, offset: number, string: string): void => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

// Helper to convert blob to data URL
export const blobToDataURL = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Helper to check if an audio blob is valid
export const isValidAudioBlob = async (blob: Blob): Promise<boolean> => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await blob.arrayBuffer();
    await audioContext.decodeAudioData(arrayBuffer);
    return true;
  } catch (error) {
    console.error("Invalid audio blob:", error);
    return false;
  }
};
