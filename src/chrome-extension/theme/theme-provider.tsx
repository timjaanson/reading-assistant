import { createContext, useContext, useEffect, useState } from "react";
import { Theme } from "../types/theme";
import { getStoredTheme, setStoredTheme } from "../storage/themeSettings";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await getStoredTheme();
        if (storedTheme) {
          setTheme(storedTheme);
        }
      } catch (error) {
        console.error("Failed to load theme from storage:", error);
      }
    };

    loadTheme();
  }, []);

  useEffect(() => {
    let root = document.getElementById("reading-assistant-shadow-dom-root");
    if (root) {
      root.classList.remove("light", "dark");
    } else {
      root = window.document.documentElement;
      root.classList.remove("light", "dark");
    }

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      setTheme(newTheme);
      try {
        setStoredTheme(newTheme);
      } catch (error) {
        console.error("Failed to save theme to storage:", error);
      }
    },
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
