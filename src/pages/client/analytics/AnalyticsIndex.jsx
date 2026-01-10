import { Link } from "react-router-dom";
import { Card, Row, Col } from "antd";
import { Search, TrendingUp, Lightbulb, ArrowRight } from "lucide-react";

// ✅ i18n
import { useTranslation } from "react-i18next";

const AnalyticsIndex = () => {
  const { t } = useTranslation();

  const analyticsTypes = [
    {
      key: "diagnostic",
      title: t("analyticsIndex.types.diagnostic.title"),
      description: t("analyticsIndex.types.diagnostic.description"),
      icon: Search,
      path: "/analytics",
      color: "#10B981",
    },
    {
      key: "predictive",
      title: t("analyticsIndex.types.predictive.title"),
      description: t("analyticsIndex.types.predictive.description"),
      icon: TrendingUp,
      path: "/analytics/predictive",
      color: "#3B82F6",
    },
    {
      key: "prescriptive",
      title: t("analyticsIndex.types.prescriptive.title"),
      description: t("analyticsIndex.types.prescriptive.description"),
      icon: Lightbulb,
      path: "/analytics/prescriptive",
      color: "#8B5CF6",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/70 via-white to-white p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {t("analyticsIndex.header.title")}
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            {t("analyticsIndex.header.subtitle")}
          </p>
        </div>

        {/* Analytics Types Grid */}
        <Row gutter={[16, 16]} className="sm:gutter-[24px]">
          {analyticsTypes.map((analytics) => {
            const Icon = analytics.icon;
            return (
              <Col xs={24} sm={12} lg={8} key={analytics.key}>
                <Link to={analytics.path}>
                  <Card
                    className="h-full shadow-sm hover:shadow-lg transition-all duration-300 border-l-4"
                    style={{ borderLeftColor: analytics.color }}
                    hoverable
                  >
                    <div className="flex flex-col h-full">
                      <div
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center mb-3 sm:mb-4"
                        style={{ backgroundColor: `${analytics.color}20` }}
                      >
                        <Icon
                          size={24}
                          className="sm:w-8 sm:h-8"
                          style={{ color: analytics.color }}
                        />
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                        {analytics.title}
                      </h3>

                      <p className="text-sm sm:text-base text-gray-600 mb-4 flex-grow">
                        {analytics.description}
                      </p>

                      <div className="flex items-center text-[#10B981] font-semibold text-sm sm:text-base">
                        {t("analyticsIndex.cta.viewDetail")}
                        <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px] ml-2" />
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

export default AnalyticsIndex;
