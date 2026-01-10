import { useState, useEffect } from "react";
import { Select, Button } from "antd";
import { Filter, X, Calendar } from "lucide-react";
import DateRangePicker from "../common/DateRangePicker";
import dayjs from "dayjs";

// ✅ i18n
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  const [filters, setFilters] = useState({
    dateRange: defaultDateRange || [dayjs().startOf("week"), dayjs().endOf("week")],
    period: "week",
    type: "all",
    walletId: "all",
    categoryId: "all",
    limit: "all",
  });

  useEffect(() => {
    if (defaultDateRange) {
      setFilters((prev) => ({ ...prev, dateRange: defaultDateRange }));
    }
  }, [defaultDateRange]);

  const safeIncludes = (label, input) =>
    String(label ?? "")
      .toLowerCase()
      .includes(String(input ?? "").toLowerCase());

  // ✅ Apply theo object, tránh lệ thuộc state async
  const applyFilters = (nextFilters) => {
    const params = {
      startDate: nextFilters.dateRange?.[0]?.format("YYYY-MM-DD"),
      endDate: nextFilters.dateRange?.[1]?.format("YYYY-MM-DD"),
    };

    if (showPeriod && nextFilters.period !== "all") params.period = nextFilters.period;
    if (showType && nextFilters.type !== "all") params.type = nextFilters.type;
    if (showWallet && nextFilters.walletId !== "all") params.walletId = nextFilters.walletId;
    if (showCategory && nextFilters.categoryId !== "all") params.categoryId = nextFilters.categoryId;
    if (showLimit && nextFilters.limit !== "all") params.limit = parseInt(nextFilters.limit, 10);

    onFilterChange?.(params);
  };

  const handleFilterChange = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
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

    const next = { ...filters, dateRange: [startDate, endDate], period };
    setFilters(next);

    if (autoApply) applyFilters(next);
  };

  const handleApply = () => applyFilters(filters);

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
    applyFilters(resetFilters);
  };

  return (
    <div className="bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 p-3 sm:p-5 rounded-xl shadow-sm">
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
        {/* Date Range */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
            <Calendar className="text-blue-600" size={16} />
          </div>

          <DateRangePicker
            value={filters.dateRange}
            onChange={(dates) => {
              const next = { ...filters, dateRange: dates };
              setFilters(next);

              // Auto apply when date range changes
              if (dates?.[0] && dates?.[1]) applyFilters(next);
            }}
            format="DD/MM/YYYY"
            className="flex-1 sm:w-[280px]"
            period={filters.period}
            onPeriodChange={(period) => handleQuickSelect(period, true)}
          />
        </div>

        {/* Period */}
        {showPeriod && (
          <Select
            value={filters.period}
            onChange={(value) => handleQuickSelect(value, true)}
            className="w-full sm:w-[120px]"
            placeholder={t("filterBar.period.placeholder")}
          >
            <Option value="week">{t("filterBar.period.week")}</Option>
            <Option value="month">{t("filterBar.period.month")}</Option>
            <Option value="year">{t("filterBar.period.year")}</Option>
          </Select>
        )}

        {/* Type */}
        {showType && (
          <Select
            value={filters.type}
            onChange={(value) => handleFilterChange("type", value)}
            className="w-full sm:w-[150px]"
            placeholder={t("filterBar.type.placeholder")}
          >
            <Option value="all">{t("filterBar.type.all")}</Option>
            <Option value="income">{t("filterBar.type.income")}</Option>
            <Option value="expense">{t("filterBar.type.expense")}</Option>
          </Select>
        )}

        {/* Wallet */}
        {showWallet && (
          <Select
            value={filters.walletId}
            onChange={(value) => handleFilterChange("walletId", value)}
            className="w-full sm:w-[180px]"
            placeholder={t("filterBar.wallet.placeholder")}
            showSearch
            allowClear
            optionFilterProp="label"
            filterOption={(input, option) => safeIncludes(option?.label, input)}
            notFoundContent={
              wallets.length === 0 ? t("filterBar.wallet.empty") : t("filterBar.common.notFound")
            }
          >
            <Option value="all" label={t("filterBar.wallet.all")}>
              {t("filterBar.wallet.all")}
            </Option>

            {Array.isArray(wallets) &&
              wallets.map((wallet) => {
                const value = wallet._id || wallet.id;
                const label = wallet.name || wallet.walletName || "";
                return (
                  <Option key={value} value={value} label={label}>
                    {label}
                  </Option>
                );
              })}
          </Select>
        )}

        {/* Category */}
        {showCategory && (
          <Select
            value={filters.categoryId}
            onChange={(value) => handleFilterChange("categoryId", value)}
            className="w-full sm:w-[180px]"
            placeholder={t("filterBar.category.placeholder")}
            showSearch
            allowClear
            optionFilterProp="label"
            filterOption={(input, option) => safeIncludes(option?.label, input)}
            notFoundContent={
              categories.length === 0 ? t("filterBar.category.empty") : t("filterBar.common.notFound")
            }
          >
            <Option value="all" label={t("filterBar.category.all")}>
              {t("filterBar.category.all")}
            </Option>

            {Array.isArray(categories) &&
              categories.map((category) => {
                const value = category._id || category.id;
                const label = category.name || category.categoryName || "";
                return (
                  <Option key={value} value={value} label={label}>
                    {label}
                  </Option>
                );
              })}
          </Select>
        )}

        {/* Limit */}
        {showLimit && (
          <Select
            value={filters.limit}
            onChange={(value) => handleFilterChange("limit", value)}
            className="w-full sm:w-[120px]"
            placeholder={t("filterBar.limit.placeholder")}
          >
            <Option value="5">{t("filterBar.limit.top", { n: 5 })}</Option>
            <Option value="10">{t("filterBar.limit.top", { n: 10 })}</Option>
            <Option value="all">{t("filterBar.limit.all")}</Option>
          </Select>
        )}

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto sm:ml-auto">
          <Button
            type="primary"
            onClick={handleApply}
            icon={<Filter size={16} />}
            className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-0 shadow-md font-semibold"
          >
            {t("filterBar.actions.apply")}
          </Button>

          <Button
            onClick={handleReset}
            icon={<X size={16} />}
            className="w-full sm:w-auto border-gray-300 hover:border-gray-400"
          >
            {t("filterBar.actions.reset")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
