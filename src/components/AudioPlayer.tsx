import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, VolumeX, RefreshCw, Download, FileText, Loader } from "lucide-react";
import { formatTime, normalizeAudioUrl, getMimeTypeFromDataUrl } from "@/utils/formatUtils";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { processAudioForCompatibility, isValidAudioBlob } from "@/utils/audioProcessingUtils";

interface AudioPlayerProps {
  audioUrl: string;
  title: string;
  transcription?: string;
  format?: string;
  allowDownload?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  audioUrl, 
  title, 
  transcription, 
  format = "mp3",
  allowDownload = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showTranscription, setShowTranscription] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  // Ensure our audio format is correct for browser playback
  useEffect(() => {
    // Ensure we're working with a valid audio URL
    if (!audioUrl) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    const processAudio = async () => {
      try {
        // Set processing state
        setIsProcessing(true);
        setProcessingStatus("Analyzing audio format...");
        
        // First normalize the URL for better compatibility
        const normalizedUrl = normalizeAudioUrl(audioUrl);
        console.log("AudioPlayer using normalized URL:", normalizedUrl.substring(0, 30) + "...");
        console.log("Audio format:", format);
        
        // If the URL is a data URL, convert it to a blob for processing
        let audioBlob: Blob;
        if (normalizedUrl.startsWith('data:')) {
          setProcessingStatus("Converting audio data...");
          const response = await fetch(normalizedUrl);
          audioBlob = await response.blob();
        } else {
          setProcessingStatus("Fetching audio file...");
          const response = await fetch(normalizedUrl);
          audioBlob = await response.blob();
        }
        
        // Check if the blob is valid audio
        setProcessingStatus("Validating audio file...");
        const isValid = await isValidAudioBlob(audioBlob);
        
        if (!isValid) {
          console.error("Invalid audio blob");
          setHasError(true);
          setIsProcessing(false);
          setIsLoading(false);
          return;
        }
        
        // Process the audio for compatibility
        setProcessingStatus("Processing audio for compatibility...");
        const { audioUrl: processedUrl, metadata } = await processAudioForCompatibility(audioBlob);
        
        console.log("Audio processing complete:", metadata);
        setProcessingStatus("Audio processing complete");
        
        // Set the processed audio source
        setAudioSrc(processedUrl);
        setHasError(false);
        
        if (audioRef.current) {
          audioRef.current.load();
        }
      } catch (error) {
        console.error("Error processing audio:", error);
        setHasError(true);
        // Try to still use the original URL
        setAudioSrc(normalizeAudioUrl(audioUrl));
      } finally {
        setIsProcessing(false);
        setIsLoading(false);
      }
    };
    
    processAudio();
  }, [audioUrl, format]);

  const togglePlay = () => {
    if (!audioRef.current || hasError) return;
    
    setIsLoading(true);
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsLoading(false);
    } else {
      // Ensure audio is loaded before playing
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("Audio playback started successfully");
            setIsPlaying(true);
            setIsLoading(false);
          })
          .catch(error => {
            console.error("Audio playback failed:", error);
            setIsPlaying(false);
            setIsLoading(false);
            setHasError(true);
            
            const mimeType = getMimeTypeFromDataUrl(audioSrc);
            toast({
              variant: "destructive",
              title: "Playback Error",
              description: `Could not play this recording (${mimeType}). The format may be unsupported.`
            });
          });
      }
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
    setIsLoading(false);
    console.log("Audio metadata loaded, duration:", audioRef.current.duration);
  };

  const handleSliderChange = (value: number[]) => {
    if (!audioRef.current) return;
    const newTime = value[0];
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    if (!audioRef.current) return;
    const newVolume = value[0];
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
    
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    
    if (isMuted) {
      audioRef.current.volume = volume > 0 ? volume : 0.7;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handleError = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    console.error("Audio error:", e);
    setIsPlaying(false);
    setIsLoading(false);
    setHasError(true);
    
    // Only show toast on first error
    if (retryCount === 0) {
      const mimeType = getMimeTypeFromDataUrl(audioSrc);
      toast({
        variant: "destructive",
        title: "Playback Error",
        description: `Could not play this recording (${mimeType}). The format may be unsupported.`
      });
    }
  };

  const handleCanPlay = () => {
    setIsLoading(false);
    setHasError(false);
    console.log("Audio can play now");
  };
  
  const handleRetry = async () => {
    // Try different approaches to fix the audio playback
    setRetryCount(prev => prev + 1);
    setHasError(false);
    setIsLoading(true);
    setIsProcessing(true);
    setProcessingStatus("Retrying audio processing...");
    
    try {
      // If we have a URL, try to fetch it and process it again
      if (audioUrl) {
        const response = await fetch(audioUrl);
        const audioBlob = await response.blob();
        
        // Process the audio for compatibility
        const { audioUrl: processedUrl } = await processAudioForCompatibility(audioBlob);
        setAudioSrc(processedUrl);
      }
    } catch (error) {
      console.error("Error during retry:", error);
      // If all else fails, try to set a different format hint
      const formatHint = format || 'mp3';
      const urlWithHint = audioUrl.includes('#') ? audioUrl : `${audioUrl}#.${formatHint}`;
      setAudioSrc(normalizeAudioUrl(urlWithHint));
    } finally {
      setIsProcessing(false);
      
      if (audioRef.current) {
        audioRef.current.load();
      }
    }
  };

  const handleDownload = () => {
    if (!audioSrc) return;
    
    try {
      // Create a download link for the audio
      const downloadLink = document.createElement('a');
      downloadLink.href = audioSrc;
      downloadLink.download = `${title.replace(/\s+/g, '_')}.${format || 'mp3'}`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      toast({
        title: "Download Started",
        description: `Downloading "${title}.${format || 'mp3'}"`,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        variant: "destructive",
        title: "Download Error",
        description: "Could not download the audio file.",
      });
    }
  };

  return (
    <div className="p-4 bg-accent/10 rounded-lg">
      <audio
        ref={audioRef}
        src={audioSrc}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={handleError}
        onCanPlay={handleCanPlay}
        preload="metadata"
      >
        <source src={audioSrc} type="audio/mpeg" />
        <source src={audioSrc} type="audio/mp3" />
        <source src={audioSrc} type="audio/wav" />
        <source src={audioSrc} type="audio/webm" />
        <source src={audioSrc} type="audio/ogg" />
        <source src={audioSrc} type="audio/x-m4a" />
        <source src={audioSrc} type="audio/aac" />
        Your browser does not support the audio element.
      </audio>
      
      <div className="text-sm font-medium mb-2 text-foreground">{title}</div>
      
      {isProcessing && (
        <div className="flex items-center justify-center p-2 mb-3 bg-primary/10 rounded">
          <Loader className="h-4 w-4 mr-2 animate-spin text-primary" />
          <span className="text-sm text-primary">{processingStatus || "Processing Audio..."}</span>
        </div>
      )}
      
      <div className="flex items-center gap-2 mb-3">
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 w-8 p-0" 
          onClick={togglePlay}
          disabled={hasError && retryCount > 1 || isProcessing}
        >
          {isLoading ? (
            <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          ) : isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
        
        <div className="flex-1 flex gap-3 items-center">
          <div className="text-xs text-foreground/70 w-12">
            {formatTime(Math.floor(currentTime))}
          </div>
          <Slider 
            value={[currentTime]} 
            max={duration || 100}
            step={0.1}
            onValueChange={handleSliderChange}
            className="flex-1"
            disabled={hasError && retryCount > 1 || isProcessing}
          />
          <div className="text-xs text-foreground/70 w-12">
            {formatTime(Math.floor(duration))}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={toggleMute}
            disabled={hasError && retryCount > 1 || isProcessing}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Slider 
            value={[isMuted ? 0 : volume]} 
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="w-16"
            disabled={hasError && retryCount > 1 || isProcessing}
          />
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        {transcription && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs flex items-center gap-1"
            onClick={() => setShowTranscription(!showTranscription)}
          >
            <FileText className="h-3 w-3" />
            {showTranscription ? "Hide Transcription" : "Show Transcription"}
          </Button>
        )}
        
        {allowDownload && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs flex items-center gap-1"
            onClick={handleDownload}
            disabled={isProcessing}
          >
            <Download className="h-3 w-3" />
            Download ({format || 'mp3'})
          </Button>
        )}
      </div>
      
      {transcription && showTranscription && (
        <div className="mt-3 p-3 bg-background rounded border text-sm">
          <p>{transcription}</p>
        </div>
      )}
      
      {hasError && (
        <div className="text-xs text-destructive mt-2">
          <div className="flex justify-between items-center">
            <span>Could not play this recording. The format may be unsupported.</span>
            {retryCount < 2 && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-6 text-xs flex items-center gap-1"
                onClick={handleRetry}
              >
                <RefreshCw className="h-3 w-3" />
                Try Again
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
