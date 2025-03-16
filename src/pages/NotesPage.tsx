import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/AppSidebar";
import { FileText, Mic, Star, Save, Edit, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";

const mockNotes = [
  {
    id: "note-1",
    title: "Biology Class Notes",
    date: "2023-05-15",
    timestamp: new Date("2023-05-15T10:30:00").getTime(),
    recordingTitle: "Biology Lecture",
    content: "Cell structure and function: Cells are the basic unit of life. They contain organelles that perform specific functions.",
    favorite: true,
  },
  {
    id: "note-2",
    title: "Chemistry Study",
    date: "2023-05-17",
    timestamp: new Date("2023-05-17T14:15:00").getTime(),
    recordingTitle: "Chemistry Lab Session",
    content: "Chemical reactions: Exothermic reactions release energy, endothermic reactions absorb energy.",
    favorite: false,
  },
  {
    id: "note-3",
    title: "Math Formulas",
    date: "2023-05-20",
    timestamp: new Date("2023-05-20T09:00:00").getTime(),
    recordingTitle: "Calculus Lecture",
    content: "Integration formulas and techniques. Applications of integration in volume calculation.",
    favorite: true,
  },
  {
    id: "note-4",
    title: "Physics Laws",
    date: "2023-05-22",
    timestamp: new Date("2023-05-22T11:45:00").getTime(),
    recordingTitle: "Physics Class",
    content: "Newton's laws of motion: 1. An object at rest stays at rest, and an object in motion stays in motion unless acted upon by a force.",
    favorite: false,
  },
];

const NotesPage = () => {
  const [notes, setNotes] = useState(mockNotes);
  const [selectedNote, setSelectedNote] = useState(notes[0]);
  const [activeTab, setActiveTab] = useState("all");
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const { toast } = useToast();

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
    const updatedNotes = notes.map(note => 
      note.id === noteId ? { ...note, favorite: !note.favorite } : note
    );
    
    setNotes(updatedNotes);
    
    if (selectedNote.id === noteId) {
      const updatedSelectedNote = updatedNotes.find(note => note.id === noteId);
      if (updatedSelectedNote) {
        setSelectedNote(updatedSelectedNote);
      }
    }
    
    const currentNote = notes.find(note => note.id === noteId);
    if (currentNote) {
      const action = currentNote.favorite ? "removed from" : "added to";
      toast({
        title: `Note ${action} favorites`,
        description: `"${currentNote.title}" has been ${action} your favorites`,
      });
    }
  };

  const handleEdit = () => {
    setEditedContent(selectedNote.content);
    setIsEditing(true);
  };

  const handleSave = () => {
    const updatedNotes = notes.map(note => 
      note.id === selectedNote.id ? { ...note, content: editedContent } : note
    );
    
    setNotes(updatedNotes);
    setSelectedNote({...selectedNote, content: editedContent});
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
                              selectedNote.id === note.id
                                ? "border-blue-600 bg-blue-50 dark:bg-blue-950/30"
                                : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/30"
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
                              <span>{note.date}</span>
                              <span>•</span>
                              <span className="flex items-center">
                                <Mic className="h-3 w-3 mr-1" />
                                {note.recordingTitle}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center text-muted-foreground">
                          No notes found in this category
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
                            <span>{selectedNote.date}</span>
                            <span className="mx-2">•</span>
                            <span className="flex items-center">
                              <Mic className="h-3 w-3 mr-1" />
                              {selectedNote.recordingTitle}
                            </span>
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!isEditing ? (
                            <Button 
                              variant="outline" 
                              size="icon"
                              className="h-9 w-9 animate-fade-in"
                              onClick={handleEdit}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
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
                    <p className="text-muted-foreground">Select a note to view its content</p>
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
