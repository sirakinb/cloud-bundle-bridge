
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";

const NavBar = () => {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <BookOpen className="h-6 w-6 text-blue-600 mr-2" />
          <h1 className="text-xl font-bold text-blue-600">ClearStudy</h1>
        </div>
      </div>
    </header>
  );
};

export default NavBar;
