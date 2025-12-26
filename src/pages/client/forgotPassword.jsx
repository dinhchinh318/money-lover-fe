import { Form, Input, Button, message, ConfigProvider } from "antd";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Mail, ShieldCheck, ArrowLeft, RefreshCw, Send } from "lucide-react";
import { forgotPasswordAPI, verifyOTPAPI } from "../../services/api.user";

const ForgotPasswordPage = () => {
  const [form] = Form.useForm();
  const [sending, setIsSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [email, setEmail] = useState("");
  const inputRef = useRef();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    const { email: inputEmail } = values;
    if (!inputEmail) return;

    try {
      const res = await forgotPasswordAPI(inputEmail);
      if (res.status === true) {
        message.success("Mã xác thực đã được gửi đến Email của bạn!");
        setEmail(inputEmail);
        setIsSending(true);
        setCountdown(60);
      } else {
        message.error(res.message || "Không thể gửi mã. Vui lòng thử lại.");
      }
    } catch (error) {
      message.error("Lỗi kết nối hệ thống.");
    }
  };

  const handleFinishOTP = async (otp) => {
    if (otp.length < 6) return;
    
    const res = await verifyOTPAPI(email, otp);
    if (res?.status === true) {
      message.success("Xác thực thành công!");
      navigate("/reset-password", { state: { email: email } });
    } else {
      message.error(res?.message || "Mã xác thực không chính xác.");
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#10b981", // Emerald 500
          borderRadius: 12,
          colorBgContainer: "#ffffff",
        },
      }}
    >
      <div className="min-h-screen bg-[#F0FDF4] pb-12 px-4 flex justify-center items-center">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          <Link 
            to="/login" 
            className="flex items-center gap-2 text-emerald-700/70 hover:text-emerald-600 transition-all mb-6 font-semibold w-fit group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Quay lại đăng nhập</span>
          </Link>

          <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(16,185,129,0.1)] p-8 md:p-10 border border-emerald-50">
            
            <div className="text-center mb-8">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 bg-emerald-200 blur-2xl opacity-30 animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-emerald-400 to-teal-500 w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-200">
                  {sending ? (
                    <ShieldCheck className="text-white" size={36} />
                  ) : (
                    <Mail className="text-white" size={36} />
                  )}
                </div>
              </div>
              
              <h1 className="text-3xl font-extrabold text-slate-800 mb-3 tracking-tight">
                {sending ? "Xác thực OTP" : "Quên mật khẩu?"}
              </h1>
              <p className="text-slate-500 font-medium leading-relaxed">
                {sending 
                  ? <span>Mã đã gửi tới <b className="text-emerald-600">{email}</b></span>
                  : "Nhập email để nhận mã khôi phục tài khoản"}
              </p>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              autoComplete="off"
              requiredMark={false}
            >
              <div className={`transition-all duration-300 ${sending ? "opacity-40 pointer-events-none scale-95" : "opacity-100"}`}>
                <Form.Item
                  name="email"
                  label={<span className="font-bold text-slate-600 ml-1">Địa chỉ Email</span>}
                  rules={[
                    { required: true, message: "Vui lòng nhập email!" },
                    { type: "email", message: "Email không đúng định dạng!" }
                  ]}
                >
                  <Input 
                    ref={inputRef}
                    prefix={<Mail size={18} className="text-slate-400 mr-2" />}
                    placeholder="name@company.com" 
                    className="h-14 rounded-2xl border-slate-200 hover:border-emerald-400 focus:border-emerald-500 shadow-sm text-base"
                  />
                </Form.Item>

                {/* Thay thế phần Button cũ bằng đoạn này */}
                <Button
                  disabled={countdown > 0}
                  type="primary"
                  htmlType="submit"
                  block
                  className={`h-14 rounded-2xl font-bold text-lg shadow-xl shadow-emerald-100 transition-all active:scale-95 border-none ${
                    countdown > 0 
                    ? "bg-slate-100 text-slate-400" 
                    : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 w-full">
                    {countdown > 0 ? (
                      <>
                        <RefreshCw size={20} className="animate-spin" />
                        <span className="leading-none">Gửi lại sau {countdown}s</span>
                      </>
                    ) : (
                      <>
                        <Send size={20} className="relative top-[1px]" /> {/* Top-1px để bù trừ độ lệch quang học của icon Send */}
                        <span className="leading-none">Gửi mã xác thực</span>
                      </>
                    )}
                  </div>
                </Button>
              </div>

              {sending && (
                <div className="mt-8 pt-8 border-t border-emerald-50 animate-in fade-in zoom-in duration-500">
                  <div className="flex flex-col items-center">
                    <label className="font-bold text-slate-700 mb-5 self-start flex items-center gap-2">
                      <div className="w-1.5 h-5 bg-emerald-500 rounded-full"></div>
                      Nhập mã OTP 6 số
                    </label>
                    
                    <Form.Item name="otp" className="mb-4">
                      <Input.OTP 
                        length={6} 
                        onChange={handleFinishOTP}
                        className="otp-input-green"
                        size="large"
                      />
                    </Form.Item>
                    
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 mt-2">
                      <p className="text-[13px] text-emerald-700 font-medium text-center leading-5">
                        Không nhận được mã? Hãy kiểm tra trong <b>Thư rác (Spam)</b> hoặc thử lại sau khi hết thời gian chờ.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Form>
          </div>

          <div className="text-center mt-10">
            <p className="text-slate-500 font-medium">
              Bạn gặp sự cố? <a href="#" className="text-emerald-600 hover:text-emerald-700 font-bold decoration-2 underline-offset-4 hover:underline">Liên hệ hỗ trợ</a>
            </p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .otp-input-green .ant-input {
          width: 50px !important;
          height: 60px !important;
          border-radius: 16px !important;
          font-size: 24px !important;
          font-weight: 800 !important;
          border: 2px solid #e2e8f0 !important;
          background: #ffffff !important;
          color: #065f46 !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .otp-input-green .ant-input:focus {
          border-color: #10b981 !important;
          background: #ffffff !important;
          box-shadow: 0 0 0 5px #ecfdf5 !important;
          transform: translateY(-2px);
        }
        .ant-form-item-label label {
          font-size: 0.95rem !important;
        }
      `}} />
    </ConfigProvider>
  );
};

export default ForgotPasswordPage;