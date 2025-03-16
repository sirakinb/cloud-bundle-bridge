
import React from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import { Switch } from "@/components/ui/switch";
import { Moon, Sun, PaintBucket, Monitor } from "lucide-react";

const SettingsPage = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <SidebarInset className="p-6">
        <div className="w-full max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Settings</h1>

          <Card className="bg-card shadow-md mb-6 border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <PaintBucket className="h-5 w-5 text-primary" />
                <CardTitle>Appearance</CardTitle>
              </div>
              <CardDescription>
                Customize the appearance of the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between bg-accent/30 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  {theme === "dark" ? (
                    <Moon className="h-5 w-5 text-primary" />
                  ) : (
                    <Sun className="h-5 w-5 text-primary" />
                  )}
                  <span className="font-medium">Dark Mode</span>
                </div>
                <Switch 
                  checked={theme === "dark"}
                  onCheckedChange={(checked) => {
                    setTheme(checked ? "dark" : "light");
                  }}
                  className="hover-glow"
                />
              </div>
              
              <div className="flex items-center justify-between bg-accent/30 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-primary" />
                  <span className="font-medium">System Preference</span>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                    Coming Soon
                  </span>
                </div>
                <Switch 
                  disabled
                  className="opacity-50"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </div>
  );
};

export default SettingsPage;
