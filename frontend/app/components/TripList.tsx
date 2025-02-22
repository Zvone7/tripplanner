'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Skeleton } from "./ui/skeleton"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { PencilIcon, PlusIcon, TrashIcon, LayoutIcon, ListIcon } from 'lucide-react'
import TripModal from './TripModal'

interface Trip {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
}

export default function TripList() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)
  const router = useRouter()

  const fetchTrips = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/trip/getalltrips')
      if (!response.ok) {
        console.log("response:", response);
        throw new Error('Failed to fetch trips')
      }
      const data = await response.json()
      setTrips(data)
    } catch (err) {
      setError('An error occurred while fetching trips')
      console.error('Error fetching trips:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTrips()
  }, [fetchTrips])

  const handleEditTrip = (e: React.MouseEvent, trip: Trip) => {
    e.stopPropagation()
    setEditingTrip(trip)
    setIsModalOpen(true)
  }

  const handleCreateTrip = () => {
    setEditingTrip(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingTrip(null)
  }

  const handleSaveTrip = async (tripData: Omit<Trip, 'id'>) => {
    try {
      let response;

      if (editingTrip) {
        // Update existing trip
        const updatedTripData = { ...tripData, id: editingTrip.id }
        response = await fetch(`/api/trip/updatetrip?tripId=${editingTrip.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedTripData),
        })
      } else {
        // Create new trip
        response = await fetch('/api/trip/createtrip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tripData),
        })
      }

      if (!response.ok) {
        throw new Error('Failed to save trip')
      }

      handleCloseModal()
      await fetchTrips()
    } catch (err) {
      console.error('Error saving trip:', err)
      setError('An error occurred while saving the trip')
    }
  }

  const handleDeleteTrip = async (e: React.MouseEvent, tripId: number) => {
    e.stopPropagation()
    if (window.confirm('Are you sure you want to delete this trip?')) {
      try {
        const response = await fetch(`/api/trip/deletetrip?tripId=${tripId}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error('Failed to delete trip')
        }

        await fetchTrips()
      } catch (err) {
        console.error('Error deleting trip:', err)
        setError('An error occurred while deleting the trip')
      }
    }
  }

  const handleViewOptions = (e: React.MouseEvent, tripId: number) => {
    e.stopPropagation()
    router.push(`/options?tripId=${tripId}`)
  }

  const handleViewSegments = (e: React.MouseEvent, tripId: number) => {
    e.stopPropagation()
    router.push(`/segments?tripId=${tripId}`)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>My Trips</CardTitle>
          <CardDescription>A list of all your trips</CardDescription>
        </div>
        <Button onClick={handleCreateTrip}>
          <PlusIcon className="mr-2 h-4 w-4" /> Add Trip
        </Button>
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
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.map((trip) => (
                <TableRow key={trip.id}>
                  <TableCell className="font-medium">{trip.name}</TableCell>
                  <TableCell>{trip.description}</TableCell>
                  <TableCell>
                    <StatusBadge isActive={trip.isActive} />
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={(e) => handleEditTrip(e, trip)}>
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={(e) => handleDeleteTrip(e, trip.id)}>
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={(e) => handleViewOptions(e, trip.id)}>
                        <ListIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={(e) => handleViewSegments(e, trip.id)}>
                        <LayoutIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <TripModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveTrip}
        trip={editingTrip}
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

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant={isActive ? "success" : "secondary"}>
      {isActive ? "Active" : "Inactive"}
    </Badge>
  )
}