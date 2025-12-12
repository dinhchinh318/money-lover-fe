import { Link } from "react-router-dom";
import { Card, Row, Col } from "antd";
import { Search, TrendingUp, Lightbulb, ArrowRight } from "lucide-react";

const AnalyticsIndex = () => {
    const analyticsTypes = [
        {
            key: "diagnostic",
            title: "Phân tích Nguyên nhân",
            description: "Phân tích biến động, phát hiện bất thường và thói quen chi tiêu",
            icon: Search,
            path: "/analytics/diagnostic",
            color: "#10B981",
        },
        {
            key: "predictive",
            title: "Dự đoán Tài chính",
            description: "Dự đoán chi tiêu và nguy cơ vượt ngân sách",
            icon: TrendingUp,
            path: "/analytics/predictive",
            color: "#3B82F6",
        },
        {
            key: "prescriptive",
            title: "Khuyến nghị Hành động",
            description: "Gợi ý tối ưu, khuyến nghị và cảnh báo thông minh",
            icon: Lightbulb,
            path: "/analytics/prescriptive",
            color: "#8B5CF6",
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Phân tích Thông minh
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Chọn loại phân tích bạn muốn xem
                    </p>
                </div>

                {/* Analytics Types Grid */}
                <Row gutter={[24, 24]}>
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
                                                className="w-16 h-16 rounded-xl flex items-center justify-center mb-4"
                                                style={{ backgroundColor: `${analytics.color}20` }}
                                            >
                                                <Icon
                                                    size={32}
                                                    style={{ color: analytics.color }}
                                                />
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                                {analytics.title}
                                            </h3>
                                            <p className="text-gray-600 mb-4 flex-grow">
                                                {analytics.description}
                                            </p>
                                            <div className="flex items-center text-[#10B981] font-semibold">
                                                Xem chi tiết
                                                <ArrowRight size={18} className="ml-2" />
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

