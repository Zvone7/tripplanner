import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Textarea } from "../components/ui/textarea"
import { Switch } from "../components/ui/switch"

interface Trip {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
}

interface TripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trip: Omit<Trip, 'id'>) => void;
  trip?: Trip | null;
}

export default function TripModal({ isOpen, onClose, onSave, trip }: TripModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (trip) {
      setName(trip.name)
      setDescription(trip.description)
      setIsActive(trip.isActive)
    } else {
      setName('')
      setDescription('')
      setIsActive(true)
    }
  }, [trip])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ name, description, isActive })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{trip ? 'Edit Trip' : 'Create Trip'}</DialogTitle>
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
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">
                Active
              </Label>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
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