
import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";

const NavBar = () => {
  return (
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
  );
};

export default NavBar;
