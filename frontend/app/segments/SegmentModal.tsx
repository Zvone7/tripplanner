"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { ScrollArea } from "../components/ui/scroll-area"
import { toast } from "../components/ui/use-toast"
import { Checkbox } from "../components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { DateTimePicker } from "../components/DateTimePicker"
import { CopyIcon } from "lucide-react"

interface Segment {
  id: number
  tripId: number
  startDateTimeUtc: string
  startDateTimeUtcOffset: number
  endDateTimeUtc: string
  endDateTimeUtcOffset: number
  name: string
  cost: number
  segmentTypeId: number
}

interface Option {
  id: number
  name: string
}

interface SegmentType {
  id: number
  shortName: string
  name: string
  description: string
  color: string
  iconSvg: string
}

interface UserPreference {
  preferredUtcOffset: number
}

interface User {
  userPreference: UserPreference
}

interface SegmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (segment: Omit<Segment, "id">, isUpdate: boolean, originalSegmentId?: number) => void
  segment?: Segment | null
  tripId: number
  segmentTypes: SegmentType[]
}

export default function SegmentModal({ isOpen, onClose, onSave, segment, tripId, segmentTypes }: SegmentModalProps) {
  const [name, setName] = useState("")
  const [startDate, setStartDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endDate, setEndDate] = useState("")
  const [endTime, setEndTime] = useState("")
  const [startDateTimeUtcOffset, setStartDateTimeUtcOffset] = useState(0)
  const [endDateTimeUtcOffset, setEndDateTimeUtcOffset] = useState(0)
  const [cost, setCost] = useState("")
  const [segmentTypeId, setSegmentTypeId] = useState<number | null>(null)
  const [options, setOptions] = useState<Option[]>([])
  const [selectedOptions, setSelectedOptions] = useState<number[]>([])
  const [sameAsStartTime, setSameAsStartTime] = useState(false)
  const [isDuplicateMode, setIsDuplicateMode] = useState(false)
  const [userPreferredOffset, setUserPreferredOffset] = useState<number>(0)

  // Fetch user preferences
  const fetchUserPreferences = useCallback(async () => {
    try {
      const response = await fetch("/api/account/info")
      if (!response.ok) {
        throw new Error("Failed to fetch user preferences")
      }
      const userData: User = await response.json()
      setUserPreferredOffset(userData.userPreference?.preferredUtcOffset || 0)
    } catch (err) {
      console.error("Error fetching user preferences:", err)
      // Default to UTC if we can't fetch user preferences
      setUserPreferredOffset(0)
    }
  }, [])

  // extract dateValue from a date in format 2024-12-31
  const getDateValue = (date: Date, offset: number) => {
    var tempDate = new Date(date)
    if (offset !== 0) {
      tempDate.setHours(tempDate.getHours() + offset)
    }
    return (
      date.getFullYear() +
      "-" +
      (tempDate.getMonth() + 1).toString().padStart(2, "0") +
      "-" +
      tempDate.getDate().toString().padStart(2, "0")
    )
  }

  const getTimeValie = (date: Date, offset: number) => {
    var tempDate = new Date(date)
    if (offset !== 0) {
      tempDate.setHours(tempDate.getHours() + offset)
    }
    return String(tempDate.getHours()).padStart(2, "0") + ":" + String(tempDate.getMinutes()).padStart(2, "0")
  }

  useEffect(() => {
    fetchUserPreferences()
  }, [fetchUserPreferences])

  useEffect(() => {
    // Reset duplicate mode when modal opens/closes or segment changes
    setIsDuplicateMode(false)

    if (segment) {
      setName(segment.name)
      const startDateTime = new Date(segment.startDateTimeUtc)
      setStartDate(getDateValue(startDateTime, segment.startDateTimeUtcOffset))
      setStartTime(getTimeValie(startDateTime, segment.startDateTimeUtcOffset))
      setStartDateTimeUtcOffset(segment.startDateTimeUtcOffset)
      const endDateTime = new Date(segment.endDateTimeUtc)
      setEndDate(getDateValue(endDateTime, segment.endDateTimeUtcOffset))
      setEndTime(getTimeValie(endDateTime, segment.endDateTimeUtcOffset))
      setEndDateTimeUtcOffset(segment.endDateTimeUtcOffset)
      setCost(segment.cost.toString())
      setSegmentTypeId(segment.segmentTypeId)

      // Check if end time is same as start time
      const startDateTimeStr =
        getDateValue(startDateTime, segment.startDateTimeUtcOffset) +
        getTimeValie(startDateTime, segment.startDateTimeUtcOffset)
      const endDateTimeStr =
        getDateValue(endDateTime, segment.endDateTimeUtcOffset) +
        getTimeValie(endDateTime, segment.endDateTimeUtcOffset)
      setSameAsStartTime(
        startDateTimeStr === endDateTimeStr && segment.startDateTimeUtcOffset === segment.endDateTimeUtcOffset,
      )

      fetchConnectedOptions(segment.id)
    } else {
      // For new segments, use user's preferred offset as default
      setName("")
      setStartDate("")
      setStartTime("")
      setEndDate("")
      setEndTime("")
      setStartDateTimeUtcOffset(userPreferredOffset)
      setEndDateTimeUtcOffset(userPreferredOffset)
      setCost("")
      setSegmentTypeId(null)
      setSelectedOptions([])
      setSameAsStartTime(false)
    }
  }, [segment, userPreferredOffset])

  useEffect(() => {
    fetchOptions()
  }, [tripId])

  // Add this new effect to sync end date/time with start date/time
  useEffect(() => {
    // Only update end date/time if they are empty and start date/time has a value
    if (startDate && startTime && !endDate && !endTime) {
      setEndDate(startDate)
      setEndTime(startTime)
      setEndDateTimeUtcOffset(startDateTimeUtcOffset)
    }
  }, [startDate, startTime, startDateTimeUtcOffset])

  // Effect to handle "same as start time" checkbox
  useEffect(() => {
    if (sameAsStartTime) {
      setEndDate(startDate)
      setEndTime(startTime)
      setEndDateTimeUtcOffset(startDateTimeUtcOffset)
    }
  }, [sameAsStartTime, startDate, startTime, startDateTimeUtcOffset])

  // Custom handlers for start date/time changes
  const handleStartDateChange = (value: string) => {
    setStartDate(value)
    // If end date is empty, set it to match start date
    if (!endDate) {
      setEndDate(value)
    }
    // If "same as start time" is checked, sync end date
    if (sameAsStartTime) {
      setEndDate(value)
    }
  }

  const handleStartTimeChange = (value: string) => {
    setStartTime(value)
    // If end time is empty, set it to match start time
    if (!endTime) {
      setEndTime(value)
    }
    // If "same as start time" is checked, sync end time
    if (sameAsStartTime) {
      setEndTime(value)
    }
  }

  const handleStartUtcOffsetChange = (value: number) => {
    setStartDateTimeUtcOffset(value)
    // If end time is empty, set its offset to match start offset
    if (!endTime) {
      setEndDateTimeUtcOffset(value)
    }
    // If "same as start time" is checked, sync end offset
    if (sameAsStartTime) {
      setEndDateTimeUtcOffset(value)
    }
  }

  const handleDuplicateSegment = () => {
    setName(`DUPLICATE ${name}`)
    setIsDuplicateMode(true) // Switch to duplicate/create mode
    setSelectedOptions([]) // Clear selected options for new segment
  }

  const fetchOptions = async () => {
    try {
      const response = await fetch(`/api/Option/GetOptionsByTripId?tripId=${tripId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch options")
      }
      const data = await response.json()
      setOptions(data)
    } catch (error) {
      console.error("Error fetching options:", error)
      toast({
        title: "Error",
        description: "Failed to fetch options. Please try again.",
      })
    }
  }

  const fetchConnectedOptions = async (segmentId: number) => {
    try {
      const response = await fetch(`/api/Segment/GetConnectedOptions?tripId=${tripId}&segmentId=${segmentId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch connected options")
      }
      const data = await response.json()
      setSelectedOptions(data.map((option: Option) => option.id))
    } catch (error) {
      console.error("Error fetching connected options:", error)
      toast({
        title: "Error",
        description: "Failed to fetch connected options. Please try again.",
      })
    }
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (segmentTypeId === null) {
        toast({
          title: "Error",
          description: "Please select a segment type.",
        })
        return
      }

      const segmentData = {
        tripId,
        name,
        startDateTimeUtc: `${startDate}T${startTime}:00.000Z`,
        endDateTimeUtc: `${endDate}T${endTime}:00.000Z`,
        startDateTimeUtcOffset,
        endDateTimeUtcOffset,
        cost: Number.parseFloat(cost),
        segmentTypeId,
      }

      // Pass whether this is an update and the original segment ID
      const isUpdate = segment && !isDuplicateMode
      await onSave(segmentData, !!isUpdate, segment?.id)

      // Only update connected options if we're editing an existing segment (not duplicating)
      if (segment && !isDuplicateMode) {
        await handleUpdateConnectedOptions()
      }
    },
    [
      tripId,
      name,
      startDate,
      startTime,
      endDate,
      endTime,
      startDateTimeUtcOffset,
      endDateTimeUtcOffset,
      cost,
      segmentTypeId,
      onSave,
      segment,
      isDuplicateMode,
    ],
  )

  const handleUpdateConnectedOptions = async () => {
    if (!segment) return

    try {
      const response = await fetch(`/api/Segment/UpdateConnectedOptions?tripId=${tripId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          SegmentId: segment.id,
          OptionIds: selectedOptions,
          TripId: tripId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update connected options")
      }

      toast({
        title: "Success",
        description: "Connected options updated successfully",
      })
    } catch (error) {
      console.error("Error updating connected options:", error)
      toast({
        title: "Error",
        description: "Failed to update connected options. Please try again.",
      })
    }
  }

  const handleOptionToggle = (optionId: number) => {
    setSelectedOptions((prev) => (prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]))
  }

  // Determine if we're in create mode (no segment or duplicate mode)
  const isCreateMode = !segment || isDuplicateMode

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isCreateMode ? "Create Segment" : "Edit Segment"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="segmentType" className="text-right">
              Segment Type
            </Label>
            <Select
              value={segmentTypeId?.toString() || ""}
              onValueChange={(value) => setSegmentTypeId(Number.parseInt(value))}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a segment type" />
              </SelectTrigger>
              <SelectContent>
                {segmentTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    <div className="flex items-center">
                      <div dangerouslySetInnerHTML={{ __html: type.iconSvg }} className="w-4 h-4 mr-2" />
                      {type.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DateTimePicker
            label="Start"
            dateValue={startDate}
            timeValue={startTime}
            onDateChange={handleStartDateChange}
            onTimeChange={handleStartTimeChange}
            onUtcOffsetChange={handleStartUtcOffsetChange}
            id="start"
            initialUtcOffset={startDateTimeUtcOffset}
          />

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right"></Label>
            <div className="col-span-3 flex items-center space-x-2">
              <Checkbox
                id="sameAsStartTime"
                checked={sameAsStartTime}
                onCheckedChange={(checked) => setSameAsStartTime(checked as boolean)}
              />
              <Label htmlFor="sameAsStartTime" className="text-sm">
                Same as start time
              </Label>
            </div>
          </div>

          {/* Only show end time picker if "same as start time" is not checked */}
          {!sameAsStartTime && (
            <DateTimePicker
              label="End"
              dateValue={endDate}
              timeValue={endTime}
              onDateChange={setEndDate}
              onTimeChange={setEndTime}
              onUtcOffsetChange={setEndDateTimeUtcOffset}
              id="end"
              initialUtcOffset={endDateTimeUtcOffset}
            />
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cost" className="text-right">
              Cost
            </Label>
            <Input
              id="cost"
              type="number"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="col-span-3"
              required
              step="0.01"
            />
          </div>

          {/* Only show connected options if we're editing an existing segment (not creating or duplicating) */}
          {segment && !isDuplicateMode && (
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Connected Options</Label>
              <ScrollArea className="h-[200px] col-span-3 border rounded-md p-4">
                {options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2 mb-2">
                    <Checkbox
                      id={`option-${option.id}`}
                      checked={selectedOptions.includes(option.id)}
                      onCheckedChange={() => handleOptionToggle(option.id)}
                    />
                    <Label htmlFor={`option-${option.id}`}>{option.name}</Label>
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}

          <DialogFooter>
            <div className="flex justify-between w-full">
              <div>
                {segment && !isDuplicateMode && (
                  <Button type="button" variant="outline" size="sm" onClick={handleDuplicateSegment}>
                    <CopyIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button type="submit">{isCreateMode ? "Create segment" : "Save changes"}</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
