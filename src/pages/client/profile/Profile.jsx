import { useState } from "react";
import { useCurrentApp } from "../../../components/context/app.context";
import { message } from "antd";

const ProfilePage = () => {
  const { user } = useCurrentApp();

  const [basicInfo, setBasicInfo] = useState({
    name: user?.name || "User",
    email: user?.email || "user@example.com",
    phone: user?.phone || "",
    address: user?.address || "",
    bio: "",
  });

  const [security, setSecurity] = useState({
    password: "",
    newPassword: "",
    language: "vi",
    theme: "light",
    notifyEmail: true,
    notifyPush: true,
  });

  const handleSaveBasic = () => {
    message.success("Đã lưu thông tin cơ bản");
  };

  const handleSavePassword = () => {
    if (!security.password || !security.newPassword) {
      message.warning("Vui lòng nhập đầy đủ mật khẩu");
      return;
    }
    message.success("Đã cập nhật mật khẩu (demo)");
  };

  return (
    <div className="min-h-screen bg-[#F3F5F8]">
      <div className="max-w-6xl mx-auto px-4 lg:px-0 py-8">
        <h1 className="text-2xl font-bold text-[#111827] mb-6">Thông tin tài khoản</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Info Card */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm">
            <div className="px-6 py-4 border-b border-[#E5E7EB]">
              <h2 className="text-lg font-semibold text-[#111827]">Thông tin Cơ bản</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#E5F7ED] flex items-center justify-center text-[#0EA25E] font-bold text-xl">
                  {basicInfo.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-[#6B7280]">Đổi ảnh đại diện</span>
                  <button className="px-3 py-1.5 text-sm border border-[#E5E7EB] rounded-lg hover:border-[#2563EB] transition-colors">
                    Tải ảnh lên
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[#6B7280]">Họ và tên</label>
                <input
                  value={basicInfo.name}
                  onChange={(e) => setBasicInfo({ ...basicInfo, name: e.target.value })}
                  className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[#6B7280]">Email</label>
                <input
                  value={basicInfo.email}
                  readOnly
                  className="w-full rounded-lg border border-[#E5E7EB] bg-gray-50 px-3 py-2 text-sm text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[#6B7280]">Số điện thoại</label>
                <input
                  value={basicInfo.phone}
                  onChange={(e) => setBasicInfo({ ...basicInfo, phone: e.target.value })}
                  className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[#6B7280]">Địa chỉ</label>
                <input
                  value={basicInfo.address}
                  onChange={(e) => setBasicInfo({ ...basicInfo, address: e.target.value })}
                  className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[#6B7280]">Mô tả</label>
                <textarea
                  value={basicInfo.bio}
                  onChange={(e) => setBasicInfo({ ...basicInfo, bio: e.target.value })}
                  className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  rows={2}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSaveBasic}
                  className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] transition-colors"
                >
                  Lưu thay đổi
                </button>
                <button className="px-4 py-2 rounded-lg border border-[#E5E7EB] text-sm text-[#374151] hover:border-[#2563EB] transition-colors">
                  Hủy
                </button>
              </div>
            </div>
          </div>

          {/* Security & Preferences */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm">
              <div className="px-6 py-4 border-b border-[#E5E7EB]">
                <h2 className="text-lg font-semibold text-[#111827]">Bảo mật</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-[#6B7280]">Mật khẩu hiện tại</label>
                    <input
                      type="password"
                      value={security.password}
                      onChange={(e) => setSecurity({ ...security, password: e.target.value })}
                      className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-[#6B7280]">Mật khẩu mới</label>
                    <input
                      type="password"
                      value={security.newPassword}
                      onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
                      className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                </div>
                <button
                  onClick={handleSavePassword}
                  className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] transition-colors"
                >
                  Đổi mật khẩu
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm">
              <div className="px-6 py-4 border-b border-[#E5E7EB]">
                <h2 className="text-lg font-semibold text-[#111827]">Tùy chỉnh</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-[#6B7280]">Ngôn ngữ</label>
                    <select
                      value={security.language}
                      onChange={(e) => setSecurity({ ...security, language: e.target.value })}
                      className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    >
                      <option value="vi">Tiếng Việt</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-[#6B7280]">Giao diện</label>
                    <select
                      value={security.theme}
                      onChange={(e) => setSecurity({ ...security, theme: e.target.value })}
                      className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#374151]">Thông báo Email</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={security.notifyEmail}
                        onChange={(e) => setSecurity({ ...security, notifyEmail: e.target.checked })}
                      />
                      <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-[#2563EB] transition-colors"></div>
                      <div className="absolute left-1 top-1 w-3.5 h-3.5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#374151]">Thông báo Push</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={security.notifyPush}
                        onChange={(e) => setSecurity({ ...security, notifyPush: e.target.checked })}
                      />
                      <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-[#2563EB] transition-colors"></div>
                      <div className="absolute left-1 top-1 w-3.5 h-3.5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

