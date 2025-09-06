// components/SegmentModal.tsx
"use client";

import type React from "react";
import type { JSX } from "react";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ScrollArea } from "../components/ui/scroll-area";
import { Textarea } from "../components/ui/textarea";
import { toast } from "../components/ui/use-toast";
import { Checkbox } from "../components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { CopyIcon } from "lucide-react";
import { toLocationDto, normalizeLocation } from "../lib/mapping";

// types
import type {
  SegmentModalProps,
  OptionRef as Option,
  User,
  SegmentSave,
  LocationOption,
  SegmentType,
} from "../types/models";

import {
  RangeDateTimePicker,
  type RangeDateTimePickerValue,
} from "../components/RangeDateTimePicker";

import {
  RangeLocationPicker,
  type RangeLocationPickerValue,
} from "../components/RangeLocationPicker";

import { localToUtcMs, utcMsToIso, utcIsoToLocalInput } from "../lib/utils";

/* ------------------------- comment preview helper ------------------------- */

const CommentDisplay: React.FC<{ text: string }> = ({ text }) => {
  const markdownLinkRegex = /\[([^\]]+)\]\(([^\)]+)\)/g;
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  let processedText = text;
  const linkReplacements: { placeholder: string; element: JSX.Element }[] = [];
  let replacementIndex = 0;

  processedText = processedText.replace(markdownLinkRegex, (_match, linkText, url) => {
    const placeholder = `__LINK_${replacementIndex}__`;
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
    });
    replacementIndex++;
    return placeholder;
  });

  processedText = processedText.replace(urlRegex, (match) => {
    const placeholder = `__LINK_${replacementIndex}__`;
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
    });
    replacementIndex++;
    return placeholder;
  });

  const parts = processedText.split(/(__LINK_\d+__)/g);

  return (
    <div className="whitespace-pre-wrap">
      {parts.map((part, index) => {
        const linkReplacement = linkReplacements.find((lr) => lr.placeholder === part);
        if (linkReplacement) return linkReplacement.element;
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
};

/* ------------------------------- main modal ------------------------------- */

export default function SegmentModal({
  isOpen,
  onClose,
  onSave,
  segment,
  tripId,
  segmentTypes,
}: SegmentModalProps) {
  const [name, setName] = useState("");
  const [range, setRange] = useState<RangeDateTimePickerValue>({
    startLocal: "",
    endLocal: null, // null => same as start
    startOffsetH: 0,
    endOffsetH: null, // null => same as start offset
  });

  // Keep prefilled locations to re-attach ids later
  const [prefilledStart, setPrefilledStart] = useState<LocationOption | null>(null);
  const [prefilledEnd, setPrefilledEnd] = useState<LocationOption | null>(null);

  const [locRange, setLocRange] = useState<RangeLocationPickerValue>({
    start: null,
    end: null, // null => no end
  });

  const [cost, setCost] = useState("");
  const [comment, setComment] = useState("");
  const [segmentTypeId, setSegmentTypeId] = useState<number | null>(null);
  const [options, setOptions] = useState<Option[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [optionsTouched, setOptionsTouched] = useState(false); // prevent async overwrite
  const [isDuplicateMode, setIsDuplicateMode] = useState(false);
  const [userPreferredOffset, setUserPreferredOffset] = useState<number>(0);

  // Fetch user preferences (preferred offset)
  const fetchUserPreferences = useCallback(async () => {
    try {
      const response = await fetch("/api/account/info");
      if (!response.ok) throw new Error("Failed to fetch user preferences");
      const userData: User = await response.json();
      setUserPreferredOffset(userData.userPreference?.preferredUtcOffset ?? 0);
    } catch (err) {
      console.error("Error fetching user preferences:", err);
      setUserPreferredOffset(0);
    }
  }, []);

  useEffect(() => {
    fetchUserPreferences();
  }, [fetchUserPreferences]);

  useEffect(() => {
    fetchOptions();
  }, [tripId]);

  useEffect(() => {
    setIsDuplicateMode(false);
    setOptionsTouched(false); // reset when opening/changing segment

    if (segment) {
      setName(segment.name);

      const sOff = segment.startDateTimeUtcOffset ?? 0;
      const eOff = segment.endDateTimeUtcOffset ?? sOff;

      const startLocal = utcIsoToLocalInput(segment.startDateTimeUtc, sOff);
      const endLocalRaw = utcIsoToLocalInput(segment.endDateTimeUtc, eOff);

      const endIsSame = segment.endDateTimeUtc === segment.startDateTimeUtc && eOff === sOff;

      setRange({
        startLocal,
        endLocal: endIsSame ? null : endLocalRaw,
        startOffsetH: sOff,
        endOffsetH: endIsSame ? null : eOff,
      });

      setCost(String(segment.cost));
      setComment(segment.comment || "");
      setSegmentTypeId(segment.segmentTypeId);

      // Prefill locations if backend provides them
      const startLocRaw = (segment as any)?.startLocation ?? (segment as any)?.StartLocation;
      const endLocRaw = (segment as any)?.endLocation ?? (segment as any)?.EndLocation;

      const startNorm = normalizeLocation(startLocRaw);
      const endNorm = normalizeLocation(endLocRaw);

      setPrefilledStart(startNorm ?? null);
      setPrefilledEnd(endNorm ?? null);

      setLocRange({
        start: startNorm ?? null,
        end: endNorm ?? null,
      });

      fetchConnectedOptions(segment.id);
    } else {
      // New segment → seed from user pref
      setName("");
      setRange({
        startLocal: "",
        endLocal: null,
        startOffsetH: userPreferredOffset ?? 0,
        endOffsetH: null,
      });
      setPrefilledStart(null);
      setPrefilledEnd(null);
      setLocRange({
        start: null,
        end: null,
      });
      setCost("");
      setComment("");
      setSegmentTypeId(null);
      setSelectedOptions([]);
    }
  }, [segment, userPreferredOffset]);

  const fetchOptions = async () => {
    try {
      const response = await fetch(`/api/Option/GetOptionsByTripId?tripId=${tripId}`);
      if (!response.ok) throw new Error("Failed to fetch options");
      const data = await response.json();
      setOptions(data);
    } catch (error) {
      console.error("Error fetching options:", error);
      toast({
        title: "Error",
        description: "Failed to fetch options. Please try again.",
      });
    }
  };

  const fetchConnectedOptions = async (segmentId: number) => {
    try {
      const response = await fetch(
        `/api/Segment/GetConnectedOptions?tripId=${tripId}&segmentId=${segmentId}`
      );
      if (!response.ok) throw new Error("Failed to fetch connected options");
      const data: Option[] = await response.json();
      const ids = data.map((o) => Number(o.id));

      if (!optionsTouched) {
        setSelectedOptions(ids);
      } else {
        console.log("[fetchConnectedOptions] skipped setSelectedOptions (user already touched)");
      }
    } catch (error) {
      console.error("Error fetching connected options:", error);
      toast({
        title: "Error",
        description: "Failed to fetch connected options. Please try again.",
      });
    }
  };

  // Checked-aware change (true only means checked)
  const handleOptionChange = (optionId: number, checkedState: boolean | "indeterminate") => {
    const checked = checkedState === true;
    setOptionsTouched(true);

    setSelectedOptions((prev) => {
      let next: number[];
      if (checked) {
        next = prev.includes(optionId) ? prev : [...prev, optionId];
      } else {
        next = prev.includes(optionId) ? prev.filter((id) => id !== optionId) : prev;
      }
      return next;
    });
  };

  // Accept explicit array to avoid stale reads
  const handleUpdateConnectedOptions = async (optionIds: number[]) => {
    if (!segment) return;

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
      });
      if (!response.ok) throw new Error("Failed to update connected options");

      toast({ title: "Success", description: "Connected options updated successfully" });
    } catch (error) {
      console.error("Error updating connected options:", error);
      toast({ title: "Error", description: "Failed to update connected options. Please try again." });
    }
  };

  const handleDuplicateSegment = () => {
    setName((n) => `DUPLICATE ${n}`);
    setIsDuplicateMode(true);
    setSelectedOptions([]);
    setPrefilledStart(null);
    setPrefilledEnd(null);
    setLocRange({ start: null, end: null });
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (segmentTypeId === null) {
        toast({ title: "Error", description: "Please select a segment type." });
        return;
      }

      if (!range.startLocal) {
        toast({ title: "Error", description: "Please choose a start date and time." });
        return;
      }

      const startUtcMs = localToUtcMs(range.startLocal, range.startOffsetH);
      if (!Number.isFinite(startUtcMs)) {
        toast({ title: "Error", description: "Invalid start date/time." });
        return;
      }
      const startIso = utcMsToIso(startUtcMs);

      const effEndOffset = range.endOffsetH ?? range.startOffsetH;
      const endLocalUsed = range.endLocal ?? range.startLocal;
      const endUtcMs = localToUtcMs(endLocalUsed, effEndOffset);
      if (!Number.isFinite(endUtcMs)) {
        toast({ title: "Error", description: "Invalid end date/time." });
        return;
      }

      if (endUtcMs < startUtcMs) {
        toast({ title: "Error", description: "End must be at or after start." });
        return;
      }

      const endIso = utcMsToIso(endUtcMs);

      const startForSave = locRange.start;
      if (startForSave !== null) {
        startForSave.id = prefilledStart?.id;
      }
      const endForSave = locRange.end;
      if (endForSave !== null) {
        endForSave.id = prefilledEnd?.id;
      }

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
      };

      const isUpdate = !!segment && !isDuplicateMode;

      const optionIds = selectedOptions.map(Number);

      try {
        if (isUpdate && segment) {
          await handleUpdateConnectedOptions(optionIds);
        }
        await onSave(payload, isUpdate, segment?.id);
      } catch (err) {
        console.error("Save flow failed:", err);
        toast({ title: "Error", description: "Failed to save segment." });
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
    ]
  );

  const isCreateMode = !segment || isDuplicateMode;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] w-[95vw] p-0">
        <DialogHeader className="px-4 pt-4 pb-4">
          <DialogTitle>{isCreateMode ? "Create Segment" : "Edit Segment"}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="max-h-[85vh] overflow-y-auto px-4 pt-2 pb-[calc(env(safe-area-inset-bottom,0)+88px)] space-y-3"
        >
          {/* Name */}
          <div className="grid grid-cols-4 items-center gap-3">
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
                        <div
                          dangerouslySetInnerHTML={{ __html: type.iconSvg }}
                          className="w-4 h-4 mr-2"
                        />
                      ) : null}
                      {type.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* When */}
          <RangeDateTimePicker
            id="segment-when"
            label="When"
            value={range}
            onChange={setRange}
            allowDifferentOffsets
            compact
          />

          {/* Where */}
          <RangeLocationPicker
            id="segment-where"
            label="Locations"
            value={locRange}
            onChange={setLocRange}
            compact
          />

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

          {/* Comment */}
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
                className="min-h-[80px] text-sm"
              />
              {comment && (
                <div className="p-2 bg-muted rounded-md text-sm">
                  <div className="text-xs text-muted-foreground mb-1">Preview:</div>
                  <CommentDisplay text={comment} />
                </div>
              )}
            </div>
          </div>

          {/* Options (edit only) */}
          {segment && !isDuplicateMode && (
            <div className="grid grid-cols-4 items-start gap-3">
              <Label className="text-right pt-2 text-sm">Options</Label>
              <ScrollArea className="h-[150px] col-span-3 border rounded-md p-3">
                {options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2 mb-2">
                    <Checkbox
                      id={`option-${option.id}`}
                      checked={selectedOptions.includes(Number(option.id))}
                      onCheckedChange={(checked) => handleOptionChange(Number(option.id), checked)}
                    />
                    <Label htmlFor={`option-${option.id}`} className="text-sm">
                      {option.name}
                    </Label>
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}

          {/* Sticky footer */}
          <DialogFooter className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t px-4 py-3">
            <div className="flex justify-between w-full">
              <div>
                {segment && !isDuplicateMode && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDuplicateSegment}
                    title="Duplicate"
                  >
                    <CopyIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button type="submit" size="sm">
                {isCreateMode ? "Create" : "Save"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
