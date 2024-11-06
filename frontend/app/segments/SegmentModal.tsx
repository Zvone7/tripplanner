import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover"
import { CalendarIcon } from 'lucide-react'

interface Segment {
  id: number;
  tripId: number;
  startTime: string | null;
  endTime: string | null;
  nickname: string;
  cost: number;
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
    } else {
      setNickname('')
      setStartDate('')
      setStartTime('')
      setEndDate('')
      setEndTime('')
      setCost('')
    }
  }, [segment])

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
          </div>
          <DialogFooter>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}