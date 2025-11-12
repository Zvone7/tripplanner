// components/OptionModal.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
import type { SegmentType, SegmentApi, OptionApi, OptionSave } from "../types/models";
import { formatDateWithUserOffset } from "../utils/formatters";
import { cn } from "../lib/utils";

interface OptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (option: OptionSave) => Promise<void> | void;
  option?: OptionApi | null;
  tripId: number;
  refreshOptions: () => void;
}

interface UserPreference {
  preferredUtcOffset: number;
}
interface User {
  userPreference: UserPreference;
}

export default function OptionModal({
  isOpen,
  onClose,
  onSave,
  option,
  tripId,
  refreshOptions,
}: OptionModalProps) {
  const [name, setName] = useState("");
  const [segments, setSegments] = useState<SegmentApi[]>([]);
  const [segmentTypes, setSegmentTypes] = useState<SegmentType[]>([]);
  const [selectedSegments, setSelectedSegments] = useState<number[]>([]);
  const [userPreferredOffset, setUserPreferredOffset] = useState<number>(0);
  const [isUiVisible, setIsUiVisible] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [segmentsFilterOpen, setSegmentsFilterOpen] = useState(false);
  const [showHiddenSegmentsFilter, setShowHiddenSegmentsFilter] = useState(false);

  // fetch user offset (for time formatting)
  const fetchUserPreferences = useCallback(async () => {
    try {
      const res = await fetch("/api/account/info");
      if (!res.ok) throw new Error("prefs");
      const data: User = await res.json();
      setUserPreferredOffset(data.userPreference?.preferredUtcOffset ?? 0);
    } catch {
      setUserPreferredOffset(0);
    }
  }, []);

  useEffect(() => {
    if (option) {
      setName(option.name);
      setIsUiVisible(option.isUiVisible ?? true);
      void fetchConnectedSegments(option.id);
    } else {
      setName("");
      setSelectedSegments([]);
      setIsUiVisible(true);
    }
    void fetchUserPreferences();
    void fetchSegments();
    void fetchSegmentTypes();
  }, [option, fetchUserPreferences]);

  useEffect(() => {
    setSegmentsFilterOpen(false);
    setShowHiddenSegmentsFilter(false);
  }, [option?.id]);

  const fetchSegments = async () => {
    try {
      const response = await fetch(`/api/Segment/GetSegmentsByTripId?tripId=${tripId}`);
      if (!response.ok) throw new Error("Failed to fetch segments");
      const data: SegmentApi[] = await response.json();
      setSegments(data);
    } catch (error) {
      console.error("Error fetching segments:", error);
      toast({ title: "Error", description: "Failed to fetch segments. Please try again." });
    }
  };

  const fetchSegmentTypes = async () => {
    try {
      const response = await fetch("/api/Segment/GetSegmentTypes");
      if (!response.ok) throw new Error("Failed to fetch segment types");
      const data: SegmentType[] = await response.json();
      setSegmentTypes(data);
    } catch (error) {
      console.error("Error fetching segment types:", error);
      toast({ title: "Error", description: "Failed to fetch segment types. Please try again." });
    }
  };

  const fetchConnectedSegments = async (optionId: number) => {
    try {
      const response = await fetch(`/api/Option/GetConnectedSegments?tripId=${tripId}&optionId=${optionId}`);
      if (!response.ok) throw new Error("Failed to fetch connected segments");
      const data: SegmentApi[] = await response.json();
      setSelectedSegments(data.map((segment) => segment.id));
    } catch (error) {
      console.error("Error fetching connected segments:", error);
      toast({ title: "Error", description: "Failed to fetch connected segments. Please try again." });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      const response = await fetch(`/api/Option/UpdateConnectedSegments?tripId=${tripId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          OptionId: option.id,
          SegmentIds: selectedSegments,
        }),
      });

      if (!response.ok) throw new Error("Failed to update connected segments");

      toast({ title: "Success", description: "Connected segments updated successfully" });
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
    refreshOptions();
  };

  const handleDelete = async () => {
    if (!option) return;
    try {
      const response = await fetch(`/api/Option/DeleteOption?tripId=${tripId}&optionId=${option.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete option");
      toast({ title: "Deleted", description: `"${option.name}" has been removed.` });
      setShowDeleteConfirm(false);
      handleClose();
    } catch (error) {
      console.error("Error deleting option:", error);
      toast({ title: "Error", description: "Failed to delete option. Please try again." });
    }
  };

  const isEditing = Boolean(option);

  const filteredSegmentsForDisplay = useMemo(() => {
    if (!option) return [];
    if (showHiddenSegmentsFilter) return segments;
    return segments.filter((segment) => segment.isUiVisible !== false);
  }, [option, segments, showHiddenSegmentsFilter]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg w-full p-0 flex flex-col">
          <DialogTitle className="sr-only">{option ? `Edit Option: ${name}` : "Create Option"}</DialogTitle>
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="border-b bg-background px-4 py-3">
              <h2 className="text-lg font-semibold mb-3">{option ? `Edit Option: ${name}` : "Create Option"}</h2>

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
                <Button type="submit" size="sm" className="bg-primary hover:bg-primary/90">
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
                        const segmentType = segmentTypes.find((st) => st.id === segment.segmentTypeId);
                        const start = segment.startDateTimeUtc
                          ? formatDateWithUserOffset(segment.startDateTimeUtc, userPreferredOffset, false)
                          : "—";
                        const end = segment.endDateTimeUtc
                          ? formatDateWithUserOffset(segment.endDateTimeUtc, userPreferredOffset, false)
                          : "—";
                        const cost =
                          typeof segment.cost === "number" && !Number.isNaN(segment.cost)
                            ? `$${segment.cost.toFixed(2)}`
                            : "—";
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
                            />

                            <div className="flex-1 min-w-0">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 min-w-0">
                                  {(() => {
                                    const st = segmentType;
                                    if (!st) return null;

                                    const icon = st.iconSvg;
                                    return (
                                      <>
                                        {icon ? (
                                          <div
                                            className="w-4 h-4 shrink-0"
                                            dangerouslySetInnerHTML={{ __html: icon }}
                                          />
                                        ) : null}
                                        <span className="text-xs text-muted-foreground shrink-0">{st.name}</span>
                                      </>
                                    );
                                  })()}
                                  <span className="text-sm font-medium truncate">{segment.name}</span>
                                </div>
                              </div>

                              <div className="text-xs text-muted-foreground mt-1">
                                {(() => {
                                  const startLoc =
                                    (segment as any).startLocation ?? (segment as any).StartLocation ?? null;
                                  const startCity = startLoc?.name ? ` (${startLoc.name})` : "";
                                  return (
                                    <>
                                      Start: {start}
                                      {startCity}
                                    </>
                                  );
                                })()}
                              </div>

                              <div className="text-xs text-muted-foreground">
                                {(() => {
                                  const endLoc = (segment as any).endLocation ?? (segment as any).EndLocation ?? null;
                                  const endCity = endLoc?.name ? ` (${endLoc.name})` : "";
                                  return (
                                    <>
                                      End: {end}
                                      {endCity}
                                    </>
                                  );
                                })()}
                              </div>

                              <div className="text-xs text-muted-foreground">{cost}</div>
                            </div>
                            {dimmed && <EyeOffIcon className="h-4 w-4 mt-1" aria-hidden="true" />}
                          </label>
                        );
                      })
                    )}
                  </ScrollArea>
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
