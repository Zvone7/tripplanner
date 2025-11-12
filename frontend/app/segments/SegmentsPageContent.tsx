"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { Button } from "../components/ui/button";
import { PlusIcon, ListIcon, EditIcon, EyeOffIcon } from "lucide-react";
import SegmentModal from "../segments/SegmentModal";
import { formatDateWithUserOffset } from "../utils/formatters";
import { OptionBadge } from "../components/OptionBadge";
import { cn } from "../lib/utils";
import { SegmentFilterPanel, type SegmentFilterValue } from "../components/filters/SegmentFilterPanel";
import type { SegmentSortValue } from "../components/sorting/segmentSortTypes";
import { applySegmentFilters, buildSegmentMetadata } from "../services/segmentFiltering";

import type { Segment, SegmentType, OptionRef, User, SegmentSave } from "../types/models";

const getLocationLabel = (loc: any | null) => {
  if (!loc) return "";
  const name = loc.name ?? "";
  const country = loc.country ?? "";
  const label = country ? `${name}, ${country}` : name;
  return label;
};

const formatSegmentDateWithWeekday = (iso: string, offset: number) => {
  const weekday = new Date(iso).toLocaleDateString(undefined, { weekday: "short" });
  return `${weekday}, ${formatDateWithUserOffset(iso, offset)}`;
};

/* ------------------------- Card Component ------------------------- */

function SegmentCard({
  segment,
  segmentType,
  userPreferredOffset,
  onEdit,
  connectedOptions,
  showVisibilityIndicator,
}: {
  segment: Segment;
  segmentType: SegmentType | undefined;
  userPreferredOffset: number;
  onEdit: (segment: Segment) => void;
  connectedOptions: OptionRef[];
  showVisibilityIndicator: boolean;
}) {
  const getTimezoneDisplayText = () =>
    userPreferredOffset === 0 ? "UTC" : `UTC${userPreferredOffset >= 0 ? "+" : ""}${userPreferredOffset}`;

  // location can arrive as startLocation/endLocation or StartLocation/EndLocation
  const startLoc = (segment as any).startLocation ?? (segment as any).StartLocation ?? null;
  const endLoc = (segment as any).endLocation ?? (segment as any).EndLocation ?? null;

  const isHidden = segment.isUiVisible === false;

  return (
    <Card
      className={cn(
        "cursor-pointer hover:bg-muted/50 transition-all duration-200 ease-in-out hover:-translate-y-0.5",
        isHidden && "bg-muted text-muted-foreground border-muted-foreground/40"
      )}
      onClick={() => onEdit(segment)}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              {segmentType && (
                <>
                  {segmentType.iconSvg ? (
                    <div dangerouslySetInnerHTML={{ __html: segmentType.iconSvg }} className="w-6 h-6" />
                  ) : null}
                  <span className="text-sm text-muted-foreground">{segmentType.name}</span>
                </>
              )}
            </div>
            <CardTitle className="text-lg">{segment.name}</CardTitle>

            <div className="mt-2 flex flex-wrap gap-1">
              {connectedOptions?.map((option) => {
                const optionHidden = (option as any)?.isUiVisible === false;
                return (
                  <OptionBadge
                    key={option.id}
                    id={option.id}
                    name={option.name}
                    isHidden={showVisibilityIndicator && optionHidden}
                  />
                );
              })}
            </div>

            <div className="mt-2 text-sm text-muted-foreground space-y-1">
              <div className="space-y-1">
                <div>
                  {formatSegmentDateWithWeekday(segment.startDateTimeUtc, userPreferredOffset)}
                  {startLoc ? ` (${getLocationLabel(startLoc)})` : ""}
                </div>
                <div>
                  {formatSegmentDateWithWeekday(segment.endDateTimeUtc, userPreferredOffset)}
                  {endLoc ? ` (${getLocationLabel(endLoc)})` : ""}
                </div>
                <div>${segment.cost.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">
                  Times shown in {getTimezoneDisplayText()}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            {showVisibilityIndicator && isHidden && (
              <div
                className="rounded-full border p-1 bg-muted-foreground/20 text-muted-foreground"
                title="Hidden from UI"
                aria-label="Hidden from UI"
              >
                <EyeOffIcon className="h-5 w-5" />
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(segment);
              }}
            >
              <EditIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}


/* ----------------------------------- Page ----------------------------------- */

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [segmentTypes, setSegmentTypes] = useState<SegmentType[]>([]);
  const [userPreferredOffset, setUserPreferredOffset] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Segment | null | undefined>(null);
  const [tripName, setTripName] = useState<string>("");
  const [connectedBySegment, setConnectedBySegment] = useState<Record<number, OptionRef[]>>({});
  const [filterState, setFilterState] = useState<SegmentFilterValue>({
    locations: [],
    types: [],
    dateRange: { start: "", end: "" },
    showHidden: false,
  });
  const [sortState, setSortState] = useState<SegmentSortValue | null>(null);

  const searchParams = useSearchParams();
  const tripId = searchParams.get("tripId");
  const router = useRouter();

  const fetchUserPreferences = useCallback(async () => {
    try {
      const response = await fetch("/api/account/info");
      if (!response.ok) throw new Error("Failed to fetch user preferences");
      const userData: User = await response.json();
      setUserPreferredOffset(userData.userPreference?.preferredUtcOffset || 0);
    } catch (err) {
      console.error("Error fetching user preferences:", err);
      setUserPreferredOffset(0);
    }
  }, []);

  const fetchTripName = useCallback(async () => {
    if (!tripId) return;
    try {
      const response = await fetch(`/api/trip/gettripbyid?tripId=${tripId}`);
      if (!response.ok) throw new Error("Failed to fetch trip details");
      const data = await response.json();
      setTripName(data.name);
    } catch (err) {
      console.error("Error fetching trip details:", err);
      setTripName("Unknown Trip");
    }
  }, [tripId]);

  const fetchSegmentTypes = useCallback(async () => {
    try {
      const response = await fetch("/api/Segment/GetSegmentTypes");
      if (!response.ok) throw new Error("Failed to fetch segment types");
      const data: SegmentType[] = await response.json();
      setSegmentTypes(data);
    } catch (err) {
      console.error("Error fetching segment types:", err);
      setError("An error occurred while fetching segment types");
    }
  }, []);

  const fetchSegments = useCallback(async () => {
    if (!tripId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/Segment/GetSegmentsByTripId?tripId=${tripId}`);
      if (!response.ok) throw new Error("Failed to fetch segments");
      const data: Segment[] = await response.json();
      setSegments(data);
    } catch (err) {
      setError("An error occurred while fetching segments");
      console.error("Error fetching segments:", err);
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  // After segments load, fetch their connected options in parallel
  useEffect(() => {
    if (!segments.length || !tripId) return;

    let cancelled = false;

    (async () => {
      try {
        const results = await Promise.allSettled(
          segments.map(async (seg) => {
            const res = await fetch(`/api/Segment/GetConnectedOptions?tripId=${tripId}&segmentId=${seg.id}`);
            if (!res.ok) throw new Error(`Failed for segment ${seg.id}`);
            const options: OptionRef[] = await res.json();
            return { segmentId: seg.id, options };
          })
        );

        if (cancelled) return;

        const map: Record<number, OptionRef[]> = {};
        for (const r of results) {
          if (r.status === "fulfilled") {
            map[r.value.segmentId] = r.value.options;
          } else {
            console.warn("Connected options fetch failed:", r.reason);
          }
        }
        setConnectedBySegment(map);
      } catch (e) {
        console.error("Batch fetch connected options failed:", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [segments, tripId]);

  useEffect(() => {
    fetchUserPreferences();
    fetchTripName();
    fetchSegmentTypes();
    fetchSegments();
  }, [fetchUserPreferences, fetchTripName, fetchSegmentTypes, fetchSegments]);

  const handleEditSegment = (segment: Segment) => {
    setEditingSegment(segment);
    setIsModalOpen(true);
  };

  const handleCreateSegment = () => {
    setEditingSegment(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSegment(null);
  };

  const handleSaveSegment = async (
    segmentData: SegmentSave,
    isUpdate: boolean,
    originalSegmentId?: number
  ) => {
    try {
      let response: Response;
      if (isUpdate && originalSegmentId) {
        response = await fetch(`/api/Segment/UpdateSegment?tripId=${tripId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...segmentData, id: originalSegmentId }),
        });
      } else {
        response = await fetch(`/api/Segment/CreateSegment?tripId=${tripId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(segmentData),
        });
      }
      if (!response.ok) throw new Error("Failed to save segment");

      handleCloseModal();
      await fetchSegments();
    } catch (err) {
      console.error("Error saving segment:", err);
      setError("An error occurred while saving the segment");
    }
  };

  const availableLocations = useMemo(() => {
    const labels = new Set<string>()
    segments.forEach((segment) => {
      const startLoc = (segment as any).startLocation ?? (segment as any).StartLocation ?? null
      const endLoc = (segment as any).endLocation ?? (segment as any).EndLocation ?? null
      const startLabel = getLocationLabel(startLoc)
      const endLabel = getLocationLabel(endLoc)
      if (startLabel) labels.add(startLabel)
      if (endLabel) labels.add(endLabel)
    })
    return Array.from(labels)
  }, [segments])

  const availableSegmentTypes = useMemo(() => {
    const ids = new Set<number>()
    segments.forEach((segment) => ids.add(segment.segmentTypeId))
    return segmentTypes.filter((type) => ids.has(type.id))
  }, [segments, segmentTypes])

  const dateBounds = useMemo(() => {
    if (!segments.length) return { min: "", max: "" }
    let min: number | null = null
    let max: number | null = null
    segments.forEach((segment) => {
      const start = new Date(segment.startDateTimeUtc).getTime()
      const end = new Date(segment.endDateTimeUtc).getTime()
      if (!Number.isNaN(start)) min = min === null ? start : Math.min(min, start)
      if (!Number.isNaN(end)) max = max === null ? end : Math.max(max, end)
    })
    return {
      min: min !== null ? new Date(min).toISOString().split("T")[0] : "",
      max: max !== null ? new Date(max).toISOString().split("T")[0] : "",
    }
  }, [segments])

  const filteredSegments = useMemo(() => {
    const startDate = filterState.dateRange.start ? new Date(filterState.dateRange.start) : null
    if (startDate) startDate.setHours(0, 0, 0, 0)
    const endDate = filterState.dateRange.end ? new Date(filterState.dateRange.end) : null
    if (endDate) endDate.setHours(23, 59, 59, 999)

    return segments.filter((segment) => {
      if (!filterState.showHidden && segment.isUiVisible === false) return false

      const startLoc = (segment as any).startLocation ?? (segment as any).StartLocation ?? null
      const endLoc = (segment as any).endLocation ?? (segment as any).EndLocation ?? null
      const startLabel = getLocationLabel(startLoc)
      const endLabel = getLocationLabel(endLoc)

      if (filterState.locations.length > 0 && !filterState.locations.some((loc) => loc === startLabel || loc === endLabel)) {
        return false
      }

      if (filterState.types.length > 0 && !filterState.types.includes(segment.segmentTypeId.toString())) {
        return false
      }

      if (startDate || endDate) {
        const segmentStart = new Date(segment.startDateTimeUtc)
        const segmentEnd = new Date(segment.endDateTimeUtc)
        if (startDate && segmentStart < startDate && segmentEnd < startDate) return false
        if (endDate && segmentStart > endDate && segmentEnd > endDate) return false
      }

      return true
    })
  }, [segments, filterState])

  const sortedSegments = useMemo(() => {
    const typeNameMap = new Map(segmentTypes.map((t) => [t.id, t.name ?? ""]))
    const list = [...filteredSegments]
    const compare = (a: Segment, b: Segment) => {
      if (!sortState) {
        const diff = new Date(a.startDateTimeUtc).getTime() - new Date(b.startDateTimeUtc).getTime()
        if (diff !== 0) return diff
        return a.name.localeCompare(b.name)
      }

      const dir = sortState.direction === "asc" ? 1 : -1

      switch (sortState.field) {
        case "startDate":
          return dir * (new Date(a.startDateTimeUtc).getTime() - new Date(b.startDateTimeUtc).getTime())
        case "endDate":
          return dir * (new Date(a.endDateTimeUtc).getTime() - new Date(b.endDateTimeUtc).getTime())
        case "segmentType": {
          const nameA = typeNameMap.get(a.segmentTypeId) ?? ""
          const nameB = typeNameMap.get(b.segmentTypeId) ?? ""
          return dir * nameA.localeCompare(nameB)
        }
        case "startLocation": {
          const nameA = getLocationLabel((a as any).startLocation ?? (a as any).StartLocation ?? null)
          const nameB = getLocationLabel((b as any).startLocation ?? (b as any).StartLocation ?? null)
          return dir * nameA.localeCompare(nameB)
        }
        case "endLocation": {
          const nameA = getLocationLabel((a as any).endLocation ?? (a as any).EndLocation ?? null)
          const nameB = getLocationLabel((b as any).endLocation ?? (b as any).EndLocation ?? null)
          return dir * nameA.localeCompare(nameB)
        }
        default:
          return 0
      }
    }

    return list.sort(compare)
  }, [filteredSegments, sortState, segmentTypes])

  if (!tripId) {
    return <div>No trip ID provided</div>;
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
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
        <SegmentFilterPanel
          value={filterState}
          onChange={setFilterState}
          sort={sortState}
          onSortChange={setSortState}
          availableLocations={availableLocations}
          availableTypes={availableSegmentTypes}
          minDate={dateBounds.min}
          maxDate={dateBounds.max}
        />

        {isLoading ? (
          <LoadingGridSkeleton />
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {sortedSegments.length === 0 ? (
              <p className="text-sm text-muted-foreground col-span-full text-center">No segments to display.</p>
            ) : (
              sortedSegments.map((segment) => {
                const segmentType = segmentTypes.find((st) => st.id === segment.segmentTypeId)
                const connected = connectedBySegment[segment.id] || []
                return (
                  <SegmentCard
                    key={segment.id}
                    segment={segment}
                    segmentType={segmentType}
                    userPreferredOffset={userPreferredOffset}
                    onEdit={handleEditSegment}
                    connectedOptions={connected}
                    showVisibilityIndicator={filterState.showHidden}
                  />
                )
              })
            )}
          </div>
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
  );
}

function LoadingGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-40 w-full" />
      ))}
    </div>
  );
}
