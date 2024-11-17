'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

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

const timezones = [
  {name: 'America/Los_Angeles', value: -8},
  {name: 'America/Denver', value: -7},
  {name: 'America/Chicago', value: -6},
  {name: 'America/New_York', value: -5},
  {name: 'Europe/London', value: 0},
  {name: 'Europe/Paris', value: 1},
  {name: 'Asia/Tokyo', value: 9},
  {name: 'Australia/Sydney', value: 11}
]

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
  const [selectedTimezone, setSelectedTimezone] = useState(() => 
    timezones.find(tz => tz.value === initialUtcOffset) || timezones[0]
  )

  const handleDateChange = useCallback((value: string) => {
    onDateChange(value)
  }, [onDateChange])

  const handleTimeChange = useCallback((value: string) => {
    onTimeChange(value)
  }, [onTimeChange])

  const handleTimezoneChange = useCallback((newTimezone: string) => {
    const timezone = timezones.find(tz => tz.name === newTimezone) || timezones[0]
    setSelectedTimezone(timezone)
    onUtcOffsetChange(timezone.value)
  }, [onUtcOffsetChange])

  const timezoneOptions = useMemo(() => 
    timezones.map((tz) => (
      <SelectItem key={tz.name} value={tz.name}>
        {tz.name} (UTC{tz.value >= 0 ? '+' : ''}{tz.value})
      </SelectItem>
    )),
    []
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
        <Select value={selectedTimezone.name} onValueChange={handleTimezoneChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            {timezoneOptions}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
})

DateTimePicker.displayName = 'DateTimePicker'