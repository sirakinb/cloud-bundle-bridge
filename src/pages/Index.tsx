
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { BookOpen, Calculator, Clock, GraduationCap, PenTool } from "lucide-react";

const Index = () => {
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
              <li><Link to="/tools" className="text-gray-700 hover:text-blue-600">Study Tools</Link></li>
              <li><Link to="/resources" className="text-gray-700 hover:text-blue-600">Resources</Link></li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Empower Your Learning Journey
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Access powerful study tools, organize your tasks, and enhance your learning experience with ClearStudy Hub.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Get Started
            </Button>
            <Button variant="outline" size="lg">
              Explore Tools
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto py-16 px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Study Tools & Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <PenTool className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Note Taking</CardTitle>
              <CardDescription>
                Create organized, searchable notes with rich formatting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Take beautiful notes with our rich text editor. Organize by topics and access them anywhere.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">Try Notes</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <Clock className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Pomodoro Timer</CardTitle>
              <CardDescription>
                Boost productivity with scheduled work and break sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Enhance focus and prevent burnout with our customizable Pomodoro timer technique.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">Start Timer</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <Calculator className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Grade Calculator</CardTitle>
              <CardDescription>
                Calculate and track your course grades and GPA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Plan your academic goals by calculating needed scores on future assignments.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">Calculate Grades</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <BookOpen className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Flashcards</CardTitle>
              <CardDescription>
                Create and study with digital flashcards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Build custom flashcard decks and use spaced repetition to improve memory retention.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">Create Flashcards</Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 py-8">
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

export default Index;
