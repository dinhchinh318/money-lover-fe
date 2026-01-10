import { Link } from "react-router-dom";
import { Card, Row, Col } from "antd";
import { Clock, FolderTree, Wallet, ArrowRight } from "lucide-react";

// ✅ i18n
import { useTranslation } from "react-i18next";

const ReportsIndex = () => {
  const { t } = useTranslation();

  const reportTypes = [
    {
      key: "time",
      titleKey: "reportsIndex.types.time.title",
      descKey: "reportsIndex.types.time.description",
      icon: Clock,
      path: "/reports/time",
      color: "#10B981",
    },
    {
      key: "category",
      titleKey: "reportsIndex.types.category.title",
      descKey: "reportsIndex.types.category.description",
      icon: FolderTree,
      path: "/reports/category",
      color: "#3B82F6",
    },
    {
      key: "wallet",
      titleKey: "reportsIndex.types.wallet.title",
      descKey: "reportsIndex.types.wallet.description",
      icon: Wallet,
      path: "/reports/wallet",
      color: "#8B5CF6",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/70 via-white to-white p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {t("reportsIndex.title")}
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            {t("reportsIndex.subtitle")}
          </p>
        </div>

        {/* Report Types Grid */}
        <Row gutter={[16, 16]} className="sm:gutter-[24px]">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <Col xs={24} sm={12} lg={8} key={report.key}>
                <Link to={report.path}>
                  <Card
                    className="h-full shadow-sm hover:shadow-lg transition-all duration-300 border-l-4"
                    style={{ borderLeftColor: report.color }}
                    hoverable
                  >
                    <div className="flex flex-col h-full">
                      <div
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center mb-3 sm:mb-4"
                        style={{ backgroundColor: `${report.color}20` }}
                      >
                        <Icon
                          size={24}
                          className="sm:w-8 sm:h-8"
                          style={{ color: report.color }}
                        />
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                        {t(report.titleKey)}
                      </h3>

                      <p className="text-sm sm:text-base text-gray-600 mb-4 flex-grow">
                        {t(report.descKey)}
                      </p>

                      <div className="flex items-center text-[#10B981] font-semibold text-sm sm:text-base">
                        {t("reportsIndex.viewDetail")}
                        <ArrowRight
                          size={16}
                          className="sm:w-[18px] sm:h-[18px] ml-2"
                        />
                      </div>
                    </div>
                  </Card>
                </Link>
              </Col>
            );
          })}
        </Row>
      </div>
    </div>
  );
};

export default ReportsIndex;
