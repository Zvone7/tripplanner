// components/OptionsPageContent.tsx
"use client";

import { Fragment, useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { Button } from "../components/ui/button";
import { PlusIcon, LayoutIcon, EditIcon, TrashIcon } from "lucide-react";
import OptionModal from "./OptionModal";
import { formatDateStr } from "../utils/formatters";

// shared API types
import type { OptionApi, OptionSave, SegmentApi, SegmentType } from "../types/models";

/* ---------------------------------- helpers ---------------------------------- */

const CURRENCY = "$";

const formatMoney = (n?: number | null) =>
  typeof n === "number" && !Number.isNaN(n) ? `${CURRENCY}${n.toFixed(2)}` : "—";

// Normalize backend enum/string keys into { Accommodation, Transport, Other }
function normalizeCostPerType(raw?: Record<string | number, number> | null) {
  const out = { Accommodation: 0, Transport: 0, Other: 0 };
  if (!raw) return out;

  for (const key of Object.keys(raw)) {
    const rawVal = (raw as any)[key];
    const val = Number(rawVal) || 0;

    const lower = String(key).toLowerCase();
    if (lower.includes("accom")) { out.Accommodation += val; continue; }
    if (lower.includes("trans")) { out.Transport += val; continue; }
    if (lower.includes("other")) { out.Other += val; continue; }

    // fallback enum numbers: 0=Accommodation, 1=Transport, 2=Other
    const asNum = Number(key);
    if (!Number.isNaN(asNum)) {
      if (asNum === 0) out.Accommodation += val;
      else if (asNum === 1) out.Transport += val;
      else if (asNum === 2) out.Other += val;
    }
  }
  return out;
}

function percent(part: number, total: number) {
  if (!total || total <= 0) return 0;
  return Math.max(0, (part / total) * 100);
}

/* ---------------------------------- UI bits ---------------------------------- */

function CostSplitBar({
  accommodation,
  transport,
  other,
}: {
  accommodation: number;
  transport: number;
  other: number;
}) {
  const total = accommodation + transport + other;
  const a = percent(accommodation, total);
  const t = percent(transport, total);
  const o = percent(other, total);

  return (
    <div className="w-full">
      <div className="h-3 w-full rounded-full overflow-hidden bg-muted flex ring-1 ring-border/50">
        {/* Transport (light blue) */}
        <div className="h-full bg-sky-200" style={{ width: `${t}%` }} title={`Transport: ${formatMoney(transport)}`} />
        {/* Accommodation (light green) */}
        <div className="h-full bg-green-200" style={{ width: `${a}%` }} title={`Accommodation: ${formatMoney(accommodation)}`} />
        {/* Other (gray) */}
        <div className="h-full bg-gray-300" style={{ width: `${o}%` }} title={`Other: ${formatMoney(other)}`} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-sky-200" />
          Transport ({formatMoney(transport)})
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-green-200" />
          Accommodation ({formatMoney(accommodation)})
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-gray-300" />
          Other ({formatMoney(other)})
        </span>
      </div>
    </div>
  );
}

function CostSummary({ option }: { option: OptionApi }) {
  const split = useMemo(() => normalizeCostPerType(option.costPerType), [option.costPerType]);
  return (
    <div className="rounded-md border p-3 space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-sm font-medium">Costs</div>
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">{formatMoney(option.totalCost)}</span>{" "}
          <span className="font-medium">
            ({option.totalDays} {option.totalDays === 1 ? "day" : "days"} at {formatMoney(option.costPerDay)} per day)
          </span>
        </div>
      </div>
      <CostSplitBar
        accommodation={split.Accommodation}
        transport={split.Transport}
        other={split.Other}
      />
    </div>
  );
}

type ConnectedSegment = SegmentApi & { segmentType: SegmentType };

function SegmentDiagram({ segments }: { segments: ConnectedSegment[] }) {
  const sorted = [...segments].sort((a, b) => {
    if (a.startDateTimeUtc && b.startDateTimeUtc) {
      return new Date(a.startDateTimeUtc).getTime() - new Date(b.startDateTimeUtc).getTime();
    }
    return 0;
  });

  const segmentWidth = sorted.length ? 100 / sorted.length : 100;

  return (
    <div className="flex w-full space-x-1 overflow-x-auto py-2">
      {sorted.map((segment) => (
        <div
          key={segment.id}
          className="flex-grow relative"
          style={{ width: `${segmentWidth}%`, minWidth: "80px" }}
        >
          <div
            className="h-12 flex items-center justify-center relative overflow-hidden rounded-md"
            style={{
              backgroundColor: segment.segmentType.color,
              clipPath: "polygon(0 0, 90% 0, 100% 50%, 90% 100%, 0 100%, 10% 50%)",
            }}
            title={`${segment.segmentType.name} - ${segment.name}`}
          >
            <div className="relative z-10 flex items-center justify-center w-8 h-8">
              <div dangerouslySetInnerHTML={{ __html: segment.segmentType.iconSvg }} className="w-6 h-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------- Card ---------------------------------- */
function OptionCard({
  option,
  connectedSegments,
  onEdit,
  onDelete,
}: {
  option: OptionApi;
  connectedSegments: ConnectedSegment[];
  onEdit: (option: OptionApi) => void;
  onDelete: (optionId: number) => void;
}) {
  return (
    <Card className="hover:shadow-sm transition-shadow border">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold tracking-tight">
              {option.name}
            </CardTitle>

            {/* Use a div instead of CardDescription to avoid <div> inside <p> */}
            <div className="mt-1 text-sm text-muted-foreground">
              <div>{option.startDateTimeUtc ? formatDateStr(option.startDateTimeUtc) : "N/A"}</div>
              <div>{option.endDateTimeUtc ? formatDateStr(option.endDateTimeUtc) : "N/A"}</div>
            </div>
          </div>

          <div className="flex space-x-1 ml-4 shrink-0">
            <Button variant="ghost" size="icon" onClick={() => onEdit(option)} aria-label="Edit option">
              <EditIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(option.id);
              }}
              aria-label="Delete option"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        <CostSummary option={option} />
        <SegmentDiagram segments={connectedSegments} />
      </CardContent>
    </Card>
  );
}


/* ----------------------------------- Page ----------------------------------- */

export default function OptionsPageContent() {
  const [options, setOptions] = useState<OptionApi[]>([]);
  const [segments, setSegments] = useState<SegmentApi[]>([]);
  const [segmentTypes, setSegmentTypes] = useState<SegmentType[]>([]);
  const [connectedSegments, setConnectedSegments] = useState<Record<number, ConnectedSegment[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<OptionApi | null>(null);
  const [tripName, setTripName] = useState<string>("");

  const searchParams = useSearchParams();
  const tripId = searchParams.get("tripId");
  const router = useRouter();

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

  const fetchOptions = useCallback(async () => {
    if (!tripId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/Option/GetOptionsByTripId?tripId=${tripId}`);
      if (!response.ok) throw new Error("Failed to fetch options");
      const data: OptionApi[] = await response.json();
      setOptions(data); // expects totalCost, totalDays, costPerDay, costPerType
    } catch (err) {
      setError("An error occurred while fetching options");
      console.error("Error fetching options:", err);
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  const fetchSegments = useCallback(async () => {
    if (!tripId) return;
    try {
      const response = await fetch(`/api/Segment/GetSegmentsByTripId?tripId=${tripId}`);
      if (!response.ok) throw new Error("Failed to fetch segments");
      const data: SegmentApi[] = await response.json();
      setSegments(data);
    } catch (err) {
      console.error("Error fetching segments:", err);
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
    }
  }, []);

  const getConnectedSegments = useCallback(
    async (optionId: number): Promise<ConnectedSegment[]> => {
      try {
        const response = await fetch(`/api/Option/GetConnectedSegments?tripId=${tripId}&optionId=${optionId}`);
        if (!response.ok) throw new Error("Failed to fetch connected segments");
        const connected: SegmentApi[] = await response.json();
        return connected.map((segment) => ({
          ...segment,
          segmentType:
            segmentTypes.find((st) => st.id === segment.segmentTypeId) || {
              id: 0,
              shortName: "Unknown",
              name: "Unknown",
              description: "Unknown segment type",
              color: "#CCCCCC",
              iconSvg: "<svg></svg>",
            },
        }));
      } catch (error) {
        console.error("Error fetching connected segments:", error);
        return [];
      }
    },
    [segmentTypes, tripId]
  );

  useEffect(() => {
    fetchTripName();
    fetchOptions();
    fetchSegments();
    fetchSegmentTypes();
  }, [fetchTripName, fetchOptions, fetchSegments, fetchSegmentTypes]);

  useEffect(() => {
    const fetchAllConnected = async () => {
      const map: Record<number, ConnectedSegment[]> = {};
      for (const option of options) {
        map[option.id] = await getConnectedSegments(option.id);
      }
      setConnectedSegments(map);
    };
    if (options.length > 0 && segmentTypes.length > 0) {
      void fetchAllConnected();
    }
  }, [options, segmentTypes, getConnectedSegments]);

  const handleEditOption = (option: OptionApi) => {
    setEditingOption(option);
    setIsModalOpen(true);
  };

  const handleCreateOption = () => {
    setEditingOption(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingOption(null);
  };

  const handleSaveOption = async (optionData: OptionSave) => {
    try {
      let response: Response;
      if (editingOption) {
        response = await fetch(`/api/Option/UpdateOption?tripId=${tripId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...optionData, id: editingOption.id }),
        });
      } else {
        response = await fetch(`/api/Option/CreateOption?tripId=${tripId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(optionData),
        });
      }
      if (!response.ok) throw new Error("Failed to save option");
      handleCloseModal();
      await fetchOptions();
    } catch (err) {
      console.error("Error saving option:", err);
      setError("An error occurred while saving the option");
    }
  };

  const handleDeleteOption = async (optionId: number) => {
    if (window.confirm("Are you sure you want to delete this option?")) {
      try {
        const response = await fetch(`/api/Option/DeleteOption?tripId=${tripId}&optionId=${optionId}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to delete option");
        await fetchOptions();
      } catch (err) {
        console.error("Error deleting option:", err);
        setError("An error occurred while deleting the option");
      }
    }
  };

  if (!tripId) {
    return <div>No trip ID provided</div>;
  }

  return (
    <Card className="w-full max-w-5xl mx-auto">
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
          // Responsive card grid: 1 col on mobile, 2 on md, 3 on xl
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
        )}
      </CardContent>

      <OptionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveOption}
        option={editingOption ?? undefined}
        tripId={Number(tripId)}
        refreshOptions={fetchOptions}
      />
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-56 w-full" />
      ))}
    </div>
  );
}
