import { Outlet, useLocation } from "react-router-dom"
import AppFooter from "./components/layout/app.footer"
import AppHeader from "./components/layout/app.header"
import { useCurrentApp } from "./components/context/app.context"

function App() {
    const location = useLocation();
    const { isAuthenticated } = useCurrentApp();
    const isAuthPage = location.pathname === "/login" || location.pathname === "/register" || location.pathname === "/forgot-password";
    const isLandingPage = location.pathname === "/" && !isAuthenticated;
    
    return (
        <div id="main-blur-area">
            {!isAuthPage && !isLandingPage && <AppHeader />}
            <Outlet />
            {!isAuthPage && !isLandingPage && <AppFooter />}
        </div>
    )
}

export default App
