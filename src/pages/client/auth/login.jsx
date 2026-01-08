import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button, Form, Input, message, ConfigProvider, Checkbox } from "antd";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Wallet,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { loginAPI, googleLoginAPI } from "../../../services/api.user";
import { useCurrentApp } from "../../../components/context/app.context";

const Login = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // ✅ lấy đủ thứ cần để update context ngay
  const { setIsAuthenticated, setUser, setProfile, reloadAccount } = useCurrentApp();

  // --- Google Script & Callbacks ---
  useEffect(() => {
    const loadGoogleScript = () => {
      if (window.google && window.google.accounts) {
        initializeGoogleSignIn();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      document.body.appendChild(script);
    };

    const initializeGoogleSignIn = () => {
      if (!window.google || !window.google.accounts) return;
      const client_id = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!client_id) return;

      try {
        window.google.accounts.id.initialize({
          client_id,
          callback: handleGoogleCallback,
          use_fedcm_for_prompt: false,
        });

        setTimeout(() => {
          const buttonContainer = document.getElementById("google-signin-button");
          if (buttonContainer) {
            window.google.accounts.id.renderButton(buttonContainer, {
              theme: "outline",
              size: "large",
              width: buttonContainer.offsetWidth,
              text: "signin_with",
              shape: "pill",
            });
          }
        }, 200);
      } catch (error) {
        console.error(error);
      }
    };

    loadGoogleScript();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleCallback = async (response) => {
    setGoogleLoading(true);
    try {
      const res = await googleLoginAPI(response.credential);

      if (res?.error === 0 && res?.accessToken) {
        // ✅ lưu token trước
        localStorage.setItem("accessToken", res.accessToken);
        if (res?.refreshToken) localStorage.setItem("refreshToken", res.refreshToken);

        // ✅ (optional) set nhanh cho UI, rồi reloadAccount để đồng bộ profile
        setIsAuthenticated(true);
        setUser(res?.data ?? null);
        setProfile(null);

        // ✅ quan trọng: kéo account (user + profile) về context ngay => header hiện liền
        await reloadAccount();

        message.success("Chào mừng bạn trở lại!");
        navigate("/");
      } else {
        message.error(res?.message || "Đăng nhập Google thất bại");
      }
    } catch (error) {
      message.error("Lỗi kết nối Google");
    } finally {
      setGoogleLoading(false);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const { email, password } = values;
      const res = await loginAPI(email, password);

      if (res?.error === 0 && res?.accessToken) {
        // ✅ lưu token trước
        localStorage.setItem("accessToken", res.accessToken);
        if (res?.refreshToken) localStorage.setItem("refreshToken", res.refreshToken);

        // ✅ set đúng shape từ login: data: { user, profile }
        setIsAuthenticated(true);
        setUser(res?.data?.user ?? null);
        setProfile(res?.data?.profile ?? null);

        // ✅ quan trọng: reload lại từ /auth/account để đảm bảo context đồng bộ 100%
        await reloadAccount();

        message.success("Đăng nhập thành công!");
        navigate("/");
      } else {
        message.error(res?.message || "Email hoặc mật khẩu không chính xác");
      }
    } catch (error) {
      message.error("Đã có lỗi xảy ra. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#10b981",
          borderRadius: 14,
          controlHeightLG: 52,
        },
      }}
    >
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAF9] p-4 md:p-6 overflow-hidden">
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-100/50 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-100/50 rounded-full blur-[120px]"></div>
        </div>

        <div className="w-full max-w-5xl bg-white rounded-[2.5rem] shadow-[0_20px_70px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col md:flex-row min-h-[700px] relative z-10 border border-white">
          {/* LEFT SIDE: LOGIN FORM */}
          <div className="w-full md:w-1/2 p-8 lg:p-14 flex flex-col justify-center">
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 animate-bounce-slow">
                  <Wallet className="text-white" size={26} />
                </div>
                <span className="text-2xl font-black text-slate-800 tracking-tighter">MoneyLover</span>
              </div>
              <h1 className="text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">Mừng bạn trở lại!</h1>
              <p className="text-slate-500 text-base font-medium">
                Nhập thông tin để tiếp tục quản lý tài chính.
              </p>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              requiredMark={false}
              className="space-y-4"
            >
              <Form.Item
                label={<span className="text-[14px] font-bold text-slate-700 ml-1">Email của bạn</span>}
                name="email"
                rules={[
                  { required: true, message: "Vui lòng nhập email" },
                  { type: "email", message: "Email không hợp lệ" },
                ]}
              >
                <Input
                  prefix={<Mail size={18} className="text-slate-400 mr-2" />}
                  placeholder="name@company.com"
                  className="rounded-2xl border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white transition-all h-14"
                />
              </Form.Item>

              <Form.Item
                label={<span className="text-[14px] font-bold text-slate-700 ml-1">Mật khẩu</span>}
                name="password"
                rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
              >
                <Input.Password
                  prefix={<Lock size={18} className="text-slate-400 mr-2" />}
                  placeholder="••••••••"
                  className="rounded-2xl border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white transition-all h-14"
                  iconRender={(visible) =>
                    visible ? (
                      <EyeOff size={18} className="text-slate-400" />
                    ) : (
                      <Eye size={18} className="text-slate-400" />
                    )
                  }
                />
              </Form.Item>

              <div className="flex items-center justify-between pb-2">
                <Form.Item name="remember" valuePropName="checked" className="mb-0">
                  <Checkbox className="text-slate-600 font-medium">Ghi nhớ mật khẩu</Checkbox>
                </Form.Item>
                <Link
                  to="/forgot-password"
                  virtual="true"
                  className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-all hover:underline underline-offset-4"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className="h-14 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none shadow-xl shadow-emerald-200/50 font-bold text-lg rounded-2xl group active:scale-95 transition-all"
              >
                <div className="flex items-center justify-center gap-2">
                  <span>Đăng nhập</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Button>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-100"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-4 text-slate-400 font-bold tracking-widest">HOẶC</span>
                </div>
              </div>

              <div id="google-signin-button" className="w-full flex justify-center min-h-[50px] transition-all hover:scale-[1.01]">
                {googleLoading && (
                  <div className="flex items-center justify-center gap-2 text-slate-500">
                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-medium">Đang đăng nhập...</span>
                  </div>
                )}
              </div>

              <p className="text-center text-slate-500 font-medium mt-10">
                Chưa có tài khoản?{" "}
                <Link
                  to="/register"
                  className="text-emerald-600 font-black hover:text-emerald-700 underline-offset-4 hover:underline"
                >
                  Đăng ký miễn phí
                </Link>
              </p>
            </Form>
          </div>

          {/* RIGHT SIDE: DECORATION */}
          <div className="hidden md:flex md:w-1/2 bg-[#064E3B] p-12 relative overflow-hidden items-center justify-center">
            <div className="absolute top-[-20%] right-[-20%] w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-teal-400/10 rounded-full blur-[80px]"></div>

            <div className="relative z-10 w-full max-w-sm">
              <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] p-10 shadow-3xl">
                <div className="mb-10">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-400/20 rounded-2xl mb-6 shadow-inner">
                    <Sparkles size={30} className="text-emerald-300" />
                  </div>
                  <h2 className="text-white text-3xl font-bold leading-tight mb-4">Làm chủ tài chính cá nhân</h2>
                  <p className="text-emerald-100/70 text-lg font-medium leading-relaxed">
                    Tiết kiệm thông minh hơn, sống an tâm hơn cùng MoneyWise.
                  </p>
                </div>

                <div className="space-y-5">
                  {[
                    { icon: <TrendingUp size={20} />, text: "Báo cáo thu chi chi tiết" },
                    { icon: <CheckCircle2 size={20} />, text: "Thiết lập hạn mức chi tiêu" },
                    { icon: <ShieldCheck size={20} />, text: "Dữ liệu mã hóa tuyệt đối" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 text-white/90 group cursor-default">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                        <span className="text-emerald-300 group-hover:text-white transition-colors">{item.icon}</span>
                      </div>
                      <span className="font-semibold text-base">{item.text}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-12 bg-white rounded-3xl p-6 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] transform rotate-3 hover:rotate-0 transition-all duration-700 cursor-pointer group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-400 text-xs">
                      MW
                    </div>
                    <div className="h-6 w-10 bg-emerald-100 rounded-md"></div>
                  </div>
                  <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.15em]">Total Balance</p>
                  <div className="flex justify-between items-end mt-1">
                    <h3 className="text-2xl font-black text-slate-800">$24,850.00</h3>
                    <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-[11px] font-black">
                      <TrendingUp size={12} />
                      +18.2%
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex justify-center">
                <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
                  <ShieldCheck size={16} className="text-emerald-400" />
                  <span className="text-[12px] text-emerald-100 font-bold tracking-wide uppercase">
                    Secure Bank-Level AES 256
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
        .ant-input-affix-wrapper {
          padding-left: 16px !important;
          padding-right: 16px !important;
          border-width: 2px !important;
        }
        .ant-input-affix-wrapper-focused {
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1) !important;
          border-color: #10b981 !important;
        }
        .ant-checkbox-checked .ant-checkbox-inner {
          background-color: #10b981 !important;
          border-color: #10b981 !important;
        }
        .ant-form-item-label label {
          height: auto !important;
        }
      `,
        }}
      />
    </ConfigProvider>
  );
};

export default Login;
