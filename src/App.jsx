import { Outlet, useLocation } from "react-router-dom";
import AppFooter from "./components/layout/app.footer";
import AppHeader from "./components/layout/app.header";
import { useCurrentApp } from "./components/context/app.context";
import AiChatWidget from "./components/ai/AiChatWidget";

function App() {
  const location = useLocation();
  const { isAuthenticated } = useCurrentApp();

  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/forgot-password";

  const isLandingPage = location.pathname === "/" && !isAuthenticated;

  return (
    <div className="app-shell">
      <div id="main-blur-area" className="app-content">
        {!isAuthPage && !isLandingPage && <AppHeader />}
        <Outlet />
        {!isAuthPage && !isLandingPage && <AppFooter />}
      </div>

      {/* widget tách khỏi blur-area */}
      {isAuthenticated && !isAuthPage && <AiChatWidget />}
    </div>
  );
}

export default App;
