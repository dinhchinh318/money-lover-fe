// Import patch cho React 19 trước khi import bất kỳ component nào sử dụng antd
import "@ant-design/v5-patch-for-react-19";

// ✅ Init i18n sớm nhất
import "./i18n";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import App from "./App.jsx";

// Pages / Layouts
import HomePage from "./pages/client/home.jsx";
import LandingPage from "./pages/client/landing.jsx";
import Login from "./pages/client/auth/login.jsx";
import Register from "./pages/client/auth/register.jsx";
import ForgotPassword from "./pages/client/forgotPassword.jsx";
import ResetPassword from "./pages/client/resetPassword.jsx";

import ReportsLayout from "./components/reports/ReportsLayout.jsx";
import ReportsDashboard from "./pages/client/reports/ReportsDashboard.jsx";
import ReportsTime from "./pages/client/reports/ReportsTime.jsx";
import ReportsCategory from "./pages/client/reports/ReportsCategory.jsx";
import ReportsWallet from "./pages/client/reports/ReportsWallet.jsx";

import AnalyticsLayout from "./components/analytics/AnalyticsLayout.jsx";
import AnalyticsDiagnostic from "./pages/client/analytics/AnalyticsDiagnostic.jsx";
import AnalyticsPredictive from "./pages/client/analytics/AnalyticsPredictive.jsx";
import AnalyticsPrescriptive from "./pages/client/analytics/AnalyticsPrescriptive.jsx";

import WalletLayout from "./components/wallets/WalletLayout.jsx";
import WalletsIndex from "./pages/client/wallets/WalletsIndex.jsx";
import WalletDetail from "./pages/client/wallets/WalletDetail.jsx";

import TransactionsIndex from "./pages/client/transactions/TransactionsIndex.jsx";
import TransactionDetail from "./pages/client/transactions/TransactionDetail.jsx";

import CategoriesIndex from "./pages/client/categories/CategoriesIndex.jsx";

import BudgetsIndex from "./pages/client/budgets/BudgetsIndex.jsx";
import BudgetDetail from "./pages/client/budgets/BudgetDetail.jsx";

import RecurringBillsIndex from "./pages/client/recurringBills/RecurringBillsIndex.jsx";

import SavingGoalsIndex from "./pages/client/savingGoals/SavingGoalsIndex.jsx";
import SavingGoalDetail from "./pages/client/savingGoals/SavingGoalDetail.jsx";

import GroupsPage from "./pages/client/group/GroupsPage";
import MyInvitesPage from "./pages/client/group/MyInvitesPage";
import GroupDetailLayout from "./pages/client/group/GroupDetailLayout";
import GroupOverviewPage from "./pages/client/group/GroupOverviewPage";
import GroupWalletsPage from "./pages/client/group/GroupWalletsPage";
import GroupCategoriesPage from "./pages/client/group/GroupCategoriesPage";
import GroupTransactionsPage from "./pages/client/group/GroupTransactionsPage.jsx";
import GroupBudgetsPage from "./pages/client/group/GroupBudgetsPage";
import GroupReportsPage from "./pages/client/group/GroupReportsPage";
import GroupsProviders from "./pages/client/group/context/GroupsProviders.jsx";

import SettingPage from "./pages/client/SettingPage.jsx";
import ProfilePageNew from "./pages/client/ProfilePage.jsx";
import NotificationPage from "./pages/client/NotificationPage.jsx";
import AiCenterPage from "./pages/client/ai/AiCenterPage.jsx";

// Context
import {
  AppContextProvider,
  useCurrentApp,
} from "./components/context/app.context.jsx";

// AntD
import { ConfigProvider, theme as antdTheme } from "antd";

// HomeRoute
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
      { path: "/reset-password", element: <ResetPassword /> },
      { path: "/forgot-password", element: <ForgotPassword /> },

      // Reports
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

      // Analytics
      {
        path: "/analytics",
        element: <AnalyticsLayout />,
        children: [
          { index: true, element: <AnalyticsDiagnostic /> },
          { path: "diagnostic", element: <AnalyticsDiagnostic /> },
          { path: "predictive", element: <AnalyticsPredictive /> },
          { path: "prescriptive", element: <AnalyticsPrescriptive /> },
        ],
      },

      // Wallets
      {
        path: "/wallets",
        element: <WalletLayout />,
        children: [
          { index: true, element: <WalletsIndex /> },
          { path: ":id", element: <WalletDetail /> },
        ],
      },

      // Transactions
      {
        path: "/transactions",
        children: [
          { index: true, element: <TransactionsIndex /> },
          { path: ":id", element: <TransactionDetail /> },
        ],
      },

      // Categories
      { path: "/categories", element: <CategoriesIndex /> },

      // Budgets
      {
        path: "/budgets",
        children: [
          { index: true, element: <BudgetsIndex /> },
          { path: ":id", element: <BudgetDetail /> },
        ],
      },

      // Recurring Bills
      { path: "/recurring-bills", element: <RecurringBillsIndex /> },

      // Saving goals
      {
        path: "/saving-goals",
        children: [
          { index: true, element: <SavingGoalsIndex /> },
          { path: ":id", element: <SavingGoalDetail /> },
        ],
      },

      // AI center
      { path: "/ai", element: <AiCenterPage /> },

      // Profile
      { path: "/profile", element: <ProfilePageNew /> },

      // Setting
      { path: "/setting", element: <SettingPage /> },

      // Notification
      { path: "/notification", element: <NotificationPage /> },

      // Groups
      {
        path: "/groups",
        element: <GroupsProviders />,
        children: [
          { index: true, element: <GroupsPage /> },
          { path: "invites", element: <MyInvitesPage /> },
          {
            path: ":groupId",
            element: <GroupDetailLayout />,
            children: [
              { index: true, element: <GroupOverviewPage /> },
              { path: "wallets", element: <GroupWalletsPage /> },
              { path: "categories", element: <GroupCategoriesPage /> },
              { path: "transactions", element: <GroupTransactionsPage /> },
              { path: "budgets", element: <GroupBudgetsPage /> },
              { path: "reports", element: <GroupReportsPage /> },
            ],
          },
        ],
      },
    ],
  },
]);

// ✅ AntD root wrapper
const AntdRoot = ({ children }) => {
  const { resolvedTheme, antdLocale } = useCurrentApp();

  return (
    <ConfigProvider
      locale={antdLocale}
      theme={{
        token: { colorPrimary: "#10b981", borderRadius: 12 },
        algorithm:
          resolvedTheme === "dark"
            ? antdTheme.darkAlgorithm
            : antdTheme.defaultAlgorithm,
      }}
    >
      {children}
    </ConfigProvider>
  );
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppContextProvider>
      <AntdRoot>
        <RouterProvider router={router} />
      </AntdRoot>
    </AppContextProvider>
  </StrictMode>
);
