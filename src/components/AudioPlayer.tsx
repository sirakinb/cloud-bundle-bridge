
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, VolumeX, RefreshCw } from "lucide-react";
import { formatTime } from "@/utils/formatUtils";
import { useToast } from "@/hooks/use-toast";
import { convertAudioToCompatibleFormat, generateAudioBlob } from "@/utils/recordingUtils";

interface AudioPlayerProps {
  audioUrl: string;
  title: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, title }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  // Always ensure we have a compatible audio format
  const safeAudioUrl = audioUrl.startsWith('data:audio/') 
    ? audioUrl 
    : convertAudioToCompatibleFormat(audioUrl);

  // Auto-play when a new recording is selected
  useEffect(() => {
    if (audioRef.current) {
      // Reset player state for new recordings
      setCurrentTime(0);
      setIsPlaying(false);
      setIsLoading(true);
      setHasError(false);
      
      // Load the new audio source
      audioRef.current.load();
      console.log("Loading audio URL:", safeAudioUrl.substring(0, 50));
    }
    
    // Clean up function to revoke object URLs when component unmounts or URL changes
    return () => {
      if (audioUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(audioUrl);
          console.log("Revoked audio URL:", audioUrl);
        } catch (error) {
          console.error("Error revoking URL:", error);
        }
      }
    };
  }, [safeAudioUrl]);

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
            toast({
              variant: "destructive",
              title: "Playback Error",
              description: "Could not play this recording. The format may be unsupported."
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
      toast({
        variant: "destructive",
        title: "Playback Error",
        description: "Could not play this recording. The format may be unsupported."
      });
    }
  };

  const handleCanPlay = () => {
    setIsLoading(false);
    setHasError(false);
  };
  
  const handleRetry = () => {
    // Use a fallback audio format on retry
    const fallbackAudio = generateAudioBlob();
    if (audioRef.current) {
      audioRef.current.src = fallbackAudio;
      audioRef.current.load();
    }
    
    setRetryCount(prev => prev + 1);
    setHasError(false);
    setIsLoading(true);
    console.log("Retrying with fallback audio format");
  };

  return (
    <div className="p-4 bg-accent/10 rounded-lg">
      <audio
        ref={audioRef}
        src={safeAudioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={handleError}
        onCanPlay={handleCanPlay}
        preload="metadata"
      />
      
      <div className="text-sm font-medium mb-2 text-foreground">{title}</div>
      
      <div className="flex items-center gap-2 mb-3">
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 w-8 p-0" 
          onClick={togglePlay}
          disabled={hasError && retryCount > 0}
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
            disabled={hasError && retryCount > 0}
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
            disabled={hasError && retryCount > 0}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Slider 
            value={[isMuted ? 0 : volume]} 
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="w-16"
            disabled={hasError && retryCount > 0}
          />
        </div>
      </div>
      
      {hasError && (
        <div className="text-xs text-destructive mt-2">
          <div className="flex justify-between items-center">
            <span>Could not play this recording. The format may be unsupported.</span>
            {retryCount === 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-6 text-xs flex items-center gap-1"
                onClick={handleRetry}
              >
                <RefreshCw className="h-3 w-3" />
                Try Fallback
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
