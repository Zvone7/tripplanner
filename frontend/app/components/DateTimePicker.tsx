import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"

interface DateTimePickerProps {
  label: string;
  dateValue: string;
  timeValue: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  id: string;
}

export function DateTimePicker({
  label,
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  id
}: DateTimePickerProps) {
  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor={`${id}-date`} className="text-right">
        {label}
      </Label>
      <div className="col-span-3 flex gap-2">
        <Input
          id={`${id}-date`}
          type="date"
          value={dateValue}
          onChange={(e) => onDateChange(e.target.value)}
          className="flex-1"
        />
        <Input
          id={`${id}-time`}
          type="time"
          value={timeValue}
          onChange={(e) => onTimeChange(e.target.value)}
          className="flex-1"
        />
      </div>
    </div>
  )
}