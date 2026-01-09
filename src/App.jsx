import { Outlet, useLocation } from "react-router-dom"
import AppFooter from "./components/layout/app.footer"
import AppHeader from "./components/layout/app.header"
import { useCurrentApp } from "./components/context/app.context"
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
    <>
      <div id="main-blur-area">
        {!isAuthPage && !isLandingPage && <AppHeader />}
        <Outlet />
        {!isAuthPage && !isLandingPage && <AppFooter />}
      </div>

      {/* ✅ Render widget outside #main-blur-area to avoid overlay/overflow blocking clicks */}
      {isAuthenticated && !isAuthPage && <AiChatWidget />}
    </>
  );
}

export default App
