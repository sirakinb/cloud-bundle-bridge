
import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
type ColorScheme = "default" | "pastel-green" | "pastel-blue" | "pastel-purple" | "pastel-peach";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  colorScheme: ColorScheme;
  setColorScheme: (colorScheme: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check if theme is stored in localStorage
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    // Check if OS prefers dark mode
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    return (savedTheme || (prefersDark ? "dark" : "light"));
  });

  const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {
    // Check if color scheme is stored in localStorage
    const savedColorScheme = localStorage.getItem("colorScheme") as ColorScheme | null;
    return (savedColorScheme || "default");
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    
    // Remove the previous theme class
    root.classList.remove("light", "dark");
    // Add the current theme class
    root.classList.add(theme);
    
    // Save theme to localStorage
    localStorage.setItem("theme", theme);

    // Add a transition class to smooth color changes
    root.classList.add("transition-colors");
    root.style.colorScheme = theme;
    
    // Apply the theme to the body element as well for components that might depend on parent inheritance
    body.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove all color scheme classes
    root.classList.remove("color-default", "color-pastel-green", "color-pastel-blue", "color-pastel-purple", "color-pastel-peach");
    // Add the current color scheme class
    root.classList.add(`color-${colorScheme}`);
    
    // Save color scheme to localStorage
    localStorage.setItem("colorScheme", colorScheme);
    
    // Apply the color scheme to the data attribute for component-specific styling
    root.dataset.colorScheme = colorScheme;
  }, [colorScheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colorScheme, setColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
