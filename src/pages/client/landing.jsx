import { Link } from "react-router-dom";
import { Wallet, BarChart3, Shield, Target, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

const LandingPage = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d4d2e] via-[#1a5f3f] to-[#2d1b4e] relative overflow-hidden">
      {/* Animated Background decorative elements - Responsive sizes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute bottom-0 right-0 w-[25rem] h-[25rem] sm:w-[37.5rem] sm:h-[37.5rem] bg-green-400/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-0 left-0 w-[20rem] h-[20rem] sm:w-[31.25rem] sm:h-[31.25rem] bg-purple-400/20 rounded-full blur-3xl animate-pulse-delayed"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[16rem] h-[16rem] sm:w-[25rem] sm:h-[25rem] bg-blue-400/10 rounded-full blur-3xl"></div>
      </div>

      {/* Floating Dollar Sign ($) - Bên trái - Hidden on small screens */}
      <div className="hidden sm:block absolute top-1/4 left-4 sm:left-10 z-20 animate-float" style={{ animationDelay: '0s' }}>
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.8)] transform rotate-12 border-2 border-green-400/80 hover:scale-110 transition-transform duration-300 cursor-pointer">
          <span className="text-white font-bold text-2xl sm:text-3xl">$</span>
        </div>
      </div>

      {/* Floating Coin (₫) - Bên phải - Hidden on small screens */}
      <div className="hidden sm:block absolute top-1/3 right-4 sm:right-10 z-20 animate-float-delayed" style={{ animationDelay: '0.5s' }}>
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-[0_0_25px_rgba(250,204,21,0.8)] transform -rotate-12 border-2 border-yellow-300/80 hover:scale-110 transition-transform duration-300 cursor-pointer">
          <span className="text-yellow-900 font-bold text-xl sm:text-2xl">₫</span>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
        {/* Hero Section - Tiêu đề ở trên cùng, giữa trang */}
        <div className={`w-full text-center mb-12 md:mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[3.5rem] font-extrabold text-white mb-5 leading-[1.1] drop-shadow-2xl tracking-tight">
            Chào mừng bạn đến với MoneyLover!
          </h1>
        </div>

        {/* CTA Buttons - Ngay dưới tiêu đề */}
        <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 md:mb-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '200ms' }}>
          {/* Button 1 - Đăng ký ngay - Màu đỏ */}
          <Link
            to="/register"
            className="group relative px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-semibold text-base sm:text-lg rounded-2xl shadow-[0_8px_20px_rgba(220,38,38,0.4)] hover:shadow-[0_12px_30px_rgba(220,38,38,0.6)] transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 border-2 border-red-500/50"
            aria-label="Đăng ký tài khoản mới"
          >
            <span>Đăng ký ngay</span>
            <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" />
          </Link>

          {/* Button 2 - Đăng nhập - Màu xanh đậm */}
          <Link
            to="/login"
            className="group relative px-8 py-4 bg-blue-800 hover:bg-blue-900 text-white font-semibold text-base sm:text-lg rounded-2xl shadow-[0_8px_20px_rgba(30,64,175,0.4)] hover:shadow-[0_12px_30px_rgba(30,64,175,0.6)] transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 border-2 border-blue-700/50"
            aria-label="Đăng nhập vào tài khoản"
          >
            <span>Đăng nhập</span>
            <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>

        {/* Main Content - Features và App Preview */}
        <div className="flex flex-col lg:flex-row items-start justify-between gap-10 lg:gap-16">
          {/* Left Column - Feature Cards */}
          <div className={`flex-1 w-full transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`} style={{ transitionDelay: '300ms' }}>
            <div className="flex flex-col gap-4 sm:gap-5">
              {/* Feature 1: Quản lý ví đa dạng */}
              <div 
                className={`group bg-green-100/90 border-2 border-green-400 rounded-2xl p-5 sm:p-6 flex items-start sm:items-center gap-4 shadow-lg hover:shadow-xl hover:bg-green-200/90 hover:border-green-500 transition-all duration-500 hover:-translate-y-1 hover:scale-[1.02] cursor-pointer ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}
                style={{ transitionDelay: '100ms' }}
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <Wallet className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1.5 group-hover:text-green-700 transition-colors duration-300">
                    Quản lý ví đa dạng
                  </h3>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                    Theo dõi nhiều ví tiền mặt và ngân hàng
                  </p>
                </div>
              </div>

              {/* Feature 2: Phân tích chi tiết */}
              <div 
                className={`group bg-green-100/90 border-2 border-green-400 rounded-2xl p-5 sm:p-6 flex items-start sm:items-center gap-4 shadow-lg hover:shadow-xl hover:bg-green-200/90 hover:border-green-500 transition-all duration-500 hover:-translate-y-1 hover:scale-[1.02] cursor-pointer ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}
                style={{ transitionDelay: '200ms' }}
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <BarChart3 className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1.5 group-hover:text-green-700 transition-colors duration-300">
                    Phân tích chi tiết
                  </h3>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                    Báo cáo và biểu đồ trực quan
                  </p>
                </div>
              </div>

              {/* Feature 3: Đặt mục tiêu tiết kiệm */}
              <div 
                className={`group bg-green-100/90 border-2 border-green-400 rounded-2xl p-5 sm:p-6 flex items-start sm:items-center gap-4 shadow-lg hover:shadow-xl hover:bg-green-200/90 hover:border-green-500 transition-all duration-500 hover:-translate-y-1 hover:scale-[1.02] cursor-pointer ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}
                style={{ transitionDelay: '300ms' }}
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <Target className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1.5 group-hover:text-green-700 transition-colors duration-300">
                    Đặt mục tiêu tiết kiệm
                  </h3>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                    Theo dõi tiền đó đạt mục tiêu
                  </p>
                </div>
              </div>

              {/* Feature 4: Bảo mật tuyệt đối */}
              <div 
                className={`group bg-green-100/90 border-2 border-green-400 rounded-2xl p-5 sm:p-6 flex items-start sm:items-center gap-4 shadow-lg hover:shadow-xl hover:bg-green-200/90 hover:border-green-500 transition-all duration-500 hover:-translate-y-1 hover:scale-[1.02] cursor-pointer ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}
                style={{ transitionDelay: '400ms' }}
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1.5 group-hover:text-green-700 transition-colors duration-300">
                    Bảo mật tuyệt đối
                  </h3>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                    An toàn dữ liệu của bạn
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - App Preview Card */}
          <div className={`flex-1 w-full max-w-md mx-auto lg:mx-0 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '400ms' }}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-100 hover:shadow-3xl transition-all duration-500 hover:-translate-y-2">
              {/* App Preview Header */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-gray-900 text-lg">MoneyLover</span>
              </div>

              {/* Stats Cards */}
              <div className="space-y-4">
                {/* Card 1 - Tổng số dư */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 shadow-md border border-gray-100 hover:shadow-lg hover:border-green-200 transition-all duration-300 group/card">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-gray-600 text-sm font-medium">Tổng số dư</p>
                    <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-md group-hover/card:scale-110 transition-transform duration-300">
                      <span className="text-yellow-900 font-bold text-sm">₫</span>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-green-600">30.000.000 ₫</p>
                </div>

                {/* Card 2 - Thu nhập tháng này */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 shadow-md border border-gray-100 hover:shadow-lg hover:border-green-200 transition-all duration-300 group/card">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-gray-600 text-sm font-medium">Thu nhập tháng này</p>
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md group-hover/card:scale-110 transition-transform duration-300">
                      <BarChart3 className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-green-600">15.200.000 ₫</p>
                </div>

                {/* Card 3 - Chi tiêu tháng này */}
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 shadow-md border border-gray-100 hover:shadow-lg hover:border-red-200 transition-all duration-300 group/card">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-gray-600 text-sm font-medium">Chi tiêu tháng này</p>
                    <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-md group-hover/card:scale-110 transition-transform duration-300">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-red-600">6.000.000 ₫</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
