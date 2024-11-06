'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Skeleton } from "../components/ui/skeleton"
import { Button } from "../components/ui/button"
import { PencilIcon, PlusIcon, TrashIcon, ListIcon, ArrowLeftIcon } from 'lucide-react'
import SegmentModal from '../segments/SegmentModal'

interface Segment {
  id: number;
  tripId: number;
  startTime: string | null;
  endTime: string | null;
  nickname: string;
  cost: number;
}

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null)
  const searchParams = useSearchParams()
  const tripId = searchParams.get('tripId')
  const router = useRouter()

  const fetchSegments = useCallback(async () => {
    if (!tripId) return
    setIsLoading(true)
    try {
      const response = await fetch(`/api/Segment/GetSegmentsByTripId?tripId=${tripId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch segments')
      }
      const data = await response.json()
      setSegments(data)
    } catch (err) {
      setError('An error occurred while fetching segments')
      console.error('Error fetching segments:', err)
    } finally {
      setIsLoading(false)
    }
  }, [tripId])

  useEffect(() => {
    fetchSegments()
  }, [fetchSegments])

  const handleEditSegment = (segment: Segment) => {
    setEditingSegment(segment)
    setIsModalOpen(true)
  }

  const handleCreateSegment = () => {
    setEditingSegment(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingSegment(null)
  }

  const handleSaveSegment = async (segmentData: Omit<Segment, 'id'>) => {
    try {
      let response;

      if (editingSegment) {
        // Update existing segment
        response = await fetch('/api/Segment/UpdateSegment', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...segmentData, id: editingSegment.id }),
        })
      } else {
        // Create new segment
        response = await fetch('/api/Segment/CreateSegment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(segmentData),
        })
      }

      if (!response.ok) {
        throw new Error('Failed to save segment')
      }

      handleCloseModal()
      await fetchSegments()
    } catch (err) {
      console.error('Error saving segment:', err)
      setError('An error occurred while saving the segment')
    }
  }

  const handleDeleteSegment = async (segmentId: number) => {
    if (window.confirm('Are you sure you want to delete this segment?')) {
      try {
        const response = await fetch(`/api/Segment/DeleteSegment?id=${segmentId}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error('Failed to delete segment')
        }

        await fetchSegments()
      } catch (err) {
        console.error('Error deleting segment:', err)
        setError('An error occurred while deleting the segment')
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
          <CardTitle>Trip Segments</CardTitle>
          <CardDescription>Segments for Trip ID: {tripId}</CardDescription>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => router.push('/trips')}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back to Trips
          </Button>
          <Button variant="outline" onClick={() => router.push(`/options?tripId=${tripId}`)}>
            <ListIcon className="mr-2 h-4 w-4" /> View Options
          </Button>
          <Button onClick={handleCreateSegment}>
            <PlusIcon className="mr-2 h-4 w-4" /> Add Segment
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
                <TableHead>Nickname</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {segments.map((segment) => (
                <TableRow key={segment.id}>
                  <TableCell className="font-medium">{segment.nickname}</TableCell>
                  <TableCell>{segment.startTime ? new Date(segment.startTime).toLocaleString() : 'N/A'}</TableCell>
                  <TableCell>{segment.endTime ? new Date(segment.endTime).toLocaleString() : 'N/A'}</TableCell>
                  <TableCell>${segment.cost.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditSegment(segment)}>
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteSegment(segment.id)}>
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
      <SegmentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveSegment}
        segment={editingSegment}
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