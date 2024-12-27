'use client'

import React, { Fragment } from 'react'
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

interface Segment {
  id: number;
  tripId: number;
  startDateTimeUtc: string | null;
  endDateTimeUtc: string | null;
  name: string;
  cost: number;
  segmentTypeId: number;
}

interface SegmentType {
  id: number;
  shortName: string;
  name: string;
  description: string;
  color: string;
  iconSvg: string;
}

interface ConnectedSegment extends Segment {
  segmentType: SegmentType;
}

function SegmentDiagram({ segments }: { segments: ConnectedSegment[] }) {
  const sortedSegments = segments.sort((a, b) => {
    if (a.startDateTimeUtc && b.startDateTimeUtc) {
      return new Date(a.startDateTimeUtc).getTime() - new Date(b.startDateTimeUtc).getTime();
    }
    return 0;
  });

  const totalDuration = sortedSegments.reduce((total, segment) => {
    if (segment.startDateTimeUtc && segment.endDateTimeUtc) {
      const start = new Date(segment.startDateTimeUtc).getTime();
      const end = new Date(segment.endDateTimeUtc).getTime();
      return total + (end - start);
    }
    return total;
  }, 0);

  const minWidth = 100 / sortedSegments.length / 2;

  return (
    <div className="flex w-full space-x-1 overflow-x-auto py-2">
      {sortedSegments.map((segment, index) => {
        let width = minWidth;
        if (segment.startDateTimeUtc && segment.endDateTimeUtc) {
          const start = new Date(segment.startDateTimeUtc).getTime();
          const end = new Date(segment.endDateTimeUtc).getTime();
          const duration = end - start;
          const calculatedWidth = (duration / totalDuration) * 100;
          width = Math.max(calculatedWidth, minWidth);
        }

        return (
          <div
            key={segment.id}
            className="flex-grow relative"
            style={{
              width: `${width}%`,
              minWidth: `${minWidth}%`,
            }}
          >
            <div
              className="h-12 flex items-center justify-center relative overflow-hidden"
              style={{
                backgroundColor: segment.segmentType.color,
                clipPath: 'polygon(0 0, 90% 0, 100% 50%, 90% 100%, 0 100%, 10% 50%)',
              }}
              title={`${segment.segmentType.name} - ${segment.name}`}
            >
              {/* Icon in the Center */}
              <div className="relative z-10 flex items-center justify-center w-8 h-8">
                <div dangerouslySetInnerHTML={{ __html: segment.segmentType.iconSvg }} className="w-6 h-6" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
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

  const fetchSegments = useCallback(async () => {
    if (!tripId) return
    try {
      const response = await fetch(`/api/Segment/GetSegmentsByTripId?tripId=${tripId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch segments')
      }
      const data = await response.json()
      setSegments(data)
    } catch (err) {
      console.error('Error fetching segments:', err)
    }
  }, [tripId])

  const fetchSegmentTypes = useCallback(async () => {
    try {
      const response = await fetch('/api/Segment/GetSegmentTypes')
      if (!response.ok) {
        throw new Error('Failed to fetch segment types')
      }
      const data = await response.json()
      setSegmentTypes(data)
    } catch (err) {
      console.error('Error fetching segment types:', err)
    }
  }, [])

  const getConnectedSegments = useCallback(async (optionId: number): Promise<ConnectedSegment[]> => {
    try {
      const response = await fetch(`/api/Option/GetConnectedSegments?tripId=${tripId}&optionId=${optionId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch connected segments')
      }
      const connectedSegments = await response.json()
      return connectedSegments.map((segment: Segment) => ({
        ...segment,
        segmentType: segmentTypes.find(st => st.id === segment.segmentTypeId) || {
          id: 0,
          shortName: 'Unknown',
          name: 'Unknown',
          description: 'Unknown segment type',
          color: '#CCCCCC',
          iconSvg: '<svg></svg>'
        }
      }))
    } catch (error) {
      console.error('Error fetching connected segments:', error)
      return []
    }
  }, [segmentTypes])

  useEffect(() => {
    fetchOptions()
    fetchSegments()
    fetchSegmentTypes()
  }, [fetchOptions, fetchSegments, fetchSegmentTypes])

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

  const handleSaveOption = async (optionData: Omit<Option, 'id'>) => {
    try {
      let response;

      if (editingOption) {
        // Update existing option
        response = await fetch(`/api/Option/UpdateOption?tripId=${tripId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...optionData, id: editingOption.id }),
        })
      } else {
        // Create new option
        response = await fetch(`/api/Option/CreateOption?tripId=${tripId}`, {
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
        const response = await fetch(`/api/Option/DeleteOption?tripId=${tripId}&optionId=${optionId}`, {
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
                <Fragment key={option.id}>
                  <TableRow>
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
                  <TableRow>
                    <TableCell colSpan={5}>
                      <SegmentDiagram segments={connectedSegments[option.id] || []} />
                    </TableCell>
                  </TableRow>
                </Fragment>
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