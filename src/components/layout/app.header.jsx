import { Link } from "react-router-dom"; // Chú ý sửa thành react-router-dom
import { User, LogOut } from "lucide-react";
import { useState } from "react";
import { Menu, Dropdown, message } from "antd";
import { useCurrentApp } from "../context/app.context";
import { fetchAccountAPI, logoutAPI } from "../../services/api.user";

const navLinks = [{ key: "home", label: <Link to="/">Home</Link> }];

const AppHeader = () => {
  const { setIsAuthenticated, isAuthenticated, user, setUser } =
    useCurrentApp();

  const handleLogout = async () => {
    const res = await logoutAPI();
    if (res.error === 0) {
      message.success("Log out successfully!");
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("accessToken");
      await fetchAccountAPI();
    }
  };

  const accountMenu = (
    <Menu>
      {!isAuthenticated && (
        <>
          <Menu.Item key="signup">
            <Link to="/register">Sign up</Link>
          </Menu.Item>
          <Menu.Item key="signin">
            <Link to="/login">Sign in</Link>
          </Menu.Item>
        </>
      )}
      {isAuthenticated && (
        <>
          <Menu.Item key="logout" icon={<LogOut size={20} />} onClick={handleLogout}>
            Log out
          </Menu.Item>
        </>
      )}
    </Menu>
  );

  return (
    <header className="sticky top-0 z-[1000] bg-white border-b border-gray-200 shadow-sm p-2">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 flex h-16 items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="text-xl font-extrabold tracking-tight text-gray-900"
        >
          MoneyLover
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex flex-1 ml-8">
          <Menu
            mode="horizontal"
            items={navLinks}
            className="border-0 bg-transparent"
          />
        </div>

        {/* Account dropdown */}
        <Dropdown overlay={accountMenu} placement="bottomRight" trigger={["click"]}>
          <User
            size={20}
            className="text-2xl cursor-pointer text-gray-800 hover:text-blue-600"
          />
        </Dropdown>
      </div>
    </header>
  );
};

export default AppHeader;
