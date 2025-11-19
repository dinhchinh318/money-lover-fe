import { Outlet } from "react-router-dom"
import AppFooter from "./components/layout/app.footer"
import AppHeader from "./components/layout/app.header"
function App() {
    return (
        <div id="main-blur-area">
            <AppHeader />
            <Outlet />
            <AppFooter />
        </div>
    )
}

export default App
