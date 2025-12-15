import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button, Form, Input, message, Upload } from "antd";
import { Mail, Lock, Eye, EyeOff, User, Phone, MapPin, Wallet, Upload as UploadIcon } from "lucide-react";
import { registerAPI } from "../../../services/api.user";

const Register = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState(null);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await registerAPI({
        name: values.name,
        email: values.email,
        password: values.password,
        phone: values.phone,
        address: values.address,
        avatar: avatar,
      });

      if (res?.data) {
        message.success("Đăng ký thành công! Vui lòng đăng nhập.");
        navigate("/login");
      } else {
        message.error(res?.message || "Đăng ký thất bại!");
      }
    } catch (error) {
      message.error("Đăng ký thất bại. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (info) => {
    if (info.file.status === "done") {
      setAvatar(info.file.response?.url || info.file.thumbUrl);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 md:p-10">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#16A34A] rounded-full flex items-center justify-center">
              <Wallet className="text-white w-8 h-8" />
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#111827] mb-2" style={{ fontSize: '24px' }}>
            Tạo tài khoản
          </h1>
          <p className="text-[#6B7280] text-sm md:text-base" style={{ fontSize: '14px' }}>
            Bắt đầu quản lý tài chính của bạn
          </p>
        </div>

        {/* Register Form */}
        <Form
          form={form}
          name="register"
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          {/* Họ và tên */}
          <Form.Item
            label={<span className="font-semibold text-[#111827]">Họ và tên</span>}
            name="name"
            rules={[
              { required: true, message: "Vui lòng nhập họ và tên!" },
              { min: 2, message: "Họ và tên tối thiểu 2 ký tự!" },
            ]}
          >
            <Input
              prefix={<User className="text-[#6B7280]" size={18} />}
              placeholder="Nhập họ và tên"
              className="h-12"
              style={{ borderRadius: '8px', padding: '12px' }}
            />
          </Form.Item>

          {/* Email */}
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

          {/* Mật khẩu */}
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
              placeholder="Mật khẩu (tối thiểu 6 ký tự)"
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

          {/* Xác nhận mật khẩu */}
          <Form.Item
            label={<span className="font-semibold text-[#111827]">Xác nhận mật khẩu</span>}
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Vui lòng xác nhận mật khẩu!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Mật khẩu không khớp!"));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<Lock className="text-[#6B7280]" size={18} />}
              placeholder="Nhập lại mật khẩu"
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

          {/* Số điện thoại */}
          <Form.Item
            label={<span className="font-semibold text-[#111827]">Số điện thoại</span>}
            name="phone"
            rules={[
              {
                pattern: /^[0-9]{10,11}$/,
                message: "Số điện thoại không hợp lệ!",
              },
            ]}
          >
            <Input
              prefix={<Phone className="text-[#6B7280]" size={18} />}
              placeholder="Số điện thoại (tùy chọn)"
              className="h-12"
              style={{ borderRadius: '8px', padding: '12px' }}
            />
          </Form.Item>

          {/* Địa chỉ */}
          <Form.Item
            label={<span className="font-semibold text-[#111827]">Địa chỉ</span>}
            name="address"
          >
            <Input
              prefix={<MapPin className="text-[#6B7280]" size={18} />}
              placeholder="Địa chỉ (tùy chọn)"
              className="h-12"
              style={{ borderRadius: '8px', padding: '12px' }}
            />
          </Form.Item>

          {/* Điều khoản */}
          <Form.Item
            name="agreement"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value
                    ? Promise.resolve()
                    : Promise.reject(new Error("Bạn phải đồng ý với điều khoản!")),
              },
            ]}
          >
            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 mr-2 w-4 h-4 text-[#16A34A] border-[#E5E7EB] rounded focus:ring-[#16A34A]"
              />
              <span className="text-sm text-[#6B7280]">
                Tôi đồng ý với{" "}
                <Link to="/terms" className="text-[#16A34A] hover:underline">
                  Điều khoản sử dụng
                </Link>{" "}
                và{" "}
                <Link to="/privacy" className="text-[#16A34A] hover:underline">
                  Chính sách bảo mật
                </Link>
              </span>
            </label>
          </Form.Item>

          {/* Submit Button */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full h-12 text-base font-semibold rounded-lg bg-[#16A34A] hover:bg-[#15803d] border-none"
              style={{ borderRadius: '8px', height: '48px' }}
            >
              Đăng ký
            </Button>
          </Form.Item>

          {/* Login Link */}
          <div className="text-center">
            <span className="text-[#6B7280] text-sm">Đã có tài khoản? </span>
            <Link
              to="/login"
              className="text-[#16A34A] font-semibold hover:underline text-sm"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Register;
