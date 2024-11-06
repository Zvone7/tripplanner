import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"

interface Option {
  id: number;
  name: string;
  startDate: string | null;
  endDate: string | null;
  tripId: number;
  totalCost: number;
}

interface OptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (option: Omit<Option, 'id'>) => void;
  option?: Option | null;
  tripId: number;
}

export default function OptionModal({ isOpen, onClose, onSave, option, tripId }: OptionModalProps) {
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState<string | null>('')
  const [endDate, setEndDate] = useState<string | null>('')
  const [totalCost, setTotalCost] = useState('')

  useEffect(() => {
    if (option) {
      setName(option.name)
      setStartDate(option.startDate ? option.startDate.split('T')[0] : null)
      setEndDate(option.endDate ? option.endDate.split('T')[0] : null)
      setTotalCost(option.totalCost.toString())
    } else {
      setName('')
      setStartDate(null)
      setEndDate(null)
      setTotalCost('')
    }
  }, [option])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name,
      startDate: option ? startDate : null,
      endDate: option ? endDate : null,
      tripId,
      totalCost: parseFloat(totalCost)
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
              />
            </div>
            {option && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="startDate" className="text-right">
                    Start Date
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate || ''}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="col-span-3"
                    placeholder="N/A"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="endDate" className="text-right">
                    End Date
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate || ''}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="col-span-3"
                    placeholder="N/A"
                  />
                </div>
              </>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="totalCost" className="text-right">
                Total Cost
              </Label>
              <Input
                id="totalCost"
                type="number"
                value={totalCost}
                onChange={(e) => setTotalCost(e.target.value)}
                className="col-span-3"
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