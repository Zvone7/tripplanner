"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { PlusIcon, ListIcon, EditIcon, EyeOffIcon, SlidersHorizontal } from "lucide-react";
import SegmentModal from "../segments/SegmentModal";
import { formatDateWithUserOffset } from "../utils/formatters";
import { OptionBadge } from "../components/OptionBadge";
import { Switch } from "../components/ui/switch";
import { cn } from "../lib/utils";
import { MultiSelect } from "../components/ui/multiselect";

import type { Segment, SegmentType, OptionRef, User, SegmentSave } from "../types/models";

const getLocationLabel = (loc: any | null) => {
  if (!loc) return "";
  const name = loc.name ?? "";
  const country = loc.country ?? "";
  const label = country ? `${name}, ${country}` : name;
  return label;
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
                  {formatDateWithUserOffset(segment.startDateTimeUtc, userPreferredOffset)}
                  {startLoc ? ` (${getLocationLabel(startLoc)})` : ""}
                </div>
                <div>
                  {formatDateWithUserOffset(segment.endDateTimeUtc, userPreferredOffset)}
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showHiddenSegments, setShowHiddenSegments] = useState(false);
  const [locationFilters, setLocationFilters] = useState<string[]>([]);
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({ start: "", end: "" });

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

  const locationFilterOptions = useMemo(() => {
    const labels = new Set<string>();
    segments.forEach((segment) => {
      const startLoc = (segment as any).startLocation ?? (segment as any).StartLocation ?? null;
      const endLoc = (segment as any).endLocation ?? (segment as any).EndLocation ?? null;
      const startLabel = getLocationLabel(startLoc);
      const endLabel = getLocationLabel(endLoc);
      if (startLabel) labels.add(startLabel);
      if (endLabel) labels.add(endLabel);
    });
    return Array.from(labels)
      .sort((a, b) => a.localeCompare(b))
      .map((label) => ({ value: label, label }));
  }, [segments]);

  const segmentTypeFilterOptions = useMemo(() => {
    const ids = new Set<number>();
    segments.forEach((segment) => ids.add(segment.segmentTypeId));
    return Array.from(ids)
      .map((id) => segmentTypes.find((type) => type.id === id))
      .filter((type): type is SegmentType => Boolean(type))
      .map((type) => ({
        value: type.id.toString(),
        label: (
          <div className="flex items-center gap-2">
            {type.iconSvg ? (
              <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: type.iconSvg }} />
            ) : null}
            <span>{type.name}</span>
          </div>
        ),
      }));
  }, [segments, segmentTypes]);

  const filteredSegments = useMemo(() => {
    const startDate = dateFilter.start ? new Date(dateFilter.start) : null;
    if (startDate) startDate.setHours(0, 0, 0, 0);
    const endDate = dateFilter.end ? new Date(dateFilter.end) : null;
    if (endDate) endDate.setHours(23, 59, 59, 999);

    return segments.filter((segment) => {
      if (!showHiddenSegments && segment.isUiVisible === false) return false;

      const startLoc = (segment as any).startLocation ?? (segment as any).StartLocation ?? null;
      const endLoc = (segment as any).endLocation ?? (segment as any).EndLocation ?? null;
      const startLabel = getLocationLabel(startLoc);
      const endLabel = getLocationLabel(endLoc);

      if (
        locationFilters.length > 0 &&
        !locationFilters.some((loc) => loc === startLabel || loc === endLabel)
      ) {
        return false;
      }

      if (typeFilters.length > 0 && !typeFilters.includes(segment.segmentTypeId.toString())) {
        return false;
      }

      if (startDate || endDate) {
        const segmentStart = new Date(segment.startDateTimeUtc);
        const segmentEnd = new Date(segment.endDateTimeUtc);
        if (startDate && segmentStart < startDate && segmentEnd < startDate) return false;
        if (endDate && segmentStart > endDate && segmentEnd > endDate) return false;
      }

      return true;
    });
  }, [segments, showHiddenSegments, locationFilters, typeFilters, dateFilter]);

  const hasActiveFilters =
    locationFilters.length > 0 || typeFilters.length > 0 || Boolean(dateFilter.start) || Boolean(dateFilter.end);

  const resetFilters = () => {
    setLocationFilters([]);
    setTypeFilters([]);
    setDateFilter({ start: "", end: "" });
  };

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
        <div className="flex justify-end mb-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setFiltersOpen((prev) => !prev)}
            aria-label="Toggle sort and filter"
          >
            <SlidersHorizontal
              className={cn(
                "h-5 w-5 transition-transform",
                filtersOpen ? "text-primary rotate-90" : "text-muted-foreground"
              )}
            />
          </Button>
        </div>

        {filtersOpen && (
          <div className="space-y-4 rounded-md border p-4 mb-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="mb-1 block text-sm font-medium">Locations</Label>
                <MultiSelect
                  options={locationFilterOptions}
                  selected={locationFilters}
                  onChange={setLocationFilters}
                  placeholder="Select locations"
                />
              </div>
              <div>
                <Label className="mb-1 block text-sm font-medium">Segment types</Label>
                <MultiSelect
                  options={segmentTypeFilterOptions}
                  selected={typeFilters}
                  onChange={setTypeFilters}
                  placeholder="Select segment types"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="mb-1 block text-sm font-medium">Start date</Label>
                <Input
                  type="date"
                  value={dateFilter.start}
                  onChange={(e) => setDateFilter((prev) => ({ ...prev, start: e.target.value }))}
                />
              </div>
              <div>
                <Label className="mb-1 block text-sm font-medium">End date</Label>
                <Input
                  type="date"
                  value={dateFilter.end}
                  onChange={(e) => setDateFilter((prev) => ({ ...prev, end: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm">
                <span>Show hidden segments</span>
                <Switch
                  checked={showHiddenSegments}
                  onCheckedChange={(checked) => setShowHiddenSegments(Boolean(checked))}
                  aria-label="Show hidden segments"
                />
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  Reset filters
                </Button>
              )}
            </div>
          </div>
        )}

        {isLoading ? (
          <LoadingGridSkeleton />
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSegments.length === 0 ? (
              <p className="text-sm text-muted-foreground col-span-full text-center">No segments to display.</p>
            ) : (
              filteredSegments.map((segment) => {
                const segmentType = segmentTypes.find((st) => st.id === segment.segmentTypeId);
                const connected = connectedBySegment[segment.id] || [];
                return (
                  <SegmentCard
                    key={segment.id}
                    segment={segment}
                    segmentType={segmentType}
                    userPreferredOffset={userPreferredOffset}
                    onEdit={handleEditSegment}
                    connectedOptions={connected}
                    showVisibilityIndicator={showHiddenSegments}
                  />
                );
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
