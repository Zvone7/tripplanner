"use client"

import React, { useState, useCallback, useMemo } from "react"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

interface TimezoneSelectorProps {
  label: string;
  value: number;
  onChange: (utcOffset: number) => void;
  id: string;
}

const timezones = [
  {name: "America/Los_Angeles", value: -8},
  {name: "America/Denver", value: -7},
  {name: "America/Chicago", value: -6},
  {name: "America/New_York", value: -5},
  {name: "Europe/London", value: 0},
  {name: "Europe/Paris/Berlin", value: 1},
  {name: "Europe/Moscow", value: 3},
  {name: "Asia/Dubai", value: 4},
  {name: "Asia/Kolkata", value: 5},
  {name: "Asia/Shanghai", value: 8},
  {name: "Asia/Tokyo", value: 9},
  {name: "Australia/Sydney", value: 11}
]

export const TimezoneSelector: React.FC<TimezoneSelectorProps> = React.memo(({
  label,
  value,
  onChange,
  id
}) => {
  const [selectedTimezone, setSelectedTimezone] = useState(() => 
    timezones.find(tz => tz.value === value) || timezones[0]
  )

  const handleTimezoneChange = useCallback((newTimezone: string) => {
    const timezone = timezones.find(tz => tz.name === newTimezone) || timezones[0]
    setSelectedTimezone(timezone)
    onChange(timezone.value)
  }, [onChange])

  const timezoneOptions = useMemo(() => 
    timezones.map((tz) => (
      <SelectItem key={tz.name} value={tz.name}>
        {tz.name} (UTC{tz.value >= 0 ? "+" : ""}{tz.value})
      </SelectItem>
    )),
    []
  )

  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor={id} className="text-right">
        {label}
      </Label>
      <div className="col-span-3">
        <Select value={selectedTimezone.name} onValueChange={handleTimezoneChange}>
          <SelectTrigger id={id}>
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

TimezoneSelector.displayName = "TimezoneSelector"
