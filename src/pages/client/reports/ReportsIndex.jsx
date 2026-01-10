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
        <div className="min-h-screen bg-[#F9FAFB]">
            <div className="max-w-[1280px] mx-auto px-4 py-4 sm:py-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                        Báo cáo Tài chính
                    </h1>
                    <p className="text-sm sm:text-base text-gray-500 mt-1">
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
                                        hoverable
                                        className="h-full border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition"
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Icon */}
                                            <div
                                                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                                style={{ backgroundColor: `${report.color}20` }}
                                            >
                                                <Icon size={20} style={{ color: report.color }} />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 text-base truncate">
                                                    {report.title}
                                                </h3>

                                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                                    {report.description}
                                                </p>

                                                <div className="mt-3 inline-flex items-center text-sm font-medium text-[#10B981]">
                                                    Xem chi tiết
                                                    <ArrowRight size={14} className="ml-1" />
                                                </div>
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

