import { Link } from "react-router-dom";
import { Card, Row, Col } from "antd";
import { Clock, FolderTree, Wallet, ArrowRight } from "lucide-react";

const ReportsIndex = () => {
    const reportTypes = [
        {
            key: "time",
            title: "Báo cáo theo Thời gian",
            description: "Phân tích thu chi theo thời gian với biểu đồ đường và cột",
            icon: Clock,
            path: "/reports/time",
            color: "#10B981",
        },
        {
            key: "category",
            title: "Báo cáo theo Danh mục",
            description: "Phân tích chi tiêu theo danh mục với biểu đồ tròn và cột ngang",
            icon: FolderTree,
            path: "/reports/category",
            color: "#3B82F6",
        },
        {
            key: "wallet",
            title: "Báo cáo theo Ví",
            description: "Phân tích chi tiêu theo ví với biểu đồ tròn và đường đa tuyến",
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
                        Báo cáo Tài chính
                    </h1>
                    <p className="text-gray-600 text-base sm:text-lg">
                        Chọn loại báo cáo bạn muốn xem
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
                                                {report.title}
                                            </h3>
                                            <p className="text-sm sm:text-base text-gray-600 mb-4 flex-grow">
                                                {report.description}
                                            </p>
                                            <div className="flex items-center text-[#10B981] font-semibold text-sm sm:text-base">
                                                Xem chi tiết
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

export default ReportsIndex;

