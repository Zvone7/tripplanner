"use client"

import { Fragment } from "react"
import { useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Skeleton } from "../components/ui/skeleton"
import { Button } from "../components/ui/button"
import { PlusIcon, TrashIcon, LayoutIcon, EditIcon } from "lucide-react"
import OptionModal from "./OptionModal"
import { formatDateStr } from "../utils/formatters"

interface Option {
  id: number
  name: string
  startDateTimeUtc: string | null
  endDateTimeUtc: string | null
  tripId: number
  totalCost: number
}

interface Segment {
  id: number
  tripId: number
  startDateTimeUtc: string | null
  endDateTimeUtc: string | null
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

interface ConnectedSegment extends Segment {
  segmentType: SegmentType
}

function SegmentDiagram({ segments }: { segments: ConnectedSegment[] }) {
  const sortedSegments = segments.sort((a, b) => {
    if (a.startDateTimeUtc && b.startDateTimeUtc) {
      return new Date(a.startDateTimeUtc).getTime() - new Date(b.startDateTimeUtc).getTime()
    }
    return 0
  })

  const segmentWidth = 100 / sortedSegments.length

  return (
    <div className="flex w-full space-x-1 overflow-x-auto py-2">
      {sortedSegments.map((segment) => (
        <div
          key={segment.id}
          className="flex-grow relative"
          style={{
            width: `${segmentWidth}%`,
            minWidth: "80px", // Ensure a minimum width for very small screens
          }}
        >
          <div
            className="h-12 flex items-center justify-center relative overflow-hidden"
            style={{
              backgroundColor: segment.segmentType.color,
              clipPath: "polygon(0 0, 90% 0, 100% 50%, 90% 100%, 0 100%, 10% 50%)",
            }}
            title={`${segment.segmentType.name} - ${segment.name}`}
          >
            {/* Icon in the Center */}
            <div className="relative z-10 flex items-center justify-center w-8 h-8">
              <div dangerouslySetInnerHTML={{ __html: segment.segmentType.iconSvg }} className="w-6 h-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Mobile Card Component
function OptionCard({
  option,
  connectedSegments,
  onEdit,
  onDelete,
}: {
  option: Option
  connectedSegments: ConnectedSegment[]
  onEdit: (option: Option) => void
  onDelete: (optionId: number) => void
}) {
  return (
    <Card className="mb-4 cursor-pointer hover:bg-muted/50" onClick={() => onEdit(option)}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg">{option.name}</CardTitle>
            <CardDescription className="mt-1">
              <div className="space-y-1">
                <div>
                  {option.startDateTimeUtc ? formatDateStr(option.startDateTimeUtc) : "N/A"}
                </div>
                <div>
                  {option.endDateTimeUtc ? formatDateStr(option.endDateTimeUtc) : "N/A"}
                </div>
                <div>
                  ${option.totalCost.toFixed(2)}
                </div>
              </div>
            </CardDescription>
          </div>
          <div className="flex space-x-2 ml-4">
            <Button variant="ghost" size="sm" onClick={() => onEdit(option)}>
              <EditIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(option.id)
              }}
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <SegmentDiagram segments={connectedSegments} />
      </CardContent>
    </Card>
  )
}

export default function OptionsPage() {
  const [options, setOptions] = useState<Option[]>([])
  const [segments, setSegments] = useState<Segment[]>([])
  const [segmentTypes, setSegmentTypes] = useState<SegmentType[]>([])
  const [connectedSegments, setConnectedSegments] = useState<{ [optionId: number]: ConnectedSegment[] }>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingOption, setEditingOption] = useState<Option | null>(null)
  const [tripName, setTripName] = useState<string>("") // Add state for trip name
  const searchParams = useSearchParams()
  const tripId = searchParams.get("tripId")
  const router = useRouter()

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

  const fetchOptions = useCallback(async () => {
    if (!tripId) return
    setIsLoading(true)
    try {
      const response = await fetch(`/api/Option/GetOptionsByTripId?tripId=${tripId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch options")
      }
      const data = await response.json()
      setOptions(data)
    } catch (err) {
      setError("An error occurred while fetching options")
      console.error("Error fetching options:", err)
    } finally {
      setIsLoading(false)
    }
  }, [tripId])

  const fetchSegments = useCallback(async () => {
    if (!tripId) return
    try {
      const response = await fetch(`/api/Segment/GetSegmentsByTripId?tripId=${tripId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch segments")
      }
      const data = await response.json()
      setSegments(data)
    } catch (err) {
      console.error("Error fetching segments:", err)
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
    }
  }, [])

  const getConnectedSegments = useCallback(
    async (optionId: number): Promise<ConnectedSegment[]> => {
      try {
        const response = await fetch(`/api/Option/GetConnectedSegments?tripId=${tripId}&optionId=${optionId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch connected segments")
        }
        const connectedSegments = await response.json()
        return connectedSegments.map((segment: Segment) => ({
          ...segment,
          segmentType: segmentTypes.find((st) => st.id === segment.segmentTypeId) || {
            id: 0,
            shortName: "Unknown",
            name: "Unknown",
            description: "Unknown segment type",
            color: "#CCCCCC",
            iconSvg: "<svg></svg>",
          },
        }))
      } catch (error) {
        console.error("Error fetching connected segments:", error)
        return []
      }
    },
    [segmentTypes, tripId],
  )

  useEffect(() => {
    fetchTripName()
    fetchOptions()
    fetchSegments()
    fetchSegmentTypes()
  }, [fetchTripName, fetchOptions, fetchSegments, fetchSegmentTypes])

  useEffect(() => {
    const fetchAllConnectedSegments = async () => {
      const connectedSegmentsMap: { [optionId: number]: ConnectedSegment[] } = {}
      for (const option of options) {
        connectedSegmentsMap[option.id] = await getConnectedSegments(option.id)
      }
      setConnectedSegments(connectedSegmentsMap)
    }

    if (options.length > 0 && segmentTypes.length > 0) {
      fetchAllConnectedSegments()
    }
  }, [options, segmentTypes, getConnectedSegments])

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

  const handleSaveOption = async (optionData: Omit<Option, "id">) => {
    try {
      let response

      if (editingOption) {
        // Update existing option
        response = await fetch(`/api/Option/UpdateOption?tripId=${tripId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...optionData, id: editingOption.id }),
        })
      } else {
        // Create new option
        response = await fetch(`/api/Option/CreateOption?tripId=${tripId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(optionData),
        })
      }

      if (!response.ok) {
        throw new Error("Failed to save option")
      }

      handleCloseModal()
      await fetchOptions()
    } catch (err) {
      console.error("Error saving option:", err)
      setError("An error occurred while saving the option")
    }
  }

  const handleDeleteOption = async (optionId: number) => {
    if (window.confirm("Are you sure you want to delete this option?")) {
      try {
        const response = await fetch(`/api/Option/DeleteOption?tripId=${tripId}&optionId=${optionId}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          throw new Error("Failed to delete option")
        }

        await fetchOptions()
      } catch (err) {
        console.error("Error deleting option:", err)
        setError("An error occurred while deleting the option")
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
          <CardTitle>Options</CardTitle>
          <CardDescription>{tripName ? tripName : `Trip ID: ${tripId}`}</CardDescription>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => router.push(`/segments?tripId=${tripId}`)}>
            <LayoutIcon className="mr-2 h-4 w-4" />
            View Segments
          </Button>
          <Button onClick={handleCreateOption}>
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
          <>
            {/* Desktop Table View - Hidden on mobile */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {options.map((option) => (
                    <Fragment key={option.id}>
                      <TableRow className="cursor-pointer hover:bg-muted" onClick={() => handleEditOption(option)}>
                        <TableCell className="font-medium">{option.name}</TableCell>
                        <TableCell>
                          {option.startDateTimeUtc ? formatDateStr(option.startDateTimeUtc) : "N/A"}
                        </TableCell>
                        <TableCell>{option.endDateTimeUtc ? formatDateStr(option.endDateTimeUtc) : "N/A"}</TableCell>
                        <TableCell>${option.totalCost.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteOption(option.id)
                              }}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={5}>
                          <SegmentDiagram segments={connectedSegments[option.id] || []} />
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View - Hidden on desktop */}
            <div className="md:hidden">
              {options.map((option) => (
                <OptionCard
                  key={option.id}
                  option={option}
                  connectedSegments={connectedSegments[option.id] || []}
                  onEdit={handleEditOption}
                  onDelete={handleDeleteOption}
                />
              ))}
            </div>
          </>
        )}
      </CardContent>
      <OptionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveOption}
        option={editingOption}
        tripId={Number(tripId)}
        refreshOptions={fetchOptions}
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
