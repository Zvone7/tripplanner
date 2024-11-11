'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { ScrollArea } from "../components/ui/scroll-area"
import { toast } from "../components/ui/use-toast"
import { Checkbox } from "../components/ui/checkbox"

interface Segment {
  id: number;
  tripId: number;
  startDateTimeUtc: string | null;
  endDateTimeUtc: string | null;
  name: string;
  cost: number;
}

interface Option {
  id: number;
  name: string;
}

interface SegmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (segment: Omit<Segment, 'id'>) => void;
  segment?: Segment | null;
  tripId: number;
}

export default function SegmentModal({ isOpen, onClose, onSave, segment, tripId }: SegmentModalProps) {
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [startDateTimeUtc, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endDateTimeUtc, setEndTime] = useState('')
  const [cost, setCost] = useState('')
  const [options, setOptions] = useState<Option[]>([])
  const [selectedOptions, setSelectedOptions] = useState<number[]>([])

  useEffect(() => {
    if (segment) {
      setName(segment.name)
      if (segment.startDateTimeUtc) {
        const start = new Date(segment.startDateTimeUtc)
        setStartDate(start.toISOString().split('T')[0])
        setStartTime(start.toTimeString().slice(0, 5))
      } else {
        setStartDate('')
        setStartTime('')
      }
      if (segment.endDateTimeUtc) {
        const end = new Date(segment.endDateTimeUtc)
        setEndDate(end.toISOString().split('T')[0])
        setEndTime(end.toTimeString().slice(0, 5))
      } else {
        setEndDate('')
        setEndTime('')
      }
      setCost(segment.cost.toString())
      fetchConnectedOptions(segment.id)
    } else {
      setName('')
      setStartDate('')
      setStartTime('')
      setEndDate('')
      setEndTime('')
      setCost('')
      setSelectedOptions([])
    }
    fetchOptions()
  }, [segment])

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const startDateTime = startDate && startDateTimeUtc
      ? new Date(`${startDate}T${startDateTimeUtc}`).toISOString()
      : null
    const endDateTime = endDate && endDateTimeUtc
      ? new Date(`${endDate}T${endDateTimeUtc}`).toISOString()
      : null
    onSave({
      tripId,
      name,
      startDateTimeUtc: startDateTime,
      endDateTimeUtc: endDateTime,
      cost: parseFloat(cost),
    })
  }

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
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nickname
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
              <Label htmlFor="startDate" className="text-right">
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDateTimeUtc" className="text-right">
                Start Time
              </Label>
              <Input
                id="startDateTimeUtc"
                type="time"
                value={startDateTimeUtc}
                onChange={(e) => setStartTime(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right">
                End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDateTimeUtc" className="text-right">
                End Time
              </Label>
              <Input
                id="endDateTimeUtc"
                type="time"
                value={endDateTimeUtc}
                onChange={(e) => setEndTime(e.target.value)}
                className="col-span-3"
              />
            </div>
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
          </div>
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