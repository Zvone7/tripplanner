"use client"

import type React from "react"
import type { JSX } from "react" // Import JSX to fix the undeclared variable error

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { ScrollArea } from "../components/ui/scroll-area"
import { Textarea } from "../components/ui/textarea"
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
  comment: string
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

// Component to render text with clickable links (supports both plain URLs and Markdown-style links)
const CommentDisplay: React.FC<{ text: string }> = ({ text }) => {
  // Regex for Markdown-style links: [text](url)
  const markdownLinkRegex = /\[([^\]]+)\]\(([^\)]+)\)/g;
  // Regex for plain URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g

  let processedText = text
  const linkReplacements: { placeholder: string; element: JSX.Element }[] = []
  let replacementIndex = 0

  // First, process Markdown-style links
  processedText = processedText.replace(markdownLinkRegex, (match, linkText, url) => {
    const placeholder = `__LINK_${replacementIndex}__`
    linkReplacements.push({
      placeholder,
      element: (
        <a
          key={`md-${replacementIndex}`}
          href={url.trim()}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          {linkText}
        </a>
      ),
    })
    replacementIndex++
    return placeholder
  })

  // Then, process remaining plain URLs (that weren't part of Markdown links)
  processedText = processedText.replace(urlRegex, (match) => {
    // Check if this URL is already part of a placeholder (from Markdown processing)
    if (processedText.includes(`](${match})`)) {
      return match // Don't process URLs that are part of Markdown links
    }

    const placeholder = `__LINK_${replacementIndex}__`
    linkReplacements.push({
      placeholder,
      element: (
        <a
          key={`url-${replacementIndex}`}
          href={match}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          {match}
        </a>
      ),
    })
    replacementIndex++
    return placeholder
  })

  // Split the text by placeholders and reconstruct with React elements
  const parts = processedText.split(/(__LINK_\d+__)/g)

  return (
    <div className="whitespace-pre-wrap">
      {parts.map((part, index) => {
        const linkReplacement = linkReplacements.find((lr) => lr.placeholder === part)
        if (linkReplacement) {
          return linkReplacement.element
        }
        return <span key={index}>{part}</span>
      })}
    </div>
  )
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
  const [comment, setComment] = useState("")
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
      setComment(segment.comment || "")
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
      setComment("")
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
        comment,
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
      comment,
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
      <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isCreateMode ? "Create Segment" : "Edit Segment"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-4 items-center gap-3">
            <Label htmlFor="name" className="text-right text-sm">
              Name
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
          </div>

          <div className="grid grid-cols-4 items-center gap-3">
            <Label htmlFor="segmentType" className="text-right text-sm">
              Type
            </Label>
            <Select
              value={segmentTypeId?.toString() || ""}
              onValueChange={(value) => setSegmentTypeId(Number.parseInt(value))}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select type" />
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

          <div className="grid grid-cols-4 items-center gap-3">
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

          <div className="grid grid-cols-4 items-center gap-3">
            <Label htmlFor="cost" className="text-right text-sm">
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

          <div className="grid grid-cols-4 items-start gap-3">
            <Label htmlFor="comment" className="text-right text-sm pt-2">
              Comment
            </Label>
            <div className="col-span-3 space-y-2">
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add notes, links, or other details...
Use [Link Text](URL) for custom link text
Or paste URLs directly: https://example.com"
                className="min-h-[80px] text-sm"
              />
              {comment && (
                <div className="p-2 bg-muted rounded-md text-sm">
                  <div className="text-xs text-muted-foreground mb-1">Preview:</div>
                  <CommentDisplay text={comment} />
                </div>
              )}
            </div>
          </div>

          {/* Only show connected options if we're editing an existing segment (not creating or duplicating) */}
          {segment && !isDuplicateMode && (
            <div className="grid grid-cols-4 items-start gap-3">
              <Label className="text-right pt-2 text-sm">Options</Label>
              <ScrollArea className="h-[150px] col-span-3 border rounded-md p-3">
                {options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2 mb-2">
                    <Checkbox
                      id={`option-${option.id}`}
                      checked={selectedOptions.includes(option.id)}
                      onCheckedChange={() => handleOptionToggle(option.id)}
                    />
                    <Label htmlFor={`option-${option.id}`} className="text-sm">
                      {option.name}
                    </Label>
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}

          <DialogFooter className="pt-4">
            <div className="flex justify-between w-full">
              <div>
                {segment && !isDuplicateMode && (
                  <Button type="button" variant="outline" size="sm" onClick={handleDuplicateSegment}>
                    <CopyIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button type="submit" size="sm">
                {isCreateMode ? "Create" : "Save"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
