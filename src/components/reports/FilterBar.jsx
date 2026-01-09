import { useState, useEffect } from "react";
import { Select, Button, Space } from "antd";
import { CalendarOutlined, FilterOutlined } from "@ant-design/icons";
import { Filter, X, Calendar } from "lucide-react";
import DateRangePicker from "../common/DateRangePicker";
import dayjs from "dayjs";

const { Option } = Select;

const FilterBar = ({
    onFilterChange,
    showPeriod = false,
    showType = false,
    showWallet = false,
    showCategory = false,
    showLimit = false,
    wallets = [],
    categories = [],
    defaultDateRange = null,
}) => {
    const [filters, setFilters] = useState({
        dateRange: defaultDateRange || [
            dayjs().startOf("week"),
            dayjs().endOf("week"),
        ],
        period: "week",
        type: "all",
        walletId: "all",
        categoryId: "all",
        limit: "all",
    });

    useEffect(() => {
        if (defaultDateRange) {
            setFilters((prev) => ({
                ...prev,
                dateRange: defaultDateRange,
            }));
        }
    }, [defaultDateRange]);

    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
    };

    const handleQuickSelect = (period, autoApply = false) => {
        const today = dayjs();
        let startDate, endDate;

        switch (period) {
            case "week":
                startDate = today.startOf("week");
                endDate = today.endOf("week");
                break;
            case "month":
                startDate = today.startOf("month");
                endDate = today.endOf("month");
                break;
            case "year":
                startDate = today.startOf("year");
                endDate = today.endOf("year");
                break;
            default:
                return;
        }

        const newFilters = {
            ...filters,
            dateRange: [startDate, endDate],
            period: period,
        };
        setFilters(newFilters);

        if (autoApply) {
            // Auto apply when selecting from dropdown or quick buttons
            const params = {
                startDate: startDate.format("YYYY-MM-DD"),
                endDate: endDate.format("YYYY-MM-DD"),
                period: period,
            };
            if (showType && newFilters.type !== "all") {
                params.type = newFilters.type;
            }
            if (showWallet && newFilters.walletId !== "all") {
                params.walletId = newFilters.walletId;
            }
            if (showCategory && newFilters.categoryId !== "all") {
                params.categoryId = newFilters.categoryId;
            }
            if (showLimit && newFilters.limit !== "all") {
                params.limit = parseInt(newFilters.limit);
            }
            onFilterChange(params);
        }
    };

    const handleApply = () => {
        const params = {
            startDate: filters.dateRange[0].format("YYYY-MM-DD"),
            endDate: filters.dateRange[1].format("YYYY-MM-DD"),
        };

        if (showPeriod && filters.period !== "all") {
            params.period = filters.period;
        }
        if (showType && filters.type !== "all") {
            params.type = filters.type;
        }
        if (showWallet && filters.walletId !== "all") {
            params.walletId = filters.walletId;
        }
        if (showCategory && filters.categoryId !== "all") {
            params.categoryId = filters.categoryId;
        }
        if (showLimit && filters.limit !== "all") {
            params.limit = parseInt(filters.limit);
        }

        onFilterChange(params);
    };

    const handleReset = () => {
        const resetFilters = {
            dateRange: [dayjs().startOf("week"), dayjs().endOf("week")],
            period: "week",
            type: "all",
            walletId: "all",
            categoryId: "all",
            limit: "all",
        };
        setFilters(resetFilters);
        handleFilterChange("dateRange", resetFilters.dateRange);
        handleApply();
    };

    return (
        <div className="bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 p-3 sm:p-5 rounded-xl shadow-sm">
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
                {/* Date Range Picker with Quick Select */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                        <Calendar className="text-blue-600" size={16} />
                    </div>
                    <DateRangePicker
                        value={filters.dateRange}
                        onChange={(dates) => {
                            handleFilterChange("dateRange", dates);
                            // Auto apply when date range changes
                            if (dates && dates[0] && dates[1]) {
                                const params = {
                                    startDate: dates[0].format("YYYY-MM-DD"),
                                    endDate: dates[1].format("YYYY-MM-DD"),
                                };
                                if (showPeriod && filters.period !== "all") {
                                    params.period = filters.period;
                                }
                                if (showType && filters.type !== "all") {
                                    params.type = filters.type;
                                }
                                if (showWallet && filters.walletId !== "all") {
                                    params.walletId = filters.walletId;
                                }
                                if (showCategory && filters.categoryId !== "all") {
                                    params.categoryId = filters.categoryId;
                                }
                                if (showLimit && filters.limit !== "all") {
                                    params.limit = parseInt(filters.limit);
                                }
                                onFilterChange(params);
                            }
                        }}
                        format="DD/MM/YYYY"
                        className="flex-1 sm:w-[280px]"
                        period={filters.period}
                        onPeriodChange={(period) => {
                            handleQuickSelect(period, true);
                        }}
                    />
                </div>

                {/* Period Selection */}
                {showPeriod && (
                    <Select
                        value={filters.period}
                        onChange={(value) => {
                            handleQuickSelect(value, true);
                        }}
                        className="w-full sm:w-[120px]"
                        placeholder="Chọn kỳ"
                    >
                        <Option value="week">Tuần</Option>
                        <Option value="month">Tháng</Option>
                        <Option value="year">Năm</Option>
                    </Select>
                )}

                {/* Type Filter */}
                {showType && (
                    <Select
                        value={filters.type}
                        onChange={(value) => handleFilterChange("type", value)}
                        className="w-full sm:w-[150px]"
                        placeholder="Loại"
                    >
                        <Option value="all">Tất cả</Option>
                        <Option value="income">Thu nhập</Option>
                        <Option value="expense">Chi tiêu</Option>
                    </Select>
                )}

                {/* Wallet Filter */}
                {showWallet && (
                    <Select
                        value={filters.walletId}
                        onChange={(value) =>
                            handleFilterChange("walletId", value)
                        }
                        className="w-full sm:w-[180px]"
                        placeholder="Chọn ví"
                        showSearch
                        allowClear
                        filterOption={(input, option) =>
                            (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        notFoundContent={wallets.length === 0 ? "Chưa có ví" : "Không tìm thấy"}
                    >
                        <Option value="all">Tất cả ví</Option>
                        {Array.isArray(wallets) && wallets.length > 0 && wallets.map((wallet) => (
                            <Option key={wallet._id || wallet.id} value={wallet._id || wallet.id}>
                                {wallet.name || wallet.walletName}
                            </Option>
                        ))}
                    </Select>
                )}

                {/* Category Filter */}
                {showCategory && (
                    <Select
                        value={filters.categoryId}
                        onChange={(value) =>
                            handleFilterChange("categoryId", value)
                        }
                        className="w-full sm:w-[180px]"
                        placeholder="Chọn danh mục"
                        showSearch
                        allowClear
                        filterOption={(input, option) =>
                            (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        notFoundContent={categories.length === 0 ? "Chưa có danh mục" : "Không tìm thấy"}
                    >
                        <Option value="all">Tất cả danh mục</Option>
                        {Array.isArray(categories) && categories.length > 0 && categories.map((category) => (
                            <Option key={category._id || category.id} value={category._id || category.id}>
                                {category.name || category.categoryName}
                            </Option>
                        ))}
                    </Select>
                )}

                {/* Limit Filter */}
                {showLimit && (
                    <Select
                        value={filters.limit}
                        onChange={(value) => handleFilterChange("limit", value)}
                        className="w-full sm:w-[120px]"
                        placeholder="Giới hạn"
                    >
                        <Option value="5">Top 5</Option>
                        <Option value="10">Top 10</Option>
                        <Option value="all">Tất cả</Option>
                    </Select>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto sm:ml-auto">
                    <Button
                        type="primary"
                        onClick={handleApply}
                        icon={<Filter size={16} />}
                        className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-0 shadow-md font-semibold"
                    >
                        Áp dụng
                    </Button>
                    <Button
                        onClick={handleReset}
                        icon={<X size={16} />}
                        className="w-full sm:w-auto border-gray-300 hover:border-gray-400"
                    >
                        Xóa bộ lọc
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default FilterBar;

