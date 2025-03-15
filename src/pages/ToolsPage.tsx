
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { GraduationCap, Clock, Calculator, BookOpen, FileText, Calendar } from "lucide-react";

const ToolsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header/Navigation */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <GraduationCap className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-blue-600">ClearStudy Hub</h1>
          </div>
          <nav>
            <ul className="flex space-x-6">
              <li><Link to="/" className="text-gray-700 hover:text-blue-600">Home</Link></li>
              <li><Link to="/tools" className="text-gray-700 hover:text-blue-600 font-medium">Study Tools</Link></li>
              <li><Link to="/resources" className="text-gray-700 hover:text-blue-600">Resources</Link></li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">Study Tools</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Pomodoro Timer */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Clock className="h-6 w-6 text-blue-500" />
                <CardTitle>Pomodoro Timer</CardTitle>
              </div>
              <CardDescription>
                Enhance focus with timed work and break intervals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Use the Pomodoro Technique to boost productivity and prevent burnout. Customize work sessions and breaks to fit your study style.</p>
              <Button className="w-full">Open Timer</Button>
            </CardContent>
          </Card>

          {/* Grade Calculator */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Calculator className="h-6 w-6 text-blue-500" />
                <CardTitle>Grade Calculator</CardTitle>
              </div>
              <CardDescription>
                Track and calculate your course grades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Calculate your current grade, predict final grades, and determine what scores you need on upcoming assignments.</p>
              <Button className="w-full">Calculate Grades</Button>
            </CardContent>
          </Card>

          {/* Flashcards */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <BookOpen className="h-6 w-6 text-blue-500" />
                <CardTitle>Flashcards</CardTitle>
              </div>
              <CardDescription>
                Create and study digital flashcards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Build custom decks and use spaced repetition to improve memory and retention for any subject.</p>
              <Button className="w-full">Create Flashcards</Button>
            </CardContent>
          </Card>

          {/* Note Taking */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <FileText className="h-6 w-6 text-blue-500" />
                <CardTitle>Note Taking</CardTitle>
              </div>
              <CardDescription>
                Organize and format your study notes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Create beautiful notes with our rich text editor. Organize by topics, tag content, and access from any device.</p>
              <Button className="w-full">Take Notes</Button>
            </CardContent>
          </Card>

          {/* Study Planner */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Calendar className="h-6 w-6 text-blue-500" />
                <CardTitle>Study Planner</CardTitle>
              </div>
              <CardDescription>
                Plan your study schedule and tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Map out your study sessions, set deadlines, and track your progress with our intuitive planning tools.</p>
              <Button className="w-full">Plan Studies</Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <GraduationCap className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold text-blue-600">ClearStudy Hub</span>
            </div>
            <div className="text-gray-600 text-sm">
              &copy; {new Date().getFullYear()} ClearStudy Hub. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ToolsPage;
