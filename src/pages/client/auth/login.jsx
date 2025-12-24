import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button, Form, Input, message } from "antd";
import { Mail, Lock, Eye, EyeOff, Wallet } from "lucide-react";
import { loginAPI, fetchAccountAPI, googleLoginAPI } from "../../../services/api.user";
import { useCurrentApp } from "../../../components/context/app.context";

const Login = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { setIsAuthenticated, setUser } = useCurrentApp();
  const [googleLoading, setGoogleLoading] = useState(false);

  // Load Google Sign-In script
  useEffect(() => {
    const loadGoogleScript = () => {
      if (window.google && window.google.accounts) {
        initializeGoogleSignIn();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log("Google script loaded");
        initializeGoogleSignIn();
      };
      script.onerror = () => {
        console.error("Failed to load Google script");
        message.error("Không thể tải Google Sign-In");
      };
      document.body.appendChild(script);
    };

    const initializeGoogleSignIn = () => {
      if (!window.google || !window.google.accounts) return;

      const client_id = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!client_id) {
        console.error("Google Client ID not found");
        return;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: client_id,
          callback: handleGoogleCallback,
          use_fedcm_for_prompt: false, // Tắt FedCM để tránh lỗi
        });
        console.log("Google Sign-In initialized");

        // Render button ngay sau khi initialize
        setTimeout(() => {
          const buttonContainer = document.getElementById('google-signin-button');
          if (buttonContainer && window.google.accounts.id) {
            try {
              window.google.accounts.id.renderButton(buttonContainer, {
                theme: 'outline',
                size: 'large',
                width: '100%',
                text: 'signin_with',
                type: 'standard',
              });
              console.log("Google button rendered");
            } catch (renderError) {
              console.error("Error rendering button:", renderError);
            }
          }
        }, 100);
      } catch (error) {
        console.error("Error initializing Google:", error);
      }
    };

    loadGoogleScript();
  }, []);

  const handleGoogleCallback = async (response) => {
    if (!response || !response.credential) {
      message.error("Không nhận được thông tin từ Google");
      setGoogleLoading(false);
      return;
    }

    setGoogleLoading(true);
    try {
      console.log("Sending Google token to backend...");
      const res = await googleLoginAPI(response.credential);
      console.log("Backend response:", res);

      if (res?.error === 0 && res?.data && res?.accessToken) {
        localStorage.setItem("accessToken", res.accessToken);
        setIsAuthenticated(true);
        setUser(res.data);
        message.success("Đăng nhập bằng Google thành công!");

        try {
          await fetchAccountAPI();
        } catch (err) {
          console.error("Fetch account error:", err);
        }

        navigate("/");
      } else {
        console.error("Login failed:", res);
        message.error(res?.message || "Đăng nhập bằng Google thất bại");
      }
    } catch (error) {
      console.error("Google login error:", error);
      const errorMsg = error?.response?.data?.message || error?.message || "Đăng nhập bằng Google thất bại";
      message.error(errorMsg);
    } finally {
      setGoogleLoading(false);
    }
  };


  const onFinish = async (values) => {
    setLoading(true);
    try {
      const { email, password } = values;
      const res = await loginAPI(email, password);

      console.log("Login response:", res); // Debug log

      if (res?.error === 0 && res?.data && res?.accessToken) {
        localStorage.setItem("accessToken", res.accessToken);
        setIsAuthenticated(true);
        setUser(res.data);
        message.success("Đăng nhập thành công!");

        // Fetch account info after setting token
        try {
          await fetchAccountAPI();
        } catch (err) {
          console.error("Fetch account error:", err);
        }

        navigate("/");
      } else {
        message.error(res?.message || "Email hoặc mật khẩu không đúng");
        form.resetFields();
      }
    } catch (error) {
      console.error("Login error:", error);
      message.error(error?.message || "Đăng nhập thất bại. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 md:p-10">
        {/* Logo & Header Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#16A34A] rounded-full flex items-center justify-center">
              <Wallet className="text-white w-8 h-8" />
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#111827] mb-2" style={{ fontSize: '24px' }}>
            Đăng nhập
          </h1>
          <p className="text-[#6B7280] text-sm md:text-base" style={{ fontSize: '14px' }}>
            Chào mừng trở lại!
          </p>
        </div>

        {/* Login Form */}
        <Form
          form={form}
          name="login"
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          {/* Email Input */}
          <Form.Item
            label={<span className="font-semibold text-[#111827]">Email</span>}
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email!" },
              {
                type: "email",
                message: "Email không hợp lệ!",
              },
            ]}
          >
            <Input
              prefix={<Mail className="text-[#6B7280]" size={18} />}
              placeholder="Email của bạn"
              className="h-12"
              style={{ borderRadius: '8px', padding: '12px' }}
            />
          </Form.Item>

          {/* Password Input */}
          <Form.Item
            label={<span className="font-semibold text-[#111827]">Mật khẩu</span>}
            name="password"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu!" },
              { min: 6, message: "Mật khẩu tối thiểu 6 ký tự!" },
            ]}
          >
            <Input.Password
              prefix={<Lock className="text-[#6B7280]" size={18} />}
              placeholder="Mật khẩu"
              className="h-12"
              style={{ borderRadius: '8px', padding: '12px' }}
              iconRender={(visible) =>
                visible ? (
                  <EyeOff className="text-[#6B7280]" size={18} />
                ) : (
                  <Eye className="text-[#6B7280]" size={18} />
                )
              }
            />
          </Form.Item>

          {/* Remember me & Forgot password */}
          <div className="flex justify-between items-center mb-6">
            <Form.Item name="remember" valuePropName="checked" className="mb-0">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="mr-2 w-4 h-4 text-[#16A34A] border-[#E5E7EB] rounded focus:ring-[#16A34A]"
                />
                <span className="text-sm text-[#6B7280]">Ghi nhớ đăng nhập</span>
              </label>
            </Form.Item>
            <Link
              to="/forgot-password"
              className="text-sm text-[#16A34A] hover:underline font-medium"
            >
              Quên mật khẩu?
            </Link>
          </div>

          {/* Submit Button */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full h-12 text-base font-semibold rounded-lg bg-[#16A34A] hover:bg-[#15803d] border-none"
              style={{ borderRadius: '8px', height: '48px' }}
            >
              Đăng nhập
            </Button>
          </Form.Item>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E5E7EB]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-[#6B7280]">Hoặc</span>
            </div>
          </div>

          {/* Google Login Button */}
          <Form.Item>
            <div
              id="google-signin-button"
              className="w-full"
              style={{ minHeight: '48px', display: 'flex', justifyContent: 'center' }}
            ></div>
          </Form.Item>

          {/* Register Link */}
          <div className="text-center">
            <span className="text-[#6B7280] text-sm">Chưa có tài khoản? </span>
            <Link
              to="/register"
              className="text-[#16A34A] font-semibold hover:underline text-sm"
            >
              Đăng ký ngay
            </Link>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Login;
