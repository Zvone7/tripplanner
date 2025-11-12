"use client"

import type React from "react"
import type { JSX } from "react"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Dialog, DialogClose, DialogContent, DialogTitle } from "../components/ui/dialog"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { ScrollArea } from "../components/ui/scroll-area"
import { Textarea } from "../components/ui/textarea"
import { toast } from "../components/ui/use-toast"
import { Checkbox } from "../components/ui/checkbox"
import { Switch } from "../components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "../components/ui/alert-dialog"
import { CopyIcon, SaveIcon, Trash2Icon, EyeOffIcon, SlidersHorizontal, XIcon } from "lucide-react"
import { toLocationDto, normalizeLocation } from "../lib/mapping"
import { Collapsible } from "../components/Collapsible"
import { cn } from "../lib/utils"

// types
import type {
  SegmentModalProps,
  OptionRef as Option,
  User,
  SegmentSave,
  LocationOption,
  SegmentType,
} from "../types/models"

import { RangeDateTimePicker, type RangeDateTimePickerValue } from "../components/RangeDateTimePicker"

import { RangeLocationPicker, type RangeLocationPickerValue } from "../components/RangeLocationPicker"

import { localToUtcMs, utcMsToIso, utcIsoToLocalInput } from "../lib/utils"

/* ------------------------- comment preview helper ------------------------- */

const CommentDisplay: React.FC<{ text: string }> = ({ text }) => {
  const markdownLinkRegex = /\[([^\]]+)\]$$([^$$]+)\)/g
  const urlRegex = /(https?:\/\/[^\s]+)/g

  let processedText = text
  const linkReplacements: { placeholder: string; element: JSX.Element }[] = []
  let replacementIndex = 0

  processedText = processedText.replace(markdownLinkRegex, (_match, linkText, url) => {
    const placeholder = `__LINK_${replacementIndex}__`
    linkReplacements.push({
      placeholder,
      element: (
        <a
          key={`md-${replacementIndex}`}
          href={String(url).trim()}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          {linkText}
        </a>
      ),
    })
    replacementIndex++
    return placeholder
  })

  processedText = processedText.replace(urlRegex, (match) => {
    const placeholder = `__LINK_${replacementIndex}__`
    linkReplacements.push({
      placeholder,
      element: (
        <a
          key={`url-${replacementIndex}`}
          href={match}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          {match}
        </a>
      ),
    })
    replacementIndex++
    return placeholder
  })

  const parts = processedText.split(/(__LINK_\d+__)/g)

  return (
    <div className="whitespace-pre-wrap">
      {parts.map((part, index) => {
        const linkReplacement = linkReplacements.find((lr) => lr.placeholder === part)
        if (linkReplacement) return linkReplacement.element
        return <span key={index}>{part}</span>
      })}
    </div>
  )
}

/* ------------------------------- main modal ------------------------------- */

export default function SegmentModal({ isOpen, onClose, onSave, segment, tripId, segmentTypes }: SegmentModalProps) {
  const [name, setName] = useState("")
  const [range, setRange] = useState<RangeDateTimePickerValue>({
    startLocal: "",
    endLocal: null,
    startOffsetH: 0,
    endOffsetH: null,
  })

  // Keep prefilled locations to re-attach ids later
  const [prefilledStart, setPrefilledStart] = useState<LocationOption | null>(null)
  const [prefilledEnd, setPrefilledEnd] = useState<LocationOption | null>(null)

  const [locRange, setLocRange] = useState<RangeLocationPickerValue>({
    start: null,
    end: null,
  })

  const [cost, setCost] = useState("")
  const [comment, setComment] = useState("")
  const [segmentTypeId, setSegmentTypeId] = useState<number | null>(null)
  const [options, setOptions] = useState<Option[]>([])
  const [selectedOptions, setSelectedOptions] = useState<number[]>([])
  const [optionsTouched, setOptionsTouched] = useState(false)
  const [isDuplicateMode, setIsDuplicateMode] = useState(false)
  const [userPreferredOffset, setUserPreferredOffset] = useState<number>(0)
  const [isUiVisible, setIsUiVisible] = useState(true)

  // State for delete confirmation dialog
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // collapsible toggles
  const [timesOpen, setTimesOpen] = useState(true)
  const [locationsOpen, setLocationsOpen] = useState(true)
  const [additionalOptionsOpen, setAdditionalOptionsOpen] = useState(true)
  const [optionsFilterOpen, setOptionsFilterOpen] = useState(false)
  const [showHiddenOptionsFilter, setShowHiddenOptionsFilter] = useState(false)

  // Fetch user preferences (preferred offset)
  const fetchUserPreferences = useCallback(async () => {
    try {
      const response = await fetch("/api/account/info")
      if (!response.ok) throw new Error("Failed to fetch user preferences")
      const userData: User = await response.json()
      setUserPreferredOffset(userData.userPreference?.preferredUtcOffset ?? 0)
    } catch {
      setUserPreferredOffset(0)
    }
  }, [])

  useEffect(() => {
    fetchUserPreferences()
  }, [fetchUserPreferences])

  useEffect(() => {
    fetchOptions()
  }, [tripId])

  useEffect(() => {
    setOptionsFilterOpen(false)
    setShowHiddenOptionsFilter(false)
  }, [segment?.id, isDuplicateMode])

  useEffect(() => {
    setIsDuplicateMode(false)
    setOptionsTouched(false)

    if (segment) {
      setName(segment.name)

      const sOff = segment.startDateTimeUtcOffset ?? 0
      const eOff = segment.endDateTimeUtcOffset ?? sOff

      const startLocal = utcIsoToLocalInput(segment.startDateTimeUtc, sOff)
      const endLocalRaw = utcIsoToLocalInput(segment.endDateTimeUtc, eOff)

      const endIsSame = segment.endDateTimeUtc === segment.startDateTimeUtc && eOff === sOff

      setRange({
        startLocal,
        endLocal: endIsSame ? null : endLocalRaw,
        startOffsetH: sOff,
        endOffsetH: endIsSame ? null : eOff,
      })

      setCost(String(segment.cost))
      setComment(segment.comment || "")
      setSegmentTypeId(segment.segmentTypeId)
      setIsUiVisible((segment as any)?.isUiVisible ?? true)

      // Prefill locations if backend provides them
      const startLocRaw = (segment as any)?.startLocation ?? (segment as any)?.StartLocation
      const endLocRaw = (segment as any)?.endLocation ?? (segment as any)?.EndLocation

      const startNorm = normalizeLocation(startLocRaw)
      const endNorm = normalizeLocation(endLocRaw)

      setPrefilledStart(startNorm ?? null)
      setPrefilledEnd(endNorm ?? null)

      setLocRange({
        start: startNorm ?? null,
        end: endNorm ?? null,
      })

      setTimesOpen(true)
      setLocationsOpen(true)
      setAdditionalOptionsOpen(false)

      fetchConnectedOptions(segment.id)
    } else {
      setName("")
      setRange({
        startLocal: "",
        endLocal: null,
        startOffsetH: userPreferredOffset ?? 0,
        endOffsetH: null,
      })
      setPrefilledStart(null)
      setPrefilledEnd(null)
      setLocRange({ start: null, end: null })
      setCost("")
      setComment("")
      setSegmentTypeId(null)
      setSelectedOptions([])
      setIsUiVisible(true)

      setTimesOpen(true)
      setLocationsOpen(true)
      setAdditionalOptionsOpen(false)
    }
  }, [segment, userPreferredOffset])

  const fetchOptions = async () => {
    try {
      const response = await fetch(`/api/Option/GetOptionsByTripId?tripId=${tripId}`)
      if (!response.ok) throw new Error("Failed to fetch options")
      const data = await response.json()
      setOptions(data)
    } catch (error) {
      console.error("Error fetching options:", error)
      toast({ title: "Error", description: "Failed to fetch options. Please try again." })
    }
  }

  const fetchConnectedOptions = async (segmentId: number) => {
    try {
      const response = await fetch(`/api/Segment/GetConnectedOptions?tripId=${tripId}&segmentId=${segmentId}`)
      if (!response.ok) throw new Error("Failed to fetch connected options")
      const data: Option[] = await response.json()
      const ids = data.map((o) => Number(o.id))

      if (!optionsTouched) setSelectedOptions(ids)
    } catch (error) {
      console.error("Error fetching connected options:", error)
      toast({ title: "Error", description: "Failed to fetch connected options. Please try again." })
    }
  }

  const handleOptionChange = (optionId: number, checkedState: boolean | "indeterminate") => {
    const checked = checkedState === true
    setOptionsTouched(true)
    setSelectedOptions((prev) => {
      if (checked) return prev.includes(optionId) ? prev : [...prev, optionId]
      return prev.includes(optionId) ? prev.filter((id) => id !== optionId) : prev
    })
  }

  const handleUpdateConnectedOptions = async (optionIds: number[]) => {
    if (!segment) return

    try {
      const response = await fetch(`/api/Segment/UpdateConnectedOptions?tripId=${tripId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          SegmentId: segment.id,
          OptionIds: optionIds,
          TripId: tripId,
        }),
        credentials: "include",
      })
      if (!response.ok) throw new Error("Failed to update connected options")
      toast({ title: "Success", description: "Connected options updated successfully" })
    } catch (error) {
      console.error("Error updating connected options:", error)
      toast({ title: "Error", description: "Failed to update connected options. Please try again." })
    }
  }

  const handleDuplicateSegment = () => {
    setName((n) => `DUPLICATE ${n}`)
    setIsDuplicateMode(true)
    setSelectedOptions([])
  }

  const handleDelete = async () => {
    if (!segment) return

    try {
      const response = await fetch(`/api/Segment/Delete/${segment.id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to delete segment")
      }

      toast({
        title: "Success",
        description: "Segment deleted successfully",
      })

      setShowDeleteConfirm(false)
      onClose()
      // Trigger a refresh if needed - you may need to add a callback prop
      window.location.reload()
    } catch (error) {
      console.error("Error deleting segment:", error)
      toast({
        title: "Error",
        description: "Failed to delete segment. Please try again.",
      })
    }
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (segmentTypeId === null) {
        toast({ title: "Error", description: "Please select a segment type." })
        return
      }
      if (!range.startLocal) {
        toast({ title: "Error", description: "Please choose a start date and time." })
        return
      }

      const startUtcMs = localToUtcMs(range.startLocal, range.startOffsetH)
      if (!Number.isFinite(startUtcMs)) {
        toast({ title: "Error", description: "Invalid start date/time." })
        return
      }
      const startIso = utcMsToIso(startUtcMs)

      const effEndOffset = range.endOffsetH ?? range.startOffsetH
      const endLocalUsed = range.endLocal ?? range.startLocal
      const endUtcMs = localToUtcMs(endLocalUsed, effEndOffset)
      if (!Number.isFinite(endUtcMs)) {
        toast({ title: "Error", description: "Invalid end date/time." })
        return
      }
      if (endUtcMs < startUtcMs) {
        toast({ title: "Error", description: "End must be at or after start." })
        return
      }

      const endIso = utcMsToIso(endUtcMs)

      const startForSave = locRange.start ? { ...locRange.start, id: prefilledStart?.id } : null
      const endForSave = locRange.end ? { ...locRange.end, id: prefilledEnd?.id } : null

      const payload: SegmentSave = {
        tripId,
        name,
        startDateTimeUtc: startIso,
        endDateTimeUtc: endIso,
        startDateTimeUtcOffset: range.startOffsetH,
        endDateTimeUtcOffset: effEndOffset,
        cost: Number.parseFloat(cost),
        segmentTypeId,
        comment,
        StartLocation: toLocationDto(startForSave),
        EndLocation: toLocationDto(endForSave),
        isUiVisible,
      }

      const isUpdate = !!segment && !isDuplicateMode
      const optionIds = selectedOptions.map(Number)

      try {
        if (isUpdate && segment) await handleUpdateConnectedOptions(optionIds)
        await onSave(payload, isUpdate, segment?.id)
      } catch (err) {
        console.error("Save flow failed:", err)
        toast({ title: "Error", description: "Failed to save segment." })
      }
    },
    [
      segmentTypeId,
      range,
      tripId,
      name,
      cost,
      comment,
      segment,
      isDuplicateMode,
      onSave,
      selectedOptions,
      locRange,
      prefilledStart,
      prefilledEnd,
      isUiVisible,
    ],
  )

  const filteredOptionsForDisplay = useMemo(() => {
    if (!segment || isDuplicateMode) return []
    if (showHiddenOptionsFilter) return options
    return options.filter((option) => (option as any)?.isUiVisible !== false)
  }, [segment, isDuplicateMode, options, showHiddenOptionsFilter])

  const isCreateMode = !segment || isDuplicateMode

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl w-full h-[85vh] p-0 flex flex-col">
          <DialogTitle className="sr-only">{isCreateMode ? "Create Segment" : `Edit Segment: ${name}`}</DialogTitle>
          <div className="sticky top-0 z-10 bg-background border-b px-4 py-3">
            <h2 className="text-lg font-semibold mb-3">{isCreateMode ? "Create Segment" : `Edit Segment: ${name}`}</h2>

            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 text-sm">
                <Label htmlFor="ui-visible-toggle" className="cursor-pointer">
                  {isUiVisible ? "UI visible" : "UI hidden"}
                </Label>
                <Switch id="ui-visible-toggle" checked={isUiVisible} onCheckedChange={setIsUiVisible} />
              </div>
              <DialogClose asChild>
                <Button variant="ghost" size="icon" aria-label="Close segment modal">
                  <XIcon className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {segment && !isDuplicateMode && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="bg-red-700 hover:bg-red-800 text-white"
                    title="Delete"
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-end gap-2">
                {segment && !isDuplicateMode && (
                  <Button type="button" variant="outline" size="sm" onClick={handleDuplicateSegment} title="Duplicate">
                    <CopyIcon className="h-4 w-4" />
                  </Button>
                )}

                <Button type="submit" size="sm" className="bg-primary hover:bg-primary/90" onClick={handleSubmit}>
                  <SaveIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {/* Name */}
            <div className="grid grid-cols-4 items-center gap-3">
              <Label htmlFor="name" className="text-right text-sm">
                Nickname
              </Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
            </div>

            {/* Type */}
            <div className="grid grid-cols-4 items-center gap-3">
              <Label htmlFor="segmentType" className="text-right text-sm">
                Type
              </Label>
              <Select
                value={segmentTypeId?.toString() || ""}
                onValueChange={(value) => setSegmentTypeId(Number.parseInt(value))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {segmentTypes.map((type: SegmentType) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      <div className="flex items-center">
                        {type.iconSvg ? (
                          <div dangerouslySetInnerHTML={{ __html: type.iconSvg as string }} className="w-4 h-4 mr-2" />
                        ) : null}
                        {type.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cost */}
            <div className="grid grid-cols-4 items-center gap-3">
              <Label htmlFor="cost" className="text-right text-sm">
                Cost
              </Label>
              <Input
                id="cost"
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="col-span-3"
                required
                step="0.01"
                inputMode="decimal"
              />
            </div>

            <Collapsible title="Time" open={timesOpen} onToggle={() => setTimesOpen((o) => !o)}>
              <RangeDateTimePicker
                id="segment-when"
                label=""
                value={range}
                onChange={setRange}
                allowDifferentOffsets
                compact
              />
            </Collapsible>

            <Collapsible title="Location" open={locationsOpen} onToggle={() => setLocationsOpen((o) => !o)}>
              <RangeLocationPicker id="segment-where" label="" value={locRange} onChange={setLocRange} compact />
            </Collapsible>

            {/* Comment */}
            <Collapsible title="More" open={additionalOptionsOpen} onToggle={() => setAdditionalOptionsOpen((o) => !o)}>
              <div className="grid grid-cols-4 items-start gap-3">
                <Label htmlFor="comment" className="text-right text-sm pt-2">
                  Comment
                </Label>
                <div className="col-span-3 space-y-2">
                  <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={`Add notes, links, or other details...
Use [Link Text](URL) for custom link text
Or paste URLs directly: https://example.com`}
                    className="min-h-[120px] text-sm"
                  />
                  {comment && (
                    <div className="p-2 bg-muted rounded-md text-sm">
                      <div className="text-xs text-muted-foreground mb-1">Preview:</div>
                      <CommentDisplay text={comment} />
                    </div>
                  )}
                </div>
              </div>
            </Collapsible>

            {/* Options (edit only) */}
            {segment && !isDuplicateMode && (
              <div className="grid grid-cols-4 items-start gap-3">
                <Label className="text-right pt-2 text-sm">Options</Label>
                <div className="col-span-3">
                  <div className="flex justify-end mb-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Toggle option filters"
                      onClick={() => setOptionsFilterOpen((prev) => !prev)}
                    >
                      <SlidersHorizontal
                        className={cn(
                          "h-4 w-4 transition-transform",
                          optionsFilterOpen ? "text-primary rotate-90" : "text-muted-foreground"
                        )}
                      />
                    </Button>
                  </div>
                  {optionsFilterOpen && (
                    <div className="flex items-center justify-end gap-2 mb-3 text-xs text-muted-foreground">
                      <span>Show hidden</span>
                      <Switch
                        checked={showHiddenOptionsFilter}
                        onCheckedChange={(checked) => setShowHiddenOptionsFilter(Boolean(checked))}
                        aria-label="Show hidden options"
                      />
                    </div>
                  )}
                  <ScrollArea className="h-[150px] border rounded-md p-3">
                    {filteredOptionsForDisplay.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No options available.</p>
                    ) : (
                      filteredOptionsForDisplay.map((option) => {
                        const optionHidden = (option as any)?.isUiVisible === false
                        const dimmed = showHiddenOptionsFilter && optionHidden
                        return (
                          <div
                            key={option.id}
                            className={cn(
                              "flex items-center justify-between rounded-md px-2 py-1 mb-2 last:mb-0",
                              dimmed && "bg-muted text-muted-foreground"
                            )}
                          >
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`option-${option.id}`}
                                checked={selectedOptions.includes(Number(option.id))}
                                onCheckedChange={(checked) => handleOptionChange(Number(option.id), checked)}
                              />
                              <Label
                                htmlFor={`option-${option.id}`}
                                className={cn("text-sm cursor-pointer", dimmed && "text-muted-foreground")}
                              >
                                {option.name}
                              </Label>
                            </div>
                            {dimmed && <EyeOffIcon className="h-4 w-4" aria-hidden="true" />}
                          </div>
                        )
                      })
                    )}
                  </ScrollArea>
                </div>
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Segment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-700 hover:bg-red-800 text-white">
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
