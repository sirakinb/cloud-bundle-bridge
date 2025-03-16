
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/AppSidebar";
import { FileText, Mic } from "lucide-react";

// Mock data for recordings and notes
const mockNotes = [
  {
    id: "note-1",
    title: "Biology Class Notes",
    date: "2023-05-15",
    recordingTitle: "Biology Lecture",
    content: "Cell structure and function: Cells are the basic unit of life. They contain organelles that perform specific functions.",
  },
  {
    id: "note-2",
    title: "Chemistry Study",
    date: "2023-05-17",
    recordingTitle: "Chemistry Lab Session",
    content: "Chemical reactions: Exothermic reactions release energy, endothermic reactions absorb energy.",
  },
  {
    id: "note-3",
    title: "Math Formulas",
    date: "2023-05-20",
    recordingTitle: "Calculus Lecture",
    content: "Integration formulas and techniques. Applications of integration in volume calculation.",
  },
  {
    id: "note-4",
    title: "Physics Laws",
    date: "2023-05-22",
    recordingTitle: "Physics Class",
    content: "Newton's laws of motion: 1. An object at rest stays at rest, and an object in motion stays in motion unless acted upon by a force.",
  },
];

const NotesPage = () => {
  const [selectedNote, setSelectedNote] = useState(mockNotes[0]);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1">
        <div className="container mx-auto py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Your Notes</h1>
            <p className="text-muted-foreground">View and manage your notes from recordings</p>
          </div>

          <Tabs defaultValue="all">
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
                      {mockNotes.map((note) => (
                        <div
                          key={note.id}
                          className={`p-4 cursor-pointer border-l-4 ${
                            selectedNote.id === note.id
                              ? "border-blue-600 bg-blue-50"
                              : "border-transparent hover:bg-gray-50"
                          }`}
                          onClick={() => setSelectedNote(note)}
                        >
                          <h3 className="font-medium">{note.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <span>{note.date}</span>
                            <span>•</span>
                            <span className="flex items-center">
                              <Mic className="h-3 w-3 mr-1" />
                              {note.recordingTitle}
                            </span>
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              <div className="md:col-span-2">
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
                    </div>
                  </CardHeader>
                  <Separator />
                  <CardContent className="pt-4">
                    <ScrollArea className="h-[50vh]">
                      <div className="prose prose-sm max-w-none">
                        <p>{selectedNote.content}</p>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default NotesPage;
