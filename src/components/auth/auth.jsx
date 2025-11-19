import { Link, useLocation } from "react-router-dom";
import { useCurrentApp } from "../context/app.context";
import { Button, Result } from "antd";
const ProtectedRoute = (props) => {
  const { isAuthenticated, user } = useCurrentApp();
  const location = useLocation();

  if (isAuthenticated === false) {
    return (
      <Result
        status={404}
        title={<span className="text-[#fff]">Not login</span>}
        subTitle={
          <span className="text-[#fff]">Please login to use this service</span>
        }
        extra={
          <Button type="primary">
            <Link to="/login">Login</Link>
          </Button>
        }
      ></Result>
    );
  }
  const isAdmin = location.pathname.includes("admin");
  if (isAuthenticated && isAdmin) {
    const role = user?.role;
    if (role === "user") {
      return (
        <Result
          status="403"
          title={<span className="text-[#fff]">Unauthorized</span>}
          subTitle={
            <span className="text-[#fff]">
              Sorry, you are not authorized to access this page
            </span>
          }
          extra={
            <Button type="primary">
              <Link to="/">Back home</Link>
            </Button>
          }
        ></Result>
      );
    }
  }
  return <>{props.children}</>;
};
export default ProtectedRoute;
