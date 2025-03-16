
import React from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import { Switch } from "@/components/ui/switch";
import { Moon, Sun, PaintBucket, Monitor, Palette } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const SettingsPage = () => {
  const { theme, setTheme, colorScheme, setColorScheme } = useTheme();

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

              <div className="mt-6 bg-accent/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="h-5 w-5 text-primary" />
                  <span className="font-medium">Color Scheme</span>
                </div>
                
                <RadioGroup 
                  value={colorScheme}
                  onValueChange={(value) => setColorScheme(value as any)}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2"
                >
                  <div className="flex items-center space-x-2 bg-background/50 p-3 rounded-md border">
                    <RadioGroupItem value="default" id="default" />
                    <Label htmlFor="default" className="cursor-pointer flex-1">Default</Label>
                    <div className="h-6 w-6 rounded-full bg-primary border border-input"></div>
                  </div>
                  
                  <div className="flex items-center space-x-2 bg-background/50 p-3 rounded-md border">
                    <RadioGroupItem value="pastel-green" id="pastel-green" />
                    <Label htmlFor="pastel-green" className="cursor-pointer flex-1">Soft Green</Label>
                    <div className="h-6 w-6 rounded-full bg-[#F2FCE2] border border-input"></div>
                  </div>
                  
                  <div className="flex items-center space-x-2 bg-background/50 p-3 rounded-md border">
                    <RadioGroupItem value="pastel-blue" id="pastel-blue" />
                    <Label htmlFor="pastel-blue" className="cursor-pointer flex-1">Soft Blue</Label>
                    <div className="h-6 w-6 rounded-full bg-[#D3E4FD] border border-input"></div>
                  </div>
                  
                  <div className="flex items-center space-x-2 bg-background/50 p-3 rounded-md border">
                    <RadioGroupItem value="pastel-purple" id="pastel-purple" />
                    <Label htmlFor="pastel-purple" className="cursor-pointer flex-1">Soft Purple</Label>
                    <div className="h-6 w-6 rounded-full bg-[#E5DEFF] border border-input"></div>
                  </div>
                  
                  <div className="flex items-center space-x-2 bg-background/50 p-3 rounded-md border">
                    <RadioGroupItem value="pastel-peach" id="pastel-peach" />
                    <Label htmlFor="pastel-peach" className="cursor-pointer flex-1">Soft Peach</Label>
                    <div className="h-6 w-6 rounded-full bg-[#FDE1D3] border border-input"></div>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </div>
  );
};

export default SettingsPage;
