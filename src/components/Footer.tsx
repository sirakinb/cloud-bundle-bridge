
import { BookOpen } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-4">
      <div className="container mx-auto px-4">
        <div className="flex justify-center items-center">
          <div className="text-gray-600 text-sm">
            &copy; {new Date().getFullYear()} ClearStudy. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
