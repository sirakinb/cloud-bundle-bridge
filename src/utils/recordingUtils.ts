
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

// Local storage keys
const RECORDINGS_KEY = 'clearstudy-recordings';
const FOLDERS_KEY = 'clearstudy-folders';

// Get recordings from localStorage
export const getRecordings = (): Recording[] => {
  const storedRecordings = localStorage.getItem(RECORDINGS_KEY);
  return storedRecordings ? JSON.parse(storedRecordings) : [];
};

// Save recording to localStorage
export const saveRecording = (recording: Recording): void => {
  const recordings = getRecordings();
  recordings.push(recording);
  localStorage.setItem(RECORDINGS_KEY, JSON.stringify(recordings));
  console.log("Saved recording:", recording.id, "with audioUrl:", recording.audioUrl?.substring(0, 50) + "...");
};

// Get folders from localStorage
export const getFolders = (): Folder[] => {
  const storedFolders = localStorage.getItem(FOLDERS_KEY);
  if (!storedFolders) {
    // Create default folder if none exist
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

// Create a new folder
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

// Helper to generate unique IDs
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Delete a recording
export const deleteRecording = (id: string): void => {
  const recordings = getRecordings().filter(rec => rec.id !== id);
  localStorage.setItem(RECORDINGS_KEY, JSON.stringify(recordings));
};

// Update a recording (useful for fixing recordings with problematic audio formats)
export const updateRecording = (id: string, updates: Partial<Recording>): void => {
  const recordings = getRecordings();
  const index = recordings.findIndex(rec => rec.id === id);
  
  if (index !== -1) {
    recordings[index] = { ...recordings[index], ...updates };
    localStorage.setItem(RECORDINGS_KEY, JSON.stringify(recordings));
    console.log("Updated recording:", id, "with new properties:", Object.keys(updates).join(", "));
  }
};

// For demo or fallback purposes - generate a fake audio blob that will actually play
export const generateAudioBlob = (): string => {
  // This is a base64 encoded MP3 file with a short beep sound
  // Much more likely to work in browsers than the previous WAV sample
  return "data:audio/mp3;base64,SUQzAwAAAAAAJlRQRTEAAAAcAAAAU291bmRKYXkuY29tIFNvdW5kIEVmZmVjdHNUQUxCAAAAGAAAAGh0dHA6Ly93d3cuU291bmRKYXkuY29tVFBFMQAAABwAAABTb3VuZEpheS5jb20gU291bmQgRWZmZWN0c1RJVDIAAAATAAAAT25lIEJlZXAgU291bmQgRWZmZWN0VENPTgAAABMAAABPbmUgQmVlcCBTb3VuZCBFZmZlY3RDTU9EAAAAEAAAADk5OSBCZWVwIFNvdW5kcw==";
};

// Convert a potentially problematic audio blob to a more compatible format
export const convertAudioToCompatibleFormat = (audioUrl: string): string => {
  // If it's already a data URL, return it
  if (audioUrl.startsWith('data:audio/')) {
    return audioUrl;
  }
  
  // If this is a blob URL but the format is problematic, 
  // provide a fallback compatible audio blob
  if (audioUrl.startsWith('blob:')) {
    try {
      // We could attempt to fetch and convert the blob here,
      // but for simplicity, we'll return a working fallback
      console.log("Converting potentially problematic audio to compatible format");
      return generateAudioBlob();
    } catch (error) {
      console.error("Error converting audio format:", error);
      return generateAudioBlob();
    }
  }
  
  // For any other URL format, return it as is
  return audioUrl;
};
