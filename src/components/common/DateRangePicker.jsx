import { DatePicker, Button } from "antd";
import dayjs from "dayjs";

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
    // Disable future dates
    const disabledDate = (current) => {
        return current && current > dayjs().endOf("day");
    };

    // Handle quick select
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

        if (onChange) {
            onChange([startDate, endDate]);
        }
        
        if (onPeriodChange) {
            onPeriodChange(selectedPeriod);
        }
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
                                      className={
                                          period === "week"
                                              ? "bg-[#10B981] border-[#10B981]"
                                              : ""
                                      }
                                  >
                                      Tuần này
                                  </Button>
                                  <Button
                                      size="small"
                                      type={period === "month" ? "primary" : "default"}
                                      onClick={() => handleQuickSelect("month")}
                                      className={
                                          period === "month"
                                              ? "bg-[#10B981] border-[#10B981]"
                                              : ""
                                      }
                                  >
                                      Tháng này
                                  </Button>
                                  <Button
                                      size="small"
                                      type={period === "year" ? "primary" : "default"}
                                      onClick={() => handleQuickSelect("year")}
                                      className={
                                          period === "year"
                                              ? "bg-[#10B981] border-[#10B981]"
                                              : ""
                                      }
                                  >
                                      Năm này
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

