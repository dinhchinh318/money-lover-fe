import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import HomePage from "./pages/client/home.jsx";
import LandingPage from "./pages/client/landing.jsx";
import Login from "./pages/client/auth/login.jsx";
import Register from "./pages/client/auth/register.jsx";
import ReportsLayout from "./components/reports/ReportsLayout.jsx";
import ReportsDashboard from "./pages/client/reports/ReportsDashboard.jsx";
import ReportsTime from "./pages/client/reports/ReportsTime.jsx";
import ReportsCategory from "./pages/client/reports/ReportsCategory.jsx";
import ReportsWallet from "./pages/client/reports/ReportsWallet.jsx";
import AnalyticsLayout from "./components/analytics/AnalyticsLayout.jsx";
import AnalyticsDashboard from "./pages/client/analytics/AnalyticsDashboard.jsx";
import AnalyticsDiagnostic from "./pages/client/analytics/AnalyticsDiagnostic.jsx";
import AnalyticsPredictive from "./pages/client/analytics/AnalyticsPredictive.jsx";
import AnalyticsPrescriptive from "./pages/client/analytics/AnalyticsPrescriptive.jsx";
import { AppContextProvider, useCurrentApp } from "./components/context/app.context.jsx";
// import "antd/dist/reset.css"; // nếu dùng Ant Design

// Component để chọn hiển thị LandingPage hoặc HomePage dựa trên authentication
const HomeRoute = () => {
  const { isAuthenticated } = useCurrentApp();
  return isAuthenticated ? <HomePage /> : <LandingPage />;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <HomeRoute /> },
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
      // Reports Routes with Layout
      {
        path: "/reports",
        element: <ReportsLayout />,
        children: [
          { index: true, element: <ReportsDashboard /> },
          { path: "time", element: <ReportsTime /> },
          { path: "category", element: <ReportsCategory /> },
          { path: "wallet", element: <ReportsWallet /> },
        ],
      },
      // Analytics Routes with Layout
      {
        path: "/analytics",
        element: <AnalyticsLayout />,
        children: [
          { index: true, element: <AnalyticsDashboard /> },
          { path: "diagnostic", element: <AnalyticsDiagnostic /> },
          { path: "predictive", element: <AnalyticsPredictive /> },
          { path: "prescriptive", element: <AnalyticsPrescriptive /> },
        ],
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppContextProvider>
      <RouterProvider router={router} />
    </AppContextProvider>
  </StrictMode>
);
