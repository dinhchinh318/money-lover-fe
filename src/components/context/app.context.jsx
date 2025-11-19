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

  // Theme
  const [theme, setTheme] = useState(() => {
    return localStorage?.getItem("theme") ?? "dark";
  });

  // Fetch account on mount
  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const res = await fetchAccountAPI();
        if (res.data) {
          setUser(res.data.user);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error("Fetch account failed:", err);
      }
    };
    fetchAccount();
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
