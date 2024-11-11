'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Skeleton } from "../components/ui/skeleton"
import { Button } from "../components/ui/button"
import { PencilIcon, PlusIcon, TrashIcon, LayoutIcon, ArrowLeftIcon } from 'lucide-react'
import OptionModal from './OptionModal'

interface Option {
  id: number;
  name: string;
  startDateTimeUtc: string | null;
  endDateTimeUtc: string | null;
  tripId: number;
  totalCost: number;
}

export default function OptionsPage() {
  const [options, setOptions] = useState<Option[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingOption, setEditingOption] = useState<Option | null>(null)
  const searchParams = useSearchParams()
  const tripId = searchParams.get('tripId')
  const router = useRouter()

  const fetchOptions = useCallback(async () => {
    if (!tripId) return
    setIsLoading(true)
    try {
      const response = await fetch(`/api/Option/GetOptionsByTripId?tripId=${tripId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch options')
      }
      const data = await response.json()
      setOptions(data)
    } catch (err) {
      setError('An error occurred while fetching options')
      console.error('Error fetching options:', err)
    } finally {
      setIsLoading(false)
    }
  }, [tripId])

  useEffect(() => {
    fetchOptions()
  }, [fetchOptions])

  const handleEditOption = (option: Option) => {
    setEditingOption(option)
    setIsModalOpen(true)
  }

  const handleCreateOption = () => {
    setEditingOption(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingOption(null)
  }

  const handleSaveOption = async (optionData: Omit<Option, 'id'>) => {
    try {
      let response;

      if (editingOption) {
        // Update existing option
        response = await fetch('/api/Option/UpdateOption', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...optionData, id: editingOption.id }),
        })
      } else {
        // Create new option
        response = await fetch('/api/Option/CreateOption', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(optionData),
        })
      }

      if (!response.ok) {
        throw new Error('Failed to save option')
      }

      handleCloseModal()
      await fetchOptions()
    } catch (err) {
      console.error('Error saving option:', err)
      setError('An error occurred while saving the option')
    }
  }

  const handleDeleteOption = async (optionId: number) => {
    if (window.confirm('Are you sure you want to delete this option?')) {
      try {
        const response = await fetch(`/api/Option/DeleteOption?id=${optionId}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error('Failed to delete option')
        }

        await fetchOptions()
      } catch (err) {
        console.error('Error deleting option:', err)
        setError('An error occurred while deleting the option')
      }
    }
  }

  if (!tripId) {
    return <div>No trip ID provided</div>
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Trip Options</CardTitle>
          <CardDescription>Options for Trip ID: {tripId}</CardDescription>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => router.push('/trips')}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back to Trips
          </Button>
          <Button variant="outline" onClick={() => router.push(`/segments?tripId=${tripId}`)}>
            <LayoutIcon className="mr-2 h-4 w-4" /> View Segments
          </Button>
          <Button onClick={handleCreateOption}>
            <PlusIcon className="mr-2 h-4 w-4" /> Add Option
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Total Cost</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {options.map((option) => (
                <TableRow key={option.id}>
                  <TableCell className="font-medium">{option.name}</TableCell>
                  <TableCell>{option.startDateTimeUtc ? new Date(option.startDateTimeUtc).toLocaleString() : 'N/A'}</TableCell>
                  <TableCell>{option.endDateTimeUtc ? new Date(option.endDateTimeUtc).toLocaleString() : 'N/A'}</TableCell>
                  <TableCell>${option.totalCost.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditOption(option)}>
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteOption(option.id)}>
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <OptionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveOption}
        option={editingOption}
        tripId={Number(tripId)}
      />
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="w-full h-12" />
      ))}
    </div>
  )
}