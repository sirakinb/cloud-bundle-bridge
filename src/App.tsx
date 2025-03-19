
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { TaskProvider } from "./contexts/TaskContext";
import { UnavailableTimesProvider } from "./contexts/UnavailableTimesContext";
import { Toaster } from "./components/ui/sonner";
import { SidebarProvider } from "./components/ui/sidebar";

import IndexPage from "./pages/Index";
import NotesPage from "./pages/NotesPage";
import NewNotePage from "./pages/NewNotePage";
import CalendarPage from "./pages/CalendarPage";
import ResourcesPage from "./pages/ResourcesPage";
import ToolsPage from "./pages/ToolsPage";
import RecordPage from "./pages/RecordPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <SidebarProvider>
          <UnavailableTimesProvider>
            <TaskProvider>
              <Toaster />
              <Routes>
                <Route path="/" element={<IndexPage />} />
                <Route path="/notes" element={<NotesPage />} />
                <Route path="/notes/new" element={<NewNotePage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/resources" element={<ResourcesPage />} />
                <Route path="/tools" element={<ToolsPage />} />
                <Route path="/record" element={<RecordPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TaskProvider>
          </UnavailableTimesProvider>
        </SidebarProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
