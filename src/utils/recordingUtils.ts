
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

// For demo purposes - generate a fake audio blob
export const generateAudioBlob = (): string => {
  // This is a placeholder - in a real app, this would be an actual audio recording
  // Creating a dummy audio data URL for demonstration
  return "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAASAAAeMwAUFBQUFCIiIiIiIjAwMDAwMD09PT09PUlJSUlJSVZWVlZWVmJiYmJiYm9vb29vb3t7e3t7e4iIiIiIiJSUlJSUlKCgoKCgoKysrKysrLi4uLi4uMTExMTExNDQ0NDQ0NfX19fX19jY2NjY2N/f39/f3+Li4uLi4unp6enp6fDw8PDw8Pj4+Pj4+P8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAQKAAAAAAAAHjOZTf9/AAAAAAAAAAAAAAAAAAAAAP/7kGQAAANUMEoFPeACNQV40KEYABEY41g5vAAA9RjpZxRwAImU+W8eshaFpAQgALAAYALATx/nYDYCMJ0HITQYYA7AH4c7MoGsnCMU5pnW+OQnBcDrS9s4sIv3vcrKJJbYxiWNNNgmmrmurHHHIAAgAAgAAEVFGlunl3tQ5Su7OBUFBQUVpjDahFSANAH/+XAGje5T6mU7BF8YwNMDlP8gGAzOP6KMOT/oEEryc1CEsSZzP6EWcgEAUlAUCKVBISYdWpSS5OjVJe0hnAsy7YBwJl/i9m/yk3ODKQUqp0K9VNTCfn9kVCmMRFQaigox+n3ElSPkYQOTCCJFW3jXn9vR3cR0jQBwJC0aN0X9vR3cR0jQN4JC0aN0X9JanfjKAcbcOgemU3OT3MT3omUBd/ayJvqothYIh4a8rCgpyjpGWAYRx1uXeK36dvoU9qwVGi8uDI7iw9Z0dE4uJAn7KbXJ7mNbMYmMzm7h6OYMdEG/RwH/+5JkC4ADxyLSCe5gAkZmzOBvYYpG7M9KBaDwCEGZKMMuCCojmzh6PYMdEG/dHD0ewe9h3MVf9MFPcKM5h5VEZ0s0LRBICE4UsKc8ViJFrRVa1VKtlKoFAEmAwDQRk3a1VKtlKsFNCgGTC4LAYdSqRVaFStlKoFAAGBwXQ8AhyqlUtlKoFQAiDAEh4EidDYLAEeShZVVKqlUigBTAuBsR9YqhVJSlUCkARAULIkQILPAoFl1VVVVWpqgIBoGC0VqZVVVTVVapCQAAEMAAIBQMBQAds5S1XDZgAtrRlhoNAIIAEMAAJdVVTEFNRTMuOTguNFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";
};
