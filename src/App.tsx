import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from "./contexts/ThemeContext";
import { TaskProvider } from "./contexts/TaskContext";
import { UnavailableTimesProvider } from "./contexts/UnavailableTimesContext";
import { Toaster } from 'sonner';
import { SidebarProvider } from "./components/ui/sidebar";
import Index from './pages/Index';
import RecordPage from './pages/RecordPage';
import AuthPage from './pages/AuthPage';
import NotesPage from './pages/NotesPage';
import CalendarPage from './pages/CalendarPage';
import SettingsPage from './pages/SettingsPage';
import ResourcesPage from './pages/ResourcesPage';
import ToolsPage from './pages/ToolsPage';
import { useEffect, useState } from 'react';

import "./App.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem('clearstudy-current-user');
    setIsAuthenticated(!!user);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <ThemeProvider>
        <SidebarProvider>
          <UnavailableTimesProvider>
            <TaskProvider>
              <Toaster />
              <Routes>
                <Route
                  path="/"
                  element={
                    isAuthenticated ? (
                      <Index />
                    ) : (
                      <Navigate to="/auth" replace />
                    )
                  }
                />
                <Route
                  path="/record"
                  element={
                    isAuthenticated ? (
                      <RecordPage />
                    ) : (
                      <Navigate to="/auth" replace />
                    )
                  }
                />
                <Route
                  path="/notes"
                  element={
                    isAuthenticated ? (
                      <NotesPage />
                    ) : (
                      <Navigate to="/auth" replace />
                    )
                  }
                />
                <Route
                  path="/calendar"
                  element={
                    isAuthenticated ? (
                      <CalendarPage />
                    ) : (
                      <Navigate to="/auth" replace />
                    )
                  }
                />
                <Route
                  path="/settings"
                  element={
                    isAuthenticated ? (
                      <SettingsPage />
                    ) : (
                      <Navigate to="/auth" replace />
                    )
                  }
                />
                <Route
                  path="/resources"
                  element={
                    isAuthenticated ? (
                      <ResourcesPage />
                    ) : (
                      <Navigate to="/auth" replace />
                    )
                  }
                />
                <Route
                  path="/tools"
                  element={
                    isAuthenticated ? (
                      <ToolsPage />
                    ) : (
                      <Navigate to="/auth" replace />
                    )
                  }
                />
                <Route
                  path="/auth"
                  element={
                    !isAuthenticated ? (
                      <AuthPage />
                    ) : (
                      <Navigate to="/" replace />
                    )
                  }
                />
              </Routes>
            </TaskProvider>
          </UnavailableTimesProvider>
        </SidebarProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
