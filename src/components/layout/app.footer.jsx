import moneyloverlogo from "../../assets/img/jpg/moneyloverver2.jpg";
import { IoLogoFacebook } from "react-icons/io";
import { FaSquareXTwitter } from "react-icons/fa6";
import { FaInstagram } from "react-icons/fa";
import {
  Wallet,
  Mail,
  Phone,
  MapPin,
  Clock,
  HelpCircle,
  Heart,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

// ✅ i18n
import { useTranslation } from "react-i18next";

const AppFooter = () => {
  const { t } = useTranslation();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="relative z-10">
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Column 1: Company Information */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full blur-md opacity-50"></div>
                  <img
                    src={moneyloverlogo}
                    width={56}
                    height={56}
                    className="relative rounded-full border-2 border-white/20 shadow-lg"
                    alt={t("footer.logoAlt")}
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    MoneyLover
                  </h3>
                </div>
              </div>

              <p className="text-sm text-gray-300 leading-relaxed mb-6">
                {t("footer.about")}
              </p>

              {/* Social Media */}
              <div className="flex gap-3">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("footer.social.facebook")}
                  className="group w-11 h-11 rounded-full bg-white/10 hover:bg-blue-500 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/50 border border-white/10 hover:border-blue-500"
                >
                  <IoLogoFacebook className="text-lg group-hover:text-white transition-colors" />
                </a>

                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("footer.social.twitter")}
                  className="group w-11 h-11 rounded-full bg-white/10 hover:bg-blue-400 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-400/50 border border-white/10 hover:border-blue-400"
                >
                  <FaSquareXTwitter className="text-lg group-hover:text-white transition-colors" />
                </a>

                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("footer.social.instagram")}
                  className="group w-11 h-11 rounded-full bg-white/10 hover:bg-gradient-to-br hover:from-pink-500 hover:to-purple-500 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-pink-500/50 border border-white/10 hover:border-pink-500"
                >
                  <FaInstagram className="text-lg group-hover:text-white transition-colors" />
                </a>
              </div>
            </div>

            {/* Column 2: Contact Information */}
            <div>
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-400" />
                <span>{t("footer.contact.title")}</span>
              </h3>

              <ul className="flex flex-col gap-4">
                <li className="group flex items-start gap-3 text-gray-300 hover:text-white transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-white/5 group-hover:bg-blue-500/20 flex items-center justify-center transition-all group-hover:scale-110">
                    <Phone className="w-5 h-5 text-blue-400 group-hover:text-blue-300" />
                  </div>
                  <div>
                    <a
                      href="tel:+84338428459"
                      className="hover:text-blue-400 transition-colors font-medium"
                    >
                      +84 338 428 459
                    </a>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t("footer.contact.hotlineHint")}
                    </p>
                  </div>
                </li>

                <li className="group flex items-start gap-3 text-gray-300 hover:text-white transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-white/5 group-hover:bg-purple-500/20 flex items-center justify-center transition-all group-hover:scale-110">
                    <Mail className="w-5 h-5 text-purple-400 group-hover:text-purple-300" />
                  </div>
                  <div>
                    <a
                      href="mailto:moneyloverver2@gmail.com"
                      className="hover:text-purple-400 transition-colors break-all font-medium"
                    >
                      moneyloverver2@gmail.com
                    </a>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t("footer.contact.emailHint")}
                    </p>
                  </div>
                </li>

                <li className="group flex items-start gap-3 text-gray-300 hover:text-white transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-white/5 group-hover:bg-pink-500/20 flex items-center justify-center transition-all group-hover:scale-110">
                    <MapPin className="w-5 h-5 text-pink-400 group-hover:text-pink-300" />
                  </div>
                  <div>
                    <span className="font-medium">
                      {t("footer.contact.city")}
                    </span>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t("footer.contact.country")}
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Column 3: Customer Service */}
            <div>
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-green-400" />
                <span>{t("footer.support.title")}</span>
              </h3>

              <ul className="flex flex-col gap-4">
                <li className="group flex items-start gap-3 text-gray-300 hover:text-white transition-colors cursor-pointer">
                  <div className="w-10 h-10 rounded-lg bg-white/5 group-hover:bg-green-500/20 flex items-center justify-center transition-all group-hover:scale-110">
                    <HelpCircle className="w-5 h-5 text-green-400 group-hover:text-green-300" />
                  </div>
                  <div>
                    <span className="font-medium">{t("footer.support.faq")}</span>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t("footer.support.faqHint")}
                    </p>
                  </div>
                </li>

                <li className="group flex items-start gap-3 text-gray-300 hover:text-white transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-white/5 group-hover:bg-yellow-500/20 flex items-center justify-center transition-all group-hover:scale-110">
                    <Clock className="w-5 h-5 text-yellow-400 group-hover:text-yellow-300" />
                  </div>
                  <div>
                    <span className="font-medium">
                      {t("footer.support.hours")}
                    </span>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t("footer.support.hoursValue")}
                    </p>
                  </div>
                </li>

                <li className="group">
                  <Link
                    to="/"
                    className="flex items-center gap-2 text-gray-300 hover:text-blue-400 transition-colors font-medium"
                  >
                    <span>{t("footer.support.more")}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-purple-400" />
                <span>{t("footer.quickLinks.title")}</span>
              </h3>

              <ul className="flex flex-col gap-3">
                <li>
                  <Link
                    to="/"
                    onClick={scrollToTop}
                    className="group flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                  >
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full group-hover:scale-150 transition-transform"></div>
                    <span>{t("footer.quickLinks.home")}</span>
                  </Link>
                </li>

                <li>
                  <Link
                    to="/transactions"
                    onClick={scrollToTop}
                    className="group flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                  >
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full group-hover:scale-150 transition-transform"></div>
                    <span>{t("footer.quickLinks.transactions")}</span>
                  </Link>
                </li>

                <li>
                  <Link
                    to="/reports"
                    onClick={scrollToTop}
                    className="group flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                  >
                    <div className="w-1.5 h-1.5 bg-pink-400 rounded-full group-hover:scale-150 transition-transform"></div>
                    <span>{t("footer.quickLinks.reports")}</span>
                  </Link>
                </li>

                <li>
                  <Link
                    to="/analytics"
                    onClick={scrollToTop}
                    className="group flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                  >
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full group-hover:scale-150 transition-transform"></div>
                    <span>{t("footer.quickLinks.analytics")}</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 bg-black/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-400 text-center sm:text-left flex items-center gap-2">
                <span>
                  {t("footer.copyright", {
                    year: new Date().getFullYear(),
                  })}
                </span>
                <span className="hidden sm:inline">{t("footer.rights")}</span>
              </p>

              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>{t("footer.madeWith")}</span>
                <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
                <span>{t("footer.inVietnam")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
