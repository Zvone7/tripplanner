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
  startTime: string | null;
  endTime: string | null;
  nickname: string;
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
  const [nickname, setNickname] = useState('')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [cost, setCost] = useState('')
  const [options, setOptions] = useState<Option[]>([])
  const [selectedOptions, setSelectedOptions] = useState<number[]>([])

  useEffect(() => {
    if (segment) {
      setNickname(segment.nickname)
      if (segment.startTime) {
        const start = new Date(segment.startTime)
        setStartDate(start.toISOString().split('T')[0])
        setStartTime(start.toTimeString().slice(0, 5))
      } else {
        setStartDate('')
        setStartTime('')
      }
      if (segment.endTime) {
        const end = new Date(segment.endTime)
        setEndDate(end.toISOString().split('T')[0])
        setEndTime(end.toTimeString().slice(0, 5))
      } else {
        setEndDate('')
        setEndTime('')
      }
      setCost(segment.cost.toString())
      fetchConnectedOptions(segment.id)
    } else {
      setNickname('')
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
    const startDateTime = startDate && startTime
      ? new Date(`${startDate}T${startTime}`).toISOString()
      : null
    const endDateTime = endDate && endTime
      ? new Date(`${endDate}T${endTime}`).toISOString()
      : null
    onSave({
      tripId,
      nickname,
      startTime: startDateTime,
      endTime: endDateTime,
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
              <Label htmlFor="nickname" className="text-right">
                Nickname
              </Label>
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
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
              <Label htmlFor="startTime" className="text-right">
                Start Time
              </Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
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
              <Label htmlFor="endTime" className="text-right">
                End Time
              </Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
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