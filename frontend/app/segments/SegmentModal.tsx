'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { ScrollArea } from "../components/ui/scroll-area"
import { toast } from "../components/ui/use-toast"
import { Checkbox } from "../components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { DateTimePicker } from "../components/DateTimePicker"

interface Segment {
  id: number;
  tripId: number;
  startDateTimeUtc: string;
  startDateTimeUtcOffset: number;
  endDateTimeUtc: string;
  endDateTimeUtcOffset: number;
  name: string;
  cost: number;
  segmentTypeId: number;
}

interface Option {
  id: number;
  name: string;
}

interface SegmentType {
  id: number;
  shortName: string;
  name: string;
  description: string;
  color: string;
  iconSvg: string;
}

interface SegmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (segment: Omit<Segment, 'id'>) => void;
  segment?: Segment | null;
  tripId: number;
  segmentTypes: SegmentType[];
}

export default function SegmentModal({ isOpen, onClose, onSave, segment, tripId, segmentTypes }: SegmentModalProps) {
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [startDateTimeUtcOffset, setStartDateTimeUtcOffset] = useState(0)
  const [endDateTimeUtcOffset, setEndDateTimeUtcOffset] = useState(0)
  const [cost, setCost] = useState('')
  const [segmentTypeId, setSegmentTypeId] = useState<number | null>(null)
  const [options, setOptions] = useState<Option[]>([])
  const [selectedOptions, setSelectedOptions] = useState<number[]>([])

  // extract dateValue from a date in format 2024-12-31
  const getDateValue = (date: Date, offset: number) => {
    var tempDate = new Date(date);
    if(offset!==0){
      tempDate.setHours(tempDate.getHours() + offset)
    }
    return date.getFullYear() + '-' + (tempDate.getMonth() + 1).toString().padStart(2, '0') + '-' + tempDate.getDate().toString().padStart(2, '0')
  }
  const getTimeValie = (date: Date, offset: number) =>{ 
    var tempDate = new Date(date);
    if(offset!==0){
      tempDate.setHours(tempDate.getHours() + offset)
    }
    return String(tempDate.getHours()).padStart(2, '0') + ':' + String(tempDate.getMinutes()).padStart(2, '0')
  }

  useEffect(() => {
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
      fetchConnectedOptions(segment.id)
    } else {
      setName('')
      setStartDate('')
      setStartTime('')
      setEndDate('')
      setEndTime('')
      setStartDateTimeUtcOffset(0)
      setEndDateTimeUtcOffset(0)
      setCost('')
      setSegmentTypeId(null)
      setSelectedOptions([])
    }
  }, [segment])

  useEffect(() => {
    fetchOptions()
  }, [tripId])

  const fetchOptions = async () => {
    try {
      const response = await fetch(`/api/Option/GetOptionsByTripId?tripId=${tripId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch options')
      }
      const data = await response.json()
      setOptions(data)
    } catch (error) {
      console.error('Error fetching options:', error)
      toast({
        title: "Error",
        description: "Failed to fetch options. Please try again.",
      })
    }
  }

  const fetchConnectedOptions = async (segmentId: number) => {
    try {
      const response = await fetch(`/api/Segment/GetConnectedOptions?segmentId=${segmentId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch connected options')
      }
      const data = await response.json()
      setSelectedOptions(data.map((option: Option) => option.id))
    } catch (error) {
      console.error('Error fetching connected options:', error)
      toast({
        title: "Error",
        description: "Failed to fetch connected options. Please try again.",
      })
    }
  }

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (segmentTypeId === null) {
      toast({
        title: "Error",
        description: "Please select a segment type.",
      })
      return
    }
    onSave({
      tripId,
      name,
      startDateTimeUtc: `${startDate}T${startTime}:00.000Z`,
      endDateTimeUtc: `${endDate}T${endTime}:00.000Z`,
      startDateTimeUtcOffset,
      endDateTimeUtcOffset,
      cost: parseFloat(cost),
      segmentTypeId,
    })
  }, [tripId, name, startDate, startTime, endDate, endTime, startDateTimeUtcOffset, endDateTimeUtcOffset, cost, segmentTypeId, onSave])

  const handleUpdateConnectedOptions = async () => {
    if (!segment) return

    try {
      const response = await fetch('/api/Segment/UpdateConnectedOptions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          SegmentId: segment.id,
          OptionIds: selectedOptions,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update connected options')
      }

      toast({
        title: "Success",
        description: "Connected options updated successfully",
      })
    } catch (error) {
      console.error('Error updating connected options:', error)
      toast({
        title: "Error",
        description: "Failed to update connected options. Please try again.",
      })
    }
  }

  const handleOptionToggle = (optionId: number) => {
    setSelectedOptions(prev =>
      prev.includes(optionId)
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{segment ? 'Edit Segment' : 'Create Segment'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="segmentType" className="text-right">
              Segment Type
            </Label>
            <Select
              value={segmentTypeId?.toString() || ''}
              onValueChange={(value) => setSegmentTypeId(parseInt(value))}
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
            onDateChange={setStartDate}
            onTimeChange={setStartTime}
            onUtcOffsetChange={setStartDateTimeUtcOffset}
            id="start"
            initialUtcOffset={startDateTimeUtcOffset}
          />
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
          {segment && (
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">
                Connected Options
              </Label>
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
            <Button type="submit">Save changes</Button>
            {segment && (
              <Button type="button" onClick={handleUpdateConnectedOptions}>
                Update Connected Options
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}