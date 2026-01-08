import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { fetchAccountAPI } from "../../services/api.user";

const AppContext = createContext(null);

const DEFAULT_AVATAR =
  "https://res.cloudinary.com/dijy8yams/image/upload/v1742894461/avatars/lgitn3wbciwcm515y0cb.jpg";

const normalizeProfile = (profile, user) => {
  if (!profile && !user) return null;

  const email = profile?.email ?? user?.email ?? profile?.user?.email ?? "";

  const avatarUrl =
    profile?.avatarUrl ||
    user?.avatarUrl ||
    user?.avatar ||
    DEFAULT_AVATAR;

  return {
    ...(profile ?? {}),
    email,
    avatarUrl,
    displayName: profile?.displayName ?? user?.name ?? "Người Dùng",
  };
};


export const AppContextProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [theme, setTheme] = useState(() => localStorage?.getItem("theme") ?? "light");

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    root.classList.remove("light", "dark");
    body.classList.remove("light", "dark");

    if (theme === "dark") {
      root.classList.add("dark");
      body.classList.add("dark");
      root.style.colorScheme = "dark";
    } else if (theme === "light") {
      root.classList.add("light");
      body.classList.add("light");
      root.style.colorScheme = "light";
    } else {
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

    localStorage.setItem("theme", theme);
  }, [theme]);

  const reloadAccount = useCallback(async () => {
    try {
      const res = await fetchAccountAPI();
      if (res?.data) {
        setUser(res.data.user ?? null);
        setProfile(normalizeProfile(res.data.profile, res.data.user));
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error("Fetch account failed:", err);
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    reloadAccount();
  }, [reloadAccount]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "userUpdated") {
        reloadAccount();
        localStorage.removeItem("userUpdated");
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [reloadAccount]);

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
        reloadAccount, // ✅ quan trọng
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useCurrentApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useCurrentApp must be used within AppContextProvider");
  return context;
};
