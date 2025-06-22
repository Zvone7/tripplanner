"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Skeleton } from "../components/ui/skeleton"
import { Button } from "../components/ui/button"
import { PencilIcon, PlusIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon, EditIcon, EyeIcon } from "lucide-react"
import TripModal from "./TripModal"
import { formatDateStr } from "../utils/formatters"

interface Trip {
  id: number
  name: string
  description: string
  isActive: boolean
  startTime: string | null
  endTime: string | null
}

// Mobile Card Component
function TripCard({
  trip,
  onEdit,
  onDelete,
  onViewOptions,
  onViewSegments,
}: {
  trip: Trip
  onEdit: (trip: Trip) => void
  onDelete: (tripId: number) => void
  onViewOptions: (tripId: number) => void
  onViewSegments: (tripId: number) => void
}) {
  return (
    <Card className="mb-4 cursor-pointer hover:bg-muted/50" onClick={() => onViewOptions(trip.id)}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg">{trip.name}</CardTitle>
            <CardDescription className="mt-2">
              <div className="space-y-1">
                <div>{trip.description}</div>
                <div>
                  <span className="font-medium">Start:</span> {formatDateStr(trip.startTime)}
                </div>
                <div>
                  <span className="font-medium">End:</span> {formatDateStr(trip.endTime)}
                </div>
              </div>
            </CardDescription>
          </div>
          <div className="flex flex-col space-y-1 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(trip)
              }}
            >
              <EditIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onViewSegments(trip.id)
              }}
            >
              <EyeIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(trip.id)
              }}
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}

// Trip Section Component (for both current and past trips)
function TripSection({
  title,
  trips,
  isOpen,
  onToggle,
  onEdit,
  onDelete,
  onViewOptions,
  onViewSegments,
}: {
  title: string
  trips: Trip[]
  isOpen: boolean
  onToggle: () => void
  onEdit: (trip: Trip) => void
  onDelete: (tripId: number) => void
  onViewOptions: (tripId: number) => void
  onViewSegments: (tripId: number) => void
}) {
  return (
    <div className="mt-4">
      <div
        className="flex items-center justify-between cursor-pointer mb-2 p-2 border border-gray-300 hover:bg-gray-200 rounded-md transition-colors"
        onClick={onToggle}
      >
        <h3 className="text-lg font-medium">{title}</h3>
        <Button variant="ghost" size="sm">
          {isOpen ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
        </Button>
      </div>

      {isOpen && (
        <>
          {/* Desktop Table View - Hidden on mobile */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trips.map((trip) => (
                  <TableRow
                    key={trip.id}
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => onViewOptions(trip.id)}
                  >
                    <TableCell className="font-medium">{trip.name}</TableCell>
                    <TableCell>{trip.description}</TableCell>
                    <TableCell>{formatDateStr(trip.startTime)}</TableCell>
                    <TableCell>{formatDateStr(trip.endTime)}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col space-y-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onEdit(trip)
                          }}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onViewSegments(trip.id)
                          }}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDelete(trip.id)
                          }}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View - Hidden on desktop */}
          <div className="md:hidden">
            {trips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onEdit={onEdit}
                onDelete={onDelete}
                onViewOptions={onViewOptions}
                onViewSegments={onViewSegments}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function TripList() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [currentTrips, setCurrentTrips] = useState<Trip[]>([])
  const [oldTrips, setOldTrips] = useState<Trip[]>([])
  const [showOldTrips, setShowOldTrips] = useState(false)
  const [showCurrentTrips, setShowCurrentTrips] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)
  const router = useRouter()

  const fetchTrips = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/trip/getalltrips")
      if (!response.ok) {
        console.log("response:", response)
        throw new Error("Failed to fetch trips")
      }
      const data = await response.json()
      setTrips(data)
    } catch (err) {
      setError("An error occurred while fetching trips")
      console.error("Error fetching trips:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTrips()
  }, [fetchTrips])

  useEffect(() => {
    if (!trips.length) return

    const now = new Date()
    const current: Trip[] = []
    const old: Trip[] = []

    trips.forEach((trip: Trip) => {
      if (!trip.startTime || !trip.endTime) {
        current.push(trip)
        return
      }

      const endTime = new Date(trip.endTime)
      const startTime = new Date(trip.startTime)

      if (endTime < now && startTime < now) {
        old.push(trip)
      } else {
        current.push(trip)
      }
    })

    current.sort((a, b) => {
      if (!a.startTime) return 1
      if (!b.startTime) return -1
      return new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    })

    old.sort((a, b) => {
      if (!a.startTime) return 1
      if (!b.startTime) return -1
      return new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    })

    setCurrentTrips(current)
    setOldTrips(old)
  }, [trips])

  const handleEditTrip = (trip: Trip) => {
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

  const handleSaveTrip = async (tripData: Omit<Trip, "id">) => {
    try {
      let response

      if (editingTrip) {
        // Update existing trip
        const updatedTripData = { ...tripData, id: editingTrip.id }
        console.log("updatedTripData:", updatedTripData)
        response = await fetch(`/api/trip/updatetrip?tripId=${editingTrip.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedTripData),
        })
      } else {
        // Create new trip
        response = await fetch("/api/trip/createtrip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tripData),
        })
      }

      if (!response.ok) {
        throw new Error("Failed to save trip")
      }

      handleCloseModal()
      await fetchTrips()
    } catch (err) {
      console.error("Error saving trip:", err)
      setError("An error occurred while saving the trip")
    }
  }

  const handleDeleteTrip = async (tripId: number) => {
    if (window.confirm("Are you sure you want to delete this trip?")) {
      try {
        const response = await fetch(`/api/trip/deletetrip?tripId=${tripId}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          throw new Error("Failed to delete trip")
        }

        await fetchTrips()
      } catch (err) {
        console.error("Error deleting trip:", err)
        setError("An error occurred while deleting the trip")
      }
    }
  }

  const handleViewOptions = (tripId: number) => {
    router.push(`/options?tripId=${tripId}`)
  }

  const handleViewSegments = (tripId: number) => {
    router.push(`/segments?tripId=${tripId}`)
  }

  return (
    <div>
      <TripModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveTrip} trip={editingTrip} />
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Trips</CardTitle>
          </div>
          <Button onClick={handleCreateTrip}>
            <PlusIcon className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSkeleton />
          ) : error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : (
            <>
              <TripSection
                title="Current trips"
                trips={currentTrips}
                isOpen={showCurrentTrips}
                onToggle={() => setShowCurrentTrips(!showCurrentTrips)}
                onEdit={handleEditTrip}
                onDelete={handleDeleteTrip}
                onViewOptions={handleViewOptions}
                onViewSegments={handleViewSegments}
              />

              {oldTrips.length > 0 && (
                <TripSection
                  title="Past trips"
                  trips={oldTrips}
                  isOpen={showOldTrips}
                  onToggle={() => setShowOldTrips(!showOldTrips)}
                  onEdit={handleEditTrip}
                  onDelete={handleDeleteTrip}
                  onViewOptions={handleViewOptions}
                  onViewSegments={handleViewSegments}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
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