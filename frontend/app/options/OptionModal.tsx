// components/OptionModal.tsx
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogTitle } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ScrollArea } from "../components/ui/scroll-area";
import { toast } from "../components/ui/use-toast";
import { Checkbox } from "../components/ui/checkbox";
import { Switch } from "../components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { SaveIcon, Trash2Icon, EyeOffIcon, SlidersHorizontal } from "lucide-react";
import type { SegmentType, SegmentApi, OptionApi, OptionSave, Currency, CurrencyConversion } from "../types/models";
import { cn } from "../lib/utils";
import { TitleTokens } from "../components/TitleTokens";
import {
  buildOptionTitleTokens,
  buildSegmentTitleTokens,
  buildSegmentConfigFromApi,
  summarizeSegmentsForOption,
  tokensToLabel,
} from "../utils/formatters";
import { formatCurrencyAmount, formatConvertedAmount } from "../utils/currency";
import { optionsApi, segmentsApi } from "../utils/apiClient";

const arraysEqual = (a: number[], b: number[]) => a.length === b.length && a.every((val, idx) => val === b[idx])
type DiagramSegment = SegmentApi & { segmentType: SegmentType }

const SEGMENT_COLOR_PALETTE = [
  "#0ea5e9",
  "#22c55e",
  "#f97316",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#6366f1",
]

interface OptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (option: OptionSave) => Promise<void> | void;
  option?: OptionApi | null;
  tripId: number;
  refreshOptions: () => void;
  tripCurrencyId: number | null;
  displayCurrencyId: number | null;
  currencies: Currency[];
  conversions: CurrencyConversion[];
}

export default function OptionModal({
  isOpen,
  onClose,
  onSave,
  option,
  tripId,
  refreshOptions,
  tripCurrencyId,
  displayCurrencyId,
  currencies,
  conversions,
}: OptionModalProps) {
  const [name, setName] = useState("");
  const [segments, setSegments] = useState<SegmentApi[]>([]);
  const [segmentTypes, setSegmentTypes] = useState<SegmentType[]>([]);
  const [selectedSegments, setSelectedSegments] = useState<number[]>([]);
  const [isUiVisible, setIsUiVisible] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [baselineReady, setBaselineReady] = useState(!option);
  const optionBaselineRef = useRef<{ name: string; isUiVisible: boolean } | null>(
    option ? { name: option.name ?? "", isUiVisible: option.isUiVisible ?? true } : null,
  );
  const initialSelectedSegmentsRef = useRef<number[] | null>(null);
  const [segmentsFilterOpen, setSegmentsFilterOpen] = useState(false);
  const [showHiddenSegmentsFilter, setShowHiddenSegmentsFilter] = useState(false);
  const resolvedDisplayCurrencyId = displayCurrencyId ?? tripCurrencyId ?? null;

  const formatSegmentCost = useCallback(
    (segment: SegmentApi) => {
      if (segment.cost === null || segment.cost === undefined) return null
      return (
        formatConvertedAmount({
          amount: segment.cost,
          fromCurrencyId: segment.currencyId ?? tripCurrencyId ?? null,
          toCurrencyId: resolvedDisplayCurrencyId,
          currencies,
          conversions,
        }) ?? formatCurrencyAmount(segment.cost, segment.currencyId ?? tripCurrencyId ?? null, currencies)
      )
    },
    [tripCurrencyId, resolvedDisplayCurrencyId, currencies, conversions],
  )

  // fetch user offset (for time formatting)

  const fetchSegments = useCallback(async () => {
    try {
      const data = await segmentsApi.getByTripId(tripId);
      setSegments(data);
    } catch (error) {
      console.error("Error fetching segments:", error);
      toast({ title: "Error", description: "Failed to fetch segments. Please try again." });
    }
  }, [tripId, toast]);

  const fetchSegmentTypes = useCallback(async () => {
    try {
      const data = await segmentsApi.getTypes();
      setSegmentTypes(data);
    } catch (error) {
      console.error("Error fetching segment types:", error);
      toast({ title: "Error", description: "Failed to fetch segment types. Please try again." });
    }
  }, [toast]);

  const fetchConnectedSegments = useCallback(
    async (optionId: number) => {
      try {
        const data = await optionsApi.getConnectedSegments(tripId, optionId);
        const ids = data.map((segment) => segment.id);
        setSelectedSegments(ids);
        initialSelectedSegmentsRef.current = [...ids].sort((a, b) => a - b);
        setBaselineReady(true);
      } catch (error) {
        console.error("Error fetching connected segments:", error);
        toast({ title: "Error", description: "Failed to fetch connected segments. Please try again." });
        setBaselineReady(true);
      }
    },
    [tripId, toast],
  );

  useEffect(() => {
    if (option) {
      optionBaselineRef.current = { name: option.name ?? "", isUiVisible: option.isUiVisible ?? true };
      setBaselineReady(false);
      initialSelectedSegmentsRef.current = null;
      setName(option.name);
      setIsUiVisible(option.isUiVisible ?? true);
      void fetchConnectedSegments(option.id);
    } else {
      optionBaselineRef.current = null;
      initialSelectedSegmentsRef.current = null;
      setBaselineReady(true);
      setName("");
      setSelectedSegments([]);
      setIsUiVisible(true);
    }
    void fetchSegments();
    void fetchSegmentTypes();
  }, [option, fetchConnectedSegments, fetchSegments, fetchSegmentTypes]);

  useEffect(() => {
    setSegmentsFilterOpen(false);
    setShowHiddenSegmentsFilter(false);
  }, [option?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaveDisabled) return;

    const payload: OptionSave = {
      name,
      startDateTimeUtc: null,
      endDateTimeUtc: null,
      tripId,
      costPerDay: 0,
      costPerType: {},
      isUiVisible,
    };

    await onSave(payload);

    if (option) {
      await handleUpdateConnectedSegments();
    }

    handleClose();
  };

  const handleUpdateConnectedSegments = async () => {
    if (!option) return;

    try {
      await optionsApi.updateConnectedSegments(tripId, option.id, selectedSegments);

      toast({ title: "Success", description: "Connected segments updated successfully" });
      refreshOptions();
      handleClose();
    } catch (error) {
      console.error("Error updating connected segments:", error);
      toast({ title: "Error", description: "Failed to update connected segments. Please try again." });
    }
  };

  const handleSegmentCheckedChange = (segmentId: number, checkedState: boolean | "indeterminate") => {
    const checked = checkedState === true;
    setSelectedSegments((prev) => {
      if (checked) return prev.includes(segmentId) ? prev : [...prev, segmentId];
      return prev.includes(segmentId) ? prev.filter((id) => id !== segmentId) : prev;
    });
  };

  const handleClose = () => {
    onClose();
  };

  const handleDelete = async () => {
    if (!option) return;
    try {
      await optionsApi.remove(tripId, option.id);
      toast({ title: "Deleted", description: `"${option.name}" has been removed.` });
      setShowDeleteConfirm(false);
      refreshOptions();
      handleClose();
    } catch (error) {
      console.error("Error deleting option:", error);
      toast({ title: "Error", description: "Failed to delete option. Please try again." });
    }
  };

  const isEditing = Boolean(option);

  const hasChanges = useMemo(() => {
    if (!isEditing) return true;
    if (!baselineReady) return false;
    const baseline = optionBaselineRef.current;
    const baselineSegments = initialSelectedSegmentsRef.current;
    if (!baseline || baselineSegments === null) return false;
    if (baseline.name !== name) return true;
    if (baseline.isUiVisible !== isUiVisible) return true;
    const sortedCurrent = [...selectedSegments].sort((a, b) => a - b);
    if (!arraysEqual(sortedCurrent, baselineSegments)) return true;
    return false;
  }, [isEditing, baselineReady, name, isUiVisible, selectedSegments]);

  const isSaveDisabled = isEditing ? !hasChanges : false;

  const filteredSegmentsForDisplay = useMemo(() => {
    if (!option) return [];
    if (showHiddenSegmentsFilter) return segments;
    return segments.filter((segment) => segment.isUiVisible !== false);
  }, [option, segments, showHiddenSegmentsFilter]);

  const selectedSegmentEntities = useMemo(() => {
    if (selectedSegments.length === 0) return [];
    const byId = new Map<number, SegmentApi>();
    segments.forEach((segment) => byId.set(segment.id, segment));
    return selectedSegments
      .map((id) => byId.get(id))
      .filter((segment): segment is SegmentApi => Boolean(segment));
  }, [segments, selectedSegments]);

  const selectedConnectedSegments = useMemo(() => {
    return selectedSegmentEntities
      .map((segment) => {
        const segmentType = segmentTypes.find((st) => st.id === segment.segmentTypeId)
        if (!segmentType) return null
        return { ...segment, segmentType }
      })
      .filter((segment): segment is DiagramSegment => Boolean(segment))
  }, [selectedSegmentEntities, segmentTypes])

  const optionTitleTokens = useMemo(() => {
    const derived = summarizeSegmentsForOption(selectedSegmentEntities);
    return buildOptionTitleTokens({
      name,
      fallbackName: option?.name || "New option",
      segmentCount: derived.segmentCount ?? null,
      startLocationLabel: derived.startLocationLabel ?? undefined,
      endLocationLabel: derived.endLocationLabel ?? undefined,
      startDateIso: derived.startDateIso ?? option?.startDateTimeUtc ?? null,
      endDateIso: derived.endDateIso ?? option?.endDateTimeUtc ?? null,
      startOffset: derived.startOffset ?? (option ? 0 : null),
      endOffset: derived.endOffset ?? (option ? 0 : null),
      totalCost: derived.totalCost ?? option?.totalCost ?? null,
    });
  }, [name, option, selectedSegmentEntities]);

  const defaultOptionTitle = option ? `Edit Option: ${option.name}` : "Create Option";
  const optionTitleText = tokensToLabel(optionTitleTokens) || defaultOptionTitle;
  const optionTitleDisplay: ReactNode = optionTitleTokens.length ? (
    <TitleTokens tokens={optionTitleTokens} />
  ) : (
    <span className="inline-flex items-center gap-1">{defaultOptionTitle}</span>
  );
  const optionTitleDescription = option ? "Editing existing option" : "Creating new option";

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg w-full p-0 flex flex-col">
          <DialogTitle className="sr-only">{optionTitleText}</DialogTitle>
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="border-b bg-background px-4 py-3">
              <div className="mb-3 space-y-1">
                <h2 className="text-lg font-semibold leading-snug flex flex-wrap gap-x-1 gap-y-0.5">
                  {optionTitleDisplay}
                </h2>
                <p className="text-xs text-muted-foreground">{optionTitleDescription}</p>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-2 text-sm">
                  <Label htmlFor="option-ui-visible" className="cursor-pointer">
                    {isUiVisible ? "UI visible" : "UI hidden"}
                  </Label>
                  <Switch id="option-ui-visible" checked={isUiVisible} onCheckedChange={setIsUiVisible} />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {isEditing && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="bg-red-700 hover:bg-red-800 text-white"
                      title="Delete option"
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                  disabled={isSaveDisabled}
                >
                  <SaveIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {/* Name */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right text-sm">
                  Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>

            {/* Connected segments (edit only) */}
            {option && (
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2 text-sm">Connected Segments</Label>
                <div className="col-span-3">
                  <div className="flex justify-end mb-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Toggle segment filters"
                      onClick={() => setSegmentsFilterOpen((prev) => !prev)}
                    >
                      <SlidersHorizontal
                        className={cn(
                          "h-4 w-4 transition-transform",
                          segmentsFilterOpen ? "text-primary rotate-90" : "text-muted-foreground"
                        )}
                      />
                    </Button>
                  </div>
                  {segmentsFilterOpen && (
                    <div className="flex items-center justify-end gap-2 mb-3 text-xs text-muted-foreground">
                      <span>Show hidden</span>
                      <Switch
                        checked={showHiddenSegmentsFilter}
                        onCheckedChange={(checked) => setShowHiddenSegmentsFilter(Boolean(checked))}
                        aria-label="Show hidden segments"
                      />
                    </div>
                  )}
                  <ScrollArea className="h-[300px] border rounded-md p-3">
                    {filteredSegmentsForDisplay.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No segments available.</p>
                    ) : (
                      filteredSegmentsForDisplay.map((segment) => {
                        const segmentType = segmentTypes.find((st) => st.id === segment.segmentTypeId) ?? null;
                        const segmentCostLabel = formatSegmentCost(segment);
                        const segmentConfig = buildSegmentConfigFromApi(segment, segmentType ?? undefined);
                        const tokens = buildSegmentTitleTokens({
                          ...segmentConfig,
                          cost: segmentCostLabel ?? segmentConfig.cost,
                        });
                        const summaryLabel = tokensToLabel(tokens) || segment.name;
                        const isHiddenSegment = segment.isUiVisible === false;
                        const dimmed = showHiddenSegmentsFilter && isHiddenSegment;

                        return (
                          <label
                            key={segment.id}
                            htmlFor={`segment-${segment.id}`}
                            className={cn(
                              "flex items-start gap-3 p-2 rounded-md hover:bg-muted/60 cursor-pointer",
                              dimmed && "bg-muted text-muted-foreground"
                            )}
                          >
                            <Checkbox
                              id={`segment-${segment.id}`}
                              checked={selectedSegments.includes(segment.id)}
                              onCheckedChange={(checked) => handleSegmentCheckedChange(segment.id, checked)}
                              className="mt-1"
                              aria-label={`Select ${summaryLabel}`}
                            />

                            <div className="flex-1 min-w-0" aria-label={summaryLabel}>
                              <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-sm">
                                <TitleTokens tokens={tokens} size="sm" />
                              </div>
                              {segmentCostLabel ? (
                                <div className="text-xs text-muted-foreground mt-0.5">{segmentCostLabel}</div>
                              ) : null}
                            </div>
                            {dimmed && <EyeOffIcon className="h-4 w-4 mt-1" aria-hidden="true" />}
                          </label>
                        );
                      })
                    )}
                  </ScrollArea>
                  {selectedConnectedSegments.length > 0 ? (
                    <div className="mt-4">
                      <SegmentDiagram segments={selectedConnectedSegments} />
                    </div>
                  ) : null}
                </div>
              </div>
            )}
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {option && (
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Option</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{option.name}&quot;? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-700 hover:bg-red-800 text-white"
              >
                Yes, Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}

function SegmentDiagram({ segments }: { segments: DiagramSegment[] }) {
  const sorted = [...segments].sort((a, b) => {
    if (a.startDateTimeUtc && b.startDateTimeUtc) {
      return new Date(a.startDateTimeUtc).getTime() - new Date(b.startDateTimeUtc).getTime()
    }
    return 0
  })

  const segmentWidth = sorted.length ? 100 / sorted.length : 100

  return (
    <div className="mt-2 flex w-full space-x-1 overflow-x-auto py-2">
      {sorted.map((segment, index) => {
        const paletteColor = SEGMENT_COLOR_PALETTE[index % SEGMENT_COLOR_PALETTE.length]
        const bgColor = segment.segmentType.color?.trim() ? segment.segmentType.color : paletteColor
        return (
          <div key={segment.id} className="flex-grow" style={{ width: `${segmentWidth}%`, minWidth: "80px" }}>
            <div
              className="relative flex h-12 items-center justify-center overflow-hidden rounded-md shadow-lg ring-1 ring-black/10 dark:ring-white/20"
              style={{
                backgroundColor: bgColor,
                clipPath: "polygon(0 0, 90% 0, 100% 50%, 90% 100%, 0 100%, 10% 50%)",
              }}
              title={`${segment.segmentType.name} - ${segment.name}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/25 to-transparent mix-blend-overlay pointer-events-none" />
              <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-black shadow-md">
                {segment.segmentType.iconSvg ? (
                  <div
                    className="h-5 w-5"
                    dangerouslySetInnerHTML={{ __html: segment.segmentType.iconSvg as string }}
                    suppressHydrationWarning
                  />
                ) : null}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
