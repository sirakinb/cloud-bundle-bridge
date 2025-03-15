
import { GraduationCap } from "lucide-react";

const Footer = () => {
  return (
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
  );
};

export default Footer;
