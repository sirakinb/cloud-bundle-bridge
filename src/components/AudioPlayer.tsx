
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { formatTime } from "@/utils/formatUtils";
import { useToast } from "@/components/ui/use-toast";

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
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

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
      console.log("Loading audio URL:", audioUrl);
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
  }, [audioUrl]);

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
    toast({
      variant: "destructive",
      title: "Playback Error",
      description: "Could not play this recording. The format may be unsupported."
    });
  };

  const handleCanPlay = () => {
    setIsLoading(false);
    setHasError(false);
  };

  return (
    <div className="p-4 bg-accent/10 rounded-lg">
      <audio
        ref={audioRef}
        src={audioUrl}
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
          disabled={hasError}
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
            disabled={hasError}
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
            disabled={hasError}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Slider 
            value={[isMuted ? 0 : volume]} 
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="w-16"
            disabled={hasError}
          />
        </div>
      </div>
      
      {hasError && (
        <div className="text-xs text-destructive mt-2 text-center">
          Could not play this recording. The format may be unsupported.
        </div>
      )}
    </div>
  );
};
