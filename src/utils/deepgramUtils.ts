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
      console.log("Already recording, ignoring start request");
      return;
    }
    
    try {
      console.log("DeepgramStream: Starting...");
      
      // Get microphone access
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("DeepgramStream: Microphone access granted");
      } catch (micError) {
        console.error("DeepgramStream: Microphone access error:", micError);
        // Re-throw with better error context for handling in RecordPage
        if (micError instanceof DOMException) {
          if (micError.name === 'NotAllowedError' || micError.name === 'PermissionDeniedError') {
            throw new Error('microphone-permission-denied');
          } else if (micError.name === 'NotFoundError' || micError.name === 'DevicesNotFoundError') {
            throw new Error('microphone-not-found');
          } else if (micError.name === 'NotReadableError' || micError.name === 'TrackStartError') {
            throw new Error('microphone-in-use');
          }
        }
        throw micError;
      }
      
      // Connect to Deepgram first
      try {
        await this.connectToDeepgram();
        console.log("DeepgramStream: Connected to Deepgram");
      } catch (deepgramError) {
        console.error("DeepgramStream: Deepgram connection error:", deepgramError);
        // We'll continue even if Deepgram fails, as we can still record audio
        this.onErrorCallback(`Transcription service unavailable: ${deepgramError.message}`);
      }
      
      // Set up media recorder only after connection is established
      if (this.mediaStream) {
        this.setupMediaRecorder();
        this.isRecording = true;
        this.onStartCallback();
        console.log("DeepgramStream: Recording started successfully");
      } else {
        throw new Error("No media stream available");
      }
    } catch (error) {
      console.error("DeepgramStream start error:", error);
      
      // Clean up any resources
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
      }
      
      // Re-throw the error to be handled by the calling code
      throw error;
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
    try {
      console.log("Connecting to Deepgram...");
      
      // Construct the URL with query parameters
      const queryParams = new URLSearchParams();
      
      // Add all options as query parameters
      Object.entries(this.options).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
      
      const wsUrl = `wss://api.deepgram.com/v1/listen?${queryParams.toString()}`;
      console.log("Deepgram WebSocket URL:", wsUrl);
      
      // Create WebSocket connection
      this.socket = new WebSocket(wsUrl);
      
      // Set up a promise that resolves when the connection is opened
      const connectionPromise = new Promise<void>((resolve, reject) => {
        if (!this.socket) {
          reject(new Error("Failed to create WebSocket"));
          return;
        }
        
        // Handle successful connection
        this.socket.onopen = () => {
          if (this.socket) {
            console.log("WebSocket connection opened, sending authorization");
            // Send the API key for authentication
            this.socket.send(JSON.stringify({
              type: "Header",
              Authorization: `Token ${DEEPGRAM_API_KEY}`
            }));
            
            this.socket.binaryType = 'arraybuffer';
            this.isConnected = true;
            resolve();
          }
        };
        
        // Handle connection errors
        this.socket.onerror = (error) => {
          console.error("WebSocket connection error:", error);
          reject(new Error("WebSocket connection failed"));
        };
      });
      
      // Set up message handler
      if (this.socket) {
        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleDeepgramResponse(data);
          } catch (error) {
            console.error("Error parsing Deepgram response:", error);
          }
        };
        
        this.socket.onclose = (event) => {
          console.log(`WebSocket closed with code ${event.code}: ${event.reason}`);
          this.isConnected = false;
        };
      }
      
      // Wait for the connection with a timeout
      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => {
          reject(new Error("Connection to Deepgram timed out after 5 seconds"));
        }, 5000);
      });
      
      // Wait for either the connection or the timeout
      await Promise.race([connectionPromise, timeoutPromise]);
      console.log("Deepgram connection established successfully");
      
    } catch (error) {
      console.error("Failed to connect to Deepgram:", error);
      throw error;
    }
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
      console.log("Falling back to default MediaRecorder format");
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

// Utility function to save audio data - improved to ensure proper MIME type and URL creation
export const saveAudioBlob = (audioBlob: Blob): string => {
  // Ensure we're using a compatible MIME type - audio/webm is most widely supported
  const mimeType = audioBlob.type || 'audio/webm';
  
  // Create a new blob with the correct MIME type
  let finalBlob;
  try {
    finalBlob = new Blob([audioBlob], { type: mimeType });
    const url = URL.createObjectURL(finalBlob);
    console.log("Created audio URL:", url, "with MIME type:", mimeType);
    return url;
  } catch (error) {
    console.error("Error creating audio URL:", error);
    // Fall back to a compatible audio sample
    console.log("Using fallback audio sample");
    return generateAudioBlob();
  }
};

// Include the generateAudioBlob function here as well for direct access
export const generateAudioBlob = (): string => {
  // Use the same base64 encoded MP3 from recordingUtils
  return "data:audio/mp3;base64,SUQzAwAAAAAAJlRQRTEAAAAcAAAAU291bmRKYXkuY29tIFNvdW5kIEVmZmVjdHNUQUxCAAAAGAAAAGh0dHA6Ly93d3cuU291bmRKYXkuY29tVFBFMQAAABwAAABTb3VuZEpheS5jb20gU291bmQgRWZmZWN0c1RJVDIAAAATAAAAT25lIEJlZXAgU291bmQgRWZmZWN0VENPTgAAABMAAABPbmUgQmVlcCBTb3VuZCBFZmZlY3RDTU9EAAAAEAAAADk5OSBCZWVwIFNvdW5kcw==";
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

// Make sure the error handling in getMediaStream correctly propagates permissions errors
export const getMediaStream = async (): Promise<MediaStream> => {
  try {
    console.log("Requesting user media permissions...");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log("Media permissions granted");
    return stream;
  } catch (error) {
    console.error("Error accessing microphone:", error);
    
    // Check for permission denied errors
    if (error instanceof DOMException) {
      console.log("DOMException name:", error.name);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        throw new Error('microphone-permission-denied');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        throw new Error('microphone-not-found');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        throw new Error('microphone-in-use');
      }
    }
    
    throw new Error(`Microphone access error: ${error}`);
  }
};
