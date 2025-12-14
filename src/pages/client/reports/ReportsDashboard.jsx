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
        <div className="max-w-7xl mx-auto p-6">
                    {/* Financial Overview Section */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Tổng quan Tài chính
                                </h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<ChevronLeft size={16} />}
                                        onClick={handlePreviousPeriod}
                                        className="p-1"
                                    />
                                    <p className="text-sm text-gray-500">
                                        Tháng {selectedPeriod.format("MM/YYYY")}
                                    </p>
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<ChevronRight size={16} />}
                                        onClick={handleNextPeriod}
                                        disabled={selectedPeriod.isSame(dayjs(), "month") || selectedPeriod.isAfter(dayjs(), "month")}
                                        className="p-1"
                                    />
                                    {!selectedPeriod.isSame(dayjs(), "month") && (
                                        <Button
                                            type="link"
                                            size="small"
                                            onClick={handleCurrentPeriod}
                                            className="text-[#10B981] p-0 h-auto"
                                        >
                                            Về tháng này
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Total Income */}
                        <Card className="shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600">
                                    Tổng Thu nhập
                                </span>
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: "#D1FAE5" }}
                                >
                                    <TrendingUp size={20} className="text-[#10B981]" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-[#10B981] mb-1">
                                {formatCurrency(overview.totalIncome)}
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                                <span className={getChangeColor(overview.incomeChange)}>
                                    {getChangeIcon(overview.incomeChange)}
                                </span>
                                <span className={getChangeColor(overview.incomeChange)}>
                                    {overview.incomeChange > 0 ? "+" : ""}
                                    {overview.incomeChange}%
                                </span>
                            </div>
                        </Card>

                        {/* Total Expense */}
                        <Card className="shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600">
                                    Tổng Chi tiêu
                                </span>
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: "#FEE2E2" }}
                                >
                                    <TrendingDown size={20} className="text-[#EF4444]" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-[#EF4444] mb-1">
                                {formatCurrency(overview.totalExpense)}
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                                <span className={getChangeColor(overview.expenseChange)}>
                                    {getChangeIcon(overview.expenseChange)}
                                </span>
                                <span className={getChangeColor(overview.expenseChange)}>
                                    {overview.expenseChange > 0 ? "+" : ""}
                                    {overview.expenseChange}%
                                </span>
                            </div>
                        </Card>

                        {/* Total Wallet Balance */}
                        <Card className="shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600">
                                    Tổng số dư Ví
                                </span>
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: "#DBEAFE" }}
                                >
                                    <Wallet size={20} className="text-[#3B82F6]" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-[#3B82F6] mb-1">
                                {formatCurrency(overview.totalBalance)}
                            </div>
                        </Card>

                        {/* Difference */}
                        <Card className="shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600">
                                    Chênh lệch
                                </span>
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: "#F3F4F6" }}
                                >
                                    <Scale size={20} className="text-gray-600" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-gray-900 mb-1">
                                {formatCurrency(overview.difference)}
                            </div>
                        </Card>
                        </div>
                    </div>

                    {/* Comparison and Wallet Fluctuations - Side by Side */}
                    <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Comparison Section - Left */}
                        <Card className="shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    So sánh với Kỳ trước
                                </h3>
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
                                        <h4 className="font-semibold text-gray-700 mb-3 text-sm">
                                            {getPeriodLabels().current}
                                        </h4>
                                        <div className="space-y-3">
                                            <div className="flex flex-col gap-1 p-3 bg-gray-50 rounded-lg">
                                                <span className="text-xs text-gray-600">
                                                    Tổng thu
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-[#10B981] text-sm">
                                                        {formatCurrency(comparison.current.income)}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-xs text-[#10B981]">
                                                        <TrendingUp size={12} />
                                                        +{comparison.current.incomeChange}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1 p-3 bg-gray-50 rounded-lg">
                                                <span className="text-xs text-gray-600">
                                                    Tổng chi
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-[#EF4444] text-sm">
                                                        {formatCurrency(comparison.current.expense)}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-xs text-[#EF4444]">
                                                        <TrendingDown size={12} />
                                                        {comparison.current.expenseChange}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1 p-3 bg-gray-50 rounded-lg">
                                                <span className="text-xs text-gray-600">
                                                    Số dư
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-[#3B82F6] text-sm">
                                                        {formatCurrency(comparison.current.balance)}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-xs text-[#10B981]">
                                                        <TrendingUp size={12} />
                                                        +{comparison.current.balanceChange}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Previous Period - Right Column */}
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-3 text-sm">
                                            {getPeriodLabels().previous}
                                        </h4>
                                        <div className="space-y-3">
                                            <div className="flex flex-col gap-1 p-3 bg-gray-50 rounded-lg">
                                                <span className="text-xs text-gray-600">
                                                    Tổng thu
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-[#10B981] text-sm">
                                                        {formatCurrency(comparison.previous.income)}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-xs text-[#10B981]">
                                                        <TrendingUp size={12} />
                                                        +{comparison.previous.incomeChange}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1 p-3 bg-gray-50 rounded-lg">
                                                <span className="text-xs text-gray-600">
                                                    Tổng chi
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-[#EF4444] text-sm">
                                                        {formatCurrency(comparison.previous.expense)}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-xs text-[#EF4444]">
                                                        <TrendingDown size={12} />
                                                        {comparison.previous.expenseChange}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1 p-3 bg-gray-50 rounded-lg">
                                                <span className="text-xs text-gray-600">
                                                    Số dư
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-[#3B82F6] text-sm">
                                                        {formatCurrency(comparison.previous.balance)}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-xs text-[#EF4444]">
                                                        <TrendingDown size={12} />
                                                        {comparison.previous.balanceChange}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Card>

                        {/* Wallet Fluctuations - Right */}
                        <Card className="shadow-sm">
                            <h3 className="text-lg font-semibold mb-4">
                                Biến động Ví
                            </h3>
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
                                            <div key={wallet.walletId || index} className="p-4 bg-gray-50 rounded-lg">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-2xl">
                                                            {wallet.icon || getWalletIcon(wallet.walletType)}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-900">
                                                                {wallet.walletName || wallet.name || "Ví không tên"}
                                                            </div>
                                                            <div className="text-lg font-bold text-gray-900">
                                                                {formatCurrency(wallet.currentBalance || wallet.balance || 0)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">
                                                    Thay đổi
                                                </span>
                                                <span
                                                    className={`font-semibold ${
                                                        wallet.change >= 0
                                                            ? "text-[#10B981]"
                                                            : "text-[#EF4444]"
                                                    }`}
                                                >
                                                    {wallet.change >= 0 ? "+" : ""}
                                                    {formatCurrency(wallet.change)}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full ${
                                                        wallet.changePercent >= 0
                                                            ? "bg-[#10B981]"
                                                            : wallet.changePercent < -10
                                                            ? "bg-[#EF4444]"
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
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-gray-500">
                                                    Tỷ lệ thay đổi
                                                </span>
                                                <span
                                                    className={`font-semibold ${
                                                        wallet.changePercent >= 0
                                                            ? "text-[#10B981]"
                                                            : "text-[#EF4444]"
                                                    }`}
                                                >
                                                    {wallet.changePercent >= 0 ? "+" : ""}
                                                    {wallet.changePercent}%
                                                </span>
                                            </div>
                                            </div>
                                        </div>
                                    );
                                })
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Chart Section - Bottom */}
                    <div className="mb-6">
                        <Card className="shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
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
                        <Card className="shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Tình hình thu chi
                                </h3>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<ChevronLeft size={16} />}
                                        onClick={handlePreviousPeriod}
                                    />
                                    <span className="text-sm font-medium text-gray-700 min-w-[120px] text-center">
                                        {selectedPeriod.format("MM/YYYY")}
                                    </span>
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<ChevronRight size={16} />}
                                        onClick={handleNextPeriod}
                                        disabled={selectedPeriod.isSame(dayjs(), "month") || selectedPeriod.isAfter(dayjs(), "month")}
                                    />
                                </div>
                            </div>

                            {categoryExpenseLoading ? (
                                <div className="flex justify-center py-8">
                                    <Spin />
                                </div>
                            ) : (
                                <>
                                    {/* Summary Cards */}
                                    {(() => {
                                        const summary = getCategoryExpenseSummary();
                                        const pieData = getPieChartData();
                                        const totalIncome = overview.totalIncome || 0;
                                        
                                        return (
                                            <>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                                    <Card className="bg-gray-50">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <span className="text-sm text-gray-600">Chi tiêu</span>
                                                                <div className="text-2xl font-bold text-[#EF4444] mt-1">
                                                                    {formatCurrency(summary.totalExpense)}
                                                                </div>
                                                            </div>
                                                            <TrendingUp size={24} className="text-[#10B981]" />
                                                        </div>
                                                    </Card>
                                                    <Card className="bg-gray-50">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <span className="text-sm text-gray-600">Thu nhập</span>
                                                                <div className="text-2xl font-bold text-gray-600 mt-1">
                                                                    {formatCurrency(totalIncome)}
                                                                </div>
                                                            </div>
                                                            <TrendingDown size={24} className="text-gray-400" />
                                                        </div>
                                                    </Card>
                                                </div>

                                                {/* Comparison Text */}
                                                {summary.previousTotal > 0 && (
                                                    <div className="mb-6 p-3 bg-blue-50 rounded-lg">
                                                        <p className="text-sm text-gray-700">
                                                            {summary.difference >= 0 ? (
                                                                <span className="text-[#10B981] font-semibold">
                                                                    Tăng {formatCurrency(Math.abs(summary.difference))}
                                                                </span>
                                                            ) : (
                                                                <span className="text-[#EF4444] font-semibold">
                                                                    Giảm {formatCurrency(Math.abs(summary.difference))}
                                                                </span>
                                                            )}
                                                            {" "}so với cùng kỳ tháng trước ({summary.changePercent >= 0 ? "+" : ""}{summary.changePercent}%)
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Donut Chart - Biểu đồ quạt */}
                                                {pieData.length > 0 ? (
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
                                                        {/* Biểu đồ quạt bên trái */}
                                                        <div className="flex items-center justify-center">
                                                            <ResponsiveContainer width="100%" height={350}>
                                                                <PieChart>
                                                                    <Pie
                                                                        data={pieData}
                                                                        cx="50%"
                                                                        cy="50%"
                                                                        labelLine={false}
                                                                        label={false}
                                                                        outerRadius={120}
                                                                        innerRadius={70}
                                                                        fill="#8884d8"
                                                                        dataKey="value"
                                                                        paddingAngle={2}
                                                                    >
                                                                        {pieData.map((entry, index) => (
                                                                            <Cell 
                                                                                key={`cell-${index}`} 
                                                                                fill={entry.color}
                                                                                stroke="#fff"
                                                                                strokeWidth={2}
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
                                                                            border: "1px solid #E5E7EB", 
                                                                            borderRadius: "8px",
                                                                            padding: "12px"
                                                                        }}
                                                                    />
                                                                </PieChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                        
                                                        {/* Danh sách danh mục bên phải */}
                                                        <div className="space-y-4 flex flex-col justify-center">
                                                            {pieData.map((item, index) => (
                                                                <div 
                                                                    key={index} 
                                                                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                                                                >
                                                                    <div className="flex items-center gap-4 flex-1">
                                                                        {/* Màu sắc danh mục */}
                                                                        <div
                                                                            className="w-5 h-5 rounded-full flex-shrink-0"
                                                                            style={{ backgroundColor: item.color }}
                                                                        />
                                                                        {/* Tên danh mục và phần trăm */}
                                                                        <div className="flex-1">
                                                                            <div className="font-semibold text-gray-900 text-base">
                                                                                {item.percentage}% {item.name}
                                                                            </div>
                                                                            {item.previousAmount > 0 && (
                                                                                <div className="text-xs text-gray-500 mt-1">
                                                                                    Kỳ trước: {formatCurrency(item.previousAmount)}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    {/* Số tiền */}
                                                                    <div className="text-right ml-4">
                                                                        <div className="font-bold text-gray-900 text-lg">
                                                                            {formatCurrency(item.value)}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            
                                                            {/* Tổng số danh mục */}
                                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                                <div className="flex items-center justify-between text-sm text-gray-600">
                                                                    <span>Chi tiết từng danh mục ({pieData.length})</span>
                                                                    <ChevronDown size={16} />
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

                                                {/* Chi tiết từng danh mục */}
                                                {pieData.length > 0 && (
                                                    <div className="mt-6">
                                                        <Collapse
                                                            activeKey={expandedCategories}
                                                            onChange={setExpandedCategories}
                                                            items={[
                                                                {
                                                                    key: "categories",
                                                                    label: (
                                                                        <span className="font-semibold text-gray-900">
                                                                            Chi tiết từng danh mục ({pieData.length})
                                                                        </span>
                                                                    ),
                                                                    children: (
                                                                        <div className="space-y-3">
                                                                            {pieData.map((item, index) => (
                                                                                <div
                                                                                    key={index}
                                                                                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                                                                >
                                                                                    <div className="flex items-center gap-4">
                                                                                        <div
                                                                                            className="w-6 h-6 rounded"
                                                                                            style={{ backgroundColor: item.color }}
                                                                                        />
                                                                                        <div>
                                                                                            <div className="font-semibold text-gray-900">
                                                                                                {item.name}
                                                                                            </div>
                                                                                            <div className="text-sm text-gray-500">
                                                                                                {item.percentage}% tổng chi tiêu
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="text-right">
                                                                                        <div className="font-bold text-lg text-gray-900">
                                                                                            {formatCurrency(item.value)}
                                                                                        </div>
                                                                                        {item.previousAmount > 0 && (
                                                                                            <div className="text-sm text-gray-500">
                                                                                                Kỳ trước: {formatCurrency(item.previousAmount)}
                                                                                            </div>
                                                                                        )}
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
                                            </>
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

