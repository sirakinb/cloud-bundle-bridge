
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Folder, FolderPlus, ChevronRight } from "lucide-react";
import { getFolders, createFolder, Folder as FolderType } from "@/utils/recordingUtils";

interface FolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectFolder: (folderId: string) => void;
}

export function FolderDialog({ open, onOpenChange, onSelectFolder }: FolderDialogProps) {
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  
  useEffect(() => {
    setFolders(getFolders());
  }, [open]);
  
  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      const newFolder = createFolder(newFolderName, currentFolder);
      setFolders([...folders, newFolder]);
      setNewFolderName("");
      setShowNewFolderInput(false);
    }
  };
  
  const handleSelectFolder = (id: string) => {
    onSelectFolder(id);
    onOpenChange(false);
  };
  
  const getCurrentFolderName = () => {
    if (!currentFolder) return "Root";
    const folder = folders.find(f => f.id === currentFolder);
    return folder ? folder.name : "Root";
  };
  
  const navigateToFolder = (folderId: string | null) => {
    setCurrentFolder(folderId);
  };
  
  const getCurrentSubfolders = () => {
    return folders.filter(folder => folder.parentId === currentFolder);
  };
  
  const getParentFolder = () => {
    if (!currentFolder) return null;
    const current = folders.find(f => f.id === currentFolder);
    return current ? current.parentId : null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save to Folder</DialogTitle>
          <DialogDescription>
            Select a folder to save your recording or create a new one.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex items-center mb-4 text-sm text-muted-foreground">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigateToFolder(null)}
              className="px-2"
            >
              Root
            </Button>
            
            {currentFolder && (
              <>
                <ChevronRight className="h-4 w-4 mx-1" />
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {}}
                  className="px-2"
                >
                  {getCurrentFolderName()}
                </Button>
              </>
            )}
          </div>
          
          {currentFolder !== null && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateToFolder(getParentFolder())}
              className="mb-2"
            >
              ← Go Back
            </Button>
          )}
          
          <div className="space-y-2 max-h-52 overflow-y-auto border rounded-md p-2">
            {getCurrentSubfolders().length === 0 ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No folders here. Create a new folder to organize your recordings.
              </div>
            ) : (
              getCurrentSubfolders().map(folder => (
                <div key={folder.id} className="flex justify-between items-center">
                  <div 
                    className="flex items-center p-2 hover:bg-accent rounded-md cursor-pointer w-full"
                    onClick={() => navigateToFolder(folder.id)}
                  >
                    <Folder className="h-4 w-4 mr-2" />
                    <span>{folder.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSelectFolder(folder.id)}
                  >
                    Select
                  </Button>
                </div>
              ))
            )}
          </div>
          
          {showNewFolderInput ? (
            <div className="mt-4 space-y-2">
              <Label htmlFor="folder-name">Folder Name</Label>
              <div className="flex gap-2">
                <Input 
                  id="folder-name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name"
                />
                <Button size="sm" onClick={handleCreateFolder}>Create</Button>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowNewFolderInput(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewFolderInput(true)}
              className="mt-4"
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
          )}
        </div>
        
        <DialogFooter className="flex justify-between">
          <Button 
            variant="secondary" 
            onClick={() => handleSelectFolder("default")}
          >
            Save to Default
          </Button>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
