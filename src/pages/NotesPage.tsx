
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/AppSidebar";
import { FileText, Mic, Star, Save, Edit, Check, X, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "@/contexts/ThemeContext";
import { getNotes, saveNote, toggleNoteFavorite, Note, deleteNote } from "@/utils/recordingUtils";
import { AudioPlayer } from "@/components/AudioPlayer";

const NotesPage = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const { toast } = useToast();
  const { colorScheme } = useTheme();

  // Load notes when component mounts
  useEffect(() => {
    const loadedNotes = getNotes();
    setNotes(loadedNotes);
    
    if (loadedNotes.length > 0) {
      setSelectedNote(loadedNotes[0]);
    }
  }, []);

  const filteredNotes = () => {
    switch (activeTab) {
      case "recent":
        return [...notes].sort((a, b) => b.timestamp - a.timestamp).slice(0, 3);
      case "favorites":
        return notes.filter(note => note.favorite);
      default:
        return notes;
    }
  };

  const toggleFavorite = (noteId: string) => {
    const isFavorite = toggleNoteFavorite(noteId);
    
    // Update our local state
    const updatedNotes = notes.map(note => 
      note.id === noteId ? { ...note, favorite: isFavorite } : note
    );
    
    setNotes(updatedNotes);
    
    if (selectedNote && selectedNote.id === noteId) {
      setSelectedNote({...selectedNote, favorite: isFavorite});
    }
    
    const action = isFavorite ? "added to" : "removed from";
    const currentNote = notes.find(note => note.id === noteId);
    
    if (currentNote) {
      toast({
        title: `Note ${action} favorites`,
        description: `"${currentNote.title}" has been ${action} your favorites`,
      });
    }
  };

  const handleEdit = () => {
    if (!selectedNote) return;
    setEditedContent(selectedNote.content);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!selectedNote) return;
    
    const updatedNote = {
      ...selectedNote,
      content: editedContent
    };
    
    saveNote(updatedNote);
    
    // Update our local state
    const updatedNotes = notes.map(note => 
      note.id === selectedNote.id ? updatedNote : note
    );
    
    setNotes(updatedNotes);
    setSelectedNote(updatedNote);
    setIsEditing(false);
    
    toast({
      title: "Note saved",
      description: "Your changes have been saved successfully",
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedContent("");
    
    toast({
      title: "Editing cancelled",
      description: "Your changes have been discarded",
      variant: "destructive",
    });
  };

  const handleDeleteNote = (noteId: string) => {
    deleteNote(noteId);
    
    // Update our local state
    const updatedNotes = notes.filter(note => note.id !== noteId);
    setNotes(updatedNotes);
    
    // If the deleted note was selected, select the first note
    if (selectedNote && selectedNote.id === noteId) {
      setSelectedNote(updatedNotes.length > 0 ? updatedNotes[0] : null);
    }
    
    toast({
      title: "Note deleted",
      description: "The note has been permanently removed",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1">
        <div className="container mx-auto py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Your Notes</h1>
            <p className="text-muted-foreground">View and manage your notes from recordings</p>
          </div>

          <Tabs defaultValue="all" onValueChange={setActiveTab} value={activeTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Notes</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
            </TabsList>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Notes List</CardTitle>
                    <CardDescription>Select a note to view</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[60vh]">
                      {filteredNotes().length > 0 ? (
                        filteredNotes().map((note) => (
                          <div
                            key={note.id}
                            className={`p-4 cursor-pointer border-l-4 ${
                              selectedNote?.id === note.id
                                ? "border-primary bg-accent/20"
                                : "border-transparent hover:bg-accent/10"
                            }`}
                            onClick={() => setSelectedNote(note)}
                          >
                            <div className="flex justify-between items-start">
                              <h3 className="font-medium">{note.title}</h3>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className={cn(
                                  "h-8 w-8 animate-spin-hover", 
                                  note.favorite && "text-yellow-500"
                                )}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(note.id);
                                }}
                              >
                                <Star 
                                  className={cn(
                                    "h-4 w-4", 
                                    note.favorite ? "fill-yellow-500" : ""
                                  )} 
                                />
                              </Button>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <span>{formatDate(note.date)}</span>
                              <span>•</span>
                              <span className="flex items-center">
                                <Mic className="h-3 w-3 mr-1" />
                                {note.recordingTitle}
                              </span>
                            </div>
                            {note.audioUrl && (
                              <div className="mt-1 text-xs text-primary flex items-center">
                                <Volume2 className="h-3 w-3 mr-1" />
                                <span>Audio available</span>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                          <p>No notes found in this category</p>
                          <p className="text-sm mt-2">Try recording a lecture first!</p>
                          <Button 
                            variant="outline" 
                            className="mt-4"
                            onClick={() => window.location.href = '/record'}
                          >
                            <Mic className="h-4 w-4 mr-2" />
                            Record a Lecture
                          </Button>
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              <div className="md:col-span-2">
                {selectedNote ? (
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{selectedNote.title}</CardTitle>
                          <CardDescription className="flex items-center mt-1">
                            <span>{formatDate(selectedNote.date)}</span>
                            <span className="mx-2">•</span>
                            <span className="flex items-center">
                              <Mic className="h-3 w-3 mr-1" />
                              {selectedNote.recordingTitle}
                            </span>
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!isEditing ? (
                            <>
                              <Button 
                                variant="outline" 
                                size="icon"
                                className="h-9 w-9 animate-fade-in"
                                onClick={handleEdit}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="icon"
                                className="h-9 w-9 text-destructive animate-fade-in"
                                onClick={() => handleDeleteNote(selectedNote.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button 
                                variant="outline" 
                                size="icon"
                                className="h-9 w-9 text-destructive animate-fade-in"
                                onClick={handleCancel}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="icon"
                                className="h-9 w-9 text-primary animate-fade-in"
                                onClick={handleSave}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={cn(
                              "h-9 w-9 animate-spin-hover", 
                              selectedNote.favorite && "text-yellow-500 favorite-star active"
                            )}
                            onClick={() => toggleFavorite(selectedNote.id)}
                          >
                            <Star 
                              className={cn(
                                "h-5 w-5", 
                                selectedNote.favorite ? "fill-yellow-500" : ""
                              )} 
                            />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <Separator />
                    
                    {selectedNote.audioUrl && (
                      <div className="px-6 pt-4">
                        <AudioPlayer
                          audioUrl={selectedNote.audioUrl}
                          title={selectedNote.recordingTitle}
                        />
                      </div>
                    )}
                    
                    <CardContent className="pt-4">
                      <ScrollArea className="h-[50vh]">
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          {isEditing ? (
                            <Textarea
                              value={editedContent}
                              onChange={(e) => setEditedContent(e.target.value)}
                              className="min-h-[40vh] w-full p-4 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                              placeholder="Edit your note content here..."
                            />
                          ) : (
                            <p>{selectedNote.content}</p>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="flex items-center justify-center h-[60vh]">
                    <div className="text-center p-6">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-lg text-muted-foreground">Select a note to view its content</p>
                      {notes.length === 0 && (
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => window.location.href = '/record'}
                        >
                          <Mic className="h-4 w-4 mr-2" />
                          Record a Lecture
                        </Button>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default NotesPage;
