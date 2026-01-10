import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { fetchAccountAPI } from "../../services/api.user";

// ✅ i18n
import i18n from "../../i18n";

// ✅ Antd locale
import viVN from "antd/locale/vi_VN";
import enUS from "antd/locale/en_US";

const AppContext = createContext(null);

const DEFAULT_AVATAR =
  "https://res.cloudinary.com/dijy8yams/image/upload/v1742894461/avatars/lgitn3wbciwcm515y0cb.jpg";

const DEFAULT_SETTINGS = {
  theme: "light", // light | dark | system
  language: "vi", // vi | en
  currency: "VND",
};

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

const getSystemTheme = () => {
  try {
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
};

// ✅ key theo user (mỗi account 1 setting riêng)
const getSettingsKey = (userId) =>
  userId ? `app_settings_${userId}` : "app_settings_guest";
const getLegacyThemeKey = (userId) =>
  userId ? `theme_${userId}` : "theme_guest";

export const AppContextProvider = ({ children }) => {
  // ===== Auth =====
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  // ✅ settingsKey sẽ đổi khi user đổi (login/logout)
  const settingsKey = useMemo(() => getSettingsKey(user?._id), [user?._id]);
  const legacyThemeKey = useMemo(
    () => getLegacyThemeKey(user?._id),
    [user?._id]
  );

  // ===== Settings =====
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // ✅ Load settings đúng theo user mỗi khi settingsKey đổi
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(settingsKey) || "null");
      const themeLegacy = localStorage.getItem(legacyThemeKey);

      const next = {
        ...DEFAULT_SETTINGS,
        ...(stored || {}),
        ...(themeLegacy ? { theme: themeLegacy } : {}),
      };

      setSettings(next);
    } catch {
      setSettings(DEFAULT_SETTINGS);
    }
  }, [settingsKey, legacyThemeKey]);

  // ✅ theme thực tế để apply
  const resolvedTheme = useMemo(() => {
    return settings.theme === "system" ? getSystemTheme() : settings.theme;
  }, [settings.theme]);

  // ✅ locale AntD
  const antdLocale = useMemo(() => {
    return settings.language === "en" ? enUS : viVN;
  }, [settings.language]);

  // ✅ Apply class dark/light + colorScheme
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    root.classList.remove("light", "dark");
    body.classList.remove("light", "dark");

    if (resolvedTheme === "dark") {
      root.classList.add("dark");
      body.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.add("light");
      body.classList.add("light");
      root.style.colorScheme = "light";
    }
  }, [resolvedTheme]);

  // ✅ theme=system -> listen OS changes
  useEffect(() => {
    if (settings.theme !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setSettings((s) => ({ ...s })); // trigger re-render

    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, [settings.theme]);

  // ✅ Sync i18n language theo settings.language (đổi toàn app)
  useEffect(() => {
    const lang = settings.language === "en" ? "en" : "vi";

    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }

    // SEO/accessibility
    document.documentElement.lang = lang;
  }, [settings.language]);

  // ✅ Save settings theo userKey
  useEffect(() => {
    try {
      localStorage.setItem(settingsKey, JSON.stringify(settings));
      localStorage.setItem(legacyThemeKey, settings.theme); // tương thích code cũ
    } catch {
      // ignore
    }
  }, [settingsKey, legacyThemeKey, settings]);

  // ✅ applySettings: lọc undefined để không ghi đè bậy
  const applySettings = useCallback((partial) => {
    if (!partial || typeof partial !== "object") return;
    const cleaned = Object.fromEntries(
      Object.entries(partial).filter(([, v]) => v !== undefined)
    );
    setSettings((prev) => ({ ...prev, ...cleaned }));
  }, []);

  const setTheme = useCallback(
    (t) => applySettings({ theme: t }),
    [applySettings]
  );

  // ===== Account =====
  const reloadAccount = useCallback(async () => {
    try {
      const res = await fetchAccountAPI();
      if (res?.data?.user) {
        setUser(res.data.user);
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

  // ✅ cập nhật profile khi tab khác set localStorage userUpdated
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
        // Auth
        isAuthenticated,
        setIsAuthenticated,
        user,
        setUser,
        profile,
        setProfile,
        reloadAccount,

        // Settings
        settings,
        applySettings,
        resolvedTheme,
        antdLocale,

        // Backward compatibility
        theme: settings.theme,
        setTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useCurrentApp = () => {
  const context = useContext(AppContext);
  if (!context)
    throw new Error("useCurrentApp must be used within AppContextProvider");
  return context;
};
