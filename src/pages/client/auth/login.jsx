import { Link, useNavigate } from "react-router";
import { Button, Form, Input, message } from "antd";
import { fetchAccountAPI, loginAPI } from "../../../services/api.user";
import { useCurrentApp } from "../../../components/context/app.context";
import { useEffect, useRef, useState } from "react";

const Login = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const [loginFailed, setLoginFailed] = useState(false);

  const { setIsAuthenticated, setUser } = useCurrentApp();

  useEffect(() => {
    inputRef.current?.focus();
    setLoginFailed(false);
  }, [loginFailed]);

  const onFinish = async (values) => {
    setLoading(true);
    const { email, password } = values;
    const res = await loginAPI(email, password);

    if (res?.data) {
      setIsAuthenticated(true);
      setUser(res.data);
      localStorage.setItem("accessToken", res.accessToken);
      navigate("/");
      await fetchAccountAPI();
      message.success("Login successfully!");
    } else {
      message.error("Invalid email or wrong password");
      form.resetFields();
      setLoginFailed(true);
    }
    setLoading(false);
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
    form.resetFields();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1D232A] via-[#2C3E50] to-[#1D232A] p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Welcome Back
        </h1>
        <p className="text-center text-gray-500 mb-8">
          Please login to your account
        </p>
        <Form
          form={form}
          name="basic"
          layout="vertical"
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
        >
          {/* Email */}
          <Form.Item
            label={<span className="font-semibold">Email</span>}
            name="email"
            rules={[
              { required: true, message: "Please input your email!" },
              {
                type: "email",
                message: "The input is not valid E-mail!",
              },
            ]}
          >
            <Input
              ref={inputRef}
              size="medium"
              placeholder="Enter your email"
            />
          </Form.Item>

          {/* Password */}
          <Form.Item
            label={<span className="font-semibold">Password</span>}
            name="password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password size="medium" placeholder="Enter your password" />
          </Form.Item>

          <div className="flex justify-between items-center mb-6">
            <Link
              to="/forgotPassword"
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            loading={loading}
            type="primary"
            htmlType="submit"
            className="w-full h-11 text-base font-semibold rounded-lg"
          >
            Login
          </Button>

          <div className="text-center mt-6">
            <span className="text-gray-600">Don’t have an account? </span>
            <Link
              className="text-blue-600 font-semibold hover:underline"
              to="/register"
            >
              Sign up
            </Link>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Login;
