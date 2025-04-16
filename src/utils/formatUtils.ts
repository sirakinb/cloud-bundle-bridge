// Format seconds into MM:SS format
export const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00";
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Gets MIME type from data URL or returns a default
export const getMimeTypeFromDataUrl = (dataUrl: string): string => {
  if (!dataUrl || typeof dataUrl !== 'string') {
    return 'audio/mp3';
  }
  
  // Check if it's a data URL with MIME type
  if (dataUrl.startsWith('data:')) {
    const mimeMatch = dataUrl.match(/^data:([^;]+);/);
    if (mimeMatch && mimeMatch[1]) {
      return mimeMatch[1];
    }
  }
  
  // For blob URLs, we'll assume MP3 as a safe default
  if (dataUrl.startsWith('blob:')) {
    return 'audio/mp3';
  }
  
  return 'audio/mp3'; // Default to MP3
};

// Fix audio URLs for reliable playback
export const normalizeAudioUrl = (audioUrl: string): string => {
  if (!audioUrl) return '';
  
  // For blob URLs, add a file extension hint to help the browser
  if (audioUrl.startsWith('blob:') && !audioUrl.includes('#')) {
    return `${audioUrl}#.wav`; // Use WAV as it's more widely supported
  }
  
  // Handle data URLs that might have incorrect MIME types
  if (audioUrl.startsWith('data:')) {
    // Check if it already has a proper audio MIME type
    if (audioUrl.startsWith('data:audio/')) {
      // Keep the existing audio MIME type
      return audioUrl;
    }
    
    // Force to generic audio MIME type for better compatibility
    return audioUrl.replace(/^data:[^;]+/, 'data:audio/wav');
  }
  
  return audioUrl;
};
