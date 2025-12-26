import { Button, Form, Input, message, ConfigProvider } from "antd";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LockKeyhole, Mail, ShieldCheck, ArrowRight } from "lucide-react";
import { resetPasswordAPI } from "../../services/api.user";

const ResetPasswordPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const { email } = location.state || {};
    const [form] = Form.useForm();

    useEffect(() => {
        if (!email) {
            message.warning("Vui lòng thực hiện yêu cầu quên mật khẩu trước.");
            navigate("/forgot-password", { replace: true });
        }
    }, [email, navigate]);

    const onFinish = async (values) => {
        setLoading(true);
        const { newPassword, email } = values;
        try {
            const res = await resetPasswordAPI(email, newPassword);
            if (res && res.status === true) {
                message.success("Mật khẩu đã được thay đổi thành công!");
                navigate("/login");
            } else {
                message.error(res?.message || "Đã có lỗi xảy ra");
            }
        } catch (error) {
            message.error("Lỗi kết nối máy chủ");
        } finally {
            setLoading(false);
        }
    };

    if (!email) return null;

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#10b981', // Emerald 500
                    borderRadius: 16,
                    controlHeightLG: 52,
                },
            }}
        >
            <div className="min-h-screen w-full flex items-center justify-center bg-[#F0FDF4] p-4 relative overflow-hidden">
                
                {/* Background Decor */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-5%] w-[30rem] h-[30rem] bg-emerald-200/30 rounded-full blur-[100px]" />
                    <div className="absolute bottom-[-10%] right-[-5%] w-[25rem] h-[25rem] bg-green-200/30 rounded-full blur-[100px]" />
                </div>

                <div className="w-full max-w-[480px] relative z-10">
                    {/* Main Card */}
                    <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_70px_rgba(16,185,129,0.1)] p-8 md:p-12 border border-white">
                        
                        {/* Header Section */}
                        <div className="text-center mb-10">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-50 rounded-[2rem] mb-6 border border-emerald-100 shadow-inner">
                                <LockKeyhole className="text-emerald-600" size={38} />
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Thiết lập lại</h1>
                            <p className="text-slate-500 font-medium">
                                Tạo mật khẩu mới cho tài khoản của bạn để tiếp tục.
                            </p>
                        </div>

                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={onFinish}
                            autoComplete="off"
                            requiredMark={false}
                        >
                            {/* Email Display (Read-only style) */}
                            <Form.Item
                                label={<span className="text-xs font-bold uppercase tracking-widest text-emerald-700 ml-1">Tài khoản Email</span>}
                                name="email"
                                initialValue={email}
                            >
                                <Input 
                                    prefix={<Mail size={18} className="text-slate-400 mr-2" />}
                                    className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-slate-500 font-medium cursor-not-allowed" 
                                    disabled 
                                />
                            </Form.Item>

                            {/* New Password */}
                            <Form.Item
                                name="newPassword"
                                label={<span className="text-xs font-bold uppercase tracking-widest text-emerald-700 ml-1">Mật khẩu mới</span>}
                                rules={[
                                    { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                                    { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
                                ]}
                            >
                                <Input.Password 
                                    placeholder="••••••••"
                                    className="h-14 rounded-2xl border-2 border-slate-100 hover:border-emerald-200 focus:border-emerald-500 transition-all bg-slate-50/30"
                                />
                            </Form.Item>

                            {/* Confirm Password */}
                            <Form.Item
                                name="confirmPass"
                                label={<span className="text-xs font-bold uppercase tracking-widest text-emerald-700 ml-1">Xác nhận mật khẩu</span>}
                                dependencies={['newPassword']}
                                hasFeedback
                                rules={[
                                    { required: true, message: 'Vui lòng nhập lại mật khẩu!' },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue('newPassword') === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password 
                                    placeholder="••••••••"
                                    className="h-14 rounded-2xl border-2 border-slate-100 hover:border-emerald-200 focus:border-emerald-500 transition-all bg-slate-50/30"
                                />
                            </Form.Item>

                            {/* Submit Button */}
                            <div className="pt-4">
                                <Button 
                                    type="primary" 
                                    htmlType="submit" 
                                    loading={loading} 
                                    block
                                    className="h-14 rounded-2xl font-black text-base shadow-xl shadow-emerald-200/50 hover:scale-[1.02] active:scale-95 transition-all border-none bg-gradient-to-r from-emerald-500 to-green-600"
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <span>CẬP NHẬT MẬT KHẨU</span>
                                        <ArrowRight size={20} />
                                    </div>
                                </Button>
                            </div>
                        </Form>

                        {/* Security Tip */}
                        <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-center gap-2 text-emerald-600/60 font-bold text-[11px] uppercase tracking-widest">
                            <ShieldCheck size={14} />
                            <span>Bảo mật bởi mã hóa AES-256</span>
                        </div>
                    </div>

                    {/* Back Link */}
                    <div className="text-center mt-8">
                        <button 
                            onClick={() => navigate('/login')}
                            className="text-slate-400 font-bold hover:text-emerald-600 transition-colors flex items-center justify-center gap-1 mx-auto"
                        >
                            Quay lại trang Đăng nhập
                        </button>
                    </div>
                </div>
            </div>

            {/* Custom CSS overrides */}
            <style dangerouslySetInnerHTML={{ __html: `
                .ant-input-affix-wrapper {
                    padding-left: 1.25rem !important;
                    border-width: 2px !important;
                }
                .ant-input-affix-wrapper-focused {
                    box-shadow: 0 0 0 5px rgba(16, 185, 129, 0.1) !important;
                    border-color: #10b981 !important;
                }
                .ant-form-item-label label {
                    padding-bottom: 6px !important;
                    height: auto !important;
                }
            `}} />
        </ConfigProvider>
    );
};

export default ResetPasswordPage;