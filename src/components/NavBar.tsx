
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const NavBar = () => {
  const { theme } = useTheme();
  
  return (
    <header className={`border-b border-border bg-background transition-colors`}>
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <BookOpen className="h-6 w-6 text-primary mr-2" />
          <h1 className="text-xl font-bold text-primary">ClearStudy</h1>
        </div>
      </div>
    </header>
  );
};

export default NavBar;
