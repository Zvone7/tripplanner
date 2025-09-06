// components/OptionModal.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ScrollArea } from "../components/ui/scroll-area";
import { toast } from "../components/ui/use-toast";
import { Checkbox } from "../components/ui/checkbox";
import type { SegmentType, SegmentApi, OptionApi, OptionSave } from "../types/models";
import { formatDateWithUserOffset } from "../utils/formatters";

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
      void fetchConnectedSegments(option.id);
    } else {
      setName("");
      setSelectedSegments([]);
    }
    void fetchUserPreferences();
    void fetchSegments();
    void fetchSegmentTypes();
  }, [option, fetchUserPreferences]);

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
      costPerType: {}
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{option ? "Edit Option" : "Create Option"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
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
                <Label className="text-right pt-2">Connected Segments</Label>
                <ScrollArea className="h-[300px] col-span-3 border rounded-md p-3">
                  {segments.map((segment) => {
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

                    return (
                      <label
                        key={segment.id}
                        htmlFor={`segment-${segment.id}`}
                        className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/60 cursor-pointer"
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
                                const st = segmentTypes.find((x) => x.id === segment.segmentTypeId);
                                if (!st) return null;

                                const icon = st.iconSvg; // string | undefined
                                return (
                                  <>
                                    {icon ? (
                                      <div
                                        className="w-4 h-4 shrink-0"
                                        // icon is truthy here ⇒ treated as string
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
                              const start = segment.startDateTimeUtc
                                ? formatDateWithUserOffset(segment.startDateTimeUtc, userPreferredOffset, false) // short date (incl. year), no time
                                : "—";
                              const startLoc =
                                (segment as any).startLocation ??
                                (segment as any).StartLocation ??
                                null;
                              const startCity = startLoc?.name ? ` (${startLoc.name})` : "";
                              return <>Start: {start}{startCity}</>;
                            })()}
                          </div>

                          {/* Row 3: End (date + city) */}
                          <div className="text-xs text-muted-foreground">
                            {(() => {
                              const end = segment.endDateTimeUtc
                                ? formatDateWithUserOffset(segment.endDateTimeUtc, userPreferredOffset, false) // short date (incl. year), no time
                                : "—";
                              const endLoc =
                                (segment as any).endLocation ??
                                (segment as any).EndLocation ??
                                null;
                              const endCity = endLoc?.name ? ` (${endLoc.name})` : "";
                              return <>End: {end}{endCity}</>;
                            })()}
                          </div>

                          <div className="text-xs text-muted-foreground">
                            {typeof segment.cost === "number" && !Number.isNaN(segment.cost)
                              ? `$${segment.cost.toFixed(2)}`
                              : "—"}
                          </div>
                        </div>
                      </label>

                    );
                  })}
                </ScrollArea>

              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
