import { useState, useEffect } from "react";
import { useCurrentApp } from "../../../components/context/app.context";
import { message, Upload } from "antd";
import { Camera, Loader2 } from "lucide-react";
import { updateUserAPI, fetchAccountAPI, changePasswordAPI } from "../../../services/api.user";

const ProfilePage = () => {
  const { user, setUser, theme, setTheme } = useCurrentApp();

  // Basic Info State
  const [basicInfo, setBasicInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    description: "",
    avatar: "",
  });

  const [avatarUrl, setAvatarUrl] = useState("");
  const [basicInfoLoading, setBasicInfoLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [hasBasicChanges, setHasBasicChanges] = useState(false);

  // Security State
  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  // Preferences State
  const [preferences, setPreferences] = useState({
    language: "vi",
    theme: "light",
    notifyEmail: true,
    notifyPush: true,
  });
  const [preferencesLoading, setPreferencesLoading] = useState(false);

  // Load user data on mount
  useEffect(() => {
    if (user) {
      setBasicInfo({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        description: user.description || "",
        avatar: user.avatar || "",
      });
      setAvatarUrl(user.avatar || "");

      // Load preferences from localStorage or user data
      const savedLanguage = localStorage.getItem("language") || "vi";
      const savedTheme = localStorage.getItem("theme") || theme || "light";
      const savedNotifyEmail = localStorage.getItem("notifyEmail") !== "false";
      const savedNotifyPush = localStorage.getItem("notifyPush") !== "false";

      setPreferences({
        language: savedLanguage,
        theme: savedTheme,
        notifyEmail: savedNotifyEmail,
        notifyPush: savedNotifyPush,
      });
    }
  }, [user, theme]);

  // Track basic info changes
  useEffect(() => {
    if (user) {
      const hasChanges =
        basicInfo.name !== (user.name || "") ||
        basicInfo.phone !== (user.phone || "") ||
        basicInfo.address !== (user.address || "") ||
        basicInfo.description !== (user.description || "") ||
        avatarUrl !== (user.avatar || "");
      setHasBasicChanges(hasChanges);
    }
  }, [basicInfo, avatarUrl, user]);

  // Handle Avatar Upload
  const handleAvatarChange = (info) => {
    if (info.file.status === "uploading") {
      setAvatarUploading(true);
      return;
    }
    if (info.file.status === "done" || info.file.status === "success") {
      setAvatarUploading(false);
    }
    if (info.file.status === "error") {
      setAvatarUploading(false);
      message.error("Lỗi khi upload ảnh!");
    }
  };

  // Compress image before converting to base64
  const compressImage = (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64 with compression
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const beforeUpload = (file) => {
    const isJpgOrPng =
      file.type === "image/jpeg" ||
      file.type === "image/png" ||
      file.type === "image/jpg" ||
      file.type === "image/webp";

    if (!isJpgOrPng) {
      message.error("Chỉ chấp nhận file JPG/PNG/WEBP!");
      return false;
    }

    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error("Ảnh phải nhỏ hơn 2MB!");
      return false;
    }

    return true;
  };

  // Handle Save Basic Info
  const handleSaveBasic = async () => {
    // Validation
    if (!basicInfo.name || basicInfo.name.trim() === "") {
      message.warning("Vui lòng nhập họ và tên!");
      return;
    }

    try {
      setBasicInfoLoading(true);
      const updateData = {
        name: basicInfo.name.trim(),
        phone: basicInfo.phone || "",
        address: basicInfo.address || "",
        description: basicInfo.description || "",
        avatar: avatarUrl || "",
      };

      const res = await updateUserAPI(updateData);
      if (res.EC === 0) {
        message.success("Đã lưu thông tin cơ bản thành công!");
        // Reload user data
        const accountRes = await fetchAccountAPI();
        if (accountRes.EC === 0 && accountRes.data?.user) {
          const updatedUser = accountRes.data.user;
          setUser(updatedUser);
          // Trigger storage event to sync across tabs
          localStorage.setItem('userUpdated', Date.now().toString());
          // Force update context to ensure avatar is updated everywhere
          setTimeout(() => {
            // Trigger a re-render by updating user state again
            setUser({ ...updatedUser });
          }, 100);
        }
        setHasBasicChanges(false);
      } else {
        message.error(res.message || "Lưu thông tin thất bại!");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      message.error("Có lỗi xảy ra khi lưu thông tin!");
    } finally {
      setBasicInfoLoading(false);
    }
  };

  // Handle Cancel Basic Info
  const handleCancelBasic = () => {
    if (user) {
      setBasicInfo({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        description: user.description || "",
        avatar: user.avatar || "",
      });
      setAvatarUrl(user.avatar || "");
      setHasBasicChanges(false);
    }
  };

  // Handle Change Password
  const validatePassword = () => {
    const errors = {};

    if (!security.currentPassword) {
      errors.currentPassword = "Vui lòng nhập mật khẩu hiện tại";
    }

    if (!security.newPassword) {
      errors.newPassword = "Vui lòng nhập mật khẩu mới";
    } else if (security.newPassword.length < 6) {
      errors.newPassword = "Mật khẩu mới phải có ít nhất 6 ký tự";
    }

    if (!security.confirmPassword) {
      errors.confirmPassword = "Vui lòng xác nhận mật khẩu mới";
    } else if (security.newPassword !== security.confirmPassword) {
      errors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    if (security.currentPassword === security.newPassword) {
      errors.newPassword = "Mật khẩu mới phải khác mật khẩu hiện tại";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) {
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await changePasswordAPI(security.currentPassword, security.newPassword);

      if (res.EC === 0) {
        message.success("Đổi mật khẩu thành công!");
        setSecurity({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setPasswordErrors({});
      } else {
        message.error(res.message || "Đổi mật khẩu thất bại!");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      message.error("Có lỗi xảy ra khi đổi mật khẩu!");
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle Save Preferences
  const handleSavePreferences = async () => {
    try {
      setPreferencesLoading(true);

      // Update theme in context FIRST (this will trigger useEffect to apply theme)
      if (setTheme && preferences.theme !== theme) {
        setTheme(preferences.theme);
      }

      // Save to localStorage
      localStorage.setItem("language", preferences.language);
      localStorage.setItem("theme", preferences.theme);
      localStorage.setItem("notifyEmail", preferences.notifyEmail.toString());
      localStorage.setItem("notifyPush", preferences.notifyPush.toString());

      // Optionally save to backend
      const updateData = {
        language: preferences.language,
        theme: preferences.theme,
        notifyEmail: preferences.notifyEmail,
        notifyPush: preferences.notifyPush,
      };

      const res = await updateUserAPI(updateData);
      if (res.EC === 0) {
        message.success("Đã lưu tùy chỉnh thành công!");
      } else {
        // Still show success if localStorage saved
        message.success("Đã lưu tùy chỉnh thành công!");
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      message.error("Có lỗi xảy ra khi lưu tùy chỉnh!");
    } finally {
      setPreferencesLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F5F8] dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 lg:px-0 py-8">
        <h1 className="text-2xl font-bold text-[#111827] dark:text-white mb-6">Thông tin tài khoản</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#E5E7EB] dark:border-gray-700 shadow-sm">
            <div className="px-6 py-4 border-b border-[#E5E7EB] dark:border-gray-700">
              <h2 className="text-lg font-semibold text-[#111827] dark:text-white">Thông tin Cơ bản</h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Avatar Upload */}
              <div className="flex items-center gap-4">
                <Upload
                  name="avatar"
                  listType="picture-circle"
                  showUploadList={false}
                  beforeUpload={beforeUpload}
                  onChange={handleAvatarChange}
                  customRequest={async ({ file, onSuccess }) => {
                    try {
                      setAvatarUploading(true);
                      // Compress image before converting to base64
                      const compressedBase64 = await compressImage(file, 800, 0.8);
                      setAvatarUrl(compressedBase64);
                      setBasicInfo({ ...basicInfo, avatar: compressedBase64 });
                      if (onSuccess) {
                        onSuccess(compressedBase64);
                      }
                      setAvatarUploading(false);
                    } catch (error) {
                      console.error("Error compressing image:", error);
                      // Fallback to original if compression fails
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        const base64 = e.target?.result;
                        setAvatarUrl(base64);
                        setBasicInfo({ ...basicInfo, avatar: base64 });
                        if (onSuccess) {
                          onSuccess(base64);
                        }
                        setAvatarUploading(false);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                >
                  {avatarUploading ? (
                    <div className="w-16 h-16 rounded-full bg-[#E5F7ED] flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-[#0EA25E] animate-spin" />
                    </div>
                  ) : avatarUrl ? (
                    <div className="relative group">
                      <img
                        src={avatarUrl}
                        alt="avatar"
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Camera size={20} className="text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#E5F7ED] flex items-center justify-center text-[#0EA25E] font-bold text-xl cursor-pointer hover:bg-[#D1F2E5] transition-colors">
                      {basicInfo.name?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                </Upload>
                <div className="flex flex-col">
                  <span className="text-sm text-[#6B7280] mb-1">Đổi ảnh đại diện</span>
                  <span className="text-xs text-[#9CA3AF]">JPG, PNG hoặc WEBP (tối đa 2MB)</span>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-2">
                <label className="text-sm text-[#6B7280]">Họ và tên <span className="text-red-500">*</span></label>
                <input
                  value={basicInfo.name}
                  onChange={(e) => setBasicInfo({ ...basicInfo, name: e.target.value })}
                  className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  placeholder="Nhập họ và tên"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[#6B7280]">Email</label>
                <input
                  value={basicInfo.email}
                  readOnly
                  className="w-full rounded-lg border border-[#E5E7EB] bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[#6B7280]">Số điện thoại</label>
                <input
                  value={basicInfo.phone}
                  onChange={(e) => setBasicInfo({ ...basicInfo, phone: e.target.value })}
                  className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[#6B7280]">Địa chỉ</label>
                <input
                  value={basicInfo.address}
                  onChange={(e) => setBasicInfo({ ...basicInfo, address: e.target.value })}
                  className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  placeholder="Nhập địa chỉ"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[#6B7280]">Mô tả</label>
                <textarea
                  value={basicInfo.description}
                  onChange={(e) => setBasicInfo({ ...basicInfo, description: e.target.value })}
                  className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  rows={3}
                  placeholder="Nhập mô tả về bản thân..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveBasic}
                  disabled={basicInfoLoading || !hasBasicChanges}
                  className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {basicInfoLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {basicInfoLoading ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
                <button
                  onClick={handleCancelBasic}
                  disabled={basicInfoLoading || !hasBasicChanges}
                  className="px-4 py-2 rounded-lg border border-[#E5E7EB] text-sm text-[#374151] hover:border-[#2563EB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>

          {/* Security & Preferences */}
          <div className="space-y-6">
            {/* Security Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#E5E7EB] dark:border-gray-700 shadow-sm">
              <div className="px-6 py-4 border-b border-[#E5E7EB] dark:border-gray-700">
                <h2 className="text-lg font-semibold text-[#111827] dark:text-white">Bảo mật</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-[#6B7280]">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    value={security.currentPassword}
                    onChange={(e) => {
                      setSecurity({ ...security, currentPassword: e.target.value });
                      if (passwordErrors.currentPassword) {
                        setPasswordErrors({ ...passwordErrors, currentPassword: "" });
                      }
                    }}
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${passwordErrors.currentPassword
                      ? "border-red-500 focus:ring-red-500"
                      : "border-[#E5E7EB] focus:ring-[#2563EB]"
                      }`}
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                  {passwordErrors.currentPassword && (
                    <p className="text-xs text-red-500">{passwordErrors.currentPassword}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-[#6B7280]">Mật khẩu mới</label>
                  <input
                    type="password"
                    value={security.newPassword}
                    onChange={(e) => {
                      setSecurity({ ...security, newPassword: e.target.value });
                      if (passwordErrors.newPassword) {
                        setPasswordErrors({ ...passwordErrors, newPassword: "" });
                      }
                    }}
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${passwordErrors.newPassword
                      ? "border-red-500 focus:ring-red-500"
                      : "border-[#E5E7EB] focus:ring-[#2563EB]"
                      }`}
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  />
                  {passwordErrors.newPassword && (
                    <p className="text-xs text-red-500">{passwordErrors.newPassword}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-[#6B7280]">Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    value={security.confirmPassword}
                    onChange={(e) => {
                      setSecurity({ ...security, confirmPassword: e.target.value });
                      if (passwordErrors.confirmPassword) {
                        setPasswordErrors({ ...passwordErrors, confirmPassword: "" });
                      }
                    }}
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${passwordErrors.confirmPassword
                      ? "border-red-500 focus:ring-red-500"
                      : "border-[#E5E7EB] focus:ring-[#2563EB]"
                      }`}
                    placeholder="Nhập lại mật khẩu mới"
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-xs text-red-500">{passwordErrors.confirmPassword}</p>
                  )}
                </div>

                <button
                  onClick={handleChangePassword}
                  disabled={passwordLoading || !security.currentPassword || !security.newPassword || !security.confirmPassword}
                  className="w-full px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {passwordLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {passwordLoading ? "Đang xử lý..." : "Đổi mật khẩu"}
                </button>
              </div>
            </div>

            {/* Preferences Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#E5E7EB] dark:border-gray-700 shadow-sm">
              <div className="px-6 py-4 border-b border-[#E5E7EB] dark:border-gray-700">
                <h2 className="text-lg font-semibold text-[#111827] dark:text-white">Tùy chỉnh</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-[#6B7280]">Ngôn ngữ</label>
                    <select
                      value={preferences.language}
                      onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                      className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    >
                      <option value="vi">Tiếng Việt</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-[#6B7280]">Giao diện</label>
                    <select
                      value={preferences.theme}
                      onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
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
                        checked={preferences.notifyEmail}
                        onChange={(e) => setPreferences({ ...preferences, notifyEmail: e.target.checked })}
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
                        checked={preferences.notifyPush}
                        onChange={(e) => setPreferences({ ...preferences, notifyPush: e.target.checked })}
                      />
                      <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-[#2563EB] transition-colors"></div>
                      <div className="absolute left-1 top-1 w-3.5 h-3.5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5"></div>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleSavePreferences}
                  disabled={preferencesLoading}
                  className="w-full px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {preferencesLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {preferencesLoading ? "Đang lưu..." : "Lưu tùy chỉnh"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
