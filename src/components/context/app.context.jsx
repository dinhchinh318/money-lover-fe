import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { fetchAccountAPI } from "../../services/api.user";

const AppContext = createContext(null);

export const AppContextProvider = ({ children }) => {
  // Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  // Theme
  const [theme, setTheme] = useState(() => {
    return localStorage?.getItem("theme") ?? "light";
  });

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Remove existing theme classes
    root.classList.remove("light", "dark");
    body.classList.remove("light", "dark");

    // Apply new theme
    if (theme === "dark") {
      root.classList.add("dark");
      body.classList.add("dark");
      root.style.colorScheme = "dark";
    } else if (theme === "light") {
      root.classList.add("light");
      body.classList.add("light");
      root.style.colorScheme = "light";
    } else {
      // Auto mode - detect system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        root.classList.add("dark");
        body.classList.add("dark");
        root.style.colorScheme = "dark";
      } else {
        root.classList.add("light");
        body.classList.add("light");
        root.style.colorScheme = "light";
      }
    }

    // Save to localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Fetch account on mount
  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const res = await fetchAccountAPI();
        if (res.data) {
          setUser(res.data.user);
          setProfile(res.data.profile);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error("Fetch account failed:", err);
      }
    };
    fetchAccount();
  }, []);

  // Listen for storage events to sync user data across tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'userUpdated') {
        // Reload user data when user is updated in another tab
        const fetchAccount = async () => {
          try {
            const res = await fetchAccountAPI();
            if (res.data) {
              setUser(res.data.user);
              setProfile(res.data.profile);
            }
          } catch (err) {
            console.error("Fetch account failed:", err);
          }
        };
        fetchAccount();
        localStorage.removeItem('userUpdated');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        isAuthenticated,
        setIsAuthenticated,
        user,
        setUser,
        profile,
        setProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useCurrentApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useCurrentApp must be used within AppContextProvider");
  }
  return context;
};
