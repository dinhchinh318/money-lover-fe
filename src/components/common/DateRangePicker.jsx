import { DatePicker, Button } from "antd";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

const { RangePicker } = DatePicker;

const DateRangePicker = ({
  value,
  onChange,
  format = "DD/MM/YYYY",
  className = "w-[280px]",
  showQuickSelect = true,
  period = null,
  onPeriodChange = null,
}) => {
  const { t } = useTranslation();

  // Disable future dates
  const disabledDate = (current) => {
    return current && current > dayjs().endOf("day");
  };

  const handleQuickSelect = (selectedPeriod) => {
    const today = dayjs();
    let startDate, endDate;

    switch (selectedPeriod) {
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

    // ✅ ưu tiên gọi onPeriodChange trước để FilterBar có thể sync state (tuỳ bạn)
    onPeriodChange?.(selectedPeriod);

    // ✅ set date range
    onChange?.([startDate, endDate]);
  };

  return (
    <RangePicker
      value={value}
      onChange={onChange}
      format={format}
      className={className}
      disabledDate={disabledDate}
      renderExtraFooter={
        showQuickSelect
          ? () => (
              <div className="p-2 border-t border-gray-200">
                <div className="flex gap-2 justify-center">
                  <Button
                    size="small"
                    type={period === "week" ? "primary" : "default"}
                    onClick={() => handleQuickSelect("week")}
                    className={period === "week" ? "bg-[#10B981] border-[#10B981]" : ""}
                  >
                    {t("dateRangePicker.quick.week")}
                  </Button>

                  <Button
                    size="small"
                    type={period === "month" ? "primary" : "default"}
                    onClick={() => handleQuickSelect("month")}
                    className={period === "month" ? "bg-[#10B981] border-[#10B981]" : ""}
                  >
                    {t("dateRangePicker.quick.month")}
                  </Button>

                  <Button
                    size="small"
                    type={period === "year" ? "primary" : "default"}
                    onClick={() => handleQuickSelect("year")}
                    className={period === "year" ? "bg-[#10B981] border-[#10B981]" : ""}
                  >
                    {t("dateRangePicker.quick.year")}
                  </Button>
                </div>
              </div>
            )
          : null
      }
    />
  );
};

export default DateRangePicker;
