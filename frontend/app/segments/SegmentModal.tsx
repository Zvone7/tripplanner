"use client"

import type React from "react"
import type { JSX } from "react"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog"
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
import { CopyIcon, SaveIcon, Trash2Icon, EyeOffIcon, SlidersHorizontal, XIcon, AlertTriangle, Link2, Loader2, Calendar, Globe, Pencil } from "lucide-react"
import { toLocationDto, normalizeLocation } from "../lib/mapping"
import { Collapsible } from "../components/Collapsible"
import { cn } from "../lib/utils"
import { TitleTokens } from "../components/TitleTokens"

// types
import type {
  SegmentModalProps,
  OptionRef as Option,
  OptionApi,
  User,
  SegmentSave,
  LocationOption,
  SegmentType,
  SegmentApi,
  SegmentSuggestion,
} from "../types/models"

import { RangeDateTimePicker, type RangeDateTimePickerValue } from "../components/RangeDateTimePicker"

import { RangeLocationPicker, type RangeLocationPickerValue } from "../components/RangeLocationPicker"
import { useCurrencyConversions } from "../hooks/useCurrencyConversions"

import { localToUtcMs, utcMsToIso, utcIsoToLocalInput } from "../lib/utils"
import {
  buildSegmentTitleTokens,
  buildOptionTitleTokens,
  buildOptionConfigFromApi,
  tokensToLabel,
} from "../utils/formatters"
import { optionsApi, segmentsApi, userApi } from "../utils/apiClient"
import { getDefaultCurrencyId, useCurrencies } from "../hooks/useCurrencies"
import { formatCurrencyAmount, formatConvertedAmount } from "../utils/currency"
import { CurrencyDropdown } from "../components/CurrencyDropdown"

const arraysEqual = (a: number[], b: number[]) => a.length === b.length && a.every((val, idx) => val === b[idx])

const toIsoFromLocalValue = (localValue: string | null, offset?: number | null) => {
  if (!localValue) return null
  if (typeof offset !== "number" || Number.isNaN(offset)) return null
  const ms = localToUtcMs(localValue, offset)
  if (!Number.isFinite(ms)) return null
  return utcMsToIso(ms)
}

/* ------------------------- comment preview helper ------------------------- */

const CommentDisplay: React.FC<{ text: string }> = ({ text }) => {
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
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

const formatLocalDateTimeLabel = (value: string | null) => {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value.replace("T", " ")
  }
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const formatLocationSummary = (loc: LocationOption | null) => {
  if (!loc) return ""
  if (loc.formatted) return loc.formatted
  const parts = [loc.name, loc.country].filter(Boolean)
  return parts.join(", ")
}

/* ------------------------------- main modal ------------------------------- */

export default function SegmentModal({
  isOpen,
  onClose,
  onSave,
  segment,
  tripId,
  segmentTypes,
  tripCurrencyId,
  displayCurrencyId,
}: SegmentModalProps) {
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
  const [currencyId, setCurrencyId] = useState<number | null>(null)
  const [segmentTypeId, setSegmentTypeId] = useState<number | null>(null)
  const [options, setOptions] = useState<OptionApi[]>([])
  const [selectedOptions, setSelectedOptions] = useState<number[]>([])
  const [optionsTouched, setOptionsTouched] = useState(false)
  const optionsTouchedRef = useRef(optionsTouched)
  const [isDuplicateMode, setIsDuplicateMode] = useState(false)
  const [userPreferredOffset, setUserPreferredOffset] = useState<number>(0)
  const [userPreferredCurrencyId, setUserPreferredCurrencyId] = useState<number | null>(null)
  const [isUiVisible, setIsUiVisible] = useState(true)
  const [baselineReady, setBaselineReady] = useState(!segment)
  const [bookingUrl, setBookingUrl] = useState("")
  const [isImportingBooking, setIsImportingBooking] = useState(false)
  const isCreateMode = !segment || isDuplicateMode

  // State for delete confirmation dialog
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // collapsible toggles
  const [generalOpen, setGeneralOpen] = useState(() => !segment)
  const [timesOpen, setTimesOpen] = useState(() => !segment)
  const [locationsOpen, setLocationsOpen] = useState(() => !segment)
  const [connectedOptionsOpen, setConnectedOptionsOpen] = useState(true)
  const [optionsFilterOpen, setOptionsFilterOpen] = useState(false)
  const [showHiddenOptionsFilter, setShowHiddenOptionsFilter] = useState(false)
  const [showDescriptionModal, setShowDescriptionModal] = useState(false)
  const [descriptionDraft, setDescriptionDraft] = useState("")

  const selectedSegmentType = useMemo(() => {
    if (segmentTypeId === null) return null
    return segmentTypes.find((type) => type.id === segmentTypeId) ?? null
  }, [segmentTypeId, segmentTypes])

  const { currencies, isLoading: isLoadingCurrencies } = useCurrencies()
  const { conversions } = useCurrencyConversions()
  const defaultCurrencyId = useMemo(() => getDefaultCurrencyId(currencies), [currencies])
  const resolvedDisplayCurrencyId = useMemo(() => {
    if (typeof displayCurrencyId === "number") return displayCurrencyId
    if (typeof tripCurrencyId === "number") return tripCurrencyId
    if (typeof userPreferredCurrencyId === "number" && userPreferredCurrencyId > 0) return userPreferredCurrencyId
    return defaultCurrencyId ?? null
  }, [displayCurrencyId, tripCurrencyId, userPreferredCurrencyId, defaultCurrencyId])
  const parsedCost = Number.parseFloat(cost)
  const hasCostValue = Number.isFinite(parsedCost)
  const formattedSegmentCost = useMemo(() => {
    if (!hasCostValue || !currencyId) return null
    return formatCurrencyAmount(parsedCost, currencyId, currencies)
  }, [hasCostValue, parsedCost, currencyId, currencies])
  const userConversionLabel = useMemo(() => {
    if (!hasCostValue) return null
    if (!currencyId || !userPreferredCurrencyId || currencyId === userPreferredCurrencyId) return null
    return (
      formatConvertedAmount({
        amount: parsedCost,
        fromCurrencyId: currencyId,
        toCurrencyId: userPreferredCurrencyId,
        currencies,
        conversions,
      }) ?? null
    )
  }, [hasCostValue, parsedCost, currencyId, userPreferredCurrencyId, currencies, conversions])
  const tripConversionLabel = useMemo(() => {
    if (!hasCostValue) return null
    if (!currencyId || !tripCurrencyId) return null
    if (!userPreferredCurrencyId || tripCurrencyId === userPreferredCurrencyId) return null
    if (!userConversionLabel) return null
    return (
      formatConvertedAmount({
        amount: parsedCost,
        fromCurrencyId: currencyId,
        toCurrencyId: tripCurrencyId,
        currencies,
        conversions,
      }) ?? null
    )
  }, [
    hasCostValue,
    parsedCost,
    currencyId,
    tripCurrencyId,
    userPreferredCurrencyId,
    userConversionLabel,
    currencies,
    conversions,
  ])
  const generalCostLabel = useMemo(() => {
    if (formattedSegmentCost) return formattedSegmentCost
    if (hasCostValue) return parsedCost.toString()
    return null
  }, [formattedSegmentCost, hasCostValue, parsedCost])

  const generalSummaryTitle = useMemo(() => {
    const displayName = (name && name.trim()) || segment?.name || "New segment"
    const conversionLabel = userConversionLabel ?? tripConversionLabel ?? null
    return (
      <span className="flex items-center gap-2 text-sm">
        {selectedSegmentType?.iconSvg ? (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <span
              className="h-3.5 w-3.5"
              dangerouslySetInnerHTML={{ __html: selectedSegmentType.iconSvg }}
              suppressHydrationWarning
            />
          </span>
        ) : (
          <span className="text-xs font-semibold uppercase text-muted-foreground">SEG</span>
        )}
        <span className="font-semibold">{displayName}</span>
        {generalCostLabel ? (
          <span className="text-muted-foreground">
            {generalCostLabel}
            {conversionLabel ? ` (${conversionLabel})` : null}
          </span>
        ) : null}
      </span>
    )
  }, [
    name,
    segment?.name,
    selectedSegmentType,
    generalCostLabel,
    userConversionLabel,
    tripConversionLabel,
  ])

  const timeSummaryTitle = useMemo(() => {
    const startLabel = formatLocalDateTimeLabel(range.startLocal)
    const endLabel = formatLocalDateTimeLabel(range.endLocal)
    return (
      <span className="flex items-center gap-2 text-sm">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span>{startLabel || "Start not set"}</span>
        {endLabel ? (
          <>
            <span className="text-muted-foreground">→</span>
            <span>{endLabel}</span>
          </>
        ) : null}
      </span>
    )
  }, [range.startLocal, range.endLocal])

  const locationSummaryTitle = useMemo(() => {
    const startLabel = formatLocationSummary(locRange.start)
    const endLabel = formatLocationSummary(locRange.end)
    return (
      <span className="flex items-center gap-2 text-sm">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <span>{startLabel || "Start not set"}</span>
        {endLabel ? (
          <>
            <span className="text-muted-foreground">→</span>
            <span>{endLabel}</span>
          </>
        ) : null}
      </span>
    )
  }, [locRange.start, locRange.end])

  const connectedSummaryTitle = useMemo(() => {
    const count = selectedOptions.length
    const suffix = count === 1 ? "" : "s"
    return `Connected with ${count} option${suffix}`
  }, [selectedOptions.length])

  // Fetch user preferences (preferred offset)
  const fetchUserPreferences = useCallback(async () => {
    try {
      const userData: User = await userApi.getAccountInfo()
      setUserPreferredOffset(userData.userPreference?.preferredUtcOffset ?? 0)
      setUserPreferredCurrencyId(userData.userPreference?.preferredCurrencyId ?? null)
    } catch {
      setUserPreferredOffset(0)
      setUserPreferredCurrencyId(null)
    }
  }, [])

  useEffect(() => {
    fetchUserPreferences()
  }, [fetchUserPreferences])

  const fetchOptions = useCallback(async () => {
    try {
      const data = await optionsApi.getByTripId(tripId)
      setOptions(data)
    } catch (error) {
      console.error("Error fetching options:", error)
      toast({ title: "Error", description: "Failed to fetch options. Please try again." })
    }
  }, [tripId, toast])

  useEffect(() => {
    fetchOptions()
  }, [fetchOptions])

  const applyBookingSuggestion = (suggestion: SegmentSuggestion) => {
    if (suggestion.name && !name) {
      setName(suggestion.name)
    }

    setRange((prev) => ({
      ...prev,
      startLocal: suggestion.startDateLocal ?? prev.startLocal,
      endLocal: suggestion.endDateLocal ?? prev.endLocal,
    }))

    if (suggestion.location) {
      const normalized = normalizeLocation(suggestion.location)
      if (normalized) {
        setLocRange((prev) => ({ ...prev, start: normalized }))
        setPrefilledStart(normalized)
      }
    } else if (suggestion.locationName) {
      const manualLocation: LocationOption = {
        name: suggestion.locationName,
        provider: "manual",
        providerPlaceId: suggestion.locationName,
        lat: 0,
        lng: 0,
      }
      setLocRange((prev) => ({ ...prev, start: manualLocation }))
      setPrefilledStart(manualLocation)
    }

    if (typeof suggestion.cost === "number" && Number.isFinite(suggestion.cost)) {
      const costValue = suggestion.cost
      setCost((prev) => {
        if (prev && prev.trim().length) return prev
        return costValue.toString()
      })
    }

    if (suggestion.currencyCode) {
      const normalizedCode = suggestion.currencyCode.toUpperCase()
      const matchingCurrency = currencies.find(
        (currency) =>
          currency.shortName?.toUpperCase() === normalizedCode || currency.symbol?.toUpperCase() === normalizedCode,
      )
      if (matchingCurrency) {
        setCurrencyId((prev) => prev ?? matchingCurrency.id)
      }
    }

    if (suggestion.sourceUrl) {
      setComment((prev) => {
        const label = suggestion.name ?? "Booking link"
        const formatted = `Booking: [${label}](${suggestion.sourceUrl})`
        if (!prev) return formatted
        if (suggestion.sourceUrl && prev.includes(suggestion.sourceUrl)) return prev
        return `${prev}\n${formatted}`
      })
    }
  }

  const handleImportBookingLink = async () => {
    const trimmed = bookingUrl.trim()
    if (!trimmed) {
      toast({ title: "Paste a booking link", description: "Provide a booking.com link before importing." })
      return
    }
    try {
      setIsImportingBooking(true)
      const suggestion = await segmentsApi.parseBookingLink(trimmed)
      applyBookingSuggestion(suggestion)
      toast({ title: "Booking imported", description: "Details were added to the form." })
    } catch (error) {
      console.error("Failed to import booking link:", error)
      toast({ title: "Import failed", description: "Could not extract data from the provided link." })
    } finally {
      setIsImportingBooking(false)
    }
  }

  useEffect(() => {
    setOptionsFilterOpen(false)
    setShowHiddenOptionsFilter(false)
  }, [segment?.id, isDuplicateMode])

  useEffect(() => {
    if (isCreateMode) {
      setGeneralOpen(true)
      setTimesOpen(true)
      setLocationsOpen(true)
    }
  }, [isCreateMode])

  useEffect(() => {
    if (!isCreateMode && segment?.id) {
      setGeneralOpen(false)
      setTimesOpen(false)
      setLocationsOpen(false)
    }
  }, [isCreateMode, segment?.id])

  useEffect(() => {
    setConnectedOptionsOpen(true)
  }, [segment?.id, isDuplicateMode])

  useEffect(() => {
    if (showDescriptionModal) {
      setDescriptionDraft(comment ?? "")
    }
  }, [showDescriptionModal, comment])

  const initialSelectedOptionsRef = useRef<number[] | null>(null)

type SegmentBaseline = {
    name: string
    startLocal: string
    endLocal: string | null
    startOffsetH: number
    endOffsetH: number | null
    cost: string
    comment: string
    segmentTypeId: number | null
    isUiVisible: boolean
    startLocation: LocationOption | null
    endLocation: LocationOption | null
    currencyId: number | null
  }

  const segmentBaselineRef = useRef<SegmentBaseline | null>(null)

  const buildSegmentBaseline = (segmentData: SegmentApi): SegmentBaseline => {
    const sOff = segmentData.startDateTimeUtcOffset ?? 0
    const eOff = segmentData.endDateTimeUtcOffset ?? sOff
    const startLocalVal = utcIsoToLocalInput(segmentData.startDateTimeUtc, sOff)
    const endLocalRaw = utcIsoToLocalInput(segmentData.endDateTimeUtc, eOff)
    const endIsSame = segmentData.endDateTimeUtc === segmentData.startDateTimeUtc && eOff === sOff

    const startLocRaw = (segmentData as any)?.startLocation ?? (segmentData as any)?.startLocation
    const endLocRaw = (segmentData as any)?.endLocation ?? (segmentData as any)?.endLocation

    const startNorm = normalizeLocation(startLocRaw)
    const endNorm = normalizeLocation(endLocRaw)

    return {
      name: segmentData.name ?? "",
      startLocal: startLocalVal,
      endLocal: endIsSame ? null : endLocalRaw,
      startOffsetH: sOff,
      endOffsetH: endIsSame ? null : eOff,
      cost: String(segmentData.cost ?? ""),
      comment: segmentData.comment ?? "",
      segmentTypeId: segmentData.segmentTypeId ?? null,
      isUiVisible: (segmentData as any)?.isUiVisible ?? true,
      startLocation: startNorm ?? null,
      endLocation: endNorm ?? null,
      currencyId: segmentData.currencyId ?? null,
    }
  }

  const formatOptionCostForDisplay = useCallback(
    (option: OptionApi) => {
      if (option.totalCost === null || option.totalCost === undefined) return null
      return (
        formatConvertedAmount({
          amount: option.totalCost,
          fromCurrencyId: tripCurrencyId ?? null,
          toCurrencyId: resolvedDisplayCurrencyId,
          currencies,
          conversions,
        }) ?? formatCurrencyAmount(option.totalCost, tripCurrencyId ?? null, currencies)
      )
    },
    [tripCurrencyId, resolvedDisplayCurrencyId, currencies, conversions],
  )

  useEffect(() => {
    optionsTouchedRef.current = optionsTouched
  }, [optionsTouched])

  const fetchConnectedOptions = useCallback(
    async (segmentId: number) => {
      try {
        const data = await segmentsApi.getConnectedOptions(tripId, segmentId)
        const ids = data.map((o) => Number(o.id))

        if (!optionsTouchedRef.current) {
          setSelectedOptions(ids)
          initialSelectedOptionsRef.current = [...ids].sort((a, b) => a - b)
        }
        setBaselineReady(true)
      } catch (error) {
        console.error("Error fetching connected options:", error)
        toast({ title: "Error", description: "Failed to fetch connected options. Please try again." })
        setBaselineReady(true)
      }
    },
    [tripId, toast],
  )

  useEffect(() => {
    setIsDuplicateMode(false)
    setOptionsTouched(false)

    if (segment) {
      segmentBaselineRef.current = buildSegmentBaseline(segment)
      setBaselineReady(false)
      initialSelectedOptionsRef.current = null
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
      setCurrencyId(segment.currencyId ?? null)

      // Prefill locations if backend provides them
      const startLocRaw = (segment as any)?.startLocation ?? (segment as any)?.startLocation
      const endLocRaw = (segment as any)?.endLocation ?? (segment as any)?.endLocation

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

      fetchConnectedOptions(segment.id)
    } else {
      segmentBaselineRef.current = null
      initialSelectedOptionsRef.current = null
      setBaselineReady(true)
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
      setCurrencyId(null)

      setTimesOpen(true)
      setLocationsOpen(true)
    }
  }, [segment, userPreferredOffset, fetchConnectedOptions])

  useEffect(() => {
    if (segment) return
    if (currencyId !== null) return
    if (typeof userPreferredCurrencyId === "number" && userPreferredCurrencyId > 0) {
      setCurrencyId(userPreferredCurrencyId)
      return
    }
    if (typeof tripCurrencyId === "number" && tripCurrencyId > 0) {
      setCurrencyId(tripCurrencyId)
      return
    }
    if (defaultCurrencyId) {
      setCurrencyId(defaultCurrencyId)
    }
  }, [segment, currencyId, userPreferredCurrencyId, tripCurrencyId, defaultCurrencyId])

  const handleOptionChange = (optionId: number, checkedState: boolean | "indeterminate") => {
    const checked = checkedState === true
    setOptionsTouched(true)
    setSelectedOptions((prev) => {
      if (checked) return prev.includes(optionId) ? prev : [...prev, optionId]
      return prev.includes(optionId) ? prev.filter((id) => id !== optionId) : prev
    })
  }

  const handleUpdateConnectedOptions = useCallback(
    async (optionIds: number[]) => {
      if (!segment) return

      try {
        await segmentsApi.updateConnectedOptions(tripId, { SegmentId: segment.id, OptionIds: optionIds })
        toast({ title: "Success", description: "Connected options updated successfully" })
      } catch (error) {
        console.error("Error updating connected options:", error)
        toast({ title: "Error", description: "Failed to update connected options. Please try again." })
      }
    },
    [segment, tripId, toast],
  )

  const handleDuplicateSegment = () => {
    setName((n) => `DUPLICATE ${n}`)
    setIsDuplicateMode(true)
    setSelectedOptions([])
  }

  const handleDelete = async () => {
    if (!segment) return

    try {
      await segmentsApi.remove(tripId, segment.id)

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
  
  const filteredOptionsForDisplay = useMemo(() => {
    if (!segment || isDuplicateMode) return []
    if (showHiddenOptionsFilter) return options
    return options.filter((option) => option.isUiVisible !== false)
  }, [segment, isDuplicateMode, options, showHiddenOptionsFilter])

  const hasChanges = useMemo(() => {
    if (isCreateMode) return true
    if (!segment || !baselineReady) return false

    const baseline = segmentBaselineRef.current
    const baselineOptions = initialSelectedOptionsRef.current
    if (!baseline || baselineOptions === null) return false

    if (baseline.name !== name) return true
    if (baseline.cost !== cost) return true
    if ((baseline.comment ?? "") !== (comment ?? "")) return true
    if ((baseline.segmentTypeId ?? null) !== (segmentTypeId ?? null)) return true
    if (baseline.isUiVisible !== isUiVisible) return true
    if ((baseline.currencyId ?? null) !== (currencyId ?? null)) return true

    if (baseline.startLocal !== range.startLocal) return true
    if ((baseline.endLocal ?? null) !== (range.endLocal ?? null)) return true
    if (baseline.startOffsetH !== range.startOffsetH) return true
    if ((baseline.endOffsetH ?? null) !== (range.endOffsetH ?? null)) return true

    const currentStartSig = JSON.stringify(locRange.start ?? null)
    const baselineStartSig = JSON.stringify(baseline.startLocation ?? null)
    if (currentStartSig !== baselineStartSig) return true

    const currentEndSig = JSON.stringify(locRange.end ?? null)
    const baselineEndSig = JSON.stringify(baseline.endLocation ?? null)
    if (currentEndSig !== baselineEndSig) return true

    const sortedCurrentOptions = [...selectedOptions].sort((a, b) => a - b)
    if (!arraysEqual(sortedCurrentOptions, baselineOptions)) return true

    return false
  }, [
    isCreateMode,
    segment,
    baselineReady,
    name,
    cost,
    comment,
    segmentTypeId,
    isUiVisible,
    range,
    locRange,
    selectedOptions,
    currencyId,
  ])
  const isSaveDisabled = isCreateMode ? false : (!baselineReady || !hasChanges)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (isSaveDisabled) return

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

      const currencyIdForSave = currencyId ?? userPreferredCurrencyId ?? tripCurrencyId ?? defaultCurrencyId
      if (!currencyIdForSave) {
        toast({ title: "Error", description: "Select a currency before saving." })
        return
      }

      const payload: SegmentSave = {
        tripId,
        name,
        startDateTimeUtc: startIso,
        endDateTimeUtc: endIso,
        startDateTimeUtcOffset: range.startOffsetH,
        endDateTimeUtcOffset: effEndOffset,
        cost: Number.parseFloat(cost),
        currencyId: currencyIdForSave,
        segmentTypeId,
        comment,
        startLocation: toLocationDto(startForSave),
        endLocation: toLocationDto(endForSave),
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
      isSaveDisabled,
      handleUpdateConnectedOptions,
      currencyId,
      userPreferredCurrencyId,
      tripCurrencyId,
      defaultCurrencyId,
      toast,
    ],
  )

  const missingFieldMessages = useMemo(() => {
    const messages: string[] = []
    if (segmentTypeId === null) messages.push("Select a segment type")
    if (!range.startLocal) messages.push("Choose a start date and time")
    const parsedCost = Number.parseFloat(cost)
    if (!cost || Number.isNaN(parsedCost)) messages.push("Enter a valid cost amount")
    if (!currencyId && !isLoadingCurrencies) messages.push("Select a currency")
    return messages
  }, [segmentTypeId, range.startLocal, cost, currencyId, isLoadingCurrencies])

  const hasMissingFields = missingFieldMessages.length > 0

  const segmentTitleTokens = useMemo(() => {
    const startIso = toIsoFromLocalValue(range.startLocal, range.startOffsetH)
    const endIso = toIsoFromLocalValue(range.endLocal ?? range.startLocal, range.endOffsetH ?? range.startOffsetH)
    const tokens = buildSegmentTitleTokens({
      name,
      fallbackName: segment?.name || "New segment",
      segmentType: selectedSegmentType,
      startLocationLabel: locRange.start?.name ?? "",
      endLocationLabel: locRange.end?.name ?? "",
      startDateIso: startIso,
      endDateIso: endIso,
      startOffset: range.startOffsetH,
      endOffset: range.endOffsetH ?? range.startOffsetH,
      cost: null,
    })
    if (formattedSegmentCost) {
      tokens.push({ key: "cost", text: formattedSegmentCost })
    }
    return tokens
  }, [name, segment, selectedSegmentType, locRange, range, formattedSegmentCost])

  const defaultSegmentTitle = isCreateMode ? "Create Segment" : segment ? `Edit Segment: ${segment.name}` : "Edit Segment"
  const segmentTitleText = tokensToLabel(segmentTitleTokens) || defaultSegmentTitle
  const segmentTitleDisplay = segmentTitleTokens.length ? (
    <TitleTokens tokens={segmentTitleTokens} />
  ) : (
    <span className="inline-flex items-center gap-1">{defaultSegmentTitle}</span>
  )
  const segmentTitleDescription = isCreateMode ? "Creating new segment" : "Editing existing segment"



  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl w-full h-[85vh] p-0 flex flex-col">
          <DialogTitle className="sr-only">{segmentTitleText}</DialogTitle>
          <div className="sticky top-0 bg-background border-b px-4 py-3">
            <div className="mb-3 space-y-1">
              <h2 className="text-lg font-semibold leading-snug flex flex-wrap gap-x-1 gap-y-0.5">
                {segmentTitleDisplay}
              </h2>
              <p className="text-xs text-muted-foreground">{segmentTitleDescription}</p>
            </div>

            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 text-sm">
                <Label htmlFor="ui-visible-toggle" className="cursor-pointer">
                  {isUiVisible ? "UI visible" : "UI hidden"}
                </Label>
                <Switch id="ui-visible-toggle" checked={isUiVisible} onCheckedChange={setIsUiVisible} />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {segment && !isDuplicateMode && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="bg-red-700 hover:bg-red-800 text-white"
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-end gap-2">
                {segment && !isDuplicateMode && (
                  <Button type="button" variant="outline" size="sm" onClick={handleDuplicateSegment}>
                    <CopyIcon className="h-4 w-4" />
                  </Button>
                )}

                <Button
                  type="submit"
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                  onClick={handleSubmit}
                  disabled={isSaveDisabled}
                >
                  <SaveIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {hasMissingFields && (
              <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4" aria-hidden="true" />
                <div>
                  <p className="font-medium">Missing required details</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5">
                    {missingFieldMessages.map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            <Collapsible
              title={generalSummaryTitle}
              open={generalOpen}
              onToggle={() => setGeneralOpen((open) => !open)}
            >
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-4 items-center gap-3">
                  <Label htmlFor="name" className="text-right text-sm">
                    Nickname
                  </Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
                </div>

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
                          <div className="flex items-center gap-2">
                            {type.iconSvg ? (
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary/60 text-secondary-foreground shadow-sm ring-1 ring-black/5 dark:bg-white dark:text-black">
                                <span
                                  dangerouslySetInnerHTML={{ __html: type.iconSvg as string }}
                                  className="w-4 h-4"
                                  suppressHydrationWarning
                                />
                              </span>
                            ) : null}
                            <span>{type.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isCreateMode && (
                  <div className="grid grid-cols-4 items-center gap-3">
                    <Label htmlFor="booking-link" className="text-right text-sm">
                      Booking link
                    </Label>
                    <div className="col-span-3 flex flex-col gap-2 sm:flex-row">
                      <Input
                        id="booking-link"
                        value={bookingUrl}
                        onChange={(e) => setBookingUrl(e.target.value)}
                        placeholder="https://www.booking.com/..."
                        autoComplete="off"
                        className="w-full"
                      />
                      <Button type="button" variant="secondary" onClick={handleImportBookingLink} disabled={isImportingBooking}>
                        {isImportingBooking ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Link2 className="h-4 w-4 mr-1" />
                        )}
                        Import
                      </Button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-4 items-start gap-3">
                  <Label htmlFor="cost" className="text-right text-sm pt-2 sm:pt-0">
                    Cost
                  </Label>
                  <div className="col-span-3 flex flex-col gap-2 sm:flex-row">
                    <Input
                      id="cost"
                      type="number"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      className="w-full sm:flex-1"
                      required
                      step="0.01"
                      inputMode="decimal"
                    />
                    <CurrencyDropdown
                      value={currencyId}
                      onChange={setCurrencyId}
                      currencies={currencies}
                      placeholder={isLoadingCurrencies ? "Loading..." : "Currency"}
                      disabled={isLoadingCurrencies}
                      className="w-full sm:w-[220px]"
                      triggerClassName="w-full"
                    />
                  </div>
                  {(userConversionLabel || tripConversionLabel) && (
                    <div className="col-span-3 col-start-2 text-xs text-muted-foreground">
                      {userConversionLabel ? <>≈ {userConversionLabel}</> : null}
                      {tripConversionLabel ? <span className="ml-1">({tripConversionLabel})</span> : null}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-4 items-start gap-3">
                  <Label className="text-right text-sm pt-2">Description & Links</Label>
                  <div className="col-span-3 space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowDescriptionModal(true)}
                      className="inline-flex items-center gap-2"
                    >
                      <Pencil className="h-4 w-4" />
                      {comment ? "Edit description" : "Add description"}
                    </Button>
                    {comment ? (
                      <div className="rounded-md border bg-muted/40 p-2 text-sm">
                        <CommentDisplay text={comment} />
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No description added yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </Collapsible>

            <Collapsible title={timeSummaryTitle} open={timesOpen} onToggle={() => setTimesOpen((o) => !o)}>
              <div className="pt-4">
                <RangeDateTimePicker
                  id="segment-when"
                  label=""
                  value={range}
                  onChange={setRange}
                  allowDifferentOffsets
                  compact
                />
              </div>
            </Collapsible>

            <Collapsible title={locationSummaryTitle} open={locationsOpen} onToggle={() => setLocationsOpen((o) => !o)}>
              <div className="pt-4">
                <RangeLocationPicker id="segment-where" label="" value={locRange} onChange={setLocRange} compact />
              </div>
            </Collapsible>

            {segment && !isDuplicateMode && (
              <Collapsible
                title={connectedSummaryTitle}
                open={connectedOptionsOpen}
                onToggle={() => setConnectedOptionsOpen((o) => !o)}
              >
                <div className="pt-4">
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
                        const optionHidden = option.isUiVisible === false
                        const dimmed = showHiddenOptionsFilter && optionHidden
                        const optionCostLabel = formatOptionCostForDisplay(option)
                        const optionConfig = buildOptionConfigFromApi(option)
                        const tokens = buildOptionTitleTokens({
                          ...optionConfig,
                          totalCost: optionCostLabel ?? optionConfig.totalCost,
                        })
                        const summaryLabel = tokensToLabel(tokens) || option.name

                        return (
                          <div
                            key={option.id}
                            className={cn(
                              "flex items-center justify-between rounded-md px-2 py-1 mb-2 last:mb-0",
                              dimmed && "bg-muted text-muted-foreground"
                            )}
                          >
                            <div className="flex items-center gap-3 w-full">
                              <Checkbox
                                id={`option-${option.id}`}
                                checked={selectedOptions.includes(Number(option.id))}
                                onCheckedChange={(checked) => handleOptionChange(Number(option.id), checked)}
                                aria-label={`Select ${summaryLabel}`}
                              />
                              <div className="flex flex-col flex-1 min-w-0" aria-label={summaryLabel}>
                                <TitleTokens tokens={tokens} size="sm" />
                                {optionCostLabel ? (
                                  <span className="text-xs text-muted-foreground">{optionCostLabel}</span>
                                ) : null}
                              </div>
                            </div>
                            {dimmed && <EyeOffIcon className="h-4 w-4" aria-hidden="true" />}
                          </div>
                        )
                      })
                    )}
                  </ScrollArea>
                </div>
              </Collapsible>
            )}
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showDescriptionModal} onOpenChange={setShowDescriptionModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Description & links</DialogTitle>
            <DialogDescription>Add helpful context and link out to external resources.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="segment-description-editor">Description</Label>
              <Textarea
                id="segment-description-editor"
                value={descriptionDraft}
                onChange={(event) => setDescriptionDraft(event.target.value)}
                rows={8}
                placeholder="Write notes here. Use [Title](https://example.com) to add a link."
              />
              <p className="text-xs text-muted-foreground">
                Markdown links are supported. Pasting a raw URL will also render as a clickable link.
              </p>
            </div>
            <div className="space-y-2 rounded-md border bg-muted/40 p-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Preview</p>
              {descriptionDraft.trim() ? (
                <CommentDisplay text={descriptionDraft} />
              ) : (
                <p className="text-sm text-muted-foreground">Start typing to see how your notes will appear.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setShowDescriptionModal(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                const normalized = descriptionDraft.trim()
                setComment(normalized)
                setShowDescriptionModal(false)
              }}
            >
              Save
            </Button>
          </DialogFooter>
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
