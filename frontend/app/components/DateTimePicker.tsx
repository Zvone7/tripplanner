"use client"

import React, { useCallback } from "react"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { TimezoneSelector } from "../components/TimeZoneSelector"

interface DateTimePickerProps {
  label: string;
  dateValue: string;
  timeValue: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  onUtcOffsetChange: (utcOffset: number) => void;
  id: string;
  initialUtcOffset: number;
}


export const DateTimePicker: React.FC<DateTimePickerProps> = React.memo(({
  label,
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  onUtcOffsetChange,
  id,
  initialUtcOffset
}) => {
    const handleDateChange = useCallback(
      (value: string) => {
        onDateChange(value)
      },
      [onDateChange],
    )

    const handleTimeChange = useCallback(
      (value: string) => {
        onTimeChange(value)
      },
      [onTimeChange],
    )

    return (
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor={`${id}-date`} className="text-right">
          {label}
        </Label>
        <div className="col-span-3 flex flex-col gap-2">
          <div className="flex gap-2">
            <Input
              id={`${id}-date`}
              type="date"
              value={dateValue}
              onChange={(e) => handleDateChange(e.target.value)}
              className="flex-1"
            />
            <Input
              id={`${id}-time`}
              type="time"
              value={timeValue}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="flex-1"
            />
          </div>
          <TimezoneSelector label="" value={initialUtcOffset} onChange={onUtcOffsetChange} id={`${id}-timezone`} />
        </div>
      </div>
    )
  },
)

DateTimePicker.displayName = "DateTimePicker"
