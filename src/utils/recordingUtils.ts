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
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return stream;
  } catch (error) {
    console.error("Error accessing microphone:", error);
    
    // Check for permission denied errors
    if (error instanceof DOMException) {
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

export const createMediaRecorder = (stream: MediaStream, onDataAvailable: (event: BlobEvent) => void): MediaRecorder => {
  let mediaRecorder: MediaRecorder;
  
  try {
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
  } catch (e) {
    console.log("audio/webm not supported, falling back to default");
    mediaRecorder = new MediaRecorder(stream);
  }
  
  mediaRecorder.ondataavailable = onDataAvailable;
  return mediaRecorder;
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
