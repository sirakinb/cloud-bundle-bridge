// Deepgram API integration for real-time speech-to-text

// API key for Deepgram
const DEEPGRAM_API_KEY = "ab7124ea77e023e4eef3e7ec2d9eed6cb4b04413";

interface DeepgramOptions {
  language?: string;
  punctuate?: boolean;
  interim_results?: boolean;
  smart_format?: boolean;
  diarize?: boolean;
  model?: string;
  endpointing?: number | boolean;
  vad_events?: boolean;
  utterance_end?: number;
}

interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
  punctuated_word?: string;
}

interface DeepgramTranscriptAlternative {
  transcript: string;
  confidence: number;
  words: DeepgramWord[];
}

interface DeepgramResults {
  channel: {
    alternatives: DeepgramTranscriptAlternative[];
  };
  metadata: {
    request_id: string;
    model_info: {
      name: string;
      version: string;
    };
  };
  type: string;
  duration: number;
  start: number;
  is_final: boolean;
  speech_final: boolean;
}

// Class for managing the WebSocket connection to Deepgram
export class DeepgramStream {
  private socket: WebSocket | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private options: DeepgramOptions;
  private isConnected = false;
  private isRecording = false;
  
  // Callback functions
  private onTranscriptCallback: (text: string, isFinal: boolean) => void = () => {};
  private onStartCallback: () => void = () => {};
  private onStopCallback: () => void = () => {};
  private onErrorCallback: (error: string) => void = () => {};
  
  constructor(options: DeepgramOptions = {}) {
    this.options = {
      language: "en",
      punctuate: true,
      smart_format: true,
      interim_results: true,
      model: "nova-2",
      ...options
    };
  }
  
  // Set up event handlers
  public onTranscript(callback: (text: string, isFinal: boolean) => void): void {
    this.onTranscriptCallback = callback;
  }
  
  public onStart(callback: () => void): void {
    this.onStartCallback = callback;
  }
  
  public onStop(callback: () => void): void {
    this.onStopCallback = callback;
  }
  
  public onError(callback: (error: string) => void): void {
    this.onErrorCallback = callback;
  }
  
  // Initialize and start the recording and transcription
  public async start(): Promise<void> {
    if (this.isRecording) {
      return;
    }
    
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      await this.connectToDeepgram();
      this.setupMediaRecorder();
      this.isRecording = true;
      this.onStartCallback();
    } catch (error) {
      this.onErrorCallback(`Failed to start recording: ${error}`);
    }
  }
  
  // Stop recording and close connections
  public stop(): void {
    if (!this.isRecording) {
      return;
    }
    
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    
    if (this.socket && this.isConnected) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    this.isRecording = false;
    this.onStopCallback();
  }
  
  // Pause the recording
  public pause(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
    }
  }
  
  // Resume the recording
  public resume(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
    }
  }
  
  // Get connection status
  public get isActive(): boolean {
    return this.isRecording;
  }
  
  // Create a WebSocket connection to Deepgram
  private async connectToDeepgram(): Promise<void> {
    // Construct the URL with query parameters
    const queryParams = new URLSearchParams();
    
    // Add all options as query parameters
    Object.entries(this.options).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    const wsUrl = `wss://api.deepgram.com/v1/listen?${queryParams.toString()}`;
    
    // Create WebSocket connection
    this.socket = new WebSocket(wsUrl);
    
    // Set authorization header
    this.socket.onopen = () => {
      if (this.socket) {
        // Using the static header method for WebSockets
        this.socket.binaryType = 'arraybuffer';
        this.isConnected = true;
        console.log("Connected to Deepgram");
      }
    };
    
    // Handle incoming messages
    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleDeepgramResponse(data);
      } catch (error) {
        console.error("Error parsing Deepgram response:", error);
      }
    };
    
    // Handle errors
    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      this.onErrorCallback(`WebSocket error: ${error}`);
    };
    
    // Handle closing
    this.socket.onclose = (event) => {
      console.log(`WebSocket closed with code ${event.code}: ${event.reason}`);
      this.isConnected = false;
    };
    
    // Wait for connection to be established
    await new Promise<void>((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Socket is null"));
        return;
      }
      
      const onOpen = () => {
        this.socket?.removeEventListener('open', onOpen);
        this.socket?.removeEventListener('error', onError);
        resolve();
      };
      
      const onError = (err: Event) => {
        this.socket?.removeEventListener('open', onOpen);
        this.socket?.removeEventListener('error', onError);
        reject(new Error(`WebSocket connection failed: ${err}`));
      };
      
      this.socket.addEventListener('open', onOpen);
      this.socket.addEventListener('error', onError);
    });
  }
  
  // Set up the MediaRecorder for audio capturing
  private setupMediaRecorder(): void {
    if (!this.mediaStream) {
      return;
    }
    
    // Use audio/webm for better compatibility
    const options = { mimeType: 'audio/webm' };
    
    try {
      this.mediaRecorder = new MediaRecorder(this.mediaStream, options);
    } catch (error) {
      // Fallback if the browser doesn't support audio/webm
      this.mediaRecorder = new MediaRecorder(this.mediaStream);
    }
    
    // Send audio data to Deepgram when available
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0 && this.socket && this.isConnected) {
        this.socket.send(event.data);
      }
    };
    
    // Set to capture data frequently for low latency
    this.mediaRecorder.start(250);
  }
  
  // Process the transcription response from Deepgram
  private handleDeepgramResponse(data: DeepgramResults): void {
    if (data.type !== 'Results') {
      return;
    }
    
    const alternatives = data.channel?.alternatives;
    if (!alternatives || alternatives.length === 0) {
      return;
    }
    
    const transcript = alternatives[0].transcript;
    const isFinal = data.is_final;
    
    if (transcript) {
      this.onTranscriptCallback(transcript, isFinal);
    }
  }
}

// Utility function to save audio data - fixed to ensure proper MIME type and URL creation
export const saveAudioBlob = (audioBlob: Blob): string => {
  // Ensure we have the correct MIME type
  const blob = new Blob([audioBlob], { type: 'audio/webm' });
  const url = URL.createObjectURL(blob);
  console.log("Created audio URL:", url);
  return url;
};

// Get raw audio data from microphone and return as blob
export const captureAudio = async (): Promise<Blob> => {
  try {
    // Request access to the microphone
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    return new Promise((resolve, reject) => {
      // Create a new MediaRecorder instance
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: BlobPart[] = [];
      
      // When data is available, add it to the chunks array
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      // When recording stops, create a Blob from the chunks and resolve
      mediaRecorder.onstop = () => {
        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop());
        
        // Create a Blob from the chunks
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        resolve(audioBlob);
      };
      
      // Start recording for a short time (for demo purposes)
      mediaRecorder.start();
      
      // Stop recording after 3 seconds
      setTimeout(() => {
        mediaRecorder.stop();
      }, 3000);
    });
  } catch (error) {
    console.error("Error accessing microphone:", error);
    throw error;
  }
};
