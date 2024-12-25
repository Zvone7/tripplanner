'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { ScrollArea } from "../components/ui/scroll-area"
import { toast } from "../components/ui/use-toast"
import { Checkbox } from "../components/ui/checkbox"

interface SegmentType {
  id: number;
  name: string;
  iconSvg: string;
}

interface Segment {
  id: number;
  name: string;
  segmentTypeId: number;
}

interface Option {
  id: number;
  name: string;
  startDateTimeUtc: string | null;
  endDateTimeUtc: string | null;
  tripId: number;
  totalCost: number;
}

interface OptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (option: Omit<Option, 'id'>) => void;
  option?: Option | null;
  tripId: number;
  refreshOptions: () => void;
}

export default function OptionModal({ isOpen, onClose, onSave, option, tripId, refreshOptions }: OptionModalProps) {
  const [name, setName] = useState('')
  const [segments, setSegments] = useState<Segment[]>([])
  const [segmentTypes, setSegmentTypes] = useState<SegmentType[]>([])
  const [selectedSegments, setSelectedSegments] = useState<number[]>([])

  useEffect(() => {
    if (option) {
      setName(option.name)
      fetchConnectedSegments(option.id)
    } else {
      setName('')
      setSelectedSegments([])
    }
    fetchSegments()
    fetchSegmentTypes()
  }, [option])

  const fetchSegments = async () => {
    try {
      const response = await fetch(`/api/Segment/GetSegmentsByTripId?tripId=${tripId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch segments')
      }
      const data = await response.json()
      setSegments(data)
    } catch (error) {
      console.error('Error fetching segments:', error)
      toast({
        title: "Error",
        description: "Failed to fetch segments. Please try again.",
      })
    }
  }

  const fetchSegmentTypes = async () => {
    try {
      const response = await fetch('/api/Segment/GetSegmentTypes')
      if (!response.ok) {
        throw new Error('Failed to fetch segment types')
      }
      const data = await response.json()
      setSegmentTypes(data)
    } catch (error) {
      console.error('Error fetching segment types:', error)
      toast({
        title: "Error",
        description: "Failed to fetch segment types. Please try again.",
      })
    }
  }

  const fetchConnectedSegments = async (optionId: number) => {
    try {
      const response = await fetch(`/api/Option/GetConnectedSegments?tripId=${tripId}&optionId=${optionId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch connected segments')
      }
      const data = await response.json()
      setSelectedSegments(data.map((segment: Segment) => segment.id))
    } catch (error) {
      console.error('Error fetching connected segments:', error)
      toast({
        title: "Error",
        description: "Failed to fetch connected segments. Please try again.",
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name,
      startDateTimeUtc: null,
      endDateTimeUtc: null,
      tripId,
      totalCost: 0
    })
    handleClose()
  }

  const handleUpdateConnectedSegments = async () => {
    if (!option) return

    try {
      const response = await fetch(`/api/Option/UpdateConnectedSegments?tripId=${tripId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          OptionId: option.id,
          SegmentIds: selectedSegments,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update connected segments')
      }

      toast({
        title: "Success",
        description: "Connected segments updated successfully",
      })
      handleClose()
    } catch (error) {
      console.error('Error updating connected segments:', error)
      toast({
        title: "Error",
        description: "Failed to update connected segments. Please try again.",
      })
    }
  }

  const handleSegmentToggle = (segmentId: number) => {
    setSelectedSegments(prev =>
      prev.includes(segmentId)
        ? prev.filter(id => id !== segmentId)
        : [...prev, segmentId]
    )
  }

  const handleClose = () => {
    onClose()
    refreshOptions()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{option ? 'Edit Option' : 'Create Option'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
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
            {option && (
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">
                  Connected Segments
                </Label>
                <ScrollArea className="h-[200px] col-span-3 border rounded-md p-4">
                  {segments.map((segment) => {
                    const segmentType = segmentTypes.find(st => st.id === segment.segmentTypeId)
                    return (
                      <div key={segment.id} className="flex items-center space-x-2 mb-2">
                        <Checkbox
                          id={`option-${segment.id}`}
                          checked={selectedSegments.includes(segment.id)}
                          onCheckedChange={() => handleSegmentToggle(segment.id)}
                        />
                        <div className="flex items-center space-x-2">
                          {segmentType && (
                            <>
                              <div dangerouslySetInnerHTML={{ __html: segmentType.iconSvg }} className="w-4 h-4" />
                              <span className="text-sm font-medium">{segmentType.name}</span>
                            </>
                          )}
                          <span className="text-sm text-muted-foreground">-</span>
                          <span className="text-sm">{segment.name}</span>
                        </div>
                      </div>
                    )
                  })}
                </ScrollArea>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit">Save changes</Button>
            {option && (
              <Button type="button" onClick={handleUpdateConnectedSegments}>
                Update Connected Segments
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}