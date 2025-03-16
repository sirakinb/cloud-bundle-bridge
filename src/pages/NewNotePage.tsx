
import React, { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Save } from "lucide-react";

const NewNotePage = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please provide both a title and content for your note.",
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate saving the note
    setTimeout(() => {
      toast({
        title: "Note saved",
        description: "Your note has been successfully saved.",
      });
      setIsSubmitting(false);
      setTitle("");
      setContent("");
    }, 800);
  };

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <SidebarInset className="p-6">
        <div className="w-full max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Create New Note</h1>

          <Card className="bg-white shadow-md">
            <CardHeader>
              <CardTitle>Note Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="note-title" className="block text-sm font-medium text-gray-700 mb-1">
                    Note Title
                  </label>
                  <Input
                    id="note-title"
                    placeholder="Enter note title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="note-content" className="block text-sm font-medium text-gray-700 mb-1">
                    Note Content
                  </label>
                  <Textarea
                    id="note-content"
                    placeholder="Enter your note content here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[200px]"
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    className="flex items-center gap-2" 
                    disabled={isSubmitting}
                  >
                    <Save className="h-4 w-4" />
                    Save Note
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </div>
  );
};

export default NewNotePage;
