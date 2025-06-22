"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Skeleton } from "../components/ui/skeleton"
import { Button } from "../components/ui/button"
import { PlusIcon, TrashIcon, ListIcon } from "lucide-react"
import SegmentModal from "../segments/SegmentModal"
import { formatDateWithUserOffset } from "../utils/formatters"

interface Segment {
  id: number
  tripId: number
  startDateTimeUtc: string
  startDateTimeUtcOffset: number
  endDateTimeUtc: string
  endDateTimeUtcOffset: number
  name: string
  cost: number
  segmentTypeId: number
}

interface SegmentType {
  id: number
  shortName: string
  name: string
  description: string
  color: string
  iconSvg: string
}

interface UserPreference {
  preferredUtcOffset: number
}

interface User {
  userPreference: UserPreference
}

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([])
  const [segmentTypes, setSegmentTypes] = useState<SegmentType[]>([])
  const [userPreferredOffset, setUserPreferredOffset] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSegment, setEditingSegment] = useState<Segment | null | undefined>(null)
  const [tripName, setTripName] = useState<string>("")
  const searchParams = useSearchParams()
  const tripId = searchParams.get("tripId")
  const router = useRouter()

  const fetchUserPreferences = useCallback(async () => {
    try {
      const response = await fetch("/api/account/info")
      if (!response.ok) {
        throw new Error("Failed to fetch user preferences")
      }
      const userData: User = await response.json()
      setUserPreferredOffset(userData.userPreference?.preferredUtcOffset || 0)
    } catch (err) {
      console.error("Error fetching user preferences:", err)
      // Default to UTC if we can't fetch user preferences
      setUserPreferredOffset(0)
    }
  }, [])

  const fetchTripName = useCallback(async () => {
    if (!tripId) return
    try {
      const response = await fetch(`/api/trip/gettripbyid?tripId=${tripId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch trip details")
      }
      const data = await response.json()
      setTripName(data.name)
    } catch (err) {
      console.error("Error fetching trip details:", err)
      setTripName("Unknown Trip")
    }
  }, [tripId])

  const fetchSegmentTypes = useCallback(async () => {
    try {
      const response = await fetch("/api/Segment/GetSegmentTypes")
      if (!response.ok) {
        throw new Error("Failed to fetch segment types")
      }
      const data = await response.json()
      setSegmentTypes(data)
    } catch (err) {
      console.error("Error fetching segment types:", err)
      setError("An error occurred while fetching segment types")
    }
  }, [])

  const fetchSegments = useCallback(async () => {
    if (!tripId) return
    setIsLoading(true)
    try {
      const response = await fetch(`/api/Segment/GetSegmentsByTripId?tripId=${tripId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch segments")
      }
      const data = await response.json()
      setSegments(data)
    } catch (err) {
      setError("An error occurred while fetching segments")
      console.error("Error fetching segments:", err)
    } finally {
      setIsLoading(false)
    }
  }, [tripId])

  useEffect(() => {
    fetchUserPreferences()
    fetchTripName()
    fetchSegmentTypes()
    fetchSegments()
  }, [fetchUserPreferences, fetchTripName, fetchSegmentTypes, fetchSegments])

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

  const handleSaveSegment = async (segmentData: Omit<Segment, "id">) => {
    try {
      let response

      if (editingSegment) {
        // Update existing segment
        response = await fetch(`/api/Segment/UpdateSegment?tripId=${tripId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...segmentData, id: editingSegment.id }),
        })
      } else {
        // Create new segment
        response = await fetch(`/api/Segment/CreateSegment?tripId=${tripId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(segmentData),
        })
      }

      if (!response.ok) {
        throw new Error("Failed to save segment")
      }

      handleCloseModal()
      await fetchSegments()
    } catch (err) {
      console.error("Error saving segment:", err)
      setError("An error occurred while saving the segment")
    }
  }

  const handleDeleteSegment = async (segmentId: number) => {
    if (window.confirm("Are you sure you want to delete this segment?")) {
      try {
        const response = await fetch(`/api/Segment/DeleteSegment?tripId=${tripId}&segmentId=${segmentId}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          throw new Error("Failed to delete segment")
        }

        await fetchSegments()
      } catch (err) {
        console.error("Error deleting segment:", err)
        setError("An error occurred while deleting the segment")
      }
    }
  }

  if (!tripId) {
    return <div>No trip ID provided</div>
  }

  const getTimezoneDisplayText = () => {
    if (userPreferredOffset === 0) return "utc"
    return `utc${userPreferredOffset >= 0 ? "+" : ""}${userPreferredOffset}`
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Segments</CardTitle>
          <CardDescription>{tripName ? tripName : `Trip ID: ${tripId}`}</CardDescription>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => router.push(`/options?tripId=${tripId}`)}>
            <ListIcon className="mr-2 h-4 w-4" />
            View Options
          </Button>
          <Button onClick={handleCreateSegment}>
            <PlusIcon className="h-4 w-4" />
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
                <TableHead>Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Start Time ({getTimezoneDisplayText()})</TableHead>
                <TableHead>End Time ({getTimezoneDisplayText()})</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {segments.map((segment) => {
                const segmentType = segmentTypes.find((st) => st.id === segment.segmentTypeId)
                return (
                  <TableRow
                    key={segment.id}
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleEditSegment(segment)}
                  >
                    <TableCell>
                      {segmentType && (
                        <div className="flex items-center space-x-2">
                          <div dangerouslySetInnerHTML={{ __html: segmentType.iconSvg }} className="w-6 h-6" />
                          <span>{segmentType.name}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{segment.name}</TableCell>
                    <TableCell>{formatDateWithUserOffset(segment.startDateTimeUtc, userPreferredOffset)}</TableCell>
                    <TableCell>{formatDateWithUserOffset(segment.endDateTimeUtc, userPreferredOffset)}</TableCell>
                    <TableCell>${segment.cost.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteSegment(segment.id)
                          }}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
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
        segmentTypes={segmentTypes}
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
