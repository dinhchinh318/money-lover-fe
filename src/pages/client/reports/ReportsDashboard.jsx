import { useState, useEffect } from "react";
import { Card, Tabs, Spin, Button, Collapse } from "antd";
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    Scale,
    ArrowRight,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Eye,
    X,
    PieChart as PieChartIcon,
    Calendar,
    BarChart3,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import {
    getFinancialDashboardAPI,
    getWalletChangesAPI,
    compareCurrentMonthWithPreviousAPI,
    compareCurrentYearWithPreviousAPI,
    getTimeBasedReportAPI,
    getCategoryExpenseReportAPI,
} from "../../../services/api.report";
import dayjs from "dayjs";

const ReportsDashboard = () => {
    const [loading, setLoading] = useState(false);
    const [chartLoading, setChartLoading] = useState(false);
    const [comparisonTab, setComparisonTab] = useState("month");
    const [chartTab, setChartTab] = useState("month");
    const [chartData, setChartData] = useState([]);
    const [isUsingTestData, setIsUsingTestData] = useState(false);
    const [categoryExpenseData, setCategoryExpenseData] = useState([]);
    const [categoryExpenseLoading, setCategoryExpenseLoading] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState(dayjs()); // Tháng hiện tại
    const [expandedCategories, setExpandedCategories] = useState([]);

    // Hàm tạo dữ liệu test cho biểu đồ
    const generateTestData = (period) => {
        const testData = [];
        let count = 0;

        if (period === "week") {
            count = 7;
            for (let i = 0; i < count; i++) {
                const weekStart = dayjs()
                    .subtract(count - 1 - i, "week")
                    .startOf("week");
                testData.push({
                    label: `Tuần ${weekStart.format("DD/MM")}`,
                    expense: Math.floor(Math.random() * 5000000) + 1000000,
                    income: Math.floor(Math.random() * 8000000) + 2000000,
                });
            }
        } else if (period === "month") {
            count = 6;
            for (let i = 0; i < count; i++) {
                const monthDate = dayjs().subtract(count - 1 - i, "month");
                testData.push({
                    label: monthDate.format("MM/YYYY"),
                    expense: Math.floor(Math.random() * 15000000) + 5000000,
                    income: Math.floor(Math.random() * 25000000) + 10000000,
                });
            }
        } else {
            // year
            count = 6;
            for (let i = 0; i < count; i++) {
                const year = dayjs()
                    .subtract(count - 1 - i, "year")
                    .year();
                testData.push({
                    label: String(year),
                    expense: Math.floor(Math.random() * 100000000) + 50000000,
                    income: Math.floor(Math.random() * 200000000) + 100000000,
                });
            }
        }

        return testData;
    };

    // Financial Overview Data
    const [overview, setOverview] = useState({
        totalIncome: 5990000,
        incomeChange: 5,
        totalExpense: 1200000,
        expenseChange: 10,
        totalBalance: 3600000,
        difference: -3000000,
    });

    // Comparison Data
    const [comparison, setComparison] = useState({
        current: {
            income: 12000000,
            incomeChange: 5,
            expense: 11200000,
            expenseChange: -10,
            balance: 5600000,
            balanceChange: 20,
        },
        previous: {
            income: 12000000,
            incomeChange: 20,
            expense: 11200000,
            expenseChange: -10,
            balance: 5000000,
            balanceChange: -5,
        },
    });

    // Wallet Fluctuations - Dữ liệu từ API
    const [walletFluctuations, setWalletFluctuations] = useState([]);

    useEffect(() => {
        loadDashboardData();
        loadComparisonData();
        loadWalletChanges();
        loadChartData();
        loadCategoryExpenseData();
    }, [comparisonTab, chartTab, selectedPeriod]);

    const loadDashboardData = async () => {
        try {
            // Lấy dữ liệu theo tháng được chọn
            const monthStart = selectedPeriod.startOf("month");
            const monthEnd = selectedPeriod.endOf("month");
            const params = {
                startDate: monthStart.format("YYYY-MM-DD"),
                endDate: monthEnd.format("YYYY-MM-DD"),
            };
            const res = await getFinancialDashboardAPI(params);

            // Backend trả về: { status: true, error: 0, data: {...} }
            if ((res?.status === true || res?.error === 0) && res?.data) {
                const data = res.data;
                setOverview({
                    totalIncome: data.totalIncome || 0,
                    incomeChange: data.incomeChange || 0,
                    totalExpense: data.totalExpense || 0,
                    expenseChange: data.expenseChange || 0,
                    totalBalance: data.totalWalletBalance || 0,
                    difference: (data.totalIncome || 0) - (data.totalExpense || 0),
                });
            }
        } catch (error) {
            // Error loading dashboard data
        }
    };

    const loadComparisonData = async () => {
        setLoading(true);
        try {
            let res;
            switch (comparisonTab) {
                case "year":
                    res = await compareCurrentYearWithPreviousAPI();
                    break;
                case "month":
                default:
                    res = await compareCurrentMonthWithPreviousAPI();
            }

            // Backend trả về: { status: true, error: 0, data: {...} }
            if ((res?.status === true || res?.error === 0) && res?.data) {
                const data = res.data;
                setComparison({
                    current: {
                        income: data.current?.totalIncome || 0,
                        incomeChange: data.comparison?.incomeChangePercent || 0, // Lấy từ comparison
                        expense: data.current?.totalExpense || 0,
                        expenseChange: data.comparison?.expenseChangePercent || 0, // Lấy từ comparison
                        balance: data.current?.balance || 0,
                        balanceChange: data.comparison?.balanceChangePercent || 0, // Lấy từ comparison
                    },
                    previous: {
                        income: data.previous?.totalIncome || 0,
                        incomeChange: 0, // Không có phần trăm thay đổi cho kỳ trước
                        expense: data.previous?.totalExpense || 0,
                        expenseChange: 0, // Không có phần trăm thay đổi cho kỳ trước
                        balance: data.previous?.balance || 0,
                        balanceChange: 0, // Không có phần trăm thay đổi cho kỳ trước
                    },
                });
            }
        } catch (error) {
            // Error loading comparison data
        } finally {
            setLoading(false);
        }
    };

    const loadWalletChanges = async () => {
        try {
            // Lấy dữ liệu theo tháng được chọn
            const monthStart = selectedPeriod.startOf("month");
            const monthEnd = selectedPeriod.endOf("month");
            const params = {
                startDate: monthStart.format("YYYY-MM-DD"),
                endDate: monthEnd.format("YYYY-MM-DD"),
            };

            const res = await getWalletChangesAPI(params);

            // Backend trả về: { status: true, error: 0, data: {wallets: [...], period: {...}} }
            if ((res?.status === true || res?.error === 0) && res?.data) {
                // Lấy mảng wallets từ data
                const wallets = res.data.wallets || [];
                setWalletFluctuations(wallets);
            } else {
                // Nếu không có dữ liệu, set mảng rỗng
                setWalletFluctuations([]);
            }
        } catch (error) {
            console.error("Error loading wallet changes:", error);
            setWalletFluctuations([]);
        }
    };

    const loadChartData = async () => {
        setChartLoading(true);
        try {
            let params = {};
            let period = "week";

            // Tính toán khoảng thời gian - sử dụng ngày hiện tại, không được vượt quá
            const now = dayjs();
            const today = now.format("YYYY-MM-DD");

            switch (chartTab) {
                case "week":
                    period = "week";
                    // Lấy 7 tuần gần nhất (từ 6 tuần trước đến tuần hiện tại)
                    // Tính từ đầu tuần hiện tại
                    const currentWeekStart = now.startOf("week");
                    const weekStart = currentWeekStart.subtract(6, "week"); // 6 tuần trước
                    const weekEnd = now; // Dùng ngày hiện tại, không dùng endOf("week") để tránh tính vào tương lai

                    params = {
                        startDate: weekStart.format("YYYY-MM-DD"),
                        endDate: weekEnd.format("YYYY-MM-DD"),
                        period: "week",
                    };
                    break;
                case "month":
                    period = "month";
                    // Lấy 6 tháng gần nhất (từ 5 tháng trước đến tháng hiện tại)
                    const currentMonthStart = now.startOf("month");
                    const monthStart = currentMonthStart.subtract(5, "month"); // 5 tháng trước
                    const monthEnd = now; // Dùng ngày hiện tại

                    params = {
                        startDate: monthStart.format("YYYY-MM-DD"),
                        endDate: monthEnd.format("YYYY-MM-DD"),
                        period: "month",
                    };
                    break;
                case "year":
                    period = "year";
                    // Lấy 6 năm gần nhất (từ 5 năm trước đến năm hiện tại)
                    const currentYearStart = now.startOf("year");
                    const yearStart = currentYearStart.subtract(5, "year"); // 5 năm trước
                    const yearEnd = now; // Dùng ngày hiện tại

                    params = {
                        startDate: yearStart.format("YYYY-MM-DD"),
                        endDate: yearEnd.format("YYYY-MM-DD"),
                        period: "year",
                    };
                    break;
            }

            // Validate params trước khi gọi API
            if (!params.startDate || !params.endDate) {
                setChartData([]);
                setChartLoading(false);
                return;
            }

            // Kiểm tra nếu startDate > endDate
            if (dayjs(params.startDate).isAfter(dayjs(params.endDate))) {
                setChartData([]);
                setChartLoading(false);
                return;
            }

            // Gọi API
            let res;
            let apiSuccess = false;
            try {
                res = await getTimeBasedReportAPI(params);

                // Axios interceptor đã unwrap response.data, nên res trực tiếp là {status, error, data}
                // Kiểm tra response hợp lệ
                const isValidResponse =
                    res &&
                    (res.status === true || res.error === 0 || res.EC === 0) &&
                    res.data !== undefined &&
                    res.data !== null;

                if (isValidResponse) {
                    const data = res.data;

                    // Kiểm tra nếu data là mảng (kể cả rỗng)
                    if (Array.isArray(data)) {
                        if (data.length > 0) {
                            apiSuccess = true;
                        } else {
                            // API thành công nhưng không có dữ liệu trong khoảng thời gian
                            // Vẫn set data rỗng từ API, không dùng test data
                            setChartData([]);
                            setIsUsingTestData(false);
                            setChartLoading(false);
                            return;
                        }
                    }

                    if (apiSuccess) {
                        // Transform data for chart
                        let formattedData = data.map((item, index) => {
                            let label = "";

                            if (period === "week") {
                                // Backend trả về { year, week, label, totalIncome, totalExpense }
                                if (item.label) {
                                    label = item.label;
                                } else if (item.year && item.week) {
                                    // Tạo date từ year và week
                                    const year = item.year;
                                    const week = item.week;
                                    // Tính ngày đầu tuần từ year và week
                                    const jan1 = dayjs(`${year}-01-01`);
                                    const weekStart = jan1
                                        .add((week - 1) * 7, "day")
                                        .startOf("week");
                                    label = `Tuần ${weekStart.format("DD/MM")}`;
                                } else {
                                    label = `Tuần ${index + 1}`;
                                }
                            } else if (period === "month") {
                                // Backend trả về { year, month, label, totalIncome, totalExpense }
                                if (item.label) {
                                    label = item.label;
                                } else if (item.year && item.month) {
                                    label = dayjs(
                                        `${item.year}-${String(item.month).padStart(2, "0")}-01`
                                    ).format("MM/YYYY");
                                } else {
                                    label = `Tháng ${index + 1}`;
                                }
                            } else {
                                // Year
                                if (item.label) {
                                    label = item.label;
                                } else if (item.year) {
                                    label = String(item.year);
                                } else {
                                    label = `Năm ${index + 1}`;
                                }
                            }

                            const formattedItem = {
                                label: label || `Item ${index + 1}`,
                                expense: Number(item.totalExpense || item.expense || 0),
                                income: Number(item.totalIncome || item.income || 0),
                                year: item.year || null, // Lưu year để map sau
                            };

                            return formattedItem;
                        });

                        // Nếu là period "year", tạo 6 vùng và map data vào
                        if (period === "year") {
                            const currentYear = now.year();
                            const yearDataMap = new Map();

                            // Tạo map từ data API - kiểm tra cả item.year và item.label
                            formattedData.forEach((item) => {
                                let year = null;

                                // Lấy year từ item.year
                                if (item.year) {
                                    year = Number(item.year);
                                }
                                // Hoặc parse từ label nếu có (ví dụ: "Năm 2024" hoặc "2024")
                                else if (item.label) {
                                    const yearMatch = item.label.match(/\d{4}/);
                                    if (yearMatch) {
                                        year = Number(yearMatch[0]);
                                    }
                                }

                                if (year) {
                                    yearDataMap.set(year, item);
                                }
                            });

                            // Tạo 6 năm (từ 5 năm trước đến năm hiện tại)
                            const sixYearsData = [];
                            for (let i = 5; i >= 0; i--) {
                                const year = currentYear - i;
                                const yearData = yearDataMap.get(year);

                                if (yearData) {
                                    // Có data cho năm này
                                    sixYearsData.push({
                                        label: String(year),
                                        expense: yearData.expense || 0,
                                        income: yearData.income || 0,
                                        year: year,
                                    });
                                }
                            }

                            // Chỉ gán lại nếu có ít nhất 1 năm có data
                            if (sixYearsData.length > 0) {
                                formattedData = sixYearsData;
                            }
                        }

                        setChartData(formattedData);
                        setIsUsingTestData(false);
                        setChartLoading(false);
                        return;
                    }
                }
            } catch (apiError) {
                // Error calling API
            }

            // Nếu API không thành công hoặc không có dữ liệu, dùng test data
            const testData = generateTestData(period);
            setChartData(testData);
            setIsUsingTestData(true);
        } catch (error) {
            setChartData([]);
        } finally {
            setChartLoading(false);
        }
    };

    const loadCategoryExpenseData = async () => {
        setCategoryExpenseLoading(true);
        try {
            // Lấy dữ liệu theo tháng được chọn
            const monthStart = selectedPeriod.startOf("month");
            const monthEnd = selectedPeriod.endOf("month");
            const params = {
                startDate: monthStart.format("YYYY-MM-DD"),
                endDate: monthEnd.format("YYYY-MM-DD"),
            };
            const res = await getCategoryExpenseReportAPI(params);

            // Backend trả về: { status: true, error: 0, data: [...] }
            if ((res?.status === true || res?.error === 0) && res?.data) {
                const data = res.data || [];
                setCategoryExpenseData(data);
            } else {
                setCategoryExpenseData([]);
            }
        } catch (error) {
            setCategoryExpenseData([]);
        } finally {
            setCategoryExpenseLoading(false);
        }
    };

    // Màu sắc cho PieChart - màu đẹp và dễ phân biệt
    const COLORS = [
        "#F59E0B", // Vàng - Ăn uống
        "#EF4444", // Đỏ - Giải trí
        "#10B981", // Xanh lá - Chợ, siêu thị
        "#3B82F6", // Xanh dương - Hóa đơn
        "#8B5CF6", // Tím - Khác
        "#EC4899", // Hồng
        "#14B8A6", // Xanh ngọc
        "#F97316", // Cam
        "#6366F1", // Xanh indigo
        "#84CC16", // Xanh lá nhạt
    ];

    // Tính toán dữ liệu cho PieChart
    const getPieChartData = () => {
        if (!categoryExpenseData || categoryExpenseData.length === 0) return [];

        const total = categoryExpenseData.reduce(
            (sum, item) => sum + (item.totalAmount || item.amount || 0),
            0
        );

        return categoryExpenseData.map((item, index) => ({
            name: item.categoryName || item.name || "Chưa phân loại",
            value: item.totalAmount || item.amount || 0,
            percentage:
                total > 0
                    ? (((item.totalAmount || item.amount || 0) / total) * 100).toFixed(0)
                    : 0,
            color: COLORS[index % COLORS.length],
            previousAmount: item.previousAmount || 0,
        }));
    };

    // Tính tổng chi tiêu và so sánh với kỳ trước
    const getCategoryExpenseSummary = () => {
        const pieData = getPieChartData();
        const totalExpense = pieData.reduce((sum, item) => sum + item.value, 0);
        const previousTotal = pieData.reduce(
            (sum, item) => sum + (item.previousAmount || 0),
            0
        );
        const difference = totalExpense - previousTotal;
        const changePercent =
            previousTotal > 0 ? ((difference / previousTotal) * 100).toFixed(1) : 0;

        return {
            totalExpense,
            previousTotal,
            difference,
            changePercent,
        };
    };

    // Hàm chuyển kỳ
    const handlePreviousPeriod = () => {
        setSelectedPeriod(selectedPeriod.subtract(1, "month"));
    };

    const handleNextPeriod = () => {
        const nextPeriod = selectedPeriod.add(1, "month");
        // Không cho phép chọn tháng tương lai
        if (
            nextPeriod.isBefore(dayjs(), "month") ||
            nextPeriod.isSame(dayjs(), "month")
        ) {
            setSelectedPeriod(nextPeriod);
        }
    };

    const handleCurrentPeriod = () => {
        setSelectedPeriod(dayjs());
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(value || 0);
    };

    const getChangeColor = (value) => {
        if (value > 0) return "text-[#10B981]";
        if (value < 0) return "text-[#EF4444]";
        return "text-gray-600";
    };

    const getChangeIcon = (value) => {
        if (value > 0) return <TrendingUp size={16} />;
        if (value < 0) return <TrendingDown size={16} />;
        return null;
    };

    const getPeriodLabels = () => {
        switch (comparisonTab) {
            case "year":
                return { current: "Năm này", previous: "Năm trước" };
            case "month":
            default:
                return { current: "Tháng này", previous: "Tháng trước" };
        }
    };

    const comparisonTabItems = [
        {
            key: "month",
            label: "Tháng",
        },
        {
            key: "year",
            label: "Năm",
        },
    ];

    const chartTabItems = [
        {
            key: "month",
            label: "Tháng",
        },
        {
            key: "year",
            label: "Năm",
        },
    ];

    return (
        <div className="min-h-screen bg-[#F9FAFB]">
            <div className="max-w-[1280px] mx-auto px-4 py-4 sm:py-6">
                {/* Header Section */}
                <div className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                                Tổng quan tài chính
                            </h1>
                            <p className="text-sm text-gray-500">
                                Tháng {selectedPeriod.format("MM/YYYY")}
                            </p>
                        </div>

                        {/* Month navigator giữ lại logic cũ */}
                        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                            <Button
                                type="text"
                                size="small"
                                icon={<ChevronLeft />}
                                onClick={handlePreviousPeriod}
                            />
                            <span className="font-semibold text-sm min-w-[80px] text-center">
                                {selectedPeriod.format("MM/YYYY")}
                            </span>
                            <Button
                                type="text"
                                size="small"
                                icon={<ChevronRight />}
                                onClick={handleNextPeriod}
                                disabled={selectedPeriod.isSame(dayjs(), "month")}
                            />
                        </div>
                    </div>
                </div>

                {/* Financial Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                    {/* Tổng thu */}
                    <Card className="border border-gray-200 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Tổng thu</span>
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                        </div>
                        <p className="text-2xl font-semibold text-gray-900 mt-1 truncate">
                            {formatCurrency(overview.totalIncome)}
                        </p>
                        <span className="text-xs text-emerald-600">
                            +{overview.incomeChange}%
                        </span>
                    </Card>

                    {/* Tổng chi */}
                    <Card className="border border-gray-200 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Tổng chi</span>
                            <TrendingDown className="w-4 h-4 text-rose-500" />
                        </div>
                        <p className="text-2xl font-semibold text-gray-900 mt-1 truncate">
                            {formatCurrency(overview.totalExpense)}
                        </p>
                        <span className="text-xs text-rose-600">
                            {overview.expenseChange > 0 ? "+" : ""}
                            {overview.expenseChange}%
                        </span>
                    </Card>

                    {/* Tổng số dư ví */}
                    <Card className="border border-gray-200 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Tổng số dư</span>
                            <Wallet className="w-4 h-4 text-blue-500" />
                        </div>
                        <p className="text-2xl font-semibold text-gray-900 mt-1 truncate">
                            {formatCurrency(overview.totalBalance)}
                        </p>
                        <span className="text-xs text-gray-400">Tất cả ví</span>
                    </Card>

                    {/* Chênh lệch */}
                    <Card className="border border-gray-200 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Chênh lệch</span>
                            <Scale className="w-4 h-4 text-gray-500" />
                        </div>
                        <p
                            className={`text-2xl font-semibold mt-1 truncate ${overview.difference >= 0 ? "text-emerald-600" : "text-rose-600"
                                }`}
                        >
                            {formatCurrency(overview.difference)}
                        </p>
                        <span className="text-xs text-gray-400">Thu - Chi</span>
                    </Card>
                </div>
            </div>

            {/* Comparison + Wallet + Chart */}
            <div className="mb-6">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                    {/* LEFT COLUMN */}
                    <div className="xl:col-span-1 space-y-6">

                        {/* Comparison */}
                        <Card className="border border-gray-200 rounded-xl shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-900">
                                    So sánh kỳ trước
                                </h3>
                                <Tabs
                                    activeKey={comparisonTab}
                                    onChange={setComparisonTab}
                                    items={comparisonTabItems}
                                    size="small"
                                />
                            </div>

                            {loading ? (
                                <div className="py-6 flex justify-center">
                                    <Spin />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Thu</span>
                                        <span className="font-semibold">
                                            {formatCurrency(comparison.current.income)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Chi</span>
                                        <span className="font-semibold">
                                            {formatCurrency(comparison.current.expense)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Số dư</span>
                                        <span className="font-semibold">
                                            {formatCurrency(comparison.current.balance)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </Card>

                        {/* Wallet list */}
                        <Card className="border border-gray-200 rounded-xl shadow-sm">
                            <h3 className="font-semibold mb-3">Biến động ví</h3>

                            <div className="max-h-[360px] overflow-y-auto space-y-3 pr-1">
                                {walletFluctuations.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-6">
                                        Không có dữ liệu
                                    </p>
                                ) : (
                                    walletFluctuations.map((wallet, index) => (
                                        <div
                                            key={wallet.walletId || index}
                                            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                                        >
                                            <span className="truncate text-sm font-medium">
                                                {wallet.walletName || wallet.name}
                                            </span>
                                            <span className="text-sm font-semibold">
                                                {formatCurrency(wallet.currentBalance || wallet.balance)}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>

                    </div>

                    {/* RIGHT COLUMN – CHART */}
                    <div className="xl:col-span-2">
                        <Card className="border border-gray-200 rounded-xl shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold">Biến động thu chi</h3>
                                <Tabs
                                    activeKey={chartTab}
                                    onChange={setChartTab}
                                    items={chartTabItems}
                                    size="small"
                                />
                            </div>

                            {chartLoading ? (
                                <div className="h-[320px] flex items-center justify-center">
                                    <Spin />
                                </div>
                            ) : chartData.length > 0 ? (
                                <div className="h-[320px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                                            <YAxis tick={{ fontSize: 10 }} />
                                            <Tooltip formatter={(v) => formatCurrency(v)} />
                                            <Legend />
                                            <Bar dataKey="expense" fill="#EF4444" name="Chi" />
                                            <Bar dataKey="income" fill="#10B981" name="Thu" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-[320px] flex items-center justify-center text-gray-400">
                                    Chưa có dữ liệu
                                </div>
                            )}
                        </Card>
                    </div>
                </div>

                {/* Phân bổ chi tiêu theo danh mục */}
                <div className="mb-6">
                    <Card className="shadow-lg border-0 overflow-hidden">
                        {/* Header với date selector đẹp hơn */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <PieChartIcon className="text-blue-600" size={20} />
                                    Tình hình thu chi
                                </h3>
                                <div className="flex items-center gap-2 sm:gap-3 bg-white px-3 sm:px-4 py-2 rounded-lg shadow-sm border border-gray-200 w-full sm:w-auto">
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<ChevronLeft size={16} />}
                                        onClick={handlePreviousPeriod}
                                        className="hover:bg-blue-50 transition-colors p-1"
                                    />
                                    <span className="text-sm sm:text-base font-bold text-gray-900 min-w-[80px] sm:min-w-[100px] text-center">
                                        {selectedPeriod.format("MM/YYYY")}
                                    </span>
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<ChevronRight size={16} />}
                                        onClick={handleNextPeriod}
                                        disabled={
                                            selectedPeriod.isSame(dayjs(), "month") ||
                                            selectedPeriod.isAfter(dayjs(), "month")
                                        }
                                        className="hover:bg-blue-50 transition-colors disabled:opacity-30 p-1"
                                    />
                                </div>
                            </div>
                        </div>

                        {categoryExpenseLoading ? (
                            <div className="flex justify-center py-8">
                                <Spin />
                            </div>
                        ) : (
                            <>
                                {/* Summary Cards - Redesigned */}
                                {(() => {
                                    const summary = getCategoryExpenseSummary();
                                    const pieData = getPieChartData();
                                    const totalIncome = overview.totalIncome || 0;

                                    return (
                                        <div className="p-4 sm:p-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                                                {/* Chi tiêu Card */}
                                                <div className="relative overflow-hidden bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-4 sm:p-6 border-2 border-red-100 shadow-md hover:shadow-lg transition-all duration-300 group">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-200 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
                                                    <div className="relative z-10">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <span className="text-xs sm:text-sm font-semibold text-red-700 uppercase tracking-wide">
                                                                Chi tiêu
                                                            </span>
                                                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                                                <TrendingUp
                                                                    size={20}
                                                                    className="text-red-600"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="text-2xl sm:text-3xl font-bold text-red-600 mb-2">
                                                            {formatCurrency(summary.totalExpense)}
                                                        </div>
                                                        {summary.previousTotal > 0 && (
                                                            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                                                                <span
                                                                    className={`font-semibold ${summary.difference >= 0
                                                                        ? "text-red-600"
                                                                        : "text-green-600"
                                                                        }`}
                                                                >
                                                                    {summary.difference >= 0 ? "↑" : "↓"}{" "}
                                                                    {Math.abs(parseFloat(summary.changePercent))}%
                                                                </span>
                                                                <span className="text-gray-500">
                                                                    so với tháng trước
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Thu nhập Card */}
                                                <div className="relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 sm:p-6 border-2 border-green-100 shadow-md hover:shadow-lg transition-all duration-300 group">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
                                                    <div className="relative z-10">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <span className="text-xs sm:text-sm font-semibold text-green-700 uppercase tracking-wide">
                                                                Thu nhập
                                                            </span>
                                                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                                                <TrendingDown
                                                                    size={20}
                                                                    className="text-green-600 rotate-180"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">
                                                            {formatCurrency(totalIncome)}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                                                            <span className="text-gray-500">
                                                                Tổng thu nhập trong tháng
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Donut Chart - Redesigned */}
                                            {pieData.length > 0 ? (
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mb-6">
                                                    {/* Biểu đồ quạt bên trái - Enhanced */}
                                                    <div className="flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-4 sm:p-8 border border-gray-100">
                                                        <div className="h-[320px] w-full">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <PieChart>
                                                                    <Pie
                                                                        data={pieData}
                                                                        cx="50%"
                                                                        cy="50%"
                                                                        labelLine={false}
                                                                        label={false}
                                                                        outerRadius="70%"
                                                                        innerRadius="40%"
                                                                        fill="#8884d8"
                                                                        dataKey="value"
                                                                        paddingAngle={3}
                                                                        stroke="#fff"
                                                                        strokeWidth={3}
                                                                    >
                                                                        {pieData.map((entry, index) => (
                                                                            <Cell
                                                                                key={`cell-${index}`}
                                                                                fill={entry.color}
                                                                                stroke="#fff"
                                                                                strokeWidth={3}
                                                                                style={{
                                                                                    filter:
                                                                                        "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                                                                                }}
                                                                            />
                                                                        ))}
                                                                    </Pie>
                                                                    <Tooltip
                                                                        formatter={(value, name, props) => [
                                                                            formatCurrency(value),
                                                                            `${props.payload.percentage}%`,
                                                                        ]}
                                                                        contentStyle={{
                                                                            backgroundColor: "#fff",
                                                                            border: "2px solid #E5E7EB",
                                                                            borderRadius: "12px",
                                                                            padding: "16px",
                                                                            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                                                                        }}
                                                                    />
                                                                </PieChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                    </div>

                                                    {/* Danh sách danh mục (SCROLL) */}
                                                    <div className="flex flex-col h-[320px]">
                                                        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                                                            {pieData.map((item, index) => (
                                                                <div
                                                                    key={index}
                                                                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                                                                >
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <span
                                                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                                                            style={{ backgroundColor: item.color }}
                                                                        />
                                                                        <div className="min-w-0">
                                                                            <p className="font-medium truncate">{item.name}</p>
                                                                            <p className="text-xs text-gray-500">
                                                                                {item.percentage}%
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                    <span className="font-semibold text-sm">
                                                                        {formatCurrency(item.value)}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Nút mở chi tiết */}
                                                        <div
                                                            onClick={() =>
                                                                setExpandedCategories(
                                                                    expandedCategories.includes("categories") ? [] : ["categories"]
                                                                )
                                                            }
                                                            className="mt-3 pt-3 border-t border-gray-200 cursor-pointer text-sm font-semibold text-gray-600 hover:text-blue-600 flex items-center justify-between"
                                                        >
                                                            <span>Chi tiết từng danh mục</span>
                                                            <ChevronDown
                                                                size={16}
                                                                className={`transition-transform ${expandedCategories.includes("categories") ? "rotate-180" : ""
                                                                    }`}
                                                            />
                                                        </div>
                                                    </div>

                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center h-[300px] text-gray-400">
                                                    <div className="text-center">
                                                        <p className="text-lg mb-2">
                                                            Chưa có dữ liệu chi tiêu
                                                        </p>
                                                        <p className="text-sm">
                                                            Vui lòng thêm giao dịch chi tiêu
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Chi tiết từng danh mục - Enhanced */}
                                            {pieData.length > 0 && (
                                                <div className="mt-6">
                                                    <Collapse
                                                        activeKey={expandedCategories}
                                                        onChange={setExpandedCategories}
                                                        items={[
                                                            {
                                                                key: "categories",
                                                                label: (
                                                                    <span className="font-bold text-lg text-gray-900 flex items-center gap-2">
                                                                        <Eye size={20} />
                                                                        Chi tiết từng danh mục ({pieData.length})
                                                                    </span>
                                                                ),
                                                                children: (
                                                                    <div
                                                                        style={{ maxHeight: 360, overflowY: "auto" }}
                                                                        className="space-y-3 pt-2 pr-2"
                                                                    >
                                                                        {pieData.map((item, index) => (
                                                                            <div
                                                                                key={index}
                                                                                className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg"
                                                                            >
                                                                                <div className="flex items-center gap-3">
                                                                                    <span
                                                                                        className="w-4 h-4 rounded-full"
                                                                                        style={{ backgroundColor: item.color }}
                                                                                    />
                                                                                    <div>
                                                                                        <p className="font-semibold">{item.name}</p>
                                                                                        <p className="text-xs text-gray-500">
                                                                                            {item.percentage}% tổng chi
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                                <span className="font-bold">
                                                                                    {formatCurrency(item.value)}
                                                                                </span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )
                                                            },
                                                        ]}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </>
                        )}
                    </Card>
                </div>
            </div>
        </div >
    );
};

export default ReportsDashboard;
