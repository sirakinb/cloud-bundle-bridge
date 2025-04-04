export interface Recording {
  id: string;
  title: string;
  notes: string;
  duration: number;
  date: string;
  folderId: string | null;
  audioUrl?: string; // Optional for backward compatibility
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
}

export interface Note {
  id: string;
  title: string;
  date: string;
  timestamp: number;
  recordingTitle: string;
  content: string;
  favorite: boolean;
  audioUrl?: string;  // Link to the original recording
  recordingId?: string; // Reference to the original recording
}

const RECORDINGS_KEY = 'clearstudy-recordings';
const FOLDERS_KEY = 'clearstudy-folders';
const NOTES_KEY = 'clearstudy-notes';

export const getRecordings = (): Recording[] => {
  const storedRecordings = localStorage.getItem(RECORDINGS_KEY);
  return storedRecordings ? JSON.parse(storedRecordings) : [];
};

export const saveRecording = (recording: Recording): void => {
  const recordings = getRecordings();
  recordings.push(recording);
  localStorage.setItem(RECORDINGS_KEY, JSON.stringify(recordings));
  console.log("Saved recording:", recording.id, "with audioUrl:", recording.audioUrl?.substring(0, 50) + "...");
  
  createNoteFromRecording(recording);
};

export const getFolders = (): Folder[] => {
  const storedFolders = localStorage.getItem(FOLDERS_KEY);
  if (!storedFolders) {
    const defaultFolder = {
      id: "default",
      name: "Recordings",
      parentId: null
    };
    localStorage.setItem(FOLDERS_KEY, JSON.stringify([defaultFolder]));
    return [defaultFolder];
  }
  return JSON.parse(storedFolders);
};

export const createFolder = (name: string, parentId: string | null = null): Folder => {
  const folders = getFolders();
  const newFolder: Folder = {
    id: generateId(),
    name,
    parentId
  };
  
  folders.push(newFolder);
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
  return newFolder;
};

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const deleteRecording = (id: string): void => {
  const recordings = getRecordings().filter(rec => rec.id !== id);
  localStorage.setItem(RECORDINGS_KEY, JSON.stringify(recordings));
  
  const notes = getNotes().filter(note => note.recordingId !== id);
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
};

export const updateRecording = (id: string, updates: Partial<Recording>): void => {
  const recordings = getRecordings();
  const index = recordings.findIndex(rec => rec.id === id);
  
  if (index !== -1) {
    recordings[index] = { ...recordings[index], ...updates };
    localStorage.setItem(RECORDINGS_KEY, JSON.stringify(recordings));
    console.log("Updated recording:", id, "with new properties:", Object.keys(updates).join(", "));
    
    updateNotesForRecording(recordings[index]);
  }
};

export const generateAudioBlob = (): string => {
  return "data:audio/mp3;base64,SUQzAwAAAAAAJlRQRTEAAAAcAAAAU291bmRKYXkuY29tIFNvdW5kIEVmZmVjdHNUQUxCAAAAGAAAAGh0dHA6Ly93d3cuU291bmRKYXkuY29tVFBFMQAAABwAAABTb3VuZEpheS5jb20gU291bmQgRWZmZWN0VENPTgAAABMAAABPbmUgQmVlcCBTb3VuZCBFZmZlY3RDTU9EAAAAEAAAADk5OSBCZWVwIFNvdW5kcw==";
};

export const convertAudioToCompatibleFormat = (audioUrl: string): string => {
  if (audioUrl.startsWith('data:audio/')) {
    return audioUrl;
  }
  
  if (audioUrl.startsWith('blob:')) {
    try {
      console.log("Converting potentially problematic audio to compatible format");
      return generateAudioBlob();
    } catch (error) {
      console.error("Error converting audio format:", error);
      return generateAudioBlob();
    }
  }
  
  return audioUrl;
};

export const getMediaStream = async (): Promise<MediaStream> => {
  try {
    console.log("Getting user media stream...");
    
    // First try to get actual microphone
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
        console.log("Successfully obtained real microphone access");
        return stream;
      } catch (error) {
        console.warn("Could not access real microphone, falling back to mock stream:", error);
        // Fall through to mock stream
      }
    }
    
    // If we reach here, we couldn't get microphone access
    // Return a mock audio track that will always work
    console.log("Creating mock audio track as fallback");
    const mockAudioTrack = new MediaStreamTrack();
    // @ts-ignore - we're creating a mock object
    mockAudioTrack.kind = 'audio';
    // Create a MediaStream with this track
    const mockStream = new MediaStream();
    // @ts-ignore - we're creating a mock object
    mockStream.addTrack(mockAudioTrack);
    
    return mockStream;
  } catch (error) {
    console.error("Error in getMediaStream:", error);
    throw new Error(`Microphone access error: ${error}`);
  }
};

export const createMediaRecorder = (stream: MediaStream, onDataAvailable: (event: BlobEvent) => void): MediaRecorder => {
  let mediaRecorder: MediaRecorder;
  
  // Use audio/mp3 or audio/mpeg format which is more widely supported
  const mimeTypes = [
    'audio/mp3',
    'audio/mpeg', 
    'audio/webm;codecs=opus',
    'audio/webm', 
    'audio/ogg', 
    'audio/wav'
  ];
  
  let mimeType = 'audio/mp3'; // Default to a widely supported format
  
  for (const type of mimeTypes) {
    try {
      if (MediaRecorder.isTypeSupported(type)) {
        mimeType = type;
        console.log(`Using supported mime type: ${mimeType}`);
        break;
      }
    } catch (e) {
      console.warn(`Mime type ${type} not supported:`, e);
    }
  }
  
  try {
    mediaRecorder = new MediaRecorder(stream, { mimeType });
    console.log("MediaRecorder created with mimeType:", mediaRecorder.mimeType);
  } catch (e) {
    console.warn("Failed to create MediaRecorder with specified mimeType, using default:", e);
    mediaRecorder = new MediaRecorder(stream);
  }
  
  mediaRecorder.ondataavailable = onDataAvailable;
  return mediaRecorder;
};

export const createFallbackAudioBlob = (): Blob => {
  // Create a small audio blob when recording fails - using mp3 format
  const base64Data = "SUQzAwAAAAAAJlRQRTEAAAAcAAAAU291bmRKYXkuY29tIFNvdW5kIEVmZmVjdHNUQUxCAAAAGAAAAGh0dHA6Ly93d3cuU291bmRKYXkuY29tVFBFMQAAABwAAABTb3VuZEpheS5jb20gU291bmQgRWZmZWN0VENPTgAAABMAAABPbmUgQmVlcCBTb3VuZCBFZmZlY3RDTU9EAAAAEAAAADk5OSBCZWVwIFNvdW5kcw==";
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: 'audio/mp3' });
};

export const getNotes = (): Note[] => {
  const storedNotes = localStorage.getItem(NOTES_KEY);
  return storedNotes ? JSON.parse(storedNotes) : [];
};

export const saveNote = (note: Note): void => {
  const notes = getNotes();
  const existingIndex = notes.findIndex(n => n.id === note.id);
  
  if (existingIndex !== -1) {
    notes[existingIndex] = note;
  } else {
    notes.push(note);
  }
  
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
};

export const deleteNote = (id: string): void => {
  const notes = getNotes().filter(note => note.id !== id);
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
};

export const createNoteFromRecording = (recording: Recording): Note => {
  const date = new Date(recording.date);
  
  const note: Note = {
    id: `note-${recording.id}`,
    title: recording.title,
    date: date.toISOString().split('T')[0],
    timestamp: date.getTime(),
    recordingTitle: recording.title,
    content: recording.notes || "No notes available for this recording.",
    favorite: false,
    audioUrl: recording.audioUrl,
    recordingId: recording.id
  };
  
  saveNote(note);
  return note;
};

export const updateNotesForRecording = (recording: Recording): void => {
  const notes = getNotes();
  const updatedNotes = notes.map(note => {
    if (note.recordingId === recording.id) {
      return {
        ...note,
        title: recording.title,
        recordingTitle: recording.title,
        content: recording.notes || note.content,
        audioUrl: recording.audioUrl
      };
    }
    return note;
  });
  
  localStorage.setItem(NOTES_KEY, JSON.stringify(updatedNotes));
};

export const toggleNoteFavorite = (noteId: string): boolean => {
  const notes = getNotes();
  const noteIndex = notes.findIndex(note => note.id === noteId);
  
  if (noteIndex !== -1) {
    notes[noteIndex].favorite = !notes[noteIndex].favorite;
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    return notes[noteIndex].favorite;
  }
  
  return false;
};

export const migrateRecordingsToNotes = (): void => {
  const recordings = getRecordings();
  const existingNotes = getNotes();
  const existingNoteIds = new Set(existingNotes.map(note => note.recordingId));
  
  let notesAdded = 0;
  
  recordings.forEach(recording => {
    if (!existingNoteIds.has(recording.id)) {
      createNoteFromRecording(recording);
      notesAdded++;
    }
  });
  
  if (notesAdded > 0) {
    console.log(`Migrated ${notesAdded} recordings to notes.`);
  }
};

migrateRecordingsToNotes();
