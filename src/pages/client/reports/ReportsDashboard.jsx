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
                const weekStart = dayjs().subtract(count - 1 - i, "week").startOf("week");
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
                const year = dayjs().subtract(count - 1 - i, "year").year();
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

    // Wallet Fluctuations - Test data với nhiều ví để test scroll
    const [walletFluctuations, setWalletFluctuations] = useState([
        {
            walletId: "1",
            walletName: "Ví tiền mặt",
            walletType: "cash",
            currentBalance: 5000000,
            change: 500000,
            changePercent: 11.11,
            periodIncome: 2000000,
            periodExpense: 1500000,
        },
        {
            walletId: "2",
            walletName: "Tài khoản ngân hàng",
            walletType: "bank",
            currentBalance: 10000000,
            change: -200000,
            changePercent: -1.96,
            periodIncome: 5000000,
            periodExpense: 5200000,
        },
        {
            walletId: "3",
            walletName: "Ví tiết kiệm",
            walletType: "saving",
            currentBalance: 25000000,
            change: 1000000,
            changePercent: 4.17,
            periodIncome: 3000000,
            periodExpense: 2000000,
        },
        {
            walletId: "4",
            walletName: "Thẻ tín dụng",
            walletType: "credit",
            currentBalance: -5000000,
            change: -300000,
            changePercent: 6.38,
            periodIncome: 0,
            periodExpense: 300000,
        },
        {
            walletId: "5",
            walletName: "Ví đầu tư",
            walletType: "cash",
            currentBalance: 15000000,
            change: 2500000,
            changePercent: 20.00,
            periodIncome: 5000000,
            periodExpense: 2500000,
        },
        {
            walletId: "6",
            walletName: "Ví phụ",
            walletType: "cash",
            currentBalance: 2000000,
            change: -100000,
            changePercent: -4.76,
            periodIncome: 500000,
            periodExpense: 600000,
        },
        {
            walletId: "7",
            walletName: "Ví dự phòng",
            walletType: "bank",
            currentBalance: 8000000,
            change: 1500000,
            changePercent: 23.08,
            periodIncome: 4000000,
            periodExpense: 2500000,
        },
        {
            walletId: "8",
            walletName: "Ví chi tiêu hàng ngày",
            walletType: "cash",
            currentBalance: 3000000,
            change: -500000,
            changePercent: -14.29,
            periodIncome: 1000000,
            periodExpense: 1500000,
        },
    ]);

    useEffect(() => {
        loadDashboardData();
        loadComparisonData();
        // Tạm thời comment để test với test data
        // loadWalletChanges();
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
                        incomeChange: data.current?.incomeChange || 0,
                        expense: data.current?.totalExpense || 0,
                        expenseChange: data.current?.expenseChange || 0,
                        balance: data.current?.balance || 0,
                        balanceChange: data.current?.balanceChange || 0,
                    },
                    previous: {
                        income: data.previous?.totalIncome || 0,
                        incomeChange: data.previous?.incomeChange || 0,
                        expense: data.previous?.totalExpense || 0,
                        expenseChange: data.previous?.expenseChange || 0,
                        balance: data.previous?.balance || 0,
                        balanceChange: data.previous?.balanceChange || 0,
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
                // Lấy mảng wallets từ data, không phải toàn bộ data object
                const wallets = res.data.wallets || [];

                // Chỉ set data nếu có ít nhất 1 ví, nếu không thì giữ test data
                if (wallets.length > 0) {
                    setWalletFluctuations(wallets);
                }
            }
        } catch (error) {
            // Error loading wallet changes
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
                                    const weekStart = jan1.add((week - 1) * 7, 'day').startOf('week');
                                    label = `Tuần ${weekStart.format("DD/MM")}`;
                                } else {
                                    label = `Tuần ${index + 1}`;
                                }
                            } else if (period === "month") {
                                // Backend trả về { year, month, label, totalIncome, totalExpense }
                                if (item.label) {
                                    label = item.label;
                                } else if (item.year && item.month) {
                                    label = dayjs(`${item.year}-${String(item.month).padStart(2, '0')}-01`).format("MM/YYYY");
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
                            formattedData.forEach(item => {
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
        '#F59E0B', // Vàng - Ăn uống
        '#EF4444', // Đỏ - Giải trí
        '#10B981', // Xanh lá - Chợ, siêu thị
        '#3B82F6', // Xanh dương - Hóa đơn
        '#8B5CF6', // Tím - Khác
        '#EC4899', // Hồng
        '#14B8A6', // Xanh ngọc
        '#F97316', // Cam
        '#6366F1', // Xanh indigo
        '#84CC16', // Xanh lá nhạt
    ];

    // Tính toán dữ liệu cho PieChart
    const getPieChartData = () => {
        if (!categoryExpenseData || categoryExpenseData.length === 0) return [];

        const total = categoryExpenseData.reduce((sum, item) => sum + (item.totalAmount || item.amount || 0), 0);

        return categoryExpenseData.map((item, index) => ({
            name: item.categoryName || item.name || "Chưa phân loại",
            value: item.totalAmount || item.amount || 0,
            percentage: total > 0 ? ((item.totalAmount || item.amount || 0) / total * 100).toFixed(0) : 0,
            color: COLORS[index % COLORS.length],
            previousAmount: item.previousAmount || 0,
        }));
    };

    // Tính tổng chi tiêu và so sánh với kỳ trước
    const getCategoryExpenseSummary = () => {
        const pieData = getPieChartData();
        const totalExpense = pieData.reduce((sum, item) => sum + item.value, 0);
        const previousTotal = pieData.reduce((sum, item) => sum + (item.previousAmount || 0), 0);
        const difference = totalExpense - previousTotal;
        const changePercent = previousTotal > 0 ? ((difference / previousTotal) * 100).toFixed(1) : 0;

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
        if (nextPeriod.isBefore(dayjs(), "month") || nextPeriod.isSame(dayjs(), "month")) {
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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                            <DollarSign className="text-white" size={24} />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 bg-clip-text text-transparent">
                                Tổng quan Tài chính
                            </h1>
                            <div className="flex items-center gap-3 mt-2">
                                <Card className="p-0 border-2 border-gray-200 shadow-md rounded-xl overflow-hidden">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-white to-gray-50">
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<ChevronLeft size={18} />}
                                            onClick={handlePreviousPeriod}
                                            className="p-1 hover:bg-blue-50 rounded-lg transition-colors"
                                        />
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200">
                                            <Calendar className="text-blue-500" size={16} />
                                            <p className="text-sm font-bold text-gray-800">
                                                Tháng {selectedPeriod.format("MM/YYYY")}
                                            </p>
                                        </div>
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<ChevronRight size={18} />}
                                            onClick={handleNextPeriod}
                                            disabled={selectedPeriod.isSame(dayjs(), "month") || selectedPeriod.isAfter(dayjs(), "month")}
                                            className="p-1 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-30"
                                        />
                                    </div>
                                </Card>
                                {!selectedPeriod.isSame(dayjs(), "month") && (
                                    <Button
                                        type="link"
                                        size="small"
                                        onClick={handleCurrentPeriod}
                                        className="text-[#10B981] hover:text-[#059669] font-semibold px-4 py-2 bg-green-50 hover:bg-green-100 rounded-lg transition-all"
                                    >
                                        Về tháng này
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Financial Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Income */}
                    <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 rounded-2xl overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-semibold text-gray-700">
                                Tổng Thu nhập
                            </span>
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md">
                                <TrendingUp size={24} className="text-white" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-[#10B981] mb-3">
                            {formatCurrency(overview.totalIncome)}
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-green-200">
                            {overview.incomeChange >= 0 ? (
                                <ArrowUpRight className="text-[#10B981]" size={16} />
                            ) : (
                                <ArrowDownRight className="text-[#EF4444]" size={16} />
                            )}
                            <span className={`text-sm font-semibold ${getChangeColor(overview.incomeChange)}`}>
                                {overview.incomeChange > 0 ? "+" : ""}
                                {overview.incomeChange}%
                            </span>
                        </div>
                    </Card>

                    {/* Total Expense */}
                    <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 rounded-2xl overflow-hidden bg-gradient-to-br from-red-50 to-pink-50">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-semibold text-gray-700">
                                Tổng Chi tiêu
                            </span>
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center shadow-md">
                                <TrendingDown size={24} className="text-white" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-[#EF4444] mb-3">
                            {formatCurrency(overview.totalExpense)}
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-red-200">
                            {overview.expenseChange >= 0 ? (
                                <ArrowUpRight className="text-[#EF4444]" size={16} />
                            ) : (
                                <ArrowDownRight className="text-[#10B981]" size={16} />
                            )}
                            <span className={`text-sm font-semibold ${getChangeColor(overview.expenseChange)}`}>
                                {overview.expenseChange > 0 ? "+" : ""}
                                {overview.expenseChange}%
                            </span>
                        </div>
                    </Card>

                    {/* Total Wallet Balance */}
                    <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-semibold text-gray-700">
                                Tổng số dư Ví
                            </span>
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-md">
                                <Wallet size={24} className="text-white" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-[#3B82F6] mb-3">
                            {formatCurrency(overview.totalBalance)}
                        </div>
                        <div className="px-3 py-1.5 bg-white rounded-lg border border-blue-200">
                            <span className="text-xs text-gray-500">Tổng tất cả ví</span>
                        </div>
                    </Card>

                    {/* Difference */}
                    <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-slate-50">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-semibold text-gray-700">
                                Chênh lệch
                            </span>
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-400 to-slate-500 flex items-center justify-center shadow-md">
                                <Scale size={24} className="text-white" />
                            </div>
                        </div>
                        <div className={`text-3xl font-bold mb-3 ${overview.difference >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}>
                            {formatCurrency(overview.difference)}
                        </div>
                        <div className="px-3 py-1.5 bg-white rounded-lg border border-gray-200">
                            <span className="text-xs text-gray-500">Thu - Chi</span>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Comparison and Wallet Fluctuations - Side by Side */}
            <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Comparison Section - Left */}
                <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 rounded-2xl overflow-hidden bg-gradient-to-br from-white to-gray-50">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg">
                                <BarChart3 className="text-white" size={18} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">
                                So sánh với Kỳ trước
                            </h3>
                        </div>
                        <Tabs
                            activeKey={comparisonTab}
                            onChange={setComparisonTab}
                            items={comparisonTabItems}
                            size="small"
                        />
                    </div>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Spin />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            {/* Current Period - Left Column */}
                            <div>
                                <div className="mb-4 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                    <h4 className="font-bold text-gray-900 text-sm">
                                        {getPeriodLabels().current}
                                    </h4>
                                </div>
                                <div className="space-y-3">
                                    <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 hover:shadow-md transition-all duration-200">
                                        <span className="text-xs font-semibold text-gray-600 mb-2 block">
                                            Tổng thu
                                        </span>
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-[#10B981] text-lg">
                                                {formatCurrency(comparison.current.income)}
                                            </span>
                                            <div className="flex items-center gap-1 px-2 py-1 bg-white rounded-lg border border-green-200">
                                                <TrendingUp size={14} className="text-[#10B981]" />
                                                <span className="text-xs font-semibold text-[#10B981]">
                                                    +{comparison.current.incomeChange}%
                                                </span>
                                            </div>
                                        </div>
                                    </Card>
                                    <Card className="p-4 bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 hover:shadow-md transition-all duration-200">
                                        <span className="text-xs font-semibold text-gray-600 mb-2 block">
                                            Tổng chi
                                        </span>
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-[#EF4444] text-lg">
                                                {formatCurrency(comparison.current.expense)}
                                            </span>
                                            <div className="flex items-center gap-1 px-2 py-1 bg-white rounded-lg border border-red-200">
                                                <TrendingDown size={14} className="text-[#EF4444]" />
                                                <span className="text-xs font-semibold text-[#EF4444]">
                                                    {comparison.current.expenseChange}%
                                                </span>
                                            </div>
                                        </div>
                                    </Card>
                                    <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 hover:shadow-md transition-all duration-200">
                                        <span className="text-xs font-semibold text-gray-600 mb-2 block">
                                            Số dư
                                        </span>
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-[#3B82F6] text-lg">
                                                {formatCurrency(comparison.current.balance)}
                                            </span>
                                            <div className="flex items-center gap-1 px-2 py-1 bg-white rounded-lg border border-blue-200">
                                                <TrendingUp size={14} className="text-[#10B981]" />
                                                <span className="text-xs font-semibold text-[#10B981]">
                                                    +{comparison.current.balanceChange}%
                                                </span>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </div>

                            {/* Previous Period - Right Column */}
                            <div>
                                <div className="mb-4 p-2 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200">
                                    <h4 className="font-bold text-gray-900 text-sm">
                                        {getPeriodLabels().previous}
                                    </h4>
                                </div>
                                <div className="space-y-3">
                                    <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 hover:shadow-md transition-all duration-200 opacity-75">
                                        <span className="text-xs font-semibold text-gray-600 mb-2 block">
                                            Tổng thu
                                        </span>
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-[#10B981] text-lg">
                                                {formatCurrency(comparison.previous.income)}
                                            </span>
                                            <div className="flex items-center gap-1 px-2 py-1 bg-white rounded-lg border border-green-200">
                                                <TrendingUp size={14} className="text-[#10B981]" />
                                                <span className="text-xs font-semibold text-[#10B981]">
                                                    +{comparison.previous.incomeChange}%
                                                </span>
                                            </div>
                                        </div>
                                    </Card>
                                    <Card className="p-4 bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 hover:shadow-md transition-all duration-200 opacity-75">
                                        <span className="text-xs font-semibold text-gray-600 mb-2 block">
                                            Tổng chi
                                        </span>
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-[#EF4444] text-lg">
                                                {formatCurrency(comparison.previous.expense)}
                                            </span>
                                            <div className="flex items-center gap-1 px-2 py-1 bg-white rounded-lg border border-red-200">
                                                <TrendingDown size={14} className="text-[#EF4444]" />
                                                <span className="text-xs font-semibold text-[#EF4444]">
                                                    {comparison.previous.expenseChange}%
                                                </span>
                                            </div>
                                        </div>
                                    </Card>
                                    <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 hover:shadow-md transition-all duration-200 opacity-75">
                                        <span className="text-xs font-semibold text-gray-600 mb-2 block">
                                            Số dư
                                        </span>
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-[#3B82F6] text-lg">
                                                {formatCurrency(comparison.previous.balance)}
                                            </span>
                                            <div className="flex items-center gap-1 px-2 py-1 bg-white rounded-lg border border-blue-200">
                                                <TrendingDown size={14} className="text-[#EF4444]" />
                                                <span className="text-xs font-semibold text-[#EF4444]">
                                                    {comparison.previous.balanceChange}%
                                                </span>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Wallet Fluctuations - Right */}
                <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 rounded-2xl overflow-hidden bg-gradient-to-br from-white to-gray-50">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg">
                            <Wallet className="text-white" size={18} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">
                            Biến động Ví
                        </h3>
                    </div>
                    <div
                        className="space-y-4 overflow-y-auto"
                        style={{
                            maxHeight: walletFluctuations.length > 2 ? '400px' : 'none',
                            paddingRight: walletFluctuations.length > 2 ? '8px' : '0'
                        }}
                    >
                        {walletFluctuations.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                Không có dữ liệu biến động ví
                            </div>
                        ) : (
                            walletFluctuations.map((wallet, index) => {
                                // Map walletType thành icon
                                const getWalletIcon = (type) => {
                                    switch (type) {
                                        case "cash": return "💵";
                                        case "bank": return "🏦";
                                        case "credit": return "💳";
                                        case "saving": return "💰";
                                        default: return "💼";
                                    }
                                };

                                return (
                                    <Card
                                        key={wallet.walletId || index}
                                        className="mb-4 border-2 hover:shadow-lg transition-all duration-200 rounded-xl bg-gradient-to-br from-white to-gray-50"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 flex items-center justify-center">
                                                    <span className="text-2xl">{wallet.icon || getWalletIcon(wallet.walletType)}</span>
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">
                                                        {wallet.walletName || wallet.name || "Ví không tên"}
                                                    </div>
                                                    <div className="text-xl font-bold text-gray-900">
                                                        {formatCurrency(wallet.currentBalance || wallet.balance || 0)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                <span className="text-sm font-semibold text-gray-600">
                                                    Thay đổi
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    {wallet.change >= 0 ? (
                                                        <ArrowUpRight className="text-[#10B981]" size={16} />
                                                    ) : (
                                                        <ArrowDownRight className="text-[#EF4444]" size={16} />
                                                    )}
                                                    <span
                                                        className={`font-bold text-sm ${wallet.change >= 0
                                                            ? "text-[#10B981]"
                                                            : "text-[#EF4444]"
                                                            }`}
                                                    >
                                                        {wallet.change >= 0 ? "+" : ""}
                                                        {formatCurrency(wallet.change)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${wallet.changePercent >= 0
                                                        ? "bg-gradient-to-r from-green-400 to-emerald-500"
                                                        : wallet.changePercent < -10
                                                            ? "bg-gradient-to-r from-red-400 to-pink-500"
                                                            : "bg-gray-400"
                                                        }`}
                                                    style={{
                                                        width: `${Math.min(
                                                            Math.abs(wallet.changePercent),
                                                            100
                                                        )}%`,
                                                    }}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                                                <span className="text-xs font-semibold text-gray-500">
                                                    Tỷ lệ thay đổi
                                                </span>
                                                <span
                                                    className={`font-bold text-sm ${wallet.changePercent >= 0
                                                        ? "text-[#10B981]"
                                                        : "text-[#EF4444]"
                                                        }`}
                                                >
                                                    {wallet.changePercent >= 0 ? "+" : ""}
                                                    {wallet.changePercent}%
                                                </span>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })
                        )}
                    </div>
                </Card>
            </div>

            {/* Chart Section - Bottom */}
            <div className="mb-6">
                <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 rounded-2xl overflow-hidden bg-gradient-to-br from-white to-gray-50">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg">
                                <BarChart3 className="text-white" size={20} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                Biến động
                            </h2>
                            {isUsingTestData && (
                                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full border border-yellow-300">
                                    📊 Dữ liệu TEST
                                </span>
                            )}
                        </div>
                        <Tabs
                            activeKey={chartTab}
                            onChange={setChartTab}
                            items={chartTabItems}
                        />
                    </div>
                    {chartLoading ? (
                        <div className="flex items-center justify-center h-[300px]">
                            <Spin size="large" />
                        </div>
                    ) : chartData && chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="label"
                                    stroke="#6B7280"
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis
                                    stroke="#6B7280"
                                    tick={{ fontSize: 12 }}
                                    tickFormatter={(value) => {
                                        if (value >= 1000000) {
                                            return `${(value / 1000000).toFixed(1)}M`;
                                        }
                                        if (value >= 1000) {
                                            return `${(value / 1000).toFixed(0)}K`;
                                        }
                                        return value.toString();
                                    }}
                                />
                                <Tooltip
                                    formatter={(value) => formatCurrency(value)}
                                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", borderRadius: "8px" }}
                                />
                                <Legend />
                                <Bar dataKey="expense" fill="#EF4444" name="Chi tiêu" radius={[8, 8, 0, 0]} />
                                <Bar dataKey="income" fill="#10B981" name="Thu nhập" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[300px] text-gray-400">
                            <div className="text-center">
                                <p className="text-lg mb-2">Chưa có dữ liệu</p>
                                <p className="text-sm">Vui lòng chọn khoảng thời gian khác hoặc thêm giao dịch</p>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Phân bổ chi tiêu theo danh mục */}
            <div className="mb-6">
                <Card className="shadow-lg border-0 overflow-hidden">
                    {/* Header với date selector đẹp hơn */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <PieChartIcon className="text-blue-600" size={24} />
                                Tình hình thu chi
                            </h3>
                            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<ChevronLeft size={18} />}
                                    onClick={handlePreviousPeriod}
                                    className="hover:bg-blue-50 transition-colors"
                                />
                                <span className="text-base font-bold text-gray-900 min-w-[100px] text-center">
                                    {selectedPeriod.format("MM/YYYY")}
                                </span>
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<ChevronRight size={18} />}
                                    onClick={handleNextPeriod}
                                    disabled={selectedPeriod.isSame(dayjs(), "month") || selectedPeriod.isAfter(dayjs(), "month")}
                                    className="hover:bg-blue-50 transition-colors disabled:opacity-30"
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
                                    <div className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                            {/* Chi tiêu Card */}
                                            <div className="relative overflow-hidden bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 border-2 border-red-100 shadow-md hover:shadow-lg transition-all duration-300 group">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-red-200 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
                                                <div className="relative z-10">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="text-sm font-semibold text-red-700 uppercase tracking-wide">Chi tiêu</span>
                                                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                                            <TrendingUp size={24} className="text-red-600" />
                                                        </div>
                                                    </div>
                                                    <div className="text-3xl font-bold text-red-600 mb-2">
                                                        {formatCurrency(summary.totalExpense)}
                                                    </div>
                                                    {summary.previousTotal > 0 && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <span className={`font-semibold ${summary.difference >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                                {summary.difference >= 0 ? '↑' : '↓'} {Math.abs(parseFloat(summary.changePercent))}%
                                                            </span>
                                                            <span className="text-gray-500">so với tháng trước</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Thu nhập Card */}
                                            <div className="relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-100 shadow-md hover:shadow-lg transition-all duration-300 group">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full -mr-16 -mt-16 opacity-20 group-hover:opacity-30 transition-opacity"></div>
                                                <div className="relative z-10">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="text-sm font-semibold text-green-700 uppercase tracking-wide">Thu nhập</span>
                                                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                                            <TrendingDown size={24} className="text-green-600 rotate-180" />
                                                        </div>
                                                    </div>
                                                    <div className="text-3xl font-bold text-green-600 mb-2">
                                                        {formatCurrency(totalIncome)}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="text-gray-500">Tổng thu nhập trong tháng</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>


                                        {/* Donut Chart - Redesigned */}
                                        {pieData.length > 0 ? (
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
                                                {/* Biểu đồ quạt bên trái - Enhanced */}
                                                <div className="flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8 border border-gray-100">
                                                    <ResponsiveContainer width="100%" height={400}>
                                                        <PieChart>
                                                            <Pie
                                                                data={pieData}
                                                                cx="50%"
                                                                cy="50%"
                                                                labelLine={false}
                                                                label={false}
                                                                outerRadius={140}
                                                                innerRadius={80}
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
                                                                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                                                                        }}
                                                                    />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip
                                                                formatter={(value, name, props) => [
                                                                    formatCurrency(value),
                                                                    `${props.payload.percentage}%`
                                                                ]}
                                                                contentStyle={{
                                                                    backgroundColor: "#fff",
                                                                    border: "2px solid #E5E7EB",
                                                                    borderRadius: "12px",
                                                                    padding: "16px",
                                                                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                                                                }}
                                                            />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>

                                                {/* Danh sách danh mục bên phải - Enhanced */}
                                                <div className="space-y-3 flex flex-col justify-center">
                                                    {pieData.map((item, index) => (
                                                        <div
                                                            key={index}
                                                            className="group relative flex items-center justify-between p-5 bg-white border-2 border-gray-100 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
                                                        >
                                                            {/* Hover gradient overlay */}
                                                            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 to-blue-50/0 group-hover:from-blue-50/50 group-hover:to-transparent transition-all duration-300"></div>

                                                            <div className="relative z-10 flex items-center gap-4 flex-1">
                                                                {/* Màu sắc danh mục - Larger */}
                                                                <div
                                                                    className="w-6 h-6 rounded-full flex-shrink-0 shadow-md group-hover:scale-110 transition-transform"
                                                                    style={{ backgroundColor: item.color }}
                                                                />
                                                                {/* Tên danh mục và phần trăm */}
                                                                <div className="flex-1">
                                                                    <div className="font-bold text-gray-900 text-lg mb-1 group-hover:text-blue-600 transition-colors">
                                                                        {item.name}
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                                                                            {item.percentage}%
                                                                        </span>
                                                                        {item.previousAmount > 0 && (
                                                                            <span className="text-xs text-gray-500">
                                                                                Kỳ trước: {formatCurrency(item.previousAmount)}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {/* Số tiền - Enhanced */}
                                                            <div className="relative z-10 text-right ml-4">
                                                                <div className="font-bold text-gray-900 text-xl group-hover:text-blue-600 transition-colors">
                                                                    {formatCurrency(item.value)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {/* Expandable section indicator */}
                                                    <div
                                                        onClick={() => setExpandedCategories(expandedCategories.includes("categories") ? [] : ["categories"])}
                                                        className="mt-6 pt-4 border-t-2 border-gray-200 cursor-pointer group"
                                                    >
                                                        <div className="flex items-center justify-between text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">
                                                            <span>Chi tiết từng danh mục ({pieData.length})</span>
                                                            <ChevronDown
                                                                size={18}
                                                                className={`transform transition-transform duration-300 ${expandedCategories.includes("categories") ? 'rotate-180' : ''}`}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center h-[300px] text-gray-400">
                                                <div className="text-center">
                                                    <p className="text-lg mb-2">Chưa có dữ liệu chi tiêu</p>
                                                    <p className="text-sm">Vui lòng thêm giao dịch chi tiêu</p>
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
                                                                <div className="space-y-3 pt-2">
                                                                    {pieData.map((item, index) => (
                                                                        <div
                                                                            key={index}
                                                                            className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-white border-2 border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-md transition-all duration-300 group"
                                                                        >
                                                                            <div className="flex items-center gap-4">
                                                                                <div
                                                                                    className="w-8 h-8 rounded-lg shadow-md flex items-center justify-center group-hover:scale-110 transition-transform"
                                                                                    style={{ backgroundColor: item.color }}
                                                                                >
                                                                                    <span className="text-white font-bold text-sm">{index + 1}</span>
                                                                                </div>
                                                                                <div>
                                                                                    <div className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
                                                                                        {item.name}
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2 mt-1">
                                                                                        <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                                                                                            {item.percentage}% tổng chi tiêu
                                                                                        </span>
                                                                                        {item.previousAmount > 0 && (
                                                                                            <span className="text-xs text-gray-500">
                                                                                                Kỳ trước: {formatCurrency(item.previousAmount)}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-right">
                                                                                <div className="font-bold text-xl text-gray-900 group-hover:text-blue-600 transition-colors">
                                                                                    {formatCurrency(item.value)}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ),
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
    );
};

export default ReportsDashboard;

