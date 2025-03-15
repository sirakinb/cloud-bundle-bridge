
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { GraduationCap, Library, Book, Globe, Video, FileText } from "lucide-react";

const ResourcesPage = () => {
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
              <li><Link to="/resources" className="text-gray-700 hover:text-blue-600 font-medium">Resources</Link></li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">Learning Resources</h1>
        
        <div className="max-w-3xl mx-auto mb-12">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center mb-4">
                <Library className="h-10 w-10 text-blue-600" />
              </div>
              <p className="text-center text-gray-700">
                Explore our curated collection of learning resources to enhance your studies. 
                From textbooks to online courses, find everything you need to succeed in your academic journey.
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Books & Textbooks */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Book className="h-6 w-6 text-blue-500" />
                <CardTitle>Books & Textbooks</CardTitle>
              </div>
              <CardDescription>
                Recommended readings for all subjects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Find the best textbooks, study guides, and reference materials for your courses, with reviews from fellow students.</p>
              <Button className="w-full">Browse Books</Button>
            </CardContent>
          </Card>

          {/* Online Courses */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Globe className="h-6 w-6 text-blue-500" />
                <CardTitle>Online Courses</CardTitle>
              </div>
              <CardDescription>
                Free and premium courses across disciplines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Discover top-rated online courses from platforms like Coursera, edX, Khan Academy, and more to supplement your learning.</p>
              <Button className="w-full">Explore Courses</Button>
            </CardContent>
          </Card>

          {/* Video Tutorials */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Video className="h-6 w-6 text-blue-500" />
                <CardTitle>Video Tutorials</CardTitle>
              </div>
              <CardDescription>
                Visual learning resources for complex topics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Watch explanatory videos on difficult concepts across all subjects, organized by topic and education level.</p>
              <Button className="w-full">Watch Tutorials</Button>
            </CardContent>
          </Card>

          {/* Study Guides */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <FileText className="h-6 w-6 text-blue-500" />
                <CardTitle>Study Guides</CardTitle>
              </div>
              <CardDescription>
                Comprehensive guides for efficient learning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Access detailed study guides, cheat sheets, and summaries to help you prepare for exams and master difficult subjects.</p>
              <Button className="w-full">Get Study Guides</Button>
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

export default ResourcesPage;
