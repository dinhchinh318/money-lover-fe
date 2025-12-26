import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button, Form, Input, message, ConfigProvider, Checkbox } from "antd";
import { Mail, Lock, Eye, EyeOff, Wallet, ArrowRight, ShieldCheck, CheckCircle, Sparkles } from "lucide-react";
import { registerAPI } from "../../../services/api.user";

const Register = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await registerAPI({
        email: values.email,
        password: values.password,
      });

      if (res?.data) {
        message.success("Đăng ký thành công! Hãy bắt đầu quản lý tài chính.");
        navigate("/login");
      } else {
        message.error(res?.message || "Đăng ký thất bại!");
      }
    } catch (error) {
      message.error("Lỗi hệ thống. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#10b981', // Emerald 500
          borderRadius: 16,
          controlHeightLG: 56,
        },
      }}
    >
      {/* Container chính: Đảm bảo nền xanh xuyên suốt kể cả trên mobile */}
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F0FDF4] p-4 md:p-10 lg:p-16 relative">
        
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-5%] right-[-5%] w-[30rem] h-[30rem] bg-emerald-200/30 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-5%] left-[-5%] w-[30rem] h-[30rem] bg-green-200/30 rounded-full blur-[100px]" />
        </div>

        {/* Main Card */}
        <div className="w-full max-w-[1100px] bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-[0_30px_100px_rgba(16,185,129,0.12)] flex flex-col md:flex-row min-h-[680px] border border-white relative z-10 overflow-hidden">
          
          {/* CỘT TRÁI: BRANDING (Visible on Tablet/Desktop) */}
          <div className="hidden md:flex md:w-[42%] bg-gradient-to-br from-[#064E3B] to-[#065F46] p-12 flex-col justify-between relative overflow-hidden">
            {/* Pattern trang trí chìm */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-16">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-xl">
                  <Wallet className="text-white" size={28} />
                </div>
                <span className="text-2xl font-black text-white tracking-tighter">MoneyLover</span>
              </div>

              <div className="space-y-6">
                <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
                  Quản lý tiền <br />
                  <span className="text-emerald-400">thật phong cách.</span>
                </h2>
                <p className="text-emerald-100/70 text-lg font-medium">
                  Trải nghiệm nền tảng quản lý tài chính hiện đại nhất hiện nay.
                </p>
              </div>
            </div>

            <div className="relative z-10 pt-10">
              <div className="space-y-4">
                {[
                  { icon: <CheckCircle size={20}/>, text: "Lập ngân sách thông minh" },
                  { icon: <Sparkles size={20}/>, text: "Đề xuất tiết kiệm tự động" },
                  { icon: <ShieldCheck size={20}/>, text: "Bảo mật chuẩn Fintech" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-emerald-50">
                    <div className="bg-emerald-400/20 p-1 rounded-full">{item.icon}</div>
                    <span className="font-semibold text-sm">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: FORM ĐĂNG KÝ */}
          <div className="w-full md:w-[58%] p-8 sm:p-12 lg:p-20 flex flex-col justify-center bg-white">
            <div className="w-full max-w-sm mx-auto">
              {/* Header cho Mobile (Hiển thị logo khi cột trái bị ẩn) */}
              <div className="md:hidden flex flex-col items-center mb-10">
                 <div className="w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-100">
                    <Wallet className="text-white" size={32} />
                 </div>
                 <h1 className="text-2xl font-black text-slate-800">Tạo tài khoản</h1>
                 <p className="text-slate-500 font-medium">MoneyWise - Fintech Smart</p>
              </div>

              {/* Header cho Desktop */}
              <div className="hidden md:block mb-10">
                <h1 className="text-3xl font-black text-slate-900 mb-2">Đăng ký</h1>
                <p className="text-slate-500 font-medium italic">Chào mừng bạn đến với sự thịnh vượng!</p>
              </div>

              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                requiredMark={false}
                autoComplete="off"
              >
                <Form.Item
                  name="email"
                  label={<span className="text-xs font-bold uppercase tracking-widest text-emerald-700 ml-1">Địa chỉ Email</span>}
                  rules={[
                    { required: true, message: "Email là bắt buộc!" },
                    { type: "email", message: "Định dạng email không hợp lệ!" }
                  ]}
                  className="mb-5"
                >
                  <Input 
                    prefix={<Mail size={18} className="text-slate-400 mr-2" />} 
                    placeholder="name@email.com"
                    className="rounded-2xl border-2 border-slate-100 bg-slate-50/50 hover:bg-white focus:bg-white transition-all h-14"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label={<span className="text-xs font-bold uppercase tracking-widest text-emerald-700 ml-1">Mật khẩu</span>}
                  rules={[
                    { required: true, message: "Vui lòng nhập mật khẩu!" },
                    { min: 6, message: "Mật khẩu tối thiểu 6 ký tự!" }
                  ]}
                  className="mb-5"
                >
                  <Input.Password 
                    prefix={<Lock size={18} className="text-slate-400 mr-2" />}
                    placeholder="••••••••"
                    className="rounded-2xl border-2 border-slate-100 bg-slate-50/50 hover:bg-white focus:bg-white transition-all h-14"
                    iconRender={visible => (visible ? <EyeOff size={18} className="text-slate-400"/> : <Eye size={18} className="text-slate-400"/>)}
                  />
                </Form.Item>

                <Form.Item
                  name="confirm"
                  label={<span className="text-xs font-bold uppercase tracking-widest text-emerald-700 ml-1">Xác nhận mật khẩu</span>}
                  dependencies={['password']}
                  rules={[
                    { required: true, message: "Vui lòng xác nhận mật khẩu!" },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) return Promise.resolve();
                        return Promise.reject(new Error('Mật khẩu không trùng khớp!'));
                      },
                    }),
                  ]}
                  className="mb-6"
                >
                  <Input.Password 
                    prefix={<Lock size={18} className="text-slate-400 mr-2" />}
                    placeholder="Nhập lại mật khẩu"
                    className="rounded-2xl border-2 border-slate-100 bg-slate-50/50 hover:bg-white focus:bg-white transition-all h-14"
                  />
                </Form.Item>

                <Form.Item
                  name="agreement"
                  valuePropName="checked"
                  rules={[
                    { validator: (_, value) => value ? Promise.resolve() : Promise.reject(new Error("Vui lòng đồng ý với điều khoản!")) },
                  ]}
                  className="mb-8"
                >
                  <Checkbox className="text-slate-500 text-sm leading-tight">
                    Tôi đồng ý với <Link to="#" className="text-emerald-600 font-bold hover:underline">Điều khoản</Link> & <Link to="#" className="text-emerald-600 font-bold hover:underline">Chính sách bảo mật</Link> của MoneyWise.
                  </Checkbox>
                </Form.Item>

                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  className="h-14 bg-emerald-600 hover:bg-emerald-700 border-none shadow-xl shadow-emerald-200 font-black text-base rounded-2xl group transition-all"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>ĐĂNG KÝ NGAY</span>
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </Button>

                <p className="text-center mt-8 text-slate-500 font-semibold">
                  Đã là thành viên?{' '}
                  <Link to="/login" className="text-emerald-600 hover:text-emerald-700 underline underline-offset-4 decoration-2">
                    Đăng nhập
                  </Link>
                </p>
              </Form>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .ant-input-affix-wrapper {
          border-width: 2px !important;
          padding-left: 1.25rem !important;
        }
        .ant-input-affix-wrapper-focused {
          box-shadow: 0 0 0 5px rgba(16, 185, 129, 0.1) !important;
          border-color: #10b981 !important;
        }
        .ant-checkbox-checked .ant-checkbox-inner {
          background-color: #10b981 !important;
          border-color: #10b981 !important;
        }
        .ant-form-item-label label {
          height: auto !important;
          padding-bottom: 4px !important;
        }
        .ant-form-item-explain-error {
          font-size: 12px !important;
          font-weight: 600 !important;
          margin-top: 4px !important;
        }
      `}} />
    </ConfigProvider>
  );
};

export default Register;